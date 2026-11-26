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
// MATRIZ DE RISCO - CRITICIDADE ALERTAS X PREJUIZO ESTIMADO ------------
// ----------------------------------------------------------------------

// Definição do json de consumo
const criticidadePrejuizo = [
    {
        'id': 1,
        'servidor': 'SVR-01',
        'equipe': 'Equipe Alertas',
        'criticidade_alertas': 1,
        'prejuizo_estimado': 2,
        'valor_prejuizo': 2000000.00
    },
    {
        'id': 2,
        'servidor': 'SVR-02',
        'equipe': 'Equipe Infraestrutura',
        'criticidade_alertas': 1,
        'prejuizo_estimado': 2,
        'valor_prejuizo': 500000.00
    },
    {
        'id': 3,
        'servidor': 'SVR-03',
        'equipe': 'Equipe Análistas',
        'criticidade_alertas': 1,
        'prejuizo_estimado': 2,
        'valor_prejuizo': 100000.00
    },
    {
        'id': 4,
        'servidor': 'SVR-06',
        'equipe': 'Equipe Analistas',
        'criticidade_alertas': 3,
        'prejuizo_estimado': 1,
        'valor_prejuizo': 200000.00
    }
]

// Variáveis de tratamento
let id = [];
let servidor = [];
let equipe = [];
let c_alertas = [];
let prejuizo_e = [];
let v_prejuizo = [];

// Função de tratamento
function tratarCriticidadePrejuizo(criticidadePrejuizo) {
    for (let i = 0; i < criticidadePrejuizo.length; i++) {
        id.push(criticidadePrejuizo[i].id)
        servidor.push(criticidadePrejuizo[i].servidor)
        equipe.push(criticidadePrejuizo[i].equipe)
        c_alertas.push(criticidadePrejuizo[i].criticidade_alertas)
        prejuizo_e.push(criticidadePrejuizo[i].prejuizo_estimado)
        v_prejuizo.push(criticidadePrejuizo[i].valor_prejuizo)
    }

    return id, servidor, equipe, c_alertas, prejuizo_e, v_prejuizo;
}
tratarCriticidadePrejuizo(criticidadePrejuizo);

const formatarValor = valor => valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});


baixa_baixo = document.getElementById('baixa-baixo')
baixa_medio = document.getElementById('baixa-medio')
baixa_alto = document.getElementById('baixa-alto')
media_baixo = document.getElementById('media-baixo')
media_medio = document.getElementById('media-medio')
media_alto = document.getElementById('media-alto')
critica_baixo = document.getElementById('critica-baixo')
critica_medio = document.getElementById('critica-medio')
critica_alto = document.getElementById('critica-alto')

srv_bb = []
srv_bm = []
srv_ba = []
srv_mb = []
srv_mm = []
srv_ma = []
srv_cb = []
srv_cm = []
srv_ca = []

for (let i = 0; i < id.length; i++) {
    item = {
        'servidor': servidor[i],
        'equipe': equipe[i],
        'valor': v_prejuizo[i]
    }
    if (c_alertas[i] == 1 && prejuizo_e[i] == 1) {
        srv_bb.push(item)
    } else if (c_alertas[i] == 1 && prejuizo_e[i] == 2) {
        srv_bm.push(item)
    } else if (c_alertas[i] == 1 && prejuizo_e[i] == 3) {
        srv_ba.push(item)
    } else if (c_alertas[i] == 2 && prejuizo_e[i] == 1) {
        srv_mb.push(item)
    } else if (c_alertas[i] == 2 && prejuizo_e[i] == 2) {
        srv_mm.push(item)
    } else if (c_alertas[i] == 2 && prejuizo_e[i] == 3) {
        srv_ma.push(item)
    } else if (c_alertas[i] == 3 && prejuizo_e[i] == 1) {
        srv_cb.push(item)
    } else if (c_alertas[i] == 3 && prejuizo_e[i] == 2) {
        srv_cm.push(item)
    } else if (c_alertas[i] == 3 && prejuizo_e[i] == 3) {
        srv_ca.push(item)
    } else {
        console.log("Nenhum servidor encontrado!");
    }
}

