import { useState } from 'react';

// Иллюстративное распределение: «Кот сидит на ___».
// Логиты выдуманы для наглядности, механика — настоящая.
const TOKENS = [
	{ t: 'коврике', l: 3.2 },
	{ t: 'диване', l: 2.9 },
	{ t: 'окне', l: 2.4 },
	{ t: 'крыше', l: 1.8 },
	{ t: 'столе', l: 1.5 },
	{ t: 'полу', l: 1.1 },
	{ t: 'дереве', l: 0.6 },
	{ t: 'заборе', l: 0.2 },
	{ t: 'ветке', l: -0.3 },
	{ t: 'капоте', l: -0.9 },
	{ t: 'луне', l: -2.1 },
	{ t: 'ассемблере', l: -3.4 },
];

type Kill = null | 'min_p' | 'top_k' | 'top_p';

function softmax(logits: number[]): number[] {
	const alive = logits.filter((x) => Number.isFinite(x));
	const max = alive.length ? Math.max(...alive) : 0;
	const exps = logits.map((x) => (Number.isFinite(x) ? Math.exp(x - max) : 0));
	const z = exps.reduce((a, b) => a + b, 0);
	return exps.map((e) => (z > 0 ? e / z : 0));
}

// Пайплайн ровно в порядке vLLM: temperature -> min_p -> top_k -> top_p -> softmax.
function pipeline(temp: number, topK: number, topP: number, minP: number) {
	const n = TOKENS.length;
	const scaled = TOKENS.map((x) => x.l / Math.max(temp, 0.01));
	const killedBy: Kill[] = new Array(n).fill(null);
	let masked = scaled.slice();

	// 1) min_p: порог относительно лидера, по вероятностям ПОСЛЕ температуры
	if (minP > 0) {
		const p = softmax(masked);
		const thr = minP * Math.max(...p);
		for (let i = 0; i < n; i++) {
			if (p[i] < thr) { killedBy[i] = 'min_p'; masked[i] = -Infinity; }
		}
	}

	// 2) top_k: маскируем строго меньшее, чем k-е по величине
	if (topK > 0 && topK < n) {
		const sorted = masked.slice().sort((a, b) => b - a);
		const kth = sorted[topK - 1];
		for (let i = 0; i < n; i++) {
			if (masked[i] < kth && killedBy[i] === null) { killedBy[i] = 'top_k'; masked[i] = -Infinity; }
		}
	}

	// 3) top_p: минимальный набор с массой >= p, граничный включается, лидер всегда жив
	if (topP < 1) {
		const p = softmax(masked);
		const order = p.map((v, i) => i).sort((a, b) => p[b] - p[a]);
		let cum = 0;
		const keep = new Set<number>();
		for (const i of order) {
			if (p[i] <= 0) break;
			keep.add(i);
			cum += p[i];
			if (cum >= topP) break;
		}
		for (let i = 0; i < n; i++) {
			if (!keep.has(i) && killedBy[i] === null && Number.isFinite(masked[i])) {
				killedBy[i] = 'top_p'; masked[i] = -Infinity;
			}
		}
	}

	return { final: softmax(masked), killedBy };
}

const KILL_COLOR: Record<string, string> = {
	min_p: 'var(--accent-magenta)',
	top_k: 'var(--accent-yellow-text)',
	top_p: 'var(--accent-secondary)',
};

