let dadosUsuario = dadosUser();
let idEmpresa = dadosUsuario.idEmpresa;
let ultimaListaEquipamentos = [];

function mapearClasseStatus(status) {
    if (status === "Ativo" || status === "Online") {
        return "status_ativo";
    } else if (status === "Manutenção") {
        return "status_atencao";
    } else {
        return "status_inativo";
    }
}

function montarLinhaTabela(equipamento) {
    return `
        <tr>
            <td class="celula_dispositivo">
                <div class="icone_dispositivo">
                    <i class="fa-solid fa-server" style="color: rgb(255, 255, 255);"></i>
                </div>
                <div class="info_dispositivo">
                    <strong>${equipamento.nomeEquipamento}</strong>
                    <span>ID: HW-${String(equipamento.idEquipamento).padStart(4, '0')}</span>
                </div>
            </td>
            <td>${equipamento.tipoEquipamento || '-'}</td>
            <td class="celula_componentes">${equipamento.nomeComponente || '-'}</td>
            <td>${equipamento.localizacao || '-'}</td>
            <td>
                <span class="status ${mapearClasseStatus(equipamento.statusEquipamento)}">
                    ${equipamento.statusEquipamento || '-'}
                </span>
            </td>
            <td>-</td>
            <td class="celula_acoes">
                <!-- ao clicar, abre o modal de edição já preenchido com os dados deste equipamento -->
                <button class="btn_icone btn_visualizar" onclick="modalVisualizar(${equipamento.idEquipamento})" title="Visualizar">
                    <i class="fa-regular fa-eye" style="color: rgb(255, 255, 255);"></i>  
                </button>
                <button class="btn_icone btn_editar" onclick="abrirModalEditar(${equipamento.idEquipamento})" title="Editar">
                    <i class="fa-solid fa-pen-to-square" style="color: rgb(255, 255, 255);"></i>
                </button>
                <button class="btn_icone btn_excluir ${equipamento.idEquipamento}" onclick="deletarEquipamento(${equipamento.idEmpresa}, ${equipamento.idEquipamento})" title="Excluir">
                    <i class="fa-solid fa-trash" style="color: rgb(255, 255, 255);"></i>
                </button>
            </td>
        </tr>
    `;
}

function renderizarTabela(equipamentos) {
    let corpoTabela = document.getElementById('corpo-tabela-hardwares');
    corpoTabela.innerHTML = '';

    let equipamentosAgrupados = {};

    for (let i = 0; i < equipamentos.length; i++) {
        let equipamento = equipamentos[i];
        let id = equipamento.idEquipamento;

        if (!equipamentosAgrupados[id]) {
            equipamentosAgrupados[id] = equipamento;
            equipamentosAgrupados[id].nomeComponente = equipamento.nomeComponente;
        } else {
            equipamentosAgrupados[id].nomeComponente += ", " + equipamento.nomeComponente;
        }
    }

    let quantidadeEquipamentosTela = document.getElementById('select_eqp_pagina');

    for (let i in equipamentosAgrupados) {
        corpoTabela.innerHTML += montarLinhaTabela(equipamentosAgrupados[i]);
    }

    aplicarPermissoes();
}

function buscarEquipamentosEmpresa(idEmpresa)
{
    fetch(`/hardwares/buscarEq/${idEmpresa}?idUsuario=${dadosUsuario.id}`, { cache: 'no-store' })
        .then(function (response) {
            if (response.ok) {
                if (response.status === 204) {
                    renderizarTabela([]);
                } else {
                    response.json().then(function (equipamentos) {
                        if (equipamentos && equipamentos.length > 0) {
                            ultimaListaEquipamentos = equipamentos;
                            renderizarTabela(equipamentos);
                        } else {
                            ultimaListaEquipamentos = [];
                            renderizarTabela([]);
                        }
                    }).catch(function () {
                        renderizarTabela([]);
                    });
                }
            } else {
                renderizarTabela([]);
            }
        })
        .catch(function (error) {
            console.error(`Erro na obtenção dos equipamentos: ${error.message}`);
        });
}


