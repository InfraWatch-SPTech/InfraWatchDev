// EXERCÍCIO — arquivo sem solução.
// Validar sessão e filtros, autorizar empresa/servidor, consultar model e serviços, responder JSON. Não escrever SQL aqui.
var model = require('../models/dash_matheus_model');
var services = require('../services/dash_matheus_metricas');

function getDados(req, res) {
    return res.json({
        "status": "ok",
        "mensagem": "ainda não implementado"
    });
}


module.exports = {getDados};