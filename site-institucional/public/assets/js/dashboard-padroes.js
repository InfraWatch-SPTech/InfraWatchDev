const corAzul = '#5178F9';
const corAmarelo = '#F5C542';
const corCinza = '#5C6288';

const nomesDias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const descricaoEventos = {
    'Black Friday': 'Sexta de promoções',
    'Pagamento de salários': '5º dia útil',
    'Vencimento de boletos': 'Dia 8',
    '13º salário (2ª parcela)': '20 de dezembro'
};

let graficoPrevisao = null;


// ============================================================
// 1. FORMATAÇÃO E ELEMENTOS DA TELA
// ============================================================

function formatarData(dataISO, mostrarAno = false) {
    if (!dataISO) return '—';

    const [ano, mes, dia] = dataISO.split('-');

    return mostrarAno ? `${dia}/${mes}/${ano}` : `${dia}/${mes}`;
}

function formatarNumero(valor) {
    if (!Number.isFinite(valor)) return '—';

    return valor.toLocaleString('pt-BR', {
        maximumFractionDigits: 1
    });
}

function formatarPercentual(valor) {
    return Number.isFinite(valor) ? `${formatarNumero(valor)}%` : '—';
}

function formatarMinutos(valor) {
    if (!Number.isFinite(valor)) return '—';

    const total = Math.round(valor);

    if (total < 60) return `${total} min`;

    const horas = Math.floor(total / 60);
    const minutos = String(total % 60).padStart(2, '0');

    return `${horas}h${minutos}`;
}

function formatarJanela(janela) {
    if (!janela) return '—';

    const dia = nomesDias[janela.dia_semana];
    return `${dia}, ${janela.inicio_hora}h às ${janela.fim_hora}h`;
}

function formatarPrazo(dias) {
    if (dias === 0) return 'hoje';
    if (dias === 1) return 'amanhã';
    return `em ${dias} dias`;
}

function criarElemento(tag, classe, texto) {
    const elemento = document.createElement(tag);

    if (classe) elemento.className = classe;
    if (texto !== undefined && texto !== null) elemento.textContent = texto;

    return elemento;
}

function criarKpi(nome, valor, descricao, classeCor) {
    const card = criarElemento('div', 'padrao_kpi');

    card.append(
        criarElemento('p', 'padrao_kpi_nome', nome),
        criarElemento('p', 'padrao_kpi_valor', valor ?? '—'),
        criarElemento('p', `padrao_kpi_sub ${classeCor}`, descricao)
    );

    return card;
}


// ============================================================
// 2. CONFIGURAÇÃO DOS GRÁFICOS
// ============================================================

function configurarChart() {
    Chart.defaults.color = '#A5A9C5';
    Chart.defaults.font.family = 'Allerta, sans-serif';
    Chart.defaults.borderColor = 'rgba(255,255,255,0.08)';
}

function opcoesGrafico(maxRotulos) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false
        },
        plugins: {
            legend: {
                labels: {
                    usePointStyle: true,
                    pointStyle: 'line',
                    boxWidth: 28
                }
            }
        },
        scales: {
            x: {
                ticks: { maxTicksLimit: maxRotulos }
            },
            y: {
                beginAtZero: true,
                ticks: { precision: 0 }
            }
        }
    };
}

function criarSerie(nome, valores, cor, opcoes = {}) {
    return {
        label: nome,
        data: valores,
        borderColor: cor,
        cubicInterpolationMode: 'monotone',
        pointRadius: 0,
        ...opcoes
    };
}


// ============================================================
// 3. CONSULTA À ROTA DO BACKEND
// ============================================================

async function buscarDadosPadroes() {
    const resposta = await fetch('/api/dashboard-padroes', {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json'
        }
    });

    if (!resposta.ok) {
        const falha = await resposta.json().catch(() => null);

        throw new Error(
            falha?.erro || `Falha ao consultar a dashboard (HTTP ${resposta.status}).`
        );
    }

    return resposta.json();
}


// ============================================================
// 4. PREVISIBILIDADE — EVENTOS RECEBIDOS DO GOLD
// ============================================================

