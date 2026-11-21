import { useState, useMemo } from 'react';

// Интерактивная симуляция Model Collapse на дискретном распределении из 11 бинов:
// края (бины 0,1 и 9,10) — редкие «хвосты» (нишевые знания, редкий стиль, edge cases),
// центр (бины 4..6) — массовый мейнстрим.
// Сравнивает 3 протокола:
// 1. Replace (Shumailov et al., Nature 2024) — схлопывание хвостов и дисперсии.
// 2. Accumulate (Gerstgrasser et al., Stanford 2024) — выход на устойчивое плато.
// 3. Verified / RLVR — внешний верификатор не даёт распределению деградировать.

type Mode = 'replace' | 'accumulate' | 'verified';

// Исходное «человеческое» распределение (нормализовано к сумме 1)
const BASE_DIST = [0.025, 0.045, 0.075, 0.115, 0.155, 0.17, 0.155, 0.115, 0.075, 0.045, 0.025];
const LABELS = ['редк.', 'хвост', 'ниша', '−2', '−1', 'мейнстр.', '+1', '+2', 'ниша', 'хвост', 'редк.'];

// Детерминированная псевдослучайная выборка (LCG), чтобы анимация не дёргалась на ререндере
function seededRng(seed: number) {
	let s = seed >>> 0;
	return () => {
		s = (1664525 * s + 1013904223) >>> 0;
		return s / 4294967296;
	};
}

function sampleCategorical(probs: number[], n: number, sharp: number, seed: number): number[] {
	// Применяем «температуру/срез хвостов» как при finite sampling + top-p/temperature < 1
	const powered = probs.map((p) => Math.pow(Math.max(0, p), sharp));
	const sumP = powered.reduce((a, b) => a + b, 0) || 1;
	const norm = powered.map((p) => p / sumP);

	const cdf: number[] = [];
	let acc = 0;
	for (const p of norm) {
		acc += p;
		cdf.push(acc);
	}

	const counts = new Array(probs.length).fill(0);
	const rand = seededRng(seed);
	for (let i = 0; i < n; i++) {
		const r = rand();
		let idx = cdf.findIndex((c) => r <= c);
		if (idx === -1) idx = probs.length - 1;
		counts[idx]++;
	}
	return counts.map((c) => c / n);
}

function computeStats(dist: number[]) {
	let mean = 0;
	for (let i = 0; i < dist.length; i++) mean += i * dist[i];
	let variance = 0;
	for (let i = 0; i < dist.length; i++) variance += dist[i] * (i - mean) ** 2;
	const tailMass = dist[0] + dist[1] + dist[9] + dist[10];
	const aliveTails = [0, 1, 9, 10].filter((idx) => dist[idx] >= 0.005).length;
	return { variance, tailMass, aliveTails };
}

function simulate(mode: Mode, gen: number, sampleSize: number, sharp: number) {
	let current = [...BASE_DIST];
	let accumulated = [...BASE_DIST];

	for (let g = 1; g <= gen; g++) {
		const synth = sampleCategorical(current, sampleSize, sharp, 1337 + g * 97);
		if (mode === 'replace') {
			current = synth;
		} else if (mode === 'accumulate') {
			// Накопление: исходная база сохраняется, новое поколение досыпается сверху
			accumulated = accumulated.map((v, i) => (v * g + synth[i]) / (g + 1));
			current = accumulated;
		} else {
			// Verified / RLVR: верификатор отбраковывает шум и возвращает вес истинным бинам
			const verified = synth.map((v, i) => 0.65 * BASE_DIST[i] + 0.35 * v);
			const s = verified.reduce((a, b) => a + b, 0) || 1;
			current = verified.map((v) => v / s);
		}
	}
	return current;
}

