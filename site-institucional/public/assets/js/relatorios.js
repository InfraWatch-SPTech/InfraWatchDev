let formulario = document.getElementById("form-relatorio");
        let servidor = document.getElementById("servidor");
        let idEmpresa = sessionStorage.ID_EMPRESA;

        function buscarServidores() {

            fetch(`/relatorios/servidores/${idEmpresa}`)
                .then(function (resposta) {

                    if (resposta.ok) {
                        return resposta.json();
                    } else {
                        throw new Error("Erro ao buscar os servidores.");
                    }

                })
                .then(function (dados) {

                    servidor.innerHTML = `
                        <option value="" disabled selected>
                            Selecione um servidor </option>
                    `;

                    for (let i = 0; i < dados.length; i++) {
                        servidor.innerHTML += `<option value="${dados[i].idEquipamento}">${dados[i].nomeEquipamento}</option>`;
                    }

                })
                .catch(function (erro) {

                    console.log(erro);

                    servidor.innerHTML = `<option value="" disabled selected> Erro ao carregar servidores</option>`;
                });

        }

        formulario.addEventListener("submit", function (event) {
            event.preventDefault();

            let titulo = document.getElementById("titulo").value;
            let data = document.getElementById("data").value;
            let detalhes = document.getElementById("detalhes").value;
            let idEquipamento = servidor.value;


            if (titulo == "") {
                alert("Informe o título do relatório.");
                return;
            }
            if (data == "") {
                alert("Informe a data do relatório.");
                return;

            }
            if (idEquipamento == "") {
                alert("Selecione um servidor.");
                return;

            }
            if (detalhes == "") {
                alert("Informe os detalhes do relatório.");
                return;

            }

            fetch("/relatorios/cadastrar", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    titulo: titulo,
                    descricao: detalhes,
                    dataRel: data + " 00:00:00",
                    idEquipamento: idEquipamento

                })

            })

                .then(function (resposta) {

                    if (resposta.ok) {
                        return resposta.json();
                    } else {
                        return resposta.text().then(function (texto) {
                            throw new Error(texto);

                        });
                    }
                })

                .then(function (resultado) {
                    console.log(resultado);
                    alert("Relatório cadastrado com sucesso!");

                    formulario.reset();

                    servidor.innerHTML = `
                        <option value="" disabled selected>
                            Selecione um servidor
                        </option>
                    `;

                    buscarServidores();

                })

                .catch(function (erro) {
                    console.log(erro);

                    alert("Não foi possível cadastrar o relatório.");
                });

        });
        buscarServidores();