let dadosUsuario = dadosUser();
let idEmpresa = dadosUsuario.idEmpresa;
let ultimaListaEquipamentos = [];

function mapearClasseStatus(status) {
    if (status === "Ativo" || status === "Online") {
        return "status-ativo";
    } else if (status === "Manutenção") {
        return "status-atencao";
    } else {
        return "status-inativo";
    }
}

function montarLinhaTabela(equipamento) {
    return `
        <tr>
            <td class="celula-dispositivo">
                <div class="icone-dispositivo">
                    <i class="fa-solid fa-server" style="color: rgb(255, 255, 255);"></i>
                </div>
                <div class="info-dispositivo">
                    <strong>${equipamento.nomeEquipamento}</strong>
                    <span>ID: HW-${String(equipamento.idEquipamento).padStart(4, '0')}</span>
                </div>
            </td>
            <td>${equipamento.tipoEquipamento || '-'}</td>
            <td class="celula-componentes">${equipamento.nomeComponente || '-'}</td>
            <td>${equipamento.localizacao || '-'}</td>
            <td>
                <span class="status ${mapearClasseStatus(equipamento.statusEquipamento)}">
                    ${equipamento.statusEquipamento || '-'}
                </span>
            </td>
            <td>-</td>
            <td class="celula-acoes">
                <!-- ao clicar, abre o modal de edição já preenchido com os dados deste equipamento -->
                <button class="btn-icone" onclick="abrirModalEditar(${equipamento.idEquipamento})" title="Editar">
                    <i class="fa-solid fa-pen-to-square" style="color: rgb(255, 255, 255);"></i>
                </button>
                <button class="btn-icone btn-excluir ${equipamento.idEquipamento}" onclick="deletarEquipamento(${equipamento.idEmpresa}, ${equipamento.idEquipamento})" title="Excluir">
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
}

function buscarEquipamentosEmpresa(idEmpresa) {
    fetch(`/hardwares/buscarEq/${idEmpresa}`, { cache: 'no-store' })
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
    let checkboxes = document.querySelectorAll('.checkbox-componente:checked');
    let componentes = [];

    for (let i = 0; i < checkboxes.length; i++) {
        let checkbox = checkboxes[i];
        componentes.push({
            nome: checkbox.dataset.nome,
            tipo: checkbox.dataset.tipo,
            descricao: checkbox.dataset.descricao
        });
    }

    return componentes;
}

function cadastrarHardware() {
    let nome = document.getElementById('input-nome-hardware').value.trim();
    let tipo = document.getElementById('select-tipo-hardware').value;
    let localizacao = document.getElementById('input-localizacao-hardware').value.trim();
    let descricao = document.getElementById('input-descricao-hardware').value.trim();
    let componentes = coletarComponentesSelecionados();

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
        componentes: componentes
    };

    fetch('/hardwares/cadastrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpoRequisicao)
    })
        .then(function (response) {
            if (response.ok) {
                buscarEquipamentosEmpresa(idEmpresa);
                document.querySelector('.sobreposicao-modal').classList.remove('modal-aberto');
                document.getElementById('input-nome-hardware').value = '';
                document.getElementById('select-tipo-hardware').value = '';
                document.getElementById('input-localizacao-hardware').value = '';
                document.getElementById('input-descricao-hardware').value = '';
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
    let checkboxes = document.querySelectorAll('.checkbox-componente-editar:checked');
    let componentes = [];

    for (let i = 0; i < checkboxes.length; i++) {
        let checkbox = checkboxes[i];
        componentes.push({
            nome: checkbox.dataset.nome,
            tipo: checkbox.dataset.tipo,
            descricao: checkbox.dataset.descricao
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

    let checkboxesEditar = document.querySelectorAll('.checkbox-componente-editar');
    for (let i = 0; i < checkboxesEditar.length; i++) {
        let checkbox = checkboxesEditar[i];
        checkbox.checked = tiposComponentesAtuais.indexOf(checkbox.dataset.tipo) !== -1;
    }

    document.querySelector('.sobreposicao-modal-editar').classList.add('modal-aberto');
}

function fecharModalEditar() {
    document.querySelector('.sobreposicao-modal-editar').classList.remove('modal-aberto');
}

function salvarEdicaoHardware() {
    let idEquipamento = document.getElementById('input-editar-id-hardware').value;
    let nome = document.getElementById('input-editar-nome-hardware').value.trim();
    let tipo = document.getElementById('select-editar-tipo-hardware').value;
    let localizacao = document.getElementById('input-editar-localizacao-hardware').value.trim();
    let descricao = document.getElementById('input-editar-descricao-hardware').value.trim();
    let componentes = coletarComponentesSelecionadosEditar();

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

function deletarEquipamento(idEmpresa, idEquipamento) {

    let btnFecharModal = document.getElementById('btn-fechar-modal-deletar');
    let btnDeletarHardware = document.getElementById('btn-deletar-hardware');
    let modalDeletarHardware = document.querySelector('.modal-deletar');

    modalDeletarHardware.classList.add('active');

    btnFecharModal.addEventListener('click', () =>{
        modalDeletarHardware.classList.remove('active');
    });

    btnDeletarHardware.addEventListener('click', () =>{
        modalDeletarHardware.classList.remove('active');

        fetch(`/hardwares/deletarEq/${idEmpresa}/${idEquipamento}`, {
        method: 'DELETE',
        cache: 'no-store'
    })
        .then(function (response) {
            if (response.ok) {
                console.log("Item deletado");
                buscarEquipamentosEmpresa(idEmpresa);
            } else {
                console.log("Item não deletado");
            }
        })
        .catch(function (error) {
            console.error(`Erro na requisição de exclusão: ${error.message}`);
        });

    });
}

const modalOverlay = document.querySelector('.sobreposicao-modal');
const btnAbrir = document.getElementById('btn-novo-hardware');
const btnFechar = document.querySelector('.fechar-modal');
const btnCancelar = document.querySelector('.btn-cancelar');
const btnSalvar = document.querySelector('.btn-salvar');

function abrirModal() {
    modalOverlay.classList.add('modal-aberto');
}

function fecharModal() {
    modalOverlay.classList.remove('modal-aberto');
}

btnAbrir.addEventListener('click', abrirModal);
btnFechar.addEventListener('click', fecharModal);
btnCancelar.addEventListener('click', fecharModal);
btnSalvar.addEventListener('click', cadastrarHardware);

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
const modalOverlayEditar = document.querySelector('.sobreposicao-modal-editar');
const btnFecharEditar = document.querySelector('.fechar-modal-editar');
const btnCancelarEditar = document.querySelector('.btn-cancelar-editar');
const btnSalvarEditar = document.querySelector('.btn-salvar-editar');

btnFecharEditar.addEventListener('click', fecharModalEditar);
btnCancelarEditar.addEventListener('click', fecharModalEditar);
btnSalvarEditar.addEventListener('click', salvarEdicaoHardware);

modalOverlayEditar.addEventListener('click', function (evento) {
    if (evento.target === modalOverlayEditar) {
        fecharModalEditar();
    }
});

buscarEquipamentosEmpresa(idEmpresa);