document.addEventListener('DOMContentLoaded', function () {
  // 1. Validar se a sessão está ativa
  var usuario = lerDadosSessao();
  if (!usuario) {
    redirecionar('login');
    return;
  }

  // 2. Preencher os dados do cabeçalho
  document.getElementById('nome-usuario-dashboard').textContent = usuario.nome.toUpperCase();
  document.getElementById('cargo-usuario-dashboard').textContent = usuario.nomeNivelAcesso || 'Colaborador';
  document.getElementById('nome-empresa-dashboard').textContent = usuario.nomeEmpresa || 'MINHA EMPRESA';

  // 3. Buscar dados de equipamentos para atualizar alertas dinamicamente
  if (usuario.idEmpresa && usuario.id) {
    buscarMétricasIniciais(usuario.idEmpresa, usuario.id);
  }
});

function buscarMétricasIniciais(idEmpresa, idUsuario) {
  fetch('/hardwares/buscarEq/' + idEmpresa + '?idUsuario=' + idUsuario, {
    cache: 'no-store'
  })
  .then(function (resposta) {
    if (resposta.ok && resposta.status !== 204) {
      return resposta.json();
    }
    return [];
  })
  .then(function (equipamentos) {
    var qtdAlertas = 24;
    var qtdCriticos = 3;
    
    equipamentos.forEach(function (eq) {
      if (eq.statusEquipamento === 'Atenção' || eq.statusEquipamento === 'Manutenção') {
        qtdAlertas++;
      } else if (eq.statusEquipamento === 'Inativo' || eq.statusEquipamento === 'Crítico') {
        qtdAlertas++;
        qtdCriticos++;
      }
    });

    var elAlertas = document.getElementById('qtd-alertas-ativos');
    var elSubtexto = document.getElementById('subtexto-alertas');
    
    if (elAlertas) elAlertas.textContent = qtdAlertas;
    if (elSubtexto) elSubtexto.textContent = qtdCriticos + " alerta(s) crítico(s)";
  })
  .catch(function (erro) {
    console.error("Erro ao carregar métricas iniciais:", erro);
  });
}

function rolarParaSecao(idSecao) {
  var elemento = document.getElementById(idSecao);
  if (elemento) {
    elemento.scrollIntoView({ behavior: 'smooth' });
  }
}



function carregarDashboardDinamico() {
  var usuario = lerDadosSessao(); // Lê o usuário logado
  if (!usuario) return;

  // 1. Atualiza cabeçalho com os dados reais do usuário
  document.getElementById('nome-usuario-dashboard').textContent = usuario.nome.toUpperCase();
  document.getElementById('cargo-usuario-dashboard').textContent = usuario.nomeNivelAcesso || 'Colaborador';
  document.getElementById('nome-empresa-dashboard').textContent = usuario.nomeEmpresa.toUpperCase();

  // 2. Busca KPIs dinâmicos da empresa no banco de dados
  fetch('/hardwares/metricas-dashboard/' + usuario.idEmpresa)
    .then(res => res.json())
    .then(data => {
      // Atualiza Card: Disponibilidade Interna
      document.getElementById('valor-disp-interna').textContent = data.disponibilidadeInterna + "%";
      
      // Atualiza Card: Alertas Ativos
      document.getElementById('qtd-alertas-ativos').textContent = data.alertasAtivos;
      document.getElementById('subtexto-alertas').textContent = data.alertasCriticos + " alerta(s) crítico(s)";
      
      // Atualiza Card: Disponibilidade Externa
      document.getElementById('valor-disp-externa').textContent = data.disponibilidadeExterna + "%";
    });
}