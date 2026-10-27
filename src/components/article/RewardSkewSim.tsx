import { useState } from 'react';

// Игрушка, а не модель ChatGPT: словарь из «delve» и трёх нейтральных синонимов.
// Оптимум KL-регуляризованной задачи max E[r] − β·KL(π‖π_ref) в закрытой форме:
// π*(w) ∝ π_ref(w)·exp(r(w)/β). У всех слов одинаковое качество, у «delve» бонус ε,
// поэтому логит delve сдвигается ровно на ε/β, а шансы умножаются на exp(ε/β).
// Проверочная точка: p_ref = 1%, ε = 0.5 → β=2: 1.28%, β=0.5: 2.67%, β=0.1: 60.0%.
const WORDS = ['delve', 'explore', 'examine', 'look into'];

// Слайдеры с логарифмической шкалой: позиция 0..100 → значение
const logScale = (min: number, max: number) => ({
	toVal: (pos: number) => Math.exp(Math.log(min) + (pos / 100) * (Math.log(max) - Math.log(min))),
	toPos: (val: number) => (100 * (Math.log(val) - Math.log(min))) / (Math.log(max) - Math.log(min)),
});
const P_SCALE = logScale(0.001, 0.2);
const B_SCALE = logScale(0.05, 2);

function optimum(pRef: number, eps: number, beta: number) {
	// log-sum-exp ради устойчивости при маленьком β
	const logTilt = Math.log(pRef) + eps / beta;
	const logRest = Math.log(1 - pRef);
	const m = Math.max(logTilt, logRest);
	const logZ = m + Math.log(Math.exp(logTilt - m) + Math.exp(logRest - m));
	return Math.exp(logTilt - logZ);
}

function fmtPct(p: number) {
	const v = p * 100;
	if (v >= 10) return `${v.toFixed(1)}%`;
	if (v >= 1) return `${v.toFixed(2)}%`;
	return `${v.toFixed(3)}%`;
}

