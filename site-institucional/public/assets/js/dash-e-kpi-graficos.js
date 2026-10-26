// ----------------------------------------------------------------------
// GRÁFICO DE BARRAS - NÚMERO DE INCIDENTES POR SERVIDOR ----------------
// ----------------------------------------------------------------------

// Definição do json de consumo
const incidentesServidor = [
    { 'nome': 'Principal', 'qtd_incidentes': 12 },
    { 'nome': 'Backup', 'qtd_incidentes': 2 },
    { 'nome': 'Switch Central', 'qtd_incidentes': 20 },
    { 'nome': 'Web XPTO', 'qtd_incidentes': 8 },
    { 'nome': 'Notebook Financeiro', 'qtd_incidentes': 1 }
]

// Variáveis de tratamento
let nomeServidores = [];
let qtdIncidentes = [];

// Função de tratamento
function tratarIncidentesServidor(incidentesServidor) {
    let ordenados = incidentesServidor.slice().sort(function (a, b) {
        return b.qtd_incidentes - a.qtd_incidentes;
    });
    let limite = Math.min(ordenados.length, 7);

    for (let i = 0; i < limite; i++) {
        nomeServidores.push(ordenados[i].nome.toUpperCase());
        qtdIncidentes.push(ordenados[i].qtd_incidentes);
    }
}
tratarIncidentesServidor(incidentesServidor);

const ctx_serv = document.getElementById('grafico-incidentes-pservidor');

new Chart(ctx_serv, {
    type: 'bar',
    data: {
        labels: nomeServidores,
        datasets: [
            {
                label: 'Incidentes hoje',
                data: qtdIncidentes,
                borderWidth: 0,
                backgroundColor: '#FF5C5C',
                borderRadius: 5
            }
        ]
    },
    options: {
        responsive: true,
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#eaeaf3',
                    font: { family: 'allerta', size: 10, weight: 'normal' }
                }
            },
            y: {
                beginAtZero: true,
                min: 0,
                grid: {
                    display: false
                },
                ticks: {
                    color: '#eaeaf3',
                    precision: 0,
                    font: { size: 14, weight: 'bold' }
                },
                border: {
                    display: true,
                    color: '#eaeaf3',
                    width: 1
                }
            }
        },
        plugins: {
            title: {
                display: true,
                text: 'Incidentes Registrados por Servidor (Hoje)',
                color: '#eaeaf3',
                position: 'top',
                font: { family: 'allerta', size: 16, weight: 'normal' },
                padding: { top: 10, bottom: 20 },
                align: 'center'
            },
            legend: {
                display: false
            }
        }
    }
});





// ----------------------------------------------------------------------
// GRÁFICO DE LINHA - DISPONIBILIDADE AO LONGO DO TEMPO -----------------
// ----------------------------------------------------------------------

// Definição do json de consumo
const dispPorTempo = [
    {
        'dispPercent': 88,
        'timestamp': '12:00:00'
    },
    {
        'dispPercent': 89,
        'timestamp': '13:00:00'
    },
    {
        'dispPercent': 91,
        'timestamp': '14:00:00'
    },
    {
        'dispPercent': 99,
        'timestamp': '15:00:00'
    },
    {
        'dispPercent': 80,
        'timestamp': '16:00:00'
    }
]

// Variáveis de tratamento
let dispPercent = [];
let timestamp = [];
let meta = [];

// Função de tratamento
function tratarDispPorTempo(dispPorTempo) {
    for (let i = 0; i < dispPorTempo.length; i++) {
        dispPercent.push(dispPorTempo[i].dispPercent)
        timestamp.push(dispPorTempo[i].timestamp)
        meta.push(99.9)
    }
    return dispPercent, timestamp, meta;
}
tratarDispPorTempo(dispPorTempo);

const ctx_disp = document.getElementById('grafico-disp-tempo');

