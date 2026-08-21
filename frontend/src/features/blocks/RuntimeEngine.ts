import { useProjectStore, BlockCommand } from '../../store/useProjectStore';
import { ScratchBlockData } from './types/scratchBlock';
import { SoundManager } from '../audio/SoundManager';

/** Async sleep helper */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Global message event bus for sprite broadcast communication */
type BroadcastListener = (message: string) => void;
const broadcastListeners = new Set<BroadcastListener>();

export class RuntimeEngine {
  private static activeEngines = new Set<RuntimeEngine>();

  private _isRunning = false;
  private spriteId: string;
  private speedMultiplier = 1.0;
  private currentListener: BroadcastListener | null = null;

  constructor(spriteId: string) {
    this.spriteId = spriteId;
  }

  public get isRunning() {
    return this._isRunning;
  }

  /** Stop all active engines in the project */
  public static stopAll() {
    RuntimeEngine.activeEngines.forEach((engine) => engine.stop());
    RuntimeEngine.activeEngines.clear();
  }

  /** Run single specific block stack (e.g. when user clicks on a block in workspace) */
  public static async runSingleBlockStack(spriteId: string, headBlockId: string) {
    const engine = new RuntimeEngine(spriteId);
    RuntimeEngine.activeEngines.add(engine);
    try {
      await engine.runSpecificHead(headBlockId);
    } finally {
      RuntimeEngine.activeEngines.delete(engine);
    }
  }

  /** Run project-wide scripts for all sprites matching an event type */
  public static async runAll(
    sceneId: string,
    eventType: 'flag' | 'tap' | 'touch' | 'broadcast',
    targetSpriteId?: string,
    messageName?: string
  ) {
    const { scenes } = useProjectStore.getState();
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene) return;

    if (eventType === 'flag') {
      RuntimeEngine.stopAll();
    }

    const targetSprites = targetSpriteId
      ? scene.sprites.filter((s) => s.id === targetSpriteId)
      : scene.sprites;

    const promises: Promise<void>[] = [];

    for (const sprite of targetSprites) {
      if (!sprite.scratchBlocks || !sprite.topLevelBlockIds) continue;

      const topLevelIds = sprite.topLevelBlockIds;
      let ranAny = false;

      for (const headId of topLevelIds) {
        const headBlock = sprite.scratchBlocks[headId];
        if (!headBlock) continue;

        let matches = false;

        if (eventType === 'flag') {
          // If flag clicked, match event_whenflagclicked OR any top-level block if no flag hat exists
          if (
            headBlock.type === 'event_whenflagclicked' ||
            !headBlock.type.startsWith('event_')
          ) {
            matches = true;
          }
        } else if (eventType === 'tap' && headBlock.type === 'event_whenthisspriteclicked') {
          matches = true;
        } else if (eventType === 'touch' && headBlock.type === 'event_whentouchingsprite') {
          matches = true;
        } else if (
          eventType === 'broadcast' &&
          headBlock.type === 'event_whenbroadcastreceived' &&
          (headBlock.inputs.MESSAGE ?? 'message1') === messageName
        ) {
          matches = true;
        }

        if (matches) {
          ranAny = true;
          const engine = new RuntimeEngine(sprite.id);
          RuntimeEngine.activeEngines.add(engine);
          promises.push(
            engine.runSpecificHead(headBlock.id).finally(() => {
              RuntimeEngine.activeEngines.delete(engine);
            })
          );
        }
      }

      // If tap event triggered and sprite had no event_whenthisspriteclicked hat, run top level stacks
      if (eventType === 'tap' && !ranAny) {
        for (const headId of topLevelIds) {
          const headBlock = sprite.scratchBlocks[headId];
          if (headBlock && !headBlock.type.startsWith('event_')) {
            const engine = new RuntimeEngine(sprite.id);
            RuntimeEngine.activeEngines.add(engine);
            promises.push(
              engine.runSpecificHead(headBlock.id).finally(() => {
                RuntimeEngine.activeEngines.delete(engine);
              })
            );
          }
        }
      }
    }

