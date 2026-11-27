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

const eixoTexto = '#d0cedd';
if (typeof Chart !== 'undefined') {
  Chart.defaults.font.size = 13;
  Chart.defaults.color = '#d0cedd';
}
const eixoComum = {
  ticks: { color: eixoTexto, maxTicksLimit: 8, font: { size: 13 } },
  grid: { color: 'rgba(139,134,155,.12)' },
  border: { color: '#5c6288' }
};

let graficoTendencia;
let graficosTendenciaTv = {};
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

function formatarRequisicoesEmMilhares(valor) {
  const convertido = numero(valor);
  return convertido === null ? '—' : formatarNumero(convertido * 1000, 0);
}

function formatarPercentual(valor) {
  const convertido = numero(valor);
  return convertido === null ? '—' : `${formatarNumero(convertido, 2)}%`;
}

function converterData(valor) {
  if (!valor) return null;
  const texto = String(valor).trim();
  const dataDireta = new Date(valor instanceof Date ? valor.getTime() : texto);
  if (!Number.isNaN(dataDireta.getTime())) return dataDireta;

  const textoLocal = texto.replace(/^(\d{4}-\d{2}-\d{2})\s+/, '$1T');
  const dataLocal = new Date(textoLocal);
  return Number.isNaN(dataLocal.getTime()) ? null : dataLocal;
}

function formatarData(valor, incluirHora = true) {
  if (!valor) return 'data não informada';
  const data = converterData(valor);
  if (!data) return String(valor);
  return data.toLocaleString('pt-BR', incluirHora
    ? { dateStyle: 'short', timeStyle: 'short' }
    : { dateStyle: 'short' });
}

function definirMensagemServidor(texto) {
  elemento('mensagem-servidor').textContent = texto;
}

