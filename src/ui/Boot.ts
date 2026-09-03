import { el } from './dom';
import { profile } from '../data/profile';

export interface BootHandlers {
  launch(): void;
  brief(): void;
}

/**
 * The title card. Also the moment we are allowed to start audio and the moment
 * the visitor chooses between the game and the document.
 */
export class Boot {
  readonly root: HTMLElement;
  private progress: HTMLElement;
  private launchBtn: HTMLButtonElement;

  constructor(parent: HTMLElement, handlers: BootHandlers, returning: boolean) {
    this.progress = el('i');

    this.launchBtn = el('button', {
      class: 'btn btn--primary',
      type: 'button',
      text: returning ? 'Resume flight' : 'Launch',
      onclick: () => handlers.launch(),
    });

    this.root = el('div', { class: 'boot' }, [
      el('div', { class: 'boot__inner' }, [
        el('p', { class: 'boot__eyebrow', text: 'Signal // interactive portfolio' }),
        el('p', { class: 'boot__title', 'aria-hidden': 'true', text: profile.name }),
        el('p', { class: 'boot__sub', text: `${profile.title} — ${profile.location}` }),
        el('div', { class: 'boot__line' }),
        el('p', {
          class: 'boot__pitch',
          text:
            'This portfolio is a game engine. Fly through six sectors, collect the data shards, and the whole résumé unlocks as you go. In a hurry? Read the written brief instead — same content, no flying.',
        }),
        el('div', { class: 'boot__actions' }, [
          this.launchBtn,
          el('button', { class: 'btn', type: 'button', text: 'Read the brief', onclick: () => handlers.brief() }),
        ]),
        el('div', { class: 'boot__progress' }, [this.progress]),
        el('p', {
          class: 'boot__hint',
          text: 'W A S D or drag to fly · shift to boost · ~ for terminal',
        }),
      ]),
    ]);

    parent.append(this.root);
  }

  setProgress(pct: number): void {
    this.progress.style.width = `${Math.round(pct * 100)}%`;
  }

  focus(): void {
    this.launchBtn.focus();
  }

  hide(): void {
    this.root.classList.add('out');
    window.setTimeout(() => {
      this.root.hidden = true;
    }, 800);
  }

  show(): void {
    this.root.hidden = false;
    requestAnimationFrame(() => this.root.classList.remove('out'));
  }
}
