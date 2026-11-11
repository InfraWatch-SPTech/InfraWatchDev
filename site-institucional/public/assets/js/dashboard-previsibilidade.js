const recursosDashboard = {
  cpu: { nome: 'CPU', cor: '#20baf4' },
  ram: { nome: 'Memória RAM', cor: '#ff9f32' },
  disco: { nome: 'Disco', cor: '#20d983' }
};

const estadoDashboard = {
  componente: 'cpu',
  dados: null,
  arquivo: null,
  atualizadoEm: null,
  servidor: null,
  usuario: null,
  limites: {},
  intervalo: null,
  status: 'idle',
  erro: null
};

const eixoTexto = '#aaa8ba';
const eixoComum = {
  ticks: { color: eixoTexto, maxTicksLimit: 8 },
  grid: { color: 'rgba(139,134,155,.12)' },
  border: { color: '#5c6288' }
};

let graficoTendencia;
let graficoRunway;
let graficoPrevisaoCpu;
let graficoPrevisaoLatencia;

function elemento(id) {
  return document.getElementById(id);
}

function numero(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const convertido = Number(String(valor).replace(',', '.'));
  return Number.isFinite(convertido) ? convertido : null;
}

function formatarNumero(valor, casas = 1) {
  const convertido = numero(valor);
  return convertido === null
    ? '—'
    : convertido.toLocaleString('pt-BR', { maximumFractionDigits: casas });
}

function formatarPercentual(valor) {
  const convertido = numero(valor);
  return convertido === null ? '—' : `${formatarNumero(convertido, 2)}%`;
}

function formatarData(valor, incluirHora = true) {
  if (!valor) return 'data não informada';
  const data = new Date(String(valor).replace(' ', 'T'));
  if (Number.isNaN(data.getTime())) return String(valor);
  return data.toLocaleString('pt-BR', incluirHora
    ? { dateStyle: 'short', timeStyle: 'short' }
    : { dateStyle: 'short' });
}

function definirMensagemServidor(texto) {
  elemento('mensagem-servidor').textContent = texto;
}

function mensagemEstadoVazio(mensagemEspecifica) {
  if (estadoDashboard.status === 'loading') return 'Carregando os dados do Gold…';
  if (mensagemEspecifica) return `Erro: ${mensagemEspecifica}`;
  if (estadoDashboard.status === 'missing') return `Erro: ${estadoDashboard.erro || 'nenhum arquivo dash-previsibilidade foi encontrado no Gold para este servidor.'}`;
  if (estadoDashboard.status === 'error') return `Erro: ${estadoDashboard.erro || 'não foi possível consultar os dados do servidor.'}`;
  if (!estadoDashboard.servidor) return estadoDashboard.usuario
    ? 'Erro: selecione um servidor para consultar o Gold.'
    : 'Erro: entre no sistema e selecione um servidor para consultar o Gold.';
  return 'Erro: o Gold não contém dados para este gráfico.';
}

function mostrarEstadoGrafico(canvasId, estadoId, temDados, mensagem) {
  const canvas = elemento(canvasId);
  const estado = elemento(estadoId);
  estado.hidden = Boolean(temDados);
  estado.textContent = temDados ? '' : mensagemEstadoVazio(mensagem);
  canvas.style.visibility = temDados ? 'visible' : 'hidden';
}

function adicionarResumoServidor(rotulo, valor) {
  const item = document.createElement('span');
  const titulo = document.createElement('strong');
  titulo.textContent = `${rotulo}: `;
  item.append(titulo, document.createTextNode(valor || 'Não informado'));
  elemento('servidor-resumo').appendChild(item);
}

function mostrarResumoServidor(servidor) {
  const resumo = elemento('servidor-resumo');
  resumo.replaceChildren();
  adicionarResumoServidor('Servidor', servidor.nomeEquipamento);
  adicionarResumoServidor('ID', servidor.idEquipamento);
  adicionarResumoServidor('IP', servidor.ipEquipamento);
  adicionarResumoServidor('Status', servidor.statusEquipamento);
  adicionarResumoServidor('Localização', servidor.localizacao);
  elemento('contexto-servidor').textContent =
    `${servidor.nomeEquipamento || `Servidor ${servidor.idEquipamento}`} · métricas do arquivo Gold dash-previsibilidade`;
}

function recursoAtual(chave) {
  return estadoDashboard.dados?.recursos?.[chave] || null;
}

function valorAtual(chave, recurso = recursoAtual(chave)) {
  if (!recurso) return null;
  const atual = numero(recurso.atual);
  if (atual !== null) return atual;
  const serie = Array.isArray(recurso.serie_10_minutos) ? recurso.serie_10_minutos : [];
  return serie.length ? numero(serie[serie.length - 1].media) : null;
}

function limiteRecurso(chave, tipo, recurso = recursoAtual(chave)) {
  const campoGold = tipo === 'critico' ? 'limite_critico' : 'limite_atencao';
  const limiteBanco = numero(estadoDashboard.limites[chave]?.[tipo]);
  if (limiteBanco !== null) return limiteBanco;
  return numero(recurso?.[campoGold]);
}

function pontosPrevisao(recurso) {
  return Array.isArray(recurso?.previsao_30_dias)
    ? recurso.previsao_30_dias
      .map(ponto => ({ dia: numero(ponto.dias_a_frente), valor: numero(ponto.estimativa), original: ponto }))
      .filter(ponto => ponto.dia !== null && ponto.valor !== null)
      .sort((a, b) => a.dia - b.dia)
    : [];
}

function previsaoDiaria(recurso, valorInicial) {
  const previsoesGold = pontosPrevisao(recurso)
    .filter(ponto => ponto.dia > 0)
    .map(ponto => ({
      dia: ponto.dia,
      estimativa: ponto.valor,
      faixa_inferior: numero(ponto.original.faixa_inferior),
      faixa_superior: numero(ponto.original.faixa_superior),
      pontoGold: true
    }));
  if (!previsoesGold.length) return [];

  const ancora = numero(valorInicial);
  const pontos = [
    ...(ancora === null ? [] : [{ dia: 0, estimativa: ancora, faixa_inferior: ancora, faixa_superior: ancora }]),
    ...previsoesGold
  ].sort((a, b) => a.dia - b.dia);
  const ultimoDia = Math.floor(previsoesGold[previsoesGold.length - 1].dia);
  const diarias = [];

  for (let dia = 1; dia <= ultimoDia; dia += 1) {
    const pontoGold = previsoesGold.find(ponto => ponto.dia === dia);
    if (pontoGold) {
      diarias.push({ ...pontoGold, dia, interpolada: false });
      continue;
    }

    const anteriores = pontos.filter(ponto => ponto.dia < dia);
    const anterior = anteriores[anteriores.length - 1];
    const seguinte = pontos.find(ponto => ponto.dia > dia);
    if (!anterior || !seguinte) {
      diarias.push({ dia, estimativa: null, faixa_inferior: null, faixa_superior: null, interpolada: false });
      continue;
    }

    const proporcao = (dia - anterior.dia) / (seguinte.dia - anterior.dia);
    const interpolar = campo => {
      if (anterior[campo] === null || seguinte[campo] === null) return null;
      return anterior[campo] + (seguinte[campo] - anterior[campo]) * proporcao;
    };
    diarias.push({
      dia,
      estimativa: interpolar('estimativa'),
      faixa_inferior: interpolar('faixa_inferior'),
      faixa_superior: interpolar('faixa_superior'),
      interpolada: true
    });
  }

  return diarias;
}

function calcularRunwayDias(chave, recurso = recursoAtual(chave)) {
  if (!recurso) return null;
  const atual = valorAtual(chave, recurso);
  const critico = numero(estadoDashboard.limites[chave]?.critico);
  if (atual === null || critico === null) return null;
  if (atual >= critico) return 0;

  const previsoes = pontosPrevisao(recurso);
  let diaAnterior = 0;
  let valorAnterior = atual;
  for (const ponto of previsoes) {
    if (ponto.valor >= critico) {
      const variacao = ponto.valor - valorAnterior;
      if (variacao <= 0) return ponto.dia;
      const fracao = (critico - valorAnterior) / variacao;
      return diaAnterior + ((ponto.dia - diaAnterior) * fracao);
    }
    diaAnterior = ponto.dia;
    valorAnterior = ponto.valor;
  }

  const tendencia = numero(recurso.tendencia_por_dia);
  if (tendencia !== null && tendencia > 0) return (critico - atual) / tendencia;
  return null;
}

