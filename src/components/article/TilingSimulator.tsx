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
