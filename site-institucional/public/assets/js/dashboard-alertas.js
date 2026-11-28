// Dashboard de Alertas
// Esta tela consome a API por partes: KPIs, fila e gráficos.
// O SLA continua sendo controlado no front para recalcular os visuais.

// Define a fonte padrão dos gráficos
Chart.defaults.font.family = 'Inter';
Chart.defaults.color = '#A5A9C5';
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.plugins.legend.display = false;

// SLA padrão da tela
var SLA_PADRAO = 60;
var SLA_MIN = 5;
var SLA_MAX = 1440;

// Estado da dashboard em memória
var estadoDashboard = {
    fkEmpresa: obterFkEmpresa(),
    periodo: 'hoje',
    sla: SLA_PADRAO,
    carregado: false,
    kpis: {
        criticos: [],
        foraSla: [],
        tempoMedio: [],
        abertos: []
    },
    ondeEsta: [],
    fluxo: [],
    mttr: [],
    fila: []
};

// Instâncias dos gráficos para destruir e recriar quando necessário
var graficos = {
    onde: null,
    fluxo: null,
    mttr: null
};

// Paleta de cores usada na tela
var CORES = {
    crit: '#ef4444',
    warn: '#f59e0b',
    ok: '#22c55e',
    azul: '#3b82f6',
    branco: '#ffffff',
    apagado: '#5C6288'
};

// Fonte padrão explicitada para os desenhos em canvas
var FONTE_GRAFICO = 'Inter';

// Atalho para pegar elementos do HTML
function $(id) {
    return document.getElementById(id);
}

// Lê o usuário salvo no localStorage
function lerUsuarioLogado() {
    var usuarioTexto = localStorage.getItem('usuarioLogado');

    if (!usuarioTexto) {
        return null;
    }

    try {
        return JSON.parse(usuarioTexto);
    } catch (erro) {
        return null;
    }
}

// Pega o id da empresa do usuário logado
function obterFkEmpresa() {
    var usuario = lerUsuarioLogado();

    if (usuario && usuario.idEmpresa) {
        return Number(usuario.idEmpresa);
    }

    if (usuario && usuario.fkEmpresa) {
        return Number(usuario.fkEmpresa);
    }

    // Fallback de teste para a empresa TechShield
    return 2;
}

// Formata minutos para exibição curta ou longa
function fmtDur(min, compacto) {
    min = Math.max(0, Math.round(Number(min) || 0));

    if (min < 60) {
        return min + ' min';
    }

    var h = Math.floor(min / 60);
    var m = min % 60;

    if (m === 0) {
        return h + 'h';
    }

    return h + 'h' + (compacto ? '' : ' ') + String(m).padStart(2, '0') + 'min';
}

// Formata o SLA no padrão curto do rótulo do gráfico
function fmtSlaCurto(min) {
    min = Math.max(0, Math.round(Number(min) || 0));

    if (min < 60) {
        return min + 'min';
    }

    var h = Math.floor(min / 60);
    var m = min % 60;

    if (m === 0) {
        return h + 'h';
    }

    return h + 'h' + String(m).padStart(2, '0');
}

// Faz fetch e já converte o retorno para JSON
function fetchJSON(url) {
    return fetch(url, { cache: 'no-store' }).then(function (resposta) {
        if (resposta.status === 204) {
            return null;
        }

        if (!resposta.ok) {
            throw new Error('Falha ao consultar ' + url + ' (' + resposta.status + ')');
        }

        return resposta.json();
    });
}

// Pega o primeiro valor de um array de resposta do backend
function primeiroValor(resposta, campo) {
    if (!resposta || !resposta.length) {
        return 0;
    }

    return Number(resposta[0][campo] || 0);
}

// Seta o texto de um elemento se ele existir
function setTexto(id, texto) {
    var el = $(id);

    if (el) {
        el.textContent = texto === null || texto === undefined ? '' : String(texto);
    }
}

// Atualiza valor e texto do delta dos KPIs
function setDelta(prefixo, classe, valor, texto) {
    var elValor = $(prefixo + '_delta_val');
    var elTexto = $(prefixo + '_delta_txt');

    if (elValor) {
        elValor.className = classe;
        elValor.textContent = valor || '';
    }

    if (elTexto) {
        elTexto.textContent = texto || '';
    }
}

