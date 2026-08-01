# Diffusion LLMs Article Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a new "фундамент" blog article `src/content/blog/diffusion-llms.mdx` explaining how diffusion (masked-denoising) LLMs generate text non-autoregressively, why they break the standard KV-cache, the market players (Mercury 2, Celeris-1, NVIDIA Nemotron TwoTower), and a claims-vs-independent-benchmark reality check — with 4 interactive React components, all facts primary-sourced.

**Architecture:** One MDX article importing 4 new one-off React components (`client:visible`), following the article-component convention established across every prior article: inline `css` object typed `React.CSSProperties`, CSS custom properties for theming, no new npm dependencies, default export with no props. KaTeX (`$$`) is already wired into the MDX pipeline (used by `rlhf-dpo-grpo.mdx`), so block/inline math renders natively.

**Tech Stack:** Astro 5, React 19, TypeScript, existing KaTeX (remark-math/rehype-katex).

## Global Constraints

- Category: `'фундамент'`. Slug: `diffusion-llms`. File: `src/content/blog/diffusion-llms.mdx`.
- Voice: Russian, dense, direct, light irony — match `src/content/blog/speculative-decoding.mdx` and `src/content/blog/kv-cache.mdx`.
- Every number/formula below is primary-verified (direct fetch of the source paper/vendor page) unless explicitly marked secondary/hedged in the prose itself.
- **Celeris hedges (binding):** Artificial Analysis's *measured* throughput (2053 tok/s) is HIGHER than the press-release claim (1664 tok/s) — never write "vendor lied about speed"; the real gap is the low Intelligence Index (12, #46/72). AA does **not** list Celeris-1 as a diffusion model, but does **not** explicitly declare it non-diffusion either — write "не значится у Artificial Analysis как diffusion-модель" / "AA не относит её к diffusion", NEVER "AA прямо назвала её не-diffusion". The press-release specifics (75.9% MMLU-Pro, 158ms, "24× faster than GPT-5") are the vendor's UNVERIFIED claims — always frame as "заявляет"/"по пресс-релизу", never as established fact.
- **Mercury caveat (binding):** Mercury 2's "1000+ tok/s" is a cross-GPU marketing floor from Inception's site; the hard hardware-attributed numbers (1109 tok/s Mini / 737 tok/s Small on H100, "up to 10×") come from the *original* Mercury paper (arXiv:2506.17298), not Mercury 2 — keep these attributions distinct. Mercury 2's exact release date is unconfirmed — say "лето 2026" / "конец июля 2026", not a hard date.
- **Nemotron framing (binding):** NVIDIA's July-1-2026 release is **Nemotron-Labs-TwoTower** (arXiv:2606.26493) — a *frozen AR context tower + trainable diffusion denoiser*, built on the Nemotron-3-Nano-30B backbone, denoiser trained on ~2.1T tokens. It is "diffusion-on-an-AR-backbone", NOT diffusion-from-scratch. The 2.42× throughput / 98.7%-quality figures are secondary (MarkTechPost) — hedge as "по разбору MarkTechPost" unless re-confirmed against the arXiv PDF.
- **AR baseline caveat (binding):** the AR throughput baseline (~193.5 tok/s for gpt-oss-120b, measured by Artificial Analysis; ~100-200 tok/s range) must carry the caveat that throughput depends heavily on model size, batch/concurrency, and hardware — no single "AR = Y tok/s" number is meaningful without its model+hardware+batch context.
- No new npm dependencies. No `heroImage` in frontmatter — deferred to a manual follow-up.
- `client:visible` on every new interactive component.
- Colors (reuse consistently across all 4 components): autoregressive = `#3b82f6` (blue), diffusion = `#8b5cf6` (purple), vendor-claimed = `#f59e0b` (amber), independently-measured = `#22c55e` (green).

---

### Task 1: `DenoisingPlayer.tsx` (anchor component)

**Files:**
- Create: `src/components/article/DenoisingPlayer.tsx`

**Interfaces:**
- Produces: default export React component, no props. Used in article as `<DenoisingPlayer client:visible />`.

- [ ] **Step 1: Write the component**

