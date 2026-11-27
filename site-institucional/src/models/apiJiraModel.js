function paraData(valor) {
    if (!valor) return null;
    const data = new Date(String(valor).replace(/([+-]\d{2})(\d{2})$/, "$1:$2"));
    return Number.isNaN(data.getTime()) ? null : data;
}

function descricaoParaTexto(description) { // Converte o ADF da descrição para texto legível
    if (typeof description === "string") return description;

    const visitar = (no) => {
        if (no.type === "text") return no.text ?? "";
        if (no.type === "hardBreak") return "\n";
        return (no.content ?? []).map(visitar).join("");
    };

    return (description?.content ?? []).map(visitar).join("\n").trim();
}

function analisarColunas(j) {
    const campos = j.fields ?? {};
    const agora = new Date().toISOString();

    const transicoes = (j.changelog?.histories ?? [])
        .slice()
        .sort((a, b) => new Date(a.created) - new Date(b.created)) // Pra ordenar do mais antigo para o mais novo
        .flatMap(h =>
            (h.items ?? [])
                .filter(i => i.field === "status")
                .map(i => ({
                    de: i.fromString ?? "",
                    para: i.toString ?? "",
                    idDe: i.from ?? "",
                    idPara: i.to ?? "",
                    data: h.created ?? "",
                }))
        );

    const entradas = [
        { coluna: transicoes[0]?.de ?? campos.status?.name ?? "", inicio: campos.created ?? "" },
        ...transicoes.map(t => ({ coluna: t.para, inicio: t.data })),
    ];

    const fechamento = campos.resolutiondate ?? agora;

    const periodos = entradas.map((e, i) => {
        const ultimo = i === entradas.length - 1;
        const emAberto = ultimo && !campos.resolutiondate;
        const fim = ultimo ? fechamento : entradas[i + 1].inicio;
        const ini = paraData(e.inicio);
        const fn = paraData(fim);
        const duracaoMs = ini && fn ? Math.max(0, fn - ini) : 0;

        return {
            coluna: e.coluna,
            entrouEm: e.inicio,
            saiuEm: emAberto ? null : fim, // saiuEm de um = entrouEm do próximo
            duracaoMs,
            duracao: Math.floor(duracaoMs / 60000), // inteiro em minutos
            emAberto,
        };
    });

    return { transicoes, periodos };
}

function formatarHistorico(changelog) {
    return (changelog?.histories ?? [])
        .slice()
        .sort((a, b) => new Date(a.created) - new Date(b.created)) // mais antigo primeiro
        .map(h => ({
            data: h.created ?? "",
            autor: h.author?.displayName ?? "Desconhecido",
            alteracoes: (h.items ?? []).map(i => ({
                campo: i.field ?? "",
                tipo: i.fieldtype ?? "",
                de: i.fromString ?? "",
                para: i.toString ?? "",
            })),
        }));
}

function formatar(j) {
    const campos = j.fields ?? {};
    const { transicoes, periodos } = analisarColunas(j);

    return { // Colunas formatadas para recebimento do json
        chave: j.key ?? "",
        titulo: campos.summary ?? "",
        status: campos.status?.name ?? "",
        responsavel: campos.assignee?.displayName ?? "Sem Responsável",
        descricao: descricaoParaTexto(campos.description) ?? "Sem Descrição",
        trocasDeColuna: transicoes.map(t => ({ data: t.data, de: t.de, para: t.para })),
        tempoPorColuna: periodos,
    };
}

module.exports = { formatar };