const { Board, Container } = require( "../src/board");
const { Solver, Move, Change } = require( "../src/solver");
const { CellState } = require( "../src/state");


describe("Determine the next move", () => {
  test("Can recognize a region with only one option", () => {
    const regionSpec = [
      ["a", "a", "a", "a", "a"],
      ["b", "a", "a", "a", "a"],
      ["b", "c", "d", "e", "e"],
      ["c", "c", "c", "e", "e"],
      ["c", "c", "c", "e", "e"],
    ];

    const board = new Board(regionSpec);
    const state = board.createState();

    const solver = new Solver(board);
    const nextMove = solver.nextMove(state);

    expect(nextMove.reason).toEqual("only-option-region");
    expect(nextMove.changes[0].changeTo).toEqual("full");
    expect(nextMove.changes[0].because.length).toEqual(1);
    expect(nextMove.changes[0].because[0].region.id).toEqual("d");
  });

  test("A move that marks a cell 'full' will also change surrounding cells to 'blocked'", () => {
    const regionSpec = [
      ["a", "a", "a", "a", "a"],
      ["b", "a", "a", "a", "a"],
      ["b", "c", "d", "e", "e"],
      ["c", "c", "c", "e", "e"],
      ["c", "c", "c", "e", "e"],
    ];
    const board = new Board(regionSpec);
    const state = board.createState();

    const solver = new Solver(board);
    const nextMove = solver.nextMove(state);
    expect(nextMove.changes.length).toEqual(13);
    // sets a cell to full
    expect(nextMove.changes[0].changeTo).toEqual("full");
    const fullCell = nextMove.changes[0].cell;
    // blocks all cells in row/col (** IF fillcount is met...)
    [
      "1,1,a",
      "2,1,a",
      "3,1,a",
      "3,2,e",
      "3,3,e",
      "2,3,c",
      "1,3,c",
      "1,2,c",
      "0,2,b",
      "4,2,e",
      "2,0,a",
      "2,4,c",
    ].forEach(label => {
      const change = hasChangeToCell(nextMove, label, "blocked");
      expect(change.because).toEqual([fullCell]);
    });
  });

  const hasChangeToCell = function(move, cellLabel, state) {
    const change = move.changes.find(c => c.cell.label === cellLabel);
    if (!change){
      throw new Error("Did not find change for cell with label " + cellLabel);
    }
    if (state){
      expect(change.changeTo).toEqual(state);
    }
    return change;
  }
});

describe("Potential advanced board", () => {
  // This does not appear solvable by the identified strategies

  const regionSpec = [
    ["a", "a", "a", "a", "b"],
    ["a", "b", "b", "b", "b"],
    ["b", "b", "c", "c", "d"],
    ["e", "b", "c", "c", "d"],
    ["e", "e", "e", "c", "d"],
  ];
});
