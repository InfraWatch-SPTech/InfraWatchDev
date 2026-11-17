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
// GRÁFICO DE LINHA - EVOLUÇÃO MENSAL POR EQUIPE ------------------------
// ----------------------------------------------------------------------

// Definição do json de consumo
const alertaEquipMensal = [
    {
        'equipe1': 15,
        'equipe2': 13,
        'equipe3': 9,
        'timestamp': 'Jan'
    },
    {
        'equipe1': 17,
        'equipe2': 10,
        'equipe3': 5,
        'timestamp': 'Fev'
    },
    {
        'equipe1': 15,
        'equipe2': 13,
        'equipe3': 9,
        'timestamp': 'Mar'
    },
    {
        'equipe1': 17,
        'equipe2': 13,
        'equipe3': 8,
        'timestamp': 'Abr'
    },
    {
        'equipe1': 5,
        'equipe2': 15,
        'equipe3': 8,
        'timestamp': 'Mai' 
    },
    {
        'equipe1': 10,
        'equipe2': 12,
        'equipe3': 4,
        'timestamp': 'Jun' 
    },
    {
        'equipe1': 15,
        'equipe2': 16,
        'equipe3': 5,
        'timestamp': 'Jul' 
    },
    {
        'equipe1': 15,
        'equipe2': 12,
        'equipe3': 5,
        'timestamp': 'Ago' 
    },
    {
        'equipe1': 11,
        'equipe2': 15,
        'equipe3': 10,
        'timestamp': 'Out' 
    },
    {
        'equipe1': 16,
        'equipe2': 13,
        'equipe3': 5,
        'timestamp': 'Nov' 
    },
    {
        'equipe1': 15,
        'equipe2': 6,
        'equipe3': 8,
        'timestamp': 'Dez' 
    }
]

// Variáveis de tratamento
let equip1 = [];
let equip2= [];
let equip3 = [];
let timestamp = [];

// Função de tratamento
function tratarAlertasEquipMensal(alertaEquipMensal) {
    for (let i = 0; i < alertaEquipMensal.length; i++) {
        equip1.push(alertaEquipMensal[i].equipe1)
        equip2.push(alertaEquipMensal[i].equipe2)
        equip3.push(alertaEquipMensal[i].equipe3)
        timestamp.push(alertaEquipMensal[i].timestamp)
    }
    return equip1, equip2, equip3, timestamp;
}
tratarAlertasEquipMensal(alertaEquipMensal);

const ctx_disp = document.getElementById('g-dash-evol-equip');

new Chart(ctx_disp, {
    type: 'line',
    data: {
    labels: timestamp,
    datasets: [
        {
            label: 'A',
            data: equip1,
            borderWidth: 1,
            pointBackgroundColor: '#5178F9',
            pointBorderColor: '#5178F9',
            borderColor: '#5178F9',
            borderWidth: 2,
            fill:true
        },{
            label: 'B',
            data: equip2,
            borderWidth: 1,
            pointBackgroundColor: '#F5C542',
            pointBorderColor: '#F5C542C',
            borderColor: '#F5C542',
            borderWidth: 2,
            fill:true
        },{
            label: 'C',
            data: equip3,
            borderWidth: 1,
            pointBackgroundColor: '#FF5C5C',
            pointBorderColor: '#FF5C5C',
            borderColor: '#FF5C5C',
            borderWidth: 2,
            fill:true
        }
    ]
    },
    options: {
    scales: {
        y: {
            beginAtZero: true,
            min: 0,
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
                text: 'Evolução Mensal Por Equipe',
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