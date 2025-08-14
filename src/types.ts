export interface GameState {
  score: number;
  selectedCircles: Set<number>;
  status: "running" | "stopped" | "over";
  targetCircleId: number;
  gridSize: number;
}
export type StateStoreListener<TEvent, TData> = (
  event: TEvent,
  data: TData,
) => void;
export interface IStateStore<TEvent = string, TData = any> {
  state: TData;
  setState: (s: TData) => void;
  dispatch: (event: TEvent, data?: any) => void;
  listeners: Array<StateStoreListener<TEvent, TData>>;
  subscribe: (cb: StateStoreListener<TEvent, TData>) => void;
  unsubscribe: (cb: StateStoreListener<TEvent, TData>) => void;
  unsubscribeAll: () => void;
}
export type GameEvents =
  | "circle-clicked"
  | "game-started"
  | "game-over"
  | "game-stopped"
  | "score-updated"
  | "game-reset";
