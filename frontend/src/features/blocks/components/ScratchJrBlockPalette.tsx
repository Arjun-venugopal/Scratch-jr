'use client';

import React, { useState } from 'react';
import { BlockCategory } from '../types/scratchBlock';
import {
  CATEGORY_COLORS,
  CATEGORY_BLOCK_IDS,
  BLOCK_DEFINITIONS,
} from '../definitions/blockRegistry';
import { ScratchBlockSVG } from './ScratchBlockSVG';
import { motion } from 'framer-motion';
import { SoundManager } from '../../audio/SoundManager';

interface ScratchJrBlockPaletteProps {
  onPointerDownPaletteBlock: (e: React.PointerEvent, blockType: string) => void;
}

const CATEGORIES: BlockCategory[] = [
  'events',
  'motion',
  'looks',
  'sound',
  'control',
  'messages',
];

export default function ScratchJrBlockPalette({
  onPointerDownPaletteBlock,
}: ScratchJrBlockPaletteProps) {
  const [activeCategory, setActiveCategory] = useState<BlockCategory>('motion');

  const activeColor = CATEGORY_COLORS[activeCategory];
  const blockIds = CATEGORY_BLOCK_IDS[activeCategory] || [];

  return (
    <div className="w-full glass-panel-orange rounded-2xl sm:rounded-[26px] p-2 sm:p-3 flex flex-col md:flex-row items-center gap-2 sm:gap-3 shadow-lg select-none">
      {/* Category Selection Bar */}
      <div className="w-full md:w-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar shrink-0 pb-0.5 md:pb-0 px-0.5">
        {CATEGORIES.map((cat) => {
          const color = CATEGORY_COLORS[cat];
          const isActive = activeCategory === cat;

          return (
            <motion.button
              key={cat}
              whileHover={{ scale: 1.08, y: -1 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                SoundManager.playClick();
                setActiveCategory(cat);
              }}
              className={`w-11 h-11 sm:w-13 sm:h-13 md:w-15 md:h-15 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer shadow-md border-2 border-white/80 shrink-0 ${
                isActive
                  ? 'scale-105 shadow-xl ring-2 sm:ring-4 ring-white border-2 border-white z-10'
                  : 'opacity-85 hover:opacity-100 hover:scale-103'
              }`}
              style={{ backgroundColor: color.primary }}
              title={color.label}
            >
              <span className="text-lg sm:text-xl md:text-2xl drop-shadow">{color.icon}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="hidden md:block w-[2px] h-12 bg-amber-200/80 shrink-0" />

      {/* Horizontal Puzzle Block Drawer */}
      <div className="w-full flex-1 bg-white/80 backdrop-blur-md rounded-xl sm:rounded-2xl p-2 sm:p-2.5 flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar min-h-[76px] sm:min-h-[82px] border border-white/90 shadow-inner">

        {blockIds.map((blockType) => {
          const def = BLOCK_DEFINITIONS[blockType];
          if (!def) return null;

          const dummyBlock = {
            id: `palette-${blockType}`,
            type: blockType,
            category: def.category,
            shape: def.shape,
            inputs: {},
            parent: null,
            next: null,
          };

          return (
            <motion.div
              key={blockType}
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.94 }}
              className="cursor-grab active:cursor-grabbing shrink-0 transition-transform"
              onPointerDown={(e) => onPointerDownPaletteBlock(e, blockType)}
            >
              <ScratchBlockSVG block={dummyBlock} isPalette={true} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
