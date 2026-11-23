var mock_m2 = {
    periodo: 'Últimos 30 dias',
    dias: 30,
    incidentes_anterior: 39,
    tendencia_atual: [1, 2, 1, 0, 2, 3, 1, 1, 2, 1, 2, 2, 1, 3, 2, 1, 0, 2, 2, 1, 3, 2, 1, 2, 1, 2, 3, 1, 1, 1],
    tendencia_anterior: [1, 1, 2, 1, 1, 2, 1, 0, 1, 2, 1, 1, 2, 1, 2, 1, 0, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 2, 2, 2],
    componentes: [
        { nome: 'Disco', alerta: 14, critico: 5 },
        { nome: 'RAM', alerta: 10, critico: 3 },
        { nome: 'CPU', alerta: 7, critico: 3 },
        { nome: 'Rede', alerta: 4, critico: 1 }
    ],
    processos: [
        { nome: 'backup_job', qtd: 16 },
        { nome: 'db_batch', qtd: 10 },
        { nome: 'app_pix', qtd: 8 },
        { nome: 'antivirus_scan', qtd: 5 },
        { nome: 'outros', qtd: 8 }
    ],
    servidores: [
        { nome: 'SERV-01', incidentes: 14, tempoInatividade: 380, repetidos7d: 11, score: 86, componente: 'Disco', ultima: 'há 2 dias', acessos: 182400 },
        { nome: 'SERV-02', incidentes: 11, tempoInatividade: 420, repetidos7d: 8, score: 74, componente: 'RAM', ultima: 'há 1 dia', acessos: 154300 },
        { nome: 'SERV-56', incidentes: 9, tempoInatividade: 130, repetidos7d: 5, score: 61, componente: 'Disco', ultima: 'há 4 dias', acessos: 98700 },
        { nome: 'SERV-44', incidentes: 6, tempoInatividade: 72, repetidos7d: 2, score: 45, componente: 'CPU', ultima: 'há 6 dias', acessos: 61200 },
        { nome: 'SERV-123', incidentes: 4, tempoInatividade: 72, repetidos7d: 1, score: 30, componente: 'Rede', ultima: 'há 9 dias', acessos: 40500 },
        { nome: 'SERV-X', incidentes: 3, tempoInatividade: 54, repetidos7d: 0, score: 22, componente: 'CPU', ultima: 'há 12 dias', acessos: 22800 }
    ],
    meses: [31, 28, 35, 33, 38, 36, 34, 37, 41, 44, 63, 72],
    duracaoExpediente: { dentro: 19, fora: 33 },
    incidentes: [
        { id: 'INC-1042', servidor: 'SERV-01', componente: 'Disco', gravidade: 'Crítico', inicio: '05/11 17:42', duracao: '38 min', pico: 91, limiar: 75, unidade: '%', processo: 'backup_job', assinatura: 'Degradação gradual', serie: [68, 72, 78, 84, 89, 91, 88, 80] },
        { id: 'INC-1041', servidor: 'SERV-02', componente: 'RAM', gravidade: 'Alerta', inicio: '05/11 10:15', duracao: '22 min', pico: 84, limiar: 80, unidade: '%', processo: 'db_batch', assinatura: 'Pico súbito', serie: [60, 64, 70, 83, 84, 79, 72, 66] },
        { id: 'INC-1039', servidor: 'SERV-01', componente: 'Disco', gravidade: 'Alerta', inicio: '04/11 18:05', duracao: '45 min', pico: 79, limiar: 75, unidade: '%', processo: 'backup_job', assinatura: 'Saturação sustentada', serie: [74, 77, 79, 78, 79, 78, 77, 74] },
        { id: 'INC-1036', servidor: 'SERV-56', componente: 'CPU', gravidade: 'Crítico', inicio: '03/11 17:30', duracao: '15 min', pico: 96, limiar: 85, unidade: '%', processo: 'app_pix', assinatura: 'Pico súbito', serie: [55, 60, 72, 90, 96, 92, 70, 58] },
        { id: 'INC-1033', servidor: 'SERV-44', componente: 'Rede', gravidade: 'Alerta', inicio: '02/11 09:50', duracao: '12 min', pico: 340, limiar: 300, unidade: 'ms', processo: 'app_pix', assinatura: 'Oscilação recorrente', serie: [210, 250, 310, 340, 320, 280, 230, 200] },
        { id: 'INC-1030', servidor: 'SERV-02', componente: 'RAM', gravidade: 'Crítico', inicio: '01/11 11:20', duracao: '1h10', pico: 91, limiar: 80, unidade: '%', processo: 'db_batch', assinatura: 'Degradação gradual', serie: [70, 74, 79, 85, 88, 91, 90, 87] },
        { id: 'INC-1027', servidor: 'SERV-56', componente: 'Disco', gravidade: 'Alerta', inicio: '31/10 18:40', duracao: '30 min', pico: 77, limiar: 75, unidade: '%', processo: 'antivirus_scan', assinatura: 'Oscilação recorrente', serie: [70, 72, 76, 77, 76, 73, 71, 70] },
        { id: 'INC-1024', servidor: 'SERV-123', componente: 'CPU', gravidade: 'Alerta', inicio: '30/10 10:05', duracao: '18 min', pico: 88, limiar: 85, unidade: '%', processo: 'backup_job', assinatura: 'Pico súbito', serie: [60, 66, 80, 88, 86, 78, 70, 62] }
    ]
};

