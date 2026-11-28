var rotas = {
    home: './main.html',
    login: './login.html',
    sobre_nos: './sobrenos.html',
    contato: './sobrenos.html#contato',
    inicio: './pagina-inicial.html',
    dashboard_alertas: './dashboard-alertas.html',
    dashboard_padroes: './dashboard-padroes.html',
    dashboard_comportamento_servidor: './dashboard_comportamento-servidor.html',
    dashboard_previsibilidade: './dashboard-previsibilidade.html',
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
