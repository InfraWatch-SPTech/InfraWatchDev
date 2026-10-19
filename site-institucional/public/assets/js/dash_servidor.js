// dados mockados

const limites = {
    cpu: 80,
    ram: 75,
    disco: 75,
    latencia: 300
};

const dados_mock = {
    servidor: {
        nome: 'Servidor Principal',
        ip: '192.168.1.10',
        funcao: 'Processamento',
        online_desde: '14/09 08:15',
        online: true
    },
    cpu: [18, 22, 22, 26, 26, 38, 47, 56, 65, 69, 73, 79, 82, 83, 84, 84, 84, 85, 86, 88, 89, 88, 88.5, 89.5],
    ram: [54, 51, 51, 53, 55, 59, 66, 75, 69, 57, 54, 55, 56, 56, 55, 55, 56, 56, 55, 54, 54, 55, 55, 55],
    disco: [12, 11, 11, 11, 11, 11, 12, 12, 12, 11, 11, 10, 10, 10, 10, 10, 10, 11, 11, 11, 11, 10, 10, 10],
    latencia: [
        30, 46, 34, 58, 32, 66, 38, 70, 22, 18,
        48, 64, 26, 35, 20, 28, 22, 22, 24, 34,
        30, 22, 312, 42, 40, 36, 34, 52, 40, 48,
        38, 36, 34, 40, 44, 50, 46, 44, 56, 50,
        60, 64, 52, 66, 74, 58, 60, 52, 48, 44,
        50, 46, 42, 40, 38, 40, 38, 42, 38, 38
    ],
    throughput: 5126,
    historico: [
        false,  true,  true,  false, true,  true,  
        true,  true,  true,  true,  true,  true,  
        true,  true,  true,  false, true,  true,  
        true,  true,  true,  true,  true,  false  
    ],
    incidentes: [
        { componente: 'CPU', registro: '92%', parametro: '80%', nivel: 'critico', descricao: 'Componente CPU atingiu medida acima do parâmetro', timestamp: '10/09/26 - 12:32:12', resolvido: false },
        { componente: 'CPU', registro: '87%', parametro: '80%', nivel: 'critico', descricao: 'Componente CPU atingiu medida acima do parâmetro', timestamp: '10/09/26 - 12:32:12', resolvido: true },
        { componente: 'RAM', registro: '76%', parametro: '75%', nivel: 'critico', descricao: 'Componente RAM atingiu medida acima do parâmetro', timestamp: '10/09/26 - 12:32:12', resolvido: false },
        { componente: 'REDE', registro: '312ms', parametro: '300ms', nivel: 'critico', descricao: 'Componente REDE atingiu medida acima do parâmetro', timestamp: '10/09/26 - 12:32:12', resolvido: false }
    ]
};

const rotulos_nivel = {
    critico: 'Crítico',
    alerta: 'Alerta',
    ok: 'Normal'
};

const icone_check = '<svg class="icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="4 12 10 18 20 6"/></svg>';
const icone_x = '<svg class="icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>';

// funções auxiliares para as kpi e gráficos

function cor_css(nome) {
    return getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
}

function carregar_dados() {
    return dados_mock;
}

function criar_elemento(tag, classe, texto) {
    const elemento = document.createElement(tag);
    if (classe) {
        elemento.className = classe;
    }
    if (texto !== undefined) {
        elemento.textContent = texto;
    }
    return elemento;
}

function formatar_percentual(valor) {
    return valor.toLocaleString('pt-BR') + '%';
}

function formatar_ms(valor) {
    return valor.toLocaleString('pt-BR') + 'ms';
}

function classificar(valor, limite) {
    if (valor >= limite) {
        return 'critico';
    }
    if (valor >= limite * 0.7) {
        return 'alerta';
    }
    return 'ok';
}

function ultimo(lista) {
    return lista[lista.length - 1];
}

