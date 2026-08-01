# Positional Encoding (RoPE/YaRN) Article Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a new "фундамент" blog article `src/content/blog/positional-encoding-rope.mdx` explaining positional encoding (why it's needed, RoPE mechanics, why RoPE breaks on long-context extrapolation, the NTK/YaRN patches, and Inkling's counter-thesis of dropping RoPE), built around 5 mechanic-showing interactive React components (per the user's explicit "visual so the reader understands" requirement).

**Architecture:** One MDX article importing 5 new one-off React components (`client:visible`), following the article-component convention: inline `css` object typed `React.CSSProperties`, CSS custom properties for theming, no new npm dependencies, default export with no props. The rotation/geometry components use inline SVG (no canvas, no libraries) with computed trig. KaTeX (`$$`/`$...$`) is already wired into the MDX pipeline (remark-math/rehype-katex, used by rlhf-dpo-grpo.mdx and diffusion-llms.mdx).

**Tech Stack:** Astro 5, React 19, TypeScript, inline SVG, existing KaTeX.

## Global Constraints

- Category: `'фундамент'`. Slug: `positional-encoding-rope`. File: `src/content/blog/positional-encoding-rope.mdx`.
- Voice: Russian, dense, direct, light irony — match `src/content/blog/rlhf-dpo-grpo.mdx` and `src/content/blog/diffusion-llms.mdx`.
- Every formula/number below is primary-verified against the cited paper/vendor page unless explicitly hedged in the prose.
- **Binding fact hedges (from primary-source verification):**
  - RoPE θ: RoFormer (arXiv:2104.09864) prints it two ways — `θ_i = 10000^{−2(i−1)/d}, i∈[1,d/2]` (Eq. 15) and `θ_i = 10000^{−2i/d}` (Sec. 3.3). The article uses the modern 0-indexed form `θ_i = 10000^{−2i/d}, i∈[0,d/2−1]` and notes the paper also writes the 1-indexed form — never present one as "the only" formula. Base **10000** confirmed.
  - **The "wavelength/frequency" framing belongs to YaRN (arXiv:2309.00071), NOT RoFormer.** RoFormer calls the θ-decay "long-term decay". Any "different dimensions have different wavelengths / low dims spin fast, high dims slow" statement must be attributed to YaRN or as common secondary interpretation — NOT sourced to RoFormer.
  - NTK-aware interpolation: community-originated (Reddit user **bloc97**, r/LocalLLaMA, mid-2023), later formalized by YaRN — hedge the date/venue as "по community-посту, зафиксированному в пейпере YaRN", not as a primary paper. The base-scaling formula `b' = b·s^(|D|/(|D|−2))` is YaRN's Definition 1 — attribute it to YaRN.
  - YaRN attention temperature (Eq. 22): `√(1/t) = 0.1·ln(s)+1`, applied as `softmax(qₘᵀkₙ / (t·√|D|))`, s = L′/L. Headline: "10× fewer tokens, 2.5× fewer training steps than prior methods", up to 128k context — quote exactly.
  - Position Interpolation (Chen, arXiv:2306.15595): `f'(x,m) = f(x, m·L/L′)`; LLaMA extended to 32768 within 1000 finetuning steps.
  - **Inkling (Thinking Machines, July 2026):** the EXACT central quote is "We find that encoding position with a relative positional embedding performs better and extrapolates better to longer sequences than the more widely adopted Rotary Positional Embedding (RoPE)." Their term is **"relative positional embedding"** — if the article says "learned", it must mark that as inference, not their wording. Short convolutions applied "after the key and value projections in each attention layer, and on the attention and MLP residual branch outputs". Arch: 975B total / 41B active MoE, 256 routed + 2 shared experts (6 routed active per token, plus the 2 shared always-on), sliding-window + global attention at 5:1, 8 KV heads, up to 1M context, 45T **multimodal** (text/image/audio/video) pretraining tokens. Do NOT state head-dim, total heads, or layer count (not disclosed).
- Component illustrative numbers use `θ_i = 10000^{−2i/d}` with d=8 → the 4 frequency pairs have θ = [1, 0.1, 0.01, 0.001] and wavelengths (2π/θ) ≈ [6.3, 62.8, 628.3, 6283.2] positions/turn (NumPy-verified). Components that show these must label them "иллюстративно, d=8" — they demonstrate the mechanic, not a specific model's real d.
- No new npm dependencies. No `heroImage` in frontmatter — deferred to a manual follow-up.
- `client:visible` on every new interactive component.
- Colors (reuse consistently): RoPE/rotation = `#8b5cf6` (purple), query = `#8b5cf6` (purple), key = `#3b82f6` (blue), absolute-encoding/AR = `#3b82f6` (blue), in-distribution/trained-range/fix = `#22c55e` (green), out-of-distribution/break = `#ef4444` (red).
- Escape any bare `$` that denotes a dollar amount in prose as `\$` (remark-math would eat it); LaTeX math stays in `$...$`/`$$...$$`.

---

### Task 1: `PermutationInvariance.tsx`

**Files:**
- Create: `src/components/article/PermutationInvariance.tsx`

**Interfaces:**
- Produces: default export React component, no props. Used as `<PermutationInvariance client:visible />`.

- [ ] **Step 1: Write the component**

