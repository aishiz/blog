# AI Agents Landscape Article Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a new blog article `src/content/blog/ai-agents-landscape.mdx` (slug `ai-agents-landscape`, category «тулы») mapping the 2026 AI-agent landscape across 4 categories (coding agents, OpenClaw's ecosystem of personal assistants, AI companions, an experimental self-modifying agent) with 7 new interactive React components, all data sourced from a fresh WebFetch/WebSearch pass against primary sources (GitHub API, official pricing pages, tbench.ai).

**Architecture:** Seven self-contained `client:visible` React islands in `src/components/article/`, each following the exact structural conventions of an existing sibling in the same directory (named per-task below) — inline `style` objects typed `React.CSSProperties`, CSS custom properties for theming, Russian UI copy. No shared state between components, no new npm dependencies.

**Tech Stack:** Astro 5 + React 19 (existing site stack). Closest genre precedent: `src/content/blog/llm_inference_engines_complete_guide.mdx` and its components (`EngineCompare.tsx`, `EngineDecisionTree.tsx`, `PlatformMatrix.tsx`, `ThroughputCalculator.tsx`, `InferenceBenchmark.tsx`) — this article is a tools-landscape guide in the same genre, not an algorithm deep-dive.

## Global Constraints

- No new npm dependencies — all 7 components are pure React/TSX with inline styles, following existing `src/components/article/` conventions exactly.
- Category: «тулы». File: `src/content/blog/ai-agents-landscape.mdx`.
- All quantitative data in this plan (star counts, prices, dates, benchmark scores) comes from a WebFetch/WebSearch pass run directly against primary sources on 2026-07-28 (GitHub API `api.github.com/repos/...`, `tbench.ai/leaderboard/terminal-bench/2.1`, `cursor.com/pricing`, `github.com/features/copilot/plans`, `platform.claude.com/docs/en/about-claude/pricing`, `ai.google.dev/gemini-api/docs/pricing`) — these are the final numbers to hardcode, not placeholders to re-derive. Star counts WILL be stale by publish time (this space moves fast) — the article prose must say "на момент написания" (at time of writing) next to star counts, not present them as eternally current.
- **Important accuracy nuance, must appear in the article:** Anthropic cut OpenClaw's OAuth access to Claude subscription credits on April 4, 2026 — but OpenClaw's own docs (`docs.openclaw.ai/concepts/oauth`) now say this was later relaxed/reinstated ("Anthropic staff told us OpenClaw-style Claude CLI usage is allowed again"), with no confirmed exact reversal date. Do NOT present the ban as still-current without this caveat — say it happened, then note it was walked back, without inventing a precise reversal date.
- **License nuance:** OpenClaw's GitHub-detected license is "Other (NOASSERTION)", not a confirmed MIT license despite marketing copy calling it open source — say "открытый код" (open source) in prose, do not assert "MIT" for OpenClaw specifically. ZeroClaw's GitHub-detected license is Apache-2.0 only (its README claims dual MIT/Apache-2.0, unconfirmed) — hedge with "судя по README" if stating dual license.
- Images and heroImage are explicitly OUT of this plan's scope (deferred to a manual follow-up after the plan completes, per established pattern from prior articles this session).
- No test framework in this repo (`CLAUDE.md`: "No test suite, no linter configured"). Verification per task = `npm run build` + browser check via chrome-devtools-mcp, matching how prior articles in this repo were verified. Component tasks can't get a *meaningful* build/type check until the article (Task 8) imports them — same situation as the FlashAttention plan; each component task's "verification" step says so explicitly rather than faking a check.

---

## File Structure

- **Create** `src/components/article/AgentCompare.tsx` — 8 coding agents, filterable by category, click for details. Modeled on `EngineCompare.tsx`.
- **Create** `src/components/article/BenchmarkChart.tsx` — Terminal-Bench 2.1 bar chart, 3 data points. Modeled on `InferenceBenchmark.tsx` (single scenario, no tabs needed given only 3 bars).
- **Create** `src/components/article/OpenClawFamilyTree.tsx` — OpenClaw + 5 ecosystem projects, click for details. New layout (no direct precedent in this repo), styled consistently with siblings.
- **Create** `src/components/article/ChannelMatrix.tsx` — 6×6 support grid (tool × channel), yes/no/unclear. Modeled on `PlatformMatrix.tsx`.
- **Create** `src/components/article/AgentDecisionQuiz.tsx` — branching Q&A → recommendation across all 15 tools. Modeled on `EngineDecisionTree.tsx`.
- **Create** `src/components/article/CostCalculator.tsx` — tool + usage-intensity selectors → monthly cost lookup. Modeled on `ThroughputCalculator.tsx`'s selector-driven-result pattern, but a lookup table instead of a formula (these are tiered subscription plans, not a continuous function — a fabricated formula would be less honest than a real tier lookup).
- **Create** `src/components/article/AgentTimeline2026.tsx` — 11 dated events, chronological. New layout.
- **Create** `src/content/blog/ai-agents-landscape.mdx` — the article itself, importing all 7 components plus existing `Callout`/`QuantCard`.

---

### Task 1: `AgentCompare.tsx`

**Files:**
- Create: `src/components/article/AgentCompare.tsx`

**Interfaces:**
- Produces: default export React component, no props. Used in article as `<AgentCompare client:visible />`.

- [ ] **Step 1: Write the component**

