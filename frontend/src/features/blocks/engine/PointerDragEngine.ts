import { ScratchBlockData, SnapTarget, ViewportState } from '../types/scratchBlock';

export interface DragState {
  isDragging: boolean;
  blockId: string | null;
  paletteType: string | null;
  startPointerX: number;
  startPointerY: number;
  currentPointerX: number;
  currentPointerY: number;
  blockOffsetX: number;
  blockOffsetY: number;
  snapTarget: SnapTarget | null;
}

export class PointerDragEngine {
  private rafId: number | null = null;
  private snapThreshold: number = 25; // 25px magnetic snap radius

  /** Transform client screen coordinates (clientX, clientY) to infinite Canvas coordinates */
  public screenToCanvas(
    clientX: number,
    clientY: number,
    rect: DOMRect,
    viewport: ViewportState
  ): { x: number; y: number } {
    return {
      x: (clientX - rect.left - viewport.x) / viewport.zoom,
      y: (clientY - rect.top - viewport.y) / viewport.zoom,
    };
  }

  /** Transform canvas coordinates to screen pixel coordinates */
  public canvasToScreen(
    canvasX: number,
    canvasY: number,
    rect: DOMRect,
    viewport: ViewportState
  ): { x: number; y: number } {
    return {
      x: rect.left + viewport.x + canvasX * viewport.zoom,
      y: rect.top + viewport.y + canvasY * viewport.zoom,
    };
  }

  /**
   * Find nearest valid magnetic snap connection point for a dragged block
   */
  public findSnapTarget(
    draggedBlock: ScratchBlockData,
    dragCanvasX: number,
    dragCanvasY: number,
    allBlocks: Record<string, ScratchBlockData>
  ): SnapTarget | null {
    let closestTarget: SnapTarget | null = null;
    let minDistance = this.snapThreshold;

    const blockList = Object.values(allBlocks);

    for (const targetBlock of blockList) {
      // Don't snap to itself or any of its own children
      if (targetBlock.id === draggedBlock.id || this.isDescendant(targetBlock.id, draggedBlock.id, allBlocks)) {
        continue;
      }

      // Check 1: Attach stack below targetBlock
      if (targetBlock.shape !== 'cap' && draggedBlock.shape !== 'hat') {
        const targetX = targetBlock.x ?? 0;
        const targetBottomY = (targetBlock.y ?? 0) + (targetBlock.shape === 'hat' ? 48 : 40);

        const dist = Math.hypot(dragCanvasX - targetX, dragCanvasY - targetBottomY);
        if (dist < minDistance) {
          minDistance = dist;
          closestTarget = {
            targetBlockId: targetBlock.id,
            snapType: 'stack-below',
            x: targetX,
            y: targetBottomY,
            distance: dist,
          };
        }
      }

      // Check 2: Attach inside C-block loop
      if (targetBlock.shape === 'c-block' && draggedBlock.shape !== 'hat') {
        const targetX = (targetBlock.x ?? 0) + 16;
        const targetInsideY = (targetBlock.y ?? 0) + 36;

        const dist = Math.hypot(dragCanvasX - targetX, dragCanvasY - targetInsideY);
        if (dist < minDistance) {
          minDistance = dist;
          closestTarget = {
            targetBlockId: targetBlock.id,
            snapType: 'substack-inside',
            x: targetX,
            y: targetInsideY,
            distance: dist,
          };
        }
      }
    }

    return closestTarget;
  }

  private isDescendant(
    candidateId: string,
    rootId: string,
    allBlocks: Record<string, ScratchBlockData>
  ): boolean {
    let curr: ScratchBlockData | undefined = allBlocks[candidateId];
    while (curr && curr.parent) {
      if (curr.parent === rootId) return true;
      curr = allBlocks[curr.parent];
    }
    return false;
  }

  /** Run callback on requestAnimationFrame */
  public scheduleUpdate(callback: () => void) {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = requestAnimationFrame(callback);
  }

  public cancelUpdate() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