new Chart(ctx_disp, {
    type: 'line',
    data: {
    labels: timestamp,
    datasets: [
        {
            label: 'Atual',
            data: dispPercent,
            borderWidth: 1,
            pointBackgroundColor: '#FF5C5C',
            pointBorderColor: '#FF5C5C',
            borderColor: '#eaeaf3',
            borderWidth: 2,
            fill:true
        },
        {
            label: 'Meta',
            data: meta,
            borderWidth: 1,
            pointRadius: 0,
            pointBackgroundRadius: 0,
            borderColor: '#3DDC84',
            borderWidth: 1,
            borderDash: [5, 5]
        }
    ]
    },
    options: {
    scales: {
        y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            grid: {
                display: false
            },
            ticks: {
                color: '#5C6288',
                font: { size: 14, weight: 'bold' },
                stepSize: 20
            },
            border: {
                display: true,
                color: '#5C6288',
                width: 1
            }
        },
        x: {
            grid: {
                display: false
            },
            ticks: {
                color: '#5C6288',
                font: { size: 14, weight: 'bold' }
            },
            border: {
                display: true,
                color: '#5C6288',
                width: 1
            }
        }
    },
    plugins: {
            title: {
                display: true,
                text: 'Disponibilidade ao longo do tempo',
                color: '#eaeaf3',
                position: 'top',
                font: { family:'allerta',  size: 16, weight: 'normal' },
                padding: { top: 10, bottom: 20 },
                align: 'center'
            },
            legend: {
                display: true,
                position: 'bottom',
                align: 'end',
                labels: {
                    color: '#eaeaf3',
                    borderRadius: 10,
                    boxWidth: 15,
                    boxHeight: 15,
                    font: { family: 'allerta', size: 14 }
                }
            }
        }
    }
});





// ----------------------------------------------------------------------
// GRÁFICO DE ROSCA - QUANTIDADE DE ALERTAS POR COMPONENTE x3 -----------
// ----------------------------------------------------------------------

// Definição do json de consumo
const alertasPorComponente = [
    {
        'componente': 'cpu',
        'qtd_alertas_ativos': 11,
        'qtd_alertas_totais': 48,
        'qtd_alertas_criticos': 2
    },
    {
        'componente': 'ram',
        'qtd_alertas_ativos': 10,
        'qtd_alertas_totais': 27,
        'qtd_alertas_criticos': 1
    },
    {
        'componente': 'disco',
        'qtd_alertas_ativos': 3,
        'qtd_alertas_totais': 34,
        'qtd_alertas_criticos': 0
    }
]

// Variáveis de tratamento
let componentes = [];
let qtdAlertasAtivos = [];
let qtdTotalAlertas = [];
let alertasTotaisComp = 0;
let totalAlertasCriticos = 0;

// Função de tratamento
function tratarAlertasPorComponente(alertasPorComponente) {
    for (let i = 0; i < 3; i++) {
        componentes.push(alertasPorComponente[i].componente)
        qtdAlertasAtivos.push(alertasPorComponente[i].qtd_alertas_ativos)
        qtdTotalAlertas.push(alertasPorComponente[i].qtd_alertas_totais)
        alertasTotaisComp += alertasPorComponente[i].qtd_alertas_ativos;
        totalAlertasCriticos += alertasPorComponente[i].qtd_alertas_criticos;
    }
    return componentes, qtdAlertasAtivos, qtdTotalAlertas, alertasTotaisComp, totalAlertasCriticos;
}
tratarAlertasPorComponente(alertasPorComponente);


// Inserindo innerHTML
qtdComp1 = document.getElementById('qtd-comp1');
qtdComp2 = document.getElementById('qtd-comp2');
qtdComp3 = document.getElementById('qtd-comp3');

qtdComp1.innerHTML = `${qtdTotalAlertas[0]}`;
qtdComp2.innerHTML = `${qtdTotalAlertas[1]}`;
qtdComp3.innerHTML = `${qtdTotalAlertas[2]}`;

const ctx_comp1 = document.getElementById('grafico-comps1');

new Chart(ctx_comp1, {
    type: 'doughnut',
    data: {
        labels: ['Em alerta', 'Qtd Total'],
        datasets: [{
            label: false,
            data: [qtdAlertasAtivos[0], qtdTotalAlertas[0]],
            backgroundColor: ["#FF5C5C", '#291C58'],
            borderWidth: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: false
                }
        }
    }
});



