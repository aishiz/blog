import { useState } from 'react';

// «Новый движок инференса работает ___» — распределение подобрано так, чтобы
// на дефолтных ручках vLLM и HuggingFace расходились сразу, без возни со слайдерами.
const DIST = [
	{ t: 'быстро', p: 0.40 },
	{ t: 'стабильно', p: 0.30 },
	{ t: 'неплохо', p: 0.20 },
	// load-bearing для дефолтной демки: 0.15 × 0.40 === 0.06 точно в IEEE-754, поэтому
	// при дефолтном min_p=0.15 «странно» ровно на границе порога и переживает >= — отсюда
	// расхождение 3 vs 4 выживших между движками на дефолтных ползунках. Подвинешь это
	// число или дефолтный min_p — демка может тихо схлопнуться в «наборы совпали».
	{ t: 'странно', p: 0.06 },
	{ t: 'ужасно', p: 0.04 },
];

type Row = { t: string; p: number };

// min_p: порог = min_p × max(вероятностей среди живых), режем строго меньше.
// Важно: это инвариантно к перенормировке — порог и вероятности масштабируются
// одним и тем же множителем, и сравнение от этого не меняется.
function applyMinP(dist: Row[], alive: boolean[], minP: number): boolean[] {
	const aliveP = dist.filter((_, i) => alive[i]).map((d) => d.p);
	if (aliveP.length === 0) return alive;
	const thr = minP * Math.max(...aliveP);
	return dist.map((d, i) => alive[i] && d.p >= thr);
}

// top_p: набираем минимальный набор с накопленной массой >= p, считая её по
// ПЕРЕНОРМИРОВАННОМУ распределению того, что живо на этот момент. Лидер всегда выживает.
function applyTopP(dist: Row[], alive: boolean[], topP: number): boolean[] {
	const idx = dist.map((_, i) => i).filter((i) => alive[i]);
	const z = idx.reduce((s, i) => s + dist[i].p, 0);
	const sorted = [...idx].sort((a, b) => dist[b].p - dist[a].p);
	const keep = new Set<number>();
	let cum = 0;
	for (const i of sorted) {
		keep.add(i);
		cum += dist[i].p / z;
		if (cum >= topP) break;
	}
	return dist.map((_, i) => keep.has(i));
}

// top_k зафиксирован «выключен» для чистоты сравнения — заглушка сохраняет форму конвейера.
function applyTopK(alive: boolean[]): boolean[] {
	return alive;
}

function runVLLM(dist: Row[], minP: number, topP: number): boolean[] {
	let alive = dist.map(() => true);
	alive = applyMinP(dist, alive, minP); // temperature -> min_p
	alive = applyTopK(alive); // top_k (off)
	alive = applyTopP(dist, alive, topP); // top_p -> финальный softmax
	return alive;
}

function runHF(dist: Row[], minP: number, topP: number): boolean[] {
	let alive = dist.map(() => true);
	alive = applyTopK(alive); // temperature -> top_k (off)
	alive = applyTopP(dist, alive, topP); // top_p
	alive = applyMinP(dist, alive, minP); // min_p
	return alive;
}

