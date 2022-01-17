import { Board } from "../src/board";
import { Solver } from "../src/solver";
import { render } from "../src/console-render";

const regionSpec = [
  ["a", "a", "a", "b", "b", "c", "c", "c", "c", "c"],
  ["d", "d", "d", "b", "b", "c", "b", "e", "e", "e"],
  ["d", "b", "d", "b", "b", "c", "b", "b", "e", "e"],
  ["b", "b", "b", "b", "b", "b", "b", "e", "e", "e"],
  ["f", "b", "b", "b", "b", "g", "g", "e", "e", "e"],
  ["f", "f", "f", "h", "b", "g", "g", "g", "g", "e"],
  ["h", "h", "f", "h", "g", "g", "i", "i", "e", "e"],
  ["j", "h", "h", "h", "g", "g", "i", "i", "i", "i"],
  ["j", "j", "j", "h", "h", "j", "i", "i", "i", "i"],
  ["j", "j", "j", "j", "j", "j", "i", "i", "i", "i"],
];
const board = new Board(regionSpec);
console.log(`Created a board of size ${board.size}. Must find ${board.fillCount} items per row/col/region.`);
console.log("neighbors", board.neighbors(board.cells[6]))

let state = board.createState();
render(board, state, []);

const solver = new Solver(board);
let nextMove = solver.nextMove(state);
while (nextMove.reason != "invalid-state"){
  console.log("Applying: ", nextMove);
  state = state.change(nextMove);
  const highlights = nextMove.changes.map(c => c.cell);
  render(board, state, highlights);
  nextMove = solver.nextMove(state);
}
console.log("No further moves");
