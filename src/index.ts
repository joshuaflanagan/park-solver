import { State } from "../src/state";
import { Board } from "../src/board";
import { Solver } from "../src/solver";

function render(board: Board, state: State, highlights: number[]){
  for(let r=0; r<board.size; r++){
    let row = "";
    for(let c=0;c<board.size; c++){
      const cell = board.cells[ r*board.size + c ];
      const cellVal = state.cell(cell.index);
      let rval = cell.region().label;
      switch(cellVal){
        case "blocked":
          rval = "x";
          break;
        case "full":
          rval = "O";
          break;
      }
      row += `${rval} `;
    }
    console.log(row);
  }
}

const regionSpec = [
  ["a", "a", "a", "a", "a"],
  ["b", "a", "a", "a", "a"],
  ["b", "c", "d", "e", "e"],
  ["c", "c", "c", "e", "e"],
  ["c", "c", "c", "e", "e"],
];
const board = new Board(regionSpec);
console.log(`Created a board of size ${board.size}. Must find ${board.fillCount} items per row/col/region.`);
console.log("neighbors", board.neighbors(board.cells[6]))

let state = board.createState();
render(board, state, []);

const solver = new Solver(board);
const nextMove = solver.nextMove(state);
console.log("nextMove:", nextMove);

state = state.change(nextMove);
render(board, state, []);
