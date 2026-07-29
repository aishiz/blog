# Пост-тренинг LLM: RLHF → DPO → GRPO — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a new "фундамент" blog article `src/content/blog/rlhf-dpo-grpo.mdx` that explains the mechanics of LLM post-training RL algorithms — PPO → DPO → GRPO → DAPO — with primary-sourced formulas, a NumPy-verified numeric example, and 8 interactive React components.

**Architecture:** One MDX article importing 7 new one-off React components (`client:visible`) plus the existing shared `Mermaid.tsx` component. Each new component follows the established article-component convention: inline `css` object typed `React.CSSProperties`, CSS custom properties for theming, no new npm dependencies, default export with no props.

**Tech Stack:** Astro 5, React 19, TypeScript, existing `Mermaid.tsx` (mermaid.js already a dependency).

## Global Constraints

- Category: `'фундамент'`. Slug: `rlhf-dpo-grpo`. File: `src/content/blog/rlhf-dpo-grpo.mdx`.
- Voice: Russian, dense, direct, light irony — match `src/content/blog/flashattention.mdx` and `src/content/blog/kimi-k3.mdx`.
- Every formula and number below is either **primary-verified** (direct fetch of the arXiv paper, cited with exact arXiv ID) or explicitly labeled **secondary/consensus** in the prose itself — never state a secondary-sourced number as if it were primary-confirmed.
- The GRPO≈DPO paper (arXiv:2510.00977) claims the two are **"structurally related"** via a control-variate argument — **not** literal mathematical equivalence. Never write "GRPO эквивалентен DPO" as a flat claim; always carry the "structurally related, not literally equivalent" qualifier.
- DAPO's clip-widening technique is named **"Clip-Higher"** in the paper — never call it "decoupled clip" (that string only appears inside the acronym expansion in the paper's title).
- No new npm dependencies. No `heroImage` in frontmatter — deferred to a manual follow-up step after the user reviews the article, per established pattern.
- `client:visible` on every new interactive component (lazy hydration, matches every other article component in the codebase).
- Colors: PPO `#3b82f6` (blue), DPO `#22c55e` (green), GRPO `#8b5cf6` (purple), GRPO/K3-adjacent accents `#c946ff` (magenta, matches `kimi-k3.mdx`'s established K3 color), DAPO `#f59e0b` (amber), skepticism/controversy `#ef4444` (red) — reuse consistently across all 7 components so the same algorithm always reads the same color.

---

### Task 1: `AdvantageCompare.tsx`

**Files:**
- Create: `src/components/article/AdvantageCompare.tsx`

**Interfaces:**
- Produces: default export React component, no props. Used in article as `<AdvantageCompare client:visible />`.

- [ ] **Step 1: Write the component**

```tsx
import { useState } from 'react';

type Mode = 'ppo' | 'grpo';

// NumPy-верифицировано (python3, seed фиксирован для группы, std без ddof — как в
// референсных реализациях GRPO): группа из G=8 rollout'ов на один промпт, бинарная
// награда корректности (0/1, в духе rule-based верификатора DeepSeekMath/DeepSeek-R1).
const REWARDS = [1, 0, 1, 1, 0, 1, 0, 1];
const GROUP_MEAN = 0.625;
const GROUP_STD = 0.4841;
const GRPO_ADVANTAGES = [0.7744, -1.2907, 0.7744, 0.7744, -1.2907, 0.7744, -1.2907, 0.7744];

// PPO-сравнение на тех же rollout'ах: одна скалярная награда в конце генерации,
// advantage = reward − V(s). V(s)=0.55 — иллюстративная critic-оценка (обучаемая сеть,
// намеренно не совпадает с истинным средним 0.625, как и должно быть у несовершенного критика).
const CRITIC_BASELINE = 0.55;
const PPO_ADVANTAGES = REWARDS.map((r) => Number((r - CRITIC_BASELINE).toFixed(4)));

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
	rolloutGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(4, 1fr)',
		gap: '0.5rem',
		marginBottom: '1.1rem',
	} as React.CSSProperties,
	rolloutBox: (correct: boolean) => ({
		padding: '0.6rem 0.4rem',
		borderRadius: '8px',
		textAlign: 'center' as const,
		background: 'var(--bg-secondary)',
		border: `1px solid ${correct ? '#22c55e40' : '#ef444440'}`,
	} as React.CSSProperties),
	rolloutReward: {
		fontSize: '0.72rem',
		color: 'var(--text-muted)',
		marginBottom: '0.25rem',
	} as React.CSSProperties,
	rolloutAdv: (positive: boolean) => ({
		fontSize: '0.95rem',
		fontWeight: 800,
		color: positive ? '#22c55e' : '#ef4444',
		fontVariantNumeric: 'tabular-nums' as const,
	} as React.CSSProperties),
	formula: {
		padding: '0.75rem 1rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		fontSize: '0.9rem',
		fontWeight: 700,
		color: 'var(--text)',
		fontFamily: 'monospace',
		marginBottom: '0.9rem',
	} as React.CSSProperties,
	note: {
		fontSize: '0.8rem',
		color: 'var(--text-muted)',
		lineHeight: 1.6,
	} as React.CSSProperties,
};

export default function AdvantageCompare() {
	const [mode, setMode] = useState<Mode>('grpo');
	const advantages = mode === 'grpo' ? GRPO_ADVANTAGES : PPO_ADVANTAGES;

	return (
		<div style={css.wrap}>
			<div style={css.title}>⚖️ PPO vs GRPO: как считается advantage</div>
			<div style={css.desc}>
				Одна и та же группа из 8 rollout'ов на один промпт (1 = верный ответ, 0 = неверный). Переключи режим — увидишь, как разные алгоритмы превращают эти награды в сигнал для градиента.
			</div>

			<div style={css.tabs}>
				<button style={css.tab(mode === 'ppo', '#3b82f6')} onClick={() => setMode('ppo')}>PPO (critic-baseline)</button>
				<button style={css.tab(mode === 'grpo', '#8b5cf6')} onClick={() => setMode('grpo')}>GRPO (group-relative)</button>
			</div>

			<div style={css.rolloutGrid}>
				{REWARDS.map((r, i) => (
					<div key={i} style={css.rolloutBox(r === 1)}>
						<div style={css.rolloutReward}>r={r}</div>
						<div style={css.rolloutAdv(advantages[i] > 0)}>{advantages[i] > 0 ? '+' : ''}{advantages[i].toFixed(2)}</div>
					</div>
				))}
			</div>

			<div style={css.formula}>
				{mode === 'grpo'
					? <>Â = (r − mean) / std = (r − {GROUP_MEAN}) / {GROUP_STD}</>
					: <>Â = r − V(s) = r − {CRITIC_BASELINE}</>}
			</div>

			<div style={css.note}>
				{mode === 'grpo'
					? 'Никакой отдельной сети: baseline — статистика самой группы. Формула и G=64 — из DeepSeekMath (arXiv:2402.03300).'
					: 'V(s) — отдельная обучаемая критик-сеть (Schulman et al., arXiv:1707.06347). Несовершенный критик (0.55) намеренно не совпадает с истинным средним (0.625) — так и бывает в реальности.'}
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Note on verification**

Nothing imports this component yet — it's wired into the article in Task 8. Task 9 ("Build and browser verification") is where compile and visual correctness are actually verified.

- [ ] **Step 3: Commit**

```bash
git add src/components/article/AdvantageCompare.tsx
git commit -m "Add AdvantageCompare component for RLHF/DPO/GRPO article"
```

---

### Task 2: `CriticVramCalculator.tsx`

**Files:**
- Create: `src/components/article/CriticVramCalculator.tsx`

**Interfaces:**
- Produces: default export React component, no props. Used in article as `<CriticVramCalculator client:visible />`.

- [ ] **Step 1: Write the component**

```tsx
import { useState } from 'react';

type SizeKey = '7B' | '14B' | '70B';

const PARAMS: Record<SizeKey, number> = { '7B': 7e9, '14B': 14e9, '70B': 70e9 };

type Config = { key: string; label: string; models: number; desc: string; color: string };

const CONFIGS: Config[] = [
	{ key: 'ppo', label: 'PPO', models: 4, desc: 'policy + critic + reward model + reference', color: '#3b82f6' },
	{ key: 'grpo-rm', label: 'GRPO + reward model', models: 3, desc: 'policy + reward model + reference — критика уже нет', color: '#8b5cf6' },
	{ key: 'grpo-rule', label: 'GRPO + rule-based reward', models: 2, desc: 'policy + reference — как в DeepSeek-R1-Zero для math/code', color: '#c946ff' },
];

// Только веса в bf16 (2 байта/параметр), без оптимайзера/градиентов/активаций/KV-кэша.
// Собственный подсчёт для иллюстрации структурной разницы (сколько КОПИЙ модели держим
// в памяти одновременно) — конкретные GB для полного финтюна расходятся между вторичными
// источниками, поэтому здесь только простая, прозрачная арифметика по числу моделей.
function gbForModels(params: number, n: number): number {
	return Math.round((params * 2 * n) / 1e9);
}

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
	rows: { display: 'grid', gap: '0.6rem' } as React.CSSProperties,
	row: {
		padding: '0.75rem 1rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
	} as React.CSSProperties,
	rowHead: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'baseline',
		marginBottom: '0.4rem',
	} as React.CSSProperties,
	rowLabel: (color: string) => ({
		fontSize: '0.86rem',
		fontWeight: 800,
		color,
	} as React.CSSProperties),
	rowGb: {
		fontSize: '1.1rem',
		fontWeight: 900,
		color: 'var(--text)',
		fontVariantNumeric: 'tabular-nums' as const,
	} as React.CSSProperties,
	barTrack: {
		height: '8px',
		borderRadius: '4px',
		background: 'var(--bg-card)',
		overflow: 'hidden',
		marginBottom: '0.4rem',
	} as React.CSSProperties,
	barFill: (pct: number, color: string) => ({
		width: `${pct}%`,
		height: '100%',
		background: color,
	} as React.CSSProperties),
	rowDesc: {
		fontSize: '0.78rem',
		color: 'var(--text-muted)',
	} as React.CSSProperties,
	note: {
		marginTop: '0.75rem',
		fontSize: '0.78rem',
		color: 'var(--text-muted)',
		lineHeight: 1.55,
		fontStyle: 'italic' as const,
	} as React.CSSProperties,
};

