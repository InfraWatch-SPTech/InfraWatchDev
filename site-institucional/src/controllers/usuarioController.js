var usuarioModel = require("../models/usuarioModel");

function converterId(valor) {
    if (typeof valor === "number") {
        return Number.isInteger(valor) && valor > 0 ? valor : null;
    }

    if (typeof valor === "string" && /^\d+$/.test(valor)) {
        var numero = Number(valor);
        return Number.isSafeInteger(numero) && numero > 0 ? numero : null;
    }

    return null;
}

function transformarLista(texto) {
    if (!texto) {
        return [];
    }

    return texto.split(",");
}

function autenticar(req, res) {
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;

    if (email == undefined) {
        return res.status(400).send("Seu email não foi informado!");
    }

    if (senha == undefined) {
        return res.status(400).send("Sua senha não foi informada!");
    }

    usuarioModel.autenticar(email, senha)
        .then(function (resultadoAutenticar) {
            if (resultadoAutenticar.length === 0) {
                return res.status(403).send("Email e/ou senha inválido(s)");
            }

            if (resultadoAutenticar.length > 1) {
                return res.status(403).send("Mais de um usuário com o mesmo login e senha!");
            }

            var usuario = resultadoAutenticar[0];
            var permissoes = transformarLista(usuario.permissoes);

            res.json({
                id: usuario.id,
                email: usuario.email,
                nome: usuario.nome,
                idNivelAcesso: usuario.idNivelAcesso,
                nomeNivelAcesso: usuario.nomeNivelAcesso,

                // Mantidos para não quebrar páginas antigas do projeto.
                perm: usuario.idNivelAcesso,
                nomePermissao: usuario.nomeNivelAcesso,
                descPermissao: usuario.descPermissao,

                permissoes: permissoes,
                idEmpresa: usuario.idEmpresa,
                nomeEmpresa: usuario.nomeEmpresa
            });
        })
        .catch(function (erro) {
            console.log("Houve um erro ao realizar o login!", erro.sqlMessage || erro);
            res.status(500).send("Erro interno ao realizar o login.");
        });
}

function cadastrar(req, res) {
    var nome = req.body.nomeServer;
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;
    var codigoEmpresa = req.body.empresaServer;

    if (nome == undefined || nome.trim() === "") {
        return res.status(400).send("Seu nome não foi informado!");
    }

    if (email == undefined || email.trim() === "") {
        return res.status(400).send("Seu email não foi informado!");
    }

    if (senha == undefined || senha === "") {
        return res.status(400).send("Sua senha não foi informada!");
    }

    if (codigoEmpresa == undefined || codigoEmpresa.trim() === "") {
        return res.status(400).send("O código da empresa não foi informado!");
    }

    usuarioModel.verificar_cadastro(email)
        .then(function (resultado) {
            if (resultado.length > 0) {
                res.status(403).send("Já existe um cadastro com esse email.");
                return null;
            }

            return usuarioModel.verificar_empresa_por_nome(codigoEmpresa);
        })
        .then(function (resultadoEmpresa) {
            if (!resultadoEmpresa) {
                return null;
            }

            if (resultadoEmpresa.length === 0) {
                res.status(404).send("Empresa não encontrada!");
                return null;
            }

            var fkEmpresa = resultadoEmpresa[0].idEmpresa;

            return usuarioModel.verificar_usuarios_empresa(fkEmpresa)
                .then(function (resultadoUsuarios) {
                    var quantidadeUsuarios = Number(resultadoUsuarios[0].quantidadeUsuarios);
                    var nomeNivelAcesso;

                    if (quantidadeUsuarios === 0) {
                        nomeNivelAcesso = "Gerente";
                    } else {
                        nomeNivelAcesso = "Usuario";
                    }

                    return usuarioModel.cadastrar(
                        nome,
                        email,
                        senha,
                        fkEmpresa,
                        nomeNivelAcesso
                    );
                });
        })
        .then(function (resultadoCadastro) {
            if (resultadoCadastro) {
                res.status(201).send("Usuário cadastrado com sucesso!");
            }
        })
        .catch(function (erro) {
            console.log("Houve um erro ao cadastrar o usuário.", erro.sqlMessage || erro);

            if (!res.headersSent) {
                res.status(500).send("Erro interno ao cadastrar o usuário.");
            }
        });
}

function listarUsuariosEmpresa(req, res) {
    var idGerente = converterId(req.query.idGerente);
    var idEmpresa = converterId(req.query.idEmpresa);

    if (!idGerente || !idEmpresa) {
        return res.status(400).send("Informe um gerente e uma empresa válidos.");
    }

    usuarioModel.buscarGerenteNaEmpresa(idGerente, idEmpresa)
        .then(function (gerentes) {
            if (gerentes.length === 0) {
                res.status(403).send("Solicitante não é gerente desta empresa.");
                return null;
            }

            return usuarioModel.listarUsuariosEmpresa(idEmpresa)
                .then(function (usuarios) {
                    for (var i = 0; i < usuarios.length; i++) {
                        usuarios[i].idsPermissoes = transformarLista(usuarios[i].idsPermissoes)
                            .map(function (id) {
                                return Number(id);
                            });

                        usuarios[i].nomesPermissoes = transformarLista(usuarios[i].nomesPermissoes);
                    }

                    res.status(200).json(usuarios);
                });
        })
        .catch(function (erro) {
            console.log("Houve um erro ao listar os usuários.", erro.sqlMessage || erro);

            if (!res.headersSent) {
                res.status(500).send("Erro interno ao listar os usuários.");
            }
        });
}

