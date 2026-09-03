import { el, escapeHtml } from './dom';
import { bus } from '../core/Events';
import { sectors, type SectorId } from '../data/sectors';
import { profile } from '../data/profile';
import { projects } from '../data/content';
import type { GameState } from '../game/GameState';

interface Command {
  name: string;
  args?: string;
  help: string;
  run(args: string[]): void;
}

/**
 * An in-world console. It is a real command parser with Levenshtein-based
 * suggestions — partly a navigation shortcut, mostly a wink at the audience.
 */
export class Terminal {
  readonly root: HTMLElement;
  private log: HTMLElement;
  private input: HTMLInputElement;
  private history: string[] = [];
  private historyIndex = -1;
  private commands = new Map<string, Command>();

  constructor(
    parent: HTMLElement,
    private state: GameState,
    private hooks: { warp(id: SectorId): void; brief(on: boolean): void; reset(): void },
  ) {
    this.log = el('div', { class: 'terminal__log scroll' });
    this.input = el('input', {
      class: 'terminal__input',
      type: 'text',
      autocomplete: 'off',
      autocapitalize: 'off',
      spellcheck: 'false',
      'aria-label': 'Terminal command',
      placeholder: "type 'help' and press enter",
    });

    const form = el('form', { class: 'terminal__form', onsubmit: (e: Event) => this.submit(e) }, [
      el('span', { class: 'terminal__prompt', text: 'signal@knot:~$' }),
      this.input,
    ]);

    this.root = el('div', { class: 'terminal', role: 'dialog', 'aria-label': 'Terminal', 'aria-hidden': 'true' }, [
      el('div', { class: 'terminal__bar' }, [
        el('span', { class: 'terminal__dot' }),
        el('span', { text: 'signal terminal — v2.0' }),
      ]),
      this.log,
      form,
    ]);

    parent.append(this.root);
    this.register();

    this.input.addEventListener('keydown', (e) => this.onKey(e));

    this.print('SIGNAL terminal ready.', 'ok');
    this.print("Type 'help' for commands. Press ~ or Esc to close.");
  }

  private register(): void {
    const add = (c: Command) => this.commands.set(c.name, c);

    add({
      name: 'help',
      help: 'list every command',
      run: () => {
        this.print('Available commands:', 'ok');
        for (const c of this.commands.values()) {
          this.print(`  ${(c.name + (c.args ? ' ' + c.args : '')).padEnd(20)} ${c.help}`);
        }
      },
    });

    add({
      name: 'whoami',
      help: 'who you are talking to',
      run: () => {
        this.print(`${profile.name} — ${profile.title}`, 'ok');
        this.print(profile.location);
        this.print(profile.tagline);
      },
    });

    add({
      name: 'sectors',
      help: 'list every sector and its status',
      run: () => {
        for (const s of sectors) {
          const have = this.state.shardsIn(s.id).length;
          const status = have >= s.shards ? 'DECRYPTED' : this.state.hasVisited(s.id) ? 'VISITED  ' : 'UNKNOWN  ';
          this.print(`  ${s.code}  ${s.name.padEnd(14)} ${status}  ${have}/${s.shards} shards`);
        }
      },
    });

    add({
      name: 'warp',
      args: '<sector>',
      help: 'jump straight to a sector',
      run: (args) => {
        const q = (args[0] ?? '').toLowerCase();
        if (!q) {
          this.print(`usage: warp <${sectors.map((s) => s.id).join('|')}>`, 'err');
          return;
        }
        const target =
          sectors.find((s) => s.id === q) ??
          sectors.find((s) => s.name.toLowerCase().replace(/\s+/g, '') === q.replace(/\s+/g, '')) ??
          sectors.find((s) => s.id.startsWith(q));
        if (!target) {
          this.print(`no sector matching "${q}". try: ${sectors.map((s) => s.id).join(', ')}`, 'err');
          return;
        }
        this.print(`warping to ${target.name}…`, 'ok');
        this.state.unlock('warp');
        this.hooks.warp(target.id);
        this.toggle(false);
      },
    });

    add({
      name: 'projects',
      help: 'list featured builds',
      run: () => {
        for (const p of projects) {
          this.print(`  ${p.name}`, 'ok');
          this.print(`    ${p.headline}`);
          if (p.repo) this.printLink('    ', p.repo);
        }
      },
    });

    add({
      name: 'stack',
      help: 'the tools I actually use',
      run: () => {
        this.print('AI       LLM apps, RAG, agents, evals, OpenAI / Anthropic / Gemini');
        this.print('Web      TypeScript, React, Next.js, Node, Supabase, Prisma, Tailwind');
        this.print('3D       Three.js, WebGL, GLSL, Rapier, PixiJS, Phaser');
        this.print('Data     PostgreSQL, SQLite/FTS5, vector search, PostHog');
        this.print('Ops      Docker, Vercel, Playwright, Vitest, Jest');
      },
    });

    add({
      name: 'contact',
      help: 'how to reach me',
      run: () => {
        this.print(`email    ${profile.email}`, 'ok');
        this.print(`phone    ${profile.phone}`, 'ok');
        this.printLink('github   ', profile.github);
        this.printLink('cleaning ', profile.siteDazzle);
      },
    });

    add({
      name: 'hire',
      help: 'the short version of the pitch',
      run: () => {
        this.print('> Most AI consultants have never had to make payroll.', 'ok');
        this.print('  I own two operating businesses and write the software myself.');
        this.print('  Automation, agents, internal tools, and sites that close.');
        this.print(`  ${profile.email} — say what is slow and I will tell you if it is fixable.`);
      },
    });

    add({
      name: 'brief',
      help: 'switch to the written brief',
      run: () => {
        this.hooks.brief(true);
        this.toggle(false);
      },
    });

    add({
      name: 'status',
      help: 'your progress on this run',
      run: () => {
        this.print(`rank     ${this.state.rank}`, 'ok');
        this.print(`xp       ${this.state.xp}`);
        this.print(`shards   ${this.state.collected}/${this.state.totalShards}`);
        this.print(`sectors  ${this.state.data.visited.length}/${sectors.length} visited`);
        this.print(`awards   ${this.state.data.achievements.length} unlocked`);
      },
    });

    add({
      name: 'reset',
      help: 'wipe progress and start over',
      run: () => {
        this.hooks.reset();
        this.print('progress wiped. fly safe.', 'ok');
      },
    });

    add({
      name: 'clear',
      help: 'clear the log',
      run: () => this.log.replaceChildren(),
    });

    add({
      name: 'sudo',
      help: 'do not',
      run: () => this.print('Nice try. Everything here is already yours to read.', 'err'),
    });
  }

