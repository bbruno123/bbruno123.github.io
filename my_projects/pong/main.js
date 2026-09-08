// ===== Seleção de Elementos do DOM =====
const bot = document.getElementById("bot");
const player = document.getElementById("player");

const ball = document.getElementById("ball");

const scorePlayer = document.getElementById("scorePlayer");
const scoreBot = document.getElementById("scoreBot");

const gameOverUI = document.getElementById("gameOverUI");
const youWinUI = document.getElementById("youWinUI");
const restart = document.querySelectorAll(".restart");

const hidden = document.getElementsByClassName("hidden");
const body = document.querySelector("body");

// ===== Dimensões da Tela =====
const maxHeight = window.innerHeight;
const maxWidth = window.innerWidth;

// ===== Controle de Tempo (Delta Time) =====
let lastTimestamp = 0;
let deltaTimeMs = 0;
let deltaTimeSec = 0;

// ===== Loop Principal do Jogo =====
function update(timestamp) {
    requestAnimationFrame(update);
    
    // Pula primeiro frame
    if (lastTimestamp === 0) {
        lastTimestamp = timestamp;
        return;
    }
    
    // Calcula o tempo decorrido desde o último frame
    deltaTimeMs = timestamp - lastTimestamp;
    deltaTimeSec = deltaTimeMs / 1000;
    lastTimestamp = timestamp;
    
    // Limita o delta time para evitar saltos grandes (abas inativas)
    if (deltaTimeSec > 0.1) deltaTimeSec = 0.1;

    // Reinicia o jogo quando o botão é pressionado
    if (restartBool === true){
        // Repositiona os paddles e a bola
        bot.style.top = "50%";
        bot.style.left = "auto";
        bot.style.right = "10px";

        player.style.top = "50%";
        player.style.left = "10px";
        player.style.right = "auto";

        ball.style.top = "50%"
        ball.style.left = "50%";

        // Reseta estados de colisão
        ballTopCollision = false;
        ballRightCollision = false;
        ballHitRightWall = false;
        ballHitLeftWall = false;
        ballHitBot = true;

        // Reseta placar
        scorePlayer_ = 0;
        scorePlayer.innerText = "0";
        scoreBot_ = 0;
        scoreBot.innerText = "0";

        // Reseta controles
        playerScores = false;
        botScores = false;
        up = false;
        down = false;
        pause = false;
        gameOverUI.classList.add("hidden");
        youWinUI.classList.add("hidden");
        restartBool = false;

        return;
    }

    // Atualiza física do jogo quando não está pausado
    if (pause === false && finalScreen === false){
        BallCollision();
        BallMovement(deltaTimeSec);
        PlayerMovement(deltaTimeSec);
        BotMovement(deltaTimeSec);
        Score();
    }

    // Verifica condições de fim de jogo
    GameOver();
    YouWin();
}

// ===== Estados de Colisão e Controle =====
let ballTopCollision = false;
let ballRightCollision = false;
let ballHitRightWall = false;
let ballHitLeftWall = false;
let ballHitBot = true;
let pause = false;

// ===== Detecção de Colisões =====
function BallCollision(){
    
    // Colisão com paredes laterais
    if (ball.getBoundingClientRect().left >= maxWidth){
        ballHitRightWall = true;
        ballHitLeftWall = false;
        ball.style.top = "50%"
        ball.style.left = "50%";
    }
    if (ball.getBoundingClientRect().left <= 0){
        ballHitLeftWall = true;
        ballHitRightWall = false;
        ball.style.top = "50%"
        ball.style.left = "50%";
    }
    
    // Colisão com o paddle do bot
    if ((parseFloat(getComputedStyle(ball).top) <= parseFloat(getComputedStyle(bot).top) + parseFloat(getComputedStyle(bot).height)) &&
    (parseFloat(getComputedStyle(ball).top) + parseFloat(getComputedStyle(ball).height) >= parseFloat(getComputedStyle(bot).top)) &&
    (ball.getBoundingClientRect().right >= bot.getBoundingClientRect().left) &&
    (ball.getBoundingClientRect().left <= bot.getBoundingClientRect().right))
    {
        ballHitBot = true;
    }
    
    // Colisão com o paddle do jogador
    if ((parseFloat(getComputedStyle(ball).top) <= parseFloat(getComputedStyle(player).top) + parseFloat(getComputedStyle(player).height)) &&
    (parseFloat(getComputedStyle(ball).top) + parseFloat(getComputedStyle(ball).height) >= parseFloat(getComputedStyle(player).top)) &&
    (ball.getBoundingClientRect().left <= player.getBoundingClientRect().right) &&
    (ball.getBoundingClientRect().right >= player.getBoundingClientRect().left))
    {
        ballHitBot = false;
    }
}

// ===== Movimento da Bola =====
let speedBall = 155;

