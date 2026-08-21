'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useProjectStore } from '../../../store/useProjectStore';
import { RuntimeEngine } from '../RuntimeEngine';
import { ScratchBlockData, SnapTarget, ViewportState } from '../types/scratchBlock';
import { BLOCK_DEFINITIONS } from '../definitions/blockRegistry';
import { PointerDragEngine } from '../engine/PointerDragEngine';
import { BlockPaletteSidebar } from './BlockPaletteSidebar';
import { ScratchWorkspaceCanvas } from './ScratchWorkspaceCanvas';
import { SoundManager } from '../../audio/SoundManager';
import { ConfettiEffect, triggerSparkle } from '../../effects/ParticleEffects';
import { Play, Square } from 'lucide-react';

const dragEngine = new PointerDragEngine();

export default function ScriptWorkspace() {
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

  const [viewport, setViewport] = useState<ViewportState>({ x: 40, y: 40, zoom: 1.0 });
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [successTrigger, setSuccessTrigger] = useState(0);
  const engineRef = useRef<RuntimeEngine | null>(null);

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
  const isPanActive = useRef(false);
  const panStartRef = useRef<{ x: number; y: number; vpX: number; vpY: number }>({
    x: 0,
    y: 0,
    vpX: 0,
    vpY: 0,
  });

  // Keep fresh refs to prevent stale closure issues in global window listeners
  const viewportRef = useRef(viewport);
  useEffect(() => { viewportRef.current = viewport; }, [viewport]);

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
        ? dragEngine.screenToCanvas(e.clientX, e.clientY, rect, viewport)
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
    [activeSprite, scratchBlocks, viewport, detachScratchBlock]
  );

  const handlePointerDownCanvas = (e: React.PointerEvent) => {
    setSelectedBlockId(null);
    isPanActive.current = true;
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      vpX: viewport.x,
      vpY: viewport.y,
    };
  };

  // ── Global Window Pointer Listeners for Smooth Drag & Drop ──

  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      const currentDrag = dragStateRef.current;
      if (currentDrag.isDragging) {
        const rect = workspaceRef.current?.getBoundingClientRect();
        if (!rect) return;

        const canvasPos = dragEngine.screenToCanvas(e.clientX, e.clientY, rect, viewportRef.current);

        const overTrash = e.clientX < rect.left;
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
      } else if (isPanActive.current) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        setViewport({
          ...viewportRef.current,
          x: panStartRef.current.vpX + dx,
          y: panStartRef.current.vpY + dy,
        });
      }
    };

    const handleGlobalPointerUp = (e: PointerEvent) => {
      isPanActive.current = false;
      const currentDrag = dragStateRef.current;

      if (currentDrag.isDragging && activeSpriteRef.current) {
        const rect = workspaceRef.current?.getBoundingClientRect();
        const canvasPos = rect
          ? dragEngine.screenToCanvas(e.clientX, e.clientY, rect, viewportRef.current)
          : { x: 100, y: 100 };

        const dropX = Math.max(10, canvasPos.x - currentDrag.blockOffsetX);
        const dropY = Math.max(10, canvasPos.y - currentDrag.blockOffsetY);

        const overTrash = rect ? e.clientX < rect.left : false;

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

  // ── Run / Stop Execution ──
  const handlePlay = useCallback(() => {
    SoundManager.playClick();
    if (!activeSceneId) return;

    setIsPlaying(true);
    RuntimeEngine.runAll(activeSceneId, 'flag')
      .then(() => {
        setIsPlaying(false);
        setSuccessTrigger((prev) => prev + 1);
        SoundManager.playChime();
      })
      .catch(() => {
        setIsPlaying(false);
        SoundManager.playError();
      });
  }, [activeSceneId]);

  const handleStop = useCallback(() => {
    SoundManager.playClick();
    RuntimeEngine.stopAll();
    setIsPlaying(false);
  }, []);

  return (
    <div className="flex w-full h-full relative overflow-hidden bg-slate-100 font-nunito">
      <ConfettiEffect trigger={successTrigger} />

      {/* Play / Stop Run Bar */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-3">
        <button
          onClick={handlePlay}
          disabled={isPlaying || !activeSprite}
          className="w-12 h-12 bg-green-500 hover:bg-green-400 disabled:opacity-50 rounded-full shadow-lg flex items-center justify-center border-2 border-white transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          title="Run Code"
        >
          <Play fill="white" size={22} className="ml-0.5" />
        </button>
        <button
          onClick={handleStop}
          disabled={!isPlaying}
          className="w-12 h-12 bg-red-500 hover:bg-red-400 disabled:opacity-50 rounded-full shadow-lg flex items-center justify-center border-2 border-white transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          title="Stop Execution"
        >
          <Square fill="white" size={18} />
        </button>
      </div>

      {/* Left Block Palette Sidebar (9 categories) */}
      <BlockPaletteSidebar onPointerDownPaletteBlock={handlePointerDownPaletteBlock} />

      {/* Main 2D Infinite Canvas Workspace */}
      <div ref={workspaceRef} className="flex-1 h-full relative">
        <ScratchWorkspaceCanvas
          blocks={scratchBlocks}
          topLevelBlockIds={topLevelBlockIds}
          viewport={viewport}
          selectedBlockId={selectedBlockId}
          dragState={dragState}
          onViewportChange={setViewport}
          onInputChange={(blockId, name, val) =>
            activeSprite && updateScratchBlockInput(activeSprite.id, blockId, name, val)
          }
          onPointerDownBlock={handlePointerDownBlock}
          onPointerDownCanvas={handlePointerDownCanvas}
          onPointerMoveCanvas={() => {}}
          onPointerUpCanvas={() => {}}
          isOverTrash={isOverTrash}
        />
      </div>
    </div>
  );
}
