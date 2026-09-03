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
  private current: SectorDef | null = null;

  constructor(parent: HTMLElement, private state: GameState) {
    this.eyebrow = el('div', { class: 'codex__eyebrow' });
    this.title = el('h2', { class: 'codex__title' });
    this.sub = el('div', { class: 'codex__sub' });
    this.pips = el('div', { class: 'pips' });
    this.pipLabel = el('span');
    this.body = el('div', { class: 'codex__body scroll', tabindex: '0' });

    this.root = el(
      'aside',
      { class: 'codex', role: 'complementary', 'aria-label': 'Sector dossier', 'aria-hidden': 'true' },
      [
        el('header', { class: 'codex__head' }, [
          el('div', {}, [this.eyebrow, this.title, this.sub]),
          el('button', {
            class: 'codex__close',
            type: 'button',
            'aria-label': 'Close dossier',
            html: icons.close,
            onclick: () => this.close(),
          }),
        ]),
        el('div', { class: 'codex__progress' }, [this.pips, this.pipLabel]),
        this.body,
      ],
    );

    parent.append(this.root);

    // Deliberately not closed on 'sector:leave'. Arriving opens the dossier and
    // the ship keeps drifting; auto-closing it a few seconds later would snatch
    // the content away mid-sentence. It closes when the reader says so, or when
    // another sector replaces it.
    bus.on('sector:enter', ({ id }) => this.open(id));
    bus.on('shard:collect', ({ sector }) => {
      if (this.current?.id === sector) this.syncProgress();
    });
    bus.on('sector:decrypted', ({ id }) => {
      if (this.current?.id === id) this.render(this.current);
    });
  }

  get isOpen(): boolean {
    return this.root.classList.contains('on');
  }

  open(id: SectorId): void {
    const def = sectorById.get(id);
    if (!def) return;
    this.current = def;
    this.render(def);
    this.root.classList.add('on');
    this.root.setAttribute('aria-hidden', 'false');
    this.body.scrollTop = 0;
    bus.emit('codex:open', { id });
  }

  close(): void {
    if (!this.isOpen) return;
    this.root.classList.remove('on');
    this.root.setAttribute('aria-hidden', 'true');
    bus.emit('codex:close', undefined);
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
              c.href || c.href2
                ? el('div', { class: 'cx-links' }, [
                    c.href ? this.link(c.href, linkLabel(c.href)) : null,
                    c.href2 ? this.link(c.href2, 'Live site') : null,
                  ])
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

      case 'cta':
        return el('div', { class: 'cx-cta' }, [
          el('a', {
            class: b.kind === 'primary' ? 'btn btn--primary btn--sm' : 'btn btn--sm',
            href: b.href,
            ...(b.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
            text: b.label,
          }),
        ]);
    }
  }

  private link(href: string, label: string): HTMLElement {
    return el(
      'a',
      { class: 'cx-link', href, target: '_blank', rel: 'noopener noreferrer' },
      [el('span', { text: label }), el('span', { html: icons.external })],
    );
  }
}

function linkLabel(href: string): string {
  return href.includes('github.com') ? 'Source' : 'Visit';
}