const css = {
	wrap: {
		margin: '1.75em 0',
		padding: '1.5rem',
		borderRadius: '12px',
		border: '1px solid var(--border)',
		background: 'var(--bg-card)',
	} as React.CSSProperties,
	title: {
		fontSize: '0.85rem',
		fontWeight: 700,
		color: 'var(--accent-light)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.04em',
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.6 } as React.CSSProperties,
	ctl: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' } as React.CSSProperties,
	label: {
		width: '118px',
		flexShrink: 0,
		fontSize: '0.78rem',
		fontWeight: 700,
		color: 'var(--accent)',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
	} as React.CSSProperties,
	slider: { flex: 1, minWidth: 0, accentColor: 'var(--accent)' } as React.CSSProperties,
	num: {
		width: '58px',
		flexShrink: 0,
		fontSize: '0.8rem',
		fontWeight: 800,
		textAlign: 'right' as const,
		fontVariantNumeric: 'tabular-nums' as const,
		color: 'var(--text)',
	} as React.CSSProperties,
	panelTitle: {
		fontSize: '0.72rem',
		fontWeight: 800,
		textTransform: 'uppercase' as const,
		letterSpacing: '0.05em',
		color: 'var(--text-secondary)',
		margin: '1.2rem 0 0.5rem',
	} as React.CSSProperties,
	row: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' } as React.CSSProperties,
	tok: {
		width: '72px',
		flexShrink: 0,
		fontSize: '0.76rem',
		fontWeight: 600,
		color: 'var(--text)',
		whiteSpace: 'nowrap' as const,
	} as React.CSSProperties,
	track: { height: '10px', borderRadius: '4px', background: 'var(--bg-secondary)', overflow: 'hidden' } as React.CSSProperties,
	fill: (pct: number, color: string) =>
		({ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.15s ease' }) as React.CSSProperties,
	val: {
		width: '58px',
		flexShrink: 0,
		fontSize: '0.74rem',
		fontWeight: 700,
		textAlign: 'right' as const,
		fontVariantNumeric: 'tabular-nums' as const,
		color: 'var(--text-secondary)',
	} as React.CSSProperties,
	readout: {
		marginTop: '1.1rem',
		padding: '0.75rem 0.9rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		fontSize: '0.85rem',
		color: 'var(--text)',
		lineHeight: 1.6,
	} as React.CSSProperties,
	note: { marginTop: '0.9rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

function BetaCurve({ pRef, eps, beta }: { pRef: number; eps: number; beta: number }) {
	const W = 560;
	const H = 150;
	const pad = { l: 40, r: 12, t: 10, b: 24 };
	const N = 80;
	const xOf = (pos: number) => pad.l + (pos / 100) * (W - pad.l - pad.r);
	const yOf = (p: number) => pad.t + (1 - p) * (H - pad.t - pad.b);
	const pts = Array.from({ length: N + 1 }, (_, i) => {
		const pos = (i / N) * 100;
		return `${xOf(pos)},${yOf(optimum(pRef, eps, B_SCALE.toVal(pos)))}`;
	}).join(' ');
	const cur = B_SCALE.toPos(beta);
	return (
		<svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img"
			aria-label="Итоговая вероятность delve в зависимости от β">
			{[0, 0.5, 1].map((p) => (
				<g key={p}>
					<line x1={pad.l} x2={W - pad.r} y1={yOf(p)} y2={yOf(p)} stroke="var(--border)" />
					<text x={pad.l - 6} y={yOf(p) + 4} textAnchor="end" fontSize={13} fill="var(--text-muted)">{p * 100}%</text>
				</g>
			))}
			{[0.05, 0.1, 0.5, 1, 2].map((b) => (
				<text key={b} x={xOf(B_SCALE.toPos(b))} y={H - 6} textAnchor="middle" fontSize={13} fill="var(--text-muted)">β={b}</text>
			))}
			<line x1={pad.l} x2={W - pad.r} y1={yOf(pRef)} y2={yOf(pRef)} stroke="var(--text-muted)" strokeDasharray="4 4" />
			<polyline fill="none" stroke="var(--accent)" strokeWidth={2.5} points={pts} />
			<circle cx={xOf(cur)} cy={yOf(optimum(pRef, eps, beta))} r={5} fill="var(--accent)" />
		</svg>
	);
}

export default function RewardSkewSim() {
	const [pRef, setPRef] = useState(0.01);
	const [eps, setEps] = useState(0.5);
	const [beta, setBeta] = useState(0.5);

	const pX = optimum(pRef, eps, beta);
	const rest = (1 - pX) / (WORDS.length - 1);
	const refRest = (1 - pRef) / (WORDS.length - 1);
	const oddsMult = Math.exp(eps / beta);
	const maxBar = Math.max(pX, rest, pRef, refRest);

	return (
		<div style={css.wrap}>
			<div style={css.title}>🎯 Маленький бонус, большой перекос</div>
			<div style={css.desc}>
				Игрушечный словарь из четырёх синонимов. По качеству они равны, но reward model чуть-чуть любит «delve»
				и даёт ему бонус ε. Policy после RLHF ищет компромисс между reward и KL-штрафом к исходной модели с
				силой β. Крути и смотри, сколько «delve» станет в итоге.
			</div>

			<div style={css.ctl}>
				<span style={css.label}>p_ref(delve)</span>
				<input style={css.slider} type="range" min={0} max={100} step={0.5} value={P_SCALE.toPos(pRef)}
					onChange={(e) => setPRef(P_SCALE.toVal(Number(e.target.value)))} />
				<span style={css.num}>{fmtPct(pRef)}</span>
			</div>
			<div style={css.ctl}>
				<span style={css.label}>бонус ε</span>
				<input style={css.slider} type="range" min={0} max={1} step={0.01} value={eps}
					onChange={(e) => setEps(Number(e.target.value))} />
				<span style={css.num}>{eps.toFixed(2)}</span>
			</div>
			<div style={css.ctl}>
				<span style={css.label}>KL-штраф β</span>
				<input style={css.slider} type="range" min={0} max={100} step={0.5} value={B_SCALE.toPos(beta)}
					onChange={(e) => setBeta(B_SCALE.toVal(Number(e.target.value)))} />
				<span style={css.num}>{beta.toFixed(2)}</span>
			</div>

			<div style={css.panelTitle}>до RLHF → после</div>
			{WORDS.map((w, i) => {
				const before = i === 0 ? pRef : refRest;
				const after = i === 0 ? pX : rest;
				const color = i === 0 ? 'var(--accent)' : 'var(--text-muted)';
				return (
					<div key={w} style={css.row}>
						<span style={css.tok}>{w}</span>
						<div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
							<div style={css.track}><div style={css.fill((before / maxBar) * 100, 'var(--border-light)')} /></div>
							<div style={css.track}><div style={css.fill((after / maxBar) * 100, color)} /></div>
						</div>
						<span style={css.val}>{fmtPct(after)}</span>
					</div>
				);
			})}

			<div style={css.panelTitle}>delve после RLHF при разных β (пунктир: до)</div>
			<BetaCurve pRef={pRef} eps={eps} beta={beta} />

			<div style={css.readout}>
				Логит «delve» сдвинулся на ε/β = <strong>{(eps / beta).toFixed(2)}</strong>, шансы умножились на{' '}
				<strong>×{oddsMult < 1000 ? oddsMult.toFixed(1) : oddsMult.toExponential(1)}</strong>. Было{' '}
				<strong>{fmtPct(pRef)}</strong>, стало <strong>{fmtPct(pX)}</strong>
				{pX / pRef >= 1.05 && <> (в {(pX / pRef).toFixed(1)} раза больше)</>}.
			</div>

			<div style={css.note}>
				Это закрытая формула оптимума π*(w) ∝ π_ref(w)·exp(r(w)/β), а не прогон PPO и не реконструкция
				ChatGPT: ни reward model, ни β у OpenAI мы не знаем. Важна форма: бонус работает через ε/β, поэтому
				«маленький» он или нет, зависит от β. KL-штраф делает перекос дорогим, но не запрещает его.
			</div>
		</div>
	);
}
