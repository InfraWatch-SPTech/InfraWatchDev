var express = require("express");
var router = express.Router();

var hardwaresController = require("../controllers/hardwaresController");

router.get("/buscarEq/:idEmpresa", function (req, res) {
    hardwaresController.buscarEquipamentosEmpresa(req, res);
});

module.exports = router;