import { useState, useEffect, useCallback } from 'react';

// Поток запросов: буква = общий префикс (системный промпт / документ), цвет — он же.
const DOCS = [
	{ d: 'A', c: '#3b82f6' }, { d: 'B', c: '#10b981' }, { d: 'A', c: '#3b82f6' },
	{ d: 'C', c: '#f59e0b' }, { d: 'A', c: '#3b82f6' }, { d: 'B', c: '#10b981' },
	{ d: 'C', c: '#f59e0b' }, { d: 'A', c: '#3b82f6' },
];
const N_WORKERS = 3;
const CAP = 2; // сколько префиксов держит в кэше один воркер (LRU)

type Sim = { workers: string[][]; assign: number[]; hit: boolean[]; hits: number };

function simulate(mode: 'rr' | 'kv', step: number): Sim {
	const workers: string[][] = Array.from({ length: N_WORKERS }, () => []);
	const assign: number[] = [];
	const hit: boolean[] = [];
	let hits = 0;

	for (let i = 0; i < step; i++) {
		const doc = DOCS[i].d;
		let w: number;
		if (mode === 'rr') {
			w = i % N_WORKERS;
		} else {
			// KV-aware: воркер, у которого уже есть этот префикс; иначе наименее загруженный
			const has = workers.findIndex((cache) => cache.includes(doc));
			w = has >= 0 ? has : workers.reduce((min, c, idx, arr) => (c.length < arr[min].length ? idx : min), 0);
		}
		const isHit = workers[w].includes(doc);
		if (isHit) hits++;
		// обновляем LRU-кэш воркера
		const cache = workers[w].filter((x) => x !== doc);
		cache.push(doc);
		while (cache.length > CAP) cache.shift();
		workers[w] = cache;
		assign.push(w);
		hit.push(isHit);
	}
	return { workers, assign, hit, hits };
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

const docColor = (d: string) => DOCS.find((x) => x.d === d)!.c;

const css = {
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.1rem', lineHeight: 1.6 } as React.CSSProperties,
	queue: { display: 'flex', gap: '4px', marginBottom: '1.25rem', flexWrap: 'wrap' as const } as React.CSSProperties,
	req: (c: string, state: 'done' | 'cur' | 'next') => ({
		width: '2rem', height: '2rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
		fontWeight: 800, fontSize: '0.85rem', color: '#fff', background: c,
		opacity: state === 'next' ? 0.3 : 1,
		outline: state === 'cur' ? '2px solid var(--text)' : 'none',
		outlineOffset: '2px', transition: 'all 0.25s ease',
	} as React.CSSProperties),
	cols: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.1rem' } as React.CSSProperties,
	col: { display: 'flex', flexDirection: 'column' as const, gap: '0.6rem' } as React.CSSProperties,
	colTitle: (c: string) => ({ fontSize: '0.8rem', fontWeight: 700, color: c } as React.CSSProperties),
	worker: { padding: '0.5rem 0.6rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' } as React.CSSProperties,
	workerLabel: { fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.3rem' } as React.CSSProperties,
	chips: { display: 'flex', gap: '3px', minHeight: '1.4rem' } as React.CSSProperties,
	chip: (c: string) => ({ minWidth: '1.4rem', height: '1.4rem', borderRadius: '4px', background: c, color: '#fff', fontWeight: 800, fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center' } as React.CSSProperties),
	hitRow: { marginTop: '0.4rem', display: 'flex', alignItems: 'baseline', gap: '0.4rem' } as React.CSSProperties,
	hitVal: (c: string) => ({ fontSize: '1.35rem', fontWeight: 900, color: c, fontVariantNumeric: 'tabular-nums' } as React.CSSProperties),
	hitLabel: { fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.04em' } as React.CSSProperties,
	controls: { display: 'flex', gap: '0.5rem', marginTop: '1.25rem', alignItems: 'center', flexWrap: 'wrap' as const } as React.CSSProperties,
	btn: (active?: boolean) => ({ padding: '0.5rem 1rem', borderRadius: '8px', border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`, background: active ? 'var(--accent-glow)' : 'var(--bg-secondary)', color: active ? 'var(--accent-light)' : 'var(--text)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease' } as React.CSSProperties),
	stepLabel: { fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' } as React.CSSProperties,
};

function Column({ mode, step, mobile }: { mode: 'rr' | 'kv'; step: number; mobile: boolean }) {
	const sim = simulate(mode, step);
	const rate = step > 0 ? Math.round((sim.hits / step) * 100) : 0;
	const color = mode === 'kv' ? '#10b981' : '#f59e0b';
	return (
		<div style={css.col}>
			<div style={css.colTitle(color)}>{mode === 'kv' ? '✅ KV-aware' : '🔁 Round-robin'}</div>
			{sim.workers.map((cache, i) => (
				<div key={i} style={css.worker}>
					<div style={css.workerLabel}>Воркер {i + 1}{sim.assign[step - 1] === i ? (sim.hit[step - 1] ? ' · попал в кэш' : ' · пересчёт') : ''}</div>
					<div style={css.chips}>
						{cache.map((d, j) => <div key={j} style={css.chip(docColor(d))}>{d}</div>)}
					</div>
				</div>
			))}
			<div style={css.hitRow}>
				<span style={css.hitVal(color)}>{rate}%</span>
				<span style={css.hitLabel}>попаданий в кэш</span>
			</div>
		</div>
	);
}

export default function KvRoutingDemo() {
	const [step, setStep] = useState(1);
	const [auto, setAuto] = useState(true);
	const mobile = useIsMobile();
	const maxStep = DOCS.length;

	const advance = useCallback(() => setStep((s) => (s >= maxStep ? 1 : s + 1)), [maxStep]);
	useEffect(() => {
		if (!auto) return;
		const id = setInterval(advance, 1600);
		return () => clearInterval(id);
	}, [auto, advance]);

	return (
		<div style={{ ...css.wrap, ...(mobile ? { padding: '1rem', margin: '1.25em 0' } : {}) }}>
			<div style={css.title}>🎯 KV-aware роутинг vs round-robin</div>
			<div style={css.desc}>
				Запросы с одинаковым префиксом (буква/цвет — общий системный промпт или документ). Round-robin раскидывает их
				вслепую, KV-aware шлёт туда, где префикс <strong>уже в KV-кэше</strong> — попадание = пропускаем prefill = быстрее TTFT.
			</div>

			<div style={css.queue}>
				{DOCS.map((r, i) => (
					<div key={i} style={css.req(r.c, i < step - 1 ? 'done' : i === step - 1 ? 'cur' : 'next')}>{r.d}</div>
				))}
			</div>

			<div style={{ ...css.cols, ...(mobile ? { gridTemplateColumns: '1fr', gap: '1rem' } : {}) }}>
				<Column mode="rr" step={step} mobile={mobile} />
				<Column mode="kv" step={step} mobile={mobile} />
			</div>

			<div style={css.controls}>
				<button style={css.btn()} onClick={() => { setStep((s) => Math.max(1, s - 1)); setAuto(false); }}>← Назад</button>
				<button style={css.btn()} onClick={() => { advance(); setAuto(false); }}>Вперёд →</button>
				<button style={css.btn(auto)} onClick={() => setAuto(!auto)}>{auto ? '⏸ Пауза' : '▶ Авто'}</button>
				<span style={css.stepLabel}>Запрос {step}/{maxStep}</span>
			</div>
		</div>
	);
}
