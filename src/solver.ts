import { Board, Container, Cell } from "./board";
import { CellState, State, Change, Move } from "./state";


/*
 * When you set a cell to Full, it is always because it is only option in a Container
 * The container is obvious, if the region/col/row are different reasons.
 *
 * When you set a cell to blocked, it can be because:
 * - it surrounds a full cell - because: Cell
 * - it is in the same Container as a full cell - because: Container (or Cell?)
 * - it blocks all of an unfull Container's options - because: Container
 *
 * What if the because is an array of cells?
 * - it surrounds a full cell - because: [the full cell]
 * - it is in the same Container as a full cell - because: [the full cell]
 * - it blocks all of an unfull Container's options - because: [all container's cells, or just the empty ones]
 */

export class Solver {
  board: Board;

  constructor(board: Board){
    this.board = board;
  }

  _changesForFull(cell: Cell, state: State): Change[]{
    const candidates: Change[] = [{
      cell: cell.index,
      changeTo: "full",
      because: [cell.index]
    },
      // surrounding
      ...this.board.neighbors(cell).map(n => {
        return {
          cell: n.index,
          changeTo: "blocked" as CellState,
          because: [cell.index]
        }
      }),
      // same row
      ...cell.row().cells.filter(n => !n.state(state)).map(n => {
        return {
          cell: n.index,
          changeTo: "blocked" as CellState,
          because: [cell.index]
        }
      }),
      // same col
      ...cell.col().cells.filter(n => !n.state(state)).map(n => {
        return {
          cell: n.index,
          changeTo: "blocked" as CellState,
          because: [cell.index]
        }
      }),
      // same region
      ...cell.region().cells.filter(n => !n.state(state)).map(n => {
        return {
          cell: n.index,
          changeTo: "blocked" as CellState,
          because: [cell.index]
        }
      }),
      // TODO: need to dedup across row,col,region
    ];
    const deduped: Change[] = [];
    const seen = new Set();

    candidates.forEach(candidate => {
      if (!seen.has(candidate.cell)){
        seen.add(candidate.cell);
        deduped.push(candidate);
      }
    })
    return deduped
  }


  //TODO: probably want a Move to have an array of cells, to handle "inline".
  nextMove(state: State): Move {
    for(const region of this.board.regions){
      const freeCells = region.freeCells(state);
      if (freeCells.length === 1){
        return {
          reason: "only-option-region",
          changes: this._changesForFull(freeCells[0], state)
        };
      }
    }
    // invalid state - return a sentinel object?
    // there can be 2 no-op "moves" - board complete, or board invalid
    // can model them as a Move with an empty cells array
    return {
      reason: "invalid-state",
      changes: []
    };
  }
}