// Define o título do gráfico de fluxo conforme o período
function definirTituloFluxo(periodo) {
    var titulo = 'Entrada × saída de alertas por hora';
    var sub = '(só horas com movimento)';

    if (periodo === '7d') {
        titulo = 'Entrada × saída de alertas por dia';
        sub = '';
    }

    if (periodo === '30d') {
        titulo = 'Entrada × saída de alertas por semana';
        sub = '';
    }

    setTexto('fluxo_titulo', titulo);
    setTexto('fluxo_sub', sub);
}

// Faz um relógio simples para o texto de tempo real
function atualizarTempoReal() {
    var segundos = 8;

    setInterval(function () {
        segundos++;

        if (segundos > 30) {
            segundos = 1;
        }

        setTexto('tempo_real_seg', segundos);
    }, 1000);
}

// Carrega todos os blocos da dashboard na API
function carregarDashboard() {
    if (!estadoDashboard.fkEmpresa) {
        return;
    }

    var periodo = estadoDashboard.periodo;
    var base = '/dashboardAlertas';

    Promise.all([
        fetchJSON(base + '/kpi-criticos-abertos/' + encodeURIComponent(estadoDashboard.fkEmpresa) + '?periodo=' + encodeURIComponent(periodo)),
        fetchJSON(base + '/kpi-fora-sla/' + encodeURIComponent(estadoDashboard.fkEmpresa) + '?periodo=' + encodeURIComponent(periodo)),
        fetchJSON(base + '/kpi-tempo-medio/' + encodeURIComponent(estadoDashboard.fkEmpresa) + '?periodo=' + encodeURIComponent(periodo)),
        fetchJSON(base + '/kpi-abertos/' + encodeURIComponent(estadoDashboard.fkEmpresa) + '?periodo=' + encodeURIComponent(periodo)),
        fetchJSON(base + '/grafico-onde-estao/' + encodeURIComponent(estadoDashboard.fkEmpresa) + '?periodo=' + encodeURIComponent(periodo)),
        fetchJSON(base + '/grafico-fluxo/' + encodeURIComponent(estadoDashboard.fkEmpresa) + '?periodo=' + encodeURIComponent(periodo)),
        fetchJSON(base + '/grafico-mttr/' + encodeURIComponent(estadoDashboard.fkEmpresa) + '?periodo=' + encodeURIComponent(periodo)),
        fetchJSON(base + '/fila-atencao/' + encodeURIComponent(estadoDashboard.fkEmpresa) + '?periodo=' + encodeURIComponent(periodo))
    ]).then(function (respostas) {
        estadoDashboard.kpis.criticos = respostas[0] || [];
        estadoDashboard.kpis.foraSla = respostas[1] || [];
        estadoDashboard.kpis.tempoMedio = respostas[2] || [];
        estadoDashboard.kpis.abertos = respostas[3] || [];
        estadoDashboard.ondeEsta = respostas[4] || [];
        estadoDashboard.fluxo = respostas[5] || [];
        estadoDashboard.mttr = respostas[6] || [];
        estadoDashboard.fila = respostas[7] || [];

        estadoDashboard.carregado = true;
        renderTudo();
    }).catch(function (erro) {
        console.error(erro);
    });
}

// KPI: críticos em aberto
function renderKpiCriticos() {
    var valor = primeiroValor(estadoDashboard.kpis.criticos, 'criticos_abertos');

    setTexto('crit_valor', valor);
    setDelta('crit', valor > 0 ? 'up' : 'igual', valor > 0 ? '▲ +' + valor : '= igual', valor > 0 ? 'alertas em aberto' : 'sem criticos em aberto');
    setTexto('crit_rodape', valor + ' criticos em aberto na empresa');

    var card = $('kpi_crit');

    if (card) {
        card.classList.toggle('k_crit', valor > 0);
    }
}

