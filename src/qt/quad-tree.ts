type Point = {
  x: number;
  y: number;
};

type Size = {
  width: number;
  height: number;
};

export type Rectangle = Point & Size;

const getThemeMode = () =>
  typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

export class Quadtree<T> {
  private boundary: Rectangle;
  private capacity: number;
  private objects: Array<{ bounds: Rectangle; data: T }>;
  private divided: boolean;
  private topLeft?: Quadtree<T>;
  private topRight?: Quadtree<T>;
  private bottomLeft?: Quadtree<T>;
  private bottomRight?: Quadtree<T>;

  constructor(boundary: Rectangle, capacity: number = 4) {
    this.boundary = boundary;
    this.capacity = capacity;
    this.objects = [];
    this.divided = false;
  }

  private split(): void {
    const x = this.boundary.x;
    const y = this.boundary.y;
    const w = this.boundary.width / 2;
    const h = this.boundary.height / 2;

    this.topLeft = new Quadtree<T>({ x, y, width: w, height: h }, this.capacity);
    this.topRight = new Quadtree<T>({ x: x + w, y, width: w, height: h }, this.capacity);
    this.bottomLeft = new Quadtree<T>({ x, y: y + h, width: w, height: h }, this.capacity);
    this.bottomRight = new Quadtree<T>({ x: x + w, y: y + h, width: w, height: h }, this.capacity);

    this.divided = true;
  }

  insert(item: { bounds: Rectangle; data: T }): boolean {
    if (!this.intersects(this.boundary, item.bounds)) {
      return false;
    }

    if (this.objects.length < this.capacity) {
      this.objects.push(item);
      return true;
    }

    if (!this.divided) {
      this.split();
    }

    if (this.topLeft!.insert(item)) return true;
    if (this.topRight!.insert(item)) return true;
    if (this.bottomLeft!.insert(item)) return true;
    if (this.bottomRight!.insert(item)) return true;

    return false;
  }

  query(range: Rectangle): Array<{ bounds: Rectangle; data: T }> | undefined {
    const found: Array<{ bounds: Rectangle; data: T }> = [];

    if (!this.intersects(this.boundary, range)) {
      return;
    }

    for (const object of this.objects) {
      if (this.intersects(object.bounds, range)) {
        found.push(object);
      }
    }

    if (this.divided) {
      const topLeft = this.topLeft!.query(range);
      if (topLeft) found.push(...topLeft);

      const topRight = this.topRight!.query(range);
      if (topRight) found.push(...topRight);

      const bottomLeft = this.bottomLeft!.query(range);
      if (bottomLeft) found.push(...bottomLeft);

      const bottomRight = this.bottomRight!.query(range);
      if (bottomRight) found.push(...bottomRight);
    }

    return found;
  }

  private intersects(a: Rectangle, b: Rectangle): boolean {
    return !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
  }

  public visualise(ctx: CanvasRenderingContext2D): void {
    // Draw the boundary
    ctx.strokeStyle = getThemeMode() === 'dark' ? 'white' : 'black';
    ctx.strokeRect(this.boundary.x, this.boundary.y, this.boundary.width, this.boundary.height);

    // Draw the points
    for (const object of this.objects) {
      ctx.fillStyle = getThemeMode() === 'dark' ? 'white' : 'black';
      ctx.fillRect(object.bounds.x, object.bounds.y, object.bounds.width, object.bounds.height);
    }

    // Recurse
    if (this.divided) {
      this.topLeft!.visualise(ctx);
      this.topRight!.visualise(ctx);
      this.bottomLeft!.visualise(ctx);
      this.bottomRight!.visualise(ctx);
    }
  }
}
