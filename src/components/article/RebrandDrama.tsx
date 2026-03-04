import { useState, useEffect, useRef } from 'react';

const BRANDS = [
	{
		name: 'Clawdbot',
		period: 'Январь 2026',
		reason: 'Оригинальное название — отсылка к Claude от Anthropic',
		result: 'Претензия Anthropic по товарному знаку',
		stars: '0 → 40K',
		color: '#3b82f6',
		emoji: '🦀',
	},
	{
		name: 'Moltbot',
		period: '27 января',
		reason: 'Отсылка к линьке (molt) у ракообразных',
		result: 'Продержалось всего 3 дня',
		stars: '~40K → 80K',
		color: '#a78bfa',
		emoji: '🐚',
	},
	{
		name: 'OpenClaw',
		period: '30 января →',
		reason: 'Финальное название — open-source + claw',
		result: 'Стал #1 на GitHub с 250K+ звёзд',
		stars: '80K → 250K+',
		color: '#ff6b2b',
		emoji: '🔥',
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

export default function RebrandDrama() {
	const [step, setStep] = useState(0);
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

	const brand = BRANDS[step];

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
				🔄 Три имени за 72 часа
			</div>
			<div style={{ fontSize: mobile ? '0.78rem' : '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
				Каждая смена имени расширяла аудиторию и привлекала новую волну медийного внимания
			</div>

			{/* Step navigation */}
			<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
				{BRANDS.map((b, i) => (
					<div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<button
							onClick={() => setStep(i)}
							style={{
								padding: mobile ? '0.4rem 0.7rem' : '0.5rem 1rem',
								borderRadius: '8px',
								border: `1.5px solid ${step === i ? b.color : 'var(--border)'}`,
								background: step === i ? `${b.color}15` : 'transparent',
								color: step === i ? b.color : 'var(--text-muted)',
								fontSize: mobile ? '0.75rem' : '0.85rem',
								fontWeight: step === i ? 700 : 500,
								cursor: 'pointer',
								transition: 'all 0.2s ease',
								WebkitTapHighlightColor: 'transparent',
								textDecoration: step > i ? 'line-through' : 'none',
								opacity: step > i ? 0.5 : 1,
							}}
						>
							{b.name}
						</button>
						{i < BRANDS.length - 1 && (
							<span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', opacity: 0.5 }}>→</span>
						)}
					</div>
				))}
			</div>

			{/* Active brand detail */}
			<div
				style={{
					padding: mobile ? '1rem' : '1.5rem',
					borderRadius: '10px',
					border: `1.5px solid ${brand.color}40`,
					background: `${brand.color}08`,
					opacity: visible ? 1 : 0,
					transform: visible ? 'translateY(0)' : 'translateY(10px)',
					transition: 'all 0.3s ease',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
					<span style={{ fontSize: mobile ? '2rem' : '2.5rem' }}>{brand.emoji}</span>
					<div>
						<div style={{
							fontWeight: 900,
							fontSize: mobile ? '1.2rem' : '1.4rem',
							color: brand.color,
						}}>
							{brand.name}
						</div>
						<div style={{ fontSize: mobile ? '0.78rem' : '0.85rem', color: 'var(--text-muted)' }}>
							{brand.period}
						</div>
					</div>
					<div style={{
						marginLeft: 'auto',
						padding: '0.3rem 0.7rem',
						borderRadius: '6px',
						background: `${brand.color}18`,
						fontSize: mobile ? '0.78rem' : '0.85rem',
						fontWeight: 700,
						color: brand.color,
					}}>
						{brand.stars} ⭐
					</div>
				</div>

				<div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.6rem' }}>
					<div>
						<div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.2rem' }}>
							Почему это имя
						</div>
						<div style={{ fontSize: mobile ? '0.85rem' : '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
							{brand.reason}
						</div>
					</div>
					<div>
						<div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.2rem' }}>
							Что произошло
						</div>
						<div style={{ fontSize: mobile ? '0.85rem' : '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
							{brand.result}
						</div>
					</div>
				</div>
			</div>

			{/* Progress dots */}
			<div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
				{BRANDS.map((b, i) => (
					<div
						key={i}
						onClick={() => setStep(i)}
						style={{
							width: step === i ? '24px' : '8px',
							height: '8px',
							borderRadius: '4px',
							background: step >= i ? b.color : 'var(--border)',
							cursor: 'pointer',
							transition: 'all 0.3s ease',
						}}
					/>
				))}
			</div>
		</div>
	);
}
