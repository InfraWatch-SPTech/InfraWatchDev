/*validar sessão*/

let validar_sessao_historia = validarSessao();

if (validar_sessao_historia == 'user') {
    window.location = "../index.html";
} else if (validar_sessao_historia == 'admin') {
    // email e nome do BD
    var email = sessionStorage.EMAIL_USUARIO;
    var nome = sessionStorage.NOME_USUARIO;

    let container_perfil_user = document.getElementById('perfil-user');
    let icone_perfil = document.getElementById('btn-icone-perfil');

    icone_perfil.addEventListener('click', () => {
        let display_container = getComputedStyle(container_perfil_user).display;

        if (display_container == 'none') {
            container_perfil_user.style.display = 'flex';
            container_perfil_user.classList.add("active");

            container_perfil_user.innerHTML =
                `
                <i class="fa-solid fa-circle-xmark" id="btn-fechar_perfil"></i>
            <div class="container-perfil-title">
                <div class="perfil-title-left">
                    <img src="../assets/icones/user-asta.png" alt="icone_asta" title="Asta">
                </div>
                <div class="perfil-title-right">
                    <h1>${nome}</h1>
                    <span>Mago do Reino de Clover</span>
                </div>
            </div>
            <div class="divisao-perfil">
                <span></span>
                <img src="../assets/icones/logo.png" alt="logo_nav">
                <span></span>

            </div>
            <div class="content-perfil">
                <div class="content-perfil-info">
                    <i class="fa-solid fa-envelope"></i>
                    <h6>
                        Email: 
                        <span>
                            ${email}
                        </span>
                    </h6>
                </div>
                <div class="content-perfil-button">
                    <button onclick="limparSessao()">
                        <i class="fa-solid fa-arrow-right-from-bracket"></i>
                        Logout
                    </button>
                </div>
            </div>
            `;

            // fechar perfil por botão close
            let btn_fechar_perfil_user = document.getElementById('btn-fechar_perfil');

            btn_fechar_perfil_user.addEventListener('click', () => {
                container_perfil_user.style.display = 'none';
                container_perfil_user.classList.remove("active");
            })

        } else {
            container_perfil_user.style.display = 'none';
            container_perfil_user.classList.remove("active");
        }
    })

} else {
    window.location = "../index.html";
}


/*dash*/

let proximaAtualizacao;

window.onload = exibirGraficoSemanalUsuario(), exibirGraficoMensalUsuario(), exibirGraficoSemanalQuiz(), exibirGraficoMensalQuiz(), exibirGraficoMediaQuiz(), exibirGraficoPrincipalQuiz();

function exibirGraficoSemanalUsuario() {
    let id_grafico = `usuario-semanal`;

    document.getElementById(`graficos-usuario`).innerHTML +=
        `
        <div id="grafico-${id_grafico}">
            <h3 class="tituloGraficos" style="color: black;">
                <span id="tituloGrafico">Gráfico Usuários</span>
            </h3>
            <div class="graph">
                <canvas id="myChartCanvas-${id_grafico}"></canvas>
            </div>
        </div>
    `

    obterDadosGrafico(id_grafico);
}

function exibirGraficoMensalUsuario() {
    let id_grafico = `usuario-mensal`;

    document.getElementById(`graficos-usuario`).innerHTML +=
        `
        <div id="grafico-${id_grafico}">
            <h3 class="tituloGraficos" style="color: black;">
                <span id="tituloGrafico">Gráfico Usuários - Mensal</span>
            </h3>
            <div class="graph">
                <canvas id="myChartCanvas-${id_grafico}"></canvas>
            </div>
        </div>
    `

    obterDadosGrafico(id_grafico);
}

function exibirGraficoPrincipalQuiz() {
    let id_grafico = `quiz-principal`;

    document.getElementById(`graficos-quiz-1`).innerHTML +=
        `
        <div id="grafico-${id_grafico}">
            <h3 class="tituloGraficos" style="color: black;">
                <span id="tituloGrafico">Gráfico Quiz Mais Acessado</span>
            </h3>
            <div class="graph">
                <canvas id="myChartCanvas-${id_grafico}"></canvas>
            </div>
        </div>
    `
    console.log(id_grafico)
    obterDadosGrafico(id_grafico);
}

