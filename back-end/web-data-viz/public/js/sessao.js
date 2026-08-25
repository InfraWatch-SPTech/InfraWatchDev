// sessão
function validarSessao() {
    // guarda qual página o usuário está
    let pagina_now = window.location.pathname;
    let paginas_com_login = ['/quiz.html', '/placar.html', '/status.html']

    // email e nome do BD
    var email = sessionStorage.EMAIL_USUARIO;
    var nome = sessionStorage.NOME_USUARIO;
    var perm = sessionStorage.PERM_USUARIO;

    // verifica se o usuário está em uma sessão:
    if (email != null && nome != null) {
        if (perm == 2) {
            return 'user';
        } else {
            return 'admin';
        }

        // se ele não estiver
    } else if (paginas_com_login.includes(pagina_now)) {
        alert("Você deve logar para acessar!");
        window.location = "../index.html";
    }
}

function limparSessao() {
    sessionStorage.clear();
    window.location = '../index.html';
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

