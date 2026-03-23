import { useState, useEffect } from 'react';

type Model = {
	name: string;
	short: string;
	hPercent: string;
	triviaQA: number;
	nonExist: number;
	biomedical: number;
	color: string;
};

const MODELS: Model[] = [
	{ name: 'Llama-3.3-70B', short: 'Llama 70B', hPercent: '0.01%', triviaQA: 82.7, nonExist: 96.7, biomedical: 79.1, color: '#3b82f6' },
	{ name: 'Gemma-3-27B', short: 'Gemma 27B', hPercent: '0.18%', triviaQA: 83.6, nonExist: 95.9, biomedical: 81.2, color: '#8b5cf6' },
	{ name: 'Mistral-Small-24B', short: 'Mistral 24B', hPercent: '0.01%', triviaQA: 81.0, nonExist: 86.6, biomedical: 76.5, color: '#f59e0b' },
	{ name: 'Qwen-2.5-32B', short: 'Qwen 32B', hPercent: '0.03%', triviaQA: 80.4, nonExist: 91.2, biomedical: 77.8, color: '#10b981' },
	{ name: 'Phi-4-14B', short: 'Phi-4 14B', hPercent: '0.05%', triviaQA: 78.9, nonExist: 88.4, biomedical: 74.3, color: '#ec4899' },
	{ name: 'DeepSeek-R1-70B', short: 'DS-R1 70B', hPercent: '0.02%', triviaQA: 84.1, nonExist: 97.3, biomedical: 82.0, color: '#06b6d4' },
];

type Metric = 'triviaQA' | 'nonExist' | 'biomedical';

const METRICS: { key: Metric; label: string; shortLabel: string; desc: string; icon: string }[] = [
	{ key: 'triviaQA', label: 'TriviaQA', shortLabel: 'Trivia', desc: 'Общие знания', icon: '📚' },
	{ key: 'nonExist', label: 'NonExist', shortLabel: 'NonEx', desc: 'Выдуманные факты', icon: '👻' },
	{ key: 'biomedical', label: 'Biomedical', shortLabel: 'Bio', desc: 'Биомедицина', icon: '🧬' },
];

function useIsMobile(bp = 520) {
	const [m, setM] = useState(false);
	useEffect(() => {
		const c = () => setM(window.innerWidth <= bp);
		c();
		window.addEventListener('resize', c, { passive: true });
		return () => window.removeEventListener('resize', c);
	}, [bp]);
	return m;
}

const tap: React.CSSProperties = {
	WebkitTapHighlightColor: 'transparent',
	touchAction: 'manipulation',
};

