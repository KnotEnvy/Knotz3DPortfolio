import { el, icons, inline, hex, rgba } from './dom';
import { bus } from '../core/Events';
import { sectorById, type Block, type SectorDef, type SectorId } from '../data/sectors';
import type { GameState } from '../game/GameState';

/**
 * The content panel. Renders a sector's blocks, tracks shard progress with a
 * pip row, and reveals the bonus block once the sector is fully decrypted.
 */
export class Codex {
  readonly root: HTMLElement;
  private eyebrow: HTMLElement;
  private title: HTMLElement;
  private sub: HTMLElement;
  private pips: HTMLElement;
  private pipLabel: HTMLElement;
  private body: HTMLElement;
  private foot: HTMLElement;
  private more: HTMLElement;
  private moreText: HTMLElement;
  private continueBtn: HTMLButtonElement;
  private closeBtn: HTMLButtonElement;
  private current: SectorDef | null = null;
  private lastFocus: Element | null = null;
  /** True when this dossier was opened by breaking a node, so flight is held. */
  private gating = false;

  constructor(parent: HTMLElement, private state: GameState, private onContinue: () => void) {
    this.eyebrow = el('div', { class: 'codex__eyebrow' });
    this.title = el('h2', { class: 'codex__title' });
    this.sub = el('div', { class: 'codex__sub' });
    this.pips = el('div', { class: 'pips' });
    this.pipLabel = el('span');
    this.body = el('div', { class: 'codex__body scroll', tabindex: '0' });

    // The single most important control in the game. Breaking a node stops the
    // ship and opens the dossier; this button is how the visitor says "read it,
    // I'm done" and gets moving again. It is also why nothing auto-closes.
    this.continueBtn = el('button', {
      class: 'btn btn--primary codex__continue',
      type: 'button',
      text: 'Continue the run',
      onclick: () => {
        this.gating = false;
        this.close();
        this.onContinue();
      },
    }) as HTMLButtonElement;

    this.closeBtn = el('button', {
      class: 'codex__close',
      type: 'button',
      'aria-label': 'Close dossier',
      html: icons.close,
      onclick: () => this.close(),
    }) as HTMLButtonElement;

    // Measured on THE FORGE: 1691px of dossier inside a 699px window — nearly
    // two and a half screens — with a full-width Continue button pinned under
    // it and a hairline scrollbar as the only clue. The payoff of the entire
    // game was the thing most likely to be skipped, so the panel now says
    // outright how much is left and offers to take you there.
    this.more = el('button', {
      class: 'codex__more',
      type: 'button',
      'aria-label': 'Scroll down through the dossier',
      onclick: () => this.body.scrollBy({ top: this.body.clientHeight * 0.85, behavior: 'smooth' }),
    }, [el('span', { class: 'codex__moreText' }), el('span', { class: 'codex__moreArrow', text: '↓' })]);
    this.moreText = this.more.querySelector('.codex__moreText') as HTMLElement;

    this.body.addEventListener('scroll', () => this.syncScroll(), { passive: true });

    this.foot = el('footer', { class: 'codex__foot' }, [this.more, this.continueBtn]);

    this.root = el(
      'aside',
      { class: 'codex', role: 'complementary', 'aria-label': 'Sector dossier', 'aria-hidden': 'true' },
      [
        el('header', { class: 'codex__head' }, [
          el('div', {}, [this.eyebrow, this.title, this.sub]),
          this.closeBtn,
        ]),
        el('div', { class: 'codex__progress' }, [this.pips, this.pipLabel]),
        this.body,
        this.foot,
      ],
    );

    parent.append(this.root);

    // Nothing here opens or closes itself on proximity. The mission director
    // decides when a dossier is earned, and only the reader decides when they
    // are finished with it — an earlier build closed dossiers a few seconds
    // after arrival, which snatched content away mid-sentence.
    bus.on('shard:collect', ({ sector }) => {
      if (this.current?.id !== sector) return;
      // A full re-render once the last shard lands, not just a pip update:
      // 'sector:decrypted' fires when the node breaks, which is *before* the
      // shards finish flying in, so a panel opened in that window kept showing
      // "Classified — locked" while its own pips read decrypted.
      const wasLocked = !!this.root.querySelector('.cx-bonus.locked');
      if (wasLocked && this.state.isDecrypted(sector)) this.render(this.current!);
      else this.syncProgress();
    });
    bus.on('sector:decrypted', ({ id }) => {
      if (this.current?.id === id) this.render(this.current);
    });
  }

