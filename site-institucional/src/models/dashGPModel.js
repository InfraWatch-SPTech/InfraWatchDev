let database = require("../database/config");

function buscarEquipeServidores(idEmpresa) {
    let instrucaoSql = `
        SELECT 
            equipa.idEquipamento AS id, 
            equipa.nome AS nome, 
            equipa.valorDowntime AS valorDowntime, 
            equipe.nome AS equipe 
        FROM empresa AS e 
        JOIN equipamento AS equipa ON equipa.fkEmpresa = e.idEmpresa 
        JOIN usuario_equipamento AS ue ON ue.fkEquipamento = equipa.idEquipamento 
        JOIN equipe ON equipe.idEquipe = ue.fkEquipe 
        WHERE e.idEmpresa = ${idEmpresa} 
        ORDER BY equipa.idEquipamento;
    `;

    return database.executar(instrucaoSql);
}

module.exports = {
    buscarEquipeServidores
};