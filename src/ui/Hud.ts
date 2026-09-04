import { el, icons, hex } from './dom';
import { bus } from '../core/Events';
import type { GameState } from '../game/GameState';
import type { Ship } from '../player/Ship';
import type { Director } from '../game/Mission';
import { sectors, sectorById, type SectorId } from '../data/sectors';

/**
 * The heads-up display.
 *
 * Organised around one rule: **the objective is the most important thing on
 * screen and it is never absent.** Everything else — rank, hull, speed, the
 * route spine — is peripheral state a player can choose to read. The objective
 * line is the thing that stops a visitor from wondering what this site wants
 * from them, and it is pinned top-centre where the eye already is.
 *
 * The whole HUD is DOM, not canvas. It costs nothing to render, it scales with
 * the viewport for free, and it is the only sane way to get real typography over
 * a WebGL scene.
 */
export class Hud {
  readonly root: HTMLElement;

  private objTitle: HTMLElement;
  private objDetail: HTMLElement;
  private objChip: HTMLElement;
  private objective: HTMLElement;

  private boss: HTMLElement;
  private bossName: HTMLElement;
  private bossShield: HTMLElement;
  private bossCore: HTMLElement;
  private bossPhase: HTMLElement;

  private spine: HTMLElement;
  private spineFill: HTMLElement;
  private spineDots: HTMLElement[] = [];

  private rankName: HTMLElement;
  private rankXp: HTMLElement;
  private rankBar: HTMLElement;
  private shardCount: HTMLElement;

  private hullBar: HTMLElement;
  private hullWrap: HTMLElement;
  private speedNum: HTMLElement;
  private speedUnit: HTMLElement;
  private boostPip: HTMLElement;

  private reticle: HTMLElement;
  private hint: HTMLElement;

  private assist: HTMLElement;
  private assistText: HTMLElement;
  private skipBtn: HTMLButtonElement;
  private lastTitle = '';
  private lastDetail = '';
  private lastPhase = '';
  private lowHullSince = 0;

