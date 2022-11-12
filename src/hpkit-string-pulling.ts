import { HPBresenham } from "./hpkit-bresenham";

export class HPStringPull {

  public static stringPull(path: Array<[number, number]>, cb: Function, skip?: boolean): Array<[number, number]> {

    skip = skip || false;

    for (let i = 0; i < path.length; ++i) {
      let foundPullableSegment = false;
      let sei: number; // Segment end index

      for (let j = i + 1; j <= path.length; ++j) {
        if (j === path.length) {
          if (foundPullableSegment) {
            let pulledSegment = HPBresenham.getLine(path[i][0], path[i][1], path[path.length - 1][0], path[path.length - 1][1], cb, true);
            path.splice(i, (j - 1), ...pulledSegment);
          }
          return path;
        }

        if (HPBresenham.dbrs(path[i][0], path[i][1], path[j][0], path[j][1], cb)) {
          foundPullableSegment = true;
          sei = j;
        } else if (foundPullableSegment) {
          let pulledSegment = HPBresenham.getLine(path[i][0], path[i][1], path[sei][0], path[sei][1], cb, true);

          path.splice(i, (sei - i), ...pulledSegment);
          if (!skip) {
            i = sei - 1;
          }
          break;
        }
      }
    }

    return path;
  }
}