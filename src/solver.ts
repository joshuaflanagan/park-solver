import { Board, Region, Row, Col, Cell } from "./board";
import { CellState, State } from "./state";

type MoveReason = "invalid-state" | "blocks-all-region"| "blocks-all-col"| "blocks-all-row"| "only-option-region"| "only-option-col"| "only-option-row";

interface Move {
  cell: Cell;
  changeTo: CellState;
  reason: MoveReason;
  target: Region | Row | Col;
}

export class Solver {
  board: Board;

  constructor(board: Board){
    this.board = board;
  }

  //TODO: probably want this to return an array of moves, to handle "inline". Or, a Move has many Changes
  nextMove(state: State): Move {
    for(const regionId in this.board.regions){
      const region = this.board.regions[regionId];
      const freeCells = region.freeCells(state);
      if (freeCells.length === 1){
        return {
          cell: freeCells[0],
          changeTo: "full",
          reason: "only-option-region",
          target: region
        };
      }
    }
    // invalid state - return a sentinel object
    return {
      cell: this.board.cells[0],
      changeTo: undefined,
      reason: "invalid-state",
      target: this.board.regions[0]
    };
  }
}
