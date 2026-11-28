let database = require("../database/config");

function buscarEquipeServidores(idEmpresa) {
    let instrucaoSql = `
        SELECT 
            equipa.idEquipamento AS id, 
            equipa.nome AS nome, 
            equipa.valorDowntime AS valorDowntime, 
            equipe.nome AS equipe 
        FROM empresa AS e 
        LEFT JOIN equipamento AS equipa ON equipa.fkEmpresa = e.idEmpresa 
        LEFT JOIN usuario_equipamento AS ue ON ue.fkEquipamento = equipa.idEquipamento 
        LEFT JOIN equipe ON equipe.idEquipe = ue.fkEquipe 
        WHERE e.idEmpresa = ${idEmpresa} 
        ORDER BY equipa.idEquipamento;
    `;

    return database.executar(instrucaoSql);
}

function buscarMtbfSemanal(idEmpresa) {
    let instrucaoSql = `
        SELECT mtbfMinSemana FROM empresa WHERE idEmpresa = ${idEmpresa};
    `;

    return database.executar(instrucaoSql);
}

function buscarMttr(idEmpresa) {
    let instrucaoSql = `
        SELECT 
            ROUND(AVG(TIMESTAMPDIFF(MINUTE, a.criado_em, a.resolvido_em)), 0) AS tempo_medio
        FROM alerta a
        JOIN equipamento e
        ON e.idEquipamento = a.fkEquipamento
        WHERE e.fkEmpresa = ${idEmpresa}
        AND a.resolvido_em IS NOT NULL;
    `;

    return database.executar(instrucaoSql);
}

function atualizarMtbf(idEmpresa, mtbf) {
    console.log("ACESSEI O AVISO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function publicar(): ", idEmpresa, mtbf);
    let instrucaoSql = `
        UPDATE empresa SET mtbfMinSemana = ${mtbf} WHERE idEmpresa = ${idEmpresa};
    `;

    return database.executar(instrucaoSql);
}

module.exports = {
    buscarEquipeServidores,
    buscarMtbfSemanal,
    atualizarMtbf,
    buscarMttr
};