# SIGNAL — Jay W. Snyder

An interactive, playable portfolio. The résumé is a world: six sectors floating
in a neon corridor, each one a chapter, each one guarded by data shards you
collect by flying through them. Read it by playing it — or press **Read the
brief** and get the whole thing as a plain, fast, accessible document.

**Jay W. Snyder** — AI Engineer · Business Builder · Game Developer
Owner, [Dazzle Divas Cleaning](https://www.dazzledivascleaning.com/) · Director of
Sales, Marketing & Technology, [SkyRun Daytona Vacation Rentals](https://skyrun.com/daytona/) ·
Founder, Hacktivate Nation.

---

## Why it is built this way

The site is the argument. A visitor who wants to know whether I can build
something ambitious in the browser should not have to take my word for it — they
should be standing inside the answer. So there is no framework, no scene
exporter and no template underneath: it is a hand-written Three.js engine with a
fixed-step simulation, custom GLSL, procedural audio and an adaptive quality
governor, plus a DOM layer for everything that ought to be real text.

And because attracting clients matters more than showing off, every word in the
world also exists as an ordinary web page. Reduced-motion visitors and browsers
without WebGL land there automatically.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run typecheck  # tsc --noEmit, strict
npm run build      # typecheck + production bundle into dist/
npm run preview    # serve the built bundle
npm run deploy     # build and publish dist/ to the gh-pages branch
```

Node 20.19+ is required. The build has no runtime dependency beyond `three`.

## Controls

| Input | Action |
| --- | --- |
| `W` `A` `S` `D` / arrows | Fly |
| Mouse drag / touch drag | Fly (steer toward the pointer) |
| `Shift` / `Space` / hold pointer | Boost |
| `` ` `` or `~` | Toggle the terminal |
| `B` | Toggle the written brief |
| `M` | Mute |
| `Esc` | Close the dossier, terminal or completion card |

The terminal is a real command parser — `help`, `whoami`, `sectors`,
`warp <sector>`, `projects`, `stack`, `contact`, `hire`, `status`, `brief`,
`reset`, `clear`. Unknown commands get a Levenshtein-based suggestion.

## Architecture

```
src/
├── main.ts              App shell: fixed-step loop, mode switching, wiring
├── core/
│   ├── Engine.ts        Renderer, camera, post chain, adaptive quality tiers
│   ├── Input.ts         Keyboard, pointer and touch into one input state
│   ├── Audio.ts         Procedural WebAudio — no audio files ship
│   ├── Events.ts        Typed pub/sub bus
│   ├── Save.ts          Defensive localStorage progress
│   └── Math.ts          clamp / lerp / damp / smoothstep / seeded PRNG
├── shaders/grain.ts     Film grain, vignette, chromatic aberration pass
├── world/
│   ├── World.ts         Scene graph, proximity activation, shard pickup
│   ├── Sector.ts        One chapter: landmark, label, shards, magnetism
│   ├── Landmark.ts      Six hand-built silhouettes, one per sector
│   ├── Corridor.ts      Spline of gates and debris that fills the route
│   ├── Grid.ts          Infinite neon floor (derivative-based anti-aliasing)
│   ├── Starfield.ts     Deterministic GPU point cloud
│   └── Label.ts         Canvas-texture sprites
├── player/              Arcade flight model and spring chase camera
├── game/GameState.ts    XP, ranks, shards, achievements
├── ui/                  HUD, dossier, terminal, toasts, brief, completion
├── data/                All content — profile, ventures, projects, sectors
└── styles/              Design tokens and component CSS
```

### Things worth pointing at

- **Fixed-step simulation.** Physics runs at a locked 60 Hz with an accumulator
  and a step cap; rendering is decoupled. Frame rate never changes flight feel.
- **Adaptive quality.** Frame time is sampled continuously. Sustained drops step
  the renderer down a tier — pixel ratio, bloom, grain, star count — instead of
  letting the experience stutter.
- **Procedural audio.** The drone, the collection chimes and the decrypt fanfare
  are synthesised in a WebAudio graph at runtime. Zero bytes of audio download.
- **Shard magnetism.** Shards break orbit and chase the ship once you are close,
  so collecting them is "fly roughly there" rather than "thread a needle at 34
  units a second". A visitor did not come here to play a bullet-hell.
- **Gate depth fade.** Corridor rings fade by view depth in an injected shader
  chunk, so a gate sweeping past the camera never becomes a white bar.
- **One content source.** `src/data/` feeds both the 3D dossiers and the written
  brief, so the two can never drift apart.

### Debugging

`window.SIGNAL.debug()` returns ship position, speed, progress and per-sector
shard distances from the browser console.

## Editing the content

Everything the site says lives in three files:

- `src/data/profile.ts` — name, contact, pitch, headline stats
- `src/data/content.ts` — ventures, projects, career, education, services, skills
- `src/data/sectors.ts` — how that content is laid out across the six sectors,
  including each sector's position, colour, shard count and locked bonus block

Adding a project means adding an entry to `projects` and referencing its id from
a sector's `cards` block. The brief picks it up automatically.

## Deploying

`base` is `'./'`, so the build works from any path.

- **Vercel — production:** <https://knotz3d-portfolio.vercel.app/>. Redeploys
  automatically on push to `main`. `vercel.json` pins the framework, `npm ci`,
  `npm run build` and `dist/`, so the deploy does not depend on dashboard
  settings left over from the previous app. Node is pinned to 22.x via `engines`.
- **GitHub Pages — mirror:** <https://knotenvy.github.io/Knotz3DPortfolio/>.
  Does *not* update automatically; run `npm run deploy` after any change to
  `main`, or it will serve a stale résumé from an indexed URL.

The absolute `og:image`, `og:url`, `canonical` and JSON-LD `url` in `index.html`
all point at the Vercel URL — social scrapers need absolute paths. If the site
moves to a custom domain, update those and the `seo` block in `handoff.json`.

## Handoff

`handoff.json` is the state-of-the-project record: what is deployed where, what
is still open, which content is unverified, and the decisions behind the build.
Update it whenever something material changes.

## Licence

MIT for the code. The written content, résumé and business details are Jay W.
Snyder's.
