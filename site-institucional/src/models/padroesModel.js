const database = require('../database/config');
const {
    S3Client,
    GetObjectCommand,
    paginateListObjectsV2
} = require('@aws-sdk/client-s3');

const s3 = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1'
});

const formatoArquivo = /^dash-padroes_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json$/;

async function buscarEmpresaAutorizada(idUsuario, idEmpresa) {
    const sql = `
        SELECT DISTINCT
            e.idEmpresa,
            e.nome
        FROM usuario u
        JOIN empresa e
            ON e.idEmpresa = u.fkEmpresa
        JOIN nivel_acesso na
            ON na.fk_usuario = u.idUsuario
        LEFT JOIN permissoes_acesso pa
            ON pa.fkNivelAcesso = na.idnivel_acesso
        LEFT JOIN permissao p
            ON p.idPermissao = pa.fkPermissao
        WHERE u.idUsuario = ?
          AND e.idEmpresa = ?
          AND (
              na.nome = 'Root'
              OR p.nome IN (
                  'DASHBOARD_PADROES_VISUALIZAR',
                  'DASHBOARD_SERVIDOR_VISUALIZAR',
                  'DASHBOARD_GERAL_VISUALIZAR'
              )
          )
    `;

    const empresas = await database.executar(sql, [idUsuario, idEmpresa]);
    return empresas[0] || null;
}

function criarErro(status, mensagem) {
    const erro = new Error(mensagem);
    erro.status = status;
    return erro;
}

async function buscarDadosPadroes(nomeEmpresa) {
    const bucket = process.env.S3_BUCKET_GOLD;

    if (!bucket) {
        throw criarErro(503, 'Configure S3_BUCKET_GOLD no backend do site.');
    }

    if (
        typeof nomeEmpresa !== 'string' ||
        !nomeEmpresa.trim() ||
        /[\\/]/.test(nomeEmpresa) ||
        nomeEmpresa === '.' ||
        nomeEmpresa === '..'
    ) {
        throw criarErro(422, 'Nome de empresa inválido para consultar o Gold.');
    }

    const prefixoGold = (process.env.S3_PREFIX_GOLD || 'gold')
        .replace(/^\/+|\/+$/g, '');

    const pastaEmpresa = `${prefixoGold}/${nomeEmpresa}/`;
    let chaveMaisRecente = null;

    try {
        const paginas = paginateListObjectsV2(
            { client: s3 },
            {
                Bucket: bucket,
                Prefix: `${pastaEmpresa}dash-padroes_`
            }
        );

        for await (const pagina of paginas) {
            for (const objeto of pagina.Contents || []) {
                const chave = objeto.Key;
                const nomeArquivo = chave.slice(pastaEmpresa.length);

                if (!formatoArquivo.test(nomeArquivo)) continue;

                if (chaveMaisRecente === null || chave > chaveMaisRecente) {
                    chaveMaisRecente = chave;
                }
            }
        }
    } catch (erro) {
        console.error('Erro ao listar arquivos de padrões no S3:', erro.name);
        throw criarErro(503, 'Não foi possível listar os arquivos da dashboard.');
    }

    if (!chaveMaisRecente) {
        throw criarErro(404, 'A ETL ainda não gerou o arquivo de padrões desta empresa.');
    }

    let conteudo;

    try {
        const resposta = await s3.send(new GetObjectCommand({
            Bucket: bucket,
            Key: chaveMaisRecente
        }));

        conteudo = await resposta.Body.transformToString('utf-8');
    } catch (erro) {
        console.error('Erro ao ler o arquivo de padrões no S3:', erro.name);
        throw criarErro(503, 'Não foi possível ler o arquivo da dashboard.');
    }

    let dados;

    try {
        dados = JSON.parse(conteudo);
    } catch {
        throw criarErro(502, 'O arquivo Gold contém um JSON inválido.');
    }

    if (
        dados?.versao !== 2 ||
        dados.empresa !== nomeEmpresa ||
        !dados.mapa_calor?.kpis ||
        !Array.isArray(dados.mapa_calor.contagens) ||
        !Array.isArray(dados.mapa_calor.media_semanal) ||
        !Array.isArray(dados.previsibilidade?.eventos)
    ) {
        throw criarErro(502, 'O arquivo Gold não corresponde ao formato da dashboard de padrões.');
    }

    return dados;
}

module.exports = {
    buscarEmpresaAutorizada,
    buscarDadosPadroes
};