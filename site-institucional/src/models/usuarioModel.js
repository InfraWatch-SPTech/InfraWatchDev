var database = require("../database/config")

function autenticar(email, senha) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function entrar(): ", email, senha)
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
        WHERE 
        u.email = '${email}'
            AND 
        u.senha = '${senha}';
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function verificar_cadastro(email) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: duplicated insert in database',\n \t\t >> verifique se a requisição de cadastro tem um email\n\n function verificar_cadastro(): ", email)
    var instrucaoSql = `
        SELECT * FROM usuario WHERE email = '${email}';
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function verificar_empresa_por_nome(nomeEmpresa){
    var instrucaoSql = `
        SELECT idEmpresa,nome
        FROM empresa
        WHERE nome = '${nomeEmpresa}';
        `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    
    return database.executar(instrucaoSql);
}

// Coloque os mesmos parâmetros aqui. Vá para a var instrucaoSql
function cadastrar(nome, email, senha, fkEmpresa, fkPermissao) {
    console.log("ACESSEI O USUARIO MODEL \n \n\t\t >> Se aqui der erro de 'Error: connect ECONNREFUSED',\n \t\t >> verifique suas credenciais de acesso ao banco\n \t\t >> e se o servidor de seu BD está rodando corretamente. \n\n function cadastrar():", nome, email, senha);
    
    // Insira exatamente a query do banco aqui, lembrando da nomenclatura exata nos valores
    //  e na ordem de inserção dos dados.
    var instrucaoSql = `
        INSERT INTO usuario (nome, email, senha, fkEmpresa, fkPermissao) 
        VALUES ('${nome}', '${email}', '${senha}', '${fkEmpresa}',${fkPermissao});
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    autenticar,
    cadastrar,
    verificar_cadastro,
    verificar_empresa_por_nome
};