import { useState, useEffect, useCallback } from 'react';

type Stage = {
	id: string;
	label: string;
	shortLabel: string;
	icon: string;
	color: string;
	hNeuronStrength: number;
	description: string;
	shortDesc: string;
};

const STAGES: Stage[] = [
	{
		id: 'pretrain', label: 'Pre-training', shortLabel: 'Pretrain',
		icon: '🏗️', color: '#ef4444', hNeuronStrength: 100,
		description: 'Модель учится предсказывать следующий токен. H-Neurons формируются — нейронные цепи, заточенные на генерацию правдоподобного продолжения любой ценой.',
		shortDesc: 'Формируются H-Neurons — цепи для генерации правдоподобного продолжения.',
	},
	{
		id: 'sft', label: 'Instruction Tuning', shortLabel: 'SFT',
		icon: '📝', color: '#f59e0b', hNeuronStrength: 95,
		description: 'Модель учат следовать инструкциям и быть полезной. H-Neurons практически не затрагиваются — «инерция параметров». Изменение менее 5%.',
		shortDesc: 'H-Neurons не затрагиваются — «инерция параметров». Изменение менее 5%.',
	},
	{
		id: 'rlhf', label: 'RLHF / Alignment', shortLabel: 'RLHF',
		icon: '🛡️', color: '#3b82f6', hNeuronStrength: 88,
		description: 'Модель учат безопасности и аккуратности. H-Neurons всё ещё на месте. Alignment не перестраивает глубинные механизмы галлюцинаций.',
		shortDesc: 'H-Neurons всё ещё на месте. Alignment не перестраивает механизмы.',
	},
	{
		id: 'deploy', label: 'Deployment', shortLabel: 'Deploy',
		icon: '🚀', color: '#8b5cf6', hNeuronStrength: 85,
		description: 'Модель в продакшне. H-Neurons активны. Галлюцинации всё ещё происходят. Проблема зашита в фундаменте.',
		shortDesc: 'H-Neurons активны. Галлюцинации всё ещё происходят.',
	},
];

const NEURONS_PER_STAGE = 40;
const H_INDICES = new Set([3, 17, 31]);

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

