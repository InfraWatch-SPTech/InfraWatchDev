/* 
   Dashboard de Alertas — dados MOCKADOS
   Tudo (KPIs, fila, gráficos) é calculado a partir da lista de alertas
   + SLA atual. Ao mudar o SLA, a tela inteira é recalculada.
 */

var COMPONENTES = ['DISCO', 'TEMPERATURA', 'RAM', 'CPU', 'REDE'];
var SLA_PADRAO = 60;
var SLA_MIN = 5;
var SLA_MAX = 1440;

var slaAtual = SLA_PADRAO;
var periodoAtual = 'hoje';

/* gerador determinístico de durações de resolução
   n alertas resolvidos, média `media` min, `k` deles fora do SLA padrão (60). */
function gerarDuracoes(n, media, k) {
    if (n === 0) return [];
    var soma = n * media;
    var dentro = n - k;
    var mediaDentro, mediaFora;

    if (k === 0) {
        mediaDentro = media;
    } else if (dentro === 0) {
        mediaFora = media;
    } else {
        mediaDentro = Math.min(40, (soma - k * 80) / dentro);
        mediaFora = (soma - mediaDentro * dentro) / k;
    }

    function espalhar(qtd, centro, amp) {
        var v = [];
        for (var i = 0; i < qtd; i++) {
            var p = qtd === 1 ? 0 : (i / (qtd - 1) - 0.5) * 2;
            v.push(Math.max(1, Math.round(centro + p * amp)));
        }
        return v;
    }

    var ampDentro = k === 0 ? Math.min(media * 0.4, 58 - media) : Math.min(15, mediaDentro - 4);
    var ampFora = mediaFora ? Math.min(mediaFora * 0.25, mediaFora - 65) : 0;
    var lista = [];
    if (dentro > 0) lista = lista.concat(espalhar(dentro, mediaDentro, Math.max(ampDentro, 0)));
    if (k > 0) lista = lista.concat(espalhar(k, mediaFora, Math.max(ampFora, 0)));

    var diff = soma - lista.reduce(function (a, b) { return a + b; }, 0);
    lista[lista.length - 1] += diff;
    return lista;
}

function montarResolvidos(spec) {
    var out = [];
    COMPONENTES.forEach(function (comp) {
        if (!spec[comp]) return;
        gerarDuracoes(spec[comp][0], spec[comp][1], spec[comp][2]).forEach(function (d) {
            out.push({ comp: comp, dur: d });
        });
    });
    return out;
}

/* abertos gerados: spec = { COMP: [qtdCritico, qtdAtencao] } */
function montarAbertos(spec) {
    var out = [];
    var i = 0;
    COMPONENTES.forEach(function (comp) {
        var s = spec[comp] || [0, 0];
        for (var c = 0; c < s[0] + s[1]; c++) {
            out.push({ comp: comp, sev: c < s[0] ? 'crit' : 'warn', age: 75 + ((i * 211) % 2900) });
            i++;
        }
    });
    return out;
}

