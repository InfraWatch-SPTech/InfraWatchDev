let express = require("express");
let router = express.Router();

let hardwaresController = require("../controllers/hardwaresController");

router.get("/buscarEq/:idEmpresa", function (req, res) {
    hardwaresController.buscarEquipamentosEmpresa(req, res);
});

router.get("/buscarEqId/:idEquipamento", function (req, res) {
    hardwaresController.buscarEquipamentoPorId(req, res);
});

router.post("/cadastrar", function (req, res) {
    hardwaresController.cadastrarEquipamento(req, res);
});

router.put("/atualizar/:idEquipamento", function (req, res) {
    hardwaresController.atualizarEquipamento(req, res);
});

router.delete("/deletarEq/:idEmpresa/:idEquipamento", function(req, res){
    hardwaresController.deletarEquipamento(req, res);
});

module.exports = router;