function lerUsuarioLogado() {
    try {
        const texto = localStorage.getItem('usuarioLogado');
        return texto ? JSON.parse(texto) : null;
    } catch (erro) {
        return null;
    }
}

function nivelUsuarioAtualEhRoot(usuario) {
    const nivel = usuario.nomeNivelAcesso || usuario.nomePermissao;
    return nivel === 'Root';
}

function mostrarAvisoAcesso(texto) {
    const aviso = document.getElementById('aviso-acesso');
    const mensagem = document.getElementById('texto-aviso-acesso');

    mensagem.textContent = texto;
    aviso.hidden = false;
}

function mostrarEstado(texto, tipo) {
    const elemento = document.getElementById('mensagem-estado');

    elemento.textContent = texto;
    elemento.className = 'mensagem-estado' + (tipo ? ' ' + tipo : '');
}

function criarCelula(texto, classe) {
    const celula = document.createElement('td');
    celula.textContent = texto == null || texto === '' ? '-' : String(texto);

    if (classe) {
        celula.className = classe;
    }

    return celula;
}

function nomeAmigavelPermissao(nome) {
    const nomes = {
        DASHBOARD_GERAL_VISUALIZAR: 'Visualizar dashboard geral',
        EQUIPAMENTOS_VISUALIZAR: 'Visualizar equipamentos',
        EQUIPAMENTOS_CADASTRAR: 'Cadastrar equipamentos',
        EQUIPAMENTOS_EDITAR: 'Editar equipamentos',
        EQUIPAMENTOS_EXCLUIR: 'Excluir equipamentos',
        EQUIPAMENTOS_SERVIDORES_VISUALIZAR: 'Visualizar servidores',
        EQUIPAMENTOS_NOTEBOOKS_VISUALIZAR: 'Visualizar notebooks e computadores',
        EQUIPAMENTOS_REDE_VISUALIZAR: 'Visualizar equipamentos de rede',
        ALERTAS_VISUALIZAR: 'Visualizar alertas',
        ALERTAS_CONFIGURAR: 'Configurar alertas',
        RELATORIOS_VISUALIZAR: 'Visualizar relatórios',
        RELATORIOS_GERENCIAR: 'Gerenciar relatórios',
        USUARIOS_VISUALIZAR: 'Visualizar usuários',
        USUARIOS_GERENCIAR: 'Gerenciar usuários'
    };

    return nomes[nome] || nome;
}

function criarSeletorNivel(usuario) {
    const seletor = document.createElement('select');
    seletor.className = 'seletor-permissao';

    const opcaoAdministrador = document.createElement('option');
    opcaoAdministrador.value = 'Administrador';
    opcaoAdministrador.textContent = 'Administrador';
    seletor.appendChild(opcaoAdministrador);

    const opcaoUsuario = document.createElement('option');
    opcaoUsuario.value = 'Usuario';
    opcaoUsuario.textContent = 'Usuário comum';
    seletor.appendChild(opcaoUsuario);

    if (usuario.nomeNivelAcesso === 'Root') {
        const opcaoRoot = document.createElement('option');
        opcaoRoot.value = 'Root';
        opcaoRoot.textContent = 'Root';
        seletor.appendChild(opcaoRoot);
    }

    seletor.value = usuario.nomeNivelAcesso;
    return seletor;
}

function criarListaPermissoes(usuario, permissoesDisponiveis) {
    const caixa = document.createElement('div');
    caixa.className = 'lista-permissoes-usuario';

    for (let i = 0; i < permissoesDisponiveis.length; i++) {
        const permissao = permissoesDisponiveis[i];
        const rotulo = document.createElement('label');
        rotulo.className = 'item-permissao-usuario';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = String(permissao.idPermissao);
        checkbox.checked = usuario.idsPermissoes.includes(permissao.idPermissao);

        const texto = document.createElement('span');
        texto.textContent = nomeAmigavelPermissao(permissao.nome);

        rotulo.appendChild(checkbox);
        rotulo.appendChild(texto);
        caixa.appendChild(rotulo);
    }

    return caixa;
}

function coletarIdsPermissoes(caixaPermissoes) {
    const checkboxes = caixaPermissoes.querySelectorAll('input[type="checkbox"]:checked');
    const ids = [];

    for (let i = 0; i < checkboxes.length; i++) {
        ids.push(Number(checkboxes[i].value));
    }

    return ids;
}

