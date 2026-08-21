import { useMemo, useRef, useCallback } from 'react';
import { useProjectStore, Block, BlockCommand, BLOCK_CATEGORIES } from '../store/useProjectStore';

export interface Hint {
  id: string;
  text: string;
  emoji: string;
  category: 'start' | 'structure' | 'suggestion' | 'praise' | 'fix';
  suggestedBlock?: BlockCommand;
}

// ── Rule-based Hint Engine ─────────────────────────────────────

function analyzeScript(scripts: Block[]): Hint[] {
  const hints: Hint[] = [];

  // Rule 1: Empty script
  if (scripts.length === 0) {
    hints.push({
      id: 'empty',
      text: 'Start by dragging a green flag trigger block to begin your program!',
      emoji: '🏁',
      category: 'start',
      suggestedBlock: 'onFlag',
    });
    hints.push({
      id: 'empty-tip',
      text: 'Programs need instructions! Try adding blocks from the palette on the left.',
      emoji: '🧩',
      category: 'start',
    });
    return hints;
  }

  const commands = scripts.map(b => b.command);
  const categories = commands.map(c => BLOCK_CATEGORIES[c]);

  const hasTrigger = categories.some(c => c === 'triggers');
  const hasMotion = categories.some(c => c === 'motion');
  const hasLooks = categories.some(c => c === 'looks');
  const hasControl = categories.some(c => c === 'control');
  const hasEnd = commands.includes('end');
  const hasRepeat = commands.includes('repeat');
  const hasForever = commands.includes('forever');

  // Rule 2: No trigger at start
  if (!hasTrigger) {
    hints.push({
      id: 'no-trigger',
      text: 'Programs need a trigger to know when to start! Try adding the Green Flag 🏁 at the beginning.',
      emoji: '⚠️',
      category: 'fix',
      suggestedBlock: 'onFlag',
    });
  } else if (BLOCK_CATEGORIES[commands[0]] !== 'triggers') {
    hints.push({
      id: 'trigger-not-first',
      text: 'The trigger block should be the very first block! Move it to the start of your program.',
      emoji: '📍',
      category: 'fix',
    });
  }

  // Rule 3: Only trigger, no action
  if (hasTrigger && commands.length === 1) {
    hints.push({
      id: 'only-trigger',
      text: 'Great start! Now add a motion block to make your character move!',
      emoji: '➡️',
      category: 'suggestion',
      suggestedBlock: 'moveRight',
    });
  }

  // Rule 4: Has trigger and action but no end
  if (hasTrigger && (hasMotion || hasLooks) && !hasEnd && !hasForever) {
    hints.push({
      id: 'no-end',
      text: "Don't forget to add an End block to finish your program nicely!",
      emoji: '🔚',
      category: 'structure',
      suggestedBlock: 'end',
    });
  }

  // Rule 5: Repeat block as last block (nothing to repeat)
  if (commands[commands.length - 1] === 'repeat') {
    hints.push({
      id: 'repeat-last',
      text: 'The Repeat block needs actions after it to loop! Add blocks after the repeat.',
      emoji: '🔁',
      category: 'fix',
    });
  }

  // Rule 6: Forever block as last block (nothing to loop)
  if (commands[commands.length - 1] === 'forever') {
    hints.push({
      id: 'forever-last',
      text: 'The Forever block needs actions after it to keep looping! Add motion or looks blocks after it.',
      emoji: '♾️',
      category: 'fix',
    });
  }

  // Rule 7: Stop before other blocks
  const stopIdx = commands.indexOf('stop');
  if (stopIdx !== -1 && stopIdx < commands.length - 1) {
    hints.push({
      id: 'stop-early',
      text: 'The Stop block will end your program! Any blocks after it won\'t run.',
      emoji: '🛑',
      category: 'fix',
    });
  }

  // Rule 8: No motion blocks yet (has trigger + some other blocks)
  if (hasTrigger && !hasMotion && commands.length >= 2 && !hasLooks) {
    hints.push({
      id: 'no-motion',
      text: 'Try adding motion blocks to make your character walk, jump, or turn!',
      emoji: '🏃',
      category: 'suggestion',
      suggestedBlock: 'moveRight',
    });
  }

  // Rule 9: Has lots of the same block - suggest variety
  const commandCounts: Partial<Record<BlockCommand, number>> = {};
  for (const cmd of commands) {
    commandCounts[cmd] = (commandCounts[cmd] || 0) + 1;
  }
  const repeatedCmd = Object.entries(commandCounts).find(([, count]) => count >= 4);
  if (repeatedCmd) {
    hints.push({
      id: 'variety',
      text: "You're using the same block many times! Try using the Repeat block 🔁 to make it shorter.",
      emoji: '💡',
      category: 'suggestion',
      suggestedBlock: 'repeat',
    });
  }

  // Rule 10: Good program structure — praise!
  if (hasTrigger && (hasMotion || hasLooks) && (hasEnd || hasForever) && commands.length >= 3) {
    hints.push({
      id: 'great-program',
      text: 'Amazing job! Your program looks great! Try adding sounds or looks blocks for more fun!',
      emoji: '⭐',
      category: 'praise',
    });
  }

  // Rule 11: Suggest sounds if not used
  if (commands.length >= 3 && !categories.some(c => c === 'sound')) {
    hints.push({
      id: 'try-sounds',
      text: 'Make your program come alive with sound! Try adding a Play Sound block 🔊',
      emoji: '🎵',
      category: 'suggestion',
      suggestedBlock: 'playSound',
    });
  }

  // Rule 12: Suggest looks if only motion
  if (hasMotion && !hasLooks && commands.length >= 3) {
    hints.push({
      id: 'try-looks',
      text: 'Try making your character grow, shrink, or say something with Looks blocks!',
      emoji: '🎭',
      category: 'suggestion',
      suggestedBlock: 'say',
    });
  }

  // Rule 13: Has only trigger + end (nothing in between)
  if (commands.length === 2 && hasTrigger && hasEnd) {
    hints.push({
      id: 'trigger-end-only',
      text: 'Your program starts and ends but does nothing in between! Add action blocks in the middle.',
      emoji: '🤔',
      category: 'fix',
      suggestedBlock: 'moveRight',
    });
  }

  return hints;
}

// ── Hook ───────────────────────────────────────────────────────

export function useAIHints() {
  const activeSprite = useProjectStore((s) => s.getActiveSprite());
  const scripts = activeSprite?.scripts ?? [];
  const lastShownRef = useRef<string | null>(null);

  const allHints = useMemo(() => analyzeScript(scripts), [scripts]);

  /** Get the next best hint, avoiding repeating the last shown */
  const getHint = useCallback((): Hint | null => {
    if (allHints.length === 0) return null;

    // Prioritize: fix > start > structure > suggestion > praise
    const priority: Hint['category'][] = ['fix', 'start', 'structure', 'suggestion', 'praise'];

    for (const cat of priority) {
      const catHints = allHints.filter(h => h.category === cat && h.id !== lastShownRef.current);
      if (catHints.length > 0) {
        const hint = catHints[0];
        lastShownRef.current = hint.id;
        return hint;
      }
    }

    // If all have been shown, just return the first one
    const hint = allHints[0];
    lastShownRef.current = hint.id;
    return hint;
  }, [allHints]);

  return {
    getHint,
    totalHints: allHints.length,
    allHints,
    hasScript: scripts.length > 0,
    spriteName: activeSprite?.name ?? 'Sprite',
  };
}
