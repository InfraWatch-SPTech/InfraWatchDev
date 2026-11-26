var express = require('express');
var router = express.Router();

var controller = require('../controllers/dashboard_analitica_padroes_controller');

router.get('/servidores', controller.listarServidores);
router.get('/dados', controller.buscarDados);

module.exports = router;