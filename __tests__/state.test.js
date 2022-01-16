const { State } = require("../src/state");

describe("Tracking state", () => {
  test("Create a State to track a given number of cells", () => {
    const numberOfCells = 42;
    const state = new State(numberOfCells);

    expect(state.cellCount).toBe(numberOfCells);
  });

  test("Create a new state based on a Move, without changing original state", () => {
    const state = new State(9);
    const move = {
      changes: [
        {cell: 2, changeTo: "full"}
      ]
    }

    const newState = state.change(move);

    expect(newState).not.toBe(state);
    expect(newState.cellCount).toEqual(state.cellCount);
    expect(state.cell(2)).toBe(undefined);
    expect(newState.cell(2)).toBe("full");
  });

  test("Records the entire history of moves", () => {
    const state = new State(9);
    expect(state.moves.length).toBe(0);

    const move = {
      changes: [
        {cell: 2, changeTo: "full"}
      ]
    }

    let newState = state.change({reason: "only-option-region", changes: [
      {cell: 2, changeTo: "full"},
      {cell: 1, changeTo: "blocked"},
      {cell: 5, changeTo: "blocked"},
    ]});

    expect(newState.moves.length).toBe(1);

    newState = newState.change({reason: "input", changes: [
      {cell: 8, changeTo: "blocked"},
    ]});

    expect(newState.moves.length).toBe(2);
    expect(newState.moves[0].reason).toBe("only-option-region");
    expect(newState.moves[1].reason).toBe("input");
    expect(state.moves.length).toBe(0); // still unchanged
  });
});
