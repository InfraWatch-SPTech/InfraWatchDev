// ============================================================
// MÉTRICAS DA DASHBOARD "HISTÓRICO E PADRÕES" (Matheus)
// ------------------------------------------------------------
// Recebe as amostras da Gold e os servidores/limites do MySQL.
// Devolve KPIs, gráficos e comparação histórica do mesmo servidor.
// ============================================================

var COMPONENTES = ['cpu', 'ram', 'disco', 'rede'];
// Disco = espaço ocupado (não é uso). Fica fora da escolha automática e das KPIs de uso.
var COMPONENTES_DE_USO = ['cpu', 'ram', 'rede'];
var NOMES = { cpu: 'CPU', ram: 'RAM', disco: 'Disco', rede: 'Rede' };

// KPI "Maior aumento de consumo"
var MINUTOS_MINIMOS_PERIODO = 30;     // menos que isso = "Sem dados suficientes"
var PERIODOS = {
    almoco: 'Almoço 12h–14h',
    jantar: 'Jantar 18h–20h',
    quinto_dia_util: '5º dia útil',
    feriado: 'Feriados',
    fim_semana: 'Fim de semana'
};
// Feriados nacionais (inclui Sexta-feira Santa). Acrescente os próximos anos aqui.
var FERIADOS = [
    '2025-01-01', '2025-04-18', '2025-04-21', '2025-05-01', '2025-09-07', '2025-10-12', '2025-11-02', '2025-11-15', '2025-11-20', '2025-12-25',
    '2026-01-01', '2026-04-03', '2026-04-21', '2026-05-01', '2026-09-07', '2026-10-12', '2026-11-02', '2026-11-15', '2026-11-20', '2026-12-25',
    '2027-01-01', '2027-03-26', '2027-04-21', '2027-05-01', '2027-09-07', '2027-10-12', '2027-11-02', '2027-11-15', '2027-11-20', '2027-12-25'
];

var UM_DIA = 86400000;
var TRES_HORAS = 3 * 3600000; // São Paulo = UTC-3 (sem horário de verão desde 2019)

// casas = 2 para minutos e médias · casas = 1 para percentuais e notas
function arredondar(numero, casas) {
    if (numero === null || numero === undefined || !isFinite(numero)) return null;
    var fator = casas === 1 ? 10 : 100;
    return Math.round(numero * fator) / fator;
}

function valorValido(valor) {
    return typeof valor === 'number' && isFinite(valor) && valor >= 0 && valor <= 100 ? valor : null;
}

// ============================================================
// 1. PREPARAÇÃO DAS AMOSTRAS
// ============================================================

// Somente limites numéricos finitos são configurações ativas (zero é válido).
function limiteValido(valor) {
    return typeof valor === 'number' && isFinite(valor) && valor >= 0;
}

function componentesDoServidor(servidor) {
    var lista = [];
    for (var i = 0; i < COMPONENTES.length; i++) {
        var c = COMPONENTES[i];
        var limite = servidor.limites[c];
        if (limite && (limiteValido(limite.atencao) || limiteValido(limite.critico))) lista.push(c);
    }
    return lista;
}

function dataSP(timestamp) {
    return new Date(timestamp - TRES_HORAS).toISOString().slice(0, 10);
}

