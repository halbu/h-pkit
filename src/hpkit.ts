import { HPNode } from './hpkit-node';
import { HPBinaryHeap } from './hpkit-binary-heap';
import { HPHeuristic } from './hpkit-heuristic';
import { HPBresenham } from './hpkit-bresenham';
import { HPStringPull } from './hpkit-string-pulling';

enum SmoothingType { SKIP, NOSKIP, TWIN_PASS }

export class HPKit {
  private open: HPBinaryHeap<HPNode>;
  private closed: Map<number, boolean>;
  private preferBresenham: boolean = false;
  private pullStrings: boolean = false;
  private permitDiagonals: boolean = true;
  private enforceMaxCost: boolean = false;
  private maxCost: number = Number.MAX_SAFE_INTEGER;
  private enforceMaxMoves: boolean = false;
  private maxMoves: number = Number.MAX_SAFE_INTEGER;
  private cb: Function;

  // Using naturalisation post-processing options other than TWIN_PASS will
  // result in non-natural paths in some rare edge cases. They are included here
  // as options that you can force if you know what you're doing and are
  // interested in experimenting with how and why they fail. They are not for
  // production use. Do not change this except to tinker on a development build.
  private smoothingType: SmoothingType = SmoothingType.TWIN_PASS;

  private abs = (n) => ((n ^ (n >> 31)) - (n >> 31));
  private heuristic = (dx: number, dy: number) => HPHeuristic.octile(dx, dy);

  public getPath(ox: number, oy: number, tx: number, ty: number, walkableCallback: Function): Array<[number, number]> {
    this.open = new HPBinaryHeap(
      (n: HPNode) => n.f,
      (a: HPNode, b: HPNode) => a.id === b.id
    );
    this.closed = new Map<number, boolean>();
    this.cb = walkableCallback;

    if (!this.cb(ox, oy) || !this.cb(tx, ty)) return null;

    if (this.preferBresenham) {
      const brsTest = HPBresenham.dbrs(ox, oy, tx, ty, this.cb);
      if (brsTest) {
        let path = HPBresenham.getLine(ox, oy, tx, ty, this.cb, true);
        path.shift();
        return path;
      }
    }

    this.open.push(new HPNode(ox, oy, null, false));

    while (this.open.size() > 0) {
      let currentNode = this.open.pop();
      this.closed.set(currentNode.id, true);

      if (currentNode.x === tx && currentNode.y === ty) {
        let unpulledPath = this.retracePath(currentNode);
        if (this.pullStrings) {
          // String pulling should start from the origin, not from the first
          // point of the found path. As a fudge, we unshift the origin onto the
          // front of the path, apply post-processing, and then shift it off
          // again at the end
          unpulledPath.unshift([ox, oy]);

          // Apply the selected type of path naturalisation post-processing
          let pulledPath: Array<[number, number]>;
          if (this.smoothingType === SmoothingType.TWIN_PASS) {
            pulledPath = HPStringPull.stringPull(unpulledPath, this.cb, true);
            pulledPath = HPStringPull.stringPull(pulledPath, this.cb, false);
          } else if (this.smoothingType === SmoothingType.SKIP) {
            pulledPath = HPStringPull.stringPull(unpulledPath, this.cb, false);
          } else if (this.smoothingType === SmoothingType.NOSKIP) {
            pulledPath = HPStringPull.stringPull(unpulledPath, this.cb, true);
          }
          pulledPath.shift();
          return pulledPath;
        }
        return unpulledPath;
      } else {
        for (var i = -1; i <= 1; ++i) {
          for (var j = -1; j <= 1; ++j) {
            if (i === 0 && j === 0) continue;

            const isDiagonal = !((i + j) & 1);

            if (!this.permitDiagonals && isDiagonal) continue;

            const nx = currentNode.x + i;
            const ny = currentNode.y + j;

            if (!this.cb(nx, ny)) continue;
            if (this.closed.has((nx << 16) | ny)) continue;

            if (this.enforceMaxCost) {
              const testG = currentNode.g + (isDiagonal ? HPNode.costDiagonal : HPNode.costCardinal);
              if (testG > this.maxCost) continue;
            }

            if (this.enforceMaxMoves) {
              if (currentNode.m >= this.maxMoves) continue;
            }
            
            let neighbour = new HPNode(nx, ny, currentNode, isDiagonal);

            let match = this.open.inspect(neighbour);
            if (match) {
              if (match.g > neighbour.g) {
                neighbour.h = this.heuristic(this.abs(neighbour.x - tx), this.abs(neighbour.y - ty));
                neighbour.f = neighbour.g + neighbour.h;
                this.open.modify(neighbour);
              }
            } else {
              neighbour.h = this.heuristic(this.abs(neighbour.x - tx), this.abs(neighbour.y - ty));
              neighbour.f = neighbour.g + neighbour.h;
              this.open.push(neighbour);
            }
          }
        }
      }
    }
    return null;
  }

