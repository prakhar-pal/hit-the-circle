function getNextCircle(){
    if(checkGameOver()) return -1;
    while(true){
        const id = Math.round(Math.random()*(gridSize*gridSize-1));
        if(!alreadySelected[id]) return id;
    }
}

function play(){
    nextCircleId = getNextCircle();
    repaint();
}

function stop(){
    const res = prompt(`You scored ${score}, Click OK to stop the game`);
    if(res!==null) reset(-1);
}

const checkGameOver = () => Object.keys(alreadySelected)
        .map(key => alreadySelected[key])
        .every(isSelected => isSelected); 

function onClick(index){
    //don't modify score if game is stopped
    if(checkGameOver() || nextCircleId<0){
        alert("Please press 'Play' to start the game first!")
        return;
    }
    if(index === nextCircleId){
        alreadySelected[index] = true;
        score++;
        nextCircleId = getNextCircle();
    }
    else score--;
    repaint();
}

function Circle(id){
    const appliedClass = "circle" + (alreadySelected[id] ? " circle-clicked" : "") + (nextCircleId === id ? " circle-next" : "");
    return `<div onclick="onClick(${id})" class="m-3 ${appliedClass}"></div>`;
}

function Grid(){
    let grids = '';
    for (let i = 0; i < gridSize; i++) {
        let row = '';
        for (let j = 0; j < gridSize; j++) {
            row += Circle(gridSize * i + j);
        }
        grids += `<div class="row circle-width">${row}</div>`; 
    }
    return `<div class="col circle-width">${grids}</div>`;
}

function reset(value){
        for (let i = 0; i < gridSize * gridSize; i++) alreadySelected[i] = false;
        score = 0;
        nextCircleId = value ? value : getNextCircle();
        repaint();
}


function repaint(){
    gameEl.innerHTML = Grid();
    scoreEl.value =  score;
    console.log("setting score as", score);
    const isGameOver = checkGameOver();
    if (isGameOver) {
        const ans = prompt(`Your score is ${score}. Play Again (y/n)?`);
        if(ans === null) return;
        if(ans.toLowerCase()[0] === 'y'){
            reset();
            repaint();
        }else{
            return;
        }
    }
}

const alreadySelected = {};
let score = 0;
const gridSize = 6;
const gameEl = document.getElementById("game");
const scoreEl = document.getElementById("score");
let nextCircleId = -1;
reset(-1);