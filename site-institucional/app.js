
var ambiente_processo = 'desenvolvimento';

var caminho_env = ambiente_processo === 'producao' ? '.env' : '.env.dev';

require("dotenv").config({ path: caminho_env });

var express = require("express");
var cors = require("cors");
var path = require("path");

var PORTA_APP = process.env.APP_PORT;
var HOST_APP = process.env.APP_HOST;

var app = express();
app.use(express.static(path.join(__dirname, "public")));

var indexRouter = require("./src/routes/index");
var usuarioRouter = require("./src/routes/usuarios");
var hardwaresRouter = require("./src/routes/hardwares");
var relatoriosRouter = require("./src/routes/relatorios");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Disponibiliza os arquivos da pasta public
app.use(express.static(path.join(__dirname, "public")));

// Rotas da aplicação
app.use("/", indexRouter);
app.use("/usuarios", usuarioRouter);
app.use("/hardwares", hardwaresRouter);
app.use("/relatorios", relatoriosRouter);

app.listen(PORTA_APP, function () {
    console.log(
        "Servidor rodando em http://" +
        HOST_APP + ":" + PORTA_APP
    );

    console.log("Ambiente: " + ambiente_processo);
});