function mensagemRunwayIndisponivel() {
  const recursos = Object.keys(recursosDashboard).map(chave => ({
    chave,
    recurso: recursoAtual(chave),
    previsoes: pontosPrevisao(recursoAtual(chave))
  }));
  if (!recursos.some(item => item.previsoes.length)) {
    return 'Erro: o Gold não trouxe pontos numéricos de previsão para CPU, RAM ou disco.';
  }
  if (recursos.some(item => item.previsoes.length && numero(estadoDashboard.limites[item.chave]?.critico) === null)) {
    return 'Erro: o limite crítico de um recurso não foi retornado pelo banco.';
  }
  if (recursos.some(item => item.previsoes.length && valorAtual(item.chave, item.recurso) === null)) {
    return 'Erro: o Gold não trouxe o valor atual necessário para calcular o runway.';
  }
  return 'A previsão disponível não cruza o limite crítico e não indica crescimento para estimar uma data.';
}

function listaRecursosComValor() {
  return Object.keys(recursosDashboard).map(chave => {
    const recurso = recursoAtual(chave);
    return {
      chave,
      recurso,
      atual: valorAtual(chave, recurso),
      atencao: limiteRecurso(chave, 'atencao', recurso),
      critico: limiteRecurso(chave, 'critico', recurso)
    };
  }).filter(item => item.recurso && item.atual !== null);
}

function corDeEstado(item) {
  if (item.critico !== null && item.atual >= item.critico) return 'vermelho';
  if (item.atencao !== null && item.atual >= item.atencao) return 'amarelo';
  return item.critico !== null || item.atencao !== null ? 'verde' : 'azul';
}

function definirKpi(valorId, descricaoId, valor, descricao, classe) {
  const campoValor = elemento(valorId);
  campoValor.textContent = valor;
  campoValor.className = classe || 'azul';
  elemento(descricaoId).textContent = descricao;
}

function atualizarKpis() {
  const dados = estadoDashboard.dados;
  if (!dados) {
    const erro = mensagemEstadoVazio();
    definirKpi('kpi-maior-uso', 'kpi-maior-uso-descricao', 'N/D', erro, 'azul');
    definirKpi('kpi-proximo-limite', 'kpi-proximo-limite-descricao', 'N/D', erro, 'azul');
    definirKpi('kpi-requisicoes', 'kpi-requisicoes-descricao', 'N/D', 'Erro: sem métricas HTTP no Gold.', 'azul');
    definirKpi('kpi-sla', 'kpi-sla-descricao', 'N/D', 'Sem resposta do Gold.', 'azul');
    elemento('status-sla-texto').textContent = 'SLA: indisponível no Gold';
    elemento('status-sla').classList.add('indisponivel');
    return;
  }

  const recursos = listaRecursosComValor();
  const maiorUso = recursos.sort((a, b) => b.atual - a.atual)[0];
  if (maiorUso) {
    let descricao = recursosDashboard[maiorUso.chave].nome;
    if (maiorUso.critico !== null) descricao += ` · limite crítico ${formatarPercentual(maiorUso.critico)}`;
    else descricao += ' · limite crítico não informado';
    definirKpi('kpi-maior-uso', 'kpi-maior-uso-descricao', formatarPercentual(maiorUso.atual), descricao, corDeEstado(maiorUso));
  } else {
    definirKpi('kpi-maior-uso', 'kpi-maior-uso-descricao', 'N/D', 'Sem valores de uso para CPU, RAM ou disco.', 'azul');
  }

  const runways = Object.keys(recursosDashboard).map(chave => {
    const recurso = recursoAtual(chave);
    return { chave, recurso, dias: calcularRunwayDias(chave, recurso) };
  }).filter(item => item.dias !== null && item.dias >= 0);
  runways.sort((a, b) => a.dias - b.dias);
  if (runways.length) {
    const proximo = runways[0];
    const valor = proximo.dias === 0 ? 'No limite' : `~${formatarNumero(proximo.dias)} dias`;
    const limite = limiteRecurso(proximo.chave, 'critico', proximo.recurso);
    const nivel = corDeEstado({
      atual: valorAtual(proximo.chave, proximo.recurso),
      atencao: limiteRecurso(proximo.chave, 'atencao', proximo.recurso),
      critico: limite
    });
    const detalhe = `${recursosDashboard[proximo.chave].nome}${limite === null ? '' : ` · limite ${formatarPercentual(limite)}`}`;
    definirKpi('kpi-proximo-limite', 'kpi-proximo-limite-descricao', valor, detalhe, nivel);
  } else {
    definirKpi('kpi-proximo-limite', 'kpi-proximo-limite-descricao', 'N/D', mensagemRunwayIndisponivel(), 'azul');
  }

  const requisicoes = dados.requisicoes || {};
  const serieRequisicoesGold = Array.isArray(requisicoes.serie) ? requisicoes.serie : [];
  const somarCampo = campo => serieRequisicoesGold.reduce((total, item) => total + (numero(item[campo]) || 0), 0);
  const totalRequisicoes = numero(requisicoes.total_requisicoes) ?? (serieRequisicoesGold.length ? somarCampo('requisicoes') : null);
  const totalSucessos = numero(requisicoes.total_sucessos) ?? (serieRequisicoesGold.length ? somarCampo('sucessos') : null);
  const totalErros = numero(requisicoes.total_erros) ?? (serieRequisicoesGold.length ? somarCampo('erros') : null);
  if (requisicoes.disponivel && totalRequisicoes !== null) {
    const descricao = `${formatarNumero(totalSucessos, 0)} sucessos · ${formatarNumero(totalErros, 0)} erros`;
    definirKpi('kpi-requisicoes', 'kpi-requisicoes-descricao', formatarNumero(totalRequisicoes, 0), descricao, totalErros > 0 ? 'amarelo' : 'verde');
  } else {
    definirKpi('kpi-requisicoes', 'kpi-requisicoes-descricao', 'N/D', requisicoes.motivo || 'Erro: o Gold não contém contagem de requisições.', 'azul');
  }

  const sla = dados.disponibilidade_sla || {};
  const percentualSla = numero(sla.disponibilidade_percentual ?? sla.percentual);
  if (sla.disponivel === true && percentualSla !== null) {
    const detalheSla = sla.orcamento_consumido_minutos === undefined
      ? 'Valor informado pelo Gold.'
      : `${formatarNumero(sla.orcamento_consumido_minutos, 0)} min consumidos`;
    definirKpi('kpi-sla', 'kpi-sla-descricao', formatarPercentual(percentualSla), detalheSla, 'azul');
    elemento('status-sla-texto').textContent = `SLA informado pelo Gold: ${formatarPercentual(percentualSla)}`;
    elemento('status-sla').classList.remove('indisponivel');
  } else {
    const motivo = sla.motivo || 'O arquivo Gold não contém dados de indisponibilidade.';
    definirKpi('kpi-sla', 'kpi-sla-descricao', 'N/D', motivo, 'azul');
    elemento('status-sla-texto').textContent = 'SLA: indisponível no Gold';
    elemento('status-sla').classList.add('indisponivel');
  }
}

function atualizarAvisoAmostras() {
  const aviso = elemento('aviso-amostras');
  const dados = estadoDashboard.dados;
  if (!dados) {
    aviso.className = 'aviso-amostras';
    aviso.textContent = '';
    return;
  }

  const recurso = dados.recursos?.[estadoDashboard.componente];
  const status = dados.status_previsao?.[estadoDashboard.componente] || {};
  const amostras = numero(recurso?.quantidade_amostras ?? status.quantidade_amostras) ?? 0;
  const minimo = Number(dados.minimo_amostras_previsao || 3);
  aviso.className = 'aviso-amostras visivel';
  if (pontosPrevisao(recurso).length && amostras >= minimo) {
    aviso.classList.add('ok');
    aviso.textContent = `${amostras} amostras de ${recursosDashboard[estadoDashboard.componente].nome}. A previsão gerada pelo ETL está exibida no gráfico.`;
  } else {
    aviso.textContent = status.mensagem || recurso?.mensagem_previsao ||
      `Previsão indisponível: ${amostras} amostras; o mínimo configurado pelo Gold é ${minimo}.`;
  }
}

