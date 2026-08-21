'use client';

import React, { useState, useRef } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useProjectStore } from '../../../store/useProjectStore';
import { svgToUrl } from '../../sprite/AnimalSVGs';
import PaintEditor from '../../paint/components/PaintEditor';
import CharacterLibrary from '../../sprite/components/CharacterLibrary';
import { SoundManager } from '../../audio/SoundManager';
import { motion, AnimatePresence } from 'framer-motion';

export default function CharacterSidebar() {
  const { scenes, activeSceneId, addSprite, removeSprite, setActiveSprite } = useProjectStore();
  const activeScene = scenes.find((s) => s.id === activeSceneId);

  const [isPainting, setIsPainting] = useState(false);
  const [isCharacterLibOpen, setIsCharacterLibOpen] = useState(false);
  const [editingSpriteId, setEditingSpriteId] = useState<string | null>(null);

  if (!activeScene) return null;

  return (
    <div className="w-[68px] sm:w-[190px] md:w-[220px] lg:w-[240px] glass-panel-orange rounded-2xl sm:rounded-[28px] p-2 sm:p-3.5 flex flex-col items-center gap-2.5 sm:gap-3 select-none shrink-0 overflow-hidden shadow-xl transition-all">
      {/* Header Title with Sprite Count Badge */}
      <div className="w-full flex items-center justify-center sm:justify-between px-0.5">
        <h3 className="text-xs font-black text-amber-700 tracking-wider hidden sm:flex items-center gap-1.5 uppercase">
          <span>🐱</span> CHARACTERS
        </h3>
        <span className="bg-amber-500/20 text-amber-800 text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-full border border-amber-500/30">
          {activeScene.sprites.length}
        </span>
      </div>

      {/* Large Green (+) Add Character Button */}
      <motion.button
        whileHover={{ scale: 1.06, y: -2 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => {
          SoundManager.playClick();
          setIsCharacterLibOpen(true);
        }}
        className="w-11 h-11 sm:w-full sm:py-2.5 bg-gradient-to-b from-[#78C850] to-[#58A628] hover:from-[#85D65C] hover:to-[#64B532] text-white rounded-xl sm:rounded-2xl flex items-center justify-center gap-1.5 shadow-md border-2 border-white/80 cursor-pointer transition-all font-black text-xs sm:text-sm shrink-0"
        title="Add Character"
      >
        <Plus size={22} strokeWidth={3.5} />
        <span className="hidden sm:inline">ADD SPRITE</span>
      </motion.button>

      {/* Scrollable Character Cards List */}
      <div className="w-full flex-1 overflow-y-auto no-scrollbar sm:pr-0.5 flex flex-col items-center gap-2.5 sm:gap-3">
        <AnimatePresence mode="popLayout">
          {activeScene.sprites.map((sprite) => {
            const isActive = sprite.id === activeScene.activeSpriteId;

            return (
              <motion.div
                key={sprite.id}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  SoundManager.playClick();
                  setActiveSprite(activeSceneId, sprite.id);
                }}
                className={`relative w-full h-[64px] sm:h-[96px] rounded-xl sm:rounded-2xl flex items-center justify-center p-1.5 sm:p-2 cursor-pointer transition-all border-2 group shadow-sm shrink-0 ${
                  isActive
                    ? 'bg-white border-[#FF9F43] shadow-lg ring-2 sm:ring-4 ring-[#FF9F43]/30 scale-[1.01]'
                    : 'bg-white/75 hover:bg-white border-white/60 hover:border-[#FFD09B]'
                }`}
              >
                {/* Active Indicator Sparkle Dot */}
                {isActive && (
                  <div className="absolute top-1 left-1 sm:top-2 sm:left-2 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#FF9F43] rounded-full animate-ping" />
                )}

                {/* Pencil Edit Icon at Top Right */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    SoundManager.playClick();
                    setEditingSpriteId(sprite.id);
                    setIsPainting(true);
                  }}
                  className="absolute top-1 right-1 sm:top-2 sm:right-2 w-5 h-5 sm:w-7 sm:h-7 bg-white text-slate-700 rounded-lg sm:rounded-xl flex items-center justify-center border border-slate-200 shadow-sm hover:bg-amber-50 hover:text-amber-600 transition-all z-10"
                  title="Edit Character"
                >
                  <Edit2 size={11} className="sm:w-[13px] sm:h-[13px]" strokeWidth={2.5} />
                </button>

                {/* Delete Icon on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    SoundManager.playDelete();
                    removeSprite(activeSceneId, sprite.id);
                  }}
                  className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 hover:bg-red-600 text-white rounded-lg sm:rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                  title="Delete Character"
                >
                  <Trash2 size={10} className="sm:w-[11px] sm:h-[11px]" strokeWidth={3} />
                </button>

                {/* Character Image Thumbnail */}
                <div className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center">
                  {sprite.svgData ? (
                    <img
                      src={svgToUrl(sprite.svgData)}
                      alt={sprite.name}
                      className="max-w-full max-h-full object-contain filter drop-shadow-sm transition-transform group-hover:scale-105"
                      draggable={false}
                    />
                  ) : sprite.customImageData ? (
                    <img
                      src={sprite.customImageData}
                      alt={sprite.name}
                      className="max-w-full max-h-full object-contain filter drop-shadow-sm transition-transform group-hover:scale-105"
                      draggable={false}
                    />
                  ) : (
                    <span className="text-2xl sm:text-4xl drop-shadow transition-transform group-hover:scale-105">
                      {sprite.emoji}
                    </span>
                  )}
                </div>

                {/* Character Name Pill */}
                <div className="absolute bottom-1 bg-[#FFF5E6] text-[#D97706] font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full border border-[#FFD09B]/70 shadow-2xs truncate max-w-[80%] text-center hidden sm:block">
                  {sprite.name}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Modals */}
      {isPainting && (
        <PaintEditor
          spriteId={editingSpriteId}
          onClose={() => {
            setIsPainting(false);
            setEditingSpriteId(null);
          }}
        />
      )}
      {isCharacterLibOpen && (
        <CharacterLibrary onClose={() => setIsCharacterLibOpen(false)} />
      )}
    </div>
  );
}