function exibirGraficoMediaQuiz() {
    let id_grafico = `quiz-media`;

    document.getElementById(`graficos-quiz-1`).innerHTML +=
        `
        <div id="grafico-${id_grafico}">
            <h3 class="tituloGraficos" style="color: black;">
                <span id="tituloGrafico">Gráfico Quiz Média Pontuação</span>
            </h3>
            <div class="graph">
                <canvas id="myChartCanvas-${id_grafico}"></canvas>
            </div>
        </div>
    `
    console.log(id_grafico)
    obterDadosGrafico(id_grafico);
}

function exibirGraficoSemanalQuiz() {
    let id_grafico = `quiz-semanal`;

    document.getElementById(`graficos-quiz-2`).innerHTML +=
        `
        <div id="grafico-${id_grafico}">
            <h3 class="tituloGraficos" style="color: black;">
                <span id="tituloGrafico">Gráfico Quiz</span>
            </h3>
            <div class="graph">
                <canvas id="myChartCanvas-${id_grafico}"></canvas>
            </div>
        </div>
    `

    obterDadosGrafico(id_grafico);
}

function exibirGraficoMensalQuiz() {
    let id_grafico = `quiz-mensal`;

    document.getElementById(`graficos-quiz-2`).innerHTML +=
        `
        <div id="grafico-${id_grafico}">
            <h3 class="tituloGraficos" style="color: black;">
                <span id="tituloGrafico">Gráfico Quiz - Mensal</span>
            </h3>
            <div class="graph">
                <canvas id="myChartCanvas-${id_grafico}"></canvas>
            </div>
        </div>
    `

    obterDadosGrafico(id_grafico);
}

// O gráfico é construído com três funções:
// 1. obterDadosGrafico -> Traz dados do Banco de Dados para montar o gráfico da primeira vez
// 2. plotarGrafico -> Monta o gráfico com os dados trazidos e exibe em tela
// 3. atualizarGrafico -> Atualiza o gráfico, trazendo novamente dados do Banco

// Esta função *obterDadosGrafico* busca os últimos dados inseridos em tabela de medidas.
// para, quando carregar o gráfico da primeira vez, já trazer com vários dados.
// A função *obterDadosGrafico* também invoca a função *plotarGrafico*

//     Se quiser alterar a busca, ajuste as regras de negócio em src/controllers
//     Para ajustar o "select", ajuste o comando sql em src/models
function obterDadosGrafico(id_grafico) {

    if (proximaAtualizacao != undefined) {
        clearTimeout(proximaAtualizacao);
    }

    fetch(`/dash/ultimas/${id_grafico}`, { cache: 'no-store' }).then(function (response) {
        if (response.ok) {
            response.json().then(function (resposta) {
                console.log(`Dados recebidos: ${JSON.stringify(resposta)}`);
                resposta.reverse();

                plotarGrafico(resposta, id_grafico);

            });
        } else {
            console.error('Nenhum dado encontrado ou erro na API');
        }
    })
        .catch(function (error) {
            console.error(`Erro na obtenção dos dados p/ gráfico: ${error.message}`);
        });
}