function listarPermissoes(req, res) {
    var idGerente = converterId(req.query.idGerente);
    var idEmpresa = converterId(req.query.idEmpresa);

    if (!idGerente || !idEmpresa) {
        return res.status(400).send("Informe um gerente e uma empresa válidos.");
    }

    usuarioModel.buscarGerenteNaEmpresa(idGerente, idEmpresa)
        .then(function (gerentes) {
            if (gerentes.length === 0) {
                res.status(403).send("Solicitante não é gerente desta empresa.");
                return null;
            }

            return usuarioModel.listarPermissoesDisponiveis()
                .then(function (permissoes) {
                    res.status(200).json(permissoes);
                });
        })
        .catch(function (erro) {
            console.log("Houve um erro ao listar as permissões.", erro.sqlMessage || erro);

            if (!res.headersSent) {
                res.status(500).send("Erro interno ao listar as permissões.");
            }
        });
}

function atualizarAcesso(req, res) {
    var corpo = req.body || {};
    var idUsuarioAlvo = converterId(req.params.idUsuario);
    var idGerente = converterId(corpo.idGerente);
    var idEmpresa = converterId(corpo.idEmpresa);
    var nomeNivelAcesso = corpo.nomeNivelAcesso;
    var idsPermissoes = corpo.idsPermissoes;

    if (!idUsuarioAlvo || !idGerente || !idEmpresa) {
        return res.status(400).send("Informe os identificadores do usuário, gerente e empresa.");
    }

    if (nomeNivelAcesso !== "Gerente" && nomeNivelAcesso !== "Usuario") {
        return res.status(400).send("O nível deve ser Gerente ou Usuario.");
    }

    if (!Array.isArray(idsPermissoes)) {
        return res.status(400).send("A lista de permissões deve ser enviada.");
    }

    for (var i = 0; i < idsPermissoes.length; i++) {
        idsPermissoes[i] = converterId(idsPermissoes[i]);

        if (!idsPermissoes[i]) {
            return res.status(400).send("Foi informada uma permissão inválida.");
        }
    }

    idsPermissoes = Array.from(new Set(idsPermissoes));

    usuarioModel.buscarGerenteNaEmpresa(idGerente, idEmpresa)
        .then(function (gerentes) {
            if (gerentes.length === 0) {
                res.status(403).send("Solicitante não é gerente desta empresa.");
                return null;
            }

            if (idUsuarioAlvo === idGerente) {
                res.status(403).send("O gerente não pode alterar o próprio acesso.");
                return null;
            }

            return usuarioModel.buscarUsuarioNaEmpresa(idUsuarioAlvo, idEmpresa);
        })
        .then(function (usuariosAlvo) {
            if (!usuariosAlvo) {
                return null;
            }

            if (usuariosAlvo.length === 0) {
                res.status(404).send("Usuário não encontrado nesta empresa.");
                return null;
            }

            var usuarioAlvo = usuariosAlvo[0];

            if (usuarioAlvo.nomeNivelAcesso === "Root") {
                res.status(403).send("O acesso do Root não pode ser alterado.");
                return null;
            }

            if (!usuarioAlvo.idNivelAcesso) {
                res.status(409).send("O usuário ainda não possui um nível de acesso.");
                return null;
            }

            return usuarioModel.verificarPermissoesValidas(idsPermissoes)
                .then(function (permissoesValidas) {
                    if (permissoesValidas.length !== idsPermissoes.length) {
                        res.status(400).send("Uma ou mais permissões não são válidas.");
                        return null;
                    }

                    return usuarioModel.atualizarNivelAcesso(
                        usuarioAlvo.idNivelAcesso,
                        nomeNivelAcesso
                    )
                        .then(function () {
                            return usuarioModel.removerPermissoesNivel(usuarioAlvo.idNivelAcesso);
                        })
                        .then(function () {
                            return usuarioModel.adicionarPermissoesNivel(
                                usuarioAlvo.idNivelAcesso,
                                idsPermissoes
                            );
                        })
                        .then(function () {
                            res.status(200).json({
                                idUsuario: idUsuarioAlvo,
                                nomeNivelAcesso: nomeNivelAcesso,
                                idsPermissoes: idsPermissoes
                            });
                        });
                });
        })
        .catch(function (erro) {
            console.log("Houve um erro ao alterar o acesso.", erro.sqlMessage || erro);

            if (!res.headersSent) {
                res.status(500).send("Erro interno ao alterar o acesso.");
            }
        });
}

module.exports = {
    autenticar,
    cadastrar,
    listarUsuariosEmpresa,
    listarPermissoes,
    atualizarAcesso
};
