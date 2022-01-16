import { Board } from "../src/board";
import { Solver } from "../src/solver";
import { render } from "../src/console-render";

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
