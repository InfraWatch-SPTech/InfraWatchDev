let database = require("../database/config");

function cadastrarRelatorio(titulo, descricao, dataRel) {
    let instrucaoSql = `
        INSERT INTO relatorio (
            titulo,
            descricao,
            data_rel
        )
        VALUES (
            '${titulo}',
            '${descricao}',
            '${dataRel}'
        );
    `;

    return database.executar(instrucaoSql);
}

function buscarRelatorios() {
    let instrucaoSql = `
        SELECT
            r.idRelatorio,
            r.titulo,
            r.descricao,
            r.data_rel
        FROM relatorio r
        ORDER BY r.data_rel DESC;
    `;

    return database.executar(instrucaoSql);
}

function buscarRelatorioPorId(idRelatorio) {
    let instrucaoSql = `
        SELECT
            r.idRelatorio,
            r.titulo,
            r.descricao,
            r.data_rel
        FROM relatorio r
        WHERE r.idRelatorio = ${idRelatorio};
    `;

    return database.executar(instrucaoSql);
}

function atualizarRelatorio(
    idRelatorio,
    titulo,
    descricao,
    dataRel
) {
    let instrucaoSql = `
        UPDATE relatorio
        SET titulo = '${titulo}',
            descricao = '${descricao}',
            data_rel = '${dataRel}',
        WHERE idRelatorio = ${idRelatorio};
    `;

    return database.executar(instrucaoSql);
}

function deletarRelatorio(idRelatorio) {
    let instrucaoSql = `
        DELETE FROM relatorio
        WHERE idRelatorio = ${idRelatorio};
    `;

    return database.executar(instrucaoSql);
}

module.exports = {
    cadastrarRelatorio,
    buscarRelatorios,
    buscarRelatorioPorId,
    atualizarRelatorio,
    deletarRelatorio
};