```tsx
import { useState } from 'react';

// Demo: self-attention без позиционной информации перестановочно-инвариантно.
// Показываем это на permutation-invariant агрегате (сумме векторов токенов):
// перемешивание порядка не меняет сумму — модель "без позиции" не видит порядок.
// А "с позицией" каждый токен помечен своим индексом, и порядок различим.
const BASE = [
	{ w: 'кот', v: 3 },
	{ w: 'ловит', v: 5 },
	{ w: 'мышь', v: 2 },
	{ w: 'ночью', v: 4 },
];

function shuffle<T>(arr: T[], seed: number): T[] {
	// детерминированная перестановка по seed — воспроизводима и не зависит от Math.random
	const a = arr.slice();
	for (let i = a.length - 1; i > 0; i--) {
		const j = (i * 7 + seed * 13 + 3) % (i + 1);
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

const css = {
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.1rem', lineHeight: 1.6 } as React.CSSProperties,
	row: { marginBottom: '1rem' } as React.CSSProperties,
	rowLabel: (color: string) => ({ fontSize: '0.78rem', fontWeight: 700, color, marginBottom: '0.4rem' } as React.CSSProperties),
	tokens: { display: 'flex', flexWrap: 'wrap' as const, gap: '0.4rem', marginBottom: '0.5rem' } as React.CSSProperties,
	token: (color: string) => ({ padding: '0.4rem 0.7rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, background: `${color}18`, border: `1px solid ${color}`, color: 'var(--text)' } as React.CSSProperties),
	tokenIdx: { fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: '0.3rem' } as React.CSSProperties,
	verdict: (ok: boolean) => ({ fontSize: '0.82rem', fontWeight: 700, color: ok ? '#ef4444' : '#22c55e' } as React.CSSProperties),
	btn: { marginTop: '0.5rem', padding: '0.45rem 1rem', borderRadius: '100px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' } as React.CSSProperties,
	note: { marginTop: '0.9rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

export default function PermutationInvariance() {
	const [seed, setSeed] = useState(0);
	const order = shuffle(BASE, seed);
	const sum = order.reduce((s, t) => s + t.v, 0); // порядко-независимый агрегат

	return (
		<div style={css.wrap}>
			<div style={css.title}>🔀 Attention без позиции не видит порядок</div>
			<div style={css.desc}>Жми «перемешать». Сверху — «без позиции»: агрегат (сумма) не меняется от порядка. Снизу — «с позицией»: каждый токен помечен индексом, порядок различим.</div>

			<div style={css.row}>
				<div style={css.rowLabel('#ef4444')}>Без позиционного кодирования</div>
				<div style={css.tokens}>
					{order.map((t, i) => (
						<span key={i} style={css.token('#ef4444')}>{t.w}</span>
					))}
				</div>
				<div style={css.verdict(true)}>Σ = {sum} — тот же результат при любом порядке (порядок потерян)</div>
			</div>

			<div style={css.row}>
				<div style={css.rowLabel('#22c55e')}>С позиционным кодированием</div>
				<div style={css.tokens}>
					{order.map((t, i) => (
						<span key={i} style={css.token('#22c55e')}>{t.w}<span style={css.tokenIdx}>#{i}</span></span>
					))}
				</div>
				<div style={css.verdict(false)}>Каждый токен знает свою позицию #i — порядок восстановим</div>
			</div>

			<button style={css.btn} onClick={() => setSeed((s) => s + 1)}>🔀 Перемешать</button>

			<div style={css.note}>Self-attention сам по себе — функция от множества токенов, не от последовательности: переставь вход, и выход переставится так же, но содержательно не изменится. Позицию нужно впрыснуть отдельно. RoPE — один из способов.</div>
		</div>
	);
}
```

- [ ] **Step 2: Note on verification.** Nothing imports this yet (wired in Task 6). Task 7 verifies compile/visual/interactivity.

- [ ] **Step 3: Commit**

```bash
git add src/components/article/PermutationInvariance.tsx
git commit -m "Add PermutationInvariance component for positional encoding article"
```

---

### Task 2: `RopeRotation.tsx` (anchor)

**Files:**
- Create: `src/components/article/RopeRotation.tsx`

**Interfaces:**
- Produces: default export React component, no props. Used as `<RopeRotation client:visible />`.

- [ ] **Step 1: Write the component**

