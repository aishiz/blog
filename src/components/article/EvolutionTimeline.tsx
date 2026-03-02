import { useState, useEffect } from 'react';

type Era = {
	id: string;
	year: string;
	name: string;
	icon: string;
	color: string;
	interface: string;
	humanRole: string;
	autonomy: number;
	example: string;
	tools: string[];
};

const eras: Era[] = [
	{
		id: 'chatbot',
		year: '2022–2023',
		name: 'Чат-боты',
		icon: '💬',
		color: '#ef4444',
		interface: 'Диалог «вопрос-ответ»',
		humanRole: 'Задаёт каждый шаг вручную',
		autonomy: 10,
		example: '«Напиши мне функцию сортировки на Python» → получаешь код → копируешь → вставляешь → правишь → повторяешь',
		tools: ['ChatGPT', 'Bard', 'Claude'],
	},
	{
		id: 'vibecoding',
		year: '2024',
		name: 'Vibe Coding',
		icon: '✨',
		color: '#f59e0b',
		interface: 'Описание намерения',
		humanRole: 'Описывает цель, правит результат',
		autonomy: 25,
		example: '«Сделай мне лендинг для стартапа с формой подписки» → получаешь проект → правишь стили → деплоишь сам',
		tools: ['Cursor', 'Copilot', 'v0.dev'],
	},
	{
		id: 'agentic',
		year: '2025',
		name: 'Agentic Engineering',
		icon: '🤖',
		color: '#3b82f6',
		interface: 'Оркестрация агентов',
		humanRole: 'Архитектор и менеджер',
		autonomy: 50,
		example: '«Построй API с авторизацией и тестами» → агент пишет код, создаёт тесты, фиксит баги → ты ревьюишь PR',
		tools: ['Devin', 'OpenHands', 'Claude Code'],
	},
	{
		id: 'vibetools',
		year: '2025–2026',
		name: 'Вайб-Инструменты',
		icon: '🎯',
		color: '#8b5cf6',
		interface: 'Постановка цели',
		humanRole: 'Ставит цель, принимает результат',
		autonomy: 75,
		example: '«Мне нужна CRM для моего бизнеса» → агент проектирует, кодит, деплоит → ты получаешь работающий продукт',
		tools: ['Manus', 'Lovable', 'Bolt'],
	},
	{
		id: 'vibeclouding',
		year: '2026+',
		name: 'Вайбклаудинг',
		icon: '☁️',
		color: '#10b981',
		interface: 'Описание боли',
		humanRole: 'Носитель проблемы',
		autonomy: 95,
		example: '«Мои клиенты жалуются на медленную доставку» → агент строит систему трекинга, уведомлений, аналитики + всю инфраструктуру',
		tools: ['SKILL-агенты', 'Облачные оркестраторы', 'Автономные системы'],
	},
];

