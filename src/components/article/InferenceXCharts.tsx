import { useState, useEffect } from 'react';

// Данные SemiAnalysis InferenceX по DeepSeek-V4.1-Flash, выгрузка из открытого API
// https://inferencex.semianalysis.com/api/v1/benchmarks?model=DeepSeek-V4.1-Flash (срез на 27.10.2026).
// Нагрузка AgentX: реальные трейсы агентов, в среднем ~170K входных и ~1,2K выходных токенов на запрос.
// interactivity = median_intvty (ток/с на пользователя внутри ответа), throughput = output_tput_per_gpu.
// Фронт Парето: для каждой видеокарты лучшие точки по всем фреймворкам.
// Домашние цифры — заявления авторов постов, другая нагрузка и короткие промпты.
const SINGLE: { name: string; v: number; note: string; home?: boolean }[] = [
	{ name: 'GB300', v: 980, note: '4 GPU' },
	{ name: 'B300', v: 847, note: '4 GPU' },
	{ name: 'B200', v: 690, note: '4 GPU' },
	{ name: 'MI355X', v: 685, note: '4 GPU' },
	{ name: 'GB200', v: 588, note: '4 GPU' },
	{ name: 'H100', v: 361, note: '8 GPU' },
	{ name: 'H200', v: 348, note: '8 GPU' },
	{ name: 'MI325X', v: 236, note: '8 GPU' },
	{ name: 'MI300X', v: 234, note: '8 GPU' },
	{ name: '5090 + 5060 Ti', v: 63.5, note: 'Basalt, IQ1_S', home: true },
	{ name: '3090 + 192 ГБ', v: 41, note: 'Delta, Q2', home: true },
	{ name: 'Ryzen AI Max', v: 21.3, note: 'Strata, 2 бита', home: true },
	{ name: '3060 + 64 ГБ', v: 7.4, note: 'Promethevs', home: true },
	{ name: '3090, ПК за €2k', v: 7.2, note: 'llama.cpp, IQ1_S', home: true },
];

const FRONTIER: { hw: string; color: string; pts: [number, number][] }[] = [
	{ hw: 'GB300', color: 'var(--accent)', pts: [[980.4, 52], [684.9, 71], [588.2, 191], [537.6, 192], [400, 373], [343.6, 3203], [213.7, 4198], [203.3, 6866], [152.2, 7366], [78.9, 7528]] },
	{ hw: 'B300', color: 'var(--accent-magenta)', pts: [[847.5, 50], [806.5, 119], [628.9, 195], [471.7, 237], [324.7, 355], [322.6, 359], [263.2, 686], [187.6, 974], [166.7, 1554], [112.5, 2562], [77.4, 3262]] },
	{ hw: 'B200', color: 'var(--accent-secondary)', pts: [[689.7, 47], [649.4, 66], [621.1, 114], [543.5, 117], [492.6, 176], [448.4, 192], [427.4, 265], [334.4, 370], [320.5, 571], [283.3, 841], [239.8, 1178], [202.8, 1469], [160, 1990], [114.5, 2503]] },
	{ hw: 'MI355X', color: 'var(--cat-tools)', pts: [[684.9, 45], [666.7, 51], [662.3, 67], [591.7, 115], [558.7, 129], [490.2, 187], [478.5, 222], [452.5, 227], [367.6, 364], [328.9, 364], [325.7, 367], [218.8, 636], [216.0, 658], [102.5, 1343], [96.8, 1351]] },
	{ hw: 'H200', color: 'var(--cat-fundament)', pts: [[349.7, 22], [327.9, 28], [310.6, 37], [309.6, 43], [295.9, 54], [220.8, 100], [148.6, 163], [99.3, 278], [41.6, 445]] },
	{ hw: 'H100', color: 'var(--accent-yellow)', pts: [[361.0, 19], [358.4, 23], [348.4, 29], [271.7, 53], [209.2, 86], [172.4, 110], [148.6, 123], [117.8, 129]] },
];

