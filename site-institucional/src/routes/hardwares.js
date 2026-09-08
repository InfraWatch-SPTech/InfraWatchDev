let express = require("express");
let router = express.Router();

let hardwaresController = require("../controllers/hardwaresController");

router.get("/buscarEq/:idEmpresa", function (req, res) {
    hardwaresController.buscarEquipamentosEmpresa(req, res);
});

router.post("/cadastrar", function (req, res) {
    hardwaresController.cadastrarEquipamento(req, res);
});

module.exports = router;