let database = require("../database/config");

function cadastrarRelatorio(titulo, descricao, dataRel) {

    console.log("ACESSEI O RELATORIO MODEL");
    console.log("cadastrarRelatorio(): ", titulo, descricao, dataRel);

    let instrucaoSql = `
        INSERT INTO relatorio (titulo, descricao, data_rel)
        VALUES ('${titulo}', '${descricao}', '${dataRel}');
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);

    return database.executar(instrucaoSql);
}

function buscarRelatorios() {

    let instrucaoSql = `
        SELECT
            idRelatorio,
            titulo,
            descricao,
            data_rel
        FROM relatorio
        ORDER BY data_rel DESC;
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);

    return database.executar(instrucaoSql);
}

function buscarRelatorioPorId(idRelatorio) {

    let instrucaoSql = `
        SELECT
            idRelatorio,
            titulo,
            descricao,
            data_rel
        FROM relatorio
        WHERE idRelatorio = ${idRelatorio};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);

    return database.executar(instrucaoSql);
}

function atualizarRelatorio(idRelatorio, titulo, descricao, dataRel) {

    let instrucaoSql = `
        UPDATE relatorio
        SET titulo = '${titulo}',
            descricao = '${descricao}',
            data_rel = '${dataRel}'
        WHERE idRelatorio = ${idRelatorio};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);

    return database.executar(instrucaoSql);
}

function deletarRelatorio(idRelatorio) {

    let instrucaoSql = `
        DELETE FROM relatorio
        WHERE idRelatorio = ${idRelatorio};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);

    return database.executar(instrucaoSql);
}

module.exports = {
    cadastrarRelatorio,
    buscarRelatorios,
    buscarRelatorioPorId,
    atualizarRelatorio,
    deletarRelatorio
};