import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { ScratchBlockData, SnapTarget } from '../features/blocks/types/scratchBlock';

// ─── Block Types ───────────────────────────────────────────────
export type TriggerCommand = 'onFlag' | 'onTap' | 'onMessage' | 'onStart';
export type MotionCommand = 'moveRight' | 'moveLeft' | 'moveUp' | 'moveDown' | 'jump' | 'turnRight' | 'turnLeft' | 'goHome';
export type LooksCommand = 'hide' | 'show' | 'grow' | 'shrink' | 'resetSize' | 'say';
export type SoundCommand = 'playSound' | 'playRecord';
export type ControlCommand = 'wait' | 'repeat' | 'forever' | 'stop' | 'speed';
export type EndCommand = 'end';

export type BlockCommand =
  | TriggerCommand
  | MotionCommand
  | LooksCommand
  | SoundCommand
  | ControlCommand
  | EndCommand;

export type BlockCategory = 'triggers' | 'motion' | 'looks' | 'sound' | 'control' | 'end';

/** Map every command to its category for palette filtering */
export const BLOCK_CATEGORIES: Record<BlockCommand, BlockCategory> = {
  onFlag: 'triggers', onTap: 'triggers', onMessage: 'triggers', onStart: 'triggers',
  moveRight: 'motion', moveLeft: 'motion', moveUp: 'motion', moveDown: 'motion',
  jump: 'motion', turnRight: 'motion', turnLeft: 'motion', goHome: 'motion',
  hide: 'looks', show: 'looks', grow: 'looks', shrink: 'looks', resetSize: 'looks', say: 'looks',
  playSound: 'sound', playRecord: 'sound',
  wait: 'control', repeat: 'control', forever: 'control', stop: 'control', speed: 'control',
  end: 'end',
};

/** Block icon mapping for consistent display */
export const BLOCK_ICONS: Record<BlockCommand, string> = {
  onFlag: '🏁', onTap: '👆', onMessage: '✉️', onStart: '▶️',
  moveRight: '→', moveLeft: '←', moveUp: '↑', moveDown: '↓',
  jump: '⤴', turnRight: '↻', turnLeft: '↺', goHome: '🏠',
  hide: '👻', show: '👁', grow: '🔼', shrink: '🔽', resetSize: '↔️', say: '💬',
  playSound: '🔊', playRecord: '🎤',
  wait: '⏳', repeat: '🔁', forever: '♾️', stop: '🛑', speed: '⚡',
  end: '🔚',
};

/** Block color mapping per category */
export const CATEGORY_COLORS: Record<BlockCategory, { bg: string; border: string; label: string }> = {
  triggers: { bg: 'bg-yellow-400', border: 'border-yellow-500', label: 'Triggers' },
  motion:   { bg: 'bg-blue-500',   border: 'border-blue-600',   label: 'Motion' },
  looks:    { bg: 'bg-purple-500', border: 'border-purple-600', label: 'Looks' },
  sound:    { bg: 'bg-green-500',  border: 'border-green-600',  label: 'Sound' },
  control:  { bg: 'bg-orange-500', border: 'border-orange-600', label: 'Control' },
  end:      { bg: 'bg-red-500',    border: 'border-red-600',    label: 'End' },
};

// ─── Data Models ───────────────────────────────────────────────
export interface Block {
  id: string;
  command: BlockCommand;
  /** Number of repetitions for 'repeat' blocks */
  repeatCount?: number;
}

export interface Sprite {
  id: string;
  name: string;
  emoji: string;
  customImageData?: string; // Base64 image data for painted sprites
  svgData?: string; // Inline SVG string for animal/character sprites
  x: number;
  y: number;
  rotation: number;
  scale: number;
  visible: boolean;
  scripts: Block[];
  scratchBlocks?: Record<string, ScratchBlockData>;
  topLevelBlockIds?: string[];
  speechBubble?: string | null;
}

export interface Scene {
  id: string;
  name: string;
  background: string; // CSS color or image URL
  sprites: Sprite[];
  activeSpriteId: string | null;
}

// ─── History for Undo / Redo ───────────────────────────────────
interface HistoryEntry {
  scenes: Scene[];
  activeSceneId: string;
}

// ─── Store Interface ───────────────────────────────────────────
interface ProjectState {
  // Project metadata
  projectId: string | null;
  projectTitle: string;

