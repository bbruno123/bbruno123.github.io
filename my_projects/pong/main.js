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

const maxHeight = window.innerHeight;
const maxWidth = window.innerWidth;

console.log(maxHeight, maxWidth);

// Delta Time variables
let lastTimestamp = 0;
let deltaTimeMs = 0;
let deltaTimeSec = 0;

function update(timestamp) {

    // Request the next frame
    requestAnimationFrame(update);
    
    // Skip first frame (lastTimestamp is 0)
    if (lastTimestamp === 0) {
        lastTimestamp = timestamp;
        return;
    }
    
    // Calculate delta time in milliseconds
    deltaTimeMs = timestamp - lastTimestamp;
    
    // Convert to seconds for physics calculations
    deltaTimeSec = deltaTimeMs / 1000;
    
    // Store the current timestamp for the next frame
    lastTimestamp = timestamp;
    
    // Cap deltaTime to prevent huge jumps (e.g., when tab is inactive)
    if (deltaTimeSec > 0.1) deltaTimeSec = 0.1;

    if (restartBool === true){

        bot.style.top = "50%";
        bot.style.left = "auto";
        bot.style.right = "10px";

        player.style.top = "50%";
        player.style.left = "10px";
        player.style.right = "auto";

        ball.style.top = "50%"
        ball.style.left = "50%";

        ballTopCollision = false;
        ballRightCollision = false;

        ballHitRightWall = false;
        ballHitLeftWall = false;

        ballHitBot = true;

        scorePlayer_ = 0;
        scorePlayer.innerText = "0";

        scoreBot_ = 0;
        scoreBot.innerText = "0";

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

    if (pause === false && finalScreen === false){
        BallCollision();
        BallMovement(deltaTimeSec);
        
        PlayerMovement(deltaTimeSec);
        BotMovement(deltaTimeSec);

        Score();
    }

    GameOver();
    YouWin();
}

let ballTopCollision = false;
let ballRightCollision = false;

let ballHitRightWall = false;
let ballHitLeftWall = false;

let ballHitBot = true;

let pause = false;

function BallCollision(){
    
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
    
    if ((parseFloat(getComputedStyle(ball).top) <= parseFloat(getComputedStyle(bot).top) + parseFloat(getComputedStyle(bot).height)) &&
    (parseFloat(getComputedStyle(ball).top) + parseFloat(getComputedStyle(ball).height) >= parseFloat(getComputedStyle(bot).top)) &&
    (ball.getBoundingClientRect().right >= bot.getBoundingClientRect().left) &&
    (ball.getBoundingClientRect().left <= bot.getBoundingClientRect().right))
    {
        ballHitBot = true;
    }
    
    if ((parseFloat(getComputedStyle(ball).top) <= parseFloat(getComputedStyle(player).top) + parseFloat(getComputedStyle(player).height)) &&
    (parseFloat(getComputedStyle(ball).top) + parseFloat(getComputedStyle(ball).height) >= parseFloat(getComputedStyle(player).top)) &&
    (ball.getBoundingClientRect().left <= player.getBoundingClientRect().right) &&
    (ball.getBoundingClientRect().right >= player.getBoundingClientRect().left))
    {
        ballHitBot = false;
    }
}

let speedBall = 155;

function BallMovement(deltaTime){

    if (ball.getBoundingClientRect().top <= 0){
        ballTopCollision = true;
    }
    if (ball.getBoundingClientRect().top >= maxHeight - 20){
        ballTopCollision = false;
    }

    if (ballHitBot === false) {
        if (ballTopCollision === false) {
            ball.style.top = ((parseFloat(getComputedStyle(ball).top) || 0) +deltaTime * -speedBall) + "px";
            ball.style.left = ((parseFloat(getComputedStyle(ball).left) || 0) + deltaTime * speedBall * 1.5) + "px";
        }else {
            ball.style.top = ((parseFloat(getComputedStyle(ball).top) || 0) +deltaTime * speedBall) + "px";
            ball.style.left = ((parseFloat(getComputedStyle(ball).left) || 0) + deltaTime * speedBall * 1.5) + "px";
        }
    }else {
        if (ballTopCollision === false) {
            ball.style.top = ((parseFloat(getComputedStyle(ball).top) || 0) +deltaTime * -speedBall) + "px";
            ball.style.left = ((parseFloat(getComputedStyle(ball).left) || 0) + deltaTime * -speedBall * 1.5) + "px";
        }else {
            ball.style.top = ((parseFloat(getComputedStyle(ball).top) || 0) +deltaTime * speedBall) + "px";
            ball.style.left = ((parseFloat(getComputedStyle(ball).left) || 0) + deltaTime * -speedBall * 1.5) + "px";
        }
    }
}

let speedBar = 135;

function BotMovement(deltaTime){

    //Pega a posição Y do meio do bot
    const halfBotPosY = bot.getBoundingClientRect().top + bot.getBoundingClientRect().height / 2;

    const halfBallPosY = ball.getBoundingClientRect().top + ball.getBoundingClientRect().height / 2;

    if (halfBotPosY < halfBallPosY){
        bot.style.top = ((parseFloat(getComputedStyle(bot).top) || 0) +deltaTime * speedBar) + "px";
    }else{
        bot.style.top = ((parseFloat(getComputedStyle(bot).top) || 0) +deltaTime * -speedBar) + "px";
    }

    if (bot.getBoundingClientRect().top <= 0){
        bot.style.top = ((parseFloat(getComputedStyle(bot).top) || 0) +deltaTime * speedBar) + "px";
    }
    if (bot.getBoundingClientRect().bottom >= maxHeight){
        bot.style.top = ((parseFloat(getComputedStyle(bot).top) || 0) +deltaTime * -speedBar) + "px";
    }
}


let speedPlayer = 135;

function PlayerMovement(deltaTime){
    
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

let scorePlayer_ = 0;
scorePlayer.innerText = "0";

let scoreBot_ = 0;
scoreBot.innerText = "0";

let playerScores = false;
let botScores = false;

function Score(){
    if (ballHitRightWall === true) {
        scorePlayer.innerText = `${++scorePlayer_}`;
        ballHitRightWall = false;

        playerScores = true;
        botScores = false;
    }
    if (ballHitLeftWall === true){
        scoreBot.innerText = `${++scoreBot_}`;
        ballHitLeftWall = false;

        botScores = true;
        playerScores = false;
    }

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

let finalScore = 10;
let finalScreen = false;

function GameOver(){
    if (scorePlayer_ >= finalScore && finalScreen === false){
        youWinUI.classList.remove("hidden");
        finalScreen = true;
    }
}

function YouWin(){
    if (scoreBot_ >= finalScore && finalScreen === false){
        gameOverUI.classList.remove("hidden");
        finalScreen = true;
    }
}

let up = false;
let down = false;

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

update();