// Contrato Gold: intervalos (início inclusivo, fim exclusivo) de até 5 minutos.
// Não prolonga amostras nem preenche lacunas. Linhas sem qualquer recurso válido
// não constituem coleta válida. Sobreposição: vence a coleta de início mais
// recente; início empatado: última linha recebida. A linha inteira vence,
// inclusive seus nulls, evitando combinar recursos de coletas diferentes.
function prepararAmostras(amostrasGold, servidorId) {
    var eventos = [];
    for (var i = 0; i < amostrasGold.length; i++) {
        var a = amostrasGold[i];
        if (!a || String(a.servidor_id) !== String(servidorId)) continue;
        var inicio = Date.parse(a.inicio);
        var fim = Date.parse(a.fim);
        if (!(fim > inicio) || fim - inicio > 300000) continue;
        var item = { inicio: inicio, fim: fim, ordem: i,
            processos: Array.isArray(a.processos) ? a.processos : [] };
        var valido = false;
        for (var c = 0; c < COMPONENTES.length; c++) {
            item[COMPONENTES[c]] = valorValido(a[COMPONENTES[c]]);
            if (item[COMPONENTES[c]] !== null) valido = true;
        }
        if (!valido) continue;
        eventos.push({ tempo: inicio, entra: true, item: item });
        eventos.push({ tempo: fim, entra: false, item: item });
    }
    eventos.sort(function (a, b) { return a.tempo - b.tempo; });
    // Heap por prioridade: evita varrer todos os intervalos para cada fronteira.
    var heap = [];
    function prioridade(a, b) { return a.inicio > b.inicio || (a.inicio === b.inicio && a.ordem > b.ordem); }
    function inserir(a) {
        heap.push(a);
        var k = heap.length - 1;
        while (k > 0) {
            var p = Math.floor((k - 1) / 2);
            if (!prioridade(heap[k], heap[p])) break;
            var temp = heap[p]; heap[p] = heap[k]; heap[k] = temp; k = p;
        }
    }
    function removerTopo() {
        var ultimo = heap.pop();
        if (!heap.length) return;
        heap[0] = ultimo;
        var k = 0;
        while (true) {
            var melhor = k;
            var esq = 2 * k + 1;
            var dir = esq + 1;
            if (esq < heap.length && prioridade(heap[esq], heap[melhor])) melhor = esq;
            if (dir < heap.length && prioridade(heap[dir], heap[melhor])) melhor = dir;
            if (melhor === k) break;
            var temp = heap[k]; heap[k] = heap[melhor]; heap[melhor] = temp; k = melhor;
        }
    }
    var lista = [];
    var e = 0;
    while (e < eventos.length) {
        var tempo = eventos[e].tempo;
        while (e < eventos.length && eventos[e].tempo === tempo) {
            if (eventos[e].entra) inserir(eventos[e].item);
            e++;
        }
        while (heap.length && heap[0].fim <= tempo) removerTopo();
        if (!heap.length || e === eventos.length) continue;
        var proximo = eventos[e].tempo;
        if (proximo <= tempo) continue;
        var vencedor = heap[0];
        var anterior = lista[lista.length - 1];
        if (anterior && anterior.fim === tempo && anterior.origem === vencedor) anterior.fim = proximo;
        else lista.push({ inicio: tempo, fim: proximo, origem: vencedor });
    }
    return lista;
}

// N dias civis de São Paulo, até o fim exclusivo do último dia com coleta.
// Corta a linha em hora/dia e limites da janela ANTES de agregar qualquer KPI.
function amostrasDaJanela(lista, inicio, fim) {
    var amostras = [];
    var dias = [];
    if (inicio === null || fim === null) return { dias: dias, amostras: amostras };
    for (var dia = Date.parse(dataSP(inicio) + 'T03:00:00Z'); dia < fim; dia += UM_DIA) dias.push(dataSP(dia));
    for (var i = 0; i < lista.length; i++) {
        var linha = lista[i];
        var a = linha.origem;
        var cursor = Math.max(linha.inicio, inicio);
        var final = Math.min(linha.fim, fim);
        while (cursor < final) {
            var corte = Math.min(final, (Math.floor(cursor / 3600000) + 1) * 3600000);
            var data = dataSP(cursor);
            amostras.push({ inicio: cursor, fim: corte, minutos: (corte - cursor) / 60000,
                dia: data, hora: new Date(cursor - TRES_HORAS).getUTCHours(),
                cpu: a.cpu, ram: a.ram, disco: a.disco, rede: a.rede,
                processos: a.processos, origem: a.ordem,
                feriado: FERIADOS.indexOf(data) >= 0, quintoDiaUtil: quintoDiaUtil(data) });
            cursor = corte;
        }
    }
    return { dias: dias, amostras: amostras };
}

// ============================================================
// 2. ESTADO DE CADA VALOR
// ============================================================

function emCritico(valor, limite) {
    return valor !== null && limiteValido(limite.critico) && valor >= limite.critico;
}

function emAtencao(valor, limite) {
    return valor !== null && (emCritico(valor, limite) || (limiteValido(limite.atencao) && valor >= limite.atencao));
}