function useIsMobile(breakpoint = 480) {
	const [m, setM] = useState(false);
	useEffect(() => {
		const check = () => setM(window.innerWidth <= breakpoint);
		check();
		window.addEventListener('resize', check, { passive: true });
		return () => window.removeEventListener('resize', check);
	}, [breakpoint]);
	return m;
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
	timeline: {
		display: 'flex',
		gap: '4px',
		marginBottom: '1.25rem',
		position: 'relative' as const,
	} as React.CSSProperties,
	eraBtn: (era: Era, active: boolean) => ({
		flex: 1,
		padding: '0.6rem 0.4rem',
		borderRadius: '10px',
		border: `2px solid ${active ? era.color : 'var(--border)'}`,
		background: active ? `${era.color}12` : 'var(--bg-secondary)',
		cursor: 'pointer',
		fontFamily: 'inherit',
		transition: 'all 0.3s ease',
		display: 'flex',
		flexDirection: 'column' as const,
		alignItems: 'center',
		gap: '0.25rem',
		transform: active ? 'scale(1.04)' : 'scale(1)',
		boxShadow: active ? `0 4px 20px ${era.color}22` : 'none',
	} as React.CSSProperties),
	eraIcon: {
		fontSize: '1.4rem',
		lineHeight: 1,
	} as React.CSSProperties,
	eraYear: {
		fontSize: '0.6rem',
		fontWeight: 700,
		color: 'var(--text-muted)',
		letterSpacing: '0.02em',
	} as React.CSSProperties,
	eraName: (active: boolean) => ({
		fontSize: '0.62rem',
		fontWeight: 800,
		color: active ? 'var(--text)' : 'var(--text-muted)',
		textAlign: 'center' as const,
		lineHeight: 1.2,
	} as React.CSSProperties),
	detail: {
		padding: '1.25rem',
		borderRadius: '12px',
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
	} as React.CSSProperties,
	detailHeader: (color: string) => ({
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		marginBottom: '1rem',
	} as React.CSSProperties),
	detailName: (color: string) => ({
		fontSize: '1.2rem',
		fontWeight: 900,
		color: color,
	} as React.CSSProperties),
	detailYear: {
		fontSize: '0.75rem',
		fontWeight: 700,
		padding: '0.2rem 0.6rem',
		borderRadius: '100px',
		background: 'var(--bg-card)',
		border: '1px solid var(--border)',
		color: 'var(--text-muted)',
	} as React.CSSProperties,
	autonomyBar: {
		marginBottom: '1rem',
	} as React.CSSProperties,
	autonomyLabel: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: '0.35rem',
	} as React.CSSProperties,
	autonomyText: {
		fontSize: '0.75rem',
		fontWeight: 700,
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.06em',
	} as React.CSSProperties,
	autonomyVal: (color: string) => ({
		fontSize: '0.85rem',
		fontWeight: 900,
		color: color,
		fontFamily: "'JetBrains Mono', monospace",
	} as React.CSSProperties),
	autonomyTrack: {
		height: '12px',
		borderRadius: '6px',
		background: 'var(--bg-card)',
		border: '1px solid var(--border)',
		overflow: 'hidden',
	} as React.CSSProperties,
	autonomyFill: (pct: number, color: string) => ({
		height: '100%',
		width: `${pct}%`,
		borderRadius: '6px',
		background: `linear-gradient(90deg, ${color}, ${color}bb)`,
		transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
	} as React.CSSProperties),
	grid: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: '0.6rem',
		marginBottom: '1rem',
	} as React.CSSProperties,
	infoCard: {
		padding: '0.7rem 0.85rem',
		borderRadius: '8px',
		border: '1px solid var(--border)',
		background: 'var(--bg-card)',
	} as React.CSSProperties,
	infoLabel: {
		fontSize: '0.62rem',
		fontWeight: 700,
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.06em',
		marginBottom: '0.2rem',
	} as React.CSSProperties,
	infoVal: {
		fontSize: '0.85rem',
		color: 'var(--text)',
		lineHeight: 1.5,
		fontWeight: 600,
	} as React.CSSProperties,
	exampleBox: {
		padding: '0.85rem 1rem',
		borderRadius: '8px',
		border: '1px dashed var(--border)',
		background: 'var(--bg-card)',
		fontSize: '0.85rem',
		color: 'var(--text-secondary)',
		lineHeight: 1.6,
		fontStyle: 'italic' as const,
		marginBottom: '0.75rem',
	} as React.CSSProperties,
	toolTags: {
		display: 'flex',
		gap: '0.35rem',
		flexWrap: 'wrap' as const,
	} as React.CSSProperties,
	toolTag: (color: string) => ({
		padding: '0.2rem 0.55rem',
		borderRadius: '100px',
		fontSize: '0.68rem',
		fontWeight: 700,
		background: `${color}15`,
		color: color,
		border: `1px solid ${color}30`,
	} as React.CSSProperties),
};

