// Somente o backend acessa a AWS.
var aws = require('@aws-sdk/client-s3');
var LIMITE_BYTES = 25 * 1024 * 1024;
var cliente = new aws.S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

function criarErro(mensagem, status) {
    var erro = new Error(mensagem);
    erro.status = status;
    return erro;
}

async function lerJson(chave) {
    var bucket = process.env.S3_BUCKET_GOLD;
    if (!bucket) throw criarErro('Configure S3_BUCKET_GOLD no backend.', 503);

    var resposta;
    try {
        resposta = await cliente.send(new aws.GetObjectCommand({ Bucket: bucket, Key: chave }));
    } catch (erro) {
        if (erro.name === 'NoSuchKey') {
            throw criarErro('A Gold deste equipamento ainda não foi gerada.', 404);
        }
        console.error('Falha ao ler a Gold no S3:', erro.name);
        throw criarErro('Não foi possível acessar a Gold. Confira região, credenciais e permissões IAM.', 503);
    }

    if (resposta.ContentLength > LIMITE_BYTES) {
        throw criarErro('Gold acima de 25 MB. Reduza a janela de publicação do ETL.', 503);
    }

    var texto;
    try {
        texto = await resposta.Body.transformToString();
    } catch (erro) {
        throw criarErro('Não foi possível baixar a Gold do S3.', 503);
    }
    if (Buffer.byteLength(texto, 'utf8') > LIMITE_BYTES) {
        throw criarErro('Gold acima de 25 MB.', 503);
    }
    try { return JSON.parse(texto); }
    catch (erro) { throw criarErro('O arquivo Gold não contém um JSON válido.', 502); }
}

async function lerDashboardMaisRecente(prefixo) {
    var bucket = process.env.S3_BUCKET_GOLD;
    if (!bucket) throw criarErro('Configure S3_BUCKET_GOLD no backend.', 503);
    if (!prefixo.endsWith('/')) prefixo += '/';

    var ultimo = null;
    var token;
    do {
        var resposta;
        try {
            resposta = await cliente.send(new aws.ListObjectsV2Command({
                Bucket: bucket,
                Prefix: prefixo,
                ContinuationToken: token
            }));
        } catch (erro) {
            console.error('Falha ao listar a Gold no S3:', erro.name);
            throw criarErro('Não foi possível listar a Gold. Confira credenciais e a permissão s3:ListBucket.', 503);
        }

        var objetos = resposta.Contents || [];
        for (var i = 0; i < objetos.length; i++) {
            var objeto = objetos[i];
            if (!objeto.Key || !objeto.Key.startsWith(prefixo)) continue;
            var nome = objeto.Key.slice(prefixo.length);
            // Aceita os dois formatos de data, mas não arquivos de outras dashboards ou subpastas.
            if (!/^dashboard_\d{4}[-_]\d{2}[-_]\d{2}_\d{2}-\d{2}-\d{2}\.json$/.test(nome)) continue;
            var modificado = new Date(objeto.LastModified).getTime();
            if (!Number.isFinite(modificado)) continue;
            if (!ultimo || modificado > ultimo.modificado ||
                (modificado === ultimo.modificado && objeto.Key > ultimo.chave)) {
                ultimo = { chave: objeto.Key, modificado: modificado };
            }
        }
        token = resposta.IsTruncated ? resposta.NextContinuationToken : undefined;
        if (resposta.IsTruncated && !token) {
            throw criarErro('A listagem da Gold retornou paginação incompleta.', 503);
        }
    } while (token);

    // Compatibilidade com a Gold antiga, somente se não existir nenhum arquivo com data.
    var chave = ultimo ? ultimo.chave : prefixo + 'dashboard.json';
    try { return await lerJson(chave); }
    catch (erro) {
        if (erro.status === 404) return null;
        throw erro;
    }
}

module.exports = {
    lerJson: lerJson,
    lerDashboardMaisRecente: lerDashboardMaisRecente
};