function mensagemEstadoVazio(mensagemEspecifica) {
  if (estadoDashboard.status === 'loading') return 'Carregando os dados do Gold…';
  if (mensagemEspecifica) return `Dados indisponíveis: ${mensagemEspecifica}`;
  if (estadoDashboard.status === 'missing') return estadoDashboard.erro || 'Ainda não há arquivo de previsibilidade no Gold para este servidor.';
  if (estadoDashboard.status === 'error') return `Falha na consulta: ${estadoDashboard.erro || 'não foi possível consultar os dados do servidor.'}`;
  if (!estadoDashboard.servidor) return estadoDashboard.usuario
    ? 'Selecione um servidor para consultar o Gold.'
    : 'Entre no sistema e selecione um servidor para consultar o Gold.';
  return 'O Gold não contém dados para este gráfico.';
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

function origemLimiteRecurso(chave, tipo, recurso = recursoAtual(chave)) {
  if (numero(estadoDashboard.limites[chave]?.[tipo]) !== null) return 'cadastro do servidor';
  const campoGold = tipo === 'critico' ? 'limite_critico' : 'limite_atencao';
  return numero(recurso?.[campoGold]) !== null ? 'Gold' : null;
}

function obterJanelaAmostras(pontos) {
  const datas = (Array.isArray(pontos) ? pontos : [])
    .map(ponto => dataValida(ponto?.data_hora ?? ponto?.amostra?.data_hora))
    .filter(Boolean)
    .sort((a, b) => a - b);
  if (!datas.length) return null;
  const inicio = datas[0];
  const fim = datas[datas.length - 1];
  return inicio.getTime() === fim.getTime()
    ? formatarData(fim)
    : `${formatarData(inicio)} – ${formatarData(fim)}`;
}

function recursoTemProjecao(recurso) {
  return pontosPrevisao(recurso).some(ponto => ponto.dia > 0) || numero(recurso?.tendencia_por_dia) !== null;
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
  const critico = limiteRecurso(chave, 'critico', recurso);
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

function estadoRunway(chave, recurso = recursoAtual(chave), dias = calcularRunwayDias(chave, recurso)) {
  const atual = valorAtual(chave, recurso);
  const atencao = limiteRecurso(chave, 'atencao', recurso);
  const critico = limiteRecurso(chave, 'critico', recurso);

  if (atual !== null && critico !== null && atual >= critico) {
    return {
      classe: 'critico',
      rotulo: 'CRÍTICO',
      mensagem: atual > critico ? 'Limite crítico ultrapassado' : 'Limite crítico atingido',
      cor: '#ff5c5c'
    };
  }
  if (dias !== null && dias > 0) {
    return {
      classe: 'alerta',
      rotulo: 'ALERTA',
      mensagem: `Limite crítico previsto em aproximadamente ${formatarNumero(dias)} dias`,
      cor: '#f5c542'
    };
  }
  if (atual !== null && atencao !== null && atual >= atencao) {
    return { classe: 'atencao', rotulo: 'ATENÇÃO', mensagem: 'Uso acima do limite de atenção', cor: '#f5c542' };
  }
  if (atual !== null && critico !== null && recursoTemProjecao(recurso)) {
    return { classe: 'normal', rotulo: 'NORMAL', mensagem: 'Sem alerta previsto', cor: '#3ddc84' };
  }
  if (atual !== null && critico !== null) {
    return { classe: 'indisponivel', rotulo: 'SEM PREVISÃO', mensagem: 'Uso abaixo do limite, mas o Gold não trouxe tendência ou projeção para estimar o risco', cor: '#aaa8ba' };
  }
  return { classe: 'indisponivel', rotulo: 'N/D', mensagem: 'Dados insuficientes para indicar o estado', cor: '#aaa8ba' };
}

function atualizarEstadosSeletoresRunway() {
  Object.keys(recursosDashboard).forEach(chave => {
    const recurso = recursoAtual(chave);
    const estado = estadoRunway(chave, recurso);
    document.querySelectorAll(`[data-status-componente="${chave}"]`).forEach(indicador => {
      indicador.hidden = estado.classe === 'normal' || estado.classe === 'indisponivel';
      indicador.className = `runway-sinal runway-sinal--${estado.classe} seletor-status`;
      indicador.textContent = estado.rotulo;
      indicador.title = estado.mensagem;
    });
  });
}

function mensagemRunwayIndisponivel() {
  const recursos = Object.keys(recursosDashboard).map(chave => ({
    chave,
    recurso: recursoAtual(chave),
    previsoes: pontosPrevisao(recursoAtual(chave))
  }));
  const temPrevisaoGold = recursos.some(item => item.previsoes.length);
  const temTendencia = recursos.some(item => numero(item.recurso?.tendencia_por_dia) !== null);
  if (!temPrevisaoGold && !temTendencia) {
    return 'O Gold não trouxe pontos de previsão nem tendência diária para estimar um prazo.';
  }
  if (recursos.some(item => item.previsoes.length && limiteRecurso(item.chave, 'critico', item.recurso) === null)) {
    return 'Não há limite crítico cadastrado no servidor nem informado pelo Gold para comparar com a previsão.';
  }
  if (recursos.some(item => item.previsoes.length && valorAtual(item.chave, item.recurso) === null)) {
    return 'O Gold não trouxe o valor atual necessário para calcular o prazo.';
  }
  return 'A previsão disponível não cruza o limite crítico e a tendência não indica crescimento positivo para estimar uma data.';
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

function listaRecursosPriorizados() {
  const prioridade = { critico: 0, alerta: 1, atencao: 2, normal: 3, indisponivel: 4 };
  return Object.keys(recursosDashboard).map(chave => {
    const recurso = recursoAtual(chave);
    const atual = valorAtual(chave, recurso);
    const limiteCritico = limiteRecurso(chave, 'critico', recurso);
    const dias = calcularRunwayDias(chave, recurso);
    return { chave, recurso, atual, limiteCritico, dias, estado: estadoRunway(chave, recurso, dias) };
  }).filter(item => item.recurso && item.atual !== null)
    .sort((a, b) => prioridade[a.estado.classe] - prioridade[b.estado.classe] ||
      (a.dias ?? Number.POSITIVE_INFINITY) - (b.dias ?? Number.POSITIVE_INFINITY));
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

function atualizarResumoExecutivo() {
  const painel = document.querySelector('.resumo-executivo');
  const titulo = elemento('titulo-resumo-executivo');
  const texto = elemento('texto-resumo-executivo');
  const contexto = elemento('contexto-resumo-executivo');
  const definir = (classe, tituloTexto, textoConteudo, contextoTexto = '') => {
    painel.className = `painel resumo-executivo resumo-executivo--${classe}`;
    titulo.textContent = tituloTexto;
    texto.textContent = textoConteudo;
    contexto.textContent = contextoTexto;
  };

  if (!estadoDashboard.dados) {
    const tituloEstado = estadoDashboard.status === 'loading'
      ? 'Consultando dados do servidor'
      : estadoDashboard.status === 'error'
        ? 'Falha ao consultar os dados'
        : estadoDashboard.status === 'missing'
          ? 'Dados de previsibilidade ainda não disponíveis'
          : 'Aguardando seleção do servidor';
    definir('indisponivel', tituloEstado, mensagemEstadoVazio());
    return;
  }

  const recursos = listaRecursosPriorizados();
  if (!recursos.length) {
    definir('indisponivel', 'Leitura de capacidade indisponível',
      'O Gold não trouxe valores atuais de CPU, memória ou disco para orientar uma decisão.');
    return;
  }

  const principal = recursos[0];
  const { chave, recurso, atual, limiteCritico, dias, estado } = principal;
  const nome = recursosDashboard[chave].nome;
  const recursosSemLimite = recursos.filter(item => item.limiteCritico === null);
  const recursosSemPrevisao = recursos.filter(item => item.limiteCritico !== null && !recursoTemProjecao(item.recurso));
  let classeResumo = estado.classe;
  let tituloTexto;
  let textoConteudo;
  if (estado.classe === 'critico') {
    tituloTexto = 'Ação imediata necessária';
    textoConteudo = `${nome} está em ${formatarPercentual(atual)}${limiteCritico === null ? '' : atual > limiteCritico ? `, acima do limite crítico de ${formatarPercentual(limiteCritico)}` : `, no limite crítico de ${formatarPercentual(limiteCritico)}`}. Valide a carga atual e o plano de capacidade deste servidor.`;
  } else if (estado.classe === 'alerta') {
    tituloTexto = 'Planeje capacidade antes do cruzamento estimado';
    textoConteudo = `${nome} está em ${formatarPercentual(atual)} e pode atingir o limite crítico de ${formatarPercentual(limiteCritico)} em aproximadamente ${formatarNumero(dias)} dias. Revise o plano de capacidade considerando essa estimativa.`;
  } else if (estado.classe === 'atencao') {
    tituloTexto = 'Acompanhe o recurso em atenção';
    textoConteudo = `${nome} está em ${formatarPercentual(atual)}, acima do limite de atenção${limiteCritico === null ? '' : ` e ${formatarNumero(limiteCritico - atual)} p.p. abaixo do crítico (${formatarPercentual(limiteCritico)})`}. Acompanhe as próximas medições.`;
  } else if (estado.classe === 'indisponivel') {
    classeResumo = 'indisponivel';
    if (limiteCritico === null) {
      tituloTexto = 'Leitura parcial dos limites';
      textoConteudo = `${recursosSemLimite.map(item => recursosDashboard[item.chave].nome).join(', ')} sem limite crítico para comparação. Não é possível estimar o prazo de capacidade para esses recursos.`;
    } else {
      tituloTexto = 'Previsão de capacidade indisponível';
      textoConteudo = `${nome} está em ${formatarPercentual(atual)} e abaixo do limite crítico, mas o Gold não trouxe uma projeção ou tendência para estimar quando esse limite pode ser atingido.`;
    }
  } else if (estado.classe === 'normal' && (recursosSemLimite.length || recursosSemPrevisao.length)) {
    classeResumo = 'indisponivel';
    tituloTexto = 'Leitura parcial da capacidade';
    const detalhesParciais = [];
    if (recursosSemLimite.length) detalhesParciais.push(`sem limite crítico: ${recursosSemLimite.map(item => recursosDashboard[item.chave].nome).join(', ')}`);
    if (recursosSemPrevisao.length) detalhesParciais.push(`sem projeção ou tendência: ${recursosSemPrevisao.map(item => recursosDashboard[item.chave].nome).join(', ')}`);
    textoConteudo = `Nenhum cruzamento previsto nos recursos avaliáveis. Leitura parcial — ${detalhesParciais.join('; ')}.`;
  } else {
    tituloTexto = 'Nenhum alerta de capacidade identificado';
    textoConteudo = `${nome} está em ${formatarPercentual(atual)}${limiteCritico === null ? '' : `, abaixo do limite crítico de ${formatarPercentual(limiteCritico)}`}. A previsão disponível não indica cruzamento; isso não significa que exista uma data estimada para todos os recursos.`;
  }

  const amostras = Array.isArray(recurso.serie_10_minutos) ? recurso.serie_10_minutos : [];
  const janela = obterJanelaAmostras(amostras);
  const ultimaAmostra = amostras.slice().reverse().find(ponto => ponto?.data_hora)?.data_hora;
  const quantidade = numero(recurso.quantidade_amostras);
  const fonteLimite = origemLimiteRecurso(chave, 'critico', recurso);
  const contextoPartes = [];
  if (janela) contextoPartes.push(`Janela observada: ${janela}`);
  if (quantidade !== null) contextoPartes.push(`${formatarNumero(quantidade, 0)} amostras`);
  if (ultimaAmostra) contextoPartes.push(`Última amostra: ${formatarData(ultimaAmostra)}`);
  if (fonteLimite) contextoPartes.push(`Limite: ${fonteLimite}`);
  if (recursosSemLimite.length) {
    contextoPartes.push(`Sem limite crítico: ${recursosSemLimite.map(item => recursosDashboard[item.chave].nome).join(', ')}`);
  }
  if (recursosSemPrevisao.length) {
    contextoPartes.push(`Sem projeção ou tendência: ${recursosSemPrevisao.map(item => recursosDashboard[item.chave].nome).join(', ')}`);
  }
  definir(classeResumo, tituloTexto, textoConteudo, contextoPartes.join(' · '));
}

function atualizarKpis() {
  const dados = estadoDashboard.dados;
  if (!dados) {
    const erro = mensagemEstadoVazio();
    definirKpi('kpi-maior-uso', 'kpi-maior-uso-descricao', 'N/D', erro, 'azul');
    definirKpi('kpi-proximo-limite', 'kpi-proximo-limite-descricao', 'N/D', erro, 'azul');
    definirKpi('kpi-requisicoes', 'kpi-requisicoes-descricao', 'N/D', 'Métricas HTTP não disponíveis no Gold.', 'azul');
    definirKpi('kpi-taxa-erros', 'kpi-taxa-erros-descricao', 'N/D', 'Métricas HTTP não disponíveis no Gold.', 'azul');
    elemento('status-sla-texto').textContent = 'SLA: indisponível no Gold';
    elemento('status-sla').classList.add('indisponivel');
    return;
  }

  const recursos = listaRecursosComValor();
  const recursosComLimite = recursos.filter(item => item.critico !== null && item.critico > 0);
  const maisProximo = recursosComLimite.sort((a, b) => (b.atual / b.critico) - (a.atual / a.critico))[0];
  if (maisProximo) {
    const percentualDoLimite = (maisProximo.atual / maisProximo.critico) * 100;
    const descricao = `${recursosDashboard[maisProximo.chave].nome} · ${formatarPercentual(maisProximo.atual)} atual / ${formatarPercentual(maisProximo.critico)} crítico`;
    definirKpi('kpi-maior-uso', 'kpi-maior-uso-descricao', formatarPercentual(percentualDoLimite), descricao, corDeEstado(maisProximo));
  } else {
    definirKpi('kpi-maior-uso', 'kpi-maior-uso-descricao', 'N/D', 'Sem limites críticos para comparar o risco entre CPU, memória e disco.', 'azul');
  }

  const runways = Object.keys(recursosDashboard).map(chave => {
    const recurso = recursoAtual(chave);
    return { chave, recurso, dias: calcularRunwayDias(chave, recurso) };
  }).filter(item => item.dias !== null && item.dias >= 0);
  runways.sort((a, b) => a.dias - b.dias);
  if (runways.length) {
    const proximo = runways[0];
    const limite = limiteRecurso(proximo.chave, 'critico', proximo.recurso);
    const estado = estadoRunway(proximo.chave, proximo.recurso, proximo.dias);
    const atual = valorAtual(proximo.chave, proximo.recurso);
    const valor = proximo.dias === 0
      ? atual > limite ? 'Ultrapassado' : 'No limite'
      : `~${formatarNumero(proximo.dias)} dias`;
    const nivel = estado.classe === 'critico' ? 'vermelho' : 'amarelo';
    const detalhe = `${recursosDashboard[proximo.chave].nome} · ${estado.rotulo}${limite === null ? '' : ` · limite ${formatarPercentual(limite)}`}`;
    definirKpi('kpi-proximo-limite', 'kpi-proximo-limite-descricao', valor, detalhe, nivel);
  } else {
    definirKpi('kpi-proximo-limite', 'kpi-proximo-limite-descricao', 'N/D', mensagemRunwayIndisponivel(), 'azul');
  }

  const requisicoes = dados.requisicoes || {};
  const serieRequisicoesGold = Array.isArray(requisicoes.serie) ? requisicoes.serie : [];
  const somarCampo = campo => serieRequisicoesGold.reduce((total, item) => total + (numero(item[campo]) || 0), 0);
  const totalRequisicoes = numero(requisicoes.total_requisicoes) ?? (serieRequisicoesGold.length ? somarCampo('requisicoes') : null);
  const totalSucessos = numero(requisicoes.total_sucessos) ?? (serieRequisicoesGold.length ? somarCampo('sucessos') : null);
  const errosInformadosNaSerie = serieRequisicoesGold.length > 0
    && serieRequisicoesGold.every(item => numero(item.erros) !== null);
  const totalErros = numero(requisicoes.total_erros)
    ?? (errosInformadosNaSerie ? somarCampo('erros') : null);
  if (requisicoes.disponivel && totalRequisicoes !== null) {
    const janelaHttp = obterJanelaAmostras(serieRequisicoesGold);
    const descricao = `${formatarNumero(totalSucessos, 0)} sucessos · ${formatarNumero(totalErros, 0)} erros${janelaHttp ? ` · ${janelaHttp}` : ' · período não informado pelo Gold'}`;
    const corRequisicoes = totalErros === null ? 'azul' : totalErros > 0 ? 'amarelo' : 'verde';
    definirKpi('kpi-requisicoes', 'kpi-requisicoes-descricao', formatarNumero(totalRequisicoes, 0), descricao, corRequisicoes);
  } else {
    definirKpi('kpi-requisicoes', 'kpi-requisicoes-descricao', 'N/D', requisicoes.motivo || 'O Gold não contém contagem de requisições.', 'azul');
  }

  if (requisicoes.disponivel && totalRequisicoes > 0 && totalErros !== null) {
    const taxaErros = (totalErros / totalRequisicoes) * 100;
    const janelaHttp = obterJanelaAmostras(serieRequisicoesGold);
    const detalheTaxaErros = `${formatarNumero(totalErros, 0)} falhas em ${formatarNumero(totalRequisicoes, 0)} requisições${janelaHttp ? ` · ${janelaHttp}` : ''}`;
    definirKpi('kpi-taxa-erros', 'kpi-taxa-erros-descricao', formatarPercentual(taxaErros), detalheTaxaErros, totalErros > 0 ? 'amarelo' : 'verde');
  } else {
    const motivoTaxaErros = requisicoes.motivo || (totalRequisicoes === 0
      ? 'Nenhuma requisição registrada no período.'
      : 'O Gold não fornece contagens suficientes para calcular essa taxa.');
    definirKpi('kpi-taxa-erros', 'kpi-taxa-erros-descricao', 'N/D', motivoTaxaErros, 'azul');
  }

  const sla = dados.disponibilidade_sla || {};
  const percentualSla = numero(sla.disponibilidade_percentual ?? sla.percentual);
  if (sla.disponivel === true && percentualSla !== null) {
    elemento('status-sla-texto').textContent = `SLA informado pelo Gold: ${formatarPercentual(percentualSla)}`;
    elemento('status-sla').classList.remove('indisponivel');
  } else {
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
  return converterData(valor);
}

function rotuloData(valor) {
  const data = dataValida(valor);
  return data ? data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).replace(',', '') : String(valor || 'Amostra');
}

function opcoesGraficoTendencia(modoTv = false) {
  return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: modoTv ? 'bottom' : 'top', labels: { color: '#c5c3cd', boxWidth: 14, padding: modoTv ? 8 : 12, font: { size: 13 }, filter: item => !item.text.startsWith('Limite inferior') } },
        tooltip: { filter: item => item.raw !== null, callbacks: { label: item => `${item.dataset.label}: ${formatarPercentual(item.parsed.y)}` } }
      },
      scales: {
        x: {
          ...eixoComum,
          title: { display: !modoTv, text: 'Amostras observadas · Base = última amostra · D+n = horizonte informado pelo Gold', color: eixoTexto },
          ticks: {
            color: eixoTexto,
            font: { size: 13 },
            autoSkip: false,
            maxRotation: 0,
            callback: function (valor, indice) {
              const rotulo = String(this.getLabelForValue(valor));
              const labelsAtuais = this.chart.data.labels;
              const primeiroDiaPrevisto = labelsAtuais.findIndex(label => String(label).startsWith('D+'));
              const totalHistorico = primeiroDiaPrevisto === -1 ? labelsAtuais.length : primeiroDiaPrevisto;
              const totalDiasPrevistos = Math.max(0, labelsAtuais.length - totalHistorico);
              const largura = this.chart.chartArea?.width || this.chart.width || 600;
              const maxRotulos = Math.max(modoTv ? 4 : 5, Math.floor(largura / (modoTv ? 78 : 82)));

              if (rotulo.startsWith('D+')) {
                const dia = Number(rotulo.slice(2));
                const vagasPrevisao = Math.max(3, maxRotulos - Math.min(6, totalHistorico));
                const intervaloDias = Math.max(1, Math.ceil(totalDiasPrevistos / vagasPrevisao));
                return dia === 1 || dia === totalDiasPrevistos || dia % intervaloDias === 0 ? rotulo : '';
              }

              const vagasHistorico = Math.max(2, maxRotulos - Math.min(totalDiasPrevistos, maxRotulos - 2));
              const intervaloHistorico = Math.max(1, Math.ceil(totalHistorico / vagasHistorico));
              const rotuloHistorico = modoTv ? rotulo.slice(0, 5) : rotulo;
              if (rotuloHistorico === 'Base') return '';
              return indice === 0 || indice === totalHistorico - 1 || indice % intervaloHistorico === 0 ? rotuloHistorico : '';
            }
          }
        },
        y: { min: 0, max: 100, ...eixoComum, title: { display: true, text: 'Uso do recurso (%)', color: eixoTexto }, ticks: { ...eixoComum.ticks, callback: valor => `${valor}%` } }
      }
  };
}

function criarGraficos() {
  const criarTendencia = (canvasId, modoTv = false) => new Chart(elemento(canvasId), {
    type: 'line',
    data: { labels: [], datasets: [] },
    options: opcoesGraficoTendencia(modoTv)
  });
  graficoTendencia = criarTendencia('grafico-tendencia');
  graficosTendenciaTv = Object.fromEntries(Object.keys(recursosDashboard).map(chave => [
    chave,
    criarTendencia(`grafico-tendencia-tv-${chave}`, true)
  ]));

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
      legend: { labels: { color: '#c5c3cd', boxWidth: 12, padding: 10, font: { size: 13 }, filter: item => !item.text.startsWith('Faixa ') } },
      tooltip: { callbacks: { label: item => {
        const unidade = item.dataset.yAxisID === 'cpu' ? '%' : ' ms';
        return `${item.dataset.label}: ${formatarNumero(item.parsed.y, 2)}${unidade}`;
      } } }
    },
    scales: {
      x: { type: 'linear', min: 0, ...eixoComum, title: { display: true, text: 'Número de requisições', color: eixoTexto }, ticks: { ...eixoComum.ticks, maxTicksLimit: 14, stepSize: 50, callback: valor => formatarNumero(valor, 0) } },
      [tipo]: tipo === 'cpu'
        ? { type: 'linear', position: 'left', min: 0, max: 100, ...eixoComum, title: { display: true, text: 'Uso de CPU (%)', color: '#20baf4' }, ticks: { ...eixoComum.ticks, callback: valor => `${formatarNumero(valor, 0)}%` } }
        : { type: 'linear', position: 'left', beginAtZero: true, ...eixoComum, title: { display: true, text: 'Latência (ms)', color: '#ff9f32' }, ticks: { ...eixoComum.ticks, callback: valor => `${formatarNumero(valor, 0)} ms` } }
    }
  };
}

