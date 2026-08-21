'use client';

import React, { useRef } from 'react';
import { ScratchBlockData, SnapTarget, ViewportState } from '../types/scratchBlock';
import { ScratchBlockSVG } from './ScratchBlockSVG';
import { ZoomIn, ZoomOut, Maximize2, Trash2 } from 'lucide-react';

interface ScratchWorkspaceCanvasProps {
  blocks: Record<string, ScratchBlockData>;
  topLevelBlockIds: string[];
  viewport: ViewportState;
  selectedBlockId: string | null;
  dragState: {
    isDragging: boolean;
    blockId: string | null;
    paletteType: string | null;
    dragX: number;
    dragY: number;
    snapTarget: SnapTarget | null;
  };
  onViewportChange: (viewport: ViewportState) => void;
  onInputChange: (blockId: string, inputName: string, value: string | number) => void;
  onPointerDownBlock: (e: React.PointerEvent, blockId: string) => void;
  onPointerDownCanvas: (e: React.PointerEvent) => void;
  onPointerMoveCanvas: (e: React.PointerEvent) => void;
  onPointerUpCanvas: (e: React.PointerEvent) => void;
  isOverTrash?: boolean;
}

export const ScratchWorkspaceCanvas: React.FC<ScratchWorkspaceCanvasProps> = ({
  blocks,
  topLevelBlockIds,
  viewport,
  selectedBlockId,
  dragState,
  onViewportChange,
  onInputChange,
  onPointerDownBlock,
  onPointerDownCanvas,
  onPointerMoveCanvas,
  onPointerUpCanvas,
  isOverTrash = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => {
    onViewportChange({
      ...viewport,
      zoom: Math.min(2.0, viewport.zoom + 0.15),
    });
  };

  const handleZoomOut = () => {
    onViewportChange({
      ...viewport,
      zoom: Math.max(0.4, viewport.zoom - 0.15),
    });
  };

  const handleResetZoom = () => {
    onViewportChange({
      x: 40,
      y: 40,
      zoom: 1.0,
    });
  };

  // Helper to render block trees recursively
  const renderBlockTree = (blockId: string | null): React.ReactNode => {
    if (!blockId) return null;
    const block = blocks[blockId];
    if (!block) return null;

    // If block is currently being dragged, don't draw it in its static tree position
    if (dragState.isDragging && dragState.blockId === blockId) {
      return null;
    }

    return (
      <ScratchBlockSVG
        key={block.id}
        block={block}
        isSelected={selectedBlockId === block.id}
        onInputChange={(inputName, val) => onInputChange(block.id, inputName, val)}
        renderChild={(childId) => renderBlockTree(childId)}
        renderSubstack={(substackId) => renderBlockTree(substackId)}
        onPointerDownBlock={onPointerDownBlock}
      />
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 h-full w-full overflow-hidden bg-slate-100 select-none cursor-grab active:cursor-grabbing"
      style={{ touchAction: 'none' }}
      onPointerDown={onPointerDownCanvas}
      onPointerMove={onPointerMoveCanvas}
      onPointerUp={onPointerUpCanvas}
    >
      {/* ── Dot Grid Background ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 2px, transparent 2px)',
          backgroundSize: `${24 * viewport.zoom}px ${24 * viewport.zoom}px`,
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
        }}
      />

      {/* ── Empty Canvas Placeholder ── */}
      {topLevelBlockIds.length === 0 && !dragState.isDragging && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 font-extrabold text-2xl opacity-60 pointer-events-none select-none">
          <span className="text-5xl mb-3">🧩</span>
          Drag blocks here to build code!
        </div>
      )}

      {/* ── Canvas Workspace Transformed Container ── */}
      <div
        className="absolute inset-0 origin-top-left pointer-events-auto"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        }}
      >
        {/* Render Top-level Block Stacks */}
        {topLevelBlockIds.map((blockId) => {
          const block = blocks[blockId];
          if (!block) return null;

          return (
            <div
              key={block.id}
              className="absolute"
              style={{
                left: `${block.x ?? 100}px`,
                top: `${block.y ?? 100}px`,
              }}
            >
              {renderBlockTree(block.id)}
            </div>
          );
        })}

        {/* Render Snap Preview Connection Highlight Line */}
        {dragState.snapTarget && (
          <div
            className="absolute z-50 pointer-events-none transition-all duration-75"
            style={{
              left: `${dragState.snapTarget.x}px`,
              top: `${dragState.snapTarget.y}px`,
              width: '120px',
              height: '6px',
              backgroundColor: '#FACC15', // Glowing Yellow
              boxShadow: '0 0 12px #FACC15, 0 0 4px #EAB308',
              borderRadius: '9999px',
            }}
          />
        )}
      </div>

      {/* ── Drag Overlay Preview for Dragged Block / Stack ── */}
      {dragState.isDragging && (
        <div
          className="fixed z-[9999] pointer-events-none filter drop-shadow-2xl opacity-90 scale-105"
          style={{
            left: `${dragState.dragX}px`,
            top: `${dragState.dragY}px`,
          }}
        >
          {dragState.blockId && blocks[dragState.blockId] ? (
            <ScratchBlockSVG
              block={blocks[dragState.blockId]}
              isDragging={true}
              renderChild={(childId) => renderBlockTree(childId)}
              renderSubstack={(substackId) => renderBlockTree(substackId)}
            />
          ) : dragState.paletteType ? (
            <ScratchBlockSVG
              block={{
                id: 'drag-preview',
                type: dragState.paletteType,
                category: 'motion',
                shape: 'stack',
                inputs: {},
                parent: null,
                next: null,
              }}
              isDragging={true}
            />
          ) : null}
        </div>
      )}

      {/* ── Canvas Viewport Controls Bar (Zoom In/Out/Center) ── */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-slate-200 p-1 gap-1">
        <button
          onClick={handleZoomIn}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={18} />
        </button>
        <div className="w-[1px] h-5 bg-slate-200 my-auto" />
        <button
          onClick={handleResetZoom}
          className="px-2.5 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          title="Reset Zoom"
        >
          {Math.round(viewport.zoom * 100)}%
        </button>
        <button
          onClick={handleResetZoom}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          title="Recenter Canvas"
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* ── Trash Dropping Indicator Overlay ── */}
      {isOverTrash && dragState.isDragging && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs font-extrabold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <Trash2 size={16} /> Drop here to delete block
        </div>
      )}
    </div>
  );
};
