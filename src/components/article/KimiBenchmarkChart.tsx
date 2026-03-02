import { useState, useEffect, useRef } from 'react';

const BENCHMARKS = [
	{ name: 'HLE (с инструментами)', score: 50.2, color: '#ff6b2b', note: 'Превосходит GPT-5.2 и Claude Opus 4.5' },
	{ name: 'SWE-Bench Verified', score: 76.8, color: '#c946ff', note: 'Лучшая производительность в кодировании' },
	{ name: 'OCRBench', score: 92.3, color: '#3b82f6', note: 'Лидирует в понимании визуальных документов' },
	{ name: 'OmniDocBench 1.5', score: 88.8, color: '#10b981', note: 'Высокая производительность в анализе документов' },
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

export default function KimiBenchmarkChart() {
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
				📊 Бенчмарки Kimi K2.5
			</div>
			<div style={{ fontSize: mobile ? '0.84rem' : '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
				Нажми на строку, чтобы увидеть детали
			</div>

			{BENCHMARKS.map((b, i) => (
				<div
					key={i}
					style={{
						marginBottom: i < BENCHMARKS.length - 1 ? '1rem' : 0,
						cursor: 'pointer',
						/* Touch optimizations */
						WebkitTapHighlightColor: 'transparent',
						touchAction: 'manipulation',
						/* Min tap area */
						minHeight: '44px',
						display: 'flex',
						flexDirection: 'column' as const,
						justifyContent: 'center',
					} as React.CSSProperties}
					onClick={() => setActive(active === i ? null : i)}
				>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
						<span style={{ fontSize: mobile ? '0.82rem' : '0.88rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>
							{b.name}
						</span>
						<span style={{
							fontSize: mobile ? '0.88rem' : '0.9rem',
							fontWeight: 900,
							color: b.color,
							fontVariantNumeric: 'tabular-nums',
							marginLeft: '0.75rem',
							flexShrink: 0,
						}}>
							{b.score}%
						</span>
					</div>
					<div style={{
						height: mobile ? '8px' : '10px',
						borderRadius: '5px',
						background: 'var(--bg-secondary)',
						border: '1px solid var(--border)',
						overflow: 'hidden',
					}}>
						<div style={{
							height: '100%',
							borderRadius: '5px',
							background: `linear-gradient(90deg, ${b.color}, ${b.color}bb)`,
							width: visible ? `${b.score}%` : '0%',
							transition: `width ${0.5 + i * 0.15}s ease ${i * 0.08}s`,
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
							<span style={{ color: b.color, flexShrink: 0 }}>→</span>
							{b.note}
						</div>
					)}
				</div>
			))}
		</div>
	);
}
