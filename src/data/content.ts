/**
 * Sector content: ventures, engineering work, career history, services.
 * Sector geometry/placement lives in sectors.ts — this file is prose and facts.
 */

export interface Venture {
  id: string;
  name: string;
  role: string;
  period: string;
  url?: string;
  summary: string;
  points: string[];
  metrics: { label: string; value: string }[];
  accent: number;
}

export const ventures: Venture[] = [
  {
    id: 'dazzle',
    name: 'Dazzle Divas Cleaning',
    role: 'Owner',
    period: '2018 — Present',
    url: 'https://www.dazzledivascleaning.com/',
    summary:
      'Volusia County vacation-rental turnover and residential cleaning company. Built from a single van and a phone number into the crew property managers call first.',
    points: [
      'Grew the book of business entirely through grassroots marketing, local relationships and referral loops — no paid acquisition.',
      'Standardised a 2–4 hour guest-ready turnover with photo verification, so managers can trust the unit is listing-ready without driving out to it.',
      'Wrote the company website (Next.js), the internal inspection-checklist app, and the quoting flow myself.',
      'Sell a Review Protection Guarantee: if a guest review mentions cleanliness, we re-clean free. It converts because the operation can back it.',
      'Serve 15+ cities: Daytona Beach, Ormond Beach, New Smyrna, Port Orange, Ponce Inlet and the rest of the county.',
    ],
    metrics: [
      { label: 'Properties / year', value: '550+' },
      { label: 'Guest satisfaction', value: '98%' },
      { label: 'Turnover window', value: '2–4 hr' },
      { label: 'Cities covered', value: '15+' },
    ],
    accent: 0xff3d81,
  },
  {
    id: 'skyrun',
    name: 'SkyRun Daytona Vacation Rentals',
    role: 'Director of Sales, Marketing & Technology',
    period: 'Aug 2026 — Present',
    url: 'https://skyrun.com/daytona/',
    summary:
      'Short-term rental management across Daytona Beach, Daytona Beach Shores, Ormond Beach, New Smyrna Beach and Ponce Inlet. I own the revenue side and the systems that run it.',
    points: [
      'Own owner acquisition end to end: outreach, pitch, onboarding, and the retention conversations that keep doors under management.',
      'Run the marketing engine — direct-booking funnel, listing quality, local partnerships and the community presence that feeds referrals.',
      'Build the internal technology: owner surveys, reporting, and the automations that move work between listing platforms, cleaners and maintenance.',
      'Sit between the guest experience and the owner P&L, which is exactly where AI tooling earns its keep.',
      'Coordinate directly with the cleaning operation — I have run both sides of that handoff, so the SLAs are written by someone who has to meet them.',
    ],
    metrics: [
      { label: 'Coastal markets', value: '5' },
      { label: 'Discipline', value: 'Sales · Marketing · Tech' },
      { label: 'Focus', value: 'Direct bookings' },
      { label: 'Model', value: 'Locally owned' },
    ],
    accent: 0x4de1c1,
  },
  {
    id: 'hacktivate',
    name: 'Hacktivate Nation',
    role: 'Founder · AI Engineer',
    period: '2023 — Present',
    summary:
      'My software practice and the community around it. Where the client work, the research and the open-source arcade all get built.',
    points: [
      'Shipped 40+ projects: AI agents and assistants, full-stack SaaS, internal ops tooling, and a lot of games.',
      'Built and moderated a 500+ member public community across Discord, X and YouTube for people learning to build with AI.',
      'Grew the practice’s reach by over 55% in a single fiscal year through content and community rather than ad spend.',
      'Run continuous AI research — model selection, prompt architecture, retrieval, evaluation, and the unglamorous plumbing that makes agents reliable.',
    ],
    metrics: [
      { label: 'Projects shipped', value: '40+' },
      { label: 'Community', value: '500+' },
      { label: 'Public repos', value: '30+' },
      { label: 'Reach growth', value: '+55%' },
    ],
    accent: 0xffb454,
  },
];

/* ------------------------------------------------------------------ */

export interface Project {
  id: string;
  name: string;
  kind: 'ai' | 'game' | 'business';
  headline: string;
  body: string;
  stack: string[];
  highlights: string[];
  repo?: string;
  /** Playable or browsable right now. Labelled as such everywhere it appears. */
  live?: string;
  /** A second live surface — a companion app, an admin tool. */
  live2?: { label: string; href: string };
  scale?: string;
}