// ============================================================
// 3. RESUMO DE UM COMPONENTE (período todo ou um dia)
// ------------------------------------------------------------
// alerta  = início de uma sequência em atenção (amostras seguidas contam 1)
// entrada = passou de abaixo do crítico para crítico sem lacuna
// ============================================================

function resumo(amostras, componente, limite, dia) {
    var r = { observado: 0, atencao: 0, critico: 0, soma: 0, mediaPonderada: 0, m2: 0, alertas: 0, entradas: 0, diasAtencao: [], horas: [] };
    for (var h = 0; h < 24; h++) r.horas.push({ minutos: 0, dias: [] });

    var anterior = null;
    for (var i = 0; i < amostras.length; i++) {
        var a = amostras[i];
        var valor = a[componente];
        var seguida = anterior && anterior.fim === a.inicio;
        var valorAnterior = seguida ? anterior[componente] : null;
        anterior = a;
        if (dia && a.dia !== dia) continue;
        if (valor === null) continue;

        // Welford ponderado: variância populacional, estável mesmo em valores próximos.
        var delta = valor - r.mediaPonderada;
        r.observado += a.minutos;
        r.mediaPonderada += delta * a.minutos / r.observado;
        r.m2 += a.minutos * delta * (valor - r.mediaPonderada);
        r.soma += valor * a.minutos;
        if (emCritico(valor, limite)) {
            r.critico += a.minutos;
            if (valorAnterior !== null && !emCritico(valorAnterior, limite)) r.entradas++;
        }
        if (emAtencao(valor, limite)) {
            r.atencao += a.minutos;
            if (!emAtencao(valorAnterior, limite)) r.alertas++;
            if (r.diasAtencao.indexOf(a.dia) < 0) r.diasAtencao.push(a.dia);
            r.horas[a.hora].minutos += a.minutos;
            if (r.horas[a.hora].dias.indexOf(a.dia) < 0) r.horas[a.hora].dias.push(a.dia);
        }
    }
    return r;
}

// Faixa de 1 h com atenção em mais dias (desempate: mais minutos)
function horarioRecorrente(r) {
    var melhor = null;
    for (var h = 0; h < 24; h++) {
        var atual = r.horas[h];
        if (!atual.dias.length) continue;
        if (!melhor || atual.dias.length > melhor.dias ||
            (atual.dias.length === melhor.dias && atual.minutos > melhor.minutos)) {
            melhor = { hora: h, dias: atual.dias.length, minutos: arredondar(atual.minutos) };
        }
    }
    return melhor;
}

// Hora com mais minutos em atenção (tabela do ranking)
function horaComMaisAtencao(r) {
    var melhor = null;
    for (var h = 0; h < 24; h++) {
        if (r.horas[h].minutos > 0 && (melhor === null || r.horas[h].minutos > r.horas[melhor].minutos)) melhor = h;
    }
    return melhor;
}

function resumoPeriodo(amostras, componente, limite) {
    var r = resumo(amostras, componente, limite, null);
    return {
        observado: arredondar(r.observado),
        atencao: arredondar(r.atencao),
        critico: arredondar(r.critico),
        percentual_atencao: r.observado ? arredondar(100 * r.atencao / r.observado, 1) : null,
        dias_atencao: r.diasAtencao.length,
        media: r.observado ? arredondar(r.soma / r.observado) : null,
        alertas: r.alertas,
        desvio_padrao: r.observado ? arredondar(Math.sqrt(Math.max(0, r.m2 / r.observado))) : null,
        horario: horarioRecorrente(r)
    };
}

// ============================================================
// 4. KPI 1 E COMPONENTE PADRÃO DOS SELETORES
// ------------------------------------------------------------
// Ordem: 1º mais tempo em atenção · 2º mais alertas · 3º maior média
// ============================================================

function componentePadrao(resumos, lista) {
    var melhor = null;
    for (var i = 0; i < lista.length; i++) {
        var c = lista[i];
        var r = resumos[c];
        if (!r.observado || COMPONENTES_DE_USO.indexOf(c) < 0) continue;
        var m = melhor ? resumos[melhor] : null;
        if (!m || r.atencao > m.atencao ||
            (r.atencao === m.atencao && r.alertas > m.alertas) ||
            (r.atencao === m.atencao && r.alertas === m.alertas && r.media > m.media)) melhor = c;
    }
    if (melhor) return melhor;
    // Nenhum componente de uso com coleta: usa o primeiro com coleta (ex.: disco)
    for (var j = 0; j < lista.length; j++) {
        if (resumos[lista[j]].observado) return lista[j];
    }
    return lista[0] || null;
}

