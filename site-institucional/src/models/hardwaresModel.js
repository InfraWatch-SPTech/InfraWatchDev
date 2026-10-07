var database = require("../database/config");

function buscarAcessoUsuario(idUsuario, idEmpresa) {
    var instrucaoSql = `
        SELECT
            u.idUsuario,
            u.fkEmpresa,
            na.nome AS nomeNivelAcesso,
            GROUP_CONCAT(DISTINCT p.nome ORDER BY p.nome SEPARATOR ',') AS permissoes
        FROM usuario u
        JOIN nivel_acesso na
            ON na.fk_usuario = u.idUsuario
        LEFT JOIN permissoes_acesso pa
            ON pa.fkNivelAcesso = na.idnivel_acesso
        LEFT JOIN permissao p
            ON p.idPermissao = pa.fkPermissao
        WHERE u.idUsuario = ${idUsuario}
            AND u.fkEmpresa = ${idEmpresa}
        GROUP BY u.idUsuario, u.fkEmpresa, na.nome;
    `;

    return database.executar(instrucaoSql);
}

function montarFiltroTipos(tiposPermitidos) {
    if (tiposPermitidos === null) {
        return "";
    }

    if (tiposPermitidos.length === 0) {
        return " AND 1 = 0 ";
    }

    var tiposFormatados = [];

    for (var i = 0; i < tiposPermitidos.length; i++) {
        tiposFormatados.push(`'${tiposPermitidos[i]}'`);
    }

    return ` AND eq.tipo IN (${tiposFormatados.join(", ")}) `;
}

function buscarEquipamentosEmpresa(idEmpresa, tiposPermitidos) {
    var filtroTipos = montarFiltroTipos(tiposPermitidos);

    var instrucaoSql = `
        SELECT
            cp.nome AS nomeComponente,
            cp.tipo AS tipoComponente,
            cp.descricao AS descricaoComponente,
            eq.idEquipamento,
            eq.nome AS nomeEquipamento,
            eq.tipo AS tipoEquipamento,
            eq.ip AS ipEquipamento,
            eq.status AS statusEquipamento,
            eq.localizacao,
            eq.descricao AS descricaoEquipamento,
            COALESCE(alertas.limiteCpu, 80) AS limiteCpu,
            COALESCE(alertas.limiteRam, 80) AS limiteRam,
            COALESCE(alertas.limiteDisco, 80) AS limiteDisco,
            eq.fkEmpresa AS idEmpresa
        FROM equipamento eq
        LEFT JOIN parametro_alerta pa
            ON pa.fkEquipamento = eq.idEquipamento
        LEFT JOIN componente cp
            ON cp.idComponente = pa.fkComponente
        LEFT JOIN (
            SELECT
                pa2.fkEquipamento,
                MAX(CASE WHEN c2.tipo = 'CPU' THEN pa2.limite_critico END) AS limiteCpu,
                MAX(CASE WHEN c2.tipo = 'RAM' THEN pa2.limite_critico END) AS limiteRam,
                MAX(CASE WHEN c2.tipo = 'ARMAZENAMENTO' THEN pa2.limite_critico END) AS limiteDisco
            FROM parametro_alerta pa2
            JOIN componente c2
                ON c2.idComponente = pa2.fkComponente
            GROUP BY pa2.fkEquipamento
        ) alertas
            ON alertas.fkEquipamento = eq.idEquipamento
        WHERE eq.fkEmpresa = ${idEmpresa}
            ${filtroTipos}
        ORDER BY eq.idEquipamento, cp.idComponente;
    `;

    return database.executar(instrucaoSql);
}

function buscarTipoEquipamento(idEquipamento, idEmpresa) {
    var instrucaoSql = `
        SELECT idEquipamento, tipo, fkEmpresa
        FROM equipamento
        WHERE idEquipamento = ${idEquipamento}
            AND fkEmpresa = ${idEmpresa};
    `;

    return database.executar(instrucaoSql);
}

function cadastrarEquipamento(nome, tipo, localizacao, descricao, fkEmpresa) {
    var instrucaoSql = `
        INSERT INTO equipamento
            (nome, tipo, status, localizacao, descricao, fkEmpresa)
        VALUES
            ('${nome}', '${tipo}', 'Ativo', '${localizacao}', '${descricao}', ${fkEmpresa});
    `;

    return database.executar(instrucaoSql);
}

function valorLimitePorTipo(tipoComponente, limiteCpu, limiteRam, limiteDisco) {
    var tipo = String(tipoComponente).toUpperCase();

    if (tipo === "CPU") {
        return limiteCpu;
    }

    if (tipo === "RAM") {
        return limiteRam;
    }

    if (tipo === "ARMAZENAMENTO") {
        return limiteDisco;
    }

    return 90;
}

