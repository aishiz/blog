import { useState } from 'react';

type Tier = {
	id: string;
	label: string;
	group: 'cloud' | 'local';
	hardware: string;
	size: string;
	throughput: string;
	note: string;
	color: string;
};

const tiers: Tier[] = [
	{
		id: 'vllm-tp8',
		label: 'vLLM TP8',
		group: 'cloud',
		hardware: '8×B300 / GB300 NVL72 — минимум, который называет сам Moonshot',
		size: 'MXFP4/MXFP8, ~1.4–1.6 ТБ весов',
		throughput: '111 ток/с на пользователя → 331 ток/с с DSpark (батч 1)',
		note: 'Прод-инференс. Меньше этой конфигурации модель просто не встаёт.',
		color: '#3b82f6',
	},
	{
		id: 'vllm-tp16',
		label: 'vLLM TP16',
		group: 'cloud',
		hardware: '16×GB300 NVL72',
		size: 'MXFP4/MXFP8, ~1.4–1.6 ТБ весов',
		throughput: '118 ток/с на пользователя → 370 ток/с с DSpark (батч 1)',
		note: 'Больше GPU — выше однопользовательский throughput, не только батч.',
		color: '#3b82f6',
	},
	{
		id: 'sglang',
		label: 'SGLang',
		group: 'cloud',
		hardware: '8×GB300 NVL72',
		size: 'MXFP4/MXFP8, ~1.4–1.6 ТБ весов',
		throughput: '113 ток/с на пользователя → ≈423 ток/с с DSpark (батч 1)',
		note: 'Точные флаги — в официальном cookbook SGLang, не всё выложено в блог-посте.',
		color: '#10b981',
	},
	{
		id: 'gguf-q8',
		label: 'GGUF Q8_K_XL',
		group: 'local',
		hardware: 'Сервер с ≈1.6 ТБ RAM+VRAM суммарно',
		size: '1.6 ТБ на диске',
		throughput: 'Не измерялось — сильно зависит от offloading',
		note: 'Unsloth заявляет как «по-настоящему безлоссовый» квант.',
		color: '#f59e0b',
	},
	{
		id: 'gguf-1bit',
		label: 'GGUF UD-IQ1_S',
		group: 'local',
		hardware: '≈650 ГБ RAM+VRAM суммарно',
		size: '650 ГБ на диске',
		throughput: 'Не измерялось, заметно медленнее из-за offloading',
		note: 'Компромисс по качеству ради размера — «хороший баланс», не lossless.',
		color: '#f59e0b',
	},
];

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
	card: { display: 'grid', gap: '0.6rem' } as React.CSSProperties,
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
		width: '130px',
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
};

const fields: { key: keyof Tier; label: string }[] = [
	{ key: 'hardware', label: 'Железо' },
	{ key: 'size', label: 'Размер' },
	{ key: 'throughput', label: 'Throughput' },
	{ key: 'note', label: 'Нюанс' },
];

export default function DeploymentTiers() {
	const [selected, setSelected] = useState(0);
	const tier = tiers[selected];

	return (
		<div style={css.wrap}>
			<div style={css.title}>🖥️ Чем это запускать</div>
			<div style={css.desc}>Пять вариантов — от дата-центрового кластера до самого дешёвого локального кванта. Ни один не влезет в домашнюю видеокарту.</div>

			<div style={css.tabs}>
				{tiers.map((t, i) => (
					<button key={t.id} style={css.tab(i === selected, t.color)} onClick={() => setSelected(i)}>{t.label}</button>
				))}
			</div>

			<div style={css.card}>
				{fields.map((f) => (
					<div key={f.key} style={css.row}>
						<span style={css.rowLabel}>{f.label}</span>
						<span style={css.rowValue}>{tier[f.key]}</span>
					</div>
				))}
			</div>
		</div>
	);
}
