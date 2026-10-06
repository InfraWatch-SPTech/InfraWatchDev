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

function nivelUsuario(usuario) {
    return usuario.nomeNivelAcesso || usuario.nomePermissao || '';
}

function usuarioPossuiPermissao(usuario, nomePermissao) {
    const permissoes = Array.isArray(usuario.permissoes)
        ? usuario.permissoes
        : [];

    return permissoes.includes(nomePermissao);
}

function atualizarLinkUsuarios(usuario) {
    const listaNavegacao = document.querySelector('.nav-links ul');

    if (!listaNavegacao) {
        return;
    }

    const linkExistente = listaNavegacao.querySelector('.link-usuarios-admin');
    const nivel = nivelUsuario(usuario);
    const ehRoot = nivel === 'Root';
    const podeVisualizarUsuarios = usuarioPossuiPermissao(
        usuario,
        'USUARIOS_VISUALIZAR'
    );
    const podeGerenciarUsuarios = usuarioPossuiPermissao(
        usuario,
        'USUARIOS_GERENCIAR'
    );
    const podeAcessar = ehRoot || podeVisualizarUsuarios || podeGerenciarUsuarios;

    if (podeAcessar && !linkExistente) {
        const item = document.createElement('li');
        item.className = 'link-usuarios-admin';

        const link = document.createElement('a');
        link.href = './usuarios.html';
        link.textContent = 'Usuários';

        item.appendChild(link);
        listaNavegacao.appendChild(item);
    } else if (!podeAcessar && linkExistente) {
        linkExistente.remove();
    }
}

function montarPerfilUsuario(usuario) {
    const navLogin = document.querySelector('.nav-login');
    const popupPerfil = document.querySelector('.popup-perfil');

    if (!navLogin || !popupPerfil) {
        return;
    }

    navLogin.innerHTML = `
        <button id="btn-pagina-empresa" onclick="redirecionamento_cadastroServidor()">
            Painel Empresa
        </button>
        <button id="btn-perfil-usuario">
            <i class="fa-solid fa-user" style="color: rgb(255, 255, 255);"></i>
            Perfil
        </button>
    `;

    const btnPerfil = document.getElementById('btn-perfil-usuario');

    btnPerfil.addEventListener('click', function () {
        if (popupPerfil.classList.contains('active')) {
            popupPerfil.classList.remove('active');
            return;
        }

        const permissoes = Array.isArray(usuario.permissoes)
            ? usuario.permissoes
            : [];

        popupPerfil.innerHTML = `
            <i id="btn-fechar-perfil" class="fa-regular fa-circle-xmark"></i>
            <div class="content-perfil">
                <div class="content-perfil-top">
                    <i class="fa-solid fa-user"></i>
                    <div class="perfil-top-text">
                        <h5>${usuario.nome}</h5>
                        <h6>${usuario.email}</h6>
                    </div>
                </div>

                <div class="content-perfil-bottom">
                    <div class="perfil-bottom-info">
                        <div class="info-box-text">
                            <i class="fa-regular fa-building"></i>
                            <span>
                                <h6>Empresa</h6>
                                <h5>${usuario.nomeEmpresa}</h5>
                            </span>
                        </div>

                        <div class="info-box-text">
                            <i class="fa-regular fa-address-card"></i>
                            <span>
                                <h6>Nível de acesso</h6>
                                <h5>${nivelUsuario(usuario)}</h5>
                            </span>
                        </div>
                    </div>

                    <div class="perfil-bottom-info">
                        <span>
                            <h6>Permissões adicionais</h6>
                            <h5>${permissoes.length > 0 ? permissoes.join(', ') : 'Nenhuma'}</h5>
                        </span>
                    </div>

                    <div class="perfil-bottom-btn">
                        <button onclick="limparSessao()">
                            <i class="fa-solid fa-right-from-bracket"></i>
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        `;

        popupPerfil.classList.add('active');

        const btnFechar = document.getElementById('btn-fechar-perfil');
        btnFechar.addEventListener('click', function () {
            popupPerfil.classList.remove('active');
        });
    });
}

function validarSessao() {
    const caminhoPagina = window.location.pathname;
    const paginaProtegida = caminhoPagina.includes('hardwares.html') ||
        caminhoPagina.includes('usuarios.html');
    const usuario = lerDadosSessao();

    if (!usuario) {
        if (paginaProtegida) {
            window.location.href = '../public/login.html';
        }
        return;
    }

    atualizarLinkUsuarios(usuario);
    montarPerfilUsuario(usuario);
}

function limparSessao() {
    localStorage.clear();
    window.location = '../public/main.html';
}

function dadosUser() {
    return lerDadosSessao();
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
