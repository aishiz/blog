import { useState } from 'react';

// Калькулятор месячного чека на LLM:
// Сравнивает 100% frontier vs умный роутинг (RouteLLM / MoM) vs роутинг + semantic cache,
// а также показывает эффект поломки Prompt/KV Cache при слепом round-robin без sticky routing.

const FRONTIER_IN = 3.0; // $ / 1M input tokens
const FRONTIER_OUT = 15.0; // $ / 1M output tokens
const WEAK_IN = 0.15; // $ / 1M input tokens
const WEAK_OUT = 0.6; // $ / 1M output tokens
const AVG_IN_TOK = 2500;
const AVG_OUT_TOK = 500;
const PROMPT_CACHE_SHARE = 0.65; // доля системного префикса, который можно кэшировать на стороне LLM
const PROMPT_CACHE_DISCOUNT = 0.1; // 90% скидка на cached input tokens

function reqCost(tier: 'strong' | 'weak', promptCacheHit: boolean) {
	const inRate = tier === 'strong' ? FRONTIER_IN : WEAK_IN;
	const outRate = tier === 'strong' ? FRONTIER_OUT : WEAK_OUT;
	const cachedIn = promptCacheHit ? AVG_IN_TOK * PROMPT_CACHE_SHARE : 0;
	const freshIn = AVG_IN_TOK - cachedIn;
	return ((freshIn + cachedIn * PROMPT_CACHE_DISCOUNT) * inRate + AVG_OUT_TOK * outRate) / 1_000_000;
}

function fmtUsd(v: number) {
	if (v >= 1000) return `$${Math.round(v).toLocaleString('ru-RU')}`;
	return `$${v.toFixed(0)}`;
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
	grid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
		gap: '0.85rem',
		marginBottom: '1.1rem',
	} as React.CSSProperties,
	ctrl: {
		padding: '0.75rem 0.85rem',
		borderRadius: '9px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '0.35rem',
	} as React.CSSProperties,
	ctrlHead: { display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)' } as React.CSSProperties,
	toggleRow: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
		fontSize: '0.82rem',
		color: 'var(--text)',
		padding: '0.7rem 0.85rem',
		borderRadius: '9px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		marginBottom: '1.1rem',
		cursor: 'pointer',
	} as React.CSSProperties,
	barRow: { marginBottom: '0.85rem' } as React.CSSProperties,
	barLabelRow: { display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.82rem', marginBottom: '0.3rem', color: 'var(--text)' } as React.CSSProperties,
	track: { height: '14px', borderRadius: '999px', background: 'var(--bg-secondary)', overflow: 'hidden', border: '1px solid var(--border)' } as React.CSSProperties,
	fill: (pct: number, color: string) =>
		({
			width: `${Math.max(2, Math.min(100, pct))}%`,
			height: '100%',
			background: color,
			borderRadius: '999px',
			transition: 'width 0.25s ease',
		}) as React.CSSProperties,
	summary: {
		marginTop: '1rem',
		padding: '0.8rem 0.95rem',
		borderRadius: '9px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--cat-tools)',
		fontSize: '0.85rem',
		color: 'var(--text)',
		lineHeight: 1.6,
	} as React.CSSProperties,
	note: { marginTop: '0.8rem', fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.55 } as React.CSSProperties,
};

