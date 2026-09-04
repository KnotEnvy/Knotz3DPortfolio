import { el, icons, inline } from './dom';
import { profile } from '../data/profile';
import { ventures, projects, career, careerNote, education, services, skillGroups } from '../data/content';
import { sectorById, type Block, type SectorId } from '../data/sectors';

/**
 * Render a sector's "classified" bonus blocks into the brief.
 *
 * In the 3D experience these unlock when a node breaks. The title card promises
 * "nothing is hidden behind the game", and until this existed that was not true:
 * the sharpest paragraph on the whole site — how Jay actually picks and
 * evaluates a model — was reachable only by winning a fight, and appeared
 * nowhere in the document.
 */
function bonus(id: SectorId): Node[] {
  const def = sectorById.get(id);
  if (!def) return [];
  return def.bonus.flatMap((b: Block): Node[] => {
    if (b.t === 'para') return [el('p', { class: 'brief__para', html: inline(b.text) })];
    if (b.t === 'quote') {
      return [
        el('blockquote', { class: 'brief__quote' }, [
          el('p', { html: inline(b.text) }),
          b.by ? el('cite', { text: `— ${b.by}` }) : null,
        ]),
      ];
    }
    if (b.t === 'list') {
      return [el('ul', { class: 'brief__list' }, b.items.map((i) => el('li', { html: inline(i) })))];
    }
    return [];
  });
}

export interface BriefHandlers {
  launch(): void;
}

/**
 * The written brief.
 *
 * Not a fallback. On a phone this *is* the site, and for a client reading at
 * 11pm it is probably the better one — so it is designed to the same standard as
 * the game: a sticky section nav, a real editorial hierarchy, live-link badges on
 * everything playable, and a print stylesheet so Cmd-P produces a clean résumé
 * instead of a screenshot of a website.
 *
 * It is built from exactly the same `src/data` modules as the 3D dossiers, so the
 * two physically cannot drift. Editing a project's copy updates both.
 */
