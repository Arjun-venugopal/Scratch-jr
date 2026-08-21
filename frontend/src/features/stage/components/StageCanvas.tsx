'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as PIXI from 'pixi.js';
import { useProjectStore } from '../../../store/useProjectStore';
import { svgToUrl } from '../../sprite/AnimalSVGs';
import { RotateCw, ArrowUp, ArrowDown, Target } from 'lucide-react';
import { SoundManager } from '../../audio/SoundManager';
import { RuntimeEngine } from '../../blocks/RuntimeEngine';

interface StageCanvasProps {
  showGrid?: boolean;
}

export default function StageCanvas({ showGrid = false }: StageCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const gridGraphicRef = useRef<PIXI.Graphics | null>(null);
  const spriteMap = useRef<Map<string, PIXI.Container>>(new Map());
  const [ready, setReady] = useState(false);

  const { scenes, activeSceneId, updateSprite, setActiveSprite } = useProjectStore();
  const activeScene = scenes.find((s) => s.id === activeSceneId);
  const activeSpriteId = activeScene?.activeSpriteId;

  const sprites = useMemo(() => activeScene?.sprites || [], [activeScene?.sprites]);
  const activeSprite = sprites.find((s) => s.id === activeSpriteId);
  const background = activeScene?.background ?? '#ffffff';

  // ── Initialize PixiJS Application ──────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;

    const init = async () => {
      const app = new PIXI.Application();
      await app.init({
        width: 480,
        height: 360,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true,
      });

      if (destroyed || !containerRef.current) {
        app.destroy(true);
        return;
      }

      containerRef.current.appendChild(app.canvas);
      appRef.current = app;

      // Draw grid graphics overlay
      const grid = new PIXI.Graphics();
      gridGraphicRef.current = grid;
      app.stage.addChild(grid);

      app.stage.eventMode = 'static';
      app.stage.hitArea = new PIXI.Rectangle(0, 0, 480, 360);

      setReady(true);
    };

    init();

    return () => {
      destroyed = true;
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
      }
      spriteMap.current.clear();
      setReady(false);
    };
  }, []);

  // ── Grid Overlay Toggle ──────────────────────────────────────────
  useEffect(() => {
    if (!gridGraphicRef.current) return;
    const grid = gridGraphicRef.current;
    grid.clear();

    if (showGrid) {
      grid.setStrokeStyle({ width: 1.5, color: 0x3b82f6, alpha: 0.25 });
      for (let x = 0; x <= 480; x += 40) {
        grid.moveTo(x, 0).lineTo(x, 360);
      }
      for (let y = 0; y <= 360; y += 40) {
        grid.moveTo(0, y).lineTo(480, y);
      }
      grid.stroke();
    }
  }, [showGrid, ready]);

  // ── CSS Background Updates ──────────
  useEffect(() => {
    if (!bgRef.current) return;
    bgRef.current.style.background = background;
  }, [background]);

  // ── Sync Sprites & Render Selection Outlines ──────────────────────
  useEffect(() => {
    if (!appRef.current || !ready) return;
    const stage = appRef.current.stage;
    const currentIds = new Set(sprites.map((s) => s.id));

    // Remove obsolete sprites
    for (const [id, pixiObj] of spriteMap.current.entries()) {
      if (!currentIds.has(id)) {
        stage.removeChild(pixiObj);
        pixiObj.destroy({ children: true });
        spriteMap.current.delete(id);
      }
    }

    // Update or add sprite containers
    sprites.forEach((spriteData) => {
      let pixiObj = spriteMap.current.get(spriteData.id);

      if (!pixiObj) {
        pixiObj = new PIXI.Container();
        pixiObj.eventMode = 'static';
        pixiObj.cursor = 'pointer';

        if (spriteData.svgData) {
          const dataUrl = svgToUrl(spriteData.svgData);
          const texture = PIXI.Texture.from(dataUrl);
          const svgSprite = new PIXI.Sprite(texture);
          svgSprite.anchor.set(0.5);
          svgSprite.scale.set(0.8);
          svgSprite.name = 'sprite-texture';
          pixiObj.addChild(svgSprite);
        } else if (spriteData.customImageData) {
          const texture = PIXI.Texture.from(spriteData.customImageData);
          const customSprite = new PIXI.Sprite(texture);
          customSprite.anchor.set(0.5);
          customSprite.scale.set(0.5);
          customSprite.name = 'sprite-texture';
          pixiObj.addChild(customSprite);
        } else {
          const circle = new PIXI.Graphics();
          circle.circle(0, 0, 25);
          circle.fill(0x3b82f6);
          pixiObj.addChild(circle);

          const label = new PIXI.Text({
            text: spriteData.emoji,
            style: { fontSize: 28 },
          });
          label.anchor.set(0.5);
          pixiObj.addChild(label);
        }

        let dragOffset = { x: 0, y: 0 };

        pixiObj.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
          e.stopPropagation();
          SoundManager.playClick();
          if (activeSceneId) {
            setActiveSprite(activeSceneId, spriteData.id);
            RuntimeEngine.runAll(activeSceneId, 'tap', spriteData.id);
          }

          const parent = pixiObj!.parent;
          if (!parent) return;
          const pos = parent.toLocal(e.global);
          dragOffset = { x: pos.x - pixiObj!.x, y: pos.y - pixiObj!.y };

          const onMove = (ev: PIXI.FederatedPointerEvent) => {
            const newPos = parent.toLocal(ev.global);
            const nx = Math.max(30, Math.min(450, Math.round(newPos.x - dragOffset.x)));
            const ny = Math.max(30, Math.min(330, Math.round(newPos.y - dragOffset.y)));

            pixiObj!.x = nx;
            pixiObj!.y = ny;
          };

          const onUp = () => {
            stage.off('pointermove', onMove);
            stage.off('pointerup', onUp);
            stage.off('pointerupoutside', onUp);

            const realX = Math.round(pixiObj!.x * (800 / 480));
            const realY = Math.round(pixiObj!.y * (600 / 360));
            updateSprite(spriteData.id, { x: realX, y: realY });
          };

          stage.on('pointermove', onMove);
          stage.on('pointerup', onUp);
          stage.on('pointerupoutside', onUp);
        });

        stage.addChild(pixiObj);
        spriteMap.current.set(spriteData.id, pixiObj);
      }

      pixiObj.x = spriteData.x * (480 / 800);
      pixiObj.y = spriteData.y * (360 / 600);
      pixiObj.rotation = (spriteData.rotation * Math.PI) / 180;
      pixiObj.scale.set(spriteData.scale * 0.6);
      pixiObj.visible = spriteData.visible;

      const existingOutline = pixiObj.getChildByName('selection-outline');
      if (existingOutline) pixiObj.removeChild(existingOutline);

      if (spriteData.id === activeSpriteId) {
        const outline = new PIXI.Graphics();
        outline.name = 'selection-outline';
        outline.setStrokeStyle({ width: 3, color: 0xff9f43, alpha: 0.95 });
        outline.drawRect(-40, -40, 80, 80);
        outline.stroke();
        pixiObj.addChild(outline);
      }

      // Render Speech Bubble Overlay
      const existingBubble = pixiObj.getChildByName('speech-bubble');
      if (existingBubble) pixiObj.removeChild(existingBubble);

      if (spriteData.speechBubble) {
        const bubbleGroup = new PIXI.Container();
        bubbleGroup.name = 'speech-bubble';
        bubbleGroup.position.set(0, -65);

        const bubbleText = new PIXI.Text({
          text: spriteData.speechBubble,
          style: {
            fontSize: 14,
            fontWeight: 'bold',
            fill: 0x1e293b,
            align: 'center',
          },
        });
        bubbleText.anchor.set(0.5);

        const bw = Math.max(60, bubbleText.width + 24);
        const bh = Math.max(32, bubbleText.height + 12);

        const bg = new PIXI.Graphics();
        bg.setStrokeStyle({ width: 2, color: 0xcbd5e1 });
        bg.fill(0xffffff);
        bg.roundRect(-bw / 2, -bh / 2, bw, bh, 12);
        bg.moveTo(-4, bh / 2);
        bg.lineTo(0, bh / 2 + 8);
        bg.lineTo(4, bh / 2);
        bg.fill();
        bg.stroke();

        bubbleGroup.addChild(bg);
        bubbleGroup.addChild(bubbleText);
        pixiObj.addChild(bubbleGroup);
      }
    });
  }, [sprites, activeSpriteId, activeSceneId, ready, setActiveSprite, updateSprite]);

  // ── Controls: Layering & Centering ──
  const handleBringForward = () => {
    if (!activeSpriteId || !activeScene) return;
    SoundManager.playClick();
    const idx = activeScene.sprites.findIndex((s) => s.id === activeSpriteId);
    if (idx < activeScene.sprites.length - 1) {
      const newSprites = [...activeScene.sprites];
      const [moved] = newSprites.splice(idx, 1);
      newSprites.splice(idx + 1, 0, moved);

      useProjectStore.setState((state) => ({
        scenes: state.scenes.map((s) =>
          s.id === activeScene.id ? { ...s, sprites: newSprites } : s
        ),
      }));
    }
  };

  const handleSendBack = () => {
    if (!activeSpriteId || !activeScene) return;
    SoundManager.playClick();
    const idx = activeScene.sprites.findIndex((s) => s.id === activeSpriteId);
    if (idx > 0) {
      const newSprites = [...activeScene.sprites];
      const [moved] = newSprites.splice(idx, 1);
      newSprites.splice(idx - 1, 0, moved);

      useProjectStore.setState((state) => ({
        scenes: state.scenes.map((s) =>
          s.id === activeScene.id ? { ...s, sprites: newSprites } : s
        ),
      }));
    }
  };

  const handleCenterSprite = () => {
    if (!activeSpriteId) return;
    SoundManager.playClick();
    updateSprite(activeSpriteId, { x: 400, y: 300, rotation: 0 });
  };

  const handleRotateSprite = (amount: number) => {
    if (!activeSpriteId || !activeSprite) return;
    SoundManager.playClick();
    updateSprite(activeSpriteId, { rotation: (activeSprite.rotation + amount + 360) % 360 });
  };

  const handleScaleSprite = (amount: number) => {
    if (!activeSpriteId || !activeSprite) return;
    SoundManager.playClick();
    const newScale = Math.max(0.2, Math.min(3.0, activeSprite.scale + amount));
    updateSprite(activeSpriteId, { scale: Number(newScale.toFixed(2)) });
  };

  return (
    <div className="relative flex flex-col items-center select-none w-full max-w-[280px] sm:max-w-[420px] md:max-w-[480px] lg:max-w-[510px]">
      {/* 4:3 Digital Canvas Tablet Frame */}
      <div className="w-full aspect-[4/3] max-h-[360px] rounded-2xl sm:rounded-[32px] overflow-hidden shadow-xl sm:shadow-2xl border-[6px] sm:border-[8px] md:border-[10px] border-[#9B51E0] bg-white relative transition-all ring-2 sm:ring-4 ring-purple-300/40">
        {/* Tablet Top Camera Notch Accent */}
        <div className="absolute top-1 sm:top-1.5 left-1/2 -translate-x-1/2 w-8 sm:w-12 h-1.5 sm:h-2 bg-purple-900/40 rounded-full z-20 pointer-events-none" />

        {/* CSS Background Layer */}
        <div ref={bgRef} className="absolute inset-0 transition-opacity duration-300" style={{ background }} />

        {/* WebGL Canvas Layer */}
        <div ref={containerRef} className="absolute inset-0 [&>canvas]:w-full [&>canvas]:h-full [&>canvas]:object-contain" />
      </div>

      {/* Active Sprite Quick Transform Bar */}
      {activeSprite && (
        <div className="mt-1.5 sm:mt-2.5 flex items-center gap-1 sm:gap-2 bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl px-2.5 sm:px-4 py-1 sm:py-1.5 shadow-lg border border-purple-100 text-xs overflow-x-auto no-scrollbar max-w-full shrink-0">
          <span className="font-black text-slate-800 mr-0.5 sm:mr-1 flex items-center gap-1 sm:gap-1.5 max-w-[100px] sm:max-w-[130px] truncate bg-purple-50 text-purple-700 px-2 sm:px-2.5 py-0.5 rounded-full border border-purple-200/70 text-[11px] sm:text-xs shrink-0">
            <span>{activeSprite.emoji}</span>
            <span className="truncate">{activeSprite.name}</span>
          </span>

          <div className="w-[1px] h-3.5 sm:h-4 bg-slate-200 shrink-0" />

          {/* Scale Down */}
          <button
            onClick={() => handleScaleSprite(-0.15)}
            className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-100 hover:bg-blue-200 text-blue-600 font-black rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-sm transition-transform active:scale-95 cursor-pointer shadow-2xs shrink-0"
            title="Smaller"
          >
            -
          </button>
          {/* Scale Up */}
          <button
            onClick={() => handleScaleSprite(0.15)}
            className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-100 hover:bg-blue-200 text-blue-600 font-black rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-sm transition-transform active:scale-95 cursor-pointer shadow-2xs shrink-0"
            title="Bigger"
          >
            +
          </button>

          <div className="w-[1px] h-3.5 sm:h-4 bg-slate-200 shrink-0" />

          {/* Rotate */}
          <button
            onClick={() => handleRotateSprite(15)}
            className="w-6 h-6 sm:w-7 sm:h-7 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-2xs shrink-0"
            title="Rotate 15°"
          >
            <RotateCw size={12} className="sm:w-[13px] sm:h-[13px]" />
          </button>

          <div className="w-[1px] h-3.5 sm:h-4 bg-slate-200 shrink-0" />

          {/* Bring Forward */}
          <button
            onClick={handleBringForward}
            className="w-6 h-6 sm:w-7 sm:h-7 bg-emerald-100 hover:bg-emerald-200 text-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-2xs shrink-0"
            title="Bring Forward"
          >
            <ArrowUp size={12} className="sm:w-[13px] sm:h-[13px]" />
          </button>

          {/* Send Back */}
          <button
            onClick={handleSendBack}
            className="w-6 h-6 sm:w-7 sm:h-7 bg-emerald-100 hover:bg-emerald-200 text-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-2xs shrink-0"
            title="Send Back"
          >
            <ArrowDown size={12} className="sm:w-[13px] sm:h-[13px]" />
          </button>

          {/* Recenter */}
          <button
            onClick={handleCenterSprite}
            className="w-6 h-6 sm:w-7 sm:h-7 bg-amber-100 hover:bg-amber-200 text-amber-600 rounded-lg sm:rounded-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-2xs shrink-0"
            title="Center Sprite"
          >
            <Target size={12} className="sm:w-[13px] sm:h-[13px]" />
          </button>
        </div>
      )}
    </div>
  );
}
