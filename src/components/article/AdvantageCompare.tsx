import { useState } from 'react';

type Mode = 'ppo' | 'grpo';

// NumPy-верифицировано (python3, seed фиксирован для группы, std без ddof — как в
// референсных реализациях GRPO): группа из G=8 rollout'ов на один промпт, бинарная
// награда корректности (0/1, в духе rule-based верификатора DeepSeekMath/DeepSeek-R1).
const REWARDS = [1, 0, 1, 1, 0, 1, 0, 1];
const GROUP_MEAN = 0.625;
const GROUP_STD = 0.4841;
const GRPO_ADVANTAGES = [0.7746, -1.291, 0.7746, 0.7746, -1.291, 0.7746, -1.291, 0.7746];

// PPO-сравнение на тех же rollout'ах: одна скалярная награда в конце генерации,
// advantage = reward − V(s). V(s)=0.55 — иллюстративная critic-оценка (обучаемая сеть,
// намеренно не совпадает с истинным средним 0.625, как и должно быть у несовершенного критика).
const CRITIC_BASELINE = 0.55;
const PPO_ADVANTAGES = REWARDS.map((r) => Number((r - CRITIC_BASELINE).toFixed(4)));

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
	rolloutGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(4, 1fr)',
		gap: '0.5rem',
		marginBottom: '1.1rem',
	} as React.CSSProperties,
	rolloutBox: (correct: boolean) => ({
		padding: '0.6rem 0.4rem',
		borderRadius: '8px',
		textAlign: 'center' as const,
		background: 'var(--bg-secondary)',
		border: `1px solid ${correct ? '#22c55e40' : '#ef444440'}`,
	} as React.CSSProperties),
	rolloutReward: {
		fontSize: '0.72rem',
		color: 'var(--text-muted)',
		marginBottom: '0.25rem',
	} as React.CSSProperties,
	rolloutAdv: (positive: boolean) => ({
		fontSize: '0.95rem',
		fontWeight: 800,
		color: positive ? '#22c55e' : '#ef4444',
		fontVariantNumeric: 'tabular-nums' as const,
	} as React.CSSProperties),
	formula: {
		padding: '0.75rem 1rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		fontSize: '0.9rem',
		fontWeight: 700,
		color: 'var(--text)',
		fontFamily: 'monospace',
		marginBottom: '0.9rem',
	} as React.CSSProperties,
	note: {
		fontSize: '0.8rem',
		color: 'var(--text-muted)',
		lineHeight: 1.6,
	} as React.CSSProperties,
};

export default function AdvantageCompare() {
	const [mode, setMode] = useState<Mode>('grpo');
	const advantages = mode === 'grpo' ? GRPO_ADVANTAGES : PPO_ADVANTAGES;

	return (
		<div style={css.wrap}>
			<div style={css.title}>⚖️ PPO vs GRPO: как считается advantage</div>
			<div style={css.desc}>
				Одна и та же группа из 8 rollout'ов на один промпт (1 = верный ответ, 0 = неверный). Переключи режим — увидишь, как разные алгоритмы превращают эти награды в сигнал для градиента.
			</div>

			<div style={css.tabs}>
				<button style={css.tab(mode === 'ppo', '#3b82f6')} onClick={() => setMode('ppo')}>PPO (critic-baseline)</button>
				<button style={css.tab(mode === 'grpo', '#8b5cf6')} onClick={() => setMode('grpo')}>GRPO (group-relative)</button>
			</div>

			<div style={css.rolloutGrid}>
				{REWARDS.map((r, i) => (
					<div key={i} style={css.rolloutBox(r === 1)}>
						<div style={css.rolloutReward}>r={r}</div>
						<div style={css.rolloutAdv(advantages[i] > 0)}>{advantages[i] > 0 ? '+' : ''}{advantages[i].toFixed(2)}</div>
					</div>
				))}
			</div>

			<div style={css.formula}>
				{mode === 'grpo'
					? <>Â = (r − mean) / std = (r − {GROUP_MEAN}) / {GROUP_STD}</>
					: <>Â = r − V(s) = r − {CRITIC_BASELINE}</>}
			</div>

			<div style={css.note}>
				{mode === 'grpo'
					? 'Никакой отдельной сети: baseline — статистика самой группы. Формула и G=64 — из DeepSeekMath (arXiv:2402.03300).'
					: 'V(s) — отдельная обучаемая критик-сеть (Schulman et al., arXiv:1707.06347). Несовершенный критик (0.55) намеренно не совпадает с истинным средним (0.625) — так и бывает в реальности.'}
			</div>
		</div>
	);
}
