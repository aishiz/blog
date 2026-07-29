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