var m = mock_m2;
var cor_azul = '#5178F9';
var cor_vermelho = '#FF5C5C';
var cor_amarelo = '#F5C542';
var cor_verde = '#3DDC84';
var expediente = { inicio: 8, fim: 18 };

function totalComponente(c) {
    return c.alerta + c.critico;
}

function maiorPor(lista, funcao) {
    var escolhido = lista[0];
    for (var i = 1; i < lista.length; i++) {
        if (funcao(lista[i]) > funcao(escolhido)) {
            escolhido = lista[i];
        }
    }
    return escolhido;
}

function totalIncidentes() {
    var total = 0;
    for (var i = 0; i < m.componentes.length; i++) {
        total += totalComponente(m.componentes[i]);
    }
    return total;
}

function renderizarKpis() {
    var total = totalIncidentes();
    var variacao = Math.round((total - m.incidentes_anterior) / m.incidentes_anterior * 100);
    var lider = maiorPor(m.componentes, totalComponente);
    var servidor = maiorPor(m.servidores, function (s) { return s.incidentes; });
    var pctLider = Math.round(totalComponente(lider) / total * 100);

    var kpis = [
        { nome: 'Incidentes no período', valor: total, sub: (variacao > 0 ? '▲ ' : '▼ ') + Math.abs(variacao) + '% vs período anterior', cor: variacao > 0 ? 'padrao_cor_ruim' : 'padrao_cor_bom' },
        { nome: 'Componente com maior reincidência', valor: lider.nome, sub: pctLider + '% dos incidentes', cor: 'padrao_cor_atencao' },
        { nome: 'Servidor mais reincidente', valor: servidor.nome, sub: servidor.incidentes + ' ocorrências', cor: 'padrao_cor_ruim' },
        { nome: 'Janela de maior risco', valor: analisarCalor(obterMapaCalor()).janelaQuente, sub: 'maior concentração de alertas', cor: 'padrao_cor_atencao' }
    ];

    var html = '';
    for (var i = 0; i < kpis.length; i++) {
        html += '<div class="padrao_kpi">' +
            '<p class="padrao_kpi_nome">' + kpis[i].nome + '</p>' +
            '<p class="padrao_kpi_valor">' + kpis[i].valor + '</p>' +
            '<p class="padrao_kpi_sub ' + kpis[i].cor + '">' + kpis[i].sub + '</p></div>';
    }
    document.getElementById('padrao-kpis').innerHTML = html;
}

function somarLista(lista) {
    var total = 0;
    for (var i = 0; i < lista.length; i++) {
        total += lista[i];
    }
    return total;
}

function renderizarTendencia() {
    var rotulos = [];
    var hoje = new Date();
    for (var i = 0; i < m.tendencia_atual.length; i++) {
        var data = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (m.tendencia_atual.length - 1 - i));
        rotulos.push(String(data.getDate()).padStart(2, '0') + '/' + String(data.getMonth() + 1).padStart(2, '0'));
    }
    new Chart(document.getElementById('grafico-tendencia'), {
        type: 'line',
        data: {
            labels: rotulos,
            datasets: [
                { label: 'Últimos 30 dias', data: m.tendencia_atual, borderColor: cor_azul, backgroundColor: cor_azul, tension: 0.3, pointRadius: 2 },
                { label: '30 dias anteriores', data: m.tendencia_anterior, borderColor: '#5C6288', borderDash: [6, 6], tension: 0.3, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: { ticks: { maxTicksLimit: 10 } },
                y: { beginAtZero: true, ticks: { precision: 0 } }
            }
        }
    });
    document.getElementById('padrao-tendencia-nota').textContent =
        somarLista(m.tendencia_atual) + ' incidentes no período contra ' + somarLista(m.tendencia_anterior) + ' nos 30 dias anteriores.';
}