function sampleQuote(mode: Mode, gen: number): string {
	if (gen === 0) {
		return 'Поколение 0 (живые тексты): «Башня собора Св. Иоанна перестроена в 1728 году в стиле перпендикулярной готики с редкой сводчатой кладкой…»';
	}
	if (mode === 'verified') {
		return `Поколение ${gen} (RLVR / верификатор): факты и код проверяются внешним чекером — редкие валидные ветки сохраняются, текст не «размывается».`;
	}
	if (mode === 'accumulate') {
		return `Поколение ${gen} (Accumulate): стиль стал чуть более «усреднённым», но исходные живые данные в корпусе не дают распределению схлопнуться в мусор.`;
	}
	if (gen <= 3) {
		return `Поколение ${gen} (ранний коллапс): «Собор представляет собой важное свидетельство богатого наследия архитектуры…» — звучит гладко, но редкие детали и даты уже пропали.`;
	}
	if (gen <= 6) {
		return `Поколение ${gen} (нарастает коллапс): «Историческое здание имеет много исторических элементов, которые важны для исторической архитектуры и важных традиций…»`;
	}
	return `Поколение ${gen} (поздний коллапс, как в Nature): «…чернохвостые зайцы, белохвостые зайцы, синехвостые зайцы, краснохвостые зайцы, жёлтохвостые зайцы…»`;
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
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 } as React.CSSProperties,
	modes: { display: 'flex', gap: '0.45rem', flexWrap: 'wrap' as const, marginBottom: '1rem' } as React.CSSProperties,
	chip: (active: boolean) =>
		({
			padding: '0.4rem 0.78rem',
			borderRadius: '8px',
			border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
			background: active ? 'var(--bg-secondary)' : 'transparent',
			color: active ? 'var(--text)' : 'var(--text-secondary)',
			fontSize: '0.79rem',
			fontWeight: 700,
			cursor: 'pointer',
		}) as React.CSSProperties,
	controls: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
		gap: '0.8rem',
		marginBottom: '1.1rem',
		padding: '0.8rem 0.9rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
	} as React.CSSProperties,
	ctrl: { display: 'flex', flexDirection: 'column' as const, gap: '0.35rem' } as React.CSSProperties,
	ctrlHead: { display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)' } as React.CSSProperties,
	chart: {
		display: 'grid',
		gridTemplateColumns: 'repeat(11, 1fr)',
		gap: '0.35rem',
		alignItems: 'end',
		height: '170px',
		padding: '1rem 0.5rem 0.5rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		marginBottom: '0.9rem',
	} as React.CSSProperties,
	col: {
		display: 'flex',
		flexDirection: 'column' as const,
		alignItems: 'center',
		height: '100%',
		justifyContent: 'flex-end',
		gap: '0.35rem',
	} as React.CSSProperties,
	barArea: {
		position: 'relative' as const,
		width: '100%',
		flex: 1,
		display: 'flex',
		alignItems: 'flex-end',
		justifyContent: 'center',
	} as React.CSSProperties,
	colLabel: { fontSize: '0.62rem', color: 'var(--text-muted)', textAlign: 'center' as const, whiteSpace: 'nowrap' as const } as React.CSSProperties,
	stats: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
		gap: '0.6rem',
		marginBottom: '0.85rem',
	} as React.CSSProperties,
	stat: {
		padding: '0.6rem 0.75rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
	} as React.CSSProperties,
	sLabel: { fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase' as const, color: 'var(--text-muted)' } as React.CSSProperties,
	sVal: { fontSize: '0.96rem', fontWeight: 800, color: 'var(--text)', marginTop: '0.15rem' } as React.CSSProperties,
	quote: (danger: boolean) =>
		({
			padding: '0.75rem 0.9rem',
			borderRadius: '9px',
			background: 'var(--bg-secondary)',
			border: `1px solid ${danger ? 'var(--accent-magenta)' : 'var(--cat-tools)'}`,
			fontSize: '0.84rem',
			color: 'var(--text)',
			lineHeight: 1.55,
		}) as React.CSSProperties,
	legend: { display: 'flex', gap: '1rem', flexWrap: 'wrap' as const, fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: '0.75rem' } as React.CSSProperties,
};

