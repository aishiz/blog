import { useState } from 'react';

// Свойство относительности RoPE: dot-product повёрнутых запроса (поз. m) и ключа (поз. n)
// зависит только от разности фаз (m−n)·θ, а не от абсолютных m, n. Одна частота θ для наглядности.
const THETA = 0.35; // рад/позицию, иллюстративно
const R = 60;
const CX = 74;
const CY = 74;

function vec(angle: number) {
	return { x: CX + R * Math.cos(angle), y: CY - R * Math.sin(angle) };
}

const css = {
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.1rem', lineHeight: 1.6 } as React.CSSProperties,
	main: { display: 'flex', gap: '1.25rem', flexWrap: 'wrap' as const, alignItems: 'center' } as React.CSSProperties,
	sliders: { flex: 1, minWidth: '220px' } as React.CSSProperties,
	sliderRow: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.7rem' } as React.CSSProperties,
	sliderLabel: (color: string) => ({ fontSize: '0.82rem', fontWeight: 700, color, minWidth: '78px' } as React.CSSProperties),
	slider: (color: string) => ({ flex: 1, accentColor: color } as React.CSSProperties),
	val: (color: string) => ({ fontSize: '0.9rem', fontWeight: 800, color, minWidth: '2.5ch', textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties),
	diff: { marginTop: '0.5rem', padding: '0.7rem 0.9rem', borderRadius: '8px', background: '#22c55e10', border: '1px solid #22c55e', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 } as React.CSSProperties,
	note: { marginTop: '0.9rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

export default function RelativePhase() {
	const [m, setM] = useState(7);
	const [n, setN] = useState(3);
	const am = m * THETA;
	const an = n * THETA;
	const qv = vec(am);
	const kv = vec(an);
	const diffDeg = (((m - n) * THETA * 180 / Math.PI) % 360 + 360) % 360;

	return (
		<div style={css.wrap}>
			<div style={css.title}>🧭 Важна разность фаз, а не абсолютные позиции</div>
			<div style={css.desc}>Запрос на позиции m (фиолетовый) и ключ на позиции n (синий). Скалярное произведение RoPE зависит только от угла между ними — то есть от (m−n). Сдвинь m и n на одинаковую величину — разность не изменится.</div>

			<div style={css.main}>
				<svg width={CX * 2} height={CY * 2} role="img" aria-label={`разность фаз ${diffDeg.toFixed(0)} градусов`}>
					<circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border)" strokeWidth="1.5" />
					<line x1={CX} y1={CY} x2={qv.x} y2={qv.y} stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />
					<circle cx={qv.x} cy={qv.y} r="4" fill="#8b5cf6" />
					<line x1={CX} y1={CY} x2={kv.x} y2={kv.y} stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
					<circle cx={kv.x} cy={kv.y} r="4" fill="#3b82f6" />
					<circle cx={CX} cy={CY} r="2.5" fill="var(--text-muted)" />
				</svg>

				<div style={css.sliders}>
					<div style={css.sliderRow}>
						<span style={css.sliderLabel('#8b5cf6')}>запрос m</span>
						<input style={css.slider('#8b5cf6')} type="range" min={0} max={24} value={m} onChange={(e) => setM(Number(e.target.value))} />
						<span style={css.val('#8b5cf6')}>{m}</span>
					</div>
					<div style={css.sliderRow}>
						<span style={css.sliderLabel('#3b82f6')}>ключ n</span>
						<input style={css.slider('#3b82f6')} type="range" min={0} max={24} value={n} onChange={(e) => setN(Number(e.target.value))} />
						<span style={css.val('#3b82f6')}>{n}</span>
					</div>
					<div style={css.diff}>Разность фаз = (m−n)·θ = ({m}−{n})·θ → <strong>{diffDeg.toFixed(0)}°</strong>. Именно от неё зависит dot-product, не от m и n по отдельности.</div>
				</div>
			</div>

			<div style={css.note}>Формально: ⟨f_q(x_m, m), f_k(x_n, n)⟩ = g(x_m, x_n, m−n) (RoFormer, Eq. 11) — внутреннее произведение зависит только от относительного сдвига m−n. Поэтому RoPE — относительное кодирование, хоть и задаётся через абсолютную позицию.</div>
		</div>
	);
}
