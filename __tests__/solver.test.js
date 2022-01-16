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
    const change = nextMove.changes[0];
    expect(change.changeTo).toEqual("full");
    expect(change.because.length).toEqual(1);
    expect(board.regionForCell(change.because[0]).label).toEqual("d");
  });

  test("Can recognize a column with only one option", () => {
    const regionSpec = [
      ["a", "a", "a", "a", "a"],
      ["b", "a", "a", "a", "a"],
      ["b", "d", "d", "e", "e"],
      ["c", "c", "c", "e", "e"],
      ["c", "c", "c", "e", "e"],
    ];

    const board = new Board(regionSpec);
    let state = board.createState();
    // block 4th column, except in 3rd row
    state = state.change({
      changes: [
        {cell: 3, changeTo: "blocked"},
        {cell: 8, changeTo: "blocked"},
        {cell: 18, changeTo: "blocked"},
        {cell: 23, changeTo: "blocked"},
      ]
    });

    const solver = new Solver(board);
    const nextMove = solver.nextMove(state);

    const change = nextMove.changes[0];
    expect(change).toBeDefined();
    expect(change.changeTo).toEqual("full");
    expect(change.cell).toBe(13);
    expect(nextMove.reason).toEqual("only-option-col");
    expect(change.because.length).toEqual(1);
    expect(board.colForCell(change.because[0]).label).toEqual("3");
  });

  test("Can recognize a row with only one option", () => {
    const regionSpec = [
      ["a", "a", "a", "a", "a"],
      ["b", "a", "a", "a", "a"],
      ["b", "d", "d", "e", "e"],
      ["b", "c", "c", "e", "e"],
      ["c", "c", "c", "e", "e"],
    ];

    const board = new Board(regionSpec);
    let state = board.createState();
    // block everything in 2nd row, except first a
    state = state.change({
      changes: [
        {cell: 5, changeTo: "blocked"},
        {cell: 7, changeTo: "blocked"},
        {cell: 8, changeTo: "blocked"},
        {cell: 9, changeTo: "blocked"},
      ]
    });

    const solver = new Solver(board);
    const nextMove = solver.nextMove(state);

    const change = nextMove.changes[0];
    expect(change).toBeDefined();
    expect(change.changeTo).toEqual("full");
    expect(change.cell).toBe(6);
    expect(nextMove.reason).toEqual("only-option-row");
    expect(change.because.length).toEqual(1);
    expect(board.rowForCell(change.because[0]).label).toEqual("1");
  });

  test("If a region only has options in one row - block others in that row", () => {
    const regionSpec = [
      ["b", "a", "a", "a", "e"],
      ["b", "a", "a", "a", "a"],
      ["b", "d", "d", "e", "e"],
      ["b", "c", "c", "e", "e"],
      ["c", "c", "c", "e", "e"],
    ];

    const board = new Board(regionSpec);
    let state = board.createState();
    // block all a's, except 2 on second row
    state = state.change({
      changes: [
        {cell: board.cellIndex([1, 0]), changeTo: "blocked"},
        {cell: board.cellIndex([2, 0]), changeTo: "blocked"},
        {cell: board.cellIndex([3, 0]), changeTo: "blocked"},

        {cell: board.cellIndex([1, 1]), changeTo: "blocked"},
        {cell: board.cellIndex([3, 1]), changeTo: "blocked"},
      ]
    });

    const solver = new Solver(board);
    const nextMove = solver.nextMove(state);

    const change = nextMove.changes[0];
    expect(change).toBeDefined();
    expect(change.cell).toBe( board.cellIndex([0,1]));
    expect(change.changeTo).toEqual("blocked");
    expect(nextMove.reason).toEqual("blocks-all-region");
    expect(change.because.length).toEqual(2);
    expect(change.because[0]).toEqual(board.cellIndex([2,1]));
    expect(change.because[1]).toEqual(board.cellIndex([4,1]));
  });

  test("If a region only has options in one col - block others in that col", () => {
    const regionSpec = [
      ["b", "b", "a", "a", "e"],
      ["b", "a", "a", "a", "a"],
      ["b", "d", "d", "e", "e"],
      ["b", "c", "d", "e", "e"],
      ["c", "c", "c", "e", "e"],
    ];

    const board = new Board(regionSpec);
    let state = board.createState();
    // block all b's, except 2 in first column
    state = state.change({
      changes: [
        {cell: board.cellIndex([1, 0]), changeTo: "blocked"},
        {cell: board.cellIndex([0, 1]), changeTo: "blocked"},
        {cell: board.cellIndex([0, 3]), changeTo: "blocked"},
      ]
    });

    const solver = new Solver(board);
    const nextMove = solver.nextMove(state);

    const change = nextMove.changes[0];
    // should block c in first column
    expect(change).toBeDefined();
    expect(change.cell).toBe( board.cellIndex([0,4]));
    expect(change.changeTo).toEqual("blocked");
    expect(nextMove.reason).toEqual("blocks-all-region");
    expect(change.because.length).toEqual(2);
    expect(change.because[0]).toEqual(board.cellIndex([0,0]));
    expect(change.because[1]).toEqual(board.cellIndex([0,2]));
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
      const change = hasChangeToCell(board, nextMove, label, "blocked");
      expect(change.because).toEqual([fullCell]);
    });
  });

  const hasChangeToCell = function(board, move, cellLabel, state) {
    const targetCell = board.cells.find(c => c.label == cellLabel);
    if (!targetCell) {
      throw new Error(`Test refers to an invalid cell label: ${cellLabel}`);
    }
    const targetIndex = targetCell.index;
    const change = move.changes.find(c => c.cell === targetIndex);
    if (!change){
      throw new Error(`Did not find change for cell with label ${cellLabel} (index: ${targetIndex})`);
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
