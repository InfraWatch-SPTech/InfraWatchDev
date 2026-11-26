
var ambiente_processo = process.env.AMBIENTE_PROCESSO || 'desenvolvimento';

var arquivo_env = ambiente_processo === 'producao' ? '.env' : '.env.dev';
var caminho_env = path.join(__dirname, arquivo_env);

require("dotenv").config({ path: require('path').join(__dirname, caminho_env) });

ambiente_processo = process.env.AMBIENTE_PROCESSO || ambiente_processo;
process.env.AMBIENTE_PROCESSO = ambiente_processo;

var express = require("express");
var cors = require("cors");
var path = require("path");
var session = require('express-session');
var crypto = require('crypto');

var PORTA_APP = process.env.APP_PORT || 3333;
var HOST_APP = process.env.APP_HOST || 'localhost';

var app = express();
var segredoSessao = process.env.SESSION_SECRET;
if (!segredoSessao) {
    if (ambiente_processo === 'producao') throw new Error('Configure SESSION_SECRET antes de iniciar em produção.');
    segredoSessao = crypto.randomBytes(32).toString('hex');
    console.warn('Sessão de desenvolvimento: o login expira ao reiniciar o servidor.');
}
app.use(session({
    name: 'infrawatch.sid',
    secret: segredoSessao,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.SESSION_COOKIE_SECURE === 'true', maxAge: 8 * 60 * 60 * 1000 }
}));

var indexRouter = require("./src/routes/index");
var usuarioRouter = require("./src/routes/usuarios");
var hardwaresRouter = require("./src/routes/hardwares");
var relatoriosRouter = require("./src/routes/relatorios");
var dashboardAnaliticaPadroesRouter = require('./src/routes/dashboard_analitica_padroes');

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
app.use('/dashboard_analitica_padroes', dashboardAnaliticaPadroesRouter);

app.post('/sessao/sair', function(req, res) {
    req.session.destroy(function(erro) {
        if (erro) return res.status(500).json({ erro: 'Não foi possível encerrar a sessão.' });
        res.clearCookie('infrawatch.sid', { path: '/' });
        res.status(204).end();
    });
});

if (require.main === module) app.listen(PORTA_APP, function () {
    console.log(
        "Servidor rodando em http://" +
        HOST_APP + ":" + PORTA_APP
    );

    console.log("Ambiente: " + ambiente_processo);
});

module.exports = app;
