# park-solver

This is an experiment to try and build a solver for the [Parks logic games](https://apps.apple.com/us/app/parks-seasons-logic-game/id774881410)
by Andrea Sabbatini.

## Puzzle overview

Each puzzle is a square grid made up of `n` cells per side, and the cells are
grouped into `n` colored regions (or, "parks"). For example, a 5x5 grid would
have 5 different colored regions. The objective is to place a single marker
("tree") in each row, column, and region. The only other rules is that two
markers cannot be in adjacent cells - including diagnols.

Each puzzle can be solved through a logical series of steps - there should
not be any guessing.

## Solver overview

This program attempts to codify the logic needed to solve a puzzle. It is
intentionally _not_ a brute-force solver, which would be relatively easy,
considering the grids are usually not very big. I want the solver to take the
same steps that a human would, and be able to _explain_ them.
When playing the game I would sometimes get stuck and I would wonder if it is
because there is some strategy I haven't thought of yet, or if I'm just not
noticing where one of the strategies could be applied. By using this program
as a hint provider, I can know for sure.

The game itself includes a Hint function, but it just places a piece for you,
without explaining why, so you don't really learn from it.

My goal is for it to tell you the next move to make, and teach you why.

## Status

The solver can solve most of the easy/medium puzzles. I have not yet attempted
to implement solving for the variation where there are 2 or 3 markers per
row/col/region. There are some single marker puzzles that it still cannot solve
and I'm not sure if that's because I haven't identified a strategy yet, or if
some puzzles _require_ "look ahead". "Look ahead" is a move that cannot be
determined just by looking at the current state - it requires making a move (or
moves) first, and then evaluating the new state to make a determination.
I have not implemented "look ahead" yet, as it is a form of brute-force. I will
likely implement it with limited "sight" (ex: look a maximum 2 moves ahead) to
see if that resolves the harder puzzles.
If I had implemented "look ahead" too early, it would have glossed over the
need to identify more specific strategies that just look at the current state.

## Usage

Currently, solving a puzzle requires changing the source code. Specifically,
edit the `const regionSpec` in `src/index.ts`. It should be an array of strings,
where each character represents the "name" of a region. It doesn't matter which
characters you use for the regions, just that they uniquely identify a region.
For a 5x5 grid, you will have an array with 5 elements, each element will be
a string with 5 characters, and the all strings combined will only use 5 unique
characters.

To run:

```
yarn start
```

## Tests

```
yarn test
```
