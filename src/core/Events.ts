import type { SectorId } from '../data/sectors';

export interface AppEvents {
  'boot:done': void;
  'game:start': void;
  'sector:enter': { id: SectorId };
  'sector:leave': { id: SectorId };
  'sector:decrypted': { id: SectorId };
  'shard:collect': { sector: SectorId; total: number; xp: number };
  'mission:card': { code: string; name: string; subtitle: string; brief: string; index: number; total: number; color: number };
  'wave:spawn': { index: number; count: number };
  'node:armed': { id: SectorId; name: string };
  'enemy:killed': { xp: number };
  'player:hit': { integrity: number };
  'dossier:continue': void;
  'xp:change': { xp: number; level: number; rank: string; pct: number };
  'achievement': { id: string; name: string; note: string };
  'mode:brief': { on: boolean };
  'terminal:toggle': { on?: boolean };
  'codex:open': { id: SectorId };
  'codex:close': void;
  'warp': { id: SectorId };
  'quality:change': { tier: number };
  'complete': void;
}

type Handler<T> = (payload: T) => void;

/** Minimal typed pub/sub. One bus for the whole app; no framework required. */
class Bus {
  private map = new Map<keyof AppEvents, Set<Handler<never>>>();

  on<K extends keyof AppEvents>(key: K, fn: Handler<AppEvents[K]>): () => void {
    let set = this.map.get(key);
    if (!set) {
      set = new Set();
      this.map.set(key, set);
    }
    set.add(fn as Handler<never>);
    return () => set!.delete(fn as Handler<never>);
  }

  emit<K extends keyof AppEvents>(key: K, payload: AppEvents[K]): void {
    const set = this.map.get(key);
    if (!set) return;
    for (const fn of set) (fn as Handler<AppEvents[K]>)(payload);
  }
}

export const bus = new Bus();
