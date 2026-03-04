import { useState, useEffect, useRef } from 'react';

const PROJECTS = [
	{ name: 'OpenClaw', daysTo100k: 18, daysTo200k: 43, total: 250, color: '#ff6b2b', year: 2026 },
	{ name: 'React', daysTo100k: 1825, daysTo200k: 3285, total: 228, color: '#4ade80', year: 2013 },
	{ name: 'Vue.js', daysTo100k: 1460, daysTo200k: 2555, total: 208, color: '#42b883', year: 2014 },
	{ name: 'TensorFlow', daysTo100k: 730, daysTo200k: 2190, total: 186, color: '#ff8f00', year: 2015 },
	{ name: 'LangChain', daysTo100k: 365, daysTo200k: null, total: 97, color: '#3b82f6', year: 2022 },
];

const MILESTONES = [
	{ label: 'Время до 100K ⭐', key: 'daysTo100k' as const },
	{ label: 'Время до 200K ⭐', key: 'daysTo200k' as const },
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

function formatDays(d: number | null) {
	if (d === null) return 'не достигнуто';
	if (d < 30) return `${d} дней`;
	if (d < 365) return `${Math.round(d / 30)} мес.`;
	const y = Math.round(d / 365 * 10) / 10;
	return `${y} ${y === 1 ? 'год' : y < 5 ? 'года' : 'лет'}`;
}

export default function GrowthRace() {
	const [milestone, setMilestone] = useState(0);
	const [visible, setVisible] = useState(false);
	const [racing, setRacing] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const mobile = useIsMobile();

	useEffect(() => {
		const obs = new IntersectionObserver(
			([e]) => { if (e.isIntersecting) { setVisible(true); setTimeout(() => setRacing(true), 300); } },
			{ threshold: 0.2 },
		);
		if (ref.current) obs.observe(ref.current);
		return () => obs.disconnect();
	}, []);

	const ms = MILESTONES[milestone];
	const maxDays = Math.max(...PROJECTS.map(p => p[ms.key] ?? 0));

	return (
		<div
			ref={ref}
			style={{
				margin: '1.75em 0', padding: mobile ? '0.85rem' : '1.5rem',
				borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)',
			}}
		>
			<div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
				🏁 Гонка за звёздами
			</div>
			<div style={{ fontSize: mobile ? '0.78rem' : '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
				Сколько времени потребовалось каждому проекту, чтобы достичь вехи
			</div>

			{/* Milestone tabs */}
			<div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
				{MILESTONES.map((m, i) => (
					<button
						key={i}
						onClick={() => { setMilestone(i); setRacing(false); setTimeout(() => setRacing(true), 50); }}
						style={{
							padding: mobile ? '0.4rem 0.8rem' : '0.45rem 1rem',
							borderRadius: '7px',
							border: `1.5px solid ${milestone === i ? '#ff6b2b' : 'var(--border)'}`,
							background: milestone === i ? '#ff6b2b15' : 'transparent',
							color: milestone === i ? '#ff6b2b' : 'var(--text-muted)',
							fontSize: mobile ? '0.75rem' : '0.82rem',
							fontWeight: milestone === i ? 700 : 500,
							cursor: 'pointer',
							WebkitTapHighlightColor: 'transparent',
							transition: 'all 0.2s ease',
						}}
					>
						{m.label}
					</button>
				))}
			</div>

			{/* Race bars */}
			<div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.75rem' }}>
				{PROJECTS.map((p, i) => {
					const val = p[ms.key];
					const pct = val !== null ? (val / maxDays) * 100 : 0;
					const isOpenClaw = p.name === 'OpenClaw';
					return (
						<div key={i} style={{ minHeight: '44px' }}>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
								<span style={{
									fontSize: mobile ? '0.82rem' : '0.88rem',
									fontWeight: isOpenClaw ? 800 : 600,
									color: isOpenClaw ? p.color : 'var(--text)',
								}}>
									{p.name}
									<span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.4rem' }}>
										({p.year})
									</span>
								</span>
								<span style={{
									fontSize: mobile ? '0.78rem' : '0.85rem',
									fontWeight: 700,
									color: p.color,
									fontVariantNumeric: 'tabular-nums',
								}}>
									{formatDays(val)}
								</span>
							</div>
							<div style={{
								height: mobile ? '12px' : '16px',
								borderRadius: '8px',
								background: 'var(--bg-secondary)',
								border: '1px solid var(--border)',
								overflow: 'hidden',
								position: 'relative' as const,
							}}>
								<div style={{
									height: '100%',
									borderRadius: '8px',
									background: val !== null
										? (isOpenClaw
											? `linear-gradient(90deg, ${p.color}, ${p.color}dd)`
											: `linear-gradient(90deg, ${p.color}aa, ${p.color}66)`)
										: `repeating-linear-gradient(135deg, var(--border), var(--border) 4px, transparent 4px, transparent 8px)`,
									width: visible && racing ? (val !== null ? `${Math.max(pct, 2)}%` : '100%') : '0%',
									transition: `width ${0.8 + i * 0.15}s ease ${i * 0.1}s`,
								}} />
								{isOpenClaw && visible && racing && (
									<div style={{
										position: 'absolute' as const,
										right: val !== null ? `${100 - pct - 1}%` : '0',
										top: '50%',
										transform: 'translateY(-50%)',
										fontSize: mobile ? '0.65rem' : '0.7rem',
										fontWeight: 800,
										color: p.color,
										paddingLeft: '0.3rem',
										transition: `right ${0.8}s ease`,
									}}>
										🚀
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{/* Insight */}
			<div style={{
				marginTop: '1rem', padding: mobile ? '0.65rem' : '0.85rem',
				borderRadius: '8px', background: '#ff6b2b08', border: '1px solid #ff6b2b15',
				fontSize: mobile ? '0.78rem' : '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5,
				display: 'flex', alignItems: 'center', gap: '0.5rem',
			}}>
				<span style={{ fontSize: '1.1rem', flexShrink: 0 }}>🏆</span>
				<span>
					OpenClaw достиг 100K звёзд за <strong style={{ color: '#ff6b2b' }}>18 дней</strong> — в <strong style={{ color: '#ff6b2b' }}>{Math.round(1825 / 18)}×</strong> быстрее React и в <strong style={{ color: '#ff6b2b' }}>{Math.round(730 / 18)}×</strong> быстрее TensorFlow.
				</span>
			</div>
		</div>
	);
}
