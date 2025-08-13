interface GameState {
  score: number;
  selectedCircles: Set<number>;
  status: "running" | "stopped" | "over";
  targetCircleId: number;
}

type StateStoreListener<TEvent, TData> = (event: TEvent, data: TData) => void;

interface IStateStore<TEvent = string, TData = any> {
  state: TData;
  setState: (s: TData) => void;
  dispatch: (event: TEvent, data?: any) => void;
  listeners: Array<StateStoreListener<TEvent, TData>>;
  subscribe: (cb: StateStoreListener<TEvent, TData>) => void;
  unsubscribe: (cb: StateStoreListener<TEvent, TData>) => void;
  unsubscribeAll: () => void;
}

type GameEvents =
  | "circle-clicked"
  | "game-started"
  | "game-over"
  | "game-stopped"
  | "score-updated"
  | "game-reset"
  | "game-init";

const defaultGameState: GameState = {
  score: 0,
  selectedCircles: new Set(),
  status: "stopped",
  targetCircleId: -1,
};

const gameStore: IStateStore<GameEvents, GameState> = {
  state: structuredClone(defaultGameState),
  setState(newState: GameState) {
    this.state = newState;
  },
  listeners: [] as StateStoreListener<GameEvents, any>[],
  dispatch(event, data) {
    const actionsContainer = document.getElementById("game-actions");
    const playButton = actionsContainer?.querySelector("#start-game");
    const stopButton = actionsContainer?.querySelector("#stop-game");
    const that = this;
    switch (event) {
      case "game-init": {
        const stateCopy = structuredClone(defaultGameState);
        stateCopy.targetCircleId = getNextCircle(this.state);
        this.setState(stateCopy);
        break;
      }
      case "game-started": {
        const stateCopy = { ...this.state };
        stateCopy.status = "running";
        this.setState(stateCopy);
        playButton?.classList.add("d-none");
        stopButton?.classList.remove("d-none");
        break;
      }
      case "game-stopped": {
        const stateCopy = { ...this.state };
        stateCopy.status = "stopped";
        this.setState(stateCopy);
        playButton?.classList.remove("d-none");
        stopButton?.classList.add("d-none");
        break;
      }
      case "score-updated": {
        this.setState(data);
        break;
      }
      case "circle-clicked": {
        const clickedCircleIndex = data as number;
        const stateCopy = { ...this.state };
        if (this.state.targetCircleId === clickedCircleIndex) {
          stateCopy.selectedCircles.add(clickedCircleIndex);
          stateCopy.targetCircleId = getNextCircle(stateCopy);
          if (stateCopy.targetCircleId === -1) {
            stateCopy.status = "stopped";
            gameStore.dispatch("game-over");
            gameStore.dispatch("game-stopped");
          }
          stateCopy.score += 1;
        } else {
          stateCopy.score -= 1;
        }
        this.setState(stateCopy);
        break;
      }
    }
    this.listeners.forEach((listener) => listener(event, that.state));
  },
  subscribe(fn: Function) {
    this.listeners.push(fn);
  },
  unsubscribe(fn: Function) {
    this.listeners = this.listeners.filter((listener) => listener != fn);
  },
  unsubscribeAll() {
    this.listeners = [];
  },
};

const GRID_SIZE = 2;
const gameEl = document.getElementById("game")!;
const scoreEl = document.getElementById("score")!;

document.addEventListener("DOMContentLoaded", initGame);

function initGame() {
  gameStore.dispatch("game-init");
  loadGrid();
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
  gameStore.dispatch("game-reset");
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
  if (gameStore.state.status === "stopped") {
    return showNotification("Press play button to start playing the game", {
      variant: "info",
    });
  }
  const gameState = gameStore.state;
  const { targetCircleId } = gameState;
  if (checkGameOver() || targetCircleId < 0) {
    alert("Please press 'Play' to start the game first!");
    return;
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

function getNextCircle(gameState: GameState) {
  if (checkGameOver()) return -1;
  while (true) {
    const id = Math.round(Math.random() * (GRID_SIZE * GRID_SIZE - 1));
    if (!gameState.selectedCircles.has(id)) return id;
  }
}

interface NotificationOptions {
  variant?: "success" | "error" | "info";
  time?: number;
}

let previousNotificationTimeoutId: ReturnType<typeof setTimeout> | null = null;
function showNotification(
  text: string,
  { variant = "success", time = 2000 }: NotificationOptions,
) {
  const notificationContainer = document.getElementById("app-notification");
  const notificationEl = document.createElement("div");
  let styleProperties: Partial<CSSStyleDeclaration> | null = null;
  switch (variant) {
    case "success": {
      styleProperties = {
        backgroundColor: "green",
        color: "white",
      };
      break;
    }
    case "error": {
      styleProperties = {
        backgroundColor: "red",
        color: "white",
      };
      break;
    }
    case "info": {
      styleProperties = {
        backgroundColor: "gray",
        color: "white",
      };
      break;
    }
  }
  if (notificationContainer) {
    Object.assign(notificationEl.style, styleProperties);
  }
  notificationEl.innerHTML = text;
  notificationContainer?.append(notificationEl);
  notificationContainer?.classList.remove("d-none");
  if (previousNotificationTimeoutId) {
    clearTimeout(previousNotificationTimeoutId);
  }
  previousNotificationTimeoutId = setTimeout(() => {
    notificationContainer?.classList.add("d-none");
  }, time);
  setTimeout(() => {
    notificationEl.remove();
    console.log("removing", notificationEl);
  }, time);
}

function checkGameOver() {
  const { state } = gameStore;
  return state.selectedCircles.size === GRID_SIZE * GRID_SIZE;
}
