import { useState } from 'react';

type Engine = {
	name: string;
	tech: string;
	gpu: string;
	cpu: boolean;
	quant: string;
	specDec: boolean;
	lora: boolean;
	pp: boolean;
	models: string;
	stars: string;
	color: string;
};

const engines: Engine[] = [
	{ name: 'vLLM', tech: 'PagedAttention', gpu: 'NVIDIA, AMD, Intel', cpu: false, quant: 'AWQ, GPTQ, FP8, NVFP4', specDec: true, lora: true, pp: true, models: '100+', stars: '71.6k', color: '#3b82f6' },
	{ name: 'SGLang', tech: 'RadixAttention', gpu: 'NVIDIA, AMD', cpu: false, quant: 'FP8, INT8', specDec: true, lora: true, pp: true, models: '~50', stars: '23.9k', color: '#10b981' },
	{ name: 'LMDeploy', tech: 'TurboMind C++', gpu: 'NVIDIA, Ascend', cpu: false, quant: 'AWQ, W4A16, W8A8', specDec: true, lora: false, pp: true, models: '~30', stars: '7.6k', color: '#f59e0b' },
	{ name: 'Ollama', tech: 'llama.cpp', gpu: 'NVIDIA, AMD, Apple', cpu: true, quant: 'GGUF', specDec: false, lora: true, pp: false, models: '~100', stars: '164k', color: '#ec4899' },
	{ name: 'llama.cpp', tech: 'C/C++ GGUF', gpu: 'NVIDIA, AMD, Apple', cpu: true, quant: 'GGUF (2-8 bit)', specDec: true, lora: true, pp: false, models: '~100', stars: '96.2k', color: '#7c3aed' },
];

const features = [
	{ key: 'tech', label: 'Технология' },
	{ key: 'gpu', label: 'GPU' },
	{ key: 'cpu', label: 'CPU' },
	{ key: 'quant', label: 'Квантизация' },
	{ key: 'specDec', label: 'Speculative Decoding' },
	{ key: 'lora', label: 'LoRA' },
	{ key: 'pp', label: 'Pipeline Parallelism' },
	{ key: 'models', label: 'Модели' },
	{ key: 'stars', label: 'GitHub Stars' },
] as const;

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
		marginBottom: '1.25rem',
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
		transition: 'all 0.2s ease',
	} as React.CSSProperties),
	card: {
		display: 'grid',
		gap: '0.6rem',
	} as React.CSSProperties,
	row: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		padding: '0.7rem 1rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
	} as React.CSSProperties,
	rowLabel: {
		width: '160px',
		flexShrink: 0,
		fontSize: '0.8rem',
		fontWeight: 600,
		color: 'var(--text-muted)',
	} as React.CSSProperties,
	rowValue: {
		fontSize: '0.88rem',
		fontWeight: 600,
		color: 'var(--text)',
	} as React.CSSProperties,
	badge: (val: boolean) => ({
		padding: '0.2rem 0.6rem',
		borderRadius: '100px',
		fontSize: '0.72rem',
		fontWeight: 700,
		background: val ? '#10b98122' : '#ef444422',
		color: val ? '#10b981' : '#ef4444',
		border: `1px solid ${val ? '#10b98144' : '#ef444444'}`,
	} as React.CSSProperties),
	header: (color: string) => ({
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		marginBottom: '1rem',
	} as React.CSSProperties),
	engineName: (color: string) => ({
		fontSize: '1.4rem',
		fontWeight: 900,
		color: color,
	} as React.CSSProperties),
	starsBadge: {
		padding: '0.2rem 0.65rem',
		borderRadius: '100px',
		fontSize: '0.72rem',
		fontWeight: 700,
		background: 'var(--bg-secondary)',
		color: 'var(--text-muted)',
		border: '1px solid var(--border)',
	} as React.CSSProperties,
};

export default function EngineCompare() {
	const [selected, setSelected] = useState(0);
	const engine = engines[selected];

	return (
		<div style={css.wrap}>
			<div style={css.title}>⚙️ Интерактивное сравнение движков</div>
			<div style={css.desc}>
				Выберите движок, чтобы увидеть его характеристики. Каждый оптимизирован под свой сценарий.
			</div>

			<div style={css.tabs}>
				{engines.map((e, i) => (
					<button key={i} style={css.tab(i === selected, e.color)} onClick={() => setSelected(i)}>
						{e.name}
					</button>
				))}
			</div>

			<div style={css.header(engine.color)}>
				<span style={css.engineName(engine.color)}>{engine.name}</span>
				<span style={css.starsBadge}>⭐ {engine.stars}</span>
			</div>

			<div style={css.card}>
				{features.map((f) => {
					const val = engine[f.key as keyof Engine];
					return (
						<div key={f.key} style={css.row}>
							<span style={css.rowLabel}>{f.label}</span>
							<span style={css.rowValue}>
								{typeof val === 'boolean' ? (
									<span style={css.badge(val)}>{val ? '✓ Да' : '✗ Нет'}</span>
								) : (
									val
								)}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}
