import { useState } from 'react';

// Поломка экстраполяции: за длиной обучения L_train угол m·θ уходит за пределы
// «обученной дуги» [0, θ·L_train] — модель таких углов не видела (OOD).
// Fix (Position Interpolation): m -> m·L_train/L_max, угол возвращается в обученную дугу.
// Иллюстративно: θ=0.05 рад/поз (медленное измерение), L_train=32, слайдер до L_max=128.
const THETA = 0.05;
const L_TRAIN = 32;
const L_MAX = 128;
const R = 64;
const CX = 78;
const CY = 78;

function polar(angle: number, r = R) {
	return { x: CX + r * Math.cos(angle), y: CY - r * Math.sin(angle) };
}

// SVG-дуга обученного диапазона [0, θ·L_train]
function arcPath(a0: number, a1: number, r = R) {
	const p0 = polar(a0, r);
	const p1 = polar(a1, r);
	const large = a1 - a0 > Math.PI ? 1 : 0;
	// sweep=0 т.к. y инвертирован (CCW в мат. системе = по часовой в SVG)
	return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 0 ${p1.x} ${p1.y}`;
}

const css = {
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.1rem', lineHeight: 1.6 } as React.CSSProperties,
	main: { display: 'flex', gap: '1.25rem', flexWrap: 'wrap' as const, alignItems: 'center' } as React.CSSProperties,
	controls: { flex: 1, minWidth: '240px' } as React.CSSProperties,
	sliderRow: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.7rem' } as React.CSSProperties,
	sliderLabel: { fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', minWidth: '78px' } as React.CSSProperties,
	slider: { flex: 1, accentColor: '#8b5cf6' } as React.CSSProperties,
	val: (color: string) => ({ fontSize: '0.9rem', fontWeight: 800, color, minWidth: '3ch', textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties),
	toggle: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', cursor: 'pointer' } as React.CSSProperties,
	verdict: (ok: boolean) => ({ padding: '0.7rem 0.9rem', borderRadius: '8px', background: ok ? '#22c55e10' : '#ef444410', border: `1px solid ${ok ? '#22c55e' : '#ef4444'}`, fontSize: '0.85rem', fontWeight: 700, color: ok ? '#22c55e' : '#ef4444', lineHeight: 1.4 } as React.CSSProperties),
	note: { marginTop: '0.9rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

export default function ExtrapolationBreakFix() {
	const [m, setM] = useState(64);
	const [fix, setFix] = useState(false);

	const effPos = fix ? m * (L_TRAIN / L_MAX) : m;
	const angle = effPos * THETA; // радианы
	const trainedMax = L_TRAIN * THETA; // край обученной дуги
	const inRange = angle <= trainedMax + 1e-9;
	const v = polar(angle);
	const color = inRange ? '#22c55e' : '#ef4444';
	const beyond = m > L_TRAIN;

	return (
		<div style={css.wrap}>
			<div style={css.title}>💥 Экстраполяция ломается — и как её чинят</div>
			<div style={css.desc}>Зелёная дуга — углы, которые модель видела при обучении (позиции 0…{L_TRAIN}). Двигай m за {L_TRAIN}: без патча стрелка уходит за дугу (OOD, красным). Включи интерполяцию позиций — позиция сжимается обратно в обученный диапазон. Иллюстративно, θ={THETA}.</div>

			<div style={css.main}>
				<svg width={CX * 2} height={CY * 2} role="img" aria-label={`угол ${(angle * 180 / Math.PI).toFixed(0)} градусов, ${inRange ? 'в диапазоне' : 'вне диапазона'}`}>
					<circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border)" strokeWidth="1.5" />
					<path d={arcPath(0, trainedMax)} fill="none" stroke="#22c55e" strokeWidth="6" strokeLinecap="round" opacity="0.55" />
					<line x1={CX} y1={CY} x2={v.x} y2={v.y} stroke={color} strokeWidth="3" strokeLinecap="round" />
					<circle cx={v.x} cy={v.y} r="4.5" fill={color} />
					<circle cx={CX} cy={CY} r="2.5" fill="var(--text-muted)" />
				</svg>

				<div style={css.controls}>
					<div style={css.sliderRow}>
						<span style={css.sliderLabel}>позиция m</span>
						<input style={css.slider} type="range" min={0} max={L_MAX} value={m} onChange={(e) => setM(Number(e.target.value))} />
						<span style={css.val('#8b5cf6')}>{m}</span>
					</div>
					<label style={css.toggle}>
						<input type="checkbox" checked={fix} onChange={(e) => setFix(e.target.checked)} style={{ accentColor: '#22c55e' }} />
						Интерполяция позиций (сжать позицию в обученный диапазон)
					</label>
					<div style={css.verdict(inRange)}>
						{inRange
							? (beyond ? `m=${m} > L_train, но угол вернулся в обученную дугу ✓` : `m=${m} ≤ L_train — угол в обученном диапазоне ✓`)
							: `m=${m} > L_train — угол вне обученной дуги, out-of-distribution ✗`}
					</div>
				</div>
			</div>

			<div style={css.note}>
				Простейший фикс — Position Interpolation (Chen, arXiv:2306.15595): позиция m отображается в m·L/L′, возвращаясь в обученный диапазон (LLaMA растянули до 32768 за &lt;1000 шагов дообучения). NTK-aware (community, bloc97) и YaRN (arXiv:2309.00071) делают это умнее — растягивают низкие частоты сильнее высоких (b′ = b·s^(|D|/(|D|−2))), плюс YaRN добавляет температуру внимания √(1/t) = 0.1·ln(s)+1.
			</div>
		</div>
	);
}
