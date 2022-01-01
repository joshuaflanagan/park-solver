import { Board } from "../src/board";

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

  test("Each cell is associated with a region", () => {
    const board = new Board(validRegionSpec);
    expect(board.cells[0].region.id).toEqual("a");
    expect(board.cells[3].region.id).toEqual("b");
    expect(board.cells[6].region.id).toEqual("c");
  });

  test("A valid board has 'size' regions", () => {
    const board = new Board(validRegionSpec);
    expect(Object.keys(board.regions).length).toEqual(board.size);
  });

  test("Each cell is associated with a Row", () => {
    const board = new Board(validRegionSpec);
    expect(board.cells[0].row.id).toEqual("0");
    expect(board.cells[1].row.id).toEqual("0");
    expect(board.cells[6].row.id).toEqual("1");
    expect(board.cells[10].row.id).toEqual("2");
    expect(board.cells[15].row.id).toEqual("3");
    expect(board.cells[24].row.id).toEqual("4");
  });

  test("A valid board has 'size' rows", () => {
    const board = new Board(validRegionSpec);
    expect(board.rows.length).toEqual(board.size);
  });

  test("Each cell is associated with a Col", () => {
    const board = new Board(validRegionSpec);
    expect(board.cells[0].col.id).toEqual("0");
    expect(board.cells[1].col.id).toEqual("1");
    expect(board.cells[4].col.id).toEqual("4");
    expect(board.cells[5].col.id).toEqual("0");
    expect(board.cells[7].col.id).toEqual("2");
    expect(board.cells[13].col.id).toEqual("3");
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
