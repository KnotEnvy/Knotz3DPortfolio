import { bus } from '../core/Events';
import { save, type SaveData } from '../core/Save';
import { sectors, totalShards, type SectorId } from '../data/sectors';

export const RANKS = [
  { at: 0, name: 'VISITOR' },
  { at: 120, name: 'OPERATOR' },
  { at: 320, name: 'ANALYST' },
  { at: 600, name: 'ARCHITECT' },
  { at: 940, name: 'PARTNER' },
] as const;

export const XP_PER_SHARD = 25;
export const XP_PER_SECTOR = 40;
export const XP_PER_DECRYPT = 60;
export const XP_PER_NODE = 90;

export interface AchievementDef {
  id: string;
  name: string;
  note: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-contact', name: 'First Contact', note: 'Reached your first sector' },
  { id: 'first-shard', name: 'Data Miner', note: 'Collected a data shard' },
  { id: 'streak-5', name: 'On A Roll', note: 'Five shards without stopping' },
  { id: 'decrypt-1', name: 'Decrypted', note: 'Cleared every shard in a sector' },
  { id: 'ventures', name: 'Due Diligence', note: 'Read the ventures dossier' },
  { id: 'terminal', name: 'Console Cowboy', note: 'Opened the terminal' },
  { id: 'warp', name: 'Shortcut', note: 'Warped with a terminal command' },
  { id: 'all-sectors', name: 'Full Sweep', note: 'Visited all six sectors' },
  { id: 'completionist', name: 'Completionist', note: 'Collected every shard on the map' },
  { id: 'brief', name: 'Straight To Business', note: 'Switched to the written brief' },
  { id: 'first-blood', name: 'First Blood', note: 'Destroyed your first hostile' },
  { id: 'node-1', name: 'Codebreaker', note: 'Broke an encryption node' },
  { id: 'sharpshooter', name: 'Sharpshooter', note: 'Twenty-five hostiles destroyed' },
  { id: 'gunner', name: 'Gunnery Certified', note: 'One hundred hostiles destroyed' },
  { id: 'unshaken', name: 'Unshaken', note: 'Broke a node at full hull integrity' },
];

const achievementById = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

/**
 * Progression: XP, rank, per-sector shard tracking and achievements. Owns the
 * save file and is the single source of truth the HUD renders from.
 */
export class GameState {
  data: SaveData;
  streak = 0;
  private streakTimer = 0;
  readonly startedAt = performance.now();

  constructor() {
    this.data = save.load();
  }

  get xp(): number {
    return this.data.xp;
  }

  get level(): number {
    return RANKS.filter((r) => this.xp >= r.at).length;
  }

  get rank(): string {
    let name: string = RANKS[0].name;
    for (const r of RANKS) if (this.xp >= r.at) name = r.name;
    return name;
  }

  /** Progress toward the next rank, 0..1 (1 at max rank). */
  get rankPct(): number {
    const idx = this.level - 1;
    const cur = RANKS[idx];
    const next = RANKS[idx + 1];
    if (!next) return 1;
    return (this.xp - cur.at) / (next.at - cur.at);
  }

  get collected(): number {
    return Object.values(this.data.shards).reduce((n, list) => n + list.length, 0);
  }

  get totalShards(): number {
    return totalShards;
  }

  shardsIn(id: SectorId): string[] {
    return this.data.shards[id] ?? [];
  }

  isDecrypted(id: SectorId): boolean {
    const def = sectors.find((s) => s.id === id);
    return !!def && this.shardsIn(id).length >= def.shards;
  }

  hasVisited(id: SectorId): boolean {
    return this.data.visited.includes(id);
  }

  private addXp(amount: number): void {
    const before = this.level;
    this.data.xp += amount;
    bus.emit('xp:change', { xp: this.xp, level: this.level, rank: this.rank, pct: this.rankPct });
    if (this.level > before) bus.emit('achievement', { id: 'rank', name: `Rank up — ${this.rank}`, note: `${this.xp} XP` });
    this.persist();
  }

  collectShard(sector: SectorId, key: string): boolean {
    const list = this.data.shards[sector] ?? (this.data.shards[sector] = []);
    if (list.includes(key)) return false;
    list.push(key);

    const now = performance.now();
    this.streak = now - this.streakTimer < 2600 ? this.streak + 1 : 0;
    this.streakTimer = now;

    this.addXp(XP_PER_SHARD);
    bus.emit('shard:collect', { sector, total: this.collected, xp: XP_PER_SHARD });
    this.unlock('first-shard');
    if (this.streak >= 4) this.unlock('streak-5');

    // The mission director owns the 'sector:decrypted' and 'complete' events —
    // it breaks the node before the shards land, so announcing it from here too
    // would fire the same toast twice, several seconds late.
    if (this.isDecrypted(sector)) {
      this.addXp(XP_PER_DECRYPT);
      this.unlock('decrypt-1');
    }
    if (this.collected >= totalShards) this.unlock('completionist');
    return true;
  }

  /** A hostile went down. */
  recordKill(xp: number): void {
    this.data.kills += 1;
    this.addXp(xp);
    bus.emit('enemy:killed', { xp });
    this.unlock('first-blood');
    if (this.data.kills >= 25) this.unlock('sharpshooter');
    if (this.data.kills >= 100) this.unlock('gunner');
  }

  /** An encryption node was broken. `clean` means the run-in cost no hull. */
  recordNode(clean: boolean): void {
    this.data.nodes += 1;
    this.addXp(XP_PER_NODE);
    this.unlock('node-1');
    if (clean) this.unlock('unshaken');
  }

  get kills(): number {
    return this.data.kills;
  }

  get nodesBroken(): number {
    return this.data.nodes;
  }

  get achievements(): string[] {
    return this.data.achievements;
  }

  visit(id: SectorId): void {
    if (this.hasVisited(id)) return;
    this.data.visited.push(id);
    this.addXp(XP_PER_SECTOR);
    this.unlock('first-contact');
    if (id === 'ventures') this.unlock('ventures');
    if (this.data.visited.length >= sectors.length) this.unlock('all-sectors');
    this.persist();
  }

  unlock(id: string): void {
    if (this.data.achievements.includes(id)) return;
    const def = achievementById.get(id);
    if (!def) return;
    this.data.achievements.push(id);
    bus.emit('achievement', { id: def.id, name: def.name, note: def.note });
    this.persist();
  }

  markIntroSeen(): void {
    this.data.seenIntro = true;
    this.persist();
  }

  setMuted(m: boolean): void {
    this.data.muted = m;
    this.persist();
  }

  setBrief(on: boolean): void {
    this.data.brief = on;
    if (on) this.unlock('brief');
    this.persist();
  }

  reset(): void {
    save.clear();
    this.data = save.load();
    bus.emit('xp:change', { xp: 0, level: 1, rank: RANKS[0].name, pct: 0 });
  }

  private persist(): void {
    save.write(this.data);
  }
}
