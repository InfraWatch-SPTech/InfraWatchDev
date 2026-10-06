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
            var descricaoNivel;

            if (nomeNivelAcesso === "Administrador") {
                descricaoNivel = "Administra equipamentos e usuarios conforme as permissoes";
            } else {
                descricaoNivel = "Visualiza equipamentos conforme as permissoes";
            }

            var instrucaoNivel = `
                INSERT INTO nivel_acesso (nome, descricao, fk_usuario)
                VALUES ('${nomeNivelAcesso}', '${descricaoNivel}', ${idUsuario});
            `;

            return database.executar(instrucaoNivel)
                .then(function (resultadoNivel) {
                    var idNivelAcesso = resultadoNivel.insertId;
                    var instrucaoPermissoes;

                    if (nomeNivelAcesso === "Administrador") {
                        instrucaoPermissoes = `
                            INSERT INTO permissoes_acesso (fkNivelAcesso, fkPermissao)
                            SELECT ${idNivelAcesso}, idPermissao
                            FROM permissao;
                        `;
                    } else {
                        instrucaoPermissoes = `
                            INSERT INTO permissoes_acesso (fkNivelAcesso, fkPermissao)
                            SELECT ${idNivelAcesso}, idPermissao
                            FROM permissao
                            WHERE nome IN (
                                'EQUIPAMENTOS_VISUALIZAR',
                                'EQUIPAMENTOS_SERVIDORES_VISUALIZAR',
                                'EQUIPAMENTOS_NOTEBOOKS_VISUALIZAR',
                                'EQUIPAMENTOS_REDE_VISUALIZAR'
                            );
                        `;
                    }

                    return database.executar(instrucaoPermissoes)
                        .then(function () {
                            return resultadoUsuario;
                        });
                });
        });
}

function buscarSolicitanteNaEmpresa(idSolicitante, idEmpresa) {
    var instrucaoSql = `
        SELECT
            u.idUsuario,
            na.nome AS nomeNivelAcesso,
            GROUP_CONCAT(DISTINCT p.nome ORDER BY p.nome SEPARATOR ',') AS permissoes
        FROM usuario u
        JOIN nivel_acesso na
            ON na.fk_usuario = u.idUsuario
        LEFT JOIN permissoes_acesso pa
            ON pa.fkNivelAcesso = na.idnivel_acesso
        LEFT JOIN permissao p
            ON p.idPermissao = pa.fkPermissao
        WHERE u.idUsuario = ${idSolicitante}
            AND u.fkEmpresa = ${idEmpresa}
        GROUP BY u.idUsuario, na.nome;
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
        ORDER BY nome;
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

    if (nomeNivelAcesso === "Administrador") {
        descricao = "Administra equipamentos e usuarios conforme as permissoes";
    } else {
        descricao = "Visualiza equipamentos conforme as permissoes";
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
        WHERE idPermissao IN (${idsPermissoes.join(",")});
    `;

    return database.executar(instrucaoSql);
}

module.exports = {
    autenticar,
    verificar_cadastro,
    verificar_empresa_por_nome,
    verificar_usuarios_empresa,
    cadastrar,
    buscarSolicitanteNaEmpresa,
    listarUsuariosEmpresa,
    listarPermissoesDisponiveis,
    buscarUsuarioNaEmpresa,
    atualizarNivelAcesso,
    removerPermissoesNivel,
    adicionarPermissoesNivel,
    verificarPermissoesValidas
};
