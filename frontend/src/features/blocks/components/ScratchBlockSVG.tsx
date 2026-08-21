'use client';

import React from 'react';
import { ScratchBlockData } from '../types/scratchBlock';
import { BLOCK_DEFINITIONS, CATEGORY_COLORS } from '../definitions/blockRegistry';

interface ScratchBlockSVGProps {
  block: ScratchBlockData;
  isDragging?: boolean;
  isGhost?: boolean;
  isSelected?: boolean;
  isPalette?: boolean;
  onInputChange?: (inputName: string, value: string | number) => void;
  renderChild?: (childId: string | null) => React.ReactNode;
  renderSubstack?: (substackId: string | null) => React.ReactNode;
  onPointerDownBlock?: (e: React.PointerEvent, blockId: string) => void;
}

export const ScratchBlockSVG: React.FC<ScratchBlockSVGProps> = ({
  block,
  isDragging = false,
  isGhost = false,
  isSelected = false,
  isPalette = false,
  onInputChange,
  renderChild,
  onPointerDownBlock,
}) => {
  const def = BLOCK_DEFINITIONS[block.type] || {
    category: block.category,
    shape: block.shape,
    label: block.type,
    inputs: [],
  };

  const colors = CATEGORY_COLORS[block.category] || CATEGORY_COLORS.motion;

  const w = 68;
  const h = 64;

  const isHat = block.shape === 'hat' || block.category === 'events';
  const isCap = block.shape === 'cap' || block.type === 'control_forever' || block.type === 'control_repeat';

  // ── Render Authentic ScratchJr Icons ──
  const renderBlockIcon = () => {
    switch (block.type) {
      case 'event_whenflagclicked':
        return (
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
            <path d="M4 21V4" stroke="#488527" strokeWidth="3" strokeLinecap="round" />
            <path
              d="M4 4C7 3 10 5 13 4C16 3 19 5 20 4V13C19 14 16 12 13 13C10 14 7 12 4 13"
              fill="#488527"
              stroke="#488527"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        );

      case 'motion_movesteps':
      case 'motion_moveright':
        return (
          <svg width="38" height="38" viewBox="0 0 32 32" fill="none">
            <rect x="4" y="13" width="3" height="6" rx="1.5" fill="white" />
            <rect x="9" y="13" width="3" height="6" rx="1.5" fill="white" />
            <path
              d="M15 16H27M27 16L21 10M27 16L21 22"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );

      case 'motion_moveup':
        return (
          <svg width="38" height="38" viewBox="0 0 32 32" fill="none">
            <rect x="13" y="23" width="6" height="3" rx="1.5" fill="white" />
            <rect x="13" y="18" width="6" height="3" rx="1.5" fill="white" />
            <path
              d="M16 13V3M16 3L10 9M16 3L22 9"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );

      case 'motion_movedown':
        return (
          <svg width="38" height="38" viewBox="0 0 32 32" fill="none">
            <rect x="13" y="6" width="6" height="3" rx="1.5" fill="white" />
            <rect x="13" y="11" width="6" height="3" rx="1.5" fill="white" />
            <path
              d="M16 19V29M16 29L10 23M16 29L22 23"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );

      case 'motion_moveleft':
        return (
          <svg width="38" height="38" viewBox="0 0 32 32" fill="none">
            <rect x="25" y="13" width="3" height="6" rx="1.5" fill="white" />
            <rect x="20" y="13" width="3" height="6" rx="1.5" fill="white" />
            <path
              d="M17 16H5M5 16L11 10M5 16L11 22"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );

      case 'control_forever':
      case 'control_repeat':
        return (
          <svg width="38" height="38" viewBox="0 0 32 32" fill="none">
            <path
              d="M24 12C24 7.58172 20.4183 4 16 4C11.5817 4 8 7.58172 8 12V14M8 20C8 24.4183 11.5817 28 16 28C20.4183 28 24 24.4183 24 20V18"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M4 12L8 16L12 12M28 20L24 16L20 20"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );

      default:
        return <span className="text-3xl drop-shadow text-white">{colors.icon}</span>;
    }
  };

  const nextElement = renderChild ? renderChild(block.next) : null;
  const inputDef = def.inputs?.[0];
  const inputValue = inputDef ? block.inputs[inputDef.name] ?? inputDef.defaultValue : null;

  return (
    <div
      className={`relative flex items-center ${isDragging ? 'opacity-90 scale-105 transition-transform z-50' : ''} ${isGhost ? 'opacity-40' : ''}`}
      style={{ touchAction: 'none' }}
      onPointerDown={(e) => {
        if (!isPalette && onPointerDownBlock) {
          e.stopPropagation();
          onPointerDownBlock(e, block.id);
        }
      }}
    >
      <div className="relative group inline-block">
        {/* Authentic ScratchJr 3D Glossy SVG Puzzle Path */}
        <svg width={w} height={h} className="overflow-visible filter drop-shadow-md">
          <defs>
            {/* Primary Gradient */}
            <linearGradient id={`grad-${block.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colors.secondary} />
              <stop offset="50%" stopColor={colors.primary} />
              <stop offset="100%" stopColor={colors.dark} />
            </linearGradient>

            {/* Glossy Sheen Overlay */}
            <linearGradient id={`gloss-${block.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.55" />
              <stop offset="50%" stopColor="white" stopOpacity="0.15" />
              <stop offset="100%" stopColor="white" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Outer Glow on Selected */}
          {isSelected && (
            <rect
              x="-2"
              y="-2"
              width={w + 4}
              height={h + 4}
              rx="16"
              fill="none"
              stroke="#FACC15"
              strokeWidth="4"
              className="animate-pulse"
            />
          )}

          {/* Puzzle Block Body */}
          {isHat ? (
            /* Yellow Trigger Start Block (Left Dome Cap, Right Puzzle Notch) */
            <path
              d={`
                M 24 0
                L ${w - 12} 0
                A 12 12 0 0 1 ${w} 12
                L ${w} 24
                c -4 0 -8 4 -8 8 c 0 4 4 8 8 8
                L ${w} 52
                A 12 12 0 0 1 ${w - 12} 64
                L 24 64
                A 32 32 0 0 1 24 0
                Z
              `}
              fill={`url(#grad-${block.id})`}
              stroke={colors.dark}
              strokeWidth="2.5"
            />
          ) : isCap ? (
            /* Red End Block (Left Puzzle Tab, Right Dome Cap) */
            <path
              d={`
                M 12 0
                L ${w - 24} 0
                A 32 32 0 0 1 ${w - 24} 64
                L 12 64
                A 12 12 0 0 1 0 52
                L 0 40
                c 4 0 8 -4 8 -8 c 0 -4 -4 -8 -8 -8
                L 0 12
                A 12 12 0 0 1 12 0
                Z
              `}
              fill={`url(#grad-${block.id})`}
              stroke={colors.dark}
              strokeWidth="2.5"
            />
          ) : (
            /* Standard Command Block (Left Puzzle Tab, Right Puzzle Notch) */
            <path
              d={`
                M 12 0
                L ${w - 12} 0
                A 12 12 0 0 1 ${w} 12
                L ${w} 24
                c -4 0 -8 4 -8 8 c 0 4 4 8 8 8
                L ${w} 52
                A 12 12 0 0 1 ${w - 12} 64
                L 12 64
                A 12 12 0 0 1 0 52
                L 0 40
                c 4 0 8 -4 8 -8 c 0 -4 -4 -8 -8 -8
                L 0 12
                A 12 12 0 0 1 12 0
                Z
              `}
              fill={`url(#grad-${block.id})`}
              stroke={colors.dark}
              strokeWidth="2.5"
            />
          )}

          {/* Top Half Gloss Highlights */}
          <path
            d={`M 10 3 L ${w - 10} 3 A 8 8 0 0 1 ${w - 3} 11 L ${w - 3} 28 L 3 28 L 3 11 A 8 8 0 0 1 10 3 Z`}
            fill={`url(#gloss-${block.id})`}
          />
        </svg>

        {/* Center Icon */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-1">
          {renderBlockIcon()}
        </div>

        {/* Bottom Parameter Input Oval Bubble */}
        {inputDef && inputValue !== null && (
          <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center justify-center">
            {inputDef.type === 'select' && inputDef.options ? (
              <select
                value={String(inputValue)}
                onChange={(e) => onInputChange && onInputChange(inputDef.name, e.target.value)}
                onPointerDown={(e) => e.stopPropagation()}
                className="bg-white text-slate-800 font-black text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full border-2 border-slate-300 shadow-md outline-none focus:border-[#00A8FF] focus:ring-2 focus:ring-blue-300 cursor-pointer"
              >
                {inputDef.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : inputDef.type === 'text' ? (
              <input
                type="text"
                value={String(inputValue)}
                onChange={(e) => onInputChange && onInputChange(inputDef.name, e.target.value)}
                onPointerDown={(e) => e.stopPropagation()}
                className="bg-white text-slate-800 font-black text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full w-16 text-center border-2 border-slate-300 shadow-md outline-none focus:border-[#00A8FF] focus:ring-2 focus:ring-blue-300"
              />
            ) : (
              <input
                type="number"
                value={String(inputValue)}
                onChange={(e) => onInputChange && onInputChange(inputDef.name, e.target.value)}
                onPointerDown={(e) => e.stopPropagation()}
                className="bg-white text-slate-800 font-black text-xs px-1.5 py-0.5 rounded-full w-10 text-center border-2 border-slate-300 shadow-md outline-none focus:border-[#00A8FF] focus:ring-2 focus:ring-blue-300"
              />
            )}
          </div>
        )}
      </div>

      {/* Render Horizontal Connected Child Block */}
      {nextElement && <div className="-ml-3">{nextElement}</div>}
    </div>
  );
};