export const projects: Project[] = [
  {
    id: 'arcade',
    name: 'HacktivateNations Arcade',
    kind: 'ai',
    headline: 'A full arcade platform with a shared economy, built like a product.',
    body:
      'A modular arcade hub where every mini-game plugs into one progression system: a shared wallet, tier unlocks, achievements and leaderboards that sync across devices. The registry pattern keeps released games and the catalog honest with each other, and the whole progression layer is locked down at the database level before anything ships publicly.',
    stack: ['Next.js', 'TypeScript', 'Supabase', 'PostgreSQL', 'Tailwind', 'Jest', 'Playwright', 'Vercel'],
    highlights: [
      '17 playable games registered against a shared progression loop',
      'Row-level security migration that locks progression writes server-side',
      'Procedural audio system — no sample downloads, all synthesised',
      'Sign-in-first auth with real-time wallet and achievement sync',
    ],
    repo: 'https://github.com/KnotEnvy/hacktivate-nations-arcade',
    scale: 'Platform',
  },
  {
    id: 'harddrivin',
    name: 'KnotzHardDrivin',
    kind: 'game',
    headline: 'Rigid-body stunt driving in the browser. Real physics, no shortcuts.',
    body:
      'A 3D stunt driving simulator built on Three.js with the Rapier physics engine compiled to WebAssembly. Suspension, weight transfer, tyre friction and airborne rotation are simulated rather than faked, and the whole thing is covered by a Vitest unit suite plus Playwright end-to-end runs so a physics regression cannot sneak into a build.',
    stack: ['Three.js', 'Rapier3D (WASM)', 'TypeScript', 'Vite', 'Howler', 'Vitest', 'Playwright'],
    highlights: [
      'Rapier rigid-body vehicle model — suspension, traction, aerial control',
      'Fixed-timestep simulation decoupled from render rate',
      'Unit + end-to-end test coverage over gameplay systems',
      'Strict TypeScript with lint, format and type-check gates',
    ],
    repo: 'https://github.com/KnotEnvy/KnotzHardDrivin',
    scale: '3D engine',
  },
  {
    id: 'galaxia',
    name: 'VOID ASCENDANT: GALAXIA',
    kind: 'game',
    headline: 'Galaga rebuilt in 2.5D on a hand-rolled entity-component system.',
    body:
      'A reimagining of classic Galaga formation-attack mechanics rendered in Three.js and driven by a custom ECS. Entities are data, systems are pure functions over that data, and the render layer is the only part that knows about the GPU — the architecture a real engine wants, written small enough to read in an afternoon.',
    stack: ['Three.js', 'TypeScript', 'ECS', 'Vite', 'lil-gui'],
    highlights: [
      'Custom entity-component-system with data-oriented storage',
      '2.5D formation-attack AI faithful to the arcade original',
      'Live tuning panel for gameplay constants',
      'Type-check gate wired into the build script',
    ],
    repo: 'https://github.com/KnotEnvy/KnotzGalaga2',
    scale: '3D engine',
  },
  {
    id: 'eclipse',
    name: 'Eclipse Vector: Fracture of the Veil',
    kind: 'game',
    headline: 'A narrative space shooter with branching missions and a content compiler.',
    body:
      'Browser-native TypeScript shooter with authored enemy archetypes, five branching missions, fail-forward consequences that persist into later runs, salvage upgrades and a save shell. The part I am proudest of is not the combat — it is the content-validation CLI that schema-checks every mission, dialogue node, weapon and status effect and refuses to build on a broken cross-reference.',
    stack: ['TypeScript', 'PixiJS', 'Vite', 'Custom content CLI', 'Vitest'],
    highlights: [
      'Fixed-step simulation loop with typed event bus',
      'Content validation CLI with schema mirrors for every authored type',
      'Branching missions with persistent fail-forward consequences',
      'Status-effect system built as reusable extension points',
    ],
    repo: 'https://github.com/KnotEnvy/KnotzEclipseVector',
    scale: 'Systems design',
  },
  {
    id: 'mathquest',
    name: 'MathQuest Florida',
    kind: 'ai',
    headline: 'AI tutoring for the SAT and Florida college-readiness exams.',
    body:
      'A gamified math tutor that meets a student where they are: GPT-4o generates and explains problems against the actual Florida standards, progress is tracked per skill, and the loop is built to keep a teenager coming back. Product requirements, roadmap, design system and API are documented in-repo because education software gets audited.',
    stack: ['Next.js 15', 'TypeScript', 'Supabase', 'OpenAI GPT-4o', 'PostHog', 'Sentry', 'Tailwind'],
    highlights: [
      'LLM-generated practice aligned to published exam standards',
      'Per-skill mastery tracking on Supabase with row-level auth',
      'Product analytics and error monitoring wired in from day one',
      'Full PRD, roadmap, design and API docs committed alongside the code',
    ],
    repo: 'https://github.com/KnotEnvy/mathquest-florida',
    scale: 'AI product',
  },
  {
    id: 'casino',
    name: 'Knotz Crapz N Cardz',
    kind: 'game',
    headline: 'Casino games where the maths is as honest as the physics.',
    body:
      'A collection of casino games built properly. The craps table runs genuine rigid-body dice physics that always resolve to exactly what the RNG called — the hard problem is making a real simulation land on a predetermined result without looking rigged. Dragon’s Shrine is a 5x4 video slot with free spins, hold-and-win and four jackpot tiers, with a measured return-to-player rather than a guessed one.',
    stack: ['TypeScript', 'Canvas/WebGL', 'Physics simulation', 'Docker', 'nginx', 'docker-compose'],
    highlights: [
      'Dice physics reconciled to a provably fair RNG outcome',
      '5x4 slot with true odds, free spins, hold-and-win and four jackpots',
      'Each game is an independent app; compose file runs the arcade together',
      'Static builds shipped as separate nginx containers',
    ],
    repo: 'https://github.com/KnotEnvy/KnotzCrapzNCardz',
    scale: 'Simulation',
  },
  {
    id: 'knotzflix',
    name: 'KnotzFlix',
    kind: 'ai',
    headline: 'A Netflix-grade media library that never phones home.',
    body:
      'A local-first media manager in Python with a PyQt6 desktop interface. SQLite FTS5 gives instant type-ahead search across a whole library, ffmpeg generates posters with deterministic heuristics and falls back to offline placeholders, and the codebase is split MVVM-style across ui, domain and infra so the interface never touches the filesystem directly.',
    stack: ['Python 3.11', 'PyQt6', 'SQLite FTS5', 'ffmpeg', 'MVVM'],
    highlights: [
      'Full-text search with type-ahead filtering via FTS5',
      'Deterministic poster generation with graceful offline fallback',
      'Shelves: Library, Recently Added, By Folder, Continue Watching',
      'Layered architecture with 31 unit tests',
    ],
    repo: 'https://github.com/KnotEnvy/KnotzFlix',
    scale: 'Desktop app',
  },
  {
    id: 'raven',
    name: 'Knotz Raven Mayhem',
    kind: 'game',
    headline: 'A click-target prototype rebuilt into a full arcade cabinet.',
    body:
      'What started as a canvas experiment is now a Phaser 3 arcade shooter with an attract screen, an armory of guns and assist chips, staged waves, bosses, bonus rounds, star-graded run reports and coin-based persistent progression. It is the clearest example of how I take a prototype and drive it to a finished, replayable product.',
    stack: ['Phaser 3', 'TypeScript', 'Vite', 'localStorage persistence'],
    highlights: [
      'Nine raven runs with boss fights and a Jackpot Alley bonus round',
      'Persistent armory upgrades funded by run performance',
      'S-rank stage grading and local records',
      'Motion, shake and audio accessibility toggles',
    ],
    repo: 'https://github.com/KnotEnvy/Knotz-Raven-Mayhem',
    live: 'https://knotenvy.github.io/Knotz-Raven-Mayhem/',
    scale: 'Arcade',
  },
  {
    id: 'invadespace',
    name: 'Knotz: Invade Space',
    kind: 'game',
    headline: 'A story-driven space-shooter roguelite that runs in a tab.',
    body:
      'A five-sector campaign to break the siege of Earth, structured as a roguelite: clear a sector, dock with the UES Orion carrier, spend what you earned on permanent upgrades, go back out further than last time. There is an endless mode for score chasers and seeded daily challenges so everyone gets the same run — which means the generator had to be deterministic, not merely random. Keyboard, mouse and touch all play it, with no install and no account.',
    stack: ['TypeScript', 'Canvas', 'Vite', 'Seeded procedural generation', 'localStorage persistence'],
    highlights: [
      'Five-sector campaign with a carrier hub between missions',
      'Roguelite meta-progression: credits spent on permanent upgrades',
      'Seeded daily challenges — deterministic runs shared by every player',
      'One build plays on keyboard, mouse and touch',
    ],
    repo: 'https://github.com/KnotEnvy/KnotzInvadeSpace',
    live: 'https://knotenvy.github.io/KnotzInvadeSpace/',
    scale: 'Roguelite',
  },
  {
    id: 'dazzlesite',
    name: 'Dazzle Divas Cleaning',
    kind: 'business',
    headline: 'My own company’s production site — and the ops tools behind it.',
    body:
      'The live storefront for the cleaning business: a Next.js site built to convert vacation-rental managers, not to win design awards. Behind it sits a TypeScript inspection-checklist app the crews use on-site, so the photo verification we promise on the sales page is a real workflow and not a marketing line.',
    stack: ['Next.js', 'React', 'TypeScript', 'Vercel'],
    highlights: [
      'Conversion-first structure: service, proof, guarantee, quote',
      'Companion inspection-checklist app used by the crews daily',
      'Local SEO across 15+ Volusia County service areas',
      'Owned end to end — I write it, I run the business it sells',
    ],
    repo: 'https://github.com/KnotEnvy/dazzle-divas-cleaning',
    live: 'https://www.dazzledivascleaning.com/',
    live2: { label: 'Field Checklist app', href: 'https://app.dazzledivascleaning.com/' },
    scale: 'Production',
  },
  {
    id: 'knotzgpt',
    name: 'KnotzGPT-Plus',
    kind: 'ai',
    headline: 'A multi-model chat platform with persistence and its own data layer.',
    body:
      'A Next.js AI workspace with Prisma-backed conversation storage, custom hooks for streaming responses, and a component system built to swap model providers without rewriting the interface. Deployed and live.',
    stack: ['Next.js', 'TypeScript', 'Prisma', 'Tailwind', 'Vercel'],
    highlights: [
      'Provider-agnostic chat layer with streaming responses',
      'Prisma schema and migrations for durable conversation history',
      'Custom hooks isolating transport from presentation',
      'Shipped to production on Vercel',
    ],
    repo: 'https://github.com/KnotEnvy/KnotzGPT-Plus',
    scale: 'AI product',
  },
];