// KPI: alertas fora do SLA
function renderKpiForaSla() {
    var valor = primeiroValor(estadoDashboard.kpis.foraSla, 'fora_sla');
    var abertosFora = estadoDashboard.fila.length;
    var resolvidosFora = Math.max(valor - abertosFora, 0);
    var totalCriados = estadoDashboard.fluxo.reduce(function (acc, registro) {
        return acc + Number(registro.criados || 0);
    }, 0);

    setTexto('fora_valor', valor);
    setTexto('fora_de', totalCriados > 0 ? 'de ' + totalCriados + ' alertas (' + Math.round(valor / totalCriados * 100) + '%)' : '');
    setDelta('fora', valor > 0 ? 'up' : 'igual', valor > 0 ? '▲ +' + valor : '= igual', valor > 0 ? 'fora do SLA' : 'dentro do SLA');
    setTexto('fora_rodape', abertosFora + ' ainda abertos + ' + resolvidosFora + ' resolvidos fora do prazo · SLA: ' + fmtDur(estadoDashboard.sla));
}

// KPI: tempo médio de resolução
function renderKpiTempoMedio() {
    var valor = primeiroValor(estadoDashboard.kpis.tempoMedio, 'tempo_medio');
    var card = $('kpi_media');
    var valorEl = $('media_valor');

    if (card) {
        card.classList.toggle('k_warn', valor > estadoDashboard.sla);
        card.classList.toggle('k_ok', valor <= estadoDashboard.sla);
    }

    if (valorEl) {
        valorEl.textContent = valor > 0 ? fmtDur(valor) : '—';
        valorEl.classList.toggle('laranja', valor > estadoDashboard.sla);
        valorEl.classList.toggle('verde', valor <= estadoDashboard.sla);
    }

    if (valor > 0) {
        var diff = Math.abs(Math.round(valor - estadoDashboard.sla));
        setDelta('media', valor > estadoDashboard.sla ? 'up' : 'down', valor > estadoDashboard.sla ? '▲ +' + diff : '▼ −' + diff, 'vs. SLA (' + fmtDur(estadoDashboard.sla) + ')');
        setTexto('media_rodape', valor > estadoDashboard.sla ? 'Ainda ' + fmtDur(diff) + ' acima do SLA' : 'Dentro do SLA · ' + fmtDur(diff) + ' abaixo');
    } else {
        setDelta('media', 'igual', '', 'sem dados no periodo');
        setTexto('media_rodape', 'Sem dados para calcular a media');
    }

    var escala = Math.max(estadoDashboard.sla * 2, valor * 1.1, 1);
    var fill = $('media_fill');
    var marca = $('media_marca');

    if (fill) {
        fill.style.width = Math.min(100, (valor / escala) * 100) + '%';
        fill.classList.toggle('verde', valor <= estadoDashboard.sla);
    }

    if (marca) {
        marca.style.left = (estadoDashboard.sla / escala) * 100 + '%';
    }

    setTexto('media_marca_txt', 'SLA ' + fmtSlaCurto(estadoDashboard.sla));
}

// KPI: alertas em aberto
function renderKpiAbertos() {
    var valor = primeiroValor(estadoDashboard.kpis.abertos, 'alertas_abertos');
    var totalCriados = estadoDashboard.fluxo.reduce(function (acc, registro) {
        return acc + Number(registro.criados || 0);
    }, 0);
    var totalResolvidos = estadoDashboard.fluxo.reduce(function (acc, registro) {
        return acc + Number(registro.resolvidos || 0);
    }, 0);

    setTexto('abertos_valor', valor);
    setDelta('abertos', 'igual', '= atual', 'sem base de comparacao');
    setTexto('abertos_rodape', totalCriados + ' criados no periodo · ' + totalResolvidos + ' resolvidos (' + (totalCriados > 0 ? Math.round(totalResolvidos / totalCriados * 100) : 0) + '%)');
}