  private retracePath(pathEnd: HPNode): Array<[number, number]> {
    let path = new Array<[number, number]>();
    let trace = pathEnd;
    while (trace.parent !== null) {
      path.push([trace.x, trace.y]);
      trace = trace.parent;
    }
    return path.reverse();
  }

  /**
   * Configuration methods after this point
   */
  public allowDiagonals(pref: boolean): void {
    if (!pref && this.pullStrings) {
      throw new Error(`Can't prohibit diagonal movement while string pulling is enabled.`)
    }
    if (!pref && this.preferBresenham) {
      throw new Error(`Can't prohibit diagonal movement while straight-line pathing is enabled.`)
    }
    this.permitDiagonals = pref;
  }

  public setHeuristic(heuristic: string): void {
    switch(heuristic.toLowerCase()) {
      case `manhattan`: this.heuristic = HPHeuristic.manhattan; break;
      case `octile`: this.heuristic = HPHeuristic.octile; break;
      case `euclidean`: this.heuristic = HPHeuristic.euclidean; break;
      case `chebyshev`: this.heuristic = HPHeuristic.chebyshev; break;
      default: throw new Error(`Unrecognised heuristic requested.`);
    }
  }

  public setMoveCosts(costCardinal: number, costDiagonal: number): void {
    HPNode.costCardinal = costCardinal;
    HPNode.costDiagonal = costDiagonal;
  }

  public setMaxCost(maxCost: number): void {
    if (maxCost < 0) throw new Error(`Can't specify a negative value for maximum path cost.`)
    this.enforceMaxCost = maxCost > 0;
    this.maxCost = maxCost;
  } 

  public setMaxMoves(maxNodes: number): void {
    if (maxNodes < 0) throw new Error(`Can't specify a negative value for maximum nodes traversed.`)
    this.enforceMaxMoves = maxNodes > 0;
    this.maxMoves = maxNodes;
  }

  public preferStraightLinePath(pref: boolean): void {
    if (!this.permitDiagonals && pref) {
      throw new Error(`Direct line-of-sight pathing can't be enabled while diagonal movement is prohibited.`);
    }
    this.preferBresenham = pref;
  }

  public applyStringPulling(pref: boolean): void {
    if (!this.permitDiagonals && pref) {
      throw new Error(`String pulling can't be enabled while diagonal movement is prohibited.`);
    }
    this.pullStrings = pref;
  }

  // public setSmoothingType(pref: string): void {
  //   switch(pref.toLowerCase()) {
  //     case 'skip': this.smoothingType = SmoothingType.SKIP; break;
  //     case 'noskip': this.smoothingType = SmoothingType.NOSKIP; break;
  //     case 'no-skip': this.smoothingType = SmoothingType.NOSKIP; break;
  //     case 'no_skip': this.smoothingType = SmoothingType.NOSKIP; break;
  //     case 'twin': this.smoothingType = SmoothingType.TWIN_PASS; break;
  //     case 'twinpass': this.smoothingType = SmoothingType.TWIN_PASS; break;
  //     case 'twin-pass': this.smoothingType = SmoothingType.TWIN_PASS; break;
  //     case 'twin_pass': this.smoothingType = SmoothingType.TWIN_PASS; break;
  //     case 'dual': this.smoothingType = SmoothingType.TWIN_PASS; break;
  //     default: break;
  //   };
  // }
}