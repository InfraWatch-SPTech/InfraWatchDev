
let usuarioLogado = null;

let usuariosEmpresa = [];


function buscarUsuarioLogado() {
    const usuarioSalvo = localStorage.getItem("usuarioLogado");

    if (usuarioSalvo == null) {
        return null;
    }

    return JSON.parse(usuarioSalvo);
}

function mostrarMensagem(texto, tipo) {
    const mensagem = document.getElementById("mensagem-estado");

    mensagem.textContent = texto;
    mensagem.className = "mensagem-estado";

    if (tipo != null && tipo != "") {
        mensagem.classList.add(tipo);
    }
}


function protegerTexto(texto) {
    const elemento = document.createElement("div");

    elemento.textContent = texto || "-";

    return elemento.innerHTML;
}


function mostrarUsuariosNaTabela() {
    const corpoTabela = document.getElementById("corpo-tabela-usuarios");

    corpoTabela.innerHTML = "";

    if (usuariosEmpresa.length == 0) {
        corpoTabela.innerHTML = `
            <tr>
                <td colspan="4">
                    Nenhum usuário encontrado para esta empresa.
                </td>
            </tr>
        `;

        return;
    }

    for (let i = 0; i < usuariosEmpresa.length; i++) {
        const usuario = usuariosEmpresa[i];

        const idUsuario = Number(usuario.idUsuario);
        const nome = protegerTexto(usuario.nome);
        const email = protegerTexto(usuario.email);

        // Verifica se a linha é do próprio administrador conectado
        const ehUsuarioLogado =
            idUsuario == Number(usuarioLogado.id);

        let desabilitado = "";

        if (ehUsuarioLogado) {
            desabilitado = "disabled";
        }

        corpoTabela.innerHTML += `
            <tr>
                <td>${nome}</td>

                <td class="email-usuario">
                    ${email}
                </td>

                <td>
                    <select
                        id="permissao-${idUsuario}"
                        class="seletor-permissao"
                        ${desabilitado}
                    >
                        <option
                            value="2"
                            ${usuario.fkPermissao == 2 ? "selected" : ""}
                        >
                            Admin
                        </option>

                        <option
                            value="3"
                            ${usuario.fkPermissao == 3 ? "selected" : ""}
                        >
                            Usuário comum
                        </option>
                    </select>
                </td>

                <td>
                    <button
                        id="botao-${idUsuario}"
                        class="btn-salvar-permissao"
                        onclick="salvarPermissao(${idUsuario})"
                        ${desabilitado}
                    >
                        Salvar
                    </button>
                </td>
            </tr>
        `;
    }
}


// 5. Busca os usuários da empresa no backend
async function carregarUsuarios() {
    mostrarMensagem("Carregando usuários...", "");

    const parametros = new URLSearchParams();

    parametros.append(
        "idAdministrador",
        usuarioLogado.id
    );

    parametros.append(
        "idEmpresa",    
        usuarioLogado.idEmpresa
    );

    try {
        const resposta = await fetch(
            "/usuarios?" + parametros.toString()
        );

        if (resposta.ok == false) {
            const mensagemErro = await resposta.text();

            mostrarMensagem(
                mensagemErro || "Não foi possível carregar os usuários.",
                "erro"
            );

            return;
        }

        usuariosEmpresa = await resposta.json();

        mostrarUsuariosNaTabela();

        mostrarMensagem("", "");
    } catch (erro) {
        mostrarMensagem(
            "Erro ao conectar com o servidor.",
            "erro"
        );
    }
}


// 6. Salva a nova permissão escolhida pelo administrador
async function salvarPermissao(idUsuario) {
    const seletor = document.getElementById(
        "permissao-" + idUsuario
    );

    const botao = document.getElementById(
        "botao-" + idUsuario
    );

    const novaPermissao = Number(seletor.value);

    // Procura o usuário dentro da lista
    let usuarioSelecionado = null;

    for (let i = 0; i < usuariosEmpresa.length; i++) {
        if (
            Number(usuariosEmpresa[i].idUsuario)
            == Number(idUsuario)
        ) {
            usuarioSelecionado = usuariosEmpresa[i];
            break;
        }
    }

    if (usuarioSelecionado == null) {
        mostrarMensagem(
            "Usuário não encontrado.",
            "erro"
        );

        return;
    }

    // Não envia se a permissão continuar igual
    if (
        novaPermissao
        == Number(usuarioSelecionado.fkPermissao)
    ) {
        mostrarMensagem(
            "Essa permissão já está aplicada.",
            ""
        );

        return;
    }

    seletor.disabled = true;
    botao.disabled = true;

    mostrarMensagem(
        "Salvando permissão...",
        ""
    );

    try {
        const resposta = await fetch(
            "/usuarios/" + idUsuario + "/permissao",
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    idAdministrador: usuarioLogado.id,
                    idEmpresa: usuarioLogado.idEmpresa,
                    fkPermissao: novaPermissao
                })
            }
        );

        if (resposta.ok == false) {
            const mensagemErro = await resposta.text();

            // Volta o select para a permissão anterior
            seletor.value =
                usuarioSelecionado.fkPermissao;

            mostrarMensagem(
                mensagemErro || "Não foi possível alterar a permissão.",
                "erro"
            );

            seletor.disabled = false;
            botao.disabled = false;

            return;
        }

        const resultado = await resposta.json();

        // Atualiza a permissão na lista do JavaScript
        usuarioSelecionado.fkPermissao =
            resultado.fkPermissao;

        mostrarMensagem(
            "Permissão de " +
            usuarioSelecionado.nome +
            " atualizada com sucesso.",
            "sucesso"
        );
    } catch (erro) {
        // Volta para o valor anterior
        seletor.value =
            usuarioSelecionado.fkPermissao;

        mostrarMensagem(
            "Erro ao conectar com o servidor.",
            "erro"
        );
    }

    seletor.disabled = false;
    botao.disabled = false;
}


// 7. Verifica o acesso e inicia a página
function iniciarPagina() {
    usuarioLogado = buscarUsuarioLogado();

    // Se não estiver conectado, volta para o login
    if (usuarioLogado == null) {
        window.location.href = "./login.html";
        return;
    }

    // Se não for Admin, mostra o aviso
    if (Number(usuarioLogado.perm) != 2) {
        const aviso = document.getElementById(
            "aviso-acesso"
        );

        const textoAviso = document.getElementById(
            "texto-aviso-acesso"
        );

        textoAviso.textContent =
            "Esta página está disponível somente para administradores.";

        aviso.hidden = false;

        setTimeout(function () {
            window.location.href = "./hardwares.html";
        }, 2500);

        return;
    }

    // Exibe o conteúdo da página
    document.getElementById(
        "painel-usuarios"
    ).hidden = false;

    // Atualiza a navbar e a sessão
    if (typeof validarSessao == "function") {
        validarSessao();
    }

    // Busca os usuários no backend
    carregarUsuarios();
}


// Executa quando o HTML terminar de carregar
document.addEventListener(
    "DOMContentLoaded",
    iniciarPagina
);