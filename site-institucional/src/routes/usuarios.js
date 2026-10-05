var express = require("express");
var router = express.Router();

var usuarioController = require("../controllers/usuarioController");

router.get("/", function (req, res) {
    usuarioController.listarUsuariosEmpresa(req, res);
});

router.get("/permissoes", function (req, res) {
    usuarioController.listarPermissoes(req, res);
});

router.post("/cadastrar", function (req, res) {
    usuarioController.cadastrar(req, res);
});

router.post("/autenticar", function (req, res) {
    usuarioController.autenticar(req, res);
});

router.put("/:idUsuario/acesso", function (req, res) {
    usuarioController.atualizarAcesso(req, res);
});

module.exports = router;
