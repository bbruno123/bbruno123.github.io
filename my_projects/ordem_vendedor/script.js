// ========================================
// CARREGA OS VENDEDORES SALVOS
// ========================================

let vendedores = JSON.parse(localStorage.getItem("vendedores") || "[]");

// ========================================
// ELEMENTOS DO HTML
// ========================================

const input = document.getElementById("nome_vendedor");
const lista = document.getElementById("lista_vendedores");
const botaoAdicionar = document.getElementById("adicionar_vendedor");

// ========================================
// FUNÇÃO PARA SALVAR
// ========================================

function salvarVendedores() {
    localStorage.setItem(
        "vendedores",
        JSON.stringify(vendedores)
    );
}

// ========================================
// MOSTRA OS VENDEDORES
// ========================================

lista.innerHTML = "";

let hidden = true;

const editar = document.getElementById("editar");
const adicionar_vendedor = document.getElementById("adicionar_vendedor");

editar.addEventListener("click", (event) => {
    const botoes_remover = document.querySelectorAll(".remover");
    const botoes_mudar = document.querySelectorAll(".mudar");
    const botoes_cima = document.querySelectorAll(".botao_cima");
    const botoes_baixo = document.querySelectorAll(".botao_baixo");

    botoes_remover.forEach(botao => {
        botao.classList.toggle("hidden");
    });

    botoes_mudar.forEach(botao => {
        botao.classList.toggle("hidden");
    });

    botoes_cima.forEach(botao => {
        botao.classList.toggle("hidden");
    });

    botoes_baixo.forEach(botao => {
        botao.classList.toggle("hidden");
    });
    
    adicionar_vendedor.classList.toggle("hidden");
    hidden = !hidden;
});


vendedores.forEach((vendedor) => {

    const li = document.createElement("li");

    const p = document.createElement("p");
    p.textContent = vendedor;
    p.classList.add("p_cor");

    const botaoRemover = document.createElement("button");

    botaoRemover.classList.add("remover");

    if (hidden) {
        botaoRemover.classList.add("hidden");
    }

    botaoRemover.textContent = "Remover";

    botaoRemover.addEventListener("click", () => {

        // Pega a posição REAL do LI
        const index = [...lista.children].indexOf(li);

        if (index !== -1) {
            vendedores.splice(index, 1);
        }

        salvarVendedores();

        li.remove();
    });


    const botaoCor = document.createElement("button");

    botaoCor.classList.add(
        "botao_cor_vermelho",
        "mudar"
    );

    if (hidden) {
        botaoCor.classList.add("hidden");
    }

    botaoCor.textContent = "Mudar";


    const botao_cima = document.createElement("button");

    botao_cima.classList.add("botao_cima");
    botao_cima.textContent = "⬆️";

    if (hidden) {
        botao_cima.classList.add("hidden");
    }


    const botao_baixo = document.createElement("button");

    botao_baixo.classList.add("botao_baixo");
    botao_baixo.textContent = "⬇️";

    if (hidden) {
        botao_baixo.classList.add("hidden");
    }


    li.appendChild(p);
    li.appendChild(botaoCor);
    li.appendChild(botaoRemover);
    li.appendChild(botao_cima);
    li.appendChild(botao_baixo);

    // Mantém a mesma ordem do array
    lista.appendChild(li);
});

// ========================================
// ADICIONAR VENDEDOR
// ========================================

