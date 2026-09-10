// sessão
function validarSessao() {

    // guarda qual página o usuário está
    let pagina_now = window.location.pathname;
    let paginas_com_login = [''] // páginas que o usuário não pode acessar sem login

    const usuarioTexto = localStorage.getItem('usuarioLogado'); // pega as coisas salvas no localStorage

    if (usuarioTexto == null && !pagina_now.includes("main.html") && !pagina_now.includes("sobrenos.html")) {
        window.location.href = "../public/main.html";
        return;
    }

    const usuarioLogado = JSON.parse(usuarioTexto);
    console.log(usuarioLogado)

    // salvando infos do usuário no localStorage

    const nomeUsuario = usuarioLogado.nome;
    const permissaoUsuario = usuarioLogado.nomePermissao;
    const idEmpresaUsuario = usuarioLogado.idEmpresa;
    const nomeEmpresaUsuario = usuarioLogado.nomeEmpresa;
    const emailUsuario = usuarioLogado.email;

    // salvando div da navbar para adicionar comportamento
    const navLogin = document.querySelector('.nav-login');
    const popupPerfil = document.querySelector('.popup-perfil');

    if (permissaoUsuario == 'Usuario') {
        navLogin.innerHTML =
            `
            <button id="btn-pagina-empresa" onclick="redirecionamento_cadastroServidor()">
                Painel Empresa
            </button>
            <button id="btn-perfil-usuario">
                <i class="fa-solid fa-user" style="color: rgb(255, 255, 255);"></i>
                Perfil
            </button>
        `;

        const btnPerfil = document.getElementById('btn-perfil-usuario');

        btnPerfil.addEventListener('click', () => {
            if (popupPerfil.classList.contains('active')) {
                popupPerfil.classList.remove('active');
            } else {
                popupPerfil.classList.add('active');

                popupPerfil.innerHTML =
                    `
                    <i id="btn-fechar-perfil" class="fa-regular fa-circle-xmark"></i>
                        <div class="content-perfil">
                            <div class="content-perfil-top">
                                <i class="fa-solid fa-user"></i>
                                <div class="perfil-top-text">
                                    <h5>
                                        ${nomeUsuario}
                                    </h5>
                                    <h6>
                                        ${emailUsuario}
                                    </h6>
                                </div>
                            </div>
                            <div class="content-perfil-bottom">
                                <div class="perfil-bottom-info">
                                    <div class="info-box-text">
                                        <i class="fa-regular fa-building"></i>
                                        <span class="empresa-limit">
                                            <h6>Empresa</h6>
                                            <h5>${nomeEmpresaUsuario}</h5>
                                        </span>
                                    </div>
                                    <div class="info-box-text">
                                        <i class="fa-regular fa-address-card"></i>
                                        <span>
                                            <h6>Permissão</h6>
                                            <h5>${permissaoUsuario}</h5>
                                        </span>
                                    </div>
                                </div>
                                <div class="perfil-bottom-btn">
                                    <button>
                                        <i class="fa-regular fa-pen-to-square"></i>
                                        Editar
                                    </button>
                                    <button onclick="limparSessao()">
                                        <i class="fa-solid fa-right-from-bracket"></i>
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;

                const btnClosePerfil = document.getElementById('btn-fechar-perfil');

                btnClosePerfil.addEventListener('click', () => {
                    if (popupPerfil.classList.contains('active')) {
                        popupPerfil.classList.remove('active');
                    } else {
                        popupPerfil.classList.add('active');

                       popupPerfil.innerHTML = `
    <i id="btn-fechar-perfil" class="fa-regular fa-circle-xmark"></i>
    <div class="content-perfil">
        <!-- Topo: Avatar, Nome e Email -->
        <div class="content-perfil-top">
            <i class="fa-solid fa-user icon-avatar"></i>
            <div class="perfil-top-text">
                <h5 class="nome-usuario">${nomeUsuario}</h5>
                <h6 class="email-usuario">${emailUsuario}</h6>
            </div>
        </div>
        
        <!-- Conteúdo do meio: Empresa e Permissão -->
        <div class="content-perfil-bottom">
            <div class="perfil-bottom-info">
                <div class="info-item">
                    <i class="fa-regular fa-building info-icon"></i>
                    <div class="info-text">
                        <span class="info-label">Empresa</span>
                        <span class="info-valor">${empresaUsuario}</span>
                    </div>
                </div>
                
                <div class="info-item">
                    <i class="fa-regular fa-address-card info-icon"></i>
                    <div class="info-text">
                        <span class="info-label">Permissão</span>
                        <span class="info-valor">${permissaoUsuario}</span>
                    </div>
                </div>
            </div>
            
            <!-- Botões de Ação -->
            <div class="perfil-bottom-btn">
                <button type="button" class="btn-editar">
                    <i class="fa-regular fa-pen-to-square"></i> Editar
                </button>
                <button type="button" class="btn-logout" onclick="limparSessao()">
                    <i class="fa-solid fa-right-from-bracket"></i> Logout
                </button>
            </div>
        </div>
    </div>
`;
                    }
                })
            }
        })

        const btnAdicionarHardware = document.getElementById('btn-novo-hardware');
        if (btnAdicionarHardware) {
            btnAdicionarHardware.style.display = 'none';
        }


    } else if (permissaoUsuario == 'Admin') {
        navLogin.innerHTML =
            `
            <button id="btn-pagina-empresa" onclick="redirecionamento_cadastroServidor()">
                Painel Empresa
            </button>
            <button id="btn-perfil-usuario">
                <i class="fa-solid fa-user" style="color: rgb(255, 255, 255);"></i>
                Perfil
            </button>
        `;

        const btnPerfil = document.getElementById('btn-perfil-usuario');

        btnPerfil.addEventListener('click', () => {
            if (popupPerfil.classList.contains('active')) {
                popupPerfil.classList.remove('active');
            } else {
                popupPerfil.classList.add('active');

                popupPerfil.innerHTML =
                    `
                    <i id="btn-fechar-perfil" class="fa-regular fa-circle-xmark"></i>
                        <div class="content-perfil">
                            <div class="content-perfil-top">
                                <i class="fa-solid fa-user"></i>
                                <div class="perfil-top-text">
                                    <h5>
                                        ${nomeUsuario}
                                    </h5>
                                    <h6>
                                        ${emailUsuario}
                                    </h6>
                                </div>
                            </div>
                            <div class="content-perfil-bottom">
                                <div class="perfil-bottom-info">
                                    <div class="info-box-text">
                                        <i class="fa-regular fa-building"></i>
                                        <span class="empresa-limit">
                                            <h6>Empresa</h6>
                                            <h5>${nomeEmpresaUsuario}</h5>
                                        </span>
                                    </div>
                                    <div class="info-box-text">
                                        <i class="fa-regular fa-address-card"></i>
                                        <span>
                                            <h6>Permissão</h6>
                                            <h5>${permissaoUsuario}</h5>
                                        </span>
                                    </div>
                                </div>
                                <div class="perfil-bottom-btn">
                                    <button>
                                        <i class="fa-regular fa-pen-to-square"></i>
                                        Editar
                                    </button>
                                    <button onclick="limparSessao()">
                                        <i class="fa-solid fa-right-from-bracket"></i>
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;

                const btnClosePerfil = document.getElementById('btn-fechar-perfil');

                btnClosePerfil.addEventListener('click', () => {
                    if (popupPerfil.classList.contains('active')) {
                        popupPerfil.classList.remove('active');
                    } else {
                        popupPerfil.classList.add('active');

                        popupPerfil.innerHTML =
                            `
                                <i id="btn-fechar-perfil" class="fa-regular fa-circle-xmark"></i>
                                <div class="content-perfil">
                                    <div class="content-perfil-top">
                                        <i class="fa-solid fa-user"></i>
                                        <div class="perfil-top-text">
                                            <h5>
                                                ${nomeUsuario}
                                            </h5>
                                            <h6 style="padding-left: 0.6rem;">
                                                ${emailUsuario}
                                            </h6>
                                        </div>
                                    </div>
                                    <div class="content-perfil-bottom">
                                        <div class="perfil-bottom-info">
                                            <div class="info-box-text">
                                                <i class="fa-regular fa-building"></i>
                                                <span>
                                                    <h6>Empresa</h6>
                                                    <h5>${empresaUsuario}</h5>
                                                </span>
                                            </div>
                                            <div class="info-box-text">
                                                <i class="fa-regular fa-address-card"></i>
                                                <span>
                                                    <h6>Permissão</h6>
                                                    <h5>${permissaoUsuario}</h5>
                                                </span>
                                            </div>
                                        </div>
                                        <div class="perfil-bottom-btn">
                                            <button>
                                                <i class="fa-regular fa-pen-to-square"></i>
                                                Editar
                                            </button>
                                            <button onclick="limparSessao()">
                                                <i class="fa-solid fa-right-from-bracket"></i>
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                </div>
                    
                            `;
                    }
                })
            }
        })
    } else if (permissaoUsuario == 'Root') {
        navLogin.innerHTML =
            `
            <button id="btn-pagina-empresa" onclick="redirecionamento_cadastroServidor()">
                Painel Empresa
            </button>
            <button id="btn-perfil-usuario">
                <i class="fa-solid fa-user" style="color: rgb(255, 255, 255);"></i>
                Perfil
            </button>
        `;

        const btnPerfil = document.getElementById('btn-perfil-usuario');

        btnPerfil.addEventListener('click', () => {
            if (popupPerfil.classList.contains('active')) {
                popupPerfil.classList.remove('active');
            } else {
                popupPerfil.classList.add('active');

                popupPerfil.innerHTML =
                    `
                    <i id="btn-fechar-perfil" class="fa-regular fa-circle-xmark"></i>
                        <div class="content-perfil">
                            <div class="content-perfil-top">
                                <i class="fa-solid fa-user"></i>
                                <div class="perfil-top-text">
                                    <h5>
                                        ${nomeUsuario}
                                    </h5>
                                    <h6>
                                        ${emailUsuario}
                                    </h6>
                                </div>
                            </div>
                            <div class="content-perfil-bottom">
                                <div class="perfil-bottom-info">
                                    <div class="info-box-text">
                                        <i class="fa-regular fa-building"></i>
                                        <span class="empresa-limit">
                                            <h6>Empresa</h6>
                                            <h5>${nomeEmpresaUsuario}</h5>
                                        </span>
                                    </div>
                                    <div class="info-box-text">
                                        <i class="fa-regular fa-address-card"></i>
                                        <span>
                                            <h6>Permissão</h6>
                                            <h5>${permissaoUsuario}</h5>
                                        </span>
                                    </div>
                                </div>
                                <div class="perfil-bottom-btn">
                                    <button>
                                        <i class="fa-regular fa-pen-to-square"></i>
                                        Editar
                                    </button>
                                    <button onclick="limparSessao()">
                                        <i class="fa-solid fa-right-from-bracket"></i>
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;

                const btnClosePerfil = document.getElementById('btn-fechar-perfil');

                btnClosePerfil.addEventListener('click', () => {
                    if (popupPerfil.classList.contains('active')) {
                        popupPerfil.classList.remove('active');
                    } else {
                        popupPerfil.classList.add('active');

                        popupPerfil.innerHTML =
                            `
                                <i id="btn-fechar-perfil" class="fa-regular fa-circle-xmark"></i>
                                <div class="content-perfil">
                                    <div class="content-perfil-top">
                                        <i class="fa-solid fa-user"></i>
                                        <div class="perfil-top-text">
                                            <h5>
                                                ${nomeUsuario}
                                            </h5>
                                            <h6 style="padding-left: 0.6rem;">
                                                ${emailUsuario}
                                            </h6>
                                        </div>
                                    </div>
                                    <div class="content-perfil-bottom">
                                        <div class="perfil-bottom-info">
                                            <div class="info-box-text">
                                                <i class="fa-regular fa-building"></i>
                                                <span>
                                                    <h6>Empresa</h6>
                                                    <h5>${empresaUsuario}</h5>
                                                </span>
                                            </div>
                                            <div class="info-box-text">
                                                <i class="fa-regular fa-address-card"></i>
                                                <span>
                                                    <h6>Permissão</h6>
                                                    <h5>${permissaoUsuario}</h5>
                                                </span>
                                            </div>
                                        </div>
                                        <div class="perfil-bottom-btn">
                                            <button>
                                                <i class="fa-regular fa-pen-to-square"></i>
                                                Editar
                                            </button>
                                            <button onclick="limparSessao()">
                                                <i class="fa-solid fa-right-from-bracket"></i>
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                </div>
                    
                            `;
                    }
                })
            }
        })
    }


}

function limparSessao() {
    localStorage.clear();
    window.location = '../public/main.html';
}

function dadosUser() {
    const usuarioTexto = localStorage.getItem('usuarioLogado');
    const usuarioLogado = JSON.parse(usuarioTexto);

    return usuarioLogado;
}

// carregamento (loading)
function aguardar() {
    var divAguardar = document.getElementById('div_aguardar');
    divAguardar.style.display = 'flex';
}

function finalizarAguardar(texto) {
    var divAguardar = document.getElementById('div_aguardar');
    divAguardar.style.display = 'none';

    var divErrosLogin = document.getElementById('div_erros_login');
    if (texto) {
        divErrosLogin.style.display = 'flex';
        divErrosLogin.innerHTML = texto;
    }
}