function corComAlpha(hex, alpha = 0.15) {
  const codigo = String(hex).replace('#', '');
  const r = parseInt(codigo.slice(0, 2), 16);
  const g = parseInt(codigo.slice(2, 4), 16);
  const b = parseInt(codigo.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function dataValida(valor) {
  if (!valor) return null;
  const data = new Date(String(valor).replace(' ', 'T'));
  return Number.isNaN(data.getTime()) ? null : data;
}

function rotuloData(valor) {
  const data = dataValida(valor);
  return data ? data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : String(valor || 'Amostra');
}

function criarGraficos() {
  graficoTendencia = new Chart(elemento('grafico-tendencia'), {
    type: 'line',
    data: { labels: [], datasets: [] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#c5c3cd', boxWidth: 14, filter: item => !item.text.startsWith('Limite inferior') } },
        tooltip: { filter: item => item.raw !== null, callbacks: { label: item => `${item.dataset.label}: ${formatarPercentual(item.parsed.y)}` } }
      },
      scales: {
        x: {
          ...eixoComum,
          title: { display: true, text: 'Amostras observadas · D = hoje · previsão diária', color: eixoTexto },
          ticks: {
            color: eixoTexto,
            font: { size: 9 },
            autoSkip: false,
            maxRotation: 0,
            callback: function (valor, indice) {
              const rotulo = String(this.getLabelForValue(valor));
              const labelsAtuais = this.chart.data.labels;
              const primeiroDiaPrevisto = labelsAtuais.findIndex(label => String(label).startsWith('D+'));
              const totalHistorico = primeiroDiaPrevisto === -1 ? labelsAtuais.length : primeiroDiaPrevisto;
              const totalDiasPrevistos = Math.max(0, labelsAtuais.length - totalHistorico);
              const largura = this.chart.chartArea?.width || this.chart.width || 600;
              const maxRotulos = Math.max(6, Math.floor(largura / 42));

              if (rotulo.startsWith('D+')) {
                const dia = Number(rotulo.slice(2));
                const vagasPrevisao = Math.max(3, maxRotulos - Math.min(6, totalHistorico));
                const intervaloDias = Math.max(1, Math.ceil(totalDiasPrevistos / vagasPrevisao));
                return dia === 1 || dia === totalDiasPrevistos || dia % intervaloDias === 0 ? rotulo : '';
              }

              const vagasHistorico = Math.max(2, maxRotulos - Math.min(totalDiasPrevistos, maxRotulos - 2));
              const intervaloHistorico = Math.max(1, Math.ceil(totalHistorico / vagasHistorico));
              return indice === 0 || indice === totalHistorico - 1 || indice % intervaloHistorico === 0 ? rotulo : '';
            }
          }
        },
        y: { min: 0, max: 100, ...eixoComum, title: { display: true, text: 'Uso do recurso (%)', color: eixoTexto }, ticks: { ...eixoComum.ticks, callback: valor => `${valor}%` } }
      }
    }
  });

  graficoRunway = new Chart(elemento('grafico-runway'), {
    type: 'bar',
    data: { labels: [], datasets: [] },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: item => `${formatarNumero(item.raw)} dias estimados até o limite crítico` } } },
      scales: {
        x: { beginAtZero: true, ...eixoComum, title: { display: true, text: 'Dias estimados', color: eixoTexto }, ticks: { ...eixoComum.ticks, callback: valor => `${valor}d` } },
        y: { ...eixoComum, grid: { display: false }, ticks: { color: '#ddd9eb', font: { size: 10 } } }
      }
    }
  });

  graficoPrevisaoCpu = new Chart(elemento('grafico-previsao-cpu'), {
    type: 'line',
    data: { datasets: [] },
    options: opcoesGraficoCarga('cpu'),
    plugins: [zonaCriticaCarga]
  });

  graficoPrevisaoLatencia = new Chart(elemento('grafico-previsao-latencia'), {
    type: 'line',
    data: { datasets: [] },
    options: opcoesGraficoCarga('latencia')
  });
}

function opcoesGraficoCarga(tipo) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'nearest', intersect: false, axis: 'x' },
    plugins: {
      legend: { labels: { color: '#c5c3cd', boxWidth: 12, font: { size: 10 }, filter: item => !item.text.startsWith('Faixa ') } },
      tooltip: { callbacks: { label: item => {
        const unidade = item.dataset.yAxisID === 'cpu' ? '%' : ' ms';
        return `${item.dataset.label}: ${formatarNumero(item.parsed.y, 2)}${unidade}`;
      } } }
    },
    scales: {
      x: { type: 'linear', min: 1, ...eixoComum, title: { display: true, text: 'Número de requisições', color: eixoTexto }, ticks: { ...eixoComum.ticks, maxTicksLimit: 14, stepSize: 50, callback: valor => formatarNumero(valor, 0) } },
      [tipo]: tipo === 'cpu'
        ? { type: 'linear', position: 'left', min: 0, max: 100, ...eixoComum, title: { display: true, text: 'Uso de CPU (%)', color: '#20baf4' }, ticks: { ...eixoComum.ticks, callback: valor => `${formatarNumero(valor, 0)}%` } }
        : { type: 'linear', position: 'left', beginAtZero: true, ...eixoComum, title: { display: true, text: 'Latência (ms)', color: '#ff9f32' }, ticks: { ...eixoComum.ticks, callback: valor => `${formatarNumero(valor, 0)} ms` } }
    }
  };
}

function atualizarGraficoTendencia() {
  const chave = estadoDashboard.componente;
  const config = recursosDashboard[chave];
  const recurso = recursoAtual(chave);
  const contexto = elemento('contexto-tendencia');
  contexto.replaceChildren();
  if (!recurso) {
    graficoTendencia.data = { labels: [], datasets: [] };
    graficoTendencia.update();
    const erro = estadoDashboard.dados ? `o Gold não trouxe dados de ${config.nome} para este servidor.` : null;
    contexto.textContent = mensagemEstadoVazio(erro);
    mostrarEstadoGrafico('grafico-tendencia', 'estado-grafico-tendencia', false, erro);
    return;
  }

  let historico = Array.isArray(recurso.serie_10_minutos) ? recurso.serie_10_minutos : [];
  if (!historico.length && valorAtual(chave, recurso) !== null) {
    historico = [{ data_hora: recurso.fim || estadoDashboard.dados.fim, media: valorAtual(chave, recurso) }];
  }
  const previsoes = pontosPrevisao(recurso).map(item => item.original);
  const labels = historico.map(item => rotuloData(item.data_hora));
  const cor = config.cor;
  const limite = limiteRecurso(chave, 'critico', recurso);
  const dadosHistoricos = historico.map(item => numero(item.media));
  const valorInicialPrevisao = dadosHistoricos[dadosHistoricos.length - 1] ?? valorAtual(chave, recurso);
  const previsoesDiarias = previsaoDiaria(recurso, valorInicialPrevisao);
  if (previsoesDiarias.length && labels.length) labels[labels.length - 1] = 'D';
  previsoesDiarias.forEach(item => labels.push(`D+${item.dia}`));
  const inferioresHistoricos = historico.map(item => numero(item.minimo) ?? numero(item.media));
  const superioresHistoricos = historico.map(item => numero(item.maximo) ?? numero(item.media));
  const datasets = [];

  const faixaHistoricaDisponivel = historico.some(item => numero(item.minimo) !== null && numero(item.maximo) !== null);
  const inferioresPrevisao = previsoesDiarias.map(item => numero(item.faixa_inferior));
  const superioresPrevisao = previsoesDiarias.map(item => numero(item.faixa_superior));
  const faixaPrevisaoDisponivel = previsoesDiarias.length > 0 &&
    inferioresPrevisao.every(valor => valor !== null) && superioresPrevisao.every(valor => valor !== null);
  if (faixaHistoricaDisponivel || faixaPrevisaoDisponivel) {
    const indiceInferior = datasets.length;
    const valoresInferiores = [...inferioresHistoricos, ...previsoesDiarias.map((item, indice) => faixaPrevisaoDisponivel ? inferioresPrevisao[indice] : null)];
    const valoresSuperiores = [...superioresHistoricos, ...previsoesDiarias.map((item, indice) => faixaPrevisaoDisponivel ? superioresPrevisao[indice] : null)];
    datasets.push({ label: 'Limite inferior da faixa', data: valoresInferiores, borderColor: 'transparent', pointRadius: 0, fill: false });
    datasets.push({ label: 'Variação observada / faixa estimada pelo ETL', data: valoresSuperiores, borderColor: 'transparent', backgroundColor: corComAlpha(cor, 0.13), pointRadius: 0, fill: { target: indiceInferior } });
  }

  datasets.push({
    label: 'Média observada (10 min)',
    data: [...dadosHistoricos, ...previsoesDiarias.map(() => null)],
    borderColor: cor,
    backgroundColor: cor,
    borderWidth: 2.2,
    pointRadius: historico.length > 40 ? 0 : 2,
    pointHoverRadius: 4,
    tension: 0.18,
    spanGaps: false
  });

  if (limite !== null) {
    datasets.push({ label: `Limite crítico (${formatarPercentual(limite)})`, data: labels.map(() => limite), borderColor: '#ff5c5c', borderWidth: 1.4, borderDash: [5, 5], pointRadius: 0 });
  }

  if (previsoes.length) {
    const ancora = dadosHistoricos.length ? dadosHistoricos[dadosHistoricos.length - 1] : null;
    const previsao = [...historico.map(() => null), ...previsoesDiarias.map(item => numero(item.estimativa))];
    if (historico.length && ancora !== null) previsao[historico.length - 1] = ancora;
    datasets.push({ label: 'Previsão diária (Gold e interpolação entre pontos)', data: previsao, borderColor: cor, borderWidth: 2.2, borderDash: [7, 5], pointRadius: previsoesDiarias.map(item => item.pontoGold ? 3 : 0), pointHoverRadius: 5, tension: 0, spanGaps: false });
  }

  graficoTendencia.data = { labels, datasets };
  graficoTendencia.update();
  const temDadosGrafico = dadosHistoricos.some(valor => valor !== null) || previsoes.some(item => numero(item.estimativa) !== null);
  mostrarEstadoGrafico(
    'grafico-tendencia',
    'estado-grafico-tendencia',
    temDadosGrafico,
    temDadosGrafico ? null : `o Gold não trouxe pontos de série para ${config.nome}.`
  );

  const valoresContexto = [
    ['Atual', formatarPercentual(valorAtual(chave, recurso))],
    ['Amostras', formatarNumero(recurso.quantidade_amostras, 0)],
    ['Limite crítico', limite === null ? 'não informado' : formatarPercentual(limite)]
  ];
  const p95 = numero(recurso.p95);
  const maximo = numero(recurso.maximo);
  if (p95 !== null) valoresContexto.push(['P95 histórico', formatarPercentual(p95)]);
  if (maximo !== null) valoresContexto.push(['Máximo observado', formatarPercentual(maximo)]);
  const tendencia = numero(recurso.tendencia_por_dia);
  if (tendencia !== null) valoresContexto.push(['Tendência', `${formatarNumero(tendencia, 3)} p.p./dia`]);
  const runway = calcularRunwayDias(chave, recurso);
  if (runway !== null && runway >= 0) valoresContexto.push(['Runway', runway === 0 ? 'no limite' : `~${formatarNumero(runway)} dias`]);
  valoresContexto.forEach(([rotulo, valor]) => {
    const span = document.createElement('span');
    const strong = document.createElement('b');
    strong.textContent = `${rotulo}: `;
    span.append(strong, document.createTextNode(valor));
    contexto.appendChild(span);
  });
  if (!previsoes.length) {
    const aviso = document.createElement('span');
    aviso.textContent = recurso.mensagem_previsao || 'Previsão não disponível no Gold.';
    contexto.appendChild(aviso);
  } else if (previsoesDiarias.some(item => item.interpolada)) {
    const aviso = document.createElement('span');
    aviso.textContent = 'Dias sem ponto próprio no Gold são interpolados entre os pontos disponíveis.';
    contexto.appendChild(aviso);
  }
}