const ctx_comp2 = document.getElementById('grafico-comps2');

new Chart(ctx_comp2, {
    type: 'doughnut',
    data: {
        labels: ['Em alerta', 'Qtd Total'],
        datasets: [{
            label: false,
            data: [qtdAlertasAtivos[1], qtdTotalAlertas[1]],
            backgroundColor: ["#FF5C5C", '#291C58'],
            borderWidth: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: false
                }
        }
    }
});


const ctx_comp3 = document.getElementById('grafico-comps3');

new Chart(ctx_comp3, {
    type: 'doughnut',
    data: {
    labels: ['Em alerta', 'Qtd Total'],
        datasets: [{
            label: false,
            data: [qtdAlertasAtivos[2], qtdTotalAlertas[2]],
            backgroundColor: ["#FF5C5C", '#291C58'],
            borderWidth: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: false
            },
            legend: {
                display: false
            }
    }
    }
});





// ----------------------------------------------------------------------
// GRÁFICO DE BARRAS - ORÇAMENTO DE INDISPONIBILIDADE ANUAL -------------
// ----------------------------------------------------------------------

// Definição do json de consumo
const dispAnual = [
    {
        'tempoDispAnualMin': 42
    }
]

// Variáveis de tratamento
let tempoDispAnualMin = dispAnual[0].tempoDispAnualMin;
let tempoMinTotais = 526;
let tempDispAnualPercent = (tempoDispAnualMin * 100) / tempoMinTotais;
tempDispAnualPercent = Math.round(tempDispAnualPercent)
let restante = 100 - tempDispAnualPercent;

// Cálculo de tempo consumido
let qtdConsumidoMin = tempoDispAnualMin % 60;
let qtdConsumidoHoras = tempoDispAnualMin / 60;
qtdConsumidoHoras = Math.trunc(qtdConsumidoHoras);

// Cálculo de tempo restante
let qtdRestanteMinTotais = tempoMinTotais - tempoDispAnualMin;
let qtdRestanteHoras = Math.round(qtdRestanteMinTotais / 60);
let qtdRestanteMin = qtdRestanteMinTotais % 60;

// Variáveis para innerHTML
let idConsumido = document.getElementById('grafic-disp-consumido')
let idRestante = document.getElementById('grafic-disp-restante')

// Condições para formatação
if (qtdConsumidoHoras < 1) {
    qtdConsumido = `${tempoDispAnualMin}min`
} else {
    qtdConsumido = `${qtdConsumidoHoras}h${qtdConsumidoMin}min`
}

if (qtdRestanteHoras < 1) {
    qtdRestante = `${qtdRestanteMin}min`
} else {
    qtdRestante = `${qtdRestanteHoras}h${qtdRestanteMin}min`
}

// Inserção dos valores em innerHTML
idRestante.innerHTML = `Restante: ${qtdRestante}`
idConsumido.innerHTML = `Consumido: ${qtdConsumido}`

// Definição da cor default da barra de consumido do gráfico
let cor_consumido = '#eaeaf3'

if (tempDispAnualPercent > 65) {
    cor_consumido = '#FF5C5C'
} else if (tempDispAnualPercent > 30) {
    cor_consumido = '#F5C542'
} else if (tempDispAnualPercent > 10) {
    cor_consumido = '#5178F9'
} else if (tempDispAnualPercent <= 10 && tempDispAnualPercent > 0) {
    cor_consumido = '#3DDC84'
} else {
    cor_consumido = '#3DDC84'
}

const ctx_saldo = document.getElementById('grafico-indisp-saldo');

new Chart(ctx_saldo, {
type: 'bar',
data: {
    labels: ['Orçamento em (%)'],
    datasets: [
    {
        label: 'Consumido',
        data: [tempDispAnualPercent],
        backgroundColor: cor_consumido,
        borderRadius: 8
    },
    {
        label: 'Restante',
        data: [restante],
        backgroundColor: '#170F38',
        borderRadius: 8,
        borderColor: '#5C6288',
        borderWidth: 1
    }
]
},
options: {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        y: {
            stacked: true,
            display: false
        },
        x: {
            stacked: true,
            display: false,
            max: 100
        }
    },
    plugins: {
        legend: {
            display: false
        }
    }
}
});





