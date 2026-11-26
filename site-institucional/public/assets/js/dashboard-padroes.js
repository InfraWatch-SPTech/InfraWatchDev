var cor_azul = '#5178F9';
var cor_vermelho = '#FF5C5C';
var cor_amarelo = '#F5C542';
var cor_cinza = '#5C6288';
var expediente = { inicio: 8, fim: 18 };
var nomesDias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
var nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
var DIAS_HISTORICO = 430;

var eventos_criticos = [
    { nome: 'Pagamento de salários', rotulo: '5º dia útil', regra: 'dia_util', valor: 5, pico: 3 },
    { nome: 'Vencimento de boletos', rotulo: 'Dia 8', regra: 'dia_mes', valor: 8, pico: 2.5 },
    { nome: 'Black Friday', rotulo: 'Sexta de promoções', regra: 'black_friday', pico: 6 },
    { nome: '13º salário (2ª parcela)', rotulo: '20 de dezembro', regra: 'data_fixa', mes: 11, dia: 20, pico: 4 }
];

var agora = new Date();
var dataHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

function somarDias(data, n) {
    return new Date(data.getFullYear(), data.getMonth(), data.getDate() + n);
}

function chaveDia(data) {
    return data.getFullYear() + '-' + data.getMonth() + '-' + data.getDate();
}

function formatarData(data, comAno) {
    var texto = String(data.getDate()).padStart(2, '0') + '/' + String(data.getMonth() + 1).padStart(2, '0');
    return comAno ? texto + '/' + data.getFullYear() : texto;
}

function formatarMinutos(min) {
    if (min < 60) {
        return min + ' min';
    }
    return Math.floor(min / 60) + 'h' + String(min % 60).padStart(2, '0');
}

function somarLista(lista) {
    var total = 0;
    for (var i = 0; i < lista.length; i++) {
        total += lista[i];
    }
    return total;
}

function enesimoDiaUtil(ano, mes, n) {
    var contagem = 0;
    for (var dia = 1; dia <= 31; dia++) {
        var data = new Date(ano, mes, dia);
        if (data.getMonth() !== mes) {
            break;
        }
        if (data.getDay() !== 0 && data.getDay() !== 6) {
            contagem++;
            if (contagem === n) {
                return data;
            }
        }
    }
    return null;
}

function blackFriday(ano) {
    var quintas = 0;
    for (var dia = 1; dia <= 30; dia++) {
        if (new Date(ano, 10, dia).getDay() === 4) {
            quintas++;
            if (quintas === 4) {
                return new Date(ano, 10, dia + 1);
            }
        }
    }
    return null;
}

function candidataDaRegra(evento, ano, mes) {
    if (evento.regra === 'dia_util') {
        return enesimoDiaUtil(ano, mes, evento.valor);
    }
    if (evento.regra === 'dia_mes') {
        return new Date(ano, mes, evento.valor);
    }
    if (evento.regra === 'black_friday') {
        return blackFriday(ano);
    }
    return new Date(ano, evento.mes, evento.dia);
}

function proximaOcorrencia(evento, base) {
    for (var k = 0; k < 30; k++) {
        var ref = new Date(base.getFullYear(), base.getMonth() + k, 1);
        var candidata = candidataDaRegra(evento, ref.getFullYear(), ref.getMonth());
        if (candidata && candidata >= base) {
            return candidata;
        }
    }
    return null;
}

function ocorrenciaAnterior(evento, data) {
    for (var k = 0; k < 30; k++) {
        var ref = new Date(data.getFullYear(), data.getMonth() - k, 1);
        var candidata = candidataDaRegra(evento, ref.getFullYear(), ref.getMonth());
        if (candidata && candidata < data) {
            return candidata;
        }
    }
    return null;
}

function multiplicadorEvento(dia) {
    for (var i = 0; i < eventos_criticos.length; i++) {
        var candidata = candidataDaRegra(eventos_criticos[i], dia.getFullYear(), dia.getMonth());
        if (candidata && chaveDia(candidata) === chaveDia(dia)) {
            return eventos_criticos[i].pico;
        }
    }
    return 1;
}

