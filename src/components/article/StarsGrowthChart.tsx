import { useState, useEffect, useRef } from 'react';

const START = new Date('2026-01-12').getTime();
const END = new Date('2026-03-01').getTime();
const SPAN = END - START;

const EVENTS = [
	{ date: '2026-01-12', dateLabel: '12 Янв', stars: 0, label: 'Публикация Clawdbot', detail: '0 → 10K за 48 ч' },
	{ date: '2026-01-27', dateLabel: '27 Янв', stars: 40, label: 'Претензия Anthropic', detail: 'Ребрендинг → Moltbot' },
	{ date: '2026-01-30', dateLabel: '30 Янв', stars: 100, label: 'Ребрендинг в OpenClaw', detail: '100K ⭐' },
	{ date: '2026-02-02', dateLabel: '2 Фев', stars: 130, label: 'Forbes, WIRED, Guardian', detail: '130K ⭐' },
	{ date: '2026-02-05', dateLabel: '5 Фев', stars: 150, label: 'Рост продаж Mac mini', detail: '150K ⭐' },
	{ date: '2026-02-15', dateLabel: '15 Фев', stars: 196, label: 'Штайнбергер → OpenAI', detail: '196K ⭐' },
	{ date: '2026-02-24', dateLabel: '24 Фев', stars: 210, label: 'Обгоняет Linux kernel', detail: '210K ⭐' },
	{ date: '2026-03-01', dateLabel: '1 Мар', stars: 250, label: '#1 на GitHub', detail: '250K+ ⭐' },
];

