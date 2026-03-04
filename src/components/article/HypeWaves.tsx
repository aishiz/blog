import { useState, useEffect, useRef } from 'react';

const WAVES = [
	{
		num: 1,
		title: 'Волна 1',
		period: 'Январь 2026',
		audience: 'Разработчики и iOS-сообщество',
		stars: '10K → 40K звёзд',
		trigger: 'Clawdbot на GitHub\nПост Штайнбергера в X',
		color: '#3b82f6',
		gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
	},
	{
		num: 2,
		title: 'Волна 2',
		period: '27–30 января',
		audience: 'Tech-медиа и AI-энтузиасты',
		stars: '40K → 130K звёзд',
		trigger: 'Конфликт с Anthropic\nДва ребрендинга за 72 часа',
		color: '#ff6b2b',
		gradient: 'linear-gradient(135deg, #ff6b2b, #f97316)',
	},
	{
		num: 3,
		title: 'Волна 3',
		period: 'Февраль 2026',
		audience: 'Массовая аудитория',
		stars: '130K → 250K звёзд',
		trigger: 'Forbes, WIRED, Guardian\nНайм в OpenAI\nРост продаж Mac mini',
		color: '#10b981',
		gradient: 'linear-gradient(135deg, #10b981, #059669)',
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

export default function HypeWaves() {
	const [active, setActive] = useState(0);
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

	const wave = WAVES[active];

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
				🌊 Три волны аудитории OpenClaw
			</div>
			<div style={{ fontSize: mobile ? '0.78rem' : '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
				Каждая волна привлекала принципиально новую аудиторию
			</div>

			{/* Wave tabs */}
			<div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' as const }}>
				{WAVES.map((w, i) => (
					<button
						key={i}
						onClick={() => setActive(i)}
						style={{
							padding: mobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
							borderRadius: '8px',
							border: `1.5px solid ${active === i ? w.color : 'var(--border)'}`,
							background: active === i ? `${w.color}18` : 'transparent',
							color: active === i ? w.color : 'var(--text-muted)',
							fontSize: mobile ? '0.78rem' : '0.85rem',
							fontWeight: active === i ? 700 : 500,
							cursor: 'pointer',
							transition: 'all 0.2s ease',
							WebkitTapHighlightColor: 'transparent',
						}}
					>
						{w.title}
					</button>
				))}
			</div>

			{/* Active wave detail */}
			<div
				style={{
					padding: mobile ? '1rem' : '1.5rem',
					borderRadius: '10px',
					border: `1.5px solid ${wave.color}40`,
					background: `${wave.color}08`,
					opacity: visible ? 1 : 0,
					transform: visible ? 'translateY(0)' : 'translateY(10px)',
					transition: 'all 0.4s ease',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
					<div style={{
						width: mobile ? '36px' : '44px',
						height: mobile ? '36px' : '44px',
						borderRadius: '50%',
						background: wave.gradient,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						color: 'white',
						fontWeight: 900,
						fontSize: mobile ? '0.9rem' : '1.1rem',
						flexShrink: 0,
					}}>
						{wave.num}
					</div>
					<div>
						<div style={{ fontWeight: 800, fontSize: mobile ? '0.95rem' : '1.05rem', color: 'var(--text)' }}>
							{wave.period}
						</div>
						<div style={{ fontSize: mobile ? '0.78rem' : '0.85rem', color: wave.color, fontWeight: 600 }}>
							{wave.stars}
						</div>
					</div>
				</div>

				<div style={{ marginBottom: '0.75rem' }}>
					<div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.3rem' }}>
						Аудитория
					</div>
					<div style={{ fontSize: mobile ? '0.85rem' : '0.92rem', color: 'var(--text)', fontWeight: 600 }}>
						{wave.audience}
					</div>
				</div>

				<div>
					<div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.3rem' }}>
						Триггер
					</div>
					{wave.trigger.split('\n').map((line, j) => (
						<div key={j} style={{
							fontSize: mobile ? '0.82rem' : '0.88rem',
							color: 'var(--text-secondary)',
							lineHeight: 1.6,
							display: 'flex',
							alignItems: 'center',
							gap: '0.4rem',
						}}>
							<span style={{ color: wave.color }}>→</span> {line}
						</div>
					))}
				</div>
			</div>

			{/* Progress bar */}
			<div style={{ display: 'flex', gap: '4px', marginTop: '1rem' }}>
				{WAVES.map((w, i) => (
					<div
						key={i}
						style={{
							flex: 1,
							height: '4px',
							borderRadius: '2px',
							background: i <= active ? w.color : 'var(--border)',
							transition: 'background 0.3s ease',
						}}
					/>
				))}
			</div>
		</div>
	);
}
