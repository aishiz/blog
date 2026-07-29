import { useState } from 'react';

type SizeKey = '7B' | '14B' | '70B';

const PARAMS: Record<SizeKey, number> = { '7B': 7e9, '14B': 14e9, '70B': 70e9 };

type Config = { key: string; label: string; models: number; desc: string; color: string };

const CONFIGS: Config[] = [
	{ key: 'ppo', label: 'PPO', models: 4, desc: 'policy + critic + reward model + reference', color: '#3b82f6' },
	{ key: 'grpo-rm', label: 'GRPO + reward model', models: 3, desc: 'policy + reward model + reference — критика уже нет', color: '#8b5cf6' },
	{ key: 'grpo-rule', label: 'GRPO + rule-based reward', models: 2, desc: 'policy + reference — как в DeepSeek-R1-Zero для math/code', color: '#c946ff' },
];

// Только веса в bf16 (2 байта/параметр), без оптимайзера/градиентов/активаций/KV-кэша.
// Собственный подсчёт для иллюстрации структурной разницы (сколько КОПИЙ модели держим
// в памяти одновременно) — конкретные GB для полного финтюна расходятся между вторичными
// источниками, поэтому здесь только простая, прозрачная арифметика по числу моделей.
function gbForModels(params: number, n: number): number {
	return Math.round((params * 2 * n) / 1e9);
}

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
	rows: { display: 'grid', gap: '0.6rem' } as React.CSSProperties,
	row: {
		padding: '0.75rem 1rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
	} as React.CSSProperties,
	rowHead: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'baseline',
		marginBottom: '0.4rem',
	} as React.CSSProperties,
	rowLabel: (color: string) => ({
		fontSize: '0.86rem',
		fontWeight: 800,
		color,
	} as React.CSSProperties),
	rowGb: {
		fontSize: '1.1rem',
		fontWeight: 900,
		color: 'var(--text)',
		fontVariantNumeric: 'tabular-nums' as const,
	} as React.CSSProperties,
	barTrack: {
		height: '8px',
		borderRadius: '4px',
		background: 'var(--bg-card)',
		overflow: 'hidden',
		marginBottom: '0.4rem',
	} as React.CSSProperties,
	barFill: (pct: number, color: string) => ({
		width: `${pct}%`,
		height: '100%',
		background: color,
	} as React.CSSProperties),
	rowDesc: {
		fontSize: '0.78rem',
		color: 'var(--text-muted)',
	} as React.CSSProperties,
	note: {
		marginTop: '0.75rem',
		fontSize: '0.78rem',
		color: 'var(--text-muted)',
		lineHeight: 1.55,
		fontStyle: 'italic' as const,
	} as React.CSSProperties,
};

export default function CriticVramCalculator() {
	const [size, setSize] = useState<SizeKey>('7B');
	const params = PARAMS[size];
	const maxGb = gbForModels(params, 4);

	return (
		<div style={css.wrap}>
			<div style={css.title}>🧮 Сколько моделей держим в памяти одновременно</div>
			<div style={css.desc}>Выбери размер policy-модели — увидишь, сколько копий такого же размера нужно держать в VRAM для каждого подхода (только веса, bf16, без оптимайзера и активаций).</div>

			<div style={css.tabs}>
				{(['7B', '14B', '70B'] as SizeKey[]).map((s) => (
					<button key={s} style={css.tab(size === s)} onClick={() => setSize(s)}>{s}</button>
				))}
			</div>

			<div style={css.rows}>
				{CONFIGS.map((c) => {
					const gb = gbForModels(params, c.models);
					const pct = (gb / maxGb) * 100;
					return (
						<div key={c.key} style={css.row}>
							<div style={css.rowHead}>
								<span style={css.rowLabel(c.color)}>{c.label} ({c.models} модели)</span>
								<span style={css.rowGb}>{gb} ГБ</span>
							</div>
							<div style={css.barTrack}><div style={css.barFill(pct, c.color)} /></div>
							<div style={css.rowDesc}>{c.desc}</div>
						</div>
					);
				})}
			</div>

			<div style={css.note}>Структурная иллюстрация, не точный прод-бюджет: реальный расход VRAM выше (оптимайзер, градиенты, активации, KV-кэш при генерации rollout'ов) и расходится между инженерными источниками — здесь считается только то, что железно известно: сколько копий модели нужно держать одновременно.</div>
		</div>
	);
}
