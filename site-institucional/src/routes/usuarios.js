var express = require("express");
var router = express.Router();

var usuarioController = require("../controllers/usuarioController");

// Lista usuários somente após confirmar no banco que o solicitante é admin da empresa.
router.get("/", function (req, res) {
    usuarioController.listarUsuariosEmpresa(req, res);
});

router.post("/cadastrar", function (req, res) {
    usuarioController.cadastrar(req, res);
});

router.post("/autenticar", function (req, res) {
    usuarioController.autenticar(req, res);
});

router.put("/:idUsuario/permissao", function (req, res) {
    usuarioController.atualizarPermissao(req, res);
});

module.exports = router;
