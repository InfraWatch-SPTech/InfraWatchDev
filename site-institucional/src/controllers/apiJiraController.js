const { formatar } = require('../models/apiJiraModel');

const CAMPOS = ["summary", "status", "assignee"];
const MAX_RESULTADOS = 50;

async function listarIssues(req, res) {
    const { JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY } = process.env;

    if (!JIRA_DOMAIN || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
        return res.status(500).json({ erro: "Variáveis de ambiente não configuradas corretamente!" });
    }

    // Permite sobrepor a chave do projeto via ?projeto=KAN (padrão: .env)
    const projeto = String(req.query.projeto ?? JIRA_PROJECT_KEY).trim();
    if (!/^[A-Za-z0-9_-]+$/.test(projeto)) {
        return res.status(400).json({ erro: "Chave de projeto inválida!" });
    }

    const jql = `project = "${projeto}" AND statusCategory != Done ORDER BY created DESC`;

    const params = new URLSearchParams({
        jql,
        fields: CAMPOS.join(","),
        maxResults: String(MAX_RESULTADOS),
    });
    const url = `${JIRA_DOMAIN.replace(/\/+$/, "")}/rest/api/3/search/jql?${params}`;

    try {
        const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64");
        const resp = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Basic ${auth}`,
                Accept: "application/json",
            },
            signal: AbortSignal.timeout(10000), // Encerra requisições penduradas
        });

        if (!resp.ok) {
            console.error("Jira:", resp.status, await resp.text());
            return res.status(502).json({ erro: "Falha ao tentar consultar o Jira!", statusJira: resp.status });
        }

        const dados = await resp.json();
        return res.json((dados.issues ?? []).map(formatar));

    } catch (e) {
        console.error("Erro ao consultar o Jira:", e);
        return res.status(502).json({ erro: "Não foi possível consultar o Jira!", detalhe: e.message });
    }
}

module.exports = { listarIssues };