function atualizarGraficoRunway() {
  const detalhes = elemento('runway-detalhes');
  detalhes.replaceChildren();
  const runways = Object.keys(recursosDashboard).map(chave => {
    const recurso = recursoAtual(chave);
    return { chave, recurso, dias: calcularRunwayDias(chave, recurso), atual: valorAtual(chave, recurso), limite: limiteRecurso(chave, 'critico', recurso) };
  }).filter(item => item.dias !== null && item.dias >= 0);
  runways.sort((a, b) => a.dias - b.dias);

  graficoRunway.data = {
    labels: runways.map(item => recursosDashboard[item.chave].nome),
    datasets: [{
      label: 'Dias até o limite crítico',
      data: runways.map(item => item.dias),
      backgroundColor: runways.map(item => recursosDashboard[item.chave].cor),
      borderRadius: 5,
      barThickness: 19
    }]
  };
  graficoRunway.options.scales.x.suggestedMax = runways.length ? Math.max(7, ...runways.map(item => item.dias)) * 1.12 : undefined;
  graficoRunway.update();

  if (!runways.length) {
    const erro = estadoDashboard.dados ? mensagemRunwayIndisponivel() : null;
    detalhes.textContent = mensagemEstadoVazio(erro);
    mostrarEstadoGrafico('grafico-runway', 'estado-grafico-runway', false, erro);
    return;
  }
  mostrarEstadoGrafico('grafico-runway', 'estado-grafico-runway', true);
  runways.forEach(item => {
    const linha = document.createElement('div');
    linha.className = 'runway-linha';
    const ponto = document.createElement('span');
    ponto.className = 'runway-cor';
    ponto.style.setProperty('--runway-cor', recursosDashboard[item.chave].cor);
    const texto = document.createElement('span');
    texto.textContent = `${formatarPercentual(item.atual)} agora · limite ${item.limite === null ? 'não informado' : formatarPercentual(item.limite)} · runway ${formatarNumero(item.dias)} dias`;
    const forte = document.createElement('b');
    forte.textContent = `${recursosDashboard[item.chave].nome}: `;
    texto.prepend(forte);
    linha.append(ponto, texto);
    detalhes.appendChild(linha);
  });
}

function desvioPadrao(valores) {
  if (valores.length < 2) return null;
  const media = valores.reduce((soma, valor) => soma + valor, 0) / valores.length;
  const variancia = valores.reduce((soma, valor) => soma + ((valor - media) ** 2), 0) / (valores.length - 1);
  return Math.sqrt(variancia);
}

function ajustarRegressao(pontos) {
  if (pontos.length < 3) return null;
  const n = pontos.length;
  const mediaX = pontos.reduce((soma, ponto) => soma + ponto.x, 0) / n;
  const mediaY = pontos.reduce((soma, ponto) => soma + ponto.y, 0) / n;
  const somaXX = pontos.reduce((soma, ponto) => soma + ((ponto.x - mediaX) ** 2), 0);
  if (!somaXX) return null;
  const inclinacao = pontos.reduce((soma, ponto) => soma + ((ponto.x - mediaX) * (ponto.y - mediaY)), 0) / somaXX;
  const intercepto = mediaY - (inclinacao * mediaX);
  const residuos = pontos.map(ponto => ponto.y - (intercepto + (inclinacao * ponto.x)));
  const sigma = Math.sqrt(residuos.reduce((soma, residuo) => soma + (residuo ** 2), 0) / (n - 2));
  return { n, mediaX, inclinacao, intercepto, somaXX, sigma };
}

function estimarRegressao(modelo, x) {
  if (!modelo) return null;
  const valor = modelo.intercepto + (modelo.inclinacao * x);
  const margem = 1.96 * modelo.sigma * Math.sqrt(1 + (1 / modelo.n) + (((x - modelo.mediaX) ** 2) / modelo.somaXX));
  return { valor, inferior: valor - margem, superior: valor + margem };
}

