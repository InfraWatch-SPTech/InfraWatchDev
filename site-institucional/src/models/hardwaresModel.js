var database = require("../database/config")

function buscarEquipamentosEmpresa(idEmpresa) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n buscarEquipamentosEmpresa(idEmpresa)", idEmpresa)

    let instrucaoSql = 
    `
        SELECT
            cp.nome AS nomeComponente,
            cp.tipo AS tipoComponente,
            cp.descricao AS descricaoComponente,
            eq.idEquipamento AS idEquipamento,
            eq.nome AS nomeEquipamento,
            eq.tipo AS tipoEquipamento,
            eq.ip AS ipEquipamento,
            eq.status AS statusEquipamento,
            eq.localizacao AS localizacao,
            eq.fkEmpresa AS idEmpresa
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

function cadastrarEquipamento(nome, tipo, localizacao, descricao, fkEmpresa) {
    console.log("ACESSEI O HARDWARES MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n cadastrarEquipamento(): ", nome, tipo, localizacao, fkEmpresa);

    let instrucaoSql =
    `
        INSERT INTO equipamento (nome, tipo, status, localizacao, descricao, fkEmpresa)
        VALUES ('${nome}', '${tipo}', 'Ativo', '${localizacao}', '${descricao}', ${fkEmpresa});
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function cadastrarComponentes(componentes, idEquipamento) {
    console.log("ACESSEI O HARDWARES MODEL \n\n cadastrarComponentes(): ", componentes, idEquipamento);

    let listaValores = [];
    for (let i = 0; i < componentes.length; i++) {
        let componente = componentes[i];
        listaValores.push(`('${componente.nome}', '${componente.tipo}', '${componente.descricao}', ${idEquipamento})`);
    }
    let valores = listaValores.join(", ");

    let instrucaoSql =
    `
        INSERT INTO componente (nome, tipo, descricao, fkEquipamento)
        VALUES ${valores};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function buscarEquipamentoPorId(idEquipamento) {
    console.log("ACESSEI O HARDWARES MODEL \n\n buscarEquipamentoPorId(idEquipamento)", idEquipamento);

    let instrucaoSql =
    `
        SELECT
            cp.idComponente AS idComponente,
            cp.nome AS nomeComponente,
            cp.tipo AS tipoComponente,
            cp.descricao AS descricaoComponente,
            eq.idEquipamento AS idEquipamento,
            eq.nome AS nomeEquipamento,
            eq.tipo AS tipoEquipamento,
            eq.status AS statusEquipamento,
            eq.localizacao AS localizacao,
            eq.descricao AS descricaoEquipamento,
            eq.fkEmpresa AS idEmpresa
        FROM equipamento AS eq
            LEFT JOIN componente AS cp
                ON cp.fkEquipamento = eq.idEquipamento
        WHERE eq.idEquipamento = ${idEquipamento};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function atualizarEquipamento(idEquipamento, nome, tipo, localizacao, descricao) {
    console.log("ACESSEI O HARDWARES MODEL \n\n atualizarEquipamento(): ", idEquipamento, nome, tipo, localizacao, descricao);

    let instrucaoSql =
    `
        UPDATE equipamento
        SET nome = '${nome}',
            tipo = '${tipo}',
            localizacao = '${localizacao}',
            descricao = '${descricao}'
        WHERE idEquipamento = ${idEquipamento};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function deletarComponentesPorEquipamento(idEquipamento) {
    console.log("ACESSEI O HARDWARES MODEL \n\n deletarComponentesPorEquipamento(idEquipamento)", idEquipamento);

    let instrucaoSql =
    `
        DELETE FROM componente WHERE fkEquipamento = ${idEquipamento};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function deletarEquipamento(idEmpresa, idEquipamento) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n buscarEquipamentosEmpresa(idEmpresa)", idEmpresa)

    let instrucaoSql = 
    `
        DELETE FROM equipamento WHERE idEquipamento = ${idEquipamento};
        
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    buscarEquipamentosEmpresa,
    buscarEquipamentoPorId,
    cadastrarEquipamento,
    cadastrarComponentes,
    atualizarEquipamento,
    deletarComponentesPorEquipamento,
    deletarEquipamento
};