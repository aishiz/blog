import { useState, useEffect } from 'react';

const Q_HEADS = 8;
const GROUP_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#7c3aed', '#06b6d4', '#ef4444', '#84cc16'];

type Variant = 'mha' | 'gqa' | 'mqa';

const VARIANTS: Record<Variant, { name: string; kvHeads: number; blurb: string; models: string }> = {
	mha: { name: 'MHA', kvHeads: 8, blurb: 'Multi-Head Attention — у каждой Q-головы своя пара K/V. Максимум качества, максимум кэша.', models: 'Llama 2, GPT-3 (старые модели)' },
	gqa: { name: 'GQA', kvHeads: 2, blurb: 'Grouped-Query Attention — группа Q-голов делит одну пару K/V. Золотая середина, на ней сидит почти весь современный опенсорс.', models: 'Llama 3.x, Qwen3, Mistral, GLM-4.5, Gemma 2' },
	mqa: { name: 'MQA', kvHeads: 1, blurb: 'Multi-Query Attention — все Q-головы делят одну пару K/V. Минимум кэша, лёгкая просадка качества.', models: 'Falcon, PaLM, StarCoder' },
};

function useIsMobile(breakpoint = 560) {
	const [m, setM] = useState(false);
	useEffect(() => {
		const check = () => setM(window.innerWidth <= breakpoint);
		check();
		window.addEventListener('resize', check, { passive: true });
		return () => window.removeEventListener('resize', check);
	}, [breakpoint]);
	return m;
}

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
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.6 } as React.CSSProperties,
	tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.4rem' } as React.CSSProperties,
	tab: (active: boolean) => ({
		flex: 1,
		padding: '0.6rem 0.5rem',
		borderRadius: '8px',
		border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
		background: active ? 'var(--accent-glow)' : 'var(--bg-secondary)',
		color: active ? 'var(--accent-light)' : 'var(--text)',
		fontSize: '0.85rem',
		fontWeight: 700,
		cursor: 'pointer',
		fontFamily: 'inherit',
		transition: 'all 0.2s ease',
	} as React.CSSProperties),
	rowLabel: { fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '0.4rem' } as React.CSSProperties,
	qRow: { display: 'grid', gridTemplateColumns: `repeat(${Q_HEADS}, 1fr)`, gap: '4px', marginBottom: '1rem' } as React.CSSProperties,
	head: (color: string, dim?: boolean) => ({
		aspectRatio: '1',
		borderRadius: '6px',
		border: `1px solid ${color}`,
		background: dim ? `${color}22` : color,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: '0.7rem',
		fontWeight: 800,
		color: dim ? color : '#fff',
		transition: 'all 0.3s ease',
	} as React.CSSProperties),
	kvRow: { display: 'flex', gap: '4px', marginBottom: '1.25rem' } as React.CSSProperties,
	kvHead: (color: string, flex: number) => ({
		flex,
		minHeight: '2.6rem',
		borderRadius: '6px',
		border: `2px solid ${color}`,
		background: `${color}33`,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: '0.72rem',
		fontWeight: 800,
		color,
		transition: 'all 0.3s ease',
	} as React.CSSProperties),
	stats: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' } as React.CSSProperties,
	stat: { padding: '0.7rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', textAlign: 'center' as const } as React.CSSProperties,
	statVal: (color: string) => ({ fontSize: '1.35rem', fontWeight: 900, color, fontVariantNumeric: 'tabular-nums' } as React.CSSProperties),
	statLabel: { fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', fontWeight: 600, marginTop: '0.2rem' } as React.CSSProperties,
	blurb: { marginTop: '1.1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 } as React.CSSProperties,
	models: { fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' } as React.CSSProperties,
};

export default function AttentionVariants() {
	const [variant, setVariant] = useState<Variant>('gqa');
	const mobile = useIsMobile();
	const { kvHeads, blurb, models } = VARIANTS[variant];
	const groupSize = Q_HEADS / kvHeads;
	const saving = Q_HEADS / kvHeads;

	return (
		<div style={{ ...css.wrap, ...(mobile ? { padding: '1rem', margin: '1.25em 0' } : {}) }}>
			<div style={css.title}>🧮 MHA → GQA → MQA: ужимаем кэш</div>
			<div style={css.desc}>
				Каждый цвет — группа Q-голов, которая делит одну пару Key/Value. Чем меньше KV-голов, тем меньше кэш.
				Тыкай по вариантам:
			</div>

			<div style={css.tabs}>
				{(Object.keys(VARIANTS) as Variant[]).map((v) => (
					<button key={v} style={css.tab(variant === v)} onClick={() => setVariant(v)}>{VARIANTS[v].name}</button>
				))}
			</div>

			<div style={css.rowLabel}>Q — головы запросов (8 штук)</div>
			<div style={css.qRow}>
				{Array.from({ length: Q_HEADS }, (_, i) => {
					const group = Math.floor(i / groupSize);
					return <div key={i} style={css.head(GROUP_COLORS[group % GROUP_COLORS.length])}>Q{i + 1}</div>;
				})}
			</div>

			<div style={css.rowLabel}>K/V — пары ключ-значение, что и лежат в кэше ({kvHeads} шт.)</div>
			<div style={css.kvRow}>
				{Array.from({ length: kvHeads }, (_, g) => (
					<div key={g} style={css.kvHead(GROUP_COLORS[g % GROUP_COLORS.length], groupSize)}>KV{g + 1}</div>
				))}
			</div>

			<div style={css.stats}>
				<div style={css.stat}>
					<div style={css.statVal('var(--accent-light)')}>{kvHeads}</div>
					<div style={css.statLabel}>KV-голов</div>
				</div>
				<div style={css.stat}>
					<div style={css.statVal('#10b981')}>×{saving}</div>
					<div style={css.statLabel}>Меньше кэша</div>
				</div>
				<div style={css.stat}>
					<div style={css.statVal('var(--text)')}>{(100 / saving).toFixed(0)}%</div>
					<div style={css.statLabel}>От кэша MHA</div>
				</div>
			</div>

			<div style={css.blurb}>{blurb}</div>
			<div style={css.models}>Где используется: <strong>{models}</strong></div>
		</div>
	);
}
