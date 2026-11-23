var model = require('../models/dash_matheus_model');
var services = require('../services/dash_matheus_metricas');

function falhar(status, mensagem) {
    var erro = new Error(mensagem);
    erro.status = status;
    throw erro;
}

async function autorizar(req) {
    // Identidade vem do cookie assinado, nunca de idUsuario/idEmpresa na URL.
    var usuario = req.session && req.session.usuario;
    if (!usuario) falhar(401, 'Entre novamente no sistema para acessar a dashboard.');
    var acessos = await model.buscarAcesso(usuario.id, usuario.idEmpresa);
    if (!acessos.length) falhar(403, 'Usuário sem acesso a esta empresa.');
    var acesso = acessos[0];
    var permissoes = String(acesso.permissoes || '').split(',');
    var liberado = acesso.nomeNivelAcesso === 'Root' ||
        permissoes.includes('DASHBOARD_PADROES_VISUALIZAR') ||
        permissoes.includes('DASHBOARD_SERVIDOR_VISUALIZAR') ||
        permissoes.includes('DASHBOARD_GERAL_VISUALIZAR');
    if (!liberado) falhar(403, 'Você não possui permissão para visualizar esta dashboard.');
    return usuario.idEmpresa;
}

function converterLimite(valor) {
    if (valor === null || valor === undefined) return null;
    var numero = Number(valor);
    return Number.isFinite(numero) && numero >= 1 && numero <= 100 ? numero : null;
}

function montarServidores(linhas) {
    var servidores = [];

    for (var i = 0; i < linhas.length; i++) {
        var linha = linhas[i];
        var limites = {};
        for (var componente of metricas.COMPONENTES) {
            var atencao = converterLimite(linha[componente + 'Atencao']);
            var critico = converterLimite(linha[componente + 'Critico']);
            limites[componente] = atencao === null && critico === null ? null : {atencao: atencao, critico: critico};
        }
        servidores.push({
            id: String(linha.idEquipamento),
            nome: linha.nome,
            limites: limites
        });
    }
    return servidores;
}


function amostrasDaGold(gold, idEmpresa){
    if (!gold) return {amostras: [], ultimaAtualizacao: null};
    
    
    if(String(gold.empresa_id) !== String(idEmpresa) || !Array.isArray(gold.amostras)){
        falhar(502, 'Gold inválida para a empresa ' + idEmpresa);
    }

    return {amostras: gold.amostras, ultimaAtualizacao: gold.ultima_atualizacao};

}

function responderErro(res, erro) {
    console.error('Dashboard histórica:', erro.status ? erro.message : erro);
    res.status(erro.status || 500).json({ erro: erro.status ? erro.message : 'Erro interno ao consultar a dashboard.' });
}

async function listarServidores(req, res){
    try {
        var idEmpresa = await autorizar(req);
        var servidores = montarServidores(await model.buscarServidores(idEmpresa));
        res.set('Cache-Control', 'no-store').json({ servidores: servidores });
    } catch (erro) {
        responderErro(res, erro);
    }

}

async function buscarDados(req, res) {
    try{
        var idEmpresa = await  autorizar(req);
        var servidores = montarServidores(await model.buscarServidores(idEmpresa));
        if (!servidores.length) falhar(404, 'Nenhum servidor encontrado para a empresa ' + idEmpresa);

        var periodo = Number(req.query.periodo) === 14 ? 14 : 7;
        var gold = amostrasDaGold(await model.lerGold(idEmpresa), idEmpresa);

        var servidorId = String(req.query.servidor || '');
        if (!servidores.some(function(s) { return s.id === servidorId;})){
            var comHistorico = servidores.find(function(s) {
                return gold.amostras.some(function(a) {return a && String(a.servidor_id) === s.id; });
            });
            servidorId = (comHistorico || servidores[0]).id;
        }

        var resposta = metricas.calcularDashboard(servidores, gold.amostras, servidorId, periodo);
        resposta.fonte = process.env.DIRETORIO_GOLD_LOCAL ? 'local' : 's3';
        resposta.gerado_em = gold.gerado_em;
        res.set('Cache-Control', 'no-store').json(resposta);
    } catch (erro) { responderErro(res, erro); }

    
}
module.exports = {
    listarServidores: listarServidores,
    buscarDados: buscarDados
};