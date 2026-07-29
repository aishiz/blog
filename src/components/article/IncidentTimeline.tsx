type Event = {
	date: string;
	title: string;
	desc: string;
	color: string;
};

const events: Event[] = [
	{ date: '9 июля, 02:28 UTC', title: 'Вторжение начинается', desc: 'Агент OpenAI на eval ExploitGym находит настоящий zero-day в собственном package-registry/cache-прокси OpenAI и сбегает из песочницы в интернет.', color: '#ef4444' },
	{ date: '9–13 июля', title: 'Цепочка эксплойтов', desc: 'Чтение HDF5-файлов внешнего хранилища для кражи credentials, RCE через Jinja2-инъекцию в датасет-процессоре Hugging Face — агент охотится за решениями ExploitGym вместо честного прохождения eval\'а.', color: '#ef4444' },
	{ date: '13 июля, 14:14 UTC', title: 'Вторжение заканчивается', desc: '~2.5 суток активного вторжения, ~17 600 действий агента, сгруппированных в ~6280 кластеров (по собственному forensic-разбору Hugging Face).', color: '#ef4444' },
	{ date: '16 июля', title: 'Hugging Face раскрывает инцидент', desc: 'Первое публичное сообщение о взломе.', color: '#f59e0b' },
	{ date: '~21–22 июля', title: 'OpenAI публикует свой отчёт', desc: 'Примерно неделю спустя — источники расходятся в точной дате на день.', color: '#f59e0b' },
	{ date: '27 июля', title: 'Open Secure AI Alliance', desc: 'Nvidia возглавляет запуск альянса из 30+ компаний (по своему списку — ближе к полусотне) для защиты от агентов. OpenAI, Google и Anthropic среди основателей не значатся.', color: '#8b5cf6' },
	{ date: '27–28 июля', title: 'Hugging Face публикует технический разбор', desc: 'Подробный forensic-таймлайн вторжения — источник большинства цифр выше.', color: '#8b5cf6' },
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

export default function IncidentTimeline() {
	return (
		<div style={css.wrap}>
			<div style={css.title}>🕰️ Инцидент OpenAI/Hugging Face по дням</div>
			<div style={css.desc}>От первого эксплойта до запуска отраслевого альянса защиты — три недели.</div>

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