  constructor(parent: HTMLElement, private state: GameState, coarse: boolean) {
    /* ---------------------------------------------------- objective */
    this.objChip = el('span', { class: 'obj__chip', text: 'SEC-01' });
    this.objTitle = el('div', { class: 'obj__title' });
    this.objDetail = el('div', { class: 'obj__detail' });
    this.objective = el('div', { class: 'obj', role: 'status', 'aria-live': 'polite' }, [
      el('div', { class: 'obj__head' }, [el('span', { class: 'obj__label', text: 'Objective' }), this.objChip]),
      this.objTitle,
      this.objDetail,
    ]);

    /* --------------------------------------------------------- boss */
    this.bossName = el('span', { class: 'boss__name' });
    this.bossPhase = el('span', { class: 'boss__phase' });
    this.bossShield = el('i');
    this.bossCore = el('i');
    this.boss = el('div', { class: 'boss', 'aria-hidden': 'true' }, [
      el('div', { class: 'boss__head' }, [this.bossName, this.bossPhase]),
      // Two stacked bars: the shield drains first, then the core. Splitting them
      // makes a two-phase fight legible without a word of explanation.
      el('div', { class: 'boss__bars' }, [
        el('div', { class: 'boss__bar boss__bar--shield' }, [this.bossShield]),
        el('div', { class: 'boss__bar boss__bar--core' }, [this.bossCore]),
      ]),
    ]);

    /* -------------------------------------------------------- spine */
    this.spineFill = el('i');
    const dots = sectors.map((s) => {
      const dot = el('button', {
        class: 'spine__dot',
        type: 'button',
        'data-sector': s.id,
        'aria-label': `${s.code} ${s.name}`,
        title: `${s.code} — ${s.name}`,
      }, [
        el('span', { class: 'spine__pip' }),
        el('span', { class: 'spine__name', text: s.name }),
      ]);
      this.spineDots.push(dot);
      return dot;
    });
    this.spine = el('nav', { class: 'spine', 'aria-label': 'Route progress' }, [
      el('div', { class: 'spine__track' }, [this.spineFill]),
      ...dots,
    ]);

    /* --------------------------------------------------------- rank */
    this.rankName = el('span', { class: 'rank__name', text: state.rank });
    this.rankXp = el('span', { class: 'rank__xp', text: `${state.xp} XP` });
    this.rankBar = el('i');
    this.shardCount = el('b', { text: `${state.collected}/${state.totalShards}` });

    /* --------------------------------------------------- flight data */
    this.hullBar = el('i');
    this.hullWrap = el('div', { class: 'hull' }, [
      el('span', { class: 'hull__label', text: 'Hull' }),
      el('div', { class: 'hull__bar' }, [this.hullBar]),
    ]);
    this.speedNum = el('b', { text: '0' });
    this.speedUnit = el('span', { text: 'm/s' });
    this.boostPip = el('span', { class: 'flight__boost', text: 'BOOST' });

    /* ------------------------------------------------------ reticle */
    this.reticle = el('div', { class: 'reticle', 'aria-hidden': 'true' }, [
      el('span', { class: 'reticle__ring' }),
      el('span', { class: 'reticle__dot' }),
      el('span', { class: 'reticle__tick reticle__tick--l' }),
      el('span', { class: 'reticle__tick reticle__tick--r' }),
    ]);

    // Escalating help for a stalled run. Hidden until the director asks for it.
    this.assist = el('div', { class: 'assist', role: 'status' }, [
      el('span', { class: 'assist__text' }),
    ]);
    this.assistText = this.assist.querySelector('.assist__text') as HTMLElement;
    this.skipBtn = el('button', {
      class: 'btn btn--sm assist__skip',
      type: 'button',
      text: 'Open the dossier anyway',
    }) as HTMLButtonElement;
    this.assist.append(this.skipBtn);

    this.hint = el('div', { class: 'hint' }, coarse
      ? [
          el('span', { text: 'Drag to fly' }),
          el('span', { text: 'Guns are automatic' }),
          el('span', { text: 'BOOST to accelerate' }),
        ]
      : [
          el('span', { html: '<kbd>Mouse</kbd> or <kbd>WASD</kbd> to fly' }),
          el('span', { html: '<kbd>Click</kbd> / <kbd>Space</kbd> to fire' }),
          el('span', { html: '<kbd>Shift</kbd> boost' }),
          el('span', { html: '<kbd>H</kbd> help' }),
        ]);

    this.root = el('div', { class: 'hud' }, [
      this.reticle,
      el('div', { class: 'hud__top' }, [this.objective, this.boss, this.assist]),
      this.spine,
      el('div', { class: 'hud__bottom' }, [
        el('div', { class: 'stats' }, [
          el('div', { class: 'rank' }, [this.rankName, this.rankXp]),
          el('div', { class: 'rank__track' }, [this.rankBar]),
          el('div', { class: 'shards' }, [
            el('span', { class: 'shards__icon', html: icons.shard }),
            this.shardCount,
            el('span', { class: 'shards__label', text: 'data shards' }),
          ]),
        ]),
        el('div', { class: 'flight' }, [
          this.hullWrap,
          el('div', { class: 'flight__speed' }, [this.speedNum, this.speedUnit, this.boostPip]),
        ]),
        this.hint,
      ]),
    ]);

    this.skipBtn.hidden = true;

    parent.append(this.root);

    bus.on('xp:change', () => this.syncStats());
    bus.on('shard:collect', () => {
      this.syncStats();
      this.pop(this.shardCount);
    });
    this.syncStats();
  }

  /** Show or clear the stall hint. */
  setAssist(text: string | null): void {
    this.assistText.textContent = text ?? '';
    this.assist.classList.toggle('on', !!text || !this.skipBtn.hidden);
  }

  /** Offer the escape hatch out of a fight the visitor cannot win. */
  setSkipOffer(on: boolean, fn?: () => void): void {
    this.skipBtn.hidden = !on;
    if (on && fn) this.skipBtn.onclick = fn;
    this.assist.classList.toggle('on', on || !!this.assistText.textContent);
  }

  /** Wire the route spine's dots as jump buttons. */
  onJump(fn: (id: SectorId) => void): void {
    this.spineDots.forEach((dot) => {
      const id = dot.dataset.sector as SectorId;
      dot.addEventListener('click', () => fn(id));
    });
  }