// Empates aparecem juntos (ex.: "CPU / RAM")
function maisTempoEmAtencao(resumos, lista) {
    var maior = null;
    for (var i = 0; i < lista.length; i++) {
        var c = lista[i];
        var r = resumos[c];
        if (!r.observado || COMPONENTES_DE_USO.indexOf(c) < 0) continue;
        if (!maior || r.atencao > maior.atencao) {
            maior = { componentes: [c], atencao: r.atencao, percentual: r.percentual_atencao, alertas: r.alertas };
        } else if (r.atencao === maior.atencao) {
            maior.componentes.push(c);
            maior.alertas += r.alertas;
        }
    }
    return maior;
}

// ============================================================
// 5. MAIOR AUMENTO: média dentro do período menos média fora, em p.p.
// ============================================================

function diaDaSemana(dia) {
    return new Date(dia + 'T12:00:00Z').getUTCDay(); // 0 = domingo, 6 = sábado
}

function diaUtil(dia) {
    var semana = diaDaSemana(dia);
    return semana !== 0 && semana !== 6 && FERIADOS.indexOf(dia) < 0;
}

// Conta os dias úteis do dia 1 até o dia informado
function quintoDiaUtil(dia) {
    if (!diaUtil(dia)) return false;
    var contador = 0;
    for (var d = 1; d <= Number(dia.slice(8, 10)); d++) {
        if (diaUtil(dia.slice(0, 8) + String(d).padStart(2, '0'))) contador++;
    }
    return contador === 5;
}

function dentroDoPeriodo(amostra, periodo) {
    if (periodo === 'almoco') return amostra.hora === 12 || amostra.hora === 13;
    if (periodo === 'jantar') return amostra.hora === 18 || amostra.hora === 19;
    if (periodo === 'fim_semana') return diaDaSemana(amostra.dia) === 0 || diaDaSemana(amostra.dia) === 6;
    if (periodo === 'quinto_dia_util') return amostra.quintoDiaUtil;
    return periodo === 'feriado' && amostra.feriado;
}

function aumentoNoPeriodo(amostras, periodo, lista) {
    var componentes = [];
    for (var i = 0; i < lista.length; i++) {
        var c = lista[i];
        // Disco representa ocupação, não consumo de processamento.
        if (COMPONENTES_DE_USO.indexOf(c) < 0) continue;
        var dentro = { minutos: 0, soma: 0 };
        var fora = { minutos: 0, soma: 0 };
        for (var j = 0; j < amostras.length; j++) {
            var a = amostras[j];
            if (a[c] === null) continue;
            var grupo = dentroDoPeriodo(a, periodo) ? dentro : fora;
            grupo.minutos += a.minutos;
            grupo.soma += a[c] * a.minutos;
        }
        var suficiente = dentro.minutos >= MINUTOS_MINIMOS_PERIODO &&
            fora.minutos >= MINUTOS_MINIMOS_PERIODO;
        var mediaDentro = dentro.minutos ? dentro.soma / dentro.minutos : null;
        var mediaFora = fora.minutos ? fora.soma / fora.minutos : null;
        componentes.push({
            componente: c,
            suficiente: suficiente,
            dentro: arredondar(mediaDentro, 1),
            fora: arredondar(mediaFora, 1),
            diferenca: suficiente ? arredondar(mediaDentro - mediaFora, 1) : null,
            minutos_dentro: arredondar(dentro.minutos),
            minutos_fora: arredondar(fora.minutos)
        });
    }
    var validos = componentes.filter(function (c) { return c.suficiente; });
    validos.sort(function (a, b) { return b.diferenca - a.diferenca; });
    return {
        nome: PERIODOS[periodo],
        minutos_minimos: MINUTOS_MINIMOS_PERIODO,
        suficiente: validos.length > 0,
        destaque: validos.length ? validos[0] : null,
        maior: validos.length && validos[0].diferenca > 0 ? validos[0] : null,
        componentes: componentes
    };
}