// ----------------------------------------------------------------------
// TRATAMENTO DAS KPIS --------------------------------------------------
// ----------------------------------------------------------------------

// KPI -- SERVIDORES ATIVOS
const servidoresAtivos = [
    {
        'qtdServidoresAtivos': 22,
        'qtdServidoresTotais': 25
    }
]

let sAtivos = servidoresAtivos[0].qtdServidoresAtivos;
let sTotais = servidoresAtivos[0].qtdServidoresTotais;
let sInativos = sTotais - sAtivos;

let kpiInativos = document.getElementById('kpi-s-inativos');
let kpiAtivos = document.getElementById('kpi-s-ativos');
let kpiTotais = document.getElementById('kpi-s-totais');

if (sInativos > 1) {
    kpiInativos.innerHTML = `${sInativos} Servidores Inativos`;
    kpiAtivos.innerHTML = `${sAtivos}`;
    kpiTotais.innerHTML = `${sTotais}`;
    kpiInativos.classList.add('cor_vermelha')
    kpiInativos.classList.remove('cor_verde')
} else if (sInativos > 0) {
    kpiInativos.innerHTML = `${sInativos} Servidor Inativo`;
    kpiAtivos.innerHTML = `${sAtivos}`;
    kpiTotais.innerHTML = `${sTotais}`;
    kpiInativos.classList.add('cor_vermelha')
    kpiInativos.classList.remove('cor_verde')
} else {
    kpiInativos.innerHTML = `Nenhum servidor inativo`;
    kpiAtivos.innerHTML = `${sAtivos}`;
    kpiTotais.innerHTML = `${sTotais}`;
    kpiInativos.classList.add('cor_verde')
    kpiInativos.classList.remove('cor_vermelha')
}


// KPI -- TEMPO EM DOWNTIME
let idDowntime = document.getElementById('kpi-t-downtime')
let idDowntimeComparada = document.getElementById('kpi-d-comparado')

idDowntime.innerHTML = `${qtdConsumido}`
if (tempDispAnualPercent > 65) {
    cor_consumido = '#FF5C5C'

    idConsumido.classList.add('cor_vermelha')
    idConsumido.classList.remove('cor_verde')
    idConsumido.classList.remove('cor_amarela')
    idConsumido.classList.remove('cor_padrao')

    idDowntimeComparada.innerHTML = `ATENÇÃO: ${tempDispAnualPercent}% do limite`
    idDowntimeComparada.classList.add('cor_vermelha')
    idDowntimeComparada.classList.remove('cor_verde')
    idDowntimeComparada.classList.remove('cor_amarela')
    idDowntimeComparada.classList.remove('cor_padrao')
} else if (tempDispAnualPercent > 30) {
    cor_consumido = '#F5C542'

    idConsumido.classList.add('cor_amarela')
    idConsumido.classList.remove('cor_vermelha')
    idConsumido.classList.remove('cor_verde')
    idConsumido.classList.remove('cor_padrao')

    idDowntimeComparada.innerHTML = `${tempDispAnualPercent}% do limite`
    idDowntimeComparada.classList.add('cor_amarela')
    idDowntimeComparada.classList.remove('cor_vermelha')
    idDowntimeComparada.classList.remove('cor_verde')
    idDowntimeComparada.classList.remove('cor_padrao')
} else if (tempDispAnualPercent > 10) {
    cor_consumido = '#5178F9'

    idConsumido.classList.add('cor_padrao')
    idConsumido.classList.remove('cor_verde')
    idConsumido.classList.remove('cor_amarela')
    idConsumido.classList.remove('cor_vermelha')

    idDowntimeComparada.innerHTML = `${tempDispAnualPercent}% do limite`
    idDowntimeComparada.classList.add('cor_padrao')
    idDowntimeComparada.classList.remove('cor_verde')
    idDowntimeComparada.classList.remove('cor_amarela')
    idDowntimeComparada.classList.remove('cor_vermelha')
} else if (tempDispAnualPercent <= 10 && tempDispAnualPercent > 0) {
    cor_consumido = '#3DDC84'

    idConsumido.classList.add('cor_verde')
    idConsumido.classList.remove('cor_padrao')
    idConsumido.classList.remove('cor_amarela')
    idConsumido.classList.remove('cor_vermelha')

    idDowntimeComparada.innerHTML = `${tempDispAnualPercent}% do limite`
    idDowntimeComparada.classList.add('cor_verde')
    idDowntimeComparada.classList.remove('cor_padrao')
    idDowntimeComparada.classList.remove('cor_amarela')
    idDowntimeComparada.classList.remove('cor_vermelha')
} else {
    cor_consumido = '#3DDC84'

    idConsumido.classList.add('cor_verde')
    idConsumido.classList.remove('cor_padrao')
    idConsumido.classList.remove('cor_amarela')
    idConsumido.classList.remove('cor_vermelha')

    idDowntimeComparada.innerHTML = `Nenhuma indisponibilidade`
    idDowntimeComparada.classList.add('cor_verde')
    idDowntimeComparada.classList.remove('cor_padrao')
    idDowntimeComparada.classList.remove('cor_amarela')
    idDowntimeComparada.classList.remove('cor_vermelha')
}


