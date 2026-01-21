let num1 = "";
let num2 = "";
let result = 0;

let turn1 = true;
let turns = 0;

// let enter = false;

let canType = true;

let operator = "";
let signs = ["+", "-", "*", "/"];

const display = document.getElementById("display");

window.addEventListener("keydown", (event) => {

    if (!isNaN(Number(event.key)) && !event.repeat){

        if (canType){
            
            if(turn1){
                num1 = event.key;
                display.value += num1;
                turns++;

                // if(enter){
                //     display.value = "";
                //     enter = false;
                // }
            
            }else {
                num2 = event.key;
                display.value += num2;
                turns++;
            }
        }
    }

    if (signs.includes(event.key) && !event.repeat){
        turn1 = !turn1;
        display.value = "";

        operator = event.key;
    }

    if (turns > 2){
        if (operator === "+"){
            display.value = Number(num1) + Number(num2);

        }else if (operator === "-"){
            display.value = Number(num1) - Number(num2);

        }else if (operator === "*"){
            display.value = Number(num1) * Number(num2);

        }else if (operator === "/"){
            display.value = Number(num1) / Number(num2);
        }

        turns = 0;
    }

    if (turns === 2){

        if (event.key === "Enter" && !event.repeat){

            if (operator === "+"){
                display.value = Number(num1) + Number(num2);
    
            }else if (operator === "-"){
                display.value = Number(num1) - Number(num2);
    
            }else if (operator === "*"){
                display.value = Number(num1) * Number(num2);
    
            }else if (operator === "/"){
                display.value = Number(num1) / Number(num2);
            }

            turns = 0;
            // enter = true;
        }
        

    }

    if (event.key === "Backspace" || event.key === "Delete" && !event.repeat){
        display.value = "";
        num1 = "";
        num2 = "";
    }

    // if (event.key === "Enter" && !event.repeat){
    //     display.value = Number(num1) + Number(num2);
    //     num1 = "";
    //     num2 = "";
    //     // plus = false;
    // }


});