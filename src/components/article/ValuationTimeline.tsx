import { useState, useEffect, useRef } from 'react';

const MILESTONES = [
	{
		date: '5 янв 2026',
		label: 'Series C',
		amount: '$4.3B',
		detail: 'Привлекли $500M — оценка компании достигла $4.3 миллиарда',
		color: '#3b82f6',
		icon: '💰',
	},
	{
		date: '19 янв 2026',
		label: 'Новый раунд',
		amount: '$4.8B',
		detail: 'Следующий раунд поднял оценку до $4.8 миллиарда — ещё через две недели',
		color: '#8b5cf6',
		icon: '📈',
	},
	{
		date: '27 янв 2026',
		label: 'Kimi K2.5 — релиз',
		amount: '1T параметров',
		detail: 'Выход Kimi K2.5: 1 триллион параметров, 32B активных, 256K контекст, Agent Swarm до 100 субагентов',
		color: '#f59e0b',
		icon: '🤖',
	},
	{
		date: '15 фев 2026',
		label: 'KimiClaw запущен',
		amount: '100K ⭐ / нед.',
		detail: 'OpenClaw собрал 100K звёзд на GitHub за неделю и 2M посетителей. KimiClaw — его облачная версия в один клик',
		color: '#10b981',
		icon: '⚡',
	},
	{
		date: '24 фев 2026',
		label: 'Декакорн',
		amount: '$10B 🏆',
		detail: 'Самый быстрый декакорн в истории Китая — обогнали ByteDance и Pinduoduo. За 20 дней — больше выручки, чем за весь 2025 год',
		color: '#ff6b2b',
		icon: '🔥',
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

export default function ValuationTimeline() {
	const [visible, setVisible] = useState(false);
	const [active, setActive] = useState<number | null>(null);
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
			<div style={{
				fontSize: '0.85rem',
				fontWeight: 700,
				color: 'var(--accent-light)',
				textTransform: 'uppercase' as const,
				letterSpacing: '0.04em',
				marginBottom: '0.5rem',
			}}>
				🚀 Взлёт Moonshot AI
			</div>
			<div style={{ fontSize: mobile ? '0.84rem' : '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
				От стартапа до $10B декакорна — за 50 дней. Нажми на событие для деталей.
			</div>

			<div style={{ position: 'relative', paddingLeft: mobile ? '1.5rem' : '2rem' }}>
				{/* Vertical connector line */}
				<div style={{
					position: 'absolute',
					left: mobile ? '0.3rem' : '0.55rem',
					top: '0.7rem',
					bottom: '0.7rem',
					width: '2px',
					background: 'linear-gradient(to bottom, #3b82f6, #8b5cf6, #f59e0b, #10b981, #ff6b2b)',
					opacity: visible ? 1 : 0,
					transition: 'opacity 0.6s ease 0.2s',
				}} />

				{MILESTONES.map((m, i) => (
					<div
						key={i}
						style={{
							position: 'relative',
							marginBottom: i < MILESTONES.length - 1 ? '0.75rem' : 0,
							opacity: visible ? 1 : 0,
							transform: visible ? 'translateX(0)' : 'translateX(-16px)',
							transition: `opacity 0.4s ease ${i * 0.1}s, transform 0.4s ease ${i * 0.1}s`,
							cursor: 'pointer',
							WebkitTapHighlightColor: 'transparent',
							touchAction: 'manipulation',
						} as React.CSSProperties}
						onClick={() => setActive(active === i ? null : i)}
					>
						{/* Dot */}
						<div style={{
							position: 'absolute',
							left: mobile ? '-1.18rem' : '-1.65rem',
							top: '0.9rem',
							width: mobile ? '11px' : '14px',
							height: mobile ? '11px' : '14px',
							borderRadius: '50%',
							background: m.color,
							border: '2px solid var(--bg-card)',
							boxShadow: `0 0 8px ${m.color}88`,
							zIndex: 1,
							transition: 'transform 0.2s ease',
							transform: active === i ? 'scale(1.4)' : 'scale(1)',
							flexShrink: 0,
						}} />

						<div style={{
							padding: mobile ? '0.6rem 0.7rem' : '0.75rem 1rem',
							borderRadius: '10px',
							border: `1px solid ${active === i ? m.color + '66' : 'var(--border)'}`,
							background: active === i
								? `color-mix(in srgb, ${m.color} 8%, var(--bg-secondary))`
								: 'var(--bg-secondary)',
							transition: 'all 0.2s ease',
						}}>
							{/* Header row — date + label + amount */}
							<div style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'flex-start',
								gap: '0.5rem',
							}}>
								<div style={{ minWidth: 0, flex: 1 }}>
									<div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.1rem', whiteSpace: 'nowrap' as const }}>{m.date}</div>
									<div style={{
										fontSize: mobile ? '0.85rem' : '0.95rem',
										fontWeight: 700,
										color: 'var(--text)',
										lineHeight: 1.3,
									}}>
										{m.icon} {m.label}
									</div>
								</div>
								<div style={{
									fontSize: mobile ? '0.82rem' : '0.95rem',
									fontWeight: 900,
									color: m.color,
									whiteSpace: 'nowrap' as const,
									flexShrink: 0,
									textAlign: 'right' as const,
									lineHeight: 1.3,
									paddingTop: '0.15rem',
								}}>
									{m.amount}
								</div>
							</div>

							{/* Expanded detail */}
							{active === i && (
								<div style={{
									marginTop: '0.5rem',
									fontSize: mobile ? '0.8rem' : '0.82rem',
									color: 'var(--text-muted)',
									borderTop: `1px solid ${m.color}33`,
									paddingTop: '0.5rem',
									lineHeight: 1.6,
								}}>
									{m.detail}
								</div>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