// KPI - TEMPO MÉDIO DE RESOLUÇÃO
const tempoMedioResolucao = [
    {
        'mttrMin': 22,
        'comparacaoPercent': 8
    }
]
let mttrMin = tempoMedioResolucao[0].mttrMin
let mttrPercent = tempoMedioResolucao[0].comparacaoPercent

let kpiMttr = document.getElementById('kpi-t-mttd')
let kpiMttrPerc = document.getElementById('kpi-p-comparada')

let kpiMttrMin = mttrMin % 60;
let kpiMttrHoras = mttrMin / 60;

if (kpiMttrHoras < 1) {
    kpiMttr.innerHTML = `${kpiMttrMin}min`
} else {
    kpiMttr.innerHTML = `${kpiMttrHoras}h${kpiMttrMin}min`
}

if (mttrPercent > 0) {
    kpiMttr.classList.add('cor_verde')
    kpiMttr.classList.remove('cor_vermelha')

    kpiMttrPerc.innerHTML = `${mttrPercent}% mais rápida`
    kpiMttrPerc.classList.add('cor_verde')
    kpiMttrPerc.classList.remove('cor_vermelha')
} else if (mttrPercent < 0) {
    kpiMttr.classList.add('cor_vermelha')
    kpiMttr.classList.remove('cor_verde')

    kpiMttrPerc.innerHTML = `${mttrPercent}% mais lenta`
    kpiMttrPerc.classList.add('cor_vermelha')
    kpiMttrPerc.classList.remove('cor_verde')
} else {
    kpiMttr.classList.remove('cor_vermelha')
    kpiMttr.classList.remove('cor_verde')

    kpiMttrPerc.innerHTML = `Permanece igual`
    kpiMttrPerc.classList.remove('cor_vermelha')
    kpiMttrPerc.classList.remove('cor_verde')
}


// KPI -- DISPONIBILIDADE EXTERNA
const dispExterna = [
    {
        'dispExternaPercent': 99.5
    }
]

let dispExternaPercent = dispExterna[0].dispExternaPercent

let kpiDispExterna = document.getElementById('kpi-d-externa')
let kpiDispStatus = document.getElementById('kpi-de-status')

kpiDispExterna.innerHTML = `${dispExternaPercent}%`

