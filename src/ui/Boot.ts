import { el } from './dom';
import { profile } from '../data/profile';

export interface BootHandlers {
  launch(): void;
  brief(): void;
}

/**
 * The title card, and the most consequential screen on the site.
 *
 * It has about four seconds to make a visitor choose to play rather than bounce,
 * and it also has to make the written brief feel like a legitimate choice rather
 * than a consolation prize — a client at 11pm should not feel obliged to fly a
 * spaceship to find out whether to hire someone. So both routes are stated
 * plainly, and the game route says exactly what the loop is: fly, fight, read.
 *
 * It is also the moment we are allowed to start audio, since browsers require a
 * user gesture.
 */
export class Boot {
  readonly root: HTMLElement;
  private progress: HTMLElement;
  private launchBtn: HTMLButtonElement;
  private status: HTMLElement;

  constructor(parent: HTMLElement, handlers: BootHandlers, returning: boolean) {
    this.progress = el('i');
    this.status = el('div', { class: 'boot__status', text: 'Compiling shaders' });

    this.launchBtn = el('button', {
      class: 'btn btn--primary btn--lg',
      type: 'button',
      text: returning ? 'Resume the run' : 'Launch',
      onclick: () => handlers.launch(),
    }) as HTMLButtonElement;

    const beat = (n: string, label: string, text: string) =>
      el('li', { class: 'boot__beat' }, [
        el('span', { class: 'boot__beatnum', text: n }),
        el('div', {}, [el('b', { text: label }), el('span', { text })]),
      ]);

    this.root = el('div', { class: 'boot' }, [
      el('div', { class: 'boot__grid', 'aria-hidden': 'true' }),
      el('div', { class: 'boot__inner' }, [
        el('p', { class: 'boot__eyebrow' }, [
          el('span', { class: 'boot__dot' }),
          el('span', { text: 'SIGNAL — interactive portfolio' }),
        ]),
        el('h1', { class: 'boot__title', text: profile.name }),
        el('p', { class: 'boot__sub', text: `${profile.title} · ${profile.location}` }),
        el('div', { class: 'boot__line' }),
        el('p', { class: 'boot__pitch', text: profile.tagline }),

        el('ol', { class: 'boot__beats' }, [
          beat('01', 'Fly the corridor', 'Six sectors. Your cursor is the stick.'),
          beat('02', 'Clear the resistance', 'Shoot what shoots back. You cannot lose.'),
          beat('03', 'Break the node', 'Each one you crack opens a chapter of the résumé.'),
        ]),

        el('div', { class: 'boot__actions' }, [
          this.launchBtn,
          el('button', {
            class: 'btn btn--lg',
            type: 'button',
            text: 'Read the written brief',
            onclick: () => handlers.brief(),
          }),
        ]),
        el('p', {
          class: 'boot__alt',
          text: 'The brief is the whole CV as a normal page — same facts, no flying. Nothing is hidden behind the game.',
        }),
        el('div', { class: 'boot__progress' }, [this.progress]),
        this.status,
        el('p', {
          class: 'boot__hint',
          text: 'Mouse or WASD to fly · click or space to fire · shift to boost · H for help',
        }),
      ]),
    ]);

    parent.append(this.root);
  }

  setProgress(pct: number, label?: string): void {
    this.progress.style.width = `${Math.round(pct * 100)}%`;
    if (label) this.status.textContent = label;
    if (pct >= 1) this.status.textContent = 'Ready';
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
