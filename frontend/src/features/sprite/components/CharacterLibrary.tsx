'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from '../../../store/useProjectStore';
import {
  ANIMAL_CATEGORY_INFO,
  AnimalCategory,
  AnimalCharacter,
  svgToUrl,
  getCharactersByCategory,
} from '../AnimalSVGs';
import { SoundManager } from '../../audio/SoundManager';

interface CharacterLibraryProps {
  onClose: () => void;
}

const CATEGORIES: AnimalCategory[] = [
  'animals',
  'kids',
  'fantasy',
  'vehicles',
  'objects',
  'letters',
  'numbers',
];

export default function CharacterLibrary({ onClose }: CharacterLibraryProps) {
  const { activeSceneId, addSprite } = useProjectStore();
  const [activeCategory, setActiveCategory] = useState<AnimalCategory>('animals');

  const characters = getCharactersByCategory(activeCategory);

  const handleSelectCharacter = (char: AnimalCharacter) => {
    SoundManager.playSnap();
    addSprite(activeSceneId, {
      name: char.name,
      emoji: char.emoji,
      svgData: char.svg,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col border-4 border-blue-400 max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 flex justify-between items-center">
            <h2 className="text-2xl font-black uppercase tracking-widest flex items-center gap-2">
              🐾 Character Library
            </h2>
            <button
              onClick={() => {
                SoundManager.playClick();
                onClose();
              }}
              className="bg-blue-700 hover:bg-blue-800 p-2 rounded-full transition-colors cursor-pointer"
            >
              <X size={24} />
            </button>
          </div>

          {/* Category Tabs (7 categories) */}
          <div className="flex gap-2 p-4 bg-blue-50 border-b-2 border-blue-100 overflow-x-auto">
            {CATEGORIES.map((cat) => {
              const info = ANIMAL_CATEGORY_INFO[cat];
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-extrabold text-xs transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'text-white shadow-md scale-105'
                      : 'bg-white text-slate-500 hover:bg-slate-50 border-2 border-slate-200'
                  }`}
                  style={isActive ? { backgroundColor: info.color } : undefined}
                >
                  <span className="text-base">{info.emoji}</span>
                  {info.label}
                </motion.button>
              );
            })}
          </div>

          {/* Character Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-4 gap-4">
              {characters.map((char) => (
                <motion.button
                  key={char.id}
                  whileHover={{ scale: 1.08, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelectCharacter(char)}
                  className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border-3 border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="w-20 h-20 flex items-center justify-center">
                    <img
                      src={svgToUrl(char.svg)}
                      alt={char.name}
                      className="w-full h-full object-contain group-hover:drop-shadow-lg transition-all"
                      draggable={false}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors text-center">
                    {char.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Footer hint */}
          <div className="bg-blue-50 p-3 border-t-2 border-blue-100 text-center">
            <span className="text-xs text-blue-500 font-black tracking-wide">
              Click a character to add it to your stage! 🎬
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