function extrairAmostrasPorRequisicao(requisicoes) {
  const ultima = requisicoes.ultima_amostra || {};
  const candidatos = [
    { chave: 'requisicoes_individuais', dados: requisicoes.requisicoes_individuais, individual: true },
    { chave: 'amostras_por_requisicao', dados: requisicoes.amostras_por_requisicao, individual: true },
    { chave: 'por_requisicao', dados: requisicoes.por_requisicao, individual: true },
    { chave: 'latencias_ms', dados: requisicoes.latencias_ms, individual: true },
    { chave: 'latencias_individuais_ms', dados: requisicoes.latencias_individuais_ms, individual: true },
    { chave: 'cpu_percentual_por_requisicao', dados: requisicoes.cpu_percentual_por_requisicao, individual: true },
    { chave: 'cpu_por_requisicao', dados: requisicoes.cpu_por_requisicao, individual: true },
    { chave: 'requisicoes_individuais', dados: ultima.requisicoes_individuais, individual: true },
    { chave: 'amostras_por_requisicao', dados: ultima.amostras_por_requisicao, individual: true },
    { chave: 'por_requisicao', dados: ultima.por_requisicao, individual: true },
    { chave: 'latencias_ms', dados: ultima.latencias_ms, individual: true },
    { chave: 'latencias_individuais_ms', dados: ultima.latencias_individuais_ms, individual: true },
    { chave: 'cpu_percentual_por_requisicao', dados: ultima.cpu_percentual_por_requisicao, individual: true },
    { chave: 'cpu_por_requisicao', dados: ultima.cpu_por_requisicao, individual: true },
    { chave: 'serie', dados: Array.isArray(requisicoes.serie) ? requisicoes.serie : [], individual: false }
  ].filter(candidato => Array.isArray(candidato.dados) && candidato.dados.length);

  for (const candidato of candidatos) {
    const linhas = candidato.dados;
    const indicesDeclarados = linhas.every(linha => typeof linha === 'number' ||
      numero(linha?.numero_requisicao ?? linha?.indice_requisicao ?? linha?.request_number) !== null);
    const contagens = linhas.map(linha => typeof linha === 'number' ? null : numero(linha?.numero_requisicao ?? linha?.indice_requisicao ?? linha?.request_number ?? linha?.concorrencia ?? linha?.requisicoes_concorrentes ?? linha?.requisicoes));
    const contagensCrescentes = contagens.length > 1 && contagens.every(valor => valor !== null) &&
      contagens.every((valor, indice) => indice === 0 || valor > contagens[indice - 1]);
    const temLatenciaPorRequisicao = linhas.some(linha => typeof linha === 'number' ||
      numero(linha?.latencia_ms ?? linha?.tempo_resposta_ms ?? linha?.duracao_ms ?? linha?.latencia_media_ms ?? linha?.latencia_p95_ms) !== null);
    const serieDeVinteRequisicoes = candidato.chave === 'serie' && linhas.length === 20 && temLatenciaPorRequisicao;
    if (!candidato.individual && !indicesDeclarados && !contagensCrescentes && !serieDeVinteRequisicoes) continue;

    const pontos = linhas.map((linha, indice) => {
      const xDeclarado = typeof linha === 'number'
        ? null
        : numero(linha?.numero_requisicao ?? linha?.indice_requisicao ?? linha?.request_number);
      const x = xDeclarado ?? (candidato.individual
        ? indice + 1
        : contagensCrescentes ? contagens[indice] : serieDeVinteRequisicoes ? indice + 1 : numero(linha?.concorrencia ?? linha?.requisicoes_concorrentes ?? linha?.requisicoes) ?? indice + 1);
      const eSerieCpu = candidato.chave.startsWith('cpu_') || candidato.chave === 'cpu_por_requisicao';
      if (typeof linha === 'number') {
        return { x, latencia: eSerieCpu ? null : linha, cpu: eSerieCpu ? linha : null, p95: null, p99: null, amostra: eSerieCpu ? { cpu_percentual: linha } : { latencia_ms: linha } };
      }
      return {
        x,
        latencia: eSerieCpu ? null : numero(linha?.latencia_ms ?? linha?.tempo_resposta_ms ?? linha?.duracao_ms ?? linha?.latencia_media_ms ?? linha?.latencia_p95_ms),
        cpu: numero(linha?.cpu_percentual ?? (eSerieCpu ? linha?.valor : null)),
        p95: numero(linha?.latencia_p95_ms),
        p99: numero(linha?.latencia_p99_ms),
        amostra: linha
      };
    }).filter(ponto => ponto.latencia !== null || ponto.cpu !== null || ponto.p95 !== null || ponto.p99 !== null)
      .sort((a, b) => a.x - b.x);
    if (pontos.length) {
      const cpuDireta = requisicoes.cpu_percentual_por_requisicao || requisicoes.cpu_por_requisicao ||
        ultima.cpu_percentual_por_requisicao || ultima.cpu_por_requisicao;
      if (Array.isArray(cpuDireta) && cpuDireta.length === pontos.length && !candidato.chave.startsWith('cpu_')) {
        pontos.forEach((ponto, indice) => {
          ponto.cpu = numero(typeof cpuDireta[indice] === 'number' ? cpuDireta[indice] : cpuDireta[indice]?.cpu_percentual ?? cpuDireta[indice]?.valor);
        });
      }
      return pontos;
    }
  }

  const serieAgregada = Array.isArray(requisicoes.serie) ? requisicoes.serie : [];
  const amostrasAgregadas = serieAgregada.length ? serieAgregada : (Object.keys(ultima).length ? [ultima] : []);
  return amostrasAgregadas.map(amostra => ({
    x: numero(amostra.concorrencia ?? amostra.requisicoes_concorrentes ?? amostra.requisicoes),
    latencia: numero(amostra.latencia_media_ms ?? amostra.latencia_ms),
    cpu: numero(amostra.cpu_percentual),
    p95: numero(amostra.latencia_p95_ms),
    p99: numero(amostra.latencia_p99_ms),
    amostra
  })).filter(ponto => ponto.x !== null && (ponto.latencia !== null || ponto.cpu !== null || ponto.p95 !== null || ponto.p99 !== null))
    .sort((a, b) => a.x - b.x);
}

const zonaCriticaCarga = {
  id: 'zonaCriticaCarga',
  beforeDatasetsDraw(chart) {
    const config = chart.$zonaCriticaCarga || {};
    const { ctx, chartArea, scales } = chart;
    if (!chartArea) return;
    ctx.save();
    if (config.limite !== null && config.limite !== undefined) {
      const y = scales.cpu.getPixelForValue(config.limite);
      ctx.fillStyle = 'rgba(255, 92, 92, .08)';
      ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, Math.max(0, y - chartArea.top));
    }
    const inicioZona = config.cruzamento !== null && config.cruzamento !== undefined && config.cruzamento <= config.horizonte
      ? config.cruzamento
      : config.faixaRisco;
    if (inicioZona !== null && inicioZona !== undefined && inicioZona <= config.horizonte) {
      const x = scales.x.getPixelForValue(inicioZona);
      if (x < chartArea.right) {
        ctx.fillStyle = 'rgba(255, 92, 92, .12)';
        ctx.fillRect(Math.max(chartArea.left, x), chartArea.top, chartArea.right - Math.max(chartArea.left, x), chartArea.bottom - chartArea.top);
      }
    }
    ctx.restore();
  },
  afterDatasetsDraw(chart) {
    const config = chart.$zonaCriticaCarga || {};
    const { ctx, chartArea, scales } = chart;
    if (config.cruzamento === null || config.cruzamento === undefined) return;
    if (config.cruzamento > config.horizonte) {
      ctx.save();
      ctx.fillStyle = '#ff7777';
      ctx.font = '600 11px sans-serif';
      const texto = `Limite estimado: ~${formatarNumero(config.cruzamento, 0)} req (fora da faixa exibida)`;
      ctx.fillText(texto, Math.max(chartArea.left + 8, chartArea.right - ctx.measureText(texto).width - 8), chartArea.top + 15);
      ctx.restore();
      return;
    }
    const x = scales.x.getPixelForValue(config.cruzamento);
    if (x < chartArea.left || x > chartArea.right) return;
    ctx.save();
    ctx.strokeStyle = '#ff5c5c';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ff7777';
    ctx.font = '600 11px sans-serif';
    const rotulo = config.observado ? 'Limite observado' : 'Limite previsto';
    ctx.fillText(`${rotulo} · ${formatarNumero(config.cruzamento, 0)} req`, Math.min(x + 7, chartArea.right - 145), chartArea.top + 15);
    ctx.restore();
  }
};