srv_bb.length != 0 ? baixa_baixo.innerHTML = `- R$ ${formatarValor(srv_bb[0].valor)}<br><span>${srv_bb[0].servidor}</span>` : baixa_baixo.innerHTML = `<span>--</span>`

srv_bm.length != 0 ? baixa_medio.innerHTML = `- R$ ${formatarValor(srv_bm[0].valor)}<br><span>${srv_bm[0].servidor}</span>` : baixa_medio.innerHTML = `<span>--</span>`

srv_ba.length != 0 ? baixa_alto.innerHTML = `- R$ ${formatarValor(srv_ba[0].valor)}<br><span>${srv_ba[0].servidor}</span>` : baixa_alto.innerHTML = `<span>--</span>`

srv_mb.length != 0 ? media_baixo.innerHTML = `- R$ ${formatarValor(srv_mb[0].valor)}<br><span>${srv_mb[0].servidor}</span>` : media_baixo.innerHTML = `<span>--</span>`

srv_mm.length != 0 ? media_medio.innerHTML = `- R$ ${formatarValor(srv_mm[0].valor)}<br><span>${srv_mm[0].servidor}</span>` : media_medio.innerHTML = `<span>--</span>`

srv_ma.length != 0 ? media_alto.innerHTML = `- R$ ${formatarValor(srv_ma[0].valor)}<br><span>${srv_ma[0].servidor}</span>` : media_alto.innerHTML = `<span>--</span>`

srv_cb.length != 0 ? critica_baixo.innerHTML = `- R$ ${formatarValor(srv_cb[0].valor)}<br><span>${srv_cb[0].servidor}</span>` : critica_baixo.innerHTML = `<span>--</span>`

srv_cm.length != 0 ? critica_medio.innerHTML = `- R$ ${formatarValor(srv_cm[0].valor)}<br><span>${srv_cm[0].servidor}</span>` : critica_medio.innerHTML = `<span>--</span>`

srv_ca.length != 0 ? critica_alto.innerHTML = `- R$ ${formatarValor(srv_ca[0].valor)}<br><span>${srv_ca[0].servidor}</span>` : critica_alto.innerHTML = `<span>--</span>`

let total_bb = 0;
let total_bm = 0;
let total_ba = 0;
let total_mb = 0;
let total_mm = 0;
let total_ma = 0;
let total_cb = 0;
let total_cm = 0;
let total_ca = 0;


total_bb = srv_bb.reduce((acc, s) => acc + s.valor, 0);
total_bm = srv_bm.reduce((acc, s) => acc + s.valor, 0);
total_ba = srv_ba.reduce((acc, s) => acc + s.valor, 0);
total_mb = srv_bb.reduce((acc, s) => acc + s.valor, 0);
total_mm = srv_bb.reduce((acc, s) => acc + s.valor, 0);
total_ma = srv_bb.reduce((acc, s) => acc + s.valor, 0);
total_cb = srv_bb.reduce((acc, s) => acc + s.valor, 0);
total_cm = srv_bb.reduce((acc, s) => acc + s.valor, 0);
total_ca = srv_bb.reduce((acc, s) => acc + s.valor, 0);


srv_bb.length > 1 ? baixa_baixo.innerHTML = `- R$ ${formatarValor(total_bb)}<br><span>${srv_bb[0].servidor}, ${srv_bb[1].servidor}</span>` : baixa_baixo.innerHTML += ``

srv_bm.length > 1 ? baixa_medio.innerHTML = `- R$ ${formatarValor(total_bm)}<br><span>${srv_bm[0].servidor}, ${srv_bm[1].servidor}</span>` : baixa_medio.innerHTML += ``

srv_ba.length > 1 ? baixa_alto.innerHTML = `- R$ ${formatarValor(total_ba)}<br><span>${srv_ba[0].servidor}, ${srv_ba[1].servidor}</span>` : baixa_alto.innerHTML += ``

