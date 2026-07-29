import { useState, useEffect, useRef } from 'react';

const BENCHMARKS = [
	{ name: 'GPT-5.6 Sol', score: 96.20, color: '#10a37f', note: 'OpenAI, флагман линейки — выше всех в этом сравнении' },
	{ name: 'Claude Fable 5', score: 95.00, color: '#ff6b2b', note: 'Самая мощная модель Anthropic на момент выхода K3' },
	{ name: 'Kimi K3', score: 93.40, color: '#c946ff', note: 'Open-weight модель, 2.8T параметров — в 1.6 пунктах от Fable 5, закрытой модели' },
	{ name: 'Claude Opus 4.8', score: 88.60, color: '#f59e0b', note: 'Предыдущий топ Anthropic — K3 уже обгоняет его' },
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

export default function KimiK3BenchmarkChart() {
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
				📊 SWE-bench Verified: где K3 среди фронтира
			</div>
			<div style={{ fontSize: mobile ? '0.84rem' : '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
				Данные vals.ai на 22 июля 2026. Нажми на строку для деталей. Qwen3.8-Max и DeepSeek V4 здесь нет — у них пока нет независимо подтверждённых цифр по этому бенчмарку.
			</div>

			{BENCHMARKS.map((b, i) => (
				<div
					key={i}
					role="button"
					tabIndex={0}
					style={{
						marginBottom: i < BENCHMARKS.length - 1 ? '1rem' : 0,
						cursor: 'pointer',
						WebkitTapHighlightColor: 'transparent',
						touchAction: 'manipulation',
						minHeight: '44px',
						display: 'flex',
						flexDirection: 'column' as const,
						justifyContent: 'center',
					} as React.CSSProperties}
					onClick={() => setActive(active === i ? null : i)}
					onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(active === i ? null : i); } }}
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
