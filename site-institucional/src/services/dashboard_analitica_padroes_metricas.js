var COMPONENTES = ['cpu', 'ram', 'disco', 'rede'];
var COMPONENTES_DE_OCUPACAO = ['disco'];

var NOMES = {
    cpu: 'CPU',
    ram: 'RAM',
    disco: 'Disco',
    rede: 'Rede'
}

var FUSO = 'America/Sao_Paulo';

var UMA_HORA = 3600000;
var UM_DIA = 24 * UMA_HORA;


// Pontuação
var PESOS = {tempo: 0.5, alertas: 0.3, consumo: 0.2};
var ALERTAS_POR_NOTA_ZERO = 2;
var MINUTOS_MINIMOS_PONTUACAO = 60;

var formatoData = new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23'
});

var cacheData = new Map();

function partesData(timestamp) {
    var chave = Math.floor(timestamp / UMA_HORA);
    if (cacheData.has(chave)) return cacheData.get(chave);

    var partes = formatoData.formatToParts(new Date(timestamp));
    var valores = {};

    for (var i = 0; i< partes.length; i++) valores[partes[i].type] = partes[i].value;
    var resultado = {
        dia: valores.year + '-' + valores.month + '-' + valores.day, hora: Number(valores.hour)
    };
    if(cacheData.size > 50000) cacheData.clear();
    cacheData.set(chave, resultado);
    return resultado;
}

function arredondar(numero, casas) {
    if (numero === null || numero === undefined || !Number.isFinite(numero)) return null;
    var fator = Math.pow(10, casas === undefined ? 1 : casas);
    return Math.round(numero * fator) / fator;
}

function valorValido(valor) {
    return typeof valor === 'number' && Number.isFinite(valor) && valor >= 0 && valor <= 100;
}


function componentesDoServidor(servidor) {
    var lista = [];
    for (var i = 0; i < COMPONENTES.length; i++) {
        var c = COMPONENTES[i];
        var limite = servidor.limites[c];
        if (limite && (limite.atencao !== null || limite.critico !== null)) lista.push(c);
    }
    return lista;
}

