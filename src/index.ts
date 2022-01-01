import { Board } from "../src/board";

const regionSpec = [
  ["a", "a", "a", "b", "b"],
  ["a", "c", "c", "c", "b"],
  ["d", "c", "c", "e", "b"],
  ["d", "d", "c", "e", "b"],
  ["d", "c", "c", "e", "e"],
];

const board = new Board(regionSpec);

console.log(`Created a board of size ${board.size}. Must find ${board.fillCount} items per row/col/region.`);