function aleatorio(semente) {
    var s = semente;
    return function () {
        s = (s + 0x6D2B79F5) | 0;
        var t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function poisson(media, rnd) {
    var limite = Math.exp(-media);
    var k = 0;
    var p = 1;
    do {
        k++;
        p *= rnd();
    } while (p > limite);
    return k - 1;
}

function sortearIndice(pesos, rnd) {
    var sorteio = rnd() * somarLista(pesos);
    for (var i = 0; i < pesos.length; i++) {
        sorteio -= pesos[i];
        if (sorteio <= 0) {
            return i;
        }
    }
    return pesos.length - 1;
}

function pesoHora(hora, util, pico) {
    if (!util) {
        return hora >= 8 && hora <= 20 ? 0.8 : 0.08;
    }
    var peso = 0.15;
    if (hora >= 9 && hora <= 11) { peso = 2; }
    if (hora >= 17 && hora <= 19) { peso = pico > 1 ? 8 : 3; }
    return peso;
}

function foraDoExpediente(data) {
    var semana = data.getDay();
    return semana === 0 || semana === 6 || data.getHours() < expediente.inicio || data.getHours() >= expediente.fim;
}

function gerarAlertasSinteticos() {
    var rnd = aleatorio(2026);
    var lista = [];
    for (var i = DIAS_HISTORICO; i >= 0; i--) {
        var dia = somarDias(dataHoje, -i);
        var util = dia.getDay() !== 0 && dia.getDay() !== 6;
        var pico = multiplicadorEvento(dia);
        var media = (util ? 1.3 : 0.45) * pico * (1 + (DIAS_HISTORICO - i) / 1600);
        if (dia.getMonth() === 10) { media *= 1.5; }
        if (dia.getMonth() === 11) { media *= 1.8; }
        var qtd = poisson(media, rnd);
        for (var k = 0; k < qtd; k++) {
            var pesos = [];
            for (var h = 0; h < 24; h++) {
                pesos.push(pesoHora(h, util, pico));
            }
            var hora = sortearIndice(pesos, rnd);
            var momento = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), hora, Math.floor(rnd() * 60));
            var duracao = (4 + Math.floor(rnd() * 14)) * (pico > 1 ? 1.4 : 1) * (foraDoExpediente(momento) ? 1.3 : 1);
            lista.push({ t: momento, comp: sortearIndice([0.4, 0.28, 0.21, 0.11], rnd), dur: Math.round(duracao) });
        }
    }
    return lista;
}

var alertas = gerarAlertasSinteticos();
var contagemPorDia = {};
for (var a = 0; a < alertas.length; a++) {
    var chaveAlerta = chaveDia(alertas[a].t);
    contagemPorDia[chaveAlerta] = (contagemPorDia[chaveAlerta] || 0) + 1;
}

function contagemNoDia(data) {
    return contagemPorDia[chaveDia(data)] || 0;
}

function mediaDiaria(fim, dias) {
    var total = 0;
    for (var i = 0; i < dias; i++) {
        total += contagemNoDia(somarDias(fim, -i));
    }
    return total / dias;
}

function perfilPorHora(inicio, fim) {
    var perfil = [];
    for (var h = 0; h < 24; h++) {
        perfil.push(0);
    }
    for (var i = 0; i < alertas.length; i++) {
        if (alertas[i].t >= inicio && alertas[i].t < fim) {
            perfil[alertas[i].t.getHours()]++;
        }
    }
    return perfil;
}

function duracaoMediaEntre(inicio, fim) {
    var soma = 0;
    var qtd = 0;
    for (var i = 0; i < alertas.length; i++) {
        if (alertas[i].t >= inicio && alertas[i].t < fim) {
            soma += alertas[i].dur;
            qtd++;
        }
    }
    return qtd > 0 ? Math.round(soma / qtd) : 30;
}