// Monta a fila de atenção quando o filtro é "Hoje"
function renderFila() {
    var secao = $('fila');
    var tabela = $('fila_tabela');
    var vazio = $('fila_vazio');
    var corpo = $('fila_corpo');
    var modelo = $('tpl_linha');

    if (!secao || !tabela || !vazio || !corpo || !modelo) {
        return;
    }

    secao.hidden = estadoDashboard.periodo !== 'hoje';

    if (secao.hidden) {
        return;
    }

    corpo.innerHTML = '';
    setTexto('fila_th_sla', 'SLA (' + estadoDashboard.sla + ' min)');
    setTexto('fila_vazio', 'Nenhum alerta em aberto estourou o SLA de ' + fmtDur(estadoDashboard.sla) + '.');

    var linhas = (estadoDashboard.fila || []).slice().sort(function (a, b) {
        return Number(b.minutos_estourados || 0) - Number(a.minutos_estourados || 0);
    });

    tabela.hidden = linhas.length === 0;
    vazio.hidden = linhas.length !== 0;

    linhas.forEach(function (alerta) {
        var tr = modelo.content.cloneNode(true);
        tr.querySelector('.chave').textContent = alerta.jira_key;
        tr.querySelector('.equip').textContent = alerta.equipamento + ' · ' + alerta.componente;

        var pill = tr.querySelector('.pill');
        pill.classList.add(String(alerta.tipo_alerta || '').toLowerCase() === 'critico' ? 'crit' : 'warn');
        pill.textContent = String(alerta.tipo_alerta || '').toUpperCase() === 'CRITICO' ? 'Crítico' : 'Atenção';

        tr.querySelector('.status').textContent = alerta.status_alerta;
        tr.querySelector('.estourado').textContent = 'estourado há ' + fmtDur(alerta.minutos_estourados);
        corpo.appendChild(tr);
    });

    setTexto('fila_rodape', 'Mostrando ' + linhas.length + ' de ' + linhas.length + ' alertas em aberto que já estouraram o SLA');
}

// Agrupa os alertas por componente para montar o gráfico "onde estão"
function agruparOndeEsta() {
    var mapa = {};

    (estadoDashboard.ondeEsta || []).forEach(function (registro) {
        var componente = registro.componente || 'SEM COMPONENTE';
        var tipo = String(registro.tipo_alerta || '').toUpperCase();
        var total = Number(registro.total || 0);

        if (!mapa[componente]) {
            mapa[componente] = { nome: componente, crit: 0, warn: 0, total: 0 };
        }

        if (tipo === 'CRITICO') {
            mapa[componente].crit += total;
        } else {
            mapa[componente].warn += total;
        }

        mapa[componente].total += total;
    });

    return Object.keys(mapa).map(function (chave) {
        return mapa[chave];
    }).sort(function (a, b) {
        return b.total - a.total || a.nome.localeCompare(b.nome);
    });
}

// Prepara o fluxo por período para o gráfico de entrada e saída
function prepararFluxo() {
    return (estadoDashboard.fluxo || []).slice();
}

// Ordena o MTTR do maior para o menor
function prepararMttr() {
    return (estadoDashboard.mttr || []).slice().sort(function (a, b) {
        var ma = a.media_minutos === null || a.media_minutos === undefined ? Number.MAX_VALUE : Number(a.media_minutos);
        var mb = b.media_minutos === null || b.media_minutos === undefined ? Number.MAX_VALUE : Number(b.media_minutos);
        return mb - ma || String(a.componente).localeCompare(String(b.componente));
    });
}

// Remove os gráficos antigos antes de recriar
function destruirGraficos() {
    if (graficos.onde) {
        graficos.onde.destroy();
        graficos.onde = null;
    }

    if (graficos.fluxo) {
        graficos.fluxo.destroy();
        graficos.fluxo = null;
    }

    if (graficos.mttr) {
        graficos.mttr.destroy();
        graficos.mttr = null;
    }
}