srv_mb.length > 1 ? media_baixo.innerHTML = `- R$ ${formatarValor(total_mb)}<br><span>${srv_mb[0].servidor}, ${srv_mb[1].servidor}</span>` : media_baixo.innerHTML += ``

srv_mm.length > 1 ? media_medio.innerHTML = `- R$ ${formatarValor(total_mm)}<br><span>${srv_mm[0].servidor}, ${srv_mm[1].servidor}</span>` : media_medio.innerHTML += ``

srv_ma.length > 1 ? media_alto.innerHTML = `- R$ ${formatarValor(total_ma)}<br><span>${srv_ma[0].servidor}, ${srv_ma[1].servidor}</span>` : media_alto.innerHTML += ``

srv_cb.length > 1 ? critica_baixo.innerHTML = `- R$ ${formatarValor(total_cb)}<br><span>${srv_cb[0].servidor}, ${srv_cb[1].servidor}</span>` : critica_baixo.innerHTML += ``

srv_cm.length > 1 ? critica_medio.innerHTML = `- R$ ${formatarValor(total_cm)}<br><span>${srv_cm[0].servidor}, ${srv_cm[1].servidor}</span>` : critica_medio.innerHTML += ``

srv_ca.length > 1 ? critica_alto.innerHTML = `- R$ ${formatarValor(total_ca)}<br><span>${srv_ca[0].servidor}, ${srv_ca[1].servidor}</span>` : critica_alto.innerHTML += ``



srv_bb.length > 2 ? baixa_baixo.innerHTML = `- R$ ${formatarValor(total_bb)}<br><span>${srv_bb[0].servidor}, ${srv_bb[1].servidor} ...</span>` : baixa_baixo.innerHTML += ``

srv_bm.length > 2 ? baixa_medio.innerHTML = `- R$ ${formatarValor(total_bm)}<br><span>${srv_bm[0].servidor}, ${srv_bm[1].servidor} ...</span>` : baixa_medio.innerHTML += ``

srv_ba.length > 2 ? baixa_alto.innerHTML = `- R$ ${formatarValor(total_ba)}<br><span>${srv_ba[0].servidor}, ${srv_ba[1].servidor} ...</span>` : baixa_alto.innerHTML += ``

srv_mb.length > 2 ? media_baixo.innerHTML = `- R$ ${formatarValor(total_mb)}<br><span>${srv_mb[0].servidor}, ${srv_mb[1].servidor} ...</span>` : media_baixo.innerHTML += ``

srv_mm.length > 2 ? media_medio.innerHTML = `- R$ ${formatarValor(total_mm)}<br><span>${srv_mm[0].servidor}, ${srv_mm[1].servidor} ...</span>` : media_medio.innerHTML += ``

srv_ma.length > 2 ? media_alto.innerHTML = `- R$ ${formatarValor(total_ma)}<br><span>${srv_ma[0].servidor}, ${srv_ma[1].servidor} ...</span>` : media_alto.innerHTML += ``

srv_cb.length > 2 ? critica_baixo.innerHTML = `- R$ ${formatarValor(total_cb)}<br><span>${srv_cb[0].servidor}, ${srv_cb[1].servidor} ...</span>` : critica_baixo.innerHTML += ``

srv_cm.length > 2 ? critica_medio.innerHTML = `- R$ ${formatarValor(total_cm)}<br><span>${srv_cm[0].servidor}, ${srv_cm[1].servidor} ...</span>` : critica_medio.innerHTML += ``

srv_ca.length > 2 ? critica_alto.innerHTML = `- R$ ${formatarValor(total_ca)}<br><span>${srv_ca[0].servidor}, ${srv_ca[1].servidor} ...</span>` : critica_alto.innerHTML += ``







// ----------------------------------------------------------------------
// AÇÃO RÁPIDA - SERVIDORES MAIS AFETADOS POR PRIORIDADE ----------------
// ----------------------------------------------------------------------

