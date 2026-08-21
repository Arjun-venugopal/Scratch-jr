'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useProjectStore } from '../../../store/useProjectStore';
import { motion, AnimatePresence } from 'framer-motion';
import { SoundManager } from '../../audio/SoundManager';

export default function RightSceneSidebar() {
  const { scenes, activeSceneId, setActiveScene, addScene, removeScene } = useProjectStore();

  return (
    <div className="w-[56px] sm:w-[140px] md:w-[160px] lg:w-[175px] glass-panel-orange rounded-2xl sm:rounded-[28px] p-1.5 sm:p-3.5 flex flex-col items-center gap-2.5 sm:gap-3 select-none shrink-0 overflow-hidden shadow-xl transition-all">
      {/* Header Title with Pages Count */}
      <div className="w-full flex items-center justify-center sm:justify-between px-0.5">
        <h3 className="text-xs font-black text-amber-700 tracking-wider hidden sm:flex items-center gap-1.5 uppercase">
          <span>🖼️</span> PAGES
        </h3>
        <span className="bg-amber-500/20 text-amber-800 text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-full border border-amber-500/30">
          {scenes.length}
        </span>
      </div>

      {/* Large Green (+) Add Scene Button */}
      <motion.button
        whileHover={{ scale: 1.06, y: -2 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => {
          SoundManager.playClick();
          addScene();
        }}
        className="w-11 h-11 sm:w-full sm:py-2.5 bg-gradient-to-b from-[#78C850] to-[#58A628] hover:from-[#85D65C] hover:to-[#64B532] text-white rounded-xl sm:rounded-2xl flex items-center justify-center gap-1.5 shadow-md border-2 border-white/80 cursor-pointer transition-all font-black text-xs shrink-0"
        title="Add Scene Page"
      >
        <Plus size={20} strokeWidth={3.5} />
        <span className="hidden sm:inline">ADD PAGE</span>
      </motion.button>

      {/* Scrollable Scene Cards List */}
      <div className="w-full flex-1 overflow-y-auto no-scrollbar sm:pr-0.5 flex flex-col items-center gap-2.5 sm:gap-3">
        <AnimatePresence mode="popLayout">
          {scenes.map((scene, idx) => {
            const isActive = scene.id === activeSceneId;

            return (
              <motion.div
                key={scene.id}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  SoundManager.playClick();
                  setActiveScene(scene.id);
                }}
                className={`relative w-full h-[56px] sm:h-[90px] rounded-xl sm:rounded-2xl flex flex-col items-center justify-between p-1.5 sm:p-2 cursor-pointer transition-all border-2 shadow-sm group shrink-0 ${
                  isActive
                    ? 'border-[#FF9F43] shadow-lg ring-2 sm:ring-4 ring-[#FF9F43]/30 scale-[1.01]'
                    : 'border-white/60 hover:border-[#FFD09B]'
                }`}
                style={{
                  background:
                    scene.background.startsWith('linear-gradient') ||
                    scene.background.startsWith('#')
                      ? scene.background
                      : '#ffffff',
                }}
              >
                {/* Scene Number Badge Top Left */}
                <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 bg-gradient-to-r from-[#00A8FF] to-[#0080FF] text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-black border border-white shadow-md">
                  {idx + 1}
                </div>

                {/* Delete Button */}
                {scenes.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      SoundManager.playDelete();
                      removeScene(scene.id);
                    }}
                    className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md"
                    title="Delete Scene"
                  >
                    <Trash2 size={10} className="sm:w-[11px] sm:h-[11px]" strokeWidth={3} />
                  </button>
                )}

                {/* Mini Title Badge Bottom */}
                <div className="bg-black/40 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full mt-auto truncate max-w-[90%] shadow-xs hidden sm:block">
                  {scene.name}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
