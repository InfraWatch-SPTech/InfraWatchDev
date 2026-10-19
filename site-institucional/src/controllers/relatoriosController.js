let relatorioModel = require("../models/relatoriosModel");

function cadastrarRelatorio(req, res) {
    let titulo = req.body.titulo;
    let descricao = req.body.descricao;
    let dataRel = req.body.dataRel;
    let idEquipamento = req.body.idEquipamento;

    if (!titulo || !descricao || !dataRel || !idEquipamento) {
        return res.status(400).send(
            "Preencha o título, a descrição, a data e o equipamento."
        );
    }

    relatorioModel
        .cadastrarRelatorio(titulo, descricao, dataRel, idEquipamento)
        .then(function (resultado) {
            res.status(201).json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json(erro.sqlMessage || erro.message);
        });
}

function buscarRelatorios(req, res) {
    relatorioModel
        .buscarRelatorios()
        .then(function (resultado) {
            res.status(200).json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json(erro.sqlMessage || erro.message);
        });
}

function buscarRelatorioPorId(req, res) {
    let idRelatorio = req.params.idRelatorio;

    relatorioModel
        .buscarRelatorioPorId(idRelatorio)
        .then(function (resultado) {
            if (resultado.length > 0) {
                res.status(200).json(resultado[0]);
            } else {
                res.status(404).send("Relatório não encontrado.");
            }
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json(erro.sqlMessage || erro.message);
        });
}

function atualizarRelatorio(req, res) {
    let idRelatorio = req.params.idRelatorio;
    let titulo = req.body.titulo;
    let descricao = req.body.descricao;
    let dataRel = req.body.dataRel;
    let idEquipamento = req.body.idEquipamento;

    if (!titulo || !descricao || !dataRel || !idEquipamento) {
        return res.status(400).send(
            "Preencha o título, a descrição, a data e o equipamento."
        );
    }

    relatorioModel
        .atualizarRelatorio(
            idRelatorio,
            titulo,
            descricao,
            dataRel,
            idEquipamento
        )
        .then(function (resultado) {
            res.status(200).json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json(erro.sqlMessage || erro.message);
        });
}

function deletarRelatorio(req, res) {
    let idRelatorio = req.params.idRelatorio;

    relatorioModel
        .deletarRelatorio(idRelatorio)
        .then(function (resultado) {
            res.status(200).json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            res.status(500).json(erro.sqlMessage || erro.message);
        });
}

module.exports = {
    cadastrarRelatorio,
    buscarRelatorios,
    buscarRelatorioPorId,
    atualizarRelatorio,
    deletarRelatorio
};