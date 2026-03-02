import { useState, useEffect, useCallback } from 'react';

type Skill = {
	id: string;
	name: string;
	icon: string;
	color: string;
	category: string;
	description: string;
};

type Task = {
	text: string;
	skillIds: string[];
};

const skills: Skill[] = [
	{ id: 'k8s', name: 'Kubernetes Deploy', icon: '☸️', color: '#326ce5', category: 'Инфраструктура', description: 'Оркестрация контейнеров, Helm-чарты, автоскейлинг' },
	{ id: 'db', name: 'Database Setup', icon: '🗄️', color: '#336791', category: 'Данные', description: 'PostgreSQL, миграции, бэкапы, репликация' },
	{ id: 'ci', name: 'CI/CD Pipeline', icon: '🔄', color: '#10b981', category: 'DevOps', description: 'GitHub Actions, тесты, деплой, rollback' },
	{ id: 'auth', name: 'Auth & Security', icon: '🔐', color: '#f59e0b', category: 'Безопасность', description: 'OAuth2, JWT, RBAC, шифрование' },
	{ id: 'monitor', name: 'Monitoring', icon: '📊', color: '#ec4899', category: 'Наблюдаемость', description: 'Prometheus, Grafana, алерты, логи' },
	{ id: 'cdn', name: 'CDN & Caching', icon: '⚡', color: '#06b6d4', category: 'Производительность', description: 'CloudFront, Redis, edge-кэширование' },
	{ id: 'dns', name: 'DNS & Domains', icon: '🌐', color: '#8b5cf6', category: 'Сеть', description: 'Route53, SSL-сертификаты, маршрутизация' },
	{ id: 'storage', name: 'Object Storage', icon: '📦', color: '#f97316', category: 'Хранилище', description: 'S3, lifecycle-политики, CDN-интеграция' },
];

const tasks: Task[] = [
	{ text: '«Мне нужен масштабируемый API для стартапа»', skillIds: ['k8s', 'db', 'ci', 'auth', 'monitor'] },
	{ text: '«Хочу блог с картинками и быстрой загрузкой»', skillIds: ['cdn', 'storage', 'dns', 'ci'] },
	{ text: '«Нужна безопасная платформа для медицинских данных»', skillIds: ['auth', 'db', 'monitor', 'k8s', 'ci'] },
	{ text: '«Запусти мне интернет-магазин»', skillIds: ['k8s', 'db', 'auth', 'cdn', 'storage', 'dns', 'ci', 'monitor'] },
];