  // Scenes
  scenes: Scene[];
  activeSceneId: string;

  // Undo / Redo
  history: HistoryEntry[];
  historyIndex: number;

  // Computed helpers (not stored, but exposed as getters via actions)
  getActiveScene: () => Scene | undefined;
  getActiveSprite: () => Sprite | undefined;

  // Scene CRUD
  addScene: () => void;
  removeScene: (sceneId: string) => void;
  setActiveScene: (sceneId: string) => void;
  setSceneBackground: (sceneId: string, bg: string) => void;

  // Sprite CRUD
  addSprite: (sceneId: string, customProps?: Partial<Sprite>) => void;
  removeSprite: (sceneId: string, spriteId: string) => void;
  setActiveSprite: (sceneId: string, spriteId: string) => void;
  updateSprite: (spriteId: string, updates: Partial<Sprite>) => void;

  // Block CRUD (Legacy ScratchJr)
  addBlockToSprite: (spriteId: string, block: Block) => void;
  insertBlockToSprite: (spriteId: string, block: Block, index: number) => void;
  removeBlockFromSprite: (spriteId: string, blockId: string) => void;
  reorderSpriteBlocks: (spriteId: string, oldIndex: number, newIndex: number) => void;
  clearSpriteScripts: (spriteId: string) => void;

  // Scratch Block Tree CRUD
  addScratchBlockToSprite: (spriteId: string, block: ScratchBlockData) => void;
  moveScratchBlockStack: (spriteId: string, blockId: string, x: number, y: number) => void;
  snapScratchBlock: (spriteId: string, draggedBlockId: string, target: SnapTarget) => void;
  detachScratchBlock: (spriteId: string, blockId: string, newX: number, newY: number) => void;
  updateScratchBlockInput: (spriteId: string, blockId: string, inputName: string, value: string | number) => void;
  removeScratchBlock: (spriteId: string, blockId: string) => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  // Project
  setProjectMeta: (id: string, title: string) => void;
  resetProject: () => void;

  // Serialization
  serialize: () => object;
  deserialize: (data: unknown) => void;
}

// ─── Helpers ───────────────────────────────────────────────────
let spriteCounter = 1;
let sceneCounter = 1;

function createDefaultSprite(name?: string): Sprite {
  spriteCounter++;
  const defaultNames = ['Cat', 'Dog', 'Bird', 'Fish', 'Bear', 'Fox'];
  const defaultEmojis = ['😺', '🐶', '🐦', '🐠', '🐻', '🦊'];
  const idx = (spriteCounter - 1) % defaultNames.length;
  return {
    id: `sprite-${uuidv4()}`,
    name: name || defaultNames[idx],
    emoji: defaultEmojis[idx],
    x: 400,
    y: 300,
    rotation: 0,
    scale: 1,
    visible: true,
    scripts: [],
  };
}

function createDefaultScene(): Scene {
  sceneCounter++;
  const sprite = createDefaultSprite('Cat');
  return {
    id: `scene-${uuidv4()}`,
    name: `Scene ${sceneCounter}`,
    background: '#ffffff',
    sprites: [sprite],
    activeSpriteId: sprite.id,
  };
}

// ─── Initial State ─────────────────────────────────────────────
const initialSprite: Sprite = {
  id: 'sprite-1',
  name: 'Cat',
  emoji: '😺',
  x: 400,
  y: 300,
  rotation: 0,
  scale: 1,
  visible: true,
  scripts: [],
};

const initialScene: Scene = {
  id: 'scene-1',
  name: 'Scene 1',
  background: '#ffffff',
  sprites: [initialSprite],
  activeSpriteId: 'sprite-1',
};

