import { useState, useEffect } from 'react';

// Панель А: 2412.11385v1, Appendix A, Table 2 — частота словоформы на миллион токенов
// в аннотациях PubMed. Опубликованы только 2020 и 2024 (срез от 4 мая 2024, год неполный),
// поэтому промежуточных точек нет и линию между ними не рисуем.
const ENDPOINTS = [
	{ w: 'underscores', a: 4.5, b: 45.19 },
	{ w: 'intricate', a: 6.22, b: 44.22 },
	{ w: 'delves', a: 0.21, b: 14.38 },
	{ w: 'realm', a: 2.25, b: 10.85 },
	{ w: 'showcasing', a: 0.59, b: 8.79 },
	{ w: 'delve', a: 0.58, b: 8.5 },
];

// Панель Б: Matsui 2025 (doi:10.5334/pme.1929), UseRate_2000-2024.csv из репозитория
// автора — доля записей PubMed за год, где встречается слово. Полные годы. Другая
// единица и другой корпус, чем в панели А, поэтому панели не сводим на одну ось.
const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024];
const SERIES = [
	{
		w: 'delve',
		color: 'var(--accent)',
		v: [0.000136124, 0.000181147, 0.000198592, 0.000274036, 0.000345658, 0.001668624, 0.005936512],
	},
	{
		w: 'pivotal',
		color: 'var(--accent-magenta)',
		v: [0.004477308, 0.004548402, 0.004729656, 0.005009826, 0.005063669, 0.006501797, 0.015437239],
	},
	{
		w: 'randomly',
		color: 'var(--text-muted)',
		v: [0.016968939, 0.017111662, 0.016552578, 0.016298992, 0.016871602, 0.016387993, 0.016568581],
	},
];

