var usuarioModel = require("../models/usuarioModel");

function autenticar(req, res) {
    var email = req.body.emailServer;
    var senha = req.body.senhaServer;

    if (email == undefined) {
        return res.status(400).send("Seu email está undefined!");
    }
    if (senha == undefined) {
        return res.status(400).send("Sua senha está indefinida!");
    }

    usuarioModel.autenticar(email, senha)
        .then(function (resultadoAutenticar) {
            if (resultadoAutenticar.length == 1) {
                return res.json({
                    id: resultadoAutenticar[0].id,
                    email: resultadoAutenticar[0].email,
                    nome: resultadoAutenticar[0].nome,
                    perm: resultadoAutenticar[0].perm,
                    nomePermissao: resultadoAutenticar[0].nomePermissao,
                    descPermissao: resultadoAutenticar[0].descPermissao,
                    idEmpresa: resultadoAutenticar[0].idEmpresa,
                    nomeEmpresa: resultadoAutenticar[0].nomeEmpresa
                });
            }
            if (resultadoAutenticar.length == 0) {
                return res.status(403).send("Email e/ou senha inválido(s)");
            }
            return res.status(403).send("Mais de um usuário com o mesmo login e senha!");
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
    var nomeEmpresa = req.body.empresaServer;

    if (nome == undefined) {
        return res.status(400).send("Seu nome está undefined!");
    }
    if (email == undefined) {
        return res.status(400).send("Seu email está undefined!");
    }
    if (senha == undefined) {
        return res.status(400).send("Sua senha está indefinida!");
    }

    usuarioModel.verificar_cadastro(email)
        .then(function (resultado) {
            if (resultado.length > 0) {
                res.status(403).send("Já existe um cadastro com esse email.");
                return null;
            }
            return usuarioModel.verificar_empresa_por_nome(nomeEmpresa);
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
                    var quantidadeUsuarios = resultadoUsuarios[0].quantidadeUsuarios;
                    var fkPermissao = quantidadeUsuarios == 0 ? 2 : 3;
                    return usuarioModel.cadastrar(nome, email, senha, fkEmpresa, fkPermissao);
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

function listarUsuariosEmpresa(req, res) {
    var idAdministrador = converterId(req.query.idAdministrador);
    var idEmpresa = converterId(req.query.idEmpresa);

    if (!idAdministrador || !idEmpresa) {
        return res.status(400).send("Informe um administrador e uma empresa válidos.");
    }

    usuarioModel.buscarAdministradorNaEmpresa(idAdministrador, idEmpresa)
        .then(function (administradores) {
            if (administradores.length === 0) {
                res.status(403).send("Solicitante não é administrador desta empresa.");
                return null;
            }
            return usuarioModel.listarUsuariosEmpresa(idEmpresa)
                .then(function (usuarios) {
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

function atualizarPermissao(req, res) {
    var corpo = req.body || {};
    var idUsuarioAlvo = converterId(req.params.idUsuario);
    var idAdministrador = converterId(corpo.idAdministrador);
    var idEmpresa = converterId(corpo.idEmpresa);
    var fkPermissao = corpo.fkPermissao;

    if (!idUsuarioAlvo || !idAdministrador || !idEmpresa) {
        return res.status(400).send("Informe os identificadores do usuário, administrador e empresa.");
    }
    if (!Number.isInteger(fkPermissao) || (fkPermissao !== 2 && fkPermissao !== 3)) {
        return res.status(400).send("A permissão deve ser 2 (Admin) ou 3 (Usuário comum).");
    }

    usuarioModel.buscarAdministradorNaEmpresa(idAdministrador, idEmpresa)
        .then(function (administradores) {
            if (administradores.length === 0) {
                res.status(403).send("Solicitante não é administrador desta empresa.");
                return null;
            }
            if (idUsuarioAlvo === idAdministrador) {
                res.status(403).send("O administrador não pode alterar a própria permissão.");
                return null;
            }

            return usuarioModel.buscarUsuarioNaEmpresa(idUsuarioAlvo, idEmpresa)
                .then(function (usuariosAlvo) {
                    if (usuariosAlvo.length === 0) {
                        res.status(404).send("Usuário não encontrado nesta empresa.");
                        return null;
                    }
                    return usuarioModel.atualizarPermissaoUsuario(idUsuarioAlvo, idEmpresa, fkPermissao)
                        .then(function () {
                            res.status(200).json({ idUsuario: idUsuarioAlvo, fkPermissao: fkPermissao });
                        });
                });
        })
        .catch(function (erro) {
            console.log("Houve um erro ao alterar a permissão.", erro.sqlMessage || erro);
            if (!res.headersSent) {
                res.status(500).send("Erro interno ao alterar a permissão.");
            }
        });
}

module.exports = {
    autenticar,
    cadastrar,
    listarUsuariosEmpresa,
    atualizarPermissao
};
