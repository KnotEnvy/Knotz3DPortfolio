import { el, icons, hex } from './dom';
import { ACHIEVEMENTS, type GameState } from '../game/GameState';
import { sectors, type SectorId } from '../data/sectors';
import { profile } from '../data/profile';

export interface OverlayHandlers {
  resume(): void;
  jump(id: SectorId): void;
  brief(): void;
  reset(): void;
}

type Tab = 'controls' | 'sectors' | 'record';

/**
 * The pause panel: controls, a sector index, and the achievement record.
 *
 * Two problems this solves. First, the keyboard hint fades after a few seconds
 * and there was previously no way to get it back — a visitor who tabbed away for
 * a minute came back to a game they no longer knew how to play. Second, a
 * dossier that had been dismissed was unreachable without flying the sector
 * again, which is an absurd thing to ask of someone who just wanted to re-read a
 * paragraph about your cleaning company. The sector index fixes both by making
 * every chapter one click away, always.
 */
export class Overlay {
  readonly root: HTMLElement;

  private tabs: Record<Tab, HTMLButtonElement>;
  private panes: Record<Tab, HTMLElement>;
  private current: Tab = 'controls';
  private closeBtn: HTMLButtonElement;
  private lastFocus: Element | null = null;
  private recordBody: HTMLElement;
  private resetBtn!: HTMLButtonElement;
  private resetArmed = 0;

  constructor(parent: HTMLElement, private state: GameState, private handlers: OverlayHandlers) {
    this.closeBtn = el('button', {
      class: 'ov__close',
      type: 'button',
      'aria-label': 'Resume',
      html: icons.close,
      onclick: () => this.close(),
    });

    this.panes = {
      controls: this.buildControls(),
      sectors: this.buildSectors(),
      record: el('div', { class: 'ov__pane' }),
    };
    this.recordBody = this.panes.record;

    const mk = (id: Tab, label: string) =>
      el('button', {
        class: 'ov__tab',
        type: 'button',
        role: 'tab',
        text: label,
        onclick: () => this.select(id),
      }) as HTMLButtonElement;

    this.tabs = {
      controls: mk('controls', 'Controls'),
      sectors: mk('sectors', 'Sectors'),
      record: mk('record', 'Record'),
    };

    this.root = el('div', { class: 'ov', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Paused', hidden: true }, [
      el('div', { class: 'ov__scrim', onclick: () => this.close() }),
      el('div', { class: 'ov__panel' }, [
        el('header', { class: 'ov__head' }, [
          el('div', {}, [
            el('div', { class: 'ov__eyebrow', text: 'Paused' }),
            el('h2', { class: 'ov__title', text: 'SIGNAL' }),
          ]),
          this.closeBtn,
        ]),
        el('div', { class: 'ov__tabs', role: 'tablist' }, [this.tabs.controls, this.tabs.sectors, this.tabs.record]),
        el('div', { class: 'ov__body' }, [this.panes.controls, this.panes.sectors, this.panes.record]),
        el('footer', { class: 'ov__foot' }, [
          el('button', {
            class: 'btn btn--primary',
            type: 'button',
            text: 'Resume flight',
            onclick: () => this.close(),
          }),
          el('button', {
            class: 'btn',
            type: 'button',
            text: 'Read the written brief',
            onclick: () => {
              this.close();
              this.handlers.brief();
            },
          }),
          // Two-step. This wipes every shard, rank and achievement, and it used
          // to sit one unguarded click away from "Resume flight".
          (this.resetBtn = el('button', {
            class: 'btn btn--ghost',
            type: 'button',
            text: 'Reset progress',
            onclick: () => this.onResetClick(),
          }) as HTMLButtonElement),
        ]),
      ]),
    ]);

    // A real focus trap, not just `inert` on siblings. The skip link lives
    // outside #ui, so inerting the overlay's siblings still let Tab walk out of
    // a dialog that claims `aria-modal`.
    this.root.addEventListener('keydown', (e) => this.onKeydown(e as KeyboardEvent));

    parent.append(this.root);
    this.select('controls');
  }

  /** Focusable descendants of the panel, in document order. */
  private focusables(): HTMLElement[] {
    const sel = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(this.root.querySelectorAll<HTMLElement>(sel)).filter(
      (n) => !n.hasAttribute('hidden') && n.offsetParent !== null,
    );
  }

