import { useState, useEffect, useRef } from 'react';

const EVENTS = [
	{
		date: 'Янв 10',
		title: 'Публикация Clawdbot',
		stars: '0 → 10K за 48 ч',
		detail: 'Пётр Штайнбергер публикует личный WhatsApp-хак на GitHub. Никакого маркетинга — только пост в соцсетях.',
		color: '#3b82f6',
		icon: '🚀',
	},
	{
		date: 'Янв 27',
		title: 'Претензия Anthropic',
		stars: '~40K',
		detail: 'Anthropic направляет претензию по товарному знаку. Ребрендинг в Moltbot. История разлетается по tech-медиа.',
		color: '#ef4444',
		icon: '⚡',
	},
	{
		date: 'Янв 30',
		title: 'Ребрендинг в OpenClaw',
		stars: '100K ⭐',
		detail: 'Второй ребрендинг за 72 часа. Волна мошеннических клонов. Проект преодолевает 100K звёзд.',
		color: '#ff6b2b',
		icon: '🔥',
	},
	{
		date: 'Фев 2',
		title: 'Forbes, WIRED, Guardian',
		stars: '130K ⭐',
		detail: 'Публикации в крупнейших мировых изданиях. Проект выходит за пределы технического сообщества.',
		color: '#10b981',
		icon: '📰',
	},
	{
		date: 'Фев 5',
		title: 'Рост продаж Mac mini',
		stars: '150K ⭐',
		detail: 'Пользователи покупают Mac mini специально для круглосуточной работы OpenClaw как персонального AI-сервера.',
		color: '#10b981',
		icon: '💻',
	},
	{
		date: 'Фев 15',
		title: 'Штайнбергер → OpenAI',
		stars: '196K ⭐',
		detail: 'Сэм Альтман объявляет о найме. Институциональная валидация проекта крупнейшей AI-компанией мира.',
		color: '#ff6b2b',
		icon: '🤝',
	},
	{
		date: 'Фев 24',
		title: 'Обгоняет Linux kernel',
		stars: '210K ⭐',
		detail: 'OpenClaw обгоняет Linux kernel (218K звёзд) — один из старейших и крупнейших проектов на GitHub.',
		color: '#10b981',
		icon: '🏆',
	},
	{
		date: 'Мар 1',
		title: '#1 на GitHub',
		stars: '250K+ ⭐',
		detail: 'OpenClaw обгоняет React и становится самым звёздным программным проектом в истории GitHub.',
		color: '#ff6b2b',
		icon: '👑',
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

export default function OpenClawTimeline() {
	const [active, setActive] = useState<number | null>(null);
	const [visible, setVisible] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const mobile = useIsMobile();

	useEffect(() => {
		const obs = new IntersectionObserver(
			([e]) => { if (e.isIntersecting) setVisible(true); },
			{ threshold: 0.1 },
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
				📅 Хронология феномена
			</div>
			<div style={{ fontSize: mobile ? '0.78rem' : '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
				Январь – март 2026. Нажми на событие для подробностей
			</div>

			<div style={{ position: 'relative' as const, paddingLeft: mobile ? '1.5rem' : '2rem' }}>
				{/* Vertical line */}
				<div style={{
					position: 'absolute' as const,
					left: mobile ? '0.55rem' : '0.75rem',
					top: 0,
					bottom: 0,
					width: '2px',
					background: 'var(--border)',
				}} />

				{EVENTS.map((event, i) => {
					const isActive = active === i;
					return (
						<div
							key={i}
							onClick={() => setActive(isActive ? null : i)}
							style={{
								position: 'relative' as const,
								marginBottom: i < EVENTS.length - 1 ? '0.75rem' : 0,
								cursor: 'pointer',
								WebkitTapHighlightColor: 'transparent',
								touchAction: 'manipulation',
								opacity: visible ? 1 : 0,
								transform: visible ? 'translateX(0)' : 'translateX(-10px)',
								transition: `opacity 0.4s ease ${i * 0.06}s, transform 0.4s ease ${i * 0.06}s`,
							} as React.CSSProperties}
						>
							{/* Dot on timeline */}
							<div style={{
								position: 'absolute' as const,
								left: mobile ? '-1.25rem' : '-1.55rem',
								top: '0.6rem',
								width: mobile ? '12px' : '14px',
								height: mobile ? '12px' : '14px',
								borderRadius: '50%',
								background: isActive ? event.color : 'var(--bg-secondary)',
								border: `2px solid ${event.color}`,
								transition: 'background 0.2s ease',
								zIndex: 1,
							}} />

							<div style={{
								padding: mobile ? '0.65rem 0.75rem' : '0.75rem 1rem',
								borderRadius: '8px',
								border: `1px solid ${isActive ? event.color + '40' : 'var(--border)'}`,
								background: isActive ? `${event.color}08` : 'transparent',
								transition: 'all 0.2s ease',
							}}>
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
									<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
										<span style={{ fontSize: mobile ? '0.9rem' : '1rem' }}>{event.icon}</span>
										<div>
											<div style={{ fontWeight: 700, fontSize: mobile ? '0.82rem' : '0.88rem', color: 'var(--text)' }}>
												{event.title}
											</div>
											<div style={{ fontSize: mobile ? '0.7rem' : '0.75rem', color: 'var(--text-muted)' }}>
												{event.date}
											</div>
										</div>
									</div>
									<span style={{
										fontSize: mobile ? '0.75rem' : '0.82rem',
										fontWeight: 700,
										color: event.color,
										flexShrink: 0,
									}}>
										{event.stars}
									</span>
								</div>

								{isActive && (
									<div style={{
										marginTop: '0.6rem',
										paddingTop: '0.6rem',
										borderTop: `1px solid ${event.color}20`,
										fontSize: mobile ? '0.8rem' : '0.85rem',
										color: 'var(--text-secondary)',
										lineHeight: 1.6,
									}}>
										{event.detail}
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
