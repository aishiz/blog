import { useState, useEffect, useRef } from 'react';

const THREATS = [
	{
		title: 'Незащищённые экземпляры',
		stat: '100+',
		statLabel: 'случаев',
		detail: 'SOCPrime зафиксировала сотни незащищённых экземпляров OpenClaw, открытых в публичный интернет и утекающих API-ключи, приватные истории чатов и корпоративные учётные данные.',
		icon: '🔓',
		color: '#ef4444',
	},
	{
		title: 'Мошеннические клоны',
		stat: 'Сотни',
		statLabel: 'репозиториев',
		detail: 'Malwarebytes задокументировала волну тайпсквоттинговых доменов и клонированных GitHub-репозиториев. Supply chain атаки через обновления.',
		icon: '🕷️',
		color: '#f59e0b',
	},
	{
		title: 'Фейковый криптотокен',
		stat: '1',
		statLabel: 'инцидент (Clawdbot)',
		detail: 'Мошенники запустили фейковый криптотокен под старым именем Clawdbot, воспользовавшись путаницей с брендингом после двух ребрендингов.',
		icon: '💰',
		color: '#ff6b2b',
	},
	{
		title: 'Фишинг через агента',
		stat: 'WIRED',
		statLabel: 'репортаж',
		detail: 'WIRED описал случай, когда агент, получив доступ к электронной почте, начал отправлять фишинговые письма от имени пользователя.',
		icon: '🎣',
		color: '#a78bfa',
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

export default function ThreatMap() {
	const [active, setActive] = useState<number | null>(null);
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
			<div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
				⚠️ Тёмная сторона хайпа
			</div>
			<div style={{ fontSize: mobile ? '0.78rem' : '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
				Четыре типа угроз, зафиксированных в период хайпа OpenClaw
			</div>

			<div style={{
				display: 'grid',
				gridTemplateColumns: mobile ? '1fr' : '1fr 1fr',
				gap: '0.65rem',
			}}>
				{THREATS.map((threat, i) => {
					const isActive = active === i;
					return (
						<div
							key={i}
							onClick={() => setActive(isActive ? null : i)}
							style={{
								padding: mobile ? '0.85rem' : '1.15rem',
								borderRadius: '10px',
								border: `1.5px solid ${isActive ? threat.color : threat.color + '30'}`,
								background: isActive ? `${threat.color}0a` : 'transparent',
								cursor: 'pointer',
								WebkitTapHighlightColor: 'transparent',
								touchAction: 'manipulation',
								transition: 'all 0.2s ease',
								opacity: visible ? 1 : 0,
								transform: visible ? 'translateY(0)' : 'translateY(10px)',
								transitionDelay: `${i * 0.08}s`,
							} as React.CSSProperties}
						>
							<div style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>{threat.icon}</div>
							<div style={{
								fontWeight: 700,
								fontSize: mobile ? '0.85rem' : '0.92rem',
								color: 'var(--text)',
								marginBottom: '0.4rem',
							}}>
								{threat.title}
							</div>
							<div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: isActive ? '0.6rem' : 0 }}>
								<span style={{
									fontWeight: 900,
									fontSize: mobile ? '1.1rem' : '1.3rem',
									color: threat.color,
								}}>
									{threat.stat}
								</span>
								<span style={{
									fontSize: mobile ? '0.72rem' : '0.78rem',
									color: 'var(--text-muted)',
								}}>
									{threat.statLabel}
								</span>
							</div>

							{isActive && (
								<div style={{
									paddingTop: '0.6rem',
									borderTop: `1px solid ${threat.color}20`,
									fontSize: mobile ? '0.8rem' : '0.85rem',
									color: 'var(--text-secondary)',
									lineHeight: 1.6,
								}}>
									{threat.detail}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
