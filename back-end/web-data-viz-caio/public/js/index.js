// valida a sessão do usuário, ou seja, ve se ele está logado ou não

let validar_sessao_home = validarSessao();

console.log(validar_sessao_home)

if (validar_sessao_home == 'user') {

    // email e nome do BD
    var email = sessionStorage.EMAIL_USUARIO;
    var nome = sessionStorage.NOME_USUARIO;

    // linkando os elementos html da page INDEX
    let ul_navLinks = document.getElementById('nav-links-ul');
    let div_navButtons = document.getElementById('nav-buttons');

    let container_sectionLogar = document.getElementById('section-logar');

    let ul_footerLinks = document.getElementById('footer-links-ul');

    let container_perfilUser = document.getElementById('perfil-user');

    // mudando o comportamento da navbar, após o usuário logar ele consegue navegador por todas as páginas
    ul_navLinks.innerHTML =
        `
            <li>
                <a class="selected" href="./index.html">Home</a>
            </li>
            <li>
                <a href="./historia.html">História</a>
            </li>
            <li>
                <a href="./quiz.html">Quiz</a>
            </li>
            <li>
                <a href="./placar.html">Placar</a>
            </li>
            <li>
                <a href="./status.html">Seu Status</a>
            </li>
        `;

    div_navButtons.innerHTML =
        `
            <img src="./assets/icones/user-asta.png" alt="icone_asta" title="Clique para ver seu perfil." id="btn-icone-perfil">
        `;

    // comportamento do perfil_user

    container_perfilUser.innerHTML =
        `
            <i class="fa-solid fa-circle-xmark" id="btn-fechar_perfil"></i>
            <div class="container-perfil-title">
                <div class="perfil-title-left">
                    <img src="./assets/icones/user-asta.png" alt="icone_asta" title="Asta">
                </div>
                <div class="perfil-title-right">
                    <h1>${nome}</h1>
                    <span>Mago do Reino de Clover</span>
                </div>
            </div>
            <div class="divisao-perfil">
                <span></span>
                <img src="./assets/icones/logo.png" alt="logo_nav">
                <span></span>

            </div>
            <div class="content-perfil">
                <div class="content-perfil-info">
                    <i class="fa-solid fa-envelope"></i>
                    <h6>
                        Email: 
                        <span>
                            ${email}
                        </span>
                    </h6>
                </div>
                <div class="content-perfil-button">
                    <button onclick="limparSessao()">
                        <i class="fa-solid fa-arrow-right-from-bracket"></i>
                        Logout
                    </button>
                </div>
            </div>
        `;

    // removendo a section de logar
    container_sectionLogar.style.display = 'none';

    //mudando o comportamento do footer
    ul_footerLinks.innerHTML =
        `
                <li>
                    <a href="./historia.html">
                        História
                    </a>
                    <a href="./quiz.html">
                        Quiz
                    </a>
                </li>
                <li>
                    <a href="./placar.html">
                        Placar
                    </a>
                    <a href="./status.html">
                        Seu Status
                    </a>
                </li>
        `;

    // lógica do perfil
    let container_perfil_user = document.getElementById('perfil-user');
    let icone_perfil = document.getElementById('btn-icone-perfil');
    let btn_fechar_perfil_user = document.getElementById('btn-fechar_perfil');

    icone_perfil.addEventListener('click', () => {
        let display_container = getComputedStyle(container_perfil_user).display;

        if (display_container == 'none') {
            container_perfil_user.style.display = 'flex';
        } else {
            container_perfil_user.style.display = 'none';
        }
    })

    btn_fechar_perfil_user.addEventListener('click', () => {
        container_perfil_user.style.display = 'none';
    })

}else if(validar_sessao_home == 'admin'){
    // email e nome do BD
    var email = sessionStorage.EMAIL_USUARIO;
    var nome = sessionStorage.NOME_USUARIO;

    // linkando os elementos html da page INDEX
    let ul_navLinks = document.getElementById('nav-links-ul');
    let div_navButtons = document.getElementById('nav-buttons');

    let container_sectionLogar = document.getElementById('section-logar');

    let ul_footerLinks = document.getElementById('footer-links-ul');

    let container_perfilUser = document.getElementById('perfil-user');

    // mudando o comportamento da navbar, após o usuário logar ele consegue navegador por todas as páginas
    ul_navLinks.innerHTML =
        `
            <li>
                <a class="selected" href="./index.html">Home</a>
            </li>
            <li>
                <a href="./historia.html">História</a>
            </li>
            <li>
                <a href="./quiz.html">Quiz</a>
            </li>
            <li>
                <a href="./placar.html">Placar</a>
            </li>
            <li>
                <a href="./status.html">Seu Status</a>
            </li>
        `;

    div_navButtons.innerHTML =
        `
            <img src="./assets/icones/user-asta.png" alt="icone_asta" title="Clique para ver seu perfil." id="btn-icone-perfil">
            <button class="btn-admin" onclick="redirecionamento_dashboard()">Painel Administrador</button>
        `;

    // comportamento do perfil_user

    container_perfilUser.innerHTML =
        `
            <i class="fa-solid fa-circle-xmark" id="btn-fechar_perfil"></i>
            <div class="container-perfil-title">
                <div class="perfil-title-left">
                    <img src="./assets/icones/user-asta.png" alt="icone_asta" title="Asta">
                </div>
                <div class="perfil-title-right">
                    <h1>${nome}</h1>
                    <span>Mago do Reino de Clover</span>
                </div>
            </div>
            <div class="divisao-perfil">
                <span></span>
                <img src="./assets/icones/logo.png" alt="logo_nav">
                <span></span>

            </div>
            <div class="content-perfil">
                <div class="content-perfil-info">
                    <i class="fa-solid fa-envelope"></i>
                    <h6>
                        Email: 
                        <span>
                            ${email}
                        </span>
                    </h6>
                </div>
                <div class="content-perfil-button">
                    <button onclick="limparSessao()">
                        <i class="fa-solid fa-arrow-right-from-bracket"></i>
                        Logout
                    </button>
                </div>
            </div>
        `;

    // removendo a section de logar
    container_sectionLogar.style.display = 'none';

    //mudando o comportamento do footer
    ul_footerLinks.innerHTML =
        `
                <li>
                    <a href="./historia.html">
                        História
                    </a>
                    <a href="./quiz.html">
                        Quiz
                    </a>
                </li>
                <li>
                    <a href="./placar.html">
                        Placar
                    </a>
                    <a href="./status.html">
                        Seu Status
                    </a>
                </li>
        `;

    // lógica do perfil
    let container_perfil_user = document.getElementById('perfil-user');
    let icone_perfil = document.getElementById('btn-icone-perfil');
    let btn_fechar_perfil_user = document.getElementById('btn-fechar_perfil');

    icone_perfil.addEventListener('click', () => {
        let display_container = getComputedStyle(container_perfil_user).display;

        if (display_container == 'none') {
            container_perfil_user.style.display = 'flex';
        } else {
            container_perfil_user.style.display = 'none';
        }
    })

    btn_fechar_perfil_user.addEventListener('click', () => {
        container_perfil_user.style.display = 'none';
    })
}

// cards personagens click

let cards_personagens_home = document.querySelectorAll('.card-personagens');

cards_personagens_home.forEach(cards => {
    cards.addEventListener('click', () => {
        window.location = "../historia.html#personagens";
    });
});

let cards_personagens_home2 = document.querySelectorAll('.card-personagens-2');

cards_personagens_home2.forEach(cards => {
    cards.addEventListener('click', () => {
        window.location = "../historia.html#personagens";
    });
});