/* estados (períodos) */
var PERIODOS = {
    hoje: {
        titulo: 'Hoje',
        refAnterior: 'ontem até 16:45',
        criticosCriados: 2,
        prev: { criticos: 0, fora: 3, media: 54, abertos: null },
        resolvidos: [
            { comp: 'DISCO', dur: 232 }, { comp: 'TEMPERATURA', dur: 71 },
            { comp: 'REDE', dur: 30 }, { comp: 'REDE', dur: 35 }, { comp: 'REDE', dur: 40 },
            { comp: 'RAM', dur: 33 }
        ],
        abertos: [
            { chave: 'KAN-1459', equip: 'SRV-BKP-02', comp: 'DISCO', sev: 'warn', status: 'A fazer', age: 680 },
            { chave: 'KAN-1463', equip: 'SRV-WEB-09', comp: 'TEMPERATURA', sev: 'warn', status: 'A fazer', age: 423 },
            { chave: 'KAN-1466', equip: 'SRV-WEB-09', comp: 'DISCO', sev: 'warn', status: 'Em andamento', age: 127 }
        ],
        grafico: {
            titulo: 'Entrada × saída de alertas por hora', sub: '(só horas com movimento)',
            buckets: [
                ['01h', 1, 1], ['05h', 2, 0], ['06h', 1, 0], ['07h', 1, 1], ['08h', 0, 1],
                ['09h', 1, 0], ['10h', 0, 1], ['12h', 2, 0], ['13h', 0, 2], ['14h', 1, 0]
            ]
        }
    },
    '7d': {
        titulo: 'Últimos 7 dias',
        refAnterior: '7 dias anteriores',
        criticosCriados: 23,
        prev: { criticos: 3, fora: 29, media: 98, abertos: 11 },
        resolvidos: montarResolvidos({
            RAM: [10, 94, 6], DISCO: [12, 74, 6], TEMPERATURA: [12, 51, 3], REDE: [8, 50, 2], CPU: [8, 45, 2]
        }),
        abertos: montarAbertos({ DISCO: [0, 4], TEMPERATURA: [1, 3], RAM: [1, 1], CPU: [1, 1] }),
        grafico: {
            titulo: 'Entrada × saída de alertas por dia', sub: '',
            buckets: [
                ['17/11', 7, 3], ['18/11', 7, 5], ['19/11', 9, 11], ['20/11', 12, 9],
                ['21/11', 8, 7], ['22/11', 10, 8], ['23/11', 9, 7]
            ]
        }
    },
    '30d': {
        titulo: 'Últimos 30 dias',
        refAnterior: '30 dias anteriores',
        criticosCriados: 67,
        prev: { criticos: 15, fora: 123, media: 81, abertos: 50 },
        resolvidos: montarResolvidos({
            DISCO: [50, 105, 25], RAM: [45, 87, 20], CPU: [30, 78, 12], TEMPERATURA: [45, 77, 20], REDE: [31, 37, 6]
        }),
        abertos: montarAbertos({ DISCO: [5, 10], RAM: [3, 9], TEMPERATURA: [3, 8], CPU: [2, 4], REDE: [1, 3] }),
        grafico: {
            titulo: 'Entrada × saída de alertas por semana', sub: '',
            buckets: [
                ['25/10–26/10<br>(2 dias)', 14, 12, true], ['27/10–02/11', 63, 51], ['03/11–09/11', 55, 43],
                ['10/11–16/11', 55, 45], ['17/11–23/11', 62, 50]
            ]
        }
    }
};

/* formatadores */
function fmtDur(min, compacto) {
    min = Math.round(min);
    if (min < 60) return min + ' min';
    var h = Math.floor(min / 60), m = min % 60;
    if (m === 0) return h + 'h';
    return h + 'h' + (compacto ? '' : ' ') + m + 'min';
}

function fmtSlaCurto(min) {
    if (min < 60) return min + 'min';
    var h = Math.floor(min / 60), m = min % 60;
    return m === 0 ? h + 'h' : h + 'h' + String(m).padStart(2, '0');
}

function $(id) { return document.getElementById(id); }

/* cálculo */
function calcular(periodo, sla) {
    var p = PERIODOS[periodo];
    var abertosFora = p.abertos.filter(function (a) { return a.age > sla; });
    var resFora = p.resolvidos.filter(function (r) { return r.dur > sla; });
    var total = p.abertos.length + p.resolvidos.length;
    var soma = p.resolvidos.reduce(function (a, r) { return a + r.dur; }, 0);

    var porComp = {};
    COMPONENTES.forEach(function (c) { porComp[c] = { crit: 0, warn: 0, durs: [] }; });
    p.abertos.forEach(function (a) { porComp[a.comp][a.sev]++; });
    p.resolvidos.forEach(function (r) { porComp[r.comp].durs.push(r.dur); });

    return {
        p: p,
        total: total,
        criticosAbertos: p.abertos.filter(function (a) { return a.sev === 'crit'; }).length,
        abertosFora: abertosFora,
        resFora: resFora.length,
        fora: abertosFora.length + resFora.length,
        media: p.resolvidos.length ? soma / p.resolvidos.length : 0,
        porComp: porComp
    };
}

/* preenchimento do HTML (KPIs e fila) */
function setTexto(id, txt) { $(id).textContent = txt; }

function setDelta(prefixo, tipo, valor, resto) {
    var v = $(prefixo + '_delta_val');
    v.className = tipo;
    v.textContent = valor;
    setTexto(prefixo + '_delta_txt', resto);
}

function deltaNumero(prefixo, atual, anterior, ref) {
    var d = atual - anterior;
    if (d === 0) return setDelta(prefixo, 'igual', '= igual', 'vs. ' + ref + ' (' + anterior + ')');
    setDelta(prefixo, d > 0 ? 'up' : 'down', (d > 0 ? '▲ +' : '▼ −') + Math.abs(d), 'vs. ' + ref + ' (eram ' + anterior + ')');
}

