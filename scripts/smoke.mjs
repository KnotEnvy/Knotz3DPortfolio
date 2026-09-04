/**
 * Behavioural smoke suite.
 *
 * Every check here exists because the thing it tests was once broken in a way
 * that a type-checker, a linter and a screenshot all failed to notice. They are
 * regression guards, not coverage: each one is a bug that shipped.
 *
 *   npm run build && npm run smoke
 *
 * Needs the production build served on :4173 (see the npm script) and Playwright
 * with a Chromium available. SMOKE_URL overrides the origin; SKIP_PASSIVE=1
 * skips the slow passive-visitor check.
 */
import { chromium } from 'playwright';

const OUT = process.env.OUT || null;
const BASE = process.env.SMOKE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const fails = [];
const ok = (c, m) => {
  console.log((c ? 'PASS  ' : 'FAIL  ') + m);
  if (!c) fails.push(m);
};
const skip = (m) => console.log('SKIP  ' + m);
const PASSIVE = !process.env.SKIP_PASSIVE;

/* 1. Passive visitor: launch and never touch anything again. */
const p1 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await p1.goto(`${BASE}/?tier=0`, { waitUntil: 'load' });
await p1.waitForTimeout(2500);
await p1.getByRole('button', { name: /Launch|Resume/ }).click();
let sawAssist = false;
let reached = false;
let lastState = null;
for (let i = 0; PASSIVE && i < 300; i++) {
  await p1.waitForTimeout(1000);
  const st = await p1.evaluate(() => ({
    d: window.SIGNAL.debug(),
    assist: document.querySelector('.assist')?.classList.contains('on') ?? false,
  }));
  if (st.assist) sawAssist = true;
  lastState = st.d;
  if (st.d.phase === 'dossier' || st.d.collected > 0) {
    reached = true;
    break;
  }
}
if (PASSIVE) {
  console.log('      passive end state:', JSON.stringify({
    phase: lastState?.phase, objective: lastState?.objective, collected: lastState?.collected,
    hostiles: lastState?.hostiles, node: lastState?.nodes?.[0],
  }));
  ok(sawAssist, 'passive visitor is offered help when the run stalls');
  ok(reached, 'passive visitor reaches a dossier without ever pressing anything');
} else {
  // The slow one: it has to wait out the stall timers in real time.
  skip('passive-visitor checks (SKIP_PASSIVE set)');
}
if (OUT) await p1.screenshot({ path: `${OUT}/v-passive.png` });
await p1.close();

/* 2. Alt-tab must not permanently freeze the run. */
const p2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await p2.goto(`${BASE}/?tier=0`, { waitUntil: 'load' });
await p2.waitForTimeout(2000);
await p2.getByRole('button', { name: /Launch|Resume/ }).click();
await p2.waitForTimeout(3000);
const before = (await p2.evaluate(() => window.SIGNAL.debug())).distance;
await p2.evaluate(() => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
  document.dispatchEvent(new Event('visibilitychange'));
});
await p2.waitForTimeout(1200);
await p2.evaluate(() => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
  document.dispatchEvent(new Event('visibilitychange'));
});
await p2.waitForTimeout(2500);
const after = (await p2.evaluate(() => window.SIGNAL.debug())).distance;
ok(after > before + 5, `run resumes after the tab returns (${before.toFixed(0)} -> ${after.toFixed(0)})`);

/* 3. Route spine must not lose pips as sectors are cleared. */
const spine = await p2.evaluate(() => {
  const dots = document.querySelectorAll('.spine__dot');
  dots[0].classList.add('done');
  const cs = getComputedStyle(dots[0]);
  return { count: dots.length, position: cs.position, opacity: cs.opacity };
});
ok(spine.count === 6, `spine renders all six pips (${spine.count})`);
ok(
  spine.position !== 'fixed' && spine.opacity !== '0',
  `a cleared pip stays in the spine (position=${spine.position}, opacity=${spine.opacity})`,
);

