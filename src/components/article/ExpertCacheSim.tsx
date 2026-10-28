import { useMemo, useState } from 'react';

// Один слой DeepSeek-V4.1-Flash: 384 routed-эксперта, на токен роутер выбирает 6.
// Настоящих трейсов роутинга для 1017 не опубликовано, поэтому поток токенов синтетический:
// - «равномерно»: каждый эксперт одинаково вероятен;
// - «Ципф»: вероятность эксперта ∝ 1/rank^s — несколько горячих, длинный хвост (допущение);
// - «смена темы»: тот же Ципф, но каждые 300 токенов горячие эксперты меняются.
// Кэш на GPU держит N экспертов слоя, политика LRU или LFU. Генератор детерминированный,
// чтобы картинка не прыгала при каждом рендере.
const E = 384;
const K = 6;
const TOKENS = 3000;
const SIZES = [6, 12, 24, 48, 72, 96, 128, 192, 256, 320, 384];

type Mode = 'uniform' | 'zipf' | 'shift';
type Policy = 'lru' | 'lfu';

function mulberry32(seed: number) {
	return () => {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function makeTrace(mode: Mode): number[][] {
	const rnd = mulberry32(17);
	const weights = Array.from({ length: E }, (_, i) => (mode === 'uniform' ? 1 : 1 / Math.pow(i + 1, 1.1)));
	let perm = Array.from({ length: E }, (_, i) => i);
	const shuffle = () => {
		perm = perm.slice();
		for (let i = E - 1; i > 0; i--) {
			const j = Math.floor(rnd() * (i + 1));
			[perm[i], perm[j]] = [perm[j], perm[i]];
		}
	};
	shuffle();
	const trace: number[][] = [];
	for (let t = 0; t < TOKENS; t++) {
		if (mode === 'shift' && t > 0 && t % 300 === 0) shuffle();
		// top-6 без повторов: выборка по весам с исключением выбранных
		const picked = new Set<number>();
		while (picked.size < K) {
			let total = 0;
			for (let r = 0; r < E; r++) if (!picked.has(r)) total += weights[r];
			let x = rnd() * total;
			for (let r = 0; r < E; r++) {
				if (picked.has(r)) continue;
				x -= weights[r];
				if (x <= 0) {
					picked.add(r);
					break;
				}
			}
		}
		trace.push([...picked].map((r) => perm[r]));
	}
	return trace;
}

function simulate(trace: number[][], size: number, policy: Policy): number {
	const last = new Map<number, number>(); // эксперт → время последнего обращения (LRU)
	const freq = new Map<number, number>(); // эксперт → число обращений (LFU, считаем по всей истории)
	const cache = new Set<number>();
	let hits = 0;
	let total = 0;
	trace.forEach((experts, t) => {
		for (const e of experts) {
			freq.set(e, (freq.get(e) ?? 0) + 1);
			total++;
			if (cache.has(e)) hits++;
			else {
				if (cache.size >= size) {
					let victim = -1;
					let best = Infinity;
					for (const c of cache) {
						if (experts.includes(c)) continue; // не выкидываем то, что нужно этому же токену
						const score = policy === 'lru' ? last.get(c)! : freq.get(c)! * 1e6 + last.get(c)!;
						if (score < best) {
							best = score;
							victim = c;
						}
					}
					if (victim >= 0) cache.delete(victim);
				}
				cache.add(e);
			}
			last.set(e, t);
		}
	});
	return hits / total;
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
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.1rem', lineHeight: 1.6 } as React.CSSProperties,
	tabs: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' as const, marginBottom: '0.7rem' } as React.CSSProperties,
	chip: (active: boolean) =>
		({
			padding: '0.35rem 0.7rem',
			borderRadius: '8px',
			border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
			background: active ? 'var(--bg-secondary)' : 'transparent',
			color: active ? 'var(--text)' : 'var(--text-secondary)',
			fontSize: '0.78rem',
			fontWeight: 700,
			cursor: 'pointer',
		}) as React.CSSProperties,
	ctl: { display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0.6rem 0' } as React.CSSProperties,
	label: { width: '120px', flexShrink: 0, fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)' } as React.CSSProperties,
	slider: { flex: 1, minWidth: 0, accentColor: 'var(--accent)' } as React.CSSProperties,
	num: { width: '86px', flexShrink: 0, fontSize: '0.8rem', fontWeight: 800, textAlign: 'right' as const, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties,
	legend: { display: 'flex', gap: '1rem', flexWrap: 'wrap' as const, fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' } as React.CSSProperties,
	swatch: (color: string) =>
		({ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: color, marginRight: '0.35rem', verticalAlign: 'middle' }) as React.CSSProperties,
	readout: {
		marginTop: '0.9rem',
		padding: '0.75rem 0.9rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		fontSize: '0.86rem',
		color: 'var(--text)',
		lineHeight: 1.6,
	} as React.CSSProperties,
	note: { marginTop: '0.9rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

const MODES: { id: Mode; label: string }[] = [
	{ id: 'uniform', label: 'равномерно' },
	{ id: 'zipf', label: 'есть горячие (Ципф)' },
	{ id: 'shift', label: 'тема меняется' },
];

export default function ExpertCacheSim() {
	const [mode, setMode] = useState<Mode>('zipf');
	const [idx, setIdx] = useState(4);
	const size = SIZES[idx];

	const curves = useMemo(() => {
		const trace = makeTrace(mode);
		return {
			lru: SIZES.map((s) => simulate(trace, s, 'lru')),
			lfu: SIZES.map((s) => simulate(trace, s, 'lfu')),
		};
	}, [mode]);

	const W = 560;
	const H = 200;
	const pad = { l: 40, r: 12, t: 10, b: 28 };
	const x = (i: number) => pad.l + (SIZES[i] / E) * (W - pad.l - pad.r);
	const y = (h: number) => pad.t + (1 - h) * (H - pad.t - pad.b);
	const line = (v: number[]) => v.map((h, i) => `${x(i)},${y(h)}`).join(' ');
	const lru = curves.lru[idx];
	const lfu = curves.lfu[idx];
	const share = size / E;

	return (
		<div style={css.wrap}>
			<div style={css.title}>🎯 Сколько экспертов держать на GPU</div>
			<div style={css.desc}>
				Один слой модели: 384 эксперта, на каждый токен роутер берёт 6. На видеокарте помещается только часть,
				остальное живёт в RAM или на SSD. Ниже 3000 синтетических токенов и кэш с вытеснением LRU или LFU.
				Посмотри, как доля попаданий зависит от того, насколько неравномерно роутер выбирает экспертов.
			</div>

			<div style={css.tabs}>
				{MODES.map((m) => (
					<button key={m.id} style={css.chip(mode === m.id)} onClick={() => setMode(m.id)}>{m.label}</button>
				))}
			</div>

			<div style={css.ctl}>
				<span style={css.label}>кэш на GPU</span>
				<input style={css.slider} type="range" min={0} max={SIZES.length - 1} step={1} value={idx}
					onChange={(e) => setIdx(Number(e.target.value))} />
				<span style={css.num}>{size} из {E}</span>
			</div>

			<div style={css.legend}>
				<span><span style={css.swatch('var(--accent)')} />LRU</span>
				<span><span style={css.swatch('var(--accent-secondary)')} />LFU</span>
				<span><span style={css.swatch('var(--text-muted)')} />без перекоса: попадания = доля кэша</span>
			</div>
			<svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img"
				aria-label="Доля попаданий в кэш экспертов в зависимости от размера кэша">
				{[0, 0.25, 0.5, 0.75, 1].map((h) => (
					<g key={h}>
						<line x1={pad.l} x2={W - pad.r} y1={y(h)} y2={y(h)} stroke="var(--border)" />
						<text x={pad.l - 6} y={y(h) + 4} textAnchor="end" fontSize={13} fill="var(--text-muted)">{h * 100}%</text>
					</g>
				))}
				{[0, 96, 192, 288, 384].map((s) => (
					<text key={s} x={pad.l + (s / E) * (W - pad.l - pad.r)} y={H - 8} textAnchor="middle" fontSize={13} fill="var(--text-muted)">{s}</text>
				))}
				<line x1={pad.l} y1={y(0)} x2={W - pad.r} y2={y(1)} stroke="var(--text-muted)" strokeDasharray="4 4" />
				<line x1={x(idx)} x2={x(idx)} y1={pad.t} y2={H - pad.b} stroke="var(--border-light)" strokeDasharray="3 3" />
				<polyline fill="none" stroke="var(--accent-secondary)" strokeWidth={2.5} points={line(curves.lfu)} />
				<polyline fill="none" stroke="var(--accent)" strokeWidth={2.5} points={line(curves.lru)} />
				<circle cx={x(idx)} cy={y(lru)} r={5} fill="var(--accent)" />
				<circle cx={x(idx)} cy={y(lfu)} r={5} fill="var(--accent-secondary)" />
			</svg>

			<div style={css.readout}>
				На GPU {Math.round(share * 100)}% экспертов слоя. Попадания: LRU <strong>{Math.round(lru * 100)}%</strong>,
				LFU <strong>{Math.round(lfu * 100)}%</strong>. Значит, из каждых 6 экспертов на токен из медленной памяти
				придётся тянуть примерно <strong>{(K * (1 - Math.max(lru, lfu))).toFixed(1)}</strong>.
			</div>

			<div style={css.note}>
				Поток токенов выдуман: настоящих трейсов роутинга DeepSeek-V4.1-Flash никто не публиковал. Ципф с
				показателем 1,1 — моё допущение. При равномерном роутинге доля попаданий у любого кэша не выше
				доли экспертов, которые в нём лежат. В статье SpecMD (2026) на OLMoE с кэшем в 5% VRAM вышло больше 88% попаданий, но
				там другая модель и своя политика вытеснения, не LRU.
			</div>
		</div>
	);
}
