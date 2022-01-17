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

type SolverStrategy = (state: State) => Move | null;

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
    // - check rows/regions to see if only options are in same row
    //    - if so, block all cells outside of the container in that row
    //    - if the free cells in container are 2 consecutive, block their
    //      neighbors above and below (since the neighbors would block both
    //      options)
    // - check cols/regions to see if only options are in same col
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

    const strategies: SolverStrategy[] = [
      this._onlyContainerOption( "only-option-region", b => b.regions ),
      this._onlyContainerOption( "only-option-col", b => b.cols ),
      this._onlyContainerOption( "only-option-row", b => b.rows ),
      this._lineInRegion( b => b.cols, c => c.col() ),
      this._lineInRegion( b => b.rows, c => c.row() ),
      this._blocksRegion,
    ];

    for(const strategy of strategies){
      const move = strategy.call(this, state);
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
  ): SolverStrategy {
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

  _lineInRegion(
    collection: (b: Board) => Container[],
    container: (c: Cell) => Container
  ): SolverStrategy {
    return (state: State): Move|null => {
      for(const region of this.board.regions){
        const regionCells = region.freeCells(state);
        if (!regionCells.length) continue; // resolved region
        // can assume more than 1, otherwise earlier strategy would have found it
        const [first, ...rest] = regionCells;
        const lineIndex = container(first).index;
        if (rest.some( c => container(c).index !== lineIndex)) continue;
        // find other free cells in same row/col
        const lineCells = collection(this.board)[lineIndex].freeCells(state)
        const otherCells = lineCells.filter(c => c.region() !== region);
        if (!otherCells.length) continue;
        return {
          reason: "line-blocks-all-region",
          changes: otherCells.map( c => ({
            cell: c.index,
            changeTo: "blocked",
            because: regionCells.map(rc => rc.index)
          }))
        };
      }
      return null;
    }
  }

  _blocksRegion(state: State): Move|null {
    for(const row of this.board.rows){
      const rowCells = row.freeCells(state);
      // determine regions of neighbors
      for(const cell of rowCells){
        const cellNeighbors = this.board.neighbors(cell);
        // unique list of neighboring regions
        const regions = [...new Set(cellNeighbors.map( c => c.region()))]
        // exclude the cell's region, which might be blocked
          .filter(r => r.index !== cell.region().index);
        const freeRegions = regions.filter(r => r.freeCells(state).length);
        // now make a new state if all neighbors and rays blocked
        const newState = state.change({
          changes: this._changesForFull(cell, state)
        });
        // and see if any freeRegion is no longer free
        for(const region of freeRegions){
          if (!region.freeCells(newState).length){
            return {
              reason: "blocks-all-region",
              changes: [
                {
                  cell: cell.index,
                  changeTo: "blocked",
                  because: region.freeCells(state).map(rc => rc.index)
                }
              ]
            };
          }
        }
      }
    }
    return null;
  }
}
