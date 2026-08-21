'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Play,
  Hexagon,
  Languages,
  Grid,
  RotateCcw,
  Maximize,
  Image as ImageIcon,
  Save,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Bot,
  Mail,
} from 'lucide-react';
import { useProjectStore } from '../../../store/useProjectStore';
import api from '../../../lib/api';
import { SoundManager } from '../../audio/SoundManager';
import BackgroundPicker from './BackgroundPicker';
import { RuntimeEngine } from '../../blocks/RuntimeEngine';

interface EditorToolbarProps {
  projectId: string;
  onToggleHints: () => void;
  onToggleGrid?: () => void;
  showGrid?: boolean;
}

export default function EditorToolbar({
  projectId,
  onToggleHints,
  onToggleGrid,
  showGrid = false,
}: EditorToolbarProps) {
  const {
    projectTitle,
    serialize,
    setProjectMeta,
    scenes,
    activeSceneId,
    updateSprite,
  } = useProjectStore();

  const [isBgPickerOpen, setIsBgPickerOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const activeScene = scenes.find((s) => s.id === activeSceneId);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ── Run Code (Green Flag) ──
  const handlePlay = () => {
    SoundManager.playClick();
    if (!activeSceneId) return;

    setIsPlaying(true);
    RuntimeEngine.runAll(activeSceneId, 'flag')
      .then(() => {
        setIsPlaying(false);
        SoundManager.playChime();
      })
      .catch(() => {
        setIsPlaying(false);
        SoundManager.playError();
      });
  };

  // ── Stop Execution (Red Hexagon) ──
  const handleStop = () => {
    SoundManager.playClick();
    RuntimeEngine.stopAll();
    setIsPlaying(false);
  };

  // ── Save Project (Cloud + Local Fallback) ──
  const handleSave = async () => {
    SoundManager.playChime();
    const data = serialize();

    // Always persist to localStorage first to prevent data loss
    try {
      if (typeof window !== 'undefined') {
        const localProjects = JSON.parse(localStorage.getItem('logicbox_local_projects') || '{}');
        localProjects[projectId === 'new' ? 'current' : projectId] = {
          title: projectTitle,
          data,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('logicbox_local_projects', JSON.stringify(localProjects));
      }
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }

    // Try Cloud API sync if token exists
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!token) {
      showToast('Saved locally! Log in to sync to cloud. 💾', 'info');
      return;
    }

    try {
      if (projectId === 'new') {
        const res = await api.post('/projects', { title: projectTitle, projectData: data });
        setProjectMeta(res.data._id, res.data.title);
        window.history.replaceState(null, '', `/editor/${res.data._id}`);
      } else {
        await api.put(`/projects/${projectId}`, { title: projectTitle, projectData: data });
      }
      showToast('Saved to Cloud! 🚀', 'success');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err?.response?.status === 401) {
        showToast('Saved locally! Session expired, please log in again. 🔑', 'info');
      } else {
        showToast('Saved locally on device! 💾', 'info');
      }
    }
  };

  // ── Reset Stage ──
  const handleResetStage = () => {
    SoundManager.playClick();
    if (!activeScene) return;

    activeScene.sprites.forEach((sprite) => {
      updateSprite(sprite.id, { x: 400, y: 300, rotation: 0, scale: 1, visible: true });
    });
  };

  // ── Fullscreen Toggle ──
  const toggleFullscreen = () => {
    SoundManager.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <header className="h-[68px] sm:h-[76px] px-2 sm:px-4 lg:px-6 pt-1.5 sm:pt-2 z-30 select-none shrink-0 w-full">
      <div className="h-full bg-white/90 backdrop-blur-md border-2 border-white/80 rounded-2xl sm:rounded-3xl shadow-lg px-2.5 sm:px-4 flex items-center justify-between gap-2 sm:gap-3 overflow-hidden">
        {/* ── Left: Logo & Project Title ── */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/"
            onClick={() => SoundManager.playClick()}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-[#FF9F43] to-[#FF793F] rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Bot size={22} strokeWidth={2.5} className="sm:w-[26px] sm:h-[26px]" />
            </div>
            <span className="font-black text-lg sm:text-2xl text-slate-800 tracking-wider hidden lg:inline">
              LOGICBOX <span className="text-[#00A8FF]">JR</span>
            </span>
          </Link>

          {/* Project Name Input */}
          <div className="relative flex items-center">
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectMeta(projectId, e.target.value)}
              className="font-black text-slate-800 text-xs sm:text-sm bg-slate-100/90 hover:bg-slate-200/70 focus:bg-white border-2 border-slate-200/80 focus:border-[#00A8FF] rounded-xl sm:rounded-2xl px-2.5 sm:px-3.5 py-1 sm:py-1.5 outline-none transition-all w-24 sm:w-36 md:w-48 truncate shadow-inner"
              placeholder="Title..."
            />
          </div>
        </div>

        {/* ── Center: Action Control Pills (Scrollable on small devices) ── */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar py-1 max-w-full">
          {/* Green Flag (Run Code) */}
          <button
            onClick={handlePlay}
            disabled={isPlaying}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md border-2 border-white transition-all active:scale-95 cursor-pointer shrink-0 ${
              isPlaying
                ? 'bg-emerald-400 text-white animate-pulse ring-4 ring-emerald-300/50'
                : 'bg-gradient-to-b from-[#78C850] to-[#58A628] hover:from-[#85D65C] hover:to-[#64B532] text-white hover:scale-105'
            }`}
            title="Run Code (Green Flag)"
          >
            <Play fill="white" size={20} className="sm:w-[24px] sm:h-[24px] ml-0.5" />
          </button>

          {/* Red Hexagon (Stop Execution) */}
          <button
            onClick={handleStop}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-b from-[#FF4757] to-[#D63031] hover:from-[#FF6B81] hover:to-[#EE2020] text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md border-2 border-white transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
            title="Stop (Red Hexagon)"
          >
            <Hexagon fill="white" size={18} className="sm:w-[22px] sm:h-[22px]" />
          </button>

          <div className="w-[1px] h-5 sm:h-6 bg-slate-200 my-auto shrink-0 mx-0.5" />

          {/* Text / Language Label Toggle */}
          <button
            onClick={() => {
              SoundManager.playClick();
              onToggleHints();
            }}
            className="w-9 h-9 sm:w-11 sm:h-11 bg-slate-100 hover:bg-slate-200 text-[#00A8FF] rounded-xl sm:rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border border-slate-200/80 shadow-xs shrink-0"
            title="Text Label Hints"
          >
            <Languages size={18} className="sm:w-[20px] sm:h-[20px]" />
          </button>

          {/* Grid Overlay Toggle */}
          <button
            onClick={() => {
              SoundManager.playClick();
              if (onToggleGrid) onToggleGrid();
            }}
            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border shrink-0 ${
              showGrid
                ? 'bg-[#00A8FF] text-white border-[#0090DF] shadow-md ring-2 ring-[#00A8FF]/30'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80 shadow-xs'
            }`}
            title="Grid Overlay Toggle"
          >
            <Grid size={18} className="sm:w-[20px] sm:h-[20px]" />
          </button>

          {/* Reset Stage */}
          <button
            onClick={handleResetStage}
            className="w-9 h-9 sm:w-11 sm:h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border border-slate-200/80 shadow-xs shrink-0"
            title="Reset Stage & Sprites"
          >
            <RotateCcw size={18} className="sm:w-[20px] sm:h-[20px]" />
          </button>

          {/* Toggle Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="w-9 h-9 sm:w-11 sm:h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border border-slate-200/80 shadow-xs shrink-0"
            title="Toggle Fullscreen"
          >
            <Maximize size={18} className="sm:w-[20px] sm:h-[20px]" />
          </button>

          {/* Background Selector */}
          <button
            onClick={() => {
              SoundManager.playClick();
              setIsBgPickerOpen(true);
            }}
            className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-emerald-400 to-teal-600 hover:from-emerald-300 hover:to-teal-500 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md border-2 border-white transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
            title="Choose Stage Background"
          >
            <ImageIcon size={18} className="sm:w-[22px] sm:h-[22px]" />
          </button>

          <div className="w-[1px] h-5 sm:h-6 bg-slate-200 my-auto shrink-0 mx-0.5" />

          {/* Save Project */}
          <button
            onClick={handleSave}
            className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md border-2 border-white transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
            title="Save Project"
          >
            <Save size={18} className="sm:w-[20px] sm:h-[20px]" />
          </button>

          {/* Open Project */}
          <Link
            href="/"
            onClick={() => SoundManager.playClick()}
            className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-teal-400 to-cyan-600 hover:from-teal-300 hover:to-cyan-500 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md border-2 border-white transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
            title="Open Projects"
          >
            <FolderOpen size={18} className="sm:w-[20px] sm:h-[20px]" />
          </Link>
        </div>

        {/* ── Right: Help, Saved Projects ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Help / Mail */}
          <button
            onClick={() => {
              SoundManager.playClick();
              onToggleHints();
            }}
            className="w-9 h-9 sm:w-11 sm:h-11 bg-blue-50 hover:bg-blue-100 text-[#00A8FF] rounded-xl sm:rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border border-blue-200/80 shadow-xs"
            title="Help & Hints"
          >
            <Mail size={18} className="sm:w-[20px] sm:h-[20px]" />
          </button>
        </div>

        {/* Background Picker Modal */}
        {isBgPickerOpen && (
          <BackgroundPicker onClose={() => setIsBgPickerOpen(false)} />
        )}
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md text-white text-xs sm:text-sm font-black px-4 sm:px-6 py-2.5 rounded-full shadow-2xl border border-white/20 animate-bounce flex items-center gap-2 pointer-events-none">
          <span>{toastMessage.text}</span>
        </div>
      )}
    </header>
  );
}