```tsx
import { useState } from 'react';

// Якорь: RoPE поворачивает пары измерений вектора на угол m·θ_i.
// θ_i = 10000^(-2i/d), d=8 -> θ = [1, 0.1, 0.01, 0.001] (иллюстративно).
// Слайдер позиции m крутит 4 вектора: низкие измерения (высокая частота) быстро,
// высокие измерения (низкая частота) медленно.
const D = 8;
const BASE = 10000;
const PAIRS = Array.from({ length: D / 2 }, (_, i) => ({
	i,
	theta: BASE ** (-2 * i / D),
	wavelength: (2 * Math.PI) / (BASE ** (-2 * i / D)),
}));

const R = 34; // радиус кружка
const CX = 44;
const CY = 44;

const css = {
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.1rem', lineHeight: 1.6 } as React.CSSProperties,
	dials: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' as const, marginBottom: '1.1rem' } as React.CSSProperties,
	dial: { textAlign: 'center' as const } as React.CSSProperties,
	dialLabel: { fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties,
	sliderRow: { display: 'flex', alignItems: 'center', gap: '0.75rem' } as React.CSSProperties,
	sliderLabel: { fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', minWidth: '72px' } as React.CSSProperties,
	slider: { flex: 1, accentColor: '#8b5cf6' } as React.CSSProperties,
	posVal: { fontSize: '0.9rem', fontWeight: 800, color: '#8b5cf6', minWidth: '2.5ch', textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties,
	note: { marginTop: '0.9rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

export default function RopeRotation() {
	const [m, setM] = useState(8);

	return (
		<div style={css.wrap}>
			<div style={css.title}>🎡 RoPE: поворот вектора на угол m·θ</div>
			<div style={css.desc}>Каждая пара измерений вращается со своей частотой θ. Двигай позицию m — низкие измерения (высокая частота) крутятся быстро, высокие (низкая частота) едва ползут. Иллюстративно, d=8.</div>

			<div style={css.dials}>
				{PAIRS.map((p) => {
					const ang = m * p.theta; // радианы
					const x2 = CX + R * Math.cos(ang);
					const y2 = CY - R * Math.sin(ang); // SVG y вниз -> минус для CCW
					const deg = ((ang * 180 / Math.PI) % 360 + 360) % 360;
					return (
						<div key={p.i} style={css.dial}>
							<svg width={CX * 2} height={CY * 2} role="img" aria-label={`пара ${p.i}, угол ${deg.toFixed(0)} градусов`}>
								<circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border)" strokeWidth="1.5" />
								<line x1={CX} y1={CY} x2={x2} y2={y2} stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />
								<circle cx={x2} cy={y2} r="3.5" fill="#8b5cf6" />
								<circle cx={CX} cy={CY} r="2.5" fill="var(--text-muted)" />
							</svg>
							<div style={css.dialLabel}>пара {p.i}<br />θ={p.theta.toLocaleString('en', { maximumSignificantDigits: 1 })}<br />{deg.toFixed(0)}°</div>
						</div>
					);
				})}
			</div>

			<div style={css.sliderRow}>
				<span style={css.sliderLabel}>позиция m</span>
				<input style={css.slider} type="range" min={0} max={64} value={m} onChange={(e) => setM(Number(e.target.value))} />
				<span style={css.posVal}>{m}</span>
			</div>

			<div style={css.note}>Угол пары i на позиции m равен m·θ_i, где θ_i = 10000^(−2i/d) (RoFormer, arXiv:2104.09864). Разброс частот по измерениям и есть то, что позже назовут «длинами волн» RoPE — от коротких к длинным.</div>
		</div>
	);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/article/RopeRotation.tsx
git commit -m "Add RopeRotation anchor component for positional encoding article"
```

---

### Task 3: `FrequencySpectrum.tsx`

**Files:**
- Create: `src/components/article/FrequencySpectrum.tsx`

**Interfaces:**
- Produces: default export React component, no props. Used as `<FrequencySpectrum client:visible />`.

- [ ] **Step 1: Write the component**

```tsx
// Спектр длин волн по измерениям: λ_i = 2π/θ_i, θ_i = 10000^(-2i/d).
// Для наглядности берём d=16 (8 пар) -> длины волн от единиц до десятков тысяч позиций.
// Бары в лог-масштабе, потому что диапазон охватывает ~4 порядка.
const D = 16;
const BASE = 10000;
const PAIRS = Array.from({ length: D / 2 }, (_, i) => {
	const theta = BASE ** (-2 * i / D);
	const wavelength = (2 * Math.PI) / theta;
	return { i, theta, wavelength };
});

const LOG_MIN = Math.log10(PAIRS[0].wavelength);
const LOG_MAX = Math.log10(PAIRS[PAIRS.length - 1].wavelength);

const css = {
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.6 } as React.CSSProperties,
	barRow: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' } as React.CSSProperties,
	barLabel: { width: '70px', flexShrink: 0, fontSize: '0.76rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties,
	barTrack: { flex: 1, height: '16px', borderRadius: '4px', background: 'var(--bg-secondary)', overflow: 'hidden' } as React.CSSProperties,
	barFill: (pct: number) => ({ width: `${Math.max(pct, 2)}%`, height: '100%', background: '#8b5cf6' } as React.CSSProperties),
	barVal: { width: '90px', flexShrink: 0, fontSize: '0.76rem', fontWeight: 700, color: 'var(--text)', textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties,
	ends: { display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.74rem', color: 'var(--text-muted)' } as React.CSSProperties,
	note: { marginTop: '0.9rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

export default function FrequencySpectrum() {
	return (
		<div style={css.wrap}>
			<div style={css.title}>🌈 Длины волн по измерениям (лог-масштаб)</div>
			<div style={css.desc}>Длина волны пары i — сколько позиций нужно на полный оборот: λ = 2π/θ. Низкие измерения крутятся часто (короткая волна), высокие — редко (длинная). Иллюстративно, d=16.</div>

			{PAIRS.map((p) => {
				const pct = ((Math.log10(p.wavelength) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100;
				return (
					<div key={p.i} style={css.barRow}>
						<span style={css.barLabel}>пара {p.i}</span>
						<div style={css.barTrack}><div style={css.barFill(pct)} /></div>
						<span style={css.barVal}>{p.wavelength < 100 ? p.wavelength.toFixed(1) : Math.round(p.wavelength).toLocaleString('ru-RU')}</span>
					</div>
				);
			})}

			<div style={css.ends}>
				<span>← высокая частота (близкие позиции)</span>
				<span>низкая частота (далёкие) →</span>
			</div>

			<div style={css.note}>Именно этот разброс масштабов даёт RoPE и близкие, и далёкие относительные расстояния сразу. Само слово «длина волны» для этих измерений закрепил пейпер YaRN (arXiv:2309.00071) — RoFormer называл это «long-term decay».</div>
		</div>
	);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/article/FrequencySpectrum.tsx
git commit -m "Add FrequencySpectrum component for positional encoding article"
```

---

### Task 4: `RelativePhase.tsx`

**Files:**
- Create: `src/components/article/RelativePhase.tsx`