```tsx
import { useEffect, useState } from 'react';

// Иллюстративная демка механики, не воспроизведение конкретной модели: 8 «токенов»,
// раскрываемых за проходы модели (forward passes). Diffusion раскрывает по 2 токена за
// проход в неслева-направо порядке (confidence-ordered), укладываясь в 4 прохода;
// авторегрессия — строго по одному токену слева направо, 8 проходов. Суть: параллельная
// выдача токенов у diffusion против одного-за-проход у AR.
const TOKENS = ['диффузия', 'раскрывает', 'сразу', 'много', 'токенов', 'за', 'четыре', 'прохода'];

// schedule[p] — индексы токенов, раскрываемые на p-м проходе diffusion (p от 1). Порядок
// намеренно не слева-направо, чтобы показать: позиция раскрытия не привязана к позиции в тексте.
const DIFFUSION_SCHEDULE: number[][] = [
	[0, 4], // проход 1
	[1, 6], // проход 2
	[3, 7], // проход 3
	[2, 5], // проход 4
];
const DIFFUSION_PASSES = DIFFUSION_SCHEDULE.length; // 4
const AR_PASSES = TOKENS.length; // 8
const MAX_PASS = AR_PASSES; // общий счётчик проходов идёт до 8

// Множество индексов, раскрытых diffusion к проходу p (объединение расписания за 1..p).
function diffusionRevealed(pass: number): Set<number> {
	const s = new Set<number>();
	for (let p = 0; p < Math.min(pass, DIFFUSION_PASSES); p++) {
		for (const idx of DIFFUSION_SCHEDULE[p]) s.add(idx);
	}
	return s;
}

// AR раскрывает индекс i на проходе i+1: к проходу p раскрыты индексы 0..p-1.
function arRevealed(pass: number): Set<number> {
	const s = new Set<number>();
	for (let i = 0; i < Math.min(pass, AR_PASSES); i++) s.add(i);
	return s;
}

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
	lane: {
		marginBottom: '1.1rem',
	} as React.CSSProperties,
	laneHead: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'baseline',
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	laneLabel: (color: string) => ({
		fontSize: '0.82rem',
		fontWeight: 800,
		color,
	} as React.CSSProperties),
	lanePasses: {
		fontSize: '0.78rem',
		color: 'var(--text-muted)',
		fontVariantNumeric: 'tabular-nums' as const,
	} as React.CSSProperties,
	slots: {
		display: 'flex',
		flexWrap: 'wrap' as const,
		gap: '0.4rem',
	} as React.CSSProperties,
	slot: (revealed: boolean, color: string) => ({
		padding: '0.4rem 0.6rem',
		borderRadius: '6px',
		fontSize: '0.82rem',
		fontWeight: 600,
		fontFamily: revealed ? 'inherit' : 'monospace',
		border: `1px solid ${revealed ? color : 'var(--border)'}`,
		background: revealed ? `${color}18` : 'var(--bg-secondary)',
		color: revealed ? 'var(--text)' : 'var(--text-muted)',
		transition: 'all 0.2s ease',
		minWidth: '2ch',
		textAlign: 'center' as const,
	} as React.CSSProperties),
	ctrlRow: {
		display: 'flex',
		gap: '0.5rem',
		marginTop: '0.5rem',
	} as React.CSSProperties,
	ctrlBtn: {
		padding: '0.45rem 1rem',
		borderRadius: '100px',
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
		color: 'var(--text)',
		fontSize: '0.82rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
	} as React.CSSProperties,
	note: {
		marginTop: '0.9rem',
		fontSize: '0.8rem',
		color: 'var(--text-muted)',
		lineHeight: 1.6,
	} as React.CSSProperties,
};

export default function DenoisingPlayer() {
	const [pass, setPass] = useState(0);
	const [playing, setPlaying] = useState(false);

	useEffect(() => {
		if (!playing) return;
		if (pass >= MAX_PASS) { setPlaying(false); return; }
		const t = setTimeout(() => setPass((p) => p + 1), 900);
		return () => clearTimeout(t);
	}, [playing, pass]);

	const diff = diffusionRevealed(pass);
	const ar = arRevealed(pass);
	const isLast = pass >= MAX_PASS;
	const diffUsed = Math.min(pass, DIFFUSION_PASSES);
	const arUsed = Math.min(pass, AR_PASSES);

	return (
		<div style={css.wrap}>
			<div style={css.title}>🌫️ Denoising vs авторегрессия по проходам</div>
			<div style={css.desc}>
				Один «проход» — один forward модели. Diffusion раскрывает несколько токенов за проход (и не слева направо), авторегрессия — строго по одному слева направо. Жми «шаг» или «играть».
			</div>

			<div style={css.lane}>
				<div style={css.laneHead}>
					<span style={css.laneLabel('#8b5cf6')}>Diffusion (параллельно)</span>
					<span style={css.lanePasses}>проходов: {diffUsed} / {DIFFUSION_PASSES}</span>
				</div>
				<div style={css.slots}>
					{TOKENS.map((tok, i) => (
						<span key={i} style={css.slot(diff.has(i), '#8b5cf6')}>{diff.has(i) ? tok : '▓▓'}</span>
					))}
				</div>
			</div>

			<div style={css.lane}>
				<div style={css.laneHead}>
					<span style={css.laneLabel('#3b82f6')}>Авторегрессия (по одному)</span>
					<span style={css.lanePasses}>проходов: {arUsed} / {AR_PASSES}</span>
				</div>
				<div style={css.slots}>
					{TOKENS.map((tok, i) => (
						<span key={i} style={css.slot(ar.has(i), '#3b82f6')}>{ar.has(i) ? tok : '▓▓'}</span>
					))}
				</div>
			</div>

			<div style={css.ctrlRow}>
				<button style={css.ctrlBtn} onClick={() => { setPlaying(false); setPass((p) => Math.max(0, p - 1)); }} disabled={pass === 0}>← Назад</button>
				<button
					style={css.ctrlBtn}
					onClick={() => {
						if (playing) { setPlaying(false); return; }
						if (isLast) { setPass(0); setPlaying(true); return; }
						setPlaying(true);
					}}
				>
					{playing ? '⏸ Пауза' : isLast ? '↺ Сначала' : '▶ Играть'}
				</button>
				<button style={css.ctrlBtn} onClick={() => { setPlaying(false); setPass((p) => Math.min(MAX_PASS, p + 1)); }} disabled={isLast}>Шаг →</button>
			</div>

			<div style={css.note}>
				К 4-му проходу diffusion уже собрал всю фразу, авторегрессии нужно 8. Именно параллельная выдача токенов за проход даёт diffusion-моделям throughput — ценой того, что каждый проход тяжелее (нужно двунаправленное внимание по всей длине). Схема расписания здесь иллюстративная, у реальных моделей раскрытие идёт по уверенности предсказаний.
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Note on verification**

Nothing imports this component yet — it's wired into the article in Task 5. Task 6 ("Build and browser verification") is where compile and visual/animation correctness are verified (specifically: the animator must actually advance and reveal tokens, not sit static).

- [ ] **Step 3: Commit**

```bash
git add src/components/article/DenoisingPlayer.tsx
git commit -m "Add DenoisingPlayer component for diffusion LLMs article"
```

---

### Task 2: `KvCacheBreakage.tsx`

**Files:**
- Create: `src/components/article/KvCacheBreakage.tsx`

**Interfaces:**
- Produces: default export React component, no props. Used in article as `<KvCacheBreakage client:visible />`.

- [ ] **Step 1: Write the component**

```tsx
import { useState } from 'react';

