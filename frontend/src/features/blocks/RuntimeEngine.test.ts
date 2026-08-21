import { RuntimeEngine } from './RuntimeEngine';
import { useProjectStore } from '../../store/useProjectStore';

/**
 * RuntimeEngine Test Suite
 *
 * Tests the core block execution engine against the Zustand store.
 * Uses real timers (setTimeout) so tests run at actual animation speed.
 */
describe('RuntimeEngine', () => {
  beforeEach(() => {
    useProjectStore.getState().resetProject();
  });

  // ── Motion blocks ──────────────────────────────────────────

  it('moveRight: increases X by 50', async () => {
    const { addBlockToSprite } = useProjectStore.getState();
    const sprite = useProjectStore.getState().scenes[0].sprites[0];
    const startX = sprite.x;

    addBlockToSprite(sprite.id, { id: 'b1', command: 'moveRight' });

    const engine = new RuntimeEngine(sprite.id);
    await engine.run();

    const updated = useProjectStore.getState().scenes[0].sprites[0];
    expect(updated.x).toBe(startX + 50);
  });

  it('moveLeft: decreases X by 50', async () => {
    const { addBlockToSprite } = useProjectStore.getState();
    const sprite = useProjectStore.getState().scenes[0].sprites[0];
    const startX = sprite.x;

    addBlockToSprite(sprite.id, { id: 'b1', command: 'moveLeft' });

    const engine = new RuntimeEngine(sprite.id);
    await engine.run();

    const updated = useProjectStore.getState().scenes[0].sprites[0];
    expect(updated.x).toBe(startX - 50);
  });

  it('moveUp: decreases Y by 50', async () => {
    const { addBlockToSprite } = useProjectStore.getState();
    const sprite = useProjectStore.getState().scenes[0].sprites[0];
    const startY = sprite.y;

    addBlockToSprite(sprite.id, { id: 'b1', command: 'moveUp' });

    const engine = new RuntimeEngine(sprite.id);
    await engine.run();

    const updated = useProjectStore.getState().scenes[0].sprites[0];
    expect(updated.y).toBe(startY - 50);
  });

  it('moveDown: increases Y by 50', async () => {
    const { addBlockToSprite } = useProjectStore.getState();
    const sprite = useProjectStore.getState().scenes[0].sprites[0];
    const startY = sprite.y;

    addBlockToSprite(sprite.id, { id: 'b1', command: 'moveDown' });

    const engine = new RuntimeEngine(sprite.id);
    await engine.run();

    const updated = useProjectStore.getState().scenes[0].sprites[0];
    expect(updated.y).toBe(startY + 50);
  });

  // ── Sequential execution ───────────────────────────────────

  it('executes multiple blocks sequentially', async () => {
    const { addBlockToSprite } = useProjectStore.getState();
    const sprite = useProjectStore.getState().scenes[0].sprites[0];
    const startX = sprite.x;
    const startY = sprite.y;

    addBlockToSprite(sprite.id, { id: 'b1', command: 'moveRight' });
    addBlockToSprite(sprite.id, { id: 'b2', command: 'moveDown' });

    const engine = new RuntimeEngine(sprite.id);
    await engine.run();

    const updated = useProjectStore.getState().scenes[0].sprites[0];
    expect(updated.x).toBe(startX + 50);
    expect(updated.y).toBe(startY + 50);
  });

  // ── Looks blocks ───────────────────────────────────────────

  it('hide: sets visible to false', async () => {
    const { addBlockToSprite } = useProjectStore.getState();
    const sprite = useProjectStore.getState().scenes[0].sprites[0];

    addBlockToSprite(sprite.id, { id: 'b1', command: 'hide' });

    const engine = new RuntimeEngine(sprite.id);
    await engine.run();

    const updated = useProjectStore.getState().scenes[0].sprites[0];
    expect(updated.visible).toBe(false);
  });

  it('show: sets visible to true', async () => {
    const { addBlockToSprite, updateSprite } = useProjectStore.getState();
    const sprite = useProjectStore.getState().scenes[0].sprites[0];

    updateSprite(sprite.id, { visible: false });
    addBlockToSprite(sprite.id, { id: 'b1', command: 'show' });

    const engine = new RuntimeEngine(sprite.id);
    await engine.run();

    const updated = useProjectStore.getState().scenes[0].sprites[0];
    expect(updated.visible).toBe(true);
  });

  // ── Stop control ───────────────────────────────────────────

  it('stop block halts execution', async () => {
    const { addBlockToSprite } = useProjectStore.getState();
    const sprite = useProjectStore.getState().scenes[0].sprites[0];
    const startX = sprite.x;

    addBlockToSprite(sprite.id, { id: 'b1', command: 'moveRight' });
    addBlockToSprite(sprite.id, { id: 'b2', command: 'stop' });
    addBlockToSprite(sprite.id, { id: 'b3', command: 'moveRight' }); // Should NOT execute

    const engine = new RuntimeEngine(sprite.id);
    await engine.run();

    const updated = useProjectStore.getState().scenes[0].sprites[0];
    expect(updated.x).toBe(startX + 50); // Only one moveRight executed
  });

  // ── Engine stop() method ───────────────────────────────────

  it('engine.stop() halts a running script', async () => {
    const { addBlockToSprite } = useProjectStore.getState();
    const sprite = useProjectStore.getState().scenes[0].sprites[0];

    // Add many blocks to ensure the engine is still running when we stop it
    for (let i = 0; i < 20; i++) {
      addBlockToSprite(sprite.id, { id: `b${i}`, command: 'moveRight' });
    }

    const engine = new RuntimeEngine(sprite.id);
    const promise = engine.run();

    // Stop after a short delay
    setTimeout(() => engine.stop(), 100);

    await promise;
    expect(engine.isRunning).toBe(false);
  });

  // ── Empty scripts ──────────────────────────────────────────

  it('handles empty script gracefully', async () => {
    const sprite = useProjectStore.getState().scenes[0].sprites[0];
    const engine = new RuntimeEngine(sprite.id);
    await engine.run(); // Should not throw
    expect(engine.isRunning).toBe(false);
  });

  // ── Nonexistent sprite ─────────────────────────────────────

  it('handles nonexistent sprite gracefully', async () => {
    const engine = new RuntimeEngine('nonexistent-sprite');
    await engine.run(); // Should not throw
    expect(engine.isRunning).toBe(false);
  });
});