// Esta função *plotarGrafico* usa os dados capturados na função anterior para criar o gráfico
// Configura o gráfico (cores, tipo, etc), materializa-o na página e, 
// A função *plotarGrafico* também invoca a função *atualizarGrafico*
function plotarGrafico(resposta, id_grafico) {

    console.log('iniciando plotagem do gráfico...');

    // Criando estrutura para plotar gráfico - labels
    let labels = [];

    // Criando estrutura para plotar gráfico - dados
    if (id_grafico == 'usuario-semanal' || id_grafico == 'usuario-mensal') {
        let dados = {
            labels: labels,
            datasets: [{
                label: 'Usuários',
                data: [],
                backgroundColor: '#B11011',
                borderColor: '#B11011',
                borderWidth: 2,
                minBarLength: 5,
                borderRadius: 10
            }]
        };

        console.log('----------------------------------------------')
        console.log('Estes dados foram recebidos pela funcao "obterDadosGrafico" e passados para "plotarGrafico":')
        console.log(resposta)

        // Inserindo valores recebidos em estrutura para plotar o gráfico
        for (i = 0; i < resposta.length; i++) {
            var registro = resposta[i];
            labels.push(registro.momento_grafico);
            dados.datasets[0].data.push(registro.qtd_usuarios);
        }

        console.log('----------------------------------------------')
        console.log('O gráfico será plotado com os respectivos valores:')
        console.log('Labels:')
        console.log(labels)
        console.log('Dados:')
        console.log(dados.datasets)
        console.log('----------------------------------------------')

        let config;

        // Criando estrutura para plotar gráfico - config
        if (id_grafico == 'usuario-semanal') {
            config = {
                type: 'line',
                data: dados,
                options: {
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Dias/Mês'
                            },
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Usuários'
                            },
                            ticks: {
                                precision: 0
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                font: {
                                    size: 10
                                }
                            }
                        }
                    }
                }
            };
        } else if (id_grafico == 'usuario-mensal') {
            config = {
                type: 'bar',
                data: dados,
                options: {
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Mês/Ano'
                            },
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Usuários'
                            },
                            ticks: {
                                precision: 0
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                font: {
                                    size: 10
                                }
                            }
                        }
                    }
                }
            };
        }

        // Adicionando gráfico criado em div na tela
        let myChart = new Chart(
            document.getElementById(`myChartCanvas-${id_grafico}`),
            config
        );

        // chamar KPIs
        obterKPIs();

        proximaAtualizacao = setTimeout(() => {
            atualizarGrafico(dados, myChart, id_grafico); obterKPIs();
        }, 60000);

    } else if (id_grafico == 'quiz-semanal' || id_grafico == 'quiz-mensal') {
        let dados = {
            labels: labels,
            datasets: [{
                label: 'Quizes',
                data: [],
                backgroundColor: '#B11011',
                borderColor: '#B11011',
                borderWidth: 2,
                minBarLength: 5,
                borderRadius: 10
            }]
        };

        console.log('----------------------------------------------')
        console.log('Estes dados foram recebidos pela funcao "obterDadosGrafico" e passados para "plotarGrafico":')
        console.log(resposta)

        // Inserindo valores recebidos em estrutura para plotar o gráfico
        for (i = 0; i < resposta.length; i++) {
            var registro = resposta[i];
            labels.push(registro.momento_grafico);
            dados.datasets[0].data.push(registro.qtd_quiz);
        }

        console.log('----------------------------------------------')
        console.log('O gráfico será plotado com os respectivos valores:')
        console.log('Labels:')
        console.log(labels)
        console.log('Dados:')
        console.log(dados.datasets)
        console.log('----------------------------------------------')

        let config;

        // Criando estrutura para plotar gráfico - config
        if (id_grafico == 'quiz-semanal') {
            config = {
                type: 'line',
                data: dados,
                options: {
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Dias/Mês'
                            },
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Quiz'
                            },
                            ticks: {
                                precision: 0
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                font: {
                                    size: 10
                                }
                            }
                        }
                    }
                }
            };
        } else if (id_grafico == 'quiz-mensal') {
            config = {
                type: 'bar',
                data: dados,
                options: {
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Mês/Ano'
                            },
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Quiz'
                            },
                            ticks: {
                                precision: 0
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                font: {
                                    size: 10
                                }
                            }
                        }
                    }
                }
            };
        }

        // Adicionando gráfico criado em div na tela
        let myChart = new Chart(
            document.getElementById(`myChartCanvas-${id_grafico}`),
            config
        );

        // chamar KPIs
        obterKPIs();

        proximaAtualizacao = setTimeout(() => {
            atualizarGrafico(dados, myChart, id_grafico); obterKPIs();
        }, 60000);
    } else if (id_grafico == 'quiz-principal') {
        let dados = {
            labels: labels,

            datasets: [
                {
                    label: 'Geral',
                    data: [],
                    backgroundColor: '#B11011',
                    borderColor: '#B11011',
                    borderWidth: 2,
                    borderRadius: 10
                },
                {
                    label: 'Poderes',
                    data: [],
                    backgroundColor: '#000',
                    borderColor: '#000',
                    borderWidth: 2,
                    borderRadius: 10
                },
                {
                    label: 'Personagens',
                    data: [],
                    backgroundColor: '#91851c',
                    borderColor: '#91851c',
                    borderWidth: 2,
                    borderRadius: 10
                }
            ]
        };

        console.log('----------------------------------------------')
        console.log('Estes dados foram recebidos pela funcao "obterDadosGrafico" e passados para "plotarGrafico":')
        console.log(resposta)

        // Inserindo valores recebidos em estrutura para plotar o gráfico
        for (i = 0; i < resposta.length; i++) {
            var registro = resposta[i];
            labels.push(registro.momento_grafico);
            dados.datasets[0].data.push(registro.qtd_quiz_geral);
            dados.datasets[1].data.push(registro.qtd_quiz_poderes);
            dados.datasets[2].data.push(registro.qtd_quiz_personagens);
        }

        console.log('----------------------------------------------')
        console.log('O gráfico será plotado com os respectivos valores:')
        console.log('Labels:')
        console.log(labels)
        console.log('Dados:')
        console.log(dados.datasets)
        console.log('----------------------------------------------')

        let config;

        // Criando estrutura para plotar gráfico - config
        config = {
            type: 'bar',
            data: dados,
            options: {
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Dias/Mês'
                        },
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Quantidade'
                        },
                    },
                },
                plugins: {
                    legend: {
                        labels: {
                            font: {
                                size: 10
                            }
                        }
                    }
                }
            },
        };

        // Adicionando gráfico criado em div na tela
        let myChart = new Chart(
            document.getElementById(`myChartCanvas-${id_grafico}`),
            config
        );

        proximaAtualizacao = setTimeout(() => {
            atualizarGrafico(dados, myChart, id_grafico)
        }, 60000);

    } else if (id_grafico == 'quiz-media') {
        let dados = {
            labels: labels,

            datasets: [
                {
                    label: 'Geral',
                    data: [],
                    backgroundColor: '#B11011',
                    borderColor: '#B11011',
                    borderWidth: 2,
                    borderRadius: 10
                },
                {
                    label: 'Poderes',
                    data: [],
                    backgroundColor: '#000',
                    borderColor: '#000',
                    borderWidth: 2,
                    borderRadius: 10
                },
                {
                    label: 'Personagens',
                    data: [],
                    backgroundColor: '#91851c',
                    borderColor: '#91851c',
                    borderWidth: 2,
                    borderRadius: 10
                }
            ]
        };

        console.log('----------------------------------------------')
        console.log('Estes dados foram recebidos pela funcao "obterDadosGrafico" e passados para "plotarGrafico":')
        console.log(resposta)

        // Inserindo valores recebidos em estrutura para plotar o gráfico
        for (i = 0; i < resposta.length; i++) {
            var registro = resposta[i];
            labels.push(registro.momento_grafico);
            dados.datasets[0].data.push(registro.media_quiz_geral);
            dados.datasets[1].data.push(registro.media_quiz_poderes);
            dados.datasets[2].data.push(registro.media_quiz_personagens);
        }

        console.log('----------------------------------------------')
        console.log('O gráfico será plotado com os respectivos valores:')
        console.log('Labels:')
        console.log(labels)
        console.log('Dados:')
        console.log(dados.datasets)
        console.log('----------------------------------------------')

        let config;

        // Criando estrutura para plotar gráfico - config
        config = {
            type: 'bar',
            data: dados,
            options: {
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Dias/Mês'
                        },
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Média'
                        },
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            font: {
                                size: 10
                            }
                        }
                    }
                }
            }
        };

        // Adicionando gráfico criado em div na tela
        let myChart = new Chart(
            document.getElementById(`myChartCanvas-${id_grafico}`),
            config
        );

        proximaAtualizacao = setTimeout(() => {
            atualizarGrafico(dados, myChart, id_grafico);
        }, 60000);
    }
}

