// ========================================
// CARREGA OS VENDEDORES SALVOS
// ========================================

function normalizarVendedores(dados) {
    if (!Array.isArray(dados)) {
        return [];
    }

    return dados
        .map((item) => {
            if (typeof item === "string") {
                return {
                    nome: item,
                    cor: "verde",
                };
            }

            if (item && typeof item === "object") {
                const nome = String(item.nome ?? "").trim();

                if (nome === "") {
                    return null;
                }

                return {
                    nome,
                    cor: item.cor === "vermelho" ? "vermelho" : "verde",
                    vezesVermelho: Number.isInteger(item.vezesVermelho) && item.vezesVermelho >= 0
                        ? item.vezesVermelho
                        : 0,
                };
            }

            return null;
        })
        .filter(Boolean);
}

let vendedores = normalizarVendedores(
    JSON.parse(localStorage.getItem("vendedores") || "[]")
);

// ========================================
// FUNÇÕES DE RELATÓRIO
// ========================================

function obterMesAtual() {
    const agora = new Date();
    return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
}

function obterNomeArquivoRelatorioAtual(agora = new Date()) {
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");

    return `relatorio-vendedores-${ano}-${mes}.txt`;
}

function obterNomeDoMes(anoMes) {
    const [ano, mes] = anoMes.split("-").map(Number);
    const nomeDoMes = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(
        new Date(ano, mes - 1, 1)
    );
    return nomeDoMes.charAt(0).toUpperCase() + nomeDoMes.slice(1);
}

let pastaRelatorios = null;

function abrirBancoDeRelatorios() {
    return new Promise((resolve, reject) => {
        const requisicao = indexedDB.open("ordemVendedorRelatorios", 1);

        requisicao.onupgradeneeded = () => {
            requisicao.result.createObjectStore("configuracao");
        };
        requisicao.onsuccess = () => resolve(requisicao.result);
        requisicao.onerror = () => reject(requisicao.error);
    });
}

async function salvarPastaRelatorios() {
    if (!pastaRelatorios || !window.indexedDB) {
        return;
    }

    const banco = await abrirBancoDeRelatorios();
    const transacao = banco.transaction("configuracao", "readwrite");

    transacao.objectStore("configuracao").put(pastaRelatorios, "pasta");
    await new Promise((resolve, reject) => {
        transacao.oncomplete = resolve;
        transacao.onerror = () => reject(transacao.error);
    });
    banco.close();
}

async function carregarPastaRelatorios() {
    if (!window.indexedDB) {
        return;
    }

    const banco = await abrirBancoDeRelatorios();
    const transacao = banco.transaction("configuracao", "readonly");
    const leitura = transacao.objectStore("configuracao").get("pasta");

    pastaRelatorios = await new Promise((resolve, reject) => {
        leitura.onsuccess = () => resolve(leitura.result || null);
        leitura.onerror = () => reject(leitura.error);
    });
    banco.close();
}

async function selecionarPastaRelatorios() {
    if (!window.showDirectoryPicker) {
        alert("Este navegador nao permite selecionar uma pasta. O relatorio sera baixado pelo navegador.");
        return;
    }

    try {
        pastaRelatorios = await window.showDirectoryPicker({ mode: "readwrite" });
        await salvarPastaRelatorios();
        alert("Pasta dos relatorios salva.");
    } catch (erro) {
        if (erro.name !== "AbortError") {
            console.error("Nao foi possivel salvar a pasta dos relatorios.", erro);
            alert("Nao foi possivel salvar a pasta escolhida.");
        }
    }
}

function gerarRelatorioDoMes(mesPrevio, dados) {
    const nomeDoMes = obterNomeDoMes(mesPrevio);
    const linhas = dados
        .map((vendedor) => `${vendedor.nome} ${nomeDoMes}: ${vendedor.vezesVermelho}`)
        .join("\n");
    
    return linhas + "\n";
}

