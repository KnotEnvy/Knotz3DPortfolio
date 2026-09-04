import type { SectorId } from './sectors';

/**
 * Encounter design, one entry per sector.
 *
 * The whole point of this file is pacing. Each sector is a run-in with two
 * waves of resistance, then a locked node that holds the dossier. The visitor
 * always has exactly one objective, it is always visible in the HUD, and it
 * always resolves into a chapter of the résumé. Nobody has to wonder what to do
 * next, which was the single biggest problem with the free-flight draft.
 */

export type EnemyKind = 'drone' | 'weaver' | 'lancer' | 'sentry';

export interface WaveDef {
  /** 0→1 through the run-in. Waves spawn ahead of the ship, on the rail. */
  at: number;
  units: { kind: EnemyKind; count: number }[];
  /** Shown as the objective line while this wave is alive. */
  label: string;
}

export interface MissionDef {
  sector: SectorId;
  /** How far before the node the encounter starts. */
  lead: number;
  waves: WaveDef[];
  /** Node hit points. The shield ring covers the first half. */
  nodeHp: number;
  nodeName: string;
  /** One line of flavour on the mission card, in the fiction's voice. */
  brief: string;
}

export const missions: MissionDef[] = [
  {
    sector: 'origin',
    lead: 300,
    nodeHp: 16,
    nodeName: 'ORIGIN CIPHER',
    brief: 'First contact. Light resistance — use it to learn the guns.',
    waves: [
      { at: 0.16, units: [{ kind: 'drone', count: 4 }], label: 'Clear the scout drones' },
      { at: 0.55, units: [{ kind: 'drone', count: 5 }], label: 'Clear the second flight' },
    ],
  },
  {
    sector: 'ventures',
    lead: 360,
    nodeHp: 22,
    nodeName: 'LEDGER VAULT',
    brief: 'Two operating companies behind this one. The vault is well defended.',
    waves: [
      { at: 0.14, units: [{ kind: 'drone', count: 5 }], label: 'Clear the picket line' },
      { at: 0.52, units: [{ kind: 'lancer', count: 3 }, { kind: 'drone', count: 3 }], label: 'Break the charge run' },
    ],
  },
  {
    sector: 'forge',
    lead: 380,
    nodeHp: 28,
    nodeName: 'FORGE CORE',
    brief: 'Automated defences. They shoot back — keep moving.',
    waves: [
      { at: 0.14, units: [{ kind: 'sentry', count: 3 }], label: 'Silence the sentries' },
      { at: 0.5, units: [{ kind: 'weaver', count: 5 }, { kind: 'lancer', count: 2 }], label: 'Cut through the swarm' },
    ],
  },
  {
    sector: 'arcade',
    lead: 380,
    nodeHp: 32,
    nodeName: 'CABINET MAINFRAME',
    brief: 'Attract mode is over. This one plays back.',
    waves: [
      { at: 0.13, units: [{ kind: 'weaver', count: 6 }], label: 'Clear the formation' },
      { at: 0.5, units: [{ kind: 'lancer', count: 4 }, { kind: 'sentry', count: 2 }], label: 'Survive the boss rush' },
    ],
  },
  {
    sector: 'track',
    lead: 400,
    nodeHp: 36,
    nodeName: 'ARCHIVE SPINE',
    brief: 'Fifteen years of records, and something guarding all of them.',
    waves: [
      { at: 0.13, units: [{ kind: 'sentry', count: 4 }], label: 'Suppress the archive guns' },
      { at: 0.5, units: [{ kind: 'drone', count: 6 }, { kind: 'weaver', count: 4 }], label: 'Push through the screen' },
    ],
  },
  {
    sector: 'uplink',
    lead: 420,
    nodeHp: 42,
    nodeName: 'UPLINK RELAY',
    brief: 'Last gate. Open the relay and the channel is yours.',
    waves: [
      { at: 0.12, units: [{ kind: 'lancer', count: 4 }, { kind: 'weaver', count: 4 }], label: 'Clear the approach' },
      {
        at: 0.5,
        units: [{ kind: 'sentry', count: 3 }, { kind: 'drone', count: 5 }, { kind: 'lancer', count: 2 }],
        label: 'Hold the line',
      },
    ],
  },
];

export const missionBySector = new Map<SectorId, MissionDef>(missions.map((m) => [m.sector, m]));

export interface EnemyProfile {
  hp: number;
  /** Base scale of the hull. */
  size: number;
  /** How fast it closes on, or holds against, the ship. */
  speed: number;
  /** Seconds between shots. 0 means it never fires. */
  fireRate: number;
  /** XP awarded on kill. */
  xp: number;
  color: number;
}

export const enemyProfiles: Record<EnemyKind, EnemyProfile> = {
  // Cannon fodder. Drifts in a lazy weave and never shoots, so the first
  // sector can teach aiming without punishing it.
  drone: { hp: 1, size: 3.6, speed: 26, fireRate: 0, xp: 8, color: 0xff5d7a },
  // Fast lateral sine sweeps. Harder to lead, still harmless.
  weaver: { hp: 2, size: 3.4, speed: 40, fireRate: 0, xp: 12, color: 0xff5db4 },
  // Charges the ship head-on. Threatening on approach, dies fast.
  lancer: { hp: 2, size: 4.4, speed: 82, fireRate: 0, xp: 16, color: 0xff9f45 },
  // Holds station and lobs aimed plasma. The only real pressure in the game.
  sentry: { hp: 4, size: 5.6, speed: 16, fireRate: 1.9, xp: 22, color: 0xb56cff },
};
