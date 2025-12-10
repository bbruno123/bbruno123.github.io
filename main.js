const botaoMenu = document.querySelector("#botao_menu");
const menuEsquerdo = document.querySelector("#menu_esquerdo");
const menuEsquerdoBotao = document.querySelector("#menu_esquerdo_botao");
const menuEsquerdoBody = document.querySelector(".menu_esquerdo");
const body = document.querySelector("body");

function ativarMenu() {
    if (!botaoMenu.classList.contains("hidden")) {

        botaoMenu.classList.add("hidden");
        menuEsquerdo.classList.remove("hidden");
        menuEsquerdo.classList.add("show");
        body.classList.add("no_scroll");
        body.classList.add("blurry_background");

    }
}

function fecharMenu() {
    if (!menuEsquerdo.classList.contains("hidden")) {
        
        menuEsquerdo.classList.remove("show");
        menuEsquerdo.classList.add("hidden");
        botaoMenu.classList.remove("hidden");
        body.classList.remove("no_scroll");
        body.classList.remove("blurry_background");

    }
}

menuEsquerdoBody.addEventListener('click', ativarMenu);
menuEsquerdoBotao.addEventListener('click', fecharMenu);