  get isOpen(): boolean {
    return this.root.classList.contains('on');
  }

  /**
   * Show a sector's dossier. `gating` marks the case where the ship is being
   * held for reading, which is when the Continue button appears.
   */
  open(id: SectorId, gating = false): void {
    const def = sectorById.get(id);
    if (!def) return;
    this.lastFocus = document.activeElement;
    this.current = def;
    this.gating = gating;
    this.render(def);
    this.foot.hidden = !gating;
    this.root.classList.add('on');
    this.root.setAttribute('aria-hidden', 'false');
    this.body.scrollTop = 0;
    this.syncScroll();
    // Move focus into the panel. Without this a keyboard user is handed a
    // scrollable region they have no way to reach.
    requestAnimationFrame(() => (gating ? this.continueBtn : this.body).focus());
    bus.emit('codex:open', { id });
  }

  close(): void {
    if (!this.isOpen) return;
    this.root.classList.remove('on');
    this.root.setAttribute('aria-hidden', 'true');
    if (this.lastFocus instanceof HTMLElement) this.lastFocus.focus();
    bus.emit('codex:close', undefined);
    // Dismissing a gating dossier still has to release the ship, or the visitor
    // is left hovering in front of a dead node with no way forward.
    if (this.gating) {
      this.gating = false;
      this.onContinue();
    }
  }

  get isGating(): boolean {
    return this.gating;
  }

  /** Update the "more below" affordance and the edge fade. */
  private syncScroll(): void {
    const el = this.body;
    const remaining = el.scrollHeight - el.clientHeight - el.scrollTop;
    const hasMore = remaining > 24;
    this.root.classList.toggle('has-more', hasMore);
    if (hasMore) {
      const screens = remaining / Math.max(1, el.clientHeight);
      this.moreText.textContent = screens > 1.4 ? `${Math.ceil(screens)} more screens` : 'More below';
    }
  }

  private syncProgress(): void {
    if (!this.current) return;
    const have = this.state.shardsIn(this.current.id).length;
    const total = this.current.shards;
    this.pips.replaceChildren(
      ...Array.from({ length: total }, (_, i) => el('i', { class: i < have ? 'pip on' : 'pip' })),
    );
    this.pipLabel.textContent = have >= total ? 'decrypted' : `${have}/${total} shards recovered`;
  }

  private render(def: SectorDef): void {
    this.root.style.setProperty('--accent', hex(def.color));
    this.root.style.setProperty('--accent-soft', rgba(def.color, 0.16));

    this.eyebrow.textContent = def.code;
    this.title.textContent = def.name;
    this.sub.textContent = def.subtitle;

    const nodes: Node[] = def.blocks.map((b) => this.block(b));

    const decrypted = this.state.isDecrypted(def.id);
    nodes.push(this.bonus(def, decrypted));

    this.body.replaceChildren(...nodes);
    this.syncProgress();
    // Layout has to settle before scrollHeight means anything.
    requestAnimationFrame(() => this.syncScroll());
  }

  private bonus(def: SectorDef, unlocked: boolean): HTMLElement {
    const tag = el('div', { class: 'cx-bonus__tag' }, [
      el('span', { html: unlocked ? icons.unlock : icons.lock }),
      el('span', { text: unlocked ? 'Classified — unlocked' : 'Classified — locked' }),
    ]);

    const inner = unlocked
      ? def.bonus.map((b) => this.block(b))
      : [
          el('p', {
            class: 'cx-bonus__locked-copy',
            text: `Recover all ${def.shards} data shards orbiting this sector to unlock.`,
          }),
        ];

    return el('div', { class: unlocked ? 'cx-bonus' : 'cx-bonus locked' }, [tag, ...inner]);
  }

