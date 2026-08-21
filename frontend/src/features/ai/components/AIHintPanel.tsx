'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIHints, Hint } from '../../../hooks/useAIHints';
import { SoundManager } from '../../audio/SoundManager';
import { Lightbulb, X, ChevronRight, Sparkles } from 'lucide-react';

interface AIHintPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_STYLES: Record<Hint['category'], { bg: string; border: string; text: string }> = {
  fix:        { bg: 'bg-red-50',    border: 'border-red-300',    text: 'text-red-600' },
  start:      { bg: 'bg-blue-50',   border: 'border-blue-300',   text: 'text-blue-600' },
  structure:  { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-600' },
  suggestion: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-600' },
  praise:     { bg: 'bg-green-50',  border: 'border-green-300',  text: 'text-green-600' },
};

export default function AIHintPanel({ isOpen, onClose }: AIHintPanelProps) {
  const { getHint, spriteName, totalHints } = useAIHints();
  const [currentHint, setCurrentHint] = useState<Hint | null>(null);
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const hint = getHint();
      setCurrentHint(hint);
      setHintIndex(0);
    }
  }, [isOpen, getHint]);

  const handleNextHint = () => {
    SoundManager.playClick();
    const hint = getHint();
    setCurrentHint(hint);
    setHintIndex(prev => prev + 1);
  };

  if (!isOpen) return null;

  const style = currentHint ? CATEGORY_STYLES[currentHint.category] : CATEGORY_STYLES.start;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]"
      >
        <div className={`${style.bg} ${style.border} border-3 rounded-3xl shadow-2xl overflow-hidden`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white p-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles size={22} />
              </motion.div>
              <span className="font-black text-sm uppercase tracking-wider">AI Hint Helper</span>
            </div>
            <button
              onClick={() => { SoundManager.playClick(); onClose(); }}
              className="bg-amber-500 hover:bg-amber-600 p-1.5 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Mascot + Hint */}
          <div className="p-4">
            <div className="flex gap-3 items-start">
              {/* Mascot */}
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="flex-shrink-0 w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center text-3xl border-2 border-yellow-300 shadow-sm"
              >
                {currentHint?.emoji || '💡'}
              </motion.div>

              {/* Speech bubble */}
              <div className="flex-1 relative">
                {/* Speech bubble triangle */}
                <div className="absolute left-[-8px] top-3 w-0 h-0 border-t-8 border-r-8 border-b-8 border-t-transparent border-b-transparent border-r-white" />

                <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
                  <p className="text-slate-600 font-semibold text-sm leading-relaxed">
                    {currentHint ? (
                      <>
                        <span className={`font-black ${style.text}`}>
                          Hey {spriteName}!{' '}
                        </span>
                        {currentHint.text}
                      </>
                    ) : (
                      <span className="text-green-500 font-black">
                        Your program looks perfect! Keep experimenting! 🎉
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-slate-400 font-bold">
                {totalHints > 0 ? `${Math.min(hintIndex + 1, totalHints)} of ${totalHints} tips` : 'No issues found!'}
              </span>

              {totalHints > 1 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNextHint}
                  className="flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-700 font-bold text-xs px-3 py-1.5 rounded-full transition-colors"
                >
                  Next tip <ChevronRight size={14} />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/** Floating hint button for the toolbar */
export function AIHintButton({ onClick }: { onClick: () => void }) {
  const { totalHints } = useAIHints();

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => { SoundManager.playClick(); onClick(); }}
      className="relative p-2 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors flex items-center gap-2 font-bold px-4 shadow-sm"
      title="AI Hints"
    >
      <Lightbulb size={18} />
      <span className="hidden sm:inline">Hint</span>

      {/* Badge */}
      {totalHints > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-black flex items-center justify-center border-2 border-white"
        >
          {totalHints}
        </motion.span>
      )}
    </motion.button>
  );
}