/*
 * 4. Focus must not escape the pause dialog.
 *
 * Tabbed well past the number of focusable controls in the panel, and both
 * ways. The original version pressed Tab fourteen times forward only, which was
 * enough to pass roughly two runs in three while the skip link — a child of
 * body, outside the inerted subtree — was still reachable. A trap that holds
 * most of the time is not a trap, and a regression test that agrees with it
 * most of the time is worse than none.
 */
await p2.keyboard.press('h');
await p2.waitForTimeout(800);
let escapedTo = null;
for (let i = 0; i < 40 && !escapedTo; i++) {
  await p2.keyboard.press('Tab');
  escapedTo = await p2.evaluate(() => {
    const a = document.activeElement;
    if (!a || a.closest('.ov')) return null;
    return a.tagName.toLowerCase() + (a.className ? '.' + String(a.className).split(' ')[0] : '');
  });
}
for (let i = 0; i < 40 && !escapedTo; i++) {
  await p2.keyboard.press('Shift+Tab');
  escapedTo = await p2.evaluate(() => {
    const a = document.activeElement;
    if (!a || a.closest('.ov')) return null;
    return a.tagName.toLowerCase() + (a.className ? '.' + String(a.className).split(' ')[0] : '');
  });
}
ok(!escapedTo, `focus stays inside the pause dialog${escapedTo ? ` (escaped to ${escapedTo})` : ''}`);
await p2.keyboard.press('Escape');
await p2.waitForTimeout(400);

/*
 * 5. "Read the ventures dossier" must require reading the ventures dossier.
 *
 * It used to be awarded from visit(), which the director calls the moment the
 * player starts flying toward the sector.
 */
const award = await p2.evaluate(async () => {
  const app = window.SIGNAL;
  app.goto('ventures');
  await new Promise((r) => setTimeout(r, 1200));
  const onArrival = app.debug().achievements ?? [];
  return { travelling: onArrival.includes('ventures') };
});
ok(!award.travelling, 'the ventures award is not granted merely for setting off toward it');
await p2.close();

/*
 * 5b. Breaking a node must hand keyboard focus to the dossier's Continue
 * button, or a keyboard-only visitor is given a panel they cannot reach.
 */
const pk = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await pk.goto(`${BASE}/?tier=0`, { waitUntil: 'load' });
await pk.waitForTimeout(2200);
await pk.getByRole('button', { name: /Launch|Resume/ }).click();
await pk.waitForTimeout(1500);
const focusLanded = await pk.evaluate(async () => {
  const app = window.SIGNAL;
  app.goto('origin');
  await new Promise((r) => setTimeout(r, 900));
  // Open the dossier the way the mission director does when a node breaks.
  app.forceDossier();
  await new Promise((r) => setTimeout(r, 1800));
  const a = document.activeElement;
  return {
    open: !!document.querySelector('.codex.on'),
    onContinue: !!(a && a.classList.contains('codex__continue')),
  };
});
ok(focusLanded.open, 'breaking a node opens the dossier');
ok(focusLanded.onContinue, 'keyboard focus lands on the dossier Continue button');
await pk.close();

/*
 * 5c. No overlay layer may shield the HUD from the mouse.
 *
 * #ui stacks full-viewport fixed layers over the canvas, so any one of them
 * that takes pointer events becomes an invisible shield over everything below
 * it. That is exactly what .mcard did: an ID selector in base.css beat the
 * layer's own `pointer-events: none`, so the route spine hovered, focused and
 * looked entirely alive while every click landed on a transparent div. Two
 * screenshot reviews missed it because the element that swallows the clicks
 * cannot be seen. This asserts the outcome, not the rule: a real click on a
 * route pip has to actually move the mission on.
 */
const pp = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await pp.goto(`${BASE}/?tier=0`, { waitUntil: 'load' });
await pp.waitForTimeout(2200);
await pp.getByRole('button', { name: /Launch|Resume/ }).click();
await pp.waitForTimeout(4000);

