export type CellState = undefined | "blocked" | "full";
// State should become an object that keeps a history of moves, and the projection to current state
// with a change(Move) method that returns a new State (each State should be immutable)

export interface Change {
  cell: number;
  changeTo: CellState;
}

// instead of container-full, consider column-full, row-full, region-full - if we have the info
// also need - surrounds-full-cell
export type MoveReason = "input" | "solved" | "no-moves" | "unwinnable" |
  "invalid-row-count" | "invalid-region-count" |
  "invalid-col-count" | "invalid-adjacent" |
  "blocks-all-region"| "line-blocks-all-region" | // "blocks-all-col"| "blocks-all-row"|
  "regions-confined-to-rows" | "regions-confined-to-cols" |
  "only-option-region"| "only-option-col"| "only-option-row" |
  "leads-to-unwinnable";
export interface Move {
  reason?: MoveReason;
  changes: Change[];
  because?: number[];
}

export class State {
  cellCount: number;
  moves: readonly Move[];
  private readonly projection: CellState[];

  constructor(cellCount: number, moves?: Move[]){
    this.cellCount = cellCount;
    this.moves = moves ? moves : [];
    // can project immediately, since it is immutable
    this.projection = new Array<CellState>(cellCount);
    this.projection.fill(undefined);
    for(const m of this.moves){
      for(const ch of m.changes){
        this.projection[ch.cell] = ch.changeTo;
      }
    }
  }

  change(move: Move): State{
    return new State(this.cellCount, this.moves.concat(move));
  }

  cell(index: number): CellState{
    return this.projection[index];
  }

  // convenience function for test data
  fill(state: CellState): State{
    const fillMove = {
      changes: this.projection.map( (_, i) => ({cell: i, changeTo: state}) )
    };
    return this.change(fillMove);
  }
}