function coletarComponentesSelecionados() {
    let checkboxes = document.querySelectorAll(
        '#modal-cadastrar .checkbox_componente:checked'
    );

    let componentes = [];

    for (let checkbox of checkboxes) {
        let linha = checkbox.closest('.linha_componente');

        let campos = linha.querySelectorAll('.campo_alerta input');

        componentes.push({
            nome: checkbox.dataset.nome,
            tipo: checkbox.dataset.tipo,
            descricao: checkbox.dataset.descricao,
            limiteAtencao: Number(campos[0].value),
            limiteCritico: Number(campos[1].value)
        });
    }

    return componentes;
}


function coletarLimites(editar) {
    let prefixo = editar ? 'input-editar-limite-' : 'input-limite-';
    let limiteCpu = document.getElementById(prefixo + 'cpu-hardware').value.trim();
    let limiteRam = document.getElementById(prefixo + 'ram-hardware').value.trim();
    let limiteDisco = document.getElementById(prefixo + 'disco-hardware').value.trim();
    let limites = [
        { campo: 'limiteCpu', nome: 'CPU', valor: limiteCpu },
        { campo: 'limiteRam', nome: 'RAM', valor: limiteRam },
        { campo: 'limiteDisco', nome: 'disco', valor: limiteDisco }
    ];
    let resultado = {};

    for (let i = 0; i < limites.length; i++) {
        let valor = Number(limites[i].valor);
        if (limites[i].valor === '' || !Number.isInteger(valor) || valor < 1 || valor > 100) {
            alert(`O limite de ${limites[i].nome} deve ser um número inteiro entre 1 e 100.`);
            return null;
        }
        resultado[limites[i].campo] = valor;
    }

    return resultado;
}

function cadastrarHardware() {
    let nome = document.getElementById('input-nome-hardware').value.trim();
    let tipo = document.getElementById('select-tipo-hardware').value;
    let localizacao = document.getElementById('input-localizacao-hardware').value.trim();
    let descricao = document.getElementById('input-descricao-hardware').value.trim();
    let componentes = coletarComponentesSelecionados();

    /*if (!validarComponentes(componentes)) {
        return;
    }*/

    if (nome === '') {
        alert('Preencha o nome do dispositivo.');
        return;
    }
    if (tipo === '') {
        alert('Selecione o tipo de dispositivo.');
        return;
    }
    if (localizacao === '') {
        alert('Preencha a localização/setor.');
        return;
    }

    let corpoRequisicao = {
        nome: nome,
        tipo: tipo,
        localizacao: localizacao,
        descricao: descricao,
        fkEmpresa: idEmpresa,
        idUsuario: dadosUsuario.id,
        componentes: componentes
        //limiteCpu: limites.limiteCpu,
        //limiteRam: limites.limiteRam,
        //limiteDisco: limites.limiteDisco
    };

    fetch('/hardwares/cadastrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpoRequisicao)
    })
        .then(function (response) {
            if (response.ok) {
                buscarEquipamentosEmpresa(idEmpresa);
                document.querySelector('.sobreposicao_modal').classList.remove('modal_aberto');
                document.getElementById('input-nome-hardware').value = '';
                document.getElementById('select-tipo-hardware').value = '';
                document.getElementById('input-localizacao-hardware').value = '';
                document.getElementById('input-descricao-hardware').value = '';
                document.getElementById('input-limite-cpu-hardware').value = '';
                document.getElementById('input-limite-ram-hardware').value = '';
                document.getElementById('input-limite-disco-hardware').value = '';
            } else {
                response.text().then(function (mensagemErro) {
                    alert('Não foi possível cadastrar o hardware: ' + mensagemErro);
                });
            }
        })
        .catch(function (error) {
            console.error(`Erro ao cadastrar o hardware: ${error.message}`);
            alert('Erro ao cadastrar o hardware. Veja o console.');
        });
}

