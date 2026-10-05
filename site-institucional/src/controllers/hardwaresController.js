var hardwaresModel = require("../models/hardwaresModel");

function converterId(valor) {
    var numero = Number(valor);

    if (!Number.isInteger(numero) || numero <= 0) {
        return null;
    }

    return numero;
}

function transformarPermissoes(textoPermissoes) {
    if (!textoPermissoes) {
        return [];
    }

    return textoPermissoes.split(",");
}

function possuiPermissao(permissoes, nome) {
    return permissoes.indexOf(nome) !== -1;
}

function obterTiposPermitidos(acesso) {
    var nivel = acesso.nomeNivelAcesso;
    var permissoes = transformarPermissoes(acesso.permissoes);

    if (nivel === "Root") {
        return null;
    }

    var tipos = [];

    if (possuiPermissao(permissoes, "DASHBOARD_SERVIDORES")) {
        tipos.push("Servidor");
    }

    if (possuiPermissao(permissoes, "DASHBOARD_NOTEBOOKS")) {
        tipos.push("Notebook");
        tipos.push("Computador");
    }

    if (possuiPermissao(permissoes, "DASHBOARD_REDE")) {
        tipos.push("Switch");
        tipos.push("Roteador");
        tipos.push("Firewall");
        tipos.push("Rede");
    }

    return tipos;
}

function tipoEstaPermitido(tipo, tiposPermitidos) {
    if (tiposPermitidos === null) {
        return true;
    }

    return tiposPermitidos.indexOf(tipo) !== -1;
}

function buscarAcesso(idUsuario, idEmpresa, res) {
    return hardwaresModel.buscarAcessoUsuario(idUsuario, idEmpresa)
        .then(function (resultado) {
            if (resultado.length === 0) {
                res.status(403).send("Usuário sem acesso a esta empresa.");
                return null;
            }

            return resultado[0];
        });
}

function validarLimites(req, res) {
    var limites = [
        { campo: "limiteCpu", nome: "CPU" },
        { campo: "limiteRam", nome: "RAM" },
        { campo: "limiteDisco", nome: "disco" }
    ];

    for (var i = 0; i < limites.length; i++) {
        var campo = limites[i].campo;
        var valor = req.body[campo];

        if (!Number.isInteger(valor) || valor < 1 || valor > 100) {
            res.status(400).send(
                `O limite de ${limites[i].nome} deve ser um número inteiro entre 1 e 100.`
            );
            return false;
        }
    }

    return true;
}

function buscarEquipamentosEmpresa(req, res) {
    var idEmpresa = converterId(req.params.idEmpresa);
    var idUsuario = converterId(req.query.idUsuario);

    if (!idEmpresa || !idUsuario) {
        return res.status(400).send("Informe um usuário e uma empresa válidos.");
    }

    buscarAcesso(idUsuario, idEmpresa, res)
        .then(function (acesso) {
            if (!acesso) {
                return null;
            }

            var tiposPermitidos = obterTiposPermitidos(acesso);
            return hardwaresModel.buscarEquipamentosEmpresa(idEmpresa, tiposPermitidos);
        })
        .then(function (resultado) {
            if (!resultado || res.headersSent) {
                return;
            }

            if (resultado.length === 0) {
                return res.status(204).send();
            }

            res.status(200).json(resultado);
        })
        .catch(function (erro) {
            console.log("Houve um erro ao buscar os equipamentos.", erro.sqlMessage || erro);

            if (!res.headersSent) {
                res.status(500).send("Erro interno ao buscar os equipamentos.");
            }
        });
}

