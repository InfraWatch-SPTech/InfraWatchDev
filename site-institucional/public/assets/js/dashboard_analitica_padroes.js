
var cores = { cpu: '#5178F9', ram: '#6FE0FF', disco: '#F5C542', rede: '#B48CFF' };
var medidaComparacao = 'critico';
var contextoFiltros = '';
var escolhasManuais = {};
var NOMES_CURTOS = { almoco: 'Almoço', jantar: 'Jantar', quinto_dia_util: '5º dia útil', feriado: 'Feriados', fim_semana: 'Fim de semana' };

var dados = null;
var graficos = {};
var calor = null;
var consultaAtual = 0;

// ---------------- Funções de apoio ----------------
function elemento(id) { return document.getElementById(id); }
function texto(id, valor) { elemento(id).textContent = valor; }
function nome(componente) { return dados.servidor.nomes[componente] || componente; }
function numero(valor) { return valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 }); }
function percentual(valor) { return valor === null || valor === undefined ? 'Sem dados' : numero(valor) + '%'; }
function nota(valor) { return valor === null || valor === undefined ? 'Sem histórico' : numero(valor); }
function dataCurta(dia) { if (!dia) return '—'; return dia.slice(8, 10) + '/' + dia.slice(5, 7); }
function faixaHora(hora) { return String(hora).padStart(2, '0') + 'h–' + String(hora + 1).padStart(2, '0') + 'h'; }

function duracao(minutos) {
    if (minutos === null || minutos === undefined) return 'Sem dados';
    if (minutos > 0 && minutos < 1) return numero(minutos * 60) + ' s';
    var total = Math.round(minutos);
    return Math.floor(total / 60) + 'h ' + String(total % 60).padStart(2, '0') + 'min';
}

function mostrarErro(mensagem) {
    texto('erro', mensagem);
    elemento('erro').hidden = false;
}

function preencherTabela(id, linhas) {
    var corpo = elemento(id);
    corpo.innerHTML = '';
    for (var i = 0; i < linhas.length; i++) {
        var tr = document.createElement('tr');
        for (var j = 0; j < linhas[i].length; j++) {
            var td = document.createElement('td');
            td.textContent = linhas[i][j];
            tr.appendChild(td);
        }
        corpo.appendChild(tr);
    }
}

// opcoes = [{ valor, texto }] · mantém a escolha anterior se ela ainda existir
function preencherSelect(id, opcoes, valorPadrao) {
    var select = elemento(id);
    var anterior = select.value;
    select.innerHTML = '';
    var existeAnterior = false;
    for (var i = 0; i < opcoes.length; i++) {
        select.add(new Option(opcoes[i].texto, opcoes[i].valor));
        if (opcoes[i].valor === anterior) existeAnterior = true;
    }
    select.value = valorPadrao !== undefined ? valorPadrao : existeAnterior ? anterior : select.value;
}

// ============================================================
// 1. BUSCA DOS DADOS NA API
// ============================================================
async function carregarDados() {
    var consulta = ++consultaAtual;
    var solicitado = elemento('servidor').value;
    elemento('atualizar_dados').disabled = true;
    texto('estado_dados', 'Carregando servidor selecionado…');
    try {
        var url = '/dashboard_analitica_padroes/dados?periodo=' + elemento('periodo').value;
        if (elemento('servidor').value) url += '&servidor=' + elemento('servidor').value;

        var resposta = await fetch(url, { cache: 'no-store', credentials: 'same-origin' });
        if (consulta !== consultaAtual) return;
        if (resposta.status === 401) {
            localStorage.removeItem('usuarioLogado');
            window.location.href = './login.html';
            return;
        }
        var json = await resposta.json();
        if (consulta !== consultaAtual) return;
        if (!resposta.ok) throw new Error(json.erro || 'Não foi possível consultar a dashboard.');
        if (solicitado && String(json.servidor.id) !== solicitado) {
            throw new Error('A API retornou outro servidor. Atualize também o controller.');
        }

        elemento('erro').hidden = true;
        dados = json;
        atualizarDashboard();
    } catch (erro) {
        if (consulta !== consultaAtual) return;
        mostrarErro('Erro ao carregar os dados: ' + erro.message);
        texto('modo_dados', dados ? 'Falha ao atualizar · dados anteriores' : 'Sem conexão com a API');
    } finally {
        if (consulta === consultaAtual) elemento('atualizar_dados').disabled = false;
    }
}

