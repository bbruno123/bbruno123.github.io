let num1 = "";
let num2 = "";

let turn1 = true;

let operation = false;

let canType = true;

const display = document.getElementById("display");

window.addEventListener("keydown", (event) => {

    if (!isNaN(Number(event.key)) && !event.repeat && !operation && turn1){

        if (canType){
            
            if(turn1){
                num1 = event.key;
                display.value += num1;
            
            }else {
                num2 = event.key;
                display.value += num2;
            }
        }
    }

    if (event.key === "+" || event.key === "-" || event.key === "*" || event.key === "/" && !event.repeat){
        turn1 = !turn1;
        
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

    // if (event.key === "Backspace" && !event.repeat){
    //     display.value = "";
    //     num1 = "";
    //     num2 = "";
    //     // plus = false;
    // }

});