function deltaPct(prefixo, atual, anterior, ref, textoAnterior, plural) {
    var pct = Math.round((atual - anterior) / anterior * 100);
    var era = plural ? 'eram ' : 'era ';
    if (pct === 0) return setDelta(prefixo, 'igual', '= igual', 'vs. ' + ref + ' (' + textoAnterior + ')');
    setDelta(prefixo, pct > 0 ? 'up' : 'down', (pct > 0 ? '▲ +' : '▼ −') + Math.abs(pct) + '%', 'vs. ' + ref + ' (' + era + textoAnterior + ')');
}

function preencherKpis(c) {
    var p = c.p, ref = p.refAnterior, sla = slaAtual;

    // críticos
    setTexto('crit_valor', c.criticosAbertos);
    deltaNumero('crit', c.criticosAbertos, p.prev.criticos, ref);
    setTexto('crit_rodape', 'de ' + p.criticosCriados + ' críticos criados no período');
    $('kpi_crit').classList.toggle('k_crit', c.criticosAbertos > 0);

    // fora do SLA (a comparação acompanha o SLA escolhido — mock)
    var base60 = calcular(periodoAtual, SLA_PADRAO).fora || 1;
    var prevFora = Math.round(p.prev.fora * (c.fora / base60));
    setTexto('fora_valor', c.fora);
    setTexto('fora_de', 'de ' + c.total + ' alertas (' + Math.round(c.fora / c.total * 100) + '%)');
    deltaNumero('fora', c.fora, prevFora, ref);
    setTexto('fora_rodape', c.abertosFora.length + ' ainda abertos + ' + c.resFora + ' resolvidos fora do prazo · SLA: ' + fmtDur(sla));

    // tempo médio
    var temMedia = p.resolvidos.length > 0;
    var acima = c.media > sla;
    var escala = Math.max(sla * 2, c.media * 1.1);
    var card = $('kpi_media');
    card.classList.toggle('k_warn', acima);
    card.classList.toggle('k_ok', !acima);

    var valor = $('media_valor');
    valor.textContent = temMedia ? fmtDur(c.media) : '—';
    valor.classList.toggle('laranja', acima);
    valor.classList.toggle('verde', !acima);

    if (temMedia) {
        deltaPct('media', c.media, p.prev.media, ref, fmtDur(p.prev.media), false);
    } else {
        setDelta('media', 'igual', '', 'sem resolvidos no período');
    }

    var fill = $('media_fill');
    fill.style.width = Math.min(100, c.media / escala * 100) + '%';
    fill.classList.toggle('verde', !acima);
    $('media_marca').style.left = (sla / escala * 100) + '%';
    setTexto('media_marca_txt', 'SLA ' + fmtSlaCurto(sla));

    var diff = Math.abs(Math.round(c.media - sla));
    setTexto('media_rodape', !temMedia ? '' : (acima ? 'Ainda ' + fmtDur(diff) + ' acima do SLA' : 'Dentro do SLA · ' + fmtDur(diff) + ' abaixo'));

    // em aberto
    setTexto('abertos_valor', p.abertos.length);
    if (p.prev.abertos === null) {
        setDelta('abertos', 'igual', '', '— sem base de comparação');
    } else {
        deltaPct('abertos', p.abertos.length, p.prev.abertos, ref, String(p.prev.abertos), true);
    }
    setTexto('abertos_rodape', c.total + ' criados no período · ' + p.resolvidos.length + ' resolvidos (' + Math.round(p.resolvidos.length / c.total * 100) + '%)');
}

function preencherFila(c) {
    var secao = $('fila');
    secao.hidden = periodoAtual !== 'hoje';
    if (secao.hidden) return;

    var linhas = c.abertosFora.slice().sort(function (a, b) { return b.age - a.age; });
    var corpo = $('fila_corpo');
    var modelo = $('tpl_linha');
    corpo.innerHTML = '';

    $('fila_tabela').hidden = linhas.length === 0;
    $('fila_vazio').hidden = linhas.length !== 0;
    setTexto('fila_vazio', 'Nenhum alerta em aberto estourou o SLA de ' + fmtDur(slaAtual) + '.');
    setTexto('fila_th_sla', 'SLA (' + slaAtual + ' min)');

    linhas.forEach(function (a) {
        var tr = modelo.content.cloneNode(true);
        tr.querySelector('.chave').textContent = a.chave;
        tr.querySelector('.equip').textContent = a.equip + ' · ' + a.comp;
        var pill = tr.querySelector('.pill');
        pill.classList.add(a.sev);
        pill.textContent = a.sev === 'crit' ? 'Crítico' : 'Atenção';
        tr.querySelector('.status').textContent = a.status;
        tr.querySelector('.estourado').textContent = 'estourado há ' + fmtDur(a.age - slaAtual);
        corpo.appendChild(tr);
    });

    setTexto('fila_rodape', 'Mostrando ' + linhas.length + ' de ' + c.p.abertos.length + ' alertas em aberto que já estouraram o SLA');
}

