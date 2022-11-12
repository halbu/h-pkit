export class HPNode {
  public f: number;
  public g: number;
  public h: number;
  public m: number;
  public x: number;
  public y: number;
  public id: number;
  public parent: HPNode;
  public static costCardinal = 1;
  public static costDiagonal = Math.SQRT2;
  // public static readonly TWOTOPWR8 = 32768;

  constructor(x: number, y: number, parent: HPNode, diag: boolean) {
    this.x = x;
    this.y = y;
    this.parent = parent;
    this.g = this.parent ? this.parent.g + (diag ? HPNode.costDiagonal : HPNode.costCardinal) : 0;
    this.m = this.parent ? this.parent.m + 1 : 0;
    
    // this.id = ((x + HPNode.TWOTOPWR8) << 16) | (y + HPNode.TWOTOPWR8);
    this.id = (x << 16) | y;
  }
}
