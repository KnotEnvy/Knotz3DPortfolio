/**
 * Canonical profile data. Everything the site says about Jay lives here so the
 * 3D experience and the accessible Brief view can never drift apart.
 */

export const profile = {
  name: 'Jay W. Snyder',
  handle: 'KnotEnvy',
  callsign: 'SIGNAL',
  title: 'AI Engineer · Business Builder · Game Developer',
  location: 'Daytona Beach, Florida',
  email: 'jwsnyder@gmail.com',
  phone: '(386) 301-5775',
  github: 'https://github.com/KnotEnvy',
  linkedin: 'https://www.linkedin.com/in/jay-snyder-3b1a9b1b1/',
  siteDazzle: 'https://www.dazzledivascleaning.com/',
  siteSkyrun: 'https://skyrun.com/daytona/',

  tagline: 'I build AI systems that make real businesses more money — and I run the businesses that prove it.',

  pitch: [
    "Most people selling you AI have never had to make payroll. I have. I own a cleaning company that turns over 550+ vacation rentals a year, and I run sales, marketing and technology for a Daytona vacation-rental management firm.",
    "Then I go home and write the software. Agents, pipelines, dashboards, physics engines, game loops — 30+ repositories of it. The same hands that build the tooling also carry the P&L, which means I ship automation that survives contact with a real operation instead of a demo.",
    "This site is the argument. You are inside a Three.js game engine I wrote. Fly it, break it, collect the data shards. Everything you need to know about hiring me is scattered across this world.",
  ],

  values: [
    {
      k: 'Relationships first',
      v: 'Every business I have grown was grown on the ground — handshakes, referrals, showing up. AI multiplies that. It never replaces it.',
    },
    {
      k: 'Ship the whole thing',
      v: 'Strategy decks are cheap. I deliver the working system: the model, the data, the interface, the deploy, and the docs your team can actually run.',
    },
    {
      k: 'Own the outcome',
      v: 'I am the owner, the operator and the engineer. When the automation fails at 6am on a turnover day, it is my phone that rings.',
    },
  ],

  stats: [
    { label: 'Public repositories', value: '30+', note: 'AI, games, web, tooling' },
    { label: 'Turnovers cleaned / yr', value: '550+', note: 'Dazzle Divas Cleaning' },
    { label: 'Guest satisfaction', value: '98%', note: 'across managed properties' },
    { label: 'Years operating businesses', value: '15+', note: 'owner or operator' },
  ],
} as const;

export type Profile = typeof profile;
