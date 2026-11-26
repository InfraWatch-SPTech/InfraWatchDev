function formatar(j) {
    return { // Colunas formatadas para recebimento do json
        chave: j.key,
        titulo: j.fields.summary,
        status: j.fields.status?.name,
        responsavel: j.fields.assignee?.displayName ?? "Sem Responsável",
    };
}

module.exports = { formatar };