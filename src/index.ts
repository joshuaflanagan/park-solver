import { Board } from "../src/board";

function render(board: Board, state: string[], highlights: number[]){
  for(let r=0; r<board.size; r++){
    let row = "";
    for(let c=0;c<board.size; c++){
      const cell = board.cells[ r*board.size + c ];
      row += `${cell.region.id} `;
    }
    console.log(row);
  }
}

const regionSpec = [
  ["a", "a", "a", "b", "b"],
  ["a", "c", "c", "c", "b"],
  ["d", "c", "c", "e", "b"],
  ["d", "d", "c", "e", "b"],
  ["d", "c", "c", "e", "e"],
];
const board = new Board(regionSpec);

console.log(`Created a board of size ${board.size}. Must find ${board.fillCount} items per row/col/region.`);
render(board, [], []);
