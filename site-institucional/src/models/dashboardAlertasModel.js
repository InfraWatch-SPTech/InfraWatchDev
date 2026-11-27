// Importando o arquivo de configuração do banco de dados
// Esse arquivo contém a função responsável por executar comandos SQL
var database = require("../database/config");



// Função que retorna a quantidade de alertas críticos em aberto da empresa
function kpiCriticosAbertos(fkEmpresa)
{
  var instrucaoSql = `
    SELECT COUNT(*) AS criticos_abertos
    FROM alerta a
    JOIN equipamento e
      ON e.idEquipamento = a.fkEquipamento
    WHERE e.fkEmpresa = ${fkEmpresa}
      AND a.tipo_alerta = 'CRITICO'
      AND a.resolvido_em IS NULL;
  `;

  // COUNT(*) -> conta quantos alertas existem na consulta
  // JOIN equipamento -> pega somente os alertas dos equipamentos da empresa informada
  // tipo_alerta = 'CRITICO' -> filtra apenas alertas críticos
  // resolvido_em IS NULL -> considera apenas alertas ainda em aberto

  // Exibe a query montada no terminal
  console.log("Executando a instrução SQL: \n" + instrucaoSql);

  // Executa a query no banco e retorna o resultado
  return database.executar(instrucaoSql);
}



// Função que retorna a quantidade de alertas fora do SLA da empresa
function kpiForaSla(fkEmpresa)
{
  var instrucaoSql = `
    SELECT COUNT(*) AS fora_sla
    FROM alerta a
    JOIN equipamento e
      ON e.idEquipamento = a.fkEquipamento
    WHERE e.fkEmpresa = ${fkEmpresa}
      AND TIMESTAMPDIFF(MINUTE, a.criado_em, COALESCE(a.resolvido_em, NOW())) > e.sla_resolucao;
  `;

  // COUNT(*) -> conta quantos alertas estão fora do SLA
  // TIMESTAMPDIFF(MINUTE, a.criado_em, COALESCE(a.resolvido_em, NOW())) -> calcula o tempo do alerta em minutos
  // COALESCE(a.resolvido_em, NOW()) -> usa a data de resolução ou a hora atual se ainda estiver aberto
  // > e.sla_resolucao -> retorna somente alertas que passaram do SLA da empresa/equipamento

  // Exibe a query montada no terminal
  console.log("Executando a instrução SQL: \n" + instrucaoSql);

  // Executa a query no banco e retorna o resultado
  return database.executar(instrucaoSql);
}



// Função que retorna o tempo medio de resolução dos alertas da empresa
function kpiTempoMedio(fkEmpresa)
{
  var instrucaoSql = `
    SELECT ROUND(AVG(TIMESTAMPDIFF(MINUTE, a.criado_em, a.resolvido_em)), 0) AS tempo_medio
    FROM alerta a
    JOIN equipamento e
      ON e.idEquipamento = a.fkEquipamento
    WHERE e.fkEmpresa = ${fkEmpresa}
      AND a.resolvido_em IS NOT NULL;
  `;

  // AVG(...) -> calcula a média do tempo de resolução dos alertas
  // TIMESTAMPDIFF(MINUTE, a.criado_em, a.resolvido_em) -> calcula o tempo entre abertura e resolução
  // resolvido_em IS NOT NULL -> considera apenas alertas já resolvidos
  // ROUND(..., 0) -> arredonda o valor para minutos inteiros

  // Exibe a query montada no terminal
  console.log("Executando a instrução SQL: \n" + instrucaoSql);

  // Executa a query no banco e retorna o resultado
  return database.executar(instrucaoSql);
}



// Função que retorna a quantidade de alertas em aberto da empresa
function kpiAbertos(fkEmpresa)
{
  var instrucaoSql = `
    SELECT COUNT(*) AS alertas_abertos
    FROM alerta a
    JOIN equipamento e
      ON e.idEquipamento = a.fkEquipamento
    WHERE e.fkEmpresa = ${fkEmpresa}
      AND a.resolvido_em IS NULL;
  `;

  // COUNT(*) -> conta os alertas em aberto
  // resolvido_em IS NULL -> considera somente alertas ainda não resolvidos
  // JOIN equipamento -> garante que a contagem fique limitada à empresa informada

  // Exibe a query montada no terminal
  console.log("Executando a instrução SQL: \n" + instrucaoSql);

  // Executa a query no banco e retorna o resultado
  return database.executar(instrucaoSql);
}



// Função que retorna onde estão os alertas em aberto da empresa
function graficoOndeEstao(fkEmpresa)
{
  var instrucaoSql = `
    SELECT
      c.nome AS componente,
      a.tipo_alerta,
      COUNT(*) AS total
    FROM alerta a
    JOIN equipamento e
      ON e.idEquipamento = a.fkEquipamento
    JOIN componente c
      ON c.idComponente = a.fkComponente
    WHERE e.fkEmpresa = ${fkEmpresa}
      AND a.resolvido_em IS NULL
    GROUP BY c.nome, a.tipo_alerta
    ORDER BY total DESC, c.nome;
  `;

  // c.nome AS componente -> separa os alertas por componente
  // a.tipo_alerta -> separa por severidade do alerta
  // COUNT(*) -> conta quantos alertas existem em cada grupo
  // GROUP BY c.nome, a.tipo_alerta -> agrupa os resultados por componente e tipo
  // ORDER BY total DESC -> mostra primeiro os componentes com mais alertas

  // Exibe a query montada no terminal
  console.log("Executando a instrução SQL: \n" + instrucaoSql);

  // Executa a query no banco e retorna o resultado
  return database.executar(instrucaoSql);
}