**Interfaces:**
- Produces: default export React component, no props. Used as `<RelativePhase client:visible />`.

- [ ] **Step 1: Write the component**

```tsx
import { useState } from 'react';

// Свойство относительности RoPE: dot-product повёрнутых запроса (поз. m) и ключа (поз. n)
// зависит только от разности фаз (m−n)·θ, а не от абсолютных m, n. Одна частота θ для наглядности.
const THETA = 0.35; // рад/позицию, иллюстративно
const R = 60;
const CX = 74;
const CY = 74;

function vec(angle: number) {
	return { x: CX + R * Math.cos(angle), y: CY - R * Math.sin(angle) };
}

const css = {
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.1rem', lineHeight: 1.6 } as React.CSSProperties,
	main: { display: 'flex', gap: '1.25rem', flexWrap: 'wrap' as const, alignItems: 'center' } as React.CSSProperties,
	sliders: { flex: 1, minWidth: '220px' } as React.CSSProperties,
	sliderRow: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.7rem' } as React.CSSProperties,
	sliderLabel: (color: string) => ({ fontSize: '0.82rem', fontWeight: 700, color, minWidth: '78px' } as React.CSSProperties),
	slider: (color: string) => ({ flex: 1, accentColor: color } as React.CSSProperties),
	val: (color: string) => ({ fontSize: '0.9rem', fontWeight: 800, color, minWidth: '2.5ch', textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties),
	diff: { marginTop: '0.5rem', padding: '0.7rem 0.9rem', borderRadius: '8px', background: '#22c55e10', border: '1px solid #22c55e', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 } as React.CSSProperties,
	note: { marginTop: '0.9rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

export default function RelativePhase() {
	const [m, setM] = useState(7);
	const [n, setN] = useState(3);
	const am = m * THETA;
	const an = n * THETA;
	const qv = vec(am);
	const kv = vec(an);
	const diffDeg = (((m - n) * THETA * 180 / Math.PI) % 360 + 360) % 360;

	return (
		<div style={css.wrap}>
			<div style={css.title}>🧭 Важна разность фаз, а не абсолютные позиции</div>
			<div style={css.desc}>Запрос на позиции m (фиолетовый) и ключ на позиции n (синий). Скалярное произведение RoPE зависит только от угла между ними — то есть от (m−n). Сдвинь m и n на одинаковую величину — разность не изменится.</div>

			<div style={css.main}>
				<svg width={CX * 2} height={CY * 2} role="img" aria-label={`разность фаз ${diffDeg.toFixed(0)} градусов`}>
					<circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border)" strokeWidth="1.5" />
					<line x1={CX} y1={CY} x2={qv.x} y2={qv.y} stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />
					<circle cx={qv.x} cy={qv.y} r="4" fill="#8b5cf6" />
					<line x1={CX} y1={CY} x2={kv.x} y2={kv.y} stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
					<circle cx={kv.x} cy={kv.y} r="4" fill="#3b82f6" />
					<circle cx={CX} cy={CY} r="2.5" fill="var(--text-muted)" />
				</svg>

				<div style={css.sliders}>
					<div style={css.sliderRow}>
						<span style={css.sliderLabel('#8b5cf6')}>запрос m</span>
						<input style={css.slider('#8b5cf6')} type="range" min={0} max={24} value={m} onChange={(e) => setM(Number(e.target.value))} />
						<span style={css.val('#8b5cf6')}>{m}</span>
					</div>
					<div style={css.sliderRow}>
						<span style={css.sliderLabel('#3b82f6')}>ключ n</span>
						<input style={css.slider('#3b82f6')} type="range" min={0} max={24} value={n} onChange={(e) => setN(Number(e.target.value))} />
						<span style={css.val('#3b82f6')}>{n}</span>
					</div>
					<div style={css.diff}>Разность фаз = (m−n)·θ = ({m}−{n})·θ → <strong>{diffDeg.toFixed(0)}°</strong>. Именно от неё зависит dot-product, не от m и n по отдельности.</div>
				</div>
			</div>

			<div style={css.note}>Формально: ⟨f_q(x_m, m), f_k(x_n, n)⟩ = g(x_m, x_n, m−n) (RoFormer, Eq. 11) — внутреннее произведение зависит только от относительного сдвига m−n. Поэтому RoPE — относительное кодирование, хоть и задаётся через абсолютную позицию.</div>
		</div>
	);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/article/RelativePhase.tsx
git commit -m "Add RelativePhase component for positional encoding article"
```

---

### Task 5: `ExtrapolationBreakFix.tsx`

**Files:**
- Create: `src/components/article/ExtrapolationBreakFix.tsx`

**Interfaces:**
- Produces: default export React component, no props. Used as `<ExtrapolationBreakFix client:visible />`.

- [ ] **Step 1: Write the component**

```tsx
import { useState } from 'react';

// Поломка экстраполяции: за длиной обучения L_train угол m·θ уходит за пределы
// «обученной дуги» [0, θ·L_train] — модель таких углов не видела (OOD).
// Fix (Position Interpolation): m -> m·L_train/L_max, угол возвращается в обученную дугу.
// Иллюстративно: θ=0.05 рад/поз (медленное измерение), L_train=32, слайдер до L_max=128.
const THETA = 0.05;
const L_TRAIN = 32;
const L_MAX = 128;
const R = 64;
const CX = 78;
const CY = 78;

function polar(angle: number, r = R) {
	return { x: CX + r * Math.cos(angle), y: CY - r * Math.sin(angle) };
}

// SVG-дуга обученного диапазона [0, θ·L_train]
function arcPath(a0: number, a1: number, r = R) {
	const p0 = polar(a0, r);
	const p1 = polar(a1, r);
	const large = a1 - a0 > Math.PI ? 1 : 0;
	// sweep=0 т.к. y инвертирован (CCW в мат. системе = по часовой в SVG)
	return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 0 ${p1.x} ${p1.y}`;
}

