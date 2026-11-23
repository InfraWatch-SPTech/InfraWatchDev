var model = require('../models/dash_matheus_model');
var services = require('../services/dash_matheus_metricas');

function getDados(req, res) {
    var idEmpresa = verificarSessao(req, res);

    if (idEmpresa == null) {
        return;
    }
    return res.json({
        "status": "ok",
        "mensagem": "ainda não implementado"
    });
}

function verificarSessao(req, res) {
    if (req.session.usuario == undefined) {
        return res.status(401).json({ "status": "error", "mensagem": "Sessão inválida" });

        return null;
    }

    return req.session.usuario.idEmpresa;
}

module.exports = {getDados};