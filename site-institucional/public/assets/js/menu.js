var menuItens = [
    { rota: 'inicio', icone: 'fa-house', texto: 'Início' },
    { rota: 'dashboard_empresa', icone: 'fa-chart-line', texto: 'Dashboard empresa' },
    // { rota: 'dashboard_servidor', icone: 'fa-server', texto: 'Dashboard servidor' },
    { rota: 'hardwares', icone: 'fa-gear', texto: 'Gerenciar servidores' },
    { rota: 'usuarios', icone: 'fa-users', texto: 'Gerenciar funcionários', restrito: true },
    { rota: 'criar_relatorio', icone: 'fa-file-circle-plus', texto: 'Criar relatório' },
    // { rota: 'lista_relatorios', icone: 'fa-file-lines', texto: 'Visualizar relatórios' },
    { rota: 'plataformas_externas', icone: 'fa-plug', texto: 'Plataformas externas' }
];

var headerItens = [
    { rota: 'inicio', texto: 'Início' },
    { rota: 'dashboard_empresa', texto: 'Dashboard' },
    { rota: 'hardwares', texto: 'Hardwares' },
    { rota: 'criar_relatorio', texto: 'Relatórios' }
];

function paginaDaRota(rota) {
    const destino = rotas[rota].split('#')[0];

    return destino.substring(destino.lastIndexOf('/') + 1);
}

function marcarItemAtivo() {
    const links = document.querySelectorAll('.menu_link');
    const pagina = nomePagina();
    const hash = window.location.hash || '#';
    let indiceAtivo = -1;
    let indicePagina = -1;

    for (let i = 0; i < links.length; i++) {
        const rota = links[i].getAttribute('data-rota');

        if (paginaDaRota(rota) !== pagina) {
            continue;
        }

        if (indicePagina === -1) {
            indicePagina = i;
        }

        const hashRota = '#' + (rotas[rota].split('#')[1] || '');

        if (hashRota === hash) {
            indiceAtivo = i;
        }
    }

    if (indiceAtivo === -1) {
        indiceAtivo = indicePagina;
    }

    for (let i = 0; i < links.length; i++) {
        if (i === indiceAtivo) {
            links[i].setAttribute('aria-current', 'page');
        } else {
            links[i].removeAttribute('aria-current');
        }
    }

    const linksHeader = document.querySelectorAll('.header_link');

    for (let i = 0; i < linksHeader.length; i++) {
        if (paginaDaRota(linksHeader[i].getAttribute('data-rota')) === pagina) {
            linksHeader[i].setAttribute('aria-current', 'page');
        } else {
            linksHeader[i].removeAttribute('aria-current');
        }
    }
}

function montarMenu() {
    const usuario = lerDadosSessao();

    if (!usuario) {
        return;
    }

    let itensHtml = '';

    for (let i = 0; i < menuItens.length; i++) {
        const item = menuItens[i];

        if (item.restrito && !usuarioPodeGerenciarUsuarios(usuario)) {
            continue;
        }

        itensHtml += `
            <li>
                <a class="menu_link" href="${rotas[item.rota]}" data-rota="${item.rota}">
                    <i class="fa-solid ${item.icone}"></i>
                    <span>${item.texto}</span>
                </a>
            </li>
        `;
    }

    let linksHeaderHtml = '';

    document.body.insertAdjacentHTML('afterbegin', `
        <header class="header_principal">
            <button class="header_botao_menu" id="botao_menu" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="menu_lateral">
                <i class="fa-solid fa-bars"></i>
            </button>
            <a class="header_logo" href="${rotas.inicio}">Infra<span>Watch</span></a>
            <nav class="header_links" aria-label="Navegação principal">
                <ul>${linksHeaderHtml}</ul>
            </nav>
            <div class="header_usuario">
                <span class="header_empresa" id="header_empresa"></span>
                <button class="header_perfil" id="btn_perfil_usuario" type="button" aria-label="Abrir perfil">
                    <i class="fa-solid fa-circle-user"></i>
                    <span id="header_nivel"></span>
                </button>
            </div>
            <div class="perfil_popup" id="perfil_popup"></div>
        </header>

        <div class="menu_fundo" id="menu_fundo"></div>
        <nav class="menu_lateral" id="menu_lateral" aria-label="Menu principal" aria-hidden="true">
            <div class="menu_topo">
                <a class="menu_marca" href="${rotas.inicio}">Infra<span>Watch</span></a>
                <button class="menu_fechar" id="menu_fechar" type="button" aria-label="Fechar menu">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <ul class="menu_lista">${itensHtml}</ul>
            <div class="menu_rodape">
                <span class="menu_rodape_titulo">Suporte</span>
                <a class="menu_rodape_link" href="${rotas.contato}">Precisa de ajuda?</a>
            </div>
        </nav>
    `);

    document.getElementById('header_empresa').textContent = usuario.nomeEmpresa || 'InfraWatch.Dev';
    document.getElementById('header_nivel').textContent = nivelUsuario(usuario) || 'Perfil';

    marcarItemAtivo();
    montarPopupPerfil(usuario);
    iniciarMenu();

    document.getElementById('btn_perfil_usuario').addEventListener('click', alternarPopupPerfil);
}

function iniciarMenu() {
    const botaoMenu = document.getElementById('botao_menu');
    const botaoFechar = document.getElementById('menu_fechar');
    const menu = document.getElementById('menu_lateral');
    const fundo = document.getElementById('menu_fundo');
    const links = menu.querySelectorAll('.menu_link');

    function abrirMenu() {
        menu.classList.add('menu_aberto');
        fundo.classList.add('menu_aberto');
        menu.setAttribute('aria-hidden', 'false');
        botaoMenu.setAttribute('aria-expanded', 'true');
        document.body.classList.add('menu_travado');
    }

    function fecharMenu() {
        menu.classList.remove('menu_aberto');
        fundo.classList.remove('menu_aberto');
        menu.setAttribute('aria-hidden', 'true');
        botaoMenu.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu_travado');
    }

    botaoMenu.addEventListener('click', function () {
        if (menu.classList.contains('menu_aberto')) {
            fecharMenu();
            botaoMenu.focus();
        } else {
            abrirMenu();
        }
    });

    botaoFechar.addEventListener('click', function () {
        fecharMenu();
        botaoMenu.focus();
    });

    fundo.addEventListener('click', fecharMenu);

    for (let i = 0; i < links.length; i++) {
        links[i].addEventListener('click', fecharMenu);
    }

    document.addEventListener('keydown', function (evento) {
        if (evento.key === 'Escape' && menu.classList.contains('menu_aberto')) {
            fecharMenu();
            botaoMenu.focus();
        }
    });

    window.addEventListener('hashchange', marcarItemAtivo);
}

montarMenu();
