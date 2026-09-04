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
          beat('03', 'Break the node', 'It drops data shards — the résumé, one chapter at a time.'),
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
          // An honest time estimate is the cheapest way to stop a busy person
          // bouncing: the reason they leave is usually not disinterest, it is
          // not knowing what they are committing to.
          text:
            'About ten minutes to fly, or three to read. The brief is the whole CV as a normal page — same facts, no flying, nothing held back.',
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
    this.setSiblingsInert(true);
  }

  /**
   * The title card covers the whole viewport, but the HUD and toolbar behind it
   * are still in the tab order — two presses of Tab from the Launch button
   * landed on invisible controls.
   */
  private setSiblingsInert(on: boolean): void {
    const parent = this.root.parentElement;
    if (!parent) return;
    for (const child of Array.from(parent.children)) {
      if (child === this.root) continue;
      (child as HTMLElement).inert = on;
    }
    // The canvas is a sibling of #ui, not of the boot screen. The skip link is
    // deliberately left reachable here: jumping to the written brief from the
    // title card is exactly what it is for.
    const stage = document.getElementById('stage');
    if (stage) stage.inert = on;
  }

  hide(): void {
    this.setSiblingsInert(false);
    this.root.classList.add('out');
    window.setTimeout(() => {
      this.root.hidden = true;
    }, 800);
  }

  show(): void {
    this.root.hidden = false;
    this.setSiblingsInert(true);
    requestAnimationFrame(() => this.root.classList.remove('out'));
  }
}