/*  Chart js  */
var COR = { crit: '#ef4444', warn: '#f59e0b', ok: '#22c55e', azul: '#3b82f6', texto: '#A5A9C5', branco: '#ffffff', apagado: '#5C6288' };
var graficos = {};

var FONTE = 'Allerta, Arial, sans-serif';
Chart.defaults.font.family = FONTE;
Chart.defaults.color = COR.texto;
Chart.defaults.animation.duration = 500;
Chart.defaults.plugins.legend.display = false;
Chart.defaults.maintainAspectRatio = false;

function criarGraficos() {
    /* 1) Onde estão os alertas em aberto — barras horizontais empilhadas */
    graficos.onde = new Chart($('chart_onde'), {
        type: 'bar',
        data: { labels: [], datasets: [
            { label: 'Crítico', data: [], backgroundColor: COR.crit, barThickness: 26 },
            { label: 'Atenção', data: [], backgroundColor: COR.warn, barThickness: 26 }
        ] },
        options: {
            indexAxis: 'y',
            layout: { padding: { right: 34 } },
            scales: {
                x: { stacked: true, display: false, grid: { display: false }, beginAtZero: true },
                y: { stacked: true, grid: { display: false }, border: { display: false },
                     ticks: { color: COR.branco, font: { size: 11, weight: 'bold' }, padding: 8 } }
            }
        },
        plugins: [{
            id: 'rotulosOnde',
            afterDatasetsDraw: function (chart) {
                var ctx = chart.ctx, totais = chart.$totais || [];
                ctx.save();
                ctx.textBaseline = 'middle';
                chart.data.datasets.forEach(function (ds, di) {
                    chart.getDatasetMeta(di).data.forEach(function (barra, i) {
                        var v = ds.data[i];
                        if (!v) return;
                        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px ' + FONTE; ctx.textAlign = 'center';
                        ctx.fillText(v, (barra.x + barra.base) / 2, barra.y);
                    });
                });
                var ys = chart.getDatasetMeta(0).data;
                totais.forEach(function (t, i) {
                    ctx.fillStyle = t ? '#fff' : COR.apagado;
                    ctx.font = 'bold 14px ' + FONTE; ctx.textAlign = 'right';
                    ctx.fillText(t, chart.width, ys[i].y);
                });
                ctx.restore();
            }
        }]
    });

    /* 2) Entrada × saída — barras agrupadas */
    graficos.fluxo = new Chart($('chart_fluxo'), {
        type: 'bar',
        data: { labels: [], datasets: [
            { label: 'Criados', data: [], backgroundColor: COR.azul, borderRadius: 4, maxBarThickness: 20 },
            { label: 'Resolvidos', data: [], backgroundColor: COR.ok, borderRadius: 4, maxBarThickness: 20 }
        ] },
        options: {
            layout: { padding: { top: 44 } },
            categoryPercentage: 0.7, barPercentage: 0.9,
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 0 } },
                y: { beginAtZero: true, ticks: { display: false, count: 4 }, border: { display: false },
                     grid: { color: 'rgba(255,255,255,.07)' } }
            }
        },
        plugins: [{
            id: 'rotulosFluxo',
            afterDatasetsDraw: function (chart) {
                var ctx = chart.ctx, a = chart.getDatasetMeta(0).data, b = chart.getDatasetMeta(1).data;
                ctx.save();
                ctx.textAlign = 'center'; ctx.font = 'bold 11px ' + FONTE;
                a.forEach(function (barra, i) {
                    var criados = chart.data.datasets[0].data[i], resolvidos = chart.data.datasets[1].data[i];
                    var dim = chart.$parcial && chart.$parcial[i];
                    ctx.globalAlpha = dim ? 0.45 : 1;
                    ctx.textBaseline = 'bottom';
                    ctx.fillStyle = '#60a5fa'; ctx.fillText(criados, barra.x, barra.y - 5);
                    ctx.fillStyle = '#4ade80'; ctx.fillText(resolvidos, b[i].x, b[i].y - 5);
                    var delta = criados - resolvidos;
                    if (delta > 0) {
                        ctx.fillStyle = COR.crit; ctx.font = 'bold 12px ' + FONTE;
                        ctx.fillText('+' + delta, (barra.x + b[i].x) / 2, Math.min(barra.y, b[i].y) - 22);
                        ctx.font = 'bold 11px ' + FONTE;
                    }
                });
                ctx.restore();
            }
        }]
    });

    /* 3) Tempo médio × SLA — barras horizontais + linha tracejada do SLA */
    graficos.tmr = new Chart($('chart_tmr'), {
        type: 'bar',
        data: { labels: [], datasets: [{ data: [], backgroundColor: [], barThickness: 26 }] },
        options: {
            indexAxis: 'y',
            layout: { padding: { top: 44, right: 84 } },
            events: [],
            scales: {
                x: { display: false, min: 0, grid: { display: false } },
                y: { grid: { display: false }, border: { display: false },
                     ticks: { color: COR.branco, font: { size: 11, weight: 'bold' }, padding: 8 } }
            }
        },
        plugins: [{
            id: 'slaTmr',
            afterDatasetsDraw: function (chart) {
                var ctx = chart.ctx, x = chart.scales.x, area = chart.chartArea, ext = chart.$ext;
                if (!ext) return;
                var px = x.getPixelForValue(ext.sla);
                ctx.save();
                ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
                ctx.beginPath(); ctx.moveTo(px, area.top - 6); ctx.lineTo(px, area.bottom); ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#fff'; ctx.font = 'bold 11px ' + FONTE; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
                ctx.fillText('SLA ' + fmtSlaCurto(ext.sla), px, area.top - 12);
                ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                chart.getDatasetMeta(0).data.forEach(function (barra, i) {
                    var t = ext.textos[i];
                    ctx.fillStyle = ext.semDados[i] ? COR.apagado : '#fff';
                    ctx.font = (ext.semDados[i] ? 'normal' : 'bold') + ' 12px ' + FONTE;
                    ctx.fillText(t, area.right + 22, barra.y);
                });
                ctx.restore();
            }
        }]
    });
}

