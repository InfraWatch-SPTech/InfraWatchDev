var database = require("../database/config");

function autenticar(email, senha) {
    var instrucaoSql = `
        SELECT
            u.idUsuario AS id,
            u.nome,
            u.email,
            na.idnivel_acesso AS idNivelAcesso,
            na.nome AS nomeNivelAcesso,
            na.nome AS nomePermissao,
            na.descricao AS descPermissao,
            e.idEmpresa,
            e.nome AS nomeEmpresa,
            GROUP_CONCAT(DISTINCT p.nome ORDER BY p.nome SEPARATOR ',') AS permissoes
        FROM usuario u
        JOIN empresa e
            ON e.idEmpresa = u.fkEmpresa
        LEFT JOIN nivel_acesso na
            ON na.fk_usuario = u.idUsuario
        LEFT JOIN permissoes_acesso pa
            ON pa.fkNivelAcesso = na.idnivel_acesso
        LEFT JOIN permissao p
            ON p.idPermissao = pa.fkPermissao
        WHERE u.email = '${email}' AND u.senha = '${senha}'
        GROUP BY
            u.idUsuario,
            u.nome,
            u.email,
            na.idnivel_acesso,
            na.nome,
            na.descricao,
            e.idEmpresa,
            e.nome;
    `;

    return database.executar(instrucaoSql);
}

function verificar_cadastro(email) {
    var instrucaoSql = `
        SELECT idUsuario
        FROM usuario
        WHERE email = '${email}';
    `;

    return database.executar(instrucaoSql);
}

function verificar_empresa_por_nome(codigoEmpresa) {
    var instrucaoSql = `
        SELECT idEmpresa, nome
        FROM empresa
        WHERE codigo = '${codigoEmpresa}';
    `;

    return database.executar(instrucaoSql);
}

function verificar_usuarios_empresa(fkEmpresa) {
    var instrucaoSql = `
        SELECT COUNT(*) AS quantidadeUsuarios
        FROM usuario
        WHERE fkEmpresa = ${fkEmpresa};
    `;

    return database.executar(instrucaoSql);
}

function cadastrar(nome, email, senha, fkEmpresa, nomeNivelAcesso) {
    var instrucaoUsuario = `
        INSERT INTO usuario (nome, email, senha, fkEmpresa)
        VALUES ('${nome}', '${email}', '${senha}', ${fkEmpresa});
    `;

    return database.executar(instrucaoUsuario)
        .then(function (resultadoUsuario) {
            var idUsuario = resultadoUsuario.insertId;

            var instrucaoNivel = `
                INSERT INTO nivel_acesso (nome, descricao, fk_usuario)
                VALUES (
                    '${nomeNivelAcesso}',
                    '${nomeNivelAcesso === "Gerente" ? "Gerencia usuarios e equipamentos permitidos" : "Visualiza as dashboards permitidas"}',
                    ${idUsuario}
                );
            `;

            return database.executar(instrucaoNivel)
                .then(function (resultadoNivel) {
                    if (nomeNivelAcesso !== "Gerente") {
                        return resultadoUsuario;
                    }

                    var idNivelAcesso = resultadoNivel.insertId;
                    var instrucaoPermissoes = `
                        INSERT INTO permissoes_acesso (fkNivelAcesso, fkPermissao)
                        SELECT ${idNivelAcesso}, idPermissao
                        FROM permissao
                        WHERE nome IN (
                            'DASHBOARD_SERVIDORES',
                            'DASHBOARD_NOTEBOOKS',
                            'DASHBOARD_REDE'
                        );
                    `;

                    return database.executar(instrucaoPermissoes)
                        .then(function () {
                            return resultadoUsuario;
                        });
                });
        });
}

function buscarGerenteNaEmpresa(idGerente, idEmpresa) {
    var instrucaoSql = `
        SELECT u.idUsuario
        FROM usuario u
        JOIN nivel_acesso na
            ON na.fk_usuario = u.idUsuario
        WHERE u.idUsuario = ${idGerente}
            AND u.fkEmpresa = ${idEmpresa}
            AND na.nome IN ('Root', 'Gerente');
    `;

    return database.executar(instrucaoSql);
}

