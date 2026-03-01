import { useState } from 'react';

type Benchmark = {
	name: string;
	short: string;
	scores: Record<string, number>;
	best: string;
};

const models = ['GPT-5.2', 'Gemini-3 Pro', 'Claude 4.5', 'Qwen3.5-397B'];
const modelColors: Record<string, string> = {
	'GPT-5.2': '#10b981',
	'Gemini-3 Pro': '#3b82f6',
	'Claude 4.5': '#f59e0b',
	'Qwen3.5-397B': '#7c3aed',
};

const benchmarks: Benchmark[] = [
	{ name: 'MMLU-Pro (знания)', short: 'MMLU', scores: { 'GPT-5.2': 87.4, 'Gemini-3 Pro': 89.8, 'Claude 4.5': 89.5, 'Qwen3.5-397B': 87.8 }, best: 'Gemini-3 Pro' },
	{ name: 'IFBench (инструкции)', short: 'IFBench', scores: { 'GPT-5.2': 75.4, 'Gemini-3 Pro': 70.4, 'Claude 4.5': 58.0, 'Qwen3.5-397B': 76.5 }, best: 'Qwen3.5-397B' },
	{ name: 'GPQA (STEM)', short: 'GPQA', scores: { 'GPT-5.2': 92.4, 'Gemini-3 Pro': 91.9, 'Claude 4.5': 87.0, 'Qwen3.5-397B': 88.4 }, best: 'GPT-5.2' },
	{ name: 'BrowseComp (поиск)', short: 'Browse', scores: { 'GPT-5.2': 65.8, 'Gemini-3 Pro': 59.2, 'Claude 4.5': 67.8, 'Qwen3.5-397B': 78.6 }, best: 'Qwen3.5-397B' },
	{ name: 'NOVA-63 (многоязычность)', short: 'NOVA', scores: { 'GPT-5.2': 54.6, 'Gemini-3 Pro': 56.7, 'Claude 4.5': 56.7, 'Qwen3.5-397B': 59.1 }, best: 'Qwen3.5-397B' },
	{ name: 'BFCL-V4 (агенты)', short: 'BFCL', scores: { 'GPT-5.2': 63.1, 'Gemini-3 Pro': 72.5, 'Claude 4.5': 77.5, 'Qwen3.5-397B': 72.9 }, best: 'Claude 4.5' },
	{ name: 'TAU2-Bench (агенты)', short: 'TAU2', scores: { 'GPT-5.2': 87.1, 'Gemini-3 Pro': 85.4, 'Claude 4.5': 91.6, 'Qwen3.5-397B': 86.7 }, best: 'Claude 4.5' },
	{ name: 'SWE-bench (код)', short: 'SWE', scores: { 'GPT-5.2': 80.0, 'Gemini-3 Pro': 76.2, 'Claude 4.5': 80.9, 'Qwen3.5-397B': 76.4 }, best: 'Claude 4.5' },
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
	tabs: {
		display: 'flex',
		gap: '0.4rem',
		flexWrap: 'wrap' as const,
		marginBottom: '1.25rem',
	} as React.CSSProperties,
	tab: (active: boolean) => ({
		padding: '0.4rem 0.85rem',
		borderRadius: '100px',
		border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
		background: active ? 'var(--accent-glow)' : 'var(--bg-secondary)',
		color: active ? 'var(--accent-light)' : 'var(--text-muted)',
		fontSize: '0.78rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
		transition: 'all 0.2s ease',
	} as React.CSSProperties),
	barRow: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		marginBottom: '0.65rem',
	} as React.CSSProperties,
	barLabel: {
		width: '110px',
		flexShrink: 0,
		fontSize: '0.8rem',
		fontWeight: 600,
		color: 'var(--text-secondary)',
		textAlign: 'right' as const,
	} as React.CSSProperties,
	barTrack: {
		flex: 1,
		height: '28px',
		background: 'var(--bg-secondary)',
		borderRadius: '6px',
		overflow: 'hidden',
		position: 'relative' as const,
	} as React.CSSProperties,
	barFill: (pct: number, color: string, isBest: boolean) => ({
		height: '100%',
		width: `${pct}%`,
		background: isBest
			? `linear-gradient(90deg, ${color}, ${color}cc)`
			: `${color}66`,
		borderRadius: '6px',
		transition: 'width 0.6s ease',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'flex-end',
		paddingRight: '8px',
	} as React.CSSProperties),
	barVal: (isBest: boolean) => ({
		fontSize: '0.75rem',
		fontWeight: isBest ? 800 : 600,
		color: isBest ? 'white' : 'var(--text-secondary)',
		fontFamily: "'JetBrains Mono', monospace",
	} as React.CSSProperties),
	legend: {
		display: 'flex',
		gap: '1rem',
		flexWrap: 'wrap' as const,
		marginTop: '1rem',
		paddingTop: '0.75rem',
		borderTop: '1px solid var(--border)',
	} as React.CSSProperties,
	legendItem: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.35rem',
		fontSize: '0.78rem',
		color: 'var(--text-muted)',
		fontWeight: 500,
	} as React.CSSProperties,
	dot: (color: string) => ({
		width: '10px',
		height: '10px',
		borderRadius: '50%',
		background: color,
		flexShrink: 0,
	} as React.CSSProperties),
};

export default function ModelComparison() {
	const [selected, setSelected] = useState(0);
	const bench = benchmarks[selected];
	const maxScore = Math.max(...Object.values(bench.scores));
	const minForScale = maxScore * 0.5;

	return (
		<div style={css.wrap}>
			<div style={css.title}>📊 Интерактивное сравнение моделей</div>
			<div style={css.desc}>
				Выберите бенчмарк, чтобы сравнить Qwen3.5 с конкурентами. Яркая полоса — лучший результат.
			</div>

			<div style={css.tabs}>
				{benchmarks.map((b, i) => (
					<button key={i} style={css.tab(i === selected)} onClick={() => setSelected(i)}>
						{b.short}
					</button>
				))}
			</div>

			<div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1rem' }}>
				{bench.name}
			</div>

			{models.map((model) => {
				const score = bench.scores[model];
				const isBest = model === bench.best;
				const pct = ((score - minForScale) / (maxScore - minForScale)) * 100;
				return (
					<div key={model} style={css.barRow}>
						<div style={css.barLabel}>{model}</div>
						<div style={css.barTrack}>
							<div style={css.barFill(Math.max(pct, 5), modelColors[model], isBest)}>
								<span style={css.barVal(isBest)}>{score}</span>
							</div>
						</div>
					</div>
				);
			})}

			<div style={css.legend}>
				{models.map((m) => (
					<div key={m} style={css.legendItem}>
						<div style={css.dot(modelColors[m])} />
						{m}
					</div>
				))}
			</div>
		</div>
	);
}