function coletarComponentesSelecionadosEditar() {
    let checkboxes = document.querySelectorAll('.checkbox_componente_editar:checked');
    let componentes = [];

    for (let i = 0; i < checkboxes.length; i++)
    {
        let linha = i.closest('.linha_componente');
        let campos = linha.querySelectorAll('.campo_alerta input');

        let checkbox = checkboxes[i];

        componentes.push({
            nome: checkbox.dataset.nome,
            tipo: checkbox.dataset.tipo,
            descricao: checkbox.dataset.descricao,
            limiteAtencao: Number(campos[0].value),
            limiteCritico: Number(campos[1].value)
        });
    }

    return componentes;
}

function abrirModalEditar(idEquipamento) {
    let linhasDoEquipamento = ultimaListaEquipamentos.filter(function (linha) {
        return linha.idEquipamento === idEquipamento;
    });

    if (linhasDoEquipamento.length === 0) {
        alert('Não foi possível carregar os dados desse hardware.');
        return;
    }

    let equipamento = linhasDoEquipamento[0];

    document.getElementById('input-editar-id-hardware').value = equipamento.idEquipamento;
    document.getElementById('input-editar-id-empresa').value = equipamento.idEmpresa;
    document.getElementById('input-editar-nome-hardware').value = equipamento.nomeEquipamento || '';
    document.getElementById('select-editar-tipo-hardware').value = equipamento.tipoEquipamento || '';
    document.getElementById('input-editar-localizacao-hardware').value = equipamento.localizacao || '';
    document.getElementById('input-editar-descricao-hardware').value = equipamento.descricaoEquipamento || '';

    //lista de tipos de componente que esse equipamento já tem pra marcar os checkbox correspondentes
    let tiposComponentesAtuais = linhasDoEquipamento

        .map(function (linha) { return linha.tipoComponente; })
        .filter(function (tipo) { return !!tipo; });

    let checkboxesEditar = document.querySelectorAll('.checkbox_componente_editar');

    for (let i = 0; i < checkboxesEditar.length; i++)
    {
        let checkbox = checkboxesEditar[i];
        let tipoCheckbox = checkbox.dataset.tipo.toUpperCase();

        let componenteSalvo = linhasDoEquipamento.find(function(linha)
        {
            return linha.tipoComponente &&
                linha.tipoComponente.toUpperCase() === tipoCheckbox;
        });

        checkbox.checked = Boolean(componenteSalvo);

        if (componenteSalvo)
            {
            let linha = checkbox.closest('.linha_componente');
            let campos = linha.querySelectorAll('.campo_alerta input');

            campos[0].value = Number(componenteSalvo.limiteAtencao);
            campos[1].value = Number(componenteSalvo.limiteCritico);
        }
    }

    document.querySelector('.sobreposicao_modal_editar').classList.add('modal_aberto');
}

function fecharModalEditar() {
    document.querySelector('.sobreposicao_modal_editar').classList.remove('modal_aberto');
}