  private print(text: string, cls = ''): void {
    this.log.append(el('p', { class: cls, text }));
    this.log.scrollTop = this.log.scrollHeight;
  }

  private printLink(prefix: string, href: string): void {
    const p = el('p', {
      html: `${escapeHtml(prefix)}<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(href)}</a>`,
    });
    this.log.append(p);
    this.log.scrollTop = this.log.scrollHeight;
  }

  private submit(e: Event): void {
    e.preventDefault();
    const raw = this.input.value.trim();
    this.input.value = '';
    if (!raw) return;

    this.log.append(el('p', { class: 'echo', text: raw }));
    this.history.unshift(raw);
    this.historyIndex = -1;

    const [name, ...args] = raw.split(/\s+/);
    const cmd = this.commands.get(name.toLowerCase());
    if (cmd) {
      cmd.run(args);
    } else {
      const guess = this.closest(name.toLowerCase());
      this.print(
        guess ? `command not found: ${name} — did you mean "${guess}"?` : `command not found: ${name}. try 'help'.`,
        'err',
      );
    }
    this.log.scrollTop = this.log.scrollHeight;
  }

  /** Cheap edit-distance suggestion so a typo still lands somewhere useful. */
  private closest(input: string): string | null {
    let best: string | null = null;
    let bestScore = Infinity;
    for (const name of this.commands.keys()) {
      const d = distance(input, name);
      if (d < bestScore) {
        bestScore = d;
        best = name;
      }
    }
    return bestScore <= Math.max(2, Math.floor(input.length / 2)) ? best : null;
  }

  private onKey(e: KeyboardEvent): void {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.history.length === 0) return;
      this.historyIndex = Math.min(this.historyIndex + 1, this.history.length - 1);
      this.input.value = this.history[this.historyIndex];
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.historyIndex = Math.max(this.historyIndex - 1, -1);
      this.input.value = this.historyIndex === -1 ? '' : this.history[this.historyIndex];
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const partial = this.input.value.trim().toLowerCase();
      const match = [...this.commands.keys()].find((k) => k.startsWith(partial));
      if (match) this.input.value = match + ' ';
    }
  }

  get isOpen(): boolean {
    return this.root.classList.contains('on');
  }

  toggle(force?: boolean): void {
    const next = force ?? !this.isOpen;
    this.root.classList.toggle('on', next);
    this.root.setAttribute('aria-hidden', next ? 'false' : 'true');
    if (next) {
      this.state.unlock('terminal');
      window.setTimeout(() => this.input.focus(), 60);
    } else {
      this.input.blur();
    }
    bus.emit('terminal:toggle', { on: next });
  }
}

function distance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = curr;
  }
  return prev[n];
}
