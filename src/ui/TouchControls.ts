import { el } from './dom';
import type { Input } from '../core/Input';

/**
 * On-screen controls for touch devices.
 *
 * Only boost needs a button. Steering is a drag anywhere on the canvas and the
 * guns are automatic, because a phone gives you one usable thumb and spending it
 * on a fire button would mean nobody ever steers. A visible boost control also
 * removes the previous build's worst bug, where boost was inferred from "a
 * finger is down" and so was permanently on.
 */
export class TouchControls {
  readonly root: HTMLElement;

  constructor(parent: HTMLElement, private input: Input) {
    const boost = el('button', {
      class: 'tc__btn tc__boost',
      type: 'button',
      'aria-label': 'Boost',
      text: 'BOOST',
    });

    const press = (on: boolean) => (e: Event) => {
      e.preventDefault();
      this.input.touchBoost = on;
      boost.classList.toggle('held', on);
    };
    boost.addEventListener('pointerdown', press(true));
    boost.addEventListener('pointerup', press(false));
    boost.addEventListener('pointercancel', press(false));
    boost.addEventListener('pointerleave', press(false));

    const stick = el('div', { class: 'tc__hint', text: 'drag anywhere to fly' });

    this.root = el('div', { class: 'tc', 'aria-hidden': 'false' }, [stick, boost]);
    parent.append(this.root);
  }

  setVisible(on: boolean): void {
    this.root.classList.toggle('on', on);
  }

  /** Fade the drag hint once the visitor has clearly worked it out. */
  retireHint(): void {
    this.root.classList.add('learned');
  }
}
