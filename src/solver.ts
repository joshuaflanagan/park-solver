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
      // TODO: should really filter out cells that are already blocked so
      // we dont redefine what caused it to be blocked
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
      this._confinedRegion,
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

  _confinedRegion(state: State): Move|null {
    const regionBounds = this.board.regions.
      map(r => r.freeCells(state)).
      filter(r => r.length).
      map(cells => {
        const rows = cells.map(c=>c.row().index);
        const cols = cells.map(c=>c.col().index);
        const minRow = Math.min(...rows);
        const maxRow = Math.max(...rows);
        const minCol = Math.min(...cols);
        const maxCol = Math.max(...cols);
        return {
          index: cells[0].region().index,
          cells,
          minRow,
          maxRow,
          minCol,
          maxCol,
          rowSpan: maxRow - minRow + 1,
          colSpan: maxCol - minCol + 1,
        }
      });

    type B = {minRow: number, maxRow: number};
    const rowsIntersect = (a: B, b: B)=> a.minRow <= b.maxRow && a.maxRow >= b.minRow;
    const rowsContain = (a: B, b: B)=> a.minRow <= b.minRow && a.maxRow >= b.maxRow;

    for(let i=0; i<regionBounds.length; i++){
      const curRegion = regionBounds[i];
      // May want to set a hardcoded max, like 4 or 5
      if (curRegion.rowSpan > (this.board.size - 2)) continue;
      // find other regions in the same rows
      const intersect = regionBounds.filter(r => {
        return r.index !== curRegion.index && rowsIntersect(curRegion, r);
      });
      if (!intersect.length) continue; // no other regions overlap
      // find other regions confined to same rows
      const confined = regionBounds.filter(r => {
        return r.index !== curRegion.index && rowsContain(curRegion, r);
      });
      if (!confined.length) continue; // no other regions confined to same rows
      const intersectNotConfined = intersect.filter(r => !confined.find(o=>o.index===r.index));
      if (!intersectNotConfined.length) continue; // none to filter out
      let fullCells = 0;
      for(let r=curRegion.minRow; r <=curRegion.maxRow; r++){
        fullCells += this.board.rows[r].fullCells(state)
      }
      if ((confined.length + 1 + fullCells) !== curRegion.rowSpan) continue;
      // there are as many confined regions (including current) as rows to fill,
      // meaning other regions cannot interfere. block them all out.

      let because = curRegion.cells.map(c => c.index);
      for(const other of confined){
        because = because.concat(other.cells.map(c => c.index));
      }

      let changes: Change[] = [];
      for(const blockedRegion of intersectNotConfined){
        for(const blockedCell of blockedRegion.cells){
          const rowIndex = blockedCell.row().index;
          if (rowIndex >= curRegion.minRow && rowIndex <= curRegion.maxRow){
            changes.push({
              cell: blockedCell.index,
              changeTo: "blocked",
              because
            });
          }
        }
      }

      return {
        reason: "regions-confined-to-rows",
        changes
      }
    }
    return null;
  }
}
