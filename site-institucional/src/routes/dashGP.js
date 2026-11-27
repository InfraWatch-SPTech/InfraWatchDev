let express = require("express");
let router = express.Router();

let dashGPController = require("../controllers/dashGPController");

router.get("/buscarEquipeServidores/:idEmpresa", function (req, res) {
    dashGPController.buscarEquipeServidores(req, res);
});

module.exports = router;