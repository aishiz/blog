type Event = {
	date: string;
	title: string;
	desc: string;
	color: string;
};

const events: Event[] = [
	{ date: '24 ноя 2025', title: 'OpenClaw: репозиторий создан', desc: 'Точка отсчёта самой быстрой звёздной траектории в этом списке.', color: '#ff6b2b' },
	{ date: 'конец янв 2026', title: 'OpenClaw пересекает 100 000★', desc: 'Меньше чем за два месяца с момента создания.', color: '#ff6b2b' },
	{ date: '16 фев 2026', title: 'Ouroboros: «рождение»', desc: 'Self-modifying агент Антона Разжигаева выходит в свет.', color: '#ef4444' },
	{ date: '17 фев 2026, 03:41', title: 'Ouroboros: инцидент', desc: '20 самокопий, ~$2000 в API-кредитах за ночь, отказ удалить свой identity-файл — пока автор спал.', color: '#ef4444' },
	{ date: '24 фев 2026', title: 'OpenClaw обгоняет Linux kernel', desc: '224K+ звёзд — 14-е место по звёздам среди всех репозиториев GitHub.', color: '#ff6b2b' },
	{ date: '25 фев 2026', title: 'Hermes Agent v0.1.0', desc: 'Первый релиз от Nous Research.', color: '#8b5cf6' },
	{ date: '3 мар 2026', title: 'OpenClaw обгоняет React', desc: '250 000★ — самый заметный сигнал того, что это уже не нишевая история.', color: '#ff6b2b' },
	{ date: '4 апр 2026', title: 'Anthropic отрезает OAuth OpenClaw', desc: 'Подписки Claude Pro/Max перестают покрывать сторонний OAuth-трафик, временный бан аккаунта автора. Позже, по документам самого OpenClaw, ограничение смягчено — точная дата разворота не подтверждена.', color: '#ef4444' },
	{ date: '18 июня 2026', title: 'Gemini CLI: конец бесплатного тира', desc: 'Sunset в Antigravity CLI, который сохранил free-уровень.', color: '#4285f4' },
	{ date: '1 июля 2026', title: 'Hermes Agent v0.18.0 «The Judgment Release»', desc: 'От v0.1.0 в феврале до зрелого продукта за 5 месяцев.', color: '#8b5cf6' },
	{ date: '13 июля 2026', title: 'Nous Research: переговоры на $1.5B', desc: '$75M+ раунд под руководством Robot Ventures, во многом на тяге Hermes Agent.', color: '#8b5cf6' },
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

export default function AgentTimeline2026() {
	return (
		<div style={css.wrap}>
			<div style={css.title}>📅 2026: год, когда всё это взорвалось</div>
			<div style={css.desc}>Даты подтверждены прямыми источниками (репозитории, официальные объявления) — где источник вторичный, это указано отдельно в тексте статьи.</div>

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
