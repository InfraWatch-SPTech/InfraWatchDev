var database = require("../database/config")

function buscarEquipamentosEmpresa(idEmpresa) {
    let instrucaoSql = `
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
            eq.descricao AS descricaoEquipamento,
            COALESCE(alertas.limiteCpu, 80) AS limiteCpu,
            COALESCE(alertas.limiteRam, 80) AS limiteRam,
            COALESCE(alertas.limiteDisco, 80) AS limiteDisco,
            eq.fkEmpresa AS idEmpresa
        FROM equipamento AS eq
            LEFT JOIN componente AS cp
                ON cp.fkEquipamento = eq.idEquipamento
            LEFT JOIN (
                SELECT
                    fkEquipamento,
                    MAX(CASE WHEN nomeMetrica = 'CPU' THEN valorLimite END) AS limiteCpu,
                    MAX(CASE WHEN nomeMetrica = 'RAM' THEN valorLimite END) AS limiteRam,
                    MAX(CASE WHEN nomeMetrica = 'DISCO' THEN valorLimite END) AS limiteDisco
                FROM configuracaoAlerta
                GROUP BY fkEquipamento
            ) AS alertas ON alertas.fkEquipamento = eq.idEquipamento
            JOIN empresa AS em ON eq.fkEmpresa = em.idEmpresa
        WHERE eq.fkEmpresa = ${idEmpresa}
        ORDER BY eq.idEquipamento;
    `;

    return database.executar(instrucaoSql);
}

function cadastrarEquipamento(nome, tipo, localizacao, descricao, fkEmpresa, limiteCpu, limiteRam, limiteDisco) {
    let instrucaoSql = `
        INSERT INTO equipamento (nome, tipo, status, localizacao, descricao, fkEmpresa)
        VALUES ('${nome}', '${tipo}', 'Ativo', '${localizacao}', '${descricao}', ${fkEmpresa});
    `;

    return database.executar(instrucaoSql).then(function (resultadoEquipamento) {
        return cadastrarConfiguracoesAlerta(resultadoEquipamento.insertId, limiteCpu, limiteRam, limiteDisco)
            .then(function () {
                return resultadoEquipamento;
            });
    });
}

function cadastrarConfiguracoesAlerta(idEquipamento, limiteCpu, limiteRam, limiteDisco) {
    let instrucaoSql = `
        INSERT INTO configuracaoAlerta
            (fkEquipamento, nomeMetrica, valorLimite, unidade, ativo)
        VALUES
            (${idEquipamento}, 'CPU', ${limiteCpu}, '%', 1),
            (${idEquipamento}, 'RAM', ${limiteRam}, '%', 1),
            (${idEquipamento}, 'DISCO', ${limiteDisco}, '%', 1);
    `;

    return database.executar(instrucaoSql);
}

function cadastrarComponentes(componentes, idEquipamento) {
    let listaValores = [];
    for (let i = 0; i < componentes.length; i++) {
        let componente = componentes[i];
        listaValores.push(`('${componente.nome}', '${componente.tipo}', '${componente.descricao}', ${idEquipamento})`);
    }
    let valores = listaValores.join(", ");

    let instrucaoSql = `
        INSERT INTO componente (nome, tipo, descricao, fkEquipamento)
        VALUES ${valores};
    `;

    return database.executar(instrucaoSql);
}

function buscarEquipamentoPorId(idEquipamento) {
    let instrucaoSql = `
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
            COALESCE(alertas.limiteCpu, 80) AS limiteCpu,
            COALESCE(alertas.limiteRam, 80) AS limiteRam,
            COALESCE(alertas.limiteDisco, 80) AS limiteDisco,
            eq.fkEmpresa AS idEmpresa
        FROM equipamento AS eq
            LEFT JOIN componente AS cp ON cp.fkEquipamento = eq.idEquipamento
            LEFT JOIN (
                SELECT
                    fkEquipamento,
                    MAX(CASE WHEN nomeMetrica = 'CPU' THEN valorLimite END) AS limiteCpu,
                    MAX(CASE WHEN nomeMetrica = 'RAM' THEN valorLimite END) AS limiteRam,
                    MAX(CASE WHEN nomeMetrica = 'DISCO' THEN valorLimite END) AS limiteDisco
                FROM configuracaoAlerta
                GROUP BY fkEquipamento
            ) AS alertas ON alertas.fkEquipamento = eq.idEquipamento
        WHERE eq.idEquipamento = ${idEquipamento};
    `;

    return database.executar(instrucaoSql);
}

function atualizarEquipamento(idEquipamento, nome, tipo, localizacao, descricao, limiteCpu, limiteRam, limiteDisco) {
    let instrucaoSql = `
        UPDATE equipamento
        SET nome = '${nome}',
            tipo = '${tipo}',
            localizacao = '${localizacao}',
            descricao = '${descricao}'
        WHERE idEquipamento = ${idEquipamento};
    `;

    return database.executar(instrucaoSql).then(function (resultadoAtualizacao) {
        return atualizarConfiguracoesAlerta(idEquipamento, limiteCpu, limiteRam, limiteDisco)
            .then(function () {
                return resultadoAtualizacao;
            });
    });
}

function atualizarConfiguracoesAlerta(idEquipamento, limiteCpu, limiteRam, limiteDisco) {
    let instrucaoSql = `
        INSERT INTO configuracaoAlerta
            (fkEquipamento, nomeMetrica, valorLimite, unidade, ativo)
        VALUES
            (${idEquipamento}, 'CPU', ${limiteCpu}, '%', 1),
            (${idEquipamento}, 'RAM', ${limiteRam}, '%', 1),
            (${idEquipamento}, 'DISCO', ${limiteDisco}, '%', 1)
        ON DUPLICATE KEY UPDATE
            valorLimite = VALUES(valorLimite),
            unidade = VALUES(unidade),
            ativo = VALUES(ativo);
    `;

    return database.executar(instrucaoSql);
}

function deletarComponentesPorEquipamento(idEquipamento) {
    let instrucaoSql = `
        DELETE FROM componente WHERE fkEquipamento = ${idEquipamento};
    `;

    return database.executar(instrucaoSql);
}

function deletarEquipamento(idEmpresa, idEquipamento) {
    let instrucaoSql = `
        DELETE FROM equipamento WHERE idEquipamento = ${idEquipamento} AND fkEmpresa = ${idEmpresa};
    `;

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