// ============================================================
// 6. PROCESSOS — segunda a sexta × sábado e domingo
// ------------------------------------------------------------
// Cada nome e recurso usa apenas os minutos em que o valor foi observado.
// A Gold fornece top processos: ausência não demonstra consumo zero.
// CPU de processo pode ultrapassar 100% (múltiplos núcleos).
function processosNaSemana(amostras, componente) {
    var minutos = { dentro: 0, fora: 0 };
    var somas = Object.create(null);
    for (var i = 0; i < amostras.length; i++) {
        var a = amostras[i];
        var semana = diaDaSemana(a.dia);
        var grupo = semana !== 0 && semana !== 6 ? 'dentro' : 'fora';
        var vistos = Object.create(null);
        var teveValor = false;
        // Nome é a identidade disponível. Se repetido na mesma coleta, vence
        // a última observação válida: não duplica duração nem soma percentuais.
        for (var j = 0; j < a.processos.length; j++) {
            var p = a.processos[j];
            if (!p || typeof p.nome !== 'string' || !p.nome.trim()) continue;
            var valor = p[componente];
            if (typeof valor !== 'number' || !isFinite(valor) || valor < 0) continue;
            vistos[p.nome] = valor;
        }
        for (var nome in vistos) {
            if (!somas[nome]) somas[nome] = { dentro: 0, fora: 0, minutosDentro: 0, minutosFora: 0 };
            somas[nome][grupo] += vistos[nome] * a.minutos;
            somas[nome][grupo === 'dentro' ? 'minutosDentro' : 'minutosFora'] += a.minutos;
            teveValor = true;
        }
        if (teveValor) minutos[grupo] += a.minutos;
    }
    var lista = [];
    for (var nome in somas) {
        var r = somas[nome];
        var dentro = r.minutosDentro ? arredondar(r.dentro / r.minutosDentro) : null;
        var fora = r.minutosFora ? arredondar(r.fora / r.minutosFora) : null;
        lista.push({ nome: nome, dentro: dentro, fora: fora,
            diferenca: dentro !== null && fora !== null ? arredondar(dentro - fora) : null });
    }
    var liderDentro = null;
    var liderFora = null;
    for (var k = 0; k < lista.length; k++) {
        if (lista[k].dentro !== null && (!liderDentro || lista[k].dentro > liderDentro.valor)) liderDentro = { nome: lista[k].nome, valor: lista[k].dentro };
        if (lista[k].fora !== null && (!liderFora || lista[k].fora > liderFora.valor)) liderFora = { nome: lista[k].nome, valor: lista[k].fora };
    }
    var cresceram = lista.filter(function (p) { return p.diferenca > 0; });
    cresceram.sort(function (x, y) { return y.diferenca - x.diferenca; });
    lista.sort(function (x, y) { return Math.max(y.dentro || 0, y.fora || 0) - Math.max(x.dentro || 0, x.fora || 0); });
    return {
        minutos_uteis: arredondar(minutos.dentro),
        minutos_fim_semana: arredondar(minutos.fora),
        lista: lista.slice(0, 5), lider_dentro: liderDentro, lider_fora: liderFora,
        cresceram: cresceram.slice(0, 2).map(function (p) { return p.nome; }),
        limitacao: 'A Gold contém apenas os maiores processos de cada coleta. Médias por nome usam somente observações disponíveis; ausência e null não são zero. Não representam o consumo total nem permitem concluir inatividade.'
    };
}

// ============================================================
// 7. GRÁFICOS: RANKING E MAPA DE CALOR
// ============================================================

// Chave "periodo" = período todo (mesma base das KPIs) + uma chave por dia
function rankingPorDia(amostras, lista, limites, diasComColeta) {
    var resultado = {};
    var chaves = ['periodo'].concat(diasComColeta);
    for (var d = 0; d < chaves.length; d++) {
        var dia = chaves[d] === 'periodo' ? null : chaves[d];
        resultado[chaves[d]] = {};
        for (var i = 0; i < lista.length; i++) {
            var c = lista[i];
            var r = resumo(amostras, c, limites[c], dia);
            resultado[chaves[d]][c] = {
                observado: arredondar(r.observado),
                atencao: arredondar(r.atencao),
                critico: limiteValido(limites[c].critico) ? arredondar(r.critico) : null,
                critico_configurado: limiteValido(limites[c].critico),
                entradas_criticas: limiteValido(limites[c].critico) ? r.entradas : null,
                hora: horaComMaisAtencao(r)
            };
        }
    }
    return resultado;
}

