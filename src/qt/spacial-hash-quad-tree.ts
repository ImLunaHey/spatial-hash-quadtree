import { Quadtree, Rectangle } from './quad-tree';

const round = (v: number) => Math.sign(v) * Math.round(Math.abs(v));

export class SpatialHashQuadtree<T> {
  public readonly cellSize: number;
  public readonly map: Map<string, Quadtree<T>>;

  constructor(cellSize: number = 1) {
    this.cellSize = cellSize;
    this.map = new Map();
  }

  private hash(bounds: Rectangle): string {
    const col = round(bounds.x / this.cellSize);
    const row = round(bounds.y / this.cellSize);
    return `${col},${row}`;
  }

  insert(bounds: Rectangle, data: T): void {
    const hashKey = this.hash(bounds);
    if (!this.map.has(hashKey)) {
      const cellBoundary = {
        x: round(bounds.x / this.cellSize) * this.cellSize,
        y: round(bounds.y / this.cellSize) * this.cellSize,
        width: this.cellSize,
        height: this.cellSize,
      };
      this.map.set(hashKey, new Quadtree<T>(cellBoundary, 4));
    }
    this.map.get(hashKey)!.insert({ bounds, data });
  }

  query(range: Rectangle): { bounds: Rectangle; data: T }[] {
    const found: { bounds: Rectangle; data: T }[] = [];
    const rangeBounds = {
      x: round(range.x / this.cellSize) * this.cellSize,
      y: round(range.y / this.cellSize) * this.cellSize,
      width: range.width,
      height: range.height,
    };

    for (const quadtree of Array.from(this.map.values())) {
      const objects = quadtree.query(rangeBounds);
      if (objects) {
        for (const object of objects) {
          found.push(object);
        }
      }
    }

    return found;
  }

  visualise(ctx: CanvasRenderingContext2D): void {
    for (const [hash, quadtree] of Array.from(this.map.entries())) {
      quadtree.visualise(ctx);

      // Red index number in the top left of the cell, where the "point" is
      const [col, row] = hash.split(',').map(Number);

      // Draw the index number
      ctx.fillStyle = 'red';
      ctx.font = '16px sans-serif';
      ctx.fillText(hash, col * this.cellSize, row * this.cellSize + 16);

      // Draw the boundary of the cell
      ctx.strokeStyle = 'red';
      ctx.strokeRect(col * this.cellSize, row * this.cellSize, this.cellSize, this.cellSize);
    }
  }
}
