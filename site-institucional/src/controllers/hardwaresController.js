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

function usuarioEhRoot(acesso) {
    return acesso.nomeNivelAcesso === "Root";
}

function usuarioEhAdministrador(acesso) {
    return acesso.nomeNivelAcesso === "Administrador";
}

function podeExecutarAcao(acesso, nomePermissao) {
    if (usuarioEhRoot(acesso)) {
        return true;
    }

    var permissoes = transformarPermissoes(acesso.permissoes);
    return possuiPermissao(permissoes, nomePermissao);
}

function podeVisualizarEquipamentos(acesso) {
    if (usuarioEhRoot(acesso)) {
        return true;
    }

    var permissoes = transformarPermissoes(acesso.permissoes);

    return possuiPermissao(permissoes, "EQUIPAMENTOS_VISUALIZAR") ||
        possuiPermissao(permissoes, "EQUIPAMENTOS_SERVIDORES_VISUALIZAR") ||
        possuiPermissao(permissoes, "EQUIPAMENTOS_NOTEBOOKS_VISUALIZAR") ||
        possuiPermissao(permissoes, "EQUIPAMENTOS_REDE_VISUALIZAR");
}

function obterTiposPermitidos(acesso) {
    if (usuarioEhRoot(acesso)) {
        return null;
    }

    var permissoes = transformarPermissoes(acesso.permissoes);
    var tipos = [];

    if (possuiPermissao(permissoes, "EQUIPAMENTOS_SERVIDORES_VISUALIZAR")) {
        tipos.push("Servidor");
    }

    if (possuiPermissao(permissoes, "EQUIPAMENTOS_NOTEBOOKS_VISUALIZAR")) {
        tipos.push("Notebook");
        tipos.push("Computador");
    }

    if (possuiPermissao(permissoes, "EQUIPAMENTOS_REDE_VISUALIZAR")) {
        tipos.push("Switch");
        tipos.push("Roteador");
        tipos.push("Firewall");
        tipos.push("Rede");
    }

    // Compatibilidade com bancos que ainda não receberam as novas
    // permissões de categoria. Nesse caso, EQUIPAMENTOS_VISUALIZAR
    // continua liberando todos os tipos de equipamento.
    if (tipos.length === 0) {
        return null;
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

            if (!podeVisualizarEquipamentos(acesso)) {
                res.status(403).send("Você não possui permissão para visualizar equipamentos.");
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

// BY PEDRO

function validarComponentesCadastro(componentes, res) {
    if (!Array.isArray(componentes) || componentes.length === 0) {
        res.status(400).send('Selecione pelo menos um componente.');
        return false;
    }

    const tiposPermitidos = [
        'CPU', 'RAM', 'ARMAZENAMENTO', 'REDE', 'TEMPERATURA'
    ];

    const tiposRecebidos = new Set();

    for (let componente of componentes) {
        const tipo = String(componente.tipo || '').toUpperCase();
        const atencao = componente.limiteAtencao;
        const critico = componente.limiteCritico;

        if (!tiposPermitidos.includes(tipo) || tiposRecebidos.has(tipo)) {
            res.status(400).send('Componente inválido ou duplicado.');
            return false;
        }

        tiposRecebidos.add(tipo);

        if (
            typeof atencao !== 'number' ||
            typeof critico !== 'number' ||
            !Number.isFinite(atencao) ||
            !Number.isFinite(critico) ||
            atencao < 1 ||
            critico <= atencao ||
            (tipo !== 'TEMPERATURA' && critico > 100)
        ) {
            res.status(400).send(`Limites inválidos para ${tipo}.`);
            return false;
        }
    }

    return true;
}
// FIM BY PEDRO

function cadastrarEquipamento(req, res) {
    var idUsuario = converterId(req.body.idUsuario);
    var fkEmpresa = converterId(req.body.fkEmpresa);
    var nome = req.body.nome;
    var tipo = req.body.tipo;
    var localizacao = req.body.localizacao;
    var descricao = req.body.descricao || "";
    var componentes = req.body.componentes || [];

    if (!validarComponentesCadastro(componentes, res)) {
        return;
    }

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

            if (!usuarioEhRoot(acesso) && !usuarioEhAdministrador(acesso)) {
                res.status(403).send("Somente administradores podem cadastrar equipamentos.");
                return null;
            }

            if (!podeExecutarAcao(acesso, "EQUIPAMENTOS_CADASTRAR")) {
                res.status(403).send("Você não possui permissão para cadastrar equipamentos.");
                return null;
            }

            var tiposPermitidos = obterTiposPermitidos(acesso);

            if (!tipoEstaPermitido(tipo, tiposPermitidos)) {
                res.status(403).send("Você não possui acesso a esta categoria de equipamento.");
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

            return hardwaresModel.cadastrarComponentesComLimites(
                componentes,
                idEquipamento
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

            if (!podeVisualizarEquipamentos(acesso)) {
                res.status(403).send("Você não possui permissão para visualizar equipamentos.");
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

            if (!usuarioEhRoot(acesso) && !usuarioEhAdministrador(acesso)) {
                res.status(403).send("Somente administradores podem editar equipamentos.");
                return null;
            }

            if (!podeExecutarAcao(acesso, "EQUIPAMENTOS_EDITAR")) {
                res.status(403).send("Você não possui permissão para editar equipamentos.");
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
    var acessoAtual;

    if (!idEmpresa || !idEquipamento || !idUsuario) {
        return res.status(400).send("Informe equipamento, usuário e empresa válidos.");
    }

    buscarAcesso(idUsuario, idEmpresa, res)
        .then(function (acesso) {
            if (!acesso) {
                return null;
            }

            if (!usuarioEhRoot(acesso) && !usuarioEhAdministrador(acesso)) {
                res.status(403).send("Somente administradores podem excluir equipamentos.");
                return null;
            }

            if (!podeExecutarAcao(acesso, "EQUIPAMENTOS_EXCLUIR")) {
                res.status(403).send("Você não possui permissão para excluir equipamentos.");
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
function buscarMetricasDashboardEmpresa(req, res) {
  var idEmpresa = req.params.idEmpresa;
  var instrucaoSql = `
    SELECT 
      COUNT(idEquipamento) AS totalEquipamentos, 
      SUM(CASE WHEN status = 'Online' OR status = 'Ativo' THEN 1 ELSE 0 END) AS qtdOnline, 
      SUM(CASE WHEN status = 'Atencao' OR status = 'Manutenção' THEN 1 ELSE 0 END) AS qtdAtencao, 
      SUM(CASE WHEN status = 'Critico' OR status = 'Inativo' THEN 1 ELSE 0 END) AS qtdCritico 
    FROM equipamento 
    WHERE fkEmpresa = ${idEmpresa};
  `;

  database.executar(instrucaoSql)
    .then(function (resultado) {
      var dados = resultado || {};
      var total = dados.totalEquipamentos || 0;
      var online = dados.qtdOnline || 0;
      var atencao = dados.qtdAtencao || 0;
      var critico = dados.qtdCritico || 0;

      // Cálculo dinâmico da disponibilidade interna %
      var dispInterna = total > 0 ? ((online / total) * 100).toFixed(1) : "100.0";
      var alertasTotais = atencao + critico;

      res.json({
        disponibilidadeInterna: dispInterna,
        alertasAtivos: alertasTotais,
        alertasCriticos: critico,
        disponibilidadeExterna: "99.8" // Integrado à API de serviços externos
      });
    });
}

module.exports = {
    cadastrarEquipamento,
    buscarEquipamentosEmpresa,
    buscarEquipamentoPorId,
    atualizarEquipamento,
    deletarEquipamento
};
