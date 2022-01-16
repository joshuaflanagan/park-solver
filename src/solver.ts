import { Board, Container, Cell } from "./board";
import { CellState, State, Change, Move, MoveReason } from "./state";


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
    // Steps to solve:
    // - check all Containers to see if they only have 1 option
    // - check cols/regions to see if only options are in same row
    //    - if so, block all cells outside of the container in that row
    //    - if the free cells in container are 2 consecutive, block their
    //      neighbors above and below (since the neighbors would block both
    //      options)
    // - check rows/regions to see if only options are in same col
    //    - if so, block all cells outside of the container in that col
    //    - if the free cells in container are 2 consecutive, block their
    //      neighbors to left and right (since the neighbors would block both
    //      options)
    //  - test each cell to see if they would block any containers's only options
    //    - the inline checks above are a special case of this, but worth the
    //      optimization
    //  - incomplete - need to generalize this better. When there are 2 regions
    //    whose only options are in the same 2 columns, block all other cells
    //    in those columns if they dont belong to those regions. Works for
    //    higher counts as well (3 regions whose only options in same 3 cols).
    //  - explore! This should be the last strategy, when all other fail.
    //      Test each possible move to see if it leads to an invalid
    //      state. Need to limit how many moves it looks ahead, otherwise it
    //      becomes a brute-force solver, which isn't a realistic simulation
    //      of a user. 
    //      - try the whole board with 1 move look ahead. if that doesn't lead
    //        to anything fruitful, try with 2 move look ahead.

    const strategies = [
      this._onlyContainerOption( "only-option-region", b => b.regions ),
      this._onlyContainerOption( "only-option-col", b => b.cols ),
      this._onlyContainerOption( "only-option-row", b => b.rows ),
    ];

    for(const strategy of strategies){
      const move = strategy(state);
      if (move) return move;
    }
    // invalid state - return a sentinel object?
    // there can be 2 no-op "moves" - board complete, or board invalid
    // can model them as a Move with an empty cells array
    return {
      reason: "invalid-state",
      changes: []
    };
  }

  _onlyContainerOption(
    reason: MoveReason,
    containerSource: (b: Board) => Container[]
  ): (s: State) => Move|null {
    return (state: State): Move|null => {
      for(const container of containerSource(this.board)){
        const freeCells = container.freeCells(state);
        if (freeCells.length === 1){
          return {
            reason: reason,
            changes: this._changesForFull(freeCells[0], state)
          };
        }
      }
      return null;
    }
  }
}