    await Promise.all(promises);
  }

  /** Gracefully stop execution */
  public stop() {
    this._isRunning = false;
    RuntimeEngine.activeEngines.delete(this);
    if (this.currentListener) {
      broadcastListeners.delete(this.currentListener);
      this.currentListener = null;
    }
  }

  /** Find the highest root block ID in a connected stack */
  private getRootBlockId(blockId: string, blocks: Record<string, ScratchBlockData>): string {
    let curr = blockId;
    while (blocks[curr]?.parent && blocks[blocks[curr].parent!]) {
      curr = blocks[curr].parent!;
    }
    return curr;
  }

  /** Run specific head block sequence */
  public async runSpecificHead(headBlockId: string) {
    this._isRunning = true;
    const sprite = this.getSprite();
    if (!sprite || !sprite.scratchBlocks) {
      this._isRunning = false;
      return;
    }
    const rootId = this.getRootBlockId(headBlockId, sprite.scratchBlocks);
    await this.executeScratchNode(rootId, sprite.scratchBlocks);
    this._isRunning = false;
  }

  /** Begin executing the active sprite's script AST */
  public async run() {
    this._isRunning = true;
    RuntimeEngine.activeEngines.add(this);

    const sprite = this.getSprite();
    if (!sprite) {
      this._isRunning = false;
      RuntimeEngine.activeEngines.delete(this);
      return;
    }

    // Register message broadcast listener for this sprite
    this.currentListener = async (message: string) => {
      if (!this._isRunning) return;
      const curSprite = this.getSprite();
      if (!curSprite || !curSprite.scratchBlocks || !curSprite.topLevelBlockIds) return;

      for (const headId of curSprite.topLevelBlockIds) {
        const headBlock = curSprite.scratchBlocks[headId];
        if (
          headBlock &&
          headBlock.type === 'event_whenbroadcastreceived' &&
          (headBlock.inputs.MESSAGE ?? 'message1') === message
        ) {
          await this.executeScratchNode(headBlock.id, curSprite.scratchBlocks);
        }
      }
    };
    broadcastListeners.add(this.currentListener);

    // Check if Scratch block tree exists
    if (sprite.scratchBlocks && sprite.topLevelBlockIds && sprite.topLevelBlockIds.length > 0) {
      const topLevelIds = sprite.topLevelBlockIds;

      for (const headId of topLevelIds) {
        if (!this._isRunning) break;
        const headBlock = sprite.scratchBlocks[headId];
        if (headBlock && headBlock.type !== 'event_whenbroadcastreceived') {
          await this.executeScratchNode(headBlock.id, sprite.scratchBlocks);
        }
      }
    } else if (sprite.scripts && sprite.scripts.length > 0) {
      // Legacy ScratchJr script list fallback execution
      await this.executeBlocks(sprite.scripts);
    }

    this._isRunning = false;
    RuntimeEngine.activeEngines.delete(this);
  }

  // ── Smooth Animated Motion Interpolation (60 FPS) ──
  private async animatePosition(targetX: number, targetY: number, baseDurationMs = 250) {
    const sprite = this.getSprite();
    if (!sprite) return;

    const durationMs = Math.max(50, Math.round(baseDurationMs * this.speedMultiplier));

    // Clamp coordinates within 4:3 stage logical bounds
    const clampedX = Math.max(30, Math.min(770, targetX));
    const clampedY = Math.max(30, Math.min(570, targetY));

    const startX = sprite.x;
    const startY = sprite.y;
    const startTime = performance.now();

    while (this._isRunning) {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Smooth ease-out quad interpolation
      const ease = 1 - (1 - progress) * (1 - progress);
      const curX = startX + (clampedX - startX) * ease;
      const curY = startY + (clampedY - startY) * ease;

      this.update({ x: curX, y: curY });

      // Collision Detection check
      const sceneId = this.getSceneId();
      if (sceneId) {
        const others = this.getOtherSprites();
        for (const other of others) {
          const dist = Math.hypot(curX - other.x, curY - other.y);
          if (dist < 50) {
            RuntimeEngine.runAll(sceneId, 'touch', this.spriteId);
            RuntimeEngine.runAll(sceneId, 'touch', other.id);
          }
        }
      }

      if (progress >= 1) break;
      await sleep(Math.round(16 * this.speedMultiplier));
    }
  }

  private async animateRotation(targetRot: number, baseDurationMs = 200) {
    const sprite = this.getSprite();
    if (!sprite) return;

    const durationMs = Math.max(50, Math.round(baseDurationMs * this.speedMultiplier));
    const startRot = sprite.rotation;
    const startTime = performance.now();

    while (this._isRunning) {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      const ease = 1 - (1 - progress) * (1 - progress);
      const curRot = startRot + (targetRot - startRot) * ease;

      this.update({ rotation: (curRot + 360) % 360 });

      if (progress >= 1) break;
      await sleep(Math.round(16 * this.speedMultiplier));
    }
  }

  // ── Scratch Block Tree Recursive Execution ──
  private async executeScratchNode(
    blockId: string | null,
    blocks: Record<string, ScratchBlockData>
  ) {
    let currentId: string | null = blockId;

    while (currentId && this._isRunning) {
      const block: ScratchBlockData | undefined = blocks[currentId];
      if (!block) break;

      // Execute current Scratch block
      await this.executeScratchBlock(block, blocks);

      // Advance to next connected block in stack
      currentId = block.next;
    }
  }

  private async executeScratchBlock(
    block: ScratchBlockData,
    blocks: Record<string, ScratchBlockData>
  ) {
    const sprite = this.getSprite();
    if (!sprite) return;

    switch (block.type) {
      case 'event_whenflagclicked':
      case 'event_whenthisspriteclicked':
      case 'event_whentouchingsprite':
      case 'event_whenbroadcastreceived':
        // Start hat markers
        break;

      case 'event_broadcast': {
        const msg = String(block.inputs.MESSAGE ?? 'message1');
        SoundManager.playPop();
        const sceneId = this.getSceneId();
        if (sceneId) {
          RuntimeEngine.runAll(sceneId, 'broadcast', undefined, msg);
        } else {
          broadcastListeners.forEach((listener) => listener(msg));
        }
        break;
      }

      case 'motion_movesteps':
      case 'motion_moveright': {
        const stepsVal = Number(block.inputs.STEPS);
        const numSteps = isNaN(stepsVal) || stepsVal <= 0 ? 2 : stepsVal;
        const steps = numSteps * 20;
        await this.animatePosition(sprite.x + steps, sprite.y);
        break;
      }

      case 'motion_moveleft': {
        const stepsVal = Number(block.inputs.STEPS);
        const numSteps = isNaN(stepsVal) || stepsVal <= 0 ? 2 : stepsVal;
        const steps = numSteps * 20;
        await this.animatePosition(sprite.x - steps, sprite.y);
        break;
      }

      case 'motion_moveup': {
        const stepsVal = Number(block.inputs.STEPS);
        const numSteps = isNaN(stepsVal) || stepsVal <= 0 ? 2 : stepsVal;
        const steps = numSteps * 20;
        await this.animatePosition(sprite.x, sprite.y - steps);
        break;
      }

      case 'motion_movedown': {
        const stepsVal = Number(block.inputs.STEPS);
        const numSteps = isNaN(stepsVal) || stepsVal <= 0 ? 2 : stepsVal;
        const steps = numSteps * 20;
        await this.animatePosition(sprite.x, sprite.y + steps);
        break;
      }

      case 'motion_turnright': {
        const degVal = Number(block.inputs.DEGREES);
        const deg = isNaN(degVal) ? 15 : degVal;
        await this.animateRotation(sprite.rotation + deg);
        break;
      }

      case 'motion_turnleft': {
        const degVal = Number(block.inputs.DEGREES);
        const deg = isNaN(degVal) ? 15 : degVal;
        await this.animateRotation(sprite.rotation - deg);
        break;
      }

      case 'motion_jump': {
        const heightVal = Number(block.inputs.HEIGHT);
        const heightMultiplier = isNaN(heightVal) || heightVal <= 0 ? 2 : heightVal;
        const jumpHeight = heightMultiplier * 30;
        const startY = sprite.y;
        await this.animatePosition(sprite.x, startY - jumpHeight, 150);
        await this.animatePosition(sprite.x, startY, 150);
        break;
      }

      case 'motion_gohome': {
        await this.animatePosition(400, 300, 300);
        this.update({ rotation: 0 });
        break;
      }

      case 'motion_gotoxy': {
        const xVal = Number(block.inputs.X);
        const yVal = Number(block.inputs.Y);
        const x = isNaN(xVal) ? 0 : xVal;
        const y = isNaN(yVal) ? 0 : yVal;
        await this.animatePosition(400 + x, 300 - y, 250);
        break;
      }

      case 'looks_say': {
        const msg = String(block.inputs.MESSAGE ?? 'Hello!');
        const secsVal = Number(block.inputs.SECS);
        const secs = isNaN(secsVal) || secsVal <= 0 ? 2 : secsVal;

        this.update({ speechBubble: msg });
        await sleep(Math.round(secs * 1000 * this.speedMultiplier));
        this.update({ speechBubble: null });
        break;
      }

      case 'looks_show':
        this.update({ visible: true });
        break;

      case 'looks_hide':
        this.update({ visible: false });
        break;

      case 'looks_grow': {
        const changeVal = Number(block.inputs.CHANGE);
        const change = isNaN(changeVal) ? 2 : changeVal;
        const newScale = Math.min(3.5, sprite.scale + change * 0.15);
        this.update({ scale: Number(newScale.toFixed(2)) });
        break;
      }

      case 'looks_shrink': {
        const changeVal = Number(block.inputs.CHANGE);
        const change = isNaN(changeVal) ? 2 : changeVal;
        const newScale = Math.max(0.2, sprite.scale - change * 0.15);
        this.update({ scale: Number(newScale.toFixed(2)) });
        break;
      }

      case 'looks_resetsize': {
        this.update({ scale: 1.0 });
        break;
      }

      case 'looks_changesizeby': {
        const changeVal = Number(block.inputs.CHANGE);
        const change = isNaN(changeVal) ? 10 : changeVal;
        this.update({ scale: Math.max(0.2, sprite.scale + change / 100) });
        break;
      }

      case 'looks_setsizeto': {
        const pctVal = Number(block.inputs.SIZE);
        const pct = isNaN(pctVal) ? 100 : pctVal;
        this.update({ scale: Math.max(0.2, pct / 100) });
        break;
      }

      case 'sound_play': {
        const s = String(block.inputs.SOUND ?? 'Meow');
        if (s === 'Meow') SoundManager.playMeow();
        else if (s === 'Pop') SoundManager.playPop();
        else if (s === 'Chime') SoundManager.playChime();
        else SoundManager.playClick();
        await sleep(Math.round(300 * this.speedMultiplier));
        break;
      }

      case 'control_wait': {
        const durVal = Number(block.inputs.DURATION);
        const duration = isNaN(durVal) || durVal <= 0 ? 1 : durVal;
        await sleep(Math.round(duration * 1000 * this.speedMultiplier));
        break;
      }

      case 'control_setspeed': {
        const spd = String(block.inputs.SPEED ?? '2');
        if (spd === '1') this.speedMultiplier = 1.8; // Slow
        else if (spd === '3') this.speedMultiplier = 0.5; // Fast
        else this.speedMultiplier = 1.0; // Normal
        break;
      }

      case 'control_repeat': {
        const timesVal = Number(block.inputs.TIMES);
        const times = isNaN(timesVal) || timesVal <= 0 ? 4 : timesVal;
        const sub = block.substack;
        if (sub) {
          for (let r = 0; r < times; r++) {
            if (!this._isRunning) break;
            await this.executeScratchNode(sub, blocks);
          }
        } else if (block.next) {
          for (let r = 0; r < times; r++) {
            if (!this._isRunning) break;
            await this.executeScratchNode(block.next, blocks);
          }
          return;
        }
        break;
      }

      case 'control_forever': {
        const sub = block.substack || block.next;
        while (this._isRunning) {
          if (sub) {
            await this.executeScratchNode(sub, blocks);
          }
          await sleep(Math.round(16 * this.speedMultiplier));
        }
        return;
      }

      case 'control_stop':
        this.stop();
        return;
    }

    await sleep(Math.round(40 * this.speedMultiplier));
  }

  // ── Legacy Execution Fallback ──
  private async executeBlocks(
    blocks: { id: string; command: BlockCommand; repeatCount?: number }[]
  ) {
    for (let i = 0; i < blocks.length; i++) {
      if (!this._isRunning) return;

      const block = blocks[i];

      if (block.command === 'stop') {
        this.stop();
        return;
      }

      if (block.command === 'forever') {
        const remaining = blocks.slice(i + 1);
        while (this._isRunning) {
          await this.executeBlocks(remaining);
        }
        return;
      }

      if (block.command === 'repeat') {
        const times = block.repeatCount ?? 3;
        const remaining = blocks.slice(i + 1);
        for (let r = 0; r < times; r++) {
          if (!this._isRunning) return;
          await this.executeBlocks(remaining);
        }
        return;
      }

      if (['onFlag', 'onTap', 'onMessage', 'onStart'].includes(block.command)) {
        continue;
      }

      await this.executeCommand(block.command);
    }
  }

  private async executeCommand(command: BlockCommand) {
    const sprite = this.getSprite();
    if (!sprite) return;

    const STEP = 50;

    switch (command) {
      case 'moveRight':
        await this.animatePosition(sprite.x + STEP, sprite.y);
        break;
      case 'moveLeft':
        await this.animatePosition(sprite.x - STEP, sprite.y);
        break;
      case 'moveUp':
        await this.animatePosition(sprite.x, sprite.y - STEP);
        break;
      case 'moveDown':
        await this.animatePosition(sprite.x, sprite.y + STEP);
        break;
      case 'turnRight':
        await this.animateRotation(sprite.rotation + 15);
        break;
      case 'turnLeft':
        await this.animateRotation(sprite.rotation - 15);
        break;
      case 'jump': {
        const startY = sprite.y;
        await this.animatePosition(sprite.x, startY - STEP * 1.5, 150);
        await this.animatePosition(sprite.x, startY, 150);
        break;
      }
      case 'goHome':
        await this.animatePosition(400, 300, 300);
        this.update({ rotation: 0 });
        break;
      case 'hide':
        this.update({ visible: false });
        break;
      case 'show':
        this.update({ visible: true });
        break;
      case 'grow':
        this.update({ scale: Math.min(sprite.scale + 0.25, 4) });
        break;
      case 'shrink':
        this.update({ scale: Math.max(sprite.scale - 0.25, 0.25) });
        break;
      case 'resetSize':
        this.update({ scale: 1 });
        break;
      case 'say':
        this.update({ speechBubble: 'Hello!' });
        await sleep(2000);
        this.update({ speechBubble: null });
        return;
      case 'playSound':
        SoundManager.playMeow();
        await sleep(300);
        return;
      case 'wait':
        await sleep(500);
        return;
      case 'end':
        this.stop();
        return;
    }

    await sleep(100);
  }

  private getSceneId(): string | undefined {
    const { scenes, activeSceneId } = useProjectStore.getState();
    return activeSceneId;
  }

  private getOtherSprites() {
    const { scenes, activeSceneId } = useProjectStore.getState();
    const scene = scenes.find((s) => s.id === activeSceneId);
    if (!scene) return [];
    return scene.sprites.filter((s) => s.id !== this.spriteId);
  }

  private getSprite() {
    const { scenes } = useProjectStore.getState();
    for (const scene of scenes) {
      const found = scene.sprites.find((s) => s.id === this.spriteId);
      if (found) return found;
    }
    return undefined;
  }

  private update(updates: Record<string, unknown>) {
    useProjectStore.getState().updateSprite(this.spriteId, updates);
  }
}
