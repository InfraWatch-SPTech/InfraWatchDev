var express = require("express");
var router = express.Router();
var path = require("path");

router.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "..", "..", "/public", "main.html"));
});

// Nova Página Inicial pós-login 
router.get("/inicio", function (req, res) { 
    res.sendFile(path.join(__dirname, "..", "..", "/public", "pagina-inicial.html")); });

module.exports = router;