function renderizarPrevisibilidade(eventos) {
    const painel = document.getElementById('conteudo-previsibilidade');

    if (eventos.length === 0) {
        painel.textContent = 'Nenhum evento previsto para esta empresa.';
        return;
    }

    painel.innerHTML = `
        <div class="padrao_previsao">
            <div class="padrao_previsao_principal">
                <div class="padrao_kpis" id="previsao-kpis"></div>

                <div class="padrao_caixa">
                    <p class="padrao_caixa_titulo" id="previsao-titulo"></p>

                    <div class="padrao_grafico" id="previsao-grafico-caixa">
                        <canvas id="grafico-previsao"></canvas>
                    </div>

                    <p class="padrao_nota" id="previsao-nota"></p>
                </div>
            </div>

            <div class="padrao_caixa">
                <p class="padrao_caixa_titulo">Próximos dias críticos</p>
                <div class="padrao_eventos" id="previsao-eventos"></div>
            </div>
        </div>
    `;

    const lista = document.getElementById('previsao-eventos');

    eventos.forEach((evento, indice) => {
        const botao = criarElemento('button', 'padrao_evento');
        botao.type = 'button';

        const info = criarElemento('span', 'padrao_evento_info');
        const descricao = descricaoEventos[evento.nome];
        const data = formatarData(evento.data);

        info.append(
            criarElemento('strong', '', evento.nome),
            criarElemento('span', '', descricao ? `${descricao} · ${data}` : data)
        );

        const detalhes = criarElemento('span', 'padrao_evento_dados');

        let classeRisco = 'padrao_tag';
        if (evento.risco === 'alto') classeRisco += ' padrao_tag_ruim';
        if (evento.risco === 'médio') classeRisco += ' padrao_tag_alerta';

        const risco = evento.risco ? `risco ${evento.risco}` : 'sem estimativa';
        const prazo = formatarPrazo(evento.dias_restantes);

        const resumo = evento.disponivel
            ? `${prazo} · ${evento.incidentes_previstos} incidentes`
            : prazo;

        detalhes.append(
            criarElemento('span', classeRisco, risco),
            criarElemento('span', '', resumo)
        );

        botao.append(info, detalhes);

        botao.addEventListener('click', () => {
            selecionarEvento(eventos, indice);
        });

        lista.appendChild(botao);
    });

    selecionarEvento(eventos, 0);
}

function selecionarEvento(eventos, indice) {
    const evento = eventos[indice];

    document.querySelectorAll('#previsao-eventos .padrao_evento')
        .forEach((botao, posicao) => {
            const selecionado = posicao === indice;
            botao.classList.toggle('selecionado', selecionado);
            botao.setAttribute('aria-pressed', String(selecionado));
        });

    // O mesmo canvas é usado para todos os eventos.
    if (graficoPrevisao) {
        graficoPrevisao.destroy();
        graficoPrevisao = null;
    }

    const kpis = document.getElementById('previsao-kpis');
    const titulo = document.getElementById('previsao-titulo');
    const nota = document.getElementById('previsao-nota');
    const caixaGrafico = document.getElementById('previsao-grafico-caixa');

    kpis.replaceChildren();
    caixaGrafico.hidden = !evento.disponivel;

    titulo.textContent =
        `${evento.nome} · ${formatarData(evento.data, true)} (incidentes por hora)`;

    if (!evento.disponivel) {
        nota.textContent = 'Histórico insuficiente para calcular a previsão deste evento.';
        return;
    }

    const comparacao = Number.isFinite(evento.fator_dia_normal)
        ? ` · ${formatarNumero(evento.fator_dia_normal)}x um dia normal`
        : '';

    const descricaoQuantidade =
        `faixa de ${evento.faixa[0]} a ${evento.faixa[1]}` +
        comparacao +
        ` · último evento: ${evento.incidentes_referencia}`;

    const descricaoDuracao = Number.isFinite(evento.duracao_media_min)
        ? `duração média de ${formatarNumero(evento.duracao_media_min)} min por incidente no último evento`
        : 'sem incidentes resolvidos para calcular a duração média';

    kpis.append(
        criarKpi(
            'Incidentes previstos',
            evento.incidentes_previstos,
            descricaoQuantidade,
            'padrao_cor_ruim'
        ),
        criarKpi(
            'Tempo em incidente previsto',
            formatarMinutos(evento.tempo_incidente_previsto_min),
            descricaoDuracao,
            'padrao_cor_atencao'
        ),
        criarKpi(
            'Horário mais crítico',
            evento.hora_pico,
            'maior concentração de incidentes no último evento',
            'padrao_cor_atencao'
        )
    );

    const referencia = formatarData(evento.referencia, true);
    const quantidade = evento.ocorrencias_passadas;
    const historico = quantidade === 1
        ? '1 ocorrência anterior'
        : `${quantidade} ocorrências anteriores`;

    nota.textContent =
        `Referência: ${referencia} · confiança ${evento.confianca} (${historico})`;

    const horas = Array.from({ length: 24 }, (_, hora) => `${hora}h`);

    graficoPrevisao = new Chart(document.getElementById('grafico-previsao'), {
        type: 'line',
        data: {
            labels: horas,
            datasets: [
                criarSerie('Dia normal', evento.perfil_normal, corCinza, {
                    borderDash: [6, 6]
                }),
                criarSerie(
                    `Último evento (${referencia})`,
                    evento.perfil_referencia,
                    corAmarelo
                ),
                criarSerie('Previsão', evento.perfil_previsto, corAzul, {
                    fill: true,
                    backgroundColor: 'rgba(81, 120, 249, 0.15)',
                    pointRadius: 2
                })
            ]
        },
        options: opcoesGrafico(12)
    });
}


