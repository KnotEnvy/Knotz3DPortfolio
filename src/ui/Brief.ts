import { el, inline } from './dom';
import { profile } from '../data/profile';
import { ventures, projects, career, education, services, skillGroups } from '../data/content';

/**
 * The escape hatch. Everything the 3D world says, as a fast, semantic,
 * keyboard-navigable document — for recruiters in a hurry, screen readers,
 * low-power devices and anyone who told their browser they prefer less motion.
 */
export function buildBrief(): HTMLElement {
  const contact = el('div', { class: 'brief__contact' }, [
    el('a', { class: 'btn btn--primary btn--sm', href: `mailto:${profile.email}`, text: profile.email }),
    el('a', { class: 'btn btn--sm', href: 'tel:+13863015775', text: profile.phone }),
    el('a', { class: 'btn btn--sm', href: profile.github, target: '_blank', rel: 'noopener noreferrer', text: 'GitHub' }),
    el('a', {
      class: 'btn btn--sm',
      href: profile.linkedin,
      target: '_blank',
      rel: 'noopener noreferrer',
      text: 'LinkedIn',
    }),
    el('a', {
      class: 'btn btn--sm',
      href: profile.siteDazzle,
      target: '_blank',
      rel: 'noopener noreferrer',
      text: 'Dazzle Divas',
    }),
  ]);

  const hero = el('header', { class: 'brief__hero' }, [
    el('h1', { class: 'brief__name', text: profile.name }),
    el('p', { class: 'brief__role', text: `${profile.title} · ${profile.location}` }),
    el('p', { class: 'brief__tag', text: profile.tagline }),
    contact,
  ]);

  const stats = el(
    'div',
    { class: 'brief__stats' },
    profile.stats.map((s) => el('div', { class: 'brief__stat' }, [el('b', { text: s.value }), el('span', { text: s.label })])),
  );

  const about = section('Profile', [
    stats,
    ...profile.pitch.map((t) => el('p', { text: t })),
    el(
      'ul',
      {},
      profile.values.map((v) => el('li', { html: `<strong>${v.k}</strong> — ${inline(v.v)}` })),
    ),
  ]);

  const venturesSection = section(
    'Ventures',
    ventures.map((v) =>
      el('article', { class: 'brief__card', style: 'margin-bottom:1rem' }, [
        el('h3', { text: v.name }),
        el('p', { class: 'sub', text: `${v.role} · ${v.period}` }),
        el('p', { text: v.summary }),
        el(
          'ul',
          {},
          v.points.map((p) => el('li', { text: p })),
        ),
        v.url
          ? el('a', { class: 'btn btn--sm', href: v.url, target: '_blank', rel: 'noopener noreferrer', text: 'Visit site' })
          : null,
      ]),
    ),
  );

  const workSection = section('Selected work', [
    el(
      'div',
      { class: 'brief__grid' },
      projects.map((p) =>
        el('article', { class: 'brief__card' }, [
          el('h3', { text: p.name }),
          el('p', { class: 'sub', text: p.headline }),
          el('p', { text: p.body }),
          el(
            'ul',
            {},
            p.highlights.map((h) => el('li', { text: h })),
          ),
          el(
            'div',
            { class: 'brief__chips' },
            p.stack.map((t) => el('span', { class: 'brief__chip', text: t })),
          ),
          el('div', { class: 'brief__card-links' }, [
            p.repo
              ? el('a', { class: 'btn btn--sm', href: p.repo, target: '_blank', rel: 'noopener noreferrer', text: 'Source' })
              : null,
            p.live
              ? el('a', { class: 'btn btn--sm', href: p.live, target: '_blank', rel: 'noopener noreferrer', text: 'Live' })
              : null,
          ]),
        ]),
      ),
    ),
  ]);

  const servicesSection = section('How I can help', [
    el(
      'div',
      { class: 'brief__grid' },
      services.map((s) =>
        el('article', { class: 'brief__card' }, [
          el('h3', { text: s.name }),
          el('p', { class: 'sub', text: s.promise }),
          el('p', { text: s.detail }),
          el(
            'ul',
            {},
            s.deliverables.map((d) => el('li', { text: d })),
          ),
        ]),
      ),
    ),
  ]);

  const experience = section(
    'Experience',
    career.map((r) =>
      el('div', { class: 'brief__role-entry' }, [
        el('div', { class: 'brief__period', text: r.period }),
        el('div', {}, [
          el('h3', { text: r.title }),
          el('p', { class: 'brief__company', text: `${r.company} · ${r.place}` }),
          el(
            'ul',
            {},
            r.points.map((p) => el('li', { text: p })),
          ),
        ]),
      ]),
    ),
  );

  const skills = section(
    'Skills',
    skillGroups.map((g) =>
      el('div', { style: 'margin-bottom:1.4rem' }, [
        el('h3', { text: g.group }),
        el('p', { style: 'margin-top:.5rem', text: g.items.join(' · ') }),
      ]),
    ),
  );

  const educationSection = section('Education & training', [
    el('h3', { text: education.school }),
    el('p', { class: 'brief__company', text: `${education.degree} · ${education.place}` }),
    el(
      'ul',
      {},
      education.notes.map((n) => el('li', { text: n })),
    ),
    el('h3', { style: 'margin-top:1.4rem', text: 'Applied AI training' }),
    el(
      'ul',
      {},
      education.training.map((t) => el('li', { text: t })),
    ),
  ]);

  const cta = section('Start a conversation', [
    el('p', {
      text: 'Tell me what part of your business is slow, manual or expensive. If AI is the wrong answer I will say so — and if it is the right one, I will show you the shortest path to it.',
    }),
    contact.cloneNode(true) as HTMLElement,
  ]);

  return el('main', { class: 'brief', id: 'brief' }, [
    el('div', { class: 'brief__wrap' }, [
      hero,
      about,
      venturesSection,
      workSection,
      servicesSection,
      experience,
      skills,
      educationSection,
      cta,
      el('p', {
        class: 'brief__foot',
        text: `${profile.name} · ${profile.location} · built with Three.js, TypeScript and no framework`,
      }),
    ]),
  ]);
}

function section(title: string, children: Array<Node | null>): HTMLElement {
  return el('section', {}, [el('h2', { text: title }), ...children]);
}