const shield = await pp.evaluate(() => {
  const dot = document.querySelector('.spine__dot');
  const r = dot.getBoundingClientRect();
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  const canvasHit = document.elementFromPoint(window.innerWidth / 2, window.innerHeight * 0.62);
  return {
    onDot: hit ? hit.tagName.toLowerCase() + '.' + String(hit.className).split(' ')[0] : 'nothing',
    reachesDot: !!(hit && hit.closest('.spine__dot')),
    reachesCanvas: !!(canvasHit && canvasHit.tagName === 'CANVAS'),
  };
});
ok(shield.reachesDot, `a route pip is the top element at its own coordinates (got ${shield.onDot})`);
ok(shield.reachesCanvas, 'the canvas is reachable through the HUD, so drag-to-fly still works');

const beforeObj = await pp.evaluate(() => window.SIGNAL.debug().objective);
let clicked = true;
await pp.click('.spine__dot:nth-child(3)', { timeout: 5000 }).catch(() => { clicked = false; });
await pp.waitForTimeout(2200);
const afterObj = await pp.evaluate(() => window.SIGNAL.debug().objective);
ok(clicked && beforeObj !== afterObj, `clicking a route pip jumps sector ("${beforeObj}" -> "${afterObj}")`);
await pp.close();

/*
 * 5d. The flight readout must never contradict itself.
 *
 * At a locked node the mission takes the throttle away, so the ship glides to a
 * stop — but the boost chip stayed lit the whole way in, showing 74, then 47,
 * then 20, then 0 m/s beside a lit BOOST. A reviewer named that combination as
 * the one thing on screen that looked like an actual bug, which is fair: BOOST
 * is supposed to mean "you are going faster because you asked to".
 *
 * This asserts the invariant across the whole approach rather than waiting for
 * the ship to come to rest. The first version of this check waited for a
 * fully stopped ship, never saw one inside its budget because the glide is
 * asymptotic, and passed on the strength of having observed nothing at all —
 * which is worse than no check, because it reports green.
 */
const ph = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await ph.goto(`${BASE}/?tier=0`, { waitUntil: 'load' });
await ph.waitForTimeout(2200);
await ph.getByRole('button', { name: /Launch|Resume/ }).click();
await ph.waitForTimeout(1500);
await ph.evaluate(() => window.SIGNAL.goto('origin'));
await ph.keyboard.down('Shift');

const CRUISE = 68;
let samples = 0;
let sawSlowing = false;
let contradiction = null;
for (let i = 0; i < 46 && !contradiction; i++) {
  await ph.waitForTimeout(550);
  const s = await ph.evaluate(() => {
    const d = window.SIGNAL.debug();
    return {
      phase: d.phase,
      speed: d.speed,
      label: document.querySelector('.flight__speed b')?.textContent,
      boostLit: document.querySelector('.flight__boost')?.classList.contains('on'),
    };
  });
  if (s.phase === 'dossier' || s.phase === 'complete') break;
  samples++;
  // The mission is visibly throttling the ship back toward the node.
  if (s.speed < CRUISE - 4) sawSlowing = true;
  if (s.boostLit && s.speed < CRUISE) contradiction = s;
  if (s.label === 'HOLD' && s.boostLit) contradiction = s;
}
await ph.keyboard.up('Shift');
ok(samples > 6, `the flight readout was actually sampled during an approach (${samples} samples)`);
ok(sawSlowing, 'the ship was observed being throttled back on the way into a node');
ok(!contradiction, `BOOST is never lit while the ship is slower than cruise (${JSON.stringify(contradiction)})`);
await ph.close();