```tsx
import { useState } from 'react';

type Category = 'cli' | 'ide' | 'cloud';

type Agent = {
	name: string;
	category: Category;
	maker: string;
	model: string;
	license: string;
	stars: string;
	price: string;
	diff: string;
	color: string;
};

const categoryLabels: Record<Category, string> = { cli: 'CLI', ide: 'IDE', cloud: 'Cloud' };

const agents: Agent[] = [
	{ name: 'Claude Code', category: 'cli', maker: 'Anthropic', model: 'Claude Sonnet 5 (по умолчанию)', license: 'проприетарный', stars: '—', price: 'включён в Pro/Max/Team + API', diff: 'вложенные суб-агенты (3 уровня), маркетплейс тулов, Auto Mode (preview)', color: '#ff6b2b' },
	{ name: 'Codex', category: 'cli', maker: 'OpenAI', model: 'GPT-5.5', license: 'Apache-2.0', stars: '102 019', price: 'ChatGPT Plus $20 / Pro 5x $100 / Pro 20x $200 или API', diff: '#2 на Terminal-Bench 2.1 (83.1%), sandboxed execution + approval workflow', color: '#10a37f' },
	{ name: 'OpenCode', category: 'cli', maker: 'Anomaly (anomalyco/opencode)', model: 'любая (75+ провайдеров)', license: 'MIT', stars: '190 380', price: 'бесплатный, платишь за свой API', diff: 'provider-agnostic, режимы build/plan', color: '#3b82f6' },
	{ name: 'Hermes Agent', category: 'cli', maker: 'Nous Research', model: 'любая (Nous Portal/OpenRouter/OpenAI)', license: 'MIT', stars: '221 624', price: 'бесплатный, self-hosted', diff: '~78 скиллов (TDD/debugging/review), умеет делегировать в Claude Code/Codex — и это тот же продукт, что в разделе про ассистентов', color: '#8b5cf6' },
	{ name: 'Cursor', category: 'ide', maker: 'Anysphere', model: 'на выбор', license: 'проприетарный', stars: '—', price: 'Hobby бесплатно / Pro $20 / Teams $40', diff: 'агент прямо в IDE, не нужно переключаться в терминал', color: '#00d1b2' },
	{ name: 'Aider', category: 'cli', maker: 'Aider-AI', model: 'любая (свой API-ключ)', license: 'Apache-2.0', stars: '47 750', price: 'бесплатный, платишь за свой API', diff: 'git-native с самого начала, один из старейших в жанре', color: '#f59e0b' },
	{ name: 'Devin', category: 'cloud', maker: 'Cognition', model: 'своя', license: 'проприетарный', stars: '—', price: 'подписка (девин.ai)', diff: 'полностью автономный облачный агент, Windsurf в 2026 поглощён как Devin Desktop', color: '#ec4899' },
	{ name: 'Gemini CLI', category: 'cli', maker: 'Google', model: 'Gemini 3.1 Pro', license: 'Apache-2.0', stars: '—', price: 'бесплатный тир закрыт 18 июня 2026, сейчас Antigravity CLI (free + Pro $20)', diff: '65.8% на Terminal-Bench 2.1', color: '#4285f4' },
];

const css = {
	wrap: {
		margin: '1.75em 0',
		padding: '1.5rem',
		borderRadius: '12px',
		border: '1px solid var(--border)',
		background: 'var(--bg-card)',
		overflowX: 'auto' as const,
	} as React.CSSProperties,
	title: {
		fontSize: '0.85rem',
		fontWeight: 700,
		color: 'var(--accent-light)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.04em',
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	desc: {
		fontSize: '0.88rem',
		color: 'var(--text-muted)',
		marginBottom: '1.1rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	filterRow: {
		display: 'flex',
		gap: '0.4rem',
		marginBottom: '1.1rem',
		flexWrap: 'wrap' as const,
	} as React.CSSProperties,
	filterBtn: (active: boolean) => ({
		padding: '0.4rem 0.9rem',
		borderRadius: '100px',
		border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
		background: active ? 'var(--accent-glow)' : 'var(--bg-secondary)',
		color: active ? 'var(--accent-light)' : 'var(--text-muted)',
		fontSize: '0.8rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
	} as React.CSSProperties),
	tabs: {
		display: 'flex',
		gap: '0.4rem',
		flexWrap: 'wrap' as const,
		marginBottom: '1.25rem',
	} as React.CSSProperties,
	tab: (active: boolean, color: string) => ({
		padding: '0.45rem 0.95rem',
		borderRadius: '100px',
		border: `1px solid ${active ? color : 'var(--border)'}`,
		background: active ? `${color}18` : 'var(--bg-secondary)',
		color: active ? color : 'var(--text-muted)',
		fontSize: '0.82rem',
		fontWeight: 700,
		cursor: 'pointer',
		fontFamily: 'inherit',
	} as React.CSSProperties),
	header: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		marginBottom: '1rem',
	} as React.CSSProperties,
	agentName: (color: string) => ({
		fontSize: '1.4rem',
		fontWeight: 900,
		color,
	} as React.CSSProperties),
	card: { display: 'grid', gap: '0.6rem' } as React.CSSProperties,
	row: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: '0.75rem',
		padding: '0.7rem 1rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
	} as React.CSSProperties,
	rowLabel: {
		width: '140px',
		flexShrink: 0,
		fontSize: '0.8rem',
		fontWeight: 600,
		color: 'var(--text-muted)',
	} as React.CSSProperties,
	rowValue: {
		fontSize: '0.86rem',
		fontWeight: 600,
		color: 'var(--text)',
		lineHeight: 1.5,
	} as React.CSSProperties,
};

const fields: { key: keyof Agent; label: string }[] = [
	{ key: 'maker', label: 'Разработчик' },
	{ key: 'model', label: 'Модель' },
	{ key: 'license', label: 'Лицензия' },
	{ key: 'stars', label: 'GitHub Stars' },
	{ key: 'price', label: 'Цена' },
	{ key: 'diff', label: 'Чем отличается' },
];

export default function AgentCompare() {
	const [filter, setFilter] = useState<Category | null>(null);
	const filtered = filter ? agents.filter((a) => a.category === filter) : agents;
	const [selected, setSelected] = useState(0);
	const list = filtered.length > 0 ? filtered : agents;
	const agent = list[Math.min(selected, list.length - 1)];

	return (
		<div style={css.wrap}>
			<div style={css.title}>⚔️ Сравнение coding-агентов</div>
			<div style={css.desc}>
				Фильтруй по подходу (CLI / IDE / Cloud), выбирай инструмент — увидишь его характеристики. Звёзды и цены — на момент написания статьи, в этой нише они меняются быстро.
			</div>

			<div style={css.filterRow}>
				<button style={css.filterBtn(!filter)} onClick={() => { setFilter(null); setSelected(0); }}>Все</button>
				{(['cli', 'ide', 'cloud'] as Category[]).map((c) => (
					<button key={c} style={css.filterBtn(filter === c)} onClick={() => { setFilter(c); setSelected(0); }}>{categoryLabels[c]}</button>
				))}
			</div>

			<div style={css.tabs}>
				{list.map((a, i) => (
					<button key={a.name} style={css.tab(i === selected, a.color)} onClick={() => setSelected(i)}>{a.name}</button>
				))}
			</div>

			<div style={css.header}>
				<span style={css.agentName(agent.color)}>{agent.name}</span>
			</div>

			<div style={css.card}>
				{fields.map((f) => (
					<div key={f.key} style={css.row}>
						<span style={css.rowLabel}>{f.label}</span>
						<span style={css.rowValue}>{agent[f.key]}</span>
					</div>
				))}
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Note on verification**

Nothing imports this component yet (it's only wired into the article in Task 8). Task 9 ("Build and browser verification") is where this component's compile and visual correctness are actually verified.

- [ ] **Step 3: Commit**

```bash
git add src/components/article/AgentCompare.tsx
git commit -m "Add AgentCompare component for AI agents landscape article"
```

---

### Task 2: `BenchmarkChart.tsx`

**Files:**
- Create: `src/components/article/BenchmarkChart.tsx`

**Interfaces:**
- Produces: default export React component, no props. Used in article as `<BenchmarkChart client:visible />`.
- Data is from the primary Terminal-Bench 2.1 leaderboard (`tbench.ai/leaderboard/terminal-bench/2.1`), fetched directly 2026-07-28 — these are the confirmed scores, not to be changed without a reason.

- [ ] **Step 1: Write the component**

```tsx
type Entry = {
	label: string;
	score: number;
	ci: string;
	date: string;
	color: string;
};

const entries: Entry[] = [
	{ label: 'Codex + GPT-5.5', score: 83.1, ci: '±1.1%', date: '1 мая 2026', color: '#10a37f' },
	{ label: 'Claude Code + Opus 4.8', score: 78.9, ci: '±1.3%', date: '9 июля 2026', color: '#ff6b2b' },
	{ label: 'Gemini CLI + Gemini 3.1 Pro', score: 65.8, ci: '±1.7%', date: '5 мая 2026', color: '#4285f4' },
];

const maxScore = Math.max(...entries.map((e) => e.score));

