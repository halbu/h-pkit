export class HPBresenham {

  private static brs(x0: number, y0: number, x1: number, y1: number, cb: Function): boolean {
    let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1, sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while (true) {
      if (cb(x0, y0) === false) return false;
      if (x0 === x1 && y0 === y1) return true;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  public static dbrs(x0: number, y0: number, x1: number, y1: number, cb: Function, bd?): boolean {
    return this.brs(x0, y0, x1, y1, cb) || this.brs(x1, y1, x0, y0, cb);
  }

  private static plotBrsLine(x0: number, y0: number, x1: number, y1: number, cb: Function): Array<[number, number]> {
    let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1, sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    if (!cb(x1, y1)) return null;

    let points = new Array<[number, number]>();
    let step = 0;

    while (step++ < 9999 /* sanity constant */) {
      if (cb(x0, y0) === false) return null;
      points.push([x0, y0]);

      if ((x0 === x1) && (y0 === y1)) { break; }

      const err2 = 2 * err;

      if (err2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (err2 < dx) {
        err += dx;
        y0 += sy;
      }
    }

    return points;
  }

  public static getLine(x0: number, y0: number, x1: number, y1: number, cb: Function, bd?: boolean): Array<[number, number]> {
    const outbound = this.plotBrsLine(x0, y0, x1, y1, cb);
    if (outbound) {
      return outbound;
    }
    
    if (bd) {
      let inbound = this.plotBrsLine(x1, y1, x0, y0, cb);
      if (inbound) {
        return inbound.reverse();
      }
    }

    return null;
  }
}