/*conexão front e back login*/

let containerLogin = document.getElementById('contentLogin');
let btnEntrar = document.getElementById('tab-entrar');

let containerCad = document.getElementById('contentCad');
let btnCadastro = document.getElementById('tab-cadastrar');

btnCadastro.addEventListener('click', ()=>{
    containerLogin.innerHTML = 
    `
        <div class="login-esquerda">
                <div class="login-logo">
                    <h1>Infra<span>Watch</span></h1>
                </div>

                <div class="login-esquerda-content">
                    <div class="login-esquerda-text">
                        <h2>
                            Controle total dos seus
                            sistemas,
                            <span>antes que o
                            cliente perceba</span>
                        </h2>
                    </div>
                    <div class="login-esquerda-description">
                        <h6>
                            Acesse o painel para acompanhar em tempo
                            real a saúde da sua infraestrutura
                        </h6>
                    </div>
                </div>
            </div>

            <div class="login-direita">
                <form class="formulario-login" id="form-login">
                    <div class="formulario-login-title">
                        <h2>Crie sua Conta</h2>
                        <span>Comece a monitorar sua insfraestrutura em poucos minutos</span>
                    </div>

                    <div class="inputs">
                        <label for="input-nome">Nome</label>
                        <input type="nome" id="input-nome" name="nome" placeholder="Seu nome" required>
                    </div>

                    <div class="inputs">
                        <label for="input-sobrenome">Sobrenome</label>
                        <input type="sobrenome" id="input-sobrenome" name="sobrenome" placeholder="Seu Sobrenome" required>
                    </div>

                    <div class="inputs">
                        <label for="input-email">E-mail corporativo</label>
                        <input type="email" id="input-email" name="email" placeholder="voce@empresa.com" required>
                    </div>

                     <div class="inputs">
                        <label for="input-empresa">Empresa</label>
                        <input type="empresa" id="input-empresa" name="empresa" placeholder="Nome da instituição" required>
                    </div>
                    
                    <div class="inputs">
                        <label for="input-senha">Senha</label>
                        <input type="password" id="input-senha" name="senha" placeholder="********" required>
                    </div>

                     <div class="inputs">
                        <label for="input-senha">Senha</label>
                        <input type="password" id="input-senha" name="senha" placeholder="********" required>
                    </div>

                    <a href="#" class="esqueci-a-senha">
                        Esqueci minha senha
                    </a>

                    <button type="submit" id="btn-entrar-plataforma">
                        Entrar na plataforma
                    </button>

                    <span class="formulario-login-footer">
                        Ainda não tem conta? <a href="#" id="link-cadastrar">Cadastre-se</a>
                    </span>
                </form>
            </div>
    `;
    btnCadastro.style.background = 'linear-gradient(90deg, #5178F9 0%, #6FE0FF 100%)';
    btnCadastro.style.color = '#FFF';
    btnEntrar.style.background = 'transparent'

})


btnEntrar.addEventListener('click', ()=>{
    containerLogin.innerHTML = 
    `
        <div class="login-esquerda">
                <div class="login-logo">
                    <h1>Infra<span>Watch</span></h1>
                </div>

                <div class="login-esquerda-content">
                    <div class="login-esquerda-text">
                        <h2>
                            Controle total dos seus
                            sistemas,
                            <span>antes que o
                            cliente perceba</span>
                        </h2>
                    </div>
                    <div class="login-esquerda-description">
                        <h6>
                            Acesse o painel para acompanhar em tempo
                            real a saúde da sua infraestrutura
                        </h6>
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

                    <a href="#" class="esqueci-a-senha">
                        Esqueci minha senha
                    </a>

                    <button type="submit" id="btn-entrar-plataforma">
                        Entrar na plataforma
                    </button>

                    <span class="formulario-login-footer">
                        Ainda não tem conta? <a href="#" id="link-cadastrar">Cadastre-se</a>
                    </span>
                </form>
            </div>
    `;

    btnCadastro.style.background = 'transparent';
    btnCadastro.style.color = '#FFF';
    btnEntrar.style.background = 'linear-gradient(90deg, #5178F9 0%, #6FE0FF 100%)';
})