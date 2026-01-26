const bird = document.getElementById("bird");

let birdSpeed = 2;
let freeMove = false;

let birdBoost = 0;
let canJump = true;

let lastTimestamp = 0;

function update(timestamp) {
    // Request the next frame
    requestAnimationFrame(update);

    // Calculate delta time in milliseconds (timestamp is in ms)
    const deltaTimeMs = timestamp - lastTimestamp;

    // Store the current timestamp for the next frame
    lastTimestamp = timestamp;

    // OPTIONAL: Convert to seconds for easier physics calculations (e.g., speed * delta)
    const deltaTimeSec = deltaTimeMs / 1000;

    //gravity();
}

// Start the loop
requestAnimationFrame(update);

window.addEventListener("keydown", (event) => {

    if(event.key.toLocaleLowerCase() === "b" && event.shiftKey && !event.repeat){
        freeMove = true;
    }

    if(freeMove){

        if(event.key.toLocaleLowerCase() === "w"){
            bird.style.top = ((parseFloat(getComputedStyle(bird).top) || 0) -birdSpeed) + "px"; 
        }
        if(event.key.toLocaleLowerCase() === "s"){
            bird.style.top = ((parseFloat(getComputedStyle(bird).top) || 0) +birdSpeed) + "px";
        }
        if(event.key.toLocaleLowerCase() === "a"){
            bird.style.left = ((parseFloat(getComputedStyle(bird).left) || 0) -birdSpeed) + "px"; 
        }
        if(event.key.toLocaleLowerCase() === "d"){
            bird.style.left = ((parseFloat(getComputedStyle(bird).left) || 0) +birdSpeed) + "px";
        }

    }else{

        if(event.key.toLocaleLowerCase() === "w" && !event.repeat){
            
            if(canJump){
                timer();
            }
        }
    }
    
});

function timer(){

    let timerBoost = 20;
    canJump = false;

    for (let i = 0; i < timerBoost; i++) {
        
        setTimeout(function() {
            const currentTop = parseFloat(getComputedStyle(bird).top) || 0;
            bird.style.top = (currentTop - (i + 1)) + "px";
            if (i === timerBoost - 1) {
                canJump = true;
            }
        }, 15 * i);
    }
}

let gravityForce = 0;

function gravity(){

    let timerBoost = 150;
    canJump = false;

    for (let i = 0; i < timerBoost; i++) {
        
        setTimeout(function() {
            const currentTop = parseFloat(getComputedStyle(bird).top) || 0;
            bird.style.top = (currentTop + (i + 1)) + "px";
            if (i === timerBoost - 1) {
                canJump = true;
            }
        }, 15 * i);
    }
}

update();
// let frase = "5Eu gosto 1de 4 nadar";
// let string = "";
// let stringNums = "";

// frase = frase.split('');

// for (let i = 0; i < frase.length; i++){

//     if(!isNaN(frase[i])){
//         stringNums += frase[i];

//     }else{
//         string += frase[i];
//     }
// }

// console.log(string);
// console.log(stringNums);]

let string = "5";

console.log(parseFloat(getComputedStyle(bird).top));