function cadastrarEquipamento(req, res) {
    if (!validarLimites(req, res)) {
        return;
    }

    var idUsuario = converterId(req.body.idUsuario);
    var fkEmpresa = converterId(req.body.fkEmpresa);
    var nome = req.body.nome;
    var tipo = req.body.tipo;
    var localizacao = req.body.localizacao;
    var descricao = req.body.descricao || "";
    var componentes = req.body.componentes || [];
    var limiteCpu = req.body.limiteCpu;
    var limiteRam = req.body.limiteRam;
    var limiteDisco = req.body.limiteDisco;

    if (!idUsuario || !fkEmpresa) {
        return res.status(400).send("O usuário e a empresa são obrigatórios.");
    }

    if (!nome || !tipo || !localizacao) {
        return res.status(400).send("Nome, tipo e localização são obrigatórios.");
    }

    buscarAcesso(idUsuario, fkEmpresa, res)
        .then(function (acesso) {
            if (!acesso) {
                return null;
            }

            if (acesso.nomeNivelAcesso !== "Root") {
                res.status(403).send("Somente o Root pode cadastrar equipamentos.");
                return null;
            }

            return hardwaresModel.cadastrarEquipamento(
                nome,
                tipo,
                localizacao,
                descricao,
                fkEmpresa
            );
        })
        .then(function (resultadoEquipamento) {
            if (!resultadoEquipamento || res.headersSent) {
                return null;
            }

            var idEquipamento = resultadoEquipamento.insertId;

            return hardwaresModel.cadastrarComponentes(
                componentes,
                idEquipamento,
                limiteCpu,
                limiteRam,
                limiteDisco
            ).then(function () {
                res.status(201).json({ idEquipamento: idEquipamento });
            });
        })
        .catch(function (erro) {
            console.log("Houve um erro ao cadastrar o equipamento.", erro.sqlMessage || erro);

            if (!res.headersSent) {
                res.status(500).send("Erro interno ao cadastrar o equipamento.");
            }
        });
}

function buscarEquipamentoPorId(req, res) {
    var idEquipamento = converterId(req.params.idEquipamento);
    var idEmpresa = converterId(req.query.idEmpresa);
    var idUsuario = converterId(req.query.idUsuario);

    if (!idEquipamento || !idEmpresa || !idUsuario) {
        return res.status(400).send("Informe equipamento, usuário e empresa válidos.");
    }

    var acessoAtual;

    buscarAcesso(idUsuario, idEmpresa, res)
        .then(function (acesso) {
            if (!acesso) {
                return null;
            }

            acessoAtual = acesso;
            return hardwaresModel.buscarTipoEquipamento(idEquipamento, idEmpresa);
        })
        .then(function (equipamentos) {
            if (!equipamentos || res.headersSent) {
                return null;
            }

            if (equipamentos.length === 0) {
                res.status(404).send("Equipamento não encontrado nesta empresa.");
                return null;
            }

            var tiposPermitidos = obterTiposPermitidos(acessoAtual);

            if (!tipoEstaPermitido(equipamentos[0].tipo, tiposPermitidos)) {
                res.status(403).send("Você não possui acesso a esta categoria de equipamento.");
                return null;
            }

            return hardwaresModel.buscarEquipamentoPorId(idEquipamento, idEmpresa);
        })
        .then(function (resultado) {
            if (!resultado || res.headersSent) {
                return;
            }

            res.status(200).json(resultado);
        })
        .catch(function (erro) {
            console.log("Houve um erro ao buscar o equipamento.", erro.sqlMessage || erro);

            if (!res.headersSent) {
                res.status(500).send("Erro interno ao buscar o equipamento.");
            }
        });
}

