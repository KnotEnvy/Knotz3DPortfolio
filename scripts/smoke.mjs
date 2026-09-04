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

/* 4. Focus must not escape the pause dialog. */
await p2.keyboard.press('h');
await p2.waitForTimeout(800);
let escaped = false;
for (let i = 0; i < 14; i++) {
  await p2.keyboard.press('Tab');
  const inside = await p2.evaluate(() => !!document.activeElement?.closest('.ov'));
  if (!inside) {
    escaped = true;
    break;
  }
}
ok(!escaped, 'focus stays inside the pause dialog');
await p2.keyboard.press('Escape');
await p2.close();

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

console.log('\n' + (fails.length ? 'FAILURES:\n' + fails.join('\n') : 'ALL CHECKS PASSED'));
await browser.close();
process.exit(fails.length ? 1 : 0);
