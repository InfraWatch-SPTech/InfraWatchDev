var dashModel = require("../models/dashModel");

// usuario
    //semanal
function buscarDadosGraficoSemanalUsuario(req, res) {

    const limite_linhas_semanal = 7;
    console.log(`Recuperando as ultimas ${limite_linhas_semanal} medidas`);

    dashModel.buscarDadosGraficoSemanalUsuario(limite_linhas_semanal).then(function (resultado) {
        if (resultado.length > 0) {
            res.status(200).json(resultado);
        } else {
            res.status(204).send("Nenhum resultado encontrado!")
        }
    }).catch(function (erro) {
        console.log(erro);
        console.log("Houve um erro ao buscar as ultimas medidas.", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    });
}

function atualizarDadosGraficoSemanalUsuario(req, res) {

    console.log(`Recuperando medidas em tempo real`);

    dashModel.atualizarDadosGraficoSemanalUsuario().then(function (resultado) {
        if (resultado.length > 0) {
            res.status(200).json(resultado);
        } else {
            res.status(204).send("Nenhum resultado encontrado!")
        }
    }).catch(function (erro) {
        console.log(erro);
        console.log("Houve um erro ao buscar as ultimas medidas.", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    });
}

    //mensal
function buscarDadosGraficoMensalUsuario(req, res) {

    const limite_linhas_Mensal = 12;

    console.log(`Recuperando as ultimas ${limite_linhas_Mensal} medidas`);

    dashModel.buscarDadosGraficoMensalUsuario(limite_linhas_Mensal).then(function (resultado) {
        if (resultado.length > 0) {
            res.status(200).json(resultado);
        } else {
            res.status(204).send("Nenhum resultado encontrado!")
        }
    }).catch(function (erro) {
        console.log(erro);
        console.log("Houve um erro ao buscar as ultimas medidas.", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    });
}

function atualizarDadosGraficoMensalUsuario(req, res) {

    console.log(`Recuperando medidas em tempo real`);

    dashModel.atualizarDadosGraficoMensalUsuario().then(function (resultado) {
        if (resultado.length > 0) {
            res.status(200).json(resultado);
        } else {
            res.status(204).send("Nenhum resultado encontrado!")
        }
    }).catch(function (erro) {
        console.log(erro);
        console.log("Houve um erro ao buscar as ultimas medidas.", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    });
}

// quiz
    //semanal
function buscarDadosGraficoSemanalQuiz(req, res) {

    const limite_linhas_semanal = 7;
    console.log(`Recuperando as ultimas ${limite_linhas_semanal} medidas`);

    dashModel.buscarDadosGraficoSemanalQuiz(limite_linhas_semanal).then(function (resultado) {
        if (resultado.length > 0) {
            res.status(200).json(resultado);
        } else {
            res.status(204).send("Nenhum resultado encontrado!")
        }
    }).catch(function (erro) {
        console.log(erro);
        console.log("Houve um erro ao buscar as ultimas medidas.", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    });
}

function atualizarDadosGraficoSemanalQuiz(req, res) {

    console.log(`Recuperando medidas em tempo real`);

    dashModel.atualizarDadosGraficoSemanalQuiz().then(function (resultado) {
        if (resultado.length > 0) {
            res.status(200).json(resultado);
        } else {
            res.status(204).send("Nenhum resultado encontrado!")
        }
    }).catch(function (erro) {
        console.log(erro);
        console.log("Houve um erro ao buscar as ultimas medidas.", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    });
}

    //mensal
function buscarDadosGraficoMensalQuiz(req, res) {

    const limite_linhas_Mensal = 12;

    console.log(`Recuperando as ultimas ${limite_linhas_Mensal} medidas`);

    dashModel.buscarDadosGraficoMensalQuiz(limite_linhas_Mensal).then(function (resultado) {
        if (resultado.length > 0) {
            res.status(200).json(resultado);
        } else {
            res.status(204).send("Nenhum resultado encontrado!")
        }
    }).catch(function (erro) {
        console.log(erro);
        console.log("Houve um erro ao buscar as ultimas medidas.", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    });
}

function atualizarDadosGraficoMensalQuiz(req, res) {

    console.log(`Recuperando medidas em tempo real`);

    dashModel.atualizarDadosGraficoMensalQuiz().then(function (resultado) {
        if (resultado.length > 0) {
            res.status(200).json(resultado);
        } else {
            res.status(204).send("Nenhum resultado encontrado!")
        }
    }).catch(function (erro) {
        console.log(erro);
        console.log("Houve um erro ao buscar as ultimas medidas.", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    });
}

// especifico
    // quiz mais jogado
function buscarDadosGraficoPrincipalQuiz(req, res) {

    const limite_linhas_Mensal = 7;

    console.log(`Recuperando as ultimas ${limite_linhas_Mensal} medidas`);

    dashModel.buscarDadosGraficoPrincipalQuiz(limite_linhas_Mensal).then(function (resultado) {
        if (resultado.length > 0) {
            res.status(200).json(resultado);
        } else {
            res.status(204).send("Nenhum resultado encontrado!")
        }
    }).catch(function (erro) {
        console.log(erro);
        console.log("Houve um erro ao buscar as ultimas medidas.", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    });
}

function atualizarDadosGraficoPrincipalQuiz(req, res) {

    console.log(`Recuperando medidas em tempo real`);

    dashModel.atualizarDadosGraficoPrincipalQuiz().then(function (resultado) {
        if (resultado.length > 0) {
            res.status(200).json(resultado);
        } else {
            res.status(204).send("Nenhum resultado encontrado!")
        }
    }).catch(function (erro) {
        console.log(erro);
        console.log("Houve um erro ao buscar as ultimas medidas.", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    });
}
    // me´dia de acertos quiz
function buscarDadosGraficoMediaQuiz(req, res) {

    const limite_linhas_Mensal = 7;

    console.log(`Recuperando as ultimas ${limite_linhas_Mensal} medidas`);

    dashModel.buscarDadosGraficoMediaQuiz(limite_linhas_Mensal).then(function (resultado) {
        if (resultado.length > 0) {
            res.status(200).json(resultado);
        } else {
            res.status(204).send("Nenhum resultado encontrado!")
        }
    }).catch(function (erro) {
        console.log(erro);
        console.log("Houve um erro ao buscar as ultimas medidas.", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    });
}

function atualizarDadosGraficoMediaQuiz(req, res) {

    console.log(`Recuperando medidas em tempo real`);

    dashModel.atualizarDadosGraficoMediaQuiz().then(function (resultado) {
        if (resultado.length > 0) {
            res.status(200).json(resultado);
        } else {
            res.status(204).send("Nenhum resultado encontrado!")
        }
    }).catch(function (erro) {
        console.log(erro);
        console.log("Houve um erro ao buscar as ultimas medidas.", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    });
}

function obterKPIs(req, res) {

    // kpis
    dashModel.obterKPIs().then(function (resultado) {
        if (resultado.length > 0) {
            res.status(200).json(resultado);
        } else {
            res.status(204).send("Nenhum resultado encontrado!")
        }
    }).catch(function (erro) {
        console.log(erro);
        console.log("Houve um erro ao buscar as ultimas medidas.", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    });
}

function obterKPIQuiz(req, res) {

    // kpis
    dashModel.obterKPIQuiz().then(function (resultado) {
        if (resultado.length > 0) {
            res.status(200).json(resultado);
        } else {
            res.status(204).send("Nenhum resultado encontrado!")
        }
    }).catch(function (erro) {
        console.log(erro);
        console.log("Houve um erro ao buscar as ultimas medidas.", erro.sqlMessage);
        res.status(500).json(erro.sqlMessage);
    });
}


module.exports = {
    buscarDadosGraficoSemanalUsuario,
    atualizarDadosGraficoSemanalUsuario,
    buscarDadosGraficoMensalUsuario,
    atualizarDadosGraficoMensalUsuario,
    buscarDadosGraficoSemanalQuiz,
    atualizarDadosGraficoSemanalQuiz,
    buscarDadosGraficoMensalQuiz,
    atualizarDadosGraficoMensalQuiz,
    buscarDadosGraficoPrincipalQuiz,
    atualizarDadosGraficoPrincipalQuiz,
    buscarDadosGraficoMediaQuiz,
    atualizarDadosGraficoMediaQuiz,
    obterKPIs,
    obterKPIQuiz
}