import { clamp } from './Math';

export interface InputState {
  /** -1 left … 1 right. A *target* position across the tube, not a rate. */
  steer: number;
  /** -1 down … 1 up. */
  pitch: number;
  /** 0 … 1 extra thrust. */
  boost: number;
  /** True while the guns should be firing. */
  fire: boolean;
  brake: boolean;
}

type Slot = 'up' | 'down' | 'left' | 'right' | 'boost' | 'fire' | 'brake';

const KEYMAP: Record<string, Slot> = {
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
  Space: 'fire',
  KeyJ: 'fire',
  KeyC: 'brake',
  ControlLeft: 'brake',
};

/** Pixels of drag that equal full deflection on a touch screen. */
const STICK_RANGE = 88;

/**
 * Input, in three flavours that all produce the same state.
 *
 *  - **Mouse**: the cursor is a reticle. Where it sits on screen is where the
 *    ship goes. This is the control scheme rail shooters have used since Rez,
 *    and it beats key-steering badly for aiming.
 *  - **Keyboard**: WASD nudges the same target, for people who would rather not
 *    hold a mouse still.
 *  - **Touch**: dragging anywhere is a virtual stick relative to where the
 *    finger landed, and the guns fire on their own.
 *
 * The touch path is a rewrite of the previous one, which had a real bug: boost
 * was wired to "a pointer is currently down", and since steering on a touch
 * screen *requires* holding a finger down, every mobile visitor flew the entire
 * site at maximum boost while the HUD cheerfully told them to hold to boost.
 * Boost is now an explicit control the HUD renders, and never a side effect of
 * steering.
 */
export class Input {
  readonly state: InputState = { steer: 0, pitch: 0, boost: 0, fire: false, brake: false };

  private pressed: Record<Slot, boolean> = {
    up: false,
    down: false,
    left: false,
    right: false,
    boost: false,
    fire: false,
    brake: false,
  };

  /** Reticle position, normalised -1..1 from the centre of the canvas. */
  private aimX = 0;
  private aimY = 0;
  private usingPointer = false;
  private mouseFire = false;

  /** Touch stick. */
  private touchId: number | null = null;
  private touchOx = 0;
  private touchOy = 0;
  private stickX = 0;
  private stickY = 0;

  /** Driven by the on-screen buttons. */
  touchBoost = false;
  touchFire = false;

  /** True once anything has been touched — used to retire the tutorial. */
  moved = false;
  /** True on a device we should show touch controls for. */
  readonly coarse: boolean;

  private disposers: Array<() => void> = [];

  constructor(private target: HTMLElement) {
    this.coarse = window.matchMedia('(pointer: coarse)').matches;
    this.bind();
  }

  private bind(): void {
    const kd = (e: KeyboardEvent) => {
      const slot = KEYMAP[e.code];
      if (!slot) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // Space must not scroll the page or re-trigger a focused button.
      if (e.code === 'Space') e.preventDefault();
      this.pressed[slot] = true;
      if (slot === 'left' || slot === 'right' || slot === 'up' || slot === 'down') this.usingPointer = false;
      this.moved = true;
    };
    const ku = (e: KeyboardEvent) => {
      const slot = KEYMAP[e.code];
      if (slot) this.pressed[slot] = false;
    };
    const blur = () => {
      for (const k of Object.keys(this.pressed) as Slot[]) this.pressed[k] = false;
      this.mouseFire = false;
      this.touchId = null;
      this.stickX = 0;
      this.stickY = 0;
    };

    const aim = (e: PointerEvent) => {
      const r = this.target.getBoundingClientRect();
      this.aimX = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      this.aimY = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
      this.usingPointer = true;
      this.moved = true;
    };

    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        if (e.pointerId !== this.touchId) return;
        this.stickX = clamp((e.clientX - this.touchOx) / STICK_RANGE, -1, 1);
        this.stickY = clamp((e.clientY - this.touchOy) / STICK_RANGE, -1, 1);
        this.moved = true;
        return;
      }
      aim(e);
    };

    const down = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        if (this.touchId !== null) return;
        this.touchId = e.pointerId;
        this.touchOx = e.clientX;
        this.touchOy = e.clientY;
        this.stickX = 0;
        this.stickY = 0;
        this.moved = true;
        return;
      }
      aim(e);
      this.mouseFire = true;
    };

    const up = (e: PointerEvent) => {
      if (e.pointerId === this.touchId) {
        this.touchId = null;
        this.stickX = 0;
        this.stickY = 0;
      }
      if (e.pointerType !== 'touch') this.mouseFire = false;
    };

    // Moving onto a panel must not leave the ship pinned at the last offset.
    const leave = () => {
      this.usingPointer = false;
      this.aimX = 0;
      this.aimY = 0;
      this.mouseFire = false;
    };

    const ctx = (e: Event) => e.preventDefault();

    this.target.addEventListener('pointermove', move, { passive: true });
    this.target.addEventListener('pointerdown', down, { passive: true });
    this.target.addEventListener('pointerleave', leave, { passive: true });
    this.target.addEventListener('contextmenu', ctx);
    window.addEventListener('pointerup', up, { passive: true });
    window.addEventListener('pointercancel', up, { passive: true });
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    window.addEventListener('blur', blur);

    this.disposers.push(
      () => this.target.removeEventListener('pointermove', move),
      () => this.target.removeEventListener('pointerdown', down),
      () => this.target.removeEventListener('pointerleave', leave),
      () => this.target.removeEventListener('contextmenu', ctx),
      () => window.removeEventListener('pointerup', up),
      () => window.removeEventListener('pointercancel', up),
      () => window.removeEventListener('keydown', kd),
      () => window.removeEventListener('keyup', ku),
      () => window.removeEventListener('blur', blur),
    );
  }

  /** Where the reticle should be drawn, in normalised screen space. */
  get reticle(): { x: number; y: number; active: boolean } {
    if (this.touchId !== null) return { x: this.stickX, y: this.stickY, active: true };
    return { x: this.aimX, y: this.aimY, active: this.usingPointer };
  }

  /** Call once per simulation step, before the ship integrates. */
  sample(enabled: boolean): InputState {
    const s = this.state;
    if (!enabled) {
      s.steer = 0;
      s.pitch = 0;
      s.boost = 0;
      s.fire = false;
      s.brake = false;
      return s;
    }

    const kx = (this.pressed.right ? 1 : 0) - (this.pressed.left ? 1 : 0);
    const ky = (this.pressed.up ? 1 : 0) - (this.pressed.down ? 1 : 0);

    if (this.touchId !== null) {
      s.steer = this.stickX;
      s.pitch = -this.stickY;
    } else if (kx !== 0 || ky !== 0) {
      // Keys command a full-deflection target; the ship's own inertia softens it.
      s.steer = kx;
      s.pitch = ky;
    } else if (this.usingPointer) {
      // Dead zone so a resting cursor near the centre does not creep.
      const dz = 0.06;
      s.steer = Math.abs(this.aimX) < dz ? 0 : this.aimX;
      s.pitch = Math.abs(this.aimY) < dz ? 0 : -this.aimY;
    } else {
      s.steer = 0;
      s.pitch = 0;
    }

    s.boost = this.pressed.boost || this.touchBoost ? 1 : 0;
    // On a touch screen the guns are automatic: there is no spare thumb.
    s.fire = this.pressed.fire || this.mouseFire || this.touchFire || (this.coarse && this.touchId !== null);
    s.brake = this.pressed.brake;
    return s;
  }

  dispose(): void {
    for (const d of this.disposers) d();
    this.disposers = [];
  }
}
