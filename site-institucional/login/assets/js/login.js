/*conexão front e back login*/

let containerLogin = document.getElementById('contentLogin');
let btnEntrar = document.getElementById('tab-entrar');

let containerCad = document.getElementById('contentCad');
let btnCadastro = document.getElementById('tab-cadastrar');

// Garante o estado inicial ativo do botão Entrar
btnEntrar.classList.add('active');

btnCadastro.addEventListener('click', ()=>{
    containerLogin.classList.add('fade-out');

    setTimeout(() => {
        containerLogin.innerHTML = 
        `
            <div class="login-esquerda">
                <div class="login-logo">
                    <h1>Infra<span>Watch</span></h1>
                </div>
                <div class="login-esquerda-content">
                    <div class="login-esquerda-text">
                        <h2>
                            Controle total dos seus sistemas,
                            <span>antes que o cliente perceba</span>
                        </h2>
                    </div>
                    <div class="login-esquerda-description">
                        <h6>Acesse o painel para acompanhar em tempo real a saúde da sua infraestrutura</h6>
                    </div>
                </div>
            </div>

            <div class="login-direita">
                <form class="formulario-login formulario-cadastro" id="form-login">
                    <div class="formulario-login-title">
                        <h2>Crie sua Conta</h2>
                        <span>Comece a monitorar sua infraestrutura em poucos minutos</span>
                    </div>

                    <div class="input-row">
                        <div class="inputs">
                            <label for="input-nome">Nome</label>
                            <input type="text" id="input-nome" name="nome" placeholder="Seu nome" required>
                        </div>

                        <div class="inputs">
                            <label for="input-sobrenome">Sobrenome</label>
                            <input type="text" id="input-sobrenome" name="sobrenome" placeholder="Seu sobrenome" required>
                        </div>
                    </div>

                    <div class="inputs">
                        <label for="input-email">E-mail corporativo</label>
                        <input type="email" id="input-email" name="email" placeholder="voce@empresa.com" required>
                    </div>

                    <div class="inputs">
                        <label for="input-empresa">Empresa</label>
                        <input type="text" id="input-empresa" name="empresa" placeholder="Nome da instituição" required>
                    </div>
                    
                    <div class="input-row">
                        <div class="inputs">
                            <label for="input-senha-cad">Senha</label>
                            <input type="password" id="input-senha-cad" name="senha" placeholder="********" required minlength="8">
                        </div>

                        <div class="inputs">
                            <label for="input-confirmar-senha">Confirmar senha</label>
                            <input type="password" id="input-confirmar-senha" name="confirmar_senha" placeholder="********" required>
                        </div>
                    </div>

                    <a href="#" class="esqueci-a-senha">Esqueci minha senha</a>

                    <button type="submit" id="btn-entrar-plataforma">
                        Cadastrar na plataforma
                    </button>

                    <span class="formulario-login-footer">
                        Já tem conta? <a href="#" id="link-entrar">Acesse sua conta</a>
                    </span>
                </form>
            </div>
        `;
        
        btnCadastro.classList.add('active');
        btnEntrar.classList.remove('active');

        containerLogin.classList.remove('fade-out');
    }, 250); 
});

btnEntrar.addEventListener('click', ()=>{
    containerLogin.classList.add('fade-out');

    setTimeout(() => {
        containerLogin.innerHTML = 
        `
            <div class="login-esquerda">
                <div class="login-logo">
                    <h1>Infra<span>Watch</span></h1>
                </div>

                <div class="login-esquerda-content">
                    <div class="login-esquerda-text">
                        <h2>
                            Controle total dos seus sistemas,
                            <span>antes que o cliente perceba</span>
                        </h2>
                    </div>
                    <div class="login-esquerda-description">
                        <h6>Acesse o painel para acompanhar em tempo real a saúde da sua infraestrutura</h6>
                    </div>
                </div>
            </div>

            <div class="login-direita">
                <form class="formulario-login" id="form-login">
                    <div class="formulario-login-title">
                        <h2>Acesse sua conta</h2>
                        <span>Entre para acompanhar seus painéis de monitoramento.</span>
                    </div>

                    <div class="inputs">
                        <label for="input-email">E-mail corporativo</label>
                        <input type="email" id="input-email" name="email" placeholder="voce@empresa.com" required>
                    </div>

                    <div class="inputs">
                        <label for="input-senha">Senha</label>
                        <input type="password" id="input-senha" name="senha" placeholder="********" required>
                    </div>

                    <a href="#" class="esqueci-a-senha">Esqueci minha senha</a>

                    <button type="submit" id="btn-entrar-plataforma">
                        Entrar na plataforma
                    </button>

                    <span class="formulario-login-footer">
                        Ainda não tem conta? <a href="#" id="link-cadastrar">Cadastre-se</a>
                    </span>
                </form>
            </div>
        `;

        btnCadastro.classList.remove('active');
        btnEntrar.classList.add('active');

        containerLogin.classList.remove('fade-out');
    }, 250);
});
