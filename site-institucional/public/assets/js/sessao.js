// sessão
function validarSessao() {
    // guarda qual página o usuário está
    let pagina_now = window.location.pathname;
    let paginas_com_login = [''] // páginas que o usuário não pode acessar sem login

    const usuarioTexto = localStorage.getItem('usuarioLogado'); // pega as coisas salvas no localStorage

    if (usuarioTexto == null && !pagina_now.includes("main.html")) {
        window.location.href = "../public/main.html";
        return;
    }

    const usuarioLogado = JSON.parse(usuarioTexto);

    // salvando infos do usuário no localStorage

    const nomeUsuario = usuarioLogado.nome;
    const permissaoUsuario = usuarioLogado.nomePermissao;
    const empresaUsuario = usuarioLogado.idEmpresa;

    // salvando div da navbar para adicionar comportamento
    const navLogin = document.querySelector('.nav-login');
    const popupPerfil = document.querySelector('.popup-perfil');

    if(permissaoUsuario == 'Usuario'){
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

        btnPerfil.addEventListener('click', () =>{
            if(popupPerfil.classList.contains('active')){
                popupPerfil.classList.remove('active');
            }else{
                popupPerfil.classList.add('active');

                popupPerfil.innerHTML = 
                `
                    
                `;
            }
        })
    }else if(permissaoUsuario == 'Gerente'){
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
    }else if(permissaoUsuario == 'Admin'){
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
    }else if(permissaoUsuario == 'Root'){
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
    }

    
}

function limparSessao() {
    localStorage.clear();
    window.location = '../public/main.html';
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
