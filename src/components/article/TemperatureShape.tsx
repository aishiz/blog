import { useState, useEffect } from 'react';

// Иллюстративный пример для подсказки «На улице сегодня ___». Логиты выдуманы для
// наглядности (не связаны с распределением «кот сидит на ___» из SamplingPlayground),
// механика — настоящая. Порядок фиксирован по убыванию логита.
const TOKENS = [
	{ t: 'солнечно', l: 2.8 },
	{ t: 'тепло', l: 2.5 },
	{ t: 'ветрено', l: 1.9 },
	{ t: 'пасмурно', l: 1.0 },
	{ t: 'дождливо', l: 0.4 },
	{ t: 'снежно', l: -0.6 },
	{ t: 'шторм', l: -1.8 },
];

const MIN_T = 0.1;
const MAX_T = 2;
const STEP_T = 0.1;

// Компрессивная (symlog-подобная) шкала левой панели: pct = 50 * |v| / (|v| + K).
// Бар асимптотически приближается к краю трека, но никогда в него не «упирается» —
// в отличие от жёсткого клампа, тут видно движение на всём диапазоне T, включая
// T → 0.1, где отношение лидер/второе место взлетает сильнее всего. K = модуль
// самого большого логита, чтобы дефолтный вид при T = 1 был близок к линейному.
const MAX_ABS_LOGIT = Math.max(...TOKENS.map((tk) => Math.abs(tk.l)));
const AXIS_K = MAX_ABS_LOGIT;

function softmax(logits: number[]): number[] {
	const max = Math.max(...logits);
	const exps = logits.map((z) => Math.exp(z - max));
	const sum = exps.reduce((a, b) => a + b, 0);
	return exps.map((e) => e / sum);
}

function useIsMobile(breakpoint = 560) {
	const [m, setM] = useState(false);
	useEffect(() => {
		const check = () => setM(window.innerWidth <= breakpoint);
		check();
		window.addEventListener('resize', check, { passive: true });
		return () => window.removeEventListener('resize', check);
	}, [breakpoint]);
	return m;
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
	desc: {
		fontSize: '0.88rem',
		color: 'var(--text-muted)',
		marginBottom: '1.25rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	panels: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: '1.25rem',
	} as React.CSSProperties,
	panelsMobile: {
		gridTemplateColumns: '1fr',
		gap: '1.5rem',
	} as React.CSSProperties,
	panelTitle: {
		fontSize: '0.72rem',
		fontWeight: 800,
		textTransform: 'uppercase' as const,
		letterSpacing: '0.05em',
		color: 'var(--text-secondary)',
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	row: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
		marginBottom: '0.32rem',
	} as React.CSSProperties,
	tok: {
		width: '72px',
		flexShrink: 0,
		fontSize: '0.76rem',
		fontWeight: 600,
		color: 'var(--text)',
		whiteSpace: 'nowrap' as const,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
	} as React.CSSProperties,
	logitTrack: {
		position: 'relative' as const,
		flex: 1,
		height: '14px',
		borderRadius: '4px',
		background: 'var(--bg-secondary)',
		overflow: 'hidden',
	} as React.CSSProperties,
	zeroLine: {
		position: 'absolute' as const,
		left: '50%',
		top: 0,
		bottom: 0,
		width: '1px',
		background: 'var(--border-light)',
	} as React.CSSProperties,
	logitBar: (pct: number, positive: boolean) => ({
		position: 'absolute' as const,
		top: 0,
		bottom: 0,
		left: positive ? '50%' : `${50 - pct}%`,
		width: `${pct}%`,
		background: positive ? '#22c55e' : '#ef4444',
		transition: 'left 0.15s ease, width 0.15s ease',
	} as React.CSSProperties),
	track: {
		flex: 1,
		height: '14px',
		borderRadius: '4px',
		background: 'var(--bg-secondary)',
		overflow: 'hidden',
	} as React.CSSProperties,
	fill: (pct: number, color: string) => ({
		width: `${pct}%`,
		height: '100%',
		background: color,
		transition: 'width 0.15s ease, background 0.2s ease',
	} as React.CSSProperties),
	// Общий стиль числового значения в конце строки — используется и логит-панелью,
	// и панелью вероятностей (раньше это были два идентичных объекта).
	numVal: {
		width: '48px',
		flexShrink: 0,
		fontSize: '0.74rem',
		fontWeight: 700,
		textAlign: 'right' as const,
		fontVariantNumeric: 'tabular-nums' as const,
		color: 'var(--text-secondary)',
	} as React.CSSProperties,
	controls: {
		marginTop: '1.25rem',
	} as React.CSSProperties,
	ctl: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.6rem',
	} as React.CSSProperties,
	label: {
		width: '96px',
		flexShrink: 0,
		fontSize: '0.78rem',
		fontWeight: 700,
		color: 'var(--accent)',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
	} as React.CSSProperties,
	slider: { flex: 1, accentColor: 'var(--accent)' } as React.CSSProperties,
	num: {
		width: '40px',
		flexShrink: 0,
		fontSize: '0.8rem',
		fontWeight: 800,
		textAlign: 'right' as const,
		fontVariantNumeric: 'tabular-nums' as const,
		color: 'var(--text)',
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
	note: {
		marginTop: '0.9rem',
		fontSize: '0.8rem',
		color: 'var(--text-muted)',
		lineHeight: 1.6,
	} as React.CSSProperties,
};