function atualizarGraficoTendencia(chave = estadoDashboard.componente, grafico = graficoTendencia, sufixo = '') {
  const config = recursosDashboard[chave];
  const recurso = recursoAtual(chave);
  const sufixoId = sufixo ? `-${sufixo}` : '';
  const canvasId = `grafico-tendencia${sufixoId}`;
  const estadoId = `estado-grafico-tendencia${sufixoId}`;
  const contexto = elemento(`contexto-tendencia${sufixoId}`);
  contexto.replaceChildren();
  if (!recurso) {
    grafico.data = { labels: [], datasets: [] };
    grafico.update();
    const erro = estadoDashboard.dados ? `o Gold não trouxe dados de ${config.nome} para este servidor.` : null;
    contexto.textContent = mensagemEstadoVazio(erro);
    mostrarEstadoGrafico(canvasId, estadoId, false, erro);
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
  if (previsoesDiarias.length && labels.length) labels[labels.length - 1] = 'Base';
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
    datasets.push({ label: 'Faixa (variação)', data: valoresSuperiores, borderColor: 'transparent', backgroundColor: corComAlpha(cor, 0.13), pointRadius: 0, fill: { target: indiceInferior } });
  }

  datasets.push({
    label: 'Uso observado',
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
    datasets.push({ label: 'Previsão Gold', data: previsao, borderColor: cor, borderWidth: 2.2, borderDash: [7, 5], pointRadius: previsoesDiarias.map(item => item.pontoGold ? 3 : 0), pointHoverRadius: 5, tension: 0, spanGaps: false });
  }

  grafico.data = { labels, datasets };
  grafico.update();
  const temDadosGrafico = dadosHistoricos.some(valor => valor !== null) || previsoes.some(item => numero(item.estimativa) !== null);
  mostrarEstadoGrafico(
    canvasId,
    estadoId,
    temDadosGrafico,
    temDadosGrafico ? null : `o Gold não trouxe pontos de série para ${config.nome}.`
  );

  const valoresContexto = [
    ['Atual', formatarPercentual(valorAtual(chave, recurso))],
    ['Amostras', formatarNumero(recurso.quantidade_amostras, 0)],
    ['Janela observada', obterJanelaAmostras(historico) || 'período não informado'],
    ['Limite crítico', limite === null ? 'não informado' : `${formatarPercentual(limite)} · ${origemLimiteRecurso(chave, 'critico', recurso)}`]
  ];
  const p95 = numero(recurso.p95);
  const maximo = numero(recurso.maximo);
  if (p95 !== null) valoresContexto.push(['P95 histórico', formatarPercentual(p95)]);
  if (maximo !== null) valoresContexto.push(['Máximo observado', formatarPercentual(maximo)]);
  const tendencia = numero(recurso.tendencia_por_dia);
  if (tendencia !== null) valoresContexto.push(['Tendência', `${formatarNumero(tendencia, 3)} p.p./dia`]);
  const runway = calcularRunwayDias(chave, recurso);
  if (runway !== null && runway >= 0) {
    valoresContexto.push(['Prazo estimado', runway === 0 ? 'no limite' : `~${formatarNumero(runway)} dias`]);
  }
  const estadoAtualRunway = estadoRunway(chave, recurso, runway);
  if (['alerta', 'critico', 'atencao'].includes(estadoAtualRunway.classe)) {
    const indicador = document.createElement('span');
    indicador.className = `runway-sinal runway-sinal--${estadoAtualRunway.classe}`;
    indicador.textContent = `${estadoAtualRunway.rotulo} · ${estadoAtualRunway.mensagem}`;
    contexto.appendChild(indicador);
  }
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
  }
  if (sufixo) {
    const status = estadoDashboard.dados?.status_previsao?.[chave] || {};
    const amostras = numero(recurso.quantidade_amostras ?? status.quantidade_amostras) ?? 0;
    const minimo = Number(estadoDashboard.dados?.minimo_amostras_previsao || 3);
    const avisoAmostras = document.createElement('span');
    avisoAmostras.textContent = previsoes.length && amostras >= minimo
      ? `Previsão Gold · ${formatarNumero(amostras, 0)} amostras`
      : status.mensagem || recurso.mensagem_previsao || `Previsão indisponível · ${formatarNumero(amostras, 0)} de ${minimo} amostras mínimas`;
    contexto.appendChild(avisoAmostras);
  }
}

