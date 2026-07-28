# FlashAttention Article Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a new blog article `src/content/blog/flashattention.mdx` (slug `flashattention`, category «фундамент») explaining FlashAttention — the IO-aware tiled attention algorithm — with three new interactive React components and real, verified code.

**Architecture:** Three self-contained `client:visible` React islands in `src/components/article/` (no shared state, no new npm dependencies), embedded in an MDX article that follows the site's existing article conventions (Callout/QuantCard for static asides, cross-links to three already-published articles). All algorithmic claims in the article are either exactly computed (memory scaling formulas) or backed by a verified local script (online-softmax numerical equivalence) or an explicit external citation with a link — nothing is fabricated.

**Tech Stack:** Astro 5 + React 19 (existing site stack), plain inline-style TSX components matching existing article components (`ChunkingVisualizer.tsx`, `RagArchitectureExplorer.tsx` are the closest precedents), NumPy (system Python, already installed, no new dependency) for the one-off numerical verification script.

## Global Constraints

- No working GPU/CUDA on this machine (NVML/kernel-module version mismatch) — do not attempt to install PyTorch or run CUDA code. All naive-attention verification uses NumPy (already installed system-wide via `python3 -c "import numpy"`), not PyTorch, despite the spec mentioning PyTorch — this is a scoped substitution to avoid a large new install on a disk at 97% full (18GB free); the `flash_attn`/`scaled_dot_product_attention` code shown in the article is real PyTorch API syntax but is reference-only, explicitly marked in prose as "not run locally."
- No new npm dependencies — all three components are pure React/TSX + inline styles, following `src/components/article/ChunkingVisualizer.tsx` conventions (CSS vars: `var(--accent)`, `var(--bg-card)`, `var(--border)`, `var(--text-secondary)`, etc.).
- Category: «фундамент». File: `src/content/blog/flashattention.mdx`. Components: `src/components/article/MemoryHierarchyExplorer.tsx`, `src/components/article/TilingSimulator.tsx`, `src/components/article/BenchmarkCompare.tsx`.
- Cross-link to `/blog/kv-cache/`, `/blog/speculative-decoding/`, `/blog/llm_inference_engines_complete_guide/` (inline clause style, matching the RAG article's internal-linking pattern — see `src/content/blog/rag-complete-guide.mdx` for the established phrasing convention).
- Images (2-3 illustrative) and heroImage are explicitly OUT of this plan's scope — they require user-supplied files after the text is written, per the spec's own "Обложка"/"Картинки" sections. This plan ends with a publishable article that has no images yet; a manual follow-up step (not a task here) proposes image concepts and waits for the user.
- No test framework in this repo (`CLAUDE.md`: "No test suite, no linter configured"). Verification per task = a runnable one-off script (for the NumPy algorithm check) or `npm run build` + browser check via chrome-devtools-mcp (for components/article), matching how prior articles in this repo were verified.

---

## File Structure

- **Create** `/tmp/.../scratchpad/flash_verify.py` (or equivalent scratch path) — one-off NumPy script, NOT committed to the repo (dev-time proof only, mirrors how prior chunking-algorithm verification was done in this project's history).
- **Create** `src/components/article/MemoryHierarchyExplorer.tsx` — SRAM vs HBM comparison, click-to-expand detail per card.
- **Create** `src/components/article/TilingSimulator.tsx` — flagship step-through demo of tiled online-softmax attention, using the exact verified toy trace from the NumPy script.
- **Create** `src/components/article/BenchmarkCompare.tsx` — context-length preset switcher showing exactly-computed naive-vs-flash intermediate memory, plus one cited external headline claim.
- **Create** `src/content/blog/flashattention.mdx` — the article itself, importing all three components plus existing `Callout`/`QuantCard`.

---

### Task 1: Verify naive vs tiled/online-softmax attention numerically (NumPy)

**Files:**
- Create (scratch, not committed): `/tmp/claude-1000/-home-mr8bit-Projects-blog/7b0c6b05-55b5-485b-91d0-52fe80b09a4c/scratchpad/flash_verify.py`

**Interfaces:**
- Produces: a verified numeric trace (per-block raw scores, local max, running max, correction factor, running sum) for query row 0 across 4 KV blocks, seed=42 — consumed verbatim by Task 3 (`TilingSimulator.tsx`'s `STEPS` constant).

- [ ] **Step 1: Write the verification script**

```python
import numpy as np

np.random.seed(42)

# Toy sizes: 16 "tokens", head dim 8, split into 4 blocks of 4 tokens each
N, D, BLOCK = 16, 8, 4
n_blocks = N // BLOCK

Q = np.random.randn(N, D).astype(np.float64)
K = np.random.randn(N, D).astype(np.float64)
V = np.random.randn(N, D).astype(np.float64)
scale = 1.0 / np.sqrt(D)

# ---- naive full attention ----
S = (Q @ K.T) * scale
S_max = S.max(axis=1, keepdims=True)
P = np.exp(S - S_max)
P_sum = P.sum(axis=1, keepdims=True)
P_norm = P / P_sum
O_naive = P_norm @ V

# ---- tiled / online-softmax attention ----
O_tiled = np.zeros((N, D))
m = np.full((N, 1), -np.inf)   # running max
l = np.zeros((N, 1))           # running sum of exp

for j in range(n_blocks):
    Kj = K[j*BLOCK:(j+1)*BLOCK]
    Vj = V[j*BLOCK:(j+1)*BLOCK]
    Sij = (Q @ Kj.T) * scale                  # (N, BLOCK)
    m_ij = Sij.max(axis=1, keepdims=True)
    m_new = np.maximum(m, m_ij)
    P_ij = np.exp(Sij - m_new)
    l_ij = P_ij.sum(axis=1, keepdims=True)
    correction = np.exp(m - m_new)
    correction = np.where(np.isneginf(m), 0.0, correction)
    l = correction * l + l_ij
    O_tiled = correction * O_tiled + P_ij @ Vj
    m = m_new

O_tiled_final = O_tiled / l

print("max abs diff:", np.max(np.abs(O_naive - O_tiled_final)))
print("allclose:", np.allclose(O_naive, O_tiled_final, atol=1e-10))
assert np.allclose(O_naive, O_tiled_final, atol=1e-10), "tiled attention does not match naive!"

# ---- single-query trace (query row 0) for the TilingSimulator toy dataset ----
q0 = Q[0:1]
print("\n--- trace for query row 0 across 4 KV blocks ---")
m0, l0, o0 = -np.inf, 0.0, np.zeros(D)
for j in range(n_blocks):
    Kj = K[j*BLOCK:(j+1)*BLOCK]
    Vj = V[j*BLOCK:(j+1)*BLOCK]
    Sij = (q0 @ Kj.T) * scale
    Sij = Sij[0]
    m_ij = float(Sij.max())
    m_new = max(m0, m_ij)
    Pij = np.exp(Sij - m_new)
    l_ij = float(Pij.sum())
    corr = 0.0 if m0 == -np.inf else float(np.exp(m0 - m_new))
    l_new = corr * l0 + l_ij
    o_new = corr * o0 + Pij @ Vj
    print(f"block {j}: raw_scores={np.round(Sij,4).tolist()} local_max={m_ij:.4f} "
          f"m_new={m_new:.4f} correction={corr:.4f} l_ij={l_ij:.4f} l_new={l_new:.4f}")
    m0, l0, o0 = m_new, l_new, o_new

print("\nfinal running max m:", round(m0,4))
print("final running sum l:", round(l0,4))
print("final output o (first 4 dims):", np.round(o0[:4]/l0, 4).tolist())
print("direct softmax output row0 (first 4 dims):", np.round(O_naive[0][:4], 4).tolist())
```

- [ ] **Step 2: Run it**

Run: `python3 /tmp/claude-1000/-home-mr8bit-Projects-blog/7b0c6b05-55b5-485b-91d0-52fe80b09a4c/scratchpad/flash_verify.py`

Expected output (already captured — re-running with the same seed must reproduce exactly):
```
max abs diff: 4.440892098500626e-16
allclose: True

--- trace for query row 0 across 4 KV blocks ---
block 0: raw_scores=[-0.3201, -1.5728, -0.8208, -1.129] local_max=-0.3201 m_new=-0.3201 correction=0.0000 l_ij=2.3372 l_new=2.3372
block 1: raw_scores=[0.4735, -0.2922, 0.8875, 0.1736] local_max=0.8875 m_new=0.8875 correction=0.2989 l_ij=2.4581 l_new=3.1567
block 2: raw_scores=[0.1285, 1.4695, 0.5413, -0.2827] local_max=1.4695 m_new=1.4695 correction=0.5588 l_ij=1.8302 l_new=3.5941
block 3: raw_scores=[-1.0478, 0.8862, 0.1329, -0.7451] local_max=0.8862 m_new=1.4695 correction=1.0000 l_ij=1.0106 l_new=4.6047

final running max m: 1.4695
final running sum l: 4.6047
final output o (first 4 dims): [0.33, 0.291, 0.2549, -0.2202]
direct softmax output row0 (first 4 dims): [0.33, 0.291, 0.2549, -0.2202]
```

If the assert fails or numbers differ: STOP — do not proceed to Task 3 with different numbers than what's transcribed there; re-derive Task 3's `STEPS` constant from the actual new output instead.

- [ ] **Step 3: No commit** — this script is a scratch dev-time proof, not repo content. Do not `git add` it.

---

### Task 2: `MemoryHierarchyExplorer.tsx`

**Files:**
- Create: `src/components/article/MemoryHierarchyExplorer.tsx`

**Interfaces:**
- Produces: default export React component, no props. Used in article as `<MemoryHierarchyExplorer client:visible />`.

- [ ] **Step 1: Write the component**

```tsx
import { useState } from 'react';

interface Tier {
	key: string;
	label: string;
	sub: string;
	capacity: string;
	bandwidth: string;
	color: string;
	detail: string;
}

// Источник цифр: FlashAttention paper (Dao et al., 2022), раздел про GPU memory hierarchy —
// NVIDIA A100: 192KB SRAM на каждый из 108 SM (~20MB совокупно), HBM 40-80GB.
const TIERS: Tier[] = [
	{
		key: 'sram',
		label: 'SRAM',
		sub: 'on-chip, по одному куску на каждый Streaming Multiprocessor',
		capacity: '~20 МБ',
		bandwidth: '~19 ТБ/с',
		color: 'var(--accent)',
		detail: 'На NVIDIA A100 — 192 КБ SRAM на каждый из 108 SM. Крошечная, но моментально доступная память прямо рядом с вычислительными блоками. Именно сюда FlashAttention грузит блоки Q/K/V перед вычислением.',
	},
	{
		key: 'hbm',
		label: 'HBM',
		sub: 'off-chip, общая для всего GPU',
		capacity: '40–80 ГБ',
		bandwidth: '~1.5–2 ТБ/с',
		color: 'var(--accent-secondary)',
		detail: 'Основная память GPU — та самая VRAM, о которой ты думаешь, когда видишь OOM. Огромная по объёму, но на порядок медленнее SRAM. Naive attention гоняет через неё полную N×N-матрицу внимания трижды.',
	},
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
	grid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(2, 1fr)',
		gap: '1rem',
		marginBottom: '1.1rem',
	} as React.CSSProperties,
	card: (color: string, active: boolean) => ({
		padding: '1.1rem',
		borderRadius: '10px',
		border: `1px solid ${active ? color : 'var(--border)'}`,
		background: active ? `color-mix(in srgb, ${color} 10%, var(--bg-secondary))` : 'var(--bg-secondary)',
		cursor: 'pointer',
		textAlign: 'left' as const,
		transition: 'all 0.15s ease',
	} as React.CSSProperties),
	tierLabel: (color: string) => ({
		fontSize: '1.1rem',
		fontWeight: 800,
		color,
		marginBottom: '0.15rem',
	} as React.CSSProperties),
	tierSub: {
		fontSize: '0.72rem',
		color: 'var(--text-muted)',
		marginBottom: '0.75rem',
		lineHeight: 1.4,
	} as React.CSSProperties,
	statRow: {
		display: 'flex',
		justifyContent: 'space-between',
		fontSize: '0.82rem',
		color: 'var(--text-secondary)',
		padding: '0.25rem 0',
	} as React.CSSProperties,
	statVal: {
		fontWeight: 700,
		color: 'var(--text)',
		fontVariantNumeric: 'tabular-nums' as const,
	} as React.CSSProperties,
	detail: {
		padding: '0.9rem 1rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		fontSize: '0.88rem',
		color: 'var(--text-secondary)',
		lineHeight: 1.6,
	} as React.CSSProperties,
};

export default function MemoryHierarchyExplorer() {
	const [active, setActive] = useState<string>('sram');
	const tier = TIERS.find((t) => t.key === active)!;

	return (
		<div style={css.wrap}>
			<div style={css.title}>🧱 Иерархия памяти GPU</div>
			<div style={css.desc}>
				Кликни по каждому уровню — разница в скорости и в объёме между ними и есть та причина, по которой naive attention упирается в память, а не в арифметику.
			</div>

			<div style={css.grid}>
				{TIERS.map((t) => (
					<button key={t.key} style={css.card(t.color, t.key === active)} onClick={() => setActive(t.key)}>
						<div style={css.tierLabel(t.color)}>{t.label}</div>
						<div style={css.tierSub}>{t.sub}</div>
						<div style={css.statRow}><span>Объём</span><span style={css.statVal}>{t.capacity}</span></div>
						<div style={css.statRow}><span>Пропускная способность</span><span style={css.statVal}>{t.bandwidth}</span></div>
					</button>
				))}
			</div>

			<div style={css.detail}>{tier.detail}</div>
		</div>
	);
}
```

- [ ] **Step 2: Note on verification**

`@astrojs/check` is not installed in this project (do not install it — it's an unnecessary new dependency this task doesn't need). Nothing imports this component yet (it's only wired into the article in Task 6), so `npm run build` at this point would not actually compile/type-check it — a real compile error here would only surface once Task 6 adds the import. Task 7 ("Build and browser verification") is where this component gets its first real compile check and its first visual check; treat this task as "written, ready to be wired in," not "independently verified."

- [ ] **Step 3: Commit**

```bash
git add src/components/article/MemoryHierarchyExplorer.tsx
git commit -m "Add MemoryHierarchyExplorer component for FlashAttention article"
```

---

### Task 3: `TilingSimulator.tsx` (flagship)

**Files:**
- Create: `src/components/article/TilingSimulator.tsx`

**Interfaces:**
- Consumes: the exact verified trace numbers from Task 1's script output.
- Produces: default export React component, no props. Used in article as `<TilingSimulator client:visible />`.

- [ ] **Step 1: Write the component**

```tsx
import { Fragment, useEffect, useState } from 'react';

interface Step {
	block: number;
	rawScores: number[];
	localMax: number;
	mNew: number;
	correction: number;
	lIj: number;
	lNew: number;
}

// Верифицировано NumPy-скриптом (naive full-softmax vs tiled/online-softmax attention,
// seed=42, 16 токенов, head dim 8, блок 4): max abs diff между двумя способами — 4.44e-16
// (машинный ноль). Трасса ниже — для query-ряда 0 при проходе по 4 KV-блокам.
const STEPS: Step[] = [
	{ block: 0, rawScores: [-0.3201, -1.5728, -0.8208, -1.129], localMax: -0.3201, mNew: -0.3201, correction: 0.0, lIj: 2.3372, lNew: 2.3372 },
	{ block: 1, rawScores: [0.4735, -0.2922, 0.8875, 0.1736], localMax: 0.8875, mNew: 0.8875, correction: 0.2989, lIj: 2.4581, lNew: 3.1567 },
	{ block: 2, rawScores: [0.1285, 1.4695, 0.5413, -0.2827], localMax: 1.4695, mNew: 1.4695, correction: 0.5588, lIj: 1.8302, lNew: 3.5941 },
	{ block: 3, rawScores: [-1.0478, 0.8862, 0.1329, -0.7451], localMax: 0.8862, mNew: 1.4695, correction: 1.0, lIj: 1.0106, lNew: 4.6047 },
];

const FINAL_M = 1.4695;
const FINAL_L = 4.6047;
const DIRECT_SOFTMAX_OUTPUT = [0.33, 0.291, 0.2549, -0.2202];

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
	blocksRow: {
		display: 'grid',
		gridTemplateColumns: 'repeat(4, 1fr)',
		gap: '0.6rem',
		marginBottom: '1.1rem',
	} as React.CSSProperties,
	blockBox: (state: 'done' | 'active' | 'pending') => ({
		padding: '0.75rem 0.5rem',
		borderRadius: '10px',
		textAlign: 'center' as const,
		border: `1px solid ${state === 'active' ? 'var(--accent)' : 'var(--border)'}`,
		background: state === 'active'
			? 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, var(--bg-card)), color-mix(in srgb, var(--accent-secondary) 14%, var(--bg-card)))'
			: 'var(--bg-secondary)',
		opacity: state === 'pending' ? 0.45 : 1,
		boxShadow: state === 'active' ? '0 0 16px rgba(255, 107, 43, 0.25)' : 'none',
		transition: 'all 0.2s ease',
	} as React.CSSProperties),
	blockLabel: {
		fontSize: '0.7rem',
		fontWeight: 700,
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		marginBottom: '0.3rem',
	} as React.CSSProperties,
	blockScores: {
		fontSize: '0.72rem',
		color: 'var(--text-secondary)',
		fontVariantNumeric: 'tabular-nums' as const,
	} as React.CSSProperties,
	statsGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(2, 1fr)',
		gap: '0.6rem',
		marginBottom: '1.1rem',
	} as React.CSSProperties,
	statBox: {
		padding: '0.7rem 0.9rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
	} as React.CSSProperties,
	statLabel: {
		fontSize: '0.7rem',
		color: 'var(--text-muted)',
		marginBottom: '0.2rem',
	} as React.CSSProperties,
	statVal: {
		fontSize: '1.05rem',
		fontWeight: 800,
		color: 'var(--text)',
		fontVariantNumeric: 'tabular-nums' as const,
	} as React.CSSProperties,
	ctrlRow: {
		display: 'flex',
		gap: '0.5rem',
		marginBottom: '1.1rem',
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
	verdict: {
		padding: '0.9rem 1rem',
		borderRadius: '10px',
		background: 'color-mix(in srgb, var(--accent-secondary) 10%, var(--bg-secondary))',
		border: '1px solid var(--accent-secondary)',
		fontSize: '0.88rem',
		color: 'var(--text-secondary)',
		lineHeight: 1.6,
	} as React.CSSProperties,
};

export default function TilingSimulator() {
	const [stepIdx, setStepIdx] = useState(0);
	const [playing, setPlaying] = useState(false);

	useEffect(() => {
		if (!playing) return;
		if (stepIdx >= STEPS.length - 1) { setPlaying(false); return; }
		const t = setTimeout(() => setStepIdx((i) => i + 1), 1800);
		return () => clearTimeout(t);
	}, [playing, stepIdx]);

	const current = STEPS[stepIdx];
	const isLast = stepIdx === STEPS.length - 1;

	return (
		<div style={css.wrap}>
			<div style={css.title}>🧩 Тайлинг вживую: online softmax по блокам</div>
			<div style={css.desc}>
				Один query-ряд, 4 KV-блока по 4 ключа. Полная строка внимания (все 16 очков сразу) никогда не существует в памяти целиком — на каждом шаге в SRAM загружается только текущий блок, а бегущие max и sum корректируются на лету.
			</div>

			<div style={css.blocksRow}>
				{STEPS.map((s, i) => (
					<div key={s.block} style={css.blockBox(i < stepIdx ? 'done' : i === stepIdx ? 'active' : 'pending')}>
						<div style={css.blockLabel}>Блок {s.block}</div>
						<div style={css.blockScores}>{s.rawScores.map((v) => v.toFixed(2)).join(', ')}</div>
					</div>
				))}
			</div>

			<div style={css.statsGrid}>
				<div style={css.statBox}>
					<div style={css.statLabel}>Бегущий max (m)</div>
					<div style={css.statVal}>{current.mNew.toFixed(4)}</div>
				</div>
				<div style={css.statBox}>
					<div style={css.statLabel}>Коэффициент коррекции</div>
					<div style={css.statVal}>{current.correction.toFixed(4)}</div>
				</div>
				<div style={css.statBox}>
					<div style={css.statLabel}>Локальная сумма exp (блок)</div>
					<div style={css.statVal}>{current.lIj.toFixed(4)}</div>
				</div>
				<div style={css.statBox}>
					<div style={css.statLabel}>Бегущая сумма (l)</div>
					<div style={css.statVal}>{current.lNew.toFixed(4)}</div>
				</div>
			</div>

			<div style={css.ctrlRow}>
				<button style={css.ctrlBtn} onClick={() => setStepIdx((i) => Math.max(0, i - 1))} disabled={stepIdx === 0}>← Назад</button>
				<button
					style={css.ctrlBtn}
					onClick={() => {
						if (playing) { setPlaying(false); return; }
						if (isLast) { setStepIdx(0); setPlaying(true); return; }
						setPlaying(true);
					}}
				>
					{playing ? '⏸ Пауза' : isLast ? '↺ Сначала' : '▶ Играть'}
				</button>
				<button style={css.ctrlBtn} onClick={() => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))} disabled={isLast}>Вперёд →</button>
			</div>

			{isLast && (
				<div style={css.verdict}>
					После 4 блоков: m = {FINAL_M}, l = {FINAL_L}. Итоговый результат (первые 4 измерения): [{DIRECT_SOFTMAX_OUTPUT.join(', ')}] —
					{' '}<strong>то же самое число</strong>, что даёт обычный softmax по всем 16 очкам сразу, посчитанный за один проход. Разница в подходе к памяти, не в результате.
				</div>
			)}
		</div>
	);
}
```

- [ ] **Step 2: Note on verification**

Same as Task 2: not wired into the article yet, so no real compile check is possible here — Task 7 is where this component's compile and visual correctness are actually verified, including that the on-screen final numbers match Task 1's script output exactly.

- [ ] **Step 3: Commit**

```bash
git add src/components/article/TilingSimulator.tsx
git commit -m "Add TilingSimulator component for FlashAttention article"
```

---

### Task 4: `BenchmarkCompare.tsx`

**Files:**
- Create: `src/components/article/BenchmarkCompare.tsx`

**Interfaces:**
- Produces: default export React component, no props. Used in article as `<BenchmarkCompare client:visible />`.
- Memory numbers are computed live from an exact formula (not fabricated): naive attention materializes two N×N matrices (S and P) in fp16 → `2 * N * N * 2` bytes. FlashAttention never materializes them in HBM — its extra footprint for the attention computation itself is the SRAM tile only, which does not scale with N.

- [ ] **Step 1: Write the component**

```tsx
import { useMemo, useState } from 'react';

interface Preset {
	key: string;
	label: string;
	n: number;
}

const PRESETS: Preset[] = [
	{ key: '1k', label: '1K токенов', n: 1024 },
	{ key: '4k', label: '4K токенов', n: 4096 },
	{ key: '16k', label: '16K токенов', n: 16384 },
	{ key: '64k', label: '64K токенов', n: 65536 },
];

function formatBytes(bytes: number): string {
	if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} ГБ`;
	if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} МБ`;
	if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
	return `${bytes} Б`;
}

// Naive attention материализует в HBM две N×N-матрицы (S = QKᵀ и P = softmax(S)) в fp16 —
// это точная формула, не оценка. FlashAttention никогда не пишет S/P в HBM: они существуют
// только внутри блока в SRAM, поэтому их вклад в HBM-трафик не растёт с длиной контекста.
function naiveIntermediateBytes(n: number): number {
	return 2 * n * n * 2;
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
	presetRow: {
		display: 'flex',
		gap: '0.5rem',
		marginBottom: '1.25rem',
		flexWrap: 'wrap' as const,
	} as React.CSSProperties,
	presetBtn: (active: boolean) => ({
		padding: '0.4rem 0.9rem',
		borderRadius: '100px',
		border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
		background: active ? 'color-mix(in srgb, var(--accent) 14%, var(--bg-card))' : 'var(--bg-secondary)',
		color: active ? 'var(--accent-light)' : 'var(--text-secondary)',
		fontSize: '0.8rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
	} as React.CSSProperties),
	barRow: {
		marginBottom: '0.9rem',
	} as React.CSSProperties,
	barLabel: {
		display: 'flex',
		justifyContent: 'space-between',
		fontSize: '0.82rem',
		color: 'var(--text-secondary)',
		marginBottom: '0.35rem',
	} as React.CSSProperties,
	barTrack: {
		height: '10px',
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
		transition: 'width 0.25s ease',
	} as React.CSSProperties),
	citation: {
		marginTop: '1.1rem',
		padding: '0.9rem 1rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		fontSize: '0.85rem',
		color: 'var(--text-muted)',
		lineHeight: 1.6,
	} as React.CSSProperties,
};

export default function BenchmarkCompare() {
	const [presetKey, setPresetKey] = useState('4k');
	const preset = PRESETS.find((p) => p.key === presetKey)!;

	const naiveBytes = useMemo(() => naiveIntermediateBytes(preset.n), [preset.n]);
	const maxBytes = useMemo(() => naiveIntermediateBytes(PRESETS[PRESETS.length - 1].n), []);
	const naivePct = (naiveBytes / maxBytes) * 100;

	return (
		<div style={css.wrap}>
			<div style={css.title}>📊 Память: naive vs FlashAttention</div>
			<div style={css.desc}>
				Naive attention материализует в HBM две полные N×N-матрицы (S и P) в fp16 — это считается точно по формуле, не на глаз. FlashAttention их туда никогда не пишет: они живут только в SRAM, блок за блоком, поэтому этот объём не растёт с длиной контекста вообще.
			</div>

			<div style={css.presetRow}>
				{PRESETS.map((p) => (
					<button key={p.key} style={css.presetBtn(p.key === presetKey)} onClick={() => setPresetKey(p.key)}>{p.label}</button>
				))}
			</div>

			<div style={css.barRow}>
				<div style={css.barLabel}>
					<span>Naive: S + P в HBM</span>
					<span style={{ fontWeight: 700, color: 'var(--text)' }}>{formatBytes(naiveBytes)}</span>
				</div>
				<div style={css.barTrack}><div style={css.barFill(naivePct, 'var(--accent)')} /></div>
			</div>

			<div style={css.barRow}>
				<div style={css.barLabel}>
					<span>FlashAttention: S + P в HBM</span>
					<span style={{ fontWeight: 700, color: 'var(--text)' }}>0 Б (только SRAM)</span>
				</div>
				<div style={css.barTrack}><div style={css.barFill(0.6, 'var(--accent-secondary)')} /></div>
			</div>

			<div style={css.citation}>
				Квадратичный рост выше — точный расчёт по формуле (2 матрицы × N² × 2 байта), не бенчмарк. А по данным авторов FlashAttention: на GPT-2 (seq len 1K) — ускорение end-to-end обучения и заметно больший доступный контекст при том же бюджете VRAM (источник: <a href="https://github.com/Dao-AILab/flash-attention" target="_blank" rel="noopener">Dao-AILab/flash-attention</a>).
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Note on verification**

Same as Tasks 2 and 3: not wired into the article yet. Task 7 is where this component's compile and visual correctness (including the exact `2 * 65536 * 65536 * 2 = 16 GB` figure at the 64K preset) are actually verified.

- [ ] **Step 3: Commit**

```bash
git add src/components/article/BenchmarkCompare.tsx
git commit -m "Add BenchmarkCompare component for FlashAttention article"
```

---

### Task 5: Research and pin down the external citation numbers

**Files:** none created — this task only informs Task 6's prose (and, if numbers turn out meaningfully different, a follow-up edit to Task 2's `MemoryHierarchyExplorer.tsx` constants and Task 4's citation sentence).

**Interfaces:**
- Produces: verified/corrected values for (a) A100 SRAM/HBM capacity+bandwidth used in `MemoryHierarchyExplorer.tsx`, (b) the one-sentence headline speedup claim used in `BenchmarkCompare.tsx`'s citation and in article section 8/10 prose.

- [ ] **Step 1: Search for the canonical numbers**

Use WebSearch/WebFetch against:
- The FlashAttention paper (Dao, Fu, Ermon, Rudra, Ré — "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness", 2022), specifically its GPU memory hierarchy example (A100 SRAM/HBM figures) and its headline results (GPT-2 training speedup, longer context at same memory).
- The official repo `https://github.com/Dao-AILab/flash-attention` README for any updated benchmark table.

- [ ] **Step 2: Compare against the values already in the code**

`MemoryHierarchyExplorer.tsx` currently has: SRAM ~20MB / ~19TB/s, HBM 40-80GB / ~1.5-2TB/s. `BenchmarkCompare.tsx`'s citation currently says "ускорение end-to-end обучения и заметно больший доступный контекст" without a specific multiplier.

If research confirms a specific number (e.g., an exact "3×" or "15%" figure that's safe to state precisely), update:
- The citation sentence in `BenchmarkCompare.tsx` to include the exact figure with the source.
- Article prose in section 8/10 (written in Task 6) to match.

If the SRAM/HBM figures differ from what's hardcoded, correct `MemoryHierarchyExplorer.tsx`'s `TIERS` constant to match verified figures before Task 6 references them in prose.

- [ ] **Step 3: No separate commit** — any corrections here are folded into whichever component file changes; re-run that component's Task 2/4 build-check step after editing.

---

### Task 6: Write the article `src/content/blog/flashattention.mdx`

**Files:**
- Create: `src/content/blog/flashattention.mdx`

**Interfaces:**
- Consumes: `MemoryHierarchyExplorer` (Task 2), `TilingSimulator` (Task 3), `BenchmarkCompare` (Task 4), verified/corrected citation numbers (Task 5), existing `Callout`/`QuantCard` components (`src/components/article/Callout.astro`, `src/components/article/QuantCard.astro`).

- [ ] **Step 1: Check existing frontmatter/import conventions**

Run: `head -30 src/content/blog/speculative-decoding.mdx`

Confirms exact frontmatter shape (`title`, `description`, `pubDate`, `category`, no `heroImage` yet — matches how `rag-complete-guide.mdx` started before its cover was added) and import path conventions (`../../components/article/X`).

- [ ] **Step 2: Write the frontmatter and imports**

```mdx
---
title: 'FlashAttention: как реально считается attention на GPU ⚡🧮'
description: 'FlashAttention простыми словами: почему naive attention упирается в HBM bandwidth, как тайлинг и online softmax убирают лишний трафик через память, и что изменилось в v2/v3. С кодом и интерактивом.'
pubDate: 'Jul 28 2026'
category: 'фундамент'
---

import Callout from '../../components/article/Callout.astro';
import QuantCard from '../../components/article/QuantCard.astro';
import MemoryHierarchyExplorer from '../../components/article/MemoryHierarchyExplorer';
import TilingSimulator from '../../components/article/TilingSimulator';
import BenchmarkCompare from '../../components/article/BenchmarkCompare';
```

(Adjust `pubDate` to the actual publish date if it slips past Jul 28 2026 by the time this task executes — match whatever the most recent already-published post's date convention implies, i.e. today's date at commit time.)

- [ ] **Step 3: Write section 1 — Зачем**

Opening paragraph(s) establishing: naive attention's FLOPs are fine, but it reads/writes the full N×N score matrix through HBM three times (write S, read for softmax, write P, read for ×V) — memory traffic, not arithmetic, is the bottleneck. Explicit cross-links (inline clause style, matching `rag-complete-guide.mdx`'s established pattern):

```mdx
Тот же тезис уже звучал в статье про [KV-кэш](/blog/kv-cache/) (decode упирается в bandwidth, не в FLOPs) и в статье про [спекулятивный декодинг](/blog/speculative-decoding/) (GPU простаивает, пока ждёт память) — FlashAttention закрывает третий угол той же истории: сам forward pass attention.
```

- [ ] **Step 4: Write section 2 — GPU memory hierarchy, embed `MemoryHierarchyExplorer`**

```mdx
## Иерархия памяти GPU

<MemoryHierarchyExplorer client:visible />
```

Prose before/after explaining SRAM vs HBM in plain words, referencing the verified capacity/bandwidth numbers from Task 5.

- [ ] **Step 5: Write section 3 — naive attention's HBM traffic**

Prose walking through: S = QKᵀ (write to HBM), softmax(S) → P (read S, write P), O = P·V (read P). Three full N×N round-trips. Optionally a `<Callout type="info">` summarizing the O(N²) HBM traffic vs O(N²) FLOPs (same order, but the constant factor and the fact that memory bandwidth << compute throughput on modern GPUs is what hurts).

- [ ] **Step 6: Write section 4 — tiling, embed `TilingSimulator`**

```mdx
## Тайлинг: считаем блоками, а не всё сразу

<TilingSimulator client:visible />
```

Prose explaining the block-loading idea before the component, and interpreting the online-softmax mechanics (running max, correction factor, running sum) after it, in plain language tied to what the component just showed.

- [ ] **Step 7: Write section 5 — online softmax formulas**

Short section with the rescaling formulas as inline/block math-as-text (this repo has no LaTeX rendering set up — confirm via `grep -rn "katex\|remark-math" astro.config.mjs package.json`; if absent, write formulas as plain Markdown/code, matching how other articles in this repo present formulas, e.g. `src/content/blog/kv-cache.mdx`'s VRAM formula presentation):

```
m_new = max(m_old, m_block)
correction = exp(m_old - m_new)
l_new = correction * l_old + sum(exp(scores_block - m_new))
O_new = correction * O_old + exp(scores_block - m_new) @ V_block
```

- [ ] **Step 8: Write section 6 — backward pass, concept only**

Short paragraph: FlashAttention recomputes S/P blocks during the backward pass instead of storing the full matrix from the forward pass — trading extra compute for the memory it already saved. No derivative math.

- [ ] **Step 9: Write section 7 — v1 → v2 → v3**

2-3 short paragraphs: v2 improves parallelization (across sequence length, not just batch/heads) and reduces non-matmul FLOPs; v3 (Hopper-era) adds warp-specialization and FP8 support. Keep to what's safely stated at a headline level — no unverified precise numbers here beyond what Task 5 confirmed.

- [ ] **Step 10: Write section 8 — benchmark, embed `BenchmarkCompare`**

```mdx
## Сколько это реально экономит

<BenchmarkCompare client:visible />
```

Prose interpreting the exact-computed memory numbers and the cited headline claim, explicit about which is which (computed vs cited), matching the spec's "no fabricated local measurements" constraint.

- [ ] **Step 11: Write section 9 — code**

Two code blocks:

1. Naive + tiled/online-softmax attention in NumPy (adapt directly from Task 1's verified script — same algorithm, trimmed for readability, keep the `assert np.allclose(...)` line so the reader can run it themselves), with a sentence noting it was verified locally (max abs diff ~4e-16).
2. Real PyTorch usage snippet, explicitly marked as reference-only:

```python
import torch
import torch.nn.functional as F

# Реальный API, синтаксис по официальной документации PyTorch.
# Не гонялось локально при написании статьи — на этой машине сейчас нет
# рабочего CUDA-окружения (driver/library version mismatch).
out = F.scaled_dot_product_attention(query, key, value, is_causal=True)
# PyTorch сам выбирает FlashAttention-совместимый backend, если условия подходят
# (см. torch.backends.cuda.sdp_kernel для явного выбора backend'а).
```

- [ ] **Step 12: Write section 10 — где встретишь на практике**

Cross-link to the inference engines guide and clarify the PagedAttention distinction:

```mdx
Почти все современные инференс-движки используют FlashAttention (или его производные) под капотом — я разбирал их в [гайде по инференс-движкам](/blog/llm_inference_engines_complete_guide/). Не путай с **PagedAttention**: та механика — про то, как эффективно *хранить* KV-кэш в памяти (виртуальная память для внимания), а FlashAttention — про то, как эффективно этот кэш *считать*. Разные задачи, разные решения, часто используются вместе.
```

- [ ] **Step 13: Write section 11 — TL;DR**

Short bulleted summary, matching the TL;DR style/length of `src/content/blog/kv-cache.mdx`'s or `speculative-decoding.mdx`'s closing section (check one for exact tone before writing).

- [ ] **Step 14: Add 2-3 `QuantCard` pull-outs** for visual breaks (per this session's established pattern from the RAG-article visual-improvement pass), e.g. one for the SRAM/HBM bandwidth ratio, one for the O(N²)→O(N) memory-traffic reduction, one for the v1→v2→v3 headline change. Use real numbers already established earlier in the article (no new fabricated stats).

---

### Task 7: Build and browser verification

**Files:** none created/modified (verification only).

- [ ] **Step 1: Build**

Run: `npm run build`

Expected: build completes with no errors, `flashattention` page appears in the build output page list.

- [ ] **Step 2: Start preview server**

Run (background): `npm run preview -- --port 4321`

- [ ] **Step 3: Load the article and check console**

Use chrome-devtools-mcp (`new_page` → `http://localhost:4321/blog/flashattention/`, then `list_console_messages` with `types: ["error", "warn"]`).

Expected: no console errors/warnings.

- [ ] **Step 4: Visually verify each interactive component**

For `MemoryHierarchyExplorer`: screenshot, click the HBM card, screenshot again — confirm the detail text and active-card highlight both update.

For `TilingSimulator`: screenshot at step 0, click "Вперёд →" three times to reach the final step, screenshot — confirm the verdict box appears and shows the matching final numbers from Task 1's script output.

For `BenchmarkCompare`: screenshot at the default preset, click "64K токенов", screenshot again — confirm the naive bar grows and the displayed byte value matches `2 * 65536 * 65536 * 2` bytes = 16 GB.

- [ ] **Step 5: Stop the preview server**

Run: `pkill -f "astro preview"`

---

### Task 8: Unslop pass

**Files:**
- Modify: `src/content/blog/flashattention.mdx` (prose only, no structural changes).

- [ ] **Step 1: Run the unslop skill** on `src/content/blog/flashattention.mdx`, same as was done for `tokenization.mdx` and `rag-complete-guide.mdx` in this project's history.

- [ ] **Step 2: Rebuild to confirm no breakage from the prose edits**

Run: `npm run build`

Expected: build still passes.

- [ ] **Step 3: Commit**

```bash
git add src/content/blog/flashattention.mdx
git commit -m "Add FlashAttention article: tiling, online softmax, memory hierarchy"
```

---

### Task 9: Push

- [ ] **Step 1: Push to main**

Run: `git push origin main`

Expected: push succeeds, no conflicts.

---

## After this plan: manual follow-up (not a task here)

Per the spec's own scoping: propose 2-3 illustrative image concepts and placements to the user (in the style already used for `rag-complete-guide.mdx`'s images), wait for the user to supply the files, then insert them and separately handle the `heroImage`/cover — both are explicitly out of this plan's automatable scope.
