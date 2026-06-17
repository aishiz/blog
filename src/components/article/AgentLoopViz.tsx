import { useState, useEffect, useRef } from 'react';

// ponytail: canned debugging run — the point is to show the LOOP, not run a real agent.
type Phase = 'think' | 'call' | 'exec' | 'observe';

interface Step {
	iter: number;
	phase: Phase;
	text: string;
}

const STEPS: Step[] = [
	{ iter: 1, phase: 'think', text: 'Юзер просит починить баг. Сначала надо посмотреть, что в логах.' },
	{ iter: 1, phase: 'call', text: 'read_file("app.log")' },
	{ iter: 1, phase: 'exec', text: 'Харнес открывает файл, читает 200 строк, режет до последних 30.' },
	{ iter: 1, phase: 'observe', text: 'NullPointerException на строке 42, метод get_user().' },
	{ iter: 2, phase: 'think', text: 'Ясно — нет проверки на None перед обращением. Фикшу.' },
	{ iter: 2, phase: 'call', text: 'edit_file("user.py", patch=…)' },
	{ iter: 2, phase: 'exec', text: 'Харнес применяет патч, проверяет что файл валидный.' },
	{ iter: 2, phase: 'observe', text: 'Файл изменён, 1 строка добавлена.' },
	{ iter: 3, phase: 'think', text: 'Проверю, что не сломал остальное — гоняю тесты.' },
	{ iter: 3, phase: 'call', text: 'run("pytest -q")' },
	{ iter: 3, phase: 'exec', text: 'Харнес запускает в песочнице, ловит stdout и код выхода.' },
	{ iter: 3, phase: 'observe', text: '12 passed in 1.4s. Готово 🫡' },
];

const PHASES: { key: Phase; icon: string; label: string; color: string; who: string }[] = [
	{ key: 'think', icon: '🧠', label: 'Думает', color: '#8b5cf6', who: 'LLM' },
	{ key: 'call', icon: '🔧', label: 'Вызов tool', color: '#3b82f6', who: 'LLM' },
	{ key: 'exec', icon: '⚙️', label: 'Исполняет', color: '#ff6b2b', who: 'ХАРНЕС' },
	{ key: 'observe', icon: '👁️', label: 'Наблюдает', color: '#10b981', who: 'ХАРНЕС' },
];

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

