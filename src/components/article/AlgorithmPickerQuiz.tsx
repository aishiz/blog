import { useState } from 'react';

type Step = {
	question: string;
	options: { label: string; next: number | string }[];
};

type Result = {
	name: string;
	color: string;
	why: string;
};

const steps: Record<number, Step> = {
	0: {
		question: 'Какая у тебя награда?',
		options: [
			{ label: 'Есть чёткий верификатор (математика, код, юнит-тесты)', next: 1 },
			{ label: 'Только human-preference данные (какой ответ лучше)', next: 2 },
		],
	},
	1: {
		question: 'Важна максимальная эффективность на серьёзном RL-бюджете?',
		options: [
			{ label: 'Да, тренирую с нуля, есть compute на много rollout\'ов', next: 'grpo' },
			{ label: 'Нужна стабильность — GRPO у меня коллапсирует/буксует', next: 'dapo' },
		],
	},
	2: {
		question: 'Нужна ли online RL-петля (генерация во время тренировки)?',
		options: [
			{ label: 'Нет, есть готовый датасет пар предпочтений', next: 'dpo' },
			{ label: 'Да, готов тренировать критика и держать RL-петлю', next: 'ppo' },
		],
	},
};

const results: Record<string, Result> = {
	grpo: { name: 'GRPO', color: '#8b5cf6', why: 'Group-relative advantage без критика — дешевле по памяти, чем PPO, и подходит именно туда, где reward можно честно проверить правилом (DeepSeekMath, arXiv:2402.03300).' },
	dapo: { name: 'DAPO', color: '#f59e0b', why: 'Тот же GRPO, но с Clip-Higher и Dynamic Sampling против entropy collapse и нулевого градиента на «слишком лёгких» промптах (ByteDance, arXiv:2503.14476).' },
	dpo: { name: 'DPO', color: '#22c55e', why: 'Обычный supervised loss на парах предпочтений — не нужна ни reward-модель, ни RL-петля, ни критик (Rafailov et al., arXiv:2305.18290).' },
	ppo: { name: 'PPO', color: '#3b82f6', why: 'Классика RLHF: critic-сеть даёт per-step baseline, есть online-исследование — цена: держать в памяти ещё одну модель того же размера (Schulman et al., arXiv:1707.06347).' },
};

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
	question: {
		fontSize: '1.05rem',
		fontWeight: 800,
		color: 'var(--text)',
		marginBottom: '1rem',
	} as React.CSSProperties,
	options: { display: 'grid', gap: '0.5rem' } as React.CSSProperties,
	option: {
		padding: '0.85rem 1.1rem',
		borderRadius: '10px',
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
		cursor: 'pointer',
		fontFamily: 'inherit',
		fontSize: '0.9rem',
		fontWeight: 600,
		color: 'var(--text)',
		textAlign: 'left' as const,
		width: '100%',
	} as React.CSSProperties,
	result: (color: string) => ({
		padding: '1.5rem',
		borderRadius: '12px',
		border: `2px solid ${color}`,
		background: `${color}08`,
	} as React.CSSProperties),
	resultName: (color: string) => ({
		fontSize: '1.5rem',
		fontWeight: 900,
		color,
		marginBottom: '0.5rem',
	} as React.CSSProperties),
	resultWhy: {
		fontSize: '0.9rem',
		lineHeight: 1.6,
		color: 'var(--text-secondary)',
	} as React.CSSProperties,
	resetBtn: {
		marginTop: '1rem',
		padding: '0.55rem 1.25rem',
		borderRadius: '8px',
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
		color: 'var(--text)',
		fontSize: '0.85rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
	} as React.CSSProperties,
};

export default function AlgorithmPickerQuiz() {
	const [current, setCurrent] = useState<number | string>(0);
	const step = typeof current === 'number' ? steps[current] : null;
	const result = typeof current === 'string' ? results[current] : null;

	return (
		<div style={css.wrap}>
			<div style={css.title}>🧭 Какой алгоритм выбрать</div>
			<div style={css.desc}>Пара вопросов про твою задачу — получи рекомендацию из PPO/DPO/GRPO/DAPO.</div>

			{step && (
				<>
					<div style={css.question}>{step.question}</div>
					<div style={css.options}>
						{step.options.map((opt) => (
							<button key={opt.label} style={css.option} onClick={() => setCurrent(opt.next)}>{opt.label}</button>
						))}
					</div>
				</>
			)}

			{result && (
				<>
					<div style={css.result(result.color)}>
						<div style={css.resultName(result.color)}>→ {result.name}</div>
						<div style={css.resultWhy}>{result.why}</div>
					</div>
					<button style={css.resetBtn} onClick={() => setCurrent(0)}>🔄 Начать заново</button>
				</>
			)}
		</div>
	);
}
