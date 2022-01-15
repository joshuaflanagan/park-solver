const { Board } = require("../src/board");

describe("Building a Board", () => {
  const validRegionSpec = [
    ["a", "a", "a", "b", "b"],
    ["a", "c", "c", "c", "b"],
    ["d", "c", "c", "e", "b"],
    ["d", "d", "c", "e", "b"],
    ["d", "c", "c", "e", "e"],
  ];

  test("A valid region has same number of regions, rows, and columns", () => {
    const board = new Board(validRegionSpec);
    expect(board.size).toEqual(5);
  });

  test("Defaults to requiring one fill per region, row, and column", () => {
    const board = new Board(validRegionSpec);
    expect(board.fillCount).toEqual(1);
  });

  test("Allow specifying the need for more fills", () => {
    const board = new Board(validRegionSpec, 3);
    expect(board.fillCount).toEqual(3);
  });

  test("Has 'size x size' cells", () => {
    const board = new Board(validRegionSpec);
    expect(board.cells.length).toEqual(5 * 5);
  });

  test("Each cell has a label that indicates column, row, and region", () => {
    const board = new Board(validRegionSpec);
    expect(board.cells[0].label).toEqual("0,0,a");
    expect(board.cells[1].label).toEqual("1,0,a");
    expect(board.cells[4].label).toEqual("4,0,b");
    expect(board.cells[5].label).toEqual("0,1,a");
    expect(board.cells[24].label).toEqual("4,4,e");
  });

  test("Can identify the column, given a cell index", () => {
    const board = new Board(validRegionSpec);
    expect(board.colForCell(0).id).toBe("0");
    expect(board.colForCell(1).id).toBe("1");
    expect(board.colForCell(5).id).toBe("0");
    expect(board.colForCell(23).id).toBe("3");
    expect(board.colForCell(24).id).toBe("4");
  });

  test("Can identify the row, given a cell index", () => {
    const board = new Board(validRegionSpec);
    expect(board.rowForCell(0).id).toBe("0");
    expect(board.rowForCell(1).id).toBe("0");
    expect(board.rowForCell(5).id).toBe("1");
    expect(board.rowForCell(23).id).toBe("4");
    expect(board.rowForCell(24).id).toBe("4");
  });

  test("Can identify the region, given a cell index", () => {
    const board = new Board(validRegionSpec);
    expect(board.regionForCell(0).id).toBe("a");
    expect(board.regionForCell(1).id).toBe("a");
    expect(board.regionForCell(4).id).toBe("b");
    expect(board.regionForCell(5).id).toBe("a");
    expect(board.regionForCell(6).id).toBe("c");
    expect(board.regionForCell(23).id).toBe("e");
    expect(board.regionForCell(24).id).toBe("e");
  });

  test("Each cell is associated with a region", () => {
    const board = new Board(validRegionSpec);
    expect(board.cells[0].region().id).toEqual("a");
    expect(board.cells[3].region().id).toEqual("b");
    expect(board.cells[6].region().id).toEqual("c");
  });

  test("A valid board has 'size' regions", () => {
    const board = new Board(validRegionSpec);
    expect(Object.keys(board.regions).length).toEqual(board.size);
  });

  test("Each region is associated with a collection of cells", () => {
    const board = new Board(validRegionSpec);
    const cell1 = board.cells[3];
    const cell2 = board.cells[0];
    expect(cell1.region()).not.toBe(cell2.region()); // make sure they are in separate regions
    const region = cell1.region();
    expect(region.cells).toContain(cell1);
    expect(region.cells).not.toContain(cell2);
  });

  test("Each cell is associated with a Row", () => {
    const board = new Board(validRegionSpec);
    expect(board.cells[0].row().id).toEqual("0");
    expect(board.cells[1].row().id).toEqual("0");
    expect(board.cells[6].row().id).toEqual("1");
    expect(board.cells[10].row().id).toEqual("2");
    expect(board.cells[15].row().id).toEqual("3");
    expect(board.cells[24].row().id).toEqual("4");
  });

  test("A valid board has 'size' rows", () => {
    const board = new Board(validRegionSpec);
    expect(board.rows.length).toEqual(board.size);
  });

  test("Each cell is associated with a Col", () => {
    const board = new Board(validRegionSpec);
    expect(board.cells[0].col().id).toEqual("0");
    expect(board.cells[1].col().id).toEqual("1");
    expect(board.cells[4].col().id).toEqual("4");
    expect(board.cells[5].col().id).toEqual("0");
    expect(board.cells[7].col().id).toEqual("2");
    expect(board.cells[13].col().id).toEqual("3");
  });

  test("A valid board has 'size' cols", () => {
    const board = new Board(validRegionSpec);
    expect(board.cols.length).toEqual(board.size);
  });

  test("Building a board throws if the number of regions does not match 'size'", () => {
    const invalidRegionSpec = [ // a-f, 6 regions
      ["a", "a", "a", "b", "b"],
      ["a", "c", "c", "c", "b"],
      ["d", "c", "c", "e", "b"],
      ["d", "d", "c", "e", "b"],
      ["d", "c", "c", "f", "f"],
    ];

    expect( () => {
      new Board(invalidRegionSpec);
    }).toThrow("regions");
  });

  test("Building a board throws if all rows dont have the same number of cells", () => {
    const invalidRegionSpec = [
      ["a", "a", "a", "b", "b"],
      ["a", "c", "c", "c", "b"],
      ["d", "c", "c", "e"     ], // only 4 cells
      ["d", "d", "c", "e", "b"],
      ["d", "c", "c", "e", "e"],
    ];

    expect( () => {
      new Board(invalidRegionSpec);
    }).toThrow("row");
  });

  test("Building a board throws if number of rows does not match number of columsn", () => {
    const invalidRegionSpec = [
      ["a", "a", "a", "b", "b"],
      ["a", "c", "c", "c", "b"],
      ["d", "c", "c", "e", "b"],
      ["d", "c", "c", "e", "e"],
    ];

    expect( () => {
      new Board(invalidRegionSpec);
    }).toThrow("row");
  });
});

