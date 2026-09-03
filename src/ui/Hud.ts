import { el, icons, hex } from './dom';
import { bus } from '../core/Events';
import type { GameState } from '../game/GameState';
import type { World } from '../world/World';
import type { Ship } from '../player/Ship';
import { sectorById, type SectorId } from '../data/sectors';

const RADAR_RANGE = 620;

/** Rank, shard count, radar and the sector banner. */
export class Hud {
  readonly root: HTMLElement;

  private rankName: HTMLElement;
  private rankXp: HTMLElement;
  private bar: HTMLElement;
  private shardCount: HTMLElement;
  private banner: HTMLElement;
  private bannerCode: HTMLElement;
  private bannerName: HTMLElement;
  private bannerSub: HTMLElement;
  private hint: HTMLElement;
  private touchHint: HTMLElement;
  private target: HTMLElement;
  private targetArrow: HTMLElement;
  private targetName: HTMLElement;
  private targetDist: HTMLElement;
  private blips!: SVGGElement;
  private blipNodes: SVGCircleElement[] = [];
  private bannerTimer = 0;

  constructor(parent: HTMLElement, private state: GameState) {
    this.rankName = el('span', { class: 'rank__name', text: state.rank });
    this.rankXp = el('span', { text: `${state.xp} XP` });
    this.bar = el('i');
    this.shardCount = el('b', { text: `${state.collected}/${state.totalShards}` });

    this.bannerCode = el('div', { class: 'banner__code' });
    this.bannerName = el('h2', { class: 'banner__name' });
    this.bannerSub = el('div', { class: 'banner__sub' });
    this.banner = el('div', { class: 'banner', 'aria-hidden': 'true' }, [
      this.bannerCode,
      this.bannerName,
      this.bannerSub,
    ]);

    this.hint = el('div', { class: 'hint' }, [
      el('span', { html: '<kbd>W A S D</kbd>fly' }),
      el('span', { html: '<kbd>Shift</kbd>boost' }),
      el('span', { html: '<kbd>~</kbd>terminal' }),
      el('span', { html: '<kbd>Esc</kbd>close' }),
    ]);

    this.touchHint = el('div', { class: 'hint hint--touch' }, [
      el('span', { text: 'drag to fly' }),
      el('span', { text: 'hold to boost' }),
    ]);

    this.targetArrow = el('span', { class: 'target__arrow', html: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 20 20 12 16 4 20Z"/></svg>' });
    this.targetName = el('b');
    this.targetDist = el('span', { class: 'target__dist' });
    this.target = el('div', { class: 'target' }, [
      this.targetArrow,
      el('span', { class: 'target__label', text: 'next' }),
      this.targetName,
      this.targetDist,
    ]);

    const radar = this.buildRadar();

    this.root = el('div', { class: 'hud' }, [
      this.banner,
      el('div', { class: 'hud__stats' }, [
        el('div', { class: 'rank' }, [this.rankName, this.rankXp]),
        el('div', { class: 'bar' }, [this.bar]),
        el('div', { class: 'shards' }, [
          el('span', { html: icons.shard }),
          this.shardCount,
          el('span', { text: 'data shards' }),
        ]),
      ]),
      radar,
      this.target,
      this.hint,
      this.touchHint,
    ]);

    parent.append(this.root);

    bus.on('xp:change', () => this.syncStats());
    bus.on('shard:collect', () => this.syncStats());
    bus.on('sector:enter', ({ id }) => this.showBanner(id));
    this.syncStats();
  }

  private buildRadar(): HTMLElement {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '-50 -50 100 100');

    const cone = document.createElementNS(NS, 'path');
    cone.setAttribute('class', 'radar__cone');
    // 90° forward wedge, pointing up.
    cone.setAttribute('d', 'M0 0 L-31.8 -31.8 A45 45 0 0 1 31.8 -31.8 Z');

    const ring = document.createElementNS(NS, 'circle');
    ring.setAttribute('class', 'radar__ring');
    ring.setAttribute('r', '45');

    const inner = document.createElementNS(NS, 'circle');
    inner.setAttribute('class', 'radar__cross');
    inner.setAttribute('r', '24');
    inner.setAttribute('fill', 'none');

    const v = document.createElementNS(NS, 'line');
    v.setAttribute('class', 'radar__cross');
    v.setAttribute('x1', '0');
    v.setAttribute('y1', '-45');
    v.setAttribute('x2', '0');
    v.setAttribute('y2', '45');

    const h = document.createElementNS(NS, 'line');
    h.setAttribute('class', 'radar__cross');
    h.setAttribute('x1', '-45');
    h.setAttribute('y1', '0');
    h.setAttribute('x2', '45');
    h.setAttribute('y2', '0');

    this.blips = document.createElementNS(NS, 'g');

    const self = document.createElementNS(NS, 'path');
    self.setAttribute('class', 'radar__self');
    self.setAttribute('d', 'M0 -5 L4 4 L0 1.6 L-4 4 Z');

    svg.append(ring, cone, inner, v, h, this.blips, self);

    return el('div', { class: 'radar', 'aria-hidden': 'true' }, [
      svg,
      el('div', { class: 'radar__label', text: 'scanner' }),
    ]);
  }

  private syncStats(): void {
    this.rankName.textContent = this.state.rank;
    this.rankXp.textContent = `${this.state.xp} XP`;
    this.bar.style.width = `${Math.round(this.state.rankPct * 100)}%`;
    this.shardCount.textContent = `${this.state.collected}/${this.state.totalShards}`;
  }

  private showBanner(id: SectorId): void {
    const def = sectorById.get(id);
    if (!def) return;
    this.bannerCode.textContent = def.code;
    this.bannerName.textContent = def.name;
    this.bannerSub.textContent = def.subtitle;
    this.banner.style.setProperty('--accent', hex(def.color));
    this.banner.classList.add('on');
    window.clearTimeout(this.bannerTimer);
    this.bannerTimer = window.setTimeout(() => this.banner.classList.remove('on'), 3200);
  }

  private updateTarget(world: World, ship: Ship): void {
    const g = world.guidance(ship);
    if (!g) {
      this.target.classList.remove('on');
      return;
    }
    this.target.classList.add('on');
    this.target.style.setProperty('--accent', hex(g.color));
    if (this.targetName.textContent !== g.name) this.targetName.textContent = g.name;
    const metres = Math.round(g.dist);
    this.targetDist.textContent = `${metres}m`;
    this.targetArrow.style.transform = `rotate(${(g.angle * 180) / Math.PI}deg)`;
  }

  setVisible(on: boolean): void {
    this.root.classList.toggle('on', on);
  }

  fadeHint(): void {
    this.hint.classList.add('fade');
    this.touchHint.classList.add('fade');
  }

  /** Called every frame; cheap DOM writes only. */
  update(world: World, ship: Ship): void {
    this.updateTarget(world, ship);

    const data = world.radarData(ship);
    const NS = 'http://www.w3.org/2000/svg';

    while (this.blipNodes.length < data.length) {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', '2.6');
      this.blips.append(c);
      this.blipNodes.push(c);
    }

    data.forEach((d, i) => {
      const node = this.blipNodes[i];
      const r = Math.min(1, d.dist / RADAR_RANGE) * 42;
      const x = Math.sin(d.angle) * r;
      const y = -Math.cos(d.angle) * r;
      node.setAttribute('cx', x.toFixed(1));
      node.setAttribute('cy', y.toFixed(1));
      node.setAttribute('fill', hex(d.color));
      node.setAttribute('opacity', d.done ? '0.35' : '0.95');
      node.setAttribute('r', d.done ? '1.9' : '2.6');
    });
  }
}
