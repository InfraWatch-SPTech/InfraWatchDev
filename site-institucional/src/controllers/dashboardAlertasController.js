// Importando o dashboardAlertasModel
// Utilizado para consultar os dados da dashboard no banco
var dashboardAlertasModel = require("../models/dashboardAlertasModel");

// KPI: críticos em aberto da empresa
function kpiCriticosAbertos(req, res)
{
  // id da empresa vindo da URL
  var fkEmpresa = req.params.fkEmpresa;
  var periodo = req.query.periodo || 'hoje';

  if (!dashboardAlertasModel || !dashboardAlertasModel.kpiCriticosAbertos)
  {
    res.status(501).send("Funcionalidade em migração.");
    return;
  }

  // busca no banco os críticos em aberto
  dashboardAlertasModel.kpiCriticosAbertos(fkEmpresa, periodo).then(function (resultado)
  {
    // Verifica se algum registro foi encontrado
    if (resultado.length > 0)
    {
      // Retorna os dados encontrados em JSON
      res.status(200).json(resultado);
      console.log(resultado);
    }

    else
    {
      res.status(204).send("Nenhum resultado encontrado!")
    }
  }).catch(function (erro)
  {
    console.log(erro);
    res.status(500).json(erro.sqlMessage || erro.message);
  });
}



// KPI: alertas fora do SLA da empresa
function kpiForaSla(req, res)
{
  // id da empresa vindo da URL
  var fkEmpresa = req.params.fkEmpresa;
  var periodo = req.query.periodo || 'hoje';

  if (!dashboardAlertasModel || !dashboardAlertasModel.kpiForaSla)
  {
    res.status(501).send("Funcionalidade em migração.");
    return;
  }

  // busca no banco os alertas fora do SLA
  dashboardAlertasModel.kpiForaSla(fkEmpresa, periodo).then(function (resultado)
  {
    // Verifica se algum registro foi encontrado
    if (resultado.length > 0)
    {
      // Retorna os dados encontrados em JSON
      res.status(200).json(resultado);
      console.log(resultado);
    }

    else
    {
      res.status(204).send("Nenhum resultado encontrado!")
    }
  }).catch(function (erro)
  {
    console.log(erro);
    res.status(500).json(erro.sqlMessage || erro.message);
  });
}



// KPI: tempo médio de resolução da empresa
function kpiTempoMedio(req, res)
{
  // id da empresa vindo da URL
  var fkEmpresa = req.params.fkEmpresa;
  var periodo = req.query.periodo || 'hoje';

  if (!dashboardAlertasModel || !dashboardAlertasModel.kpiTempoMedio)
  {
    res.status(501).send("Funcionalidade em migração.");
    return;
  }

  // busca no banco o tempo médio de resolução
  dashboardAlertasModel.kpiTempoMedio(fkEmpresa, periodo).then(function (resultado)
  {
    // Verifica se algum registro foi encontrado
    if (resultado.length > 0)
    {
      // Retorna os dados encontrados em JSON
      res.status(200).json(resultado);
      console.log(resultado);
    }

    else
    {
      res.status(204).send("Nenhum resultado encontrado!")
    }
  }).catch(function (erro)
  {
    console.log(erro);
    res.status(500).json(erro.sqlMessage || erro.message);
  });
}



// KPI: alertas em aberto da empresa
function kpiAbertos(req, res)
{
  // id da empresa vindo da URL
  var fkEmpresa = req.params.fkEmpresa;
  var periodo = req.query.periodo || 'hoje';

  if (!dashboardAlertasModel || !dashboardAlertasModel.kpiAbertos)
  {
    res.status(501).send("Funcionalidade em migração.");
    return;
  }

  // busca no banco os alertas em aberto
  dashboardAlertasModel.kpiAbertos(fkEmpresa, periodo).then(function (resultado)
  {
    // Verifica se algum registro foi encontrado
    if (resultado.length > 0)
    {
      // Retorna os dados encontrados em JSON
      res.status(200).json(resultado);
      console.log(resultado);
    }

    else
    {
      res.status(204).send("Nenhum resultado encontrado!")
    }
  }).catch(function (erro)
  {
    console.log(erro);
    res.status(500).json(erro.sqlMessage || erro.message);
  });
}



