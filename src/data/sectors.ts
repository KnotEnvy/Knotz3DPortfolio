import { ventures, projects, career, education, services, skillGroups } from './content';
import { profile } from './profile';

export type SectorId = 'origin' | 'ventures' | 'forge' | 'arcade' | 'track' | 'uplink';

/** A block of content rendered into the codex panel for a sector. */
export type Block =
  | { t: 'lead'; text: string }
  | { t: 'para'; text: string }
  | { t: 'list'; items: string[] }
  | { t: 'stats'; items: { label: string; value: string; note?: string }[] }
  | {
      t: 'cards';
      items: {
        title: string;
        sub?: string;
        text: string;
        meta?: string[];
        /** Rendered in order. `live` marks the one worth pressing first. */
        links?: { label: string; href: string; live?: boolean }[];
      }[];
    }
  | { t: 'timeline'; items: { title: string; sub: string; period: string; points: string[]; current?: boolean }[] }
  | { t: 'chips'; group: string; items: string[] }
  | { t: 'quote'; text: string; by?: string }
  | { t: 'cta'; label: string; href: string; kind?: 'primary' | 'ghost' };

export interface SectorDef {
  id: SectorId;
  index: number;
  code: string;
  name: string;
  subtitle: string;
  /** Landmark geometry archetype rendered at this sector. */
  form: 'knot' | 'twin' | 'reactor' | 'cabinet' | 'spine' | 'beacon';
  color: number;
  position: [number, number, number];
  /** Number of data shards orbiting the landmark. */
  shards: number;
  /** Distance at which the sector boots up and the codex opens. */
  radius: number;
  blocks: Block[];
  /** Revealed only once every shard in the sector is collected. */
  bonus: Block[];
}

const ventureCards = ventures.map((v) => ({
  title: v.name,
  sub: `${v.role} · ${v.period}`,
  text: v.summary,
  meta: v.metrics.map((m) => `${m.value} ${m.label}`),
  links: v.url ? [{ label: 'Visit site', href: v.url, live: true }] : [],
}));

/**
 * A project as a dossier card. Anything playable in a browser leads with that,
 * because a link a client can press and immediately use is worth more than any
 * paragraph describing it.
 */
const projectCard = (id: string) => {
  const p = projects.find((x) => x.id === id)!;
  const links: { label: string; href: string; live?: boolean }[] = [];
  if (p.live) links.push({ label: p.kind === 'game' ? 'Play it now' : 'Open it live', href: p.live, live: true });
  if (p.live2) links.push({ label: p.live2.label, href: p.live2.href, live: true });
  if (p.repo) links.push({ label: 'Source', href: p.repo });
  return {
    title: p.name,
    sub: p.headline,
    text: p.body,
    meta: p.stack,
    links,
  };
};

