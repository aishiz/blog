import { useState, useEffect, useRef } from 'react';

const SCENARIOS = [
	{
		name: '📧 Автоответ на почту',
		steps: [
			{ phase: 'input', icon: '💬', text: '«Ответь на рабочие письма, пока я сплю»', from: 'WhatsApp' },
			{ phase: 'reason', icon: '🧠', text: 'Анализ: 12 непрочитанных писем. 3 срочных, 5 стандартных, 4 спам.' },
			{ phase: 'act', icon: '⚡', text: 'Отправляю ответы на 3 срочных. Архивирую спам. Помечаю 5 стандартных.' },
			{ phase: 'observe', icon: '👁️', text: 'Все 3 срочных ответа доставлены. 4 спама в архиве. 5 ждут утра.' },
			{ phase: 'result', icon: '✅', text: '«Готово! 3 срочных ответа отправлены, 4 спама убраны. Отчёт в чате.»' },
		],
	},
	{
		name: '🚕 Заказ такси',
		steps: [
			{ phase: 'input', icon: '💬', text: '«Закажи такси в аэропорт на 6 утра»', from: 'Telegram' },
			{ phase: 'reason', icon: '🧠', text: 'Рейс в 9:00. Аэропорт в 45 мин езды. Нужен запас. Оптимально — 6:00.' },
			{ phase: 'act', icon: '⚡', text: 'Бронирую такси через API. Комфорт-класс. Адрес из контактов.' },
			{ phase: 'observe', icon: '👁️', text: 'Бронь подтверждена. Водитель назначен. Стоимость: 1 200₽.' },
			{ phase: 'result', icon: '✅', text: '«Такси забронировано на 6:00. Комфорт, 1 200₽. Напомню в 5:30.»' },
		],
	},
	{
		name: '🏠 Умный дом',
		steps: [
			{ phase: 'input', icon: '💬', text: '«Я уезжаю на неделю — подготовь дом»', from: 'iMessage' },
			{ phase: 'reason', icon: '🧠', text: 'Режим отъезда: термостат 16°, свет по таймеру, камеры — запись.' },
			{ phase: 'act', icon: '⚡', text: 'Термостат → 16°. Свет → рандомный таймер. Камеры → запись 24/7.' },
			{ phase: 'observe', icon: '👁️', text: 'Все 3 системы подтвердили переключение. Энергия: -40% от нормы.' },
			{ phase: 'result', icon: '✅', text: '«Дом в режиме отъезда. Экономия ~40% энергии. Камеры пишут.»' },
		],
	},
];

const PHASE_COLORS: Record<string, string> = {
	input: '#3b82f6',
	reason: '#8b5cf6',
	act: '#ff6b2b',
	observe: '#f59e0b',
	result: '#10b981',
};

const PHASE_LABELS: Record<string, string> = {
	input: 'Запрос',
	reason: 'Reason',
	act: 'Act',
	observe: 'Observe',
	result: 'Результат',
};

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