// Gráfico: onde estão os alertas em aberto
function graficoOndeEstao(req, res)
{
  // id da empresa vindo da URL
  var fkEmpresa = req.params.fkEmpresa;
  var periodo = req.query.periodo || 'hoje';

  if (!dashboardAlertasModel || !dashboardAlertasModel.graficoOndeEstao)
  {
    res.status(501).send("Funcionalidade em migração.");
    return;
  }

  // busca no banco os dados do gráfico
  dashboardAlertasModel.graficoOndeEstao(fkEmpresa, periodo).then(function (resultado)
  {
    if (resultado.length > 0)
    {
      res.status(200).json(resultado);
    }

    else
    {
      res.status(204).send("Nenhum resultado encontrado!")
    }
  }).catch(function (erro)
  {
    console.log(erro);
    res.status(500).json(erro.sqlMessage || erro.message);
  });
}



// Gráfico: fluxo de alertas por período
function graficoFluxo(req, res)
{
  // id da empresa vindo da URL
  var fkEmpresa = req.params.fkEmpresa;
  var periodo = req.query.periodo || 'hoje';

  if (!dashboardAlertasModel || !dashboardAlertasModel.graficoFluxo)
  {
    res.status(501).send("Funcionalidade em migração.");
    return;
  }

  // busca no banco os dados do fluxo de alertas
  dashboardAlertasModel.graficoFluxo(fkEmpresa, periodo).then(function (resultado)
  {
    if (resultado.length > 0)
    {
      res.status(200).json(resultado);
    }

    else
    {
      res.status(204).send("Nenhum resultado encontrado!")
    }
  }).catch(function (erro)
  {
    console.log(erro);
    res.status(500).json(erro.sqlMessage || erro.message);
  });
}



// Gráfico: tempo médio de resolução x SLA
function graficoMttr(req, res)
{
  // id da empresa vindo da URL
  var fkEmpresa = req.params.fkEmpresa;
  var periodo = req.query.periodo || 'hoje';

  if (!dashboardAlertasModel || !dashboardAlertasModel.graficoMttr)
  {
    res.status(501).send("Funcionalidade em migração.");
    return;
  }

  // busca no banco os dados do tempo médio de resolução
  dashboardAlertasModel.graficoMttr(fkEmpresa, periodo).then(function (resultado)
  {
    if (resultado.length > 0)
    {
      res.status(200).json(resultado);
    }

    else
    {
      res.status(204).send("Nenhum resultado encontrado!")
    }
  }).catch(function (erro)
  {
    console.log(erro);
    res.status(500).json(erro.sqlMessage || erro.message);
  });
}



// Fila de atenção: alertas estourados no SLA
function filaAtencao(req, res)
{
  // id da empresa vindo da URL
  var fkEmpresa = req.params.fkEmpresa;
  var periodo = req.query.periodo || 'hoje';

  if (!dashboardAlertasModel || !dashboardAlertasModel.filaAtencao)
  {
    res.status(501).send("Funcionalidade em migração.");
    return;
  }

  // busca no banco os alertas da fila de atenção
  dashboardAlertasModel.filaAtencao(fkEmpresa, periodo).then(function (resultado)
  {
    if (resultado.length > 0)
    {
      res.status(200).json(resultado);
    }

    else
    {
      res.status(204).send("Nenhum resultado encontrado!")
    }
  }).catch(function (erro)
  {
    console.log(erro);
    res.status(500).json(erro.sqlMessage || erro.message);
  });
}



// Exportando as funções do controller
// Outros arquivos podem usar essas funções
module.exports = {
  kpiCriticosAbertos,
  kpiForaSla,
  kpiTempoMedio,
  kpiAbertos,
  graficoOndeEstao,
  graficoFluxo,
  graficoMttr,
  filaAtencao
};