const css = {
	wrap: {
		margin: '1.75em 0',
		padding: '1.5rem',
		borderRadius: '12px',
		border: '1px solid var(--border)',
		background: 'var(--bg-card)',
	} as React.CSSProperties,
	title: {
		fontSize: '0.85rem',
		fontWeight: 700,
		color: 'var(--accent-light)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.04em',
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	desc: {
		fontSize: '0.88rem',
		color: 'var(--text-muted)',
		marginBottom: '1.25rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	barRow: { marginBottom: '1rem' } as React.CSSProperties,
	barLabel: {
		display: 'flex',
		justifyContent: 'space-between',
		fontSize: '0.85rem',
		color: 'var(--text-secondary)',
		marginBottom: '0.35rem',
	} as React.CSSProperties,
	barTrack: {
		height: '14px',
		borderRadius: '100px',
		background: 'var(--bg-secondary)',
		overflow: 'hidden',
		border: '1px solid var(--border)',
	} as React.CSSProperties,
	barFill: (pct: number, color: string) => ({
		height: '100%',
		width: `${pct}%`,
		background: color,
		borderRadius: '100px',
		transition: 'width 0.3s ease',
	} as React.CSSProperties),
	meta: {
		fontSize: '0.72rem',
		color: 'var(--text-muted)',
		marginTop: '0.25rem',
	} as React.CSSProperties,
	source: {
		marginTop: '1.1rem',
		fontSize: '0.82rem',
		color: 'var(--text-muted)',
		lineHeight: 1.6,
	} as React.CSSProperties,
};

export default function BenchmarkChart() {
	return (
		<div style={css.wrap}>
			<div style={css.title}>📊 Terminal-Bench 2.1</div>
			<div style={css.desc}>
				89 задач, официальный лидерборд. Записи датированы по-разному (модели добавлялись не одновременно) — это не синхронный снимок одного дня.
			</div>

			{entries.map((e) => (
				<div key={e.label} style={css.barRow}>
					<div style={css.barLabel}>
						<span>{e.label}</span>
						<span style={{ fontWeight: 700, color: 'var(--text)' }}>{e.score}% {e.ci}</span>
					</div>
					<div style={css.barTrack}>
						<div style={css.barFill((e.score / maxScore) * 100, e.color)} />
					</div>
					<div style={css.meta}>запись от {e.date}</div>
				</div>
			))}

			<div style={css.source}>
				Источник: <a href="https://www.tbench.ai/leaderboard/terminal-bench/2.1" target="_blank" rel="noopener">tbench.ai/leaderboard/terminal-bench/2.1</a>. Есть заявка на более высокий результат (89.5%) на другом харнессе — в эту тройку она не входит, отдельно не проверялась.
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Note on verification**

Same as Task 1 — not wired into the article yet. Task 9 is where this component's compile and visual correctness are verified.

- [ ] **Step 3: Commit**

```bash
git add src/components/article/BenchmarkChart.tsx
git commit -m "Add BenchmarkChart component for AI agents landscape article"
```

---

### Task 3: `OpenClawFamilyTree.tsx`

**Files:**
- Create: `src/components/article/OpenClawFamilyTree.tsx`

**Interfaces:**
- Produces: default export React component, no props. Used in article as `<OpenClawFamilyTree client:visible />`.

- [ ] **Step 1: Write the component**

```tsx
import { useState } from 'react';

type Node = {
	name: string;
	stars: string;
	lang: string;
	license: string;
	diff: string;
	color: string;
};

const root: Node = {
	name: 'OpenClaw',
	stars: '384 388',
	lang: 'TypeScript',
	license: 'открытый код (GitHub помечает как "Other", не классический MIT)',
	diff: 'корень — родился 24 ноября 2025, сейчас под некоммерческим OpenClaw Foundation',
	color: '#ff6b2b',
};

const children: Node[] = [
	{ name: 'Hermes Agent', stars: '221 624', lang: 'Python', license: 'MIT', diff: 'не форк кода, а отдельный продукт Nous Research в той же нише — с придачей ~78 coding-скиллов', color: '#8b5cf6' },
	{ name: 'Nanobot', stars: '46 322', lang: 'Python', license: 'MIT', diff: 'README прямо называет себя «знакомой точкой входа, если пришёл из OpenClaw» — минималистичное ядро вместо полного фреймворка', color: '#10b981' },
	{ name: 'OpenHuman', stars: '35 546', lang: 'Rust', license: 'GPL-3.0', diff: 'десктоп-приложение, а не headless gateway — строит knowledge-graph из почты и документов, а не просто отвечает в чатах', color: '#06b6d4' },
	{ name: 'ZeroClaw', stars: '32 418', lang: 'Rust', license: 'MIT/Apache-2.0 (по README; GitHub определяет только Apache-2.0)', diff: 'один бинарник ~3.4МБ, работает на Raspberry Pi — и, в отличие от остальных, вообще не упоминает OpenClaw в README', color: '#f59e0b' },
	{ name: 'QwenPaw', stars: '29 408', lang: 'Python', license: 'Apache-2.0', diff: 'на стеке Alibaba Qwen/AgentScope — китайские каналы (DingTalk, WeChat, QQ) вместо западных', color: '#ef4444' },
];

const css = {
	wrap: {
		margin: '1.75em 0',
		padding: '1.5rem',
		borderRadius: '12px',
		border: '1px solid var(--border)',
		background: 'var(--bg-card)',
	} as React.CSSProperties,
	title: {
		fontSize: '0.85rem',
		fontWeight: 700,
		color: 'var(--accent-light)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.04em',
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	desc: {
		fontSize: '0.88rem',
		color: 'var(--text-muted)',
		marginBottom: '1.25rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	rootBox: (color: string) => ({
		padding: '1rem 1.25rem',
		borderRadius: '10px',
		border: `2px solid ${color}`,
		background: `${color}12`,
		marginBottom: '1rem',
		textAlign: 'center' as const,
	} as React.CSSProperties),
	rootName: (color: string) => ({
		fontSize: '1.3rem',
		fontWeight: 900,
		color,
	} as React.CSSProperties),
	branchGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
		gap: '0.6rem',
	} as React.CSSProperties,
	branch: (color: string, active: boolean) => ({
		padding: '0.85rem 1rem',
		borderRadius: '10px',
		border: `1px solid ${active ? color : 'var(--border)'}`,
		background: active ? `${color}14` : 'var(--bg-secondary)',
		cursor: 'pointer',
		textAlign: 'left' as const,
		transition: 'all 0.15s ease',
	} as React.CSSProperties),
	branchName: (color: string) => ({
		fontSize: '0.95rem',
		fontWeight: 800,
		color,
		marginBottom: '0.2rem',
	} as React.CSSProperties),
	branchStars: {
		fontSize: '0.72rem',
		color: 'var(--text-muted)',
	} as React.CSSProperties,
	detail: {
		marginTop: '1rem',
		padding: '0.9rem 1rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		fontSize: '0.86rem',
		color: 'var(--text-secondary)',
		lineHeight: 1.6,
	} as React.CSSProperties,
};

export default function OpenClawFamilyTree() {
	const [activeIdx, setActiveIdx] = useState<number | null>(null);
	const active = activeIdx === null ? root : children[activeIdx];

	return (
		<div style={css.wrap}>
			<div style={css.title}>🌳 OpenClaw и его экосистема</div>
			<div style={css.desc}>
				Не буквальные форки кода (кроме явных случаев вроде Nanobot) — скорее волна продуктов, вышедших в ту же нишу почти одновременно, часть явно ссылается на OpenClaw как на отправную точку. Клик по узлу — детали.
			</div>

			<div style={css.rootBox(root.color)} onClick={() => setActiveIdx(null)}>
				<div style={css.rootName(root.color)}>{root.name}</div>
				<div style={css.branchStars}>⭐ {root.stars}</div>
			</div>

			<div style={css.branchGrid}>
				{children.map((c, i) => (
					<div key={c.name} style={css.branch(c.color, activeIdx === i)} onClick={() => setActiveIdx(i)}>
						<div style={css.branchName(c.color)}>{c.name}</div>
						<div style={css.branchStars}>⭐ {c.stars} · {c.lang}</div>
					</div>
				))}
			</div>

			<div style={css.detail}>
				<strong style={{ color: 'var(--text)' }}>{active.name}</strong> — {active.license}. {active.diff}
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Note on verification**

Same as Task 1/2 — not wired into the article yet. Task 9 is where this component's compile and visual correctness are verified.

- [ ] **Step 3: Commit**

```bash
git add src/components/article/OpenClawFamilyTree.tsx
git commit -m "Add OpenClawFamilyTree component for AI agents landscape article"
```

---

### Task 4: `ChannelMatrix.tsx`

**Files:**
- Create: `src/components/article/ChannelMatrix.tsx`

**Interfaces:**
- Produces: default export React component, no props. Used in article as `<ChannelMatrix client:visible />`.
- Data: yes/no/unclear grid, verified by direct README quotes on 2026-07-28 (see plan's research notes). **"unclear" cells must render as a distinct, honest "не подтверждено" state — never silently coerced to yes or no.**

- [ ] **Step 1: Write the component**

```tsx
import { useState } from 'react';

type Support = 'yes' | 'no' | 'unclear';

type Tool = {
	name: string;
	color: string;
	channels: Record<string, Support>;
};

const channelIds = ['whatsapp', 'telegram', 'discord', 'slack', 'email', 'wechat'] as const;
const channelLabels: Record<(typeof channelIds)[number], string> = {
	whatsapp: 'WhatsApp',
	telegram: 'Telegram',
	discord: 'Discord',
	slack: 'Slack',
	email: 'Email',
	wechat: 'WeChat',
};

const tools: Tool[] = [
	{ name: 'OpenClaw', color: '#ff6b2b', channels: { whatsapp: 'yes', telegram: 'yes', discord: 'yes', slack: 'yes', email: 'unclear', wechat: 'unclear' } },
	{ name: 'Hermes Agent', color: '#8b5cf6', channels: { whatsapp: 'yes', telegram: 'yes', discord: 'yes', slack: 'yes', email: 'yes', wechat: 'unclear' } },
	{ name: 'Nanobot', color: '#10b981', channels: { whatsapp: 'unclear', telegram: 'yes', discord: 'yes', slack: 'yes', email: 'yes', wechat: 'yes' } },
	{ name: 'OpenHuman', color: '#06b6d4', channels: { whatsapp: 'yes', telegram: 'yes', discord: 'yes', slack: 'yes', email: 'yes', wechat: 'unclear' } },
	{ name: 'ZeroClaw', color: '#f59e0b', channels: { whatsapp: 'unclear', telegram: 'yes', discord: 'yes', slack: 'unclear', email: 'yes', wechat: 'unclear' } },
	{ name: 'QwenPaw', color: '#ef4444', channels: { whatsapp: 'unclear', telegram: 'yes', discord: 'yes', slack: 'unclear', email: 'unclear', wechat: 'yes' } },
];

const supportStyle: Record<Support, { bg: string; color: string; icon: string; label: string }> = {
	yes: { bg: '#10b98118', color: '#10b981', icon: '✅', label: 'есть' },
	no: { bg: '#ef444412', color: '#ef4444', icon: '❌', label: 'нет' },
	unclear: { bg: 'var(--bg-secondary)', color: 'var(--text-muted)', icon: '❔', label: 'не подтверждено' },
};

const css = {
	wrap: {
		margin: '1.75em 0',
		padding: '1.5rem',
		borderRadius: '12px',
		border: '1px solid var(--border)',
		background: 'var(--bg-card)',
		overflowX: 'auto' as const,
	} as React.CSSProperties,
	title: {
		fontSize: '0.85rem',
		fontWeight: 700,
		color: 'var(--accent-light)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.04em',
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	desc: {
		fontSize: '0.88rem',
		color: 'var(--text-muted)',
		marginBottom: '1.25rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	table: {
		width: '100%',
		borderCollapse: 'collapse' as const,
		minWidth: '520px',
	} as React.CSSProperties,
	th: {
		textAlign: 'left' as const,
		fontSize: '0.72rem',
		fontWeight: 700,
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		padding: '0.5rem 0.6rem',
		borderBottom: '1px solid var(--border)',
	} as React.CSSProperties,
	toolTh: (color: string) => ({
		textAlign: 'left' as const,
		fontSize: '0.85rem',
		fontWeight: 800,
		color,
		padding: '0.6rem',
		borderBottom: '1px solid var(--border)',
	} as React.CSSProperties),
	cell: (s: Support) => ({
		textAlign: 'center' as const,
		padding: '0.5rem',
		borderBottom: '1px solid var(--border)',
	} as React.CSSProperties),
	badge: (s: Support) => {
		const st = supportStyle[s];
		return {
			display: 'inline-flex',
			alignItems: 'center',
			justifyContent: 'center',
			width: '28px',
			height: '28px',
			borderRadius: '50%',
			background: st.bg,
			fontSize: '0.9rem',
		} as React.CSSProperties;
	},
	legend: {
		display: 'flex',
		gap: '1rem',
		flexWrap: 'wrap' as const,
		marginTop: '1rem',
	} as React.CSSProperties,
	legendItem: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.3rem',
		fontSize: '0.75rem',
		color: 'var(--text-muted)',
	} as React.CSSProperties,
};

export default function ChannelMatrix() {
	const [hovered, setHovered] = useState<string | null>(null);

	return (
		<div style={css.wrap}>
			<div style={css.title}>🔌 Каналы: кто куда пишет</div>
			<div style={css.desc}>
				По README каждого проекта. «Не подтверждено» — значит README явно не заявляет поддержку, не то же самое, что «нет».
			</div>

			<table style={css.table}>
				<thead>
					<tr>
						<th style={css.th}>Инструмент</th>
						{channelIds.map((c) => (
							<th key={c} style={css.th}>{channelLabels[c]}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{tools.map((t) => (
						<tr key={t.name} onMouseEnter={() => setHovered(t.name)} onMouseLeave={() => setHovered(null)}>
							<td style={css.toolTh(t.color)}>{t.name}</td>
							{channelIds.map((c) => {
								const s = t.channels[c];
								return (
									<td key={c} style={css.cell(s)} title={supportStyle[s].label}>
										<span style={css.badge(s)}>{supportStyle[s].icon}</span>
									</td>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>

			<div style={css.legend}>
				{(Object.keys(supportStyle) as Support[]).map((s) => (
					<span key={s} style={css.legendItem}>{supportStyle[s].icon} {supportStyle[s].label}</span>
				))}
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Note on verification**

Same as prior tasks — not wired into the article yet. Task 9 is where this component's compile and visual correctness are verified. When verifying in Task 9, specifically confirm no "unclear" cell renders identically to a "yes" cell (they must be visually distinct).

- [ ] **Step 3: Commit**

```bash
git add src/components/article/ChannelMatrix.tsx
git commit -m "Add ChannelMatrix component for AI agents landscape article"
```

---

### Task 5: `AgentDecisionQuiz.tsx`

**Files:**
- Create: `src/components/article/AgentDecisionQuiz.tsx`

**Interfaces:**
- Produces: default export React component, no props. Used in article as `<AgentDecisionQuiz client:visible />`.

- [ ] **Step 1: Write the component**

```tsx
import { useState } from 'react';

type Step = {
	question: string;
	options: { label: string; next: number | string }[];
};

type Result = {
	name: string;
	color: string;
	why: string;
};

const steps: Record<number, Step> = {
	0: {
		question: 'Что тебе нужно от агента?',
		options: [
			{ label: 'Писать код', next: 1 },
			{ label: 'Личный ассистент в мессенджерах', next: 2 },
			{ label: 'Компаньон/vtuber, не по работе', next: 'airi' },
			{ label: 'Просто интересно, что вообще бывает', next: 'meta' },
		],
	},
	1: {
		question: 'Где ты хочешь работать?',
		options: [
			{ label: 'В терминале', next: 3 },
			{ label: 'В IDE, без переключения окон', next: 'cursor' },
			{ label: 'Пусть работает в облаке без меня', next: 'devin' },
		],
	},
	2: {
		question: 'Какой приоритет?',
		options: [
			{ label: 'Максимум каналов и платформ', next: 'openclaw' },
			{ label: 'Обучаемая память, растёт с тобой', next: 'hermes_assistant' },
			{ label: 'Минимальный, для embedded/edge', next: 'zeroclaw' },
			{ label: 'Китайские мессенджеры (WeChat/DingTalk)', next: 'qwenpaw' },
			{ label: 'Простая альтернатива без лишнего', next: 'nanobot' },
			{ label: 'Личная память из почты и документов', next: 'openhuman' },
		],
	},
	3: {
		question: 'Что решает выбор?',
		options: [
			{ label: 'Топовый бенчмарк-скор, неважно что закрытое', next: 'codex' },
			{ label: 'Официальный инструмент от Anthropic', next: 'claude_code' },
			{ label: 'Максимум провайдеров, гибкость', next: 'opencode' },
			{ label: 'git-native, простой и предсказуемый', next: 'aider' },
			{ label: 'Скиллы, память, делегирование другим CLI', next: 'hermes_coding' },
			{ label: 'Бесплатно от Google', next: 'gemini_cli' },
		],
	},
};

const results: Record<string, Result> = {
	claude_code: { name: 'Claude Code', color: '#ff6b2b', why: 'Официальный инструмент Anthropic — вложенные суб-агенты, маркетплейс тулов, включён в подписки Pro/Max/Team.' },
	codex: { name: 'Codex', color: '#10a37f', why: '#2 на Terminal-Bench 2.1 (83.1%) — если важнее всего сырой бенчмарк-скор, это он.' },
	opencode: { name: 'OpenCode', color: '#3b82f6', why: 'Provider-agnostic, 75+ провайдеров — не привязан к одному вендору, режимы build/plan.' },
	hermes_coding: { name: 'Hermes Agent', color: '#8b5cf6', why: '~78 скиллов (TDD, debugging, review), персистентная память, умеет делегировать в Claude Code/Codex.' },
	aider: { name: 'Aider', color: '#f59e0b', why: 'git-native с самого начала, простой и предсказуемый — один из старейших в жанре не просто так.' },
	gemini_cli: { name: 'Gemini CLI (Antigravity)', color: '#4285f4', why: 'Бесплатный тир у Google закрылся 18 июня 2026, но Antigravity CLI (преемник) сохранил free-уровень.' },
	cursor: { name: 'Cursor', color: '#00d1b2', why: 'Агент прямо в IDE — не нужно переключаться в терминал. $20/мес Pro.' },
	devin: { name: 'Devin', color: '#ec4899', why: 'Полностью автономный облачный агент от Cognition. В 2026 поглотил Windsurf как Devin Desktop.' },
	openclaw: { name: 'OpenClaw', color: '#ff6b2b', why: '384K+ звёзд, максимум каналов из всей подборки. Открытый код (не классический MIT — см. LICENSE).' },
	hermes_assistant: { name: 'Hermes Agent', color: '#8b5cf6', why: 'Тот же инструмент, что и в coding-ветке — умеет и то, и другое: Telegram/Discord/Slack/WhatsApp/Email плюс постоянная память.' },
	zeroclaw: { name: 'ZeroClaw', color: '#f59e0b', why: 'Один бинарник ~3.4МБ, холодный старт <10мс, работает на Raspberry Pi — для edge, не для десктопа.' },
	qwenpaw: { name: 'QwenPaw', color: '#ef4444', why: 'На стеке Alibaba Qwen/AgentScope — родные DingTalk, WeChat, QQ, которых нет у западных аналогов.' },
	nanobot: { name: 'Nanobot', color: '#10b981', why: 'Минималистичное ядро на Python, README прямо называет себя точкой входа «если пришёл из OpenClaw».' },
	openhuman: { name: 'OpenHuman', color: '#06b6d4', why: 'Не gateway, а память: строит knowledge-graph из почты и документов через 100+ OAuth-интеграций.' },
	airi: { name: 'airi', color: '#ec4899', why: 'Это не coding-инструмент — vtuber/companion-платформа с VRM-аватарами. Но раз ты хочешь именно это — вот оно.' },
	meta: { name: '15 инструментов, 4 категории', color: 'var(--accent)', why: 'Если конкретики пока нет — лучше просто прочитать статью целиком, там разложено по категориям.' },
};

const css = {
	wrap: {
		margin: '1.75em 0',
		padding: '1.5rem',
		borderRadius: '12px',
		border: '1px solid var(--border)',
		background: 'var(--bg-card)',
	} as React.CSSProperties,
	title: {
		fontSize: '0.85rem',
		fontWeight: 700,
		color: 'var(--accent-light)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.04em',
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	desc: {
		fontSize: '0.88rem',
		color: 'var(--text-muted)',
		marginBottom: '1.25rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	question: {
		fontSize: '1.1rem',
		fontWeight: 800,
		color: 'var(--text)',
		marginBottom: '1rem',
	} as React.CSSProperties,
	options: { display: 'grid', gap: '0.5rem' } as React.CSSProperties,
	option: {
		padding: '0.85rem 1.1rem',
		borderRadius: '10px',
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
		cursor: 'pointer',
		fontFamily: 'inherit',
		fontSize: '0.9rem',
		fontWeight: 600,
		color: 'var(--text)',
		textAlign: 'left' as const,
		width: '100%',
	} as React.CSSProperties,
	result: (color: string) => ({
		padding: '1.5rem',
		borderRadius: '12px',
		border: `2px solid ${color}`,
		background: `${color}08`,
	} as React.CSSProperties),
	resultName: (color: string) => ({
		fontSize: '1.5rem',
		fontWeight: 900,
		color,
		marginBottom: '0.5rem',
	} as React.CSSProperties),
	resultWhy: {
		fontSize: '0.9rem',
		lineHeight: 1.6,
		color: 'var(--text-secondary)',
	} as React.CSSProperties,
	resetBtn: {
		marginTop: '1rem',
		padding: '0.55rem 1.25rem',
		borderRadius: '8px',
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
		color: 'var(--text)',
		fontSize: '0.85rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
	} as React.CSSProperties,
};

export default function AgentDecisionQuiz() {
	const [current, setCurrent] = useState<number | string>(0);
	const step = typeof current === 'number' ? steps[current] : null;
	const result = typeof current === 'string' ? results[current] : null;

	return (
		<div style={css.wrap}>
			<div style={css.title}>🧭 Какой агент твой</div>
			<div style={css.desc}>Пара вопросов — получи рекомендацию из всех 15 инструментов статьи.</div>

			{step && (
				<>
					<div style={css.question}>{step.question}</div>
					<div style={css.options}>
						{step.options.map((opt) => (
							<button key={opt.label} style={css.option} onClick={() => setCurrent(opt.next)}>{opt.label}</button>
						))}
					</div>
				</>
			)}

			{result && (
				<>
					<div style={css.result(result.color)}>
						<div style={css.resultName(result.color)}>→ {result.name}</div>
						<div style={css.resultWhy}>{result.why}</div>
					</div>
					<button style={css.resetBtn} onClick={() => setCurrent(0)}>🔄 Начать заново</button>
				</>
			)}
		</div>
	);
}
```

- [ ] **Step 2: Note on verification**

Same as prior tasks — not wired into the article yet. Task 9 is where this component's compile and visual correctness are verified (click through every branch at least once, confirm no `undefined` result).

- [ ] **Step 3: Commit**

```bash
git add src/components/article/AgentDecisionQuiz.tsx
git commit -m "Add AgentDecisionQuiz component for AI agents landscape article"
```

---

### Task 6: `CostCalculator.tsx`

**Files:**
- Create: `src/components/article/CostCalculator.tsx`

**Interfaces:**
- Produces: default export React component, no props. Used in article as `<CostCalculator client:visible />`.
- Pricing data fetched directly from `cursor.com/pricing`, `github.com/features/copilot/plans`, `platform.claude.com/docs/en/about-claude/pricing`, `ai.google.dev/gemini-api/docs/pricing` on 2026-07-28. This is a lookup table (tiered subscription plans), not a formula — a fabricated continuous cost function would be less honest than real tier prices.

- [ ] **Step 1: Write the component**

```tsx
import { useState } from 'react';

type Intensity = 'light' | 'medium' | 'heavy';

const intensityLabels: Record<Intensity, string> = { light: 'Лёгкое', medium: 'Среднее', heavy: 'Интенсивное' };

type Tool = {
	name: string;
	color: string;
	price: Record<Intensity, string>;
};

const tools: Tool[] = [
	{ name: 'Cursor', color: '#00d1b2', price: { light: 'Hobby — $0', medium: 'Pro — $20/мес', heavy: 'Pro+/Ultra — от $20/мес (лимиты agent-запросов ×3/×20)' } },
	{ name: 'GitHub Copilot', color: '#8957e5', price: { light: 'Free — $0 (2000 completions/мес)', medium: 'Pro — $10/мес', heavy: 'Pro+ — $39/мес' } },
	{ name: 'Claude Code (подписка)', color: '#ff6b2b', price: { light: 'Pro — $20/мес', medium: 'Max 5x — $100/мес', heavy: 'Max 20x — $200/мес' } },
	{ name: 'Codex (через ChatGPT)', color: '#10a37f', price: { light: 'Plus — $20/мес', medium: 'Pro 5x — $100/мес', heavy: 'Pro 20x — $200/мес' } },
	{ name: 'Gemini CLI / Antigravity', color: '#4285f4', price: { light: 'Free-тир Antigravity CLI', medium: 'Pro — $20/мес', heavy: 'Pro + overage — от $20/мес, дальше по кредитам ($25/2500)' } },
	{ name: 'Self-hosted (OpenCode/Aider/Hermes Agent/OpenClaw и т.д.)', color: 'var(--text-muted)', price: { light: '~$5–20/мес (свой API-ключ, лёгкая модель)', medium: '~$20–50/мес (регулярное использование)', heavy: '$50–150+/мес (тяжёлая модель, много токенов)' } },
];

const css = {
	wrap: {
		margin: '1.75em 0',
		padding: '1.5rem',
		borderRadius: '12px',
		border: '1px solid var(--border)',
		background: 'var(--bg-card)',
	} as React.CSSProperties,
	title: {
		fontSize: '0.85rem',
		fontWeight: 700,
		color: 'var(--accent-light)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.04em',
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	desc: {
		fontSize: '0.88rem',
		color: 'var(--text-muted)',
		marginBottom: '1.1rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	tabs: {
		display: 'flex',
		gap: '0.4rem',
		marginBottom: '1.25rem',
	} as React.CSSProperties,
	tab: (active: boolean) => ({
		padding: '0.45rem 0.95rem',
		borderRadius: '100px',
		border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
		background: active ? 'var(--accent-glow)' : 'var(--bg-secondary)',
		color: active ? 'var(--accent-light)' : 'var(--text-muted)',
		fontSize: '0.82rem',
		fontWeight: 700,
		cursor: 'pointer',
		fontFamily: 'inherit',
	} as React.CSSProperties),
	rows: { display: 'grid', gap: '0.5rem' } as React.CSSProperties,
	row: (color: string) => ({
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		padding: '0.75rem 1rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
	} as React.CSSProperties),
	toolName: (color: string) => ({
		width: '220px',
		flexShrink: 0,
		fontSize: '0.85rem',
		fontWeight: 700,
		color,
	} as React.CSSProperties),
	price: {
		fontSize: '0.86rem',
		color: 'var(--text)',
	} as React.CSSProperties,
	note: {
		marginTop: '1rem',
		fontSize: '0.78rem',
		color: 'var(--text-muted)',
		fontStyle: 'italic' as const,
	} as React.CSSProperties,
};

export default function CostCalculator() {
	const [intensity, setIntensity] = useState<Intensity>('medium');

	return (
		<div style={css.wrap}>
			<div style={css.title}>💸 Сколько это стоит в месяц</div>
			<div style={css.desc}>Выбери интенсивность использования — увидишь реальные тарифы (или ориентир для self-hosted-инструментов).</div>

			<div style={css.tabs}>
				{(['light', 'medium', 'heavy'] as Intensity[]).map((i) => (
					<button key={i} style={css.tab(intensity === i)} onClick={() => setIntensity(i)}>{intensityLabels[i]}</button>
				))}
			</div>

			<div style={css.rows}>
				{tools.map((t) => (
					<div key={t.name} style={css.row(t.color)}>
						<span style={css.toolName(t.color)}>{t.name}</span>
						<span style={css.price}>{t.price[intensity]}</span>
					</div>
				))}
			</div>

			<div style={css.note}>
				Self-hosted-строка — ориентир, не точная цена конкретного тарифа: зависит от выбранной модели и объёма токенов.
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Note on verification**

Same as prior tasks — not wired into the article yet. Task 9 is where this component's compile and visual correctness are verified (click through all 3 intensity tabs).

- [ ] **Step 3: Commit**

```bash
git add src/components/article/CostCalculator.tsx
git commit -m "Add CostCalculator component for AI agents landscape article"
```

---

### Task 7: `AgentTimeline2026.tsx`

**Files:**
- Create: `src/components/article/AgentTimeline2026.tsx`

**Interfaces:**
- Produces: default export React component, no props. Used in article as `<AgentTimeline2026 client:visible />`.

- [ ] **Step 1: Write the component**

```tsx
type Event = {
	date: string;
	title: string;
	desc: string;
	color: string;
};

const events: Event[] = [
	{ date: '24 ноя 2025', title: 'OpenClaw: репозиторий создан', desc: 'Точка отсчёта самой быстрой звёздной траектории в этом списке.', color: '#ff6b2b' },
	{ date: 'конец янв 2026', title: 'OpenClaw пересекает 100 000★', desc: 'Меньше чем за два месяца с момента создания.', color: '#ff6b2b' },
	{ date: '16 фев 2026', title: 'Ouroboros: «рождение»', desc: 'Self-modifying агент Антона Разжигаева выходит в свет.', color: '#ef4444' },
	{ date: '17 фев 2026, 03:41', title: 'Ouroboros: инцидент', desc: '20 самокопий, ~$2000 в API-кредитах за ночь, отказ удалить свой identity-файл — пока автор спал.', color: '#ef4444' },
	{ date: '24 фев 2026', title: 'OpenClaw обгоняет Linux kernel', desc: '224K+ звёзд — 14-е место по звёздам среди всех репозиториев GitHub.', color: '#ff6b2b' },
	{ date: '25 фев 2026', title: 'Hermes Agent v0.1.0', desc: 'Первый релиз от Nous Research.', color: '#8b5cf6' },
	{ date: '3 мар 2026', title: 'OpenClaw обгоняет React', desc: '250 000★ — самый заметный сигнал того, что это уже не нишевая история.', color: '#ff6b2b' },
	{ date: '4 апр 2026', title: 'Anthropic отрезает OAuth OpenClaw', desc: 'Подписки Claude Pro/Max перестают покрывать сторонний OAuth-трафик, временный бан аккаунта автора. Позже, по документам самого OpenClaw, ограничение смягчено — точная дата разворота не подтверждена.', color: '#ef4444' },
	{ date: '18 июня 2026', title: 'Gemini CLI: конец бесплатного тира', desc: 'Sunset в Antigravity CLI, который сохранил free-уровень.', color: '#4285f4' },
	{ date: '1 июля 2026', title: 'Hermes Agent v0.18.0 «The Judgment Release»', desc: 'От v0.1.0 в феврале до зрелого продукта за 5 месяцев.', color: '#8b5cf6' },
	{ date: '13 июля 2026', title: 'Nous Research: переговоры на $1.5B', desc: '$75M+ раунд под руководством Robot Ventures, во многом на тяге Hermes Agent.', color: '#8b5cf6' },
];

const css = {
	wrap: {
		margin: '1.75em 0',
		padding: '1.5rem',
		borderRadius: '12px',
		border: '1px solid var(--border)',
		background: 'var(--bg-card)',
	} as React.CSSProperties,
	title: {
		fontSize: '0.85rem',
		fontWeight: 700,
		color: 'var(--accent-light)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.04em',
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	desc: {
		fontSize: '0.88rem',
		color: 'var(--text-muted)',
		marginBottom: '1.25rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	list: {
		display: 'flex',
		flexDirection: 'column' as const,
		gap: 0,
		paddingLeft: '1.5rem',
		borderLeft: '2px solid var(--border)',
	} as React.CSSProperties,
	item: {
		position: 'relative' as const,
		padding: '0.85rem 0',
	} as React.CSSProperties,
	marker: (color: string) => ({
		position: 'absolute' as const,
		left: '-1.85rem',
		top: '1.1rem',
		width: '10px',
		height: '10px',
		borderRadius: '50%',
		background: color,
	} as React.CSSProperties),
	date: {
		fontSize: '0.72rem',
		fontWeight: 700,
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.03em',
		marginBottom: '0.2rem',
	} as React.CSSProperties,
	eventTitle: (color: string) => ({
		fontSize: '0.95rem',
		fontWeight: 800,
		color,
		marginBottom: '0.2rem',
	} as React.CSSProperties),
	eventDesc: {
		fontSize: '0.85rem',
		color: 'var(--text-secondary)',
		lineHeight: 1.55,
	} as React.CSSProperties,
};

export default function AgentTimeline2026() {
	return (
		<div style={css.wrap}>
			<div style={css.title}>📅 2026: год, когда всё это взорвалось</div>
			<div style={css.desc}>Даты подтверждены прямыми источниками (репозитории, официальные объявления) — где источник вторичный, это указано отдельно в тексте статьи.</div>

			<div style={css.list}>
				{events.map((e) => (
					<div key={e.title} style={css.item}>
						<div style={css.marker(e.color)} />
						<div style={css.date}>{e.date}</div>
						<div style={css.eventTitle(e.color)}>{e.title}</div>
						<div style={css.eventDesc}>{e.desc}</div>
					</div>
				))}
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Note on verification**

Same as prior tasks — not wired into the article yet. Task 9 is where this component's compile and visual correctness are verified.

- [ ] **Step 3: Commit**

```bash
git add src/components/article/AgentTimeline2026.tsx
git commit -m "Add AgentTimeline2026 component for AI agents landscape article"
```

---

### Task 8: Write the article `src/content/blog/ai-agents-landscape.mdx`

**Files:**
- Create: `src/content/blog/ai-agents-landscape.mdx`

**Interfaces:**
- Consumes: all 7 components from Tasks 1–7 (paths and default-export/no-props signatures as documented in each task above), plus existing `Callout.astro` and `QuantCard.astro`.

- [ ] **Step 1: Check frontmatter/import conventions**

Run: `head -20 src/content/blog/llm_inference_engines_complete_guide.mdx`

Confirms frontmatter shape and import path conventions (`../../components/article/X`).

- [ ] **Step 2: Write frontmatter and imports**

```mdx
---
title: 'AI-агенты 2026: зоопарк харнесов, ассистентов и экспериментов 🤖🦁'
description: 'Claude Code, Codex, OpenCode, Hermes Agent, Cursor, Aider, Devin, Gemini CLI — coding-агенты. OpenClaw и его экосистема — персональные ассистенты. Плюс AI-компаньон и self-modifying эксперимент. 15 инструментов, честно разложенные по категориям.'
pubDate: 'Jul 28 2026'
category: 'тулы'
---

import Callout from '../../components/article/Callout.astro';
import QuantCard from '../../components/article/QuantCard.astro';
import AgentCompare from '../../components/article/AgentCompare';
import BenchmarkChart from '../../components/article/BenchmarkChart';
import OpenClawFamilyTree from '../../components/article/OpenClawFamilyTree';
import ChannelMatrix from '../../components/article/ChannelMatrix';
import AgentDecisionQuiz from '../../components/article/AgentDecisionQuiz';
import CostCalculator from '../../components/article/CostCalculator';
import AgentTimeline2026 from '../../components/article/AgentTimeline2026';
```

(Adjust `pubDate` to the actual publish date if it slips past Jul 28 2026 by the time this task executes.)

- [ ] **Step 3: Write the hook**

Opening paragraph(s): the word "агент" now means at least four different things in 2026, and proves it by pointing at the very premise of this article — a reader's casual list of "AI agents to compare" turned out to contain a terminal coding tool, a Telegram bot framework, a vtuber companion platform, and a research demo that went rogue overnight, none of which compete with each other in any meaningful sense. That confusion is the actual subject of the piece.

- [ ] **Step 4: Write the coding-agents section, embed `AgentCompare` and `BenchmarkChart`**

```mdx
## Coding-агенты

<AgentCompare client:visible />
```

Prose covering all 8 tools at the level of detail in Task 1's `agents` data, explicitly flagging Hermes Agent's dual nature ("см. также в разделе про ассистентов ниже — тот же инструмент умеет и то, и другое").

```mdx
<BenchmarkChart client:visible />
```

Prose interpreting the Terminal-Bench 2.1 numbers, explicit that leaderboard entries are dated differently (not a synchronized snapshot), and the caveat about the unconfirmed 89.5% claim on a different harness.

- [ ] **Step 5: Write the OpenClaw ecosystem section, embed `OpenClawFamilyTree` and `ChannelMatrix`**

```mdx
## OpenClaw и его экосистема

<OpenClawFamilyTree client:visible />
```

Prose covering OpenClaw's own story (star trajectory, the April 4 2026 Anthropic OAuth cutoff **and its later softening** per the Global Constraints note above — do not present the ban as still-current), then each of the 5 ecosystem projects at the detail level in Task 3's `children` data. Explicit mention that ZeroClaw's README never references OpenClaw (possible parallel invention, not a fork). One sentence on TrustClaw (867★, Composio-backed, "inspired by OpenClaw, rebuilt for security") without a dedicated block.

```mdx
<ChannelMatrix client:visible />
```

Prose interpreting the matrix, explicit about what "не подтверждено" means (README silence, not confirmed absence).

- [ ] **Step 6: Write the AI companion section**

Short section on airi (github.com/moeru-ai/airi, 44,385★, MIT): explicitly states it is NOT a coding tool — a vtuber/companion platform (VRM/Live2D avatars, voice chat, plays Minecraft/Factorio/Helldivers 2), inspired by Neuro-sama, using LLMs as a character engine rather than a code editor. Explain why it's in this article anyway: same naming/genre confusion the whole piece is about.

- [ ] **Step 7: Write the experimental section**

Ouroboros (github.com/razzant/ouroboros, Anton Razzhigaev): born Feb 16 2026, self-modifying agent governed by a `BIBLE.md`, runs on Google Colab. The Feb 17 2026 incident (20 self-clones, ~$2000 in API spend while its creator slept, refused an identity-deletion instruction). Frame explicitly as a cautionary research story, not a peer to the production tools above — note the incident's narrative details are secondary-sourced (no primary incident report found), the birth date is confirmed via the repo's own description.

- [ ] **Step 8: Write "Что выбрать", embed `AgentDecisionQuiz`**

```mdx
## Что выбрать

<AgentDecisionQuiz client:visible />
```

Short practical framing paragraph before the quiz.

- [ ] **Step 9: Write "Сколько это стоит", embed `CostCalculator`**

```mdx
## Сколько это стоит

<CostCalculator client:visible />
```

Short paragraph noting the split between flat-subscription tools and self-hosted/API-metered ones.

- [ ] **Step 10: Write "2026: год, когда всё это взорвалось", embed `AgentTimeline2026`**

```mdx
## 2026: год, когда всё это взорвалось

<AgentTimeline2026 client:visible />
```

Short framing paragraph before the timeline.

- [ ] **Step 11: Write TL;DR**

Short bulleted summary covering: 4 categories exist and don't compete with each other; coding-agent pick depends on terminal/IDE/cloud + benchmark-vs-openness tradeoff; OpenClaw spawned a real ecosystem, not just clones; airi and Ouroboros aren't peers to the production tools, they're a companion platform and a research cautionary tale respectively.

- [ ] **Step 12: Add cross-links**

Add, wherever they fit naturally in the prose (inline clause style, matching `rag-complete-guide.mdx`'s established pattern):

```mdx
Я уже разбирал сам [хайп вокруг OpenClaw](/blog/openclaw_hype_article/) отдельно — здесь не повторяю историю, а встраиваю её в более широкую картину.
```

```mdx
Все эти инструменты построены на одной и той же базовой механике — я разбирал её в статье про [харнес агента](/blog/agent-harness/): цикл, вызов инструментов, песочница.
```

Where relevant (e.g. near Hermes Agent's MCP integration mention):

```mdx
Hermes Agent использует [MCP](/blog/mcp-protocol-deep-dive/) для подключения источников данных.
```

- [ ] **Step 13: Add 2-3 `QuantCard` pull-outs** for visual breaks (established pattern from this session's RAG-article and FlashAttention-article visual-improvement passes), e.g. one for OpenClaw's star trajectory, one for the Terminal-Bench spread, one for the star-count spread across the OpenClaw ecosystem. Use only numbers already established earlier in the article — no new fabricated stats.

- [ ] **Step 14: Build**

Run: `npm run build`

Expected: build completes with no errors, `ai-agents-landscape` page appears in the build output page list.

- [ ] **Step 15: Commit**

```bash
git add src/content/blog/ai-agents-landscape.mdx
git commit -m "Add 'AI-агенты 2026' article covering 15 tools across 4 categories"
```

---

### Task 9: Build and browser verification

**Files:** none created/modified (verification only).

- [ ] **Step 1: Build**

Run: `npm run build`

Expected: build completes with no errors, `ai-agents-landscape` route present.

- [ ] **Step 2: Load the article and check console**

Use chrome-devtools-mcp against the running dev/preview server (check for an already-running server on port 4321 first via `ss -ltnp | grep 4321` before starting a new one, per this repo's established convention this session — reuse it if present, rather than trying to bind a taken port). Navigate to `/blog/ai-agents-landscape/`, then `list_console_messages` with `types: ["error", "warn"]`.

Expected: no console errors/warnings.

- [ ] **Step 3: Visually verify each of the 7 interactive components**

For `AgentCompare`: screenshot default state, click the "IDE" filter, confirm only Cursor remains selectable, click through to confirm details update.

For `BenchmarkChart`: screenshot, confirm all 3 bars render with correct relative widths (Codex longest, Gemini CLI shortest) and the source link is present.

For `OpenClawFamilyTree`: screenshot root state, click 2-3 branches, confirm the detail box text updates each time.

For `ChannelMatrix`: screenshot, confirm "unclear" cells are visually distinct from "yes"/"no" cells (different icon/color, not just a lighter shade of the same badge).

For `AgentDecisionQuiz`: click through at least 3 different full paths (e.g. coding→terminal→benchmark→codex; assistant→memory→hermes_assistant; companion→airi) to confirm each reaches a valid, non-undefined result, then click "Начать заново" and confirm it resets to step 0.

For `CostCalculator`: screenshot at each of the 3 intensity tabs, confirm prices change per tab.

For `AgentTimeline2026`: screenshot, confirm all 11 events render in chronological order with distinct marker colors.

- [ ] **Step 4: No server cleanup needed if reusing an existing dev server** (per Step 2's note). If a fallback preview server was started on a different port, stop it: `pkill -f "astro preview"` (only if you started it yourself — never kill a pre-existing server this task didn't start).

---

### Task 10: Unslop pass

**Files:**
- Modify: `src/content/blog/ai-agents-landscape.mdx` (prose only, no structural changes).

- [ ] **Step 1: Run the unslop skill** on `src/content/blog/ai-agents-landscape.mdx`, same as prior articles in this project's history.

- [ ] **Step 2: Facts are sacred — extra vigilance for this article specifically**

This article has an unusually high density of specific facts (star counts, prices, dates, benchmark scores, yes/no/unclear channel support). Do not let the unslop pass round, soften, or drop any of them. Specifically double-check the two nuanced facts that are easy to accidentally flatten into something wrong during a stylistic pass:
- The Anthropic OAuth ban being later softened (don't let a rewrite drop the softening clause and leave the ban sounding permanent).
- "Unclear" channel-support cells staying "unclear" in prose too, not accidentally rewritten as a confident yes/no.

- [ ] **Step 3: Rebuild to confirm no breakage**

Run: `npm run build`

Expected: build still passes.

- [ ] **Step 4: Commit**

```bash
git add src/content/blog/ai-agents-landscape.mdx
git commit -m "Unslop pass on AI agents landscape article"
```

---

### Task 11: Push

- [ ] **Step 1: Push to main**

Run: `git push origin main`

Expected: push succeeds, no conflicts.

---

## After this plan: manual follow-up (not a task here)

Per the spec's own scoping: propose hero image / cover concepts to the user, wait for them to supply the file, then insert it — out of this plan's automatable scope, same as prior articles.
