'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useProjectStore } from '../../../store/useProjectStore';
import {
  X,
  Check,
  Undo,
  Redo,
  Paintbrush,
  Circle,
  Square,
  Triangle,
  Minus,
  ArrowUp,
  Copy,
  Scissors,
  Camera,
  PaintBucket,
  Layers,
  Upload,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SoundManager } from '../../audio/SoundManager';
import { svgToUrl } from '../../sprite/AnimalSVGs';

interface PaintEditorProps {
  spriteId?: string | null;
  onClose: () => void;
}

type Tool = 'brush' | 'circle' | 'rectangle' | 'triangle' | 'line' | 'fill' | 'eraser';

const COLOR_PALETTE = [
  // Row 1: Soft Pastels, Primaries, Neons
  '#FFC0CB', '#FFB6C1', '#E6E6FA', '#FF7F7F', '#FF4757', '#FF9F43', '#FFBE76', '#FFDD59',
  '#FFFF99', '#7BED9F', '#2ED573', '#1DD1A1', '#00D2D3', '#54A0FF', '#2E86DE', '#3742FA',
  '#5F27CD', '#9B51E0', '#B8E994', '#78E08F', '#38ADA9', '#079992', '#FFFFFF', '#DCDDE1',
  '#718093', '#2F3640', '#000000',
  // Row 2: Rich Tones, Earth, Darks
  '#FF4081', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
  '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
  '#795548', '#A1887F', '#8D6E63', '#D7CCC8', '#F5F5F5', '#CFD8DC', '#90A4AE', '#37474F',
  '#101010',
];

