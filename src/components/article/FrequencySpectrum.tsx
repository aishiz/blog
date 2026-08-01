// Спектр длин волн по измерениям: λ_i = 2π/θ_i, θ_i = 10000^(-2i/d).
// Для наглядности берём d=16 (8 пар) -> длины волн от единиц до десятков тысяч позиций.
// Бары в лог-масштабе, потому что диапазон охватывает ~4 порядка.
const D = 16;
const BASE = 10000;
const PAIRS = Array.from({ length: D / 2 }, (_, i) => {
	const theta = BASE ** (-2 * i / D);
	const wavelength = (2 * Math.PI) / theta;
	return { i, theta, wavelength };
});

const LOG_MIN = Math.log10(PAIRS[0].wavelength);
const LOG_MAX = Math.log10(PAIRS[PAIRS.length - 1].wavelength);

const css = {
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.6 } as React.CSSProperties,
	barRow: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' } as React.CSSProperties,
	barLabel: { width: '70px', flexShrink: 0, fontSize: '0.76rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties,
	barTrack: { flex: 1, height: '16px', borderRadius: '4px', background: 'var(--bg-secondary)', overflow: 'hidden' } as React.CSSProperties,
	barFill: (pct: number) => ({ width: `${Math.max(pct, 2)}%`, height: '100%', background: '#8b5cf6' } as React.CSSProperties),
	barVal: { width: '90px', flexShrink: 0, fontSize: '0.76rem', fontWeight: 700, color: 'var(--text)', textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties,
	ends: { display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.74rem', color: 'var(--text-muted)' } as React.CSSProperties,
	note: { marginTop: '0.9rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

export default function FrequencySpectrum() {
	return (
		<div style={css.wrap}>
			<div style={css.title}>🌈 Длины волн по измерениям (лог-масштаб)</div>
			<div style={css.desc}>Длина волны пары i — сколько позиций нужно на полный оборот: λ = 2π/θ. Низкие измерения крутятся часто (короткая волна), высокие — редко (длинная). Иллюстративно, d=16.</div>

			{PAIRS.map((p) => {
				const pct = ((Math.log10(p.wavelength) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100;
				return (
					<div key={p.i} style={css.barRow}>
						<span style={css.barLabel}>пара {p.i}</span>
						<div style={css.barTrack}><div style={css.barFill(pct)} /></div>
						<span style={css.barVal}>{p.wavelength < 100 ? p.wavelength.toFixed(1) : Math.round(p.wavelength).toLocaleString('ru-RU')}</span>
					</div>
				);
			})}

			<div style={css.ends}>
				<span>← высокая частота (близкие позиции)</span>
				<span>низкая частота (далёкие) →</span>
			</div>

			<div style={css.note}>Именно этот разброс масштабов даёт RoPE и близкие, и далёкие относительные расстояния сразу. Само слово «длина волны» для этих измерений закрепил пейпер YaRN (arXiv:2309.00071) — RoFormer называл это «long-term decay».</div>
		</div>
	);
}
