'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from '../../../store/useProjectStore';
import { SoundManager } from '../../audio/SoundManager';

type BgCategory =
  | 'indoor'
  | 'outdoor'
  | 'space'
  | 'ocean'
  | 'city'
  | 'forest'
  | 'school'
  | 'home';

interface BackgroundOption {
  id: string;
  name: string;
  category: BgCategory;
  css: string;
  emoji: string;
}

const BG_CATEGORY_INFO: Record<BgCategory, { label: string; emoji: string; color: string }> = {
  indoor:  { label: 'Indoor',  emoji: '🏠', color: '#f97316' },
  outdoor: { label: 'Outdoor', emoji: '🌳', color: '#22c55e' },
  space:   { label: 'Space',   emoji: '🚀', color: '#a855f7' },
  ocean:   { label: 'Ocean',   emoji: '🐠', color: '#06b6d4' },
  city:    { label: 'City',    emoji: '🏙️', color: '#3b82f6' },
  forest:  { label: 'Forest',  emoji: '🌲', color: '#15803d' },
  school:  { label: 'School',  emoji: '🏫', color: '#eab308' },
  home:    { label: 'Home',    emoji: '🛋️', color: '#ec4899' },
};

const BACKGROUNDS: BackgroundOption[] = [
  // Indoor
  { id: 'bedroom',   name: 'Bedroom',   category: 'indoor',  emoji: '🛏️', css: 'url("/backgrounds/bedroom.png") center / cover no-repeat' },
  { id: 'living',    name: 'Living Room', category: 'indoor', emoji: '📺', css: 'linear-gradient(180deg, #FEF3C7 0%, #FCD34D 40%, #D97706 100%)' },
  { id: 'playroom',  name: 'Play Room', category: 'indoor',  emoji: '🧸', css: 'linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 100%)' },

  // Outdoor
  { id: 'park',      name: 'Sunny Park', category: 'outdoor', emoji: '☀️🌳', css: 'url("/backgrounds/park.png") center / cover no-repeat' },
  { id: 'desert',    name: 'Desert',    category: 'outdoor', emoji: '🏜️', css: 'url("/backgrounds/desert.png") center / cover no-repeat' },
  { id: 'mountain',  name: 'Mountains', category: 'outdoor', emoji: '🏔️', css: 'url("/backgrounds/mountain.png") center / cover no-repeat' },
  { id: 'sunset',    name: 'Sunset',    category: 'outdoor', emoji: '🌇', css: 'url("/backgrounds/sunset.png") center / cover no-repeat' },

  // Space
  { id: 'space',     name: 'Deep Space', category: 'space',   emoji: '🌌', css: 'url("/backgrounds/space.png") center / cover no-repeat' },
  { id: 'moon',      name: 'Moon Surface', category: 'space',  emoji: '🌕', css: 'linear-gradient(180deg, #030712 0%, #1F2937 50%, #4B5563 100%)' },
  { id: 'alien',     name: 'Alien Planet', category: 'space',  emoji: '🪐', css: 'linear-gradient(180deg, #4C1D95 0%, #831843 50%, #C026D3 100%)' },

  // Ocean
  { id: 'underwater', name: 'Coral Reef', category: 'ocean',  emoji: '🪸', css: 'url("/backgrounds/underwater.png") center / cover no-repeat' },
  { id: 'deepocean',  name: 'Deep Blue', category: 'ocean',  emoji: '🐋', css: 'url("/backgrounds/ocean.png") center / cover no-repeat' },

  // City
  { id: 'downtown',  name: 'City Skyline', category: 'city',  emoji: '🏙️', css: 'linear-gradient(180deg, #1E1B4B 0%, #4338CA 40%, #FBBF24 70%, #374151 100%)' },
  { id: 'street',    name: 'City Street', category: 'city',   emoji: '🚦', css: 'linear-gradient(180deg, #38BDF8 0%, #93C5FD 50%, #64748B 50%, #334155 100%)' },

  // Forest
  { id: 'magicforest', name: 'Enchanted Forest', category: 'forest', emoji: '🍄', css: 'url("/backgrounds/forest.png") center / cover no-repeat' },
  { id: 'jungle',    name: 'Jungle',    category: 'forest',  emoji: '🌴', css: 'linear-gradient(180deg, #14532D 0%, #15803D 50%, #84CC16 100%)' },

  // School
  { id: 'classroom', name: 'Classroom', category: 'school',  emoji: '📚', css: 'linear-gradient(180deg, #FEF9C3 0%, #FDE047 50%, #D97706 100%)' },
  { id: 'playground', name: 'Playground', category: 'school', emoji: '🛝', css: 'linear-gradient(180deg, #60A5FA 0%, #93C5FD 45%, #4ADE80 45%, #16A34A 100%)' },

  // Home
  { id: 'candy',     name: 'Candy Land', category: 'home',    emoji: '🍭', css: 'url("/backgrounds/candy.png") center / cover no-repeat' },
  { id: 'kitchen',   name: 'Kitchen',   category: 'home',    emoji: '🍳', css: 'linear-gradient(180deg, #FFFBEB 0%, #FDE68A 50%, #D97706 100%)' },
];

