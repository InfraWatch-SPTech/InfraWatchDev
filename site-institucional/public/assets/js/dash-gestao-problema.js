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
// GRÁFICO DE LINHA - PARETO PREJUÍZO POR COMPONENTE --------------------
// ----------------------------------------------------------------------

// Definição do json de consumo
const prejuizoComponente = [
    {
        'comp': 'CPU',
        'prejuizo': 5000.00
    },
    {
        'comp': 'RAM',
        'prejuizo': 25000.00
    },
    {
        'comp': 'DISCO',
        'prejuizo': 10000.00
    },
    {
        'comp': 'LATÊNCIA',
        'prejuizo': 55000.00
    }
]

// Ordena os dados do maior pro menor
prejuizoComponente.sort((a, b) => b.prejuizo - a.prejuizo);

// Variáveis de tratamento
let componente = [];
let prejuizo = [];
let prejuAcumulado = [];
let linhaAcumulada = [];

// Função de tratamento
function tratarPrejuizoComponente(prejuizoComponente) {
    for (let i = 0; i < prejuizoComponente.length; i++) {
        componente.push(prejuizoComponente[i].comp)
        prejuizo.push(prejuizoComponente[i].prejuizo)

        if (prejuAcumulado.length == 0) {
            prejuAcumulado.push(prejuizoComponente[i].prejuizo);
        } else {
            prejuAcumulado.push(prejuAcumulado[i - 1] + prejuizoComponente[i].prejuizo);
        }
        console.log(prejuAcumulado[i]);
    }
    
    for (let i = 0; i < prejuAcumulado.length; i++) {
        total = prejuAcumulado[prejuAcumulado.length - 1]
        linhaAcumulada.push(((prejuAcumulado[i] / total) * 100).toFixed(2))
    }

    return componente, prejuizo, prejuAcumulado;
}
tratarPrejuizoComponente(prejuizoComponente);


const ctx_disp = document.getElementById('g-dash-comp-prej');

new Chart(ctx_disp, {
    data: {
        labels: componente,
            datasets: [
            {
                type: 'bar',
                label: 'Prejuízo',
                data: prejuizo,
                backgroundColor: '#5178F9',
                yAxisID: 'yFreq',
                order: 2
            },
            {
                type: 'line',
                label: '% Acumulado',
                data: linhaAcumulada,
                borderColor: '#FF5C5C',
                backgroundColor: '#FF5C5C',
                tension: 0,
                pointRadius: 4,
                yAxisID: 'yPct',
                order: 1
            }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
            x: {
                ticks: {
                    color: '#5C6288',
                    font: {
                        family: 'allerta',
                        size: 12,
                        weight: 'bold',
                        style: 'italic'
                    }
                }
            },
            yFreq: {
                type: 'linear',
                position: 'left',
                beginAtZero: true,
                max: prejuAcumulado[prejuAcumulado.length - 1],
                grid: { display: false },
                title: { 
                    display: true, 
                    text: 'Prejuízo', 
                    color: '#5C6288', 
                    font: { family: 'allerta', 
                        size: 14, 
                        weight: 'normal' 
                    } 
                },
                ticks: {
                    color: '#5C6288',
                    font: { family: 'allerta', size: 14, weight: 'normal' },
                    stepSize: 15000
                },
                border: {
                    display: true,
                    color: '#5C6288',
                    width: 1
                }
            },
            yPct: {
                type: 'linear',
                position: 'right',
                min: 0,
                max: 100,
                grid: { display: false },
                ticks: { 
                    callback: v => v + '%',
                    color: '#5C6288',
                    precision: 0,
                    font: { family: 'allerta', size: 14, weight: 'normal' },
                    stepSize: 20
                },
                title: { 
                    display: true, 
                    text: '% Acumulado', 
                    color: '#5C6288', 
                    font: { 
                        family: 'allerta', 
                        size: 14, 
                        weight: 'normal' 
                    } 
                },
                border: {
                    display: true,
                    color: '#5C6288',
                    width: 1
                }
            }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                    label: ctx_disp => ctx_disp.dataset.type === 'line'
                        ? `${ctx_disp.dataset.label}: ${ctx_disp.parsed.y}%`
                        : `${ctx_disp.dataset.label}: ${ctx_disp.parsed.y}`
                    }
                },
                legend: {
                    display: false
                },
                title: { 
                    display: true, 
                    text: 'Pareto: % Prejuízo Acumulado por Componente', 
                    color: '#eaeaf3', 
                    font: { 
                        family: 'allerta', 
                        size: 16, 
                        weight: 'normal' 
                    } 
                }

            }
        }
});

// ----------------------------------------------------------------------
// GRÁFICO DE LINHA - PARETO PREJUÍZO POR COMPONENTE --------------------
// ----------------------------------------------------------------------

// Definição do json de consumo
const criticidadePrejuizo = [
    {
        'id': 'CPU',
        'servidor': 'SVR-01',
        'equipe': 'A',
        'criticidade_alertas': 1,
        'prejuizo_estimado': 3,
    },
    {
        'id': 'CPU',
        'servidor': 'SVR-02',
        'equipe': 'A',
        'criticidade_alertas': 1,
        'prejuizo_estimado': 3,
    },
    {
        'id': 'CPU',
        'servidor': 'SVR-03',
        'equipe': 'A',
        'criticidade_alertas': 1,
        'prejuizo_estimado': 3,
    },
    {
        'id': 'CPU',
        'servidor': 'SVR-06',
        'equipe': 'A',
        'criticidade_alertas': 1,
        'prejuizo_estimado': 3,
    }
]

// Ordena os dados do maior pro menor
prejuizoComponente.sort((a, b) => b.prejuizo - a.prejuizo);

// Variáveis de tratamento
let servidor = [];

// Função de tratamento
function tratarPrejuizoComponente(prejuizoComponente) {
    for (let i = 0; i < prejuizoComponente.length; i++) {
        componente.push(prejuizoComponente[i].comp)
        prejuizo.push(prejuizoComponente[i].prejuizo)

        if (prejuAcumulado.length == 0) {
            prejuAcumulado.push(prejuizoComponente[i].prejuizo);
        } else {
            prejuAcumulado.push(prejuAcumulado[i - 1] + prejuizoComponente[i].prejuizo);
        }
        console.log(prejuAcumulado[i]);
    }
    
    for (let i = 0; i < prejuAcumulado.length; i++) {
        total = prejuAcumulado[prejuAcumulado.length - 1]
        linhaAcumulada.push(((prejuAcumulado[i] / total) * 100).toFixed(2))
    }

    return componente, prejuizo, prejuAcumulado;
}
tratarPrejuizoComponente(prejuizoComponente);