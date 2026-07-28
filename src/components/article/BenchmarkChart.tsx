type Entry = {
	label: string;
	score: number;
	ci: string;
	date: string;
	color: string;
};

const entries: Entry[] = [
	{ label: 'Codex + GPT-5.5', score: 83.1, ci: '±1.1%', date: '1 мая 2026', color: '#10a37f' },
	{ label: 'Claude Code + Opus 4.8', score: 78.9, ci: '±1.3%', date: '9 июля 2026', color: '#ff6b2b' },
	{ label: 'Gemini CLI + Gemini 3.1 Pro', score: 65.8, ci: '±1.7%', date: '5 мая 2026', color: '#4285f4' },
];

const maxScore = Math.max(...entries.map((e) => e.score));

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
	barRow: { marginBottom: '1rem' } as React.CSSProperties,
	barLabel: {
		display: 'flex',
		justifyContent: 'space-between',
		fontSize: '0.85rem',
		color: 'var(--text-secondary)',
		marginBottom: '0.35rem',
	} as React.CSSProperties,
	barTrack: {
		height: '14px',
		borderRadius: '100px',
		background: 'var(--bg-secondary)',
		overflow: 'hidden',
		border: '1px solid var(--border)',
	} as React.CSSProperties,
	barFill: (pct: number, color: string) => ({
		height: '100%',
		width: `${pct}%`,
		background: color,
		borderRadius: '100px',
		transition: 'width 0.3s ease',
	} as React.CSSProperties),
	meta: {
		fontSize: '0.72rem',
		color: 'var(--text-muted)',
		marginTop: '0.25rem',
	} as React.CSSProperties,
	source: {
		marginTop: '1.1rem',
		fontSize: '0.82rem',
		color: 'var(--text-muted)',
		lineHeight: 1.6,
	} as React.CSSProperties,
};

export default function BenchmarkChart() {
	return (
		<div style={css.wrap}>
			<div style={css.title}>📊 Terminal-Bench 2.1</div>
			<div style={css.desc}>
				89 задач, официальный лидерборд. Записи датированы по-разному (модели добавлялись не одновременно) — это не синхронный снимок одного дня.
			</div>

			{entries.map((e) => (
				<div key={e.label} style={css.barRow}>
					<div style={css.barLabel}>
						<span>{e.label}</span>
						<span style={{ fontWeight: 700, color: 'var(--text)' }}>{e.score}% {e.ci}</span>
					</div>
					<div style={css.barTrack}>
						<div style={css.barFill((e.score / maxScore) * 100, e.color)} />
					</div>
					<div style={css.meta}>запись от {e.date}</div>
				</div>
			))}

			<div style={css.source}>
				Источник: <a href="https://www.tbench.ai/leaderboard/terminal-bench/2.1" target="_blank" rel="noopener">tbench.ai/leaderboard/terminal-bench/2.1</a>. Есть заявка на более высокий результат (89.5%) на другом харнессе — в эту тройку она не входит, отдельно не проверялась.
			</div>
		</div>
	);
}
