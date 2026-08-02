import { useState } from 'react';

// Два иллюстративных распределения: уверенное и размазанное.
const CONFIDENT = [
	{ t: 'Париж', p: 0.90 }, { t: 'Лион', p: 0.04 }, { t: 'Марсель', p: 0.02 },
	{ t: 'Ницца', p: 0.015 }, { t: 'Тулуза', p: 0.01 }, { t: 'Брест', p: 0.008 },
	{ t: 'банан', p: 0.004 }, { t: 'ассемблер', p: 0.003 },
];
const FLAT = [
	{ t: 'тихо', p: 0.17 }, { t: 'странно', p: 0.16 }, { t: 'весело', p: 0.15 },
	{ t: 'грустно', p: 0.14 }, { t: 'душно', p: 0.13 }, { t: 'светло', p: 0.12 },
	{ t: 'пусто', p: 0.08 }, { t: 'вязко', p: 0.05 },
];

function surviveTopP(dist: { t: string; p: number }[], p: number): boolean[] {
	const order = dist.map((_, i) => i).sort((a, b) => dist[b].p - dist[a].p);
	const keep = new Set<number>();
	let cum = 0;
	for (const i of order) {
		keep.add(i);
		cum += dist[i].p;
		if (cum >= p) break;
	}
	return dist.map((_, i) => keep.has(i));
}

function surviveMinP(dist: { t: string; p: number }[], m: number): boolean[] {
	const thr = m * Math.max(...dist.map((d) => d.p));
	return dist.map((d) => d.p >= thr);
}

const css = {
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.1rem', lineHeight: 1.6 } as React.CSSProperties,
	toggle: { display: 'flex', gap: '0.4rem', marginBottom: '1rem' } as React.CSSProperties,
	tbtn: (on: boolean) => ({ padding: '0.35rem 0.9rem', borderRadius: '100px', border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`, background: on ? 'var(--accent-glow)' : 'var(--bg-secondary)', color: on ? 'var(--accent-light)' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' } as React.CSSProperties),
	cols: { display: 'flex', gap: '1.25rem', flexWrap: 'wrap' as const } as React.CSSProperties,
	col: { flex: '1 1 240px', minWidth: '230px' } as React.CSSProperties,
	colTitle: { fontSize: '0.78rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.1rem' } as React.CSSProperties,
	colSub: { fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.6rem' } as React.CSSProperties,
	row: { display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' } as React.CSSProperties,
	tok: (alive: boolean) => ({ width: '80px', flexShrink: 0, fontSize: '0.76rem', fontWeight: alive ? 700 : 500, color: alive ? 'var(--text)' : 'var(--text-muted)', textDecoration: alive ? 'none' : 'line-through', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' } as React.CSSProperties),
	track: { flex: 1, height: '11px', borderRadius: '3px', background: 'var(--bg-secondary)', overflow: 'hidden' } as React.CSSProperties,
	fill: (pct: number, alive: boolean) => ({ width: `${pct}%`, height: '100%', background: alive ? 'var(--accent)' : 'var(--border-light)' } as React.CSSProperties),
	val: { width: '42px', flexShrink: 0, fontSize: '0.7rem', textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' as const, color: 'var(--text-muted)' } as React.CSSProperties,
	count: (color: string) => ({ marginTop: '0.5rem', fontSize: '0.78rem', fontWeight: 700, color } as React.CSSProperties),
	ctl: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '1.1rem' } as React.CSSProperties,
	slider: { flex: 1, accentColor: 'var(--accent)' } as React.CSSProperties,
	num: { width: '46px', flexShrink: 0, fontSize: '0.82rem', fontWeight: 800, textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' as const, color: 'var(--text)' } as React.CSSProperties,
	note: { marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

function Column({ name, sub, dist, alive }: { name: string; sub: string; dist: { t: string; p: number }[]; alive: boolean[] }) {
	const max = Math.max(...dist.map((d) => d.p));
	const n = alive.filter(Boolean).length;
	return (
		<div style={css.col}>
			<div style={css.colTitle}>{name}</div>
			<div style={css.colSub}>{sub}</div>
			{dist.map((d, i) => (
				<div key={d.t} style={css.row}>
					<span style={css.tok(alive[i])}>{d.t}</span>
					<div style={css.track}><div style={css.fill((d.p / max) * 100, alive[i])} /></div>
					<span style={css.val}>{(d.p * 100).toFixed(1)}</span>
				</div>
			))}
			<div style={css.count(n <= 2 ? 'var(--accent-yellow)' : 'var(--accent)')}>выжило: {n} из {dist.length}</div>
		</div>
	);
}

export default function TopPvsMinP() {
	const [mode, setMode] = useState<'top_p' | 'min_p'>('top_p');
	const [v, setV] = useState(0.9);

	const conf = mode === 'top_p' ? surviveTopP(CONFIDENT, v) : surviveMinP(CONFIDENT, v);
	const flat = mode === 'top_p' ? surviveTopP(FLAT, v) : surviveMinP(FLAT, v);

	return (
		<div style={css.wrap}>
			<div style={css.title}>⚔️ top-p против min-p</div>
			<div style={css.desc}>
				Одно и то же значение ручки на двух распределениях: слева модель уверена, справа мечется. Переключай
				ручку и смотри, как меняется число выживших. Вот тут и видно разницу в характере.
			</div>

			<div style={css.toggle}>
				<button style={css.tbtn(mode === 'top_p')} onClick={() => setMode('top_p')}>top_p</button>
				<button style={css.tbtn(mode === 'min_p')} onClick={() => setMode('min_p')}>min_p</button>
			</div>

			<div style={css.cols}>
				<Column name="Уверенное распределение" sub="«Столица Франции — ___»" dist={CONFIDENT} alive={conf} />
				<Column name="Размазанное распределение" sub="«В комнате было ___»" dist={FLAT} alive={flat} />
			</div>

			<div style={css.ctl}>
				<span style={{ ...css.num, width: '58px', textAlign: 'left' }}>{mode}</span>
				<input style={css.slider} type="range" min={0.02} max={mode === 'top_p' ? 1 : 0.6} step={0.01} value={v} onChange={(e) => setV(Number(e.target.value))} />
				<span style={css.num}>{v.toFixed(2)}</span>
			</div>

			<div style={css.note}>
				<strong>top_p</strong> считает накопленную массу, поэтому на уверенном распределении он добирает хвост
				(лидер уже 90%, но до порога надо «дособрать») — а на размазанном пропускает почти всё.
				<strong> min_p</strong> считает порог от лидера, поэтому на уверенном режет жёстко, а на размазанном
				отпускает. Одно значение — разное поведение, и в этом весь смысл.
			</div>
		</div>
	);
}