if (dispExternaPercent < 90.00) {
    kpiDispStatus.innerHTML = `Status: Crítico`
    kpiDispExterna.classList.add('cor_vermelha')
    kpiDispExterna.classList.remove('cor_amarela')
    kpiDispExterna.classList.remove('cor_verde')
    kpiDispStatus.classList.add('cor_vermelha')
    kpiDispStatus.classList.remove('cor_amarela')
    kpiDispStatus.classList.remove('cor_verde')
} else if (dispExternaPercent < 99.90) {
    kpiDispStatus.innerHTML = `Status: Moderado`
    kpiDispExterna.classList.add('cor_amarela')
    kpiDispExterna.classList.remove('cor_vermelha')
    kpiDispExterna.classList.remove('cor_verde')
    kpiDispStatus.classList.add('cor_amarela')
    kpiDispStatus.classList.remove('cor_vermelha')
    kpiDispStatus.classList.remove('cor_verde')
} else {
    kpiDispStatus.innerHTML = `Status: Bom`
    kpiDispExterna.classList.add('cor_verde')
    kpiDispExterna.classList.remove('cor_amarela')
    kpiDispExterna.classList.remove('cor_vermelha')
    kpiDispStatus.classList.add('cor_verde')
    kpiDispStatus.classList.remove('cor_amarela')
    kpiDispStatus.classList.remove('cor_vermelha')
}


// KPI -- ALERTAS TOTAIS (card de componentes)
kpiAlertasTotais = document.getElementsByClassName('kpi_alertas_ativos');

for (let i = 0; i < kpiAlertasTotais.length; i++) {
    kpiAlertasTotais[i].innerHTML = `${alertasTotaisComp}`;
}

// ----------------------------------------------------------------------
// RANKING DE SERVIDORES EM ALERTA E KPI DE CRÍTICOS --------------------
// ----------------------------------------------------------------------

const limitesMetricas = {
    cpu: { moderado: 70, critico: 85 },
    ram: { moderado: 70, critico: 85 },
    disco: { moderado: 75, critico: 90 }
};

const minutosSemComunicacao = 5;
const mostrarSomenteEmAlerta = true;

// Definição do json de consumo (médias dos últimos 15 minutos)
const mediaServidores = [
    { 'idEquipamento': 1, 'nome': 'Principal', 'cpu': 92, 'ram': 35, 'disco': 78, 'minutosSemDados': 0 },
    { 'idEquipamento': 2, 'nome': 'Backup', 'cpu': 40, 'ram': 88, 'disco': 91, 'minutosSemDados': 1 },
    { 'idEquipamento': 3, 'nome': 'Switch Central', 'cpu': 72, 'ram': 35, 'disco': 78, 'minutosSemDados': 0 },
    { 'idEquipamento': 4, 'nome': 'Web XPTO', 'cpu': 12, 'ram': 75, 'disco': 40, 'minutosSemDados': 2 },
    { 'idEquipamento': 5, 'nome': 'Notebook Financeiro', 'cpu': 12, 'ram': 35, 'disco': 78, 'minutosSemDados': 0 },
    { 'idEquipamento': 6, 'nome': 'Servidor Pix', 'cpu': 85, 'ram': 75, 'disco': 35, 'minutosSemDados': 1 },
    { 'idEquipamento': 7, 'nome': 'Servidor Boleto', 'cpu': 15, 'ram': 25, 'disco': 35, 'minutosSemDados': 0 },
    { 'idEquipamento': 8, 'nome': 'Servidor Legado', 'cpu': 20, 'ram': 30, 'disco': 45, 'minutosSemDados': 1 }
]

const rotulosStatus = ['Normal', 'Moderado', 'Crítico', 'Sem dados'];
const coresStatus = ['cor_verde', 'cor_amarela', 'cor_vermelha', 'cor_apagada'];
const coresMetrica = ['cor_verde', 'cor_amarela', 'cor_vermelha'];

function classificarMetrica(tipo, valor) {
    if (valor >= limitesMetricas[tipo].critico) return 2;
    if (valor >= limitesMetricas[tipo].moderado) return 1;
    return 0;
}

function calcularPrioridade(servidor) {
    let niveis = [
        classificarMetrica('cpu', servidor.cpu),
        classificarMetrica('ram', servidor.ram),
        classificarMetrica('disco', servidor.disco)
    ];
    let pior = 0;
    let qtdCriticas = 0;

    for (let i = 0; i < niveis.length; i++) {
        if (niveis[i] > pior) pior = niveis[i];
        if (niveis[i] == 2) qtdCriticas++;
    }

    if (servidor.minutosSemDados >= minutosSemComunicacao) pior = 3;

    servidor.niveis = niveis;
    servidor.status = pior;
    servidor.qtdCriticas = qtdCriticas;
    servidor.maiorValor = Math.max(servidor.cpu, servidor.ram, servidor.disco);
}

