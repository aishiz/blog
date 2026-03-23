import { useState, useEffect } from 'react';

type ModelData = {
	name: string;
	short: string;
	color: string;
	curve: (x: number) => number;
};

const MODELS: ModelData[] = [
	{ name: 'Llama-3.3-70B', short: 'Llama 70B', color: '#3b82f6', curve: x => Math.min(98, 12 + 22 * x) },
	{ name: 'Gemma-3-27B', short: 'Gemma 27B', color: '#8b5cf6', curve: x => Math.min(97, 15 + 20 * x) },
	{ name: 'Mistral-Small-24B', short: 'Mistral 24B', color: '#f59e0b', curve: x => Math.min(95, 18 + 19 * x) },
	{ name: 'Qwen-2.5-32B', short: 'Qwen 32B', color: '#10b981', curve: x => Math.min(96, 14 + 21 * x) },
	{ name: 'Phi-4-14B', short: 'Phi-4 14B', color: '#ec4899', curve: x => Math.min(94, 20 + 18 * x) },
	{ name: 'DeepSeek-R1-70B', short: 'DS-R1 70B', color: '#06b6d4', curve: x => Math.min(99, 10 + 23 * x) },
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

export default function ScalingFactorViz() {
	const [factor, setFactor] = useState(1.0);
	const mobile = useIsMobile();

	const getLabel = (f: number) => {
		if (f <= 0.3) return { text: 'Правдивая', color: '#10b981', emoji: '🧊' };
		if (f <= 1.0) return { text: 'Базовая', color: '#3b82f6', emoji: '⚖️' };
		if (f <= 2.5) return { text: 'Уступчивая', color: '#f59e0b', emoji: '⚠️' };
		return { text: 'Полная уступч.', color: '#ef4444', emoji: '🔥' };
	};

	const label = getLabel(factor);

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
				📊 Scaling Factor → Compliance Rate
			</div>
			<div style={{
				fontSize: mobile ? '0.78rem' : '0.88rem', color: 'var(--text-muted)',
				marginBottom: '1rem', lineHeight: 1.5,
			}}>
				{mobile
					? 'Двигай ползунок — смотри рост уступчивости.'
					: 'Двигай ползунок — смотри, как усиление H-Neurons увеличивает уступчивость модели.'
				}
			</div>

			{/* Slider section */}
			<div style={{ marginBottom: '1.25rem' }}>
				{/* Label — stacks on mobile */}
				<div style={{
					display: 'flex',
					flexDirection: mobile ? 'column' as const : 'row' as const,
					justifyContent: mobile ? 'flex-start' : 'space-between',
					alignItems: mobile ? 'flex-start' : 'center',
					gap: mobile ? '0.35rem' : '0.5rem',
					marginBottom: '0.5rem',
				}}>
					<span style={{ fontSize: mobile ? '0.72rem' : '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
						Scaling Factor
					</span>
					<div style={{
						display: 'flex', alignItems: 'center', gap: '0.4rem',
						flexWrap: 'wrap' as const,
					}}>
						<span style={{ fontSize: mobile ? '1.1rem' : '1.4rem', fontWeight: 900, color: label.color }}>
							{label.emoji}
						</span>
						<span style={{
							fontSize: mobile ? '1rem' : '1.2rem', fontWeight: 900, color: label.color,
							fontVariantNumeric: 'tabular-nums',
						}}>
							×{factor.toFixed(1)}
						</span>
						<span style={{
							fontSize: mobile ? '0.65rem' : '0.72rem', fontWeight: 700, color: label.color,
							padding: '0.12rem 0.4rem', borderRadius: '4px',
							background: `${label.color}18`, border: `1px solid ${label.color}33`,
							whiteSpace: 'nowrap' as const,
						}}>
							{label.text}
						</span>
					</div>
				</div>

				{/* Slider — taller touch target */}
				<div style={{ padding: mobile ? '8px 0' : '4px 0' }}>
					<input
						type="range" min={0} max={4} step={0.1} value={factor}
						onChange={e => setFactor(parseFloat(e.target.value))}
						style={{
							width: '100%', height: mobile ? '8px' : '6px', borderRadius: '4px',
							appearance: 'none', WebkitAppearance: 'none',
							background: 'linear-gradient(to right, #10b981 0%, #3b82f6 25%, #f59e0b 62.5%, #ef4444 100%)',
							outline: 'none', cursor: 'pointer',
							touchAction: 'none',
						}}
					/>
				</div>
				<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
					{['0', '1', '2', '3', '4'].map(v => (
						<span key={v} style={{
							fontSize: mobile ? '0.6rem' : '0.65rem', color: 'var(--text-muted)', fontWeight: 600,
						}}>×{v}</span>
					))}
				</div>
			</div>

			{/* Model bars */}
			<div style={{ display: 'flex', flexDirection: 'column' as const, gap: mobile ? '0.5rem' : '0.65rem' }}>
				{MODELS.map(m => {
					const rate = m.curve(factor);
					return (
						<div key={m.name} style={{
							display: 'flex', alignItems: 'center',
							gap: mobile ? '0.4rem' : '0.75rem',
						}}>
							<div style={{
								width: mobile ? 62 : 110, flexShrink: 0,
								fontSize: mobile ? '0.65rem' : '0.78rem', fontWeight: 600,
								color: 'var(--text-muted)', textAlign: 'right' as const,
								overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
								lineHeight: 1.2,
							}}>
								{mobile ? m.short : m.name}
							</div>
							<div style={{
								flex: 1, height: mobile ? 22 : 24, borderRadius: '6px',
								background: 'var(--bg-secondary)', border: '1px solid var(--border)',
								overflow: 'hidden', position: 'relative' as const,
							}}>
								<div style={{
									height: '100%', borderRadius: '5px', width: `${rate}%`,
									background: rate > 80 ? `linear-gradient(90deg, ${m.color}, #ef4444)`
										: rate > 50 ? `linear-gradient(90deg, ${m.color}, #f59e0b)` : m.color,
									transition: 'width 0.5s ease, background 0.5s ease',
									display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
									paddingRight: '0.4rem',
								}}>
									<span style={{
										fontSize: mobile ? '0.6rem' : '0.68rem', fontWeight: 800, color: 'white',
										textShadow: '0 1px 2px rgba(0,0,0,0.3)',
										fontVariantNumeric: 'tabular-nums',
									}}>
										{rate.toFixed(0)}%
									</span>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			<div style={{
				marginTop: '0.75rem',
				fontSize: mobile ? '0.65rem' : '0.75rem',
				color: 'var(--text-muted)', lineHeight: 1.5,
			}}>
				* Compliance Rate — доля ответов, где модель уступает давлению. Данные аппроксимированы.
			</div>
		</div>
	);
}