// Função que retorna o fluxo de alertas da empresa
function graficoFluxo(fkEmpresa)
{
  var instrucaoSql = `
    SELECT
      periodo,
      SUM(criados) AS criados,
      SUM(resolvidos) AS resolvidos
    FROM (
      SELECT
        DATE_FORMAT(a.criado_em, '%d/%m %Hh') AS periodo,
        COUNT(*) AS criados,
        0 AS resolvidos
      FROM alerta a
      JOIN equipamento e
        ON e.idEquipamento = a.fkEquipamento
      WHERE e.fkEmpresa = ${fkEmpresa}
      GROUP BY DATE_FORMAT(a.criado_em, '%d/%m %Hh')

      UNION ALL

      SELECT
        DATE_FORMAT(a.resolvido_em, '%d/%m %Hh') AS periodo,
        0 AS criados,
        COUNT(*) AS resolvidos
      FROM alerta a
      JOIN equipamento e
        ON e.idEquipamento = a.fkEquipamento
      WHERE e.fkEmpresa = ${fkEmpresa}
        AND a.resolvido_em IS NOT NULL
      GROUP BY DATE_FORMAT(a.resolvido_em, '%d/%m %Hh')
    ) fluxo
    GROUP BY periodo
    ORDER BY MIN(periodo);
  `;

  // UNION ALL -> junta os alertas criados e resolvidos na mesma base de dados
  // DATE_FORMAT(..., '%d/%m %Hh') -> monta o rótulo do período para o gráfico
  // SUM(criados) e SUM(resolvidos) -> soma os valores de cada período
  // GROUP BY periodo -> consolida os alertas por período

  // Exibe a query montada no terminal
  console.log("Executando a instrução SQL: \n" + instrucaoSql);

  // Executa a query no banco e retorna o resultado
  return database.executar(instrucaoSql);
}



// Função que retorna o tempo médio de resolução por componente da empresa
function graficoMttr(fkEmpresa)
{
  var instrucaoSql = `
    SELECT
      c.nome AS componente,
      ROUND(AVG(TIMESTAMPDIFF(MINUTE, a.criado_em, a.resolvido_em)), 0) AS media_minutos
    FROM alerta a
    JOIN equipamento e
      ON e.idEquipamento = a.fkEquipamento
    JOIN componente c
      ON c.idComponente = a.fkComponente
    WHERE e.fkEmpresa = ${fkEmpresa}
      AND a.resolvido_em IS NOT NULL
    GROUP BY c.nome
    ORDER BY media_minutos DESC;
  `;

  // c.nome AS componente -> agrupa o tempo médio por componente
  // AVG(TIMESTAMPDIFF(...)) -> calcula o tempo médio de resolução em minutos
  // resolvido_em IS NOT NULL -> considera apenas alertas já resolvidos
  // ORDER BY media_minutos DESC -> mostra primeiro os componentes com maior tempo médio

  // Exibe a query montada no terminal
  console.log("Executando a instrução SQL: \n" + instrucaoSql);

  // Executa a query no banco e retorna o resultado
  return database.executar(instrucaoSql);
}



// Função que retorna a fila de atenção da empresa
function filaAtencao(fkEmpresa)
{
  var instrucaoSql = `
    SELECT
      a.jira_key,
      e.nome AS equipamento,
      c.nome AS componente,
      a.tipo_alerta,
      a.status_alerta,
      TIMESTAMPDIFF(MINUTE, a.criado_em, NOW()) AS minutos_em_aberto,
      TIMESTAMPDIFF(MINUTE, a.criado_em, NOW()) - e.sla_resolucao AS minutos_estourados
    FROM alerta a
    JOIN equipamento e
      ON e.idEquipamento = a.fkEquipamento
    JOIN componente c
      ON c.idComponente = a.fkComponente
    WHERE e.fkEmpresa = ${fkEmpresa}
      AND a.resolvido_em IS NULL
      AND TIMESTAMPDIFF(MINUTE, a.criado_em, NOW()) > e.sla_resolucao
    ORDER BY minutos_estourados DESC, a.criado_em DESC;
  `;

  // a.jira_key -> chave do alerta para identificação na fila
  // TIMESTAMPDIFF(MINUTE, a.criado_em, NOW()) -> calcula há quanto tempo o alerta está aberto
  // minutos_em_aberto - e.sla_resolucao -> calcula quantos minutos passaram do SLA
  // resolvido_em IS NULL -> retorna apenas alertas ainda em aberto
  // ORDER BY minutos_estourados DESC -> mostra primeiro os mais atrasados

  // Exibe a query montada no terminal
  console.log("Executando a instrução SQL: \n" + instrucaoSql);

  // Executa a query no banco e retorna o resultado
  return database.executar(instrucaoSql);
}



// Exportando as funções do model
// Outros arquivos podem usar essas funções
module.exports =
{
  kpiCriticosAbertos,
  kpiForaSla,
  kpiTempoMedio,
  kpiAbertos,
  graficoOndeEstao,
  graficoFluxo,
  graficoMttr,
  filaAtencao
};