function cadastrarComponentes(componentes, idEquipamento, limiteCpu, limiteRam, limiteDisco) {
    if (!componentes || componentes.length === 0) {
        return Promise.resolve();
    }

    var tipos = [];
    var configuracoes = {};

    for (var i = 0; i < componentes.length; i++) {
        var tipo = String(componentes[i].tipo).toUpperCase();

        if (tipos.indexOf(tipo) === -1) {
            tipos.push(tipo);
            configuracoes[tipo] = valorLimitePorTipo(
                tipo,
                limiteCpu,
                limiteRam,
                limiteDisco
            );
        }
    }

    var tiposSql = tipos.map(function (tipo) {
        return `'${tipo}'`;
    }).join(", ");

    var casosLimiteAtencao = [];
    var casosLimiteCritico = [];
    var casosMetrica = [];

    for (var j = 0; j < tipos.length; j++) {
        var tipoAtual = tipos[j];
        var limiteCritico = configuracoes[tipoAtual];
        var limiteAtencao = Math.max(1, limiteCritico - 10);

        casosLimiteAtencao.push(`WHEN '${tipoAtual}' THEN ${limiteAtencao}`);
        casosLimiteCritico.push(`WHEN '${tipoAtual}' THEN ${limiteCritico}`);
        casosMetrica.push(`WHEN '${tipoAtual}' THEN 'USO_${tipoAtual}'`);
    }

    var instrucaoSql = `
        INSERT INTO parametro_alerta
            (nomeMetrica, limite_atencao, limite_critico, unidade,
             ativo, fkEquipamento, fkComponente)
        SELECT
            CASE UPPER(tipo)
                ${casosMetrica.join("\n                ")}
                ELSE CONCAT('USO_', UPPER(tipo))
            END,
            CASE UPPER(tipo)
                ${casosLimiteAtencao.join("\n                ")}
                ELSE 80
            END,
            CASE UPPER(tipo)
                ${casosLimiteCritico.join("\n                ")}
                ELSE 90
            END,
            '%',
            1,
            ${idEquipamento},
            idComponente
        FROM componente
        WHERE UPPER(tipo) IN (${tiposSql});
    `;

    return database.executar(instrucaoSql);
}

function buscarEquipamentoPorId(idEquipamento, idEmpresa) {
    var instrucaoSql = `
        SELECT
            cp.idComponente,
            cp.nome AS nomeComponente,
            cp.tipo AS tipoComponente,
            cp.descricao AS descricaoComponente,
            eq.idEquipamento,
            eq.nome AS nomeEquipamento,
            eq.tipo AS tipoEquipamento,
            eq.status AS statusEquipamento,
            eq.localizacao,
            eq.descricao AS descricaoEquipamento,
            COALESCE(alertas.limiteCpu, 80) AS limiteCpu,
            COALESCE(alertas.limiteRam, 80) AS limiteRam,
            COALESCE(alertas.limiteDisco, 80) AS limiteDisco,
            eq.fkEmpresa AS idEmpresa
        FROM equipamento eq
        LEFT JOIN parametro_alerta pa
            ON pa.fkEquipamento = eq.idEquipamento
        LEFT JOIN componente cp
            ON cp.idComponente = pa.fkComponente
        LEFT JOIN (
            SELECT
                pa2.fkEquipamento,
                MAX(CASE WHEN c2.tipo = 'CPU' THEN pa2.limite_critico END) AS limiteCpu,
                MAX(CASE WHEN c2.tipo = 'RAM' THEN pa2.limite_critico END) AS limiteRam,
                MAX(CASE WHEN c2.tipo = 'ARMAZENAMENTO' THEN pa2.limite_critico END) AS limiteDisco
            FROM parametro_alerta pa2
            JOIN componente c2
                ON c2.idComponente = pa2.fkComponente
            GROUP BY pa2.fkEquipamento
        ) alertas
            ON alertas.fkEquipamento = eq.idEquipamento
        WHERE eq.idEquipamento = ${idEquipamento}
            AND eq.fkEmpresa = ${idEmpresa}
        ORDER BY cp.idComponente;
    `;

    return database.executar(instrucaoSql);
}

function atualizarEquipamento(idEquipamento, idEmpresa, nome, tipo, localizacao, descricao) {
    var instrucaoSql = `
        UPDATE equipamento
        SET nome = '${nome}',
            tipo = '${tipo}',
            localizacao = '${localizacao}',
            descricao = '${descricao}'
        WHERE idEquipamento = ${idEquipamento}
            AND fkEmpresa = ${idEmpresa};
    `;

    return database.executar(instrucaoSql);
}

function deletarParametrosPorEquipamento(idEquipamento) {
    var instrucaoSql = `
        DELETE FROM parametro_alerta
        WHERE fkEquipamento = ${idEquipamento};
    `;

    return database.executar(instrucaoSql);
}

function deletarEquipamento(idEmpresa, idEquipamento) {
    var instrucaoSql = `
        DELETE FROM equipamento
        WHERE idEquipamento = ${idEquipamento}
            AND fkEmpresa = ${idEmpresa};
    `;

    return database.executar(instrucaoSql);
}

module.exports = {
    buscarAcessoUsuario,
    buscarEquipamentosEmpresa,
    buscarTipoEquipamento,
    cadastrarEquipamento,
    cadastrarComponentes,
    buscarEquipamentoPorId,
    atualizarEquipamento,
    deletarParametrosPorEquipamento,
    deletarEquipamento
};