function criarLinhaUsuario(usuario, atual, permissoesDisponiveis) {
    const linha = document.createElement('tr');
    linha.appendChild(criarCelula(usuario.nome));
    linha.appendChild(criarCelula(usuario.email, 'email-usuario'));

    const celulaNivel = document.createElement('td');
    const seletorNivel = criarSeletorNivel(usuario);
    celulaNivel.appendChild(seletorNivel);
    linha.appendChild(celulaNivel);

    const celulaPermissoes = document.createElement('td');
    const caixaPermissoes = criarListaPermissoes(usuario, permissoesDisponiveis);
    celulaPermissoes.appendChild(caixaPermissoes);
    linha.appendChild(celulaPermissoes);

    const celulaAcao = document.createElement('td');
    const botaoSalvar = document.createElement('button');
    botaoSalvar.type = 'button';
    botaoSalvar.className = 'btn-salvar-permissao';
    botaoSalvar.textContent = 'Salvar';

    const ehUsuarioAtual = Number(usuario.idUsuario) === Number(atual.id);
    const ehRoot = usuario.nomeNivelAcesso === 'Root';
    const permissoesAtuais = Array.isArray(atual.permissoes)
        ? atual.permissoes
        : [];
    const podeGerenciar = nivelUsuarioAtualEhRoot(atual) ||
        permissoesAtuais.includes('USUARIOS_GERENCIAR');

    if (ehUsuarioAtual || ehRoot || !podeGerenciar) {
        seletorNivel.disabled = true;
        botaoSalvar.disabled = true;

        const checkboxes = caixaPermissoes.querySelectorAll('input');
        for (let i = 0; i < checkboxes.length; i++) {
            checkboxes[i].disabled = true;
        }

        if (ehUsuarioAtual) {
            botaoSalvar.title = 'Não é permitido alterar o próprio acesso.';
        } else if (ehRoot) {
            botaoSalvar.title = 'O acesso do Root não pode ser alterado nesta tela.';
        } else {
            botaoSalvar.title = 'Você não possui permissão para gerenciar usuários.';
        }
    }

    botaoSalvar.addEventListener('click', function () {
        const nomeNivelAcesso = seletorNivel.value;
        const idsPermissoes = coletarIdsPermissoes(caixaPermissoes);

        if (nomeNivelAcesso !== 'Administrador' && nomeNivelAcesso !== 'Usuario') {
            mostrarEstado('Selecione um nível de acesso válido.', 'erro');
            return;
        }

        seletorNivel.disabled = true;
        botaoSalvar.disabled = true;
        mostrarEstado('Salvando nível e permissões...', '');

        fetch('/usuarios/' + encodeURIComponent(usuario.idUsuario) + '/acesso', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idSolicitante: atual.id,
                idEmpresa: atual.idEmpresa,
                nomeNivelAcesso: nomeNivelAcesso,
                idsPermissoes: idsPermissoes
            })
        })
            .then(function (resposta) {
                if (!resposta.ok) {
                    return resposta.text().then(function (textoErro) {
                        throw new Error(textoErro || 'Não foi possível alterar o acesso.');
                    });
                }

                return resposta.json();
            })
            .then(function (resultado) {
                usuario.nomeNivelAcesso = resultado.nomeNivelAcesso;
                usuario.idsPermissoes = resultado.idsPermissoes;

                mostrarEstado(
                    'Acesso de ' + usuario.nome + ' atualizado com sucesso.',
                    'sucesso'
                );
            })
            .catch(function (erro) {
                mostrarEstado(erro.message || 'Erro ao alterar o acesso.', 'erro');
            })
            .finally(function () {
                seletorNivel.disabled = false;
                botaoSalvar.disabled = false;
            });
    });

    celulaAcao.appendChild(botaoSalvar);
    linha.appendChild(celulaAcao);
    return linha;
}

function renderizarUsuarios(usuarios, atual, permissoesDisponiveis) {
    const corpo = document.getElementById('corpo-tabela-usuarios');
    corpo.replaceChildren();

    if (usuarios.length === 0) {
        const linha = document.createElement('tr');
        const celula = document.createElement('td');
        celula.colSpan = 5;
        celula.textContent = 'Nenhum usuário encontrado para esta empresa.';
        linha.appendChild(celula);
        corpo.appendChild(linha);
        return;
    }

    for (let i = 0; i < usuarios.length; i++) {
        corpo.appendChild(
            criarLinhaUsuario(usuarios[i], atual, permissoesDisponiveis)
        );
    }
}

function carregarDadosTela(atual) {
    const parametros = new URLSearchParams({
        idSolicitante: String(atual.id),
        idEmpresa: String(atual.idEmpresa)
    });

    const requisicaoPermissoes = fetch('/usuarios/permissoes?' + parametros.toString(), {
        cache: 'no-store'
    });

    const requisicaoUsuarios = fetch('/usuarios?' + parametros.toString(), {
        cache: 'no-store'
    });

    Promise.all([requisicaoPermissoes, requisicaoUsuarios])
        .then(function (respostas) {
            if (!respostas[0].ok || !respostas[1].ok) {
                return Promise.all([
                    respostas[0].text(),
                    respostas[1].text()
                ]).then(function (textos) {
                    throw new Error(textos[0] || textos[1] || 'Não foi possível carregar a tela.');
                });
            }

            return Promise.all([respostas[0].json(), respostas[1].json()]);
        })
        .then(function (resultados) {
            const permissoes = resultados[0];
            const usuarios = resultados[1];
            renderizarUsuarios(usuarios, atual, permissoes);
        })
        .catch(function (erro) {
            mostrarEstado(erro.message || 'Erro ao carregar os usuários.', 'erro');
        });
}

(function iniciarTelaUsuarios() {
    const usuario = lerUsuarioLogado();

    if (!usuario || !usuario.id || !usuario.idEmpresa) {
        window.location.replace('../public/login.html');
        return;
    }

    const nivel = usuario.nomeNivelAcesso || usuario.nomePermissao;

    const permissoes = Array.isArray(usuario.permissoes)
        ? usuario.permissoes
        : [];
    const podeVisualizarUsuarios = permissoes.includes('USUARIOS_VISUALIZAR');
    const podeGerenciarUsuarios = permissoes.includes('USUARIOS_GERENCIAR');

    if (nivel !== 'Root' &&
        !podeVisualizarUsuarios &&
        !podeGerenciarUsuarios) {
        mostrarAvisoAcesso('Você não possui permissão para acessar o gerenciamento de usuários.');

        window.setTimeout(function () {
            window.location.replace('./hardwares.html');
        }, 2500);
        return;
    }

    document.getElementById('painel-usuarios').hidden = false;

    if (typeof validarSessao === 'function') {
        validarSessao();
    }

    carregarDadosTela(usuario);
})();