const listaServidores = [
    {
        'id': 1,
        'servidor': 'SVR-01',
        'equipe': 'Alertas',
        'risco_queda': 90,
        'alertas_ativos': 22,
        'problema': ['CPU', 'RAM', 'DISCO']
    },
    {
        'id': 2,
        'servidor': 'SVR-02',
        'equipe': 'Infraestrutura',
        'risco_queda': 60,
        'alertas_ativos': 10,
        'problema': ['RAM', 'DISCO']
    },
    {
        'id': 3,
        'servidor': 'SVR-03',
        'equipe': 'Análistas',
        'risco_queda': 40,
        'alertas_ativos': 3,
        'problema': ['CPU','DISCO']
    },
    {
        'id': 4,
        'servidor': 'SVR-06',
        'equipe': 'Analistas',
        'risco_queda': 20,
        'alertas_ativos': 3,
        'problema': ['DISCO']
    }
]

// Variáveis de tratamento
let id_lista = [];
let servidor_lista = [];
let equipe_lista = [];
let risco_queda = [];
let alertas_ativos = [];
let problema = [];

// Função de tratamento
function tratarListaServidores(listaServidores) {
    for (let i = 0; i < listaServidores.length; i++) {
        id_lista.push(listaServidores[i].id)
        servidor_lista.push(listaServidores[i].servidor)
        equipe_lista.push(listaServidores[i].equipe)
        risco_queda.push(listaServidores[i].risco_queda)
        alertas_ativos.push(listaServidores[i].alertas_ativos)
        problema.push(listaServidores[i].problema)
    }

    return id_lista, servidor_lista, equipe, risco_queda, alertas_ativos, problema;
}
tratarListaServidores(listaServidores);

lista = document.getElementById('lista-servidores-prioridade')

let cor_barra = 'branco-default'

for (let i = 0; i < id_lista.length; i++) {
    if (risco_queda[i] <= 33) {
        cor_barra = 'verde-ativo'
    } else if (risco_queda[i] <= 66) {
        cor_barra = 'amarelo-atencao'
    } else {
        cor_barra = 'vermelho-inativo'
    }

    problemas = problema[i].slice(0, 3);

    lista.innerHTML += `
                        <tr>
                            <td>${id_lista[i]}</td>
                            <td>${servidor_lista[i]}</td>
                            <td>${equipe_lista[i]}</td>
                            <td class="td-barra">
                                <p>${risco_queda[i]}%</p> 
                                <div class="barra-fundo">
                                    <span class="barra-preenchimento" style="width: ${risco_queda[i]}%; background-color: var(--cor-${cor_barra});"></span>
                                </div>
                            </td>
                            <td class="qtd-a">${alertas_ativos[i]}</td>
                            <td style="color: var(--cor-${cor_barra})">${problemas}</td>
                            <td><a href="#">ver -></a></td>
                        </tr>
    `
    
}







// ----------------------------------------------------------------------
// KPIS - TRATAMENTO DE KPIS --------------------------------------------
// ----------------------------------------------------------------------

// KPI -- SERVIDORES ATIVOS
const servidoresAtivos = [
    {
        'qtdServidoresAtivos': 1,
        'qtdServidoresTotais': 3
    }
]

let sAtivos = servidoresAtivos[0].qtdServidoresAtivos;
let sTotais = servidoresAtivos[0].qtdServidoresTotais;
let sInativos = sTotais - sAtivos;

let kpiInativos = document.getElementById('kpi-s-inativos');
let kpiAtivos = document.getElementById('kpi-s-ativos');
let kpiTotais = document.getElementById('kpi-s-totais');
kpiServidoresBorder = document.getElementById('kpi-servidores-ativos')

