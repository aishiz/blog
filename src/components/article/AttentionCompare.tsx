import { useState } from 'react';

type Preset = {
	key: string;
	label: string;
	contextLabel: string;
	fullRelSpeed: number;
	kdaRelSpeed: number;
	fullRelCache: number;
	kdaRelCache: number;
	note: string;
};

// Источник: arXiv 2510.26692 "Kimi Linear" (Moonshot AI) + github.com/MoonshotAI/Kimi-Linear README.
// Цифры — для исследовательской модели Kimi Linear (48B total / 3B active), НЕ для продакшен Kimi K3
// (2.8T/104B) — та использует тот же механизм KDA в проде, но эти множители для неё отдельно не
// перепроверялись ни в одном первоисточнике Moonshot.
const PRESETS: Preset[] = [
	{
		key: '4k',
		label: '4K токенов',
		contextLabel: 'MMLU-Pro',
		fullRelSpeed: 1,
		kdaRelSpeed: 1,
		fullRelCache: 1,
		kdaRelCache: 1,
		note: 'На коротком контексте паритет по скорости — разница между full attention и KDA не проявляется, она копится с ростом контекста.',
	},
	{
		key: '128k',
		label: '128K токенов',
		contextLabel: 'RULER',
		fullRelSpeed: 1,
		kdaRelSpeed: 3.98,
		fullRelCache: 1,
		// Пейпер даёт конкретный % экономии KV-кэша только для 1M-контекста (75%), не для 128K.
		// Это значение — интерполяция по механике (KDA-слои держат кэш фиксированного размера,
		// растёт только кэш 1-из-4 full-attention слоёв), не прямая цитата из пейпера.
		kdaRelCache: 0.4,
		note: 'RULER 128k: 3.98× ускорение при Pareto-оценке качества 84.3 — цифра из пейпера. Экономия KV-кэша на этой длине в пейпере отдельно не указана (только для 1M) — на графике интерполяция по механике, не прямая цитата.',
	},
	{
		key: '1m',
		label: '1M токенов',
		contextLabel: 'заявлено в пейпере',
		fullRelSpeed: 1,
		kdaRelSpeed: 6,
		fullRelCache: 1,
		kdaRelCache: 0.25,
		note: 'На 1M контексте: до 6× быстрее декодинг (6.3× по TPOT) и до 75% экономии KV-кэша — заявлено для исследовательской модели, не переподтверждено отдельно для K3.',
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
		background: active ? 'var(--accent-glow)' : 'var(--bg-secondary)',
		color: active ? 'var(--accent-light)' : 'var(--text-muted)',
		fontSize: '0.8rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
	} as React.CSSProperties),
	barRow: { marginBottom: '0.9rem' } as React.CSSProperties,
	barLabel: {
		display: 'flex',
		justifyContent: 'space-between',
		fontSize: '0.85rem',
		color: 'var(--text-secondary)',
		marginBottom: '0.35rem',
	} as React.CSSProperties,
	barTrack: {
		height: '12px',
		borderRadius: '100px',
		background: 'var(--bg-secondary)',
		overflow: 'hidden',
		border: '1px solid var(--border)',
	} as React.CSSProperties,
	barFill: (pct: number, color: string) => ({
		height: '100%',
		width: `${Math.min(100, pct)}%`,
		background: color,
		borderRadius: '100px',
		transition: 'width 0.3s ease',
	} as React.CSSProperties),
	note: {
		marginTop: '1rem',
		fontSize: '0.82rem',
		color: 'var(--text-muted)',
		lineHeight: 1.6,
		fontStyle: 'italic' as const,
	} as React.CSSProperties,
};

export default function AttentionCompare() {
	const [presetKey, setPresetKey] = useState('1m');
	const preset = PRESETS.find((p) => p.key === presetKey)!;

	const maxSpeed = Math.max(...PRESETS.map((p) => p.kdaRelSpeed));

	return (
		<div style={css.wrap}>
			<div style={css.title}>⚡ Full attention vs KDA-гибрид</div>
			<div style={css.desc}>
				Выбери длину контекста — увидишь относительную скорость декодинга и относительный объём KV-кэша, full attention vs KDA-гибрид (3:1). Цифры из пейпера Kimi Linear, для исследовательской модели (48B/3B), не для продакшен K3 напрямую.
			</div>

			<div style={css.presetRow}>
				{PRESETS.map((p) => (
					<button key={p.key} style={css.presetBtn(p.key === presetKey)} onClick={() => setPresetKey(p.key)}>{p.label}</button>
				))}
			</div>

			<div style={css.barRow}>
				<div style={css.barLabel}>
					<span>Скорость декодинга: full attention</span>
					<span style={{ fontWeight: 700, color: 'var(--text)' }}>1×</span>
				</div>
				<div style={css.barTrack}><div style={css.barFill((preset.fullRelSpeed / maxSpeed) * 100, 'var(--text-muted)')} /></div>
			</div>
			<div style={css.barRow}>
				<div style={css.barLabel}>
					<span>Скорость декодинга: KDA-гибрид</span>
					<span style={{ fontWeight: 700, color: 'var(--text)' }}>{preset.kdaRelSpeed}×</span>
				</div>
				<div style={css.barTrack}><div style={css.barFill((preset.kdaRelSpeed / maxSpeed) * 100, 'var(--accent)')} /></div>
			</div>

			<div style={css.barRow}>
				<div style={css.barLabel}>
					<span>Объём KV-кэша: full attention</span>
					<span style={{ fontWeight: 700, color: 'var(--text)' }}>100%</span>
				</div>
				<div style={css.barTrack}><div style={css.barFill(preset.fullRelCache * 100, 'var(--text-muted)')} /></div>
			</div>
			<div style={css.barRow}>
				<div style={css.barLabel}>
					<span>Объём KV-кэша: KDA-гибрид</span>
					<span style={{ fontWeight: 700, color: 'var(--text)' }}>{Math.round(preset.kdaRelCache * 100)}%</span>
				</div>
				<div style={css.barTrack}><div style={css.barFill(preset.kdaRelCache * 100, 'var(--accent-secondary)')} /></div>
			</div>

			<div style={css.note}>{preset.note} (бенчмарк: {preset.contextLabel})</div>
		</div>
	);
}
