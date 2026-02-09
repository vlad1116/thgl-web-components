/**
 * A simple spatial grid for efficient proximity queries.
 * Divides 2D space into cells and allows querying markers within a radius.
 *
 * Performance: O(1) for add/remove, O(k) for getNearby where k is markers in nearby cells
 * vs O(n) for brute force where n is total markers.
 */
export class SpatialGrid<T> {
  private cells = new Map<string, Set<T>>();
  private itemCells = new Map<T, string>(); // Track which cell each item is in
  private cellSize: number;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
  }

  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX}:${cellY}`;
  }

  /**
   * Add an item to the grid at the given position
   */
  add(item: T, x: number, y: number): void {
    const key = this.getCellKey(x, y);

    // Remove from old cell if it was already in the grid
    const oldKey = this.itemCells.get(item);
    if (oldKey && oldKey !== key) {
      const oldCell = this.cells.get(oldKey);
      if (oldCell) {
        oldCell.delete(item);
        if (oldCell.size === 0) {
          this.cells.delete(oldKey);
        }
      }
    }

    // Add to new cell
    let cell = this.cells.get(key);
    if (!cell) {
      cell = new Set();
      this.cells.set(key, cell);
    }
    cell.add(item);
    this.itemCells.set(item, key);
  }

  /**
   * Remove an item from the grid
   */
  remove(item: T): void {
    const key = this.itemCells.get(item);
    if (key) {
      const cell = this.cells.get(key);
      if (cell) {
        cell.delete(item);
        if (cell.size === 0) {
          this.cells.delete(key);
        }
      }
      this.itemCells.delete(item);
    }
  }

  /**
   * Update an item's position in the grid
   */
  update(item: T, x: number, y: number): void {
    this.add(item, x, y); // add() handles the update case
  }

  /**
   * Get all items within maxDistance of the given point.
   * Returns items that MIGHT be within range - caller should do final distance check.
   */
  getNearby(x: number, y: number, maxDistance: number): T[] {
    const results: T[] = [];

    // Calculate how many cells we need to check in each direction
    const cellRadius = Math.ceil(maxDistance / this.cellSize);
    const centerCellX = Math.floor(x / this.cellSize);
    const centerCellY = Math.floor(y / this.cellSize);

    // Check all cells within the radius
    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        const key = `${centerCellX + dx}:${centerCellY + dy}`;
        const cell = this.cells.get(key);
        if (cell) {
          for (const item of cell) {
            results.push(item);
          }
        }
      }
    }

    return results;
  }

  /**
   * Clear all items from the grid
   */
  clear(): void {
    this.cells.clear();
    this.itemCells.clear();
  }

  /**
   * Get total number of items in the grid
   */
  get size(): number {
    return this.itemCells.size;
  }

  /**
   * Rebuild the grid with a new cell size
   */
  rebuild(
    newCellSize: number,
    getPosition: (item: T) => [number, number],
  ): void {
    const items = Array.from(this.itemCells.keys());
    this.cellSize = newCellSize;
    this.cells.clear();
    this.itemCells.clear();

    for (const item of items) {
      const [x, y] = getPosition(item);
      this.add(item, x, y);
    }
  }
}
