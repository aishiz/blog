import { useState } from 'react';

// Якорь: RoPE поворачивает пары измерений вектора на угол m·θ_i.
// θ_i = 10000^(-2i/d), d=8 -> θ = [1, 0.1, 0.01, 0.001] (иллюстративно).
// Слайдер позиции m крутит 4 вектора: низкие измерения (высокая частота) быстро,
// высокие измерения (низкая частота) медленно.
const D = 8;
const BASE = 10000;
const PAIRS = Array.from({ length: D / 2 }, (_, i) => ({
	i,
	theta: BASE ** (-2 * i / D),
	wavelength: (2 * Math.PI) / (BASE ** (-2 * i / D)),
}));

const R = 34; // радиус кружка
const CX = 44;
const CY = 44;

const css = {
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.1rem', lineHeight: 1.6 } as React.CSSProperties,
	dials: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' as const, marginBottom: '1.1rem' } as React.CSSProperties,
	dial: { textAlign: 'center' as const } as React.CSSProperties,
	dialLabel: { fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties,
	sliderRow: { display: 'flex', alignItems: 'center', gap: '0.75rem' } as React.CSSProperties,
	sliderLabel: { fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', minWidth: '72px' } as React.CSSProperties,
	slider: { flex: 1, accentColor: '#8b5cf6' } as React.CSSProperties,
	posVal: { fontSize: '0.9rem', fontWeight: 800, color: '#8b5cf6', minWidth: '2.5ch', textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties,
	note: { marginTop: '0.9rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

export default function RopeRotation() {
	const [m, setM] = useState(8);

	return (
		<div style={css.wrap}>
			<div style={css.title}>🎡 RoPE: поворот вектора на угол m·θ</div>
			<div style={css.desc}>Каждая пара измерений вращается со своей частотой θ. Двигай позицию m — низкие измерения (высокая частота) крутятся быстро, высокие (низкая частота) едва ползут. Иллюстративно, d=8.</div>

			<div style={css.dials}>
				{PAIRS.map((p) => {
					const ang = m * p.theta; // радианы
					const x2 = CX + R * Math.cos(ang);
					const y2 = CY - R * Math.sin(ang); // SVG y вниз -> минус для CCW
					const deg = ((ang * 180 / Math.PI) % 360 + 360) % 360;
					return (
						<div key={p.i} style={css.dial}>
							<svg width={CX * 2} height={CY * 2} role="img" aria-label={`пара ${p.i}, угол ${deg.toFixed(0)} градусов`}>
								<circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border)" strokeWidth="1.5" />
								<line x1={CX} y1={CY} x2={x2} y2={y2} stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />
								<circle cx={x2} cy={y2} r="3.5" fill="#8b5cf6" />
								<circle cx={CX} cy={CY} r="2.5" fill="var(--text-muted)" />
							</svg>
							<div style={css.dialLabel}>пара {p.i}<br />θ={p.theta.toLocaleString('en', { maximumSignificantDigits: 1 })}<br />{deg.toFixed(0)}°</div>
						</div>
					);
				})}
			</div>

			<div style={css.sliderRow}>
				<span style={css.sliderLabel}>позиция m</span>
				<input style={css.slider} type="range" min={0} max={64} value={m} onChange={(e) => setM(Number(e.target.value))} />
				<span style={css.posVal}>{m}</span>
			</div>

			<div style={css.note}>Угол пары i на позиции m равен m·θ_i, где θ_i = 10000^(−2i/d) (RoFormer, arXiv:2104.09864). Разброс частот по измерениям и есть то, что позже назовут «длинами волн» RoPE — от коротких к длинным.</div>
		</div>
	);
}