function calcularPrevisao(evento) {
    var proxima = proximaOcorrencia(evento, dataHoje);
    var ref = ocorrenciaAnterior(evento, proxima);
    var fimRef = somarDias(ref, 1);
    var recente = mediaDiaria(dataHoje, 30);
    var antes = mediaDiaria(somarDias(ref, -1), 30);
    var fator = antes > 0 ? Math.min(2, Math.max(0.5, recente / antes)) : 1;
    var incRef = contagemNoDia(ref);
    var previstos = Math.round(incRef * fator);
    var duracao = duracaoMediaEntre(ref, fimRef);
    var perfilRef = perfilPorHora(ref, fimRef);
    var perfilNormal = perfilPorHora(somarDias(dataHoje, -30), dataHoje);
    var perfilPrevisto = [];
    var melhor = { hora: 0, soma: -1 };
    for (var h = 0; h < 24; h++) {
        perfilNormal[h] = Math.round(perfilNormal[h] / 30 * 100) / 100;
        perfilPrevisto.push(Math.round(perfilRef[h] * fator * 100) / 100);
        if (h <= 21) {
            var soma = perfilRef[h] + perfilRef[h + 1] + perfilRef[h + 2];
            if (soma > melhor.soma) { melhor = { hora: h, soma: soma }; }
        }
    }
    var ocorrencias = 0;
    var passada = ref;
    while (passada && passada >= somarDias(dataHoje, -DIAS_HISTORICO)) {
        ocorrencias++;
        passada = ocorrenciaAnterior(evento, passada);
    }
    return {
        evento: evento, proxima: proxima, ref: ref, incRef: incRef, previstos: previstos,
        faixa: [Math.round(previstos * 0.75), Math.round(previstos * 1.25)],
        fatorNormal: recente > 0 ? previstos / recente : 0,
        tempo: previstos * duracao, duracao: duracao,
        horaPico: melhor.hora + 'h às ' + (melhor.hora + 3) + 'h',
        perfilNormal: perfilNormal, perfilRef: perfilRef, perfilPrevisto: perfilPrevisto,
        ocorrencias: ocorrencias, confianca: ocorrencias >= 3 ? 'alta' : (ocorrencias === 2 ? 'média' : 'baixa'),
        dias: Math.round((proxima - dataHoje) / 86400000)
    };
}

var previsoes = [];
var graficoPrevisao = null;

function htmlKpis(kpis) {
    var html = '';
    for (var i = 0; i < kpis.length; i++) {
        html += '<div class="padrao_kpi"><p class="padrao_kpi_nome">' + kpis[i].nome + '</p>' +
            '<p class="padrao_kpi_valor">' + kpis[i].valor + '</p>' +
            '<p class="padrao_kpi_sub ' + kpis[i].cor + '">' + kpis[i].sub + '</p></div>';
    }
    return html;
}

function configurarChart() {
    Chart.defaults.color = '#A5A9C5';
    Chart.defaults.font.family = 'Allerta, sans-serif';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.08)';
}