export default function CriticVramCalculator() {
	const [size, setSize] = useState<SizeKey>('7B');
	const params = PARAMS[size];
	const maxGb = gbForModels(params, 4);

	return (
		<div style={css.wrap}>
			<div style={css.title}>🧮 Сколько моделей держим в памяти одновременно</div>
			<div style={css.desc}>Выбери размер policy-модели — увидишь, сколько копий такого же размера нужно держать в VRAM для каждого подхода (только веса, bf16, без оптимайзера и активаций).</div>

			<div style={css.tabs}>
				{(['7B', '14B', '70B'] as SizeKey[]).map((s) => (
					<button key={s} style={css.tab(size === s)} onClick={() => setSize(s)}>{s}</button>
				))}
			</div>

			<div style={css.rows}>
				{CONFIGS.map((c) => {
					const gb = gbForModels(params, c.models);
					const pct = (gb / maxGb) * 100;
					return (
						<div key={c.key} style={css.row}>
							<div style={css.rowHead}>
								<span style={css.rowLabel(c.color)}>{c.label} ({c.models} модели)</span>
								<span style={css.rowGb}>{gb} ГБ</span>
							</div>
							<div style={css.barTrack}><div style={css.barFill(pct, c.color)} /></div>
							<div style={css.rowDesc}>{c.desc}</div>
						</div>
					);
				})}
			</div>

			<div style={css.note}>Структурная иллюстрация, не точный прод-бюджет: реальный расход VRAM выше (оптимайзер, градиенты, активации, KV-кэш при генерации rollout'ов) и расходится между инженерными источниками — здесь считается только то, что железно известно: сколько копий модели нужно держать одновременно.</div>
		</div>
	);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/article/CriticVramCalculator.tsx
git commit -m "Add CriticVramCalculator component for RLHF/DPO/GRPO article"
```

---

### Task 3: `PostTrainingTimeline.tsx`

**Files:**
- Create: `src/components/article/PostTrainingTimeline.tsx`

**Interfaces:**
- Produces: default export React component, no props. Used in article as `<PostTrainingTimeline client:visible />`.

- [ ] **Step 1: Write the component**

```tsx
type Event = {
	date: string;
	title: string;
	desc: string;
	color: string;
};

const events: Event[] = [
	{ date: 'Март 2022', title: 'InstructGPT (RLHF + PPO)', desc: 'Ouyang et al., arXiv:2203.02155. Канонический рецепт: SFT → reward model → PPO с KL-штрафом против reference-модели.', color: '#3b82f6' },
	{ date: 'Май 2023', title: 'DPO', desc: 'Rafailov et al., arXiv:2305.18290. Reward становится implicit — RL-петля и отдельная reward-модель не нужны вовсе, обычный supervised loss на парах предпочтений.', color: '#22c55e' },
	{ date: 'Февраль 2024', title: 'GRPO', desc: 'DeepSeekMath, arXiv:2402.03300. Group-relative advantage без critic-сети: G=64 rollout\'ов на промпт, KL-коэффициент β=0.04.', color: '#8b5cf6' },
	{ date: 'Январь 2025', title: 'DeepSeek-R1', desc: 'arXiv:2501.12948. GRPO на масштабе продакшена: AIME 2024 pass@1 вырос с 15.6% до 71.0% за RL-тренировку.', color: '#c946ff' },
	{ date: 'Март 2025', title: 'DAPO', desc: 'ByteDance, arXiv:2503.14476. Чинит entropy collapse и «нулевой градиент» в ванильном GRPO: 50 против 47 у DeepSeek-R1-Zero-Qwen-32B на AIME 2024, за половину шагов тренировки.', color: '#f59e0b' },
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

export default function PostTrainingTimeline() {
	return (
		<div style={css.wrap}>
			<div style={css.title}>🕰️ Три года эволюции за один взгляд</div>
			<div style={css.desc}>Каждый следующий алгоритм — прямой ответ на конкретную боль предыдущего.</div>

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

- [ ] **Step 2: Commit**

```bash
git add src/components/article/PostTrainingTimeline.tsx
git commit -m "Add PostTrainingTimeline component for RLHF/DPO/GRPO article"
```

---

### Task 4: `GroupRolloutSimulator.tsx`

**Files:**
- Create: `src/components/article/GroupRolloutSimulator.tsx`

**Interfaces:**
- Produces: default export React component, no props. Used in article as `<GroupRolloutSimulator client:visible />`.

- [ ] **Step 1: Write the component**

```tsx
import { useState } from 'react';

type G = 4 | 8 | 16 | 64;

// NumPy-симуляция (python3, seed=42): 2000 групп на каждый размер G, бинарные rewards
// ~ Bernoulli(p=0.625) — та же вероятность успеха, что и в группе из AdvantageCompare.
// Для каждой группы считаем advantage «верного» (r=1) rollout'а по формуле GRPO
// (r − mean)/(std + eps), затем смотрим разброс этой оценки между 2000 групп.
const GROUP_DATA: Record<G, { meanAdv: number; stdAdv: number }> = {
	4: { meanAdv: 0.7718, stdAdv: 0.5050 },
	8: { meanAdv: 0.8206, stdAdv: 0.3571 },
	16: { meanAdv: 0.7918, stdAdv: 0.2274 },
	64: { meanAdv: 0.7770, stdAdv: 0.1000 },
};

const MAX_STD = GROUP_DATA[4].stdAdv;

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
	statBox: {
		padding: '0.9rem 1rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		marginBottom: '0.6rem',
	} as React.CSSProperties,
	statLabel: {
		fontSize: '0.78rem',
		color: 'var(--text-muted)',
		marginBottom: '0.3rem',
	} as React.CSSProperties,
	statVal: {
		fontSize: '1.3rem',
		fontWeight: 900,
		color: 'var(--text)',
		fontVariantNumeric: 'tabular-nums' as const,
		marginBottom: '0.4rem',
	} as React.CSSProperties,
	barTrack: {
		height: '10px',
		borderRadius: '5px',
		background: 'var(--bg-card)',
		overflow: 'hidden',
	} as React.CSSProperties,
	barFill: (pct: number) => ({
		width: `${pct}%`,
		height: '100%',
		background: '#8b5cf6',
	} as React.CSSProperties),
	note: {
		fontSize: '0.8rem',
		color: 'var(--text-muted)',
		lineHeight: 1.6,
	} as React.CSSProperties,
};

export default function GroupRolloutSimulator() {
	const [g, setG] = useState<G>(8);
	const data = GROUP_DATA[g];
	const pct = (data.stdAdv / MAX_STD) * 100;

	return (
		<div style={css.wrap}>
			<div style={css.title}>🎲 Размер группы решает разброс оценки</div>
			<div style={css.desc}>Двигай размер группы G — увидишь, как меняется разброс advantage-оценки для одного и того же «верного» rollout'а между разными случайными группами.</div>

			<div style={css.tabs}>
				{([4, 8, 16, 64] as G[]).map((v) => (
					<button key={v} style={css.tab(g === v)} onClick={() => setG(v)}>G={v}</button>
				))}
			</div>

			<div style={css.statBox}>
				<div style={css.statLabel}>Разброс (std) оценки advantage между группами</div>
				<div style={css.statVal}>{data.stdAdv.toFixed(3)}</div>
				<div style={css.barTrack}><div style={css.barFill(pct)} /></div>
			</div>

			<div style={css.note}>Больше rollout'ов на промпт — стабильнее оценка baseline, но и дороже: G сэмплов нужно сгенерировать и оценить на каждый промпт. DeepSeekMath (arXiv:2402.03300) остановилась на G=64.</div>
		</div>
	);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/article/GroupRolloutSimulator.tsx
git commit -m "Add GroupRolloutSimulator component for RLHF/DPO/GRPO article"
```

---

### Task 5: `KlPenaltySlider.tsx`

**Files:**
- Create: `src/components/article/KlPenaltySlider.tsx`

**Interfaces:**
- Produces: default export React component, no props. Used in article as `<KlPenaltySlider client:visible />`.

- [ ] **Step 1: Write the component**

```tsx
import { useState } from 'react';

type Point = { beta: number; label: string; source: string; confidence: 'primary' | 'secondary'; color: string; note: string };

// Три реальных значения β из трёх разных пейперов — не непрерывная кривая одного
// эксперимента (её никто не публиковал в сопоставимом виде между алгоритмами).
const POINTS: Point[] = [
	{ beta: 0.001, label: 'DeepSeek-R1-Zero', source: 'arXiv:2501.12948', confidence: 'secondary', color: '#c946ff', note: 'Значение по вторичным источникам (пересказы пейпера), не подтверждено прямой выдержкой из PDF в этой сессии.' },
	{ beta: 0.02, label: 'InstructGPT (PPO)', source: 'arXiv:2203.02155', confidence: 'secondary', color: '#3b82f6', note: 'Широкий консенсус вторичных источников про гиперпараметры RLHF-рецепта InstructGPT, не вычитано напрямую из таблицы пейпера в этой сессии.' },
	{ beta: 0.04, label: 'DeepSeekMath (GRPO)', source: 'arXiv:2402.03300', confidence: 'primary', color: '#8b5cf6', note: 'Подтверждено прямой выдержкой из текста пейпера.' },
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
	betaBox: (color: string) => ({
		padding: '1rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: `2px solid ${color}`,
		marginBottom: '0.75rem',
	} as React.CSSProperties),
	betaVal: (color: string) => ({
		fontSize: '1.6rem',
		fontWeight: 900,
		color,
		fontFamily: 'monospace',
	} as React.CSSProperties),
	betaSource: {
		fontSize: '0.78rem',
		color: 'var(--text-muted)',
		marginTop: '0.2rem',
	} as React.CSSProperties,
	badge: (confidence: 'primary' | 'secondary') => ({
		display: 'inline-block',
		marginLeft: '0.5rem',
		padding: '0.1rem 0.5rem',
		borderRadius: '100px',
		fontSize: '0.68rem',
		fontWeight: 700,
		background: confidence === 'primary' ? '#22c55e20' : '#f59e0b20',
		color: confidence === 'primary' ? '#22c55e' : '#f59e0b',
	} as React.CSSProperties),
	note: {
		fontSize: '0.8rem',
		color: 'var(--text-muted)',
		lineHeight: 1.6,
	} as React.CSSProperties,
};

export default function KlPenaltySlider() {
	const [idx, setIdx] = useState(2);
	const p = POINTS[idx];

	return (
		<div style={css.wrap}>
			<div style={css.title}>🎚️ Коэффициент β: насколько туго держим поводок</div>
			<div style={css.desc}>β — вес KL-штрафа против reference-модели в объективе. Больше β — политика держится ближе к исходной модели (безопаснее, меньше reward hacking, меньше улучшение). Меньше β — больше свободы для улучшения, больше риск переоптимизации под несовершенную награду.</div>

			<div style={css.tabs}>
				{POINTS.map((pt, i) => (
					<button key={pt.label} style={css.tab(idx === i, pt.color)} onClick={() => setIdx(i)}>{pt.label}</button>
				))}
			</div>

			<div style={css.betaBox(p.color)}>
				<span style={css.betaVal(p.color)}>β = {p.beta}</span>
				<span style={css.badge(p.confidence)}>{p.confidence === 'primary' ? 'из первоисточника' : 'вторичный источник'}</span>
				<div style={css.betaSource}>{p.source}</div>
			</div>

			<div style={css.note}>{p.note}</div>
		</div>
	);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/article/KlPenaltySlider.tsx
git commit -m "Add KlPenaltySlider component for RLHF/DPO/GRPO article"
```

---

### Task 6: `AlgorithmPickerQuiz.tsx`

**Files:**
- Create: `src/components/article/AlgorithmPickerQuiz.tsx`

**Interfaces:**
- Produces: default export React component, no props. Used in article as `<AlgorithmPickerQuiz client:visible />`.

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
		question: 'Какая у тебя награда?',
		options: [
			{ label: 'Есть чёткий верификатор (математика, код, юнит-тесты)', next: 1 },
			{ label: 'Только human-preference данные (какой ответ лучше)', next: 2 },
		],
	},
	1: {
		question: 'Важна максимальная эффективность на серьёзном RL-бюджете?',
		options: [
			{ label: 'Да, тренирую с нуля, есть compute на много rollout\'ов', next: 'grpo' },
			{ label: 'Нужна стабильность — GRPO у меня коллапсирует/буксует', next: 'dapo' },
		],
	},
	2: {
		question: 'Нужна ли online RL-петля (генерация во время тренировки)?',
		options: [
			{ label: 'Нет, есть готовый датасет пар предпочтений', next: 'dpo' },
			{ label: 'Да, готов тренировать критика и держать RL-петлю', next: 'ppo' },
		],
	},
};

const results: Record<string, Result> = {
	grpo: { name: 'GRPO', color: '#8b5cf6', why: 'Group-relative advantage без критика — дешевле по памяти, чем PPO, и подходит именно туда, где reward можно честно проверить правилом (DeepSeekMath, arXiv:2402.03300).' },
	dapo: { name: 'DAPO', color: '#f59e0b', why: 'Тот же GRPO, но с Clip-Higher и Dynamic Sampling против entropy collapse и нулевого градиента на «слишком лёгких» промптах (ByteDance, arXiv:2503.14476).' },
	dpo: { name: 'DPO', color: '#22c55e', why: 'Обычный supervised loss на парах предпочтений — не нужна ни reward-модель, ни RL-петля, ни критик (Rafailov et al., arXiv:2305.18290).' },
	ppo: { name: 'PPO', color: '#3b82f6', why: 'Классика RLHF: critic-сеть даёт per-step baseline, есть online-исследование — цена: держать в памяти ещё одну модель того же размера (Schulman et al., arXiv:1707.06347).' },
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
		fontSize: '1.05rem',
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

export default function AlgorithmPickerQuiz() {
	const [current, setCurrent] = useState<number | string>(0);
	const step = typeof current === 'number' ? steps[current] : null;
	const result = typeof current === 'string' ? results[current] : null;

	return (
		<div style={css.wrap}>
			<div style={css.title}>🧭 Какой алгоритм выбрать</div>
			<div style={css.desc}>Пара вопросов про твою задачу — получи рекомендацию из PPO/DPO/GRPO/DAPO.</div>

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

- [ ] **Step 2: Commit**

```bash
git add src/components/article/AlgorithmPickerQuiz.tsx
git commit -m "Add AlgorithmPickerQuiz component for RLHF/DPO/GRPO article"
```

---

### Task 7: `ScaleRankingFlip.tsx`

**Files:**
- Create: `src/components/article/ScaleRankingFlip.tsx`

**Interfaces:**
- Produces: default export React component, no props. Used in article as `<ScaleRankingFlip client:visible />`.

- [ ] **Step 1: Write the component**

```tsx
import { useState } from 'react';

type ScaleKey = '1.5B' | '7B';

// Все числа — прямая выдержка из arXiv:2603.19335 ("Do Post-Training Algorithms
// Actually Differ? A Controlled Study Across Model Scales Uncovers Scale-Dependent
// Ranking Inversions", Xiaoyi Li, 2026). Один автор, свежая работа — не устоявшийся
// консенсус, а конкретное недавнее исследование; так и подать в тексте статьи.
const SCALES: Record<ScaleKey, { bars: { name: string; score: number; color: string }[]; note: string }> = {
	'1.5B': {
		bars: [
			{ name: 'SGRPO (online RL)', score: 58.0, color: '#8b5cf6' },
			{ name: 'DPO', score: 49.1, color: '#22c55e' },
			{ name: 'SimPO', score: 38.7, color: '#ef4444' },
		],
		note: 'На 1.5B лидирует online RL (SGRPO) — на 8.9 п.п. выше DPO. SimPO — на последнем месте.',
	},
	'7B': {
		bars: [
			{ name: 'SimPO', score: 85.8, color: '#ef4444' },
		],
		note: 'На 7B SimPO — уже лучший результат (85.8%, рост с 38.7% на 1.5B). Ранжирование остальных алгоритмов на 7B пейпер не приводит в разбираемом фрагменте — но сам разворот SimPO с последнего места на первое уже показывает: рейтинг зависит от масштаба, а не фиксирован раз и навсегда.',
	},
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
	barRow: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.6rem',
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	barLabel: {
		width: '160px',
		flexShrink: 0,
		fontSize: '0.8rem',
		color: 'var(--text)',
		fontWeight: 600,
	} as React.CSSProperties,
	barTrack: {
		flex: 1,
		height: '20px',
		borderRadius: '5px',
		background: 'var(--bg-secondary)',
		overflow: 'hidden',
	} as React.CSSProperties,
	barFill: (pct: number, color: string) => ({
		width: `${pct}%`,
		height: '100%',
		background: color,
	} as React.CSSProperties),
	barValue: {
		width: '56px',
		flexShrink: 0,
		fontSize: '0.8rem',
		fontWeight: 700,
		color: 'var(--text)',
		textAlign: 'right' as const,
	} as React.CSSProperties,
	note: {
		marginTop: '0.75rem',
		fontSize: '0.8rem',
		color: 'var(--text-muted)',
		lineHeight: 1.6,
	} as React.CSSProperties,
	statsGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(3, 1fr)',
		gap: '0.5rem',
		marginTop: '1rem',
	} as React.CSSProperties,
	statBox: {
		padding: '0.6rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		textAlign: 'center' as const,
	} as React.CSSProperties,
	statVal: {
		fontSize: '1.1rem',
		fontWeight: 900,
		color: 'var(--text)',
	} as React.CSSProperties,
	statLabel: {
		fontSize: '0.68rem',
		color: 'var(--text-muted)',
		marginTop: '0.15rem',
	} as React.CSSProperties,
};

export default function ScaleRankingFlip() {
	const [scale, setScale] = useState<ScaleKey>('1.5B');
	const data = SCALES[scale];
	const maxScore = Math.max(...data.bars.map((b) => b.score));

	return (
		<div style={css.wrap}>
			<div style={css.title}>📐 Рейтинг алгоритмов переворачивается с масштабом</div>
			<div style={css.desc}>GSM8K, из arXiv:2603.19335 (одноавторская работа, 2026, ~240 прогонов обучения на 4 масштабах 0.5B–7B). Переключи масштаб модели.</div>

			<div style={css.tabs}>
				{(['1.5B', '7B'] as ScaleKey[]).map((s) => (
					<button key={s} style={css.tab(scale === s)} onClick={() => setScale(s)}>{s}</button>
				))}
			</div>

			{data.bars.map((b) => (
				<div key={b.name} style={css.barRow}>
					<span style={css.barLabel}>{b.name}</span>
					<div style={css.barTrack}><div style={css.barFill((b.score / maxScore) * 100, b.color)} /></div>
					<span style={css.barValue}>{b.score}%</span>
				</div>
			))}

			<div style={css.note}>{data.note}</div>

			<div style={css.statsGrid}>
				<div style={css.statBox}><div style={css.statVal}>≈50 п.п.</div><div style={css.statLabel}>дисперсии объясняет масштаб модели</div></div>
				<div style={css.statBox}><div style={css.statVal}>≈9–10 п.п.</div><div style={css.statLabel}>объясняет online vs offline</div></div>
				<div style={css.statBox}><div style={css.statVal}>≈1 п.п.</div><div style={css.statLabel}>объясняет конкретный вариант лосса</div></div>
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/article/ScaleRankingFlip.tsx
git commit -m "Add ScaleRankingFlip component for RLHF/DPO/GRPO article"
```

---

### Task 8: Write the article `rlhf-dpo-grpo.mdx`

**Files:**
- Create: `src/content/blog/rlhf-dpo-grpo.mdx`

**Interfaces:**
- Consumes: all 7 components from Tasks 1–7 (default exports, no props, each used as `<ComponentName client:visible />`), plus the existing `src/components/article/Mermaid.tsx` (`<Mermaid chart={string} caption={string?} />`), `src/components/article/Callout.astro` (`<Callout type="fire|warning" title="...">...</Callout>`), `src/components/article/StepList.astro` (`<StepList steps={[{num,text}]} />`).

- [ ] **Step 1: Write the full article**

```mdx
---
title: 'Пост-тренинг LLM: RLHF → DPO → GRPO 🎯🧮'
description: 'Как LLM учат вести себя хорошо после претрейна — эволюция четырёх алгоритмов за три года: PPO с критик-сетью (InstructGPT, 2022), DPO без RL-петли (2023), GRPO без критика (DeepSeekMath, 2024) и DAPO, который чинит баги ванильного GRPO (2025). Формулы из первоисточников, NumPy-проверенный численный пример.'
pubDate: 'Jul 29 2026'
category: 'фундамент'
---

import Callout from '../../components/article/Callout.astro';
import StepList from '../../components/article/StepList.astro';
import Mermaid from '../../components/article/Mermaid';
import AdvantageCompare from '../../components/article/AdvantageCompare';
import CriticVramCalculator from '../../components/article/CriticVramCalculator';
import PostTrainingTimeline from '../../components/article/PostTrainingTimeline';
import GroupRolloutSimulator from '../../components/article/GroupRolloutSimulator';
import KlPenaltySlider from '../../components/article/KlPenaltySlider';
import AlgorithmPickerQuiz from '../../components/article/AlgorithmPickerQuiz';
import ScaleRankingFlip from '../../components/article/ScaleRankingFlip';

Ну чё, малютки, вот словосочетание, которое встречается в каждой второй статье этого блога про конкретную модель: «RL post-training». У [Kimi K3](/blog/kimi-k3/) — MuonClip и агентский RL. У DeepSeek-R1 — GRPO. Каждый раз мимоходом, каждый раз без объяснения, что там вообще происходит внутри. Пора закрыть эту дыру: как LLM вообще учат «вести себя хорошо» после претрейна, и почему индустрия за три года дошла от PPO с отдельной critic-сетью до GRPO, которому критик вообще не нужен.

<Callout type="fire" title="Суть за 10 секунд">
Пост-тренинг LLM — не одна методика, а эволюция четырёх. **PPO** (2022, InstructGPT) — классический RL с отдельной critic-сетью, которая оценивает, насколько хорош текущий ответ. **DPO** (2023) обходит RL-петлю вообще: обычный supervised loss на паре «хороший/плохой» ответ. **GRPO** (2024, DeepSeekMath) возвращает RL, но убирает критика — baseline считается статистикой по группе из G rollout'ов на один промпт. **DAPO** (2025, ByteDance) чинит конкретные баги ванильного GRPO: entropy collapse и промпты с нулевым градиентом.
</Callout>

<PostTrainingTimeline client:visible />

<Mermaid client:visible chart={`flowchart LR
    SFT[SFT] --> RM[Reward Model]
    RM --> PPO["PPO\ncritic + reward model"]
    SFT --> DPO["DPO\nпрямо на парах предпочтений"]
    SFT --> GRPO["GRPO\ngroup rollouts, без критика"]
    GRPO --> DAPO["DAPO\nClip-Higher + Dynamic Sampling"]`} caption="Структурная карта: от одного SFT-чекпоинта — три разных пути к пост-тренингу." />

---

## Часть 1: RLHF по классике — PPO и его критик

Классический RLHF-рецепт зафиксировал InstructGPT (Ouyang et al., arXiv:2203.02155): SFT → обучаем отдельную reward-модель на человеческих предпочтениях → гоняем PPO, максимизируя эту награду с KL-штрафом против reference-модели, чтобы политика не улетала слишком далеко от того, с чего начала.

Сердце PPO — клипованный surrogate-объектив (Schulman et al., arXiv:1707.06347):

```
L^CLIP(θ) = E_t[ min( r_t(θ)·Â_t, clip(r_t(θ), 1−ε, 1+ε)·Â_t ) ]
r_t(θ) = π_θ(a_t|s_t) / π_θ_old(a_t|s_t),  ε = 0.2
```

Клип не даёт одному шагу обновления политики уйти слишком далеко от старой версии — обрезает как чрезмерный рост вероятности удачного действия, так и чрезмерное падение вероятности неудачного. Но вся эта конструкция держится на advantage-оценке Â_t, а её без критика не посчитать: GAE (generalized advantage estimation) берёт TD-остаток δ_t = r_t + γV(s_{t+1}) − V(s_t) и сглаживает по нескольким шагам. V(s) — это отдельная **обучаемая критик-сеть**, которая должна предсказывать, «насколько хорошим в среднем окажется состояние», чтобы дать честный baseline для сравнения.

Проблема практическая, не концептуальная: критик — это ещё одна модель, обычно сопоставимого размера с самой policy-моделью, которая тренируется параллельно и должна постоянно жить в VRAM.

<CriticVramCalculator client:visible />

---

## Часть 2: DPO — а зачем нам вообще RL

DPO (Rafailov et al., arXiv:2305.18290) заходит с неожиданной стороны: что если вообще не тренировать отдельную reward-модель и не гонять RL-петлю, а свести задачу к обычному supervised loss?

```
L_DPO(π_θ; π_ref) = −E_(x,y_w,y_l)~D[ log σ( β·log(π_θ(y_w|x)/π_ref(y_w|x)) − β·log(π_θ(y_l|x)/π_ref(y_l|x)) ) ]
```

Фокус в переопределении: если подставить `r(x,y) = β·log(π_θ(y|x)/π_ref(y|x)) + β·log Z(x)` в модель предпочтений Брэдли-Терри, нормировочная константа Z(x) сокращается в паре, и получается loss, который вообще не требует явной reward-модели — сама политика неявно **и есть** награда. На датасете из пар «выбранный/отвергнутый» ответ (y_w/y_l) это обучение прямое: никакой генерации во время тренировки, никакого критика, никакой RL-петли.

Что теряется: DPO работает строго на офлайн-данных — какие пары ответов были собраны, такие и обучают. Никакого online-исследования, никакой генерации новых кандидатов во время обучения. Здесь стоит честная оговорка: сам пейпер DPO заявляет только качественно, что метод «стабилен, производителен и вычислительно лёгок» — точных цифр экономии compute/памяти относительно полного RLHF в пейпере нет, несмотря на то, что это заявление часто пересказывают как количественное.

---

## Часть 3: GRPO — RL возвращается, критик — нет

GRPO — детище DeepSeekMath (arXiv:2402.03300), а не DeepSeek-R1 (это частая путаница): именно здесь механизм описан впервые. Идея: вместо того чтобы тренировать критика, который предсказывает baseline для одного rollout'а, сэмплируем сразу **G rollout'ов на один и тот же промпт** и берём статистику самой группы как baseline.

```
J_GRPO(θ) = E[ (1/G)·Σ_i (1/|o_i|)·Σ_t{ min[ρ_i,t·Â_i,t, clip(ρ_i,t, 1−ε, 1+ε)·Â_i,t] − β·D_KL[π_θ‖π_ref] } ]
Â_i = (r_i − mean(r_1..G)) / std(r_1..G)
```

ρ_i,t — тот же ratio, что и r_t(θ) в PPO. Разница — в advantage: никакой отдельной сети, только z-score награды внутри своей группы. DeepSeekMath использует G=64 и KL-коэффициент β=0.04.

<AdvantageCompare client:visible />

<GroupRolloutSimulator client:visible />

DeepSeek-R1 (arXiv:2501.12948) взял ровно этот механизм и прогнал его на масштабе продакшена: AIME 2024 pass@1 у DeepSeek-R1-Zero вырос с **15.6% до 71.0%** за RL-тренировку одним GRPO, без единого шага SFT перед этим.

Смежный кейс из того же семейства идей — как эволюционирует не только RL-алгоритм, но и сам оптимизатор вокруг него. В Kimi K2 использовался **MuonClip**: Muon плюс QK-Clip против взрыва attention-логитов. В [Kimi K3](/blog/kimi-k3/) он превращается в **Per-Head Muon** — тот же принцип, применённый к каждой attention-голове по отдельности (по независимым разборам архитектуры, официально Moonshot это отдельно не расписывает). RL-петля и оптимизатор, который её тренирует, эволюционируют параллельно, не только сам loss.

<KlPenaltySlider client:visible />

---

## Часть 4: DAPO — что было не так в ванильном GRPO

ByteDance (arXiv:2503.14476) нашёл в GRPO два конкретных структурных бага. Первый — **entropy collapse**: энтропия политики быстро падает, сэмплированные ответы одной группы становятся почти идентичными друг другу. Второй — **промпты с нулевым градиентом**: если все G ответов на промпт получили одинаковую награду (например, все правильные), то `std(r_1..G) = 0`, advantage для всей группы равен нулю, и градиент для этого промпта попросту исчезает — впустую потраченный compute.

Фикс называется DAPO — Decoupled Clip and Dynamic Sampling Policy Optimization, но конкретная техника расширения клипа в пейпере называется **Clip-Higher**, а не «decoupled clip» (это словосочетание — только часть названия акронима): раздельные нижняя и верхняя границы клипа, ε_low=0.2 и ε_high=0.28, вместо одной симметричной ε. **Dynamic Sampling** — второй фикс, честно названный именно так: пересэмплирует и отфильтровывает промпты, где все ответы получили одинаковую награду (`0 < |верных ответов| < G`), поддерживая эффективный размер батча вместо того, чтобы впустую тратить compute на нулевой градиент.

Пейпер добавляет ещё две техники (Token-Level Policy Gradient Loss, Overlong Reward Shaping) — за скобками этой статьи, но вот полная траектория ablation на AIME 2024 (Qwen2.5-32B):

<QuantCard title="30 → 50" badge="AIME 2024, ablation DAPO" badgeColor="#f59e0b">
Ванильный GRPO — 30. + Overlong Filtering — 36. + Clip-Higher — 38. + Soft Overlong Punishment — 41. + Token-level Loss — 42. + Dynamic Sampling (полный DAPO) — **50**. Итог обгоняет DeepSeek-R1-Zero-Qwen-32B (47) при **половине** шагов тренировки.
</QuantCard>

---

## Часть 5: Споры

Два свежих пейпера 2026 года ставят под вопрос удобные обобщения из частей выше.

**Рейтинг алгоритмов зависит от масштаба.** «Do Post-Training Algorithms Actually Differ?» (arXiv:2603.19335, Xiaoyi Li) прогнал ~240 обучающих ранов на 4 масштабах модели (0.5B–7B) и 8 алгоритмах. Находка: на 1.5B лидирует online RL (в терминологии пейпера — SGRPO), на 7B резко вырывается вперёд SimPO (вариант из DPO-семейства) — с 38.7% на 1.5B до 85.8% на 7B на GSM8K. Разложение дисперсии результата: масштаб модели объясняет ≈50 процентных пунктов разброса, тип тренировки (online vs offline) — ≈9–10 п.п., а конкретный вариант лосс-функции — только ≈1 п.п. Это одноавторская, очень свежая работа — не устоявшийся консенсус, а конкретное недавнее исследование, которое стоит воспринимать как есть, а не как окончательный вердикт.

<ScaleRankingFlip client:visible />

**GRPO — не DPO, но «структурно родственен».** «It Takes Two: Your GRPO Is Secretly DPO» (arXiv:2510.00977, актуальная версия — май 2026) заявляет не математическую эквивалентность, а то, что эффективность GRPO объясняется его неявным контрастивным объективом — тем же механизмом снижения дисперсии через control variate, что используют DPO-подобные методы. Практическое следствие — **2-GRPO**: минимальный вариант с группой всего из 2 rollout'ов вместо 16, который сохраняет **97.6%** качества полного 16-GRPO, потратив только **12.5%** rollout'ов и **21%** времени тренировки. «Структурно родственен» — точная формулировка; «эквивалентен» была бы преувеличением того, что на самом деле утверждает пейпер.

<AlgorithmPickerQuiz client:visible />

---

## TL;DR

<StepList steps={[
	{ num: "1", text: "<strong>PPO</strong> (InstructGPT, arXiv:2203.02155): SFT → reward model → RL с отдельной critic-сетью для advantage (GAE), клип ε=0.2" },
	{ num: "2", text: "<strong>DPO</strong> (arXiv:2305.18290): reward становится implicit через Bradley-Terry — ни отдельной reward-модели, ни RL-петли, ни критика. Пейпер не даёт количественной оценки экономии compute" },
	{ num: "3", text: "<strong>GRPO</strong> (DeepSeekMath, arXiv:2402.03300): advantage = z-score награды внутри группы из G=64 rollout'ов, без критика вообще, β=0.04. DeepSeek-R1 поднял AIME 2024 pass@1 с 15.6% до 71.0% этим механизмом" },
	{ num: "4", text: "<strong>DAPO</strong> (ByteDance, arXiv:2503.14476): чинит entropy collapse и нулевой градиент в GRPO через Clip-Higher (ε_low=0.2/ε_high=0.28) и Dynamic Sampling — 50 против 47 у R1-Zero-Qwen-32B, за половину шагов" },
	{ num: "5", text: "<strong>Споры:</strong> рейтинг алгоритмов переворачивается с масштабом модели (arXiv:2603.19335); GRPO структурно родственен DPO через control variate, но не буквально эквивалентен (arXiv:2510.00977)" },
]} />

Четыре алгоритма — не смена мод, а последовательная охота за одним и тем же: как получить честный сигнал для градиента дешевле и стабильнее, чем в прошлый раз. PPO решил задачу ценой критика. DPO выкинул RL-петлю целиком. GRPO вернул RL, но выкинул критика. DAPO залатал то, что GRPO сломал по пути. Следующий шаг, скорее всего, уже пишется как пейпер прямо сейчас. 🫡

---

### Источники

1. [Proximal Policy Optimization Algorithms — Schulman et al. (arXiv:1707.06347)](https://arxiv.org/abs/1707.06347)
2. [Training language models to follow instructions with human feedback — Ouyang et al. (arXiv:2203.02155)](https://arxiv.org/abs/2203.02155)
3. [Direct Preference Optimization — Rafailov et al. (arXiv:2305.18290)](https://arxiv.org/abs/2305.18290)
4. [DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models (arXiv:2402.03300)](https://arxiv.org/abs/2402.03300)
5. [DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning (arXiv:2501.12948)](https://arxiv.org/abs/2501.12948)
6. [DAPO: An Open-Source LLM Reinforcement Learning System at Scale (arXiv:2503.14476)](https://arxiv.org/abs/2503.14476)
7. [Do Post-Training Algorithms Actually Differ? A Controlled Study Across Model Scales Uncovers Scale-Dependent Ranking Inversions (arXiv:2603.19335)](https://arxiv.org/abs/2603.19335)
8. [It Takes Two: Your GRPO Is Secretly DPO (arXiv:2510.00977)](https://arxiv.org/abs/2510.00977)
9. [Kimi K3: open-weight модель обгоняет Claude Opus 4.8](/blog/kimi-k3/)
```

- [ ] **Step 2: Verify frontmatter and imports compile**

Run: `npm run build 2>&1 | tail -40`
Expected: build completes with no errors mentioning `rlhf-dpo-grpo.mdx` or the 7 new component files. (Full build verification happens in Task 9 — this step is a quick sanity check right after writing the file, since Task 9 also covers browser checks.)

- [ ] **Step 3: Commit**

```bash
git add src/content/blog/rlhf-dpo-grpo.mdx
git commit -m "Add RLHF/DPO/GRPO post-training article"
```

---

### Task 9: Build and browser verification

**Files:** none created — verification only.

**Interfaces:**
- Consumes: the full article and all 7 components from Tasks 1–8.

- [ ] **Step 1: Run the production build**

Run: `npm run build 2>&1 | tail -40`
Expected: `[build] Complete!` with no errors, and the article listed among the built pages (page count increases by 1 vs the pre-article baseline).

- [ ] **Step 2: Start the preview server**

```bash
npm run preview &
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/blog/rlhf-dpo-grpo/
```
Expected: `200`.

- [ ] **Step 3: Browser check — all 8 interactive elements**

Using chrome-devtools MCP tools (`navigate_page`, `take_screenshot`, `evaluate_script`, `list_console_messages`): navigate to `http://localhost:4321/blog/rlhf-dpo-grpo/`, then for each of the 8 elements (Mermaid pipeline diagram, `AdvantageCompare`, `CriticVramCalculator`, `PostTrainingTimeline`, `GroupRolloutSimulator`, `KlPenaltySlider`, `AlgorithmPickerQuiz`, `ScaleRankingFlip`): scroll it into view, screenshot it, and for the interactive ones (all except the timeline and Mermaid diagram) click through at least one tab/button/quiz-branch and screenshot the changed state.

Expected: every component renders with correct data (numbers match the source arrays in Tasks 1–7 exactly), tab/button switches visibly change displayed content, no layout breakage, no components overlapping or empty.

- [ ] **Step 4: Console error check**

Run `list_console_messages` with `types: ["error", "warn"]` after the page has fully loaded and after interacting with each component.
Expected: no console errors or warnings (an empty result).

- [ ] **Step 5: Stop the preview server**

```bash
pkill -f "astro preview" || true
```

- [ ] **Step 6: `/unslop` pass**

Run the `unslop` skill (`--preset=crisp`) against `src/content/blog/rlhf-dpo-grpo.mdx`. Fix any flagged issues inline, but preserve every formula, arXiv ID, and number verbatim — this article's entire value is factual precision. If the skill's em-dash-overuse rubric conflicts with the blog's established house style (heavy em-dash usage is consistent across every published article in this blog), follow house style over the generic rubric, same call made for `kimi-k3.mdx` in this session.

- [ ] **Step 7: Commit any `/unslop` fixes**

```bash
git add src/content/blog/rlhf-dpo-grpo.mdx
git commit -m "Polish RLHF/DPO/GRPO article prose"
```

(Skip this commit if `/unslop` made no changes.)

---

## Self-Review Notes

- **Spec coverage:** all 5 content parts, all 8 interactive components, the Kimi K2→K3 MuonClip cross-link, and the two controversy papers from `docs/superpowers/specs/2026-07-29-rlhf-dpo-grpo-design.md` are covered — Tasks 1–7 (components) + Task 8 (article prose wiring all of it together) + Task 9 (verification, matching the spec's "Критерий готовности").
- **Placeholder scan:** no TBD/TODO strings; every numeric claim in every component and in the article prose traces to a cited arXiv ID or is explicitly labeled as this plan's own illustrative arithmetic (VRAM calculator) or NumPy simulation (advantage/group-rollout components).
- **Type consistency:** every component is a parameterless default export matching the `<ComponentName client:visible />` usage in Task 8's MDX — verified names match exactly (`AdvantageCompare`, `CriticVramCalculator`, `PostTrainingTimeline`, `GroupRolloutSimulator`, `KlPenaltySlider`, `AlgorithmPickerQuiz`, `ScaleRankingFlip`).
- **heroImage** intentionally omitted from Task 8's frontmatter, per Global Constraints and established pattern from every prior article this session — deferred to a manual follow-up after the user reviews the article.