export default function TemperatureShape() {
	const [temp, setTemp] = useState(1);
	const mobile = useIsMobile();

	const scaled = TOKENS.map((tk) => tk.l / temp);
	const probs = softmax(scaled);

	const order = probs.map((_, i) => i).sort((a, b) => probs[b] - probs[a]);
	const leaderIdx = order[0];
	const runnerIdx = order[1];
	const ratio = probs[leaderIdx] / probs[runnerIdx];

	return (
		<div style={css.wrap}>
			<div style={css.title}>🌡 Форма распределения</div>
			<div style={css.desc}>
				Один набор логитов для подсказки «На улице сегодня ___» (токены и цифры иллюстративные). Слева —
				логиты, поделённые на температуру, справа — то, что из них делает softmax. Крути ползунок и смотри,
				как левая шкала растягивается или сжимается, а правая — заостряется или расплющивается вслед за ней.
			</div>

			<div style={{ ...css.panels, ...(mobile ? css.panelsMobile : {}) }}>
				<div>
					<div style={css.panelTitle}>логит / T</div>
					{TOKENS.map((tk, i) => {
						const v = scaled[i];
						const positive = v >= 0;
						const pct = (50 * Math.abs(v)) / (Math.abs(v) + AXIS_K);
						return (
							<div key={tk.t} style={css.row}>
								<span style={css.tok}>{tk.t}</span>
								<div style={css.logitTrack}>
									<div style={css.zeroLine} />
									<div style={css.logitBar(pct, positive)} />
								</div>
								<span style={css.numVal}>{v.toFixed(1)}</span>
							</div>
						);
					})}
				</div>

				<div>
					<div style={css.panelTitle}>вероятность</div>
					{TOKENS.map((tk, i) => {
						const p = probs[i];
						const color =
							i === leaderIdx ? 'var(--accent)' : i === runnerIdx ? 'var(--accent-secondary)' : 'var(--text-muted)';
						return (
							<div key={tk.t} style={css.row}>
								<span style={css.tok}>{tk.t}</span>
								<div style={css.track}>
									<div style={css.fill(p * 100, color)} />
								</div>
								<span style={css.numVal}>{(p * 100).toFixed(1)}%</span>
							</div>
						);
					})}
				</div>
			</div>

			<div style={css.controls}>
				<div style={css.ctl}>
					<span style={css.label}>temperature</span>
					<input
						style={css.slider}
						type="range"
						min={MIN_T}
						max={MAX_T}
						step={STEP_T}
						value={temp}
						onChange={(e) => setTemp(Number(e.target.value))}
					/>
					<span style={css.num}>{temp.toFixed(1)}</span>
				</div>
			</div>

			<div style={css.readout}>
				Лидер «<strong>{TOKENS[leaderIdx].t}</strong>» обходит второе место «
				<strong>{TOKENS[runnerIdx].t}</strong>» в <strong>{ratio.toFixed(1)}×</strong> по вероятности — это и
				есть острота распределения. При T → 0 это отношение улетает в бесконечность, при большой T тянется к
				единице (оба варианта становятся почти равновероятны).
			</div>

			<div style={css.note}>
				Слева — не проценты, а сырые числа, и они честно бывают отрицательными: шкала центрирована на нуле,
				зелёное — больше нуля, красное — меньше. Температура не «добавляет случайности» — она делит логиты на
				T ещё до softmax, поэтому порядок токенов не меняется никогда, меняются только зазоры между ними.
			</div>
		</div>
	);
}