async function baixarArquivoTxt(nomeArquivo, conteudo) {
    console.log("Nome recebido por baixarArquivoTxt:", nomeArquivo);

    if (pastaRelatorios) {
        try {
            const permissao = await pastaRelatorios.queryPermission({ mode: "readwrite" });
            const permissaoAtualizada = permissao === "granted"
                ? permissao
                : await pastaRelatorios.requestPermission({ mode: "readwrite" });

            if (permissaoAtualizada === "granted") {
                console.log("Nome usado no getFileHandle:", nomeArquivo);
                const arquivo = await pastaRelatorios.getFileHandle(nomeArquivo, {
                    create: true,
                });
                const escritor = await arquivo.createWritable();

                await escritor.write(conteudo);
                await escritor.close();
                alert(`Relatorio salvo em ${nomeArquivo}.`);
                return;
            }
        } catch (erro) {
            console.error("Nao foi possivel gravar na pasta selecionada.", erro);
        }
    }

    const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.href = url;
    link.download = nomeArquivo;
    console.log("Nome usado no link.download:", nomeArquivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

// ========================================
// ELEMENTOS DO HTML
// ========================================

const input = document.getElementById("nome_vendedor");
const lista = document.getElementById("lista_vendedores");
const botaoAdicionar = document.getElementById("adicionar_vendedor");
const adicionar = document.querySelector(".adicionar");
const editar = document.getElementById("editar");
const overlay = document.getElementById("overlay");
const senha = document.getElementById("senha");
const formSenha = overlay.querySelector("form");
const botaoGerarRelatorio = document.getElementById("gerar_relatorio_manual");
const botaoSelecionarPasta = document.getElementById("selecionar_pasta_relatorios");
const chaveRelatorioPendente = "relatorioPendente";

let relatorioPendente = null;

function criarRelatorioPendente(mes) {
    const dados = vendedores.map((vendedor) => ({ ...vendedor }));

    return {
        mes,
        conteudo: gerarRelatorioDoMes(mes, dados),
    };
}

try {
    relatorioPendente = JSON.parse(
        localStorage.getItem(chaveRelatorioPendente) || "null"
    );

    if (relatorioPendente && !relatorioPendente.conteudo) {
        if (relatorioPendente.mes && Array.isArray(relatorioPendente.dados)) {
            relatorioPendente = {
                mes: relatorioPendente.mes,
                conteudo: gerarRelatorioDoMes(
                    relatorioPendente.mes,
                    relatorioPendente.dados
                ),
            };
            localStorage.setItem(
                chaveRelatorioPendente,
                JSON.stringify(relatorioPendente)
            );
        } else {
            relatorioPendente = null;
            localStorage.removeItem(chaveRelatorioPendente);
        }
    }
} catch (erro) {
    relatorioPendente = null;
    localStorage.removeItem(chaveRelatorioPendente);
}

const carregamentoDaPasta = carregarPastaRelatorios().catch((erro) => {
    console.error("Nao foi possivel carregar a pasta dos relatorios.", erro);
});

botaoSelecionarPasta.addEventListener("click", selecionarPastaRelatorios);

if (relatorioPendente) {
    botaoGerarRelatorio.textContent = "Baixar relatório";
}

// Botão manual para gerar relatório
botaoGerarRelatorio.addEventListener("click", async () => {
    if (!relatorioPendente) {
        const mesDoRelatorio = obterMesAtual();
        relatorioPendente = criarRelatorioPendente(mesDoRelatorio);
        localStorage.setItem(
            chaveRelatorioPendente,
            JSON.stringify(relatorioPendente)
        );

        alert(
            "O relatorio foi preparado. Clique em OK para atualizar a pagina. Depois da atualizacao, clique novamente para baixar."
        );
        window.location.reload();
        return;
    }

    await carregamentoDaPasta;

    const relatorioParaBaixar = { ...relatorioPendente };
    relatorioPendente = null;
    localStorage.removeItem(chaveRelatorioPendente);

    const dataAtual = new Date();
    const nomeArquivo = obterNomeArquivoRelatorioAtual(dataAtual);

    console.log("Data atual do download:", dataAtual);
    console.log("Ano atual do download:", dataAtual.getFullYear());
    console.log("Mes atual do download:", dataAtual.getMonth() + 1);
    console.log("Nome calculado:", nomeArquivo);
    console.log("Relatorio pendente:", relatorioParaBaixar);

    await baixarArquivoTxt(
        nomeArquivo,
        relatorioParaBaixar.conteudo
    );

    botaoGerarRelatorio.textContent = "Gerar Relatório";
});


// ========================================
// FUNÇÕES AUXILIARES
// ========================================

function salvarVendedores() {
    localStorage.setItem("vendedores", JSON.stringify(vendedores));
}

function atualizarTextoVendedor(li, vendedor) {
    if (!li) {
        return;
    }

    const p = li.querySelector(".p_cor");

    if (p) {
        p.textContent = `${vendedor.nome}: ${vendedor.vezesVermelho}`;
    }
}

function aplicarCorVisual(li, cor) {
    const p = li.querySelector(".p_cor");
    const botaoCor = li.querySelector(".mudar");

    if (!p || !botaoCor) {
        return;
    }

    if (cor === "vermelho") {
        p.style.color = "red";
        botaoCor.classList.remove("botao_cor_vermelho");
        botaoCor.classList.add("botao_cor_verde");
    } else {
        p.style.color = "green";
        botaoCor.classList.remove("botao_cor_verde");
        botaoCor.classList.add("botao_cor_vermelho");
    }

    li.dataset.cor = cor;
}

function criarElementoVendedor(vendedor) {
    const li = document.createElement("li");

    const p = document.createElement("p");
    p.classList.add("p_cor");

    const botaoCor = document.createElement("button");
    botaoCor.classList.add("mudar");
    botaoCor.textContent = "Mudar";

    const botaoRemover = document.createElement("button");
    botaoRemover.classList.add("remover");
    botaoRemover.textContent = "Remover";

    const botaoCima = document.createElement("button");
    botaoCima.classList.add("botao_cima");
    botaoCima.textContent = "⬆️";

    const botaoBaixo = document.createElement("button");
    botaoBaixo.classList.add("botao_baixo");
    botaoBaixo.textContent = "⬇️";

    if (hidden) {
        botaoRemover.classList.add("hidden");
        botaoCor.classList.add("hidden");
        botaoCima.classList.add("hidden");
        botaoBaixo.classList.add("hidden");
    }

    li.appendChild(p);
    li.appendChild(botaoCor);
    li.appendChild(botaoRemover);
    li.appendChild(botaoCima);
    li.appendChild(botaoBaixo);

    atualizarTextoVendedor(li, vendedor);
    aplicarCorVisual(li, vendedor.cor);

    return li;
}

function atualizarEstadoDoItem(index, novaCor) {
    if (index < 0 || index >= vendedores.length) {
        return;
    }

    vendedores[index].cor = novaCor;
    salvarVendedores();
}

// ========================================
// MOSTRA OS VENDEDORES
// ========================================

lista.innerHTML = "";

let hidden = true;

function alternarModoEdicao() {
    const botoesRemover = document.querySelectorAll(".remover");
    const botoesMudar = document.querySelectorAll(".mudar");
    const botoesCima = document.querySelectorAll(".botao_cima");
    const botoesBaixo = document.querySelectorAll(".botao_baixo");

    botoesRemover.forEach((botao) => botao.classList.toggle("hidden"));
    botoesMudar.forEach((botao) => botao.classList.toggle("hidden"));
    botoesCima.forEach((botao) => botao.classList.toggle("hidden"));
    botoesBaixo.forEach((botao) => botao.classList.toggle("hidden"));

    adicionar.classList.toggle("hidden");
    hidden = !hidden;
}

editar.addEventListener("click", () => {
    if (hidden) {
        overlay.classList.remove("hidden");
        senha.value = "";
        senha.focus();
        return;
    }

    alternarModoEdicao();
});

vendedores.forEach((vendedor) => {
    lista.appendChild(criarElementoVendedor(vendedor));
});

// ========================================
// ADICIONAR VENDEDOR
// ========================================

botaoAdicionar.addEventListener("click", () => {
    const nome = input.value.trim();

    if (nome === "") {
        return;
    }

    const novoVendedor = {
        nome,
        cor: "verde",
        vezesVermelho: 0,
    };

    vendedores.unshift(novoVendedor);
    salvarVendedores();

    const li = criarElementoVendedor(novoVendedor);
    lista.prepend(li);

    input.value = "";
    input.focus();
});

input.addEventListener("keydown", (event) => {
    if (!hidden && event.key === "Enter") {
        botaoAdicionar.click();
    }
});

lista.addEventListener("click", (event) => {
    if (event.target.classList.contains("remover")) {
        const li = event.target.closest("li");
        const index = [...lista.children].indexOf(li);

        if (index === -1) {
            return;
        }

        vendedores.splice(index, 1);
        salvarVendedores();
        li.remove();
        return;
    }

    if (event.target.tagName === "P") {
        const p = event.target;
        const li = p.closest("li");
        const index = [...lista.children].indexOf(li);

        if (index === -1) {
            return;
        }

        const vendedor = vendedores[index];
        const novaCor = vendedor.cor === "verde" ? "vermelho" : "verde";

        if (vendedor.cor === "vermelho") {
            vendedores.splice(index, 1);

            const vendedorAtualizado = {
                ...vendedor,
                cor: novaCor,
            };

            const ultimoVerde = vendedores.reduce(
                (ultimoIndex, item, itemIndex) =>
                    item.cor === "verde" ? itemIndex : ultimoIndex,
                -1
            );
            const novaPosicao = ultimoVerde + 1;

            vendedores.splice(novaPosicao, 0, vendedorAtualizado);
            atualizarTextoVendedor(li, vendedorAtualizado);
            aplicarCorVisual(li, novaCor);

            const referencia = lista.children[novaPosicao];
            if (referencia) {
                lista.insertBefore(li, referencia);
            } else {
                lista.appendChild(li);
            }

            salvarVendedores();
            return;
        }

        vendedores.splice(index, 1);

        if (novaCor === "vermelho") {
            const vendedorAtualizado = {
                ...vendedor,
                cor: novaCor,
                vezesVermelho: vendedor.vezesVermelho + 1,
            };

            vendedores.push(vendedorAtualizado);
            atualizarTextoVendedor(li, vendedorAtualizado);
            aplicarCorVisual(li, novaCor);
            lista.appendChild(li);
        } else {
            const vendedorAtualizado = {
                ...vendedor,
                cor: novaCor,
            };

            vendedores.unshift(vendedorAtualizado);
            atualizarTextoVendedor(li, vendedorAtualizado);
            aplicarCorVisual(li, novaCor);
            lista.prepend(li);
        }

        salvarVendedores();
        return;
    }

    if (event.target.classList.contains("mudar")) {
        const li = event.target.closest("li");
        const index = [...lista.children].indexOf(li);

        if (index === -1) {
            return;
        }

        const vendedor = vendedores[index];
        const novaCor = vendedor.cor === "verde" ? "vermelho" : "verde";

        vendedores[index] = {
            ...vendedor,
            cor: novaCor,
        };

        aplicarCorVisual(li, novaCor);
        salvarVendedores();
        return;
    }

    if (event.target.classList.contains("botao_baixo")) {
        const li = event.target.closest("li");
        const index = [...lista.children].indexOf(li);

        if (index === -1 || index >= vendedores.length - 1) {
            return;
        }

        [vendedores[index], vendedores[index + 1]] = [
            vendedores[index + 1],
            vendedores[index],
        ];

        const proximo = li.nextElementSibling;
        lista.insertBefore(proximo, li);

        salvarVendedores();
        return;
    }

    if (event.target.classList.contains("botao_cima")) {
        const li = event.target.closest("li");
        const index = [...lista.children].indexOf(li);

        if (index <= 0) {
            return;
        }

        [vendedores[index - 1], vendedores[index]] = [
            vendedores[index],
            vendedores[index - 1],
        ];

        lista.insertBefore(li, lista.children[index - 1]);

        salvarVendedores();
    }
});

const password = "admin";

formSenha.addEventListener("submit", (event) => {
    event.preventDefault();

    if (senha.value === password) {
        overlay.classList.add("hidden");
        senha.value = "";
        alternarModoEdicao();
        return;
    }

    senha.value = "";
    senha.focus();
});