function ordenarRanking(lista) {
    for (let i = 0; i < lista.length; i++) {
        calcularPrioridade(lista[i]);
    }
    lista.sort(function (a, b) {
        if (b.status != a.status) return b.status - a.status;
        if (b.qtdCriticas != a.qtdCriticas) return b.qtdCriticas - a.qtdCriticas;
        return b.maiorValor - a.maiorValor;
    });
    return lista;
}

function renderizarRanking(lista) {
    let corpo = document.getElementById('corpo-tabela-hardwares');
    corpo.innerHTML = '';
    let qtdLinhas = 0;

    for (let i = 0; i < lista.length; i++) {
        let s = lista[i];
        if (mostrarSomenteEmAlerta && s.status == 0) continue;
        qtdLinhas++;

        corpo.innerHTML += `
            <hr>
            <div class="server_box">
                <input type="checkbox" class="check_servidor" value="${s.idEquipamento}">
                <p>${s.nome}</p>
                <p class="col_centro ${coresMetrica[s.niveis[0]]}">${s.cpu}%</p>
                <p class="col_centro ${coresMetrica[s.niveis[1]]}">${s.ram}%</p>
                <p class="col_centro ${coresMetrica[s.niveis[2]]}">${s.disco}%</p>
                <p class="col_centro ${coresStatus[s.status]} ${s.status >= 2 ? 'texto_forte' : ''}">${rotulosStatus[s.status]}</p>
                <a href="./dashboard-servidor.html?idEquipamento=${s.idEquipamento}" class="btn_ver">ver-➔</a>
            </div>
        `
    }

    if (qtdLinhas == 0) {
        corpo.innerHTML = `
            <div class="server_box_vazio">
                <p>Nenhum servidor em alerta</p>
            </div>
        `
    }
}

function configurarMarcarTodos() {
    let marcarTodos = document.getElementById('marcar-todos-servidores');

    marcarTodos.addEventListener('change', function () {
        let checks = document.getElementsByClassName('check_servidor');
        for (let i = 0; i < checks.length; i++) {
            checks[i].checked = marcarTodos.checked;
        }
    });
}

function aplicarCor(elemento, cor) {
    let todas = ['cor_verde', 'cor_amarela', 'cor_vermelha', 'cor_apagada'];
    for (let i = 0; i < todas.length; i++) {
        elemento.classList.remove(todas[i]);
    }
    elemento.classList.add(cor);
}

function atualizarKpiCriticos(lista) {
    let criticos = 0;
    let moderados = 0;

    for (let i = 0; i < lista.length; i++) {
        if (lista[i].status >= 2) {
            criticos++;
        } else if (lista[i].status == 1) {
            moderados++;
        }
    }

    let kpiCriticos = document.getElementById('kpi-s-criticos');
    let kpiMonitorados = document.getElementById('kpi-s-monitorados');
    let kpiCriticosStatus = document.getElementById('kpi-s-criticos-status');

    kpiCriticos.innerHTML = `${criticos}`;
    kpiMonitorados.innerHTML = `${lista.length}`;

    if (criticos > 0) {
        kpiCriticosStatus.innerHTML = `Requer atenção imediata`;
        aplicarCor(kpiCriticos, 'cor_vermelha');
        aplicarCor(kpiCriticosStatus, 'cor_vermelha');
    } else if (moderados > 0) {
        kpiCriticosStatus.innerHTML = `${moderados} em atenção`;
        aplicarCor(kpiCriticos, 'cor_verde');
        aplicarCor(kpiCriticosStatus, 'cor_amarela');
    } else {
        kpiCriticosStatus.innerHTML = `Tudo sob controle`;
        aplicarCor(kpiCriticos, 'cor_verde');
        aplicarCor(kpiCriticosStatus, 'cor_verde');
    }
}

const rankingServidores = ordenarRanking(mediaServidores);
renderizarRanking(rankingServidores);
configurarMarcarTodos();
atualizarKpiCriticos(rankingServidores);