export default function RoutingCostCalc() {
	const [reqPerDayK, setReqPerDayK] = useState(50); // тыс. запросов в день
	const [weakShare, setWeakShare] = useState(65); // % запросов, уходящих на лёгкую модель
	const [semCacheHit, setSemCacheHit] = useState(15); // % попаданий в semantic cache
	const [stickyCache, setStickyCache] = useState(true); // сохраняет ли шлюз KV / Prompt Cache

	const monthlyReq = reqPerDayK * 1000 * 30;

	// 1. База: всё в frontier-модель, без шлюза (но обычно к одному провайдеру, значит prompt cache работает)
	const costFrontierNoCache = monthlyReq * reqCost('strong', false);
	const costFrontierWithPrefix = monthlyReq * reqCost('strong', true);

	// 2. Умный роутинг (RouteLLM / vLLM SR) без semantic cache
	const weakFrac = weakShare / 100;
	const strongFrac = 1 - weakFrac;
	const costRouted =
		monthlyReq * (strongFrac * reqCost('strong', stickyCache) + weakFrac * reqCost('weak', stickyCache));

	// 3. Роутинг + Semantic Cache (+ копеечный эмбеддинг ~$0.02 / 1M токенов на запрос)
	const missFrac = 1 - semCacheHit / 100;
	const embedOverhead = (monthlyReq * 120 * 0.02) / 1_000_000; // ~120 токенов на user prompt
	const costFullStack = costRouted * missFrac + embedOverhead;

	const maxVal = Math.max(costFrontierNoCache, costRouted, costFullStack);
	const savedVsBase = Math.round((1 - costFullStack / costFrontierWithPrefix) * 100);

	return (
		<div style={css.wrap}>
			<div style={css.title}>💸 Калькулятор чека: во сколько реально обходится роутинг</div>
			<div style={css.desc}>
				Модель расчёта: средний запрос — <code>2 500</code> входных (65% — повторяемый system/tools префикс) и{' '}
				<code>500</code> выходных токенов. Frontier: <code>$3 / $15</code> за 1M, лёгкая модель: <code>$0.15 / $0.60</code> за 1M.
			</div>

			<div style={css.grid}>
				<div style={css.ctrl}>
					<div style={css.ctrlHead}>
						<span>Запросов в день</span>
						<code>{reqPerDayK}K</code>
					</div>
					<input type="range" min={5} max={300} step={5} value={reqPerDayK} onChange={(e) => setReqPerDayK(Number(e.target.value))} />
				</div>
				<div style={css.ctrl}>
					<div style={css.ctrlHead}>
						<span>Доля на лёгкую модель</span>
						<code>{weakShare}%</code>
					</div>
					<input type="range" min={0} max={90} step={5} value={weakShare} onChange={(e) => setWeakShare(Number(e.target.value))} />
				</div>
				<div style={css.ctrl}>
					<div style={css.ctrlHead}>
						<span>Semantic Cache hit</span>
						<code>{semCacheHit}%</code>
					</div>
					<input type="range" min={0} max={50} step={5} value={semCacheHit} onChange={(e) => setSemCacheHit(Number(e.target.value))} />
				</div>
			</div>

			<label style={css.toggleRow}>
				<input type="checkbox" checked={stickyCache} onChange={(e) => setStickyCache(e.target.checked)} />
				<span>
					<strong>Sticky / prefix-aware роутинг</strong> (сохраняет Prompt / KV Cache у провайдера — выключи, чтобы
					увидеть цену слепого round-robin)
				</span>
			</label>

			<div style={css.barRow}>
				<div style={css.barLabelRow}>
					<span>100% Frontier (без Prompt Cache)</span>
					<strong>{fmtUsd(costFrontierNoCache)} / мес</strong>
				</div>
				<div style={css.track}>
					<div style={css.fill((costFrontierNoCache / maxVal) * 100, 'var(--accent-magenta)')} />
				</div>
			</div>

			<div style={css.barRow}>
				<div style={css.barLabelRow}>
					<span>100% Frontier (с Prompt Cache, один провайдер)</span>
					<strong>{fmtUsd(costFrontierWithPrefix)} / мес</strong>
				</div>
				<div style={css.track}>
					<div style={css.fill((costFrontierWithPrefix / maxVal) * 100, 'var(--accent-yellow)')} />
				</div>
			</div>

			<div style={css.barRow}>
				<div style={css.barLabelRow}>
					<span>Smart Routing ({weakShare}% лёгкая / {100 - weakShare}% frontier)</span>
					<strong>{fmtUsd(costRouted)} / мес</strong>
				</div>
				<div style={css.track}>
					<div style={css.fill((costRouted / maxVal) * 100, 'var(--cat-fundament)')} />
				</div>
			</div>

			<div style={css.barRow}>
				<div style={css.barLabelRow}>
					<span>Smart Routing + Semantic Cache ({semCacheHit}% hit)</span>
					<strong>{fmtUsd(costFullStack)} / мес</strong>
				</div>
				<div style={css.track}>
					<div style={css.fill((costFullStack / maxVal) * 100, 'var(--cat-tools)')} />
				</div>
			</div>

			<div style={css.summary}>
				Итог против честной базы (Frontier + Prompt Cache):{' '}
				<strong>
					{savedVsBase >= 0 ? `экономия −${savedVsBase}%` : `переплата +${Math.abs(savedVsBase)}%`}
				</strong>{' '}
				({fmtUsd(Math.abs(costFrontierWithPrefix - costFullStack))}/мес).
				{!stickyCache && (
					<>
						{' '}
						⚠️ Без sticky-роутинга ты теряешь 90% скидку на cached input tokens — если доля сложных запросов высокая,
						слепой round-robin способен <em>увеличить</em> чек даже с роутером.
					</>
				)}
			</div>

			<div style={css.note}>
				Оценка не включает стоимость хостинга самого шлюза и векторной БД (для Bifrost/Redis это обычно $30–150/мес, что
				теряется на фоне чека на токены уже от 10K запросов в день).
			</div>
		</div>
	);
}