function atualizarGraficos(c) {
    var sla = slaAtual, g = c.p.grafico;

    // 1) onde
    var linhas = COMPONENTES.map(function (nome, idx) {
        var d = c.porComp[nome];
        return { nome: nome, crit: d.crit, warn: d.warn, total: d.crit + d.warn, idx: idx };
    }).sort(function (a, b) { return b.total - a.total || a.idx - b.idx; });
    var onde = graficos.onde;
    onde.data.labels = linhas.map(function (l) { return l.nome; });
    onde.data.datasets[0].data = linhas.map(function (l) { return l.crit || null; });
    onde.data.datasets[1].data = linhas.map(function (l) { return l.warn || null; });
    onde.$totais = linhas.map(function (l) { return l.total; });
    onde.options.scales.x.max = Math.max.apply(null, linhas.map(function (l) { return l.total; })) || 1;
    onde.update();

    // 2) fluxo
    setTexto('fluxo_titulo', g.titulo);
    setTexto('fluxo_sub', g.sub || '');
    var fluxo = graficos.fluxo;
    fluxo.data.labels = g.buckets.map(function (b) { return b[0].split('<br>'); });
    fluxo.data.datasets[0].data = g.buckets.map(function (b) { return b[1]; });
    fluxo.data.datasets[1].data = g.buckets.map(function (b) { return b[2]; });
    fluxo.$parcial = g.buckets.map(function (b) { return !!b[3]; });
    fluxo.data.datasets[0].backgroundColor = g.buckets.map(function (b) { return b[3] ? 'rgba(59,130,246,.4)' : COR.azul; });
    fluxo.data.datasets[1].backgroundColor = g.buckets.map(function (b) { return b[3] ? 'rgba(34,197,94,.4)' : COR.ok; });
    fluxo.update();

    // 3) tempo médio × SLA
    var tmr = COMPONENTES.map(function (nome, idx) {
        var durs = c.porComp[nome].durs;
        return { nome: nome, media: durs.length ? durs.reduce(function (a, b) { return a + b; }, 0) / durs.length : null };
    }).sort(function (a, b) {
        if (a.media === null) return 1;
        if (b.media === null) return -1;
        return b.media - a.media;
    });
    var maxMedia = Math.max.apply(null, tmr.map(function (l) { return l.media || 0; }));
    var graf = graficos.tmr;
    graf.data.labels = tmr.map(function (l) { return l.nome; });
    graf.data.datasets[0].data = tmr.map(function (l) { return l.media || 0; });
    graf.data.datasets[0].backgroundColor = tmr.map(function (l) {
        if (l.media === null || l.media <= sla) return COR.ok;
        return l.media > 120 ? COR.crit : COR.warn;
    });
    graf.$ext = {
        sla: sla,
        textos: tmr.map(function (l) { return l.media === null ? 'sem dados' : fmtDur(l.media, true); }),
        semDados: tmr.map(function (l) { return l.media === null; })
    };
    graf.options.scales.x.max = Math.max(maxMedia, sla * 1.15);
    graf.update();
}