function renderizarSecaoGeral() {
    renderizarKpis();
    renderizarTendencia();
}

function configurarChart() {
    Chart.defaults.color = '#A5A9C5';
    Chart.defaults.font.family = 'Allerta, sans-serif';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.08)';
}

var limiteReincidencia = 8;

function formatarMinutos(min) {
    if (min < 60) {
        return min + ' min';
    }
    return Math.floor(min / 60) + 'h' + String(min % 60).padStart(2, '0');
}

function analisarServidores() {
    var totalMin = 0;
    var totalInc = 0;
    var totalRepetidos = 0;
    var maior = m.servidores[0];
    for (var i = 0; i < m.servidores.length; i++) {
        var s = m.servidores[i];
        totalMin += s.tempoInatividade;
        totalInc += s.incidentes;
        totalRepetidos += s.repetidos7d;
        if (s.tempoInatividade > maior.tempoInatividade) {
            maior = s;
        }
    }
    return {
        mttr: totalInc > 0 ? Math.round(totalMin / totalInc) : 0,
        totalMin: totalMin,
        maior: maior,
        pctMaior: totalMin > 0 ? Math.round(maior.tempoInatividade / totalMin * 100) : 0,
        taxaReincidencia: totalInc > 0 ? Math.round(totalRepetidos / totalInc * 100) : 0
    };
}

function renderizarSecaoServidores() {
    var analise = analisarServidores();
    var kpis = [
        { nome: 'MTTR médio', valor: formatarMinutos(analise.mttr), sub: 'tempo médio inativo por incidente (tempo inativo ÷ ocorrências)', cor: 'padrao_cor_atencao' },
        { nome: 'Tempo inativo total', valor: formatarMinutos(analise.totalMin), sub: 'somando todos os servidores no período', cor: 'padrao_cor_ruim' },
        { nome: 'Maior tempo inativo', valor: analise.maior.nome, sub: formatarMinutos(analise.maior.tempoInatividade) + ' · ' + analise.pctMaior + '% do total', cor: 'padrao_cor_ruim' },
        { nome: 'Taxa de reincidência (7 dias)', valor: analise.taxaReincidencia + '%', sub: 'dos incidentes repetem o mesmo servidor e componente em até 7 dias', cor: 'padrao_cor_ruim' }
    ];
    var linhas = '';
    var nomes = [];
    var acessos = [];
    var cores = [];
    for (var i = 0; i < m.servidores.length; i++) {
        var s = m.servidores[i];
        var reincidente = s.incidentes >= limiteReincidencia;
        linhas += '<tr><td>' + s.nome + '</td><td>' + s.incidentes + '</td><td>' + formatarMinutos(s.tempoInatividade) + '</td><td>' + s.componente + '</td><td>' + s.ultima + '</td>' +
            '<td><span class="padrao_tag ' + (reincidente ? 'padrao_tag_ruim' : '') + '">' + (reincidente ? 'reincidente' : 'normal') + '</span></td></tr>';
        nomes.push(s.nome);
        acessos.push(s.acessos);
        cores.push(reincidente ? cor_vermelho : cor_azul);
    }
    document.getElementById('conteudo-servidores').innerHTML =
        '<div class="padrao_kpis">' + htmlKpis(kpis) + '</div>' +
        '<div class="padrao_caixa"><p class="padrao_caixa_titulo">Servidores com problemas repetidos</p>' +
        '<div class="padrao_tabela_rolagem"><table class="padrao_tabela"><thead><tr><th>Servidor</th><th>Ocorrências</th><th>Tempo inativo</th><th>Reincide em</th><th>Última</th><th>Status</th></tr></thead><tbody>' + linhas + '</tbody></table></div></div>';

    /* gráfico de acessos (desativado)
    '<div class="padrao_caixa"><p class="padrao_caixa_titulo">Acessos por servidor</p>' +
    '<div class="padrao_grafico"><canvas id="grafico-acessos"></canvas></div>' +
    '<p class="padrao_nota">Em vermelho, servidores reincidentes.</p></div>';

    new Chart(document.getElementById('grafico-acessos'), {
        type: 'bar',
        data: { labels: nomes, datasets: [{ label: 'Acessos', data: acessos, backgroundColor: cores }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
    */
}

