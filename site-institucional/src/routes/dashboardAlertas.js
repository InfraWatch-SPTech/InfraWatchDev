// Importando framework express
// Utilizado para criar o servidor e gerenciar rotas HTTP do projeto
var express = require("express");

// Criando um objeto Router do express
// Utilizado para separar e organizar as rotas do projeto
var router = express.Router();

// Importando o arquivo dashboardAlertasController
var dashboardAlertasController = require("../controllers/dashboardAlertasController");



// ROTA GET para visualizar os críticos em aberto da empresa logada
// GET para buscar dados do servidor
router.get("/kpi-criticos-abertos/:fkEmpresa", function (req, res)
{
    // :fkEmpresa -> parâmetro de rota, o valor será dinâmico dependendo da empresa logada

    // Direcionando a requisição pro controller responsavel
    dashboardAlertasController.kpiCriticosAbertos(req, res);
});



// ROTA GET para visualizar os alertas fora do SLA da empresa logada
// GET para buscar dados do servidor
router.get("/kpi-fora-sla/:fkEmpresa", function (req, res)
{
    // :fkEmpresa -> parâmetro de rota, o valor será dinâmico dependendo da empresa logada

    // Direcionando a requisição pro controller responsavel
    dashboardAlertasController.kpiForaSla(req, res);
});



// ROTA GET para visualizar o tempo médio de resolução da empresa logada
// GET para buscar dados do servidor
router.get("/kpi-tempo-medio/:fkEmpresa", function (req, res)
{
    // :fkEmpresa -> parâmetro de rota, o valor será dinâmico dependendo da empresa logada

    // Direcionando a requisição pro controller responsavel
    dashboardAlertasController.kpiTempoMedio(req, res);
});



// ROTA GET para visualizar os alertas em aberto da empresa logada
// GET para buscar dados do servidor
router.get("/kpi-abertos/:fkEmpresa", function (req, res)
{
    // :fkEmpresa -> parâmetro de rota, o valor será dinâmico dependendo da empresa logada

    // Direcionando a requisição pro controller responsavel
    dashboardAlertasController.kpiAbertos(req, res);
});



// ROTA GET para visualizar onde estão os alertas em aberto da empresa logada
// GET para buscar dados do servidor
router.get("/grafico-onde-estao/:fkEmpresa", function (req, res)
{
    // :fkEmpresa -> parâmetro de rota, o valor será dinâmico dependendo da empresa logada

    // Direcionando a requisição pro controller responsavel
    dashboardAlertasController.graficoOndeEstao(req, res);
});



// ROTA GET para visualizar o fluxo de alertas da empresa logada
// GET para buscar dados do servidor
router.get("/grafico-fluxo/:fkEmpresa", function (req, res)
{
    // :fkEmpresa -> parâmetro de rota, o valor será dinâmico dependendo da empresa logada

    // Direcionando a requisição pro controller responsavel
    dashboardAlertasController.graficoFluxo(req, res);
});



// ROTA GET para visualizar o tempo médio de resolução x SLA da empresa logada
// GET para buscar dados do servidor
router.get("/grafico-mttr/:fkEmpresa", function (req, res)
{
    // Tempo Médio de Resolução
    
    // :fkEmpresa -> parâmetro de rota, o valor será dinâmico dependendo da empresa logada

    // Direcionando a requisição pro controller responsavel
    dashboardAlertasController.graficoMttr(req, res);
});



// ROTA GET para visualizar a fila de atenção da empresa logada
// GET para buscar dados do servidor
router.get("/fila-atencao/:fkEmpresa", function (req, res)
{
    // :fkEmpresa -> parâmetro de rota, o valor será dinâmico dependendo da empresa logada

    // Direcionando a requisição pro controller responsavel
    dashboardAlertasController.filaAtencao(req, res);
});



// Exportando o router
// Permite utilizar essas rotas em outras partes do projeto
module.exports = router;