function renderTudo() {
    var c = calcular(periodoAtual, slaAtual);
    setTexto('sla_texto', slaAtual + ' min');
    $('dash').dataset.periodo = periodoAtual;
    preencherKpis(c);
    preencherFila(c);
    atualizarGraficos(c);
}

/* período */
$('select_periodo').addEventListener('change', function (e) {
    periodoAtual = e.target.value;
    renderTudo();
});

/* "tempo real" */
var segundos = 8;
setInterval(function () {
    segundos++;
    if (segundos > 30) segundos = 1; // simula um novo refresh a cada 30s
    $('tempo_real_seg').textContent = segundos;
}, 1000);

/* modal SLA */
var modal = $('modal_sla');
var inputSla = $('sla_input');

function slaValido(v) { return Number.isInteger(v) && v >= SLA_MIN && v <= SLA_MAX; }

function atualizarModal() {
    var v = parseInt(inputSla.value, 10);
    var ok = slaValido(v);
    $('sla_erro').hidden = ok || inputSla.value === '';
    document.querySelector('.sla_input_wrap').classList.toggle('erro', !ok && inputSla.value !== '');
    $('sla_equivale').textContent = ok && v >= 60 ? '= ' + fmtDur(v) : '';
    document.querySelectorAll('#sla_presets button').forEach(function (b) {
        b.classList.toggle('ativo', ok && parseInt(b.dataset.min, 10) === v);
    });
}

function abrirModal() {
    inputSla.value = slaAtual;
    atualizarModal();
    modal.classList.add('aberto');
    modal.setAttribute('aria-hidden', 'false');
    setTimeout(function () { inputSla.focus(); inputSla.select(); }, 120);
}

function fecharModal() {
    modal.classList.remove('aberto');
    modal.setAttribute('aria-hidden', 'true');
    $('btn_sla').focus();
}

function salvarSla() {
    var v = parseInt(inputSla.value, 10);
    if (!slaValido(v)) { atualizarModal(); $('sla_erro').hidden = false; return; }
    slaAtual = v;
    try { localStorage.setItem('dash_alertas_sla', String(v)); } catch (e) { }
    renderTudo();
    fecharModal();
    mostrarToast('SLA atualizado para ' + fmtDur(v));
}

function mostrarToast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('visivel');
    clearTimeout(mostrarToast.t);
    mostrarToast.t = setTimeout(function () { t.classList.remove('visivel'); }, 2400);
}

$('btn_sla').addEventListener('click', abrirModal);
$('modal_sla_fechar').addEventListener('click', fecharModal);
$('sla_cancelar').addEventListener('click', fecharModal);
$('sla_salvar').addEventListener('click', salvarSla);
modal.addEventListener('mousedown', function (e) { if (e.target === modal) fecharModal(); });
inputSla.addEventListener('input', atualizarModal);

$('sla_menos').addEventListener('click', function () {
    var v = parseInt(inputSla.value, 10) || slaAtual;
    inputSla.value = Math.max(SLA_MIN, v - 5);
    atualizarModal();
});
$('sla_mais').addEventListener('click', function () {
    var v = parseInt(inputSla.value, 10) || slaAtual;
    inputSla.value = Math.min(SLA_MAX, v + 5);
    atualizarModal();
});
$('sla_presets').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    inputSla.value = b.dataset.min;
    atualizarModal();
});

document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('aberto')) return;
    if (e.key === 'Escape') fecharModal();
    if (e.key === 'Enter') salvarSla();
});

/* init */
try
{
    var salvo = parseInt(localStorage.getItem('dash_alertas_sla'), 10);
    if (slaValido(salvo)) slaAtual = salvo;
}

catch (e)
{
    
}

criarGraficos();
renderTudo();