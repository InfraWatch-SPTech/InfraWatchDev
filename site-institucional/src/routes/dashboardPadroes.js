var express = require('express');
var router = express.Router();

var controller = require('../controllers/dash_matheus_controller');

router.get('/dados', controller.getDados);



module.exports = router;
