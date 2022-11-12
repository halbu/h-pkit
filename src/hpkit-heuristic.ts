export class HPHeuristic {
  private static readonly SQRT2MINUS2 = (Math.SQRT2 - 2);
  
  static manhattan(dx, dy): number {
    return dx + dy;
  }

  static euclidean(dx, dy): number {
    return Math.sqrt(dx*dx + dy*dy);
  }

  static octile(dx, dy): number {
    return (dx + dy) + (HPHeuristic.SQRT2MINUS2) * Math.min(dx, dy);
  }

  static chebyshev(dx, dy): number {
    return Math.max(dx, dy);
  }
}