export default function AgentLoopViz() {
	const [step, setStep] = useState(0);
	const [running, setRunning] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const mobile = useIsMobile();

	const cur = STEPS[step];
	const done = step >= STEPS.length - 1;

	useEffect(() => {
		if (!running) return;
		if (done) {
			setRunning(false);
			return;
		}
		timerRef.current = setTimeout(() => setStep((s) => s + 1), 1100);
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, [running, step, done]);

	const reset = () => {
		setRunning(false);
		setStep(0);
		if (timerRef.current) clearTimeout(timerRef.current);
	};

	return (
		<div
			style={{
				margin: '1.75em 0',
				padding: mobile ? '0.85rem' : '1.5rem',
				borderRadius: '12px',
				border: '1px solid var(--border)',
				background: 'var(--bg-card)',
			}}
		>
			<div
				style={{
					fontSize: '0.85rem',
					fontWeight: 700,
					color: 'var(--accent-light)',
					textTransform: 'uppercase' as const,
					letterSpacing: '0.04em',
					marginBottom: '0.35rem',
				}}
			>
				🔁 Цикл агента: think → act → observe
			</div>
			<div style={{ fontSize: mobile ? '0.78rem' : '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
				LLM думает и просит инструмент. <strong style={{ color: '#ff6b2b' }}>Харнес</strong> исполняет и кладёт результат обратно в контекст. Повторяем, пока не готово.
			</div>

			{/* Loop ring */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					gap: mobile ? '0.25rem' : '0.5rem',
					flexWrap: 'wrap' as const,
					marginBottom: '1.1rem',
				}}
			>
				{PHASES.map((p, i) => {
					const active = cur.phase === p.key;
					return (
						<div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: mobile ? '0.25rem' : '0.5rem' }}>
							<div
								style={{
									display: 'flex',
									flexDirection: 'column' as const,
									alignItems: 'center',
									gap: '0.25rem',
									padding: mobile ? '0.5rem 0.4rem' : '0.7rem 0.9rem',
									borderRadius: '10px',
									border: `1.5px solid ${active ? p.color : 'var(--border)'}`,
									background: active ? `${p.color}14` : 'transparent',
									transition: 'all 0.3s ease',
									minWidth: mobile ? '58px' : '76px',
								}}
							>
								<span style={{ fontSize: mobile ? '1.1rem' : '1.4rem', opacity: active ? 1 : 0.4 }}>{p.icon}</span>
								<span style={{ fontSize: mobile ? '0.6rem' : '0.68rem', fontWeight: 700, color: active ? p.color : 'var(--text-muted)' }}>{p.label}</span>
								<span style={{ fontSize: '0.55rem', fontWeight: 700, color: active ? p.color : 'var(--text-muted)', opacity: 0.7, letterSpacing: '0.03em' }}>{p.who}</span>
							</div>
							{i < PHASES.length - 1 && (
								<span style={{ color: active ? p.color : 'var(--border-light)', fontSize: mobile ? '0.7rem' : '1rem', transition: 'color 0.3s ease' }}>→</span>
							)}
						</div>
					);
				})}
				<span style={{ color: 'var(--text-muted)', fontSize: mobile ? '0.7rem' : '0.9rem', marginLeft: mobile ? 0 : '0.25rem' }}>↩︎</span>
			</div>

			<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' as const }}>
				<button
					onClick={running ? reset : done ? reset : () => setRunning(true)}
					style={{
						padding: mobile ? '0.5rem 1.1rem' : '0.55rem 1.4rem',
						borderRadius: '8px',
						border: 'none',
						background: running ? '#ef4444' : 'linear-gradient(135deg, #ff6b2b, #f97316)',
						color: 'white',
						fontSize: mobile ? '0.82rem' : '0.88rem',
						fontWeight: 700,
						cursor: 'pointer',
						WebkitTapHighlightColor: 'transparent',
					}}
				>
					{running ? '⏹ Стоп' : done ? '↻ Заново' : '▶ Запустить цикл'}
				</button>
				<span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
					Итерация {cur.iter} из 3
				</span>
			</div>

			{/* Context tape — grows as the loop runs */}
			<div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
				📜 Контекст накапливается:
			</div>
			<div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.4rem' }}>
				{STEPS.slice(0, step + 1).map((s, i) => {
					const ph = PHASES.find((p) => p.key === s.phase)!;
					const isCur = i === step;
					return (
						<div
							key={i}
							style={{
								display: 'flex',
								alignItems: 'flex-start',
								gap: '0.6rem',
								padding: mobile ? '0.5rem 0.6rem' : '0.6rem 0.85rem',
								borderRadius: '8px',
								border: `1px solid ${isCur ? ph.color + '55' : 'var(--border)'}`,
								background: isCur ? `${ph.color}0a` : 'transparent',
								transition: 'all 0.3s ease',
							}}
						>
							<span style={{ fontSize: mobile ? '0.9rem' : '1rem', flexShrink: 0 }}>{ph.icon}</span>
							<div style={{ flex: 1, minWidth: 0 }}>
								<span style={{ fontSize: '0.6rem', fontWeight: 700, color: ph.color, textTransform: 'uppercase' as const, letterSpacing: '0.03em', marginRight: '0.4rem' }}>{ph.label}</span>
								<span
									style={{
										fontSize: mobile ? '0.8rem' : '0.86rem',
										color: 'var(--text)',
										lineHeight: 1.5,
										fontFamily: s.phase === 'call' ? "'JetBrains Mono', monospace" : 'inherit',
									}}
								>
									{s.text}
								</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