function atualizarGraficosTendenciaTv() {
  Object.keys(recursosDashboard).forEach(chave => {
    atualizarGraficoTendencia(chave, graficosTendenciaTv[chave], `tv-${chave}`);
  });
}

function atualizarGraficoRunway() {
  const detalhes = elemento('runway-detalhes');
  const estadoGrafico = elemento('estado-grafico-runway');
  detalhes.replaceChildren();
  const runways = Object.keys(recursosDashboard).map(chave => {
    const recurso = recursoAtual(chave);
    return { chave, recurso, dias: calcularRunwayDias(chave, recurso), atual: valorAtual(chave, recurso), limite: limiteRecurso(chave, 'critico', recurso) };
  }).filter(item => item.recurso && item.atual !== null);
  const prioridade = { critico: 0, alerta: 1, atencao: 2, normal: 3, indisponivel: 4 };
  runways.sort((a, b) => prioridade[estadoRunway(a.chave, a.recurso, a.dias).classe] - prioridade[estadoRunway(b.chave, b.recurso, b.dias).classe]);

  if (!runways.length) {
    const erro = estadoDashboard.dados ? mensagemRunwayIndisponivel() : null;
    estadoGrafico.hidden = false;
    estadoGrafico.textContent = mensagemEstadoVazio(erro);
    return;
  }
  estadoGrafico.hidden = true;
  estadoGrafico.textContent = '';
  runways.forEach(item => {
    const linha = document.createElement('div');
    linha.className = `runway-card runway-card--${estadoRunway(item.chave, item.recurso, item.dias).classe}`;
    linha.setAttribute('role', 'listitem');
    const estado = estadoRunway(item.chave, item.recurso, item.dias);
    linha.style.setProperty('--runway-cor', estado.cor);

    const cabecalho = document.createElement('div');
    cabecalho.className = 'runway-card-cabecalho';
    const nome = document.createElement('strong');
    nome.className = 'runway-nome';
    nome.textContent = recursosDashboard[item.chave].nome;
    const sinal = document.createElement('span');
    sinal.className = `runway-sinal runway-sinal--${estado.classe}`;
    sinal.textContent = estado.rotulo;
    sinal.title = estado.mensagem;
    cabecalho.append(nome, sinal);

    const leitura = document.createElement('div');
    leitura.className = 'runway-leitura';
    const atual = document.createElement('strong');
    atual.textContent = `${formatarPercentual(item.atual)} atual`;
    const limite = document.createElement('span');
    limite.textContent = item.limite === null ? 'Limite não informado' : `Limite crítico ${formatarPercentual(item.limite)}`;
    leitura.append(atual, limite);

    const trilho = document.createElement('div');
    trilho.className = 'runway-trilho';
    trilho.setAttribute('aria-hidden', 'true');
    const escala = Math.max(item.limite !== null && item.limite > 0 ? item.limite * 1.12 : 100, item.atual * 1.06, 1);
    trilho.style.setProperty('--runway-uso', `${Math.min(100, Math.max(0, item.atual / escala * 100))}%`);
    trilho.style.setProperty('--runway-limite', item.limite === null ? '0%' : `${Math.min(100, Math.max(0, item.limite / escala * 100))}%`);
    const preenchimento = document.createElement('span');
    preenchimento.className = 'runway-trilho-uso';
    const marcador = document.createElement('span');
    marcador.className = 'runway-trilho-limite';
    marcador.hidden = item.limite === null;
    trilho.append(preenchimento, marcador);

    const descricao = document.createElement('span');
    descricao.className = 'runway-descricao';
    const origemLimite = origemLimiteRecurso(item.chave, 'critico', item.recurso);
    const detalheLimite = item.limite === null ? 'limite crítico não informado' : `limite crítico ${formatarPercentual(item.limite)}${origemLimite ? ` (${origemLimite})` : ''}`;
    descricao.textContent = `${detalheLimite} · ${estado.mensagem}`;

    linha.append(cabecalho, leitura, trilho, descricao);
    detalhes.appendChild(linha);
  });
}

