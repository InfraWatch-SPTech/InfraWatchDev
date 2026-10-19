
var express = require("express");
var router = express.Router();

var relatorioController = require("../controllers/relatoriosController");

router.get("/buscar", function (req, res) {
    relatorioController.buscarRelatorios(req, res);
});

router.get("/buscarId/:idRelatorio", function (req, res) {
    relatorioController.buscarRelatorioPorId(req, res);
});

router.post("/cadastrar", function (req, res) {
    relatorioController.cadastrarRelatorio(req, res);
});

router.put("/atualizar/:idRelatorio", function (req, res) {
    relatorioController.atualizarRelatorio(req, res);
});

router.delete("/deletar/:idRelatorio", function (req, res) {
    relatorioController.deletarRelatorio(req, res);
});

module.exports = router;