/* ------------------------------------------------------------------ */

export interface Role {
  company: string;
  title: string;
  period: string;
  place: string;
  points: string[];
  current?: boolean;
}

export const career: Role[] = [
  {
    company: 'SkyRun Daytona Vacation Rentals',
    title: 'Director of Sales, Marketing & Technology',
    period: 'Aug 2026 — Present',
    place: 'Daytona Beach, FL',
    current: true,
    points: [
      'Lead sales, marketing and technology for short-term rental management across five coastal Volusia markets.',
      'Own owner acquisition and retention, the direct-booking funnel and the local partnerships that feed it.',
      'Build the internal tooling — owner surveys, reporting and the automations connecting listings, cleaning and maintenance.',
    ],
  },
  {
    company: 'Dazzle Divas Cleaning',
    title: 'Owner',
    period: '2018 — Present',
    place: 'Volusia County, FL',
    current: true,
    points: [
      'Founded and run a vacation-rental turnover and residential cleaning company covering 15+ cities.',
      'Grew to 550+ properties a year on referrals and community presence, holding a 98% guest satisfaction rate.',
      'Wrote the company website and the crew-facing inspection app; I am the owner and the engineering department.',
    ],
  },
  {
    company: 'Hacktivate Nation',
    title: 'Founder · AI Engineer',
    period: '2023 — Present',
    place: 'Daytona Beach, FL',
    current: true,
    points: [
      'Shipped 40+ projects spanning AI agents, full-stack SaaS, internal tooling and game engines.',
      'Built a 500+ member technology community across Discord, X and YouTube; grew reach 55% in one fiscal year.',
      'Run ongoing applied AI research — retrieval, evaluation, agent reliability and cost control.',
    ],
  },
  {
    company: 'MarketOnce Holding, LLC',
    title: 'Company Estimator',
    period: '2021 — 2023',
    place: 'Daytona Beach, FL',
    points: [
      'Owned all quoting across mail print, wide format, promotional and fulfilment lines.',
      'Ran vendor relationships and competitive pricing to protect margin.',
      'Supported sales through deal close, using operational knowledge to open new revenue lines.',
    ],
  },
  {
    company: 'DME Delivers, LLC',
    title: 'Estimator → Implementation Manager',
    period: '2017 — 2021',
    place: 'Daytona Beach, FL',
    points: [
      'Launched and maintained multiple B2B and B2C e-commerce platforms; annual sales up 30% four years running.',
      'Administered Avanti Slingshot, Cyrious, Salesforce, BMS and IPN, lifting operational efficiency ~25%.',
      'Led pricing and cost analysis company-wide and built the estimation models behind it.',
    ],
  },
  {
    company: 'Action Pools & Spas, LLC',
    title: 'Co-Owner / Operator',
    period: '2010 — 2017',
    place: 'Ormond Beach, FL',
    points: [
      'Ran the whole business: P&L, tax, payroll structure, customer satisfaction and crew development.',
      'Built the marketing that grew the route, years before anyone called it growth marketing.',
      'First lesson in the thing I still trade on — local trust compounds faster than any ad budget.',
    ],
  },
];

