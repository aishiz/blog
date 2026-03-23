import { useState, useEffect, useCallback, useMemo } from 'react';

const TOTAL = 1000;
const H_COUNT = 3;

function pickRandom(total: number, count: number): Set<number> {
	const s = new Set<number>();
	while (s.size < count) s.add(Math.floor(Math.random() * total));
	return s;
}

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

export default function NeuronGrid() {
	const [hNeurons, setHNeurons] = useState<Set<number>>(() => pickRandom(TOTAL, H_COUNT));
	const [pulse, setPulse] = useState(false);
	const [showAll, setShowAll] = useState(false);
	const [auto, setAuto] = useState(true);
	const mobile = useIsMobile();

	const shuffle = useCallback(() => {
		setPulse(true);
		setHNeurons(pickRandom(TOTAL, H_COUNT));
		setTimeout(() => setPulse(false), 600);
	}, []);

	useEffect(() => {
		if (!auto) return;
		const id = setInterval(shuffle, 2200);
		return () => clearInterval(id);
	}, [auto, shuffle]);

	const cols = mobile ? 20 : 40;
	const size = mobile ? 11 : 11;
	const gap = 2;

	const activeSet = useMemo(() => {
		if (showAll) {
			const s = new Set<number>();
			for (let i = 0; i < TOTAL; i++) s.add(i);
			return s;
		}
		return hNeurons;
	}, [showAll, hNeurons]);

	const btnStyle = (active = false): React.CSSProperties => ({
		...tap,
		padding: '0 0.9rem',
		height: 44, minHeight: 44,
		borderRadius: '8px',
		border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
		background: active ? 'var(--accent-glow)' : 'var(--bg-secondary)',
		color: active ? 'var(--accent-light)' : 'var(--text)',
		fontSize: mobile ? '0.78rem' : '0.85rem',
		fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
		transition: 'all 0.2s ease',
		display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
		flexShrink: 0,
	});

	return (
		<div style={{
			margin: mobile ? '1.25em -0.25rem' : '1.75em 0',
			padding: mobile ? '0.75rem' : '1.5rem',
			borderRadius: mobile ? '10px' : '12px',
			border: '1px solid var(--border)',
			background: 'var(--bg-card)',
		}}>
			<div style={{
				fontSize: mobile ? '0.78rem' : '0.85rem', fontWeight: 700, color: 'var(--accent-light)',
				textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.4rem',
			}}>
				🧠 Нейронная сетка — 1000 нейронов
			</div>
			<div style={{
				fontSize: mobile ? '0.78rem' : '0.88rem', color: 'var(--text-muted)',
				marginBottom: '0.85rem', lineHeight: 1.5,
			}}>
				Каждая точка — нейрон. <span style={{ color: '#ef4444', fontWeight: 700 }}>Красные</span> — H-Neurons ({H_COUNT} из {TOTAL} = {(H_COUNT / TOTAL * 100).toFixed(1)}%).
			</div>

			{/* Grid with safe overflow */}
			<div style={{
				overflowX: 'auto', marginBottom: '0.85rem',
				WebkitOverflowScrolling: 'touch' as unknown as undefined,
				paddingBottom: '2px',
			}}>
				<div style={{
					display: 'grid',
					gridTemplateColumns: `repeat(${cols}, ${size}px)`,
					gap: `${gap}px`,
					width: 'fit-content',
					minWidth: 0,
				}}>
					{Array.from({ length: TOTAL }, (_, i) => {
						const isH = hNeurons.has(i);
						return (
							<div
								key={i}
								style={{
									width: size, height: size, borderRadius: '50%',
									background: isH ? '#ef4444'
										: showAll ? 'var(--accent)' : 'var(--bg-secondary)',
									border: `1px solid ${isH ? '#ef4444' : showAll ? 'var(--accent)' : 'var(--border)'}`,
									transition: 'all 0.4s ease',
									boxShadow: isH ? `0 0 ${pulse ? '10px' : '5px'} ${pulse ? '#ef444488' : '#ef444444'}` : 'none',
									transform: isH && pulse ? 'scale(1.6)' : 'scale(1)',
									opacity: showAll && !isH ? 0.4 : 1,
									zIndex: isH ? 10 : 1,
									position: 'relative' as const,
								}}
							/>
						);
					})}
				</div>
			</div>

			{/* Stats */}
			<div style={{
				display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
				gap: mobile ? '0.5rem' : '0.75rem', marginBottom: '0.85rem',
			}}>
				{[
					{ label: 'Всего нейронов', val: TOTAL.toLocaleString(), color: 'var(--text)' },
					{ label: 'H-Neurons', val: H_COUNT.toString(), color: '#ef4444' },
					{ label: 'Доля', val: `${(H_COUNT / TOTAL * 100).toFixed(1)}%`, gradient: true },
				].map(s => (
					<div key={s.label} style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.1rem' }}>
						<span style={{
							fontSize: mobile ? '1.05rem' : '1.4rem', fontWeight: 900,
							...('gradient' in s && s.gradient ? {
								background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
								WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
							} : { color: ('color' in s ? s.color : undefined) as string }),
						}}>
							{s.val}
						</span>
						<span style={{
							fontSize: mobile ? '0.62rem' : '0.7rem', color: 'var(--text-muted)',
							textTransform: 'uppercase' as const, letterSpacing: '0.04em', fontWeight: 600,
							lineHeight: 1.2,
						}}>{s.label}</span>
					</div>
				))}
			</div>

			{/* Buttons */}
			<div style={{
				display: 'flex', gap: '0.4rem',
				flexWrap: 'wrap' as const,
			}}>
				<button onClick={() => { shuffle(); setAuto(false); }} style={btnStyle()}>
					🔄 Новый токен
				</button>
				<button onClick={() => setShowAll(p => !p)} style={btnStyle(showAll)}>
					{showAll ? '👁 Скрыть' : '👁 Все 1000'}
				</button>
				{!auto && (
					<button onClick={() => setAuto(true)} style={btnStyle()}>▶ Авто</button>
				)}
			</div>
		</div>
	);
}
