var dashGPModel = require("../models/dashGPModel");

function buscarEquipeServidores(req, res) {
    let idEmpresa = req.params.idEmpresa;
    console.log(idEmpresa);
    
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

module.exports = {
    buscarEquipeServidores
};
