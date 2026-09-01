var database = require("../database/config");

// usuario
    //semanal
function buscarDadosGraficoSemanalUsuario(limite_linhas) {

    var instrucaoSql = 
    `
        SELECT 
            DATE_FORMAT(u.dt_cadastro, '%d/%m') AS momento_grafico,
            COUNT(u.id_usuario) AS qtd_usuarios
        FROM usuario u
        GROUP BY DATE_FORMAT(u.dt_cadastro, '%d/%m')
        ORDER BY DATE_FORMAT(u.dt_cadastro, '%d/%m') DESC LIMIT ${limite_linhas};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function atualizarDadosGraficoSemanalUsuario() {

    var instrucaoSql = 
    `
        SELECT 
            DATE_FORMAT(u.dt_cadastro, '%d/%m') AS momento_grafico,
            COUNT(u.id_usuario) AS qtd_usuarios
        FROM usuario u
        GROUP BY DATE_FORMAT(u.dt_cadastro, '%d/%m')
        ORDER BY DATE_FORMAT(u.dt_cadastro, '%d/%m') DESC LIMIT 1;
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

    //mensal
function buscarDadosGraficoMensalUsuario(limite_linhas) {

    var instrucaoSql = 
    `
        SELECT 
            DATE_FORMAT(u.dt_cadastro, '%m/%Y') AS momento_grafico,
            COUNT(u.id_usuario) AS qtd_usuarios
        FROM usuario u
        GROUP BY DATE_FORMAT(u.dt_cadastro, '%m/%Y')
        ORDER BY DATE_FORMAT(u.dt_cadastro, '%m/%Y') DESC LIMIT ${limite_linhas};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function atualizarDadosGraficoMensalUsuario() {

    var instrucaoSql = 
    `
        SELECT 
            DATE_FORMAT(u.dt_cadastro, '%m/%Y') AS momento_grafico,
            COUNT(u.id_usuario) AS qtd_usuarios
        FROM usuario u
        GROUP BY DATE_FORMAT(u.dt_cadastro, '%m/%Y')
        ORDER BY DATE_FORMAT(u.dt_cadastro, '%m/%Y') DESC LIMIT 1;
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

// quiz
    //semanal
function buscarDadosGraficoSemanalQuiz(limite_linhas) {

    var instrucaoSql = 
    `
        SELECT 
            DATE_FORMAT(r.dt_realizacao, '%d/%m') AS momento_grafico,
            COUNT(*) AS qtd_quiz
        FROM resultado r
        GROUP BY DATE_FORMAT(r.dt_realizacao, '%d/%m')
        ORDER BY DATE_FORMAT(r.dt_realizacao, '%d/%m') DESC LIMIT ${limite_linhas};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function atualizarDadosGraficoSemanalQuiz() {

    var instrucaoSql = 
    `
        SELECT 
            DATE_FORMAT(r.dt_realizacao, '%d/%m') AS momento_grafico,
            COUNT(*) AS qtd_quiz
        FROM resultado r
        GROUP BY DATE_FORMAT(r.dt_realizacao, '%d/%m')
        ORDER BY DATE_FORMAT(r.dt_realizacao, '%d/%m') DESC LIMIT 1;
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

    //mensal
function buscarDadosGraficoMensalQuiz(limite_linhas) {

    var instrucaoSql = 
    `
        SELECT 
            DATE_FORMAT(r.dt_realizacao, '%m/%Y') AS momento_grafico,
            COUNT(r.fk_quiz) AS qtd_quiz
        FROM resultado r
        GROUP BY DATE_FORMAT(r.dt_realizacao, '%m/%Y')
        ORDER BY DATE_FORMAT(r.dt_realizacao, '%m/%Y') DESC LIMIT ${limite_linhas};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function atualizarDadosGraficoMensalQuiz() {

    var instrucaoSql = 
    `
        SELECT 
            DATE_FORMAT(r.dt_realizacao, '%m/%Y') AS momento_grafico,
            COUNT(r.fk_quiz) AS qtd_quiz
        FROM resultado r
        GROUP BY DATE_FORMAT(r.dt_realizacao, '%m/%Y')
        ORDER BY DATE_FORMAT(r.dt_realizacao, '%m/%Y') DESC LIMIT 1;
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

// específico
    // qual quiz é mais jogado

function  buscarDadosGraficoPrincipalQuiz(limite_linhas){
    var instrucaoSql = 
    `
        SELECT 
            COUNT(CASE WHEN r.fk_quiz = 1 THEN 1 END) AS qtd_quiz_geral,
            COUNT(CASE WHEN r.fk_quiz = 2 THEN 1 END) AS qtd_quiz_poderes,
            COUNT(CASE WHEN r.fk_quiz = 3 THEN 1 END) AS qtd_quiz_personagens,
            DATE_FORMAT(r.dt_realizacao, '%d/%m') AS momento_grafico
        FROM resultado r
        GROUP BY DATE_FORMAT(r.dt_realizacao, '%d/%m')
        ORDER BY DATE_FORMAT(r.dt_realizacao, '%d/%m') DESC LIMIT ${limite_linhas};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function  atualizarDadosGraficoPrincipalQuiz(){
    var instrucaoSql = 
    `
        SELECT 
            COUNT(CASE WHEN r.fk_quiz = 1 THEN 1 END) AS qtd_quiz_geral,
            COUNT(CASE WHEN r.fk_quiz = 2 THEN 1 END) AS qtd_quiz_poderes,
            COUNT(CASE WHEN r.fk_quiz = 3 THEN 1 END) AS qtd_quiz_personagens,
            DATE_FORMAT(r.dt_realizacao, '%d/%m') AS momento_grafico
        FROM resultado r
        GROUP BY DATE_FORMAT(r.dt_realizacao, '%d/%m')
        ORDER BY DATE_FORMAT(r.dt_realizacao, '%d/%m') DESC LIMIT 1;
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

    // média de acerto por quiz
function  buscarDadosGraficoMediaQuiz(limite_linhas){
    var instrucaoSql = 
    `
        SELECT 
            ROUND(AVG(CASE WHEN r.fk_quiz = 1 THEN r.pontuacao END), 1) AS media_quiz_geral,
            ROUND(AVG(CASE WHEN r.fk_quiz = 2 THEN r.pontuacao END), 1) AS media_quiz_poderes,
            ROUND(AVG(CASE WHEN r.fk_quiz = 3 THEN r.pontuacao END), 1) AS media_quiz_personagens,
            DATE_FORMAT(r.dt_realizacao, '%d/%m') AS momento_grafico
        FROM resultado r
        GROUP BY DATE_FORMAT(r.dt_realizacao, '%d/%m')
        ORDER BY DATE_FORMAT(r.dt_realizacao, '%d/%m') DESC LIMIT ${limite_linhas};
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function  atualizarDadosGraficoMediaQuiz(){
    var instrucaoSql = 
    `
        SELECT 
            ROUND(AVG(CASE WHEN r.fk_quiz = 1 THEN r.pontuacao END), 1) AS media_quiz_geral,
            ROUND(AVG(CASE WHEN r.fk_quiz = 2 THEN r.pontuacao END), 1) AS media_quiz_poderes,
            ROUND(AVG(CASE WHEN r.fk_quiz = 3 THEN r.pontuacao END), 1) AS media_quiz_personagens,
            DATE_FORMAT(r.dt_realizacao, '%d/%m') AS momento_grafico
        FROM resultado r
        GROUP BY DATE_FORMAT(r.dt_realizacao, '%d/%m')
        ORDER BY DATE_FORMAT(r.dt_realizacao, '%d/%m') DESC LIMIT 1;
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

// kpi

function obterKPIs(){

    var instrucaoSql = `
        SELECT 
            COUNT(DISTINCT u.id_usuario) AS qtd_usuario,
            COUNT(DISTINCT r.id_resultado) AS qtd_quiz,
            DATE_FORMAT(NOW(), '%d/%m/%Y %H:%i:%s') AS data_atualizacao
        FROM usuario u
            LEFT JOIN resultado r
                ON u.id_usuario = r.fk_usuario;
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);

    return database.executar(instrucaoSql);
}

function obterKPIQuiz(){

    var instrucaoSql = `
        SELECT 
			r.fk_quiz AS quiz,
            COUNT(r.fk_quiz) AS qtd_quiz,
            ROUND(AVG(r.pontuacao), 1) AS media_quiz
        FROM resultado r
        GROUP BY (r.fk_quiz);
    `;

    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    buscarDadosGraficoSemanalUsuario,
    atualizarDadosGraficoSemanalUsuario,
    buscarDadosGraficoMensalUsuario,
    atualizarDadosGraficoMensalUsuario,
    buscarDadosGraficoSemanalQuiz,
    atualizarDadosGraficoSemanalQuiz,
    buscarDadosGraficoMensalQuiz,
    atualizarDadosGraficoMensalQuiz,
    buscarDadosGraficoPrincipalQuiz,
    atualizarDadosGraficoPrincipalQuiz,
    buscarDadosGraficoMediaQuiz,
    atualizarDadosGraficoMediaQuiz,
    obterKPIs,
    obterKPIQuiz
}