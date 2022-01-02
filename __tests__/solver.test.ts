import { Board } from "../src/board";
import { Solver } from "../src/solver";


describe("Determine the next move", () => {
  const regionSpec = [
    ["a", "a", "a", "a", "a"],
    ["b", "a", "a", "a", "a"],
    ["b", "c", "d", "e", "e"],
    ["c", "c", "c", "e", "e"],
    ["c", "c", "c", "e", "e"],
  ];

  test("Can recognize a region with only one option", () => {
    const board = new Board(regionSpec);
    const state = board.createState();

    const solver = new Solver(board);
    const nextMove = solver.nextMove(state);

    expect(nextMove.changeTo).toEqual("full");
    expect(nextMove.reason).toEqual("only-option-region");
    expect(nextMove.target.id).toEqual("d");
  });
});
