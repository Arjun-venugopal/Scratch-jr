'use client';

import React from 'react';
import { ScratchBlockData, SnapTarget } from '../types/scratchBlock';
import { ScratchBlockSVG } from './ScratchBlockSVG';
import { Trash2 } from 'lucide-react';
import { useProjectStore } from '../../../store/useProjectStore';
import { SoundManager } from '../../audio/SoundManager';

interface YourCodeWorkspaceProps {
  blocks: Record<string, ScratchBlockData>;
  topLevelBlockIds: string[];
  selectedBlockId: string | null;
  dragState: {
    isDragging: boolean;
    blockId: string | null;
    paletteType: string | null;
    dragX: number;
    dragY: number;
    snapTarget: SnapTarget | null;
  };
  onInputChange: (blockId: string, inputName: string, value: string | number) => void;
  onPointerDownBlock: (e: React.PointerEvent, blockId: string) => void;
  isOverTrash?: boolean;
}

export default function YourCodeWorkspace({
  blocks,
  topLevelBlockIds,
  selectedBlockId,
  dragState,
  onInputChange,
  onPointerDownBlock,
  isOverTrash = false,
}: YourCodeWorkspaceProps) {
  const { scenes, activeSceneId, clearSpriteScripts } = useProjectStore();
  const activeScene = scenes.find((s) => s.id === activeSceneId);
  const activeSpriteId = activeScene?.activeSpriteId;

  const handleClearCode = () => {
    if (!activeSpriteId) return;
    SoundManager.playDelete();
    clearSpriteScripts(activeSpriteId);
  };

  const renderBlockTree = (blockId: string | null): React.ReactNode => {
    if (!blockId) return null;
    const block = blocks[blockId];
    if (!block) return null;

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
    <div className="w-full flex-1 glass-panel rounded-2xl sm:rounded-[26px] p-2.5 sm:p-3.5 shadow-lg flex flex-col select-none overflow-hidden relative border-2 border-white/90">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5 sm:pb-2 mb-1.5 sm:mb-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <h3 className="text-[11px] sm:text-xs font-black text-amber-700 tracking-wider flex items-center gap-1.5 uppercase">
            <span>🧩</span> YOUR CODE
          </h3>
          <span className="bg-amber-100 text-amber-800 text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full border border-amber-200">
            {topLevelBlockIds.length} {topLevelBlockIds.length === 1 ? 'STACK' : 'STACKS'}
          </span>
        </div>

        <button
          onClick={handleClearCode}
          disabled={topLevelBlockIds.length === 0}
          className="text-[10px] sm:text-xs font-black text-slate-400 hover:text-red-500 disabled:opacity-30 flex items-center gap-1 transition-colors cursor-pointer px-1.5 sm:px-2 py-0.5 rounded-lg hover:bg-red-50"
        >
          <Trash2 size={12} className="sm:w-[13px] sm:h-[13px]" />
          <span>CLEAR ALL</span>
        </button>
      </div>

      {/* Code Chain Area */}
      <div className="flex-1 bg-workspace-grid rounded-xl sm:rounded-2xl overflow-x-auto no-scrollbar flex items-center p-2 sm:p-3 relative border border-slate-200/50 shadow-inner min-h-[90px] sm:min-h-[110px]">

        {topLevelBlockIds.length === 0 && !dragState.isDragging ? (
          <div className="w-full flex items-center justify-center gap-5 py-4 opacity-70">
            <div className="w-16 h-16 bg-white/90 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-slate-200/80 animate-bounce">
              🐼
            </div>
            <p className="text-slate-500 font-bold italic text-xs sm:text-sm max-w-sm text-center">
              Drag puzzle blocks here or tap them from the palette to code your story!
            </p>
          </div>
        ) : (
          <div className="flex items-center -space-x-3 min-w-full py-2">
            {topLevelBlockIds.map((blockId) => (
              <div key={blockId} className="flex items-center">
                {renderBlockTree(blockId)}
              </div>
            ))}
          </div>
        )}

        {/* Snap Preview Highlight Line */}
        {dragState.snapTarget && (
          <div
            className="absolute z-50 pointer-events-none transition-all duration-75"
            style={{
              left: `${dragState.snapTarget.x}px`,
              top: `${dragState.snapTarget.y}px`,
              width: '120px',
              height: '6px',
              backgroundColor: '#FACC15',
              boxShadow: '0 0 14px #FACC15',
              borderRadius: '9999px',
            }}
          />
        )}
      </div>

      {/* Drag Overlay Preview */}
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

      {/* Trash Warning Banner */}
      {isOverTrash && dragState.isDragging && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-xl flex items-center gap-1.5 animate-bounce border-2 border-white">
          <Trash2 size={14} /> Drop to delete block
        </div>
      )}
    </div>
  );
}
