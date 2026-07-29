type ModelDrop = {
	name: string;
	drop: number;
	note: string;
};

// Все числа — прямая выдержка из GSM1k (Zhang, Da et al., arXiv:2405.00332):
// свежий, незагрязнённый набор задач в стиле и сложности GSM8k, построенный
// специально для проверки на контаминацию/запоминание. Просадка = скор на
// GSM8k минус скор на GSM1k (в процентных пунктах).
const DROPS: ModelDrop[] = [
	{ name: 'Yi-6B-Chat', drop: 8.0, note: 'Крупная модель — крупная просадка' },
	{ name: 'Xwin-Math-13B', drop: 6.4, note: 'Специализированная math-модель — не спасает' },
	{ name: 'Phi-2', drop: 6.3, note: '56.6% → 50.4%' },
	{ name: 'Phi-1.5', drop: 5.1, note: '' },
	{ name: 'Llama-3-70B-Instruct', drop: 1.4, note: 'Фронтир-модель — просадка почти не заметна' },
	{ name: 'Claude-3-Haiku', drop: 0.9, note: '' },
	{ name: 'GPT-3.5-Turbo', drop: 0.9, note: '' },
];

const MAX_DROP = Math.max(...DROPS.map((d) => d.drop));

function colorFor(drop: number): string {
	return drop >= 5 ? '#ef4444' : '#22c55e';
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
	desc: {
		fontSize: '0.88rem',
		color: 'var(--text-muted)',
		marginBottom: '1.25rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	barRow: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.6rem',
		marginBottom: '0.55rem',
	} as React.CSSProperties,
	barLabel: {
		width: '170px',
		flexShrink: 0,
		fontSize: '0.8rem',
		color: 'var(--text)',
		fontWeight: 600,
	} as React.CSSProperties,
	barTrack: {
		flex: 1,
		height: '20px',
		borderRadius: '5px',
		background: 'var(--bg-secondary)',
		overflow: 'hidden',
	} as React.CSSProperties,
	barFill: (pct: number, color: string) => ({
		width: `${pct}%`,
		height: '100%',
		background: color,
	} as React.CSSProperties),
	barValue: {
		width: '56px',
		flexShrink: 0,
		fontSize: '0.8rem',
		fontWeight: 700,
		color: 'var(--text)',
		textAlign: 'right' as const,
	} as React.CSSProperties,
	note: {
		marginTop: '0.75rem',
		fontSize: '0.8rem',
		color: 'var(--text-muted)',
		lineHeight: 1.6,
	} as React.CSSProperties,
};

export default function ContaminationChart() {
	return (
		<div style={css.wrap}>
			<div style={css.title}>📉 Просадка на свежем, незагрязнённом наборе задач</div>
			<div style={css.desc}>GSM8k vs GSM1k (arXiv:2405.00332) — разница в процентных пунктах. Чем больше просадка, тем вероятнее, что старый результат держался на запоминании, а не на рассуждении.</div>

			{DROPS.map((d) => (
				<div key={d.name} style={css.barRow}>
					<span style={css.barLabel}>{d.name}</span>
					<div style={css.barTrack}><div style={css.barFill((d.drop / MAX_DROP) * 100, colorFor(d.drop))} /></div>
					<span style={css.barValue}>−{d.drop.toFixed(1)}</span>
				</div>
			))}

			<div style={css.note}>Пейпер нашёл статистически значимую корреляцию (Spearman r² = 0.36) между вероятностью того, что модель дословно процитирует задачу из GSM8k, и размером просадки — прямое свидетельство запоминания у части моделей.</div>
		</div>
	);
}
