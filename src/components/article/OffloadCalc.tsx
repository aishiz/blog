import { useState } from 'react';

// Потолок скорости decode для DeepSeek-V4.1-Flash-1017 по пропускной способности памяти.
// Из config.json: 40 слоёв, 384 routed + 1 shared эксперт, 6 routed на токен,
// hidden 5120, moe_intermediate 2304 → эксперт = 3·5120·2304 ≈ 35,4M параметров.
// Routed-эксперты всего ≈ 543,7B, на токен читается 6·40 ≈ 8,5B.
// Остальной backbone (attention, shared, embeddings) ≈ 8,5B держим на GPU в ~8 бит
// и читаем целиком на каждый токен. Engram (196B) лежит на SSD и в счёт не идёт:
// на токен из него читаются считаные строки.
// Доля попаданий: hit(c) = c^α, где c — доля экспертов на уровне, α — допущение о перекосе роутинга.
const EXPERT_PARAMS = 3 * 5120 * 2304;
const ROUTED_TOTAL = EXPERT_PARAMS * 384 * 40;
const ROUTED_PER_TOKEN = EXPERT_PARAMS * 6 * 40;
const DENSE_GB = 8.5;
const OS_RESERVE_GB = 8;
const VRAM_RESERVE_GB = 1.5; // контекст, буферы, драйвер

const QUANTS = [
	{ id: 'iq1', label: '~1,6 бит (IQ1_S)', bpw: 1.6 },
	{ id: 'b2', label: '2 бита', bpw: 2.0 },
	{ id: 'q2', label: '~2,3 бита (Q2-смесь)', bpw: 2.3 },
	{ id: 'exl', label: '3,5 бита (EXL3)', bpw: 3.5 },
	{ id: 'fp4', label: 'FP4 как в оригинале', bpw: 4.25 },
];
const GPUS = [
	{ id: '3060', label: 'RTX 3060 12 ГБ', vram: 12, bw: 360 },
	{ id: '3090', label: 'RTX 3090 24 ГБ', vram: 24, bw: 936 },
	{ id: '4090', label: 'RTX 4090 24 ГБ', vram: 24, bw: 1008 },
	{ id: '5090', label: 'RTX 5090 32 ГБ', vram: 32, bw: 1792 },
	{ id: 'halo', label: 'Ryzen AI Max (общая память)', vram: 0, bw: 256 },
];
const RAMS = [
	{ id: 'd4-64', label: '64 ГБ DDR4-3200', size: 64, bw: 51.2 },
	{ id: 'd4-128', label: '128 ГБ DDR4-3200', size: 128, bw: 51.2 },
	{ id: 'd5-128', label: '128 ГБ DDR5-6000', size: 128, bw: 96 },
	{ id: 'd5-192', label: '192 ГБ DDR5-6000', size: 192, bw: 96 },
	{ id: 'lp-128', label: '128 ГБ LPDDR5X (Ryzen AI Max)', size: 128, bw: 256 },
];
const DISKS = [
	{ id: 'g4', label: 'NVMe Gen4 (~7,4 ГБ/с)', bw: 7.45 },
	{ id: 'g5', label: 'NVMe Gen5 (~14,8 ГБ/с)', bw: 14.8 },
];
const SKEWS = [
	{ id: 'uni', label: 'нет (равномерно)', a: 1 },
	{ id: 'mid', label: 'умеренный', a: 0.6 },
	{ id: 'hi', label: 'сильный', a: 0.35 },
];

const hit = (c: number, a: number) => Math.pow(Math.min(1, Math.max(0, c)), a);

