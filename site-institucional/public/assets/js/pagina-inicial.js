document.addEventListener('DOMContentLoaded', function () {
  var usuario = lerDadosSessao();

  if (!usuario) {
    redirecionar('login');
    return;
  }

  document.getElementById('nome-usuario-dashboard').textContent = String(usuario.nome || '').toUpperCase();
  document.getElementById('cargo-usuario-dashboard').textContent = usuario.nomeNivelAcesso || 'Colaborador';
  document.getElementById('nome-empresa-dashboard').textContent = usuario.nomeEmpresa || 'MINHA EMPRESA';

  filtrarDashboardsPorPermissao(usuario);

  if (usuario.idEmpresa) {
    carregarKpisAlertas(usuario.idEmpresa);
  } else {
    marcarKpisIndisponiveis();
  }
});

function filtrarDashboardsPorPermissao(usuario) {
  document.querySelectorAll('.card_dashboard[data-permissoes]').forEach(function (card) {
    var permissoes = card.dataset.permissoes.split(',');
    var permitido = nivelUsuario(usuario) === 'Root' || permissoes.some(function (permissao) {
      return usuarioPossuiPermissao(usuario, permissao);
    });

    card.hidden = !permitido;
  });
}

function carregarKpisAlertas(idEmpresa) {
  var empresa = encodeURIComponent(idEmpresa);
  var base = '/dashboardAlertas';

  carregarKpiAlerta(
    base + '/kpi-abertos/' + empresa + '?periodo=hoje',
    'alertas_abertos',
    'kpi-alertas-abertos',
    'status-alertas-abertos',
    function (valor) {
      return valor === 0
        ? ['Nenhum alerta criado hoje segue aberto', 'status_otimo']
        : ['Alertas abertos criados hoje', ''];
    }
  );

  carregarKpiAlerta(
    base + '/kpi-criticos-abertos/' + empresa + '?periodo=hoje',
    'criticos_abertos',
    'kpi-alertas-criticos',
    'status-alertas-criticos',
    function (valor) {
      return valor === 0
        ? ['Nenhum crítico criado hoje segue aberto', 'status_otimo']
        : ['Criados hoje · atenção prioritária', 'status_critico_texto'];
    }
  );

  carregarKpiAlerta(
    base + '/kpi-fora-sla/' + empresa + '?periodo=hoje',
    'fora_sla',
    'kpi-alertas-sla',
    'status-alertas-sla',
    function (valor) {
      return valor === 0
        ? ['Nenhum alerta de hoje excedeu o SLA', 'status_otimo']
        : ['Alertas de hoje excederam o SLA', 'status_ruim'];
    }
  );
}

function carregarKpiAlerta(url, campo, idValor, idStatus, formatarStatus) {
  fetch(url, {
    cache: 'no-store',
    credentials: 'same-origin'
  })
    .then(function (resposta) {
      if (resposta.status === 204) {
        return 0;
      }

      if (!resposta.ok) {
        throw new Error('Falha HTTP ' + resposta.status);
      }

      return resposta.json().then(function (dados) {
        if (!Array.isArray(dados) || dados.length === 0) {
          return 0;
        }

        var valor = Number(dados[0][campo]);
        if (!Number.isFinite(valor)) {
          throw new Error('A resposta não contém uma contagem válida para ' + campo);
        }

        return valor;
      });
    })
    .then(function (valor) {
      document.getElementById(idValor).textContent = valor.toLocaleString('pt-BR');

      var status = formatarStatus(valor);
      definirStatusKpi(document.getElementById(idStatus), status[0], status[1]);
    })
    .catch(function (erro) {
      console.error('Falha ao carregar KPI da página inicial:', erro);
      document.getElementById(idValor).textContent = '—';
      definirStatusKpi(document.getElementById(idStatus), 'Dados indisponíveis', 'status_ruim');
    });
}

function marcarKpisIndisponiveis() {
  [
    ['kpi-alertas-abertos', 'status-alertas-abertos'],
    ['kpi-alertas-criticos', 'status-alertas-criticos'],
    ['kpi-alertas-sla', 'status-alertas-sla']
  ].forEach(function (ids) {
    document.getElementById(ids[0]).textContent = '—';
    definirStatusKpi(document.getElementById(ids[1]), 'Empresa não identificada', 'status_ruim');
  });
}

function definirStatusKpi(elemento, mensagem, classe) {
  elemento.textContent = mensagem;
  elemento.classList.remove('status_otimo', 'status_ruim', 'status_critico_texto');

  if (classe) {
    elemento.classList.add(classe);
  }
}

function rolarParaSecao(idSecao) {
  var elemento = document.getElementById(idSecao);
  if (elemento) {
    if (elemento.tagName === 'DETAILS') {
      elemento.open = true;
    }

    elemento.scrollIntoView({ behavior: 'smooth' });
  }
}
