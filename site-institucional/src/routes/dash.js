var express = require("express");
var router = express.Router();

var dashController = require("../controllers/dashController");

// rotas dash user

    // semanal
router.get("/ultimas/usuario-semanal", function (req, res) {
    dashController.buscarDadosGraficoSemanalUsuario(req, res);
});


router.get("/tempo-real/usuario-semanal", function (req, res) {
    dashController.atualizarDadosGraficoSemanalUsuario(req, res);
})

    // mensal
router.get("/ultimas/usuario-mensal", function (req, res) {
    dashController.buscarDadosGraficoMensalUsuario(req, res);
});

router.get("/tempo-real/usuario-mensal", function (req, res) {
    dashController.atualizarDadosGraficoMensalUsuario(req, res);
})

// rotas dash quiz

    // semanal
router.get("/ultimas/quiz-semanal", function (req, res) {
    dashController.buscarDadosGraficoSemanalQuiz(req, res);
});

router.get("/tempo-real/quiz-semanal", function (req, res) {
    dashController.atualizarDadosGraficoSemanalQuiz(req, res);
})

    //mensal

router.get("/ultimas/quiz-mensal", function (req, res) {
    dashController.buscarDadosGraficoMensalQuiz(req, res);
});

router.get("/tempo-real/quiz-mensal", function (req, res) {
    dashController.atualizarDadosGraficoMensalQuiz(req, res);
})

// especifico
    // quiz mais jogado 
router.get("/ultimas/quiz-principal", function (req, res) {
    dashController.buscarDadosGraficoPrincipalQuiz(req, res);
})

router.get("/tempo-real/quiz-principal", function (req, res) {
    dashController.atualizarDadosGraficoPrincipalQuiz(req, res);
})
    // média de acertos quiz

router.get("/ultimas/quiz-media", function (req, res) {
    dashController.buscarDadosGraficoMediaQuiz(req, res);
})

router.get("/tempo-real/quiz-media", function (req, res) {
    dashController.atualizarDadosGraficoMediaQuiz(req, res);
})

// KPI

router.get("/tempo-real/kpi", function (req, res) {
    dashController.obterKPIs(req, res);
})

router.get("/tempo-real/kpi/quiz", function (req, res) {
    dashController.obterKPIQuiz(req, res);
})

module.exports = router;