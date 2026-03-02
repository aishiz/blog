import { useState, useEffect, useRef, useCallback } from 'react';

const TOTAL_AGENTS = 100;

type AgentState = 'idle' | 'working' | 'done';

function useIsMobile(bp = 480) {
	const [m, setM] = useState(false);
	useEffect(() => {
		const check = () => setM(window.innerWidth <= bp);
		check();
		window.addEventListener('resize', check, { passive: true });
		return () => window.removeEventListener('resize', check);
	}, [bp]);
	return m;
}

const COLOR: Record<AgentState, string> = {
	idle: 'var(--bg-secondary)',
	working: '#f59e0b',
	done: '#10b981',
};
const BORDER: Record<AgentState, string> = {
	idle: 'var(--border)',
	working: '#f59e0b',
	done: '#10b981',
};

export default function AgentSwarmViz() {
	const [agents, setAgents] = useState<AgentState[]>(Array(TOTAL_AGENTS).fill('idle'));
	const [mode, setMode] = useState<'parallel' | 'sequential'>('parallel');
	const [running, setRunning] = useState(false);
	const [speed, setSpeed] = useState<string | null>(null);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const mobile = useIsMobile();

	const clearTimer = () => {
		if (timerRef.current) clearTimeout(timerRef.current);
	};

	const reset = useCallback(() => {
		clearTimer();
		setAgents(Array(TOTAL_AGENTS).fill('idle'));
		setRunning(false);
		setSpeed(null);
	}, []);

	const run = useCallback(() => {
		reset();
		timerRef.current = setTimeout(() => {
			setRunning(true);
			if (mode === 'parallel') {
				setAgents(Array(TOTAL_AGENTS).fill('working'));
				timerRef.current = setTimeout(() => {
					setAgents(Array(TOTAL_AGENTS).fill('done'));
					setSpeed('4.5×');
					setRunning(false);
				}, 1100);
			} else {
				let i = 0;
				const step = () => {
					if (i >= TOTAL_AGENTS) {
						setAgents(Array(TOTAL_AGENTS).fill('done'));
						setSpeed('1×');
						setRunning(false);
						return;
					}
					setAgents(prev => {
						const next = [...prev] as AgentState[];
						if (i > 0) next[i - 1] = 'done';
						next[i] = 'working';
						return next;
					});
					i++;
					timerRef.current = setTimeout(step, 50);
				};
				step();
			}
		}, 50);
	}, [mode, reset]);

	useEffect(() => () => clearTimer(), []);

	const cols = mobile ? 10 : 20;
	const cellSize = mobile ? 22 : 24;
	const gap = mobile ? 3 : 4;

	const doneCount = agents.filter(a => a === 'done').length;
	const workingCount = agents.filter(a => a === 'working').length;
	const idleCount = agents.filter(a => a === 'idle').length;

	const tapStyle: React.CSSProperties = {
		WebkitTapHighlightColor: 'transparent',
		touchAction: 'manipulation',
	};

	const btnBase: React.CSSProperties = {
		...tapStyle,
		padding: mobile ? '0 0.9rem' : '0.55rem 1.1rem',
		height: mobile ? '44px' : 'auto',
		minHeight: '44px',
		borderRadius: '8px',
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
		color: 'var(--text)',
		fontSize: mobile ? '0.82rem' : '0.85rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
		transition: 'all 0.2s ease',
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0,
	};

	return (
		<div style={{
			margin: '1.75em 0',
			padding: mobile ? '0.85rem' : '1.5rem',
			borderRadius: '12px',
			border: '1px solid var(--border)',
			background: 'var(--bg-card)',
		}}>
			<div style={{
				fontSize: '0.85rem',
				fontWeight: 700,
				color: 'var(--accent-light)',
				textTransform: 'uppercase' as const,
				letterSpacing: '0.04em',
				marginBottom: '0.5rem',
			}}>
				🤖 Agent Swarm — симулятор
			</div>
			<div style={{ fontSize: mobile ? '0.84rem' : '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
				Каждая ячейка — субагент. Сравни рой vs последовательный режим.
			</div>

			{/* Mode toggle */}
			<div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' as const }}>
				{(['parallel', 'sequential'] as const).map(m => (
					<button
						key={m}
						onClick={() => { setMode(m); reset(); }}
						style={{
							...btnBase,
							border: `1px solid ${mode === m ? 'var(--accent)' : 'var(--border)'}`,
							background: mode === m ? 'var(--accent-glow)' : 'var(--bg-secondary)',
							color: mode === m ? 'var(--accent-light)' : 'var(--text-muted)',
						}}
					>
						{m === 'parallel' ? '⚡ Рой (параллельно)' : '🐌 По очереди'}
					</button>
				))}
			</div>

			{/* Grid — overflow: hidden prevents spill on very narrow viewports */}
			<div style={{ overflowX: 'auto', marginBottom: '1rem', WebkitOverflowScrolling: 'touch' as unknown as undefined }}>
				<div style={{
					display: 'grid',
					gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
					gap: `${gap}px`,
					width: 'fit-content',
					minWidth: '100%',
				}}>
					{agents.map((state, i) => (
						<div
							key={i}
							style={{
								width: cellSize,
								height: cellSize,
								borderRadius: '4px',
								border: `1px solid ${BORDER[state]}`,
								background: COLOR[state],
								transition: 'all 0.2s ease',
								boxShadow: state === 'working' ? '0 0 6px #f59e0b66' : state === 'done' ? '0 0 4px #10b98144' : 'none',
								flexShrink: 0,
							}}
						/>
					))}
				</div>
			</div>

			{/* Stats */}
			<div style={{
				display: 'grid',
				gridTemplateColumns: 'repeat(4, 1fr)',
				gap: mobile ? '0.5rem' : '0.75rem',
				marginBottom: '1rem',
			}}>
				{[
					{ label: 'Работают', val: workingCount, color: '#f59e0b' },
					{ label: 'Готово', val: doneCount, color: '#10b981' },
					{ label: 'Ожидают', val: idleCount, color: 'var(--text-muted)' },
					{
						label: 'Ускорение',
						val: speed ?? '—',
						color: speed ? 'var(--accent-light)' : 'var(--text-muted)',
						gradient: !!speed,
					},
				].map(s => (
					<div key={s.label} style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.1rem' }}>
						<span style={{
							fontSize: mobile ? '1.05rem' : '1.4rem',
							fontWeight: 900,
							color: s.color,
							...(('gradient' in s && s.gradient) ? {
								background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent',
								backgroundClip: 'text',
							} : {}),
						}}>
							{s.val}
						</span>
						<span style={{
							fontSize: mobile ? '0.65rem' : '0.7rem',
							color: 'var(--text-muted)',
							textTransform: 'uppercase' as const,
							letterSpacing: '0.04em',
							fontWeight: 600,
							lineHeight: 1.2,
						}}>
							{s.label}
						</span>
					</div>
				))}
			</div>

			{/* Action buttons */}
			<div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as const }}>
				<button
					onClick={run}
					disabled={running}
					style={{
						...btnBase,
						background: running ? 'var(--bg-secondary)' : 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
						color: running ? 'var(--text-muted)' : 'white',
						border: '1px solid transparent',
						cursor: running ? 'not-allowed' : 'pointer',
						flex: mobile ? '1 1 auto' : 'none',
					}}
				>
					{running ? '⏳ Выполняется...' : '▶ Запустить задачу'}
				</button>
				<button
					onClick={reset}
					style={{
						...btnBase,
						flex: mobile ? '0 0 auto' : 'none',
					}}
				>
					🔄 Сброс
				</button>
			</div>
		</div>
	);
}
