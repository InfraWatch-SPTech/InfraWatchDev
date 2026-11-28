const padroesModel = require('../models/padroesModel');

async function buscarDados(req, res) {
    res.set('Cache-Control', 'no-store');

    const usuario = req.session?.usuario;

    if (!usuario?.id || !usuario.idEmpresa) {
        return res.status(401).json({
            erro: 'Entre novamente no sistema para acessar a dashboard.'
        });
    }

    try {
        const empresa = await padroesModel.buscarEmpresaAutorizada(
            usuario.id,
            usuario.idEmpresa
        );

        if (!empresa) {
            return res.status(403).json({
                erro: 'Você não possui acesso à dashboard de padrões desta empresa.'
            });
        }

        const dados = await padroesModel.buscarDadosPadroes(empresa.nome);

        return res.status(200).json(dados);
    } catch (erro) {
        console.error('Erro ao carregar a dashboard de padrões:', erro.message);

        if ([404, 422, 502, 503].includes(erro.status)) {
            return res.status(erro.status).json({ erro: erro.message });
        }

        return res.status(500).json({
            erro: 'Erro interno ao carregar a dashboard de padrões.'
        });
    }
}

module.exports = { buscarDados };