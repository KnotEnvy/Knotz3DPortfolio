import { el, icons } from './dom';

/** Achievement / status notifications. Auto-dismissing, capped, never blocking. */
export class Toasts {
  private root: HTMLElement;
  private live: HTMLElement;

  constructor(parent: HTMLElement) {
    this.root = el('div', { class: 'toasts', 'aria-hidden': 'true' });
    // Screen readers get a polite live region instead of the animated stack.
    this.live = el('div', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
    parent.append(this.root, this.live);
  }

  push(name: string, note: string, icon: keyof typeof icons = 'trophy'): void {
    const node = el('div', { class: 'toast' }, [
      el('span', { class: 'toast__icon', html: icons[icon] }),
      el('div', {}, [el('div', { class: 'toast__name', text: name }), el('div', { class: 'toast__note', text: note })]),
    ]);
    this.root.append(node);
    this.live.textContent = `${name}. ${note}`;

    // Three at once is already a lot of screen on a phone.
    while (this.root.children.length > 3) this.root.firstElementChild?.remove();

    window.setTimeout(() => {
      node.classList.add('out');
      window.setTimeout(() => node.remove(), 400);
    }, 3800);
  }
}
