'use client';

import React, { useState } from 'react';
import { BlockCategory } from '../types/scratchBlock';
import {
  CATEGORY_COLORS,
  CATEGORY_BLOCK_IDS,
  BLOCK_DEFINITIONS,
} from '../definitions/blockRegistry';
import { ScratchBlockSVG } from './ScratchBlockSVG';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface BlockPaletteSidebarProps {
  onPointerDownPaletteBlock: (e: React.PointerEvent, blockType: string) => void;
}

const CATEGORIES: BlockCategory[] = [
  'motion',
  'looks',
  'sound',
  'events',
  'control',
  'sensing',
  'operators',
  'variables',
  'messages',
];

export const BlockPaletteSidebar: React.FC<BlockPaletteSidebarProps> = ({
  onPointerDownPaletteBlock,
}) => {
  const [activeCategory, setActiveCategory] = useState<BlockCategory>('motion');
  const [searchQuery, setSearchQuery] = useState('');

  const activeColor = CATEGORY_COLORS[activeCategory];
  const blockIds = CATEGORY_BLOCK_IDS[activeCategory] || [];

  const filteredBlockIds = blockIds.filter((id) => {
    const def = BLOCK_DEFINITIONS[id];
    if (!searchQuery) return true;
    return def?.label?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="w-48 sm:w-64 md:w-72 lg:w-80 h-full bg-slate-50 border-r-2 sm:border-r-4 border-slate-200 flex select-none overflow-hidden shrink-0 shadow-sm">
      {/* Category Icons Selector Strip */}
      <div className="w-12 sm:w-16 bg-slate-100 border-r border-slate-200 flex flex-col items-center py-2 sm:py-3 gap-1.5 sm:gap-2 overflow-y-auto shrink-0">
        {CATEGORIES.map((cat) => {
          const color = CATEGORY_COLORS[cat];
          const isActive = activeCategory === cat;

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`w-9 sm:w-12 h-9 sm:h-12 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                isActive
                  ? 'scale-110 shadow-md ring-2 sm:ring-4 ring-blue-400/50'
                  : 'opacity-70 hover:opacity-100 hover:scale-105'
              }`}
              style={{ backgroundColor: color.primary }}
              title={color.label}
            >
              <span className="text-xs sm:text-base">{color.icon}</span>
              <span className="text-[7px] sm:text-[9px] text-white font-black uppercase tracking-tighter leading-none mt-0.5 hidden sm:inline">
                {color.label.slice(0, 3)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category Blocks Drawer */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Category Header & Search */}
        <div className="p-2 sm:p-3 border-b-2 border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <span
              className="w-3 sm:w-4 h-3 sm:h-4 rounded-full inline-block shadow-xs"
              style={{ backgroundColor: activeColor.primary }}
            />
            <h3 className="font-black text-slate-800 text-xs sm:text-sm tracking-wide truncate">
              {activeColor.label}
            </h3>
          </div>

          <div className="relative">
            <Search className="absolute left-2 top-2 text-slate-400" size={12} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-[10px] sm:text-xs text-slate-700 font-bold pl-7 pr-2 py-1 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400 shadow-inner"
            />
          </div>
        </div>

        {/* Scrollable Palette Items */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 flex flex-col gap-3 content-start">
          {filteredBlockIds.length === 0 ? (
            <div className="text-center text-slate-400 font-black text-xs py-8">
              No blocks found.
            </div>
          ) : (
            filteredBlockIds.map((blockType) => {
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
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="cursor-grab active:cursor-grabbing"
                  onPointerDown={(e) => onPointerDownPaletteBlock(e, blockType)}
                >
                  <ScratchBlockSVG block={dummyBlock} isPalette={true} />
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
