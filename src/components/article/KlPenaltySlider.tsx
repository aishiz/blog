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
