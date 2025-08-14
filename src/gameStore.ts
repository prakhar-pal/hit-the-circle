import type {
  IStateStore,
  GameEvents,
  GameState,
  StateStoreListener,
} from "./types";

const defaultGameState: GameState = {
  score: 0,
  selectedCircles: new Set(),
  status: "stopped",
  targetCircleId: -1,
  gridSize: 0,
};

export function getNextCircle(gameState: GameState) {
  const { gridSize } = gameState;
  if (checkGameOver({ gridSize, selectedCircles: gameState.selectedCircles }))
    return -1;
  while (true) {
    const id = Math.round(Math.random() * (gridSize * gridSize - 1));
    if (!gameState.selectedCircles.has(id)) return id;
  }
}

export function checkGameOver({
  gridSize,
  selectedCircles,
}: {
  gridSize: number;
  selectedCircles: Set<number>;
}) {
  return selectedCircles.size === gridSize * gridSize;
}

export const gameStore: IStateStore<GameEvents, GameState> = {
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
        const stateCopy = structuredClone({ ...defaultGameState, ...data });
        stateCopy.targetCircleId = getNextCircle(stateCopy);
        console.log(stateCopy.targetCircleId);
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
    console.log("gameStore::dispatch", this.state, event);
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