const css = {
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 } as React.CSSProperties,
	order: { fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.7rem', marginBottom: '1.1rem', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' } as React.CSSProperties,
	row: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' } as React.CSSProperties,
	tok: (dead: boolean) => ({ width: '96px', flexShrink: 0, fontSize: '0.8rem', fontWeight: dead ? 500 : 700, color: dead ? 'var(--text-muted)' : 'var(--text)', textDecoration: dead ? 'line-through' : 'none', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' } as React.CSSProperties),
	track: { flex: 1, height: '14px', borderRadius: '4px', background: 'var(--bg-secondary)', overflow: 'hidden' } as React.CSSProperties,
	fill: (pct: number, color: string) => ({ width: `${Math.max(pct, 0)}%`, height: '100%', background: color, transition: 'width 0.15s ease' } as React.CSSProperties),
	val: { width: '54px', flexShrink: 0, fontSize: '0.75rem', fontWeight: 700, textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' as const, color: 'var(--text-secondary)' } as React.CSSProperties,
	tag: (color: string) => ({ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.04em', color, width: '52px', flexShrink: 0 } as React.CSSProperties),
	controls: { marginTop: '1.1rem', display: 'grid', gap: '0.5rem' } as React.CSSProperties,
	ctl: { display: 'flex', alignItems: 'center', gap: '0.6rem' } as React.CSSProperties,
	label: (color: string) => ({ width: '112px', flexShrink: 0, fontSize: '0.78rem', fontWeight: 700, color, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' } as React.CSSProperties),
	slider: { flex: 1, accentColor: 'var(--accent)' } as React.CSSProperties,
	num: { width: '46px', flexShrink: 0, fontSize: '0.8rem', fontWeight: 800, textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' as const, color: 'var(--text)' } as React.CSSProperties,
	note: { marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

export default function SamplingPlayground() {
	const [temp, setTemp] = useState(1);
	const [topK, setTopK] = useState(0);
	const [topP, setTopP] = useState(1);
	const [minP, setMinP] = useState(0);

	const { final, killedBy } = pipeline(temp, topK, topP, minP);
	const maxP = Math.max(...final, 0.0001);
	const aliveCount = killedBy.filter((k) => k === null).length;

	return (
		<div style={css.wrap}>
			<div style={css.title}>🎛 Песочница сэмплинга</div>
			<div style={css.desc}>
				«Кот сидит на ___». Крути ручки и смотри, что происходит с распределением: кто выжил, кого какая
				ручка убила и какие вероятности стали у выживших после перенормировки. Логиты иллюстративные, механика настоящая.
			</div>
			<div style={css.order}>порядок как в vLLM: temperature → min_p → top_k → top_p → softmax</div>

			{TOKENS.map((tk, i) => {
				const dead = killedBy[i] !== null;
				const pct = dead ? 0 : (final[i] / maxP) * 100;
				return (
					<div key={tk.t} style={css.row}>
						<span style={css.tok(dead)}>{tk.t}</span>
						<div style={css.track}><div style={css.fill(pct, 'var(--accent)')} /></div>
						<span style={css.val}>{dead ? '—' : `${(final[i] * 100).toFixed(1)}%`}</span>
						<span style={css.tag(dead ? KILL_COLOR[killedBy[i] as string] : 'transparent')}>
							{dead ? killedBy[i] : ''}
						</span>
					</div>
				);
			})}

			<div style={css.controls}>
				<div style={css.ctl}>
					<span style={css.label('var(--accent)')}>temperature</span>
					<input style={css.slider} type="range" min={0.1} max={2} step={0.1} value={temp} onChange={(e) => setTemp(Number(e.target.value))} />
					<span style={css.num}>{temp.toFixed(1)}</span>
				</div>
				<div style={css.ctl}>
					<span style={css.label('var(--accent-magenta)')}>min_p</span>
					<input style={css.slider} type="range" min={0} max={0.5} step={0.01} value={minP} onChange={(e) => setMinP(Number(e.target.value))} />
					<span style={css.num}>{minP.toFixed(2)}</span>
				</div>
				<div style={css.ctl}>
					<span style={css.label('var(--accent-yellow-text)')}>top_k</span>
					<input style={css.slider} type="range" min={0} max={TOKENS.length} step={1} value={topK} onChange={(e) => setTopK(Number(e.target.value))} />
					<span style={css.num}>{topK === 0 ? 'off' : topK}</span>
				</div>
				<div style={css.ctl}>
					<span style={css.label('var(--accent-secondary)')}>top_p</span>
					<input style={css.slider} type="range" min={0.05} max={1} step={0.01} value={topP} onChange={(e) => setTopP(Number(e.target.value))} />
					<span style={css.num}>{topP.toFixed(2)}</span>
				</div>
			</div>

			<div style={css.note}>
				Выжило токенов: <strong>{aliveCount}</strong> из {TOKENS.length}. Обрати внимание: <code>top_k=0</code> означает
				«не ограничивать» — это дефолт vLLM, как и <code>top_p=1.0</code> и <code>min_p=0</code>. Порядок ручек не
				косметика: min_p считает порог от лидера <em>до</em> того, как top_k и top_p что-то отрежут.
			</div>
		</div>
	);
}