function gerar_rotulos(total, passo_min) {
    const rotulos = [];
    const agora = Date.now();
    for (let i = 0; i < total; i++) {
        const instante = new Date(agora - (total - 1 - i) * passo_min * 60000);
        const hora = String(instante.getHours()).padStart(2, '0');
        const minuto = String(instante.getMinutes()).padStart(2, '0');
        rotulos.push(hora + ':' + minuto);
    }
    return rotulos;
}

/* cabeçalho e kpis */

function preencher_servidor(servidor) {
    document.getElementById('servidor_nome').textContent = servidor.nome;
    document.getElementById('servidor_ip').textContent = servidor.ip;
    document.getElementById('servidor_funcao').textContent = servidor.funcao;
    document.getElementById('servidor_online_desde').textContent = servidor.online_desde;

    const badge = document.getElementById('servidor_badge');
    badge.textContent = servidor.online ? 'Online' : 'Offline';
    badge.className = servidor.online ? 'servidor_badge' : 'servidor_badge badge_offline';
}

function definir_kpi(id, valor, limite, texto) {
    const elemento = document.getElementById(id);
    elemento.textContent = texto;
    elemento.className = 'card_kpi_valor status_' + classificar(valor, limite);
}

function preencher_kpis(dados) {
    const cpu = ultimo(dados.cpu);
    const ram = ultimo(dados.ram);
    const disco = ultimo(dados.disco);
    const latencia = ultimo(dados.latencia);

    definir_kpi('kpi_cpu_valor', cpu, limites.cpu, formatar_percentual(cpu));
    const nivel_cpu = classificar(cpu, limites.cpu);
    const status_cpu = document.getElementById('kpi_cpu_status');
    status_cpu.textContent = rotulos_nivel[nivel_cpu];
    status_cpu.className = 'status_' + nivel_cpu;

    definir_kpi('kpi_ram_valor', ram, limites.ram, formatar_percentual(ram));
    document.getElementById('kpi_ram_sub').textContent = 'Parâmetro para alerta: ' + formatar_percentual(limites.ram);

    definir_kpi('kpi_disco_valor', disco, limites.disco, formatar_percentual(disco));
    const disponivel = document.getElementById('kpi_disco_disponivel');
    disponivel.textContent = formatar_percentual(100 - disco);
    disponivel.className = 'status_ok';

    definir_kpi('kpi_latencia_valor', latencia, limites.latencia, formatar_ms(latencia));
    document.getElementById('kpi_latencia_sub').textContent = 'Throughput ' + dados.throughput.toLocaleString('pt-BR') + ' tx/s';
}

function preencher_limites() {
    document.getElementById('limite_cpu').textContent = 'parâmetro para alerta: ' + formatar_percentual(limites.cpu);
    document.getElementById('limite_ram').textContent = 'parâmetro para alerta: ' + formatar_percentual(limites.ram);
    document.getElementById('limite_disco').textContent = 'parâmetro para alerta: ' + formatar_percentual(limites.disco);
    document.getElementById('limite_latencia').textContent = 'parâmetro para alerta: ' + formatar_ms(limites.latencia);
}

/* graficos */

