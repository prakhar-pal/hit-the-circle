import type {
  IStateStore,
  GameEvents,
  GameState,
  StateStoreListener,
} from "./types";

const getDefaultGameState: () => GameState = () => ({
  score: 0,
  selectedCircles: new Set(),
  status: "stopped",
  targetCircleId: -1,
  gridSize: 0,
});

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
  state: structuredClone(getDefaultGameState()),
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
        const stateCopy = structuredClone({
          ...getDefaultGameState(),
          ...data,
        });
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
        const stateCopy = { ...getDefaultGameState() };
        this.setState(stateCopy);
        playButton?.classList.remove("d-none");
        stopButton?.classList.add("d-none");
        gameStore.dispatch("game-init");
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
          stateCopy.targetCircleId = getNextCircle(stateCopy);
          stateCopy.selectedCircles.add(clickedCircleIndex);
          if (stateCopy.targetCircleId === -1) {
            stateCopy.status = "stopped";
            gameStore.dispatch("game-over");
            gameStore.dispatch("game-stopped");
            gameStore.dispatch("game-init");
          }
        }
        this.setState(stateCopy);
        break;
      }
    }
    console.log("gameStore::dispatch", this.state, event);
    this.listeners.forEach((listener) => listener(event, that.state));
  },
  subscribe(fn: StateStoreListener<GameEvents, any>) {
    this.listeners.push(fn);
  },
  unsubscribe(fn: StateStoreListener<GameEvents, any>) {
    this.listeners = this.listeners.filter((listener) => listener != fn);
  },
  unsubscribeAll() {
    this.listeners = [];
  },
};