export default function DetectionBenchmark() {
	const [metric, setMetric] = useState<Metric>('triviaQA');
	const [animated, setAnimated] = useState(false);
	const [tappedModel, setTappedModel] = useState<string | null>(null);
	const mobile = useIsMobile();

	useEffect(() => {
		setAnimated(false);
		const t = setTimeout(() => setAnimated(true), 50);
		return () => clearTimeout(t);
	}, [metric]);

	const sorted = [...MODELS].sort((a, b) => b[metric] - a[metric]);
	const maxVal = Math.max(...MODELS.map(m => m[metric]));
	const minVal = Math.min(...MODELS.map(m => m[metric]));
	const currentMetric = METRICS.find(m => m.key === metric)!;

	return (
		<div style={{
			margin: mobile ? '1.25em -0.25rem' : '1.75em 0',
			padding: mobile ? '0.75rem' : '1.5rem',
			borderRadius: mobile ? '10px' : '12px',
			border: '1px solid var(--border)', background: 'var(--bg-card)',
		}}>
			<div style={{
				fontSize: mobile ? '0.78rem' : '0.85rem', fontWeight: 700, color: 'var(--accent-light)',
				textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.4rem',
			}}>
				🏆 Точность детекции галлюцинаций
			</div>
			<div style={{
				fontSize: mobile ? '0.78rem' : '0.88rem', color: 'var(--text-muted)',
				marginBottom: '0.85rem', lineHeight: 1.5,
			}}>
				{mobile
					? 'H-Neurons детектят враньё. Переключай метрики.'
					: 'Как H-Neurons-классификаторы детектят враньё в разных доменах. Переключай метрики.'
				}
			</div>

			{/* Metric tabs */}
			<div style={{
				display: 'flex', gap: '0.35rem', marginBottom: '1rem',
			}}>
				{METRICS.map(m => (
					<button
						key={m.key}
						onClick={() => setMetric(m.key)}
						style={{
							...tap,
							flex: mobile ? 1 : 'none' as unknown as number,
							padding: mobile ? '0 0.4rem' : '0.5rem 1rem',
							height: 44, minHeight: 44,
							borderRadius: '8px',
							border: `1px solid ${metric === m.key ? 'var(--accent)' : 'var(--border)'}`,
							background: metric === m.key ? 'var(--accent-glow)' : 'var(--bg-secondary)',
							color: metric === m.key ? 'var(--accent-light)' : 'var(--text-muted)',
							fontSize: mobile ? '0.72rem' : '0.84rem', fontWeight: 600,
							cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
							display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
							gap: '0.25rem',
						}}
					>
						{m.icon} {mobile ? m.shortLabel : m.label}
					</button>
				))}
			</div>

			{/* Chart info */}
			<div style={{
				display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem',
				padding: mobile ? '0.4rem 0.6rem' : '0.5rem 0.75rem', borderRadius: '8px',
				background: 'var(--bg-secondary)', border: '1px solid var(--border)',
			}}>
				<span style={{ fontSize: mobile ? '1rem' : '1.2rem' }}>{currentMetric.icon}</span>
				<div>
					<div style={{ fontSize: mobile ? '0.75rem' : '0.82rem', fontWeight: 700, color: 'var(--text)' }}>
						{currentMetric.label}
					</div>
					<div style={{ fontSize: mobile ? '0.62rem' : '0.7rem', color: 'var(--text-muted)' }}>
						{currentMetric.desc} — AUROC, %
					</div>
				</div>
			</div>

			{/* Horizontal bars */}
			<div style={{ display: 'flex', flexDirection: 'column' as const, gap: mobile ? '0.4rem' : '0.6rem' }}>
				{sorted.map((m, rank) => {
					const val = m[metric];
					const barPct = animated ? ((val - 50) / (100 - 50)) * 100 : 0;
					const isTapped = tappedModel === m.name;
					const isBest = rank === 0;

					return (
						<div
							key={m.name}
							onClick={() => mobile && setTappedModel(tappedModel === m.name ? null : m.name)}
							onMouseEnter={() => !mobile && setTappedModel(m.name)}
							onMouseLeave={() => !mobile && setTappedModel(null)}
							style={{
								display: 'flex', alignItems: 'center',
								gap: mobile ? '0.3rem' : '0.75rem',
								padding: mobile ? '0.3rem 0.25rem' : '0.4rem 0.5rem',
								borderRadius: '8px',
								background: isTapped ? 'var(--bg-secondary)' : 'transparent',
								transition: 'background 0.2s ease',
								cursor: mobile ? 'pointer' : 'default',
							}}
						>
							{/* Rank */}
							<span style={{
								width: mobile ? 18 : 20, textAlign: 'center' as const, flexShrink: 0,
								fontSize: mobile ? '0.65rem' : '0.75rem', fontWeight: 800,
								color: isBest ? '#f59e0b' : 'var(--text-muted)',
							}}>
								{isBest ? '🥇' : `#${rank + 1}`}
							</span>

							{/* Model name */}
							<div style={{
								width: mobile ? 55 : 130, flexShrink: 0,
								fontSize: mobile ? '0.62rem' : '0.78rem', fontWeight: 600,
								color: isTapped ? 'var(--text)' : 'var(--text-muted)',
								overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
								lineHeight: 1.2,
							}}>
								{mobile ? m.short : m.name}
							</div>

							{/* Bar */}
							<div style={{
								flex: 1, height: mobile ? 24 : 28, borderRadius: '6px',
								background: 'var(--bg-secondary)', border: '1px solid var(--border)',
								overflow: 'hidden', position: 'relative' as const,
							}}>
								<div style={{
									height: '100%', borderRadius: '5px', width: `${barPct}%`,
									background: isBest ? `linear-gradient(90deg, ${m.color}, #f59e0b)` : m.color,
									transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
									display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
									paddingRight: mobile ? '0.3rem' : '0.5rem',
									minWidth: animated ? '2rem' : 0,
								}}>
									<span style={{
										fontSize: mobile ? '0.6rem' : '0.72rem', fontWeight: 800, color: 'white',
										textShadow: '0 1px 2px rgba(0,0,0,0.3)',
										fontVariantNumeric: 'tabular-nums',
									}}>
										{val.toFixed(1)}%
									</span>
								</div>
							</div>

							{/* H-Neurons % — hidden on very small, shown on tap */}
							{(!mobile || isTapped) && (
								<span style={{
									width: mobile ? 34 : 48, textAlign: 'right' as const, flexShrink: 0,
									fontSize: mobile ? '0.58rem' : '0.65rem', fontWeight: 700,
									color: '#ef4444', fontVariantNumeric: 'tabular-nums',
								}}>
									{m.hPercent}
								</span>
							)}
						</div>
					);
				})}
			</div>

			{/* Legend */}
			<div style={{
				display: 'flex', gap: mobile ? '0.75rem' : '1.5rem', marginTop: '0.75rem',
				fontSize: mobile ? '0.62rem' : '0.7rem', color: 'var(--text-muted)',
				flexWrap: 'wrap' as const,
			}}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
					<div style={{ width: 10, height: 10, borderRadius: '2px', background: 'var(--accent)' }} />
					Точность
				</div>
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
					<span style={{ color: '#ef4444', fontWeight: 700 }}>%</span>
					H-Neurons {mobile ? '(тап)' : ''}
				</div>
			</div>

			{/* Summary stats */}
			<div style={{
				display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
				gap: mobile ? '0.4rem' : '0.75rem',
				marginTop: '0.75rem', padding: mobile ? '0.5rem' : '0.75rem',
				borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
			}}>
				{[
					{ label: 'Лучший', val: `${maxVal.toFixed(1)}%`, color: '#10b981' },
					{ label: 'Средний', val: `${(MODELS.reduce((a, m) => a + m[metric], 0) / MODELS.length).toFixed(1)}%`, color: 'var(--accent-light)' },
					{ label: 'Мин.', val: `${minVal.toFixed(1)}%`, color: 'var(--text-muted)' },
				].map(s => (
					<div key={s.label} style={{ textAlign: 'center' as const }}>
						<div style={{
							fontSize: mobile ? '0.9rem' : '1.1rem', fontWeight: 900, color: s.color,
						}}>{s.val}</div>
						<div style={{
							fontSize: mobile ? '0.55rem' : '0.65rem', fontWeight: 600,
							color: 'var(--text-muted)', textTransform: 'uppercase' as const,
						}}>{s.label}</div>
					</div>
				))}
			</div>
		</div>
	);
}