function atualizarGraficosCarga() {
  const requisicoes = estadoDashboard.dados?.requisicoes || {};
  const observacoes = extrairAmostrasPorRequisicao(requisicoes);
  const cpu = observacoes.filter(ponto => ponto.cpu !== null).map(ponto => ({ x: ponto.x, y: ponto.cpu, amostra: ponto.amostra }));
  const latencia = observacoes.filter(ponto => ponto.latencia !== null).map(ponto => ({ x: ponto.x, y: ponto.latencia, amostra: ponto.amostra }));
  const p95 = observacoes.filter(ponto => ponto.p95 !== null).map(ponto => ({ x: ponto.x, y: ponto.p95, amostra: ponto.amostra }));
  const p99 = observacoes.filter(ponto => ponto.p99 !== null).map(ponto => ({ x: ponto.x, y: ponto.p99, amostra: ponto.amostra }));
  const fonteLatencia = p95.length ? p95 : latencia;
  const cpuModelo = ajustarRegressao(cpu);
  const latenciaModelo = ajustarRegressao(fonteLatencia);
  const p99Modelo = ajustarRegressao(p99);
  const limiteCpu = numero(estadoDashboard.limites.cpu?.critico);
  const maiorRequisicaoObservada = observacoes.reduce((maior, ponto) => Math.max(maior, ponto.x), 0);
  let cruzamento = null;
  let cruzamentoObservado = false;
  if (limiteCpu !== null) {
    const cpuCriticaObservada = cpu.find(ponto => ponto.y >= limiteCpu);
    const ultimoCpu = cpu[ cpu.length - 1 ];
    if (cpuCriticaObservada) {
      cruzamento = cpuCriticaObservada.x;
      cruzamentoObservado = true;
    }
    else if (cpuModelo && ultimoCpu && cpuModelo.inclinacao > 0) {
      const estimativa = (limiteCpu - cpuModelo.intercepto) / cpuModelo.inclinacao;
      if (estimativa >= 1) cruzamento = estimativa;
    }
  }
  const incrementoPrevisao = 50;
  const horizonte = Math.ceil(Math.max(500, maiorRequisicaoObservada * 2) / incrementoPrevisao) * incrementoPrevisao;
  const primeiraRequisicaoProjetada = Math.ceil((maiorRequisicaoObservada + 1e-9) / incrementoPrevisao) * incrementoPrevisao;
  const gradePrevisao = maiorRequisicaoObservada > 0 ? [maiorRequisicaoObservada] : [];
  for (let requisicoesProjetadas = primeiraRequisicaoProjetada; requisicoesProjetadas <= horizonte; requisicoesProjetadas += incrementoPrevisao) {
    gradePrevisao.push(requisicoesProjetadas);
  }
  const adicionarFaixaEPrevisao = (datasets, modelo, eixo, nome, cor, faixa) => {
    if (!modelo) return;
    const previsoes = gradePrevisao.map(x => ({ x, ...estimarRegressao(modelo, x) }));
    const limitar = valor => eixo === 'cpu' ? Math.min(100, Math.max(0, valor)) : Math.max(0, valor);
    const indiceInferior = datasets.length;
    datasets.push({ label: `Faixa inferior ${nome}`, data: previsoes.map(ponto => ({ x: ponto.x, y: limitar(ponto.inferior) })), yAxisID: eixo, borderColor: 'transparent', pointRadius: 0, fill: false });
    datasets.push({ label: `Faixa ${nome} (±1,96σ)`, data: previsoes.map(ponto => ({ x: ponto.x, y: limitar(ponto.superior) })), yAxisID: eixo, borderColor: 'transparent', backgroundColor: faixa, pointRadius: 0, fill: { target: indiceInferior } });
    datasets.push({ label: `${nome} previsto`, data: previsoes.map(ponto => ({ x: ponto.x, y: limitar(ponto.valor), inferior: limitar(ponto.inferior), superior: limitar(ponto.superior) })), yAxisID: eixo, borderColor: cor, backgroundColor: cor, borderWidth: 2.2, borderDash: [7, 5], pointRadius: 0, tension: 0.12 });
  };

  const datasetsCpu = [];
  if (cpu.length) datasetsCpu.push({ label: 'CPU observada', data: cpu, yAxisID: 'cpu', borderColor: '#20baf4', backgroundColor: '#20baf4', borderWidth: 2, pointRadius: 3, pointHoverRadius: 5, showLine: true, tension: 0.12 });
  adicionarFaixaEPrevisao(datasetsCpu, cpuModelo, 'cpu', 'CPU', '#20baf4', 'rgba(32,186,244,.13)');
  if (limiteCpu !== null) datasetsCpu.push({ label: `Limite crítico CPU (${formatarPercentual(limiteCpu)})`, data: [{ x: 1, y: limiteCpu }, { x: horizonte, y: limiteCpu }], yAxisID: 'cpu', borderColor: '#ff5c5c', borderWidth: 1.5, borderDash: [5, 4], pointRadius: 0 });

  const gradeCpu = cpuModelo ? gradePrevisao.map(x => ({ x, ...estimarRegressao(cpuModelo, x) })) : [];
  const faixaRisco = limiteCpu === null ? null : gradeCpu.find(ponto => ponto.superior >= limiteCpu)?.x ?? null;
  graficoPrevisaoCpu.$zonaCriticaCarga = { limite: limiteCpu, cruzamento, faixaRisco, horizonte, observado: cruzamentoObservado };
  graficoPrevisaoCpu.data = { datasets: datasetsCpu };
  graficoPrevisaoCpu.options.scales.x.max = horizonte;
  graficoPrevisaoCpu.options.scales.x.ticks.stepSize = Math.max(incrementoPrevisao, Math.ceil(horizonte / 500) * incrementoPrevisao);

  const datasetsLatencia = [];
  if (p95.length) datasetsLatencia.push({ label: 'Latência P95 observada', data: p95, yAxisID: 'latencia', borderColor: '#ff9f32', backgroundColor: '#ff9f32', borderWidth: 2, pointRadius: 3, pointHoverRadius: 5, showLine: true, tension: 0.12 });
  else if (latencia.length) datasetsLatencia.push({ label: 'Latência observada', data: latencia, yAxisID: 'latencia', borderColor: '#ff9f32', backgroundColor: '#ff9f32', borderWidth: 1.8, pointRadius: 2.5, pointHoverRadius: 5, showLine: true, tension: 0.12 });
  adicionarFaixaEPrevisao(datasetsLatencia, latenciaModelo, 'latencia', p95.length ? 'Latência P95' : 'Latência', '#ff9f32', 'rgba(255,159,50,.12)');
  if (p99.length) datasetsLatencia.push({ label: 'Latência P99 observada', data: p99, yAxisID: 'latencia', borderColor: '#d879ff', backgroundColor: '#d879ff', borderWidth: 1.6, borderDash: [3, 3], pointRadius: 2.5, pointHoverRadius: 5, showLine: true, tension: 0.12 });
  adicionarFaixaEPrevisao(datasetsLatencia, p99Modelo, 'latencia', 'Latência P99', '#d879ff', 'rgba(216,121,255,.1)');

  graficoPrevisaoLatencia.data = { datasets: datasetsLatencia };
  graficoPrevisaoLatencia.options.scales.x.max = horizonte;
  graficoPrevisaoLatencia.options.scales.x.ticks.stepSize = Math.max(incrementoPrevisao, Math.ceil(horizonte / 500) * incrementoPrevisao);
  const configurarTooltips = (grafico, eixo) => {
    grafico.options.plugins.tooltip.filter = item => !item.dataset.label.startsWith('Faixa ');
    grafico.options.plugins.tooltip.callbacks.title = items => items.length ? `${formatarNumero(items[0].parsed.x, 0)} requisições` : '';
    grafico.options.plugins.tooltip.callbacks.afterBody = items => {
      const ponto = items[0]?.raw;
      const amostra = ponto?.amostra || {};
      const detalhes = [];
      const desvio = numero(amostra.desvio_padrao_ms ?? amostra.latencia_desvio_padrao_ms);
      const totalRequisicoes = numero(amostra.requisicoes);
      const rps = numero(amostra.requisicoes_por_segundo);
      const erros = numero(amostra.erros);
      const inferior = numero(ponto?.inferior);
      const superior = numero(ponto?.superior);
      const unidade = eixo === 'cpu' ? '%' : ' ms';
      if (totalRequisicoes !== null) detalhes.push(`${formatarNumero(totalRequisicoes, 0)} requisições no teste`);
      if (rps !== null) detalhes.push(`${formatarNumero(rps, 2)} req/s`);
      if (desvio !== null) detalhes.push(`Desvio padrão: ${formatarNumero(desvio, 2)} ms`);
      if (inferior !== null && superior !== null) detalhes.push(`Faixa estimada ±1,96σ: ${formatarNumero(inferior, 2)}–${formatarNumero(superior, 2)}${unidade}`);
      if (erros !== null) detalhes.push(`${formatarNumero(erros, 0)} erros`);
      return detalhes;
    };
  };
  configurarTooltips(graficoPrevisaoCpu, 'cpu');
  configurarTooltips(graficoPrevisaoLatencia, 'latencia');
  graficoPrevisaoCpu.update();
  graficoPrevisaoLatencia.update();

  const temCpu = cpu.length > 0;
  const temLatencia = fonteLatencia.length > 0 || latencia.length > 0 || p99.length > 0;
  const semDados = estadoDashboard.dados
    ? 'o Gold não trouxe observações de CPU ou latência por número de requisições.'
    : null;
  mostrarEstadoGrafico('grafico-previsao-cpu', 'estado-grafico-previsao-cpu', temCpu, semDados);
  mostrarEstadoGrafico('grafico-previsao-latencia', 'estado-grafico-previsao-latencia', temLatencia, semDados);

  const resumo = elemento('resumo-estresse');
  const sigmaLatencia = desvioPadrao(fonteLatencia.map(ponto => ponto.y)) ?? latenciaModelo?.sigma ?? null;
  const partes = [];
  if (observacoes.length) partes.push(`${observacoes.length} observações do Gold`);
  if (sigmaLatencia !== null) partes.push(`desvio padrão da latência ${formatarNumero(sigmaLatencia, 2)} ms`);
  if (cruzamentoObservado) partes.push(`CPU observada acima do limite desde ~${formatarNumero(cruzamento, 0)} requisições`);
  else if (cpuModelo && limiteCpu !== null && cruzamento !== null) partes.push(`CPU atinge o limite estimado em ~${formatarNumero(cruzamento, 0)} requisições${cruzamento > horizonte ? ` (fora da faixa exibida até ${formatarNumero(horizonte, 0)})` : ''}`);
  else if (cpuModelo && limiteCpu !== null) partes.push('CPU não cruza o limite na projeção exibida');
  else if (cpu.length) partes.push('sem pontos de CPU suficientes em contagens distintas para prever o cruzamento');
  else partes.push('Gold sem série de CPU por requisição para estimar saturação');
  if (!cruzamentoObservado && cruzamento !== null && cruzamento > horizonte && faixaRisco !== null) {
    partes.push(`faixa de risco alcança o limite a partir de ~${formatarNumero(faixaRisco, 0)} requisições`);
  }
  if (limiteCpu === null) partes.push('limite crítico de CPU não retornado pelo banco');
  const modelosCalculados = [cpuModelo, latenciaModelo, p99Modelo].filter(Boolean).length;
  const metodoPrevisao = modelosCalculados
    ? `Linhas tracejadas: regressão linear até ${formatarNumero(horizonte, 0)} requisições, em saltos de ${formatarNumero(incrementoPrevisao, 0)}; faixa estimada: ±1,96 desvios padrão.`
    : 'Ainda não há valores em contagens distintas para ajustar uma previsão.';
  resumo.textContent = temCpu || temLatencia ? `${partes.join(' · ')}. ${metodoPrevisao}` : mensagemEstadoVazio(semDados);
  const ultima = requisicoes.ultima_amostra || observacoes[observacoes.length - 1]?.amostra;
  elemento('periodo-teste').textContent = ultima?.data_hora ? formatarData(ultima.data_hora) : `${observacoes.length} requisições observadas`;
}

