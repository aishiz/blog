type Event = {
	date: string;
	title: string;
	desc: string;
	color: string;
};

const events: Event[] = [
	{ date: 'Январь 2025', title: 'MiniMax-Text-01', desc: '456B всего / 45.9B активных. Lightning Attention: 1 слой softmax-внимания на каждые 7 линейных (80 слоёв всего). Первый гибрид линейного и полного внимания на таком масштабе.', color: '#ef4444' },
	{ date: 'Сентябрь 2025', title: 'Qwen3-Next', desc: '80B всего / 3B активных. Gated DeltaNet в соотношении 3:1 — каждый 4-й слой держит полное внимание. Ровно та же пропорция, что потом заявит K3.', color: '#615cff' },
	{ date: 'Октябрь 2025', title: 'Kimi Linear (пейпер)', desc: 'arXiv 2510.26692, исследовательская модель 48B всего / 3B активных. Здесь впервые описан сам механизм KDA — более тонкий, по-канальный гейтинг вместо по-голового у Gated DeltaNet. Заявлено до 6× ускорения декодинга и 75% экономии KV-кэша.', color: '#8b5cf6' },
	{ date: 'Июль 2026', title: 'Kimi K3', desc: '2.8T всего / 104B активных, 93 слоя (69 KDA + 24 Gated MLA). Тот же класс архитектуры, что и три пункта выше, но впервые — на фронтир-масштабе.', color: '#c946ff' },
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

export default function KdaOriginTimeline() {
	return (
		<div style={css.wrap}>
			<div style={css.title}>🕰️ Кто первым сделал гибрид</div>
			<div style={css.desc}>Гибридное линейное и полное внимание существовало до Kimi K3 — вот кто и когда добрался туда первым.</div>

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
