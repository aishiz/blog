import { useState } from 'react';

type G = 4 | 8 | 16 | 64;

// NumPy-симуляция (python3, seed=42): 2000 групп на каждый размер G, бинарные rewards
// ~ Bernoulli(p=0.625) — та же вероятность успеха, что и в группе из AdvantageCompare.
// Для каждой группы считаем advantage «верного» (r=1) rollout'а по формуле GRPO
// (r − mean)/(std + eps), затем смотрим разброс этой оценки между 2000 групп.
const GROUP_DATA: Record<G, { meanAdv: number; stdAdv: number }> = {
	4: { meanAdv: 0.7718, stdAdv: 0.5050 },
	8: { meanAdv: 0.8206, stdAdv: 0.3571 },
	16: { meanAdv: 0.7918, stdAdv: 0.2274 },
	64: { meanAdv: 0.7770, stdAdv: 0.1000 },
};

const MAX_STD = GROUP_DATA[4].stdAdv;

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
	statBox: {
		padding: '0.9rem 1rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		marginBottom: '0.6rem',
	} as React.CSSProperties,
	statLabel: {
		fontSize: '0.78rem',
		color: 'var(--text-muted)',
		marginBottom: '0.3rem',
	} as React.CSSProperties,
	statVal: {
		fontSize: '1.3rem',
		fontWeight: 900,
		color: 'var(--text)',
		fontVariantNumeric: 'tabular-nums' as const,
		marginBottom: '0.4rem',
	} as React.CSSProperties,
	barTrack: {
		height: '10px',
		borderRadius: '5px',
		background: 'var(--bg-card)',
		overflow: 'hidden',
	} as React.CSSProperties,
	barFill: (pct: number) => ({
		width: `${pct}%`,
		height: '100%',
		background: '#8b5cf6',
	} as React.CSSProperties),
	note: {
		fontSize: '0.8rem',
		color: 'var(--text-muted)',
		lineHeight: 1.6,
	} as React.CSSProperties,
};

export default function GroupRolloutSimulator() {
	const [g, setG] = useState<G>(8);
	const data = GROUP_DATA[g];
	const pct = (data.stdAdv / MAX_STD) * 100;

	return (
		<div style={css.wrap}>
			<div style={css.title}>🎲 Размер группы решает разброс оценки</div>
			<div style={css.desc}>Двигай размер группы G — увидишь, как меняется разброс advantage-оценки для одного и того же «верного» rollout'а между разными случайными группами.</div>

			<div style={css.tabs}>
				{([4, 8, 16, 64] as G[]).map((v) => (
					<button key={v} style={css.tab(g === v)} onClick={() => setG(v)}>G={v}</button>
				))}
			</div>

			<div style={css.statBox}>
				<div style={css.statLabel}>Разброс (std) оценки advantage между группами</div>
				<div style={css.statVal}>{data.stdAdv.toFixed(3)}</div>
				<div style={css.barTrack}><div style={css.barFill(pct)} /></div>
			</div>

			<div style={css.note}>Больше rollout'ов на промпт — стабильнее оценка baseline, но и дороже: G сэмплов нужно сгенерировать и оценить на каждый промпт. DeepSeekMath (arXiv:2402.03300) остановилась на G=64.</div>
		</div>
	);
}