function criar_grafico(canvas_id, config) {
    const total = config.valores.length;
    const rotulos = gerar_rotulos(total, config.passo_min);
    const transformar = config.transformar || function (valor) { return valor; };
    const cor_ponto = config.cor_ponto || config.cor;
    const reduzir_movimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const plotados = [];
    const linha_limite = [];
    for (let i = 0; i < total; i++) {
        plotados.push(transformar(config.valores[i]));
        linha_limite.push(transformar(config.limite));
    }

    const posicoes = [];
    for (let i = 0; i < config.ticks.length; i++) {
        posicoes.push(transformar(config.ticks[i]));
    }

    return new Chart(document.getElementById(canvas_id), {
        type: 'line',
        data: {
            labels: rotulos,
            datasets: [
                {
                    data: plotados,
                    borderColor: config.cor,
                    borderWidth: 2,
                    tension: 0,
                    pointRadius: function (contexto) {
                        return config.valores[contexto.dataIndex] >= config.limite ? 4 : 0;
                    },
                    pointHoverRadius: 5,
                    pointBackgroundColor: cor_ponto,
                    pointBorderColor: cor_ponto
                },
                {
                    data: linha_limite,
                    borderColor: config.cor_limite,
                    borderWidth: 1.5,
                    borderDash: [7, 7],
                    pointRadius: 0,
                    pointHoverRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: reduzir_movimento ? false : { duration: 600 },
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    filter: function (item) {
                        return item.datasetIndex === 0;
                    },
                    backgroundColor: config.cor_fundo,
                    borderColor: config.cor_borda,
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        label: function (item) {
                            return config.formatar(config.valores[item.dataIndex]);
                        }
                    }
                }
            },
            scales: {
                x: { display: false },
                y: {
                    min: posicoes[0],
                    max: posicoes[posicoes.length - 1],
                    grid: { display: false },
                    border: { color: config.cor_eixo },
                    ticks: {
                        color: config.cor_texto,
                        padding: 12,
                        callback: function (valor, indice) {
                            return config.formatar(config.ticks[indice]);
                        }
                    },
                    afterBuildTicks: function (eixo) {
                        const ticks = [];
                        for (let i = 0; i < posicoes.length; i++) {
                            ticks.push({ value: posicoes[i] });
                        }
                        eixo.ticks = ticks;
                    }
                }
            }
        }
    });
}

function transformar_latencia(valor) {
    return Math.log10(valor + 1);
}

function criar_graficos(dados) {
    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
    Chart.defaults.color = cor_css('--cor-cinza-eixo');

    const ticks_percentual = [0, 20, 40, 60, 80, 100];
    const base = {
        cor_limite: cor_css('--cor-branco-default'),
        cor_fundo: cor_css('--cor-azul-contraste'),
        cor_borda: cor_css('--cor-azul-apagado'),
        cor_eixo: cor_css('--cor-azul-apagado'),
        cor_texto: cor_css('--cor-cinza-eixo')
    };
    const cor_vermelho = cor_css('--cor-vermelho-claro');

    criar_grafico('grafico_cpu', Object.assign({}, base, {
        valores: dados.cpu,
        limite: limites.cpu,
        cor: cor_vermelho,
        ticks: ticks_percentual,
        formatar: formatar_percentual,
        passo_min: 5
    }));

    criar_grafico('grafico_ram', Object.assign({}, base, {
        valores: dados.ram,
        limite: limites.ram,
        cor: cor_css('--cor-amarelo-claro'),
        ticks: ticks_percentual,
        formatar: formatar_percentual,
        passo_min: 5
    }));

    criar_grafico('grafico_disco', Object.assign({}, base, {
        valores: dados.disco,
        limite: limites.disco,
        cor: cor_css('--cor-azul-profundo'),
        ticks: ticks_percentual,
        formatar: formatar_percentual,
        passo_min: 5
    }));

    criar_grafico('grafico_latencia', Object.assign({}, base, {
        valores: dados.latencia,
        limite: limites.latencia,
        cor: cor_css('--cor-verde-ativo'),
        cor_ponto: cor_vermelho,
        ticks: [0, 30, 100, 300, 1000],
        transformar: transformar_latencia,
        formatar: formatar_ms,
        passo_min: 2
    }));
}

/* historico 24h */