// ============================================================
// 5. TEMPO E SAZONALIDADE — ESTRUTURA DOS CARDS
// ============================================================

function montarSecaoTempo() {
    document.getElementById('conteudo-tempo').innerHTML = `
        <div class="padrao_kpis" id="tempo-kpis"></div>

        <div class="padrao_grade">
            <div class="padrao_caixa">
                <p class="padrao_caixa_titulo" id="mapa-titulo">
                    Alertas por hora e dia da semana
                </p>
                <div id="mapa-conteudo"></div>
            </div>

            <div class="padrao_caixa">
                <p class="padrao_caixa_titulo">Incidentes nos últimos 30 dias</p>

                <div class="padrao_grafico">
                    <canvas id="grafico-tendencia"></canvas>
                </div>

                <p class="padrao_nota" id="padrao-tendencia-nota"></p>
            </div>
        </div>
    `;
}


// ============================================================
// 6. MAPA DE CALOR E KPIS — DADOS RECEBIDOS DO GOLD
// ============================================================

function renderizarMapa(mapa) {
    const kpis = mapa.kpis;

    document.getElementById('tempo-kpis').replaceChildren(
        criarKpi(
            'Concentração nas horas de pico',
            formatarPercentual(kpis.pct_pico),
            'dos alertas nas 6 horas com maior volume',
            'padrao_cor_atencao'
        ),
        criarKpi(
            'Alertas em horário atípico',
            formatarPercentual(kpis.pct_atipicos),
            `${kpis.alertas_atipicos} alertas em horários normalmente calmos`,
            'padrao_cor_ruim'
        ),
        criarKpi(
            'Janela de maior risco',
            formatarJanela(kpis.janela_risco),
            'faixa de 3 horas com maior concentração de alertas',
            'padrao_cor_ruim'
        ),
        criarKpi(
            'Melhor janela para manutenção',
            formatarJanela(kpis.janela_manutencao),
            'faixa de 3 horas com menor volume de alertas',
            'padrao_cor_bom'
        )
    );

    document.getElementById('mapa-titulo').textContent =
        `Alertas por hora e dia da semana (média semanal nos últimos ${mapa.janela_dias} dias)`;

    const grade = criarElemento('div', 'padrao_calor');
    const maiorContagem = Math.max(1, ...mapa.contagens.flat());

    mapa.contagens.forEach((linha, dia) => {
        grade.appendChild(
            criarElemento('span', 'padrao_calor_rotulo', nomesDias[dia].toLowerCase())
        );

        linha.forEach((total, hora) => {
            const media = mapa.media_semanal[dia][hora];
            const celula = criarElemento('span', 'padrao_calor_celula');

            celula.style.opacity = Math.max(0.12, total / maiorContagem).toFixed(2);

            celula.title =
                `${nomesDias[dia]}, ${hora}h: ${total} alertas no período` +
                ` · média de ${media.toLocaleString('pt-BR')} por semana`;

            grade.appendChild(celula);
        });
    });

    const horas = criarElemento('div', 'padrao_calor_horas');

    // A primeira coluna fica alinhada aos nomes dos dias.
    horas.appendChild(criarElemento('span'));

    for (let hora = 0; hora < 24; hora++) {
        horas.appendChild(
            criarElemento('span', '', hora % 3 === 0 ? `${hora}h` : '')
        );
    }

    const legenda = criarElemento('div', 'padrao_calor_legenda');

    legenda.append(
        criarElemento('span', '', 'menos'),
        criarElemento('div', 'padrao_calor_escala'),
        criarElemento('span', '', 'mais')
    );

    document.getElementById('mapa-conteudo').replaceChildren(
        grade,
        horas,
        legenda
    );
}