/*
 * 5e. The console must be clean through a real fight.
 *
 * Every behavioural check in this file passed while the threat-marker shader
 * failed to compile, because a ShaderMaterial whose fragment shader will not
 * build simply draws nothing — the game plays identically, the debug hook
 * reports identically, and the markers are just gone. It shipped, and it was
 * caught by a reviewer reading the console rather than by anything here.
 *
 * A shader is declared broken by the GPU, out loud, on first use. Listening for
 * that costs one page and covers every material in the project at once, which
 * is a far better return than asserting anything about markers specifically.
 * Enemies only spawn on engagement, so this has to actually get into a fight.
 */
const pc = await browser.newPage({ viewport: { width: 1200, height: 700 } });
const consoleErrors = [];
pc.on('console', (m) => {
  if (m.type() !== 'error' && m.type() !== 'warning') return;
  const t = m.text();
  // Font CDNs and analytics are not ours and are blocked in some sandboxes.
  if (/fonts\.googleapis|fonts\.gstatic|favicon/i.test(t)) return;
  consoleErrors.push(`${m.type()}: ${t.slice(0, 300)}`);
});
pc.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message.slice(0, 300)}`));
await pc.goto(`${BASE}/?tier=2`, { waitUntil: 'load' });
await pc.waitForTimeout(2200);
await pc.getByRole('button', { name: /Launch|Resume/ }).click();
await pc.waitForTimeout(1800);
await pc.evaluate(() => window.SIGNAL.goto('origin'));
let fought = false;
for (let i = 0; i < 30 && !fought; i++) {
  await pc.waitForTimeout(700);
  fought = await pc.evaluate(() => window.SIGNAL.debug().hostiles > 0);
}
await pc.waitForTimeout(2500);
// Also exercise the node, dossier and completion materials.
await pc.evaluate(() => window.SIGNAL.forceDossier());
await pc.waitForTimeout(2000);
ok(fought, 'the console check actually reached a fight, so enemy materials were built');
ok(
  consoleErrors.length === 0,
  `no console errors during a real run (${consoleErrors.length}): ${consoleErrors.slice(0, 3).join(' | ')}`,
);
await pc.close();

/*
 * 5f. The dossier must be readable from the keyboard alone.
 *
 * Two separate faults met here. The reading pane was permanently focusable, so
 * on dossiers short enough to fit it was a Tab stop with no focus ring that did
 * nothing when pressed. And the arrow keys are the flight controls, so the
 * default scroll action both moved the panel and steered the ship — on a short
 * dossier, all it did was steer. A keyboard visitor could reach a chapter of
 * the resume and have no way to read past the fold.
 */
const pk2 = await browser.newPage({ viewport: { width: 1024, height: 700 } });
await pk2.goto(`${BASE}/?tier=0`, { waitUntil: 'load' });
await pk2.waitForTimeout(2200);
await pk2.getByRole('button', { name: /Launch|Resume/ }).click();
await pk2.waitForTimeout(1400);
await pk2.evaluate(async () => {
  window.SIGNAL.goto('origin');
  await new Promise((r) => setTimeout(r, 900));
  window.SIGNAL.forceDossier();
});
await pk2.waitForTimeout(2200);

const pane = await pk2.evaluate(() => {
  const b = document.querySelector('.codex__body');
  return { scrollable: b.scrollHeight - b.clientHeight > 4, tabindex: b.getAttribute('tabindex') };
});
ok(
  pane.scrollable === (pane.tabindex === '0'),
  `the reading pane is a tab stop exactly when it scrolls (${JSON.stringify(pane)})`,
);

if (pane.scrollable) {
  // Deliberately does NOT focus the pane first. When a node breaks, focus lands
  // on Continue, and that is exactly when a reader reaches for the arrow keys —
  // an earlier version of this check focused the pane by hand, which tested a
  // path no visitor takes and raced the deferred focus into a flaky pass.
  const before = await pk2.evaluate(() => window.SIGNAL.debug().offset);
  await pk2.keyboard.press('ArrowDown');
  await pk2.keyboard.press('ArrowDown');
  await pk2.waitForTimeout(500);
  const after = await pk2.evaluate(() => ({
    top: document.querySelector('.codex__body').scrollTop,
    offset: window.SIGNAL.debug().offset,
  }));
  ok(after.top > 0, `arrow keys scroll the dossier from wherever focus landed (scrollTop ${after.top})`);
  ok(
    before[0] === after.offset[0] && before[1] === after.offset[1],
    `reading the dossier does not fly the ship (${JSON.stringify(before)} -> ${JSON.stringify(after.offset)})`,
  );
} else {
  skip('arrow-key scrolling (this dossier fits its panel)');
}
await pk2.close();

/* 5. Title card must survive a narrow viewport. */
const p3 = await browser.newPage({ viewport: { width: 320, height: 720 } });
await p3.goto(`${BASE}/?tier=0`, { waitUntil: 'load' });
await p3.waitForTimeout(2500);
const narrow = await p3.evaluate(() => {
  const inner = document.querySelector('.boot__inner');
  return {
    inner: inner ? inner.getBoundingClientRect().width : 0,
    doc: document.documentElement.clientWidth,
  };
});
ok(
  narrow.inner <= narrow.doc + 1,
  `title card fits a 320px viewport (card ${narrow.inner.toFixed(0)}px in ${narrow.doc}px)`,
);
if (OUT) await p3.screenshot({ path: `${OUT}/v-320.png` });
await p3.close();

/* 6. Mobile: the brief keeps navigation, and the game HUD does not collide. */
const m = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
await m.goto(`${BASE}/`, { waitUntil: 'load' });
await m.waitForTimeout(2500);
const nav = await m.evaluate(() => {
  const links = document.querySelector('.bnav__links');
  const contact = document.querySelector('.bnav__contact');
  return {
    links: links ? getComputedStyle(links).display : 'missing',
    contact: contact ? getComputedStyle(contact).display : 'missing',
  };
});
ok(nav.links !== 'none' && nav.links !== 'missing', `brief keeps its section nav on a phone (${nav.links})`);
ok(nav.contact !== 'none' && nav.contact !== 'missing', `brief has a contact jump on a phone (${nav.contact})`);
if (OUT) await m.screenshot({ path: `${OUT}/v-mobile-brief.png` });

await m.evaluate(() => document.querySelector('.bnav__actions .btn--primary')?.click());
await m.waitForTimeout(4500);
if (OUT) await m.screenshot({ path: `${OUT}/v-mobile-game.png` });
const collide = await m.evaluate(() => {
  const a = document.querySelector('.shards')?.getBoundingClientRect();
  const b = document.querySelector('.tc__hint')?.getBoundingClientRect();
  if (!a || !b) return 'missing';
  return !(a.right < b.left || b.right < a.left || a.bottom < b.top || b.bottom < a.top);
});
ok(collide === false, `touch hint does not overlap the shard counter (${collide})`);

/*
 * The touch fly-band is a wide strip across the lower screen. If it takes
 * pointer events it eats every drag-to-fly gesture on a phone, leaving the ship
 * unsteerable while the boost button inside it still works — so the band has to
 * pass touches through and only its buttons opt back in.
 */
const band = await m.evaluate(() => {
  const tc = document.querySelector('.tc');
  if (!tc) return 'missing';
  const r = tc.getBoundingClientRect();
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + 8);
  return {
    layer: getComputedStyle(tc).pointerEvents,
    btn: document.querySelector('.tc__btn') ? getComputedStyle(document.querySelector('.tc__btn')).pointerEvents : 'missing',
    through: !!(hit && hit.tagName === 'CANVAS'),
  };
});
ok(band !== 'missing' && band.through, `a drag in the touch band reaches the canvas (${JSON.stringify(band)})`);
ok(band !== 'missing' && band.btn === 'auto', 'the boost button still takes taps');

console.log('\n' + (fails.length ? 'FAILURES:\n' + fails.join('\n') : 'ALL CHECKS PASSED'));
await browser.close();
process.exit(fails.length ? 1 : 0);
