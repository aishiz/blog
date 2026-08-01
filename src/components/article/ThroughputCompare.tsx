type Row = {
	name: string;
	toks: number;
	kind: 'ar' | 'diffusion';
	source: string;
};

// Все цифры атрибутированы. AR-бейзлайн и diffusion-модели измерены на РАЗНОМ железе/сетапах —
// это иллюстрация порядков величины, а не контролируемое сравнение (см. note).
const ROWS: Row[] = [
	{ name: 'gpt-oss-120b (AR)', toks: 193.5, kind: 'ar', source: 'Artificial Analysis, измеренная output speed' },
	{ name: 'Mercury Mini (diffusion)', toks: 1109, kind: 'diffusion', source: 'пейпер Mercury, arXiv:2506.17298, H100' },
	{ name: 'Celeris-1 (заявлена diffusion)', toks: 2053, kind: 'diffusion', source: 'Artificial Analysis, измеренная output speed' },
];

const MAX = Math.max(...ROWS.map((r) => r.toks));

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
	row: {
		marginBottom: '0.75rem',
	} as React.CSSProperties,
	rowHead: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'baseline',
		marginBottom: '0.3rem',
	} as React.CSSProperties,
	rowName: (color: string) => ({
		fontSize: '0.84rem',
		fontWeight: 700,
		color,
	} as React.CSSProperties),
	rowToks: {
		fontSize: '0.86rem',
		fontWeight: 800,
		color: 'var(--text)',
		fontVariantNumeric: 'tabular-nums' as const,
	} as React.CSSProperties,
	barTrack: {
		height: '14px',
		borderRadius: '4px',
		background: 'var(--bg-secondary)',
		overflow: 'hidden',
	} as React.CSSProperties,
	barFill: (pct: number, color: string) => ({
		width: `${pct}%`,
		height: '100%',
		background: color,
	} as React.CSSProperties),
	rowSource: {
		fontSize: '0.72rem',
		color: 'var(--text-muted)',
		marginTop: '0.2rem',
	} as React.CSSProperties,
	note: {
		marginTop: '0.9rem',
		fontSize: '0.78rem',
		color: 'var(--text-muted)',
		lineHeight: 1.6,
		fontStyle: 'italic' as const,
	} as React.CSSProperties,
};

export default function ThroughputCompare() {
	return (
		<div style={css.wrap}>
			<div style={css.title}>⚡ Throughput: авторегрессия vs diffusion</div>
			<div style={css.desc}>Output-скорость, токенов/с (одиночный поток). Порядок величины, не контролируемый бенчмарк — сетапы разные.</div>

			{ROWS.map((r) => {
				const color = r.kind === 'ar' ? '#3b82f6' : '#8b5cf6';
				return (
					<div key={r.name} style={css.row}>
						<div style={css.rowHead}>
							<span style={css.rowName(color)}>{r.name}</span>
							<span style={css.rowToks}>{r.toks.toLocaleString('ru-RU')} ток/с</span>
						</div>
						<div style={css.barTrack}><div style={css.barFill((r.toks / MAX) * 100, color)} /></div>
						<div style={css.rowSource}>{r.source}</div>
					</div>
				);
			})}

			<div style={css.note}>
				Числа с разного железа и сетапов (H100 vs облачные замеры Artificial Analysis), при разном размере модели и батче — прямое сравнение некорректно, это иллюстрация порядка: AR-фронтир держится в районе 100–200 ток/с на поток, diffusion выходит на 1000–2000. И да, Celeris по скорости реальна — вопросы к ней по качеству, не к throughput (см. ниже).
			</div>
		</div>
	);
}