botaoAdicionar.addEventListener("click", () => {

    const nome = input.value.trim();

    if (nome === "") {
        return;
    }

    // Coloca no começo do array
    vendedores.unshift(nome);

    salvarVendedores();

    const li = document.createElement("li");

    const p = document.createElement("p");

    p.textContent = nome;
    p.classList.add("p_cor");

    const botaoRemover = document.createElement("button");

    botaoRemover.textContent = "Remover";
    botaoRemover.classList.add("remover");

    if (hidden) {
        botaoRemover.classList.add("hidden");
    }


    botaoRemover.addEventListener("click", () => {

        // Pega o índice REAL desse LI na lista
        const index = [...lista.children].indexOf(li);

        if (index !== -1) {

            vendedores.splice(index, 1);

            salvarVendedores();

            li.remove();
        }
    });

    const botaoCor = document.createElement("button");

    botaoCor.classList.add(
        "botao_cor_vermelho",
        "mudar"
    );

    if (hidden) {
        botaoCor.classList.add("hidden");
    }

    botaoCor.textContent = "Mudar";


    const botao_cima = document.createElement("button");

    botao_cima.classList.add("botao_cima");
    botao_cima.textContent = "⬆️";

    if (hidden) {
        botao_cima.classList.add("hidden");
    }


    const botao_baixo = document.createElement("button");

    botao_baixo.classList.add("botao_baixo");
    botao_baixo.textContent = "⬇️";

    if (hidden) {
        botao_baixo.classList.add("hidden");
    }

    li.appendChild(p);
    li.appendChild(botaoCor);
    li.appendChild(botaoRemover);
    li.appendChild(botao_cima);
    li.appendChild(botao_baixo);

    lista.prepend(li);

    input.value = "";

    input.focus();
});


input.addEventListener("keydown", (event) => {

    if (!hidden){
        if (event.key === "Enter") {
            botaoAdicionar.click();
        }
    }
});

let nome;

lista.addEventListener("click", (event) => {

    if (event.target.tagName === "P") {

        const p = event.target;
        const li = p.closest("li")
        // Pega a posição REAL desse vendedor na lista
        const index = [...lista.children].indexOf(li);

        if (index === -1) {
            return;
        }

        const botaoCor = li.querySelector(".mudar");

        if (getComputedStyle(p).color === "rgb(0, 128, 0)") {

            p.style.color = "red";
            botaoCor.classList.remove("botao_cor_vermelho");
            botaoCor.classList.add("botao_cor_verde");

            // Remove EXATAMENTE o elemento
            // naquela posição

            const elemento = vendedores.splice(index, 1)[0];

            // Coloca no final

            vendedores.push(elemento);

            lista.appendChild(li);

        }else {

            p.style.color = "green";

            botaoCor.classList.remove("botao_cor_verde");

            botaoCor.classList.add("botao_cor_vermelho");

            // Remove EXATAMENTE o elemento
            // naquela posição

            const elemento = vendedores.splice(index, 1)[0];

            // Coloca no começo

            vendedores.unshift(elemento);

            lista.prepend(li);
        }

        salvarVendedores();
    }


    if (event.target.classList.contains("mudar")){
        let p_cor = event.target.parentElement.querySelector(".p_cor");

        if (getComputedStyle(event.target).backgroundColor === "rgb(0, 128, 0)"){
            p_cor.style.color = "green";
            event.target.classList.add("botao_cor_vermelho");
            event.target.classList.remove("botao_cor_verde");
        }else{
            p_cor.style.color = "red";
            event.target.classList.remove("botao_cor_vermelho");
            event.target.classList.add("botao_cor_verde");
        }
    }

    if (event.target.classList.contains("botao_baixo")) {

        const botao = event.target;

        const li = botao.closest("li");

        // Posição atual

        const index = [...lista.children].indexOf(li);


        // Já está no último?
        // Então não faz nada.

        if (index === -1 || index >= vendedores.length - 1) {
            return;
        }

        [vendedores[index],vendedores[index + 1]] = [vendedores[index + 1],vendedores[index]];

        const proximo = li.nextElementSibling;

        lista.insertBefore(proximo, li);

        salvarVendedores();
        return;
    }

    if (event.target.classList.contains("botao_cima")) {

        const botao = event.target;

        const li = botao.closest("li");

        // IMPORTANTE:
        // pega a posição do LI na tela
        // e não pelo nome do vendedor

        const index = [...lista.children].indexOf(li);


        // Já está no primeiro?
        // Então não faz nada.

        if (index <= 0) {
            return;
        }

        [vendedores[index - 1],vendedores[index]] = [vendedores[index],vendedores[index - 1]];
        lista.insertBefore(
            li,
            lista.children[index - 1]
        );

        salvarVendedores();
        return;
    }
});

