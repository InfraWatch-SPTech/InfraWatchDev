// ----------------------------------------------------------------------
// GRÁFICO DE BARRAS - NÚMERO DE INCIDENTES POR SERVIDOR ----------------
// ----------------------------------------------------------------------

// Definição do json de consumo
const incidentesServidor = [
    {
        'nome': 'Principal',
        'qtd_incidentes': 12,
        'qtd_resolvidos': 5
    },
    {
        'nome': 'Backup',
        'qtd_incidentes': 2,
        'qtd_resolvidos': 1
    },
    {
        'nome': 'Switch Central',
        'qtd_incidentes': 20,
        'qtd_resolvidos': 10
    },
    {
        'nome': 'Web XPTO',
        'qtd_incidentes': 8,
        'qtd_resolvidos': 3
    },
    {
        'nome': 'Notebook Financeiro',
        'qtd_incidentes': 1,
        'qtd_resolvidos': 0
    }
]

// Variáveis de tratamento
let nomeServidores = [];
let qtdIncidentes = [];
let qtdResolvidos = [];
let incidentesTotais = 0;

// Função de tratamento
function tratarIncidentesServidor(incidentesServidor) {
    for (let i = 0; i < incidentesServidor.length; i++) {
        nomeServidores.push(incidentesServidor[i].nome.toUpperCase());
        qtdIncidentes.push(incidentesServidor[i].qtd_incidentes);
        qtdResolvidos.push(incidentesServidor[i].qtd_resolvidos);
        if (incidentesTotais < incidentesServidor[i].qtd_incidentes) {
            incidentesTotais = incidentesServidor[i].qtd_incidentes;
        }
    }
    return nomeServidores, qtdIncidentes, qtdResolvidos, incidentesTotais;
}
tratarIncidentesServidor(incidentesServidor);

const ctx_serv = document.getElementById('grafico-incidentes-pservidor');