// matriz[dia][hora] = [minutos em atenção, minutos em crítico, minutos observados]
function mapaCalor(amostras, lista, limites, diasComColeta) {
    var resultado = {};
    for (var i = 0; i < lista.length; i++) {
        var c = lista[i];
        var matriz = [];
        for (var d = 0; d < diasComColeta.length; d++) {
            var linha = [];
            for (var h = 0; h < 24; h++) linha.push([0, 0, 0]);
            matriz.push(linha);
        }
        for (var j = 0; j < amostras.length; j++) {
            var a = amostras[j];
            if (a[c] === null) continue;
            var celula = matriz[diasComColeta.indexOf(a.dia)][a.hora];
            celula[2] += a.minutos;
            if (emAtencao(a[c], limites[c])) celula[0] += a.minutos;
            if (emCritico(a[c], limites[c])) celula[1] += a.minutos;
        }
        resultado[c] = matriz.map(function (linhaDia) {
            return linhaDia.map(function (cel) { return [arredondar(cel[0]), arredondar(cel[1]), arredondar(cel[2])]; });
        });
    }
    return resultado;
}

// ============================================================
// 8. HISTÓRICO DO MESMO SERVIDOR — sem índice ou nota arbitrária
// ============================================================

function resumoComparacao(amostras, lista, limites, duracao) {
    var criticos = [];
    for (var i = 0; i < lista.length; i++) {
        if (limiteValido(limites[lista[i]].critico)) criticos.push(lista[i]);
    }
    var observado = 0;
    var critico = 0;
    for (var j = 0; j < amostras.length; j++) {
        var a = amostras[j];
        var completo = true;
        var emAlgumCritico = false;
        for (var k = 0; k < criticos.length; k++) {
            var c = criticos[k];
            if (a[c] === null) completo = false;
            if (emCritico(a[c], limites[c])) emAlgumCritico = true;
        }
        if (criticos.length && completo) {
            observado += a.minutos;
            if (emAlgumCritico) critico += a.minutos;
        }
    }
    function desvio(c) {
        // CPU/RAM independem de ter limite crítico, mas precisam estar ativos.
        return lista.indexOf(c) >= 0 ? resumoPeriodo(amostras, c, limites[c]).desvio_padrao : null;
    }
    function coberturaComponente(c) {
        if (lista.indexOf(c) < 0) return null;
        var minutos = 0;
        for (var i = 0; i < amostras.length; i++) {
            if (amostras[i][c] !== null) minutos += amostras[i].minutos;
        }
        return arredondar(100 * minutos / duracao, 1);
    }
    return {
        critico_percentual: criticos.length && observado ? arredondar(100 * critico / observado, 1) : null,
        critico_minutos: criticos.length && observado ? arredondar(critico) : null,
        observado: criticos.length ? arredondar(observado) : null,
        cobertura: criticos.length ? arredondar(100 * observado / duracao, 1) : null,
        cpu: desvio('cpu'), ram: desvio('ram'),
        cobertura_cpu: coberturaComponente('cpu'), cobertura_ram: coberturaComponente('ram')
    };
}

