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
    },
      // surrounding
      // TODO: should really filter out cells that are already blocked so
      // we dont redefine what caused it to be blocked
      ...this.board.neighbors(cell).map(n => {
        return {
          cell: n.index,
          changeTo: "blocked" as CellState,
        }
      }),
      // same row
      ...cell.row().cells.filter(n => !n.state(state)).map(n => {
        return {
          cell: n.index,
          changeTo: "blocked" as CellState,
        }
      }),
      // same col
      ...cell.col().cells.filter(n => !n.state(state)).map(n => {
        return {
          cell: n.index,
          changeTo: "blocked" as CellState,
        }
      }),
      // same region
      ...cell.region().cells.filter(n => !n.state(state)).map(n => {
        return {
          cell: n.index,
          changeTo: "blocked" as CellState,
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
    //  - When there are 2 regions whose only options are confined to the same
    //    2 columns, block all other cells in those columns if they dont belong
    //    to those regions. Works for higher counts as well
    //  - When there are 3 rows with only 3 different regions, block all cells
    //    of those regions that are not in the 3 rows, since we know the 3 to
    //    fulfill the rows will fulfill the 3 regions.
    //  - explore! This should be the last strategy, when all other fail.
    //      Test each possible move to see if it leads to an invalid
    //      state. Need to limit how many moves it looks ahead, otherwise it
    //      becomes a brute-force solver, which isn't a realistic simulation
    //      of a user. 
    //      - try the whole board with 1 move look ahead. if that doesn't lead
    //        to anything fruitful, try with 2 move look ahead.

    const strategies: SolverStrategy[] = [
      this._checkTerminalConditions,
      this._onlyContainerOption( "only-option-region", b => b.regions ),
      this._onlyContainerOption( "only-option-col", b => b.cols ),
      this._onlyContainerOption( "only-option-row", b => b.rows ),
      this._lineInRegion( b => b.cols, c => c.col() ),
      this._lineInRegion( b => b.rows, c => c.row() ),
      this._blocksRegion,
      this._confinedRegion("regions-confined-to-rows", c=>c.row(), b=>b.rows),
      this._confinedRegion("regions-confined-to-cols", c=>c.col(), b=>b.cols),
    ];

    for(const strategy of strategies){
      const move = strategy.call(this, state);
      if (move) return move;
    }
    // invalid state - return a sentinel object?
    // there can be 2 no-op "moves" - board complete, or board invalid
    // can model them as a Move with an empty cells array
    return {
      reason: "no-moves",
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
            changes: this._changesForFull(freeCells[0], state),
            because: [freeCells[0].index]
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
          because: regionCells.map(rc => rc.index),
          changes: otherCells.map( c => ({
            cell: c.index,
            changeTo: "blocked",
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
          changes: this._changesForFull(cell, state),
          because: [cell.index]
        });
        // and see if any freeRegion is no longer free
        for(const region of freeRegions){
          if (!region.freeCells(newState).length){
            return {
              reason: "blocks-all-region",
              because: region.freeCells(state).map(rc => rc.index),
              changes: [
                {
                  cell: cell.index,
                  changeTo: "blocked",
                }
              ]
            };
          }
        }
      }
    }
    return null;
  }

  _confinedRegion(reason: MoveReason, line: (c:Cell)=>Container,
    containerSource: (b: Board) => Container[]
  ): SolverStrategy {
    return (state: State): Move|null => {
      const regionBounds = this.board.regions.
        map(r => r.freeCells(state)).
        filter(r => r.length).
        map(cells => {
          const containers = cells.map(c=>line(c).index);
          const minVal = Math.min(...containers);
          const maxVal = Math.max(...containers);
          return {
            index: cells[0].region().index,
            cells,
            minVal,
            maxVal,
            span: maxVal - minVal + 1,
          }
        });

      type B = {minVal: number, maxVal: number};
      const doesIntersect = (a: B, b: B)=> a.minVal <= b.maxVal && a.maxVal >= b.minVal;
      const doesContaine = (a: B, b: B)=> a.minVal <= b.minVal && a.maxVal >= b.maxVal;

      for(let i=0; i<regionBounds.length; i++){
        const curRegion = regionBounds[i];
        // May want to set a hardcoded max, like 4 or 5
        if (curRegion.span > (this.board.size - 2)) continue;
        // find other regions in the same containers
        const intersect = regionBounds.filter(r => {
          return r.index !== curRegion.index && doesIntersect(curRegion, r);
        });
        if (!intersect.length) continue; // no other regions overlap
        // find other regions confined to same containers
        const confined = regionBounds.filter(r => {
          return r.index !== curRegion.index && doesContaine(curRegion, r);
        });
        if (!confined.length) continue; // no other regions confined to same containers
        const intersectNotConfined = intersect.filter(r => !confined.find(o=>o.index===r.index));
        if (!intersectNotConfined.length) continue; // none to filter out
        let fullCells = 0;
        for(let r=curRegion.minVal; r <=curRegion.maxVal; r++){
          fullCells += containerSource(this.board)[r].fullCells(state).length
        }
        if ((confined.length + 1 + fullCells) !== curRegion.span) continue;
        // there are as many confined regions (including current) as containers to fill,
        // meaning other regions cannot interfere. block them all out.

        let because = curRegion.cells.map(c => c.index);
        for(const other of confined){
          because = because.concat(other.cells.map(c => c.index));
        }

        let changes: Change[] = [];
        for(const blockedRegion of intersectNotConfined){
          for(const blockedCell of blockedRegion.cells){
            const index = line(blockedCell).index;
            if (index >= curRegion.minVal && index <= curRegion.maxVal){
              changes.push({
                cell: blockedCell.index,
                changeTo: "blocked",
              });
            }
          }
        }

        return {
          reason,
          changes,
          because
        }
      }
      return null;
    }
  }

  _checkTerminalConditions(state: State): Move|null {
    let solved = true;
    let solution: Cell[] = [];
    for(const row of this.board.rows){
      const full = row.fullCells(state);
      if (full.length !== this.board.fillCount){ solved = false }
      if (!full.length) continue;
      //TODO: check for all blocked cells to determine unwinnable?
      if (full.length > this.board.fillCount){
        return {
          reason: "invalid-row-count",
          changes: [],
          because: full.map(c => c.index)
        };
      }
      solution = solution.concat(full);
      for(const cell of full){
        for(const neighbor of this.board.neighbors(cell)){
          if (neighbor.state(state) === "full"){
            return {
              reason: "invalid-adjacent",
              changes: [],
              because: [cell.index, neighbor.index]
            };
          }
        }
      }
    }
    for(const col of this.board.cols){
      const full = col.fullCells(state);
      if (full.length !== this.board.fillCount){ solved = false }
      if (full.length > this.board.fillCount){
        return {
          reason: "invalid-col-count",
          changes: [],
          because: full.map(c => c.index)
        };
      }
    }
    for(const region of this.board.regions){
      const full = region.fullCells(state);
      if (full.length !== this.board.fillCount){ solved = false }
      if (full.length > this.board.fillCount){
        return {
          reason: "invalid-region-count",
          changes: [],
          because: full.map(c => c.index)
        };
      }
    }

    if (solved) {
      return {
        reason: "solved",
        changes: [],
        because: solution.map(c => c.index)
      }
    }
    return null;
  }
}
