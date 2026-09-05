import type { SectorId } from '../data/sectors';

export interface AppEvents {
  'sector:enter': { id: SectorId };
  /** `broken` is false when the ship simply flew back to an already-open node. */
  'sector:decrypted': { id: SectorId; broken: boolean };
  'shard:collect': { sector: SectorId; total: number; xp: number };
  'mission:card': { code: string; name: string; subtitle: string; brief: string; index: number; total: number; color: number };
  'wave:spawn': { index: number; count: number };
  'node:armed': { id: SectorId; name: string };
  /** The run has stalled; the interface should start helping. */
  'assist:hint': { text: string };
  'assist:autofire': void;
  'assist:skip': { on: boolean };
  'xp:change': { xp: number; level: number; rank: string; pct: number };
  'achievement': { id: string; name: string; note: string };
  'codex:open': { id: SectorId };
  'codex:close': void;
  'complete': void;
  /** A finished run has coasted to the end of the corridor. */
  'run:parked': void;
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