type Mode = 'ar' | 'diffusion';

// Матрица внимания 6×6: строки = запрос (query), столбцы = ключ (key).
// AR: каузальная маска (нижнетреугольная) — токен видит только прошлое.
// Diffusion: полная (двунаправленная) — каждый токен видит всю последовательность.
const N = 6;

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
	gridWrap: {
		display: 'flex',
		gap: '1.25rem',
		flexWrap: 'wrap' as const,
		alignItems: 'flex-start',
	} as React.CSSProperties,
	grid: (n: number) => ({
		display: 'grid',
		gridTemplateColumns: `repeat(${n}, 1.6rem)`,
		gap: '3px',
	} as React.CSSProperties),
	cell: (active: boolean, color: string) => ({
		width: '1.6rem',
		height: '1.6rem',
		borderRadius: '4px',
		background: active ? color : 'var(--bg-secondary)',
		border: `1px solid ${active ? color : 'var(--border)'}`,
		opacity: active ? 0.9 : 0.35,
	} as React.CSSProperties),
	side: {
		flex: 1,
		minWidth: '220px',
		fontSize: '0.86rem',
		color: 'var(--text-secondary)',
		lineHeight: 1.6,
	} as React.CSSProperties,
	verdict: (color: string) => ({
		marginTop: '0.75rem',
		padding: '0.7rem 0.9rem',
		borderRadius: '8px',
		background: `${color}10`,
		border: `1px solid ${color}`,
		fontSize: '0.84rem',
		color: 'var(--text-secondary)',
		lineHeight: 1.55,
	} as React.CSSProperties),
	axisNote: {
		fontSize: '0.72rem',
		color: 'var(--text-muted)',
		marginTop: '0.4rem',
	} as React.CSSProperties,
};

