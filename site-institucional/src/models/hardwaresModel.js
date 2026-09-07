var database = require("../database/config")

function buscarEquipamentosEmpresa(idEmpresa) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n buscarEquipamentosEmpresa(idEmpresa)", idEmpresa)

    var instrucaoSql = 
    `
        SELECT
            cp.nome AS nomeComponente,
            cp.tipo AS tipoComponente,
            cp.descricao AS descricaoComponente,
            eq.idEquipamento AS idEquipamento,
            eq.nome AS nomeEquipamento,
            eq.tipo AS tipoEquipamento,
            eq.ip AS ipEquipamento,
            eq.status AS statusEquipamento
        FROM componente AS cp
            JOIN equipamento AS eq
                ON cp.fkEquipamento = eq.idEquipamento
            JOIN empresa AS em
                ON eq.fkEmpresa = em.idEmpresa
        WHERE eq.fkEmpresa = ${idEmpresa}
        ORDER BY eq.idEquipamento;
        
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    buscarEquipamentosEmpresa
};