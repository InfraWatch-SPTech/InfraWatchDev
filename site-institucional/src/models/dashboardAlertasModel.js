// Importando o arquivo de configuração do banco de dados
// Esse arquivo contém a função responsável por executar comandos SQL
var database = require("../database/config");



// Retorna o filtro de datas com base no período selecionado
function montarFiltroPeriodo(periodo, campoData)
{
  var campo = campoData || 'a.criado_em';

  if (periodo === '7d')
  {
    return ` AND ${campo} >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) `;
  }

  if (periodo === '30d')
  {
    return ` AND ${campo} >= DATE_SUB(CURDATE(), INTERVAL 29 DAY) `;
  }

  return ` AND ${campo} >= CURDATE() `;
}



// Função que retorna a quantidade de alertas críticos em aberto da empresa
function kpiCriticosAbertos(fkEmpresa, periodo)
{
  var filtroPeriodo = montarFiltroPeriodo(periodo, 'a.criado_em');

  var instrucaoSql = `
    SELECT COUNT(*) AS criticos_abertos
    FROM alerta a
    JOIN equipamento e
      ON e.idEquipamento = a.fkEquipamento
    WHERE e.fkEmpresa = ${fkEmpresa}
      AND a.tipo_alerta = 'CRITICO'
      AND a.resolvido_em IS NULL
      ${filtroPeriodo};
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
function kpiForaSla(fkEmpresa, periodo)
{
  var filtroPeriodo = montarFiltroPeriodo(periodo, 'a.criado_em');

  var instrucaoSql = `
    SELECT COUNT(*) AS fora_sla
    FROM alerta a
    JOIN equipamento e
      ON e.idEquipamento = a.fkEquipamento
    JOIN empresa emp
      ON emp.idEmpresa = e.fkEmpresa
    WHERE e.fkEmpresa = ${fkEmpresa}
      AND TIMESTAMPDIFF(MINUTE, a.criado_em, COALESCE(a.resolvido_em, NOW())) > emp.sla_resolucao
      ${filtroPeriodo};
  `;

  // COUNT(*) -> conta quantos alertas estão fora do SLA
  // TIMESTAMPDIFF(MINUTE, a.criado_em, COALESCE(a.resolvido_em, NOW())) -> calcula o tempo do alerta em minutos
  // COALESCE(a.resolvido_em, NOW()) -> usa a data de resolução ou a hora atual se ainda estiver aberto
  // > emp.sla_resolucao -> retorna somente alertas que passaram do SLA da empresa

  // Exibe a query montada no terminal
  console.log("Executando a instrução SQL: \n" + instrucaoSql);

  // Executa a query no banco e retorna o resultado
  return database.executar(instrucaoSql);
}



// Função que retorna o tempo medio de resolução dos alertas da empresa
function kpiTempoMedio(fkEmpresa, periodo)
{
  var filtroPeriodo = montarFiltroPeriodo(periodo, 'a.criado_em');

  var instrucaoSql = `
    SELECT ROUND(AVG(TIMESTAMPDIFF(MINUTE, a.criado_em, a.resolvido_em)), 0) AS tempo_medio
    FROM alerta a
    JOIN equipamento e
      ON e.idEquipamento = a.fkEquipamento
    WHERE e.fkEmpresa = ${fkEmpresa}
      AND a.resolvido_em IS NOT NULL
      ${filtroPeriodo};
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
function kpiAbertos(fkEmpresa, periodo)
{
  var filtroPeriodo = montarFiltroPeriodo(periodo, 'a.criado_em');

  var instrucaoSql = `
    SELECT COUNT(*) AS alertas_abertos
    FROM alerta a
    JOIN equipamento e
      ON e.idEquipamento = a.fkEquipamento
    WHERE e.fkEmpresa = ${fkEmpresa}
      AND a.resolvido_em IS NULL
      ${filtroPeriodo};
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
function graficoOndeEstao(fkEmpresa, periodo)
{
  var filtroPeriodo = montarFiltroPeriodo(periodo, 'a.criado_em');

  var instrucaoSql = `
    SELECT
      c.nome AS componente,
      COALESCE(SUM(CASE WHEN a.tipo_alerta = 'CRITICO' THEN 1 ELSE 0 END), 0) AS critico,
      COALESCE(SUM(CASE WHEN a.tipo_alerta = 'ATENCAO' THEN 1 ELSE 0 END), 0) AS atencao,
      COALESCE(COUNT(a.id_alerta), 0) AS total
    FROM equipamento e
    JOIN parametro_alerta p
      ON p.fkEquipamento = e.idEquipamento
    JOIN componente c
      ON c.idComponente = p.fkComponente
    LEFT JOIN alerta a
      ON a.fkEquipamento = e.idEquipamento
     AND a.fkComponente = p.fkComponente
     AND a.resolvido_em IS NULL
     ${filtroPeriodo}
    WHERE e.fkEmpresa = ${fkEmpresa}
    GROUP BY c.nome
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
function graficoFluxo(fkEmpresa, periodo)
{
  var filtroCriados = montarFiltroPeriodo(periodo, 'a.criado_em');
  var filtroResolvidos = montarFiltroPeriodo(periodo, 'a.resolvido_em');
  var agrupamentoCriados = 'DATE_FORMAT(a.criado_em, "%d/%m %Hh")';
  var agrupamentoResolvidos = 'DATE_FORMAT(a.resolvido_em, "%d/%m %Hh")';
  var ordemCriados = 'DATE_FORMAT(a.criado_em, "%Y-%m-%d %H:00:00")';
  var ordemResolvidos = 'DATE_FORMAT(a.resolvido_em, "%Y-%m-%d %H:00:00")';

  if (periodo === '7d')
  {
    agrupamentoCriados = 'DATE_FORMAT(a.criado_em, "%d/%m")';
    agrupamentoResolvidos = 'DATE_FORMAT(a.resolvido_em, "%d/%m")';
    ordemCriados = 'DATE(a.criado_em)';
    ordemResolvidos = 'DATE(a.resolvido_em)';
  }

  if (periodo === '30d')
  {
    agrupamentoCriados = 'CONCAT(DATE_FORMAT(DATE_SUB(a.criado_em, INTERVAL WEEKDAY(a.criado_em) DAY), "%d/%m"), "–", DATE_FORMAT(DATE_ADD(DATE_SUB(a.criado_em, INTERVAL WEEKDAY(a.criado_em) DAY), INTERVAL 6 DAY), "%d/%m"))';
    agrupamentoResolvidos = 'CONCAT(DATE_FORMAT(DATE_SUB(a.resolvido_em, INTERVAL WEEKDAY(a.resolvido_em) DAY), "%d/%m"), "–", DATE_FORMAT(DATE_ADD(DATE_SUB(a.resolvido_em, INTERVAL WEEKDAY(a.resolvido_em) DAY), INTERVAL 6 DAY), "%d/%m"))';
    ordemCriados = 'DATE_SUB(a.criado_em, INTERVAL WEEKDAY(a.criado_em) DAY)';
    ordemResolvidos = 'DATE_SUB(a.resolvido_em, INTERVAL WEEKDAY(a.resolvido_em) DAY)';
  }

  var instrucaoSql = `
    SELECT
      periodo,
      ordem,
      SUM(criados) AS criados,
      SUM(resolvidos) AS resolvidos
    FROM (
      SELECT
        ${agrupamentoCriados} AS periodo,
        ${ordemCriados} AS ordem,
        COUNT(*) AS criados,
        0 AS resolvidos
      FROM alerta a
      JOIN equipamento e
        ON e.idEquipamento = a.fkEquipamento
      WHERE e.fkEmpresa = ${fkEmpresa}
        ${filtroCriados}
      GROUP BY periodo, ordem

      UNION ALL

      SELECT
        ${agrupamentoResolvidos} AS periodo,
        ${ordemResolvidos} AS ordem,
        0 AS criados,
        COUNT(*) AS resolvidos
      FROM alerta a
      JOIN equipamento e
        ON e.idEquipamento = a.fkEquipamento
      WHERE e.fkEmpresa = ${fkEmpresa}
        AND a.resolvido_em IS NOT NULL
        ${filtroResolvidos}
      GROUP BY periodo, ordem
    ) fluxo
    GROUP BY periodo, ordem
    ORDER BY ordem;
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
function graficoMttr(fkEmpresa, periodo)
{
  var filtroPeriodo = montarFiltroPeriodo(periodo, 'a.criado_em');

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
      ${filtroPeriodo}
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
function filaAtencao(fkEmpresa, periodo)
{
  var filtroPeriodo = montarFiltroPeriodo(periodo, 'a.criado_em');

  var instrucaoSql = `
    SELECT
      a.jira_key,
      e.nome AS equipamento,
      c.nome AS componente,
      a.tipo_alerta,
      a.status_alerta,
      TIMESTAMPDIFF(MINUTE, a.criado_em, NOW()) AS minutos_em_aberto,
      TIMESTAMPDIFF(MINUTE, a.criado_em, NOW()) - emp.sla_resolucao AS minutos_estourados
    FROM alerta a
    JOIN equipamento e
      ON e.idEquipamento = a.fkEquipamento
    JOIN empresa emp
      ON emp.idEmpresa = e.fkEmpresa
    JOIN componente c
      ON c.idComponente = a.fkComponente
    WHERE e.fkEmpresa = ${fkEmpresa}
      AND a.resolvido_em IS NULL
      AND TIMESTAMPDIFF(MINUTE, a.criado_em, NOW()) > emp.sla_resolucao
      ${filtroPeriodo}
    ORDER BY minutos_estourados DESC, a.criado_em DESC
    LIMIT 5;
  `;

  // a.jira_key -> chave do alerta para identificação na fila
  // TIMESTAMPDIFF(MINUTE, a.criado_em, NOW()) -> calcula há quanto tempo o alerta está aberto
  // minutos_em_aberto - emp.sla_resolucao -> calcula quantos minutos passaram do SLA
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
