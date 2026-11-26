var rotas = {
    home: './main.html',
    login: './login.html',
    sobre_nos: './sobrenos.html',
    contato: './sobrenos.html#contato',
    inicio: './pagina-inicial.html',
    dashboard_empresa: './dash-empresa.html',
    dashboard_servidor: './dashboard-servidor.html',
    hardwares: './hardwares.html',
    usuarios: './usuarios.html',
    criar_relatorio: './relatorios.html#cadastro',
    lista_relatorios: './relatorios.html#relatorios',
    plataformas_externas: './plataformas_externas.html',
    dashboard_gestao_problemas: './dash-gestao-problemas.html'
};

function redirecionar(nome) {
    if (!rotas[nome]) {
        return;
    }

    window.location.href = rotas[nome];
}
