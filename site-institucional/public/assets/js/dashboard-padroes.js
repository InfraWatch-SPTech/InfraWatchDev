const CAMINHO_JSON = './public/exemplo-dados-local.json';

const componentes = {
    cpu: 'CPU',
    ram: 'RAM',
    disco: 'DISCO',
}

cores = {
    cpu: '#5178F9',
    ram: '#6FE0FF',
    disco: '#F5C542',
}

const formatoData = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
})

let dadosAtuais;
let amostrasServidor = [];
let recortes = [];
let dias = [];
let graficos = {};
let calor;


/* Pra ler o json (ainda está local) */

async function carregarDados(){
    try {
        const response = await fetch(CAMINHO_JSON);
        if (!response.ok) {
            throw new Error(`Erro ao carregar o arquivo JSON: ${response.status} ${response.statusText}`);
        }

        const dados_carregados = await response.json();
        
        /* botar a função de atualizar os dados do dashboard */

    }catch (error) {
        console.error('Erro ao carregar o arquivo JSON:', error);
    }
}


function elemento(id) {
    return document.getElementById(id);
}

function texto(id, valor) {
    elemento(id).textContent = valor;
}

function mostrarErro(mensagem) {
    texto('erro', mensagem);
    elemento('erro').hidden = false;
}

function partesData(timestamp) {
    const partes = formatoData.formatToParts(new Date(timestamp));
    const valores = {};

    for (let i = 0; i < partes.length; i++) {
        valores[partes[i].type] = partes[i].value;
    }

    return {
        dia: valores.year + '-' + valores.month + '-' + valores.day,
        hora: Number(valores.hour)
    };
}

function dataCurta(dia) {
    return dia.slice(8, 10) + '/' + dia.slice(5, 7);
}

function duracao(minutos) {
    const total = Math.round(minutos);
    const horas = Math.floor(total / 60);
    const restantes = String(total % 60).padStart(2, '0');

    return horas + 'h ' + restantes + 'min';
}

function percentual(numero) {
    if (numero === null) {
        return 'Sem dados';
    }

    return numero.toLocaleString('pt-BR', {
        maximumFractionDigits: 1
    }) + '%';
}

function fimSemana(dia) {
    const numeroDia = new Date(dia + 'T12:00:00Z').getUTCDay();
    return numeroDia === 0 || numeroDia === 6;
}

function servidorAtual() {
    return dadosAtuais.servidores.find(function (servidor) {
        return servidor.id === elemento('servidor').value;
    });
}

function limite(componente) {
    return servidorAtual().criticos[componente] - 10;
}

function emCritico(recorte, componente) {
    const valor = recorte.amostra[componente];
    const critico = servidorAtual().criticos[componente];

    return valor !== null && valor >= critico;
}

function emAtencao(recorte, componente) {
    const valor = recorte.amostra[componente];

    return valor !== null && valor >= limite(componente);
}

function opcoesComponente(classe, somenteProcessos) {
    const seletores = document.querySelectorAll('.' + classe);

    for (let i = 0; i < seletores.length; i++) {
        for (const componente in componentes) {
            if (somenteProcessos && componente === 'disco') {
                continue;
            }

            seletores[i].add(
                new Option(componentes[componente], componente)
            );
        }
    }
}

function tabela(id, linhas) {
    const corpo = elemento(id);
    corpo.replaceChildren();

    for (let i = 0; i < linhas.length; i++) {
        const linha = document.createElement('tr');

        for (let j = 0; j < linhas[i].length; j++) {
            const celula = document.createElement('td');
            celula.textContent = linhas[i][j];
            linha.appendChild(celula);
        }

        corpo.appendChild(linha);
    }
}




function atualizarDashboard(dados) {
    dadosAtuais = dados;
    amostrasServidor = dadosAtuais.amostras;
    recortes = dadosAtuais.recortes;
    dias = dadosAtuais.dias;
}