const THRESHOLDS = [
	{ value: 218, label: 'Linux kernel (218K)', color: '#a78bfa' },
	{ value: 228, label: 'React (228K)', color: '#4ade80' },
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

function dateFrac(d: string) {
	return (new Date(d).getTime() - START) / SPAN;
}

function straightPath(points: { x: number; y: number }[]) {
	if (points.length < 2) return '';
	return `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
}

const VW = 500;
const VH = 280;
const PAD = { top: 20, right: 25, bottom: 32, left: 42 };
const PLOT_W = VW - PAD.left - PAD.right;
const PLOT_H = VH - PAD.top - PAD.bottom;
const MAX_STARS = 260;
const POW = 0.55;

function xOf(d: string) { return PAD.left + dateFrac(d) * PLOT_W; }
function yOf(v: number) {
	const norm = Math.max(0, v) / MAX_STARS;
	return PAD.top + (1 - Math.pow(norm, POW)) * PLOT_H;
}

export default function StarsGrowthChart() {
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

	const points = EVENTS.map(e => ({ x: xOf(e.date), y: yOf(e.stars) }));
	const curvePath = straightPath(points);
	const areaPath = `${curvePath} L ${points[points.length - 1].x},${yOf(0)} L ${points[0].x},${yOf(0)} Z`;

	const yTicks = [0, 25, 50, 100, 150, 200, 220, 250];

	const tooltipW = mobile ? 120 : 140;
	const tooltipH = 36;

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
				📈 Рост GitHub Stars OpenClaw
			</div>
			<div style={{ fontSize: mobile ? '0.78rem' : '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
				Январь – март 2026. Нажми на точку, чтобы увидеть детали
			</div>

			<svg
				viewBox={`0 0 ${VW} ${VH}`}
				style={{ width: '100%', height: 'auto', overflow: 'visible', display: 'block' }}
				preserveAspectRatio="xMidYMid meet"
			>
				{/* Y-axis grid + labels */}
				{yTicks.map(v => (
					<g key={v}>
						<line
							x1={PAD.left} y1={yOf(v)} x2={VW - PAD.right} y2={yOf(v)}
							stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4,3" opacity={0.5}
						/>
						<text
							x={PAD.left - 6} y={yOf(v) + 3.5}
							textAnchor="end" fill="var(--text-muted)"
							fontSize="10" fontFamily="inherit"
						>
							{v}K
						</text>
					</g>
				))}

				{/* X-axis labels */}
				{EVENTS.map((e, i) => (
					<text
						key={i}
						x={xOf(e.date)}
						y={VH - 6}
						textAnchor="middle"
						fill="var(--text-muted)"
						fontSize={mobile ? '8' : '9'}
						fontFamily="inherit"
					>
						{e.dateLabel}
					</text>
				))}

				{/* Threshold lines */}
				{THRESHOLDS.map(t => (
					<g key={t.value}>
						<line
							x1={PAD.left} y1={yOf(t.value)} x2={VW - PAD.right} y2={yOf(t.value)}
							stroke={t.color} strokeWidth="1.2" strokeDasharray="8,4" opacity={0.7}
						/>
						<rect
							x={VW - PAD.right - (t.label.length * 5.5 + 12)}
							y={yOf(t.value) - 11}
							width={t.label.length * 5.5 + 12}
							height={15}
							rx="3"
							fill="var(--bg-card)"
							opacity={0.9}
						/>
						<text
							x={VW - PAD.right - 4} y={yOf(t.value) + 0.5}
							textAnchor="end" fill={t.color}
							fontSize="9" fontWeight="600" fontFamily="inherit"
						>
							{t.label}
						</text>
					</g>
				))}

				{/* Area fill */}
				<path
					d={areaPath}
					fill="url(#starsGrad)"
					opacity={visible ? 0.2 : 0}
					style={{ transition: 'opacity 0.8s ease' }}
				/>

				{/* Smooth curve */}
				<path
					d={curvePath}
					fill="none"
					stroke="#3b82f6"
					strokeWidth="2.5"
					strokeLinecap="round"
					strokeLinejoin="round"
					pathLength={1000}
					strokeDasharray={1000}
					strokeDashoffset={visible ? 0 : 1000}
					style={{ transition: 'stroke-dashoffset 1.8s ease' }}
				/>

				{/* Hover hit areas (invisible wider circles) */}
				{EVENTS.map((e, i) => (
					<circle
						key={`hit-${i}`}
						cx={xOf(e.date)}
						cy={yOf(e.stars)}
						r={14}
						fill="transparent"
						style={{ cursor: 'pointer' }}
						onClick={() => setActive(active === i ? null : i)}
					/>
				))}

				{/* Visible data points */}
				{EVENTS.map((e, i) => (
					<circle
						key={i}
						cx={xOf(e.date)}
						cy={yOf(e.stars)}
						r={active === i ? 6 : 4}
						fill={active === i ? '#ff6b2b' : '#3b82f6'}
						stroke="var(--bg-card)"
						strokeWidth="2"
						style={{
							pointerEvents: 'none',
							transition: 'r 0.2s ease, fill 0.2s ease',
							opacity: visible ? 1 : 0,
							transitionDelay: `${i * 0.08}s`,
						}}
					/>
				))}

				{/* Tooltip */}
				{active !== null && (() => {
					const px = xOf(EVENTS[active].date);
					const py = yOf(EVENTS[active].stars);
					const tx = Math.max(PAD.left, Math.min(px - tooltipW / 2, VW - PAD.right - tooltipW));
					const above = py - tooltipH - 10;
					const ty = above > PAD.top ? above : py + 12;
					return (
						<g>
							<line x1={px} y1={py + 6} x2={px} y2={yOf(0)} stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="3,3" opacity={0.4} />
							<rect
								x={tx} y={ty}
								width={tooltipW} height={tooltipH}
								rx="6" fill="var(--bg-secondary)"
								stroke="var(--border)" strokeWidth="1"
							/>
							<text
								x={tx + tooltipW / 2} y={ty + 14}
								textAnchor="middle" fill="var(--text)"
								fontSize="10" fontWeight="700" fontFamily="inherit"
							>
								{EVENTS[active].label}
							</text>
							<text
								x={tx + tooltipW / 2} y={ty + 28}
								textAnchor="middle" fill="#ff6b2b"
								fontSize="9.5" fontWeight="600" fontFamily="inherit"
							>
								{EVENTS[active].detail}
							</text>
						</g>
					);
				})()}

				<defs>
					<linearGradient id="starsGrad" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
						<stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
					</linearGradient>
				</defs>
			</svg>
		</div>
	);
}