function BallMovement(deltaTime){

    // Detecção de colisão com teto e chão
    if (ball.getBoundingClientRect().top <= 0){
        ballTopCollision = true;
    }
    if (ball.getBoundingClientRect().top >= maxHeight - 20){
        ballTopCollision = false;
    }

    // Movimento da bola em direção ao jogador
    if (ballHitBot === false) {
        if (ballTopCollision === false) {
            ball.style.top = ((parseFloat(getComputedStyle(ball).top) || 0) +deltaTime * -speedBall) + "px";
            ball.style.left = ((parseFloat(getComputedStyle(ball).left) || 0) + deltaTime * speedBall * 1.5) + "px";
        }else {
            ball.style.top = ((parseFloat(getComputedStyle(ball).top) || 0) +deltaTime * speedBall) + "px";
            ball.style.left = ((parseFloat(getComputedStyle(ball).left) || 0) + deltaTime * speedBall * 1.5) + "px";
        }
    }else {
        // Movimento da bola em direção ao bot
        if (ballTopCollision === false) {
            ball.style.top = ((parseFloat(getComputedStyle(ball).top) || 0) +deltaTime * -speedBall) + "px";
            ball.style.left = ((parseFloat(getComputedStyle(ball).left) || 0) + deltaTime * -speedBall * 1.5) + "px";
        }else {
            ball.style.top = ((parseFloat(getComputedStyle(ball).top) || 0) +deltaTime * speedBall) + "px";
            ball.style.left = ((parseFloat(getComputedStyle(ball).left) || 0) + deltaTime * -speedBall * 1.5) + "px";
        }
    }
}

// ===== Movimento dos Paddles =====
let speedBar = 135;

// Movimento automático do bot (IA)
function BotMovement(deltaTime){
    // Calcula a posição central dos paddles para comparação
    const halfBotPosY = bot.getBoundingClientRect().top + bot.getBoundingClientRect().height / 2;
    const halfBallPosY = ball.getBoundingClientRect().top + ball.getBoundingClientRect().height / 2;

    // Segue a bola verticalmente
    if (halfBotPosY < halfBallPosY){
        bot.style.top = ((parseFloat(getComputedStyle(bot).top) || 0) +deltaTime * speedBar) + "px";
    }else{
        bot.style.top = ((parseFloat(getComputedStyle(bot).top) || 0) +deltaTime * -speedBar) + "px";
    }

    // Limita movimento dentro da tela
    if (bot.getBoundingClientRect().top <= 0){
        bot.style.top = ((parseFloat(getComputedStyle(bot).top) || 0) +deltaTime * speedBar) + "px";
    }
    if (bot.getBoundingClientRect().bottom >= maxHeight){
        bot.style.top = ((parseFloat(getComputedStyle(bot).top) || 0) +deltaTime * -speedBar) + "px";
    }
}


let speedPlayer = 135;

// Movimento do jogador controlado por teclado
function PlayerMovement(deltaTime){
    // Controle do movimento para cima e para baixo
    if (up === true && down === false){
        player.style.top = ((parseFloat(getComputedStyle(player).top) || 0) - deltaTime * speedPlayer) + "px";
    }else if (down === true && up === false){
        player.style.top = ((parseFloat(getComputedStyle(player).top) || 0) + deltaTime * speedPlayer) + "px";
    }

    if (player.getBoundingClientRect().top <= 0){
        player.style.top = ((parseFloat(getComputedStyle(player).top) || 0) +deltaTime * speedBar) + "px";
    }
    if (player.getBoundingClientRect().bottom >= maxHeight){
        player.style.top = ((parseFloat(getComputedStyle(player).top) || 0) +deltaTime * -speedBar) + "px";
    }
}

// ===== Sistema de Pontuação =====
let scorePlayer_ = 0;
scorePlayer.innerText = "0";
let scoreBot_ = 0;
scoreBot.innerText = "0";
let playerScores = false;
let botScores = false;

function Score(){
    // Verifica se o jogador marcou ponto
    if (ballHitRightWall === true) {
        scorePlayer.innerText = `${++scorePlayer_}`;
        ballHitRightWall = false;
        playerScores = true;
        botScores = false;
    }
    // Verifica se o bot marcou ponto
    if (ballHitLeftWall === true){
        scoreBot.innerText = `${++scoreBot_}`;
        ballHitLeftWall = false;
        botScores = true;
        playerScores = false;
    }

    // Reinicia a bola após pontuação
    if (playerScores === true){
        ballHitBot = false;
        ballTopCollision = false;
        playerScores = false;
    }
    if (botScores === true){
        ballHitBot = true;
        ballTopCollision = false;
        botScores = false;
    }
}

// ===== Fim de Jogo =====
let finalScore = 10;
let finalScreen = false;

// Verifica se o jogador venceu
function GameOver(){
    if (scorePlayer_ >= finalScore && finalScreen === false){
        youWinUI.classList.remove("hidden");
        finalScreen = true;
    }
}

// Verifica se o bot venceu
function YouWin(){
    if (scoreBot_ >= finalScore && finalScreen === false){
        gameOverUI.classList.remove("hidden");
        finalScreen = true;
    }
}

// ===== Entrada do Teclado =====
let up = false;
let down = false;

// Controles: W/ArrowUp para cima, S/ArrowDown para baixo, P para pausar
document.addEventListener("keydown", (event) => {
    if (event.key === "w" || event.key === "ArrowUp"){
        up = true;
        down = false;
    }
    if (event.key === "s" || event.key === "ArrowDown"){
        up = false;
        down = true;
    }
    if(event.key === "p" && !event.repeat){
        pause = !pause;
    }
});

document.addEventListener("keyup", (event) => {
    if (event.key === "w"){
        up = false;
    }
    if (event.key === "s"){
        down = false;
    }
});

// ===== Botão de Reinício =====
let restartBool = false;

restart.forEach((event) => {
    event.addEventListener("mousedown", () => {
        restartBool = true;
        finalScreen = false;
    });

    event.addEventListener("mouseup", () => {
        restartBool = false;
    });
});

// Inicia o loop principal do jogo
update();