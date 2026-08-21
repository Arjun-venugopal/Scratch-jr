'use client';

import { useState, useRef } from 'react';
import {
  Plus,
  Trash2,
  Brush,
  PawPrint,
  Camera,
  Upload,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { useProjectStore } from '../../../store/useProjectStore';
import { svgToUrl } from '../../sprite/AnimalSVGs';
import PaintEditor from '../../paint/components/PaintEditor';
import CharacterLibrary from '../../sprite/components/CharacterLibrary';
import BackgroundPicker from './BackgroundPicker';
import { SoundManager } from '../../audio/SoundManager';
import { motion, AnimatePresence } from 'framer-motion';

export default function SpriteSidebar() {
  const { scenes, activeSceneId, addSprite, removeSprite, setActiveSprite } = useProjectStore();
  const activeScene = scenes.find((s) => s.id === activeSceneId);

  const [isPainting, setIsPainting] = useState(false);
  const [isCharacterLibOpen, setIsCharacterLibOpen] = useState(false);
  const [isBgPickerOpen, setIsBgPickerOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!activeScene) return null;

  // Image File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSceneId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        SoundManager.playChime();
        addSprite(activeSceneId, {
          name: 'Custom',
          emoji: '🖼️',
          customImageData: dataUrl,
          scale: 1,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Webcam Capture Handler
  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      alert('Could not access camera.');
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !activeSceneId) return;
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 300, 300);
      const dataUrl = canvas.toDataURL('image/png');
      SoundManager.playChime();
      addSprite(activeSceneId, {
        name: 'Photo',
        emoji: '📷',
        customImageData: dataUrl,
        scale: 1,
      });
    }

    const stream = videoRef.current.srcObject as MediaStream;
    stream?.getTracks().forEach((track) => track.stop());
    setIsCameraOpen(false);
  };

  return (
    <div className="w-44 sm:w-52 md:w-60 lg:w-64 bg-sky-50/90 backdrop-blur border-r-2 sm:border-r-4 border-sky-200 flex flex-col p-2 sm:p-3 gap-2 sm:gap-3 overflow-y-auto select-none shrink-0 shadow-inner">
      {/* Hidden File Input for Custom Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Header & Background Launcher */}
      <div className="bg-white rounded-2xl p-2 sm:p-2.5 shadow-sm border-2 border-sky-200 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Sparkles className="text-sky-500 hidden sm:inline" size={16} />
          <h3 className="text-[10px] sm:text-xs font-black text-sky-600 uppercase tracking-wider">
            Sprites
          </h3>
        </div>

        <button
          onClick={() => {
            SoundManager.playClick();
            setIsBgPickerOpen(true);
          }}
          className="bg-emerald-500 hover:bg-emerald-400 text-white text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-xl flex items-center gap-1 shadow-sm transition-transform active:scale-95 cursor-pointer"
          title="Change Background"
        >
          <ImageIcon size={12} />
          <span className="hidden sm:inline">Stage</span>
        </button>
      </div>

      {/* Characters List Cards */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {activeScene.sprites.map((sprite) => {
            const isActive = sprite.id === activeScene.activeSpriteId;

            return (
              <motion.div
                key={sprite.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  SoundManager.playClick();
                  setActiveSprite(activeSceneId, sprite.id);
                }}
                className={`relative w-full h-14 sm:h-16 rounded-2xl flex items-center px-2 sm:px-3 gap-2 sm:gap-3 cursor-pointer transition-all border-2 sm:border-4 shadow-sm group ${
                  isActive
                    ? 'bg-white border-sky-500 shadow-md scale-102 ring-2 ring-sky-300'
                    : 'bg-sky-100/70 border-sky-200 hover:border-sky-300'
                }`}
              >
                {/* Sprite Thumbnail */}
                <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0 border border-sky-200 overflow-hidden">
                  {sprite.svgData ? (
                    <img
                      src={svgToUrl(sprite.svgData)}
                      alt={sprite.name}
                      className="w-6 sm:w-8 h-6 sm:h-8 object-contain"
                      draggable={false}
                    />
                  ) : sprite.customImageData ? (
                    <img
                      src={sprite.customImageData}
                      alt={sprite.name}
                      className="w-6 sm:w-8 h-6 sm:h-8 object-contain"
                      draggable={false}
                    />
                  ) : (
                    <span className="text-xl sm:text-2xl">{sprite.emoji}</span>
                  )}
                </div>

                {/* Name */}
                <span className="text-[10px] sm:text-xs font-black text-sky-800 truncate flex-1">
                  {sprite.name}
                </span>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    SoundManager.playDelete();
                    removeSprite(activeSceneId, sprite.id);
                  }}
                  className="w-5 sm:w-6 h-5 sm:h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                  title="Delete Character"
                >
                  <Trash2 size={10} strokeWidth={3} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Character Creation Action Panel */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border-2 border-sky-200 flex flex-col gap-1.5 sm:gap-2">
        <h4 className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
          Add Character
        </h4>

        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          {/* Library */}
          <button
            onClick={() => {
              SoundManager.playClick();
              setIsCharacterLibOpen(true);
            }}
            className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-700 font-black text-[9px] sm:text-[10px] transition-transform active:scale-95 cursor-pointer border border-sky-300"
          >
            <PawPrint size={16} className="text-sky-600 mb-0.5" />
            <span>Library</span>
          </button>

          {/* Draw */}
          <button
            onClick={() => {
              SoundManager.playClick();
              setIsPainting(true);
            }}
            className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-700 font-black text-[9px] sm:text-[10px] transition-transform active:scale-95 cursor-pointer border border-purple-300"
          >
            <Brush size={16} className="text-purple-600 mb-0.5" />
            <span>Draw</span>
          </button>

          {/* Upload */}
          <button
            onClick={() => {
              SoundManager.playClick();
              fileInputRef.current?.click();
            }}
            className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-700 font-black text-[9px] sm:text-[10px] transition-transform active:scale-95 cursor-pointer border border-amber-300"
          >
            <Upload size={16} className="text-amber-600 mb-0.5" />
            <span>Upload</span>
          </button>

          {/* Camera */}
          <button
            onClick={() => {
              SoundManager.playClick();
              startCamera();
            }}
            className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-700 font-black text-[9px] sm:text-[10px] transition-transform active:scale-95 cursor-pointer border border-pink-300"
          >
            <Camera size={16} className="text-pink-600 mb-0.5" />
            <span>Camera</span>
          </button>
        </div>

        {/* Quick Emoji Add */}
        <button
          onClick={() => {
            SoundManager.playClick();
            addSprite(activeSceneId);
          }}
          className="w-full py-1.5 sm:py-2 bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-white rounded-xl font-black text-[10px] sm:text-xs flex items-center justify-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={14} strokeWidth={3} />
          <span>Quick Emoji</span>
        </button>
      </div>

      {/* Modals */}
      {isPainting && <PaintEditor onClose={() => setIsPainting(false)} />}
      {isCharacterLibOpen && (
        <CharacterLibrary onClose={() => setIsCharacterLibOpen(false)} />
      )}
      {isBgPickerOpen && (
        <BackgroundPicker onClose={() => setIsBgPickerOpen(false)} />
      )}

      {/* Camera Capture Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 flex flex-col items-center gap-4 max-w-sm w-full shadow-2xl border-4 border-pink-400">
            <h3 className="font-black text-pink-600 text-lg uppercase tracking-wider">
              Take Photo
            </h3>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-64 h-64 rounded-2xl object-cover border-4 border-pink-200"
            />
            <div className="flex gap-3 w-full">
              <button
                onClick={capturePhoto}
                className="flex-1 py-3 bg-pink-500 hover:bg-pink-600 text-white font-black rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                📸 Snap!
              </button>
              <button
                onClick={() => {
                  const stream = videoRef.current?.srcObject as MediaStream;
                  stream?.getTracks().forEach((track) => track.stop());
                  setIsCameraOpen(false);
                }}
                className="px-4 py-3 bg-slate-200 hover:bg-slate-300 font-bold rounded-2xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