if (sInativos > 1) {
    kpiInativos.innerHTML = `${sInativos} Servidores Inativos`;
    kpiAtivos.innerHTML = `${sAtivos}`;
    kpiTotais.innerHTML = `${sTotais}`;
    kpiInativos.classList.add('cor_vermelha')
    kpiInativos.classList.remove('cor_verde')
    kpiServidoresBorder.style.borderColor = "#FF5C5C"

} else if (sInativos > 0) {
    kpiInativos.innerHTML = `${sInativos} Servidor Inativo`;
    kpiAtivos.innerHTML = `${sAtivos}`;
    kpiTotais.innerHTML = `${sTotais}`;
    kpiInativos.classList.add('cor_vermelha')
    kpiInativos.classList.remove('cor_verde')
    kpiServidoresBorder.style.borderColor = "#FF5C5C"
} else {
    kpiInativos.innerHTML = `Nenhum servidor inativo`;
    kpiAtivos.innerHTML = `${sAtivos}`;
    kpiTotais.innerHTML = `${sTotais}`;
    kpiInativos.classList.add('cor_verde')
    kpiInativos.classList.remove('cor_vermelha')
    kpiServidoresBorder.style.borderColor = "#3DDC84"
}


// KPI -- UPTIME ATUAL
const uptimeEmMinutos = [
    {
        'uptimeMin': 476.5
    }
]

let tempotTotal = 526; // 526 minutos = 8h46m
let mesAtual = new Date().getMonth() + 1;
let uptimeMensal = 43.33;
let uptimeEsperado = uptimeMensal * mesAtual;
let uptimeMin = uptimeEmMinutos[0].uptimeMin;

// Regra de 3
let uptimeAtualPercent = (uptimeMin * 100) / uptimeEsperado;

kpiUptime = document.getElementById('uptime-atual')

kpiUptime.innerHTML = `${uptimeAtualPercent.toFixed(2)}%`
kpiSla = document.getElementById('uptime-sla')
kpiUptimeBorder = document.getElementById('kpi-uptime-atual')

if (uptimeAtualPercent < 99.90) {    
    kpiSla.style.color = "#FF5C5C"
    kpiSla.innerHTML = `${(uptimeAtualPercent - 100).toFixed(2)}% abaixo da SLA`
    kpiUptimeBorder.style.borderColor = "#FF5C5C"
} else if (uptimeAtualPercent == 99.90) {
    kpiSla.style.color = "#5178F9"
    kpiSla.innerHTML = `De acordo com a SLA`
    kpiUptimeBorder.style.borderColor = "#5178F9"
} else {
    kpiSla.style.color = "#3DDC84"
    kpiSla.innerHTML = `${(100 - uptimeAtualPercent).toFixed(2)}% acima da SLA`
    kpiUptimeBorder.style.borderColor = "#3DDC84"
}



// KPI -- MTBF (Mean Time Between Fails)
const tempoEntreFalhasMin = [
    {
        'mtbfMinAtual': 93,
        'mtbfMinAnterior': 87
    }
]

let mtbfMin = tempoEntreFalhasMin[0].mtbfMinAtual
let mtbfAnterior = tempoEntreFalhasMin[0].mtbfMinAnterior

let kpiMtbf = document.getElementById('mtbf')
let kpiMtbfPercent = document.getElementById('mtbf-comparado')
let kpiMtbfBorder = document.getElementById('kpi-mtbf')

let kpiMtbfMin = mtbfMin % 60;
let kpiMtbfHoras = mtbfMin / 60;

let mtbfComparado = ((mtbfAnterior * 100) / mtbfMin) - 100;

if (kpiMtbfHoras < 1) {
    kpiMtbf.innerHTML = `${kpiMtbfMin}min`
} else {
    kpiMtbf.innerHTML = `${Math.floor(kpiMtbfHoras)}h${kpiMtbfMin}min`
}

