var hardwaresModel = require("../models/hardwaresModel");

function buscarEquipamentosEmpresa(req, res) {

    var idEmpresa = req.params.idEmpresa;
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

module.exports = {
    buscarEquipamentosEmpresa
};