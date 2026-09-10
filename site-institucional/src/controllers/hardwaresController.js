let hardwaresModel = require("../models/hardwaresModel");

function buscarEquipamentosEmpresa(req, res) {

    let idEmpresa = req.params.idEmpresa;
    hardwaresModel.buscarEquipamentosEmpresa(idEmpresa)
        .then(function (resultado) {

            if (resultado.length > 0) {
                res.status(200).json(resultado);
            } else {
                res.status(204).send("Nenhum resultado encontrado!");
            }

        })
        .catch(function (erro) {

            console.log(erro);
            console.log("Houve um erro ao buscar os equipamentos.", erro.sqlMessage);

            res.status(500).json(erro.sqlMessage);
        });
}

function cadastrarEquipamento(req, res) {

    let nome = req.body.nome;
    let tipo = req.body.tipo;
    let localizacao = req.body.localizacao;
    let descricao = req.body.descricao || "";
    let fkEmpresa = req.body.fkEmpresa;
    let componentesSelecionados = req.body.componentes;

    if (nome == undefined) {
        res.status(400).send("O nome do dispositivo é obrigatório!");
    } else if (tipo == undefined) {
        res.status(400).send("O tipo de dispositivo é obrigatório!");
    } else if (localizacao == undefined) {
        res.status(400).send("A localização/setor é obrigatória!");
    } else if (fkEmpresa == undefined) {
        res.status(400).send("A empresa do equipamento não foi informada!");
    } else {

        hardwaresModel.cadastrarEquipamento(nome, tipo, localizacao, descricao, fkEmpresa)
            .then(function (resultadoEquipamento) {

                let idEquipamento = resultadoEquipamento.insertId;

                if (!componentesSelecionados || componentesSelecionados.length === 0) {
                    res.status(201).json({ idEquipamento: idEquipamento });
                    return;
                }

                hardwaresModel.cadastrarComponentes(componentesSelecionados, idEquipamento)
                    .then(function () {
                        res.status(201).json({ idEquipamento: idEquipamento });
                    })
                    .catch(function (erro) {
                        console.log(erro);
                        console.log("Houve um erro ao cadastrar os componentes.", erro.sqlMessage);
                        res.status(500).json(erro.sqlMessage);
                    });

            })
            .catch(function (erro) {
                console.log(erro);
                console.log("Houve um erro ao cadastrar o equipamento.", erro.sqlMessage);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

function buscarEquipamentoPorId(req, res) {

    let idEquipamento = req.params.idEquipamento;
    hardwaresModel.buscarEquipamentoPorId(idEquipamento)
        .then(function (resultado) {

            if (resultado.length > 0) {
                res.status(200).json(resultado);
            } else {
                res.status(204).send("Nenhum resultado encontrado!");
            }

        })
        .catch(function (erro) {

            console.log(erro);
            console.log("Houve um erro ao buscar o equipamento.", erro.sqlMessage);

            res.status(500).json(erro.sqlMessage);
        });
}

function atualizarEquipamento(req, res) {

    let idEquipamento = req.params.idEquipamento;
    let nome = req.body.nome;
    let tipo = req.body.tipo;
    let localizacao = req.body.localizacao;
    let descricao = req.body.descricao || "";
    let componentesSelecionados = req.body.componentes;

    if (nome == undefined) {
        res.status(400).send("O nome do dispositivo é obrigatório!");
    } else if (tipo == undefined) {
        res.status(400).send("O tipo de dispositivo é obrigatório!");
    } else if (localizacao == undefined) {
        res.status(400).send("A localização/setor é obrigatória!");
    } else {
        hardwaresModel.atualizarEquipamento(idEquipamento, nome, tipo, localizacao, descricao)
            .then(function () {
                return hardwaresModel.deletarComponentesPorEquipamento(idEquipamento);
            })
            .then(function () {
                if (!componentesSelecionados || componentesSelecionados.length === 0) {
                    res.status(200).json({ idEquipamento: idEquipamento });
                    return;
                }
                hardwaresModel.cadastrarComponentes(componentesSelecionados, idEquipamento)
                    .then(function () {
                        res.status(200).json({ idEquipamento: idEquipamento });
                    })
                    .catch(function (erro) {
                        console.log(erro);
                        console.log("Houve um erro ao atualizar os componentes.", erro.sqlMessage);
                        res.status(500).json(erro.sqlMessage);
                    });

            })
            .catch(function (erro) {
                console.log(erro);
                console.log("Houve um erro ao atualizar o equipamento.", erro.sqlMessage);
                res.status(500).json(erro.sqlMessage);
            });
    }
}

function deletarEquipamento(req, res) {

    let idEmpresa = req.params.idEmpresa;
    let idEquipamento = req.params.idEquipamento;

    hardwaresModel.deletarEquipamento(idEmpresa, idEquipamento)
        .then(function (resultado) {

            if (resultado.length > 0) {
                res.status(200).json(resultado);
            } else {
                res.status(204).send("Nenhum resultado encontrado!");
            }

        })
        .catch(function (erro) {

            console.log(erro);
            console.log("Houve um erro ao buscar os equipamentos.", erro.sqlMessage);

            res.status(500).json(erro.sqlMessage);
        });
}

module.exports = {
    cadastrarEquipamento,
    buscarEquipamentosEmpresa,
    buscarEquipamentoPorId,
    atualizarEquipamento,
    deletarEquipamento
};