export default function KvCacheBreakage() {
	const [mode, setMode] = useState<Mode>('ar');
	const color = mode === 'ar' ? '#3b82f6' : '#8b5cf6';

	// active[row][col]: виден ли ключ col запросу row.
	const isActive = (row: number, col: number) => (mode === 'ar' ? col <= row : true);

	return (
		<div style={css.wrap}>
			<div style={css.title}>🧱 Почему diffusion ломает KV-кэш</div>
			<div style={css.desc}>Матрица внимания: строка — токен-запрос, столбец — токен-ключ. Закрашено = запрос видит ключ. Переключи режим.</div>

			<div style={css.tabs}>
				<button style={css.tab(mode === 'ar', '#3b82f6')} onClick={() => setMode('ar')}>Авторегрессия</button>
				<button style={css.tab(mode === 'diffusion', '#8b5cf6')} onClick={() => setMode('diffusion')}>Diffusion</button>
			</div>

			<div style={css.gridWrap}>
				<div>
					<div style={css.grid(N)}>
						{Array.from({ length: N }).map((_, row) =>
							Array.from({ length: N }).map((__, col) => (
								<div key={`${row}-${col}`} style={css.cell(isActive(row, col), color)} />
							))
						)}
					</div>
					<div style={css.axisNote}>↓ запрос · → ключ</div>
				</div>

				<div style={css.side}>
					{mode === 'ar' ? (
						<>
							Каузальная маска: токен видит только прошлое (нижний треугольник). K и V прошлых токенов уже посчитаны и <strong>заморожены</strong> — их кладут в KV-кэш и переиспользуют на каждом следующем шаге, не пересчитывая.
							<div style={css.verdict('#3b82f6')}>Кэш работает: прошлое неизменно, дописываем по одному столбцу.</div>
						</>
					) : (
						<>
							Двунаправленное внимание: каждый токен видит всю последовательность (полный квадрат, без маски). И сами токены <strong>меняются между шагами denoising</strong> — то, что было замаскировано, раскрывается и переписывает представления соседей.
							<div style={css.verdict('#8b5cf6')}>Кэшировать нечего: «прошлого» в привычном смысле нет, K/V пересчитываются. Нужны отдельные приближения (block-wise cache в Fast-dLLM, arXiv:2505.22618).</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/article/KvCacheBreakage.tsx
git commit -m "Add KvCacheBreakage component for diffusion LLMs article"
```

---

### Task 3: `ThroughputCompare.tsx`

**Files:**
- Create: `src/components/article/ThroughputCompare.tsx`

**Interfaces:**
- Produces: default export React component, no props. Used in article as `<ThroughputCompare client:visible />`.

- [ ] **Step 1: Write the component**

```tsx
type Row = {
	name: string;
	toks: number;
	kind: 'ar' | 'diffusion';
	source: string;
};

// Все цифры атрибутированы. AR-бейзлайн и diffusion-модели измерены на РАЗНОМ железе/сетапах —
// это иллюстрация порядков величины, а не контролируемое сравнение (см. note).
const ROWS: Row[] = [
	{ name: 'gpt-oss-120b (AR)', toks: 193.5, kind: 'ar', source: 'Artificial Analysis, измеренная output speed' },
	{ name: 'Mercury Mini (diffusion)', toks: 1109, kind: 'diffusion', source: 'пейпер Mercury, arXiv:2506.17298, H100' },
	{ name: 'Celeris-1 (заявлена diffusion)', toks: 2053, kind: 'diffusion', source: 'Artificial Analysis, измеренная output speed' },
];

const MAX = Math.max(...ROWS.map((r) => r.toks));

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
	row: {
		marginBottom: '0.75rem',
	} as React.CSSProperties,
	rowHead: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'baseline',
		marginBottom: '0.3rem',
	} as React.CSSProperties,
	rowName: (color: string) => ({
		fontSize: '0.84rem',
		fontWeight: 700,
		color,
	} as React.CSSProperties),
	rowToks: {
		fontSize: '0.86rem',
		fontWeight: 800,
		color: 'var(--text)',
		fontVariantNumeric: 'tabular-nums' as const,
	} as React.CSSProperties,
	barTrack: {
		height: '14px',
		borderRadius: '4px',
		background: 'var(--bg-secondary)',
		overflow: 'hidden',
	} as React.CSSProperties,
	barFill: (pct: number, color: string) => ({
		width: `${pct}%`,
		height: '100%',
		background: color,
	} as React.CSSProperties),
	rowSource: {
		fontSize: '0.72rem',
		color: 'var(--text-muted)',
		marginTop: '0.2rem',
	} as React.CSSProperties,
	note: {
		marginTop: '0.9rem',
		fontSize: '0.78rem',
		color: 'var(--text-muted)',
		lineHeight: 1.6,
		fontStyle: 'italic' as const,
	} as React.CSSProperties,
};

export default function ThroughputCompare() {
	return (
		<div style={css.wrap}>
			<div style={css.title}>⚡ Throughput: авторегрессия vs diffusion</div>
			<div style={css.desc}>Output-скорость, токенов/с (одиночный поток). Порядок величины, не контролируемый бенчмарк — сетапы разные.</div>

			{ROWS.map((r) => {
				const color = r.kind === 'ar' ? '#3b82f6' : '#8b5cf6';
				return (
					<div key={r.name} style={css.row}>
						<div style={css.rowHead}>
							<span style={css.rowName(color)}>{r.name}</span>
							<span style={css.rowToks}>{r.toks.toLocaleString('ru-RU')} ток/с</span>
						</div>
						<div style={css.barTrack}><div style={css.barFill((r.toks / MAX) * 100, color)} /></div>
						<div style={css.rowSource}>{r.source}</div>
					</div>
				);
			})}

			<div style={css.note}>
				Числа с разного железа и сетапов (H100 vs облачные замеры Artificial Analysis), при разном размере модели и батче — прямое сравнение некорректно, это иллюстрация порядка: AR-фронтир держится в районе 100–200 ток/с на поток, diffusion выходит на 1000–2000. И да, Celeris по скорости реальна — вопросы к ней по качеству, не к throughput (см. ниже).
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/article/ThroughputCompare.tsx
git commit -m "Add ThroughputCompare component for diffusion LLMs article"
```

---

### Task 4: `ClaimVsReality.tsx`

**Files:**
- Create: `src/components/article/ClaimVsReality.tsx`

**Interfaces:**
- Produces: default export React component, no props. Used in article as `<ClaimVsReality client:visible />`.

- [ ] **Step 1: Write the component**

```tsx
import { useState } from 'react';

type View = 'claim' | 'reality';

type Item = { label: string; value: string };

// «Заявлено» — из пресс-релиза Celeris (не проверено независимо). «Независимо» — со страницы
// Artificial Analysis (artificialanalysis.ai/models/celeris-1). Важно: измеренная AA скорость
// (2053) даже ВЫШЕ заявленной (1664) — обман не в скорости, а в качестве (Index 12, #46/72).
const CLAIM: Item[] = [
	{ label: 'Скорость', value: '1664 ток/с (заявлено)' },
	{ label: 'Качество', value: '75.9% MMLU-Pro (заявлено)' },
	{ label: 'Маркетинг', value: '«24× быстрее GPT-5», позиционируется как diffusion' },
];

const REALITY: Item[] = [
	{ label: 'Скорость', value: '2053 ток/с — измерено, даже выше заявленного' },
	{ label: 'Качество', value: 'Intelligence Index 12, #46 из 72 (нижняя треть)' },
	{ label: 'Цена', value: '$2 / $6 за 1M — дороже Mercury 2 ($0.25 / $0.75)' },
	{ label: 'Diffusion?', value: 'У Artificial Analysis не значится как diffusion-модель' },
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
	rows: { display: 'grid', gap: '0.5rem' } as React.CSSProperties,
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
		width: '110px',
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
	note: {
		marginTop: '0.9rem',
		fontSize: '0.8rem',
		color: 'var(--text-muted)',
		lineHeight: 1.6,
	} as React.CSSProperties,
};

export default function ClaimVsReality() {
	const [view, setView] = useState<View>('claim');
	const items = view === 'claim' ? CLAIM : REALITY;

	return (
		<div style={css.wrap}>
			<div style={css.title}>🔍 Celeris-1: заявлено vs независимо измерено</div>
			<div style={css.desc}>Переключи вкладку. Соль не в том, что вендор наврал про скорость — она реальна. Соль в качестве и в самом ярлыке «diffusion».</div>

			<div style={css.tabs}>
				<button style={css.tab(view === 'claim', '#f59e0b')} onClick={() => setView('claim')}>📣 Заявлено (пресс-релиз)</button>
				<button style={css.tab(view === 'reality', '#22c55e')} onClick={() => setView('reality')}>🔬 Независимо (AA)</button>
			</div>

			<div style={css.rows}>
				{items.map((it) => (
					<div key={it.label} style={css.row}>
						<span style={css.rowLabel}>{it.label}</span>
						<span style={css.rowValue}>{it.value}</span>
					</div>
				))}
			</div>

			<div style={css.note}>
				Цифры пресс-релиза (75.9% MMLU-Pro, «24× быстрее GPT-5») независимо не подтверждены. Independent-скор Artificial Analysis: Intelligence Index 12 — при том, что скорость измерена даже выше заявленной. «Быстро» и «умно» — разные оси, и слово «diffusion» в пресс-релизе ≠ подтверждённый diffusion.
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/article/ClaimVsReality.tsx
git commit -m "Add ClaimVsReality component for diffusion LLMs article"
```

---

### Task 5: Write the article `diffusion-llms.mdx`

**Files:**
- Create: `src/content/blog/diffusion-llms.mdx`

**Interfaces:**
- Consumes: all 4 components from Tasks 1–4 (default exports, no props, each used as `<ComponentName client:visible />`), plus `src/components/article/Callout.astro` (`<Callout type="fire|warning" title="...">...</Callout>`), `src/components/article/StepList.astro` (`<StepList steps={[{num,text}]} />`), `src/components/article/QuantCard.astro` (`<QuantCard title badge badgeColor>...</QuantCard>`).

- [ ] **Step 1: Write the full article**

````mdx
---
title: 'Diffusion LLM: как генерировать текст не слева-направо 🌫️⚡'
description: 'Неавторегрессионная генерация текста через итеративный denoising — механика masked-diffusion (LLaDA), почему это ломает KV-кэш и чем отличается от спекулятивного декодинга, игроки (Mercury 2, NVIDIA Nemotron TwoTower) и разбор Celeris-1: заявлено vs независимо измерено.'
pubDate: 'Aug 01 2026'
category: 'фундамент'
---

import Callout from '../../components/article/Callout.astro';
import StepList from '../../components/article/StepList.astro';
import QuantCard from '../../components/article/QuantCard.astro';
import DenoisingPlayer from '../../components/article/DenoisingPlayer';
import KvCacheBreakage from '../../components/article/KvCacheBreakage';
import ThroughputCompare from '../../components/article/ThroughputCompare';
import ClaimVsReality from '../../components/article/ClaimVsReality';

Ну чё, малютки, весь этот блог про инференс молча держал одно допущение: текст генерируется слева направо, по одному токену за проход. Авторегрессия — в [KV-кэше](/blog/kv-cache/), в [спекулятивном декодинге](/blog/speculative-decoding/), в любой модели, которую вы гоняли. Diffusion LLM выбрасывают это допущение целиком: последовательность рождается вся сразу, из шума, за несколько параллельных проходов — и в проде это уже 1000–2000 токенов в секунду. Разбираем механику, почему она ломает KV-кэш, и заодно проверяем на свежем релизе, что «быстро» и «diffusion в пресс-релизе» — не то же самое, что «хорошо» и «подтверждённый diffusion».

<Callout type="fire" title="Суть за 10 секунд">
Авторегрессия выдаёт по одному токену за forward-проход, слева направо. **Diffusion LLM** (masked-denoising, как в **LLaDA**) стартует с полностью замаскированной последовательности и за N проходов раскрывает её — на каждом проходе предсказывая много токенов сразу, параллельно. Это даёт throughput, но ломает привычный KV-кэш: внимание двунаправленное, токены меняются между шагами, кэшировать «прошлое» нечего. В проде: **Mercury 2** (Inception), **NVIDIA Nemotron TwoTower**. И сразу урок про доверие к цифрам: **Celeris-1** заявляет 1664 ток/с — а независимый Artificial Analysis намерил даже больше (2053), но с Intelligence Index 12 из нижней трети рейтинга.
</Callout>

---

## Часть 1: Как работает denoising-декодинг

Авторегрессионная модель строит текст как цепочку условных вероятностей: каждый следующий токен — функция всех предыдущих, строго слева направо, один за проход. Diffusion заходит иначе. Идея пришла из генерации картинок (там из шума «проявляют» изображение), но для текста берут дискретный вариант — **masked diffusion**.

Работает так (формулировка — из пейпера **LLaDA**, arXiv:2502.09992): последовательность стартует полностью замаскированной, все позиции — спецтокен `[MASK]`. Дальше идёт обратный процесс из нескольких шагов: на каждом шаге модель смотрит на текущее (частично раскрытое) состояние и **предсказывает все замаскированные токены сразу**, параллельно. Часть предсказанных токенов фиксируется, часть снова маскируется по расписанию — и так, пока не раскрыта вся последовательность.

Обучают это простым объективом — кросс-энтропией только по замаскированным позициям, взвешенной на долю маскирования (LLaDA, уравнение 3):

$$
\mathcal{L}(\theta) \triangleq -\,\mathbb{E}_{t,\,x_0,\,x_t}\left[\frac{1}{t}\sum_{i=1}^{L} \mathbf{1}[x_t^i = M]\cdot \log p_\theta(x_0^i \mid x_t)\right]
$$

Индикатор $\mathbf{1}[x_t^i = M]$ включает потерю только на замаскированных токенах, $\frac{1}{t}$ нормирует на долю маскирования, а $\log p_\theta$ — обычная кросс-энтропия предсказания против чистого токена. Обобщённая непрерывная форма (Shi et al., arXiv:2406.04329) — «взвешенный интеграл кросс-энтропий», та же по форме вещь.

<DenoisingPlayer client:visible />

Ключевой параметр — **число шагов сэмплинга**. Оно же — ручка компромисса: больше шагов → выше качество, ниже скорость; меньше шагов → быстрее, но грубее (LLaDA прямо называет это «trade-off between efficiency and sample quality»). А порядок раскрытия — не слева направо: LLaDA использует **low-confidence remasking** (сначала фиксируют токены, в которых модель уверена, остальные перепредсказывают) и semi-autoregressive вариант по блокам.

И главное для следующей части: чтобы предсказывать всё сразу, diffusion-модель **не использует каузальную маску**. Дословно из LLaDA: «LLaDA does not use a causal mask, as its formulation allows it to see the entire input for predictions». Каждый токен видит всю последовательность — и в обе стороны.

---

## Часть 2: Почему это ломает KV-кэш и чем отличается от спекулятивного декодинга

В [статье про KV-кэш](/blog/kv-cache/) вся экономия держалась на двух вещах: каузальной маске (токен видит только прошлое) и том, что посчитанные K и V прошлых токенов **заморожены** — их кладут в кэш и переиспользуют, дописывая по одному столбцу на каждый новый токен. Diffusion выбивает обе опоры.

<KvCacheBreakage client:visible />

Внимание двунаправленное — никакого треугольника, полный квадрат. И токены **меняются между шагами denoising**: то, что было замаскировано, раскрывается и переписывает контекст для соседей. «Прошлого» в привычном авторегрессионном смысле просто нет, замораживать и переиспользовать нечего — на каждом шаге K/V пересчитываются. Поэтому наивный инкрементальный KV-кэш к diffusion неприменим; нужны отдельные приближения, вроде block-wise-кэша из **Fast-dLLM** (arXiv:2505.22618, коллаборация с участием NVIDIA-команды), который ценой аккуратных допущений возвращает часть экономии — и заявляет до 27.6× ускорения.

Тут важно не спутать diffusion со [спекулятивным декодингом](/blog/speculative-decoding/). Оба про «сделать генерацию быстрее», но это разные вещи. Спекулятивный декодинг **остаётся авторегрессией**: черновая модель угадывает несколько токенов вперёд, основная их верифицирует, и результат бит-в-бит совпадает с обычной авторегрессией — это ускорение без смены распределения. Diffusion меняет сам процесс генерации: это не «та же авторегрессия, но быстрее», а другой способ порождать текст.

---

## Часть 3: Игроки

Diffusion-текст перестал быть академической игрушкой — на нём уже строят коммерческий инференс.

**Mercury 2** от Inception Labs — линейка diffusion LLM с контекстом **128K** и ценой **$0.25 / $0.75 за 1M** токенов (вход/выход, кэшированный вход — $0.025). На сайте Inception скорость подаётся как «1000+ токенов/с» на коммерческих GPU NVIDIA — это маркетинговый пол, не привязанный к конкретному железу. Твёрдые же, привязанные к H100 числа есть в пейпере исходного Mercury (arXiv:2506.17298): **1109 ток/с** у Mini и **737 ток/с** у Small, «до 10×» быстрее скоростных фронтир-моделей при сопоставимом качестве. Точную дату релиза Mercury 2 Inception внятно не назвала — это лето 2026.

<QuantCard title="128K / $0.25 / $0.75" badge="Mercury 2, Inception" badgeColor="#8b5cf6">
Контекст 128K, цена входа/выхода $0.25 / $0.75 за 1M. Скорость «1000+ ток/с» — маркетинговый пол по всем NVIDIA GPU; hard-число 1109 ток/с на H100 — из пейпера исходного Mercury.
</QuantCard>

**NVIDIA Nemotron TwoTower** (arXiv:2606.26493, 1 июля 2026) — не diffusion с нуля, а diffusion поверх авторегрессионного бэкбона. Архитектура из двух башен: **замороженная AR-башня** каузально обрабатывает чистые токены, **обучаемая diffusion-башня** денойзит. Построено на бэкбоне Nemotron-3-Nano-30B, обучали только денойзер (~2.1 триллиона токенов). По разбору MarkTechPost — 2.42× throughput при сохранении 98.7% качества AR-бейзлайна (эти множители вторичны, у самой NVIDIA в PDF стоит перепроверить). Смысл подхода: не выкидывать годы обучения авторегрессионных моделей, а прикрутить diffusion-декодер сверху.

<ThroughputCompare client:visible />

---

## Часть 4: Заявлено vs независимо измерено

И тут — свежий повод вспомнить [статью про бенчмарки](/blog/llm-benchmarks-gaming/). 27 июля 2026 вышел **Celeris-1** с пресс-релизом, где заявлены 1664 ток/с, 158 мс latency, 75.9% MMLU-Pro и «24× быстрее GPT-5», позиционируется как diffusion.

<ClaimVsReality client:visible />

Соль — не в том, что вендор наврал про скорость. Наоборот: независимый Artificial Analysis намерил **2053 ток/с** — даже выше заявленного. Проблема в другом. Intelligence Index у Celeris-1 — **12, это 46-е место из 72**, нижняя треть; заявленные 75.9% MMLU-Pro независимо не подтверждаются (и плохо вяжутся с таким низким сводным индексом). Цена у AA — **$2 / $6 за 1M**, кратно дороже Mercury 2. И отдельно: у Artificial Analysis Celeris-1 **не значится как diffusion-модель** — тега diffusion на её странице нет (хотя и явного «это не diffusion» там тоже нет, так что аккуратно: это отсутствие подтверждения, а не опровержение).

Мораль ровно та же, что в статье про бенчмарки: «быстро» и «умно» — разные оси, и слово «diffusion» в пресс-релизе само по себе ничего не подтверждает. Скорость проверяется независимым замером, качество — независимым бенчмарком, архитектура — не маркетингом.

---

## TL;DR

<StepList steps={[
	{ num: "1", text: "<strong>Механика:</strong> masked-diffusion (LLaDA, arXiv:2502.09992) стартует с полностью замаскированной последовательности и за N проходов раскрывает её, предсказывая много токенов за проход параллельно — против одного-за-проход у авторегрессии" },
	{ num: "2", text: "<strong>Компромисс:</strong> число шагов сэмплинга — ручка «качество vs скорость»; порядок раскрытия не слева направо (low-confidence remasking)" },
	{ num: "3", text: "<strong>KV-кэш ломается:</strong> внимание двунаправленное (нет каузальной маски), токены меняются между шагами — наивный инкрементальный кэш неприменим, нужны приближения (Fast-dLLM, block-wise cache)" },
	{ num: "4", text: "<strong>Не спекулятивный декодинг:</strong> спек-декодинг остаётся авторегрессией с бит-в-бит тем же результатом; diffusion меняет сам процесс генерации" },
	{ num: "5", text: "<strong>Игроки:</strong> Mercury 2 (128K, $0.25/$0.75, «1000+ ток/с»; исходный Mercury — 1109 ток/с на H100), NVIDIA Nemotron TwoTower (diffusion-денойзер на замороженном AR-бэкбоне)" },
	{ num: "6", text: "<strong>Реальность цифр:</strong> Celeris-1 заявляет 1664 ток/с — AA намерил 2053 (быстрее!), но Intelligence Index 12 (#46/72), и как diffusion у AA не значится. Быстро ≠ умно, «diffusion» в пресс-релизе ≠ подтверждённый diffusion" },
]} />

Diffusion LLM — не «авторегрессия, но быстрее», а другой способ порождать текст: параллельно и из шума, ценой более тяжёлого прохода и сломанного KV-кэша. Пока качество лучших diffusion-моделей догоняет, а не обгоняет, авторегрессионный фронтир — но парадигма уже в проде, и throughput там честно на порядок выше. Смотреть стоит на независимые замеры, а не на пресс-релизы. 🫡

---

### Источники

1. [LLaDA: Large Language Diffusion Models (arXiv:2502.09992)](https://arxiv.org/abs/2502.09992)
2. [Simplified and Generalized Masked Diffusion for Discrete Data — Shi et al. (arXiv:2406.04329)](https://arxiv.org/abs/2406.04329)
3. [Discrete Diffusion Modeling by Estimating the Ratios of the Data Distribution — SEDD, Lou et al. (arXiv:2310.16834)](https://arxiv.org/abs/2310.16834)
4. [Fast-dLLM: Training-free Acceleration of Diffusion LLM via KV Cache and Parallel Decoding (arXiv:2505.22618)](https://arxiv.org/abs/2505.22618)
5. [Mercury: Ultra-Fast Language Models Based on Diffusion — Inception Labs (arXiv:2506.17298)](https://arxiv.org/abs/2506.17298)
6. [Inception Labs — Models (Mercury 2)](https://www.inceptionlabs.ai/models)
7. [Nemotron-Labs-TwoTower: Diffusion Language Modeling with Pretrained Autoregressive Context (arXiv:2606.26493)](https://arxiv.org/abs/2606.26493)
8. [Celeris-1 — Artificial Analysis](https://artificialanalysis.ai/models/celeris-1)
9. [gpt-oss-120b — Artificial Analysis (AR baseline throughput)](https://artificialanalysis.ai/models/gpt-oss-120b)
10. [KV-кэш: почему LLM помнит без памяти и жрёт VRAM](/blog/kv-cache/)
11. [Спекулятивный декодинг: ускоряем LLM в 2–3 раза](/blog/speculative-decoding/)
12. [LLM-бенчмарки: как считают и как их обманывают](/blog/llm-benchmarks-gaming/)
````

- [ ] **Step 2: Verify frontmatter, imports, and MDX syntax compile**

Run: `npm run build 2>&1 | tail -40`
Expected: build completes with no errors mentioning `diffusion-llms.mdx` or the 4 new component files. Watch specifically for MDX curly-brace gotchas: a bare `{...}` in plain prose (outside a fenced code block or backticks) is parsed as a JS expression and breaks the build. The article above keeps LaTeX inside `$$...$$` (handled by remark-math) and has no bare curly braces in prose — but if the build errors on an expression, wrap the offending fragment in backticks rather than changing wording. (Full verification is Task 6.)

- [ ] **Step 3: Commit**

```bash
git add src/content/blog/diffusion-llms.mdx
git commit -m "Add diffusion LLMs article"
```

---

### Task 6: Build and browser verification

**Files:** none created — verification only.

**Interfaces:**
- Consumes: the full article and all 4 components from Tasks 1–5.

- [ ] **Step 1: Run the production build**

Run: `npm run build 2>&1 | tail -40`
Expected: `[build] Complete!` with no errors, and the article listed among the built pages (page count increases by 1 vs the pre-article baseline). Note: pre-existing `unicodeTextInMathMode` KaTeX warnings from `rlhf-dpo-grpo.mdx` are unrelated — confirm none reference `diffusion-llms.mdx` (this article's only math is the LLaDA loss, which is standard LaTeX, no Cyrillic inside `$$`).

- [ ] **Step 2: Start the preview server**

```bash
npm run preview &
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/blog/diffusion-llms/
```
Expected: `200`.

- [ ] **Step 3: Browser check — all 4 components + the KaTeX formula**

Using chrome-devtools MCP tools (`navigate_page`, `take_screenshot`, `evaluate_script`, `list_console_messages`): navigate to `http://localhost:4321/blog/diffusion-llms/`, then:
- `DenoisingPlayer`: scroll into view, screenshot, click "Шаг →" a few times AND click "▶ Играть" — confirm tokens actually reveal (masked `▓▓` blocks turn into words) and the pass counters advance (diffusion completes at pass 4, AR at pass 8). This is the anchor — its animation MUST work, not sit static.
- `KvCacheBreakage`: scroll into view, screenshot the "Авторегрессия" tab (lower-triangular grid), click "Diffusion" tab, screenshot (full grid) — confirm the attention matrix visibly changes from triangle to full square.
- `ThroughputCompare`: scroll into view, screenshot — confirm 3 bars with gpt-oss-120b shortest, Celeris-1 longest, proportional.
- `ClaimVsReality`: scroll into view, screenshot "Заявлено" tab, click "Независимо (AA)" tab, screenshot — confirm content switches.
- The LLaDA loss formula (Часть 1): confirm it renders as typeset math (KaTeX), not raw `$$...$$` source.

Expected: every component renders with correct data (numbers match the source arrays in Tasks 1–4 exactly), interactivity works, no layout breakage.

- [ ] **Step 4: Console error check**

Run `list_console_messages` with `types: ["error", "warn"]` after full interaction.
Expected: no console errors or warnings (an empty result).

- [ ] **Step 5: Stop the preview server**

```bash
pkill -f "astro preview" || true
```

- [ ] **Step 6: Manual unslop pass**

Read `src/content/blog/diffusion-llms.mdx` prose against common AI-tell patterns from the unslop skill's `references/taboo-phrases.md`: binary-contrast constructions ("не X, а Y") especially in the closing paragraph, negative parallelisms ("не только X, но и Y"), unnecessary filler intensifiers. Do NOT do a wholesale em-dash-stripping pass — this blog's established house style uses heavy em-dashes consistently (decided repeatedly this project for kimi-k3.mdx, rlhf-dpo-grpo.mdx, llm-benchmarks-gaming.mdx); only fix genuine AI-tells. Preserve every number, arXiv ID, formula, and quoted statement verbatim — diff any edit against the original to confirm no fact changed, and re-run the build afterward.

- [ ] **Step 7: Commit any unslop fixes**

```bash
git add src/content/blog/diffusion-llms.mdx
git commit -m "Unslop pass on diffusion LLMs article"
```

(Skip this commit if no changes were made.)

---

## Self-Review Notes

- **Spec coverage:** all 4 content parts, all 4 interactive components, and the 3 cross-links (kv-cache, speculative-decoding, llm-benchmarks-gaming) from `docs/superpowers/specs/2026-08-01-diffusion-llms-design.md` are covered — Tasks 1–4 (components) + Task 5 (article prose) + Task 6 (verification, matching the spec's "Критерий готовности").
- **Binding hedges preserved:** the Celeris framing (measured speed HIGHER than claimed; low Intelligence Index is the real gap; "не значится как diffusion" NOT "явно не-diffusion"; press-release specifics as "заявляет"), the Mercury attribution split (Mercury 2 marketing floor vs original-Mercury H100 hard numbers), the Nemotron framing (frozen AR tower + trainable diffusion denoiser, secondary throughput figures hedged), and the AR-baseline caveat (throughput depends on model/hardware/batch) all appear verbatim in both the component code and the article prose.
- **Placeholder scan:** no TBD/TODO; every numeric claim traces to a cited source (arXiv ID or named vendor/Artificial-Analysis page). The DenoisingPlayer schedule and KvCacheBreakage matrix are explicitly labeled "иллюстративная"/"иллюстрация" — they demonstrate mechanics, not reproduce a specific model's run.
- **Type consistency:** every component is a parameterless default export matching the `<ComponentName client:visible />` usage in Task 5's MDX — names verified exact (`DenoisingPlayer`, `KvCacheBreakage`, `ThroughputCompare`, `ClaimVsReality`).
- **heroImage** intentionally omitted from Task 5's frontmatter, per Global Constraints and established pattern — deferred to a manual follow-up.