function adicionarEvento(container, data, texto, cor) {
  const artigo = document.createElement('article');
  artigo.className = 'evento';
  artigo.style.setProperty('--evento-cor', cor);
  const dataElemento = document.createElement('span');
  dataElemento.className = 'evento-data';
  dataElemento.textContent = data;
  const ponto = document.createElement('span');
  ponto.className = 'evento-ponto';
  const textoElemento = document.createElement('span');
  textoElemento.className = 'evento-texto';
  textoElemento.textContent = texto;
  artigo.append(dataElemento, ponto, textoElemento);
  container.appendChild(artigo);
}

function atualizarEventos() {
  const container = elemento('eventos');
  container.replaceChildren();
  const dados = estadoDashboard.dados;
  if (!dados) {
    const carregando = estadoDashboard.status === 'loading';
    adicionarEvento(container, carregando ? 'Consultando Gold' : 'Erro de consulta', mensagemEstadoVazio(), carregando ? '#35b8f2' : '#ff5c5c');
    return;
  }

  const ultimas = Object.keys(recursosDashboard).map(chave => {
    const serie = recursoAtual(chave)?.serie_10_minutos || [];
    return serie.length ? { chave, ponto: serie[serie.length - 1] } : null;
  }).filter(Boolean).sort((a, b) => String(a.ponto.data_hora).localeCompare(String(b.ponto.data_hora)));
  const amostraMaisRecente = ultimas[ultimas.length - 1]?.ponto;
  if (amostraMaisRecente) {
    const valores = ultimas.map(item => `${recursosDashboard[item.chave].nome} ${formatarPercentual(item.ponto.media)}`);
    adicionarEvento(container, `Última amostra · ${formatarData(amostraMaisRecente.data_hora)}`, valores.join(' · '), '#35b8f2');
  }

  const runways = Object.keys(recursosDashboard).map(chave => {
    const recurso = recursoAtual(chave);
    return { chave, recurso, dias: calcularRunwayDias(chave, recurso), limite: limiteRecurso(chave, 'critico', recurso), atual: valorAtual(chave, recurso) };
  }).filter(item => item.dias !== null && item.dias >= 0).sort((a, b) => a.dias - b.dias);
  runways.forEach(item => {
    const horizonte = item.dias === 0 ? 'No limite' : `Em aproximadamente ${formatarNumero(item.dias)} dias`;
    const limite = item.limite === null ? 'limite crítico não informado' : `limite crítico de ${formatarPercentual(item.limite)}`;
    const texto = `${recursosDashboard[item.chave].nome}: tendência do Gold e limite crítico cadastrado indicam ${horizonte} (${limite}). Ação sugerida: revisar a capacidade antes do prazo estimado.`;
    adicionarEvento(container, `Runway · ${recursosDashboard[item.chave].nome}`, texto, recursosDashboard[item.chave].cor);
  });

  const req = dados.requisicoes || {};
  const ultimaCarga = req.ultima_amostra;
  if (req.disponivel && ultimaCarga) {
    const total = numero(ultimaCarga.requisicoes);
    const rps = numero(ultimaCarga.requisicoes_por_segundo);
    const p95 = numero(ultimaCarga.latencia_p95_ms);
    const texto = [
      total === null ? null : `${formatarNumero(total, 0)} requisições`,
      rps === null ? null : `${formatarNumero(rps)} req/s`,
      p95 === null ? null : `latência P95 ${formatarNumero(p95)} ms`,
      numero(ultimaCarga.erros) === null ? null : `${formatarNumero(ultimaCarga.erros, 0)} erros`
    ].filter(Boolean).join(' · ');
    adicionarEvento(container, `Última medição HTTP · ${formatarData(ultimaCarga.data_hora)}`, texto || 'A medição HTTP não contém métricas detalhadas.', '#35b8f2');
  }

  if (!runways.length) {
    adicionarEvento(container, 'Runway indisponível', mensagemRunwayIndisponivel(), '#f5c542');
  }
}

function atualizarContextoGold() {
  const arquivo = estadoDashboard.arquivo ? `Arquivo: ${estadoDashboard.arquivo}` : 'Arquivo Gold carregado';
  const atualizado = estadoDashboard.atualizadoEm ? formatarData(estadoDashboard.atualizadoEm) : 'horário não informado';
  if (estadoDashboard.servidor) {
    const nome = estadoDashboard.servidor.nomeEquipamento || `Servidor ${estadoDashboard.servidor.idEquipamento}`;
    elemento('contexto-servidor').textContent = `${nome} · Gold atualizado em ${atualizado}`;
  }
  if (estadoDashboard.dados) {
    const aviso = elemento('mensagem-servidor');
    aviso.textContent = `${arquivo} · nova consulta automática a cada 30 segundos.`;
  }
}

function renderizarDashboard() {
  atualizarKpis();
  atualizarAvisoAmostras();
  atualizarGraficoTendencia();
  atualizarGraficoRunway();
  atualizarGraficosCarga();
  atualizarEventos();
  if (estadoDashboard.dados) atualizarContextoGold();
}

function limparDadosGold() {
  estadoDashboard.dados = null;
  estadoDashboard.arquivo = null;
  estadoDashboard.atualizadoEm = null;
  window.dadosPrevisibilidadeGold = null;
  renderizarDashboard();
}

function pararAtualizacaoGold() {
  if (estadoDashboard.intervalo) {
    window.clearInterval(estadoDashboard.intervalo);
    estadoDashboard.intervalo = null;
  }
}

function buscarGoldMaisRecente(silencioso = false) {
  if (!estadoDashboard.servidor || !estadoDashboard.usuario) return;
  const idEquipamento = String(estadoDashboard.servidor.idEquipamento);
  const params = new URLSearchParams({
    idUsuario: String(estadoDashboard.usuario.id),
    idEmpresa: String(estadoDashboard.usuario.idEmpresa)
  });
  fetch(`/hardwares/dash-previsibilidade/${encodeURIComponent(idEquipamento)}?${params.toString()}`, { cache: 'no-store' })
    .then(async resposta => {
      if (!estadoDashboard.servidor || String(estadoDashboard.servidor.idEquipamento) !== idEquipamento) return;
      const resultado = await resposta.json().catch(() => ({}));
      if (resposta.status === 404) {
        estadoDashboard.status = 'missing';
        estadoDashboard.erro = resultado.mensagem || 'nenhum arquivo dash-previsibilidade foi encontrado no Gold.';
        limparDadosGold();
        if (!silencioso) definirMensagemServidor(resultado.mensagem || 'Ainda não há arquivo dash-previsibilidade no Gold para este servidor.');
        return;
      }
      if (!resposta.ok) throw new Error(resultado.mensagem || `Falha ao buscar Gold (HTTP ${resposta.status}).`);
      if (!resultado.dashboard || resultado.dashboard.tipo_arquivo !== 'dash-previsibilidade') {
        throw new Error('O arquivo encontrado no Gold não tem o formato dash-previsibilidade esperado.');
      }
      estadoDashboard.dados = resultado.dashboard;
      estadoDashboard.arquivo = resultado.arquivo || null;
      estadoDashboard.atualizadoEm = resultado.atualizadoEm || resultado.dashboard.gerado_em_utc || null;
      estadoDashboard.status = 'ready';
      estadoDashboard.erro = null;
      window.dadosPrevisibilidadeGold = resultado.dashboard;
      renderizarDashboard();
      window.dispatchEvent(new CustomEvent('previsibilidade-gold-atualizada', { detail: resultado.dashboard }));
    })
    .catch(erro => {
      if (!estadoDashboard.servidor || String(estadoDashboard.servidor.idEquipamento) !== idEquipamento) return;
      estadoDashboard.status = 'error';
      estadoDashboard.erro = erro.message || 'não foi possível consultar o Gold.';
      if (!estadoDashboard.dados) renderizarDashboard();
      if (!silencioso || !estadoDashboard.dados) {
        definirMensagemServidor(`Erro ao consultar Gold: ${estadoDashboard.erro}`);
      }
    });
}

function iniciarAtualizacaoGold(servidor, usuario) {
  pararAtualizacaoGold();
  estadoDashboard.servidor = servidor;
  estadoDashboard.usuario = usuario;
  estadoDashboard.limites = {};
  estadoDashboard.status = 'loading';
  estadoDashboard.erro = null;
  limparDadosGold();
  buscarGoldMaisRecente();
  estadoDashboard.intervalo = window.setInterval(() => buscarGoldMaisRecente(true), 30000);
}

