import { useState, useEffect, useCallback } from 'react';

type AgentTask = {
	agent: string;
	icon: string;
	color: string;
	action: string;
	duration: number;
};

type Scenario = {
	input: string;
	thinking: string;
	agents: AgentTask[];
	result: string;
};

const scenarios: Scenario[] = [
	{
		input: 'Мне нужен сайт для моей пекарни с онлайн-заказами',
		thinking: 'Декомпозиция: фронтенд + API + БД + платёжная система + хостинг...',
		agents: [
			{ agent: 'Infra Agent', icon: '☸️', color: '#326ce5', action: 'Создаёт Kubernetes-кластер в AWS EKS', duration: 800 },
			{ agent: 'DB Agent', icon: '🗄️', color: '#336791', action: 'Разворачивает PostgreSQL + Redis', duration: 600 },
			{ agent: 'Auth Agent', icon: '🔐', color: '#f59e0b', action: 'Настраивает OAuth2 + JWT для клиентов', duration: 500 },
			{ agent: 'Frontend Agent', icon: '🎨', color: '#ec4899', action: 'Генерирует React-приложение с каталогом', duration: 700 },
			{ agent: 'Payment Agent', icon: '💳', color: '#10b981', action: 'Интегрирует Stripe для приёма платежей', duration: 600 },
			{ agent: 'CI/CD Agent', icon: '🔄', color: '#7c3aed', action: 'Настраивает GitHub Actions + auto-deploy', duration: 400 },
		],
		result: '✅ bakery.app — готов к работе. 6 агентов, 0 строк кода от человека.',
	},
	{
		input: 'Хочу платформу для онлайн-курсов с видео и тестами',
		thinking: 'Декомпозиция: видео-хостинг + LMS + аналитика + CDN + авторизация...',
		agents: [
			{ agent: 'Infra Agent', icon: '☸️', color: '#326ce5', action: 'Создаёт multi-AZ кластер для отказоустойчивости', duration: 900 },
			{ agent: 'Storage Agent', icon: '📦', color: '#f97316', action: 'Настраивает S3 + транскодирование видео', duration: 700 },
			{ agent: 'CDN Agent', icon: '⚡', color: '#06b6d4', action: 'Разворачивает CloudFront для стриминга', duration: 500 },
			{ agent: 'DB Agent', icon: '🗄️', color: '#336791', action: 'PostgreSQL для курсов + MongoDB для аналитики', duration: 600 },
			{ agent: 'Auth Agent', icon: '🔐', color: '#f59e0b', action: 'SSO + роли: студент, преподаватель, админ', duration: 500 },
			{ agent: 'Monitor Agent', icon: '📊', color: '#ec4899', action: 'Prometheus + Grafana + алерты по SLA', duration: 400 },
		],
		result: '✅ learn.platform — готов. Видео, тесты, аналитика. Масштабируется автоматически.',
	},
	{
		input: 'Нужен чат-бот для поддержки клиентов моего магазина',
		thinking: 'Декомпозиция: LLM-инференс + RAG + интеграция с CRM + веб-виджет...',
		agents: [
			{ agent: 'ML Agent', icon: '🧠', color: '#7c3aed', action: 'Деплоит LLM через vLLM + настраивает RAG', duration: 800 },
			{ agent: 'DB Agent', icon: '🗄️', color: '#336791', action: 'Векторная БД (pgvector) для базы знаний', duration: 500 },
			{ agent: 'API Agent', icon: '🔌', color: '#3b82f6', action: 'REST API + WebSocket для real-time чата', duration: 600 },
			{ agent: 'Infra Agent', icon: '☸️', color: '#326ce5', action: 'GPU-ноды в кластере + автоскейлинг', duration: 700 },
			{ agent: 'Frontend Agent', icon: '🎨', color: '#ec4899', action: 'Виджет для встраивания на сайт', duration: 400 },
		],
		result: '✅ support-bot — отвечает на вопросы по базе знаний. RAG + LLM, без галлюцинаций.',
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
	scenarioTabs: {
		display: 'flex',
		gap: '0.4rem',
		flexWrap: 'wrap' as const,
		marginBottom: '1.25rem',
	} as React.CSSProperties,
	tab: (active: boolean) => ({
		padding: '0.4rem 0.85rem',
		borderRadius: '100px',
		border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
		background: active ? 'var(--accent-glow)' : 'var(--bg-secondary)',
		color: active ? 'var(--accent-light)' : 'var(--text-muted)',
		fontSize: '0.78rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
		transition: 'all 0.2s ease',
	} as React.CSSProperties),
	inputBox: {
		padding: '1rem 1.25rem',
		borderRadius: '10px',
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
		marginBottom: '1rem',
	} as React.CSSProperties,
	inputLabel: {
		fontSize: '0.68rem',
		fontWeight: 700,
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.06em',
		marginBottom: '0.4rem',
	} as React.CSSProperties,
	inputText: {
		fontSize: '1rem',
		fontWeight: 700,
		color: 'var(--text)',
		fontStyle: 'italic' as const,
		lineHeight: 1.5,
	} as React.CSSProperties,
	thinkingBox: {
		padding: '0.6rem 1rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px dashed var(--border)',
		fontSize: '0.82rem',
		color: 'var(--text-muted)',
		fontStyle: 'italic' as const,
		marginBottom: '1rem',
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
	} as React.CSSProperties,
	agentList: {
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '0.5rem',
		marginBottom: '1rem',
	} as React.CSSProperties,
	agentRow: (color: string, active: boolean, done: boolean) => ({
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		padding: '0.7rem 1rem',
		borderRadius: '10px',
		border: `1px solid ${done ? `${color}66` : active ? color : 'var(--border)'}`,
		background: done ? `${color}0a` : 'var(--bg-secondary)',
		transition: 'all 0.4s ease',
		opacity: active || done ? 1 : 0.4,
	} as React.CSSProperties),
	agentIcon: {
		fontSize: '1.3rem',
		flexShrink: 0,
		lineHeight: 1,
	} as React.CSSProperties,
	agentInfo: {
		flex: 1,
		minWidth: 0,
	} as React.CSSProperties,
	agentName: {
		fontSize: '0.82rem',
		fontWeight: 700,
		color: 'var(--text)',
	} as React.CSSProperties,
	agentAction: {
		fontSize: '0.75rem',
		color: 'var(--text-muted)',
		lineHeight: 1.4,
	} as React.CSSProperties,
	agentStatus: (done: boolean, active: boolean) => ({
		fontSize: '0.72rem',
		fontWeight: 700,
		padding: '0.2rem 0.5rem',
		borderRadius: '100px',
		background: done ? '#10b98118' : active ? 'var(--accent-glow)' : 'var(--bg-card)',
		color: done ? '#10b981' : active ? 'var(--accent-light)' : 'var(--text-muted)',
		border: `1px solid ${done ? '#10b98133' : active ? 'var(--accent)' : 'var(--border)'}`,
		flexShrink: 0,
		whiteSpace: 'nowrap' as const,
	} as React.CSSProperties),
	resultBox: (visible: boolean) => ({
		padding: '1rem 1.25rem',
		borderRadius: '10px',
		border: '2px solid #10b981',
		background: '#10b98108',
		fontSize: '0.92rem',
		fontWeight: 700,
		color: '#10b981',
		opacity: visible ? 1 : 0,
		transform: visible ? 'translateY(0)' : 'translateY(8px)',
		transition: 'all 0.5s ease',
	} as React.CSSProperties),
	progressBar: {
		height: '4px',
		borderRadius: '2px',
		background: 'var(--bg-secondary)',
		overflow: 'hidden',
		marginBottom: '1rem',
	} as React.CSSProperties,
	progressFill: (pct: number) => ({
		height: '100%',
		width: `${pct}%`,
		borderRadius: '2px',
		background: 'linear-gradient(90deg, var(--accent), #10b981)',
		transition: 'width 0.4s ease',
	} as React.CSSProperties),
};

export default function VibecloudingSimulator() {
	const [scenarioIdx, setScenarioIdx] = useState(0);
	const [completedAgents, setCompletedAgents] = useState<number>(0);
	const [activeAgent, setActiveAgent] = useState<number>(-1);
	const [showThinking, setShowThinking] = useState(false);
	const [showResult, setShowResult] = useState(false);
	const [running, setRunning] = useState(false);
	const mobile = useIsMobile();

	const scenario = scenarios[scenarioIdx];
	const totalAgents = scenario.agents.length;
	const progressPct = (completedAgents / totalAgents) * 100;

	const runSimulation = useCallback((idx: number) => {
		setScenarioIdx(idx);
		setCompletedAgents(0);
		setActiveAgent(-1);
		setShowThinking(false);
		setShowResult(false);
		setRunning(true);

		setTimeout(() => setShowThinking(true), 300);
	}, []);

	useEffect(() => {
		if (!running || !showThinking) return;

		const sc = scenarios[scenarioIdx];

		if (activeAgent === -1) {
			const timer = setTimeout(() => setActiveAgent(0), 600);
			return () => clearTimeout(timer);
		}

		if (activeAgent >= sc.agents.length) {
			setRunning(false);
			setShowResult(true);
			return;
		}

		const timer = setTimeout(() => {
			setCompletedAgents(activeAgent + 1);
			setActiveAgent(activeAgent + 1);
		}, sc.agents[activeAgent].duration);

		return () => clearTimeout(timer);
	}, [running, showThinking, activeAgent, scenarioIdx]);

	useEffect(() => {
		runSimulation(0);
	}, [runSimulation]);

	return (
		<div style={{ ...css.wrap, ...(mobile ? { padding: '0.85rem', margin: '1.25em -0.25rem', borderRadius: '10px' } : {}) }}>
			<div style={css.title}>🚀 Vibeclouding Simulator</div>
			<div style={{ ...css.desc, ...(mobile ? { fontSize: '0.82rem', marginBottom: '1rem' } : {}) }}>
				{mobile ? 'Выберите сценарий — агент координирует работу.' : 'Выберите сценарий — посмотрите, как Агент-Оркестратор декомпозирует задачу и координирует специализированных агентов.'}
			</div>

			<div style={{ ...css.scenarioTabs, ...(mobile ? { gap: '0.3rem', marginBottom: '1rem' } : {}) }}>
				{scenarios.map((_, i) => (
					<button
						key={i}
						style={{
							...css.tab(i === scenarioIdx),
							...(mobile ? { fontSize: '0.72rem', padding: '0.35rem 0.55rem', flex: 1, textAlign: 'center' as const } : {}),
						}}
						onClick={() => runSimulation(i)}
					>
						{['🍞 Пекарня', '📚 Курсы', '🤖 Чат-бот'][i]}
					</button>
				))}
			</div>

			<div style={{ ...css.inputBox, ...(mobile ? { padding: '0.75rem 0.85rem' } : {}) }}>
				<div style={{ ...css.inputLabel, ...(mobile ? { fontSize: '0.62rem' } : {}) }}>👤 Человек говорит:</div>
				<div style={{ ...css.inputText, ...(mobile ? { fontSize: '0.85rem', lineHeight: 1.4 } : {}) }}>
					{scenario.input}
				</div>
			</div>

			{showThinking && (
				<div style={{ ...css.thinkingBox, ...(mobile ? { fontSize: '0.75rem', padding: '0.5rem 0.75rem', lineHeight: 1.4 } : {}) }}>
					<span style={{ fontSize: mobile ? '0.95rem' : '1.1rem', flexShrink: 0 }}>🧠</span>
					<span>{scenario.thinking}</span>
				</div>
			)}

			<div style={css.progressBar}>
				<div style={css.progressFill(progressPct)} />
			</div>

			<div style={{ ...css.agentList, ...(mobile ? { gap: '0.35rem' } : {}) }}>
				{scenario.agents.map((agent, i) => {
					const done = i < completedAgents;
					const active = i === activeAgent && !done;
					return (
						<div key={i} style={{
							...css.agentRow(agent.color, active, done),
							...(mobile ? { padding: '0.45rem 0.6rem', gap: '0.4rem', borderRadius: '8px' } : {}),
						}}>
							<span style={{ ...css.agentIcon, ...(mobile ? { fontSize: '1.1rem' } : {}) }}>{agent.icon}</span>
							<div style={css.agentInfo}>
								<div style={{ ...css.agentName, ...(mobile ? { fontSize: '0.75rem' } : {}) }}>{agent.agent}</div>
								<div style={{ ...css.agentAction, ...(mobile ? { fontSize: '0.68rem', lineHeight: 1.35 } : {}) }}>{agent.action}</div>
							</div>
							<span style={{
								...css.agentStatus(done, active),
								...(mobile ? { fontSize: '0.62rem', padding: '0.15rem 0.35rem' } : {}),
							}}>
								{done ? '✅' : active ? '⏳' : '⏸'}
							</span>
						</div>
					);
				})}
			</div>

			<div style={{
				...css.resultBox(showResult),
				...(mobile ? { fontSize: '0.82rem', padding: '0.75rem 0.85rem' } : {}),
			}}>
				{scenario.result}
			</div>
		</div>
	);
}