function salvarEdicaoHardware() {
    let idEquipamento = document.getElementById('input-editar-id-hardware').value;
    let nome = document.getElementById('input-editar-nome-hardware').value.trim();
    let tipo = document.getElementById('select-editar-tipo-hardware').value;
    let localizacao = document.getElementById('input-editar-localizacao-hardware').value.trim();
    let descricao = document.getElementById('input-editar-descricao-hardware').value.trim();
    let componentes = coletarComponentesSelecionadosEditar();
    let limites = coletarLimites(true);

    if (!validarComponentes(componentes))
        {
        return;
    }

    if (nome === '') {
        alert('Preencha o nome do dispositivo.');
        return;
    }
    if (tipo === '') {
        alert('Selecione o tipo de dispositivo.');
        return;
    }
    if (localizacao === '') {
        alert('Preencha a localização/setor.');
        return;
    }

    let corpoRequisicao = {
        nome: nome,
        tipo: tipo,
        localizacao: localizacao,
        descricao: descricao,
        idUsuario: dadosUsuario.id,
        idEmpresa: idEmpresa,
        componentes: componentes
    };

    fetch(`/hardwares/atualizar/${idEquipamento}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpoRequisicao)
    })
        .then(function (response) {
            if (response.ok) {
                buscarEquipamentosEmpresa(idEmpresa);
                fecharModalEditar();
            } else {
                response.text().then(function (mensagemErro) {
                    alert('Não foi possível salvar as alterações: ' + mensagemErro);
                });
            }
        })
        .catch(function (error) {
            console.error(`Erro ao atualizar o hardware: ${error.message}`);
            alert('Erro ao atualizar o hardware. Veja o console.');
        });
}

let controller;
let lidarComDeletar;
let lidarComFechar;

function deletarEquipamento(idEmpresa, idEquipamento) {
    const btnFecharModal = document.getElementById('btn-fechar-modal-deletar');
    const btnDeletarHardware = document.getElementById('btn-deletar-hardware');
    const modalDeletarHardware = document.querySelector('.modal_deletar');
    const modalOverlayDeletarHardware = document.querySelector('.modal_overlay_deletar');
    const h2AvisoModal = document.getElementById('aviso-deletar');

    btnDeletarHardware.removeEventListener('click', lidarComDeletar);
    btnFecharModal.removeEventListener('click', lidarComFechar);

    controller = new AbortController();

    // Exibe a modal
    modalOverlayDeletarHardware.classList.add('active');
    modalDeletarHardware.classList.add('active');
    h2AvisoModal.innerHTML = `Você tem certeza que deseja DELETAR o hardware de ID: (HW-${idEquipamento})?`;

    lidarComDeletar = () => {
        fecharModalGeral();

        fetch(`/hardwares/deletarEq/${idEmpresa}/${idEquipamento}?idUsuario=${dadosUsuario.id}`, {
            method: 'DELETE',
            signal: controller.signal,
            cache: 'no-store'
        })
            .then(response => {
                if (response.ok) {
                    console.log(`Item HW-${idEquipamento} deletado com sucesso`);
                    buscarEquipamentosEmpresa(idEmpresa);
                } else {
                    console.log("Item não deletado");
                }
            })
            .catch(error => {
                if (error.name === 'AbortError') {
                    console.log("Requisição de exclusão cancelada pelo usuário.");
                } else {
                    console.error(`Erro na requisição de exclusão: ${error.message}`);
                }
            });
    };

    lidarComFechar = () => {
        fecharModalGeral();
        controller.abort();
    };

    function fecharModalGeral() {
        modalDeletarHardware.classList.remove('active');
        modalOverlayDeletarHardware.classList.remove('active');
        btnDeletarHardware.removeEventListener('click', lidarComDeletar);
        btnFecharModal.removeEventListener('click', lidarComFechar);
    }

    btnDeletarHardware.addEventListener('click', lidarComDeletar);
    btnFecharModal.addEventListener('click', lidarComFechar);
}

const modalOverlay = document.querySelector('.sobreposicao_modal');
const btnAbrir = document.getElementById('btn-novo-hardware');
const btnFechar = document.querySelector('.fechar_modal');
const btnCancelar = document.querySelector('.btn_cancelar');
const btnSalvar = document.querySelector('.btn_salvar');

function abrirModal() {
    checkboxesCadastro.forEach(function (checkbox)
    {
        // CPU, RAM e Disco selecionados por padrão.
        checkbox.checked = ['CPU', 'RAM', 'Armazenamento']
            .includes(checkbox.dataset.tipo);

        atualizarLimitesCadastro(checkbox);
    });

    modalOverlay.classList.add('modal_aberto');
}

function fecharModal() {
    modalOverlay.classList.remove('modal_aberto');
}

btnAbrir.addEventListener('click', abrirModal);
btnFechar.addEventListener('click', fecharModal);

if(btnCancelar){
    btnCancelar.addEventListener('click', fecharModal);
}

if(btnSalvar){
    btnSalvar.addEventListener('click', cadastrarHardware);
}

modalOverlay.addEventListener('click', function (evento) {
    if (evento.target === modalOverlay) {
        fecharModal();
    }
});

document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape') {
        fecharModal();
        fecharModalEditar();
    }
});

// Mesma lógica do modal de cadastro , só que no modal de EDIÇÃO
const modalOverlayEditar = document.querySelector('.sobreposicao_modal_editar');
const btnFecharEditar = document.querySelector('.fechar_modal_editar');
const btnCancelarEditar = document.querySelector('.btn_cancelar_editar');
const btnSalvarEditar = document.querySelector('.btn_salvar_editar');

btnFecharEditar.addEventListener('click', fecharModalEditar);
btnCancelarEditar.addEventListener('click', fecharModalEditar);
btnSalvarEditar.addEventListener('click', salvarEdicaoHardware);

modalOverlayEditar.addEventListener('click', function (evento) {
    if (evento.target === modalOverlayEditar) {
        fecharModalEditar();
    }
});

function possuiPermissao(nomePermissao) {
    const permissoes = Array.isArray(dadosUsuario.permissoes)
        ? dadosUsuario.permissoes
        : [];

    return permissoes.includes(nomePermissao);
}

function aplicarPermissoes() {
    const nivel = dadosUsuario.nomeNivelAcesso || dadosUsuario.nomePermissao;
    const ehRoot = nivel === 'Root';
    const ehAdministrador = nivel === 'Administrador';

    const podeCadastrar = ehRoot || (
        ehAdministrador && possuiPermissao('EQUIPAMENTOS_CADASTRAR')
    );

    const podeEditar = ehRoot || (
        ehAdministrador && possuiPermissao('EQUIPAMENTOS_EDITAR')
    );

    const podeExcluir = ehRoot || (
        ehAdministrador && possuiPermissao('EQUIPAMENTOS_EXCLUIR')
    );

    const btnAdicionarHardware = document.getElementById('btn-novo-hardware');

    if (btnAdicionarHardware) {
        btnAdicionarHardware.style.display = podeCadastrar ? 'block' : 'none';
    }

    document.querySelectorAll('.btn_editar').forEach(function (botao) {
        botao.style.display = podeEditar ? 'inline-flex' : 'none';
    });

    document.querySelectorAll('.btn_excluir').forEach(function (botao) {
        botao.style.display = podeExcluir ? 'inline-flex' : 'none';
    });
}

function modalVisualizar(idEquipamento) {
    let jsonEquipamentos = [];
    let jsonComponentes = [];

    fetch(`/hardwares/buscarEqId/${idEquipamento}?idUsuario=${dadosUsuario.id}&idEmpresa=${idEmpresa}`, { cache: 'no-store' }).then(function (response) {
        if (response.ok) {
            response.json().then(function (equipamento) {
                jsonEquipamentos = equipamento;
                console.log(equipamento)

                for (let i = 0; i < jsonEquipamentos.length; i++) {
                    const nome = jsonEquipamentos[i].nomeComponente;

                    // Adiciona apenas se ainda não estiver na lista e se existir
                    if (nome && !jsonComponentes.includes(nome)) {
                        jsonComponentes.push(nome);
                    }
                }

                console.log(jsonComponentes)

                const modalVisualizar = document.querySelector('.modal_visualizar');
                const modalOverlay = document.querySelector('.modal_overlay_deletar')

                modalOverlay.style.display = 'flex';
                modalVisualizar.style.display = 'flex';

                modalVisualizar.innerHTML =
                `
                <button id="btn-fechar-modal-visualizar">
                            <i class="fa-regular fa-circle-xmark"></i>
                        </button>
                        <div class="modal_visualizar_title">
                            <div class="visualizar_title_icon">
                                <i class="fa-solid fa-display" style="color: rgb(255, 255, 255);"></i>
                            </div>
                            <div class="visualizar_title_text">
                                <span>Equipamento</span>
                                <h3>${jsonEquipamentos[0].nomeEquipamento}</h3>
                                <h6>ID: HW-${jsonEquipamentos[0].idEquipamento}</h6>
                            </div>
                        </div>
                        <div class="modal_visualizar_topic">
                            <span>
                                <i class="fa-solid fa-circle-info"></i>
                                Informações
                            </span>
                        </div>
                        <div class="modal_visualizar_info">
                            <div class="visualizar_info_row">
                                <div class="info_row_item">
                                    <div class="info_row_item_icon">
                                        <i class="fa-solid fa-tv"></i>
                                    </div>
                                    <div class="info_row_item_text border_lateral">
                                        <span>Tipo</span>
                                        <h3>${jsonEquipamentos[0].tipoEquipamento}</h3>
                                    </div>
                                </div>
                                <div class="info_row_item">
                                    <div class="info_row_item_icon">
                                        <i class="fa-solid fa-location-dot"></i>
                                    </div>
                                    <div class="info_row_item_text">
                                        <span>Localização</span>
                                        <h3>${jsonEquipamentos[0].localizacao}</h3>
                                    </div>
                                </div>
                            </div>
                            <div class="visualizar_info_row">
                                <div class="info_row_item">
                                    <div class="info_row_item_icon">
                                        <i class="fa-solid fa-microchip"></i>
                                    </div>
                                    <div class="info_row_item_text border_lateral">
                                        <span>Componentes Monitorados</span>
                                        <h3>${jsonComponentes.join(', ')}</h3>
                                    </div>
                                </div>
                                <div class="info_row_item">
                                    <div class="info_row_item_icon">
                                        <i class="fa-solid fa-signal"></i>
                                    </div>
                                    <div class="info_row_item_text">
                                        <span>Status</span>
                                        <h3>${jsonEquipamentos[0].statusEquipamento}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal_visualizar_rowbar">
                            <button id="fechar-modal-visualizar">
                                Fechar
                            </button>
                        </div> 
                `;
                const btnFecharModalVisualizar = document.getElementById('btn-fechar-modal-visualizar');
                const btn2FecharModalVisualizar = document.getElementById('fechar-modal-visualizar');

                btnFecharModalVisualizar.addEventListener('click', () => {
                    modalOverlay.style.display = 'none';
                    modalVisualizar.style.display = 'none';
                });

                btn2FecharModalVisualizar.addEventListener('click', () => {
                    modalOverlay.style.display = 'none';
                    modalVisualizar.style.display = 'none';
                });
            });
        } else {
            console.error('Nenhum dado encontrado!');
        }
    })
        .catch(function (error) {
            console.error(`Erro na obtenção dos dados ${error.message}`);
        });
}

buscarEquipamentosEmpresa(idEmpresa)


/*
Controla os limites dos componentes no cadastro

Marcado: preenche com os valores padrão
Desmarcado: limpa e desabilita os campos
Marcado novamente: restaura os padrões */

const PADRAO_ATENCAO = 75;
const PADRAO_CRITICO = 85;

function atualizarLimitesCadastro(checkbox) {
    const linha = checkbox.closest('.linha_componente');

    const inputAtencao = linha.querySelector('.limite_atencao');
    const inputCritico = linha.querySelector('.limite_critico');

    if (checkbox.checked)
    {
        inputAtencao.value = PADRAO_ATENCAO;
        inputCritico.value = PADRAO_CRITICO;

        inputAtencao.disabled = false;
        inputCritico.disabled = false;
    }
    
    else
    {
        inputAtencao.value = '';
        inputCritico.value = '';

        inputAtencao.disabled = true;
        inputCritico.disabled = true;
    }
}

// Seleciona apenas os checkboxes do modal de cadastro
const checkboxesCadastro = document.querySelectorAll('#modal-cadastrar .checkbox_componente');

checkboxesCadastro.forEach(function (checkbox)
{
    // Ajusta os campos assim que a página carrega
    atualizarLimitesCadastro(checkbox);

    // Atualiza os limites sempre que marcar ou desmarcar
    checkbox.addEventListener('change', function () {
        atualizarLimitesCadastro(checkbox);
    });
});