function obterKPIs() {

    let data_att = new Date();
    let ult_att = data_att.toLocaleTimeString();

    // att gráfico
    let att_graficos_valor = document.getElementById('valor_att');
    att_graficos_valor.innerHTML = `${ult_att}`;

    fetch(`/dash/tempo-real/kpi`, { cache: 'no-store' }).then(function (response) {
        if (response.ok) {
            response.json().then(function (kpi) {

                // kpis valores
                let kpi_usuarios_semanal_usuarios = document.getElementById('kpi-1');
                kpi_usuarios_semanal_usuarios.innerHTML =
                    `
                        <div class="kpi-icon" id="kpi-icon-1">
                                
                        </div>

                        <h1>${kpi[0].qtd_usuario}</h1>
                        <span>Usuários cadastrados</span>
                    `;

                let kpi_usuarios_semanal_quiz = document.getElementById('kpi-2');
                kpi_usuarios_semanal_quiz.innerHTML =
                    `
                    <div class="kpi-icon" id="kpi-icon-2">
                                
                    </div>
                    <h1>${kpi[0].qtd_quiz}</h1>
                    <span>Quiz feitos</span>
                    `;
            });
        } else {
            console.error('Nenhuma kpi encontrada ou erro na API');
        }
    })
        .catch(function (error) {
            console.error(`Erro na obtenção das kpis p/ gráfico: ${error.message}`);
        });
}