// inferencex-e2e/infx/golden_al_distribution/dsv41flash_dspark.yaml: SPEED-Bench, код, vLLM TP4, t=1.0
const AL = {
	off: [1.88, 2.62, 3.27, 3.73, 4.07],
	on: [1.81, 2.43, 2.9, 3.26, 3.51],
};

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
	tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.1rem', flexWrap: 'wrap' as const } as React.CSSProperties,
	tab: (active: boolean) =>
		({
			padding: '0.4rem 0.8rem',
			borderRadius: '8px',
			border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
			background: active ? 'var(--bg-secondary)' : 'transparent',
			color: active ? 'var(--text)' : 'var(--text-secondary)',
			fontSize: '0.8rem',
			fontWeight: 700,
			cursor: 'pointer',
		}) as React.CSSProperties,
	row: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' } as React.CSSProperties,
	name: (home?: boolean) =>
		({
			width: '118px',
			flexShrink: 0,
			fontSize: '0.76rem',
			fontWeight: 700,
			color: home ? 'var(--accent)' : 'var(--text)',
			whiteSpace: 'nowrap' as const,
			overflow: 'hidden',
			textOverflow: 'ellipsis',
		}) as React.CSSProperties,
	track: { flex: 1, height: '12px', borderRadius: '4px', background: 'var(--bg-secondary)', overflow: 'hidden' } as React.CSSProperties,
	fill: (pct: number, color: string) => ({ width: `${pct}%`, height: '100%', background: color }) as React.CSSProperties,
	val: {
		width: '112px',
		flexShrink: 0,
		fontSize: '0.72rem',
		textAlign: 'right' as const,
		color: 'var(--text-secondary)',
		fontVariantNumeric: 'tabular-nums' as const,
		lineHeight: 1.3,
	} as React.CSSProperties,
	sep: { fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'var(--text-secondary)', margin: '0.8rem 0 0.4rem' } as React.CSSProperties,
	legend: { display: 'flex', gap: '0.9rem', flexWrap: 'wrap' as const, fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' } as React.CSSProperties,
	swatch: (color: string) =>
		({ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: color, marginRight: '0.35rem', verticalAlign: 'middle' }) as React.CSSProperties,
	note: { marginTop: '0.9rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
	src: { marginTop: '0.6rem', fontSize: '0.74rem', color: 'var(--text-muted)' } as React.CSSProperties,
};

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

const fmt = (v: number) => (v >= 100 ? Math.round(v).toString() : v.toFixed(1).replace('.', ','));

function SinglePanel() {
	// Логарифмическая длина полос: иначе домашние сетапы — невидимые полоски
	const lo = Math.log10(5);
	const hi = Math.log10(1000);
	const pct = (v: number) => ((Math.log10(v) - lo) / (hi - lo)) * 100;
	const dc = SINGLE.filter((s) => !s.home);
	const home = SINGLE.filter((s) => s.home);
	const bar = (s: (typeof SINGLE)[number]) => (
		<div key={s.name} style={css.row}>
			<span style={css.name(s.home)} title={s.name}>{s.name}</span>
			<div style={css.track}><div style={css.fill(pct(s.v), s.home ? 'var(--accent)' : 'var(--accent-secondary)')} /></div>
			<span style={css.val}>{fmt(s.v)} ток/с<br />{s.note}</span>
		</div>
	);
	return (
		<div>
			<div style={css.sep}>дата-центр, InferenceX, один пользователь</div>
			{dc.map(bar)}
			<div style={css.sep}>дома, заявления авторов</div>
			{home.map(bar)}
			<div style={css.note}>
				Шкала логарифмическая. Дата-центр — медианная скорость генерации внутри ответа при одном запросе
				(conc=1), с MTP, на 4–8 GPU в FP4 на агентных трейсах AgentX. Дома у каждого своя методика и короткие
				промпты, так что это сравнение порядков, а не рейтинг.
			</div>
		</div>
	);
}

function ParetoPanel({ mobile }: { mobile: boolean }) {
	const W = mobile ? 360 : 560;
	const H = mobile ? 300 : 280;
	const pad = { l: 58, r: 22, t: 10, b: 36 };
	const xMax = 1000;
	const yLo = Math.log10(10);
	const yHi = Math.log10(10000);
	const x = (v: number) => pad.l + (v / xMax) * (W - pad.l - pad.r);
	const y = (v: number) => pad.t + ((yHi - Math.log10(v)) / (yHi - yLo)) * (H - pad.t - pad.b);
	return (
		<div>
			<div style={css.legend}>
				{FRONTIER.map((f) => (
					<span key={f.hw}><span style={css.swatch(f.color)} />{f.hw}</span>
				))}
			</div>
			<svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img"
				aria-label="Фронт Парето: выходные токены в секунду на GPU против скорости для одного пользователя">
				{[10, 100, 1000, 10000].map((t) => (
					<g key={t}>
						<line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--border)" />
						<text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize={13} fill="var(--text-muted)">{t >= 1000 ? `${t / 1000}K` : t}</text>
					</g>
				))}
				{(mobile ? [0, 500, 1000] : [0, 250, 500, 750, 1000]).map((t) => (
					<text key={t} x={x(t)} y={H - 18} textAnchor="middle" fontSize={13} fill="var(--text-muted)">{t}</text>
				))}
				<text x={(W + pad.l) / 2} y={H - 2} textAnchor="middle" fontSize={12} fill="var(--text-secondary)">ток/с на одного пользователя →</text>
				<text x={14} y={(H - pad.b + pad.t) / 2} textAnchor="middle" fontSize={12} fill="var(--text-secondary)" transform={`rotate(-90 14 ${(H - pad.b + pad.t) / 2})`}>ток/с на GPU</text>
				{FRONTIER.map((f) => (
					<g key={f.hw}>
						<polyline fill="none" stroke={f.color} strokeWidth={2.5} points={f.pts.map(([a, b]) => `${x(a)},${y(b)}`).join(' ')} />
						{f.pts.map(([a, b], i) => <circle key={i} cx={x(a)} cy={y(b)} r={2.5} fill={f.color} />)}
					</g>
				))}
			</svg>
			<div style={css.note}>
				Каждая точка — свой уровень параллелизма. Справа один-два запроса, каждый летит быстро, но GPU почти
				простаивает. Слева сотни и тысячи запросов: каждому медленнее, зато на GPU приходится в десятки раз больше
				токенов. Шкала по вертикали логарифмическая. У GB300 крайние левые точки — дезагрегированный
				мультинодовый сетап с тысячами одновременных запросов.
			</div>
		</div>
	);
}