export default function PretrainOriginViz() {
	const [activeStage, setActiveStage] = useState(0);
	const [auto, setAuto] = useState(true);
	const [pulse, setPulse] = useState(false);
	const mobile = useIsMobile();

	const advance = useCallback(() => {
		setActiveStage(prev => (prev + 1) % STAGES.length);
		setPulse(true);
		setTimeout(() => setPulse(false), 500);
	}, []);

	useEffect(() => {
		if (!auto) return;
		const id = setInterval(advance, 3000);
		return () => clearInterval(id);
	}, [auto, advance]);

	const stage = STAGES[activeStage];

	const selectStage = (i: number) => {
		setActiveStage(i);
		setAuto(false);
		setPulse(true);
		setTimeout(() => setPulse(false), 500);
	};

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
				🔬 Жизненный цикл H-Neurons
			</div>
			<div style={{
				fontSize: mobile ? '0.78rem' : '0.88rem', color: 'var(--text-muted)',
				marginBottom: '1rem', lineHeight: 1.5,
			}}>
				{mobile
					? 'H-Neurons проходят все этапы — и остаются.'
					: 'Смотри, как H-Neurons проходят все этапы обучения модели — и остаются на месте.'
				}
			</div>

			{/* Pipeline stages — 2×2 grid on mobile */}
			<div style={{
				display: 'grid',
				gridTemplateColumns: mobile ? 'repeat(4, 1fr)' : 'repeat(4, 1fr)',
				gap: mobile ? '0.3rem' : '0.5rem',
				marginBottom: '1rem',
			}}>
				{STAGES.map((s, i) => (
					<button
						key={s.id}
						onClick={() => selectStage(i)}
						style={{
							...tap,
							padding: mobile ? '0.5rem 0.25rem' : '0.75rem 0.85rem',
							borderRadius: mobile ? '8px' : '10px',
							border: `2px solid ${activeStage === i ? s.color : 'var(--border)'}`,
							background: activeStage === i ? `${s.color}15` : 'var(--bg-secondary)',
							cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.3s ease',
							display: 'flex', flexDirection: 'column' as const,
							alignItems: 'center', gap: mobile ? '0.15rem' : '0.3rem',
							minHeight: 44,
						}}
					>
						<span style={{ fontSize: mobile ? '1rem' : '1.3rem' }}>{s.icon}</span>
						<span style={{
							fontSize: mobile ? '0.58rem' : '0.72rem', fontWeight: 700,
							color: activeStage === i ? s.color : 'var(--text-muted)',
							whiteSpace: 'nowrap' as const, lineHeight: 1.2,
						}}>
							{mobile ? s.shortLabel : s.label}
						</span>
					</button>
				))}
			</div>

			{/* Progress dots */}
			<div style={{
				display: 'flex', alignItems: 'center', justifyContent: 'center',
				gap: mobile ? '0.3rem' : '0.5rem', marginBottom: '0.85rem',
			}}>
				{STAGES.map((s, i) => (
					<div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: mobile ? '0.3rem' : '0.5rem' }}>
						<div style={{
							width: mobile ? 22 : 36, height: mobile ? 22 : 36,
							borderRadius: '50%',
							background: i <= activeStage ? s.color : 'var(--bg-secondary)',
							border: `2px solid ${i <= activeStage ? s.color : 'var(--border)'}`,
							display: 'flex', alignItems: 'center', justifyContent: 'center',
							transition: 'all 0.5s ease',
							boxShadow: i === activeStage ? `0 0 10px ${s.color}44` : 'none',
						}}>
							<span style={{
								fontSize: mobile ? '0.5rem' : '0.7rem', fontWeight: 800,
								color: i <= activeStage ? 'white' : 'var(--text-muted)',
							}}>
								{i + 1}
							</span>
						</div>
						{i < STAGES.length - 1 && (
							<div style={{
								width: mobile ? 14 : 40, height: 2,
								background: i < activeStage
									? `linear-gradient(90deg, ${STAGES[i].color}, ${STAGES[i + 1].color})`
									: 'var(--border)',
								transition: 'all 0.5s ease',
							}} />
						)}
					</div>
				))}
			</div>

			{/* Neuron grid for current stage */}
			<div style={{
				padding: mobile ? '0.6rem' : '1rem', borderRadius: mobile ? '8px' : '10px',
				background: 'var(--bg-secondary)', border: '1px solid var(--border)',
				marginBottom: '0.75rem',
			}}>
				<div style={{
					display: 'flex', justifyContent: 'space-between', alignItems: 'center',
					marginBottom: '0.6rem', flexWrap: 'wrap' as const, gap: '0.3rem',
				}}>
					<span style={{ fontSize: mobile ? '0.72rem' : '0.78rem', fontWeight: 700, color: stage.color }}>
						{stage.icon} {mobile ? stage.shortLabel : stage.label}
					</span>
					<span style={{
						fontSize: mobile ? '0.62rem' : '0.72rem', fontWeight: 700,
						padding: '0.1rem 0.4rem', borderRadius: '4px',
						background: '#ef444418', border: '1px solid #ef444433', color: '#ef4444',
					}}>
						H-Neurons: {stage.hNeuronStrength}%
					</span>
				</div>

				{/* Mini neuron grid */}
				<div style={{
					display: 'grid',
					gridTemplateColumns: `repeat(${mobile ? 10 : 20}, 1fr)`,
					gap: mobile ? '2px' : '3px', marginBottom: '0.6rem',
				}}>
					{Array.from({ length: NEURONS_PER_STAGE }, (_, i) => {
						const isH = H_INDICES.has(i);
						const strength = stage.hNeuronStrength / 100;
						return (
							<div
								key={i}
								style={{
									aspectRatio: '1', borderRadius: mobile ? '2px' : '3px',
									background: isH ? `rgba(239, 68, 68, ${strength})` : 'var(--bg-card)',
									border: `1px solid ${isH ? `rgba(239, 68, 68, ${strength})` : 'var(--border)'}`,
									transition: 'all 0.5s ease',
									boxShadow: isH && pulse ? `0 0 6px rgba(239, 68, 68, ${strength * 0.6})` : 'none',
									transform: isH && pulse ? 'scale(1.3)' : 'scale(1)',
								}}
							/>
						);
					})}
				</div>

				<div style={{
					fontSize: mobile ? '0.75rem' : '0.84rem', color: 'var(--text)', lineHeight: 1.6,
				}}>
					{mobile ? stage.shortDesc : stage.description}
				</div>
			</div>

			{/* Strength comparison bars */}
			<div style={{
				padding: mobile ? '0.6rem' : '0.75rem 1rem', borderRadius: '8px',
				background: 'var(--bg-secondary)', border: '1px solid var(--border)',
			}}>
				<div style={{
					fontSize: mobile ? '0.62rem' : '0.72rem', fontWeight: 700,
					color: 'var(--text-muted)', textTransform: 'uppercase' as const,
					letterSpacing: '0.05em', marginBottom: '0.4rem',
				}}>
					Сила H-Neurons по этапам
				</div>
				{STAGES.map((s, i) => (
					<div key={s.id} style={{
						display: 'flex', alignItems: 'center',
						gap: mobile ? '0.3rem' : '0.5rem', marginBottom: '0.35rem',
					}}>
						<span style={{
							width: mobile ? 46 : 80, fontSize: mobile ? '0.6rem' : '0.68rem', fontWeight: 600,
							color: i === activeStage ? s.color : 'var(--text-muted)',
							textAlign: 'right' as const, flexShrink: 0,
							overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
						}}>
							{mobile ? s.shortLabel : s.label}
						</span>
						<div style={{
							flex: 1, height: mobile ? 14 : 16, borderRadius: '4px',
							background: 'var(--bg-card)', border: '1px solid var(--border)', overflow: 'hidden',
						}}>
							<div style={{
								height: '100%', borderRadius: '3px', width: `${s.hNeuronStrength}%`,
								background: i === activeStage
									? `linear-gradient(90deg, ${s.color}, #ef4444)` : '#ef444466',
								transition: 'all 0.5s ease', opacity: i <= activeStage ? 1 : 0.3,
							}} />
						</div>
						<span style={{
							fontSize: mobile ? '0.58rem' : '0.68rem', fontWeight: 800,
							width: mobile ? 28 : 32, textAlign: 'right' as const,
							color: i === activeStage ? '#ef4444' : 'var(--text-muted)',
							fontVariantNumeric: 'tabular-nums',
						}}>
							{s.hNeuronStrength}%
						</span>
					</div>
				))}
			</div>

			{/* Controls */}
			{!auto && (
				<div style={{ marginTop: '0.75rem' }}>
					<button
						onClick={() => setAuto(true)}
						style={{
							...tap,
							padding: '0 0.9rem', height: 44, minHeight: 44,
							borderRadius: '8px', border: '1px solid var(--border)',
							background: 'var(--bg-secondary)', color: 'var(--text)',
							fontSize: mobile ? '0.78rem' : '0.85rem', fontWeight: 600,
							cursor: 'pointer', fontFamily: 'inherit',
							display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
						}}
					>
						▶ Авто
					</button>
				</div>
			)}
		</div>
	);
}