export const sectors: SectorDef[] = [
  {
    id: 'origin',
    index: 0,
    code: 'SEC-01',
    name: 'ORIGIN',
    subtitle: 'Who you are dealing with',
    form: 'knot',
    color: 0x4de1c1,
    position: [0, 0, -260],
    shards: 5,
    radius: 58,
    blocks: [
      { t: 'lead', text: profile.tagline },
      ...profile.pitch.map((text) => ({ t: 'para' as const, text })),
      { t: 'stats', items: profile.stats.map((s) => ({ ...s })) },
      {
        t: 'list',
        items: profile.values.map((v) => `**${v.k}** — ${v.v}`),
      },
    ],
    bonus: [
      {
        t: 'quote',
        text:
          'The reason my automation works is that I am the one who gets called when it does not. Owner, operator and engineer are the same person here.',
        by: profile.name,
      },
    ],
  },
  {
    id: 'ventures',
    index: 1,
    code: 'SEC-02',
    name: 'VENTURES',
    subtitle: 'Businesses I own and run',
    form: 'twin',
    color: 0xff3d81,
    position: [-190, 40, -700],
    shards: 6,
    radius: 60,
    blocks: [
      {
        t: 'lead',
        text:
          'Two operating companies, one technology practice. This is the part most AI consultants cannot show you.',
      },
      { t: 'cards', items: ventureCards },
      {
        t: 'para',
        text:
          'Cleaning crews, turnover windows, owner statements and guest reviews are not abstractions to me — they are Tuesday. That is why the systems I build for clients survive the first real week.',
      },
    ],
    bonus: [
      { t: 'list', items: ventures[0].points },
      { t: 'list', items: ventures[1].points },
    ],
  },
  {
    id: 'forge',
    index: 2,
    code: 'SEC-03',
    name: 'THE FORGE',
    subtitle: 'AI engineering',
    form: 'reactor',
    color: 0x8b5cf6,
    position: [150, -30, -1180],
    shards: 7,
    radius: 62,
    blocks: [
      {
        t: 'lead',
        text:
          'Retrieval, agents, evaluation and the unglamorous plumbing that turns a demo into something a business can depend on.',
      },
      {
        t: 'cards',
        items: [projectCard('arcade'), projectCard('mathquest'), projectCard('knotzgpt'), projectCard('knotzflix')],
      },
      { t: 'chips', group: skillGroups[0].group, items: [...skillGroups[0].items] },
      { t: 'chips', group: skillGroups[1].group, items: [...skillGroups[1].items] },
    ],
    bonus: [
      {
        t: 'para',
        text:
          'How I actually work: pick the smallest model that clears the bar, measure it against a real evaluation set, keep a human in the loop wherever a wrong answer costs money, and instrument everything so cost and latency are facts rather than surprises.',
      },
    ],
  },
  {
    id: 'arcade',
    index: 3,
    code: 'SEC-04',
    name: 'ARCADE',
    subtitle: 'Game development',
    form: 'cabinet',
    color: 0xffb454,
    position: [-160, 60, -1660],
    shards: 6,
    radius: 60,
    blocks: [
      {
        t: 'lead',
        text:
          'Engines, physics, entity-component systems and progression economies. Games are where you learn to make software that has to be right sixty times a second. Two of these are playable in your browser right now — press the link and judge them yourself.',
      },
      {
        t: 'cards',
        items: [
          projectCard('raven'),
          projectCard('invadespace'),
          projectCard('harddrivin'),
          projectCard('galaxia'),
          projectCard('eclipse'),
          projectCard('casino'),
        ],
      },
      { t: 'chips', group: skillGroups[2].group, items: [...skillGroups[2].items] },
    ],
    bonus: [
      {
        t: 'para',
        text:
          'You are inside the argument right now. This site is a hand-written Three.js engine: fixed-step simulation, custom GLSL, procedural WebAudio, an adaptive quality tier that watches your frame time, and a save system tracking every shard you have collected.',
      },
    ],
  },
  {
    id: 'track',
    index: 4,
    code: 'SEC-05',
    name: 'TRACK RECORD',
    subtitle: 'Fifteen years of operating',
    form: 'spine',
    color: 0x5b9cff,
    position: [190, 10, -2140],
    shards: 6,
    radius: 60,
    blocks: [
      {
        t: 'lead',
        text:
          'Estimator, implementation manager, co-owner, owner, director. The technical career is recent; the business career is not.',
      },
      {
        t: 'timeline',
        items: career.map((r) => ({
          title: r.title,
          sub: `${r.company} · ${r.place}`,
          period: r.period,
          points: r.points,
          current: r.current,
        })),
      },
      {
        t: 'cards',
        items: [
          {
            title: education.school,
            sub: education.degree,
            text: education.notes.join(' '),
            meta: [education.place],
          },
        ],
      },
      { t: 'chips', group: 'Applied AI training', items: education.training },
      { t: 'chips', group: skillGroups[3].group, items: [...skillGroups[3].items] },
    ],
    bonus: [
      {
        t: 'quote',
        text:
          'Fifteen years of P&L, pricing and payroll is not a detour from engineering. It is the reason I know which problem is worth automating.',
        by: profile.name,
      },
    ],
  },
  {
    id: 'uplink',
    index: 5,
    code: 'SEC-06',
    name: 'UPLINK',
    subtitle: 'Work with me',
    form: 'beacon',
    color: 0x4de1c1,
    position: [0, -20, -2620],
    shards: 5,
    radius: 64,
    blocks: [
      {
        t: 'lead',
        text:
          'If your business is running on people doing work a system should be doing, that is a solvable problem. Let us find out how much it is costing you.',
      },
      {
        t: 'cards',
        items: services.map((s) => ({
          title: s.name,
          sub: s.promise,
          text: s.detail,
          meta: s.deliverables,
        })),
      },
      { t: 'cta', label: `Email ${profile.email}`, href: `mailto:${profile.email}?subject=AI%20project%20enquiry`, kind: 'primary' },
      { t: 'cta', label: `Call ${profile.phone}`, href: 'tel:+13863015775', kind: 'ghost' },
      { t: 'cta', label: 'GitHub — KnotEnvy', href: profile.github, kind: 'ghost' },
      { t: 'cta', label: 'LinkedIn', href: profile.linkedin, kind: 'ghost' },
    ],
    bonus: [
      {
        t: 'para',
        text:
          'Every shard collected. You read the whole thing at speed, in a browser, inside a game engine — which is roughly the experience I would like your customers to have with whatever we build together.',
      },
    ],
  },
];

export const sectorById = new Map<SectorId, SectorDef>(sectors.map((s) => [s.id, s]));
export const totalShards = sectors.reduce((n, s) => n + s.shards, 0);
