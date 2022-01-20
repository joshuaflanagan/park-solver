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
    state = state.change(movesForState(board,
      "---o-",
      "---o-",
      "-----",
      "---o-",
      "---o-",
    ));

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
    state = state.change(movesForState(board,
      "-----",
      "o-ooo",
      "-----",
      "-----",
      "-----",
    ));

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
      ["b", "b", "c", "e", "e"],
      ["c", "c", "c", "e", "e"],
    ];

    const board = new Board(regionSpec);
    let state = board.createState();
    // block all a's, except 2 on second row
    state = state.change(movesForState(board,
      "-ooo-",
      "-o-o-",
      "-----",
      "-----",
      "-----",
    ));

    const solver = new Solver(board);
    const nextMove = solver.nextMove(state);

    const change = nextMove.changes[0];
    expect(change).toBeDefined();
    expect(change.cell).toBe( board.cellIndex([0,1]));
    expect(change.changeTo).toEqual("blocked");
    expect(nextMove.reason).toEqual("line-blocks-all-region");
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
    state = state.change(movesForState(board,
      "-o---",
      "o----",
      "-----",
      "o----",
      "-----",
    ));

    const solver = new Solver(board);
    const nextMove = solver.nextMove(state);

    const change = nextMove.changes[0];
    // should block c in first column
    expect(change).toBeDefined();
    expect(change.cell).toBe( board.cellIndex([0,4]));
    expect(change.changeTo).toEqual("blocked");
    expect(nextMove.reason).toEqual("line-blocks-all-region");
    expect(change.because.length).toEqual(2);
    expect(change.because[0]).toEqual(board.cellIndex([0,0]));
    expect(change.because[1]).toEqual(board.cellIndex([0,2]));
  });

  test("If a cells neighbors would block all for a region, block the cell", () => {
    const regionSpec = [
      ["a", "a", "a", "a", "a"],
      ["b", "a", "a", "a", "c"],
      ["b", "d", "a", "a", "a"],
      ["b", "d", "d", "e", "a"],
      ["d", "d", "d", "e", "a"],
    ];

    const board = new Board(regionSpec);
    let state = board.createState();
    // the d blocks all the b's
    state = state.change(movesForState(board,
      "o--oo",
      "oooox",
      "---oo",
      "----o",
      "x---o",
    ));

    const solver = new Solver(board);
    const nextMove = solver.nextMove(state);
    expect(nextMove.reason).toEqual("blocks-all-region");

    const change = nextMove.changes[0];
    // should block c in first column
    expect(change).toBeDefined();
    expect(change.cell).toBe( board.cellIndex([1,2]));
    expect(change.changeTo).toEqual("blocked");
    expect(change.because.length).toEqual(2);
    expect(change.because[0]).toEqual(board.cellIndex([0,2]));
    expect(change.because[1]).toEqual(board.cellIndex([0,3]));
  });

  test("If a cells neighbors and rays would block all for a region, block the cell", () => {
    const regionSpec = [
      ["a", "a", "b", "b", "b"],
      ["c", "a", "a", "a", "b"],
      ["c", "c", "d", "d", "b"],
      ["e", "c", "c", "d", "d"],
      ["e", "e", "e", "e", "d"],
    ];

    const board = new Board(regionSpec);
    let state = board.createState();
    const solver = new Solver(board);
    const nextMove = solver.nextMove(state);

    // the first b blocks all of the a's
    const change = nextMove.changes[0];
    expect(change).toBeDefined();
    expect(change.cell).toBe( board.cellIndex([2,0]));
    expect(change.changeTo).toEqual("blocked");
    expect(nextMove.reason).toEqual("blocks-all-region");
    expect(change.because.length).toEqual(5);
    expect(change.because[0]).toEqual(board.cellIndex([0,0]));
    expect(change.because[1]).toEqual(board.cellIndex([1,0]));
    expect(change.because[2]).toEqual(board.cellIndex([1,1]));
    expect(change.because[3]).toEqual(board.cellIndex([2,1]));
    expect(change.because[4]).toEqual(board.cellIndex([3,1]));
  });

  test("When 2 regions are confined to same two rows, block all others in those rows", () => {
    const regionSpec = [
      "aaabcc",
      "adabbc",
      "adaaaa",
      "ddaeaf",
      "dfeeef",
      "dfffff"
    ]

    const board = new Board(regionSpec);
    let state = board.createState();
    // get to point where we rely on this rule
    state = state.change(movesForState(board,
      "--o-o-",
      "--o-o-",
      "o--o-o",
      "---o-o",
      "oo-o-o",
      "o--o-o",
    ));

    const solver = new Solver(board);
    const nextMove = solver.nextMove(state);

    // should block all in first 2 rows except b and c
    expect(nextMove.changes.length).toBe(4);
    expect(nextMove.changes.map(c => c.cell)).toEqual([
      board.cellIndex([0,0]),
      board.cellIndex([1,0]),
      board.cellIndex([0,1]),
      board.cellIndex([1,1])
    ]);
    expect(nextMove.reason).toEqual("regions-confined-to-rows");
    expect(nextMove.changes.map(c => c.changeTo)).toEqual([
      "blocked", "blocked", "blocked", "blocked"
    ]);
    expect(nextMove.changes[0].because).toEqual(nextMove.changes[1].because);
    expect(nextMove.changes[1].because).toEqual(nextMove.changes[2].because);
    expect(nextMove.changes[2].because).toEqual(nextMove.changes[3].because);
    expect(nextMove.changes[0].because).toEqual([
      board.cellIndex([3, 0]),
      board.cellIndex([3, 1]),
      board.cellIndex([5, 0]),
      board.cellIndex([5, 1])
    ]);
  });

  test("When 2 regions are confined to same two cols, block all others in those cols", () => {
    const regionSpec = [
      "lllbbbb",
      "bbbbbpp",
      "bbbggpp",
      "yyyygpp",
      "yyyygrr",
      "yyyyurr",
      "yyyyuuu"
    ]

    const board = new Board(regionSpec);
    let state = board.createState();
    // get to point where we rely on this rule
    state = state.change(movesForState(board,
      "---oooo",
      "-o--o--",
      "-------",
      "---o--o",
      "-------",
      "-----o-",
      "---o---",
    ));
    const solver = new Solver(board);
    const nextMove = solver.nextMove(state);

    // should block all in last 2 cols except p and r
    expect(nextMove.reason).toEqual("regions-confined-to-cols");
    expect(nextMove.changes.length).toBe(2);
    expect(nextMove.changes.map(c => c.cell)).toEqual([
      board.cellIndex([5,6]),
      board.cellIndex([6,6]),
    ]);
    expect(nextMove.changes.map(c => c.changeTo)).toEqual([
      "blocked", "blocked"
    ]);
    expect(nextMove.changes[0].because).toEqual(nextMove.changes[1].because);
    expect(nextMove.changes[0].because).toEqual([
      board.cellIndex([5, 1]),
      board.cellIndex([6, 1]),
      board.cellIndex([5, 2]),
      board.cellIndex([6, 2]),
      board.cellIndex([5, 3]),
      board.cellIndex([5, 4]),
      board.cellIndex([6, 4]),
      board.cellIndex([6, 5]),
    ]);
  });

  test("Can identify a solved board", () => {
    const regionSpec = [
      "aaaaa",
      "baaaa",
      "bcdee",
      "cccee",
      "cccee"
    ];

    const board = new Board(regionSpec);
    let state = board.createState();
    // only the fulls matter - blocked cells just to try and throw it off
    state = state.change(movesForState(board,
      "oo x ",
      "x  oo",
      "oox  ",
      "    x",
      " x   "
    ));

    const solver = new Solver(board);
    const nextMove = solver.nextMove(state);

    expect(nextMove.reason).toEqual("solved");
    expect(nextMove.changes.length).toBe(0);
  });

  test("Can identify a board with too many full cells in a column", () => {
    const regionSpec = [
      "aaaaa",
      "baaaa",
      "bcdee",
      "cccee",
      "cccee"
    ];

    const board = new Board(regionSpec);

    let state = board.createState();
    newState = state.change(movesForState(board,
      "ooxo ",
      "x    ",
      "oo   ",
      "x    ",
      "   x "
    ));

    const solver = new Solver(board);
    const nextMove = solver.nextMove(newState);
    expect(nextMove.reason).toEqual("invalid-col-count");
    expect(nextMove.changes.length).toBe(0);
  });

  test("Can identify a board with too many full cells in a row", () => {
    const regionSpec = [
      "aaaaa",
      "baaaa",
      "bcdee",
      "cccee",
      "cccee"
    ];

    const board = new Board(regionSpec);

    let state = board.createState();
    newState = state.change(movesForState(board,
      "oo o ",
      "x   x",
      "oo   ",
      "   x ",
      " x   "
    ));

    const solver = new Solver(board);
    const nextMove = solver.nextMove(newState);
    expect(nextMove.reason).toEqual("invalid-row-count");
    expect(nextMove.changes.length).toBe(0);
  });

  test("Can identify a board with too many full cells in a region", () => {
    const regionSpec = [
      "aaaaa",
      "baaaa",
      "bcdee",
      "cccee",
      "cccee"
    ];

    const board = new Board(regionSpec);

    let state = board.createState();
    newState = state.change(movesForState(board,
      "oo o ",
      "     ",
      "oo  x",
      "     ",
      "   x "
    ));

    const solver = new Solver(board);
    const nextMove = solver.nextMove(newState);
    expect(nextMove.reason).toEqual("invalid-region-count");
    expect(nextMove.changes.length).toBe(0);
  });

  test("Can identify a board with adjacent full cells", () => {
    const regionSpec = [
      "aaaaa",
      "baaaa",
      "bcdee",
      "cccee",
      "cccee"
    ];

    const board = new Board(regionSpec);

    let state = board.createState();
    newState = state.change(movesForState(board,
      "oo o ",
      "   x ",
      "oox  ",
      "     ",
      " x   "
    ));

    const solver = new Solver(board);
    const nextMove = solver.nextMove(newState);
    expect(nextMove.reason).toEqual("invalid-adjacent");
    expect(nextMove.changes.length).toBe(0);
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

  const movesForState = function(board, ...states){
    const changes = [];
    for(let row=0; row < states.length; row++){
      const stateString = states[row];
      for(let col=0; col < stateString.length; col++){
        let changeTo = null;
        if (stateString[col] == "x"){
          changeTo = "full";
        } else if (stateString[col] == "o") {
          changeTo = "blocked";
        }
        if (changeTo){
          changes.push({cell: board.cellIndex([col, row]), changeTo})
        }
      }
    }
    return {changes};
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

  // requires a guess/lookahead
  // 0,2 would force c and d to compete for same column (2)
  // a one move lookahead would lead to placing with "only option region" and
  // then realizing board is invalid/unwinnable
  // should 'unwinnable' be distinct from 'invalid'?
  // invalid could mean 2 fulls in same container, or too close
  // unwinnable means current fulls are otherwise valid, but leave no options
  // for a region/col/row
  const regionSpec2 = [
    "aaaaa",
    "bccaa",
    "bcccd",
    "bdddd",
    "bddee"
  ];
});
