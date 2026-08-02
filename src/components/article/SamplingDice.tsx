import { useState } from 'react';

const DIST = [
	{ t: 'коврике', p: 0.45 },
	{ t: 'диване', p: 0.28 },
	{ t: 'окне', p: 0.15 },
	{ t: 'крыше', p: 0.08 },
	{ t: 'столе', p: 0.04 },
];

// Детерминированный ГПСЧ: одинаковая последовательность у всех читателей.
function mulberry32(a: number) {
	return function () {
		a |= 0; a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const SEED = 20260802;

function pick(r: number): number {
	let cum = 0;
	for (let i = 0; i < DIST.length; i++) {
		cum += DIST[i].p;
		if (r < cum) return i;
	}
	return DIST.length - 1;
}

const css = {
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.1rem', lineHeight: 1.6 } as React.CSSProperties,
	row: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' } as React.CSSProperties,
	tok: (hot: boolean) => ({ width: '84px', flexShrink: 0, fontSize: '0.8rem', fontWeight: hot ? 800 : 600, color: hot ? '#22c55e' : 'var(--text-secondary)' } as React.CSSProperties),
	track: { flex: 1, height: '13px', borderRadius: '4px', background: 'var(--bg-secondary)', overflow: 'hidden', position: 'relative' as const } as React.CSSProperties,
	target: (pct: number) => ({ position: 'absolute' as const, left: `${pct}%`, top: 0, bottom: 0, width: '2px', background: 'var(--accent-yellow)' } as React.CSSProperties),
	fill: (pct: number) => ({ width: `${pct}%`, height: '100%', background: 'var(--accent)' } as React.CSSProperties),
	val: { width: '96px', flexShrink: 0, fontSize: '0.74rem', textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' as const, color: 'var(--text-muted)' } as React.CSSProperties,
	btns: { display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center', flexWrap: 'wrap' as const } as React.CSSProperties,
	btn: { padding: '0.45rem 1.1rem', borderRadius: '100px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' } as React.CSSProperties,
	total: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties,
	note: { marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

export default function SamplingDice() {
	const [counts, setCounts] = useState<number[]>(() => DIST.map(() => 0));
	const [step, setStep] = useState(0);
	const [last, setLast] = useState<number | null>(null);

	const draw = (times: number) => {
		const rng = mulberry32(SEED + step);
		const next = counts.slice();
		let idx = last;
		for (let i = 0; i < times; i++) {
			idx = pick(rng());
			next[idx]++;
		}
		setCounts(next);
		setStep(step + times);
		setLast(idx);
	};

	const reset = () => { setCounts(DIST.map(() => 0)); setStep(0); setLast(null); };
	const total = counts.reduce((a, b) => a + b, 0);

	return (
		<div style={css.wrap}>
			<div style={css.title}>🎲 Сэмплирование — это бросок костей</div>
			<div style={css.desc}>
				Ручки решают, кто вообще участвует. Дальше токен выбирается случайно, с весом своей вероятности.
				Жми — жёлтая риска показывает истинную вероятность, столбик — накопленную частоту. Чем больше бросков,
				тем ближе одно к другому.
			</div>

			{DIST.map((d, i) => {
				const freq = total > 0 ? counts[i] / total : 0;
				return (
					<div key={d.t} style={css.row}>
						<span style={css.tok(last === i)}>{d.t}</span>
						<div style={css.track}>
							<div style={css.fill(freq * 100)} />
							<div style={css.target(d.p * 100)} />
						</div>
						<span style={css.val}>{counts[i]} · {(freq * 100).toFixed(1)}% / {(d.p * 100).toFixed(0)}%</span>
					</div>
				);
			})}

			<div style={css.btns}>
				<button style={css.btn} onClick={() => draw(1)}>сэмплировать</button>
				<button style={css.btn} onClick={() => draw(100)}>×100</button>
				<button style={css.btn} onClick={reset}>сброс</button>
				<span style={css.total}>бросков: {total}</span>
			</div>

			<div style={css.note}>
				Именно поэтому один и тот же запрос даёт разные ответы: модель не «передумала», просто кости легли иначе.
				Последовательность здесь детерминированная (фиксированный сид) — у тебя и у соседа она совпадёт.
			</div>
		</div>
	);
}
