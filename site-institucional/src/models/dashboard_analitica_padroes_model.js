var database = require('../database/config');
var s3 = require('../services/dashboard_analitica_padroes_s3');

function buscarAcesso(idUsuario, idEmpresa) {
    return database.executar(`
        SELECT u.idUsuario, u.fkEmpresa, na.nome AS nomeNivelAcesso,
            GROUP_CONCAT(DISTINCT p.nome SEPARATOR ',') AS permissoes
        FROM usuario u
        JOIN nivel_acesso na ON na.fk_usuario = u.idUsuario
        LEFT JOIN permissoes_acesso pa ON pa.fkNivelAcesso = na.idnivel_acesso
        LEFT JOIN permissao p ON p.idPermissao = pa.fkPermissao
        WHERE u.idUsuario = ? AND u.fkEmpresa = ?
        GROUP BY u.idUsuario, u.fkEmpresa, na.nome;
    `, [idUsuario, idEmpresa]);
}

function buscarServidores(idEmpresa) {
    return database.executar(`
        SELECT eq.idEquipamento, eq.nome,
            MAX(CASE WHEN UPPER(c.tipo) = 'CPU' THEN pa.limite_atencao END) AS cpuAtencao,
            MAX(CASE WHEN UPPER(c.tipo) = 'CPU' THEN pa.limite_critico END) AS cpuCritico,
            MAX(CASE WHEN UPPER(c.tipo) = 'RAM' THEN pa.limite_atencao END) AS ramAtencao,
            MAX(CASE WHEN UPPER(c.tipo) = 'RAM' THEN pa.limite_critico END) AS ramCritico,
            MAX(CASE WHEN UPPER(c.tipo) IN ('ARMAZENAMENTO', 'DISCO') THEN pa.limite_atencao END) AS discoAtencao,
            MAX(CASE WHEN UPPER(c.tipo) IN ('ARMAZENAMENTO', 'DISCO') THEN pa.limite_critico END) AS discoCritico,
            MAX(CASE WHEN UPPER(c.tipo) = 'REDE' THEN pa.limite_atencao END) AS redeAtencao,
            MAX(CASE WHEN UPPER(c.tipo) = 'REDE' THEN pa.limite_critico END) AS redeCritico
        FROM equipamento eq
        LEFT JOIN parametro_alerta pa ON pa.fkEquipamento = eq.idEquipamento AND pa.ativo = 1
            AND pa.unidade = '%'
        LEFT JOIN componente c ON c.idComponente = pa.fkComponente
        WHERE eq.fkEmpresa = ? AND eq.tipo = 'Servidor'
        GROUP BY eq.idEquipamento, eq.nome
        ORDER BY eq.idEquipamento;
    `, [idEmpresa]);
}

function criarErro(status, mensagem) {
    var erro = new Error(mensagem);
    erro.status = status;
    return erro;
}

async function lerArquivo(partes) {
    var pastaLocal = process.env.DIRETORIO_GOLD_LOCAL;
    if (!pastaLocal) {
        var prefixo = (process.env.S3_PREFIX_GOLD || 'gold/').replace(/^\/+|\/+$/g, '');
        var pasta = (prefixo ? prefixo + '/' : '') + partes.join('/') + '/';
        return s3.lerDashboardMaisRecente(pasta);
    }

    // A pasta local representa a raiz da Gold e deve ficar fora de public.
    var path = require('path');
    var pastaEquipamento = path.resolve(pastaLocal, ...partes);
    var fs = require('fs/promises');
    var conteudo;
    try {
        var entradas = await fs.readdir(pastaEquipamento, { withFileTypes: true });
        var ultimo = null;
        for (var i = 0; i < entradas.length; i++) {
            var entrada = entradas[i];
            if (!entrada.isFile() ||
                !/^dashboard_\d{4}[-_]\d{2}[-_]\d{2}_\d{2}-\d{2}-\d{2}\.json$/.test(entrada.name)) continue;
            var infoArquivo = await fs.stat(path.join(pastaEquipamento, entrada.name));
            if (!ultimo || infoArquivo.mtimeMs > ultimo.modificado ||
                (infoArquivo.mtimeMs === ultimo.modificado && entrada.name > ultimo.nome)) {
                ultimo = { nome: entrada.name, modificado: infoArquivo.mtimeMs };
            }
        }
        var caminho = path.join(pastaEquipamento, ultimo ? ultimo.nome : 'dashboard.json');
        var info = await fs.stat(caminho);
        if (info.size > 25 * 1024 * 1024) {
            throw criarErro(503, 'Gold acima de 25 MB.');
        }
        conteudo = await fs.readFile(caminho, 'utf8');
    } catch (erro) {
        if (erro.code === 'ENOENT') return null;
        throw criarErro(503, 'Não foi possível ler a Gold local. Confira a pasta, o tamanho e as permissões.');
    }
    try { return JSON.parse(conteudo); }
    catch (erro) { throw criarErro(502, 'A Gold local não contém JSON válido.'); }
}

async function lerGold(idEmpresa) {
    if (!/^\d+$/.test(String(idEmpresa))) throw criarErro(403, 'Empresa inválida.');

    // Nome da pasta vem do banco, assim como no login usado pela captura.
    var empresas = await database.executar(
        'SELECT nome FROM empresa WHERE idEmpresa = ?;', [idEmpresa]
    );
    if (!empresas.length) throw criarErro(403, 'Empresa não encontrada.');
    var nomeEmpresa = empresas[0].nome;
    if (typeof nomeEmpresa !== 'string' || !nomeEmpresa.trim() ||
        nomeEmpresa === '.' || nomeEmpresa === '..' || /[\\/\x00]/.test(nomeEmpresa)) {
        throw criarErro(503, 'Nome da empresa incompatível com a pasta da Gold.');
    }

    // Não aceita uma lista de equipamentos fornecida pelo navegador.
    var cadastrados = await buscarServidores(idEmpresa);
    var gold = { empresa_id: idEmpresa, gerado_em: null, amostras: [] };
    var tamanhoTotal = 0;
    for (var i = 0; i < cadastrados.length; i++) {
        var id = String(cadastrados[i].idEquipamento);
        if (!/^\d+$/.test(id)) throw criarErro(502, 'Equipamento inválido no cadastro.');
        var arquivo = await lerArquivo([nomeEmpresa, id]);
        if (arquivo === null) continue; // Equipamento ainda sem Gold.

        if (String(arquivo.empresa_id) !== String(idEmpresa) || !Array.isArray(arquivo.amostras)) {
            throw criarErro(502, 'Gold inválida ou de outra empresa. Gere novamente pelo ETL.');
        }
        tamanhoTotal += Buffer.byteLength(JSON.stringify(arquivo), 'utf8');
        if (tamanhoTotal > 25 * 1024 * 1024) {
            throw criarErro(503, 'As Golds da empresa ultrapassam 25 MB. Reduza a janela publicada pelo ETL.');
        }
        for (var j = 0; j < arquivo.amostras.length; j++) {
            var amostra = arquivo.amostras[j];
            if (!amostra || String(amostra.servidor_id) !== id) {
                throw criarErro(502, 'Gold contém amostra de outro equipamento.');
            }
            gold.amostras.push(amostra);
        }
        if (Number.isFinite(Date.parse(arquivo.gerado_em)) &&
            (!gold.gerado_em || Date.parse(arquivo.gerado_em) > Date.parse(gold.gerado_em))) {
            gold.gerado_em = arquivo.gerado_em;
        }
    }
    return gold;
}

module.exports = { buscarAcesso: buscarAcesso, buscarServidores: buscarServidores, lerGold: lerGold };