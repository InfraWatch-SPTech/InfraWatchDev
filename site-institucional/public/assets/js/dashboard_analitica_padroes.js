
var cores = { cpu: '#5178F9', ram: '#6FE0FF', disco: '#F5C542', rede: '#B48CFF' };
var NOMES_CRITERIOS = { tempo: 'tempo em atenção', alertas: 'quantidade de alertas', consumo: 'consumo médio' };
var NOMES_CURTOS = { almoco: 'Almoço', quinto_dia_util: '5º dia útil', feriado: 'Feriados' };

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
function dataCurta(dia) { return dia.slice(8, 10) + '/' + dia.slice(5, 7); }
function faixaHora(hora) { return String(hora).padStart(2, '0') + 'h–' + String(hora + 1).padStart(2, '0') + 'h'; }

function duracao(minutos) {
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
    var servidor = dados.servidor;
    var dias = dados.periodo.dias_com_coleta;

    preencherSelect('servidor', dados.servidores.map(function (s) { return { valor: s.id, texto: s.nome }; }), servidor.id);

    // Seletores: só componentes monitorados · padrão = componente com mais tempo em atenção
    var opcoes = servidor.componentes.map(function (c) { return { valor: c, texto: nome(c) }; });
    preencherSelect('componente_horario', opcoes, dados.padrao.componente);
    preencherSelect('componente_calor', opcoes, dados.padrao.componente);
    preencherSelect('componente_ranking', [{ valor: 'todos', texto: 'Comparar todos' }].concat(opcoes), 'todos');
    var opcoesProcessos = [{ valor: 'cpu', texto: nome('cpu') }, { valor: 'ram', texto: nome('ram') }];
    preencherSelect('componente_lider', opcoesProcessos, dados.padrao.processo);
    preencherSelect('componente_processos', opcoesProcessos, dados.padrao.processo);
    preencherSelect('dia', [{ valor: 'periodo', texto: 'Período todo' }]
        .concat(dias.map(function (d) { return { valor: d, texto: 'Dia ' + dataCurta(d) }; })), 'periodo');

    texto('modo_dados', dados.fonte === 'local' ? 'Dados locais' : 'Dados do S3');
    texto('fonte_texto', (dados.fonte === 'local' ? 'Gold local' : 'Gold no S3') + ' · gerada em ' +
        (dados.gerado_em ? new Date(dados.gerado_em).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'data não informada') +
        ' · métricas calculadas pela API.');
    texto('periodo_texto', dados.coleta.amostras
        ? 'Janela: ' + dataCurta(dados.periodo.inicio) + ' a ' + dataCurta(dados.periodo.fim) + '/' + dados.periodo.fim.slice(0, 4) + ' · horário de São Paulo'
        : 'Sem histórico para este servidor');
    texto('estado_dados', dados.coleta.amostras
        ? servidor.nome + ' · ' + duracao(dados.coleta.minutos) + ' monitoradas · ' + dias.length + ' dias com coleta'
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
    atualizarPontuacao();
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

    atualizarLideres();
}

function atualizarLideres() {
    var processos = dados.processos[elemento('componente_lider').value];
    texto('lider_dentro', processos.lider_dentro ? processos.lider_dentro.nome + ' — ' + percentual(processos.lider_dentro.valor) : 'Sem dados');
    texto('lider_fora', processos.lider_fora ? processos.lider_fora.nome + ' — ' + percentual(processos.lider_fora.valor) : 'Sem dados');
}

function atualizarAumento() {
    var periodo = elemento('periodo_importante').value;
    var resultado = dados.aumento[periodo];
    var maior = resultado.maior;
    texto('kpi_aumento', !resultado.suficiente ? 'Sem comparação' : !maior ? 'Sem aumento' : nome(maior.componente));
    texto('kpi_aumento_valor', maior ? '+' + numero(maior.diferenca) + ' p.p.' : '—');
    texto('kpi_aumento_sub', maior
        ? percentual(maior.dentro) + ' no período × ' + percentual(maior.fora) + ' fora'
        : resultado.suficiente ? 'Nenhum componente aumentou a média'
        : 'Mínimo de ' + resultado.minutos_minimos + ' min dentro e fora');
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
function atualizarRanking() {
    var dia = elemento('dia').value;
    var escolhido = elemento('componente_ranking').value;
    var porComponente = dados.ranking[dia] || {};
    texto('ranking_resumo', (dia === 'periodo' ? 'Período completo' : dataCurta(dia)) + ' · vermelho = crítico');

    var lista = [];
    for (var i = 0; i < dados.servidor.componentes.length; i++) {
        var c = dados.servidor.componentes[i];
        if (escolhido !== 'todos' && escolhido !== c) continue;
        var r = porComponente[c];
        lista.push({ c: c, r: r && r.observado ? r : null });
    }
    lista.sort(function (a, b) { return (b.r ? b.r.atencao : 0) - (a.r ? a.r.atencao : 0); });

    var opcoes = opcoesBase('Minutos acumulados em atenção');
    opcoes.scales.x.stacked = true;
    opcoes.scales.y.stacked = true;
    criarGrafico('grafico_ranking', {
        type: 'bar',
        data: {
            labels: lista.map(function (item) { return nome(item.c); }),
            datasets: [
                {
                    label: 'Atenção sem crítico',
                    data: lista.map(function (item) { return item.r ? item.r.atencao - item.r.critico : null; }),
                    backgroundColor: lista.map(function (item) { return cores[item.c]; }),
                    maxBarThickness: 28
                },
                {
                    label: 'Crítico',
                    data: lista.map(function (item) { return item.r ? item.r.critico : null; }),
                    backgroundColor: '#FF5C5C',
                    maxBarThickness: 28
                }
            ]
        },
        options: opcoes
    });

    preencherTabela('ranking_tabela', lista.map(function (item) {
        var r = item.r;
        if (!r) return [nome(item.c), 'Sem coleta', '—', '—', '—'];
        return [nome(item.c), duracao(r.atencao), duracao(r.critico), r.entradas_criticas, r.hora !== null ? faixaHora(r.hora) : '—'];
    }));
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

// ---------------- Pontuação: atual (esquerda) × melhor (direita) ----------------

// Escreve a nota no fim de cada barra, ou o aviso quando não há barra
var pluginRotulos = {
    id: 'rotulosPontuacao',
    afterDatasetsDraw: function (grafico) {
        var ctx = grafico.ctx;
        var meio = grafico.scales.x.getPixelForValue(0);
        ctx.save();
        ctx.font = 'bold 14px sans-serif';
        ctx.textBaseline = 'middle';
        grafico.data.datasets.forEach(function (dataset, lado) {
            grafico.getDatasetMeta(lado).data.forEach(function (barra, i) {
                var valor = dataset.data[i];
                var aviso = dataset.avisos[i];
                ctx.textAlign = lado === 0 ? 'right' : 'left';
                if (valor !== null) {
                    ctx.fillStyle = '#E7E5F0';
                    ctx.fillText(nota(Math.abs(valor)), barra.x + (lado === 0 ? -6 : 6), barra.y);
                } else if (aviso) {
                    ctx.fillStyle = '#8B869B';
                    ctx.fillText(aviso, meio + (lado === 0 ? -6 : 6), barra.y);
                }
            });
        });
        ctx.restore();
    }
};

// Nota de um componente (ou "geral") e o aviso quando ela não existe
function notaDe(servidor, c) {
    if (!servidor) return { valor: null, aviso: '' };
    if (c === 'geral') return { valor: servidor.total, aviso: '' };
    if (servidor.componentes[c] === undefined) return { valor: null, aviso: 'não monitorado' };
    if (servidor.componentes[c] === null) return { valor: null, aviso: 'sem histórico' };
    return { valor: servidor.componentes[c].nota, aviso: '' };
}

function atualizarPontuacao() {
    var p = dados.pontuacao;
    var atual = p.atual;
    var comparado = p.comparado;
    var rotuloComparado = 'Melhor';

    texto('pontuacao_nome_atual', 'Atual · ' + atual.nome);
    texto('pontuacao_nome_comparado', comparado ? rotuloComparado + ' · ' + comparado.nome : 'Melhor servidor');
    texto('pontuacao_atual', nota(atual.total));
    texto('pontuacao_comparado', comparado ? nota(comparado.total) : '—');
    var diferenca = comparado && atual.total !== null ? atual.total - comparado.total : null;
    texto('pontuacao_diferenca', diferenca === null ? '—' : (diferenca > 0 ? '+' : '') + nota(diferenca) + ' pts');

    var resumo;
    if (atual.total === null) resumo = 'Selecionado sem histórico';
    else if (!atual.historico_suficiente) resumo = 'Histórico curto · mínimo ' + p.minutos_minimos + ' min para o ranking';
    else if (p.atual_e_melhor) resumo = 'O selecionado é o melhor · diferença zero';
    else if (!comparado) resumo = 'Sem servidor elegível para comparar';
    else resumo = 'Nota de saúde · maior é melhor';
    texto('pontuacao_resumo', resumo);
    texto('pontuacao_perda', p.maior_perda
        ? 'Maior perda: ' + nome(p.maior_perda.componente) + ' · ' + NOMES_CRITERIOS[p.maior_perda.criterio]
        : '');

    // Linhas = componentes de qualquer um dos dois servidores + Geral
    var linhas = [];
    var todos = ['cpu', 'ram', 'disco', 'rede'];
    for (var i = 0; i < todos.length; i++) {
        var c = todos[i];
        if (atual.componentes[c] !== undefined || (comparado && comparado.componentes[c] !== undefined)) linhas.push(c);
    }
    linhas.push('geral');

    var notasAtual = linhas.map(function (c) { return notaDe(atual, c); });
    var notasComparado = linhas.map(function (c) { return notaDe(comparado, c); });

    var opcoes = opcoesBase('Selecionado ← Nota de saúde → Melhor');
    opcoes.scales.x.stacked = true;
    opcoes.scales.y.stacked = true;
    // Eixo até 125 para caber o número no fim da barra; marcas só até 100
    opcoes.scales.x.min = -125;
    opcoes.scales.x.max = 125;
    opcoes.scales.x.ticks.stepSize = 25;
    opcoes.scales.x.ticks.callback = function (v) { return Math.abs(v) > 100 ? '' : Math.abs(v); };
    opcoes.plugins.tooltip = { callbacks: { label: function (ctx) { return ctx.dataset.label + ': ' + nota(Math.abs(ctx.raw)); } } };

    criarGrafico('grafico_pontuacao', {
        type: 'bar',
        data: {
            labels: linhas.map(function (c) { return c === 'geral' ? 'Geral' : nome(c); }),
            datasets: [
                {
                    label: 'Selecionado',
                    // valores negativos = barra para a esquerda
                    data: notasAtual.map(function (n) { return n.valor === null ? null : -n.valor; }),
                    avisos: notasAtual.map(function (n) { return n.aviso; }),
                    backgroundColor: '#5178F9', maxBarThickness: 22
                },
                {
                    label: comparado ? 'Melhor' : 'Sem comparação',
                    data: notasComparado.map(function (n) { return n.valor; }),
                    avisos: notasComparado.map(function (n) { return n.aviso; }),
                    backgroundColor: '#6FE0FF', maxBarThickness: 22
                }
            ]
        },
        options: opcoes,
        plugins: [pluginRotulos]
    });
}

// ---------------- Processos: período importante × demais horários ----------------
function atualizarProcessos() {
    var componente = elemento('componente_processos').value;
    var resultado = dados.processos[componente];
    var lista = resultado.lista;

    texto('titulo_processos', 'Processos · dias úteis × fim de semana');
    texto('coluna_dentro', 'Dias úteis');
    texto('processos_unidade', nome(componente) + ' médio (%) · seg–sex × sáb–dom');

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
    texto('sugestao_texto', sugestao);
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

// ---------------- Menu lateral e sair ----------------
function alternarMenu(abrir) {
    elemento('menu_lateral').classList.toggle('menu_aberto', abrir);
    elemento('menu_fundo').classList.toggle('menu_aberto', abrir);
    elemento('menu_lateral').inert = !abrir;
    elemento('menu_lateral').setAttribute('aria-hidden', String(!abrir));
    elemento('botao_menu').setAttribute('aria-expanded', String(abrir));
    document.body.classList.toggle('menu_travado', abrir);
}
elemento('botao_menu').addEventListener('click', function () { alternarMenu(true); });
elemento('menu_fechar').addEventListener('click', function () { alternarMenu(false); });
elemento('menu_fundo').addEventListener('click', function () { alternarMenu(false); });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') alternarMenu(false); });

elemento('sair_dashboard').addEventListener('click', async function (evento) {
    evento.preventDefault();
    try {
        var resposta = await fetch('/sessao/sair', { method: 'POST', credentials: 'same-origin' });
        if (!resposta.ok) throw new Error('Não foi possível encerrar a sessão.');
        localStorage.removeItem('usuarioLogado');
        window.location.href = './login.html';
    } catch (erro) { mostrarErro(erro.message); }
});

carregarDados();