export const education = {
  school: 'University of Central Florida',
  place: 'Orlando, FL',
  degree: 'B.S. Business Administration',
  notes: [
    'Project lead for the Cornerstone capstone, managing teams supporting the Red Cross and other nonprofits.',
    'Coursework in accounting, finance, marketing and business operations — the vocabulary I still use with clients.',
  ],
  training: [
    'How to Use the OpenAI API to Build AI Apps & Fine-Tune Models',
    'Become an AI-Powered Engineer: ChatGPT & GitHub Copilot',
    'Microsoft Azure AI Fundamentals',
    'Searching Algorithms in AI',
    'ChatGPT Prompt Engineering',
    'SEO Fundamentals: Post-AI',
    'Game Development with JavaScript',
  ],
};

/* ------------------------------------------------------------------ */

export interface Service {
  id: string;
  name: string;
  promise: string;
  detail: string;
  deliverables: string[];
}

export const services: Service[] = [
  {
    id: 'audit',
    name: 'AI Leverage Audit',
    promise: 'Find the hours your business is burning, and the ones AI can buy back.',
    detail:
      'I walk your operation the way I walk my own: quoting, scheduling, dispatch, follow-up, reporting. You get a ranked map of what to automate first, what to leave alone, and what the honest payback looks like — written by someone who has had to live with the answer.',
    deliverables: [
      'Process map of where the hours actually go',
      'Ranked automation backlog with effort and payback',
      'Tooling recommendation with real cost modelling',
      'A 90-day sequence your team can execute',
    ],
  },
  {
    id: 'agents',
    name: 'Custom AI Agents & Internal Tools',
    promise: 'The assistant that knows your business, not the internet’s.',
    detail:
      'Retrieval over your own documents, agents wired into the systems you already pay for, and interfaces your staff will actually open. Built with evaluation and guardrails from the start, because an assistant that is confidently wrong costs more than no assistant at all.',
    deliverables: [
      'Retrieval pipeline over your documents and records',
      'Agent workflows integrated with your existing stack',
      'Evaluation harness so quality is measured, not assumed',
      'Staff-facing UI plus the runbook to maintain it',
    ],
  },
  {
    id: 'web',
    name: 'Websites That Close',
    promise: 'A site built to convert, by someone who has to sell for a living.',
    detail:
      'Next.js and React front ends with the structure a buyer actually needs — proof, guarantee, price, path to contact — plus the local SEO and analytics to know it is working. My own companies run on the sites I build.',
    deliverables: [
      'Conversion-first architecture and copy structure',
      'Fast, accessible, mobile-first build',
      'Local SEO and structured data',
      'Analytics and lead routing that you own',
    ],
  },
  {
    id: 'interactive',
    name: 'Interactive & Game Experiences',
    promise: 'When a page will not do the job, build a world.',
    detail:
      'Three.js and WebGL experiences, product configurators, training simulations and browser games. Real-time rendering, real physics, and the discipline of a fixed-step game loop — the same engine work that produced the site you are standing in.',
    deliverables: [
      'Three.js / WebGL experiences tuned for mobile',
      'Game loops, physics and procedural content',
      'Interactive product and training simulations',
      'Performance budgets and graceful degradation',
    ],
  },
];