interface BackgroundPickerProps {
  onClose: () => void;
}

const CATEGORIES: BgCategory[] = [
  'indoor',
  'outdoor',
  'space',
  'ocean',
  'city',
  'forest',
  'school',
  'home',
];

export default function BackgroundPicker({ onClose }: BackgroundPickerProps) {
  const { activeSceneId, setSceneBackground } = useProjectStore();
  const [activeCategory, setActiveCategory] = useState<BgCategory>('indoor');

  const bgs = BACKGROUNDS.filter((b) => b.category === activeCategory);

  const handleSelect = (bg: BackgroundOption) => {
    SoundManager.playSnap();
    setSceneBackground(activeSceneId, bg.css);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="bg-white w-full h-full max-w-[95vw] max-h-[95vh] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col sm:border-4 border-emerald-400"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 sm:p-6 flex justify-between items-center shrink-0">
            <h2 className="text-xl sm:text-3xl font-black uppercase tracking-widest flex items-center gap-3">
              🖼️ Choose Background
            </h2>
            <button
              onClick={() => {
                SoundManager.playClick();
                onClose();
              }}
              className="bg-emerald-700 hover:bg-emerald-800 p-2 sm:p-3 rounded-full transition-colors cursor-pointer shadow-lg"
            >
              <X size={28} />
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 p-3 sm:p-4 bg-emerald-50 border-b-2 border-emerald-100 overflow-x-auto shrink-0 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const info = BG_CATEGORY_INFO[cat];
              const isActive = activeCategory === cat;
              return (
                <motion.button
                  key={cat}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    SoundManager.playClick();
                    setActiveCategory(cat);
                  }}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-extrabold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'text-white shadow-md scale-105'
                      : 'bg-white text-slate-500 hover:bg-slate-50 border-2 border-slate-200'
                  }`}
                  style={isActive ? { backgroundColor: info.color } : undefined}
                >
                  <span className="text-lg sm:text-xl">{info.emoji}</span>
                  {info.label}
                </motion.button>
              );
            })}
          </div>

          {/* Background Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {bgs.map((bg) => (
                <motion.button
                  key={bg.id}
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(bg)}
                  className="flex flex-col items-center gap-2 cursor-pointer group"
                >
                  <div
                    className="w-full aspect-[4/3] rounded-2xl border-4 border-slate-200 group-hover:border-emerald-400 shadow-md group-hover:shadow-2xl transition-all overflow-hidden flex items-center justify-center relative bg-white"
                    style={{ background: bg.css }}
                  >
                    <span className="text-5xl opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all drop-shadow-2xl">
                      {bg.emoji}
                    </span>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-slate-700 group-hover:text-emerald-600 transition-colors bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
                    {bg.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