function atualizarLimitesNaTela(componentes) {
  const area = elemento('limites-servidor');
  area.replaceChildren();
  const titulo = document.createElement('strong');
  titulo.textContent = 'Limites cadastrados:';
  area.appendChild(titulo);
  const exibidos = new Set();
  (componentes || []).forEach(componente => {
    const tipo = String(componente.tipoComponente || '').toUpperCase();
    const chave = tipo === 'ARMAZENAMENTO' ? 'disco' : tipo === 'CPU' ? 'cpu' : tipo === 'RAM' ? 'ram' : null;
    if (!chave) return;
    const campoCriticoEquipamento = { cpu: 'limiteCpu', ram: 'limiteRam', disco: 'limiteDisco' }[chave];
    estadoDashboard.limites[chave] = {
      atencao: numero(componente.limiteAtencao),
      critico: numero(componente.limiteCritico) ?? numero(componente[campoCriticoEquipamento])
    };
    if (exibidos.has(chave)) return;
    exibidos.add(chave);
    const item = document.createElement('span');
    const nome = recursosDashboard[chave].nome;
    const atencao = estadoDashboard.limites[chave].atencao;
    const critico = estadoDashboard.limites[chave].critico;
    item.textContent = `${nome}: ${atencao === null ? 'sem limite de atenção' : `${formatarPercentual(atencao)} atenção`} · ${critico === null ? 'sem limite crítico' : `${formatarPercentual(critico)} crítico`}`;
    area.appendChild(item);
  });
  if (!exibidos.size) {
    const vazio = document.createElement('span');
    vazio.textContent = 'Nenhum limite de CPU, RAM ou disco cadastrado para este servidor.';
    area.appendChild(vazio);
  }
  renderizarDashboard();
}

function carregarLimitesCadastrados(servidor, usuario) {
  const area = elemento('limites-servidor');
  area.textContent = 'Carregando limites cadastrados no banco...';
  const url = `/hardwares/buscarEqId/${encodeURIComponent(servidor.idEquipamento)}?idUsuario=${encodeURIComponent(usuario.id)}&idEmpresa=${encodeURIComponent(usuario.idEmpresa)}`;
  fetch(url, { cache: 'no-store' })
    .then(resposta => {
      if (!resposta.ok) throw new Error(resposta.status === 403 ? 'Sem permissão para consultar os limites deste servidor.' : `Falha ao consultar os limites (HTTP ${resposta.status}).`);
      return resposta.json();
    })
    .then(componentes => {
      if (!estadoDashboard.servidor || String(estadoDashboard.servidor.idEquipamento) !== String(servidor.idEquipamento)) return;
      atualizarLimitesNaTela(componentes);
    })
    .catch(erro => {
      if (!estadoDashboard.servidor || String(estadoDashboard.servidor.idEquipamento) !== String(servidor.idEquipamento)) return;
      estadoDashboard.limites = {};
      area.textContent = erro.message || 'Não foi possível consultar os limites cadastrados.';
      renderizarDashboard();
    });
}

function carregarServidoresDaEmpresa() {
  const select = elemento('servidor-em-analise');
  let usuario;
  try {
    usuario = JSON.parse(localStorage.getItem('usuarioLogado') || 'null');
  } catch (erro) {
    localStorage.removeItem('usuarioLogado');
  }

  if (!usuario || !usuario.id || !usuario.idEmpresa) {
    estadoDashboard.status = 'error';
    estadoDashboard.erro = 'nenhuma sessão de usuário válida foi encontrada.';
    select.replaceChildren(new Option('Entre para carregar seus servidores', ''));
    definirMensagemServidor('Erro: entre para consultar servidores e dados do Gold.');
    elemento('contexto-servidor').textContent = 'Selecione um servidor para carregar os dados de previsibilidade do Gold.';
    renderizarDashboard();
    return;
  }

  estadoDashboard.usuario = usuario;
  estadoDashboard.status = 'loading';
  estadoDashboard.erro = null;
  renderizarDashboard();
  const url = `/hardwares/buscarEq/${encodeURIComponent(usuario.idEmpresa)}?idUsuario=${encodeURIComponent(usuario.id)}`;
  fetch(url, { cache: 'no-store' })
    .then(resposta => {
      if (resposta.status === 204) return [];
      if (!resposta.ok) throw new Error(resposta.status === 403 ? 'Sem permissão para visualizar os servidores desta empresa.' : `Não foi possível carregar os servidores (HTTP ${resposta.status}).`);
      return resposta.json();
    })
    .then(linhas => {
      const unicos = new Map();
      linhas.forEach(item => {
        if (String(item.tipoEquipamento || '').toLocaleLowerCase('pt-BR') === 'servidor' && !unicos.has(String(item.idEquipamento))) {
          unicos.set(String(item.idEquipamento), item);
        }
      });
      const servidores = Array.from(unicos.values()).sort((a, b) => String(a.nomeEquipamento).localeCompare(String(b.nomeEquipamento), 'pt-BR'));
      select.replaceChildren(new Option('Selecione um servidor', ''));
      if (!servidores.length) {
        estadoDashboard.status = 'missing';
        estadoDashboard.erro = 'nenhum servidor disponível para esta empresa.';
        select.replaceChildren(new Option('Nenhum servidor disponível', ''));
        definirMensagemServidor('Nenhum servidor foi encontrado para esta empresa ou sua permissão não inclui servidores.');
        renderizarDashboard();
        return;
      }
      estadoDashboard.status = 'idle';
      estadoDashboard.erro = null;
      renderizarDashboard();
      servidores.forEach(servidor => {
        const local = servidor.localizacao ? ` · ${servidor.localizacao}` : '';
        select.add(new Option(`${servidor.nomeEquipamento}${local}`, String(servidor.idEquipamento)));
      });
      select.disabled = false;
      definirMensagemServidor(`${servidores.length} servidor${servidores.length === 1 ? '' : 'es'} disponível${servidores.length === 1 ? '' : 'is'} na sua empresa.`);
      select.addEventListener('change', () => {
        const urlAtual = new URL(window.location.href);
        const servidor = servidores.find(item => String(item.idEquipamento) === select.value);
        if (!servidor) {
          pararAtualizacaoGold();
          estadoDashboard.servidor = null;
          estadoDashboard.usuario = usuario;
          estadoDashboard.limites = {};
          estadoDashboard.status = 'idle';
          estadoDashboard.erro = null;
          limparDadosGold();
          urlAtual.searchParams.delete('idEquipamento');
          window.history.replaceState({}, '', urlAtual);
          elemento('servidor-resumo').innerHTML = '<span class="resumo-placeholder">Selecione um servidor para ver os dados de identificação.</span>';
          elemento('limites-servidor').replaceChildren();
          definirMensagemServidor(`${servidores.length} servidor${servidores.length === 1 ? '' : 'es'} disponível${servidores.length === 1 ? '' : 'is'} na sua empresa.`);
          elemento('contexto-servidor').textContent = 'Selecione um servidor para carregar os dados de previsibilidade do Gold.';
          return;
        }
        mostrarResumoServidor(servidor);
        carregarLimitesCadastrados(servidor, usuario);
        iniciarAtualizacaoGold(servidor, usuario);
        urlAtual.searchParams.set('idEquipamento', select.value);
        window.history.replaceState({}, '', urlAtual);
        definirMensagemServidor('Servidor selecionado. Carregando arquivo dash-previsibilidade do Gold...');
      });

      const idDaUrl = new URLSearchParams(window.location.search).get('idEquipamento');
      const servidorDaUrl = servidores.find(item => String(item.idEquipamento) === idDaUrl);
      if (servidorDaUrl) {
        select.value = idDaUrl;
        mostrarResumoServidor(servidorDaUrl);
        carregarLimitesCadastrados(servidorDaUrl, usuario);
        iniciarAtualizacaoGold(servidorDaUrl, usuario);
      }
    })
    .catch(erro => {
      estadoDashboard.status = 'error';
      estadoDashboard.erro = erro.message || 'não foi possível consultar os servidores.';
      select.replaceChildren(new Option('Lista de servidores indisponível', ''));
      definirMensagemServidor(`Erro ao consultar servidores: ${estadoDashboard.erro}`);
      renderizarDashboard();
    });
}

function instalarControles() {
  document.querySelectorAll('[data-componente]').forEach(botao => {
    botao.addEventListener('click', () => {
      document.querySelectorAll('[data-componente]').forEach(outro => {
        outro.classList.toggle('ativo', outro === botao);
        outro.setAttribute('aria-pressed', String(outro === botao));
      });
      estadoDashboard.componente = botao.dataset.componente;
      atualizarAvisoAmostras();
      atualizarGraficoTendencia();
    });
  });
}

criarGraficos();
instalarControles();
renderizarDashboard();
carregarServidoresDaEmpresa();