// Логарифмическая ось для индекса «во сколько раз больше, чем в 2018»
const TICKS = [1, 2, 5, 10, 20, 50];
const LOG_MIN = Math.log(0.8);
const LOG_MAX = Math.log(60);

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
		marginBottom: '1.1rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
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
	row: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.55rem' } as React.CSSProperties,
	word: {
		width: '92px',
		flexShrink: 0,
		fontSize: '0.78rem',
		fontWeight: 700,
		color: 'var(--text)',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
	} as React.CSSProperties,
	bars: { flex: 1, display: 'flex', flexDirection: 'column' as const, gap: '3px' } as React.CSSProperties,
	track: { height: '10px', borderRadius: '3px', background: 'var(--bg-secondary)', overflow: 'hidden' } as React.CSSProperties,
	fill: (pct: number, color: string) =>
		({ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.3s ease' }) as React.CSSProperties,
	vals: {
		width: '92px',
		flexShrink: 0,
		fontSize: '0.72rem',
		color: 'var(--text-secondary)',
		textAlign: 'right' as const,
		fontVariantNumeric: 'tabular-nums' as const,
		lineHeight: 1.35,
	} as React.CSSProperties,
	mult: { fontWeight: 800, color: 'var(--accent)' } as React.CSSProperties,
	legend: { display: 'flex', gap: '1rem', flexWrap: 'wrap' as const, fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' } as React.CSSProperties,
	swatch: (color: string) =>
		({ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: color, marginRight: '0.35rem', verticalAlign: 'middle' }) as React.CSSProperties,
	readout: {
		marginTop: '0.9rem',
		padding: '0.75rem 0.9rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		fontSize: '0.84rem',
		color: 'var(--text)',
		lineHeight: 1.6,
	} as React.CSSProperties,
	note: { marginTop: '0.9rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

function EndpointPanel() {
	const max = Math.max(...ENDPOINTS.map((e) => e.b));
	return (
		<div>
			<div style={css.legend}>
				<span><span style={css.swatch('var(--text-muted)')} />2020</span>
				<span><span style={css.swatch('var(--accent)')} />2024 (до 4 мая)</span>
			</div>
			{ENDPOINTS.map((e) => (
				<div key={e.w} style={css.row}>
					<span style={css.word}>{e.w}</span>
					<div style={css.bars}>
						<div style={css.track}><div style={css.fill((e.a / max) * 100, 'var(--text-muted)')} /></div>
						<div style={css.track}><div style={css.fill((e.b / max) * 100, 'var(--accent)')} /></div>
					</div>
					<span style={css.vals}>
						{e.a} → {e.b}
						<br />
						<span style={css.mult}>×{(e.b / e.a).toFixed(1)}</span>
					</span>
				</div>
			))}
			<div style={css.note}>
				Вхождений на миллион слов в аннотациях PubMed. Множитель посчитан по округлённым значениям из таблицы,
				поэтому может на десятые расходиться с процентами в самой статье. Между 2020 и 2024 точек в источнике
				нет, и рисовать их мы не будем.
			</div>
		</div>
	);
}

function AnnualPanel({ mobile }: { mobile: boolean }) {
	const [hover, setHover] = useState(YEARS.length - 1);
	const W = 560;
	const H = mobile ? 260 : 240;
	const pad = { l: 36, r: 14, t: 12, b: 26 };
	const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / (YEARS.length - 1);
	const y = (v: number) => pad.t + ((LOG_MAX - Math.log(v)) / (LOG_MAX - LOG_MIN)) * (H - pad.t - pad.b);
	const idx = (s: (typeof SERIES)[number], i: number) => s.v[i] / s.v[0];

	return (
		<div>
			<div style={css.legend}>
				{SERIES.map((s) => (
					<span key={s.w}><span style={css.swatch(s.color)} />{s.w}</span>
				))}
			</div>
			<svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img"
				aria-label="Во сколько раз выросла доля записей PubMed со словом по сравнению с 2018 годом, логарифмическая шкала">
				{TICKS.map((t) => (
					<g key={t}>
						<line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
						<text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize={13} fill="var(--text-muted)">×{t}</text>
					</g>
				))}
				{YEARS.map((yr, i) => (
					<g key={yr}>
						<text x={x(i)} y={H - 8} textAnchor="middle" fontSize={13}
							fill={i === hover ? 'var(--text)' : 'var(--text-muted)'} fontWeight={i === hover ? 700 : 400}>{yr}</text>
						<rect x={x(i) - 30} y={pad.t} width={60} height={H - pad.t - pad.b} fill="transparent"
							onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} style={{ cursor: 'pointer' }} />
					</g>
				))}
				<line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="var(--border-light)" strokeDasharray="3 3" pointerEvents="none" />
				{SERIES.map((s) => (
					<g key={s.w} pointerEvents="none">
						<polyline fill="none" stroke={s.color} strokeWidth={2.5}
							points={YEARS.map((_, i) => `${x(i)},${y(idx(s, i))}`).join(' ')} />
						{YEARS.map((_, i) => (
							<circle key={i} cx={x(i)} cy={y(idx(s, i))} r={i === hover ? 4.5 : 3} fill={s.color} />
						))}
					</g>
				))}
			</svg>
			<div style={css.readout}>
				<strong>{YEARS[hover]}</strong>:{' '}
				{SERIES.map((s, k) => (
					<span key={s.w}>
						{k > 0 && ' · '}
						<span style={{ color: s.color, fontWeight: 700 }}>{s.w}</span> в {(s.v[hover] * 100).toFixed(3)}% записей
						(×{idx(s, hover).toFixed(1)} к 2018)
					</span>
				))}
			</div>
			<div style={css.note}>
				Доля записей PubMed за год, где есть слово (с формами вроде delves/delved), годы полные. Шкала
				логарифмическая, иначе pivotal рядом с delve выглядит как плоская линия. randomly здесь контрольное
				слово, которое ChatGPT не любит. Наведи или тапни на год.
			</div>
		</div>
	);
}

export default function DelveTimeline() {
	const [tab, setTab] = useState<'endpoints' | 'annual'>('annual');
	const mobile = useIsMobile();
	return (
		<div style={css.wrap}>
			<div style={css.title}>📈 Как росли слова-маркеры</div>
			<div style={css.desc}>
				Два разных исследования, два разных способа считать, поэтому две вкладки, а не один график. Сравнивать
				можно форму роста, а не сами числа между вкладками.
			</div>
			<div style={css.tabs}>
				<button style={css.tab(tab === 'annual')} onClick={() => setTab('annual')}>
					По годам, 2018–2024 (Matsui)
				</button>
				<button style={css.tab(tab === 'endpoints')} onClick={() => setTab('endpoints')}>
					2020 vs 2024, 6 слов (Juzek &amp; Ward)
				</button>
			</div>
			{tab === 'annual' ? <AnnualPanel mobile={mobile} /> : <EndpointPanel />}
		</div>
	);
}