  private onKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Tab') return;
    const items = this.focusables();
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (e.shiftKey && (active === first || !this.root.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !this.root.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  }

  /** First click arms, second confirms, and it disarms itself after 4 seconds. */
  private onResetClick(): void {
    if (!this.resetArmed) {
      this.resetBtn.textContent = 'Tap again to wipe everything';
      this.resetBtn.classList.add('armed');
      this.resetArmed = window.setTimeout(() => this.disarmReset(), 4000);
      return;
    }
    this.disarmReset();
    this.handlers.reset();
    this.renderRecord();
    this.syncSectors();
  }

  private disarmReset(): void {
    window.clearTimeout(this.resetArmed);
    this.resetArmed = 0;
    this.resetBtn.textContent = 'Reset progress';
    this.resetBtn.classList.remove('armed');
  }

  private buildControls(): HTMLElement {
    const row = (keys: string[], what: string) =>
      el('div', { class: 'keys__row' }, [
        el('div', { class: 'keys__combo' }, keys.map((k) => el('kbd', { text: k }))),
        el('span', { text: what }),
      ]);

    return el('div', { class: 'ov__pane' }, [
      el('p', { class: 'ov__lead', text: 'Fly the corridor, clear what gets in the way, break the node at the end of each sector. Every node you break opens a chapter of the résumé.' }),
      el('div', { class: 'keys' }, [
        el('h3', { text: 'Mouse & keyboard' }),
        row(['Mouse'], 'Steer — the ship flies to your cursor'),
        row(['W', 'A', 'S', 'D'], 'Steer without the mouse'),
        row(['Click'], 'Fire'),
        row(['Space'], 'Fire'),
        row(['Shift'], 'Boost'),
        row(['C'], 'Brake'),
        el('h3', { text: 'Interface' }),
        row(['H'], 'This panel'),
        row(['Esc'], 'Close a panel / pause'),
        row(['B'], 'Written brief'),
        row(['M'], 'Mute'),
        row(['~'], 'Terminal'),
        el('h3', { text: 'Touch' }),
        el('p', { class: 'ov__note', text: 'Drag anywhere to fly. The guns fire on their own. Boost is the button in the bottom-right corner.' }),
      ]),
      el('p', { class: 'ov__note', text: 'You cannot lose. Taking fire costs hull integrity, the frame goes red, and it repairs itself. Nothing in here will ever lock you out of the content.' }),
    ]);
  }

  private buildSectors(): HTMLElement {
    return el('div', { class: 'ov__pane' }, [
      el('p', { class: 'ov__lead', text: 'Jump straight to any sector — including ones you have not flown to yet — or re-open a dossier you closed.' }),
      el(
        'div',
        { class: 'jump' },
        sectors.map((s) =>
          el(
            'button',
            {
              class: 'jump__item',
              type: 'button',
              style: `--accent:${hex(s.color)}`,
              onclick: () => {
                this.close();
                this.handlers.jump(s.id);
              },
            },
            [
              el('span', { class: 'jump__code', text: s.code }),
              el('span', { class: 'jump__name', text: s.name }),
              el('span', { class: 'jump__sub', text: s.subtitle }),
              el('span', { class: 'jump__state', 'data-id': s.id }),
            ],
          ),
        ),
      ),
    ]);
  }

  private renderRecord(): void {
    const unlocked = new Set(this.state.achievements);
    this.recordBody.replaceChildren(
      el('div', { class: 'record__stats' }, [
        stat(`${this.state.collected}/${this.state.totalShards}`, 'Data shards'),
        stat(String(this.state.kills), 'Hostiles destroyed'),
        stat(`${this.state.nodesBroken}`, 'Nodes broken'),
        stat(this.state.rank, `${this.state.xp} XP`),
      ]),
      el(
        'ul',
        { class: 'record__list' },
        ACHIEVEMENTS.map((a) =>
          el('li', { class: unlocked.has(a.id) ? 'record__item on' : 'record__item' }, [
            el('span', { class: 'record__icon', html: unlocked.has(a.id) ? icons.trophy : icons.lock }),
            el('div', {}, [el('b', { text: a.name }), el('span', { text: a.note })]),
          ]),
        ),
      ),
      el('p', { class: 'ov__note', text: `Progress is stored in this browser only. ${profile.name} never sees it.` }),
    );
  }

  private select(tab: Tab): void {
    this.current = tab;
    for (const k of Object.keys(this.tabs) as Tab[]) {
      this.tabs[k].classList.toggle('on', k === tab);
      this.tabs[k].setAttribute('aria-selected', String(k === tab));
      this.panes[k].hidden = k !== tab;
    }
    if (tab === 'record') this.renderRecord();
    if (tab === 'sectors') this.syncSectors();
  }

  private syncSectors(): void {
    for (const s of sectors) {
      const node = this.panes.sectors.querySelector(`[data-id="${s.id}"]`);
      if (!node) continue;
      const done = this.state.isDecrypted(s.id);
      const seen = this.state.hasVisited(s.id);
      // Never "Locked". A hurried operator must be able to jump straight to
      // UPLINK — the chapter that actually converts — without playing to it.
      node.textContent = done ? 'Decrypted' : seen ? 'Reached' : 'Jump ahead';
      node.className = done ? 'jump__state done' : seen ? 'jump__state seen' : 'jump__state';
    }
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  open(tab: Tab = 'controls'): void {
    this.lastFocus = document.activeElement;
    this.root.hidden = false;
    this.setSiblingsInert(true);
    this.select(tab);
    requestAnimationFrame(() => {
      this.root.classList.add('on');
      this.tabs[this.current].focus();
    });
  }

  close(): void {
    if (this.root.hidden) return;
    this.disarmReset();
    this.root.classList.remove('on');
    this.root.hidden = true;
    this.setSiblingsInert(false);
    this.handlers.resume();
    if (this.lastFocus instanceof HTMLElement) this.lastFocus.focus();
  }

  /**
   * Make everything behind the dialog unreachable while it is open.
   *
   * The panel declares `aria-modal`, and without this that declaration is
   * simply untrue: six tabs walked out of the dialog, through the document and
   * into the paused game's HUD and toolbar behind it.
   */
  private setSiblingsInert(on: boolean): void {
    const parent = this.root.parentElement;
    if (!parent) return;
    for (const child of Array.from(parent.children)) {
      if (child === this.root) continue;
      (child as HTMLElement).inert = on;
    }
  }

  toggle(tab: Tab = 'controls'): void {
    if (this.isOpen) this.close();
    else this.open(tab);
  }
}

const stat = (value: string, label: string): HTMLElement =>
  el('div', { class: 'record__stat' }, [el('b', { text: value }), el('span', { text: label })]);
