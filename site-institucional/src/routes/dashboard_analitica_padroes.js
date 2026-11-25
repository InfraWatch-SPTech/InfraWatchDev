var express = require('express');
var router = express.Router();
var controller = require('../controllers/dash_matheus_controller');

router.get('/servidores', controller.listarServidores);
router.get('/dados', controller.buscarDados);

module.exports = router;