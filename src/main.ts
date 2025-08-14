import { checkGameOver, gameStore } from "./gameStore";
import { showNotification } from "./showNotification";
import type { GameState, GameEvents } from "./types";

const GRID_SIZE = 2;
const gameEl = document.getElementById("game")!;

document.addEventListener("DOMContentLoaded", initGame);

function initGame() {
  gameStore.dispatch("game-init", { gridSize: GRID_SIZE });
  loadGrid();
  subscribeToGameEvents();
  const playButton = document.querySelector("#start-game");
  const stopButton = document.querySelector("#stop-game");
  playButton?.addEventListener("click", startGame);
  stopButton?.addEventListener("click", stopGame);
}

function subscribeToGameEvents() {
  gameStore.subscribe((event) => {
    switch (event) {
      case "game-over": {
        showNotification("Game is over!", { variant: "success" });
        break;
      }
    }
  });
}

function loadGrid() {
  const scoreEl = document.getElementById("score");
  gameStore.subscribe((event) => {
    switch (event) {
      case "score-updated": {
        console.log("pp:score updated", gameStore.state.score);
        if (scoreEl) {
          scoreEl.innerHTML = String(gameStore.state.score);
        }
        break;
      }
    }
  });
  renderGrid(gameEl);
}

function renderGrid(parentElement: HTMLElement | null) {
  const gameState = gameStore.state;
  const gridItems: Element[] = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    const rowItems: HTMLElement[] = [];
    for (let j = 0; j < GRID_SIZE; j++) {
      rowItems.push(createCircle(GRID_SIZE * i + j));
    }
    const rowContainer = document.createElement("div");
    rowContainer.classList.add(...["row", "circle-width"]);
    rowContainer.append(...rowItems);
    gridItems.push(rowContainer);
  }
  const gridContainer = document.createElement("div");
  gridContainer.classList.add(..."col circle-width".split(" "));
  gridContainer.append(...gridItems);
  if (parentElement) {
    parentElement.append(gridContainer);
  } else {
    alert("Missing Parent Element for Game Grid");
  }

  const handleGameEvents = (event: GameEvents) => {
    if (event === "game-started") {
      showNotification("Game Started!", { variant: "success" });
    } else if (event === "game-stopped") {
      showNotification("Game has been stopped", { variant: "info" });
    }
  };
  gameStore.subscribe(handleGameEvents);
}

function startGame() {
  gameStore.dispatch("game-started");
}

function stopGame() {
  gameStore.dispatch("game-stopped");
}

function createCircle(id: number): HTMLElement {
  const circleId = `circle_${id}`;
  const handleCircleEvents = (event: GameEvents, data: any) => {
    const gameState = gameStore.state;
    const currentCircle = document.querySelector(`#${circleId}`);
    if (gameState.selectedCircles.has(id)) {
      currentCircle?.classList.add("circle-clicked");
    }
    switch (event) {
      case "circle-clicked": {
        if (gameState.targetCircleId === id) {
          currentCircle?.classList.add("circle-next");
        } else {
          currentCircle?.classList.remove("circle-next");
        }
        break;
      }
    }
  };
  gameStore.subscribe(handleCircleEvents);
  const appliedClass = "circle";
  const circleElement = document.createElement("div");
  circleElement.id = circleId;
  circleElement.addEventListener("click", () => onClick(id));
  circleElement.classList.add(..."m-3 circle".split(" "));
  if (gameStore.state.targetCircleId === id) {
    circleElement.classList.add("circle-next");
  }
  return circleElement;
}

function onClick(index: number) {
  const gameState = gameStore.state;
  const { targetCircleId } = gameState;
  if (
    gameStore.state.status === "stopped" ||
    checkGameOver(gameStore.state) ||
    targetCircleId < 0
  ) {
    return showNotification("Press play button to start playing the game", {
      variant: "info",
    });
  }
  if (index === targetCircleId) {
    gameState.selectedCircles.add(index);
    gameStore.dispatch("score-updated", {
      ...gameState,
      score: gameState.score + 1,
    });
  } else {
    gameStore.dispatch("score-updated", {
      ...gameState,
      score: gameState.score - 1,
    });
  }
  gameStore.dispatch("circle-clicked", index);
}
