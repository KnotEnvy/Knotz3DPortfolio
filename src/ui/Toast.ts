import { el, icons } from './dom';
import { bus } from '../core/Events';

/** Achievement / status notifications. Auto-dismissing, capped, never blocking. */
export class Toasts {
  private root: HTMLElement;
  private live: HTMLElement;
  /**
   * Toasts earned while a dossier is on screen wait for it.
   *
   * Awards fire on the same frame a node breaks, which is already the busiest
   * frame in the product: an explosion, a collapsing health bar, a title card
   * and a sliding dossier. Two achievements landing on top of that is the one
   * moment the interface asks a first-time visitor to read four things at once,
   * and the award is the least urgent of them. Held here and released when the
   * reader continues, it arrives on a quiet frame and actually gets seen.
   */
  private held: Array<[string, string, keyof typeof icons]> = [];
  private holding = false;

  constructor(parent: HTMLElement) {
    this.root = el('div', { class: 'toasts', 'aria-hidden': 'true' });
    // Screen readers get a polite live region instead of the animated stack.
    this.live = el('div', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
    parent.append(this.root, this.live);

    bus.on('codex:open', () => {
      this.holding = true;
    });
    bus.on('codex:close', () => {
      this.holding = false;
      const queued = this.held.splice(0);
      // Staggered, so a backlog reads as a short run of awards rather than a
      // wall of three identical cards appearing on one frame.
      queued.forEach(([n, note, icon], i) => window.setTimeout(() => this.show(n, note, icon), 500 + i * 700));
    });
  }

  push(name: string, note: string, icon: keyof typeof icons = 'trophy'): void {
    if (this.holding) {
      this.held.push([name, note, icon]);
      // The live region is not a visual queue — announce it when it happens.
      this.live.textContent = `${name}. ${note}`;
      return;
    }
    this.show(name, note, icon);
  }

  private show(name: string, note: string, icon: keyof typeof icons): void {
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
