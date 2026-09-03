import { clamp } from './Math';

export interface InputState {
  /** -1 left … 1 right */
  steer: number;
  /** -1 down … 1 up */
  pitch: number;
  /** 0 … 1 extra thrust */
  boost: number;
  /** -1 brake … 1 accelerate, layered on top of the cruise speed */
  throttle: number;
  brake: boolean;
}

const KEYMAP: Record<string, keyof typeof pressed> = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  ShiftLeft: 'boost',
  ShiftRight: 'boost',
  Space: 'boost',
};

const pressed = { up: false, down: false, left: false, right: false, boost: false, slow: false };

export class Input {
  readonly state: InputState = { steer: 0, pitch: 0, boost: 0, throttle: 0, brake: false };

  /** Pointer steering: normalised -1..1 offset from the screen centre. */
  private px = 0;
  private py = 0;
  private pointerActive = false;
  private usingPointer = false;
  private touchId: number | null = null;
  private disposers: Array<() => void> = [];

  /** True once the visitor has moved anything — used to retire the tutorial. */
  moved = false;

  constructor(private target: HTMLElement) {
    this.bind();
  }

  private bind(): void {
    const kd = (e: KeyboardEvent) => {
      const slot = KEYMAP[e.code];
      if (!slot) return;
      // Space doubles as boost but must not scroll the page.
      if (e.code === 'Space') e.preventDefault();
      pressed[slot] = true;
      this.usingPointer = false;
      this.moved = true;
    };
    const ku = (e: KeyboardEvent) => {
      const slot = KEYMAP[e.code];
      if (slot) pressed[slot] = false;
    };
    const blur = () => {
      for (const k of Object.keys(pressed) as (keyof typeof pressed)[]) pressed[k] = false;
      this.pointerActive = false;
    };

    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch' && this.touchId !== e.pointerId) return;
      const r = this.target.getBoundingClientRect();
      this.px = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      this.py = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
      this.usingPointer = true;
      this.moved = true;
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        if (this.touchId !== null) return;
        this.touchId = e.pointerId;
      }
      this.pointerActive = true;
      move(e);
    };
    const up = (e: PointerEvent) => {
      if (this.touchId === e.pointerId) this.touchId = null;
      this.pointerActive = false;
    };
    // Moving the cursor onto the dossier or the toolbar must not leave the ship
    // banking at whatever the last sampled offset was.
    const leave = () => {
      this.usingPointer = false;
      this.pointerActive = false;
      this.px = 0;
      this.py = 0;
    };

    this.target.addEventListener('pointermove', move, { passive: true });
    this.target.addEventListener('pointerdown', down, { passive: true });
    this.target.addEventListener('pointerleave', leave, { passive: true });
    window.addEventListener('pointerup', up, { passive: true });
    window.addEventListener('pointercancel', up, { passive: true });
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    window.addEventListener('blur', blur);

    this.disposers.push(
      () => this.target.removeEventListener('pointermove', move),
      () => this.target.removeEventListener('pointerdown', down),
      () => this.target.removeEventListener('pointerleave', leave),
      () => window.removeEventListener('pointerup', up),
      () => window.removeEventListener('pointercancel', up),
      () => window.removeEventListener('keydown', kd),
      () => window.removeEventListener('keyup', ku),
      () => window.removeEventListener('blur', blur),
    );
  }

  /** Call once per simulation step, before the ship integrates. */
  sample(enabled: boolean): InputState {
    const s = this.state;
    if (!enabled) {
      s.steer = 0;
      s.pitch = 0;
      s.boost = 0;
      s.throttle = 0;
      s.brake = false;
      return s;
    }

    const kx = (pressed.right ? 1 : 0) - (pressed.left ? 1 : 0);
    const ky = (pressed.up ? 1 : 0) - (pressed.down ? 1 : 0);

    if (kx !== 0 || ky !== 0) this.usingPointer = false;

    if (this.usingPointer) {
      // Dead zone keeps a resting cursor from nudging the ship forever.
      const dz = 0.08;
      const ax = Math.abs(this.px) < dz ? 0 : this.px;
      const ay = Math.abs(this.py) < dz ? 0 : this.py;
      s.steer = ax;
      s.pitch = -ay;
    } else {
      s.steer = kx;
      s.pitch = ky;
    }

    s.boost = pressed.boost || this.pointerActive ? 1 : 0;
    s.throttle = 0;
    s.brake = false;
    return s;
  }

  dispose(): void {
    for (const d of this.disposers) d();
    this.disposers = [];
  }
}