export const skillGroups = [
  {
    group: 'AI Engineering',
    items: [
      'LLM application architecture',
      'Retrieval-augmented generation',
      'Agent design & tool use',
      'Prompt architecture & evaluation',
      'OpenAI / Anthropic / Gemini APIs',
      'Fine-tuning & model selection',
      'Vector search',
      'Cost & latency optimisation',
    ],
  },
  {
    group: 'Engineering',
    items: [
      'TypeScript',
      'Python',
      'React / Next.js',
      'Node.js',
      'Three.js / WebGL / GLSL',
      'Supabase / PostgreSQL',
      'Prisma',
      'Flask / Django',
      'Docker',
      'Vite',
      'Playwright / Vitest / Jest',
      'Tailwind CSS',
    ],
  },
  {
    group: 'Game Development',
    items: [
      'Entity-component systems',
      'Fixed-timestep simulation',
      'Rapier / rigid-body physics',
      'Phaser 3 & PixiJS',
      'Procedural audio (WebAudio)',
      'Progression & economy design',
      'Shader authoring',
      'Performance profiling',
    ],
  },
  {
    group: 'Business',
    items: [
      'P&L ownership',
      'Sales leadership',
      'Grassroots & local marketing',
      'Estimating & pricing strategy',
      'Operations & SOP design',
      'Vendor management',
      'Community building',
      'Team development',
    ],
  },
];