// ─── Store ─────────────────────────────────────────────────────
export const useProjectStore = create<ProjectState>((set, get) => ({
  projectId: null,
  projectTitle: 'Untitled Project',

  scenes: [initialScene],
  activeSceneId: 'scene-1',

  history: [],
  historyIndex: -1,

  // ── Computed getters ──
  getActiveScene: () => {
    const { scenes, activeSceneId } = get();
    return scenes.find(s => s.id === activeSceneId);
  },

  getActiveSprite: () => {
    const scene = get().getActiveScene();
    if (!scene) return undefined;
    return scene.sprites.find(s => s.id === scene.activeSpriteId);
  },

  // ── Scene CRUD ──
  addScene: () => {
    get().pushHistory();
    const newScene = createDefaultScene();
    set(state => ({
      scenes: [...state.scenes, newScene],
      activeSceneId: newScene.id,
    }));
  },

  removeScene: (sceneId) => {
    get().pushHistory();
    set(state => {
      const filtered = state.scenes.filter(s => s.id !== sceneId);
      if (filtered.length === 0) return state; // Don't allow deleting the last scene
      return {
        scenes: filtered,
        activeSceneId: state.activeSceneId === sceneId ? filtered[0].id : state.activeSceneId,
      };
    });
  },

  setActiveScene: (sceneId) => set({ activeSceneId: sceneId }),

  setSceneBackground: (sceneId, bg) => {
    get().pushHistory();
    set(state => ({
      scenes: state.scenes.map(s => s.id === sceneId ? { ...s, background: bg } : s),
    }));
  },

  // ── Sprite CRUD ──
  addSprite: (sceneId, customProps) => {
    get().pushHistory();
    const newSprite = { ...createDefaultSprite(), ...customProps };
    set(state => ({
      scenes: state.scenes.map(s => {
        if (s.id === sceneId) {
          return { ...s, sprites: [...s.sprites, newSprite], activeSpriteId: newSprite.id };
        }
        return s;
      }),
    }));
  },

  removeSprite: (sceneId, spriteId) => {
    get().pushHistory();
    set(state => ({
      scenes: state.scenes.map(s => {
        if (s.id === sceneId) {
          const filtered = s.sprites.filter(sp => sp.id !== spriteId);
          return {
            ...s,
            sprites: filtered,
            activeSpriteId: s.activeSpriteId === spriteId ? (filtered[0]?.id || null) : s.activeSpriteId,
          };
        }
        return s;
      }),
    }));
  },

  setActiveSprite: (sceneId, spriteId) => {
    set(state => ({
      scenes: state.scenes.map(s =>
        s.id === sceneId ? { ...s, activeSpriteId: spriteId } : s
      ),
    }));
  },

  updateSprite: (spriteId, updates) => {
    set(state => ({
      scenes: state.scenes.map(scene => ({
        ...scene,
        sprites: scene.sprites.map(s =>
          s.id === spriteId ? { ...s, ...updates } : s
        ),
      })),
    }));
  },

  // ── Block CRUD ──
  addBlockToSprite: (spriteId, block) => {
    get().pushHistory();
    set(state => ({
      scenes: state.scenes.map(scene => ({
        ...scene,
        sprites: scene.sprites.map(s =>
          s.id === spriteId ? { ...s, scripts: [...s.scripts, block] } : s
        ),
      })),
    }));
  },

  insertBlockToSprite: (spriteId, block, index) => {
    get().pushHistory();
    set(state => ({
      scenes: state.scenes.map(scene => ({
        ...scene,
        sprites: scene.sprites.map(s => {
          if (s.id !== spriteId) return s;
          const newScripts = Array.from(s.scripts);
          newScripts.splice(index, 0, block);
          return { ...s, scripts: newScripts };
        }),
      })),
    }));
  },

  removeBlockFromSprite: (spriteId, blockId) => {
    get().pushHistory();
    set(state => ({
      scenes: state.scenes.map(scene => ({
        ...scene,
        sprites: scene.sprites.map(s =>
          s.id === spriteId ? { ...s, scripts: s.scripts.filter(b => b.id !== blockId) } : s
        ),
      })),
    }));
  },

  reorderSpriteBlocks: (spriteId, oldIndex, newIndex) => {
    get().pushHistory();
    set(state => ({
      scenes: state.scenes.map(scene => ({
        ...scene,
        sprites: scene.sprites.map(s => {
          if (s.id !== spriteId) return s;
          const newScripts = Array.from(s.scripts);
          const [movedBlock] = newScripts.splice(oldIndex, 1);
          newScripts.splice(newIndex, 0, movedBlock);
          return { ...s, scripts: newScripts };
        }),
      })),
    }));
  },

  clearSpriteScripts: (spriteId) => {
    get().pushHistory();
    set(state => ({
      scenes: state.scenes.map(scene => ({
        ...scene,
        sprites: scene.sprites.map(s =>
          s.id === spriteId ? { ...s, scripts: [], scratchBlocks: {}, topLevelBlockIds: [] } : s
        ),
      })),
    }));
  },

  // ── Scratch Block Tree CRUD ──
  addScratchBlockToSprite: (spriteId, block) => {
    get().pushHistory();
    set(state => ({
      scenes: state.scenes.map(scene => ({
        ...scene,
        sprites: scene.sprites.map(s => {
          if (s.id !== spriteId) return s;
          const scratchBlocks = { ...(s.scratchBlocks || {}), [block.id]: block };
          const topLevelBlockIds = Array.from(s.topLevelBlockIds || []);
          if (!block.parent && !topLevelBlockIds.includes(block.id)) {
            topLevelBlockIds.push(block.id);
          }
          return { ...s, scratchBlocks, topLevelBlockIds };
        }),
      })),
    }));
  },

  moveScratchBlockStack: (spriteId, blockId, x, y) => {
    set(state => ({
      scenes: state.scenes.map(scene => ({
        ...scene,
        sprites: scene.sprites.map(s => {
          if (s.id !== spriteId || !s.scratchBlocks?.[blockId]) return s;
          const target = s.scratchBlocks[blockId];
          return {
            ...s,
            scratchBlocks: {
              ...s.scratchBlocks,
              [blockId]: { ...target, x, y },
            },
          };
        }),
      })),
    }));
  },

  snapScratchBlock: (spriteId, draggedBlockId, snapTarget) => {
    get().pushHistory();
    set(state => ({
      scenes: state.scenes.map(scene => ({
        ...scene,
        sprites: scene.sprites.map(s => {
          if (s.id !== spriteId || !s.scratchBlocks) return s;
          const blocks = { ...s.scratchBlocks };
          const topLevels = (s.topLevelBlockIds || []).filter(id => id !== draggedBlockId);

          const dragged = blocks[draggedBlockId];
          const target = blocks[snapTarget.targetBlockId];

          if (!dragged || !target) return s;

          if (snapTarget.snapType === 'stack-below') {
            const existingNext = target.next;
            target.next = dragged.id;
            dragged.parent = target.id;
            dragged.x = undefined;
            dragged.y = undefined;

            if (existingNext && blocks[existingNext]) {
              // Find bottom-most block in dragged stack
              let lastInDragged = dragged;
              while (lastInDragged.next && blocks[lastInDragged.next]) {
                lastInDragged = blocks[lastInDragged.next];
              }
              lastInDragged.next = existingNext;
              blocks[existingNext].parent = lastInDragged.id;
            }
          } else if (snapTarget.snapType === 'substack-inside') {
            const existingSubstack = target.substack;
            target.substack = dragged.id;
            dragged.parent = target.id;
            dragged.x = undefined;
            dragged.y = undefined;

            if (existingSubstack && blocks[existingSubstack]) {
              let lastInDragged = dragged;
              while (lastInDragged.next && blocks[lastInDragged.next]) {
                lastInDragged = blocks[lastInDragged.next];
              }
              lastInDragged.next = existingSubstack;
              blocks[existingSubstack].parent = lastInDragged.id;
            }
          }

          return { ...s, scratchBlocks: blocks, topLevelBlockIds: topLevels };
        }),
      })),
    }));
  },

  detachScratchBlock: (spriteId, blockId, newX, newY) => {
    get().pushHistory();
    set(state => ({
      scenes: state.scenes.map(scene => ({
        ...scene,
        sprites: scene.sprites.map(s => {
          if (s.id !== spriteId || !s.scratchBlocks?.[blockId]) return s;
          const blocks = { ...s.scratchBlocks };
          const target = { ...blocks[blockId] };

          if (target.parent && blocks[target.parent]) {
            const parent = { ...blocks[target.parent] };
            if (parent.next === blockId) {
              parent.next = null;
            } else if (parent.substack === blockId) {
              parent.substack = null;
            }
            blocks[parent.id] = parent;
          }

          target.parent = null;
          target.x = newX;
          target.y = newY;
          blocks[blockId] = target;

          const topLevels = Array.from(s.topLevelBlockIds || []);
          if (!topLevels.includes(blockId)) {
            topLevels.push(blockId);
          }

          return { ...s, scratchBlocks: blocks, topLevelBlockIds: topLevels };
        }),
      })),
    }));
  },

  updateScratchBlockInput: (spriteId, blockId, inputName, value) => {
    set(state => ({
      scenes: state.scenes.map(scene => ({
        ...scene,
        sprites: scene.sprites.map(s => {
          if (s.id !== spriteId || !s.scratchBlocks?.[blockId]) return s;
          const block = s.scratchBlocks[blockId];
          return {
            ...s,
            scratchBlocks: {
              ...s.scratchBlocks,
              [blockId]: {
                ...block,
                inputs: {
                  ...block.inputs,
                  [inputName]: value,
                },
              },
            },
          };
        }),
      })),
    }));
  },

  removeScratchBlock: (spriteId, blockId) => {
    get().pushHistory();
    set(state => ({
      scenes: state.scenes.map(scene => ({
        ...scene,
        sprites: scene.sprites.map(s => {
          if (s.id !== spriteId || !s.scratchBlocks?.[blockId]) return s;
          const blocks = { ...s.scratchBlocks };

          const deleteSubtree = (id: string) => {
            const node = blocks[id];
            if (!node) return;
            if (node.next) deleteSubtree(node.next);
            if (node.substack) deleteSubtree(node.substack);
            delete blocks[id];
          };

          const target = blocks[blockId];
          if (target.parent && blocks[target.parent]) {
            const parent = blocks[target.parent];
            if (parent.next === blockId) parent.next = null;
            if (parent.substack === blockId) parent.substack = null;
          }

          deleteSubtree(blockId);

          const topLevels = (s.topLevelBlockIds || []).filter(id => id !== blockId);

          return { ...s, scratchBlocks: blocks, topLevelBlockIds: topLevels };
        }),
      })),
    }));
  },

  // ── Undo / Redo ──
  pushHistory: () => {
    set(state => {
      const snapshot: HistoryEntry = {
        scenes: JSON.parse(JSON.stringify(state.scenes)),
        activeSceneId: state.activeSceneId,
      };
      // Truncate any "future" entries if we're not at the end
      const truncated = state.history.slice(0, state.historyIndex + 1);
      // Keep max 50 entries
      const capped = [...truncated, snapshot].slice(-50);
      return { history: capped, historyIndex: capped.length - 1 };
    });
  },

  undo: () => {
    set(state => {
      if (state.historyIndex < 0) return state;
      // Save current state so redo can restore it
      const currentSnapshot: HistoryEntry = {
        scenes: JSON.parse(JSON.stringify(state.scenes)),
        activeSceneId: state.activeSceneId,
      };
      const entry = state.history[state.historyIndex];
      // Place the current snapshot right after historyIndex for redo
      const newHistory = [...state.history];
      newHistory[state.historyIndex + 1] = currentSnapshot;
      return {
        scenes: JSON.parse(JSON.stringify(entry.scenes)),
        activeSceneId: entry.activeSceneId,
        history: newHistory,
        historyIndex: state.historyIndex - 1,
      };
    });
  },

  redo: () => {
    set(state => {
      const redoIndex = state.historyIndex + 2; // +1 for current position, +1 for the next entry
      if (redoIndex >= state.history.length) return state;
      const entry = state.history[redoIndex];
      if (!entry) return state;
      return {
        scenes: JSON.parse(JSON.stringify(entry.scenes)),
        activeSceneId: entry.activeSceneId,
        historyIndex: state.historyIndex + 1,
      };
    });
  },

  // ── Project ──
  setProjectMeta: (id, title) => set({ projectId: id, projectTitle: title }),

  resetProject: () => {
    spriteCounter = 1;
    sceneCounter = 1;
    set({
      projectId: null,
      projectTitle: 'Untitled Project',
      scenes: [{ ...initialScene, sprites: [{ ...initialSprite }] }],
      activeSceneId: 'scene-1',
      history: [],
      historyIndex: -1,
    });
  },

  // ── Serialization ──
  serialize: () => {
    const { projectId, projectTitle, scenes, activeSceneId } = get();
    return { projectId, projectTitle, scenes, activeSceneId };
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deserialize: (data: any) => {
    if (!data || !data.scenes) return;
    set({
      projectId: data.projectId || null,
      projectTitle: data.projectTitle || 'Untitled Project',
      scenes: data.scenes,
      activeSceneId: data.activeSceneId || data.scenes[0]?.id || 'scene-1',
      history: [],
      historyIndex: -1,
    });
  },
}));
