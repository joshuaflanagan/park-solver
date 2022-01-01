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

type RegionSpec = Array<string[]>

class Row {
  id: string;
  constructor(id: string){
    this.id = id.toString();
  }
}
class Col {
  id: string;
  constructor(id: string){
    this.id = id;
  }
}
class Region {
  id: string;

  constructor(id: string){
    this.id = id;
  }
}

class Cell {
  row: Row;
  col: Col;
  region: Region;
  constructor(region: Region, row: Row, col: Col){
    this.region = region;
    this.row = row;
    this.col = col;
  }
}

export class Board {
  size: number;
  fillCount: number;
  cells: Cell[];
  rows: Row[];
  cols: Col[];
  regions: { [key: string]: Region };

  constructor(regionSpec: RegionSpec, fillCount: number=1){
    this.size = regionSpec.length;
    this.fillCount = fillCount;
    this.cells = [];
    this.rows = [];
    this.cols = [];
    this.regions = {};
    for(let i=0; i<this.size; i++){
      this.rows.push(new Row(i.toString()));
      this.cols.push(new Col(i.toString()));
    }
    for(let r=0; r<this.size; r++){
      const row = this.rows[r];
      const rowSpec = regionSpec[r];
      if (rowSpec.length !== this.size){
        throw new Error(`Invalid number of cells in row ${r}. There are ${this.size} rows, so expected ${this.size} cells in each row. Row has: ${rowSpec}`);
      }
      for(let c=0; c<this.size; c++){
        const col = this.cols[c];
        const regionId = rowSpec[c];
        let region = this.regions[regionId];
        if (!region){
          region = new Region(regionId);
          this.regions[regionId] = region;
        }
        this.cells.push(new Cell(region, row, col));
      }
    }
    if (Object.keys(this.regions).length !== this.size){
      throw new Error(`Invalid number of regions. Found ${Object.keys(this.regions)}, expected ${this.size}`);
    }
  }
}