function calcularDashboard(servidores, amostrasGold, servidorId, periodoDias) {
    var servidor = servidores.find(function (s) { return String(s.id) === String(servidorId); }) || servidores[0];
    if (!servidor) throw new Error('Nenhum servidor disponível para a dashboard.');
    periodoDias = Number(periodoDias) === 14 ? 14 : 7;
    var lista = componentesDoServidor(servidor);
    var linhas = prepararAmostras(amostrasGold, servidor.id);
    // O fim da coleta é exclusivo: uma coleta encerrada à meia-noite pertence
    // ao dia anterior. As duas janelas abrangem dias civis completos em UTC-3.
    var ultimaColetaFim = linhas.length ? linhas[linhas.length - 1].fim : null;
    var fim = ultimaColetaFim === null ? null : Date.parse(dataSP(ultimaColetaFim - 1) + 'T03:00:00Z') + UM_DIA;
    var inicio = fim === null ? null : fim - periodoDias * UM_DIA;
    var inicioAnterior = inicio === null ? null : inicio - periodoDias * UM_DIA;
    var janela = amostrasDaJanela(linhas, inicio, fim);
    var anterior = amostrasDaJanela(linhas, inicioAnterior, inicio);
    var amostras = janela.amostras;
    var diasComColeta = [];
    var minutos = 0;
    var origens = Object.create(null);
    for (var i = 0; i < amostras.length; i++) {
        minutos += amostras[i].minutos;
        origens[amostras[i].origem] = true;
        if (diasComColeta.indexOf(amostras[i].dia) < 0) diasComColeta.push(amostras[i].dia);
    }
    var resumos = {};
    for (var j = 0; j < lista.length; j++) resumos[lista[j]] = resumoPeriodo(amostras, lista[j], servidor.limites[lista[j]]);
    var aumento = {};
    var periodoPadrao = 'almoco';
    var melhorDiferenca = null;
    for (var periodo in PERIODOS) {
        aumento[periodo] = aumentoNoPeriodo(amostras, periodo, lista);
        var destaque = aumento[periodo].destaque;
        if (destaque && (melhorDiferenca === null || destaque.diferenca > melhorDiferenca)) {
            melhorDiferenca = destaque.diferenca;
            periodoPadrao = periodo;
        }
    }
    var mediaCpu = resumos.cpu ? resumos.cpu.media : null;
    var mediaRam = resumos.ram ? resumos.ram.media : null;
    // As chaves atuais do filtro consultam exatamente N dias antes.
    var diasAnteriores = [];
    for (var d = 0; d < diasComColeta.length; d++) diasAnteriores.push(new Date(Date.parse(diasComColeta[d]) - periodoDias * UM_DIA).toISOString().slice(0, 10));
    var rankingAnteriorPorData = rankingPorDia(anterior.amostras, lista, servidor.limites, diasAnteriores);
    var rankingAnterior = { periodo: rankingAnteriorPorData.periodo };
    for (var r = 0; r < diasComColeta.length; r++) rankingAnterior[diasComColeta[r]] = rankingAnteriorPorData[diasAnteriores[r]];
    return {
        servidores: servidores.map(function (s) { return { id: s.id, nome: s.nome }; }),
        servidor: { id: servidor.id, nome: servidor.nome, componentes: lista, nomes: NOMES, limites: servidor.limites },
        periodo: { dias: periodoDias, inicio: janela.dias[0] || null,
            fim: janela.dias[janela.dias.length - 1] || null, dias_com_coleta: diasComColeta },
        coleta: { minutos: arredondar(minutos), amostras: Object.keys(origens).length },
        padrao: { componente: componentePadrao(resumos, lista),
            processo: (mediaRam || 0) > (mediaCpu || 0) ? 'ram' : 'cpu', periodo: periodoPadrao },
        resumos: resumos,
        mais_atencao: maisTempoEmAtencao(resumos, lista),
        componentes_uso: COMPONENTES_DE_USO,
        aumento: aumento,
        processos: { cpu: processosNaSemana(amostras, 'cpu'), ram: processosNaSemana(amostras, 'ram') },
        ranking: rankingPorDia(amostras, lista, servidor.limites, diasComColeta),
        ranking_anterior: rankingAnterior,
        calor: mapaCalor(amostras, lista, servidor.limites, diasComColeta),
        comparacao: {
            limitacao: 'A Gold não armazena versões históricas dos limites. Os limites atuais do servidor são aplicados às duas janelas.',
            periodo_anterior: { inicio: inicioAnterior === null ? null : dataSP(inicioAnterior),
                fim: inicio === null ? null : dataSP(inicio - 1) },
            atual: resumoComparacao(amostras, lista, servidor.limites, periodoDias * 1440),
            anterior: resumoComparacao(anterior.amostras, lista, servidor.limites, periodoDias * 1440)
        }
    };
}

module.exports = { calcularDashboard: calcularDashboard, COMPONENTES: COMPONENTES };