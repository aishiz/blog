import { useState, useEffect, useRef } from 'react';

const AXES = [
	'Техническая глубина',
	'Доступность для масс',
	'Автономность агента',
	'Экосистема плагинов',
	'Скорость старта',
	'Безопасность (out-of-box)',
];

const FRAMEWORKS = [
	{ name: 'OpenClaw', color: '#ff6b2b', values: [6, 10, 8, 8, 10, 4] },
	{ name: 'LangGraph', color: '#3b82f6', values: [10, 4, 8, 10, 4, 8] },
	{ name: 'CrewAI', color: '#10b981', values: [8, 6, 8, 8, 6, 6] },
	{ name: 'Google ADK', color: '#a78bfa', values: [8, 4, 8, 6, 4, 8] },
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

function polarToXY(angle: number, radius: number, cx: number, cy: number) {
	const rad = (angle - 90) * (Math.PI / 180);
	return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

export default function RadarComparison() {
	const [activeFramework, setActiveFramework] = useState<number | null>(null);
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

	const size = 100;
	const cx = size / 2;
	const cy = size / 2;
	const maxR = mobile ? 32 : 36;
	const angleStep = 360 / AXES.length;

	const getPolygonPoints = (values: number[]) => {
		return values.map((v, i) => {
			const { x, y } = polarToXY(i * angleStep, (v / 10) * maxR, cx, cy);
			return `${x},${y}`;
		}).join(' ');
	};

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
				🎯 Сравнение агентных фреймворков
			</div>
			<div style={{ fontSize: mobile ? '0.78rem' : '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
				Нажми на фреймворк, чтобы выделить его на радаре
			</div>

			{/* Legend / toggles */}
			<div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '0.5rem', marginBottom: '1rem' }}>
				{FRAMEWORKS.map((fw, i) => (
					<button
						key={i}
						onClick={() => setActiveFramework(activeFramework === i ? null : i)}
						style={{
							padding: '0.35rem 0.75rem',
							borderRadius: '6px',
							border: `1.5px solid ${activeFramework === i ? fw.color : 'var(--border)'}`,
							background: activeFramework === i ? `${fw.color}18` : 'transparent',
							color: activeFramework === i ? fw.color : 'var(--text-muted)',
							fontSize: mobile ? '0.72rem' : '0.8rem',
							fontWeight: activeFramework === i ? 700 : 500,
							cursor: 'pointer',
							transition: 'all 0.2s ease',
							WebkitTapHighlightColor: 'transparent',
							display: 'flex',
							alignItems: 'center',
							gap: '0.35rem',
						}}
					>
						<span style={{
							width: '8px', height: '8px', borderRadius: '50%',
							background: fw.color, display: 'inline-block',
						}} />
						{fw.name}
					</button>
				))}
			</div>

			{/* Radar SVG */}
			<svg
				viewBox={`0 0 ${size} ${size}`}
				style={{ width: '100%', maxWidth: '420px', height: 'auto', display: 'block', margin: '0 auto' }}
			>
				{/* Grid circles */}
				{[2, 4, 6, 8, 10].map(level => (
					<circle
						key={level}
						cx={cx} cy={cy}
						r={(level / 10) * maxR}
						fill="none"
						stroke="var(--border)"
						strokeWidth="0.2"
						opacity={0.5}
					/>
				))}

				{/* Axis lines + labels */}
				{AXES.map((axis, i) => {
					const angle = i * angleStep;
					const end = polarToXY(angle, maxR, cx, cy);
					const labelPos = polarToXY(angle, maxR + (mobile ? 5 : 6), cx, cy);
					return (
						<g key={i}>
							<line
								x1={cx} y1={cy} x2={end.x} y2={end.y}
								stroke="var(--border)" strokeWidth="0.2" opacity={0.5}
							/>
							<text
								x={labelPos.x}
								y={labelPos.y}
								textAnchor="middle"
								dominantBaseline="middle"
								fill="var(--text-muted)"
								fontSize={mobile ? '2.5' : '2.8'}
							>
								{axis.length > 14 ? axis.split(' ').map((word, wi) => (
									<tspan key={wi} x={labelPos.x} dy={wi === 0 ? 0 : '3.2'}>{word}</tspan>
								)) : axis}
							</text>
						</g>
					);
				})}

				{/* Framework polygons */}
				{FRAMEWORKS.map((fw, i) => {
					const isActive = activeFramework === null || activeFramework === i;
					return (
						<polygon
							key={i}
							points={getPolygonPoints(fw.values)}
							fill={fw.color}
							fillOpacity={isActive ? 0.12 : 0.03}
							stroke={fw.color}
							strokeWidth={activeFramework === i ? '0.6' : '0.35'}
							opacity={visible ? (isActive ? 1 : 0.2) : 0}
							style={{ transition: 'all 0.4s ease' }}
						/>
					);
				})}
			</svg>

			{/* Active framework details */}
			{activeFramework !== null && (
				<div style={{
					marginTop: '1rem',
					padding: mobile ? '0.75rem' : '1rem',
					borderRadius: '8px',
					border: `1px solid ${FRAMEWORKS[activeFramework].color}30`,
					background: `${FRAMEWORKS[activeFramework].color}08`,
				}}>
					<div style={{ fontWeight: 700, fontSize: '0.88rem', color: FRAMEWORKS[activeFramework].color, marginBottom: '0.5rem' }}>
						{FRAMEWORKS[activeFramework].name}
					</div>
					<div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: '0.3rem' }}>
						{AXES.map((axis, i) => (
							<div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
								<span>{axis}</span>
								<span style={{ fontWeight: 700, color: FRAMEWORKS[activeFramework].color }}>
									{FRAMEWORKS[activeFramework].values[i]}/10
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
