import { State } from "../src/state";
import { Board } from "../src/board";

const colors: {[key: string]: string} = {
  "reset": "\x1b[0m",
  "BgBlack": "\x1b[40m",
  "red": "\x1b[41m",
  "green": "\x1b[42m",
  "yellow": "\x1b[43m",
  "blue": "\x1b[44m",
  "magenta": "\x1b[45m",
  "cyan": "\x1b[46m",
}
const colorsToUse = ["red", "green", "yellow", "blue", "magenta", "cyan"];

export function render(board: Board, state: State, highlights: number[]){
  const regionColors: {[key: string]: string} = {};

  for(let r=0; r<board.size; r++){
    let row = "";
    for(let c=0;c<board.size; c++){
      const cell = board.cells[ r*board.size + c ];
      const cellVal = state.cell(cell.index);
      let color = regionColors[cell.region().label];
      if (!color){
        color = colorsToUse[Object.keys(regionColors).length];
        regionColors[cell.region().label] = color;
      }
      let rval = cell.region().label;

      switch(cellVal){
        case "blocked":
          rval = "·";
          break;
        case "full":
          rval = "Ÿ";
          break;
        default:
          rval = "█";
          break;
      }
      row += `${colors[color]} ${rval} ${colors.reset}`;
    }
    console.log(row);
  }
  console.log();
}