  private block(b: Block): HTMLElement {
    switch (b.t) {
      case 'lead':
        return el('p', { class: 'cx-lead', html: inline(b.text) });

      case 'para':
        return el('p', { class: 'cx-para', html: inline(b.text) });

      case 'list':
        return el(
          'ul',
          { class: 'cx-list' },
          b.items.map((i) => el('li', { html: inline(i) })),
        );

      case 'stats':
        return el(
          'div',
          { class: 'cx-stats' },
          b.items.map((s) =>
            el('div', { class: 'cx-stat' }, [
              el('b', { text: s.value }),
              el('span', { text: s.label }),
              s.note ? el('em', { text: s.note }) : null,
            ]),
          ),
        );

      case 'cards':
        return el(
          'div',
          {},
          b.items.map((c) =>
            el('article', { class: 'cx-card' }, [
              el('h4', { text: c.title }),
              c.sub ? el('p', { class: 'cx-card__sub', text: c.sub }) : null,
              el('p', { html: inline(c.text) }),
              c.meta?.length
                ? el(
                    'div',
                    { class: 'cx-meta' },
                    c.meta.map((m) => el('span', { text: m })),
                  )
                : null,
              c.links?.length
                ? el(
                    'div',
                    { class: 'cx-links' },
                    c.links.map((l) => this.link(l.href, l.label, l.live)),
                  )
                : null,
            ]),
          ),
        );

      case 'timeline':
        return el(
          'div',
          { class: 'cx-timeline' },
          b.items.map((t) =>
            el('div', { class: t.current ? 'cx-entry now' : 'cx-entry' }, [
              el('h4', { text: t.title }),
              el('div', { class: 'cx-entry__meta' }, [
                el('span', { class: 'cx-entry__period', text: t.period }),
                el('span', { text: t.sub }),
              ]),
              el(
                'ul',
                { class: 'cx-list' },
                t.points.map((p) => el('li', { html: inline(p) })),
              ),
            ]),
          ),
        );

      case 'chips':
        return el('div', { class: 'cx-chips' }, [
          el('div', { class: 'cx-chips__title', text: b.group }),
          el(
            'div',
            { class: 'cx-chips__set' },
            b.items.map((i) => el('span', { class: 'cx-chip', text: i })),
          ),
        ]);

      case 'quote':
        return el('blockquote', { class: 'cx-quote' }, [
          el('p', { html: inline(b.text) }),
          b.by ? el('cite', { text: `— ${b.by}` }) : null,
        ]);

      case 'cta': {
        const link = el('a', {
          class: b.kind === 'primary' ? 'btn btn--primary btn--sm' : 'btn btn--sm',
          href: b.href,
          ...(b.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
          text: b.label,
        });
        // mailto: is a dead click for anyone on webmail, which is most of the
        // business owners this sector is written for.
        if (!b.href.startsWith('mailto:')) return el('div', { class: 'cx-cta' }, [link]);
        const address = b.href.slice(7).split('?')[0];
        const copy = el('button', { class: 'btn btn--sm cx-copy', type: 'button', text: 'Copy' }) as HTMLButtonElement;
        copy.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(address);
            copy.textContent = 'Copied';
          } catch {
            copy.textContent = address;
          }
          window.setTimeout(() => (copy.textContent = 'Copy'), 2200);
        });
        return el('div', { class: 'cx-cta' }, [link, copy]);
      }
    }
  }

  private link(href: string, label: string, live = false): HTMLElement {
    return el(
      'a',
      { class: live ? 'cx-link cx-link--live' : 'cx-link', href, target: '_blank', rel: 'noopener noreferrer' },
      [el('span', { html: live ? icons.play : icons.external }), el('span', { text: label })],
    );
  }
}
