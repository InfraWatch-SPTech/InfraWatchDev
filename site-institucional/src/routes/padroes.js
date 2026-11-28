const express = require('express');
const router = express.Router();
const padroesController = require('../controllers/padroesController');

router.get('/', padroesController.buscarDados);

module.exports = router;