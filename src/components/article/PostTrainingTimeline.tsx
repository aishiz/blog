type Event = {
	date: string;
	title: string;
	desc: string;
	color: string;
};

const events: Event[] = [
	{ date: 'Март 2022', title: 'InstructGPT (RLHF + PPO)', desc: 'Ouyang et al., arXiv:2203.02155. Канонический рецепт: SFT → reward model → PPO с KL-штрафом против reference-модели.', color: '#3b82f6' },
	{ date: 'Май 2023', title: 'DPO', desc: 'Rafailov et al., arXiv:2305.18290. Reward становится implicit — RL-петля и отдельная reward-модель не нужны вовсе, обычный supervised loss на парах предпочтений.', color: '#22c55e' },
	{ date: 'Февраль 2024', title: 'GRPO', desc: 'DeepSeekMath, arXiv:2402.03300. Group-relative advantage без critic-сети: G=64 rollout\'ов на промпт, KL-коэффициент β=0.04.', color: '#8b5cf6' },
	{ date: 'Январь 2025', title: 'DeepSeek-R1', desc: 'arXiv:2501.12948. GRPO на масштабе продакшена: AIME 2024 pass@1 вырос с 15.6% до 71.0% за RL-тренировку.', color: '#c946ff' },
	{ date: 'Март 2025', title: 'DAPO', desc: 'ByteDance, arXiv:2503.14476. Чинит entropy collapse и «нулевой градиент» в ванильном GRPO: 50 против 47 у DeepSeek-R1-Zero-Qwen-32B на AIME 2024, за половину шагов тренировки.', color: '#f59e0b' },
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
	list: {
		display: 'flex',
		flexDirection: 'column' as const,
		gap: 0,
		paddingLeft: '1.5rem',
		borderLeft: '2px solid var(--border)',
	} as React.CSSProperties,
	item: {
		position: 'relative' as const,
		padding: '0.85rem 0',
	} as React.CSSProperties,
	marker: (color: string) => ({
		position: 'absolute' as const,
		left: '-1.85rem',
		top: '1.1rem',
		width: '10px',
		height: '10px',
		borderRadius: '50%',
		background: color,
	} as React.CSSProperties),
	date: {
		fontSize: '0.72rem',
		fontWeight: 700,
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.03em',
		marginBottom: '0.2rem',
	} as React.CSSProperties,
	eventTitle: (color: string) => ({
		fontSize: '0.95rem',
		fontWeight: 800,
		color,
		marginBottom: '0.2rem',
	} as React.CSSProperties),
	eventDesc: {
		fontSize: '0.85rem',
		color: 'var(--text-secondary)',
		lineHeight: 1.55,
	} as React.CSSProperties,
};

export default function PostTrainingTimeline() {
	return (
		<div style={css.wrap}>
			<div style={css.title}>🕰️ Три года эволюции за один взгляд</div>
			<div style={css.desc}>Каждый следующий алгоритм — прямой ответ на конкретную боль предыдущего.</div>

			<div style={css.list}>
				{events.map((e) => (
					<div key={e.title} style={css.item}>
						<div style={css.marker(e.color)} />
						<div style={css.date}>{e.date}</div>
						<div style={css.eventTitle(e.color)}>{e.title}</div>
						<div style={css.eventDesc}>{e.desc}</div>
					</div>
				))}
			</div>
		</div>
	);
}
