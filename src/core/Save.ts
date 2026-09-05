import type { SectorId } from '../data/sectors';

export interface SaveData {
  v: number;
  xp: number;
  shards: Record<string, string[]>;
  achievements: string[];
  visited: SectorId[];
  brief: boolean;
  seenIntro: boolean;
  muted: boolean;
  /** Lifetime hostiles destroyed. */
  kills: number;
  /** Lifetime encryption nodes broken. */
  nodes: number;
}

const KEY = 'signal.save.v2';

const blank = (): SaveData => ({
  v: 2,
  xp: 0,
  shards: {},
  achievements: [],
  visited: [],
  brief: false,
  seenIntro: false,
  muted: false,
  kills: 0,
  nodes: 0,
});

/**
 * localStorage-backed progress. Every accessor is defensive: a private window,
 * a wiped profile or a corrupted blob must degrade to a fresh run, never throw.
 */
export const save = {
  load(): SaveData {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      if (parsed.v !== 2) return blank();
      // Spreading over a blank record means fields added after a visitor's last
      // session fill in with defaults instead of arriving undefined.
      return { ...blank(), ...parsed };
    } catch {
      return blank();
    }
  },

  write(data: SaveData): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* storage unavailable — the run simply will not persist */
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* no-op */
    }
  },
};
