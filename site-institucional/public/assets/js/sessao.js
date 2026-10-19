var paginasPublicas = ['main.html', 'sobrenos.html', 'login.html'];
var sessaoValidada = false;

function lerDadosSessao() {
    const usuarioTexto = localStorage.getItem('usuarioLogado');

    if (!usuarioTexto) {
        return null;
    }

    try {
        return JSON.parse(usuarioTexto);
    } catch (erro) {
        localStorage.removeItem('usuarioLogado');
        return null;
    }
}

function dadosUser() {
    return lerDadosSessao();
}

function nivelUsuario(usuario) {
    return usuario.nomeNivelAcesso || usuario.nomePermissao || '';
}

function usuarioPossuiPermissao(usuario, nomePermissao) {
    const permissoes = Array.isArray(usuario.permissoes)
        ? usuario.permissoes
        : [];

    return permissoes.includes(nomePermissao);
}

function usuarioPodeGerenciarUsuarios(usuario) {
    return nivelUsuario(usuario) === 'Root' ||
        usuarioPossuiPermissao(usuario, 'USUARIOS_VISUALIZAR') ||
        usuarioPossuiPermissao(usuario, 'USUARIOS_GERENCIAR');
}

function nomePagina() {
    const caminho = window.location.pathname;
    const nome = caminho.substring(caminho.lastIndexOf('/') + 1);

    if (nome === '') {
        return 'main.html';
    }

    if (nome === 'inicio') {
        return 'pagina-inicial.html';
    }

    return nome;
}

function paginaPublica() {
    return paginasPublicas.indexOf(nomePagina()) !== -1;
}

function fecharPopupPerfil() {
    const popup = document.getElementById('perfil_popup');

    if (popup) {
        popup.classList.remove('ativo');
    }
}

function alternarPopupPerfil() {
    const popup = document.getElementById('perfil_popup');

    if (popup) {
        popup.classList.toggle('ativo');
    }
}

function montarPopupPerfil(usuario) {
    const popup = document.getElementById('perfil_popup');

    if (!popup) {
        return;
    }

    const permissoes = Array.isArray(usuario.permissoes)
        ? usuario.permissoes
        : [];

    popup.innerHTML = `
        <button class="perfil_fechar" id="perfil_fechar" type="button" aria-label="Fechar perfil">
            <i class="fa-regular fa-circle-xmark"></i>
        </button>
        <div class="perfil_topo">
            <i class="fa-solid fa-user perfil_avatar"></i>
            <div class="perfil_topo_texto">
                <strong id="perfil_nome"></strong>
                <span id="perfil_email"></span>
            </div>
        </div>
        <div class="perfil_info">
            <div class="perfil_info_item">
                <i class="fa-regular fa-building"></i>
                <div>
                    <span class="perfil_rotulo">Empresa</span>
                    <span class="perfil_valor" id="perfil_empresa"></span>
                </div>
            </div>
            <div class="perfil_info_item">
                <i class="fa-regular fa-address-card"></i>
                <div>
                    <span class="perfil_rotulo">Nível de acesso</span>
                    <span class="perfil_valor" id="perfil_nivel"></span>
                </div>
            </div>
            <div class="perfil_info_item">
                <i class="fa-solid fa-key"></i>
                <div>
                    <span class="perfil_rotulo">Permissões adicionais</span>
                    <span class="perfil_valor" id="perfil_permissoes"></span>
                </div>
            </div>
        </div>
        <button class="perfil_sair" id="perfil_sair" type="button">
            <i class="fa-solid fa-right-from-bracket"></i>
            Logout
        </button>
    `;

    document.getElementById('perfil_nome').textContent = usuario.nome || '';
    document.getElementById('perfil_email').textContent = usuario.email || '';
    document.getElementById('perfil_empresa').textContent = usuario.nomeEmpresa || '';
    document.getElementById('perfil_nivel').textContent = nivelUsuario(usuario);
    document.getElementById('perfil_permissoes').textContent =
        permissoes.length > 0 ? permissoes.join(', ') : 'Nenhuma';

    document.getElementById('perfil_fechar').addEventListener('click', fecharPopupPerfil);
    document.getElementById('perfil_sair').addEventListener('click', limparSessao);

    document.addEventListener('click', function (evento) {
        const botaoPerfil = document.getElementById('btn_perfil_usuario');
        const clicouFora = !popup.contains(evento.target) &&
            !(botaoPerfil && botaoPerfil.contains(evento.target));

        if (clicouFora) {
            fecharPopupPerfil();
        }
    });
}

function montarNavbarLogada(usuario) {
    const navbarLogin = document.getElementById('navbar_login');

    if (!navbarLogin) {
        return;
    }

    navbarLogin.innerHTML = `
        <button class="navbar_botao navbar_botao_destaque" id="btn_painel" type="button">
            Acessar painel
        </button>
        <button class="navbar_botao navbar_botao_perfil" id="btn_perfil_usuario" type="button">
            <i class="fa-solid fa-user"></i>
            Perfil
        </button>
    `;

    document.getElementById('btn_painel').addEventListener('click', function () {
        redirecionar('inicio');
    });

    document.getElementById('btn_perfil_usuario').addEventListener('click', alternarPopupPerfil);

    montarPopupPerfil(usuario);
}

function validarSessao() {
    if (sessaoValidada) {
        return;
    }

    sessaoValidada = true;

    const usuario = lerDadosSessao();

    if (!usuario) {
        if (!paginaPublica()) {
            redirecionar('login');
        }
        return;
    }

    if (paginaPublica()) {
        montarNavbarLogada(usuario);
    }
}

function limparSessao() {
    localStorage.clear();
    sessionStorage.clear();
    redirecionar('home');
}

function aguardar() {
    const divAguardar = document.getElementById('div_aguardar');

    if (divAguardar) {
        divAguardar.style.display = 'flex';
    }
}

function finalizarAguardar(texto) {
    const divAguardar = document.getElementById('div_aguardar');
    const divErrosLogin = document.getElementById('div_erros_login');

    if (divAguardar) {
        divAguardar.style.display = 'none';
    }

    if (texto && divErrosLogin) {
        divErrosLogin.style.display = 'flex';
        divErrosLogin.innerHTML = texto;
    }
}

validarSessao();