function atualizarEquipamento(req, res) {
    if (!validarLimites(req, res)) {
        return;
    }

    var idEquipamento = converterId(req.params.idEquipamento);
    var idUsuario = converterId(req.body.idUsuario);
    var idEmpresa = converterId(req.body.idEmpresa);
    var nome = req.body.nome;
    var tipo = req.body.tipo;
    var localizacao = req.body.localizacao;
    var descricao = req.body.descricao || "";
    var componentes = req.body.componentes || [];
    var limiteCpu = req.body.limiteCpu;
    var limiteRam = req.body.limiteRam;
    var limiteDisco = req.body.limiteDisco;

    if (!idEquipamento || !idUsuario || !idEmpresa) {
        return res.status(400).send("Informe equipamento, usuário e empresa válidos.");
    }

    if (!nome || !tipo || !localizacao) {
        return res.status(400).send("Nome, tipo e localização são obrigatórios.");
    }

    var acessoAtual;

    buscarAcesso(idUsuario, idEmpresa, res)
        .then(function (acesso) {
            if (!acesso) {
                return null;
            }

            if (acesso.nomeNivelAcesso !== "Root" && acesso.nomeNivelAcesso !== "Gerente") {
                res.status(403).send("Seu nível de acesso não permite editar equipamentos.");
                return null;
            }

            acessoAtual = acesso;
            return hardwaresModel.buscarTipoEquipamento(idEquipamento, idEmpresa);
        })
        .then(function (equipamentos) {
            if (!equipamentos || res.headersSent) {
                return null;
            }

            if (equipamentos.length === 0) {
                res.status(404).send("Equipamento não encontrado nesta empresa.");
                return null;
            }

            var tiposPermitidos = obterTiposPermitidos(acessoAtual);
            var tipoAtual = equipamentos[0].tipo;

            if (!tipoEstaPermitido(tipoAtual, tiposPermitidos) ||
                !tipoEstaPermitido(tipo, tiposPermitidos)) {
                res.status(403).send("Você não possui acesso a esta categoria de equipamento.");
                return null;
            }

            return hardwaresModel.atualizarEquipamento(
                idEquipamento,
                idEmpresa,
                nome,
                tipo,
                localizacao,
                descricao
            );
        })
        .then(function (resultadoAtualizacao) {
            if (!resultadoAtualizacao || res.headersSent) {
                return null;
            }

            return hardwaresModel.deletarParametrosPorEquipamento(idEquipamento);
        })
        .then(function (resultadoExclusao) {
            if (!resultadoExclusao || res.headersSent) {
                return null;
            }

            return hardwaresModel.cadastrarComponentes(
                componentes,
                idEquipamento,
                limiteCpu,
                limiteRam,
                limiteDisco
            );
        })
        .then(function (resultadoComponentes) {
            if (resultadoComponentes === null || res.headersSent) {
                return;
            }

            res.status(200).json({ idEquipamento: idEquipamento });
        })
        .catch(function (erro) {
            console.log("Houve um erro ao atualizar o equipamento.", erro.sqlMessage || erro);

            if (!res.headersSent) {
                res.status(500).send("Erro interno ao atualizar o equipamento.");
            }
        });
}

function deletarEquipamento(req, res) {
    var idEmpresa = converterId(req.params.idEmpresa);
    var idEquipamento = converterId(req.params.idEquipamento);
    var idUsuario = converterId(req.query.idUsuario);

    if (!idEmpresa || !idEquipamento || !idUsuario) {
        return res.status(400).send("Informe equipamento, usuário e empresa válidos.");
    }

    buscarAcesso(idUsuario, idEmpresa, res)
        .then(function (acesso) {
            if (!acesso) {
                return null;
            }

            if (acesso.nomeNivelAcesso !== "Root") {
                res.status(403).send("Somente o Root pode excluir equipamentos.");
                return null;
            }

            return hardwaresModel.deletarEquipamento(idEmpresa, idEquipamento);
        })
        .then(function (resultado) {
            if (!resultado || res.headersSent) {
                return;
            }

            if (resultado.affectedRows === 0) {
                return res.status(404).send("Equipamento não encontrado.");
            }

            res.status(200).json({ idEquipamento: idEquipamento });
        })
        .catch(function (erro) {
            console.log("Houve um erro ao excluir o equipamento.", erro.sqlMessage || erro);

            if (!res.headersSent) {
                res.status(500).send("Erro interno ao excluir o equipamento.");
            }
        });
}

module.exports = {
    cadastrarEquipamento,
    buscarEquipamentosEmpresa,
    buscarEquipamentoPorId,
    atualizarEquipamento,
    deletarEquipamento
};