if (mtbfComparado > 0) {
    kpiMtbfPercent.innerHTML = `${mtbfComparado.toFixed(1)}% mais rápida`
    kpiMtbfPercent.classList.add('cor_verde')
    kpiMtbfPercent.classList.remove('cor_vermelha')
    kpiMtbfBorder.style.borderColor = '#3DDC84'
} else if (mtbfComparado < 0) {
    kpiMtbfPercent.innerHTML = `${mtbfComparado.toFixed(1)}% mais lenta`
    kpiMtbfPercent.classList.add('cor_vermelha')
    kpiMtbfPercent.classList.remove('cor_verde')
    kpiMtbfBorder.style.borderColor = '#FF5C5C'
} else {
    kpiMtbfPercent.innerHTML = `Permanece igual`
    kpiMtbfPercent.classList.remove('cor_vermelha')
    kpiMtbfPercent.classList.remove('cor_verde')
    kpiMtbfBorder.style.borderColor = '#F5C542'
}



// KPI -- PREJUÍZO ATUAL X PREJUÍZO ESTIMADO
const prejuizoAtualEEstimado = [
    {
        'qtdAlertas': 5,
        'precoDowntime': 100000,
        'downtimeAtualMin': 95,
        'mttr': 93
    }
]

qtdAlertas = prejuizoAtualEEstimado[0].qtdAlertas
precoDowntime = prejuizoAtualEEstimado[0].precoDowntime
downtimeAtualMin = prejuizoAtualEEstimado[0].downtimeAtualMin
mttr = prejuizoAtualEEstimado[0].mttr

kpiPAtual = document.getElementById('p-atual')
kpiPEstimado = document.getElementById('p-estimado')
kpiDowntimeA = document.getElementById('downtime-atual')
kpiDowntimeE = document.getElementById('downtime-estimado')

let downtimeMin = downtimeAtualMin % 60;
let downtimeHoras = downtimeAtualMin / 60;

if (downtimeHoras < 1) {
    kpiDowntimeA.innerHTML = `Downtime: ${downtimeMin}min`
} else {
    kpiDowntimeA.innerHTML = `Downtime: ${Math.floor(downtimeHoras)}h${downtimeMin}min`
}

let precoDowntimeMin = precoDowntime / 60;

let downtimeEstimadoMin = qtdAlertas * mttr;

let prejuDowntimeEstimado = downtimeEstimadoMin * (precoDowntimeMin);
if (prejuDowntimeEstimado >= 1000) {
    kpiPEstimado.innerHTML = `+ R$ ${Math.floor(prejuDowntimeEstimado/1000)} mil`
    kpiPEstimado.style.color = '#FF5C5C'
} else if (prejuDowntimeEstimado > 0) {
    kpiPEstimado.innerHTML = `+ R$ ${formatarValor(prejuDowntimeEstimado)}`
    kpiPEstimado.style.color = '#F5C542'
} else if (prejuDowntimeEstimado == 0) {
    kpiPEstimado.innerHTML = `+ R$ ${formatarValor(prejuDowntimeEstimado)}`
    kpiPEstimado.style.color = '#3DDC84'
}

let downtimeEMin = downtimeEstimadoMin % 60;
let downtimeEHoras = downtimeEstimadoMin / 60;

if (downtimeEHoras < 1) {
    kpiDowntimeE.innerHTML = `Downtime: ${downtimeEMin}min`
} else {
    kpiDowntimeE.innerHTML = `Downtime: ${Math.floor(downtimeEHoras)}h${downtimeEMin}min`
}


let prejuDowntimeAtual = downtimeAtualMin * (precoDowntimeMin);

if (prejuDowntimeAtual >= 1000) {
    kpiPAtual.innerHTML = `R$ ${Math.floor(prejuDowntimeAtual/1000)} mil`
    kpiPAtual.style.color = '#FF5C5C'
} else if (prejuDowntimeAtual > 0) {
    kpiPAtual.innerHTML = `R$ ${formatarValor(prejuDowntimeAtual)}`
    kpiPAtual.style.color = '#F5C542'
} else if (prejuDowntimeAtual == 0) {
    kpiPAtual.innerHTML = `R$ ${formatarValor(prejuDowntimeAtual)}`
    kpiPAtual.style.color = '#3DDC84'
}