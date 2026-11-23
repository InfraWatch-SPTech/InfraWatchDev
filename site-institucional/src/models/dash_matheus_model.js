var database = require('../database/config');
var s3 = require('../services/s3');

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
            MAX (CASE WHEN UPPER(c.tipo) IN ('ARMAZENAMENTO', 'DISCO') THEN pa.limite_atencao END) AS discoAtencao,
            MAX (CASE WHEN UPPER(c.tipo) IN ('ARMAZENAMENTO', 'DISCO') THEN pa.limite_critico END) AS discoCritico
            MAX(CASE WHEN UPPER(c.tipo) = 'REDE' THEN pa.limite_atencao END) AS redeAtencao,
            MAX(CASE WHEN UPPER(c.tipo) = 'REDE' THEN pa.limite_critico END) AS redeCritico
        FROM equipamento eq
        LEFT JOIN parametro_alerta pa ON pa.fkEquipamento = eq.idEquipamento AND pa.ativo = 1 AND pa.unidade = '%'
        LEFT JOIN componente c ON c.idComponente = pa.fkComponente
        WHERE eq.fkEmpresa = ? AND eq.tipo = 'Servidor'
        GROUP BY eq.idEquipamento, eq.nome
        ORDER BY eq.idEquipamento;
        `, [idEmpresa]);
}

async function lerGold(idEmpresa) {
    if(!/^\d+$/.test(idEmpresa)) { throw new Error('Empresa Inválida'); }
    var pastaLocal = process.env.DIRETORIO_GOLD_LOCAL;
    if (pastaLocal) {
        // Pasta privada gerada pelo leitura.py, nunca dentro de public.
        var caminho = require('path').resolve(pastaLocal, 'empresas', String(idEmpresa), 'dashboard.json');
        var conteudo;
        try {
            var fs = require('fs/promises');
            var info = await fs.stat(caminho);
            if (info.size > 25 * 1024 * 1024) throw new Error('Gold acima de 25 MB.');
            conteudo = await fs.readFile(caminho, 'utf8');
        } catch (erro) {
            if (erro.code === 'ENOENT') return null;
            erro.status = 503;
            erro.message = 'Não foi possível ler a Gold local. Confira DIRETORIO_GOLD_LOCAL e as permissões da pasta.';
            throw erro;
        }
        try { return JSON.parse(conteudo); }
        catch (erro) {
            erro.status = 502;
            erro.message = 'A Gold local não contém JSON válido. Execute novamente o leitura.py.';
            throw erro;
        }
    }
    var prefixo = (process.env.S3_PREFIX_GOLD || 'gold/').replace(/^\/+|\/+$/g, '');
    var chave = (prefixo ? prefixo + '/' : '') + 'empresas/' + idEmpresa + '/dashboard.json';
    try { return await s3.lerJson(chave); }
    catch (erro) {
        // Apenas ausência do objeto é tratada como falta de histórico.
        if (erro.status === 404) return null;
        throw erro;
    }
}

module.exports = {
    buscarAcesso: buscarAcesso,
    buscarServidores: buscarServidores,
    lerGold: lerGold
};