var matrizCalor = null;
var nomesDias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function gerarMapaCalor() {
    var matriz = [];
    for (var r = 0; r < 7; r++) {
        matriz.push([]);
        for (var c = 0; c < 24; c++) {
            var v = 0.1;
            if (c >= 9 && c <= 11) { v += 0.3; }
            if (c >= 17 && c <= 19) { v += 0.35; }
            if (r === 3 || r === 4) { v += 0.2; }
            if (r >= 5) { v -= 0.12; }
            v += ((r * 7 + c * 13) % 5) * 0.03;
            matriz[r].push(Math.round(Math.max(0, v) * 20));
        }
    }
    return matriz;
}

function obterMapaCalor() {
    if (!matrizCalor) {
        matrizCalor = gerarMapaCalor();
    }
    return matrizCalor;
}

function textoJanela(r, c) {
    return nomesDias[r] + ' - ' + c + 'h–' + (c + 3) + 'h';
}

// função que gera métricas a partir da análise do mapa de calor
function analisarCalor(matriz) {
    var total = 0;
    var uteis = 0;
    var dentroExpediente = 0;
    var porHora = [];
    for (var c = 0; c < 24; c++) {
        porHora.push(0);
    }
    for (var r = 0; r < 7; r++) {
        for (var h = 0; h < 24; h++) {
            var qtd = matriz[r][h];
            total += qtd;
            porHora[h] += qtd;
            if (r < 5) {
                uteis += qtd;
                if (h >= expediente.inicio && h < expediente.fim) { dentroExpediente += qtd; }
            }
        }
    }
    var ordenadas = porHora.slice().sort(function (a, b) { return b - a; });
    var topo = 0;
    for (var i = 0; i < 6; i++) {
        topo += ordenadas[i];
    }
    var quente = { r: 0, c: 0, soma: -1 };
    var calma = { r: 0, c: 0, soma: Infinity };
    for (var d = 0; d < 7; d++) {
        for (var j = 0; j <= 21; j++) {
            var soma = matriz[d][j] + matriz[d][j + 1] + matriz[d][j + 2];
            if (soma > quente.soma) { quente = { r: d, c: j, soma: soma }; }
            if (soma < calma.soma) { calma = { r: d, c: j, soma: soma }; }
        }
    }
    var maiorCelula = 0;
    for (var x = 0; x < 7; x++) {
        for (var y = 0; y < 24; y++) {
            if (matriz[x][y] > maiorCelula) { maiorCelula = matriz[x][y]; }
        }
    }
    var atipicos = 0;
    for (var x2 = 0; x2 < 7; x2++) {
        for (var y2 = 0; y2 < 24; y2++) {
            if (matriz[x2][y2] <= maiorCelula * 0.25) { atipicos += matriz[x2][y2]; }
        }
    }
    return {
        pctPico: total > 0 ? Math.round(topo / total * 100) : 0,
        pctForaExpediente: total > 0 ? Math.round((total - dentroExpediente) / total * 100) : 0,
        janelaQuente: textoJanela(quente.r, quente.c),
        atipicos: atipicos,
        pctAtipicos: total > 0 ? Math.round(atipicos / total * 100) : 0,
        janelaCalma: textoJanela(calma.r, calma.c)
    };
}

function htmlKpis(kpis) {
    var html = '';
    for (var i = 0; i < kpis.length; i++) {
        html += '<div class="padrao_kpi">' +
            '<p class="padrao_kpi_nome">' + kpis[i].nome + '</p>' +
            '<p class="padrao_kpi_valor">' + kpis[i].valor + '</p>' +
            '<p class="padrao_kpi_sub ' + kpis[i].cor + '">' + kpis[i].sub + '</p></div>';
    }
    return html;
}

