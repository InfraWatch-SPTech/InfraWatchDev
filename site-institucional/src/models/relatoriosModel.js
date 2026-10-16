let database = require("../database/config");

function cadastrarRelatorio(titulo, descricao, dataRel, idEquipamento) {
    let instrucaoSql = `
        INSERT INTO relatorio (
            titulo,
            descricao,
            data_rel,
            equipamento_idEquipamento
        )
        VALUES (
            '${titulo}',
            '${descricao}',
            '${dataRel}',
            ${idEquipamento}
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
            r.data_rel,
            r.equipamento_idEquipamento,
            e.nome AS nomeEquipamento
        FROM relatorio r
        INNER JOIN equipamento e
            ON r.equipamento_idEquipamento = e.idEquipamento
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
            r.data_rel,
            r.equipamento_idEquipamento,
            e.nome AS nomeEquipamento
        FROM relatorio r
        INNER JOIN equipamento e
            ON r.equipamento_idEquipamento = e.idEquipamento
        WHERE r.idRelatorio = ${idRelatorio};
    `;

    return database.executar(instrucaoSql);
}

function atualizarRelatorio(
    idRelatorio,
    titulo,
    descricao,
    dataRel,
    idEquipamento
) {
    let instrucaoSql = `
        UPDATE relatorio
        SET titulo = '${titulo}',
            descricao = '${descricao}',
            data_rel = '${dataRel}',
            equipamento_idEquipamento = ${idEquipamento}
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