  private syncStats(): void {
    this.rankName.textContent = this.state.rank;
    this.rankXp.textContent = `${this.state.xp} XP`;
    this.rankBar.style.width = `${Math.round(this.state.rankPct * 100)}%`;
    this.shardCount.textContent = `${this.state.collected}/${this.state.totalShards}`;
  }

  /** Retrigger a CSS animation by removing and re-adding the class. */
  private pop(node: HTMLElement): void {
    node.classList.remove('pop');
    void node.offsetWidth;
    node.classList.add('pop');
  }

  setVisible(on: boolean): void {
    this.root.classList.toggle('on', on);
  }

  fadeHint(): void {
    this.hint.classList.add('fade');
  }

  /** Move the aiming reticle. Coordinates are normalised -1..1. */
  setReticle(x: number, y: number, active: boolean): void {
    this.reticle.classList.toggle('on', active);
    if (!active) return;
    this.reticle.style.transform = `translate(-50%, -50%) translate(${x * 50}vw, ${y * 50}vh)`;
  }

  /** Called every frame. Every write is guarded so the DOM only churns on change. */
  update(ship: Ship, director: Director, elapsed: number): void {
    /* objective */
    if (director.objectiveTitle !== this.lastTitle) {
      this.lastTitle = director.objectiveTitle;
      this.objTitle.textContent = director.objectiveTitle;
      this.pop(this.objective);
    }
    if (director.objectiveDetail !== this.lastDetail) {
      this.lastDetail = director.objectiveDetail;
      this.objDetail.textContent = director.objectiveDetail;
    }
    const def = sectorById.get(director.currentSectorId);
    if (def && this.objChip.textContent !== def.code) {
      this.objChip.textContent = def.code;
      this.objective.style.setProperty('--accent', hex(def.color));
    }

    /* boss */
    const node = director.activeNode;
    const phase = node ? (node.shielded ? 'shield' : 'core') : 'none';
    if (phase !== this.lastPhase) {
      this.lastPhase = phase;
      this.boss.classList.toggle('on', phase !== 'none');
      if (node) {
        this.bossName.textContent = node.def.name + ' NODE';
        this.boss.style.setProperty('--accent', hex(node.def.color));
      }
      this.bossPhase.textContent = phase === 'shield' ? 'Shield integrity' : phase === 'core' ? 'Core exposed' : '';
      this.boss.classList.toggle('breached', phase === 'core');
    }
    if (node) {
      this.bossShield.style.width = `${node.shieldPct * 100}%`;
      this.bossCore.style.width = `${node.corePct * 100}%`;
    }

    /* route spine */
    // One custom property drives both orientations: the spine is vertical on a
    // desktop and horizontal along the bottom on a phone.
    const p = director.progress(ship);
    this.spineFill.style.setProperty('--fill', `${(p * 100).toFixed(1)}%`);
    this.spineDots.forEach((dot, i) => {
      const done = this.state.isDecrypted(sectors[i].id);
      dot.classList.toggle('done', done);
      dot.classList.toggle('active', i === director.targetIndex);
    });

    /* flight data */
    // While the mission holds the ship at a node, say so rather than reporting a
    // speed of zero: the throttle is not the visitor's to use, and "0 m/s" beside
    // a lit BOOST chip reads as a broken instrument rather than a game state.
    const speed = Math.round(ship.speed);
    const label = ship.held ? 'HOLD' : String(speed);
    if (this.speedNum.textContent !== label) this.speedNum.textContent = label;
    this.speedUnit.hidden = ship.held;
    this.boostPip.classList.toggle('on', ship.boosting);
    this.hullBar.style.width = `${Math.max(0, ship.integrity) * 100}%`;
    const low = ship.integrity < 0.35;
    this.hullWrap.classList.toggle('low', low);
    // Only start the alarm class after the hull has been low for a moment, so a
    // single graze does not set the whole interface flashing.
    if (low) {
      if (this.lowHullSince === 0) this.lowHullSince = elapsed;
      this.hullWrap.classList.toggle('critical', elapsed - this.lowHullSince > 0.4);
    } else {
      this.lowHullSince = 0;
      this.hullWrap.classList.remove('critical');
    }
  }
}