// ============================================================
// 2. CABEÇALHO E FILTROS
// ============================================================
function atualizarDashboard() {
    var contexto = dados.servidor.id + ':' + dados.periodo.dias;
    if (contexto !== contextoFiltros) { escolhasManuais = {}; contextoFiltros = contexto; }
    var servidor = dados.servidor;
    var dias = dados.periodo.dias_com_coleta;

    preencherSelect('servidor', dados.servidores.map(function (s) { return { valor: s.id, texto: s.nome }; }), servidor.id);

    // Seletores: só componentes monitorados · padrão = componente com mais tempo em atenção
    var opcoes = servidor.componentes.map(function (c) { return { valor: c, texto: nome(c) }; });
    preencherSelect('componente_horario', opcoes, escolhasManuais['componente_horario'] ? undefined : dados.padrao.componente);
    preencherSelect('componente_calor', opcoes, escolhasManuais['componente_calor'] ? undefined : dados.padrao.componente);
    preencherSelect('componente_ranking', [{ valor: 'todos', texto: 'Comparar todos' }].concat(opcoes), 'todos');
    var opcoesProcessos = [{ valor: 'cpu', texto: nome('cpu') }, { valor: 'ram', texto: nome('ram') }];
    preencherSelect('componente_lider', opcoesProcessos, escolhasManuais['componente_lider'] ? undefined : dados.padrao.processo);
    preencherSelect('componente_processos', opcoesProcessos, escolhasManuais['componente_processos'] ? undefined : dados.padrao.processo);
    preencherSelect('dia', [{ valor: 'periodo', texto: 'Período todo' }]
        .concat(dias.map(function (d) { return { valor: d, texto: 'Dia ' + dataCurta(d) }; })), 'periodo');

    preencherSelect('periodo_importante', Object.keys(NOMES_CURTOS).map(function (p) { return { valor: p, texto: NOMES_CURTOS[p] + (p === 'almoco' ? ' 12h–14h' : p === 'jantar' ? ' 18h–20h' : '') + (dados.aumento[p].suficiente ? '' : ' · sem base') }; }), escolhasManuais.periodo_importante && dados.aumento[elemento('periodo_importante').value] && dados.aumento[elemento('periodo_importante').value].suficiente ? undefined : dados.padrao.periodo);

    texto('modo_dados', dados.fonte === 'local' ? 'Dados locais' : 'Dados do S3');
    texto('fonte_texto', (dados.fonte === 'local' ? 'Gold local' : 'Gold no S3') + ' · gerada em ' +
        (dados.gerado_em ? new Date(dados.gerado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'data não informada') +
        ' · métricas calculadas pela API.');
    texto('periodo_texto', dados.coleta.amostras
        ? 'Janela: ' + dataCurta(dados.periodo.inicio) + ' a ' + dataCurta(dados.periodo.fim) + '/' + dados.periodo.fim.slice(0, 4) + ' · horário de São Paulo'
        : 'Sem histórico para este servidor');
    texto('estado_dados', dados.coleta.amostras
        ? servidor.nome + ' · ' + duracao(dados.coleta.minutos) + ' monitoradas · ' + dias.length + ' dias com coleta · limites atuais nas duas janelas'
        : 'Servidor cadastrado no banco, mas sem histórico na Gold. Execute a captura deste equipamento e depois o ETL.');

    // Faixa com os limites do cadastro
    var limites = elemento('limites');
    limites.innerHTML = '';
    for (var i = 0; i < servidor.componentes.length; i++) {
        var c = servidor.componentes[i];
        var limite = servidor.limites[c];
        var span = document.createElement('span');
        span.textContent = nome(c) + ': atenção ≥ ' + (limite.atencao !== null ? limite.atencao + '%' : 'não configurado') +
            ' · crítico ≥ ' + (limite.critico !== null ? limite.critico + '%' : 'não configurado');
        limites.appendChild(span);
    }
    if (!servidor.componentes.length) limites.textContent = 'Nenhum componente com limite ativo no cadastro deste servidor.';

    atualizarKpis();
    atualizarRanking();
    atualizarCalor();
    atualizarComparacao();
    atualizarProcessos();
}

// ============================================================
// 3. KPIs
// ============================================================
function atualizarKpis() {
    // KPI 1: componente de uso com mais tempo em atenção
    var maior = dados.mais_atencao;
    var sub;
    if (!maior) {
        texto('kpi_componente', 'Sem dados');
        sub = 'Sem coleta válida';
    } else if (maior.atencao === 0) {
        texto('kpi_componente', 'Nenhum');
        sub = 'Consumo abaixo dos limites';
    } else {
        texto('kpi_componente', maior.componentes.map(nome).join(' / '));
        sub = duracao(maior.atencao) + ' em atenção · ' + percentual(maior.percentual) + ' do tempo';
    }
    texto('kpi_componente_tempo', sub);
    colorirKpi('kpi_componente', !maior ? '' : maior.atencao > 0 ? 'atencao' : 'ok');

    atualizarAumento();

    // KPI 3: horário com atenção em mais dias
    var h = dados.resumos[elemento('componente_horario').value];
    if (h && h.horario) {
        texto('kpi_horario', faixaHora(h.horario.hora));
        texto('kpi_horario_dias', 'Atenção em ' + h.horario.dias + ' dias · ' + duracao(h.horario.minutos));
    } else {
        texto('kpi_horario', h && h.observado ? 'Nenhum' : 'Sem dados');
        texto('kpi_horario_dias', h && h.observado ? 'Sem atenção observada' : 'Sem coleta válida');
    }

    colorirKpi('kpi_horario', h && h.observado ? h.horario ? 'atencao' : 'ok' : '');
    atualizarLideres();
}

function atualizarLideres() {
    var processos = dados.processos[elemento('componente_lider').value];
    texto('lider_dentro', processos.lider_dentro ? processos.lider_dentro.nome + ' — ' + percentual(processos.lider_dentro.valor) : 'Sem dados');
    texto('lider_fora', processos.lider_fora ? processos.lider_fora.nome + ' — ' + percentual(processos.lider_fora.valor) : 'Sem dados');
}

function colorirKpi(id, estado) {
    var card = elemento(id).closest('.card_kpi');
    card.classList.remove('status_ok', 'status_atencao', 'status_critico');
    if (estado) card.classList.add('status_' + estado);
}

function atualizarAumento() {
    var resultado = dados.aumento[elemento('periodo_importante').value];
    var maior = resultado.maior;
    texto('kpi_aumento', !resultado.suficiente ? 'Sem dados suficientes' : !maior ? 'Sem aumento' : nome(maior.componente));
    texto('kpi_aumento_valor', maior ? '+' + numero(maior.diferenca) + ' p.p.' : '—');
    texto('kpi_aumento_sub', maior ? percentual(maior.dentro) + ' no período vs ' + percentual(maior.fora) + ' fora'
        : resultado.suficiente ? 'Nenhum componente aumentou a média' : 'Mínimo de ' + resultado.minutos_minimos + ' min dentro e fora');
    colorirKpi('kpi_aumento', !resultado.suficiente ? '' : maior ? 'critico' : 'ok');
    elemento('kpi_aumento_valor').style.color = maior ? '#ff6e7b' : '#75bf83';
}

// ============================================================
// 4. GRÁFICOS
// ============================================================
function criarGrafico(id, configuracao) {
    if (!window.Chart) { mostrarErro('Não foi possível carregar o Chart.js. Verifique a conexão com a internet.'); return; }
    if (graficos[id]) graficos[id].destroy();
    graficos[id] = new Chart(elemento(id), configuracao);
}

// Opções comuns dos gráficos de barras horizontais
function opcoesBase(tituloX) {
    return {
        indexAxis: 'y',
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#C5C3CD', boxWidth: 10, font: { size: 14 } } } },
        scales: {
            x: { title: { display: true, text: tituloX, color: '#A5A9C5', font: { size: 14 } }, ticks: { color: '#A5A9C5', font: { size: 14 } }, grid: { color: '#48445F55' } },
            y: { beginAtZero: true, ticks: { color: '#A5A9C5', font: { size: 14 } }, grid: { color: '#48445F55' } }
        }
    };
}

// ---------------- Ranking por tempo em atenção ----------------
function percentualEstado(r, estado) {
    return r && r.observado && r[estado] !== null && (estado !== 'critico' || r.critico_configurado !== false)
        ? 100 * r[estado] / r.observado : null;
}

// Uma marca por componente: a referência é o período anterior, não um SLA.
var pluginReferencia = {
    id: 'referenciaHistorica',
    afterDatasetsDraw: function (grafico) {
        var dataset = grafico.data.datasets[0];
        var ctx = grafico.ctx;
        ctx.save();
        grafico.getDatasetMeta(0).data.forEach(function (barra, i) {
            var anterior = dataset.anteriores[i];
            if (anterior !== null) {
                var x = grafico.scales.x.getPixelForValue(anterior);
                ctx.strokeStyle = '#eee5ff'; ctx.lineWidth = 2; ctx.setLineDash([3, 3]);
                ctx.beginPath(); ctx.moveTo(x, barra.y - 15); ctx.lineTo(x, barra.y + 15); ctx.stroke();
            }
            ctx.setLineDash([]); ctx.fillStyle = '#e7e3f3'; ctx.font = '12px sans-serif'; ctx.textBaseline = 'middle';
            var fimBarra = Number.isFinite(barra.x) ? barra.x : grafico.scales.x.getPixelForValue(0);
            ctx.fillText(dataset.rotulos[i], fimBarra + 7, barra.y);
        });
        ctx.restore();
    }
};

function atualizarRanking() {
    var dia = elemento('dia').value;
    var escolhido = elemento('componente_ranking').value;
    var estado = elemento('estado_ranking').value;
    var porComponente = dados.ranking[dia] || {};
    var anterior = dados.ranking_anterior[dia] || {};
    var cor = estado === 'critico' ? '#ff6e7b' : '#f3bd4f';
    texto('titulo_ranking', estado === 'critico' ? 'Tempo em crítico' : 'Tempo em atenção');
    texto('ranking_resumo', 'Mesmo servidor · ' + dados.periodo.dias + ' dias selecionados vs ' + dados.periodo.dias + ' dias anteriores' + (dia !== 'periodo' ? ' · dia ' + dataCurta(dia) : ''));
    elemento('legenda_estado').style.color = cor;
    var lista = dados.servidor.componentes.filter(function (c) { return escolhido === 'todos' || escolhido === c; }).map(function (c) {
        return { c: c, r: porComponente[c], anterior: anterior[c], valor: percentualEstado(porComponente[c], estado), referencia: percentualEstado(anterior[c], estado) };
    });
    lista.sort(function (a, b) { return (b.valor || 0) - (a.valor || 0); });
    var opcoes = opcoesBase('Percentual do tempo monitorado');
    opcoes.layout = { padding: { right: 112 } };
    var maximo = Math.max.apply(null, [1].concat(lista.map(function (item) { return Math.max(item.valor || 0, item.referencia || 0); })));
    opcoes.scales.x.min = 0;
    opcoes.scales.x.max = Math.min(100, Math.ceil(maximo * 1.15));
    opcoes.scales.x.ticks.callback = function (v) { return v + '%'; };
    opcoes.plugins.legend.display = false;
    opcoes.plugins.tooltip = {
        callbacks: {
            label: function (ctx) {
                var item = lista[ctx.dataIndex];
                return ['Período Selecionado: ' + (item.valor === null ? 'Sem coleta' : duracao(item.r[estado]) + ' · ' + percentual(item.valor)),
                'Anterior: ' + (item.referencia === null ? 'Sem coleta' : duracao(item.anterior[estado]) + ' · ' + percentual(item.referencia))];
            }
        }
    };
    criarGrafico('grafico_ranking', {
        type: 'bar', data: {
            labels: lista.map(function (item) { return nome(item.c); }),
            datasets: [{
                label: 'Período Selecionado', data: lista.map(function (item) { return item.valor; }),
                anteriores: lista.map(function (item) { return item.referencia; }),
                rotulos: lista.map(function (item) { return item.valor === null ? 'Sem coleta' : duracao(item.r[estado]) + ' · ' + percentual(item.valor); }),
                backgroundColor: cor, maxBarThickness: 22
            }]
        }, options: opcoes, plugins: [pluginReferencia]
    });
    preencherTabela('ranking_tabela', lista.map(function (item) {
        var diferenca = item.valor !== null && item.referencia !== null ? item.valor - item.referencia : null;
        return [nome(item.c), item.valor === null ? 'Sem coleta' : duracao(item.r[estado]) + ' · ' + percentual(item.valor),
        item.referencia === null ? 'Sem histórico' : duracao(item.anterior[estado]) + ' · ' + percentual(item.referencia),
        diferenca === null ? '—' : (diferenca > 0 ? '+' : '') + numero(diferenca) + ' p.p.'];
    }));
    elemento('ranking_tabela').querySelectorAll('tr').forEach(function (tr, i) {
        var item = lista[i];
        if (item.valor !== null && item.referencia !== null) tr.lastChild.className = item.valor > item.referencia ? 'status_critico' : item.valor < item.referencia ? 'status_ok' : '';
    });
}

// ---------------- Mapa de calor (ECharts) ----------------
function atualizarCalor() {
    if (!window.echarts) { mostrarErro('O mapa depende do ECharts. Verifique a conexão com a internet.'); return; }
    var componente = elemento('componente_calor').value;
    var critico = elemento('estado_calor').value === 'critico';
    var rotulo = critico ? 'em crítico' : 'em atenção';
    var dias = dados.periodo.dias_com_coleta;
    var matriz = dados.calor[componente] || [];
    texto('titulo_calor', 'Mapa de calor · ' + nome(componente));

    // Cada ponto: [hora, linha do dia, minutos no estado, minutos observados]
    var valores = [];
    for (var d = 0; d < matriz.length; d++) {
        for (var h = 0; h < 24; h++) {
            var celula = matriz[d][h];
            if (celula[2]) valores.push([h, d, critico ? celula[1] : celula[0], celula[2]]);
            else valores.push({ value: [h, d, -1, 0], itemStyle: { color: '#27223d' } }); // sem coleta
        }
    }

    elemento('grafico_calor').style.height = Math.max(330, dias.length * 34 + 100) + 'px';
    if (!calor) calor = echarts.init(elemento('grafico_calor'));
    calor.resize();
    calor.setOption({
        animation: false,
        grid: { left: 49, right: 8, top: 12, bottom: 72 },
        tooltip: {
            formatter: function (p) {
                var v = p.value;
                if (!v[3]) return dataCurta(dias[v[1]]) + ' · ' + v[0] + 'h: sem coleta';
                return dataCurta(dias[v[1]]) + ' · ' + faixaHora(v[0]) + '<br>' + nome(componente) + ': ' +
                    duracao(v[2]) + ' ' + rotulo + '<br>' + duracao(v[3]) + ' observados';
            }
        },
        xAxis: {
            type: 'category',
            data: Array.from({ length: 24 }, function (_, hora) { return hora + 'h'; }),
            axisLabel: { color: '#A5A9C5', fontSize: 13, interval: 1 },
            axisLine: { show: false }, axisTick: { show: false }
        },
        yAxis: {
            type: 'category', inverse: true, data: dias.map(dataCurta),
            axisLabel: { color: '#A5A9C5', fontSize: 14 },
            axisLine: { show: false }, axisTick: { show: false }
        },
        visualMap: {
            dimension: 2, min: 0, max: 60, orient: 'horizontal', left: 'center', bottom: 0,
            itemWidth: 10, itemHeight: 150, text: ['60 min', '0 min'],
            textStyle: { color: '#C5C3CD', fontSize: 14 },
            inRange: { color: ['#21443F', '#75BF83', '#E9B949', '#FF5C5C'] }
        },
        series: [{
            type: 'heatmap',
            data: valores,
            label: {
                show: true, color: '#fff', fontSize: 12, textBorderColor: '#0E0921', textBorderWidth: 2,
                formatter: function (p) { return p.value[2] < 0 ? '—' : Math.round(p.value[2]); }
            },
            itemStyle: { borderWidth: 2, borderColor: '#170F38' }
        }]
    }, true);
}

// Evolução do MESMO servidor: janela selecionada vs imediatamente anterior.
function atualizarComparacao() {
    var p = dados.comparacao;
    var critico = medidaComparacao === 'critico';
    var atual = critico ? p.atual.critico_percentual : p.atual[medidaComparacao];
    var anterior = critico ? p.anterior.critico_percentual : p.anterior[medidaComparacao];
    var unidade = critico ? '%' : ' p.p.';
    texto('comparacao_resumo', 'Mesmo servidor · ' + dados.periodo.dias + ' dias selecionados vs ' + dados.periodo.dias + ' dias anteriores');
    var opcoes = opcoesBase(critico ? 'Tempo monitorado em crítico (%)' : 'Desvio padrão (p.p.)');
    opcoes.plugins.legend.display = false;
    opcoes.scales.x.min = 0;
    opcoes.layout = { padding: { right: 116 } };
    opcoes.plugins.tooltip = {
        callbacks: {
            label: function (ctx) {
                var r = ctx.dataIndex === 0 ? p.atual : p.anterior;
                return ctx.raw === null ? 'Sem dados' : numero(ctx.raw) + unidade + (critico ? ' · ' + duracao(r.critico_minutos) : '');
            }
        }
    };
    criarGrafico('grafico_comparacao', {
        type: 'bar', data: {
            labels: ['Período Selecionado', 'Anterior'], datasets: [{
                data: [atual, anterior], anteriores: [null, null],
                rotulos: [atual, anterior].map(function (v, i) { return v === null ? 'Sem dados' : numero(v) + unidade + (critico ? ' · ' + duracao((i === 0 ? p.atual : p.anterior).critico_minutos) : ''); }),
                backgroundColor: ['#5178f9', '#6fe0ff'], maxBarThickness: 28
            }]
        }, options: opcoes, plugins: [pluginReferencia]
    });
    var diferenca = atual !== null && anterior !== null ? atual - anterior : null;
    var descricao = critico ? 'tempo crítico' : 'oscilação';
    texto('comparacao_variacao', diferenca === null ? 'Sem histórico suficiente para comparar' :
        (diferenca > 0 ? '+' : '') + numero(diferenca) + ' p.p. · ' + (diferenca > 0 ? 'mais ' : diferenca < 0 ? 'menos ' : 'mesmo nível de ') + descricao);
    elemento('comparacao_variacao').className = 'variacao ' + (critico && diferenca !== null ? diferenca > 0 ? 'status_critico' : diferenca < 0 ? 'status_ok' : '' : '');
    texto('comparacao_nota', critico ? 'Qualquer recurso crítico · sobreposições contam uma vez' : 'Desvio padrão · menor = menos variação');
    var coberturaAtual = critico ? p.atual.cobertura : p.atual['cobertura_' + medidaComparacao];
    var coberturaAnterior = critico ? p.anterior.cobertura : p.anterior['cobertura_' + medidaComparacao];
    texto('comparacao_cobertura', 'Anterior: ' + dataCurta(p.periodo_anterior.inicio) + ' a ' + dataCurta(p.periodo_anterior.fim) +
        ' · cobertura: ' + percentual(coberturaAtual) + ' vs ' + percentual(coberturaAnterior) +
        (coberturaAtual !== coberturaAnterior ? ' · coberturas diferentes' : ''));
    document.querySelectorAll('[data-medida]').forEach(function (botao) { botao.setAttribute('aria-pressed', String(botao.dataset.medida === medidaComparacao)); });
}

// ---------------- Processos: período importante vs demais horários ----------------
function atualizarProcessos() {
    var componente = elemento('componente_processos').value;
    var resultado = dados.processos[componente];
    var lista = resultado.lista;

    texto('titulo_processos', 'Processos · dias úteis vs fim de semana');
    texto('coluna_dentro', 'Dias úteis');
    texto('processos_unidade', nome(componente) + ' médio (%) · seg–sex vs sáb–dom');

    criarGrafico('grafico_processos', {
        type: 'bar',
        data: {
            labels: lista.map(function (p) { return p.nome; }),
            datasets: [
                { label: 'Dias úteis', data: lista.map(function (p) { return p.dentro; }), backgroundColor: '#5178F9', maxBarThickness: 20 },
                { label: 'Fim de semana', data: lista.map(function (p) { return p.fora; }), backgroundColor: '#6FE0FF', maxBarThickness: 20 }
            ]
        },
        options: opcoesBase(nome(componente) + ' do servidor (%)')
    });

    if (!lista.length) {
        preencherTabela('processos_tabela', [['Sem processos observados no período', '—', '—', '—']]);
    } else {
        preencherTabela('processos_tabela', lista.map(function (p) {
            var diferenca = p.diferenca === null ? '—' : (p.diferenca > 0 ? '+' : '') + numero(p.diferenca) + ' p.p.';
            return [p.nome, percentual(p.dentro), percentual(p.fora), diferenca];
        }));
    }

    var sugestao = !resultado.minutos_uteis || !resultado.minutos_fim_semana
        ? 'Comparação incompleta: faltam processos em um dos grupos.'
        : 'Dias úteis: ' + duracao(resultado.minutos_uteis) + ' · fim de semana: ' + duracao(resultado.minutos_fim_semana);
    texto('sugestao_texto', sugestao + ' · Médias dos processos registrados na Gold; ausência não conta como zero.');
}

// ============================================================
// 5. EVENTOS
// ============================================================
// Servidor e período: nova consulta na API
elemento('servidor').addEventListener('change', carregarDados);
elemento('periodo').addEventListener('change', carregarDados);
elemento('atualizar_dados').addEventListener('click', carregarDados);

// Demais filtros: só redesenham com os dados já recebidos
elemento('periodo_importante').addEventListener('change', function () { if (dados) atualizarAumento(); });
elemento('componente_horario').addEventListener('change', function () { if (dados) atualizarKpis(); });
elemento('componente_lider').addEventListener('change', function () { if (dados) atualizarLideres(); });
elemento('dia').addEventListener('change', function () { if (dados) atualizarRanking(); });
elemento('componente_ranking').addEventListener('change', function () { if (dados) atualizarRanking(); });
elemento('componente_calor').addEventListener('change', function () { if (dados) atualizarCalor(); });
elemento('estado_calor').addEventListener('change', function () { if (dados) atualizarCalor(); });
elemento('componente_processos').addEventListener('change', function () { if (dados) atualizarProcessos(); });
window.addEventListener('resize', function () { if (calor) calor.resize(); });

// Menu, perfil e saída são os mesmos das outras páginas (menu.js / sessao.js).
elemento('estado_ranking').addEventListener('change', function () { if (dados) atualizarRanking(); });
document.querySelectorAll('[data-medida]').forEach(function (botao) {
    botao.addEventListener('click', function () { medidaComparacao = botao.dataset.medida; if (dados) atualizarComparacao(); });
});
['periodo_importante', 'componente_horario', 'componente_calor', 'componente_lider', 'componente_processos'].forEach(function (id) {
    elemento(id).addEventListener('change', function () { escolhasManuais[id] = true; });
});
carregarDados();