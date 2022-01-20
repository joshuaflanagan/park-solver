# Example

Given a board described as:

```
    const regionSpec = [
      "aaaaa",
      "baaaa",
      "bcdee",
      "cccee",
      "cccee"
    ];
```

It could be rendered as:

<img width="164" alt="image" src="https://user-images.githubusercontent.com/81455/150269926-47d88016-2779-4bef-8192-5e2c2ff9c826.png">

These are the steps you could take to solve the puzzle.

1) Fill the blue cell in the middle, since it is the only cell availble in the `d` region.
Now you can mark all the cells immediately surrounding it as blocked, since the adjacency
rule tells us they cannot be filled. We can also block all of the other cells in its row
and column, since we know there can be only one tree in each row and column.

The board now looks something like:

<img width="164" alt="image" src="https://user-images.githubusercontent.com/81455/150270205-96a78a64-56d8-4f59-b2c1-349e4b60b178.png">

The solver (at the time these images were taken) marks each tree with a `Ÿ`, each blocked cell with a dot.
It also underlines each cell that was changed in a given move.

2) We can now see that the green (`b`) region only has one option, so we can fill that in, and block the surrounding cells as we did before.

<img width="164" alt="image" src="https://user-images.githubusercontent.com/81455/150270375-d346eb66-eee0-4d10-bfdb-f8ddf3b5ccf5.png">

3) There is now only one option in the yellow (`c`) region
4) There is now only one option in the pink (`e`) region.
5) There is now only one option in the red (`a`) region.

<img width="164" alt="image" src="https://user-images.githubusercontent.com/81455/150270560-f61dc484-3d0b-4566-8754-1323bcb54079.png">

And the puzzle is solved!