function listarUsuariosEmpresa(idEmpresa) {
    var instrucaoSql = `
        SELECT
            u.idUsuario,
            u.nome,
            u.email,
            na.idnivel_acesso AS idNivelAcesso,
            na.nome AS nomeNivelAcesso,
            GROUP_CONCAT(DISTINCT p.idPermissao ORDER BY p.idPermissao SEPARATOR ',') AS idsPermissoes,
            GROUP_CONCAT(DISTINCT p.nome ORDER BY p.nome SEPARATOR ',') AS nomesPermissoes
        FROM usuario u
        LEFT JOIN nivel_acesso na
            ON na.fk_usuario = u.idUsuario
        LEFT JOIN permissoes_acesso pa
            ON pa.fkNivelAcesso = na.idnivel_acesso
        LEFT JOIN permissao p
            ON p.idPermissao = pa.fkPermissao
        WHERE u.fkEmpresa = ${idEmpresa}
        GROUP BY
            u.idUsuario,
            u.nome,
            u.email,
            na.idnivel_acesso,
            na.nome
        ORDER BY u.nome, u.idUsuario;
    `;

    return database.executar(instrucaoSql);
}

function listarPermissoesDisponiveis() {
    var instrucaoSql = `
        SELECT idPermissao, nome, descricao
        FROM permissao
        WHERE nome IN (
            'DASHBOARD_SERVIDORES',
            'DASHBOARD_NOTEBOOKS',
            'DASHBOARD_REDE'
        )
        ORDER BY idPermissao;
    `;

    return database.executar(instrucaoSql);
}

function buscarUsuarioNaEmpresa(idUsuario, idEmpresa) {
    var instrucaoSql = `
        SELECT
            u.idUsuario,
            u.fkEmpresa,
            na.idnivel_acesso AS idNivelAcesso,
            na.nome AS nomeNivelAcesso
        FROM usuario u
        LEFT JOIN nivel_acesso na
            ON na.fk_usuario = u.idUsuario
        WHERE u.idUsuario = ${idUsuario}
            AND u.fkEmpresa = ${idEmpresa};
    `;

    return database.executar(instrucaoSql);
}

function atualizarNivelAcesso(idNivelAcesso, nomeNivelAcesso) {
    var descricao;

    if (nomeNivelAcesso === "Gerente") {
        descricao = "Gerencia usuarios e equipamentos permitidos";
    } else {
        descricao = "Visualiza as dashboards permitidas";
    }

    var instrucaoSql = `
        UPDATE nivel_acesso
        SET nome = '${nomeNivelAcesso}',
            descricao = '${descricao}'
        WHERE idnivel_acesso = ${idNivelAcesso};
    `;

    return database.executar(instrucaoSql);
}

function removerPermissoesNivel(idNivelAcesso) {
    var instrucaoSql = `
        DELETE FROM permissoes_acesso
        WHERE fkNivelAcesso = ${idNivelAcesso};
    `;

    return database.executar(instrucaoSql);
}

function adicionarPermissoesNivel(idNivelAcesso, idsPermissoes) {
    if (idsPermissoes.length === 0) {
        return Promise.resolve();
    }

    var valores = [];

    for (var i = 0; i < idsPermissoes.length; i++) {
        valores.push(`(${idNivelAcesso}, ${idsPermissoes[i]})`);
    }

    var instrucaoSql = `
        INSERT INTO permissoes_acesso (fkNivelAcesso, fkPermissao)
        VALUES ${valores.join(", ")};
    `;

    return database.executar(instrucaoSql);
}

function verificarPermissoesValidas(idsPermissoes) {
    if (idsPermissoes.length === 0) {
        return Promise.resolve([]);
    }

    var instrucaoSql = `
        SELECT idPermissao
        FROM permissao
        WHERE idPermissao IN (${idsPermissoes.join(",")})
            AND nome IN (
                'DASHBOARD_SERVIDORES',
                'DASHBOARD_NOTEBOOKS',
                'DASHBOARD_REDE'
            );
    `;

    return database.executar(instrucaoSql);
}

module.exports = {
    autenticar,
    verificar_cadastro,
    verificar_empresa_por_nome,
    verificar_usuarios_empresa,
    cadastrar,
    buscarGerenteNaEmpresa,
    listarUsuariosEmpresa,
    listarPermissoesDisponiveis,
    buscarUsuarioNaEmpresa,
    atualizarNivelAcesso,
    removerPermissoesNivel,
    adicionarPermissoesNivel,
    verificarPermissoesValidas
};
