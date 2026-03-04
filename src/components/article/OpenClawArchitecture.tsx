import { useState, useEffect, useRef } from 'react';

const LAYERS = [
	{
		id: 'interfaces',
		label: 'Интерфейсы',
		color: '#3b82f6',
		items: ['WhatsApp', 'Telegram', 'Discord', 'iMessage', 'Slack'],
		detail: 'Мессенджеры, которые пользователь уже использует. Нулевой барьер входа — агент встроен туда, где вы уже есть.',
	},
	{
		id: 'gateway',
		label: 'Gateway',
		color: '#8b5cf6',
		items: ['Маршрутизация сообщений', 'Единая точка входа'],
		detail: 'Принимает сообщения из любого мессенджера и маршрутизирует их к Agent Runtime. Абстрагирует протоколы.',
	},
	{
		id: 'runtime',
		label: 'Agent Runtime',
		color: '#ff6b2b',
		items: ['ReAct Loop', 'Heartbeat', 'LLM API (Claude / GPT-4o)'],
		detail: 'Долгоживущий процесс с циклом Reason → Act → Observe. Heartbeat поддерживает активность. Подключается к любому LLM.',
	},
	{
		id: 'memory',
		label: 'Memory',
		color: '#f59e0b',
		items: ['Файловая система', 'Контекст сессии'],
		detail: 'Сериализованная файловая память — простая, но эффективная. Данные не покидают устройство пользователя.',
	},
	{
		id: 'tools',
		label: 'Skills / Tools',
		color: '#10b981',
		items: ['Email', 'Calendar', 'Browser', 'Smart Home', 'Custom Plugin'],
		detail: 'Плагины, регистрируемые через единый интерфейс в несколько строк TypeScript. Любой разработчик может создать интеграцию за выходные.',
	},
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

export default function OpenClawArchitecture() {
	const [activeLayer, setActiveLayer] = useState<number | null>(null);
	const [visible, setVisible] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const mobile = useIsMobile();

	useEffect(() => {
		const obs = new IntersectionObserver(
			([e]) => { if (e.isIntersecting) setVisible(true); },
			{ threshold: 0.15 },
		);
		if (ref.current) obs.observe(ref.current);
		return () => obs.disconnect();
	}, []);

	return (
		<div
			ref={ref}
			style={{
				margin: '1.75em 0',
				padding: mobile ? '0.85rem' : '1.5rem',
				borderRadius: '12px',
				border: '1px solid var(--border)',
				background: 'var(--bg-card)',
			}}
		>
			<div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
				🏗️ Архитектура OpenClaw
			</div>
			<div style={{ fontSize: mobile ? '0.78rem' : '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
				От мессенджера до действия. Нажми на слой, чтобы увидеть детали
			</div>

			{/* Architecture flow */}
			<div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.5rem' }}>
				{LAYERS.map((layer, i) => {
					const isActive = activeLayer === i;
					return (
						<div key={layer.id}>
							<div
								onClick={() => setActiveLayer(isActive ? null : i)}
								style={{
									padding: mobile ? '0.75rem' : '1rem',
									borderRadius: '10px',
									border: `1.5px solid ${isActive ? layer.color : 'var(--border)'}`,
									background: isActive ? `${layer.color}0a` : 'transparent',
									cursor: 'pointer',
									WebkitTapHighlightColor: 'transparent',
									touchAction: 'manipulation',
									transition: 'all 0.2s ease',
									opacity: visible ? 1 : 0,
									transform: visible ? 'translateX(0)' : 'translateX(-15px)',
									transitionDelay: `${i * 0.08}s`,
								} as React.CSSProperties}
							>
								<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
									<div style={{
										width: '10px', height: '10px', borderRadius: '50%',
										background: layer.color, flexShrink: 0,
									}} />
									<span style={{
										fontWeight: 700,
										fontSize: mobile ? '0.88rem' : '0.95rem',
										color: isActive ? layer.color : 'var(--text)',
									}}>
										{layer.label}
									</span>
									<span style={{
										marginLeft: 'auto',
										fontSize: '0.7rem',
										color: 'var(--text-muted)',
										transform: isActive ? 'rotate(180deg)' : 'rotate(0)',
										transition: 'transform 0.2s ease',
									}}>
										▼
									</span>
								</div>

								{/* Items as pills */}
								<div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '0.35rem', paddingLeft: mobile ? '0' : '1.75rem' }}>
									{layer.items.map((item, j) => (
										<span
											key={j}
											style={{
												padding: '0.2rem 0.55rem',
												borderRadius: '5px',
												fontSize: mobile ? '0.7rem' : '0.75rem',
												fontWeight: 500,
												background: `${layer.color}12`,
												color: layer.color,
												border: `1px solid ${layer.color}25`,
											}}
										>
											{item}
										</span>
									))}
								</div>

								{/* Detail */}
								{isActive && (
									<div style={{
										marginTop: '0.75rem',
										paddingTop: '0.75rem',
										borderTop: `1px solid ${layer.color}20`,
										fontSize: mobile ? '0.82rem' : '0.88rem',
										color: 'var(--text-secondary)',
										lineHeight: 1.6,
										paddingLeft: mobile ? '0' : '1.75rem',
									}}>
										{layer.detail}
									</div>
								)}
							</div>

							{/* Arrow between layers */}
							{i < LAYERS.length - 1 && (
								<div style={{
									textAlign: 'center',
									color: 'var(--text-muted)',
									fontSize: '0.8rem',
									padding: '0.15rem 0',
									opacity: 0.5,
								}}>
									↓
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