export function buildBrief(handlers?: BriefHandlers): HTMLElement {
  const contact = (extraClass = '') =>
    el('div', { class: `brief__contact ${extraClass}` }, [
      el('a', { class: 'btn btn--primary', href: `mailto:${profile.email}?subject=AI%20project%20enquiry` }, [
        el('span', { html: icons.mail }),
        el('span', { text: profile.email }),
      ]),
      el('a', { class: 'btn', href: 'tel:+13863015775', text: profile.phone }),
      copyButton(),
      el('a', { class: 'btn', href: profile.github, target: '_blank', rel: 'noopener noreferrer', text: 'GitHub' }),
      el('a', { class: 'btn', href: profile.linkedin, target: '_blank', rel: 'noopener noreferrer', text: 'LinkedIn' }),
    ]);

  /* --------------------------------------------------------------- nav */

  const navLinks: [string, string][] = [
    ['#brief-profile', 'Profile'],
    ['#brief-ventures', 'Ventures'],
    ['#brief-work', 'Work'],
    ['#brief-services', 'Services'],
    ['#brief-experience', 'Experience'],
    ['#brief-skills', 'Skills'],
    ['#brief-contact', 'Contact'],
  ];

  const nav = el('nav', { class: 'bnav', 'aria-label': 'Sections' }, [
    el('div', { class: 'bnav__wrap' }, [
      el('a', { class: 'bnav__brand', href: '#brief' }, [
        el('b', { text: profile.name }),
        el('span', { text: 'SIGNAL' }),
      ]),
      el(
        'div',
        { class: 'bnav__links' },
        navLinks.map(([href, label]) => el('a', { class: 'bnav__link', href, text: label })),
      ),
      el('div', { class: 'bnav__actions' }, [
        // On a phone the brief *is* the site, and it is a twenty-three-screen
        // scroll. Getting to the contact details must never require thumbing
        // past all of it.
        el('a', { class: 'bnav__contact', href: '#brief-contact' }, [
          el('span', { html: icons.mail }),
          el('span', { text: 'Contact' }),
        ]),
        // The whole reason the game exists is that it is the strongest single
        // piece of evidence. Offer it, do not force it.
        handlers
          ? el('button', { class: 'btn btn--primary btn--sm', type: 'button', onclick: () => handlers.launch() }, [
              el('span', { html: icons.play }),
              el('span', { text: 'Launch the 3D portfolio' }),
            ])
          : null,
        el('button', {
          class: 'btn btn--sm btn--ghost bnav__print',
          type: 'button',
          text: 'Print / PDF',
          onclick: () => window.print(),
        }),
      ]),
    ]),
  ]);

  /* -------------------------------------------------------------- hero */

  const hero = el('header', { class: 'brief__hero', id: 'brief-top' }, [
    el('div', { class: 'brief__heroMain' }, [
      el('p', { class: 'brief__kicker' }, [
        el('span', { class: 'brief__kickerDot' }),
        el('span', { text: `${profile.title} · ${profile.location}` }),
      ]),
      el('h1', { class: 'brief__name', text: profile.name }),
      el('p', { class: 'brief__tag', text: profile.tagline }),
      contact(),
      el('p', { class: 'brief__heroNote' }, [
        el('span', { text: 'Everything below is also flyable. ' }),
        handlers
          ? el('button', { class: 'brief__inlineLink', type: 'button', text: 'Launch the interactive version', onclick: () => handlers.launch() })
          : el('span', { text: 'The interactive version needs WebGL.' }),
        el('span', { text: ' — same facts, considerably more explosions.' }),
      ]),
    ]),
    el(
      'div',
      { class: 'brief__heroStats' },
      profile.stats.map((s) =>
        el('div', { class: 'brief__stat' }, [
          el('b', { text: s.value }),
          el('span', { class: 'brief__statLabel', text: s.label }),
          el('em', { text: s.note }),
        ]),
      ),
    ),
  ]);

  /* ------------------------------------------------------------ profile */

  const about = section('brief-profile', 'Profile', 'Who you are dealing with', [
    ...profile.pitch.map((t) => el('p', { class: 'brief__para', text: t })),
    el(
      'div',
      { class: 'brief__values' },
      profile.values.map((v) =>
        el('div', { class: 'brief__value' }, [el('h3', { text: v.k }), el('p', { html: inline(v.v) })]),
      ),
    ),
    ...bonus('origin'),
  ]);

  /* ----------------------------------------------------------- ventures */

  const venturesSection = section('brief-ventures', 'Ventures', 'Businesses I own and run', [
    el('p', { class: 'brief__para brief__lead', text: 'Two operating companies and one technology practice. This is the part most AI consultants cannot show you.' }),
    ...ventures.map((v) =>
      el('article', { class: 'brief__venture' }, [
        el('div', { class: 'brief__ventureHead' }, [
          el('div', {}, [
            el('h3', { text: v.name }),
            el('p', { class: 'brief__meta', text: `${v.role} · ${v.period}` }),
          ]),
          v.url
            ? el('a', { class: 'btn btn--sm', href: v.url, target: '_blank', rel: 'noopener noreferrer' }, [
                el('span', { text: 'Visit' }),
                el('span', { html: icons.external }),
              ])
            : null,
        ]),
        el('p', { class: 'brief__para', text: v.summary }),
        el(
          'div',
          { class: 'brief__metrics' },
          v.metrics.map((m) => el('div', { class: 'brief__metric' }, [el('b', { text: m.value }), el('span', { text: m.label })])),
        ),
        el('ul', { class: 'brief__list' }, v.points.map((p) => el('li', { text: p }))),
      ]),
    ),
  ]);

  /* --------------------------------------------------------------- work */

  // Anything playable leads. A client who presses one link and plays a game
  // built by the person they are considering hiring has already had the pitch.
  const liveFirst = [...projects].sort((a, b) => Number(!!b.live) - Number(!!a.live));
  const liveCount = projects.filter((p) => p.live).length;

  const workSection = section('brief-work', 'Selected work', 'Thirty-odd public repositories; these are the ones worth your time', [
    ...bonus('arcade'),
    el('p', { class: 'brief__para brief__lead', text: `${spell(liveCount)} of these are running in a browser right now — no install, no account. Press the live link and judge the work directly; that is what it is there for.` }),
    el(
      'div',
      { class: 'brief__grid' },
      liveFirst.map((p) =>
        el('article', { class: p.live ? 'brief__card has-live' : 'brief__card' }, [
          el('div', { class: 'brief__cardTop' }, [
            el('h3', { text: p.name }),
            p.live ? el('span', { class: 'brief__badge', text: 'Live' }) : null,
          ]),
          p.scale ? el('span', { class: 'brief__kind', text: p.scale }) : null,
          el('p', { class: 'brief__cardHead', text: p.headline }),
          el('p', { class: 'brief__para', text: p.body }),
          el('ul', { class: 'brief__list brief__list--tight' }, p.highlights.map((h) => el('li', { text: h }))),
          el('div', { class: 'brief__chips' }, p.stack.map((t) => el('span', { class: 'brief__chip', text: t }))),
          el('div', { class: 'brief__cardLinks' }, [
            p.live
              ? el('a', { class: 'brief__live', href: p.live, target: '_blank', rel: 'noopener noreferrer' }, [
                  el('span', { html: icons.play }),
                  el('span', { text: p.kind === 'game' ? 'Play it now' : 'Open it live' }),
                ])
              : null,
            p.live2
              ? el('a', { class: 'brief__live', href: p.live2.href, target: '_blank', rel: 'noopener noreferrer' }, [
                  el('span', { html: icons.external }),
                  el('span', { text: p.live2.label }),
                ])
              : null,
            p.repo
              ? el('a', { class: 'brief__srcLink', href: p.repo, target: '_blank', rel: 'noopener noreferrer' }, [
                  el('span', { text: 'Source' }),
                  el('span', { html: icons.external }),
                ])
              : null,
          ]),
        ]),
      ),
    ),
  ]);

  /* ----------------------------------------------------------- services */

  const servicesSection = section('brief-services', 'How I can help', 'Four ways this usually starts', [
    ...bonus('forge'),
    el(
      'div',
      { class: 'brief__grid brief__grid--two' },
      services.map((s) =>
        el('article', { class: 'brief__card brief__card--service' }, [
          el('h3', { text: s.name }),
          el('p', { class: 'brief__cardHead', text: s.promise }),
          el('p', { class: 'brief__para', text: s.detail }),
          el('ul', { class: 'brief__list brief__list--tight' }, s.deliverables.map((d) => el('li', { text: d }))),
        ]),
      ),
    ),
  ]);

  /* --------------------------------------------------------- experience */

  const experience = section('brief-experience', 'Experience', 'Fifteen years of operating, most of it before the code', [
    el('p', { class: 'brief__para brief__lead', text: careerNote }),
    ...bonus('track'),
    el(
      'div',
      { class: 'brief__timeline' },
      career.map((r) =>
        el('div', { class: r.current ? 'brief__role now' : 'brief__role' }, [
          el('div', { class: 'brief__rolePeriod' }, [
            el('span', { text: r.period }),
            r.current ? el('span', { class: 'brief__now', text: 'Current' }) : null,
          ]),
          el('div', { class: 'brief__roleBody' }, [
            el('h3', { text: r.title }),
            el('p', { class: 'brief__meta', text: `${r.company} · ${r.place}` }),
            el('ul', { class: 'brief__list' }, r.points.map((p) => el('li', { text: p }))),
          ]),
        ]),
      ),
    ),
  ]);

  /* ------------------------------------------------------------- skills */

  const skills = section('brief-skills', 'Skills', 'What I actually reach for', [
    el(
      'div',
      { class: 'brief__skills' },
      skillGroups.map((g) =>
        el('div', { class: 'brief__skillGroup' }, [
          el('h3', { text: g.group }),
          el('div', { class: 'brief__chips' }, g.items.map((i) => el('span', { class: 'brief__chip', text: i }))),
        ]),
      ),
    ),
    el('div', { class: 'brief__education' }, [
      el('h3', { text: education.school }),
      el('p', { class: 'brief__meta', text: `${education.degree} · ${education.place}` }),
      el('ul', { class: 'brief__list' }, education.notes.map((n) => el('li', { text: n }))),
      el('h4', { text: 'Applied AI training' }),
      el('div', { class: 'brief__chips' }, education.training.map((t) => el('span', { class: 'brief__chip', text: t }))),
    ]),
  ]);

  /* ------------------------------------------------------------ contact */

  const cta = el('section', { class: 'brief__cta', id: 'brief-contact' }, [
    el('div', { class: 'brief__ctaInner' }, [
      el('h2', { text: 'Tell me what is slow, manual or expensive.' }),
      el('p', {
        text: 'If AI is the wrong answer for it, I will say so — I have a payroll to make too. If it is the right one, I will show you the shortest path to it and what the honest payback looks like.',
      }),
      contact('brief__contact--lg'),
    ]),
  ]);

  return el('main', { class: 'brief', id: 'brief' }, [
    nav,
    el('div', { class: 'brief__wrap' }, [
      hero,
      about,
      venturesSection,
      workSection,
      servicesSection,
      experience,
      skills,
      cta,
      el('footer', { class: 'brief__foot' }, [
        el('p', { text: `${profile.name} · ${profile.location} · ${profile.email} · ${profile.phone}` }),
        el('p', { class: 'brief__footNote', text: 'Built with Three.js, TypeScript and Vite. No framework, no page builder, no template.' }),
      ]),
    ]),
  ]);
}

/**
 * Copy the address to the clipboard.
 *
 * A `mailto:` link is a dead click for anyone living in webmail, which is most
 * of the business owners this page is written for.
 */
function copyButton(): HTMLElement {
  const btn = el('button', { class: 'btn btn--ghost', type: 'button' }, [
    el('span', { html: icons.copy }),
    el('span', { text: 'Copy address' }),
  ]) as HTMLButtonElement;
  const label = btn.lastElementChild as HTMLElement;
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      label.textContent = 'Copied';
    } catch {
      // Clipboard access can be refused outright; say so rather than lying.
      label.textContent = profile.email;
    }
    btn.classList.add('is-copied');
    window.setTimeout(() => {
      label.textContent = 'Copy address';
      btn.classList.remove('is-copied');
    }, 2200);
  });
  return btn;
}

/** Small numbers read better as words in body copy. */
function spell(n: number): string {
  return ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'][n] ?? String(n);
}

function section(id: string, title: string, kicker: string, children: Array<Node | null>): HTMLElement {
  return el('section', { class: 'brief__section', id }, [
    el('header', { class: 'brief__sectionHead' }, [
      el('h2', { text: title }),
      el('p', { class: 'brief__kicker2', text: kicker }),
    ]),
    ...children,
  ]);
}