function atualizarResumoOperacional() {
  const painel = elemento('resumo-operacional');
  painel.replaceChildren();

  if (!estadoDashboard.dados) {
    painel.className = 'painel resumo-operacional resumo-operacional--vazio';
    painel.textContent = mensagemEstadoVazio();
    return;
  }

  const recursos = listaRecursosPriorizados();

  if (!recursos.length) {
    painel.className = 'painel resumo-operacional resumo-operacional--vazio';
    painel.textContent = 'O Gold não trouxe valores atuais para CPU, memória ou disco.';
    return;
  }

  const quantidadeCritica = recursos.filter(item => item.estado.classe === 'critico').length;
  const quantidadePrevista = recursos.filter(item => item.estado.classe === 'alerta').length;
  const quantidadeAtencao = recursos.filter(item => item.estado.classe === 'atencao').length;
  const quantidadeSemLimite = recursos.filter(item => item.limiteCritico === null).length;
  const quantidadeSemPrevisao = recursos.filter(item => item.limiteCritico !== null && !recursoTemProjecao(item.recurso)).length;
  const resumo = document.createElement('div');
  resumo.className = `prioridades-resumo prioridades-resumo--${quantidadeCritica ? 'critico' : quantidadePrevista || quantidadeAtencao ? 'alerta' : quantidadeSemLimite || quantidadeSemPrevisao ? 'indisponivel' : 'normal'}`;
  const resumoTitulo = document.createElement('strong');
  resumoTitulo.textContent = quantidadeCritica
    ? 'Ação imediata necessária'
    : quantidadePrevista
      ? 'Planejamento de capacidade necessário'
      : quantidadeAtencao
        ? 'Acompanhar recursos em atenção'
        : quantidadeSemLimite || quantidadeSemPrevisao
          ? 'Leitura parcial da capacidade'
          : 'Nenhum alerta ativo';
  const resumoTexto = document.createElement('span');
  const contagens = [];
  if (quantidadeCritica) contagens.push(`${quantidadeCritica} acima do limite crítico`);
  if (quantidadePrevista) contagens.push(`${quantidadePrevista} com cruzamento previsto`);
  if (quantidadeAtencao) contagens.push(`${quantidadeAtencao} acima do limite de atenção`);
  if (quantidadeSemLimite) contagens.push(`${quantidadeSemLimite} sem limite crítico`);
  if (quantidadeSemPrevisao) contagens.push(`${quantidadeSemPrevisao} sem tendência ou previsão`);
  resumoTexto.textContent = contagens.length
    ? contagens.join(' · ')
    : 'Nenhum limite crítico atingido ou previsto com os dados disponíveis.';
  resumo.append(resumoTitulo, resumoTexto);
  painel.className = 'painel resumo-operacional';
  painel.appendChild(resumo);

  const lista = document.createElement('div');
  lista.className = 'prioridades-lista';
  recursos.forEach(item => {
    const { chave, recurso, atual, limiteCritico, dias, estado } = item;
    const linha = document.createElement('article');
    linha.className = `prioridade-item prioridade-item--${estado.classe}`;
    linha.style.setProperty('--prioridade-cor', estado.cor);

    const topo = document.createElement('div');
    topo.className = 'prioridade-topo';
    const nome = document.createElement('strong');
    nome.textContent = recursosDashboard[chave].nome;
    const sinal = document.createElement('span');
    sinal.className = `runway-sinal runway-sinal--${estado.classe}`;
    sinal.textContent = estado.rotulo;
    topo.append(nome, sinal);

    const metricas = document.createElement('div');
    metricas.className = 'prioridade-metricas';
    const metricaAtual = document.createElement('div');
    const rotuloAtual = document.createElement('span');
    rotuloAtual.textContent = 'Uso atual';
    const valorAtualEl = document.createElement('strong');
    valorAtualEl.textContent = formatarPercentual(atual);
    metricaAtual.append(rotuloAtual, valorAtualEl);
    const metricaLimite = document.createElement('div');
    const rotuloLimite = document.createElement('span');
    const origemLimite = origemLimiteRecurso(chave, 'critico', recurso);
    rotuloLimite.textContent = origemLimite ? `Limite crítico · ${origemLimite}` : 'Limite crítico';
    const valorLimite = document.createElement('strong');
    valorLimite.textContent = formatarPercentual(limiteCritico);
    metricaLimite.append(rotuloLimite, valorLimite);
    metricas.append(metricaAtual, metricaLimite);

    if (limiteCritico !== null && limiteCritico > 0) {
      const medidor = document.createElement('div');
      medidor.className = 'prioridade-medidor';
      medidor.setAttribute('aria-hidden', 'true');
      const preenchimento = document.createElement('span');
      preenchimento.style.width = `${Math.min(100, Math.max(0, (atual / limiteCritico) * 100))}%`;
      medidor.appendChild(preenchimento);
      linha.append(topo, metricas, medidor);
    } else {
      linha.append(topo, metricas);
    }

    const diferenca = document.createElement('p');
    diferenca.className = 'prioridade-diferenca';
    if (limiteCritico === null) {
      diferenca.textContent = 'Sem limite crítico informado para comparação.';
    } else if (atual > limiteCritico) {
      diferenca.textContent = `${formatarNumero(atual - limiteCritico)} p.p. acima do limite crítico.`;
    } else if (atual === limiteCritico) {
      diferenca.textContent = 'No limite crítico.';
    } else if (estado.classe === 'atencao') {
      diferenca.textContent = `${formatarNumero(limiteCritico - atual)} p.p. abaixo do limite crítico; acima do limite de atenção.`;
    } else {
      diferenca.textContent = `${formatarNumero(limiteCritico - atual)} p.p. disponíveis até o limite crítico.`;
    }

    const orientacao = document.createElement('p');
    orientacao.className = 'prioridade-orientacao';
    if (estado.classe === 'critico') {
      orientacao.textContent = 'Limite já ultrapassado. Priorize a validação da carga e da capacidade deste servidor.';
    } else if (estado.classe === 'alerta') {
      orientacao.textContent = `Limite crítico estimado em aproximadamente ${formatarNumero(dias)} dias.`;
    } else if (estado.classe === 'atencao') {
      orientacao.textContent = 'Uso acima do limite de atenção. Acompanhe as próximas medições.';
    } else if (estado.classe === 'normal') {
      orientacao.textContent = dias === null
        ? 'Abaixo do limite; sem data estimada de cruzamento com a tendência atual.'
        : 'Sem ação imediata indicada pela previsão atual.';
    } else {
      orientacao.textContent = limiteCritico === null
        ? 'Não há limite crítico informado para comparar o uso deste recurso.'
        : 'Uso abaixo do limite, mas sem tendência ou projeção para estimar o risco futuro.';
    }

    const amostras = Array.isArray(recurso.serie_10_minutos) ? recurso.serie_10_minutos : [];
    const ultimaAmostra = amostras.slice().reverse().find(ponto => ponto?.data_hora)?.data_hora;
    const frescor = document.createElement('span');
    frescor.className = 'prioridade-frescor';
    const quantidadeAmostras = numero(recurso.quantidade_amostras);
    frescor.textContent = [
      obterJanelaAmostras(amostras) ? `Janela: ${obterJanelaAmostras(amostras)}` : 'Período das amostras não informado',
      ultimaAmostra ? `Última amostra: ${formatarData(ultimaAmostra)}` : null,
      quantidadeAmostras === null ? null : `${formatarNumero(quantidadeAmostras, 0)} amostras`
    ].filter(Boolean).join(' · ');

    linha.append(diferenca, orientacao, frescor);
    lista.appendChild(linha);
  });
  painel.appendChild(lista);
}