const CONTEXT_MAX = 8;

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
	taskBtn: (active: boolean) => ({
		padding: '0.6rem 1rem',
		borderRadius: '10px',
		border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
		background: active ? 'var(--accent-glow)' : 'var(--bg-secondary)',
		color: active ? 'var(--accent-light)' : 'var(--text)',
		fontSize: '0.85rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
		transition: 'all 0.25s ease',
		textAlign: 'left' as const,
		width: '100%',
	} as React.CSSProperties),
	section: {
		marginTop: '1.25rem',
	} as React.CSSProperties,
	sectionLabel: {
		fontSize: '0.72rem',
		fontWeight: 700,
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.06em',
		marginBottom: '0.6rem',
	} as React.CSSProperties,
	registry: {
		display: 'grid',
		gridTemplateColumns: 'repeat(4, 1fr)',
		gap: '6px',
	} as React.CSSProperties,
	skillChip: (skill: Skill, isActive: boolean, isLoaded: boolean) => ({
		padding: '0.5rem 0.6rem',
		borderRadius: '8px',
		border: `1px solid ${isLoaded ? skill.color : isActive ? `${skill.color}66` : 'var(--border)'}`,
		background: isLoaded ? `${skill.color}18` : 'var(--bg-secondary)',
		opacity: isActive || isLoaded ? 1 : 0.35,
		transition: 'all 0.4s ease',
		transform: isLoaded ? 'scale(1.03)' : 'scale(1)',
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '0.15rem',
		cursor: 'default',
	} as React.CSSProperties),
	skillIcon: {
		fontSize: '1.1rem',
		lineHeight: 1,
	} as React.CSSProperties,
	skillName: {
		fontSize: '0.68rem',
		fontWeight: 700,
		color: 'var(--text)',
		lineHeight: 1.2,
	} as React.CSSProperties,
	skillCat: {
		fontSize: '0.58rem',
		color: 'var(--text-muted)',
		fontWeight: 500,
	} as React.CSSProperties,
	contextWindow: {
		marginTop: '1rem',
		padding: '1rem',
		borderRadius: '10px',
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
	} as React.CSSProperties,
	contextBar: {
		height: '8px',
		borderRadius: '4px',
		background: 'var(--bg-card)',
		border: '1px solid var(--border)',
		overflow: 'hidden',
		marginBottom: '0.75rem',
	} as React.CSSProperties,
	contextFill: (pct: number) => ({
		height: '100%',
		width: `${pct}%`,
		borderRadius: '4px',
		background: pct > 75
			? 'linear-gradient(90deg, #f59e0b, #ef4444)'
			: 'linear-gradient(90deg, var(--accent), var(--accent-secondary))',
		transition: 'width 0.5s ease, background 0.5s ease',
	} as React.CSSProperties),
	loadedSkills: {
		display: 'flex',
		gap: '0.4rem',
		flexWrap: 'wrap' as const,
	} as React.CSSProperties,
	loadedTag: (color: string) => ({
		padding: '0.25rem 0.6rem',
		borderRadius: '100px',
		fontSize: '0.7rem',
		fontWeight: 700,
		background: `${color}18`,
		color: color,
		border: `1px solid ${color}33`,
		display: 'flex',
		alignItems: 'center',
		gap: '0.3rem',
		transition: 'all 0.3s ease',
	} as React.CSSProperties),
	stats: {
		display: 'flex',
		gap: '1.5rem',
		marginTop: '1rem',
		flexWrap: 'wrap' as const,
	} as React.CSSProperties,
	stat: {
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '0.1rem',
	} as React.CSSProperties,
	statVal: {
		fontSize: '1.3rem',
		fontWeight: 900,
		background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
		WebkitBackgroundClip: 'text',
		WebkitTextFillColor: 'transparent',
		backgroundClip: 'text',
	} as React.CSSProperties,
	statLabel: {
		fontSize: '0.68rem',
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.06em',
		fontWeight: 600,
	} as React.CSSProperties,
};

