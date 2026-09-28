var database = require("../database/config")

function autenticar(email, senha) {
    var instrucaoSql = `
        SELECT
            u.idUsuario AS id,
            u.nome,
            u.email,
            u.fkPermissao AS perm,
            p.nome AS nomePermissao,
            p.descricao AS descPermissao,
            e.idEmpresa AS idEmpresa,
            e.nome AS nomeEmpresa
        FROM usuario u
        LEFT JOIN empresa e ON e.idEmpresa = u.fkEmpresa
        LEFT JOIN permissao p ON p.idPermissao = u.fkPermissao
        WHERE u.email = '${email}' AND u.senha = '${senha}';
    `;
    return database.executar(instrucaoSql);
}

function verificar_cadastro(email) {
    var instrucaoSql = `
        SELECT * FROM usuario WHERE email = '${email}';
    `;
    return database.executar(instrucaoSql);
}

function verificar_empresa_por_nome(codigoEmpresa) {
    var instrucaoSql = `
        SELECT idEmpresa, nome FROM empresa WHERE codigo = '${codigoEmpresa}';
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

function cadastrar(nome, email, senha, fkEmpresa, fkPermissao) {
    var instrucaoSql = `
        INSERT INTO usuario (nome, email, senha, fkEmpresa, fkPermissao)
        VALUES ('${nome}', '${email}', '${senha}', ${fkEmpresa}, ${fkPermissao});
    `;
    return database.executar(instrucaoSql);
}

function buscarAdministradorNaEmpresa(idAdministrador, idEmpresa) {
    var instrucaoSql = `
        SELECT idUsuario
        FROM usuario
        WHERE idUsuario = ${idAdministrador}
            AND fkEmpresa = ${idEmpresa}
            AND fkPermissao = 2;
    `;
    return database.executar(instrucaoSql);
}

function listarUsuariosEmpresa(idEmpresa) {
    var instrucaoSql = `
        SELECT
            u.idUsuario AS idUsuario,
            u.nome AS nome,
            u.email AS email,
            u.fkPermissao AS fkPermissao,
            p.nome AS nomePermissao
        FROM usuario AS u
        LEFT JOIN permissao AS p ON p.idPermissao = u.fkPermissao
        WHERE u.fkEmpresa = ${idEmpresa}
        ORDER BY u.nome, u.idUsuario;
    `;
    return database.executar(instrucaoSql);
}

function buscarUsuarioNaEmpresa(idUsuario, idEmpresa) {
    var instrucaoSql = `
        SELECT idUsuario, fkPermissao
        FROM usuario
        WHERE idUsuario = ${idUsuario} AND fkEmpresa = ${idEmpresa};
    `;
    return database.executar(instrucaoSql);
}

function atualizarPermissaoUsuario(idUsuario, idEmpresa, fkPermissao) {
    var instrucaoSql = `
        UPDATE usuario
        SET fkPermissao = ${fkPermissao}
        WHERE idUsuario = ${idUsuario} AND fkEmpresa = ${idEmpresa};
    `;
    return database.executar(instrucaoSql);
}

module.exports = {
    autenticar,
    cadastrar,
    verificar_cadastro,
    verificar_empresa_por_nome,
    verificar_usuarios_empresa,
    buscarAdministradorNaEmpresa,
    listarUsuariosEmpresa,
    buscarUsuarioNaEmpresa,
    atualizarPermissaoUsuario
};
