/**
 * Binary heap implementation from Eloquent Javascript:
 * https://eloquentjavascript.net/1st_edition/appendix2.html
 * Translated to Typescript and expanded upon a bit
 */
export class HPBinaryHeap<T> {
  private content: Array<T>;
  private scoreFn: (x: T) => number;
  private equalityFn: (x: T, y: T) => boolean;

  constructor(scoreFn: (x: T) => number, equalityFn: (x: T, y: T) => boolean) {
    this.content = new Array<T>();
    this.scoreFn = scoreFn;
    this.equalityFn = equalityFn;
  }

  public contains(n: T): boolean {
    const len = this.content.length;
    for (let i = 0; i !== len; ++i) {
      const testElement = this.content[i];
      if (this.equalityFn(testElement, n)) { return true; }
    }
    return false;
  }

  public inspect(n: T): Readonly<T> {
    const len = this.content.length;
    for (let i = 0; i !== len; ++i) {
      const testElement = this.content[i];
      if (this.equalityFn(testElement, n)) { return testElement; }
    }
    return null;
  }

  public modify(n: T): void {
    const len = this.content.length;
    for (let i = 0; i !== len; ++i) {
      if (this.equalityFn(this.content[i], n)) {
        this.content[i] = n;
        if (i === len - 1) { break; }
        this.bubbleUp(i);
        this.sinkDown(i);
        return;
      }
    }
    return null;
  }

  public push(n: T): void {
    this.content.push(n);
    this.bubbleUp(this.content.length - 1);
  }

  public pop(): T {
    let result = this.content[0];
    let end = this.content.pop();
    if (this.content.length > 0) {
      this.content[0] = end;
      this.sinkDown(0);
    }
    return result;
  }

  public remove(n: T): void {
    const len = this.content.length;
    for (let i = 0; i < len; i++) {
      if (!this.equalityFn(this.content[i], n)) { continue; }
      let end = this.content.pop();
      if (i === len - 1) { break; }
      this.content[i] = end;
      this.bubbleUp(i);
      this.sinkDown(i);
      break;
    }
  }

  public size(): number {
    return this.content.length;
  }

  private bubbleUp(n: number): void {
    let element = this.content[n];
    let score = this.scoreFn(element);

    while (n > 0) {
      let parentN = (n - 1) >>> 1;
      let parent = this.content[parentN];

      if (score >= this.scoreFn(parent)) {
        break;
      }

      this.content[parentN] = element;
      this.content[n] = parent;
      n = parentN;
    }
  }

  private sinkDown(n: number): void {
    let len = this.content.length,
      element = this.content[n],
      elemScore = this.scoreFn(element);

    while (true) {
      let child2N = (n + 1) << 1
      let child1N = child2N - 1;

      let swap = null;
      let child1Score = null;

      if (child1N < len) {
        let child1 = this.content[child1N];
        child1Score = this.scoreFn(child1);
        if (child1Score < elemScore) {
          swap = child1N;
        }
      }
      if (child2N < len) {
        let child2 = this.content[child2N],
          child2Score = this.scoreFn(child2);

        if (child2Score < (swap === null ? elemScore : child1Score)) {
          swap = child2N;
        }
      }

      if (swap === null) { break; }

      this.content[n] = this.content[swap];
      this.content[swap] = element;
      n = swap;
    }
  }
}
