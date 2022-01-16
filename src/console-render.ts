import { State } from "../src/state";
import { Board } from "../src/board";

// copied from https://stackoverflow.com/a/41407246
const colors: {[key: string]: string} = {
  "reset": "\x1b[0m",
  "BgBlack": "\x1b[40m",
  "red": "\x1b[41m",
  "green": "\x1b[42m",
  "yellow": "\x1b[43m",
  "blue": "\x1b[44m",
  "magenta": "\x1b[45m",
  "cyan": "\x1b[46m",

  "gray": "\x1b[100m",
  "bright_red": "\x1b[101m",
  "bright_green": "\x1b[102m",
  "bright_yellow": "\x1b[103m",
  "bright_blue": "\x1b[104m",
  "bright_magenta": "\x1b[105m",
}
const colorsToUse = ["red", "green", "yellow", "blue", "magenta", "cyan",
  "gray", "bright_red", "bright_blue", "bright_green", "bright_yellow", "bright_green",
  "bright_magenta",
];

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