describe("Building a State", () => {
  const validRegionSpec = [
    ["a", "a", "a", "b", "b"],
    ["a", "c", "c", "c", "b"],
    ["d", "c", "c", "e", "b"],
    ["d", "d", "c", "e", "b"],
    ["d", "c", "c", "e", "e"],
  ];

  test("Can create a new state object with a value per cell in the board", ()=> {
    const board = new Board(validRegionSpec);
    const state = board.createState();
    expect(state.length).toEqual(board.cells.length);
  });
});

describe("Checking for free cells in a region", () => {
  const regionSpec = [
    ["a", "a", "a", "a", "a"],
    ["b", "a", "a", "a", "a"],
    ["b", "c", "d", "e", "e"],
    ["c", "c", "c", "e", "e"],
    ["c", "c", "c", "e", "e"],
  ];

  test("Returns an empty array when all cells are blocked or full", () => {
    const board = new Board(regionSpec);
    const state = board.createState();
    state.fill("blocked");
    state[0] = "full";

    const freeCells = board.regionsByLabel["a"].freeCells(state);
    expect(freeCells).toEqual([]);
  });

  test("Returns an array of cells in the region that are not blocked or full", () => {
    const board = new Board(regionSpec);
    const state = board.createState();
    state.fill("blocked");
    state[1] = undefined;
    state[3] = undefined;
    state[6] = undefined;

    const freeCells = board.regionsByLabel["a"].freeCells(state);
    expect(freeCells).toEqual([
      board.cells[1],
      board.cells[3],
      board.cells[6],
    ]);
  });
});

describe("Identifying neighbors of a cell", () => {
  const regionSpec = [
    ["a", "a", "a", "a", "a"],
    ["b", "a", "a", "a", "a"],
    ["b", "c", "d", "e", "e"],
    ["c", "c", "c", "e", "e"],
    ["c", "c", "c", "e", "e"],
  ];

  test("An internal cell has 8 neighbors", () => {
    const board = new Board(regionSpec);
    const cell = board.cells[6];

    const neighbors = board.neighbors(cell);

    expect(neighbors.length).toEqual(8);
  });

  test("A corner cell has 3 neighbors", () => {
    const board = new Board(regionSpec);

    expect( board.neighbors(board.cells[0]).length ).toEqual(3);
    expect( board.neighbors(board.cells[4]).length ).toEqual(3);
    expect( board.neighbors(board.cells[20]).length ).toEqual(3);
    expect( board.neighbors(board.cells[24]).length ).toEqual(3);
  });

  test("A non-corner edge cell has 5 neighbors", () => {
    const board = new Board(regionSpec);

    expect( board.neighbors(board.cells[1]).length ).toEqual(5);
    expect( board.neighbors(board.cells[3]).length ).toEqual(5);
    expect( board.neighbors(board.cells[5]).length ).toEqual(5);
    expect( board.neighbors(board.cells[9]).length ).toEqual(5);
    expect( board.neighbors(board.cells[10]).length ).toEqual(5);
    expect( board.neighbors(board.cells[21]).length ).toEqual(5);
  });
});