export default function ModelCollapseSim() {
	const [mode, setMode] = useState<Mode>('replace');
	const [gen, setGen] = useState(5);
	const [sharp, setSharp] = useState(1.25); // >1 имитирует low-temperature / top-p сэмплинг

	const dist = useMemo(() => simulate(mode, gen, 260, sharp), [mode, gen, sharp]);
	const baseStats = useMemo(() => computeStats(BASE_DIST), []);
	const curStats = useMemo(() => computeStats(dist), [dist]);

	const varPct = Math.round((curStats.variance / baseStats.variance) * 100);
	const tailPct = Math.round((curStats.tailMass / baseStats.tailMass) * 100);
	const maxBar = Math.max(0.25, ...dist, ...BASE_DIST);

	const phase =
		gen === 0
			? 'Исходные живые данные'
			: mode === 'verified'
				? 'Стабильно (внешний чекер)'
				: mode === 'accumulate'
					? 'Плато (коллапса нет)'
					: varPct < 35
						? 'Поздний коллапс!'
						: tailPct < 45
							? 'Ранний коллапс (хвосты тают)'
							: 'Лёгкий дрейф';

	const isDanger = mode === 'replace' && (varPct < 50 || tailPct < 45);

	return (
		<div style={css.wrap}>
			<div style={css.title}>🧬 Симулятор Model Collapse: как вымирают хвосты</div>
			<div style={css.desc}>
				Пунктирная рамка — исходное живое распределение (поколение 0). Потяни ползунок поколений и переключи режим с{' '}
				<strong>Replace</strong> (как в статье <em>Nature</em>) на <strong>Accumulate</strong> (Стэнфорд) и{' '}
				<strong>RLVR</strong>.
			</div>

			<div style={css.modes}>
				<button style={css.chip(mode === 'replace')} onClick={() => setMode('replace')}>
					🔁 Replace (заменяем старые данные)
				</button>
				<button style={css.chip(mode === 'accumulate')} onClick={() => setMode('accumulate')}>
					📚 Accumulate (копим поверх живых)
				</button>
				<button style={css.chip(mode === 'verified')} onClick={() => setMode('verified')}>
					✅ RLVR (внешний верификатор)
				</button>
			</div>

			<div style={css.controls}>
				<div style={css.ctrl}>
					<div style={css.ctrlHead}>
						<span>Поколение обучения (G)</span>
						<code>G = {gen}</code>
					</div>
					<input type="range" min={0} max={12} step={1} value={gen} onChange={(e) => setGen(Number(e.target.value))} />
				</div>
				<div style={css.ctrl}>
					<div style={css.ctrlHead}>
						<span>«Сжатие» сэмплинга (low-T / top-p)</span>
						<code>×{sharp.toFixed(2)}</code>
					</div>
					<input type="range" min={1.0} max={1.5} step={0.05} value={sharp} onChange={(e) => setSharp(Number(e.target.value))} />
				</div>
			</div>

			<div style={css.legend}>
				<span>🟪 Края (бины 1–2 и 10–11) — редкие хвосты</span>
				<span>🟧 Центр — массовый мейнстрим</span>
				<span>⬜ Рамка — исходная база (G=0)</span>
			</div>

			<div style={css.chart}>
				{dist.map((p, i) => {
					const isTail = i <= 1 || i >= 9;
					const curH = (p / maxBar) * 100;
					const baseH = (BASE_DIST[i] / maxBar) * 100;
					return (
						<div key={i} style={css.col}>
							<div style={css.barArea}>
								<div
									style={{
										position: 'absolute',
										bottom: 0,
										width: '78%',
										height: `${baseH}%`,
										border: '1px dashed var(--text-muted)',
										borderRadius: '4px 4px 0 0',
										opacity: 0.45,
										pointerEvents: 'none',
									}}
								/>
								<div
									style={{
										width: '78%',
										height: `${Math.max(1, curH)}%`,
										background: isTail ? 'var(--accent-secondary)' : 'var(--accent)',
										borderRadius: '4px 4px 0 0',
										transition: 'height 0.25s ease',
									}}
								/>
							</div>
							<span style={css.colLabel}>{LABELS[i]}</span>
						</div>
					);
				})}
			</div>

			<div style={css.stats}>
				<div style={css.stat}>
					<div style={css.sLabel}>Разнообразие (дисперсия)</div>
					<div style={css.sVal}>{varPct}% от исходного</div>
				</div>
				<div style={css.stat}>
					<div style={css.sLabel}>Масса редких хвостов</div>
					<div style={css.sVal}>{tailPct}% от исходной</div>
				</div>
				<div style={css.stat}>
					<div style={css.sLabel}>Состояние модели</div>
					<div style={css.sVal}>{phase}</div>
				</div>
			</div>

			<div style={css.quote(isDanger)}>{sampleQuote(mode, gen)}</div>
		</div>
	);
}