// ── Store Unit Tests ────────────────────────────────────────────
describe('useProjectStore', () => {
  beforeEach(() => {
    useProjectStore.getState().resetProject();
  });

  it('starts with 1 scene and 1 sprite', () => {
    const { scenes } = useProjectStore.getState();
    expect(scenes).toHaveLength(1);
    expect(scenes[0].sprites).toHaveLength(1);
    expect(scenes[0].sprites[0].name).toBe('Cat');
  });

  it('addScene adds a new scene', () => {
    useProjectStore.getState().addScene();
    expect(useProjectStore.getState().scenes).toHaveLength(2);
  });

  it('removeScene removes a scene and switches active', () => {
    const store = useProjectStore.getState();
    store.addScene();
    const scenes = useProjectStore.getState().scenes;
    store.removeScene(scenes[0].id);
    expect(useProjectStore.getState().scenes).toHaveLength(1);
  });

  it('does not remove the last scene', () => {
    useProjectStore.getState().removeScene('scene-1');
    expect(useProjectStore.getState().scenes).toHaveLength(1);
  });

  it('addSprite adds a sprite to a scene', () => {
    useProjectStore.getState().addSprite('scene-1');
    const sprites = useProjectStore.getState().scenes[0].sprites;
    expect(sprites).toHaveLength(2);
  });

  it('removeSprite removes a sprite', () => {
    const store = useProjectStore.getState();
    store.addSprite('scene-1');
    const spriteId = useProjectStore.getState().scenes[0].sprites[1].id;
    store.removeSprite('scene-1', spriteId);
    expect(useProjectStore.getState().scenes[0].sprites).toHaveLength(1);
  });

  it('addBlockToSprite adds a block', () => {
    const store = useProjectStore.getState();
    store.addBlockToSprite('sprite-1', { id: 'b1', command: 'moveRight' });
    const sprite = useProjectStore.getState().scenes[0].sprites[0];
    expect(sprite.scripts).toHaveLength(1);
    expect(sprite.scripts[0].command).toBe('moveRight');
  });

  it('removeBlockFromSprite removes a block', () => {
    const store = useProjectStore.getState();
    store.addBlockToSprite('sprite-1', { id: 'b1', command: 'moveRight' });
    store.removeBlockFromSprite('sprite-1', 'b1');
    const sprite = useProjectStore.getState().scenes[0].sprites[0];
    expect(sprite.scripts).toHaveLength(0);
  });

  it('undo restores previous state', () => {
    const store = useProjectStore.getState();
    store.addBlockToSprite('sprite-1', { id: 'b1', command: 'moveRight' });

    // Now undo
    useProjectStore.getState().undo();
    const sprite = useProjectStore.getState().scenes[0].sprites[0];
    expect(sprite.scripts).toHaveLength(0);
  });

  it('redo restores undone state', () => {
    const store = useProjectStore.getState();
    store.addBlockToSprite('sprite-1', { id: 'b1', command: 'moveRight' });
    useProjectStore.getState().undo();
    useProjectStore.getState().redo();
    const sprite = useProjectStore.getState().scenes[0].sprites[0];
    expect(sprite.scripts).toHaveLength(1);
  });

  it('serialize/deserialize roundtrips', () => {
    const store = useProjectStore.getState();
    store.addBlockToSprite('sprite-1', { id: 'b1', command: 'moveRight' });
    store.addScene();
    const serialized = useProjectStore.getState().serialize();

    store.resetProject();
    expect(useProjectStore.getState().scenes).toHaveLength(1);

    useProjectStore.getState().deserialize(serialized);
    expect(useProjectStore.getState().scenes).toHaveLength(2);
    expect(useProjectStore.getState().scenes[0].sprites[0].scripts).toHaveLength(1);
  });
});
