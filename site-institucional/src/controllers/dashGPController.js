var dashGPModel = require("../models/dashGPModel");

function buscarEquipeServidores(req, res) {
    let idEmpresa = req.params.idEmpresa;
    
    dashGPModel
        .buscarEquipeServidores(idEmpresa)
        .then(function (resultado) {
            res.status(200).json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json(erro.sqlMessage || erro.message);
        });
}

function buscarMtbfSemanal(req, res) {
    let idEmpresa = req.params.idEmpresa;
    
    dashGPModel
        .buscarMtbfSemanal(idEmpresa)
        .then(function (resultado) {
            res.status(200).json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json(erro.sqlMessage || erro.message);
        });
}

function atualizarMtbf(req, res) {
    let idEmpresa = req.body.idEmpresa;
    let mtbf = req.body.mtbf;
    
    if (idEmpresa == undefined) {
        res.status(400).send("O idEmpresa está undefined!");
    } else if (mtbf == undefined) {
        res.status(400).send("O mtbf está undefined!");
    } else {
        dashGPModel.
        atualizarMtbf(idEmpresa, mtbf)
            .then(
                function (resultado) {
                    res.json(resultado);
                }
            )
            .catch(
                function (erro) {
                    console.log(erro);
                    console.log("Houve um erro ao tentar atualizar o mtbf: ", erro.sqlMessage);
                    res.status(500).json(erro.sqlMessage);
                }
            );
    }
}

module.exports = {
    buscarEquipeServidores,
    buscarMtbfSemanal,
    atualizarMtbf
};