// ============================================================
// 7. INCIDENTES DOS ÚLTIMOS 30 DIAS — MOCK TEMPORÁRIO DO JIRA
// ============================================================

function renderizarTendenciaMock() {
    const atual = [
        1, 0, 2, 1, 3, 0, 1, 2, 1, 4,
        2, 1, 0, 2, 3, 1, 0, 2, 1, 3,
        2, 0, 1, 2, 4, 1, 0, 2, 1, 3
    ];

    const anterior = [
        0, 1, 1, 2, 0, 1, 2, 0, 3, 1,
        0, 2, 1, 1, 0, 3, 2, 1, 0, 2,
        1, 1, 3, 0, 2, 1, 0, 1, 2, 0
    ];

    const hoje = new Date();
    const rotulos = [];

    for (let diasAtras = 29; diasAtras >= 0; diasAtras--) {
        const dia = new Date(
            hoje.getFullYear(),
            hoje.getMonth(),
            hoje.getDate() - diasAtras
        );

        rotulos.push(dia.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
        }));
    }

    new Chart(document.getElementById('grafico-tendencia'), {
        type: 'line',
        data: {
            labels: rotulos,
            datasets: [
                criarSerie('Últimos 30 dias', atual, corAzul, {
                    backgroundColor: corAzul,
                    pointRadius: 2
                }),
                criarSerie('30 dias anteriores', anterior, corCinza, {
                    borderDash: [6, 6]
                })
            ]
        },
        options: opcoesGrafico(10)
    });

    const totalAtual = atual.reduce((soma, valor) => soma + valor, 0);
    const totalAnterior = anterior.reduce((soma, valor) => soma + valor, 0);

    document.getElementById('padrao-tendencia-nota').textContent =
        `Dados de demonstração · ${totalAtual} incidentes no período` +
        ` contra ${totalAnterior} nos 30 dias anteriores.`;
}


// ============================================================
// 8. INICIALIZAÇÃO DA DASHBOARD
// ============================================================

async function carregarDashboard() {
    configurarChart();
    montarSecaoTempo();
    renderizarTendenciaMock();

    const periodo = document.getElementById('padrao-periodo');
    periodo.textContent = 'Carregando dados da ETL…';

    try {
        const dados = await buscarDadosPadroes();

        renderizarPrevisibilidade(dados.previsibilidade.eventos);
        renderizarMapa(dados.mapa_calor);

        const origem = dados.fonte?.mapa_calor === 'sintetico'
            ? 'histórico sintético'
            : 'histórico da ETL';

        periodo.textContent =
            `Referência: ${formatarData(dados.data_referencia, true)} · ${origem}`;
    } catch (erro) {
        periodo.textContent = 'Dados da ETL indisponíveis';

        document.getElementById('conteudo-previsibilidade').textContent =
            erro.message;

        document.getElementById('mapa-conteudo').textContent =
            'Não foi possível carregar o mapa de calor.';
    }
}

carregarDashboard();