export default function EvolutionTimeline() {
	const [selected, setSelected] = useState(0);
	const [auto, setAuto] = useState(true);
	const mobile = useIsMobile();

	const era = eras[selected];

	useEffect(() => {
		if (!auto) return;
		const id = setInterval(() => {
			setSelected(s => (s + 1) % eras.length);
		}, 3500);
		return () => clearInterval(id);
	}, [auto]);

	return (
		<div style={{ ...css.wrap, ...(mobile ? { padding: '0.85rem', margin: '1.25em -0.25rem', borderRadius: '10px' } : {}) }}>
			<div style={css.title}>🕰️ Эволюция взаимодействия с AI</div>
			<div style={{ ...css.desc, ...(mobile ? { fontSize: '0.82rem', marginBottom: '1rem' } : {}) }}>
				{mobile ? 'Нажмите на эпоху, чтобы увидеть детали.' : 'Нажмите на эпоху, чтобы увидеть детали. Автопрокрутка каждые 3.5 секунды.'}
			</div>

			{mobile ? (
				<div style={{
					display: 'flex',
					gap: '0.3rem',
					marginBottom: '1rem',
					overflowX: 'auto',
					WebkitOverflowScrolling: 'touch',
					paddingBottom: '4px',
					scrollbarWidth: 'none' as const,
				}}>
					{eras.map((e, i) => (
						<button
							key={e.id}
							style={{
								flexShrink: 0,
								padding: '0.4rem 0.55rem',
								borderRadius: '8px',
								border: `2px solid ${i === selected ? e.color : 'var(--border)'}`,
								background: i === selected ? `${e.color}12` : 'var(--bg-secondary)',
								cursor: 'pointer',
								fontFamily: 'inherit',
								transition: 'all 0.3s ease',
								display: 'flex',
								alignItems: 'center',
								gap: '0.3rem',
								whiteSpace: 'nowrap' as const,
							}}
							onClick={() => { setSelected(i); setAuto(false); }}
						>
							<span style={{ fontSize: '1rem', lineHeight: 1 }}>{e.icon}</span>
							<span style={{
								fontSize: '0.65rem',
								fontWeight: 700,
								color: i === selected ? 'var(--text)' : 'var(--text-muted)',
							}}>
								{e.year}
							</span>
						</button>
					))}
				</div>
			) : (
				<div style={css.timeline}>
					{eras.map((e, i) => (
						<button
							key={e.id}
							style={css.eraBtn(e, i === selected)}
							onClick={() => { setSelected(i); setAuto(false); }}
						>
							<span style={css.eraIcon}>{e.icon}</span>
							<span style={css.eraYear}>{e.year}</span>
							<span style={css.eraName(i === selected)}>{e.name}</span>
						</button>
					))}
				</div>
			)}

			<div style={{ ...css.detail, ...(mobile ? { padding: '0.85rem', borderRadius: '10px' } : {}) }}>
				<div style={{ ...css.detailHeader(era.color), ...(mobile ? { gap: '0.5rem', marginBottom: '0.75rem' } : {}) }}>
					<span style={{ fontSize: mobile ? '1.3rem' : '1.6rem' }}>{era.icon}</span>
					<div style={{ flex: 1, minWidth: 0 }}>
						<div style={{ ...css.detailName(era.color), ...(mobile ? { fontSize: '0.95rem' } : {}) }}>{era.name}</div>
						<span style={{ ...css.detailYear, ...(mobile ? { fontSize: '0.65rem', padding: '0.15rem 0.45rem' } : {}) }}>{era.year}</span>
					</div>
					{!mobile && (
						<button
							style={{
								marginLeft: 'auto',
								padding: '0.35rem 0.75rem',
								borderRadius: '8px',
								border: `1px solid ${auto ? 'var(--accent)' : 'var(--border)'}`,
								background: auto ? 'var(--accent-glow)' : 'var(--bg-card)',
								color: auto ? 'var(--accent-light)' : 'var(--text-muted)',
								fontSize: '0.72rem',
								fontWeight: 600,
								cursor: 'pointer',
								fontFamily: 'inherit',
								transition: 'all 0.2s ease',
							}}
							onClick={() => setAuto(!auto)}
						>
							{auto ? '⏸ Пауза' : '▶ Авто'}
						</button>
					)}
				</div>

				<div style={css.autonomyBar}>
					<div style={css.autonomyLabel}>
						<span style={{ ...css.autonomyText, ...(mobile ? { fontSize: '0.68rem' } : {}) }}>Автономность</span>
						<span style={{ ...css.autonomyVal(era.color), ...(mobile ? { fontSize: '0.78rem' } : {}) }}>{era.autonomy}%</span>
					</div>
					<div style={{ ...css.autonomyTrack, ...(mobile ? { height: '10px' } : {}) }}>
						<div style={css.autonomyFill(era.autonomy, era.color)} />
					</div>
				</div>

				<div style={{
					...css.grid,
					gridTemplateColumns: mobile ? '1fr 1fr' : '1fr 1fr',
					...(mobile ? { gap: '0.4rem', marginBottom: '0.75rem' } : {}),
				}}>
					<div style={{ ...css.infoCard, ...(mobile ? { padding: '0.5rem 0.65rem' } : {}) }}>
						<div style={{ ...css.infoLabel, ...(mobile ? { fontSize: '0.55rem' } : {}) }}>Интерфейс</div>
						<div style={{ ...css.infoVal, ...(mobile ? { fontSize: '0.75rem' } : {}) }}>{era.interface}</div>
					</div>
					<div style={{ ...css.infoCard, ...(mobile ? { padding: '0.5rem 0.65rem' } : {}) }}>
						<div style={{ ...css.infoLabel, ...(mobile ? { fontSize: '0.55rem' } : {}) }}>Роль человека</div>
						<div style={{ ...css.infoVal, ...(mobile ? { fontSize: '0.75rem' } : {}) }}>{era.humanRole}</div>
					</div>
				</div>

				<div style={{ ...css.exampleBox, ...(mobile ? { fontSize: '0.78rem', padding: '0.65rem 0.75rem', lineHeight: 1.5 } : {}) }}>
					{era.example}
				</div>

				<div style={{ ...css.toolTags, ...(mobile ? { gap: '0.25rem' } : {}) }}>
					{era.tools.map(t => (
						<span key={t} style={{
							...css.toolTag(era.color),
							...(mobile ? { fontSize: '0.6rem', padding: '0.15rem 0.4rem' } : {}),
						}}>{t}</span>
					))}
				</div>
			</div>
		</div>
	);
}
