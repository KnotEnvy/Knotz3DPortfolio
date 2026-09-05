import { el, icons } from './dom';
import { profile } from '../data/profile';
import type { GameState } from '../game/GameState';

export interface CompleteHandlers {
  close(): void;
  restart(): void;
}

/**
 * The payoff. Every shard recovered means the visitor has passed through all
 * six dossiers — which is the moment to ask for the conversation.
 */
export class Complete {
  readonly root: HTMLElement;
  private stats: HTMLElement;
  private closeBtn: HTMLButtonElement;

  constructor(parent: HTMLElement, private state: GameState, private handlers: CompleteHandlers) {
    this.stats = el('div', { class: 'finale__stats' });

    this.closeBtn = el('button', {
      class: 'btn',
      type: 'button',
      text: 'Keep flying',
      onclick: () => this.hide(),
    });

    this.root = el(
      'div',
      { class: 'finale', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Run complete', 'aria-hidden': 'true' },
      [
        el('div', { class: 'finale__card' }, [
          el('div', { class: 'finale__tag' }, [el('span', { html: icons.trophy }), el('span', { text: 'Transmission complete' })]),
          el('h2', { class: 'finale__title', text: 'You read the whole thing.' }),
          el('p', {
            class: 'finale__copy',
            text:
              'Every shard recovered. You just read a full résumé — six dossiers, ten projects, fifteen years of operating — by flying through it, and it did not feel like reading a résumé.',
          }),
          el('p', {
            class: 'finale__copy',
            text:
              'That is the whole pitch. Attention is the scarcest thing your business competes for, and the right interface changes what people are willing to give you. Let us talk about what that looks like for your customers.',
          }),
          this.stats,
          el('div', { class: 'finale__actions' }, [
            el('a', {
              class: 'btn btn--primary',
              href: `mailto:${profile.email}?subject=Let%27s%20talk%20AI`,
              text: 'Start a conversation',
            }),
            el('a', { class: 'btn', href: 'tel:+13863015775', text: profile.phone }),
            // The run has an ending; without this it had no beginning to go
            // back to, and the only way to fly the corridor again was the
            // button that wipes every shard and award first.
            el('button', {
              class: 'btn',
              type: 'button',
              text: 'Fly it again',
              onclick: () => this.handlers.restart(),
            }),
            this.closeBtn,
          ]),
        ]),
      ],
    );

    parent.append(this.root);
  }

  show(): void {
    const mins = Math.floor((performance.now() - this.state.startedAt) / 60000);
    const secs = Math.floor(((performance.now() - this.state.startedAt) % 60000) / 1000);
    const rows: [string, string][] = [
      ['Rank', this.state.rank],
      ['XP', String(this.state.xp)],
      ['Shards', `${this.state.collected}/${this.state.totalShards}`],
      ['Awards', `${this.state.data.achievements.length}/10`],
      ['Flight time', `${mins}m ${String(secs).padStart(2, '0')}s`],
    ];
    this.stats.replaceChildren(
      ...rows.map(([k, v]) => el('div', { class: 'finale__stat' }, [el('b', { text: v }), el('span', { text: k })])),
    );

    this.root.classList.add('on');
    this.root.setAttribute('aria-hidden', 'false');
    window.setTimeout(() => this.closeBtn.focus(), 400);
  }

  hide(): void {
    if (!this.isOpen) return;
    this.root.classList.remove('on');
    this.root.setAttribute('aria-hidden', 'true');
    this.handlers.close();
  }

  get isOpen(): boolean {
    return this.root.classList.contains('on');
  }
}