new Chart(ctx_serv, {
    type: 'bar',
    data: {
    labels: nomeServidores,
    datasets: [
        {
            label: 'Incidentes',
            data: qtdIncidentes,
            borderWidth: 0,
            backgroundColor: '#FF5C5C' ,
            grouped: false,
            order: 2,
            borderRadius: 5
        },
        {
            label: 'Resolvidos',
            data: qtdResolvidos,
            borderWidth: 0,
            backgroundColor: '#3DDC84',
            grouped: false,
            order: 1,
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
                    font: { family: 'allerta',  size: 10, weight: 'normal' }
                }
            },
            y: {
                beginAtZero: true,
                min: 0,
                max: incidentesTotais,
                grid: {
                    display: false
                },
                ticks: {
                    color: '#eaeaf3',
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
                text: 'Número de Incidentes por Servidor',
                color: '#eaeaf3',
                position: 'top',
                font: { family: 'allerta', size: 16, weight: 'normal' },
                padding: { top: 10, bottom: 20 },
                align: 'center'
            },
            legend: {
                display: true,
                position: 'top',
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
    kpiInativos.classList.add('cor-vermelha')
    kpiInativos.classList.remove('cor-verde')
} else if (sInativos > 0) {
    kpiInativos.innerHTML = `${sInativos} Servidor Inativo`;
    kpiAtivos.innerHTML = `${sAtivos}`;
    kpiTotais.innerHTML = `${sTotais}`;
    kpiInativos.classList.add('cor-vermelha')
    kpiInativos.classList.remove('cor-verde')
} else {
    kpiInativos.innerHTML = `Nenhum servidor inativo`;
    kpiAtivos.innerHTML = `${sAtivos}`;
    kpiTotais.innerHTML = `${sTotais}`;
    kpiInativos.classList.add('cor-verde')
    kpiInativos.classList.remove('cor-vermelha')
}


// KPI -- TEMPO EM DOWNTIME
let idDowntime = document.getElementById('kpi-t-downtime')
let idDowntimeComparada = document.getElementById('kpi-d-comparado')

idDowntime.innerHTML = `${qtdConsumido}`
if (tempDispAnualPercent > 65) {
    cor_consumido = '#FF5C5C'

    idConsumido.classList.add('cor-vermelha')
    idConsumido.classList.remove('cor-verde')
    idConsumido.classList.remove('cor-amarela')
    idConsumido.classList.remove('cor-padrao')

    idDowntimeComparada.innerHTML = `ATENÇÃO: ${tempDispAnualPercent}% do limite`
    idDowntimeComparada.classList.add('cor-vermelha')
    idDowntimeComparada.classList.remove('cor-verde')
    idDowntimeComparada.classList.remove('cor-amarela')
    idDowntimeComparada.classList.remove('cor-padrao')
} else if (tempDispAnualPercent > 30) {
    cor_consumido = '#F5C542'

    idConsumido.classList.add('cor-amarela')
    idConsumido.classList.remove('cor-vermelha')
    idConsumido.classList.remove('cor-verde')
    idConsumido.classList.remove('cor-padrao')

    idDowntimeComparada.innerHTML = `${tempDispAnualPercent}% do limite`
    idDowntimeComparada.classList.add('cor-amarela')
    idDowntimeComparada.classList.remove('cor-vermelha')
    idDowntimeComparada.classList.remove('cor-verde')
    idDowntimeComparada.classList.remove('cor-padrao')
} else if (tempDispAnualPercent > 10) {
    cor_consumido = '#5178F9'

    idConsumido.classList.add('cor-padrao')
    idConsumido.classList.remove('cor-verde')
    idConsumido.classList.remove('cor-amarela')
    idConsumido.classList.remove('cor-vermelha')

    idDowntimeComparada.innerHTML = `${tempDispAnualPercent}% do limite`
    idDowntimeComparada.classList.add('cor-padrao')
    idDowntimeComparada.classList.remove('cor-verde')
    idDowntimeComparada.classList.remove('cor-amarela')
    idDowntimeComparada.classList.remove('cor-vermelha')
} else if (tempDispAnualPercent <= 10 && tempDispAnualPercent > 0) {
    cor_consumido = '#3DDC84'

    idConsumido.classList.add('cor-verde')
    idConsumido.classList.remove('cor-padrao')
    idConsumido.classList.remove('cor-amarela')
    idConsumido.classList.remove('cor-vermelha')

    idDowntimeComparada.innerHTML = `${tempDispAnualPercent}% do limite`
    idDowntimeComparada.classList.add('cor-verde')
    idDowntimeComparada.classList.remove('cor-padrao')
    idDowntimeComparada.classList.remove('cor-amarela')
    idDowntimeComparada.classList.remove('cor-vermelha')
} else {
    cor_consumido = '#3DDC84'

    idConsumido.classList.add('cor-verde')
    idConsumido.classList.remove('cor-padrao')
    idConsumido.classList.remove('cor-amarela')
    idConsumido.classList.remove('cor-vermelha')

    idDowntimeComparada.innerHTML = `Nenhuma indisponibilidade`
    idDowntimeComparada.classList.add('cor-verde')
    idDowntimeComparada.classList.remove('cor-padrao')
    idDowntimeComparada.classList.remove('cor-amarela')
    idDowntimeComparada.classList.remove('cor-vermelha')
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
    kpiMttr.classList.add('cor-verde')
    kpiMttr.classList.remove('cor-vermelha')

    kpiMttrPerc.innerHTML = `${mttrPercent}% mais rápida`
    kpiMttrPerc.classList.add('cor-verde')
    kpiMttrPerc.classList.remove('cor-vermelha')
} else if (mttrPercent < 0) {
    kpiMttr.classList.add('cor-vermelha')
    kpiMttr.classList.remove('cor-verde')

    kpiMttrPerc.innerHTML = `${mttrPercent}% mais lenta`
    kpiMttrPerc.classList.add('cor-vermelha')
    kpiMttrPerc.classList.remove('cor-verde')
} else {
    kpiMttr.classList.remove('cor-vermelha')
    kpiMttr.classList.remove('cor-verde')

    kpiMttrPerc.innerHTML = `Permanece igual`
    kpiMttrPerc.classList.remove('cor-vermelha')
    kpiMttrPerc.classList.remove('cor-verde')
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
    kpiDispExterna.classList.add('cor-vermelha')
    kpiDispExterna.classList.remove('cor-amarela')
    kpiDispExterna.classList.remove('cor-verde')
    kpiDispStatus.classList.add('cor-vermelha')
    kpiDispStatus.classList.remove('cor-amarela')
    kpiDispStatus.classList.remove('cor-verde')
} else if (dispExternaPercent < 99.90) {
    kpiDispStatus.innerHTML = `Status: Moderado`
    kpiDispExterna.classList.add('cor-amarela')
    kpiDispExterna.classList.remove('cor-vermelha')
    kpiDispExterna.classList.remove('cor-verde')
    kpiDispStatus.classList.add('cor-amarela')
    kpiDispStatus.classList.remove('cor-vermelha')
    kpiDispStatus.classList.remove('cor-verde')
} else {
    kpiDispStatus.innerHTML = `Status: Bom`
    kpiDispExterna.classList.add('cor-verde')
    kpiDispExterna.classList.remove('cor-amarela')
    kpiDispExterna.classList.remove('cor-vermelha')
    kpiDispStatus.classList.add('cor-verde')
    kpiDispStatus.classList.remove('cor-amarela')
    kpiDispStatus.classList.remove('cor-vermelha')
}


// KPI -- ALERTAS ATIVOS
kpiAlertasTotais = document.getElementsByClassName('kpi-alertas-ativos');

for (let i = 0; i < kpiAlertasTotais.length; i++) {
    kpiAlertasTotais[i].innerHTML = `${alertasTotaisComp}`;
}

kpiAlertasCriticos = document.getElementById('kpi-qtd-alertas-criticos');

if (totalAlertasCriticos > 0) {
    kpiAlertasCriticos.innerHTML = `${totalAlertasCriticos} alertas críticos`
    kpiAlertasCriticos.classList.remove('cor-verde')
    kpiAlertasCriticos.classList.add('cor-vermelha')
} else {
    kpiAlertasCriticos.innerHTML = `Nenhum alerta crítico ativo`
    kpiAlertasCriticos.classList.remove('cor-vermelha')
    kpiAlertasCriticos.classList.add('cor-verde')
}