// Cria os 3 gráficos da tela
function criarGraficos() {
    destruirGraficos();

    // Gráfico 1: onde estão os alertas em aberto
    graficos.onde = new Chart($('chart_onde'), {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                { label: 'Crítico', data: [], backgroundColor: CORES.crit, barThickness: 26 },
                { label: 'Atenção', data: [], backgroundColor: CORES.warn, barThickness: 26 }
            ]
        },
        options: {
            indexAxis: 'y',
            layout: { padding: { right: 40 } },
            scales: {
                x: { stacked: true, display: false, grid: { display: false }, beginAtZero: true },
                y: {
                    stacked: true,
                    grid: { display: false },
                    border: { display: false },
                    ticks: { color: CORES.branco, font: { family: FONTE_GRAFICO, size: 11, weight: 'bold' }, padding: 8 }
                }
            }
        },
        plugins: [{
            id: 'rotulosOnde',
            afterDatasetsDraw: function (chart) {
                var ctx = chart.ctx;
                var totais = chart.$totais || [];

                ctx.save();
                ctx.textBaseline = 'middle';

                chart.data.datasets.forEach(function (ds, di) {
                    chart.getDatasetMeta(di).data.forEach(function (barra, i) {
                        var v = ds.data[i];

                        if (!v) {
                            return;
                        }

                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 11px ' + FONTE_GRAFICO;
                        ctx.textAlign = 'center';
                        ctx.fillText(v, (barra.x + barra.base) / 2, barra.y);
                    });
                });

                var ys = chart.getDatasetMeta(0).data;

                totais.forEach(function (t, i) {
                    if (!ys[i]) {
                        return;
                    }

                    ctx.fillStyle = t ? '#fff' : CORES.apagado;
                    ctx.font = 'bold 14px ' + FONTE_GRAFICO;
                    ctx.textAlign = 'right';
                    ctx.fillText(t, chart.width, ys[i].y);
                });

                ctx.restore();
            }
        }]
    });

    // Gráfico 2: entrada x saída de alertas
    graficos.fluxo = new Chart($('chart_fluxo'), {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                { label: 'Criados', data: [], backgroundColor: CORES.azul, borderRadius: 4, maxBarThickness: 20 },
                { label: 'Resolvidos', data: [], backgroundColor: CORES.ok, borderRadius: 4, maxBarThickness: 20 }
            ]
        },
        options: {
            layout: { padding: { top: 44 } },
            categoryPercentage: 0.7,
            barPercentage: 0.9,
            scales: {
                x: { grid: { display: false }, ticks: { font: { family: FONTE_GRAFICO, size: 10 }, maxRotation: 0 } },
                y: {
                    beginAtZero: true,
                    ticks: { display: false, count: 4 },
                    border: { display: false },
                    grid: { color: 'rgba(255,255,255,.07)' }
                }
            }
        },
        plugins: [{
            id: 'rotulosFluxo',
            afterDatasetsDraw: function (chart) {
                var ctx = chart.ctx;
                var barrasCriadas = chart.getDatasetMeta(0).data;
                var barrasResolvidas = chart.getDatasetMeta(1).data;

                ctx.save();
                ctx.textAlign = 'center';
                ctx.font = 'bold 11px ' + FONTE_GRAFICO;

                barrasCriadas.forEach(function (barra, i) {
                    var criados = Number(chart.data.datasets[0].data[i] || 0);
                    var resolvidos = Number(chart.data.datasets[1].data[i] || 0);
                    var delta = criados - resolvidos;

                    ctx.textBaseline = 'bottom';
                    ctx.fillStyle = '#60a5fa';
                    ctx.fillText(criados, barra.x, barra.y - 5);
                    ctx.fillStyle = '#4ade80';
                    ctx.fillText(resolvidos, barrasResolvidas[i].x, barrasResolvidas[i].y - 5);

                    if (delta > 0) {
                        ctx.fillStyle = CORES.crit;
                        ctx.font = 'bold 12px ' + FONTE_GRAFICO;
                        ctx.fillText('+' + delta, (barra.x + barrasResolvidas[i].x) / 2, Math.min(barra.y, barrasResolvidas[i].y) - 22);
                        ctx.font = 'bold 11px ' + FONTE_GRAFICO;
                    }
                });

                ctx.restore();
            }
        }]
    });

    // Gráfico 3: MTTR por componente
    graficos.mttr = new Chart($('chart_tmr'), {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{ data: [], backgroundColor: [], barThickness: 26 }]
        },
        options: {
            indexAxis: 'y',
            layout: { padding: { top: 44, right: 84 } },
            events: [],
            scales: {
                x: { display: false, min: 0, grid: { display: false } },
                y: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: { color: CORES.branco, font: { family: FONTE_GRAFICO, size: 11, weight: 'bold' }, padding: 8 }
                }
            }
        },
        plugins: [{
            id: 'slaMttr',
            afterDatasetsDraw: function (chart) {
                var ctx = chart.ctx;
                var x = chart.scales.x;
                var area = chart.chartArea;
                var ext = chart.$ext;

                if (!ext) {
                    return;
                }

                var px = x.getPixelForValue(ext.sla);

                ctx.save();
                ctx.strokeStyle = 'rgba(255,255,255,.6)';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(px, area.top - 6);
                ctx.lineTo(px, area.bottom);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 11px ' + FONTE_GRAFICO;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText('SLA ' + fmtSlaCurto(ext.sla), px, area.top - 12);

                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';

                chart.getDatasetMeta(0).data.forEach(function (barra, i) {
                    var t = ext.textos[i];
                    ctx.fillStyle = ext.semDados[i] ? CORES.apagado : '#fff';
                    ctx.font = (ext.semDados[i] ? 'normal' : 'bold') + ' 12px ' + FONTE_GRAFICO;
                    ctx.fillText(t, area.right + 22, barra.y);
                });

                ctx.restore();
            }
        }]
    });
}