function desvioPadrao(valores) {
  if (valores.length < 2) return null;
  const media = valores.reduce((soma, valor) => soma + valor, 0) / valores.length;
  const variancia = valores.reduce((soma, valor) => soma + ((valor - media) ** 2), 0) / (valores.length - 1);
  return Math.sqrt(variancia);
}

function passoAmigavel(valor) {
  if (!Number.isFinite(valor) || valor <= 0) return 1;
  const escala = 10 ** Math.floor(Math.log10(valor));
  const fracao = valor / escala;
  const fator = fracao <= 1 ? 1 : fracao <= 2 ? 2 : fracao <= 5 ? 5 : 10;
  return fator * escala;
}

function agregarObservacoesPorRequisicao(observacoes) {
  const grupos = new Map();
  observacoes.forEach(ponto => {
    if (!grupos.has(ponto.x)) {
      grupos.set(ponto.x, { x: ponto.x, cpu: [], latencia: [], p95: [], p99: [], amostras: [] });
    }
    const grupo = grupos.get(ponto.x);
    ['cpu', 'latencia', 'p95', 'p99'].forEach(metrica => {
      if (ponto[metrica] !== null) grupo[metrica].push(ponto[metrica]);
    });
    grupo.amostras.push(ponto.amostra);
  });

  const media = valores => valores.length
    ? valores.reduce((soma, valor) => soma + valor, 0) / valores.length
    : null;
  return [...grupos.values()].map(grupo => ({
    x: grupo.x,
    cpu: media(grupo.cpu),
    latencia: media(grupo.latencia),
    p95: media(grupo.p95),
    p99: media(grupo.p99),
    quantidadeAmostras: grupo.amostras.length,
    amostra: grupo.amostras.length === 1 ? grupo.amostras[0] : null
  })).sort((a, b) => a.x - b.x);
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
      ctx.font = '600 10px sans-serif';
      const larguraPlot = chartArea.right - chartArea.left;
      const prefixo = larguraPlot < 220 ? '~' : larguraPlot < 360 ? 'Limite ~' : 'Limite estimado: ~';
      const sufixo = larguraPlot < 220 ? ' req · fora' : larguraPlot < 360 ? ' req · fora da faixa' : ' req (fora da faixa exibida)';
      const texto = `${prefixo}${formatarRequisicoesEmMilhares(config.cruzamento)}${sufixo}`;
      ctx.fillText(texto, Math.max(chartArea.left + 4, chartArea.right - ctx.measureText(texto).width - 4), chartArea.top + 14);
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
    ctx.font = '600 10px sans-serif';
    const rotulo = config.observado ? 'Limite real' : 'Limite';
    ctx.fillText(`${rotulo} · ${formatarRequisicoesEmMilhares(config.cruzamento)} req`, Math.min(x + 5, chartArea.right - 135), chartArea.top + 14);
    ctx.restore();
  }
};

