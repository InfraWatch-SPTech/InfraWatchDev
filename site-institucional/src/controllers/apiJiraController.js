const { formatar } = require('../models/apiJiraModel');

async function listarIssues(req, res) {
    const { JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN } = process.env

    const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")
    const params = new URLSearchParams({
        jql: `project = ${req.params.projeto} ORDER BY created DESC`,
        fields: "summary,status,assignee", // Colocar todas as colunas do Model aqui
        maxResults: "50",
    });

    try {
        const resp = await fetch(`${JIRA_DOMAIN}/rest/api/3/search/jql?${params}`, {
            headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
        });

        const dados = await resp.json();
        res.json(dados.issues.map(formatar));

        if (!resp.ok) return res.status(resp.status).json({ erro: "Falha ao tentar consultar Jira!" })

    } catch (e) {
        res.status(500).json({ erro: e.message });
    }
}

module.exports = { listarIssues };