// Atualiza os gráficos de acordo com os dados carregados
function atualizarGraficos() {
    var periodo = estadoDashboard.periodo;
    var onde = agruparOndeEsta();
    var fluxo = prepararFluxo();
    var mttr = prepararMttr();

    definirTituloFluxo(periodo);

    // Atualiza gráfico de onde estão os alertas
    if (graficos.onde) {
        graficos.onde.data.labels = onde.map(function (item) { return item.nome; });
        graficos.onde.data.datasets[0].data = onde.map(function (item) { return item.crit || null; });
        graficos.onde.data.datasets[1].data = onde.map(function (item) { return item.warn || null; });
        graficos.onde.$totais = onde.map(function (item) { return item.total; });
        graficos.onde.options.scales.x.max = Math.max.apply(null, onde.map(function (item) { return item.total; })) || 1;
        graficos.onde.update();
    }

    // Atualiza gráfico de entrada e saída
    if (graficos.fluxo) {
        graficos.fluxo.data.labels = fluxo.map(function (item) { return item.periodo; });
        graficos.fluxo.data.datasets[0].data = fluxo.map(function (item) { return Number(item.criados || 0); });
        graficos.fluxo.data.datasets[1].data = fluxo.map(function (item) { return Number(item.resolvidos || 0); });
        graficos.fluxo.update();
    }

    // Atualiza gráfico de MTTR
    if (graficos.mttr) {
        var maxMedia = Math.max.apply(null, mttr.map(function (item) { return Number(item.media_minutos || 0); }).concat([0]));

        graficos.mttr.data.labels = mttr.map(function (item) { return item.componente; });
        graficos.mttr.data.datasets[0].data = mttr.map(function (item) { return Number(item.media_minutos || 0); });
        graficos.mttr.data.datasets[0].backgroundColor = mttr.map(function (item) {
            var media = item.media_minutos === null || item.media_minutos === undefined ? null : Number(item.media_minutos);

            if (media === null || media <= estadoDashboard.sla) {
                return CORES.ok;
            }

            if (media > 120) {
                return CORES.crit;
            }

            return CORES.warn;
        });

        graficos.mttr.$ext = {
            sla: estadoDashboard.sla,
            textos: mttr.map(function (item) {
                return item.media_minutos === null || item.media_minutos === undefined ? 'sem dados' : fmtDur(item.media_minutos, true);
            }),
            semDados: mttr.map(function (item) {
                return item.media_minutos === null || item.media_minutos === undefined;
            })
        };

        graficos.mttr.options.scales.x.max = Math.max(maxMedia, estadoDashboard.sla * 1.15, 1);
        graficos.mttr.update();
    }
}

// Renderiza toda a dashboard depois que os dados chegam
function renderTudo() {
    if (!estadoDashboard.carregado) {
        return;
    }

    setTexto('sla_texto', estadoDashboard.sla + ' min');
    $('dash').dataset.periodo = estadoDashboard.periodo;

    renderKpiCriticos();
    renderKpiForaSla();
    renderKpiTempoMedio();
    renderKpiAbertos();
    renderFila();
    atualizarGraficos();
}

// Valida o SLA digitado no modal
function slaValido(v) {
    return Number.isInteger(v) && v >= SLA_MIN && v <= SLA_MAX;
}

