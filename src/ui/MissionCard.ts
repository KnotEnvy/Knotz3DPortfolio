import { el, hex } from './dom';
import { bus } from '../core/Events';

/**
 * The sector title card.
 *
 * Three and a half seconds of "here is where you are and what this chapter is
 * about", then it gets out of the way. Games use these because arriving
 * somewhere new deserves a beat — and because it is the one moment a visitor
 * will read a full sentence without being asked to.
 */
export class MissionCard {
  readonly root: HTMLElement;

  private code: HTMLElement;
  private name: HTMLElement;
  private sub: HTMLElement;
  private brief: HTMLElement;
  private counter: HTMLElement;
  private timer = 0;

  constructor(parent: HTMLElement) {
    this.code = el('div', { class: 'card__code' });
    this.name = el('h2', { class: 'card__name' });
    this.sub = el('div', { class: 'card__sub' });
    this.brief = el('p', { class: 'card__brief' });
    this.counter = el('div', { class: 'card__counter' });

    this.root = el('div', { class: 'mcard', 'aria-hidden': 'true' }, [
      el('div', { class: 'mcard__inner' }, [
        el('div', { class: 'card__rule' }),
        this.counter,
        this.code,
        this.name,
        this.sub,
        this.brief,
        el('div', { class: 'card__rule' }),
      ]),
    ]);

    parent.append(this.root);

    bus.on('mission:card', (m) => this.show(m));
  }

  show(m: {
    code: string;
    name: string;
    subtitle: string;
    brief: string;
    index: number;
    total: number;
    color: number;
  }): void {
    // Wait for an outgoing dossier to finish leaving. Pressing Continue starts
    // the panel's slide-out and advances the director in the same frame, so
    // without this the next sector's title faded in behind a dossier that was
    // still fully on screen — which self-resolves in under a second and looks
    // like a mistake for every frame of it.
    const leaving = document.querySelector('.codex.on');
    if (leaving) {
      window.clearTimeout(this.timer);
      this.timer = window.setTimeout(() => this.show(m), 620);
      return;
    }

    this.setAccent(m.color);
    this.code.textContent = m.code;
    this.name.textContent = m.name;
    this.sub.textContent = m.subtitle;
    this.brief.textContent = m.brief;
    this.counter.textContent = `Sector ${m.index + 1} of ${m.total}`;

    this.root.classList.remove('on');
    void this.root.offsetWidth;
    this.root.classList.add('on');

    // The card and the objective banner carried identical text at the same
    // moment. The banner stands down while the card is up.
    document.body.classList.add('card-open');
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.root.classList.remove('on');
      document.body.classList.remove('card-open');
    }, 3600);
  }

  setAccent(color: number): void {
    this.root.style.setProperty('--accent', hex(color));
  }

  hide(): void {
    window.clearTimeout(this.timer);
    this.root.classList.remove('on');
    document.body.classList.remove('card-open');
  }
}
