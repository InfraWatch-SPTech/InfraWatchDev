function formatar(j) {
    const campos = j.fields ?? {};

    return { // Colunas formatadas para recebimento do json
        chave: j.key ?? "",
        titulo: campos.summary ?? "",
        status: campos.status?.name ?? "",
        responsavel: campos.assignee?.displayName ?? "Sem Responsável",
    };
}

module.exports = { formatar };