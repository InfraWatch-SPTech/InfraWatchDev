//acesso com o s3 para buscar o arquivo dash-previsibilidade mais recente do servidor solicitado, caso exista. Caso não exista, retorna 404 com mensagem informando que ainda não há arquivo dash-previsibilidade no Gold para este servidor.
const {
    GetObjectCommand,
    ListObjectsV2Command,
    S3Client
} = require("@aws-sdk/client-s3");

let clienteS3;

function obterClienteS3() {
    if (clienteS3) {
        return clienteS3;
    }

    var regiao = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
    if (!regiao) {
        var erroRegiao = new Error("AWS_REGION não está configurada no .env.dev.");
        erroRegiao.code = "S3_CONFIG_MISSING";
        throw erroRegiao;
    }

    var accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACESS_KEY_ID;
    var secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY;
    var sessionToken = process.env.AWS_SESSION_TOKEN;
    var config = { region: regiao };

    if (accessKeyId && secretAccessKey) {
        config.credentials = {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey
        };

        if (sessionToken) {
            config.credentials.sessionToken = sessionToken;
        }
    } else if (accessKeyId || secretAccessKey) {
        var erroCredenciais = new Error("Configure AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY juntos no .env.dev.");
        erroCredenciais.code = "S3_CONFIG_MISSING";
        throw erroCredenciais;
    }

    clienteS3 = new S3Client(config);
    return clienteS3;
}

function obterBucket() {
    return process.env.AWS_S3_BUCKET || "infrawatch-server-s3";
}

async function transformarBodyParaTexto(body) {
    var partes = [];
    for await (const parte of body) {
        partes.push(Buffer.from(parte));
    }
    return Buffer.concat(partes).toString("utf-8");
}

async function buscarArquivoMaisRecente(empresa, idEquipamento) {
    var s3 = obterClienteS3();
    var bucket = obterBucket();
    var prefixo = `gold/${empresa}/${idEquipamento}/dash-previsibilidade_`;
    var token;
    var arquivos = [];

    do {
        var pagina = await s3.send(new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefixo,
            ContinuationToken: token
        }));

        (pagina.Contents || []).forEach(function (objeto) {
            if (objeto.Key && objeto.Key.endsWith(".json")) {
                arquivos.push(objeto);
            }
        });

        token = pagina.IsTruncated ? pagina.NextContinuationToken : undefined;
    } while (token);

    if (arquivos.length === 0) {
        return null;
    }

    arquivos.sort(function (a, b) {
        return new Date(b.LastModified || 0).getTime() - new Date(a.LastModified || 0).getTime();
    });

    var arquivo = arquivos[0];
    var objeto = await s3.send(new GetObjectCommand({
        Bucket: bucket,
        Key: arquivo.Key
    }));
    var conteudo = await transformarBodyParaTexto(objeto.Body);

    return {
        arquivo: arquivo.Key,
        atualizadoEm: arquivo.LastModified || null,
        dashboard: JSON.parse(conteudo)
    };
}

module.exports = {
    buscarArquivoMaisRecente
};