function DraftPanel({ mobile }: { mobile: boolean }) {
	const W = mobile ? 360 : 560;
	const H = mobile ? 240 : 220;
	const pad = { l: 40, r: 12, t: 10, b: 36 };
	const ks = [1, 2, 3, 4, 5];
	const x = (k: number) => pad.l + ((k - 0.5) / 5) * (W - pad.l - pad.r);
	const y = (v: number) => pad.t + (1 - v / 6) * (H - pad.t - pad.b);
	const bw = mobile ? 18 : 26;
	return (
		<div>
			<div style={css.legend}>
				<span><span style={css.swatch('var(--accent)')} />thinking выключен</span>
				<span><span style={css.swatch('var(--accent-secondary)')} />thinking включён</span>
				<span><span style={css.swatch('var(--text-muted)')} />предел: все черновики приняты</span>
			</div>
			<svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img"
				aria-label="Сколько токенов принимается за один проход в зависимости от числа черновых токенов DSpark">
				{[0, 2, 4, 6].map((t) => (
					<g key={t}>
						<line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--border)" />
						<text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize={13} fill="var(--text-muted)">{t}</text>
					</g>
				))}
				{ks.map((k, i) => (
					<g key={k}>
						<line x1={x(k) - bw - 4} x2={x(k) + bw + 4} y1={y(k + 1)} y2={y(k + 1)} stroke="var(--text-muted)" strokeDasharray="4 3" />
						<rect x={x(k) - bw} y={y(AL.off[i])} width={bw - 2} height={y(0) - y(AL.off[i])} fill="var(--accent)" rx={3} />
						<rect x={x(k) + 2} y={y(AL.on[i])} width={bw - 2} height={y(0) - y(AL.on[i])} fill="var(--accent-secondary)" rx={3} />
						<text x={x(k) - bw / 2 - 1} y={y(AL.off[i]) - 5} textAnchor="middle" fontSize={mobile ? 10 : 12} fill="var(--text)">{AL.off[i].toFixed(2).replace('.', ',')}</text>
						<text x={x(k) + bw / 2 + 1} y={y(AL.on[i]) - 5} textAnchor="middle" fontSize={mobile ? 10 : 12} fill="var(--text)">{AL.on[i].toFixed(2).replace('.', ',')}</text>
						<text x={x(k)} y={H - 18} textAnchor="middle" fontSize={13} fill="var(--text-muted)">{k}</text>
					</g>
				))}
				<text x={(W + pad.l) / 2} y={H - 2} textAnchor="middle" fontSize={12} fill="var(--text-secondary)">черновых токенов за проход →</text>
			</svg>
			<div style={css.note}>
				Сколько токенов в среднем получается за один проход большой модели, включая проверочный. Задачи на
				код (SPEED-Bench), vLLM на 4 GPU, температура 1,0. С ростом длины черновика выигрыш затухает: пятый
				черновой токен добавляет всего 0,25–0,34 токена.
			</div>
		</div>
	);
}

export default function InferenceXCharts() {
	const [tab, setTab] = useState<'single' | 'pareto' | 'draft'>('single');
	const mobile = useIsMobile();
	return (
		<div style={css.wrap}>
			<div style={css.title}>📊 Как эту же модель гоняют в дата-центре</div>
			<div style={css.desc}>
				Замеры SemiAnalysis InferenceX: DeepSeek-V4.1-Flash на серверных GPU NVIDIA и AMD, агентная нагрузка с
				длинным контекстом (в среднем около 170K токенов на входе).
			</div>
			<div style={css.tabs}>
				<button style={css.tab(tab === 'single')} onClick={() => setTab('single')}>Один пользователь: ЦОД vs дом</button>
				<button style={css.tab(tab === 'pareto')} onClick={() => setTab('pareto')}>Скорость vs загрузка GPU</button>
				<button style={css.tab(tab === 'draft')} onClick={() => setTab('draft')}>Драфтер DSpark</button>
			</div>
			{tab === 'single' ? <SinglePanel /> : tab === 'pareto' ? <ParetoPanel mobile={mobile} /> : <DraftPanel mobile={mobile} />}
			<div style={css.src}>
				{tab === 'draft'
					? 'Данные: SemiAnalysis InferenceX, файл golden_al_distribution/dsv41flash_dspark.yaml в их GitHub.'
					: 'Данные: SemiAnalysis InferenceX, открытый API, срез на 27.10.2026. Графики построены по этим данным.'}
			</div>
		</div>
	);
}
