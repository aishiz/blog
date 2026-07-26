import { useState, useEffect, useCallback } from 'react';

// Сценарий из спеки: task-augmented tools/call, который по пути упирается
// в elicitation (нужны данные от юзера) и потом доезжает до completed.
const SCENARIO = [
	{ status: 'working', event: 'tools/call с полем task → CreateTaskResult', note: 'Клиент пометил вызов тула как задачу. Сервер сразу отвечает task-объектом, а не результатом — работа идёт в фоне.' },
	{ status: 'working', event: 'tasks/get → working', note: 'Клиент поллит статус. Может параллельно заниматься чем угодно ещё — соединение не висит.' },
	{ status: 'input_required', event: 'tasks/get → input_required', note: 'Серверу для продолжения нужны данные от пользователя — задача встала на паузу, но это не ошибка.' },
	{ status: 'working', event: 'elicitation отработала → снова working', note: 'Клиент вызвал tasks/result, получил elicitation-запрос, спросил юзера, отправил ответ. Задача возобновилась.' },
	{ status: 'completed', event: 'tasks/get → completed', note: 'Терминальный статус. Теперь можно забрать результат через tasks/result.' },
] as const;

const STATUS_META = {
	working: { color: '#f59e0b', label: 'working', icon: '⏳' },
	input_required: { color: '#3b82f6', label: 'input_required', icon: '❓' },
	completed: { color: '#10b981', label: 'completed', icon: '✅' },
	failed: { color: '#ef4444', label: 'failed', icon: '✖️' },
	cancelled: { color: '#8a7faa', label: 'cancelled', icon: '⛔' },
} as const;

type StatusKey = keyof typeof STATUS_META;

function useIsMobile(breakpoint = 640) {
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
		marginBottom: '1.3rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	statesRow: {
		display: 'flex',
		gap: '0.4rem',
		flexWrap: 'wrap' as const,
		marginBottom: '1.2rem',
	} as React.CSSProperties,
	stateChip: (active: boolean, meta: typeof STATUS_META[StatusKey]) => ({
		display: 'flex',
		alignItems: 'center',
		gap: '0.35rem',
		padding: '0.4rem 0.75rem',
		borderRadius: '100px',
		fontSize: '0.75rem',
		fontWeight: 700,
		border: `1px solid ${active ? meta.color : 'var(--border)'}`,
		background: active ? `${meta.color}22` : 'var(--bg-secondary)',
		color: active ? meta.color : 'var(--text-muted)',
		transition: 'all 0.3s ease',
	} as React.CSSProperties),
	eventBox: {
		padding: '1rem 1.15rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		marginBottom: '1rem',
	} as React.CSSProperties,
	eventTitle: {
		fontFamily: 'var(--font-mono, monospace)',
		fontSize: '0.82rem',
		fontWeight: 700,
		color: 'var(--text)',
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	eventNote: {
		fontSize: '0.83rem',
		color: 'var(--text-secondary)',
		lineHeight: 1.6,
	} as React.CSSProperties,
	controls: {
		display: 'flex',
		gap: '0.5rem',
		alignItems: 'center',
		flexWrap: 'wrap' as const,
	} as React.CSSProperties,
	btn: (active?: boolean) => ({
		padding: '0.5rem 1rem',
		borderRadius: '8px',
		border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
		background: active ? 'var(--accent-glow)' : 'var(--bg-secondary)',
		color: active ? 'var(--accent-light)' : 'var(--text)',
		fontSize: '0.82rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
		transition: 'all 0.2s ease',
	} as React.CSSProperties),
	stepLabel: {
		fontSize: '0.82rem',
		color: 'var(--text-muted)',
		fontWeight: 600,
		marginLeft: 'auto',
		fontVariantNumeric: 'tabular-nums',
	} as React.CSSProperties,
};

export default function McpTasksDemo() {
	const [step, setStep] = useState(0);
	const [auto, setAuto] = useState(true);
	const mobile = useIsMobile();
	const cur = SCENARIO[step];

	const advance = useCallback(() => {
		setStep((s) => (s >= SCENARIO.length - 1 ? 0 : s + 1));
	}, []);

	useEffect(() => {
		if (!auto) return;
		const id = setInterval(advance, 2200);
		return () => clearInterval(id);
	}, [auto, advance]);

	const allStates: StatusKey[] = ['working', 'input_required', 'completed', 'failed', 'cancelled'];

	return (
		<div style={{ ...css.wrap, ...(mobile ? { padding: '1rem', margin: '1.25em 0' } : {}) }}>
			<div style={css.title}>⏱️ Tasks: state machine долгого запроса</div>
			<div style={css.desc}>
				Сценарий: клиент запускает тул как задачу, а сервер по пути упирается в необходимость
				спросить пользователя — задача не падает, а временно встаёт на паузу.
			</div>

			<div style={css.statesRow}>
				{allStates.map((s) => (
					<div key={s} style={css.stateChip(s === cur.status, STATUS_META[s])}>
						<span>{STATUS_META[s].icon}</span>
						<span>{STATUS_META[s].label}</span>
					</div>
				))}
			</div>

			<div style={css.eventBox}>
				<div style={css.eventTitle}>{cur.event}</div>
				<div style={css.eventNote}>{cur.note}</div>
			</div>

			<div style={css.controls}>
				<button style={css.btn()} onClick={() => { setStep((s) => Math.max(0, s - 1)); setAuto(false); }}>← Назад</button>
				<button style={css.btn()} onClick={() => { advance(); setAuto(false); }}>Вперёд →</button>
				<button style={css.btn(auto)} onClick={() => setAuto(!auto)}>{auto ? '⏸ Пауза' : '▶ Авто'}</button>
				<span style={css.stepLabel}>Шаг {step + 1}/{SCENARIO.length}</span>
			</div>
		</div>
	);
}
