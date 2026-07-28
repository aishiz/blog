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
		detail: 'Основная память GPU — та самая VRAM, о которой ты думаешь, когда видишь OOM. Огромная по объёму, но на порядок медленнее SRAM. Naive attention гоняет через неё полную N×N-матрицу внимания четырежды.',
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