function renderizarSecaoTempo() {
    var matriz = obterMapaCalor();
    var analise = analisarCalor(matriz);
    var dias = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
    var meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    var maior = 1;
    for (var a = 0; a < 7; a++) {
        for (var b = 0; b < 24; b++) {
            if (matriz[a][b] > maior) { maior = matriz[a][b]; }
        }
    }
    var mapa = '';
    for (var r = 0; r < dias.length; r++) {
        mapa += '<span class="padrao_calor_rotulo">' + dias[r] + '</span>';
        for (var c = 0; c < 24; c++) {
            mapa += '<span class="padrao_calor_celula" style="opacity:' + Math.max(0.12, matriz[r][c] / maior).toFixed(2) +
                '" title="' + dias[r] + ' ' + c + 'h: ' + matriz[r][c] + ' alertas"></span>';
        }
    }
    var horas = '<span></span>';
    for (var h = 0; h < 24; h++) {
        horas += '<span>' + (h % 3 === 0 ? h + 'h' : '') + '</span>';
    }
    var pctDuracao = Math.round((m.duracaoExpediente.fora / m.duracaoExpediente.dentro - 1) * 100);
    var kpis = [
        { nome: 'Concentração nas horas de pico', valor: analise.pctPico + '%', sub: 'dos alertas em apenas 6 das 24 horas do dia', cor: 'padrao_cor_atencao' },
        { nome: 'Alertas em horário atípico', valor: analise.pctAtipicos + '%', sub: analise.atipicos + ' alertas em horários normalmente calmos (até 25% do pico do mapa)', cor: 'padrao_cor_ruim' },
        { nome: 'Duração fora do expediente', valor: '+' + pctDuracao + '%', sub: 'incidentes mais longos: ' + m.duracaoExpediente.fora + ' min contra ' + m.duracaoExpediente.dentro + ' min dentro do expediente (seg a sex, ' + expediente.inicio + 'h às ' + expediente.fim + 'h)', cor: 'padrao_cor_atencao' },
        { nome: 'Melhor janela para manutenção', valor: analise.janelaCalma, sub: 'período com menor movimento de alertas', cor: 'padrao_cor_bom' }
    ];
    var cores = [];
    for (var j = 0; j < m.meses.length; j++) {
        cores.push(m.meses[j] >= 60 ? cor_vermelho : cor_azul);
    }
    document.getElementById('conteudo-tempo').innerHTML =
        '<div class="padrao_kpis">' + htmlKpis(kpis) + '</div>' +
        '<div class="padrao_grade">' +
        '<div class="padrao_caixa"><p class="padrao_caixa_titulo">Alertas por hora e dia da semana</p>' +
        '<div class="padrao_calor">' + mapa + '</div>' +
        '<div class="padrao_calor_horas">' + horas + '</div>' +
        '<div class="padrao_calor_legenda"><span>menos</span><div class="padrao_calor_escala"></div><span>mais</span></div></div>' +
        '<div class="padrao_caixa"><p class="padrao_caixa_titulo">Alertas por mês (12 meses)</p>' +
        '<div class="padrao_grafico"><canvas id="grafico-meses"></canvas></div>' +
        '<p class="padrao_nota">Histórico anual simulado, em vermelho os meses com possível sobrecarga.</p></div></div>';

    new Chart(document.getElementById('grafico-meses'), {
        type: 'bar',
        data: { labels: meses, datasets: [{ label: 'Alertas', data: m.meses, backgroundColor: cores }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

}

var graficoIncidente = null;

function renderizarAbaInvestigacao() {
    var servidores = '<option value="">Todos</option>';
    for (var i = 0; i < m.servidores.length; i++) {
        servidores += '<option>' + m.servidores[i].nome + '</option>';
    }
    var componentes = '<option value="">Todos</option>';
    for (var j = 0; j < m.componentes.length; j++) {
        componentes += '<option>' + m.componentes[j].nome + '</option>';
    }
    document.getElementById('aba-3').innerHTML =
        '<div class="padrao_filtros">' +
        '<label>Servidor<select id="filtro-servidor">' + servidores + '</select></label>' +
        '<label>Componente<select id="filtro-componente">' + componentes + '</select></label>' +
        '<span class="padrao_nota" id="filtro-total"></span></div>' +
        '<div class="padrao_grade">' +
        '<div class="padrao_caixa"><p class="padrao_caixa_titulo">Incidentes</p><div class="padrao_tabela_rolagem">' +
        '<table class="padrao_tabela padrao_tabela_clicavel"><thead><tr><th>ID</th><th>Servidor</th><th>Componente</th><th>Início</th><th>Gravidade</th></tr></thead>' +
        '<tbody id="corpo-incidentes"></tbody></table></div></div>' +
        '<div class="padrao_caixa" id="detalhe-incidente"></div></div>';

    document.getElementById('filtro-servidor').addEventListener('change', filtrarIncidentes);
    document.getElementById('filtro-componente').addEventListener('change', filtrarIncidentes);
    filtrarIncidentes();
}

function filtrarIncidentes() {
    var servidor = document.getElementById('filtro-servidor').value;
    var componente = document.getElementById('filtro-componente').value;
    var linhas = '';
    var visiveis = [];
    for (var i = 0; i < m.incidentes.length; i++) {
        var inc = m.incidentes[i];
        if ((servidor === '' || inc.servidor === servidor) && (componente === '' || inc.componente === componente)) {
            visiveis.push(i);
            linhas += '<tr data-indice="' + i + '"><td>' + inc.id + '</td><td>' + inc.servidor + '</td><td>' + inc.componente + '</td><td>' + inc.inicio + '</td>' +
                '<td><span class="padrao_tag ' + (inc.gravidade === 'Crítico' ? 'padrao_tag_ruim' : 'padrao_tag_alerta') + '">' + inc.gravidade + '</span></td></tr>';
        }
    }
    if (visiveis.length === 0) {
        linhas = '<tr><td colspan="5">Nenhum incidente encontrado</td></tr>';
    }
    document.getElementById('corpo-incidentes').innerHTML = linhas;
    document.getElementById('filtro-total').textContent = visiveis.length + ' de ' + m.incidentes.length + ' incidentes';

    var trs = document.querySelectorAll('#corpo-incidentes tr[data-indice]');
    for (var j = 0; j < trs.length; j++) {
        trs[j].addEventListener('click', selecionarIncidente.bind(null, Number(trs[j].getAttribute('data-indice'))));
    }

    if (visiveis.length > 0) {
        selecionarIncidente(visiveis[0]);
        return;
    }
    if (graficoIncidente) {
        graficoIncidente.destroy();
        graficoIncidente = null;
    }
    document.getElementById('detalhe-incidente').innerHTML = '<p class="padrao_nota">Nenhum incidente para detalhar.</p>';
}

function selecionarIncidente(indice) {
    var inc = m.incidentes[indice];
    var trs = document.querySelectorAll('#corpo-incidentes tr[data-indice]');
    for (var i = 0; i < trs.length; i++) {
        trs[i].classList.toggle('selecionado', Number(trs[i].getAttribute('data-indice')) === indice);
    }
    if (graficoIncidente) {
        graficoIncidente.destroy();
        graficoIncidente = null;
    }
    document.getElementById('detalhe-incidente').innerHTML =
        '<p class="padrao_caixa_titulo">' + inc.id + ' · ' + inc.servidor + '</p>' +
        '<div class="padrao_detalhe">' +
        '<div><span>Duração</span><strong>' + inc.duracao + '</strong></div>' +
        '<div><span>Pico</span><strong>' + inc.pico + inc.unidade + '</strong></div>' +
        '<div><span>Limiar</span><strong>' + inc.limiar + inc.unidade + '</strong></div>' +
        '<div><span>Processo líder</span><strong>' + inc.processo + '</strong></div>' +
        '<div><span>Assinatura</span><strong>' + inc.assinatura + '</strong></div></div>' +
        '<div class="padrao_grafico padrao_grafico_curto"><canvas id="grafico-incidente"></canvas></div>';

    var rotulos = [];
    var limiares = [];
    for (var j = 0; j < inc.serie.length; j++) {
        rotulos.push((j * 5) + ' min');
        limiares.push(inc.limiar);
    }
    graficoIncidente = new Chart(document.getElementById('grafico-incidente'), {
        type: 'line',
        data: {
            labels: rotulos,
            datasets: [
                { label: inc.componente, data: inc.serie, borderColor: cor_vermelho, backgroundColor: cor_vermelho, tension: 0.3 },
                { label: 'Limiar', data: limiares, borderColor: cor_amarelo, borderDash: [6, 6], pointRadius: 0 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

document.getElementById('padrao-periodo').textContent = m.periodo;
configurarChart();
renderizarSecaoGeral();
renderizarSecaoServidores();
renderizarSecaoTempo();