export default function SkillOrchestrator() {
	const [taskIdx, setTaskIdx] = useState(0);
	const [loadedIds, setLoadedIds] = useState<string[]>([]);
	const [phase, setPhase] = useState<'idle' | 'loading' | 'done'>('idle');
	const mobile = useIsMobile();

	const task = tasks[taskIdx];
	const contextPct = (loadedIds.length / CONTEXT_MAX) * 100;

	const startLoading = useCallback((idx: number) => {
		setTaskIdx(idx);
		setLoadedIds([]);
		setPhase('loading');
	}, []);

	useEffect(() => {
		if (phase !== 'loading') return;

		const needed = task.skillIds;
		if (loadedIds.length >= needed.length) {
			setPhase('done');
			return;
		}

		const timer = setTimeout(() => {
			setLoadedIds(prev => [...prev, needed[prev.length]]);
		}, 500);

		return () => clearTimeout(timer);
	}, [phase, loadedIds, task.skillIds]);

	useEffect(() => {
		startLoading(0);
	}, [startLoading]);

	return (
		<div style={{ ...css.wrap, ...(mobile ? { padding: '0.85rem', margin: '1.25em -0.25rem', borderRadius: '10px' } : {}) }}>
			<div style={css.title}>🧠 SKILL Orchestrator Demo</div>
			<div style={{ ...css.desc, ...(mobile ? { fontSize: '0.82rem', marginBottom: '1rem' } : {}) }}>
				{mobile ? 'Выберите задачу — агент загрузит нужные SKILL-ы.' : 'Выберите задачу — посмотрите, как агент находит и загружает нужные SKILL-ы в контекстное окно.'}
			</div>

			<div style={{ display: 'flex', flexDirection: 'column', gap: mobile ? '0.3rem' : '0.4rem' }}>
				{tasks.map((t, i) => (
					<button
						key={i}
						style={{
							...css.taskBtn(i === taskIdx),
							...(mobile ? { fontSize: '0.78rem', padding: '0.45rem 0.65rem', lineHeight: 1.4, borderRadius: '8px' } : {}),
						}}
						onClick={() => startLoading(i)}
						onMouseEnter={(e) => { if (i !== taskIdx) e.currentTarget.style.borderColor = 'var(--accent)'; }}
						onMouseLeave={(e) => { if (i !== taskIdx) e.currentTarget.style.borderColor = 'var(--border)'; }}
					>
						{t.text}
					</button>
				))}
			</div>

			<div style={{ ...css.section, ...(mobile ? { marginTop: '1rem' } : {}) }}>
				<div style={css.sectionLabel}>Реестр SKILL-ов</div>
				<div style={{
					...css.registry,
					...(mobile ? { gridTemplateColumns: 'repeat(4, 1fr)', gap: '3px' } : {}),
				}}>
					{skills.map((s) => {
						const isLoaded = loadedIds.includes(s.id);
						const isActive = task.skillIds.includes(s.id);
						return (
							<div key={s.id} style={{
								...css.skillChip(s, isActive, isLoaded),
								...(mobile ? { padding: '0.35rem 0.3rem', borderRadius: '6px', alignItems: 'center' } : {}),
							}}>
								<span style={{ ...css.skillIcon, ...(mobile ? { fontSize: '0.95rem' } : {}) }}>{s.icon}</span>
								{!mobile && <span style={css.skillName}>{s.name}</span>}
								{!mobile && <span style={css.skillCat}>{s.category}</span>}
							</div>
						);
					})}
				</div>
			</div>

			<div style={{ ...css.contextWindow, ...(mobile ? { padding: '0.75rem', marginTop: '0.75rem' } : {}) }}>
				<div style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: '0.4rem',
				}}>
					<span style={{
						fontSize: mobile ? '0.65rem' : '0.72rem',
						fontWeight: 700,
						color: 'var(--text-muted)',
						textTransform: 'uppercase' as const,
						letterSpacing: '0.06em',
					}}>
						Контекст агента
					</span>
					<span style={{
						fontSize: mobile ? '0.65rem' : '0.72rem',
						fontWeight: 700,
						color: contextPct > 75 ? '#ef4444' : 'var(--accent-light)',
						fontFamily: "'JetBrains Mono', monospace",
					}}>
						{loadedIds.length}/{CONTEXT_MAX}
					</span>
				</div>

				<div style={css.contextBar}>
					<div style={css.contextFill(contextPct)} />
				</div>

				<div style={{ ...css.loadedSkills, ...(mobile ? { gap: '0.3rem' } : {}) }}>
					{loadedIds.length === 0 && (
						<span style={{ fontSize: mobile ? '0.72rem' : '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
							{phase === 'loading' ? 'Поиск SKILL-ов...' : 'Выберите задачу'}
						</span>
					)}
					{loadedIds.map((id) => {
						const s = skills.find(sk => sk.id === id)!;
						return (
							<span key={id} style={{
								...css.loadedTag(s.color),
								...(mobile ? { fontSize: '0.62rem', padding: '0.2rem 0.45rem', gap: '0.2rem' } : {}),
							}}>
								{s.icon} {mobile ? s.name.split(' ')[0] : s.name}
							</span>
						);
					})}
				</div>
			</div>

			<div style={{
				...css.stats,
				...(mobile ? { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.75rem' } : {}),
			}}>
				<div style={css.stat}>
					<span style={{ ...css.statVal, ...(mobile ? { fontSize: '1rem' } : {}) }}>{task.skillIds.length}</span>
					<span style={{ ...css.statLabel, ...(mobile ? { fontSize: '0.58rem' } : {}) }}>Нужно</span>
				</div>
				<div style={css.stat}>
					<span style={{ ...css.statVal, ...(mobile ? { fontSize: '1rem' } : {}) }}>{loadedIds.length}</span>
					<span style={{ ...css.statLabel, ...(mobile ? { fontSize: '0.58rem' } : {}) }}>Загружено</span>
				</div>
				<div style={css.stat}>
					<span style={{ ...css.statVal, ...(mobile ? { fontSize: '1rem' } : {}) }}>{contextPct.toFixed(0)}%</span>
					<span style={{ ...css.statLabel, ...(mobile ? { fontSize: '0.58rem' } : {}) }}>Контекст</span>
				</div>
				<div style={css.stat}>
					<span style={{ ...css.statVal, ...(mobile ? { fontSize: '1rem' } : {}) }}>
						{phase === 'done' ? '✅' : phase === 'loading' ? '⏳' : '—'}
					</span>
					<span style={{ ...css.statLabel, ...(mobile ? { fontSize: '0.58rem' } : {}) }}>Статус</span>
				</div>
			</div>
		</div>
	);
}