const css = {
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.1rem', lineHeight: 1.6 } as React.CSSProperties,
	main: { display: 'flex', gap: '1.25rem', flexWrap: 'wrap' as const, alignItems: 'center' } as React.CSSProperties,
	controls: { flex: 1, minWidth: '240px' } as React.CSSProperties,
	sliderRow: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.7rem' } as React.CSSProperties,
	sliderLabel: { fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', minWidth: '78px' } as React.CSSProperties,
	slider: { flex: 1, accentColor: '#8b5cf6' } as React.CSSProperties,
	val: (color: string) => ({ fontSize: '0.9rem', fontWeight: 800, color, minWidth: '3ch', textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties),
	toggle: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', cursor: 'pointer' } as React.CSSProperties,
	verdict: (ok: boolean) => ({ padding: '0.7rem 0.9rem', borderRadius: '8px', background: ok ? '#22c55e10' : '#ef444410', border: `1px solid ${ok ? '#22c55e' : '#ef4444'}`, fontSize: '0.85rem', fontWeight: 700, color: ok ? '#22c55e' : '#ef4444', lineHeight: 1.4 } as React.CSSProperties),
	note: { marginTop: '0.9rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

export default function ExtrapolationBreakFix() {
	const [m, setM] = useState(64);
	const [fix, setFix] = useState(false);

	const effPos = fix ? m * (L_TRAIN / L_MAX) : m;
	const angle = effPos * THETA; // радианы
	const trainedMax = L_TRAIN * THETA; // край обученной дуги
	const inRange = angle <= trainedMax + 1e-9;
	const v = polar(angle);
	const color = inRange ? '#22c55e' : '#ef4444';
	const beyond = m > L_TRAIN;

	return (
		<div style={css.wrap}>
			<div style={css.title}>💥 Экстраполяция ломается — и как её чинят</div>
			<div style={css.desc}>Зелёная дуга — углы, которые модель видела при обучении (позиции 0…{L_TRAIN}). Двигай m за {L_TRAIN}: без патча стрелка уходит за дугу (OOD, красным). Включи интерполяцию позиций — позиция сжимается обратно в обученный диапазон. Иллюстративно, θ={THETA}.</div>

			<div style={css.main}>
				<svg width={CX * 2} height={CY * 2} role="img" aria-label={`угол ${(angle * 180 / Math.PI).toFixed(0)} градусов, ${inRange ? 'в диапазоне' : 'вне диапазона'}`}>
					<circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border)" strokeWidth="1.5" />
					<path d={arcPath(0, trainedMax)} fill="none" stroke="#22c55e" strokeWidth="6" strokeLinecap="round" opacity="0.55" />
					<line x1={CX} y1={CY} x2={v.x} y2={v.y} stroke={color} strokeWidth="3" strokeLinecap="round" />
					<circle cx={v.x} cy={v.y} r="4.5" fill={color} />
					<circle cx={CX} cy={CY} r="2.5" fill="var(--text-muted)" />
				</svg>

				<div style={css.controls}>
					<div style={css.sliderRow}>
						<span style={css.sliderLabel}>позиция m</span>
						<input style={css.slider} type="range" min={0} max={L_MAX} value={m} onChange={(e) => setM(Number(e.target.value))} />
						<span style={css.val('#8b5cf6')}>{m}</span>
					</div>
					<label style={css.toggle}>
						<input type="checkbox" checked={fix} onChange={(e) => setFix(e.target.checked)} style={{ accentColor: '#22c55e' }} />
						Интерполяция позиций (сжать позицию в обученный диапазон)
					</label>
					<div style={css.verdict(inRange)}>
						{inRange
							? (beyond ? `m=${m} > L_train, но угол вернулся в обученную дугу ✓` : `m=${m} ≤ L_train — угол в обученном диапазоне ✓`)
							: `m=${m} > L_train — угол вне обученной дуги, out-of-distribution ✗`}
					</div>
				</div>
			</div>

			<div style={css.note}>
				Простейший фикс — Position Interpolation (Chen, arXiv:2306.15595): позиция m отображается в m·L/L′, возвращаясь в обученный диапазон (LLaMA растянули до 32768 за &lt;1000 шагов дообучения). NTK-aware (community, bloc97) и YaRN (arXiv:2309.00071) делают это умнее — растягивают низкие частоты сильнее высоких (b′ = b·s^(|D|/(|D|−2))), плюс YaRN добавляет температуру внимания √(1/t) = 0.1·ln(s)+1.
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/article/ExtrapolationBreakFix.tsx
git commit -m "Add ExtrapolationBreakFix component for positional encoding article"
```

---

### Task 6: Write the article `positional-encoding-rope.mdx`

**Files:**
- Create: `src/content/blog/positional-encoding-rope.mdx`

**Interfaces:**
- Consumes: all 5 components from Tasks 1–5 (`<Name client:visible />`), plus `Callout.astro`, `StepList.astro` (`steps={[{num,text}]}`).

- [ ] **Step 1: Write the full article**

````mdx
---
title: 'Позиционное кодирование: RoPE, YaRN и почему Inkling от них отказался 🎡📐'
description: 'Зачем трансформеру позиция, как RoPE поворачивает векторы на угол m·θ, почему это относительное кодирование, где оно ломается на длинном контексте и как чинят (NTK, YaRN) — плюс контртезис: Thinking Machines в Inkling выкинула RoPE. С пятью визуальными демками механики.'
pubDate: 'Aug 01 2026'
category: 'фундамент'
---

import Callout from '../../components/article/Callout.astro';
import StepList from '../../components/article/StepList.astro';
import PermutationInvariance from '../../components/article/PermutationInvariance';
import RopeRotation from '../../components/article/RopeRotation';
import FrequencySpectrum from '../../components/article/FrequencySpectrum';
import RelativePhase from '../../components/article/RelativePhase';
import ExtrapolationBreakFix from '../../components/article/ExtrapolationBreakFix';

Ну чё, малютки, в июле 2026 Thinking Machines выпустила Inkling и мимоходом сделала то, чего фронтир не делал с 2023-го: выкинула RoPE. Дословно — «relative positional embedding работает лучше и лучше экстраполируется на длинные последовательности, чем более распространённый Rotary Positional Embedding». Чтобы понять, почему это новость, надо понять, что вообще делает RoPE — и почему трансформеру без позиционного кодирования всё равно, в каком порядке идут токены. Разбираем механику от начала до конца, с визуальными демками: RoPE — это буквально вращение векторов, и его удобнее один раз увидеть, чем прочитать десять формул.

<Callout type="fire" title="Суть за 10 секунд">
Self-attention перестановочно-инвариантен — сам по себе он не различает порядок токенов, позицию надо впрыснуть отдельно. **RoPE** делает это поворотом: вектор на позиции m поворачивается на угол m·θ, причём разные пары измерений вращаются с разными частотами. Красота в том, что скалярное произведение зависит только от разности позиций (m−n) — то есть кодирование относительное. Ломается RoPE за длиной обучения: углы уходят out-of-distribution. Чинят интерполяцией позиций — **NTK-aware** и **YaRN**. А **Inkling** утверждает, что относительное смещение вместо RoPE экстраполируется лучше.
</Callout>

---

## Часть 1: Зачем трансформеру вообще позиция

Self-attention считает для каждого токена взвешенную сумму остальных — и в этой операции нет ничего про порядок. Переставь входные токены местами, и выход переставится ровно так же, но содержательно не изменится: attention видит **множество** токенов, а не последовательность. Для языка это катастрофа — «кот ловит мышь» и «мышь ловит кот» стали бы неразличимы. Позиционную информацию нужно добавить руками.

<PermutationInvariance client:visible />

Исторически было два лагеря. **Абсолютное** кодирование — приклеить к каждому токену вектор его позиции: синусоиды из оригинального «Attention Is All You Need» или обучаемые эмбеддинги позиций. **Относительное** — кодировать не «токен на позиции 5», а «токен на 3 позиции левее». RoPE хитро совмещает удобство первого с семантикой второго.

---

## Часть 2: RoPE как поворот

Идея RoPE (Su et al., «RoFormer», arXiv:2104.09864) — не прибавлять позицию к вектору, а **поворачивать** сам вектор запроса и ключа на угол, пропорциональный позиции. Измерения берутся парами (2i, 2i+1), и каждая пара вращается как точка на плоскости. Для одной пары на позиции m:

$$
f_{\{q,k\}}(x_m, m) = \begin{pmatrix} \cos m\theta & -\sin m\theta \\ \sin m\theta & \cos m\theta \end{pmatrix} \begin{pmatrix} x_m^{(1)} \\ x_m^{(2)} \end{pmatrix}
$$

Целиком по всем измерениям это блочно-диагональная матрица поворота $R^d_{\Theta,m}$, где i-я пара крутится со своей частотой:

$$
\theta_i = 10000^{-2i/d}, \quad i \in [0, d/2 - 1]
$$

(в пейпере эта же величина написана и в 1-индексной форме $10000^{-2(i-1)/d}$ — это тот же набор частот, просто другая нумерация). База 10000 — та же, что в синусоидах оригинального трансформера.

<RopeRotation client:visible />

Низкие измерения (маленькое i, θ близко к 1) вращаются быстро — полный оборот за считанные позиции. Высокие (большое i, θ крошечное) едва ползут — им нужны тысячи позиций на оборот.

---

## Часть 3: Почему это относительное кодирование

Вот главный трюк. Хотя RoPE задаётся через **абсолютную** позицию m, скалярное произведение повёрнутого запроса и повёрнутого ключа зависит только от **разности** позиций:

$$
\langle f_q(x_m, m),\, f_k(x_n, n) \rangle = g(x_m, x_n, m - n)
$$

(RoFormer, уравнение 11). Поворот на m и поворот на n при перемножении дают поворот на (m−n) — абсолютные углы сокращаются, остаётся относительный. То есть attention через RoPE видит «на сколько позиций один токен отстоит от другого», а не «какой у каждого абсолютный индекс».

<RelativePhase client:visible />

А разброс частот по измерениям (из Части 2) означает, что RoPE кодирует относительные расстояния сразу на многих масштабах — от «соседний токен» до «за тысячу позиций». Само слово «длина волны» для этих измерений закрепил позже пейпер YaRN; RoFormer называл это «long-term decay».

<FrequencySpectrum client:visible />

---

## Часть 4: Где RoPE ломается и как чинят

Проблема вылезает, когда на инференсе последовательность длиннее, чем всё, что модель видела при обучении. Пусть при обучении позиции доходили до L_train. Тогда для каждой пары измерений модель видела углы только в диапазоне [0, θ·L_train]. На позиции m > L_train угол m·θ уходит за этот диапазон — в область, которой при обучении не было. Модель получает паттерн вращения, на который её не учили, и качество сыпется.

<ExtrapolationBreakFix client:visible />

Чинят это интерполяцией позиций, и есть три уровня хитрости:

- **Position Interpolation** (Chen et al., arXiv:2306.15595) — в лоб: отобразить позицию m в $m \cdot L/L'$, линейно сжав весь диапазон обратно в обученный. Так LLaMA растянули с 2048 до 32768 контекста меньше чем за 1000 шагов дообучения.
- **NTK-aware interpolation** — придумано в community-посте (bloc97, r/LocalLLaMA, середина 2023, потом зафиксировано в пейпере YaRN): вместо равномерного сжатия всех частот масштабируют **базу** неравномерно — $b' = b \cdot s^{|D|/(|D|-2)}$, где s — коэффициент расширения. Высокие частоты почти не трогают, низкие растягивают. Меньше портит близкие расстояния.
- **YaRN** (Peng et al., arXiv:2309.00071) — «NTK-by-parts» (интерполировать по-разному в зависимости от длины волны измерения) плюс температурный трюк на внимании: домножить логиты так, чтобы $\sqrt{1/t} = 0.1 \ln(s) + 1$. YaRN расширяет контекст до 128k, требуя, по заявлению авторов, «в 10 раз меньше токенов и в 2.5 раза меньше шагов обучения», чем прежние методы.

---

## Часть 5: Контртезис Inkling

И вот тут возвращаемся к началу. Thinking Machines в Inkling (июль 2026) решила, что вся эта конструкция — вращение плюс патчи на экстраполяцию — не оптимальна, и заменила RoPE на **relative positional embedding** (по формулировке анонса; «выученное» — это уже наша интерпретация, дословно они говорят просто «relative positional embedding»). Их заявление: оно «работает лучше и экстраполируется лучше на длинные последовательности, чем более распространённый RoPE».

Плюс — деталь, которая тут неслучайна: Inkling добавляет **короткие свёртки** в двух местах — после проекций key и value в каждом слое внимания и на residual-ветках внимания и MLP. Свёртка по своей природе кодирует локальный порядок соседних токенов — то есть часть работы позиционного кодирования уходит в неё.

Насколько это лучше RoPE на практике — покажут независимые замеры (Inkling — свежая модель: 975B параметров всего / 41B активных, MoE из 256 роутизируемых + 2 shared экспертов, sliding-window и global attention в пропорции 5:1, контекст до 1M, 45 триллионов мультимодальных токенов претрейна). Но сам факт, что фронтир-лаборатория ставит под сомнение стандарт де-факто трёх последних лет, — уже сигнал, что позиционное кодирование не «решённая» тема.

---

## TL;DR

<StepList steps={[
	{ num: "1", text: "<strong>Зачем:</strong> self-attention перестановочно-инвариантен — без позиционного кодирования не различает порядок токенов" },
	{ num: "2", text: "<strong>RoPE</strong> (RoFormer, arXiv:2104.09864): поворот вектора на угол m·θ, пары измерений вращаются с частотами θ_i = 10000^(−2i/d) — низкие измерения быстро, высокие медленно" },
	{ num: "3", text: "<strong>Относительность:</strong> ⟨f_q(x_m,m), f_k(x_n,n)⟩ = g(x_m,x_n,m−n) — dot-product зависит только от разности позиций, хоть RoPE и задан через абсолютную" },
	{ num: "4", text: "<strong>Ломается</strong> за длиной обучения: углы m·θ уходят out-of-distribution. Чинят интерполяцией: Position Interpolation (m→m·L/L′), NTK-aware (масштаб базы b′=b·s^(|D|/(|D|−2))), YaRN (+ температура √(1/t)=0.1·ln(s)+1, до 128k)" },
	{ num: "5", text: "<strong>Inkling</strong> (Thinking Machines, июль 2026): выкинула RoPE ради relative positional embedding + коротких свёрток, заявляя лучшую экстраполяцию — фронтир ставит под сомнение стандарт де-факто" },
]} />

RoPE — красивая идея: закодировать относительную позицию через абсолютный поворот, бесплатно получив свойство m−n. Но «бесплатно» кончается ровно на границе длины обучения, и всё, что дальше — интерполяционные костыли той или иной степени изящества. Inkling предлагает не чинить, а заменить. Кто прав — узнаем по независимым длинноконтекстным замерам, а не по строчке в анонсе. 🫡

---

### Источники

1. [RoFormer: Enhanced Transformer with Rotary Position Embedding — Su et al. (arXiv:2104.09864)](https://arxiv.org/abs/2104.09864)
2. [Extending Context Window of LLMs via Positional Interpolation — Chen et al. (arXiv:2306.15595)](https://arxiv.org/abs/2306.15595)
3. [YaRN: Efficient Context Window Extension of Large Language Models — Peng et al. (arXiv:2309.00071)](https://arxiv.org/abs/2309.00071)
4. [Train Short, Test Long: Attention with Linear Biases (ALiBi) — Press et al. (arXiv:2108.12409)](https://arxiv.org/abs/2108.12409)
5. [Introducing Inkling — Thinking Machines Lab](https://thinkingmachines.ai/news/introducing-inkling/)
6. [KV-кэш: почему LLM помнит без памяти и жрёт VRAM](/blog/kv-cache/)
7. [FlashAttention: как реально считается attention на GPU](/blog/flashattention/)
8. [Kimi K3: open-weight модель обгоняет Claude Opus 4.8](/blog/kimi-k3/)
````

- [ ] **Step 2: Verify frontmatter, imports, and MDX/KaTeX compile**

Run: `npm run build 2>&1 | tail -40`
Expected: build completes, no errors mentioning `positional-encoding-rope.mdx` or the 5 component files. Watch for MDX curly-brace gotchas — the LaTeX is inside `$$`/`$...$` (handled by remark-math). The prose uses `θ_i`, `m·θ`, `(m−n)` as plain Unicode text (not bare `{...}`), so no JS-expression trap. If the build errors on an expression, wrap the fragment in backticks. (Full verification is Task 7.)

- [ ] **Step 3: Commit**

```bash
git add src/content/blog/positional-encoding-rope.mdx
git commit -m "Add positional encoding (RoPE/YaRN) article"
```

---

### Task 7: Build and browser verification

**Files:** none created — verification only.

- [ ] **Step 1: Run the production build**

Run: `npm run build 2>&1 | tail -40`
Expected: `[build] Complete!`, page count +1, no errors referencing this article. (Ignore pre-existing `unicodeTextInMathMode` warnings from rlhf-dpo-grpo.mdx unless one references this file.)

- [ ] **Step 2: Start preview**

```bash
npm run preview &
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/blog/positional-encoding-rope/
```
Expected: `200`.

- [ ] **Step 3: Browser check — all 5 components + formulas**

Using chrome-devtools MCP (`navigate_page`, `take_screenshot`, `evaluate_script`, `list_console_messages`): navigate to `http://localhost:4321/blog/positional-encoding-rope/`, then:
- `PermutationInvariance`: screenshot, click "🔀 Перемешать" a couple times — confirm token order visibly changes while the Σ readout stays the same.
- `RopeRotation` (anchor): screenshot, drag the position slider (via `evaluate_script` set `input[type=range].value` + dispatch `input` event, or click) — confirm the 4 SVG vectors rotate to different angles and the low-freq dial spins much faster than the high-freq one. MUST actually move.
- `FrequencySpectrum`: screenshot — confirm 8 bars increasing in length (log-scale), wavelength labels from ~6 to ~6283.
- `RelativePhase`: screenshot, move m and n sliders — confirm the two SVG vectors (purple/blue) move and the "разность фаз" readout updates; confirm shifting both m and n by the same amount keeps the difference readout constant.
- `ExtrapolationBreakFix`: screenshot with slider past L_train=32 and fix OFF (vector red, "out-of-distribution"), then toggle NTK/YaRN checkbox ON (vector returns green, "в диапазоне"). Confirm the green trained-arc renders and the vector color flips red↔green correctly.
- Formulas: confirm the RoPE rotation matrix, θ_i, relative-property, and YaRN temperature all render as typeset KaTeX (not raw `$$`).

Expected: every component renders and is interactive; SVG geometry is sensible (vectors inside their circles, arc visible); numbers match the source arrays.

- [ ] **Step 4: Console check** — `list_console_messages` types `["error","warn"]` after interaction; expect empty.

- [ ] **Step 5: Stop preview** — `pkill -f "astro preview" || true`.

- [ ] **Step 6: Manual unslop pass**

Read the prose against unslop `references/taboo-phrases.md`: binary-contrast "не X, а Y" (esp. closing paragraph), negative parallelisms, filler intensifiers. Note the article legitimately uses "не «решённая» тема" and "не чинить, а заменить" as real technical contrasts — use judgment. Do NOT strip em-dashes (house style). Preserve every formula, arXiv ID, and number verbatim; diff any edit; re-run build after.

- [ ] **Step 7: Commit any unslop fixes**

```bash
git add src/content/blog/positional-encoding-rope.mdx
git commit -m "Unslop pass on positional encoding article"
```
(Skip if no changes.)

---

## Self-Review Notes

- **Spec coverage:** all 6 content parts (hook + 5 parts), all 5 mechanic-showing components (no timeline/quiz — direct answer to the review's "components got formulaic" note), and the cross-links (kv-cache, flashattention, kimi-k3) from `docs/superpowers/specs/2026-08-01-positional-encoding-rope-design.md` are covered — Tasks 1–5 (components) + Task 6 (article) + Task 7 (verification).
- **Binding fact hedges preserved:** the wavelength framing is attributed to YaRN (not RoFormer) in both `FrequencySpectrum.tsx` and the prose; θ_i is given 0-indexed with a note that the paper also prints the 1-indexed form; NTK origin is hedged as community/bloc97-via-YaRN; the Inkling quote is verbatim with "learned" flagged as inference; Inkling's "6 routed active + 2 shared" and "45T multimodal" are stated precisely; YaRN temperature and NTK base formulas are exact.
- **Placeholder scan:** no TBD/TODO; every numeric/formula claim traces to a cited source; component illustrative numbers (θ=[1,0.1,0.01,0.001], wavelengths 6.3/62.8/628/6283) are NumPy-verified and labeled "иллюстративно, d=8".
- **Type consistency:** all 5 components are parameterless default exports matching the `<Name client:visible />` usage — names verified exact (`PermutationInvariance`, `RopeRotation`, `FrequencySpectrum`, `RelativePhase`, `ExtrapolationBreakFix`).
- **Deterministic shuffle:** `PermutationInvariance` uses a deterministic seed-based shuffle for reproducibility (fine in-browser; not because Math.random is unavailable there — it's a testability choice) — confirmed the shuffle produces distinct orders per seed while the Σ readout stays constant.
- **heroImage** intentionally omitted from Task 6 frontmatter — deferred to a manual follow-up.
