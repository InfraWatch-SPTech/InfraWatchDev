        let formulario = document.getElementById("form-relatorio");
        let selectServidor = document.getElementById("servidor");
        let mensagemCadastro = document.getElementById("mensagem-relatorio");
        let botaoEnviar = document.getElementById("botao-enviar");

        let listaRelatorios = document.getElementById("lista-relatorios");
        let mensagemLista = document.getElementById("mensagem");
        let filtro = document.getElementById("filtro");

        let relatorios = [];

        function carregarServidores() {
            let usuario = dadosUser();

            if (!usuario || !usuario.idEmpresa) {
                mensagemCadastro.textContent =
                    "Empresa não identificada. Entre novamente no sistema.";

                selectServidor.innerHTML =
                    '<option value="">Empresa não identificada</option>';

                return;
            }

            fetch("/hardwares/buscarEq/" +
                encodeURIComponent(usuario.idEmpresa) +
                "?idUsuario=" + encodeURIComponent(usuario.id),
                { cache: "no-store" })
                .then(function (resposta) {
                    if (resposta.status === 204) {
                        return [];
                    }

                    if (!resposta.ok) {
                        throw new Error("Erro HTTP: " + resposta.status);
                    }

                    return resposta.json();
                })
                .then(function (servidores) {
                    selectServidor.innerHTML =
                        '<option value="" selected disabled>Selecione um equipamento</option>';

                    let idsAdicionados = {};
                    let total = 0;

                    for (let i = 0; i < servidores.length; i++) {
                        let servidor = servidores[i];

                        if (idsAdicionados[servidor.idEquipamento]) {
                            continue;
                        }

                        idsAdicionados[servidor.idEquipamento] = true;
                        total++;

                        let opcao = document.createElement("option");

                        opcao.value = servidor.idEquipamento;
                        opcao.textContent = servidor.nomeEquipamento;

                        selectServidor.appendChild(opcao);
                    }

                    mensagemCadastro.textContent = total === 0
                        ? "Nenhum equipamento disponível para esta empresa."
                        : "";
                })
                .catch(function (erro) {
                    console.log("Erro ao carregar equipamentos:", erro);

                    mensagemCadastro.textContent =
                        "Erro ao carregar equipamentos. Verifique o backend.";
                });
        }

        function formatarData(data) {
            if (!data) {
                return "-";
            }

            let dataTexto = String(data).substring(0, 10);
            let partes = dataTexto.split("-");

            if (partes.length !== 3) {
                return dataTexto;
            }

            return partes[2] + "/" + partes[1] + "/" + partes[0];
        }

        function criarCelula(valor, classe) {
            let celula = document.createElement("td");

            celula.textContent =
                valor == null || valor === "" ? "-" : String(valor);

            if (classe) {
                celula.className = classe;
            }

            return celula;
        }

        function mostrarRelatorios() {
            let pesquisa = filtro.value.toLowerCase().trim();

            let encontrados = relatorios.filter(function (relatorio) {
                let titulo = String(relatorio.titulo || "").toLowerCase();

                let equipamento = String(
                    relatorio.nomeEquipamento || ""
                ).toLowerCase();

                return titulo.includes(pesquisa) ||
                    equipamento.includes(pesquisa);
            });

            listaRelatorios.innerHTML = "";

            if (encontrados.length === 0) {
                mensagemLista.textContent = relatorios.length === 0
                    ? "Nenhum relatório cadastrado."
                    : "Nenhum relatório corresponde à pesquisa.";

                return;
            }

            mensagemLista.textContent = "";

            for (let i = 0; i < encontrados.length; i++) {
                let relatorio = encontrados[i];
                let linha = document.createElement("tr");

                linha.appendChild(criarCelula(relatorio.titulo));

                linha.appendChild(criarCelula(
                    formatarData(
                        relatorio.data_rel || relatorio.dataRel
                    )
                ));

                linha.appendChild(criarCelula(
                    relatorio.nomeEquipamento
                ));

                linha.appendChild(criarCelula(
                    relatorio.descricao,
                    "descricao_relatorio"
                ));

                let celulaAcoes = document.createElement("td");
                let acoes = document.createElement("div");

                acoes.className = "acoes";

                let botaoEditar = document.createElement("a");

                botaoEditar.className = "botao_acao";
                // botaoEditar.href =
                //     "./editar-relatorio.html?idRelatorio=" +
                //     encodeURIComponent(relatorio.idRelatorio);

                botaoEditar.innerHTML =
                    '<i class="fa-solid fa-pen"></i> Editar';

                let botaoExcluir = document.createElement("button");

                botaoExcluir.type = "button";
                botaoExcluir.className =
                    "botao_acao botao_excluir";

                botaoExcluir.textContent = "Excluir";

                botaoExcluir.setAttribute(
                    "data-id",
                    relatorio.idRelatorio
                );

                acoes.appendChild(botaoEditar);
                acoes.appendChild(botaoExcluir);

                celulaAcoes.appendChild(acoes);
                linha.appendChild(celulaAcoes);

                listaRelatorios.appendChild(linha);
            }
        }

        function carregarRelatorios() {
            mensagemLista.textContent = "Carregando relatórios...";

            fetch("/relatorios/buscar")
                .then(function (resposta) {
                    if (!resposta.ok) {
                        throw new Error("Erro HTTP: " + resposta.status);
                    }

                    return resposta.json();
                })
                .then(function (dados) {
                    if (!Array.isArray(dados)) {
                        throw new Error(
                            "A API não retornou uma lista de relatórios."
                        );
                    }

                    relatorios = dados;
                    mostrarRelatorios();
                })
                .catch(function (erro) {
                    console.log("Erro ao carregar relatórios:", erro);

                    listaRelatorios.innerHTML = "";

                    mensagemLista.textContent =
                        "Erro ao carregar relatórios. Verifique o backend.";
                });
        }

        formulario.addEventListener("submit", function (evento) {
            evento.preventDefault();

            let titulo = document.getElementById("titulo").value.trim();
            let data = document.getElementById("data").value;
            // let idEquipamento = selectServidor.value;

            let descricao = document.getElementById("detalhes")
                .value.trim();

            if (!titulo || !data || !descricao) {
                mensagemCadastro.textContent =
                    "Preencha todos os campos.";

                return;
            }

            let dados = {
                titulo: titulo,
                descricao: descricao,
                dataRel: data + " 00:00:00"
                // idEquipamento: idEquipamento
            };

            botaoEnviar.disabled = true;

            mensagemCadastro.textContent = "Salvando relatório...";

            fetch("/relatorios/cadastrar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dados)
            })
                .then(function (resposta) {
                    if (!resposta.ok) {
                        return resposta.text().then(function (texto) {
                            throw new Error(
                                texto || "Erro HTTP: " + resposta.status
                            );
                        });
                    }

                    return resposta.json();
                })
                .then(function () {
                    mensagemCadastro.textContent =
                        "Relatório cadastrado com sucesso!";

                    formulario.reset();

                    carregarServidores();
                    carregarRelatorios();

                    document.getElementById("relatorios")
                        .scrollIntoView({ behavior: "smooth" });
                })
                .catch(function (erro) {
                    console.log("Erro ao cadastrar relatório:", erro);

                    mensagemCadastro.textContent =
                        "Não foi possível cadastrar o relatório.";

                })
                .finally(function () {
                    botaoEnviar.disabled = false;
                });
        });

        function excluirRelatorio(idRelatorio, botao) {
            let confirmar = confirm(
                "Deseja realmente excluir este relatório?"
            );

            if (!confirmar) {
                return;
            }

            botao.disabled = true;

            fetch("/relatorios/deletar/" +
                encodeURIComponent(idRelatorio), {
                    method: "DELETE"
                })
                .then(function (resposta) {
                    if (!resposta.ok) {
                        throw new Error("Erro HTTP: " + resposta.status);
                    }

                    alert("Relatório excluído com sucesso!");

                    carregarRelatorios();
                })
                .catch(function (erro) {
                    console.log("Erro ao excluir relatório:", erro);

                    alert("Não foi possível excluir o relatório.");

                    botao.disabled = false;
                });
        }

        filtro.addEventListener("input", function () {
            mostrarRelatorios();
        });

        listaRelatorios.addEventListener("click", function (evento) {
            let botao = evento.target.closest("button[data-id]");

            if (!botao) {
                return;
            }

            excluirRelatorio(
                botao.getAttribute("data-id"),
                botao
            );
        });

        carregarServidores();
        carregarRelatorios();
    