// Atualiza o estado visual do modal de SLA
function atualizarModal() {
    var inputSla = $('sla_input');
    var wrap = document.querySelector('.sla_input_wrap');
    var erro = $('sla_erro');
    var equivale = $('sla_equivale');
    var valor = parseInt(inputSla.value, 10);
    var ok = slaValido(valor);

    if (erro) {
        erro.hidden = ok || inputSla.value === '';
    }

    if (wrap) {
        wrap.classList.toggle('erro', !ok && inputSla.value !== '');
    }

    if (equivale) {
        equivale.textContent = ok ? '= ' + fmtDur(valor) : '';
    }

    document.querySelectorAll('#sla_presets button').forEach(function (botao) {
        botao.classList.toggle('ativo', ok && parseInt(botao.dataset.min, 10) === valor);
    });
}

// Abre o modal de SLA
function abrirModal() {
    var modal = $('modal_sla');
    var inputSla = $('sla_input');

    inputSla.value = estadoDashboard.sla;
    atualizarModal();
    modal.classList.add('aberto');
    modal.setAttribute('aria-hidden', 'false');

    setTimeout(function () {
        inputSla.focus();
        inputSla.select();
    }, 120);
}

// Fecha o modal de SLA
function fecharModal() {
    var modal = $('modal_sla');

    modal.classList.remove('aberto');
    modal.setAttribute('aria-hidden', 'true');
    $('btn_sla').focus();
}

// Salva o SLA novo no localStorage e refaz a tela
function salvarSla() {
    var inputSla = $('sla_input');
    var valor = parseInt(inputSla.value, 10);

    if (!slaValido(valor)) {
        atualizarModal();
        $('sla_erro').hidden = false;
        return;
    }

    estadoDashboard.sla = valor;

    try {
        localStorage.setItem('dash_alertas_sla', String(valor));
    } catch (erro) {
    }

    renderTudo();
    fecharModal();
    mostrarToast('SLA atualizado para ' + fmtDur(valor));
}

// Exibe uma mensagem curta no canto da tela
function mostrarToast(msg) {
    var t = $('toast');

    t.textContent = msg;
    t.classList.add('visivel');

    clearTimeout(mostrarToast.t);
    mostrarToast.t = setTimeout(function () {
        t.classList.remove('visivel');
    }, 2400);
}

// Registra eventos da tela
function registrarEventos() {
    $('select_periodo').addEventListener('change', function (e) {
        estadoDashboard.periodo = e.target.value;
        carregarDashboard();
    });

    $('btn_sla').addEventListener('click', abrirModal);
    $('modal_sla_fechar').addEventListener('click', fecharModal);
    $('sla_cancelar').addEventListener('click', fecharModal);
    $('sla_salvar').addEventListener('click', salvarSla);

    $('modal_sla').addEventListener('mousedown', function (e) {
        if (e.target === $('modal_sla')) {
            fecharModal();
        }
    });

    $('sla_input').addEventListener('input', atualizarModal);

    $('sla_menos').addEventListener('click', function () {
        var inputSla = $('sla_input');
        var valor = parseInt(inputSla.value, 10) || estadoDashboard.sla;
        inputSla.value = Math.max(SLA_MIN, valor - 5);
        atualizarModal();
    });

    $('sla_mais').addEventListener('click', function () {
        var inputSla = $('sla_input');
        var valor = parseInt(inputSla.value, 10) || estadoDashboard.sla;
        inputSla.value = Math.min(SLA_MAX, valor + 5);
        atualizarModal();
    });

    $('sla_presets').addEventListener('click', function (e) {
        var botao = e.target.closest('button');

        if (!botao) {
            return;
        }

        $('sla_input').value = botao.dataset.min;
        atualizarModal();
    });

    document.addEventListener('keydown', function (e) {
        if (!$('modal_sla').classList.contains('aberto')) {
            return;
        }

        if (e.key === 'Escape') {
            fecharModal();
        }

        if (e.key === 'Enter') {
            salvarSla();
        }
    });
}

// Busca o SLA salvo e dispara o primeiro carregamento da dashboard
try {
    var salvo = parseInt(localStorage.getItem('dash_alertas_sla'), 10);

    if (slaValido(salvo)) {
        estadoDashboard.sla = salvo;
    }
} catch (erro) {
}

// Execução inicial da tela, sem função init
$('select_periodo').value = estadoDashboard.periodo;
setTexto('sla_texto', estadoDashboard.sla + ' min');
registrarEventos();
atualizarTempoReal();
criarGraficos();
carregarDashboard();