function compute(bpw: number, gpu: (typeof GPUS)[number], ram: (typeof RAMS)[number], disk: (typeof DISKS)[number], a: number) {
	const unified = gpu.id === 'halo';
	const expertsGB = (ROUTED_TOTAL * bpw) / 8 / 1e9;
	const perTokGB = (ROUTED_PER_TOKEN * bpw) / 8 / 1e9;

	// Ёмкость уровней под эксперты
	let gpuCap: number;
	let ramCap: number;
	let fastBw: number;
	if (unified) {
		gpuCap = Math.max(0, ram.size - OS_RESERVE_GB - DENSE_GB);
		ramCap = 0;
		fastBw = ram.bw;
	} else {
		gpuCap = Math.max(0, gpu.vram - DENSE_GB - VRAM_RESERVE_GB);
		ramCap = Math.max(0, ram.size - OS_RESERVE_GB);
		fastBw = gpu.bw;
	}
	const cG = Math.min(1, gpuCap / expertsGB);
	const cGR = Math.min(1, (gpuCap + ramCap) / expertsGB);
	const fG = hit(cG, a);
	const fR = hit(cGR, a) - fG;
	const fD = 1 - fG - fR;

	const tiers = [
		{ name: unified ? 'общая память' : 'VRAM', bytes: perTokGB * fG, bw: fastBw, stored: Math.min(gpuCap, expertsGB) },
		{ name: 'RAM', bytes: perTokGB * fR, bw: ram.bw, stored: Math.min(ramCap, Math.max(0, expertsGB - gpuCap)) },
		{ name: 'SSD', bytes: perTokGB * fD, bw: disk.bw, stored: Math.max(0, expertsGB - gpuCap - ramCap) },
	];
	const denseMs = (DENSE_GB / (unified ? ram.bw : gpu.bw)) * 1000;
	const ms = tiers.map((t) => (t.bytes / t.bw) * 1000);
	const serial = denseMs + ms.reduce((s, x) => s + x, 0);
	const overlap = Math.max(denseMs, ...ms);
	return { expertsGB, perTokGB, tiers, ms, denseMs, tpsLow: 1000 / serial, tpsHigh: 1000 / overlap };
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
	grid: { display: 'flex', flexWrap: 'wrap' as const, gap: '0.6rem', marginBottom: '1rem' } as React.CSSProperties,
	field: { display: 'flex', flexDirection: 'column' as const, gap: '0.25rem', flex: '1 1 160px', minWidth: 0 } as React.CSSProperties,
	flabel: { fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'var(--text-secondary)' } as React.CSSProperties,
	select: {
		padding: '0.4rem 0.5rem',
		borderRadius: '6px',
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
		color: 'var(--text)',
		fontSize: '0.8rem',
		minWidth: 0,
	} as React.CSSProperties,
	row: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' } as React.CSSProperties,
	tier: { width: '96px', flexShrink: 0, fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)' } as React.CSSProperties,
	track: { flex: 1, height: '12px', borderRadius: '4px', background: 'var(--bg-secondary)', overflow: 'hidden' } as React.CSSProperties,
	fill: (pct: number, color: string) =>
		({ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.2s ease' }) as React.CSSProperties,
	val: {
		width: '118px',
		flexShrink: 0,
		fontSize: '0.72rem',
		textAlign: 'right' as const,
		color: 'var(--text-secondary)',
		fontVariantNumeric: 'tabular-nums' as const,
		lineHeight: 1.35,
	} as React.CSSProperties,
	panelTitle: {
		fontSize: '0.72rem',
		fontWeight: 800,
		textTransform: 'uppercase' as const,
		letterSpacing: '0.05em',
		color: 'var(--text-secondary)',
		margin: '1rem 0 0.5rem',
	} as React.CSSProperties,
	readout: {
		marginTop: '1rem',
		padding: '0.75rem 0.9rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		fontSize: '0.86rem',
		color: 'var(--text)',
		lineHeight: 1.6,
	} as React.CSSProperties,
	big: { fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties,
	note: { marginTop: '0.9rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

const COLORS = ['var(--accent)', 'var(--accent-secondary)', 'var(--accent-magenta)'];
const f1 = (x: number) => (x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2)).replace('.', ',');

export default function OffloadCalc() {
	const [q, setQ] = useState('b2');
	const [g, setG] = useState('3060');
	const [r, setR] = useState('d4-64');
	const [d, setD] = useState('g4');
	const [s, setS] = useState('mid');

	const quant = QUANTS.find((x) => x.id === q)!;
	const gpu = GPUS.find((x) => x.id === g)!;
	const disk = DISKS.find((x) => x.id === d)!;
	const skew = SKEWS.find((x) => x.id === s)!;
	// У Ryzen AI Max RAM и есть видеопамять
	const ramList = gpu.id === 'halo' ? RAMS.filter((x) => x.id === 'lp-128') : RAMS.filter((x) => x.id !== 'lp-128');
	const ram = ramList.find((x) => x.id === r) ?? ramList[0];

	const res = compute(quant.bpw, gpu, ram, disk, skew.a);
	const maxStored = Math.max(...res.tiers.map((t) => t.stored), 1);
	const maxMs = Math.max(...res.ms, res.denseMs, 0.001);

	return (
		<div style={css.wrap}>
			<div style={css.title}>🧮 Куда лягут 384 эксперта и сколько будет ток/с</div>
			<div style={css.desc}>
				Собери домашний ПК. Калькулятор раскладывает routed-экспертов DeepSeek-V4.1-Flash по видеопамяти, RAM и
				SSD, считает, сколько гигабайт надо прочитать с каждого уровня на один токен, и выдаёт потолок скорости
				генерации.
			</div>

			<div style={css.grid}>
				<label style={css.field}>
					<span style={css.flabel}>квант экспертов</span>
					<select style={css.select} value={q} onChange={(e) => setQ(e.target.value)}>
						{QUANTS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
					</select>
				</label>
				<label style={css.field}>
					<span style={css.flabel}>видеокарта</span>
					<select style={css.select} value={g} onChange={(e) => setG(e.target.value)}>
						{GPUS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
					</select>
				</label>
				<label style={css.field}>
					<span style={css.flabel}>оперативка</span>
					<select style={css.select} value={ram.id} onChange={(e) => setR(e.target.value)}>
						{ramList.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
					</select>
				</label>
				<label style={css.field}>
					<span style={css.flabel}>диск</span>
					<select style={css.select} value={d} onChange={(e) => setD(e.target.value)}>
						{DISKS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
					</select>
				</label>
				<label style={css.field}>
					<span style={css.flabel}>перекос роутинга (допущение)</span>
					<select style={css.select} value={s} onChange={(e) => setS(e.target.value)}>
						{SKEWS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
					</select>
				</label>
			</div>

			<div style={css.panelTitle}>где лежат эксперты (всего {f1(res.expertsGB)} ГБ)</div>
			{res.tiers.map((t, i) => (
				<div key={t.name} style={css.row}>
					<span style={css.tier}>{t.name}</span>
					<div style={css.track}><div style={css.fill((t.stored / maxStored) * 100, COLORS[i])} /></div>
					<span style={css.val}>{f1(t.stored)} ГБ</span>
				</div>
			))}

			<div style={css.panelTitle}>время на один токен, мс</div>
			<div style={css.row}>
				<span style={css.tier}>плотная часть</span>
				<div style={css.track}><div style={css.fill((res.denseMs / maxMs) * 100, 'var(--text-muted)')} /></div>
				<span style={css.val}>{f1(res.denseMs)} мс · {f1(DENSE_GB)} ГБ</span>
			</div>
			{res.tiers.map((t, i) => (
				<div key={t.name} style={css.row}>
					<span style={css.tier}>{t.name}</span>
					<div style={css.track}><div style={css.fill((res.ms[i] / maxMs) * 100, COLORS[i])} /></div>
					<span style={css.val}>{f1(res.ms[i])} мс · {f1(t.bytes)} ГБ</span>
				</div>
			))}

			<div style={css.readout}>
				На токен читается <strong>{f1(res.perTokGB)} ГБ</strong> экспертов плюс {f1(DENSE_GB)} ГБ плотной части.
				Потолок: <span style={css.big}>{f1(res.tpsLow)}–{f1(res.tpsHigh)} ток/с</span>
				<br />
				Первое число — если уровни читаются по очереди, второе — если идеально параллельно.
			</div>

			<div style={css.note}>
				Это оценка сверху по пропускной способности памяти, а не бенчмарк. Не учтены: вычисления на CPU,
				случайное чтение с SSD, Engram (лежит на диске отдельно), драфтер, который проверяет несколько токенов
				за один проход, и сдвиг роутинга, как у Delta. Доля попаданий считается как cᵅ от доли экспертов на
				уровне, а α — моё допущение: опубликованной статистики роутинга для этой модели нет.
			</div>
		</div>
	);
}
