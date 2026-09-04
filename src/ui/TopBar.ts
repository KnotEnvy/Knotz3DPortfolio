import { el, icons } from './dom';
import { profile } from '../data/profile';

export interface TopBarHandlers {
  toggleSound(): boolean;
  toggleBrief(): boolean;
  toggleTerminal(): void;
  toggleHelp(): void;
}

export class TopBar {
  readonly root: HTMLElement;
  private soundBtn: HTMLButtonElement;
  private briefBtn: HTMLButtonElement;

  constructor(parent: HTMLElement, handlers: TopBarHandlers, muted: boolean) {
    this.soundBtn = el('button', {
      class: 'icon-btn',
      type: 'button',
      'aria-label': 'Toggle sound',
      'aria-pressed': String(!muted),
      html: muted ? icons.mute : icons.sound,
      onclick: () => this.syncSound(handlers.toggleSound()),
    });

    this.briefBtn = el('button', {
      class: 'icon-btn',
      type: 'button',
      'aria-label': 'Toggle written brief',
      'aria-pressed': 'false',
      html: icons.doc,
      onclick: () => this.syncBrief(handlers.toggleBrief()),
    });

    const helpBtn = el('button', {
      class: 'icon-btn',
      type: 'button',
      'aria-label': 'Controls and pause menu',
      title: 'Controls (H)',
      html: icons.help,
      onclick: () => handlers.toggleHelp(),
    });

    const terminalBtn = el('button', {
      class: 'icon-btn',
      type: 'button',
      'aria-label': 'Toggle terminal',
      html: icons.terminal,
      onclick: () => handlers.toggleTerminal(),
    });

    this.root = el('header', { class: 'topbar' }, [
      el('div', { class: 'brand' }, [
        el('span', { class: 'brand__mark', text: profile.name }),
        el('span', { class: 'brand__role', text: profile.title }),
      ]),
      // The contact CTA is the only element on screen that never changes and
      // never hides. Everything else on this site is a demonstration; this is
      // the ask, and a visitor who loses interest two sectors in should still
      // have it one click away.
      el('a', {
        class: 'topbar__cta',
        href: `mailto:${profile.email}?subject=AI%20project%20enquiry`,
        'aria-label': `Email ${profile.email}`,
      }, [el('span', { html: icons.mail }), el('span', { class: 'topbar__ctaLabel', text: 'Hire me' })]),
      el('nav', { class: 'toolbar', 'aria-label': 'Site controls' }, [helpBtn, terminalBtn, this.briefBtn, this.soundBtn]),
    ]);

    parent.append(this.root);
  }

  syncSound(muted: boolean): void {
    this.soundBtn.innerHTML = muted ? icons.mute : icons.sound;
    this.soundBtn.setAttribute('aria-pressed', String(!muted));
  }

  syncBrief(on: boolean): void {
    this.briefBtn.setAttribute('aria-pressed', String(on));
    this.briefBtn.innerHTML = on ? icons.game : icons.doc;
    this.briefBtn.setAttribute('aria-label', on ? 'Return to the interactive portfolio' : 'Read the written brief');
  }
}
