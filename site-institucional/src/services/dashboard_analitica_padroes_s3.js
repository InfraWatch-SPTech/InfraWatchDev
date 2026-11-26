// Somente o backend acessa a AWS. Nunca inclua estas configurações no frontend.
// O SDK lê sozinho AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY e AWS_SESSION_TOKEN do .env
// (ou usa a role IAM da máquina, se não houver chaves).
var S3Client = require('@aws-sdk/client-s3').S3Client;
var GetObjectCommand = require('@aws-sdk/client-s3').GetObjectCommand;

var LIMITE_BYTES = 25 * 1024 * 1024; // 25 MB
var cliente = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

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
        resposta = await cliente.send(new GetObjectCommand({ Bucket: bucket, Key: chave }));
    } catch (erro) {
        if (erro.name === 'NoSuchKey') throw criarErro('A Gold desta empresa ainda não foi gerada. Execute o ETL.', 404);
        console.error('Falha ao ler a Gold no S3:', erro.name);
        throw criarErro('Não foi possível acessar a Gold. Confira região, credenciais e permissões IAM.', 503);
    }

    if (resposta.ContentLength > LIMITE_BYTES) {
        throw criarErro('Gold acima de 25 MB. Reduza a janela de publicação do ETL.', 503);
    }

    try {
        var texto = await resposta.Body.transformToString();
        return JSON.parse(texto);
    } catch (erro) {
        throw criarErro('O arquivo Gold não contém um JSON válido.', 502);
    }
}

module.exports = { lerJson: lerJson };