function atualizarGraficosCarga() {
  const requisicoes = estadoDashboard.dados?.requisicoes || {};
  const amostrasOriginais = extrairAmostrasPorRequisicao(requisicoes);
  const observacoes = agregarObservacoesPorRequisicao(amostrasOriginais);
  const cpu = observacoes.filter(ponto => ponto.cpu !== null).map(ponto => ({ x: ponto.x, y: ponto.cpu, amostra: ponto.amostra }));
  const latencia = observacoes.filter(ponto => ponto.latencia !== null).map(ponto => ({ x: ponto.x, y: ponto.latencia, amostra: ponto.amostra }));
  const p95 = observacoes.filter(ponto => ponto.p95 !== null).map(ponto => ({ x: ponto.x, y: ponto.p95, amostra: ponto.amostra }));
  const p99 = observacoes.filter(ponto => ponto.p99 !== null).map(ponto => ({ x: ponto.x, y: ponto.p99, amostra: ponto.amostra }));
  const fonteLatencia = p95.length ? p95 : latencia;
  const cpuModelo = ajustarRegressao(cpu);
  const latenciaModelo = ajustarRegressao(fonteLatencia);
  const p99Modelo = ajustarRegressao(p99);
  const limiteCpu = limiteRecurso('cpu', 'critico');
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
  const larguraGraficoCarga = elemento('grafico-previsao-cpu').parentElement.getBoundingClientRect().width || window.innerWidth;
  const multiplicadorHorizonte = larguraGraficoCarga < 480 ? 1.25 : larguraGraficoCarga < 900 ? 1.5 : 2;
  const horizonteAlvo = Math.max(10, Math.ceil(maiorRequisicaoObservada * multiplicadorHorizonte));
  const divisaoHorizonte = larguraGraficoCarga < 480 ? 5 : 10;
  const incrementoPrevisao = passoAmigavel(horizonteAlvo / divisaoHorizonte);
  const horizonte = Math.ceil(horizonteAlvo / incrementoPrevisao) * incrementoPrevisao;
  const primeiraRequisicaoProjetada = Math.ceil((maiorRequisicaoObservada + 1e-9) / incrementoPrevisao) * incrementoPrevisao;
  const gradePrevisao = [0];
  if (maiorRequisicaoObservada > 0) gradePrevisao.push(maiorRequisicaoObservada);
  for (let requisicoesProjetadas = primeiraRequisicaoProjetada; requisicoesProjetadas <= horizonte; requisicoesProjetadas += incrementoPrevisao) {
    gradePrevisao.push(requisicoesProjetadas);
  }
  const valoresLatenciaObservados = [...latencia, ...p95, ...p99].map(ponto => ponto.y);
  const previsoesLatenciaEscala = [latenciaModelo, p99Modelo].filter(Boolean).flatMap(modelo =>
    gradePrevisao.flatMap(x => {
      const estimativa = estimarRegressao(modelo, x);
      return [estimativa.valor, estimativa.inferior, estimativa.superior].map(valor => Math.max(0, valor));
    })
  );
  const valoresLatenciaEscala = [...valoresLatenciaObservados, ...previsoesLatenciaEscala].filter(Number.isFinite);
  const positivosObservadosLatencia = valoresLatenciaObservados.filter(valor => valor > 0);
  const minimoLatenciaObservada = positivosObservadosLatencia.length ? Math.min(...positivosObservadosLatencia) : null;
  const minimoLatenciaEscala = valoresLatenciaEscala.length ? Math.min(...valoresLatenciaEscala) : null;
  const maximoLatenciaEscala = valoresLatenciaEscala.length ? Math.max(...valoresLatenciaEscala) : null;
  const todosCentraisPositivos = valoresLatenciaObservados.every(valor => valor > 0) &&
    [latenciaModelo, p99Modelo].filter(Boolean).every(modelo =>
      gradePrevisao.every(x => estimarRegressao(modelo, x).valor > 0)
    );
  const usarEscalaLogLatencia = minimoLatenciaObservada !== null && maximoLatenciaEscala !== null &&
    todosCentraisPositivos && maximoLatenciaEscala / minimoLatenciaObservada >= 10;
  const pisoEscalaLogLatencia = usarEscalaLogLatencia ? Math.max(0.1, minimoLatenciaObservada / 1.5) : 0;
  const amplitudeLatencia = minimoLatenciaEscala === null || maximoLatenciaEscala === null
    ? null
    : maximoLatenciaEscala - minimoLatenciaEscala;
  const margemLatencia = amplitudeLatencia === null
    ? 0
    : amplitudeLatencia > 0 ? amplitudeLatencia * 0.15 : Math.max(10, Math.abs(maximoLatenciaEscala) * 0.08);
  const pisoEscalaLinearLatencia = minimoLatenciaEscala === null ? 0 : Math.max(0, minimoLatenciaEscala - margemLatencia);
  const tetoEscalaLinearLatencia = maximoLatenciaEscala === null ? undefined : maximoLatenciaEscala + margemLatencia;

  const configurarEixoRequisicoes = grafico => {
    const eixo = grafico.options.scales.x;
    eixo.type = 'linear';
    eixo.min = 0;
    eixo.max = horizonte;
    eixo.title.text = larguraGraficoCarga < 360
      ? ['Requisições', 'Números em milhares']
      : ['Número de requisições', 'Números em milhares'];
    eixo.ticks.maxTicksLimit = larguraGraficoCarga < 360 ? 8 : 10;
    eixo.ticks.stepSize = incrementoPrevisao;
    eixo.ticks.callback = valor => formatarRequisicoesEmMilhares(valor);
  };
  configurarEixoRequisicoes(graficoPrevisaoCpu);
  configurarEixoRequisicoes(graficoPrevisaoLatencia);

  const eixoLatencia = graficoPrevisaoLatencia.options.scales.latencia;
  eixoLatencia.type = usarEscalaLogLatencia ? 'logarithmic' : 'linear';
  eixoLatencia.beginAtZero = false;
  eixoLatencia.min = usarEscalaLogLatencia ? pisoEscalaLogLatencia : pisoEscalaLinearLatencia;
  eixoLatencia.max = usarEscalaLogLatencia ? maximoLatenciaEscala * 1.15 : tetoEscalaLinearLatencia;
  eixoLatencia.title.text = 'Latência (ms)';
  eixoLatencia.ticks.callback = usarEscalaLogLatencia
    ? valor => Math.abs(Math.log10(valor) - Math.round(Math.log10(valor))) < 1e-8 ? `${formatarNumero(valor, 0)} ms` : ''
    : valor => `${formatarNumero(valor, 0)} ms`;

  const adicionarFaixaEPrevisao = (datasets, modelo, eixo, nome, cor, faixa) => {
    if (!modelo) return;
    const previsoes = gradePrevisao.map(x => ({ x, ...estimarRegressao(modelo, x) }));
    const limitar = valor => eixo === 'cpu'
      ? Math.min(100, Math.max(0, valor))
      : usarEscalaLogLatencia ? Math.max(pisoEscalaLogLatencia, valor) : Math.max(0, valor);
    const indiceInferior = datasets.length;
    datasets.push({ label: `Faixa inferior ${nome}`, data: previsoes.map(ponto => ({ x: ponto.x, y: limitar(ponto.inferior) })), yAxisID: eixo, borderColor: 'transparent', pointRadius: 0, fill: false });
    datasets.push({ label: `Faixa ${nome} (±1,96σ)`, data: previsoes.map(ponto => ({ x: ponto.x, y: limitar(ponto.superior) })), yAxisID: eixo, borderColor: 'transparent', backgroundColor: faixa, pointRadius: 0, fill: { target: indiceInferior } });
    datasets.push({ label: `${nome} estimado por regressão linear`, data: previsoes.map(ponto => ({ x: ponto.x, y: limitar(ponto.valor), inferior: limitar(ponto.inferior), superior: limitar(ponto.superior) })), yAxisID: eixo, borderColor: cor, backgroundColor: cor, borderWidth: 2.2, borderDash: [7, 5], pointRadius: 0, tension: 0 });
  };

  const datasetsCpu = [];
  if (cpu.length) datasetsCpu.push({ label: 'CPU observada', data: cpu, yAxisID: 'cpu', borderColor: '#20baf4', backgroundColor: '#20baf4', borderWidth: 2, pointRadius: 3, pointHoverRadius: 5, showLine: true, tension: 0 });
  adicionarFaixaEPrevisao(datasetsCpu, cpuModelo, 'cpu', 'CPU', '#20baf4', 'rgba(32,186,244,.13)');
  if (limiteCpu !== null) datasetsCpu.push({ label: `Limite crítico CPU (${formatarPercentual(limiteCpu)})`, data: [{ x: 1, y: limiteCpu }, { x: horizonte, y: limiteCpu }], yAxisID: 'cpu', borderColor: '#ff5c5c', borderWidth: 1.5, borderDash: [5, 4], pointRadius: 0 });

  const gradeCpu = cpuModelo ? gradePrevisao.map(x => ({ x, ...estimarRegressao(cpuModelo, x) })) : [];
  const faixaRisco = limiteCpu === null ? null : gradeCpu.find(ponto => ponto.superior >= limiteCpu)?.x ?? null;
  graficoPrevisaoCpu.$zonaCriticaCarga = { limite: limiteCpu, cruzamento, faixaRisco, horizonte, observado: cruzamentoObservado };
  graficoPrevisaoCpu.data = { datasets: datasetsCpu };

  const datasetsLatencia = [];
  if (p95.length) datasetsLatencia.push({ label: 'Latência P95 observada', data: p95, yAxisID: 'latencia', borderColor: '#ff9f32', backgroundColor: '#ff9f32', borderWidth: 2, pointRadius: 3, pointHoverRadius: 5, showLine: true, tension: 0 });
  else if (latencia.length) datasetsLatencia.push({ label: 'Latência observada', data: latencia, yAxisID: 'latencia', borderColor: '#ff9f32', backgroundColor: '#ff9f32', borderWidth: 1.8, pointRadius: 2.5, pointHoverRadius: 5, showLine: true, tension: 0 });
  adicionarFaixaEPrevisao(datasetsLatencia, latenciaModelo, 'latencia', p95.length ? 'Latência P95' : 'Latência', '#ff9f32', 'rgba(255,159,50,.12)');
  if (p99.length) datasetsLatencia.push({ label: 'Latência P99 observada', data: p99, yAxisID: 'latencia', borderColor: '#d879ff', backgroundColor: '#d879ff', borderWidth: 1.6, borderDash: [3, 3], pointRadius: 2.5, pointHoverRadius: 5, showLine: true, tension: 0 });
  adicionarFaixaEPrevisao(datasetsLatencia, p99Modelo, 'latencia', 'Latência P99', '#d879ff', 'rgba(216,121,255,.1)');

  graficoPrevisaoLatencia.data = { datasets: datasetsLatencia };
  const configurarTooltips = (grafico, eixo) => {
    grafico.options.plugins.tooltip.filter = item => !item.dataset.label.startsWith('Faixa ');
    grafico.options.plugins.tooltip.callbacks.title = items => items.length ? `${formatarRequisicoesEmMilhares(items[0].parsed.x)} requisições` : '';
    grafico.options.plugins.tooltip.callbacks.afterBody = items => {
      const ponto = items[0]?.raw;
      const amostra = ponto?.amostra || {};
      const detalhes = [];
      if (ponto?.quantidadeAmostras > 1) {
        return [`Média de ${formatarNumero(ponto.quantidadeAmostras, 0)} amostras nesta quantidade de requisições.`];
      }
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
  if (amostrasOriginais.length) partes.push(`${amostrasOriginais.length} observações do Gold`);
  if (sigmaLatencia !== null) partes.push(`desvio padrão da latência ${formatarNumero(sigmaLatencia, 2)} ms`);
  if (cruzamentoObservado) partes.push(`CPU observada acima do limite desde ~${formatarRequisicoesEmMilhares(cruzamento)} requisições`);
  else if (cpuModelo && limiteCpu !== null && cruzamento !== null) partes.push(`CPU atinge o limite estimado em ~${formatarRequisicoesEmMilhares(cruzamento)} requisições${cruzamento > horizonte ? ` (fora da faixa exibida até ${formatarRequisicoesEmMilhares(horizonte)})` : ''}`);
  else if (cpuModelo && limiteCpu !== null) partes.push('CPU não cruza o limite na projeção exibida');
  else if (cpu.length) partes.push('sem pontos de CPU suficientes em contagens distintas para prever o cruzamento');
  else partes.push('Gold sem série de CPU por requisição para estimar saturação');
  if (!cruzamentoObservado && cruzamento !== null && cruzamento > horizonte && faixaRisco !== null) {
    partes.push(`faixa de risco alcança o limite a partir de ~${formatarRequisicoesEmMilhares(faixaRisco)} requisições`);
  }
  if (limiteCpu === null) partes.push('limite crítico de CPU não cadastrado nem informado pelo Gold');
  else partes.push(`limite crítico de CPU vindo de ${origemLimiteRecurso('cpu', 'critico')}`);
  const modelosCalculados = [cpuModelo, latenciaModelo, p99Modelo].filter(Boolean).length;
  const metodoPrevisao = modelosCalculados
    ? `Estimativa exploratória por regressão linear até ${formatarRequisicoesEmMilhares(horizonte)} requisições, em intervalos de ${formatarRequisicoesEmMilhares(incrementoPrevisao)}. A faixa de variação usa ±1,96 desvios padrão e não é garantia de resultado nem substitui a previsão temporal de 30 dias do Gold.`
    : 'Ainda não há valores em contagens distintas para ajustar uma previsão.';
  resumo.textContent = temCpu || temLatencia ? `${partes.join(' · ')}. ${metodoPrevisao}` : mensagemEstadoVazio(semDados);
  const janelaHttp = obterJanelaAmostras(amostrasOriginais);
  elemento('periodo-teste').textContent = janelaHttp
    ? `Amostras HTTP: ${janelaHttp}`
    : observacoes.length ? `${observacoes.length} pontos · período não informado` : 'Sem amostras HTTP';
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
  atualizarResumoExecutivo();
  atualizarEstadosSeletoresRunway();
  atualizarAvisoAmostras();
  atualizarGraficoTendencia();
  atualizarGraficosTendenciaTv();
  atualizarGraficoRunway();
  atualizarResumoOperacional();
  atualizarGraficosCarga();
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

function instalarModoTv() {
  const raiz = document.documentElement;
  const botao = elemento('alternar-modo-tv');
  const texto = botao.querySelector('span');
  const atualizarBotao = ativo => {
    raiz.classList.toggle('modo-tv', ativo);
    botao.setAttribute('aria-pressed', String(ativo));
    botao.setAttribute('aria-label', ativo ? 'Sair do modo TV' : 'Entrar em modo TV');
    texto.textContent = ativo ? 'Sair do modo TV' : 'Modo TV';
    botao.querySelector('i').className = `fa-solid ${ativo ? 'fa-compress' : 'fa-expand'}`;
    requestAnimationFrame(() => {
      [graficoTendencia, ...Object.values(graficosTendenciaTv), graficoPrevisaoCpu, graficoPrevisaoLatencia]
        .filter(Boolean)
        .forEach(grafico => grafico.resize());
    });
  };

  botao.addEventListener('click', async () => {
    const ativo = !raiz.classList.contains('modo-tv');
    atualizarBotao(ativo);
    if (ativo && !document.fullscreenElement && raiz.requestFullscreen) {
      try {
        await raiz.requestFullscreen();
      } catch (erro) {
        // Keep the compact layout as a fallback when fullscreen is unavailable.
      }
    } else if (!ativo && document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen();
    }
  });

  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) atualizarBotao(true);
    else if (raiz.classList.contains('modo-tv')) atualizarBotao(false);
  });
}

criarGraficos();
instalarControles();
instalarModoTv();
renderizarDashboard();
carregarServidoresDaEmpresa();
