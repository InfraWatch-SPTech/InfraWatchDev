// btn fechar cardErro
let btn_fechar_erro = document.getElementById('btn_fechar_card_erro');

btn_fechar_erro.addEventListener('click', () => {
    cardErro.style.display = 'none';
})

function cadastrar() {
    // aguardar();

    //Recupere o valor da nova input pelo nome do id
    // Agora vá para o método fetch logo abaixo
    var nomeVar = nome_input.value;
    var emailVar = email_input.value;
    var senhaVar = senha_input.value;
    var confirmacaoSenhaVar = confirmacao_senha_input.value;
    var cpfVar = cpf_input.value;

    // Verificando se há algum campo em branco
    if (nomeVar == '' || emailVar == '' || senhaVar == '' || confirmacaoSenhaVar == '' || cpfVar == '') {
        cardErro.style.display = 'flex';
        mensagem_erro.innerHTML =
            `
            Preencha todos os campos!
        `;
        finalizarAguardar();
        return false;

    } else if (nomeVar.length <= 4) {
        cardErro.style.display = 'flex';
        mensagem_erro.innerHTML =
            `
            O campo NOME: (${nomeVar}) deve ter 5 ou mais caracteres! 
        `;
        finalizarAguardar();
        return false;

    } else if (cpfVar.length != 11) {
        cardErro.style.display = 'flex';
        mensagem_erro.innerHTML =
            `
            O campo CPF: ${cpfVar} deve conter 11 caracteres! 
        `;
        finalizarAguardar();
        return false;

    } else if (!emailVar.includes('@') && !emailVar.includes('.')) {
        cardErro.style.display = 'flex';
        mensagem_erro.innerHTML =
            `
            O campo EMAIL: (${emailVar}) deve ser um email válido! <br>
            Com "@" e "."! 
        `;
        finalizarAguardar();
        return false;

    } else if (senhaVar.length <= 5) {
        cardErro.style.display = 'flex';
        mensagem_erro.innerHTML =
            `
            O campo SENHA: (${senhaVar}) deve ter 6 ou mais caracteres! 
        `;
        finalizarAguardar();
        return false;

    } else if (confirmacaoSenhaVar != senhaVar) {
        cardErro.style.display = 'flex';
        mensagem_erro.innerHTML =
            `
            O campo SENHA CONFIRMAÇÃO: (${confirmacaoSenhaVar}) deve ser igual ao campo SENHA: (${senhaVar})!
        `;
        finalizarAguardar();
        return false;
    }
    else {
        setInterval(sumirMensagem, 5000);
    }

    // Enviando o valor da nova input
    fetch("/usuarios/cadastrar", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            // crie um atributo que recebe o valor recuperado aqui
            // Agora vá para o arquivo routes/usuario.js
            nomeServer: nomeVar,
            emailServer: emailVar,
            senhaServer: senhaVar,
            cpfServer: cpfVar
        }),
    })
        .then(function (resposta) {
            console.log("resposta: ", resposta);

            if (resposta.ok) {
                cardErro.style.display = "flex";

                mensagem_erro.innerHTML =
                    "Cadastro realizado com sucesso! Redirecionando para tela de Login...";

                setTimeout(() => {
                    window.location = "login.html";
                }, "2000");

                limparFormulario();
                finalizarAguardar();
            } else {
                return resposta.text().then(function (erroMsg) {
                    cardErro.style.display = 'flex';
                    mensagem_erro.innerHTML = erroMsg;

                    setInterval(sumirMensagem, 5000);
                    finalizarAguardar();
                });
            }
        })
        .catch(function (resposta) {
            console.log(`#ERRO: ${resposta}`);
            finalizarAguardar();
        });

    return false;
}

function sumirMensagem() {
    cardErro.style.display = 'none';
}