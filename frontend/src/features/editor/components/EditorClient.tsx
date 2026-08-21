'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import EditorToolbar from './EditorToolbar';
import CharacterSidebar from './CharacterSidebar';
import StageCanvas from '../../stage/components/StageCanvas';
import RightSceneSidebar from './RightSceneSidebar';
import ScratchJrBlockPalette from '../../blocks/components/ScratchJrBlockPalette';
import YourCodeWorkspace from '../../blocks/components/YourCodeWorkspace';
import AIHintPanel from '../../ai/components/AIHintPanel';
import { useProjectStore } from '../../../store/useProjectStore';
import { ScratchBlockData, SnapTarget } from '../../blocks/types/scratchBlock';
import { BLOCK_DEFINITIONS } from '../../blocks/definitions/blockRegistry';
import { PointerDragEngine } from '../../blocks/engine/PointerDragEngine';
import { SoundManager } from '../../audio/SoundManager';
import { triggerSparkle } from '../../effects/ParticleEffects';
import { RuntimeEngine } from '../../blocks/RuntimeEngine';

const dragEngine = new PointerDragEngine();

export default function EditorClient({ projectId }: { projectId: string }) {
  const [isHintOpen, setIsHintOpen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  const {
    scenes,
    activeSceneId,
    addScratchBlockToSprite,
    moveScratchBlockStack,
    snapScratchBlock,
    detachScratchBlock,
    updateScratchBlockInput,
    removeScratchBlock,
  } = useProjectStore();

  const activeScene = scenes.find((s) => s.id === activeSceneId);
  const activeSprite = activeScene?.sprites.find((s) => s.id === activeScene?.activeSpriteId);

  const scratchBlocks = activeSprite?.scratchBlocks || {};
  const topLevelBlockIds = activeSprite?.topLevelBlockIds || [];

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // Drag Engine State
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    blockId: string | null;
    paletteType: string | null;
    dragX: number;
    dragY: number;
    canvasX: number;
    canvasY: number;
    blockOffsetX: number;
    blockOffsetY: number;
    snapTarget: SnapTarget | null;
  }>({
    isDragging: false,
    blockId: null,
    paletteType: null,
    dragX: 0,
    dragY: 0,
    canvasX: 0,
    canvasY: 0,
    blockOffsetX: 0,
    blockOffsetY: 0,
    snapTarget: null,
  });

  const [isOverTrash, setIsOverTrash] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Keep fresh refs for window event handlers
  const activeSpriteRef = useRef(activeSprite);
  useEffect(() => { activeSpriteRef.current = activeSprite; }, [activeSprite]);

  const scratchBlocksRef = useRef(scratchBlocks);
  useEffect(() => { scratchBlocksRef.current = scratchBlocks; }, [scratchBlocks]);

  const dragStateRef = useRef(dragState);
  useEffect(() => { dragStateRef.current = dragState; }, [dragState]);

  // ── Drag Start Handlers ──

  const handlePointerDownPaletteBlock = useCallback(
    (e: React.PointerEvent, blockType: string) => {
      SoundManager.playClick();
      e.stopPropagation();

      setDragState({
        isDragging: true,
        blockId: null,
        paletteType: blockType,
        dragX: e.clientX - 60,
        dragY: e.clientY - 20,
        canvasX: 0,
        canvasY: 0,
        blockOffsetX: 60,
        blockOffsetY: 20,
        snapTarget: null,
      });
    },
    []
  );

  const handlePointerDownBlock = useCallback(
    (e: React.PointerEvent, blockId: string) => {
      SoundManager.playClick();
      e.stopPropagation();

      if (!activeSprite) return;

      const block = scratchBlocks[blockId];
      if (!block) return;

      setSelectedBlockId(blockId);

      const rect = workspaceRef.current?.getBoundingClientRect();
      const canvasPos = rect
        ? dragEngine.screenToCanvas(e.clientX, e.clientY, rect, { x: 0, y: 0, zoom: 1.0 })
        : { x: 0, y: 0 };

      const blockX = block.x ?? 100;
      const blockY = block.y ?? 100;

      if (block.parent) {
        detachScratchBlock(activeSprite.id, blockId, canvasPos.x - 20, canvasPos.y - 20);
      }

      setDragState({
        isDragging: true,
        blockId,
        paletteType: null,
        dragX: e.clientX - 40,
        dragY: e.clientY - 20,
        canvasX: blockX,
        canvasY: blockY,
        blockOffsetX: canvasPos.x - blockX,
        blockOffsetY: canvasPos.y - blockY,
        snapTarget: null,
      });
    },
    [activeSprite, scratchBlocks, detachScratchBlock]
  );

  // ── Global Window Pointer Listeners ──

  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      const currentDrag = dragStateRef.current;
      if (currentDrag.isDragging) {
        const rect = workspaceRef.current?.getBoundingClientRect();
        if (!rect) return;

        const canvasPos = dragEngine.screenToCanvas(e.clientX, e.clientY, rect, { x: 0, y: 0, zoom: 1.0 });

        const overTrash = e.clientX < rect.left || e.clientY < rect.top;
        setIsOverTrash(overTrash);

        let targetSnap: SnapTarget | null = null;

        if (activeSpriteRef.current && !overTrash) {
          let draggedBlockObj: ScratchBlockData | undefined;

          if (currentDrag.blockId && scratchBlocksRef.current[currentDrag.blockId]) {
            draggedBlockObj = scratchBlocksRef.current[currentDrag.blockId];
          } else if (currentDrag.paletteType) {
            const def = BLOCK_DEFINITIONS[currentDrag.paletteType];
            draggedBlockObj = {
              id: 'temp-drag',
              type: currentDrag.paletteType,
              category: def?.category || 'motion',
              shape: def?.shape || 'stack',
              inputs: {},
              parent: null,
              next: null,
            };
          }

          if (draggedBlockObj) {
            targetSnap = dragEngine.findSnapTarget(
              draggedBlockObj,
              canvasPos.x - currentDrag.blockOffsetX,
              canvasPos.y - currentDrag.blockOffsetY,
              scratchBlocksRef.current
            );
          }
        }

        setDragState((prev) => ({
          ...prev,
          dragX: e.clientX - 40,
          dragY: e.clientY - 20,
          canvasX: canvasPos.x - prev.blockOffsetX,
          canvasY: canvasPos.y - prev.blockOffsetY,
          snapTarget: targetSnap,
        }));
      }
    };

    const handleGlobalPointerUp = (e: PointerEvent) => {
      const currentDrag = dragStateRef.current;

      if (currentDrag.isDragging && activeSpriteRef.current) {
        const rect = workspaceRef.current?.getBoundingClientRect();
        const canvasPos = rect
          ? dragEngine.screenToCanvas(e.clientX, e.clientY, rect, { x: 0, y: 0, zoom: 1.0 })
          : { x: 100, y: 100 };

        const dropX = Math.max(10, canvasPos.x - currentDrag.blockOffsetX);
        const dropY = Math.max(10, canvasPos.y - currentDrag.blockOffsetY);

        const overTrash = rect ? e.clientX < rect.left || e.clientY < rect.top : false;

        if (overTrash) {
          SoundManager.playDelete();
          if (currentDrag.blockId) {
            removeScratchBlock(activeSpriteRef.current.id, currentDrag.blockId);
          }
        } else if (currentDrag.paletteType) {
          const def = BLOCK_DEFINITIONS[currentDrag.paletteType];
          if (def) {
            const newBlockId = `block_${uuidv4()}`;
            const defaultInputs: Record<string, string | number> = {};
            def.inputs?.forEach((inp) => {
              defaultInputs[inp.name] = inp.defaultValue;
            });

            const newBlock: ScratchBlockData = {
              id: newBlockId,
              type: currentDrag.paletteType,
              category: def.category,
              shape: def.shape,
              inputs: defaultInputs,
              parent: null,
              next: null,
              x: dropX,
              y: dropY,
            };

            addScratchBlockToSprite(activeSpriteRef.current.id, newBlock);

            if (currentDrag.snapTarget) {
              SoundManager.playSnap();
              triggerSparkle(e.clientX, e.clientY);
              snapScratchBlock(activeSpriteRef.current.id, newBlockId, currentDrag.snapTarget);
            } else {
              SoundManager.playClick();
            }
            RuntimeEngine.runSingleBlockStack(activeSpriteRef.current.id, newBlockId);
          }
        } else if (currentDrag.blockId) {
          if (currentDrag.snapTarget) {
            SoundManager.playSnap();
            triggerSparkle(e.clientX, e.clientY);
            snapScratchBlock(activeSpriteRef.current.id, currentDrag.blockId, currentDrag.snapTarget);
          } else {
            moveScratchBlockStack(activeSpriteRef.current.id, currentDrag.blockId, dropX, dropY);
          }
          RuntimeEngine.runSingleBlockStack(activeSpriteRef.current.id, currentDrag.blockId);
        }
      }

      setDragState({
        isDragging: false,
        blockId: null,
        paletteType: null,
        dragX: 0,
        dragY: 0,
        canvasX: 0,
        canvasY: 0,
        blockOffsetX: 0,
        blockOffsetY: 0,
        snapTarget: null,
      });
      setIsOverTrash(false);
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [
    addScratchBlockToSprite,
    moveScratchBlockStack,
    snapScratchBlock,
    removeScratchBlock,
  ]);

  return (
    <div className="h-screen h-[100dvh] w-screen flex flex-col overflow-hidden bg-playful-pattern font-nunito select-none">
      {/* Top Floating Glass Toolbar */}
      <EditorToolbar
        projectId={projectId}
        onToggleHints={() => setIsHintOpen((prev) => !prev)}
        onToggleGrid={() => setShowGrid((prev) => !prev)}
        showGrid={showGrid}
      />

      {/* Main 3-Column Content Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden p-1.5 sm:p-3 md:p-4 gap-1.5 sm:gap-3 lg:gap-4">
        {/* Left Column: Character Sidebar */}
        <CharacterSidebar />

        {/* Center Column: 4:3 Stage Canvas */}
        <div className="flex-1 flex flex-col items-center justify-center p-0.5 sm:p-2 min-w-0 overflow-hidden">
          <StageCanvas showGrid={showGrid} />
        </div>

        {/* Right Column: Scene/Page Timeline Sidebar */}
        <RightSceneSidebar />
      </div>

      {/* Bottom Section: Block Palette & YOUR CODE Workspace */}
      <div ref={workspaceRef} className="p-1.5 sm:p-3 md:p-4 pt-0 flex flex-col gap-2 sm:gap-3 shrink-0 max-h-[44vh] sm:max-h-[42vh]">
        {/* Horizontal ScratchJr Category Block Palette */}
        <ScratchJrBlockPalette onPointerDownPaletteBlock={handlePointerDownPaletteBlock} />

        {/* YOUR CODE Workspace Panel */}
        <YourCodeWorkspace
          blocks={scratchBlocks}
          topLevelBlockIds={topLevelBlockIds}
          selectedBlockId={selectedBlockId}
          dragState={dragState}
          onInputChange={(blockId, name, val) =>
            activeSprite && updateScratchBlockInput(activeSprite.id, blockId, name, val)
          }
          onPointerDownBlock={handlePointerDownBlock}
          isOverTrash={isOverTrash}
        />
      </div>

      {/* AI Hint Panel */}
      <AIHintPanel isOpen={isHintOpen} onClose={() => setIsHintOpen(false)} />
    </div>
  );
}