export default function PaintEditor({ spriteId, onClose }: PaintEditorProps) {
  const { scenes, activeSceneId, addSprite, updateSprite } = useProjectStore();
  const activeScene = scenes.find((s) => s.id === activeSceneId);
  const targetSprite = activeScene?.sprites.find((s) => s.id === spriteId);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [spriteName, setSpriteName] = useState(targetSprite?.name || 'Panda');
  const [tool, setTool] = useState<Tool>('brush');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(8);
  const [drawMode, setDrawMode] = useState<'brush' | 'fill'>('brush');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  // History for Undo/Redo
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  // Initialize Canvas & Load Existing Sprite Artwork
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (targetSprite) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.8;
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        pushHistory();
      };

      if (targetSprite.svgData) {
        img.src = svgToUrl(targetSprite.svgData);
      } else if (targetSprite.customImageData) {
        img.src = targetSprite.customImageData;
      } else {
        pushHistory();
      }
    } else {
      pushHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => {
      const truncated = prev.slice(0, historyIdx + 1);
      const newHistory = [...truncated, imageData].slice(-30);
      return newHistory;
    });
    setHistoryIdx((prev) => Math.min(prev + 1, 29));
  }, [historyIdx]);

  const handleUndo = useCallback(() => {
    if (historyIdx <= 0) return;
    SoundManager.playClick();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const newIdx = historyIdx - 1;
    const imageData = history[newIdx];
    if (imageData) {
      ctx.putImageData(imageData, 0, 0);
      setHistoryIdx(newIdx);
    }
  }, [history, historyIdx]);

  const handleRedo = useCallback(() => {
    if (historyIdx >= history.length - 1) return;
    SoundManager.playClick();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const newIdx = historyIdx + 1;
    const imageData = history[newIdx];
    if (imageData) {
      ctx.putImageData(imageData, 0, 0);
      setHistoryIdx(newIdx);
    }
  }, [history, historyIdx]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const clearPreview = () => {
    const preview = previewCanvasRef.current;
    if (!preview) return;
    const ctx = preview.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, preview.width, preview.height);
  };

  // ── Flood Fill Bucket ──
  const floodFill = (x: number, y: number, fillColor: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width;
    const h = canvas.height;

    const startIdx = (Math.floor(y) * w + Math.floor(x)) * 4;
    const targetR = data[startIdx];
    const targetG = data[startIdx + 1];
    const targetB = data[startIdx + 2];
    const targetA = data[startIdx + 3];

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1;
    tempCanvas.height = 1;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.fillStyle = fillColor;
    tempCtx.fillRect(0, 0, 1, 1);
    const fillData = tempCtx.getImageData(0, 0, 1, 1).data;
    const fillR = fillData[0],
      fillG = fillData[1],
      fillB = fillData[2],
      fillA = fillData[3];

    if (targetR === fillR && targetG === fillG && targetB === fillB && targetA === fillA) return;

    const match = (i: number) => {
      return (
        Math.abs(data[i] - targetR) < 15 &&
        Math.abs(data[i + 1] - targetG) < 15 &&
        Math.abs(data[i + 2] - targetB) < 15 &&
        Math.abs(data[i + 3] - targetA) < 30
      );
    };

    const stack: [number, number][] = [[Math.floor(x), Math.floor(y)]];
    const visited = new Set<number>();

    while (stack.length > 0) {
      const [px, py] = stack.pop()!;
      const idx = (py * w + px) * 4;

      if (px < 0 || px >= w || py < 0 || py >= h) continue;
      if (visited.has(idx)) continue;
      if (!match(idx)) continue;

      visited.add(idx);
      data[idx] = fillR;
      data[idx + 1] = fillG;
      data[idx + 2] = fillB;
      data[idx + 3] = fillA;

      stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
  };

  // ── Draw Shapes ──
  const drawShape = (
    ctx: CanvasRenderingContext2D,
    shape: Tool,
    sx: number,
    sy: number,
    ex: number,
    ey: number
  ) => {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const w = ex - sx;
    const h = ey - sy;
    const cx = sx + w / 2;
    const cy = sy + h / 2;
    const rx = Math.abs(w / 2);
    const ry = Math.abs(h / 2);

    switch (shape) {
      case 'line':
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        break;
      case 'circle':
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'rectangle':
        ctx.strokeRect(sx, sy, w, h);
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(cx, sy);
        ctx.lineTo(ex, ey);
        ctx.lineTo(sx, ey);
        ctx.closePath();
        ctx.stroke();
        break;
    }
  };

  // ── Canvas Interaction Handlers ──
  const handlePointerDown = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const pos = getPos(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (drawMode === 'fill' || tool === 'fill') {
      floodFill(pos.x, pos.y, color);
      pushHistory();
      return;
    }

    setIsDrawing(true);
    setStartPos(pos);

    if (tool === 'brush') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const handlePointerMove = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'brush') {
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.strokeStyle = color;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    } else if (startPos && ['line', 'circle', 'rectangle', 'triangle'].includes(tool)) {
      clearPreview();
      const preview = previewCanvasRef.current;
      if (!preview) return;
      const pctx = preview.getContext('2d');
      if (!pctx) return;
      drawShape(pctx, tool, startPos.x, startPos.y, pos.x, pos.y);
    }
  };

  const handlePointerUp = (
    e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (startPos && ['line', 'circle', 'rectangle', 'triangle'].includes(tool)) {
      let endPos = startPos;
      if (e) {
        endPos = getPos(e);
      }
      clearPreview();
      drawShape(ctx, tool, startPos.x, startPos.y, endPos.x, endPos.y);
    }

    ctx.beginPath();
    setStartPos(null);
    pushHistory();
  };

  // ── Image Upload & Auto-Scale ──
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.8;
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;

        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        pushHistory();
        SoundManager.playChime();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // ── Save Sprite to Stage & Library ──
  const handleSave = () => {
    SoundManager.playChime();
    const canvas = canvasRef.current;
    if (!canvas || !activeSceneId) return;

    const dataUrl = canvas.toDataURL('image/png');

    if (spriteId && targetSprite) {
      updateSprite(spriteId, {
        name: spriteName,
        customImageData: dataUrl,
      });
    } else {
      addSprite(activeSceneId, {
        name: spriteName || 'Custom',
        emoji: '🎨',
        customImageData: dataUrl,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4 select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        className="bg-[#F7F2E7] rounded-[28px] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col border-4 border-[#E2D9C8] max-h-[96vh]"
      >
        {/* ── TOP BAR ── */}
        <div className="p-3 px-6 flex justify-between items-center bg-[#F7F2E7] border-b border-[#E8DFC8]">
          {/* Left: Undo / Redo */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={historyIdx <= 0}
              className="w-11 h-11 bg-[#BEE1F4] hover:bg-[#A8D7F0] disabled:opacity-40 rounded-full flex items-center justify-center text-[#4A90E2] transition-transform active:scale-95 cursor-pointer shadow-sm"
              title="Undo"
            >
              <Undo size={22} strokeWidth={3} />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIdx >= history.length - 1}
              className="w-11 h-11 bg-[#BEE1F4] hover:bg-[#A8D7F0] disabled:opacity-40 rounded-full flex items-center justify-center text-[#4A90E2] transition-transform active:scale-95 cursor-pointer shadow-sm"
              title="Redo"
            >
              <Redo size={22} strokeWidth={3} />
            </button>
          </div>

          {/* Center: Editable Sprite Name Pill */}
          <input
            type="text"
            value={spriteName}
            onChange={(e) => setSpriteName(e.target.value)}
            className="bg-white text-[#4A4E69] font-black text-sm px-6 py-1.5 rounded-full border-2 border-[#DCE4EC] outline-none focus:border-[#70C1F3] w-48 text-center shadow-inner"
            placeholder="Sprite Name..."
          />

          {/* Right: Cancel (X) & Save (Check) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                SoundManager.playClick();
                onClose();
              }}
              className="w-11 h-11 bg-[#BEE1F4] hover:bg-[#A8D7F0] rounded-full flex items-center justify-center text-[#4A90E2] transition-transform active:scale-95 cursor-pointer shadow-sm"
              title="Cancel"
            >
              <X size={22} strokeWidth={3} />
            </button>

            <button
              onClick={handleSave}
              className="w-11 h-11 bg-[#70C1F3] hover:bg-[#5BB4EF] text-white rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-md border-2 border-white"
              title="Save to Stage"
            >
              <Check size={24} strokeWidth={3.5} />
            </button>
          </div>
        </div>

        {/* ── MIDDLE ROW: LEFT TOOLBAR | CANVAS | RIGHT TOOLBAR ── */}
        <div className="flex-1 flex min-h-0 p-4 gap-4 items-center justify-between">
          {/* Left Toolbar (64x64px rounded tool buttons) */}
          <div className="flex flex-col gap-3 shrink-0">
            {/* Brush Tool */}
            <button
              onClick={() => {
                SoundManager.playClick();
                setTool('brush');
                setDrawMode('brush');
              }}
              className={`w-14 sm:w-16 h-14 sm:h-16 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-md ${
                tool === 'brush'
                  ? 'bg-[#FFE874] text-slate-800 border-2 border-[#FF9F43] scale-105 ring-4 ring-[#FF9F43]/30'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
              title="Brush Tool"
            >
              <Paintbrush size={26} strokeWidth={2.5} />
            </button>

            {/* Circle Tool */}
            <button
              onClick={() => {
                SoundManager.playClick();
                setTool('circle');
              }}
              className={`w-14 sm:w-16 h-14 sm:h-16 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-md ${
                tool === 'circle'
                  ? 'bg-[#FFE874] text-slate-800 border-2 border-[#FF9F43] scale-105 ring-4 ring-[#FF9F43]/30'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
              title="Circle Tool"
            >
              <Circle size={26} strokeWidth={2.5} />
            </button>

            {/* Rectangle Tool */}
            <button
              onClick={() => {
                SoundManager.playClick();
                setTool('rectangle');
              }}
              className={`w-14 sm:w-16 h-14 sm:h-16 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-md ${
                tool === 'rectangle'
                  ? 'bg-[#FFE874] text-slate-800 border-2 border-[#FF9F43] scale-105 ring-4 ring-[#FF9F43]/30'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
              title="Rectangle Tool"
            >
              <Square size={26} strokeWidth={2.5} />
            </button>

            {/* Triangle Tool */}
            <button
              onClick={() => {
                SoundManager.playClick();
                setTool('triangle');
              }}
              className={`w-14 sm:w-16 h-14 sm:h-16 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-md ${
                tool === 'triangle'
                  ? 'bg-[#FFE874] text-slate-800 border-2 border-[#FF9F43] scale-105 ring-4 ring-[#FF9F43]/30'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
              title="Triangle Tool"
            >
              <Triangle size={26} strokeWidth={2.5} />
            </button>

            <div className="w-full h-[1px] bg-slate-300/60 my-1" />

            {/* Line Thickness Selectors */}
            <div className="flex flex-col gap-2 items-center">
              {/* Thin Line */}
              <button
                onClick={() => {
                  SoundManager.playClick();
                  setTool('line');
                  setLineWidth(4);
                }}
                className={`w-12 h-8 rounded-xl flex items-center justify-center border transition-all ${
                  lineWidth === 4 && tool === 'line' ? 'bg-[#FFE874] border-[#FF9F43]' : 'bg-white border-slate-200'
                }`}
                title="Thin Line"
              >
                <div className="w-8 h-[2px] bg-slate-800 rounded-full" />
              </button>

              {/* Medium Line */}
              <button
                onClick={() => {
                  SoundManager.playClick();
                  setLineWidth(8);
                }}
                className={`w-12 h-8 rounded-xl flex items-center justify-center border transition-all ${
                  lineWidth === 8 ? 'bg-[#FFE874] border-[#FF9F43]' : 'bg-white border-slate-200'
                }`}
                title="Medium Line"
              >
                <div className="w-8 h-[5px] bg-slate-800 rounded-full" />
              </button>

              {/* Thick Line */}
              <button
                onClick={() => {
                  SoundManager.playClick();
                  setLineWidth(16);
                }}
                className={`w-12 h-8 rounded-xl flex items-center justify-center border transition-all ${
                  lineWidth === 16 ? 'bg-[#FFE874] border-[#FF9F43]' : 'bg-white border-slate-200'
                }`}
                title="Thick Line"
              >
                <div className="w-8 h-[10px] bg-slate-800 rounded-full" />
              </button>
            </div>
          </div>

          {/* Center Drawing Canvas (With Light Grid Pattern) */}
          <div className="flex-1 flex items-center justify-center relative max-h-[460px]">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-[#DCE4EC] bg-white">
              {/* Grid Background Pattern */}
              <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{
                  backgroundImage:
                    'linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              />

              {/* Main Drawing Canvas */}
              <canvas
                ref={canvasRef}
                width={440}
                height={440}
                className="relative z-10 touch-none cursor-crosshair bg-transparent"
                onMouseDown={handlePointerDown}
                onMouseUp={handlePointerUp}
                onMouseOut={() => {
                  if (isDrawing) handlePointerUp();
                }}
                onMouseMove={handlePointerMove}
                onTouchStart={handlePointerDown}
                onTouchEnd={handlePointerUp}
                onTouchCancel={() => {
                  if (isDrawing) handlePointerUp();
                }}
                onTouchMove={handlePointerMove}
              />

              {/* Shape Preview Layer */}
              <canvas
                ref={previewCanvasRef}
                width={440}
                height={440}
                className="absolute inset-0 z-20 pointer-events-none"
              />
            </div>
          </div>

          {/* Right Toolbar Action Buttons */}
          <div className="flex flex-col gap-3 shrink-0">
            {/* Bring Forward */}
            <button
              onClick={() => SoundManager.playClick()}
              className="w-12 h-12 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm transition-transform active:scale-95 cursor-pointer"
              title="Bring Forward"
            >
              <ArrowUp size={20} />
            </button>

            {/* Duplicate Selection */}
            <button
              onClick={() => SoundManager.playClick()}
              className="w-12 h-12 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm transition-transform active:scale-95 cursor-pointer"
              title="Duplicate"
            >
              <Copy size={20} />
            </button>

            {/* Cut / Clear */}
            <button
              onClick={() => {
                SoundManager.playDelete();
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  pushHistory();
                }
              }}
              className="w-12 h-12 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm transition-transform active:scale-95 cursor-pointer"
              title="Clear / Cut"
            >
              <Scissors size={20} />
            </button>

            {/* Upload Image / Camera */}
            <button
              onClick={() => {
                SoundManager.playClick();
                fileInputRef.current?.click();
              }}
              className="w-12 h-12 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm transition-transform active:scale-95 cursor-pointer"
              title="Upload Image"
            >
              <Camera size={20} />
            </button>

            {/* Fill Bucket Tool */}
            <button
              onClick={() => {
                SoundManager.playClick();
                setTool('fill');
                setDrawMode('fill');
              }}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all cursor-pointer shadow-sm ${
                tool === 'fill' || drawMode === 'fill'
                  ? 'bg-[#BEE1F4] border-[#70C1F3] text-[#2E86DE]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Fill Bucket"
            >
              <PaintBucket size={20} />
            </button>

            {/* Group / Layers */}
            <button
              onClick={() => SoundManager.playClick()}
              className="w-12 h-12 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm transition-transform active:scale-95 cursor-pointer"
              title="Group / Layers"
            >
              <Layers size={20} />
            </button>
          </div>
        </div>

        {/* ── BOTTOM PANEL: COLOR PALETTE & MODE TOGGLE ── */}
        <div className="bg-white p-4 rounded-b-[28px] border-t border-[#E8DFC8] flex items-center gap-4">
          {/* Mode Toggle Bar: Brush vs Fill */}
          <div className="flex items-center gap-1.5 bg-[#F7F2E7] p-1.5 rounded-2xl border border-slate-200 shrink-0">
            <button
              onClick={() => {
                SoundManager.playClick();
                setDrawMode('brush');
                setTool('brush');
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                drawMode === 'brush'
                  ? 'bg-[#FF9F43] text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Brush Mode"
            >
              <Paintbrush size={18} />
            </button>
            <button
              onClick={() => {
                SoundManager.playClick();
                setDrawMode('fill');
                setTool('fill');
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                drawMode === 'fill'
                  ? 'bg-[#FF9F43] text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Fill Bucket Mode"
            >
              <PaintBucket size={18} />
            </button>
          </div>

          {/* 40+ Color Swatches in 2 Rows */}
          <div className="flex-1 overflow-x-auto py-1">
            <div className="grid grid-rows-2 grid-flow-col gap-1.5 min-w-max">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    SoundManager.playClick();
                    setColor(c);
                  }}
                  className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer shadow-xs ${
                    color === c ? 'border-yellow-400 scale-125 ring-2 ring-yellow-300 z-10' : 'border-white hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Custom Color Input & Active Color Eyes Blob Indicator */}
          <div className="flex items-center gap-3 shrink-0">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-9 h-9 rounded-full cursor-pointer border-2 border-slate-300 shadow-sm"
              title="Custom Color Picker"
            />

            {/* Active Color Character Blob 👀 */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-md border-2 border-white relative transition-all"
              style={{ backgroundColor: color }}
            >
              👀
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