const css = {
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.1rem', lineHeight: 1.6 } as React.CSSProperties,
	ctlRow: { display: 'flex', flexWrap: 'wrap' as const, gap: '1.5rem', marginBottom: '1.1rem' } as React.CSSProperties,
	ctl: { display: 'flex', alignItems: 'center', gap: '0.6rem', flex: '1 1 220px' } as React.CSSProperties,
	ctlLabel: { width: '58px', flexShrink: 0, fontSize: '0.82rem', fontWeight: 800, color: 'var(--text)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' } as React.CSSProperties,
	slider: { flex: 1, accentColor: 'var(--accent)' } as React.CSSProperties,
	num: { width: '42px', flexShrink: 0, fontSize: '0.82rem', fontWeight: 800, textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' as const, color: 'var(--text)' } as React.CSSProperties,
	topkNote: { fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '1rem' } as React.CSSProperties,
	banner: (diverged: boolean) => ({
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
		padding: '0.65rem 0.9rem',
		borderRadius: '8px',
		border: `1px solid ${diverged ? 'var(--accent-magenta)' : 'var(--border)'}`,
		background: diverged ? 'var(--accent-glow)' : 'var(--bg-secondary)',
		color: diverged ? 'var(--accent-magenta)' : 'var(--text-muted)',
		fontSize: '0.84rem',
		fontWeight: 700,
		marginBottom: '1.25rem',
		lineHeight: 1.5,
	} as React.CSSProperties),
	cols: { display: 'flex', gap: '1.25rem', flexWrap: 'wrap' as const } as React.CSSProperties,
	col: { flex: '1 1 240px', minWidth: '230px' } as React.CSSProperties,
	colTitle: { fontSize: '0.86rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.15rem' } as React.CSSProperties,
	colSub: { fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.7rem', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', lineHeight: 1.5 } as React.CSSProperties,
	row: (highlighted: boolean) => ({
		display: 'flex',
		alignItems: 'center',
		gap: '0.45rem',
		marginBottom: '0.3rem',
		padding: '0.15rem 0.3rem',
		borderRadius: '6px',
		border: `1px solid ${highlighted ? 'var(--accent-magenta)' : 'transparent'}`,
		background: highlighted ? 'var(--accent-glow)' : 'transparent',
	} as React.CSSProperties),
	tok: (alive: boolean, highlighted: boolean) => ({
		width: '90px',
		flexShrink: 0,
		fontSize: '0.78rem',
		fontWeight: alive ? 700 : 500,
		color: highlighted ? 'var(--accent-magenta)' : alive ? 'var(--text)' : 'var(--text-muted)',
		textDecoration: alive ? 'none' : 'line-through',
		whiteSpace: 'nowrap' as const,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
	} as React.CSSProperties),
	track: { flex: 1, height: '11px', borderRadius: '3px', background: 'var(--bg-secondary)', overflow: 'hidden' } as React.CSSProperties,
	fill: (pct: number, alive: boolean, highlighted: boolean) => ({
		width: `${pct}%`,
		height: '100%',
		background: highlighted ? 'var(--accent-magenta)' : alive ? 'var(--accent)' : 'var(--border-light)',
	} as React.CSSProperties),
	val: { width: '38px', flexShrink: 0, fontSize: '0.7rem', textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' as const, color: 'var(--text-muted)' } as React.CSSProperties,
	count: (color: string) => ({ marginTop: '0.5rem', fontSize: '0.78rem', fontWeight: 700, color } as React.CSSProperties),
	note: { marginTop: '1.1rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

function Column({ name, sub, alive, diffSet }: { name: string; sub: string; alive: boolean[]; diffSet: Set<string> }) {
	const max = Math.max(...DIST.map((d) => d.p));
	const n = alive.filter(Boolean).length;
	return (
		<div style={css.col}>
			<div style={css.colTitle}>{name}</div>
			<div style={css.colSub}>{sub}</div>
			{DIST.map((d, i) => {
				const isHighlighted = diffSet.has(d.t);
				return (
					<div key={d.t} style={css.row(isHighlighted)}>
						<span style={css.tok(alive[i], isHighlighted)}>{d.t}</span>
						<div style={css.track}><div style={css.fill((d.p / max) * 100, alive[i], isHighlighted)} /></div>
						<span style={css.val}>{(d.p * 100).toFixed(0)}%</span>
					</div>
				);
			})}
			<div style={css.count(n <= 2 ? 'var(--accent-yellow-text)' : 'var(--accent)')}>выжило: {n} из {DIST.length}</div>
		</div>
	);
}

export default function EngineOrderDuel() {
	const [minP, setMinP] = useState(0.15);
	const [topP, setTopP] = useState(0.92);

	const vAlive = runVLLM(DIST, minP, topP);
	const hAlive = runHF(DIST, minP, topP);

	const vOnly = DIST.filter((d, i) => vAlive[i] && !hAlive[i]).map((d) => d.t);
	const hOnly = DIST.filter((d, i) => hAlive[i] && !vAlive[i]).map((d) => d.t);
	const diverged = vOnly.length > 0 || hOnly.length > 0;
	const diffSet = new Set([...vOnly, ...hOnly]);

	let bannerText: string;
	if (!diverged) {
		bannerText = '✅ наборы совпали — на этих ручках порядок конвейера роли не сыграл';
	} else if (hOnly.length === 0) {
		const list = vOnly.map((t) => `«${t}»`).join(', ');
		bannerText = vOnly.length > 1
			? `⚡ наборы разошлись: ${list} выжили в vLLM и погибли в HuggingFace`
			: `⚡ наборы разошлись: ${list} выжил в vLLM и погиб в HuggingFace`;
	} else if (vOnly.length === 0) {
		const list = hOnly.map((t) => `«${t}»`).join(', ');
		bannerText = hOnly.length > 1
			? `⚡ наборы разошлись: ${list} выжили в HuggingFace и погибли в vLLM`
			: `⚡ наборы разошлись: ${list} выжил в HuggingFace и погиб в vLLM`;
	} else {
		bannerText = `⚡ наборы разошлись сразу в обе стороны: у vLLM свои — ${vOnly.map((t) => `«${t}»`).join(', ')}, у HuggingFace свои — ${hOnly.map((t) => `«${t}»`).join(', ')}`;
	}

	return (
		<div style={css.wrap}>
			<div style={css.title}>🥊 vLLM против HuggingFace: один конфиг, два набора</div>
			<div style={css.desc}>
				«Новый движок инференса работает ___». Одни и те же <code>min_p</code> и <code>top_p</code> прогоняются
				через два конвейера в разном порядке. Дефолтные значения уже расходятся — подвигай ползунки и
				посмотри, когда порядок вообще не важен, а когда важен критически. Распределение иллюстративное и
				подобрано так, чтобы расхождение было видно сразу, — механика обоих конвейеров настоящая.
			</div>

			<div style={css.ctlRow}>
				<div style={css.ctl}>
					<span style={css.ctlLabel}>min_p</span>
					<input style={css.slider} type="range" min={0} max={0.3} step={0.01} value={minP} onChange={(e) => setMinP(Number(e.target.value))} />
					<span style={css.num}>{minP.toFixed(2)}</span>
				</div>
				<div style={css.ctl}>
					<span style={css.ctlLabel}>top_p</span>
					<input style={css.slider} type="range" min={0.5} max={1} step={0.01} value={topP} onChange={(e) => setTopP(Number(e.target.value))} />
					<span style={css.num}>{topP.toFixed(2)}</span>
				</div>
			</div>
			<div style={css.topkNote}>top_k: выключен (зафиксирован — чтобы сравнивать только эффект порядка min_p и top_p); temperature уже учтена — распределение ниже дано после неё</div>

			<div style={css.banner(diverged)}>{bannerText}</div>

			<div style={css.cols}>
				<Column name="vLLM" sub="temperature → min_p → top_k → top_p → softmax" alive={vAlive} diffSet={diffSet} />
				<Column name="HuggingFace" sub="temperature → top_k → top_p → min_p" alive={hAlive} diffSet={diffSet} />
			</div>

			<div style={css.note}>
				Механика та же самая на обоих движках, дело только в очерёдности. Когда <code>min_p</code> отрабатывает
				первым (vLLM), он сразу срезает хвост — и <code>top_p</code> потом считает накопленную массу уже по
				перенормированному, «раздутому» остатку: порог набирается быстрее, и в живых остаётся меньше токенов.
				В HuggingFace <code>top_p</code> идёт первым и считает по нетронутому распределению — набирает больше
				кандидатов, а поздний <code>min_p</code> их уже не выкашивает. Заметь: дело не в том, что порог
				min_p «становится строже» от перенормировки — сам порог к ней нечувствителен, он масштабируется
				вместе с вероятностями и сравнение не меняется. Расходится именно top_p, потому что ему достаётся
				разная стартовая масса для накопления.
			</div>
		</div>
	);
}
