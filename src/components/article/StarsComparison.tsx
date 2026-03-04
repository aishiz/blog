import { useState, useEffect, useRef } from 'react';

const PROJECTS = [
	{ name: 'OpenClaw (2026)', stars: 250, color: '#ff6b2b', highlight: true },
	{ name: 'React (Meta)', stars: 228, color: '#4ade80' },
	{ name: 'Linux Kernel', stars: 218, color: '#c4b5fd' },
	{ name: 'LangChain', stars: 97, color: '#60a5fa' },
	{ name: 'AutoGen', stars: 40, color: '#60a5fa' },
	{ name: 'CrewAI', stars: 28, color: '#60a5fa' },
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

export default function StarsComparison() {
	const [active, setActive] = useState<number | null>(null);
	const [visible, setVisible] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const mobile = useIsMobile();

	useEffect(() => {
		const obs = new IntersectionObserver(
			([e]) => { if (e.isIntersecting) setVisible(true); },
			{ threshold: 0.2 },
		);
		if (ref.current) obs.observe(ref.current);
		return () => obs.disconnect();
	}, []);

	const maxStars = 270;

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
				⭐ Сравнение GitHub Stars
			</div>
			<div style={{ fontSize: mobile ? '0.78rem' : '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
				OpenClaw vs. крупнейшие проекты GitHub (март 2026). Нажми на строку для деталей
			</div>

			{PROJECTS.map((p, i) => {
				const pct = (p.stars / maxStars) * 100;
				return (
					<div
						key={i}
						style={{
							marginBottom: i < PROJECTS.length - 1 ? '0.9rem' : 0,
							cursor: 'pointer',
							WebkitTapHighlightColor: 'transparent',
							touchAction: 'manipulation',
							minHeight: '44px',
							display: 'flex',
							flexDirection: 'column' as const,
							justifyContent: 'center',
						} as React.CSSProperties}
						onClick={() => setActive(active === i ? null : i)}
					>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
							<span style={{
								fontSize: mobile ? '0.82rem' : '0.88rem',
								fontWeight: p.highlight ? 800 : 600,
								color: p.highlight ? '#ff6b2b' : 'var(--text)',
								lineHeight: 1.3,
							}}>
								{p.name}
							</span>
							<span style={{
								fontSize: mobile ? '0.88rem' : '0.95rem',
								fontWeight: 900,
								color: p.color,
								fontVariantNumeric: 'tabular-nums',
								marginLeft: '0.75rem',
								flexShrink: 0,
							}}>
								{p.stars}K
							</span>
						</div>
						<div style={{
							height: mobile ? '10px' : '14px',
							borderRadius: '7px',
							background: 'var(--bg-secondary)',
							border: '1px solid var(--border)',
							overflow: 'hidden',
						}}>
							<div style={{
								height: '100%',
								borderRadius: '7px',
								background: p.highlight
									? `linear-gradient(90deg, ${p.color}, ${p.color}dd)`
									: `linear-gradient(90deg, ${p.color}cc, ${p.color}88)`,
								width: visible ? `${pct}%` : '0%',
								transition: `width ${0.5 + i * 0.12}s ease ${i * 0.08}s`,
							}} />
						</div>
						{active === i && (
							<div style={{
								marginTop: '0.4rem',
								fontSize: '0.8rem',
								color: 'var(--text-muted)',
								fontStyle: 'italic',
								display: 'flex',
								alignItems: 'flex-start',
								gap: '0.3rem',
								lineHeight: 1.4,
							}}>
								<span style={{ color: p.color, flexShrink: 0 }}>→</span>
								{p.highlight
									? 'Самый быстрорастущий проект в истории GitHub — от 0 до 250K за 4 месяца'
									: `${p.stars}K звёзд на GitHub`
								}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
