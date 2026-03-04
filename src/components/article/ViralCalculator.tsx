import { useState, useEffect } from 'react';

const PERIODS = [
	{ label: 'Первые 48 часов', from: 0, to: 10000, hours: 48, color: '#3b82f6' },
	{ label: 'Янв 12 → Янв 27', from: 0, to: 40000, hours: 15 * 24, color: '#8b5cf6' },
	{ label: 'Янв 27 → Янв 30 (ребрендинг)', from: 40000, to: 100000, hours: 3 * 24, color: '#ff6b2b' },
	{ label: 'Янв 30 → Фев 5', from: 100000, to: 150000, hours: 6 * 24, color: '#f59e0b' },
	{ label: 'Фев 5 → Фев 15 (OpenAI)', from: 150000, to: 196000, hours: 10 * 24, color: '#10b981' },
	{ label: 'Фев 15 → Мар 1 (#1)', from: 196000, to: 250000, hours: 14 * 24, color: '#ef4444' },
	{ label: 'Весь период (48 дней)', from: 0, to: 250000, hours: 48 * 24, color: '#ff6b2b' },
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

function fmt(n: number) {
	if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
	return n.toFixed(n < 10 ? 1 : 0);
}

export default function ViralCalculator() {
	const [sel, setSel] = useState(0);
	const mobile = useIsMobile();
	const p = PERIODS[sel];
	const gained = p.to - p.from;
	const perHour = gained / p.hours;
	const perMin = perHour / 60;
	const perDay = perHour * 24;

	return (
		<div style={{
			margin: '1.75em 0', padding: mobile ? '0.85rem' : '1.5rem',
			borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)',
		}}>
			<div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
				🧮 Калькулятор вирусности
			</div>
			<div style={{ fontSize: mobile ? '0.78rem' : '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
				Выбери период — посмотри скорость набора звёзд
			</div>

			{/* Period selector */}
			<div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '0.4rem', marginBottom: '1.25rem' }}>
				{PERIODS.map((pr, i) => (
					<button
						key={i}
						onClick={() => setSel(i)}
						style={{
							padding: mobile ? '0.35rem 0.6rem' : '0.4rem 0.8rem',
							borderRadius: '7px',
							border: `1.5px solid ${sel === i ? pr.color : 'var(--border)'}`,
							background: sel === i ? `${pr.color}15` : 'transparent',
							color: sel === i ? pr.color : 'var(--text-muted)',
							fontSize: mobile ? '0.7rem' : '0.78rem',
							fontWeight: sel === i ? 700 : 500,
							cursor: 'pointer',
							transition: 'all 0.2s ease',
							WebkitTapHighlightColor: 'transparent',
						}}
					>
						{pr.label}
					</button>
				))}
			</div>

			{/* Results */}
			<div style={{
				display: 'grid',
				gridTemplateColumns: mobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr',
				gap: '0.6rem',
			}}>
				{[
					{ label: 'Набрано звёзд', value: `+${fmt(gained)}`, sub: `${fmt(p.from)} → ${fmt(p.to)}` },
					{ label: 'В день', value: fmt(perDay), sub: 'звёзд/день' },
					{ label: 'В час', value: fmt(perHour), sub: 'звёзд/час' },
					{ label: 'В минуту', value: fmt(perMin), sub: 'звёзд/мин' },
				].map((card, i) => (
					<div key={i} style={{
						padding: mobile ? '0.7rem' : '0.85rem',
						borderRadius: '8px',
						border: `1px solid ${p.color}25`,
						background: `${p.color}06`,
						textAlign: 'center' as const,
					}}>
						<div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.03em', marginBottom: '0.3rem' }}>
							{card.label}
						</div>
						<div style={{ fontSize: mobile ? '1.2rem' : '1.4rem', fontWeight: 900, color: p.color, fontVariantNumeric: 'tabular-nums' }}>
							{card.value}
						</div>
						<div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
							{card.sub}
						</div>
					</div>
				))}
			</div>

			{/* Fun comparison */}
			<div style={{
				marginTop: '1rem', padding: mobile ? '0.65rem' : '0.85rem',
				borderRadius: '8px', background: `${p.color}08`, border: `1px solid ${p.color}15`,
				fontSize: mobile ? '0.78rem' : '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5,
				display: 'flex', alignItems: 'center', gap: '0.5rem',
			}}>
				<span style={{ fontSize: '1.1rem', flexShrink: 0 }}>💡</span>
				<span>
					За этот период OpenClaw набирал <strong style={{ color: p.color }}>{fmt(perHour)} звёзд в час</strong> — это {perMin >= 1 ? `больше ${Math.floor(perMin)} звёзд каждую минуту` : `звезда каждые ${Math.round(60 / perMin)} минут`}.
					{perDay > 5000 && ' Большинство проектов не набирают столько за всё время существования.'}
				</span>
			</div>
		</div>
	);
}