function obterKPIQuiz() {
    fetch(`/dash/tempo-real/kpi/quiz`, { cache: 'no-store' }).then(function (response) {
        if (response.ok) {
            response.json().then(function (kpi) {
                console.log(kpi)

                let qtd_quiz_geral = kpi[0].qtd_quiz;
                let qtd_quiz_poderes = kpi[1].qtd_quiz;
                let qtd_quiz_personagens = kpi[2].qtd_quiz;

                let media_quiz_geral = kpi[0].media_quiz;
                let media_quiz_poderes = kpi[1].media_quiz;
                let media_quiz_personagens = kpi[2].media_quiz;

                if (qtd_quiz_geral > qtd_quiz_poderes && qtd_quiz_geral > qtd_quiz_personagens) {

                    let kpi_quiz_mais_acessado = document.getElementById('kpi-3');
                    kpi_quiz_mais_acessado.innerHTML =
                        `
                        <div class="kpi-icon" id="kpi-icon-3">
                            GERAL
                        </div>

                        <h1>
                            ${qtd_quiz_geral}
                        </h1>
                        <span>Quiz + jogados</span>
                    `;
                }else if(qtd_quiz_poderes > qtd_quiz_geral && qtd_quiz_poderes > qtd_quiz_personagens){

                    let kpi_quiz_mais_acessado = document.getElementById('kpi-3');
                    kpi_quiz_mais_acessado.innerHTML =
                        `
                        <div class="kpi-icon" id="kpi-icon-3">
                            PODERES
                        </div>

                        <h1>
                            ${qtd_quiz_poderes}
                        </h1>
                        <span>Quiz + jogados</span>
                    `;
                }else if(qtd_quiz_personagens > qtd_quiz_geral && qtd_quiz_personagens > qtd_quiz_poderes){
                    let kpi_quiz_mais_acessado = document.getElementById('kpi-3');
                    kpi_quiz_mais_acessado.innerHTML =
                        `
                        <div class="kpi-icon" id="kpi-icon-3">
                            PERSONAGENS
                        </div>

                        <h1>
                            ${qtd_quiz_personagens}
                        </h1>
                        <span>Quiz + jogados</span>
                    `;
                }

                if (media_quiz_geral > media_quiz_poderes && media_quiz_geral > media_quiz_personagens) {

                    let kpi_media_quiz = document.getElementById('kpi-4');
                    kpi_media_quiz.innerHTML =
                        `
                        <div class="kpi-icon" id="kpi-icon-4">
                                PERSONAGENS
                        </div>

                        <h1>
                            ${media_quiz_geral}
                        </h1>
                        <span>Maior média de pontuação</span>
                    `;
                }else if(media_quiz_poderes > media_quiz_geral && media_quiz_poderes > media_quiz_personagens){

                    let kpi_media_quiz = document.getElementById('kpi-4');
                    kpi_media_quiz.innerHTML =
                        `
                        <div class="kpi-icon" id="kpi-icon-4">
                                PODERES
                        </div>

                        <h1>
                            ${media_quiz_poderes}
                        </h1>
                        <span>Maior média de pontuação</span>
                    `;
                }else if(media_quiz_personagens > media_quiz_geral && media_quiz_personagens > media_quiz_poderes){
                    let kpi_media_quiz = document.getElementById('kpi-4');
                    kpi_media_quiz.innerHTML =
                        `
                        <div class="kpi-icon" id="kpi-icon-4">
                                PERSONAGENS
                        </div>

                        <h1>
                            ${media_quiz_personagens}
                        </h1>
                        <span>Maior média de pontuação</span>
                    `;
                }

            });
        } else {
            console.error('Nenhuma kpi encontrada ou erro na API');
        }
    })
        .catch(function (error) {
            console.error(`Erro na obtenção das kpis p/ gráfico: ${error.message}`);
        });
}

