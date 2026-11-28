let express = require("express");
let router = express.Router();

let dashGPController = require("../controllers/dashGPController");

router.get("/buscarEquipeServidores/:idEmpresa", function (req, res) {
    dashGPController.buscarEquipeServidores(req, res);
});

router.get("/buscarMtbfSemanal/:idEmpresa", function (req, res) {
    dashGPController.buscarMtbfSemanal(req, res);
});

router.get("/buscarMttr/:idEmpresa", function (req, res) {
    dashGPController.buscarMttr(req, res);
});

router.post("/atualizarMtbf", function (req, res) {
    dashGPController.atualizarMtbf(req, res);
});

module.exports = router;