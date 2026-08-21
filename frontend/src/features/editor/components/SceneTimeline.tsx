'use client';

import React from 'react';
import { Plus, Trash2, Copy } from 'lucide-react';
import { useProjectStore } from '../../../store/useProjectStore';
import { motion, AnimatePresence } from 'framer-motion';
import { SoundManager } from '../../audio/SoundManager';

export default function SceneTimeline() {
  const {
    scenes,
    activeSceneId,
    setActiveScene,
    addScene,
    removeScene,
    pushHistory,
  } = useProjectStore();

  const handleDuplicateScene = (sceneId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    SoundManager.playClick();
    pushHistory();

    const targetScene = scenes.find((s) => s.id === sceneId);
    if (!targetScene) return;

    const newSceneId = `scene-${Date.now()}`;
    const duplicatedScene = {
      ...JSON.parse(JSON.stringify(targetScene)),
      id: newSceneId,
      name: `${targetScene.name} (Copy)`,
    };

    useProjectStore.setState((state) => ({
      scenes: [...state.scenes, duplicatedScene],
      activeSceneId: newSceneId,
    }));
  };

  return (
    <div className="h-20 sm:h-24 bg-amber-50/90 backdrop-blur border-t-2 sm:border-t-4 border-amber-200 flex items-center px-2 sm:px-4 gap-2 sm:gap-4 overflow-x-auto select-none shrink-0 shadow-inner">
      <div className="flex items-center gap-1.5 shrink-0 hidden sm:flex">
        <span className="w-3 h-3 rounded-full bg-amber-400" />
        <h3 className="text-xs font-black text-amber-600 uppercase tracking-wider">
          Pages
        </h3>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-1.5 sm:py-2 pr-2 sm:pr-4">
        <AnimatePresence mode="popLayout">
          {scenes.map((scene, idx) => {
            const isActive = scene.id === activeSceneId;

            return (
              <motion.div
                key={scene.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  SoundManager.playClick();
                  setActiveScene(scene.id);
                }}
                className={`relative w-20 sm:w-28 h-12 sm:h-16 rounded-xl sm:rounded-2xl flex flex-col items-center justify-between p-1 sm:p-1.5 cursor-pointer transition-all border-2 sm:border-4 shadow-sm shrink-0 group ${
                  isActive
                    ? 'bg-white border-amber-500 shadow-md scale-105 ring-2 sm:ring-4 ring-amber-300/50'
                    : 'bg-amber-100/80 border-amber-200 hover:border-amber-300'
                }`}
                style={{
                  background:
                    scene.background.startsWith('linear-gradient') ||
                    scene.background.startsWith('#')
                      ? scene.background
                      : '#ffffff',
                }}
              >
                {/* Badge Number */}
                <div className="absolute -top-2 -left-2 bg-amber-500 text-white w-5 sm:w-6 h-5 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black border-2 border-white shadow-md">
                  {idx + 1}
                </div>

                {/* Scene Name Banner */}
                <div className="bg-black/40 backdrop-blur-xs text-white text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full truncate max-w-[90%] mt-auto">
                  {scene.name}
                </div>

                {/* Quick Action Overlay */}
                <div className="absolute inset-0 bg-black/30 backdrop-blur-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 sm:gap-2">
                  <button
                    onClick={(e) => handleDuplicateScene(scene.id, e)}
                    className="w-6 sm:w-7 h-6 sm:h-7 bg-white text-amber-600 rounded-full flex items-center justify-center shadow hover:bg-amber-50 hover:scale-110 transition-all"
                    title="Duplicate Page"
                  >
                    <Copy size={10} strokeWidth={3} />
                  </button>

                  {scenes.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        SoundManager.playDelete();
                        removeScene(scene.id);
                      }}
                      className="w-6 sm:w-7 h-6 sm:h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 hover:scale-110 transition-all"
                      title="Delete Page"
                    >
                      <Trash2 size={10} strokeWidth={3} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add New Page */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            SoundManager.playClick();
            addScene();
          }}
          className="w-12 sm:w-16 h-12 sm:h-16 bg-amber-400 hover:bg-amber-300 text-white rounded-xl sm:rounded-2xl border-2 sm:border-4 border-white shadow-md flex items-center justify-center shrink-0 transition-all active:scale-95 cursor-pointer"
          title="Add New Page"
        >
          <Plus size={24} strokeWidth={4} />
        </motion.button>
      </div>
    </div>
  );
}