// Esta função *atualizarGrafico* atualiza o gráfico que foi renderizado na página,
// buscando a última medida inserida em tabela contendo as capturas, 

//     Se quiser alterar a busca, ajuste as regras de negócio em src/controllers
//     Para ajustar o "select", ajuste o comando sql em src/models

function atualizarGrafico(dados, myChart, id_grafico) {

    fetch(`/dash/tempo-real/${id_grafico}`, { cache: 'no-store' }).then(function (response) {
        if (response.ok) {
            response.json().then(function (novoRegistro) {

                console.log(`Dados recebidos: ${JSON.stringify(novoRegistro)}`);
                console.log(`Dados atuais do gráfico:`);
                console.log(dados);

                if (novoRegistro[0].momento_grafico == dados.labels[dados.labels.length - 1]) {
                    // console.log("---------------------------------------------------------------")
                    // console.log("Como não há dados novos para captura, o gráfico não atualizará.")
                    // avisoCaptura.innerHTML = "<i class='fa-solid fa-triangle-exclamation'></i> Foi trazido o dado mais atual capturado pelo sensor. <br> Como não há dados novos a exibir, o gráfico não atualizará."
                    // console.log("Horário do novo dado capturado:")
                    // console.log(novoRegistro[0].momento_grafico)
                    // console.log("Horário do último dado capturado:")
                    // console.log(dados.labels[dados.labels.length - 1])
                    // console.log("---------------------------------------------------------------")
                } else {
                    // tirando e colocando valores no gráfico

                    if (id_grafico == 'usuario-semanal' || id_grafico == 'usuario-mensal') {

                        dados.labels.shift();
                        dados.labels.push(novoRegistro[0].momento_grafico);

                        dados.datasets[0].data.shift();  // apagar o primeiro usuario
                        dados.datasets[0].data.push(novoRegistro[0].qtd_usuarios); // incluir um novo usuario

                    } else if (id_grafico == 'quiz-semanal' || id_grafico == 'quiz-mensal') {

                        dados.labels.shift();
                        dados.labels.push(novoRegistro[0].momento_grafico);

                        dados.datasets[0].data.shift();  // apagar o primeiro quiz
                        dados.datasets[0].data.push(novoRegistro[0].qtd_quiz);  // incluir um novo quiz

                    } else if (id_grafico == 'quiz-principal') {
                        dados.labels.shift();
                        dados.labels.push(novoRegistro[0].momento_grafico);

                        dados.datasets[0].data.shift();
                        dados.datasets[0].data.push(novoRegistro[0].qtd_quiz_geral);
                        dados.datasets[1].data.shift();
                        dados.datasets[1].data.push(novoRegistro[0].qtd_quiz_poderes);
                        dados.datasets[2].data.shift();
                        dados.datasets[2].data.push(novoRegistro[0].qtd_quiz_personagens);

                    } else if (id_grafico == 'quiz-media') {
                        dados.labels.shift();
                        dados.labels.push(novoRegistro[0].momento_grafico);

                        dados.datasets[0].data.shift();
                        dados.datasets[0].data.push(novoRegistro[0].media_quiz_geral);
                        dados.datasets[1].data.shift();
                        dados.datasets[1].data.push(novoRegistro[0].media_quiz_poderes);
                        dados.datasets[2].data.shift();
                        dados.datasets[2].data.push(novoRegistro[0].media_quiz_personagens);
                    }

                    myChart.update();
                }

                // Altere aqui o valor em ms se quiser que o gráfico atualize mais rápido ou mais devagar
                proximaAtualizacao = setTimeout(() => {
                    atualizarGrafico(dados, myChart, id_grafico); obterKPIs();
                }, 10000);
            });
        } else {
            console.error('Nenhum dado encontrado ou erro na API');
            // Altere aqui o valor em ms se quiser que o gráfico atualize mais rápido ou mais devagar
            proximaAtualizacao = setTimeout(() => {
                atualizarGrafico(dados, myChart, id_grafico); obterKPIs();
            }, 10000);
        }
    })
        .catch(function (error) {
            console.error(`Erro na obtenção dos dados p/ gráfico: ${error.message}`);
        });

}

obterKPIQuiz()