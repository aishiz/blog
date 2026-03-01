import { useState } from 'react';

type Scenario = {
	name: string;
	short: string;
	data: { engine: string; value: number; label: string; color: string; optimized?: boolean }[];
	unit: string;
	description: string;
};

const scenarios: Scenario[] = [
	{
		name: 'Qwen3-235B на 8×A100',
		short: 'A100',
		unit: 'tok/s',
		description: 'SGLang опережает vLLM на +22.2% в baseline-конфигурации на A100.',
		data: [
			{ engine: 'vLLM (baseline)', value: 6890, label: '6 890', color: '#3b82f6' },
			{ engine: 'SGLang', value: 8420, label: '8 420', color: '#10b981' },
			{ engine: 'vLLM (optimized)', value: 10250, label: '10 250', color: '#3b82f6', optimized: true },
		],
	},
	{
		name: 'Qwen3-235B на 8×H100',
		short: 'H100',
		unit: 'tok/s',
		description: 'На H100 vLLM вырывается вперёд. Оптимизированная конфигурация даёт +84.9% к baseline.',
		data: [
			{ engine: 'vLLM (baseline)', value: 8420, label: '8 420', color: '#3b82f6' },
			{ engine: 'SGLang', value: 7670, label: '7 670', color: '#10b981' },
			{ engine: 'vLLM (optimized)', value: 15574, label: '15 574', color: '#3b82f6', optimized: true },
		],
	},
	{
		name: 'Qwen3-32B на 1×H100',
		short: '32B',
		unit: 'tok/s',
		description: 'TensorRT-LLM доминирует на dense-моделях: +82.1% на ShareGPT, до +129.4% на длинных промптах.',
		data: [
			{ engine: 'vLLM', value: 4200, label: '4 200', color: '#3b82f6' },
			{ engine: 'SGLang', value: 4050, label: '4 050', color: '#10b981' },
			{ engine: 'TRT-LLM', value: 7650, label: '7 650', color: '#f59e0b' },
			{ engine: 'TRT-LLM (FP8)', value: 9630, label: '9 630', color: '#f59e0b', optimized: true },
		],
	},
	{
		name: 'Эффект оптимизации vLLM',
		short: 'Optim',
		unit: '% прирост',
		description: 'Прирост от оптимизации vLLM зависит от типа нагрузки. Короткие промпты — максимальный эффект.',
		data: [
			{ engine: 'Короткие промпты', value: 189.2, label: '+189.2%', color: '#7c3aed' },
			{ engine: 'ShareGPT (mix)', value: 84.9, label: '+84.9%', color: '#3b82f6' },
			{ engine: 'Длинные промпты', value: 45.3, label: '+45.3%', color: '#10b981' },
		],
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
	scenarioTitle: {
		fontSize: '1rem',
		fontWeight: 700,
		color: 'var(--text)',
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	scenarioDesc: {
		fontSize: '0.85rem',
		color: 'var(--text-muted)',
		marginBottom: '1.25rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	barRow: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		marginBottom: '0.65rem',
	} as React.CSSProperties,
	barLabel: {
		width: '140px',
		flexShrink: 0,
		fontSize: '0.8rem',
		fontWeight: 600,
		color: 'var(--text-secondary)',
		textAlign: 'right' as const,
	} as React.CSSProperties,
	barTrack: {
		flex: 1,
		height: '32px',
		background: 'var(--bg-secondary)',
		borderRadius: '6px',
		overflow: 'hidden',
		position: 'relative' as const,
	} as React.CSSProperties,
	barFill: (pct: number, color: string, optimized: boolean) => ({
		height: '100%',
		width: `${pct}%`,
		background: optimized
			? `repeating-linear-gradient(135deg, ${color}, ${color} 8px, ${color}cc 8px, ${color}cc 16px)`
			: `linear-gradient(90deg, ${color}, ${color}cc)`,
		borderRadius: '6px',
		transition: 'width 0.6s ease',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'flex-end',
		paddingRight: '10px',
	} as React.CSSProperties),
	barVal: {
		fontSize: '0.78rem',
		fontWeight: 800,
		color: 'white',
		fontFamily: "'JetBrains Mono', monospace",
		textShadow: '0 1px 2px rgba(0,0,0,0.3)',
	} as React.CSSProperties,
	legend: {
		display: 'flex',
		gap: '1rem',
		flexWrap: 'wrap' as const,
		marginTop: '1rem',
		paddingTop: '0.75rem',
		borderTop: '1px solid var(--border)',
		fontSize: '0.72rem',
		color: 'var(--text-muted)',
	} as React.CSSProperties,
};

export default function InferenceBenchmark() {
	const [selected, setSelected] = useState(0);
	const scenario = scenarios[selected];
	const maxVal = Math.max(...scenario.data.map((d) => d.value));

	return (
		<div style={css.wrap}>
			<div style={css.title}>📊 Бенчмарки инференс-движков</div>
			<div style={css.desc}>
				Сравнение производительности на актуальных моделях. Полосатые бары — оптимизированная конфигурация.
			</div>

			<div style={css.tabs}>
				{scenarios.map((s, i) => (
					<button key={i} style={css.tab(i === selected)} onClick={() => setSelected(i)}>
						{s.short}
					</button>
				))}
			</div>

			<div style={css.scenarioTitle}>{scenario.name}</div>
			<div style={css.scenarioDesc}>{scenario.description}</div>

			{scenario.data.map((d, i) => {
				const pct = (d.value / maxVal) * 100;
				return (
					<div key={i} style={css.barRow}>
						<div style={css.barLabel}>{d.engine}</div>
						<div style={css.barTrack}>
							<div style={css.barFill(Math.max(pct, 8), d.color, !!d.optimized)}>
								<span style={css.barVal}>{d.label} {scenario.unit}</span>
							</div>
						</div>
					</div>
				);
			})}

			<div style={css.legend}>
				<span>■ Сплошная заливка — baseline</span>
				<span>▧ Полосатая заливка — оптимизированная конфигурация</span>
			</div>
		</div>
	);
}
