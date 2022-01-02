export type CellState = undefined | "blocked" | "full";
export type State = CellState[];
// State should become an object that keeps a history of moves, and the projection to current state
// with a change(Move) method that returns a new State (each State should be immutable)