function renderizar_historico(historico) {
    const trilha = document.getElementById('historico_trilha');
    trilha.innerHTML = '';
    
    trilha.style.display = 'flex';
    trilha.style.gap = '3px';
    trilha.style.height = '28px';
    trilha.style.width = '100%';

    historico.forEach((ativo, index) => {
        const segmento = document.createElement('div');
        segmento.style.flex = '1';
        segmento.style.backgroundColor = ativo ? cor_css('--cor-verde-ativo') : cor_css('--cor-vermelho-claro');
        segmento.style.borderRadius = index === 0 ? '4px 0 0 4px' : (index === 23 ? '0 4px 4px 0' : '3px');
        
        const horaInicio = String(index).padStart(2, '0');
        const horaFim = String((index + 1) % 24).padStart(2, '0');
        const statusTexto = ativo ? 'Operacional (Normal)' : 'Incidente detectado (Inativo)';
        segmento.title = `Das ${horaInicio}:00 às ${horaFim}:00 — ${statusTexto}`;
        
        trilha.appendChild(segmento);
    });
}

/* incidentes */

function definir_resolvido(botao, resolvido) {
    botao.className = resolvido ? 'btn_resolver btn_resolver_ativo' : 'btn_resolver';
    botao.innerHTML = resolvido ? icone_check : icone_x;
    botao.setAttribute('aria-pressed', resolvido ? 'true' : 'false');
    botao.setAttribute('aria-label', resolvido ? 'Marcar incidente como não resolvido' : 'Marcar incidente como resolvido');
}

function atualizar_selecao_geral() {
    const checks = document.querySelectorAll('#tabela_corpo .tabela_checkbox');
    const geral = document.getElementById('selecionar_todos');
    let marcados = 0;
    for (let i = 0; i < checks.length; i++) {
        if (checks[i].checked) {
            marcados++;
        }
    }
    geral.checked = checks.length > 0 && marcados === checks.length;
    geral.indeterminate = marcados > 0 && marcados < checks.length;
}

function renderizar_incidentes(incidentes) {
    const corpo = document.getElementById('tabela_corpo');
    corpo.innerHTML = '';

    for (let i = 0; i < incidentes.length; i++) {
        const incidente = incidentes[i];
        const linha = document.createElement('tr');

        const celula_check = document.createElement('td');
        const check = criar_elemento('input', 'tabela_checkbox');
        check.type = 'checkbox';
        check.setAttribute('aria-label', 'Selecionar incidente ' + (i + 1));
        check.addEventListener('change', atualizar_selecao_geral);
        celula_check.appendChild(check);
        linha.appendChild(celula_check);

        linha.appendChild(criar_elemento('td', '', incidente.componente));
        linha.appendChild(criar_elemento('td', '', incidente.registro));
        linha.appendChild(criar_elemento('td', '', incidente.parametro));
        linha.appendChild(criar_elemento('td', 'tabela_urgencia urgencia_' + incidente.nivel, rotulos_nivel[incidente.nivel]));
        linha.appendChild(criar_elemento('td', 'tabela_descricao', incidente.descricao));
        linha.appendChild(criar_elemento('td', 'tabela_timestamp', incidente.timestamp));

        const celula_acao = criar_elemento('td', 'tabela_acao');
        const botao = criar_elemento('button', 'btn_resolver');
        botao.type = 'button';
        definir_resolvido(botao, incidente.resolvido);
        botao.addEventListener('click', function () {
            incidente.resolvido = !incidente.resolvido;
            definir_resolvido(botao, incidente.resolvido);
        });
        celula_acao.appendChild(botao);
        linha.appendChild(celula_acao);

        corpo.appendChild(linha);
    }

    atualizar_selecao_geral();
}

function iniciar_selecao_geral() {
    const geral = document.getElementById('selecionar_todos');
    geral.addEventListener('change', function () {
        const checks = document.querySelectorAll('#tabela_corpo .tabela_checkbox');
        for (let i = 0; i < checks.length; i++) {
            checks[i].checked = geral.checked;
        }
        geral.indeterminate = false;
    });
}

function iniciar() {
    const dados = carregar_dados();

    preencher_servidor(dados.servidor);
    preencher_kpis(dados);
    preencher_limites();
    document.fonts.ready.then(function () {
        criar_graficos(dados);
    });
    renderizar_historico(dados.historico);
    renderizar_incidentes(dados.incidentes);
    iniciar_selecao_geral();
}

iniciar();