export default function AgentSimulator() {
	const [scenario, setScenario] = useState(0);
	const [step, setStep] = useState(0);
	const [running, setRunning] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const mobile = useIsMobile();

	const sc = SCENARIOS[scenario];

	const run = () => {
		setStep(0);
		setRunning(true);
	};

	useEffect(() => {
		if (!running) return;
		if (step >= sc.steps.length - 1) {
			setRunning(false);
			return;
		}
		timerRef.current = setTimeout(() => setStep(s => s + 1), 1200);
		return () => { if (timerRef.current) clearTimeout(timerRef.current); };
	}, [running, step, sc.steps.length]);

	const reset = () => {
		setRunning(false);
		setStep(0);
		if (timerRef.current) clearTimeout(timerRef.current);
	};

	return (
		<div style={{
			margin: '1.75em 0', padding: mobile ? '0.85rem' : '1.5rem',
			borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)',
		}}>
			<div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
				🤖 Симулятор ReAct-цикла OpenClaw
			</div>
			<div style={{ fontSize: mobile ? '0.78rem' : '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
				Выбери сценарий и нажми «Запустить» — смотри, как агент думает и действует
			</div>

			{/* Scenario tabs */}
			<div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '0.4rem', marginBottom: '1rem' }}>
				{SCENARIOS.map((s, i) => (
					<button
						key={i}
						onClick={() => { setScenario(i); reset(); }}
						style={{
							padding: mobile ? '0.35rem 0.65rem' : '0.4rem 0.85rem',
							borderRadius: '7px',
							border: `1.5px solid ${scenario === i ? '#ff6b2b' : 'var(--border)'}`,
							background: scenario === i ? '#ff6b2b15' : 'transparent',
							color: scenario === i ? '#ff6b2b' : 'var(--text-muted)',
							fontSize: mobile ? '0.72rem' : '0.8rem',
							fontWeight: scenario === i ? 700 : 500,
							cursor: 'pointer',
							WebkitTapHighlightColor: 'transparent',
							transition: 'all 0.2s ease',
						}}
					>
						{s.name}
					</button>
				))}
			</div>

			{/* Run button */}
			<button
				onClick={running ? reset : run}
				style={{
					padding: mobile ? '0.5rem 1.2rem' : '0.55rem 1.5rem',
					borderRadius: '8px',
					border: 'none',
					background: running ? '#ef4444' : 'linear-gradient(135deg, #ff6b2b, #f97316)',
					color: 'white',
					fontSize: mobile ? '0.82rem' : '0.88rem',
					fontWeight: 700,
					cursor: 'pointer',
					marginBottom: '1.25rem',
					WebkitTapHighlightColor: 'transparent',
					transition: 'transform 0.1s ease',
				}}
			>
				{running ? '⏹ Стоп' : '▶ Запустить агента'}
			</button>

			{/* Phase progress bar */}
			<div style={{ display: 'flex', gap: '3px', marginBottom: '1rem' }}>
				{sc.steps.map((s, i) => (
					<div key={i} style={{
						flex: 1, height: '4px', borderRadius: '2px',
						background: i <= step ? PHASE_COLORS[s.phase] : 'var(--border)',
						transition: 'background 0.3s ease',
					}} />
				))}
			</div>

			{/* Steps */}
			<div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.5rem' }}>
				{sc.steps.map((s, i) => {
					const visible = i <= step;
					const current = i === step;
					const color = PHASE_COLORS[s.phase];
					return (
						<div
							key={i}
							style={{
								padding: mobile ? '0.65rem 0.75rem' : '0.75rem 1rem',
								borderRadius: '8px',
								border: `1px solid ${current ? color + '50' : visible ? 'var(--border)' : 'var(--border)'}`,
								background: current ? `${color}0a` : 'transparent',
								opacity: visible ? 1 : 0.25,
								transform: visible ? 'translateX(0)' : 'translateX(8px)',
								transition: 'all 0.4s ease',
								display: 'flex',
								alignItems: 'flex-start',
								gap: '0.65rem',
							}}
						>
							<div style={{
								flexShrink: 0,
								width: mobile ? '28px' : '32px',
								height: mobile ? '28px' : '32px',
								borderRadius: '50%',
								background: visible ? `${color}18` : 'var(--bg-secondary)',
								border: `1.5px solid ${visible ? color : 'var(--border)'}`,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: mobile ? '0.85rem' : '0.95rem',
								transition: 'all 0.3s ease',
							}}>
								{s.icon}
							</div>
							<div style={{ flex: 1, minWidth: 0 }}>
								<div style={{
									fontSize: '0.68rem', fontWeight: 700, color: visible ? color : 'var(--text-muted)',
									textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.15rem',
								}}>
									{PHASE_LABELS[s.phase]}
									{s.phase === 'input' && ` (${(s as { from?: string }).from})`}
								</div>
								<div style={{
									fontSize: mobile ? '0.82rem' : '0.88rem',
									color: visible ? 'var(--text)' : 'var(--text-muted)',
									lineHeight: 1.5,
								}}>
									{s.text}
								</div>
							</div>
							{current && running && (
								<div style={{
									width: '6px', height: '6px', borderRadius: '50%',
									background: color, flexShrink: 0, marginTop: '0.6rem',
									animation: 'pulse 1s infinite',
								}} />
							)}
						</div>
					);
				})}
			</div>

			<style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
		</div>
	);
}