function selecionarEvento(indice) {
    var p = previsoes[indice];
    var itens = document.querySelectorAll('.padrao_evento');
    for (var i = 0; i < itens.length; i++) {
        itens[i].classList.toggle('selecionado', i === indice);
    }
    document.getElementById('previsao-kpis').innerHTML = htmlKpis([
        { nome: 'Incidentes previstos', valor: p.previstos, sub: 'faixa de ' + p.faixa[0] + ' a ' + p.faixa[1] + ' · ' + p.fatorNormal.toFixed(1).replace('.', ',') + 'x um dia normal · último evento: ' + p.incRef, cor: 'padrao_cor_ruim' },
        { nome: 'Tempo em incidente previsto', valor: formatarMinutos(p.tempo), sub: 'duração média de ' + p.duracao + ' min por incidente no último evento', cor: 'padrao_cor_atencao' },
        { nome: 'Horário mais crítico', valor: p.horaPico, sub: 'maior concentração de incidentes no último evento', cor: 'padrao_cor_atencao' }
    ]);
    document.getElementById('previsao-titulo').textContent = p.evento.nome + ' · ' + formatarData(p.proxima, true) + ' (incidentes por hora)';
    document.getElementById('previsao-nota').textContent = 'Referência: ' + formatarData(p.ref, true) + ' · confiança ' + p.confianca + ' (' + p.ocorrencias + (p.ocorrencias === 1 ? ' ocorrência anterior)' : ' ocorrências anteriores)');
    var horas = [];
    for (var h = 0; h < 24; h++) {
        horas.push(h + 'h');
    }
    if (graficoPrevisao) {
        graficoPrevisao.destroy();
    }
    graficoPrevisao = new Chart(document.getElementById('grafico-previsao'), {
        type: 'line',
        data: {
            labels: horas,
            datasets: [
                { label: 'Dia normal', data: p.perfilNormal, borderColor: cor_cinza, borderDash: [6, 6], cubicInterpolationMode: 'monotone', pointRadius: 0 },
                { label: 'Último evento (' + formatarData(p.ref, true) + ')', data: p.perfilRef, borderColor: cor_amarelo, cubicInterpolationMode: 'monotone', pointRadius: 0 },
                { label: 'Previsão', data: p.perfilPrevisto, borderColor: cor_azul, backgroundColor: 'rgba(81, 120, 249, 0.15)', fill: true, cubicInterpolationMode: 'monotone', pointRadius: 2 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { labels: { usePointStyle: true, pointStyle: 'line', boxWidth: 28 } } },
            scales: { x: { ticks: { maxTicksLimit: 12 } }, y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });
}

function renderizarSecaoPrevisibilidade() {
    for (var i = 0; i < eventos_criticos.length; i++) {
        previsoes.push(calcularPrevisao(eventos_criticos[i]));
    }
    previsoes.sort(function (a, b) { return a.proxima - b.proxima; });
    previsoes = previsoes.slice(0, 3);

    var lista = '';
    for (var j = 0; j < previsoes.length; j++) {
        var p = previsoes[j];
        var classe = p.fatorNormal >= 3 ? 'padrao_tag_ruim' : (p.fatorNormal >= 1.5 ? 'padrao_tag_alerta' : '');
        var risco = p.fatorNormal >= 3 ? 'risco alto' : (p.fatorNormal >= 1.5 ? 'risco médio' : 'risco baixo');
        lista += '<button class="padrao_evento" type="button" data-indice="' + j + '">' +
            '<span class="padrao_evento_info"><strong>' + p.evento.nome + '</strong><span>' + p.evento.rotulo + ' · ' + formatarData(p.proxima) + '</span></span>' +
            '<span class="padrao_evento_dados"><span class="padrao_tag ' + classe + '">' + risco + '</span>' +
            '<span>' + (p.dias === 0 ? 'hoje' : (p.dias === 1 ? 'amanhã' : 'em ' + p.dias + ' dias')) + ' · ' + p.previstos + ' incidentes</span></span></button>';
    }
    document.getElementById('conteudo-previsibilidade').innerHTML =
        '<div class="padrao_previsao"><div class="padrao_previsao_principal">' +
        '<div class="padrao_kpis" id="previsao-kpis"></div>' +
        '<div class="padrao_caixa"><p class="padrao_caixa_titulo" id="previsao-titulo"></p>' +
        '<div class="padrao_grafico"><canvas id="grafico-previsao"></canvas></div>' +
        '<p class="padrao_nota" id="previsao-nota"></p></div></div>' +
        '<div class="padrao_caixa"><p class="padrao_caixa_titulo">Próximos dias críticos</p><div class="padrao_eventos">' + lista + '</div></div></div>';

    var botoes = document.querySelectorAll('.padrao_evento');
    for (var k = 0; k < botoes.length; k++) {
        botoes[k].addEventListener('click', selecionarEvento.bind(null, k));
    }
    selecionarEvento(0);
}

function montarMapaCalor() {
    var matriz = [];
    for (var r = 0; r < 7; r++) {
        matriz.push([]);
        for (var c = 0; c < 24; c++) {
            matriz[r].push(0);
        }
    }
    var inicio = somarDias(dataHoje, -90);
    for (var i = 0; i < alertas.length; i++) {
        if (alertas[i].t >= inicio) {
            matriz[(alertas[i].t.getDay() + 6) % 7][alertas[i].t.getHours()]++;
        }
    }
    return matriz;
}

function analisarCalor(matriz) {
    var total = 0;
    var maiorCelula = 0;
    var porHora = [];
    for (var h = 0; h < 24; h++) {
        porHora.push(0);
    }
    for (var r = 0; r < 7; r++) {
        for (var c = 0; c < 24; c++) {
            total += matriz[r][c];
            porHora[c] += matriz[r][c];
            if (matriz[r][c] > maiorCelula) { maiorCelula = matriz[r][c]; }
        }
    }
    var ordenadas = porHora.slice().sort(function (a, b) { return b - a; });
    var topo = 0;
    for (var i = 0; i < 6; i++) {
        topo += ordenadas[i];
    }
    var atipicos = 0;
    var calma = { r: 0, c: 0, soma: Infinity };
    for (var d = 0; d < 7; d++) {
        for (var j = 0; j < 24; j++) {
            if (matriz[d][j] <= maiorCelula * 0.25) { atipicos += matriz[d][j]; }
            if (j <= 21) {
                var soma = matriz[d][j] + matriz[d][j + 1] + matriz[d][j + 2];
                if (soma < calma.soma) { calma = { r: d, c: j, soma: soma }; }
            }
        }
    }
    return {
        pctPico: total > 0 ? Math.round(topo / total * 100) : 0,
        atipicos: atipicos,
        pctAtipicos: total > 0 ? Math.round(atipicos / total * 100) : 0,
        janelaCalma: nomesDias[calma.r] + ', ' + calma.c + 'h às ' + (calma.c + 3) + 'h'
    };
}

function duracaoExpediente() {
    var dentro = [];
    var fora = [];
    var inicio = somarDias(dataHoje, -90);
    for (var i = 0; i < alertas.length; i++) {
        if (alertas[i].t >= inicio) {
            (foraDoExpediente(alertas[i].t) ? fora : dentro).push(alertas[i].dur);
        }
    }
    return { dentro: Math.round(somarLista(dentro) / Math.max(dentro.length, 1)), fora: Math.round(somarLista(fora) / Math.max(fora.length, 1)) };
}

function renderizarTendencia() {
    var atual = [];
    var anterior = [];
    var rotulos = [];
    for (var i = 29; i >= 0; i--) {
        atual.push(contagemNoDia(somarDias(dataHoje, -i)));
        anterior.push(contagemNoDia(somarDias(dataHoje, -i - 30)));
        rotulos.push(formatarData(somarDias(dataHoje, -i)));
    }
    new Chart(document.getElementById('grafico-tendencia'), {
        type: 'line',
        data: {
            labels: rotulos,
            datasets: [
                { label: 'Últimos 30 dias', data: atual, borderColor: cor_azul, backgroundColor: cor_azul, cubicInterpolationMode: 'monotone', pointRadius: 2 },
                { label: '30 dias anteriores', data: anterior, borderColor: cor_cinza, borderDash: [6, 6], cubicInterpolationMode: 'monotone', pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { labels: { usePointStyle: true, pointStyle: 'line', boxWidth: 28 } } },
            scales: { x: { ticks: { maxTicksLimit: 10 } }, y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });
    document.getElementById('padrao-tendencia-nota').textContent =
        somarLista(atual) + ' incidentes no período contra ' + somarLista(anterior) + ' nos 30 dias anteriores.';
}

function renderizarSecaoTempo() {
    var matriz = montarMapaCalor();
    var analise = analisarCalor(matriz);
    var duracao = duracaoExpediente();
    var pctDuracao = duracao.dentro > 0 ? Math.round((duracao.fora / duracao.dentro - 1) * 100) : 0;
    var kpis = [
        { nome: 'Concentração nas horas de pico', valor: analise.pctPico + '%', sub: 'dos alertas em apenas 6 das 24 horas do dia', cor: 'padrao_cor_atencao' },
        { nome: 'Alertas em horário atípico', valor: analise.pctAtipicos + '%', sub: analise.atipicos + ' alertas em horários normalmente calmos (até 25% do pico do mapa)', cor: 'padrao_cor_ruim' },
        { nome: 'Duração fora do expediente', valor: (pctDuracao >= 0 ? '+' : '') + pctDuracao + '%', sub: 'incidentes mais longos: ' + duracao.fora + ' min contra ' + duracao.dentro + ' min dentro do expediente (seg a sex, ' + expediente.inicio + 'h às ' + expediente.fim + 'h)', cor: 'padrao_cor_atencao' },
        { nome: 'Melhor janela para manutenção', valor: analise.janelaCalma, sub: 'período com menor movimento de alertas', cor: 'padrao_cor_bom' }
    ];

    var maior = 1;
    for (var a1 = 0; a1 < 7; a1++) {
        for (var b1 = 0; b1 < 24; b1++) {
            if (matriz[a1][b1] > maior) { maior = matriz[a1][b1]; }
        }
    }
    var mapa = '';
    for (var r = 0; r < 7; r++) {
        mapa += '<span class="padrao_calor_rotulo">' + nomesDias[r].toLowerCase() + '</span>';
        for (var c = 0; c < 24; c++) {
            mapa += '<span class="padrao_calor_celula" style="opacity:' + Math.max(0.12, matriz[r][c] / maior).toFixed(2) +
                '" title="' + nomesDias[r].toLowerCase() + ' ' + c + 'h: ' + matriz[r][c] + ' alertas"></span>';
        }
    }
    var horas = '<span></span>';
    for (var h = 0; h < 24; h++) {
        horas += '<span>' + (h % 3 === 0 ? h + 'h' : '') + '</span>';
    }

    var contagemMes = {};
    for (var i = 0; i < alertas.length; i++) {
        var chaveMes = alertas[i].t.getFullYear() + '-' + alertas[i].t.getMonth();
        contagemMes[chaveMes] = (contagemMes[chaveMes] || 0) + 1;
    }
    var rotulosMeses = [];
    var valoresMeses = [];
    for (var k = 12; k >= 1; k--) {
        var ref = new Date(dataHoje.getFullYear(), dataHoje.getMonth() - k, 1);
        rotulosMeses.push(nomesMeses[ref.getMonth()]);
        valoresMeses.push(contagemMes[ref.getFullYear() + '-' + ref.getMonth()] || 0);
    }
    var mediaMeses = somarLista(valoresMeses) / valoresMeses.length;
    var coresMeses = [];
    for (var j = 0; j < valoresMeses.length; j++) {
        coresMeses.push(valoresMeses[j] >= mediaMeses * 1.4 ? cor_vermelho : cor_azul);
    }

    document.getElementById('conteudo-tempo').innerHTML =
        '<div class="padrao_kpis">' + htmlKpis(kpis) + '</div>' +
        '<div class="padrao_grade">' +
        '<div class="padrao_caixa"><p class="padrao_caixa_titulo">Alertas por hora e dia da semana (últimos 90 dias)</p>' +
        '<div class="padrao_calor">' + mapa + '</div><div class="padrao_calor_horas">' + horas + '</div>' +
        '<div class="padrao_calor_legenda"><span>menos</span><div class="padrao_calor_escala"></div><span>mais</span></div></div>' +
        '<div class="padrao_caixa"><p class="padrao_caixa_titulo">Alertas por mês (últimos 12 meses completos)</p>' +
        '<div class="padrao_grafico"><canvas id="grafico-meses"></canvas></div>' +
        '<p class="padrao_nota">Em vermelho, os meses com possível sobrecarga (40% acima da média).</p></div></div>' +
        '<div class="padrao_caixa"><p class="padrao_caixa_titulo">Incidentes nos últimos 30 dias</p>' +
        '<div class="padrao_grafico"><canvas id="grafico-tendencia"></canvas></div>' +
        '<p class="padrao_nota" id="padrao-tendencia-nota"></p></div>';

    new Chart(document.getElementById('grafico-meses'), {
        type: 'bar',
        data: { labels: rotulosMeses, datasets: [{ label: 'Alertas', data: valoresMeses, backgroundColor: coresMeses }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
    renderizarTendencia();
}

document.getElementById('padrao-periodo').textContent = 'Últimos 30 dias';
configurarChart();
renderizarSecaoPrevisibilidade();
renderizarSecaoTempo();