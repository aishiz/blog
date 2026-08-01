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
