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
// ELEMENTOS DO HTML
// ========================================

const input = document.getElementById("nome_vendedor");
const lista = document.getElementById("lista_vendedores");
const botaoAdicionar = document.getElementById("adicionar_vendedor");
const editar = document.getElementById("editar");
const adicionar_vendedor = document.getElementById("adicionar_vendedor");

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

function salvarVendedores() {
    localStorage.setItem("vendedores", JSON.stringify(vendedores));
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
    p.textContent = vendedor.nome;
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

editar.addEventListener("click", () => {
    const botoesRemover = document.querySelectorAll(".remover");
    const botoesMudar = document.querySelectorAll(".mudar");
    const botoesCima = document.querySelectorAll(".botao_cima");
    const botoesBaixo = document.querySelectorAll(".botao_baixo");

    botoesRemover.forEach((botao) => botao.classList.toggle("hidden"));
    botoesMudar.forEach((botao) => botao.classList.toggle("hidden"));
    botoesCima.forEach((botao) => botao.classList.toggle("hidden"));
    botoesBaixo.forEach((botao) => botao.classList.toggle("hidden"));

    adicionar_vendedor.classList.toggle("hidden");
    hidden = !hidden;
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
    if (event.target.tagName === "P") {
        const p = event.target;
        const li = p.closest("li");
        const index = [...lista.children].indexOf(li);

        if (index === -1) {
            return;
        }

        const vendedor = vendedores[index];
        const novaCor = vendedor.cor === "verde" ? "vermelho" : "verde";

        vendedores.splice(index, 1);

        if (novaCor === "vermelho") {
            vendedores.push({
                ...vendedor,
                cor: novaCor,
            });
            aplicarCorVisual(li, novaCor);
            lista.appendChild(li);
        } else {
            vendedores.unshift({
                ...vendedor,
                cor: novaCor,
            });
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