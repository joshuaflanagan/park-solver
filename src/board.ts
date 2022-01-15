/*
 * State - array of cell states: free, blocked, full
 * Board
 *  - init with
 *      "size" - length of one side. num cells will be size * size
 *      = NO - instead of size, pass an array of "regions" (array of coords?) - the number of regions == size
 *      = NO - pass an array of arrays of characters. each region is represented by a unique character
 *      [
 *        ["a", "a", "a", "b", "b"],
 *        ["a", "c", "c", "c", "b"],
 *        ["d", "c", "c", "e", "b"],
 *        ["d", "d", "c", "e", "b"],
 *        ["d", "c", "c", "e", "e"],
 *       ]
 *      "fillcount" - number of trees to resolve each area. start with 1
 *
 *  - enumerable cells
 *  - array of rows
 *  - array of columns
 *  - array of regions
 * Cell
 *  - belongs to row
 *  - belongs to column
 *  - belongs to region
 * Column
 *  - array of cells
 *  - numfree(state) - returns number of free cells. useful to check for 1
 *  - resolved(state): bool - true if it has the required number of fulls
 *  (can it ask its board for required number of fulls?)
 * Row
 *  - array of cells
 *  - numfree(state)
 *  - resolved(state): bool - true if it has the required number of fulls
 * Region
 *  - array of cells
 *  - numfree(state)
 *  - isLine(state) - if it is inline, return the col or row - block out any cell not belonging to this region
 *  - resolved(state): bool - true if it has the required number of fulls
 *
 * for each free cell, create a state from current + this one full
 *   now check 
 *   - any (unresolved) region left without empty cells
 *   - any (unresolved) row left without empty cells
 *   - any (unresolved) col left without empty cells
 *
*/

import { State } from "./state";
const util = require('util');

type RegionSpec = Array<string[]>

export class Container {
  id: string;
  cells: Cell[];

  constructor(id: string){
    this.id = id;
    this.cells = [];
  }

  freeCells(state: State): Cell[]{
    return this.cells.filter(cell => !cell.state(state));
  }

  addCell(cell: Cell){
    this.cells.push(cell);
  }
}

export class Cell {
  board: Board;
  index: number;
  label: string;

  constructor(board: Board, index: number, label: string){
    this.board = board;
    this.index = index;
    this.label = label;
  }

  region() {
    return this.board.regionForCell(this.index);
  }

  row() {
    return this.board.rowForCell(this.index);
  }

  col() {
    return this.board.colForCell(this.index);
  }

  state(currentState: State){
    return currentState[this.index];
  }

  [util.inspect.custom](){
    return this.label;
  }
}

export class Board {
  size: number;
  fillCount: number;
  cells: Cell[];
  rows: Container[];
  cols: Container[];
  regions: Container[];
  regionsByLabel: { [key: string]: Container };
  regionsByCellIndex: { [key: number]: Container };

  constructor(regionSpec: RegionSpec, fillCount: number=1){
    this.size = regionSpec.length;
    this.fillCount = fillCount;
    this.cells = [];
    this.rows = [];
    this.cols = [];
    this.regions = [];
    this.regionsByLabel = {};
    this.regionsByCellIndex = {};

    for(let i=0; i<this.size; i++){
      this.rows.push(new Container(i.toString()));
      this.cols.push(new Container(i.toString()));
    }
    for(let r=0; r<this.size; r++){
      const row = this.rows[r];
      const rowSpec = regionSpec[r];
      if (rowSpec.length !== this.size){
        throw new Error(`Invalid number of cells in row ${r}. There are ${this.size} rows, so expected ${this.size} cells in each row. Row has: ${rowSpec}`);
      }
      for(let c=0; c<this.size; c++){
        const col = this.cols[c];
        const regionLabel = rowSpec[c];
        let region = this.regionsByLabel[regionLabel];
        if (!region){
          region = new Container(regionLabel);
          this.regions.push(region);
          this.regionsByLabel[regionLabel] = region;
        }
        const label = `${col.id},${row.id},${region.id}`;
        const cell = new Cell(this, this.cells.length, label);
        this.cells.push(cell);
        this.regionsByCellIndex[cell.index] = region;
        region.addCell(cell);
        row.addCell(cell);
        col.addCell(cell);
      }
    }
    if (Object.keys(this.regionsByLabel).length !== this.size){
      throw new Error(`Invalid number of regions. Found ${Object.keys(this.regionsByLabel)}, expected ${this.size}`);
    }
  }

  regionForCell(index: number): Container{
    return this.regionsByCellIndex[index];
  }

  rowForCell(index: number): Container{
    return this.cols[Math.floor(index / this.size)];
  }

  colForCell(index: number): Container{
    return this.rows[index % this.size];
  }

  neighbors(cell: Cell): Cell[] {
    const result = [];
    const index = cell.index;
    const row = index % this.size;
    const col = Math.floor(index / this.size);
    const boundary = this.size - 1;
    // Return neighbors in clockwise order

    if (row > 0){
      if (col > 0){
        // NW
        result.push(this.cells[ (row - 1) * this.size + col - 1 ])
      }

      // N
      result.push(this.cells[ (row - 1) * this.size + col ])

      if (col < boundary) {
        // NE
        result.push(this.cells[ (row - 1) * this.size + col + 1 ])
      }
    }
    if (col < boundary) {
      // east
      result.push(this.cells[ row * this.size + col + 1 ])
    }
    if (row < boundary){
      if (col !== boundary) {
        // SE
        result.push(this.cells[ (row + 1) * this.size + col + 1 ])
      }

      // S
      result.push(this.cells[ (row + 1) * this.size + col ])

      if (col > 0){
        // SW
        result.push(this.cells[ (row + 1) * this.size + col - 1 ])
      }
    }
    if (col > 0){
      // west
      result.push(this.cells[ row * this.size + col - 1 ])
    }
    return result;
  }

  createState(){
    return new Array(this.cells.length);
  }
}
