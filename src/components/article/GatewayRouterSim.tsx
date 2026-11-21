import { useState } from 'react';

// Упрощённая интерактивная модель пайплайна LLM Gateway:
// Auth & Budget -> Exact/Semantic Cache -> Smart Router (MF/ModernBERT) -> Provider + Fallback.
// Показывает, как порог кэша, порог сложности и сбой провайдера меняют маршрут, задержку и чек.

type ScenarioId = 'faq' | 'simple' | 'hard' | 'trap' | 'outage' | 'agent';

interface Scenario {
	id: ScenarioId;
	label: string;
	prompt: string;
	cacheSim: number;
	cacheMatch: string;
	cacheIsTrap?: boolean;
	complexity: number; // 0..1 (оценка роутера: 0 — тривиально, 1 — нужна сильная модель)
	inTokens: number;
	outTokens: number;
	multiTurn?: boolean;
}

const SCENARIOS: Scenario[] = [
	{
		id: 'faq',
		label: 'Повторный FAQ',
		prompt: 'Во сколько сегодня закрывается техподдержка?',
		cacheSim: 0.93,
		cacheMatch: 'До скольки работает саппорт?',
		complexity: 0.12,
		inTokens: 320,
		outTokens: 110,
	},
	{
		id: 'simple',
		label: 'Простой рерайт',
		prompt: 'Исправь опечатки в письме клиенту и сделай тон чуть вежливее.',
		cacheSim: 0.61,
		cacheMatch: 'Перепиши письмо в деловом стиле',
		complexity: 0.24,
		inTokens: 650,
		outTokens: 280,
	},
	{
		id: 'hard',
		label: 'Сложный дебаг',
		prompt: 'Найди race condition в этом Go-воркере с каналами и предложи фикс без мьютекса.',
		cacheSim: 0.42,
		cacheMatch: 'Как работают каналы в Go?',
		complexity: 0.88,
		inTokens: 2400,
		outTokens: 900,
	},
	{
		id: 'trap',
		label: 'Ловушка кэша (ID)',
		prompt: 'Сформируй SQL-отчёт по заказам клиента id=8841 за ноябрь.',
		cacheSim: 0.94,
		cacheMatch: 'Сформируй SQL-отчёт по заказам клиента id=1024 за ноябрь.',
		cacheIsTrap: true,
		complexity: 0.46,
		inTokens: 540,
		outTokens: 260,
	},
	{
		id: 'outage',
		label: '429 от провайдера',
		prompt: 'Разбери стектрейс Kubernetes OOMKilled и объясни, где течёт память.',
		cacheSim: 0.53,
		cacheMatch: 'Что значит OOMKilled в k8s?',
		complexity: 0.79,
		inTokens: 1800,
		outTokens: 650,
	},
	{
		id: 'agent',
		label: 'Шаг кодового агента',
		prompt: '[system 12K tokens + 14 шагов истории] Запусти pytest и почини упавший тест.',
		cacheSim: 0.71,
		cacheMatch: 'Запусти тесты и исправь ошибки',
		complexity: 0.82,
		inTokens: 18000,
		outTokens: 700,
		multiTurn: true,
	},
];

// Тарифы за 1M токенов (ориентир 2026: frontier vs лёгкая модель)
const STRONG_IN = 3.0;
const STRONG_OUT = 15.0;
const WEAK_IN = 0.15;
const WEAK_OUT = 0.6;

type StepStatus = 'pass' | 'warn' | 'fail' | 'skip';
interface TraceStep {
	label: string;
	status: StepStatus;
	text: string;
}

function calcCostUsd(inTok: number, outTok: number, tier: 'strong' | 'weak', prefixHit = false) {
	const inRate = tier === 'strong' ? STRONG_IN : WEAK_IN;
	const outRate = tier === 'strong' ? STRONG_OUT : WEAK_OUT;
	const effectiveIn = prefixHit ? inTok * 0.15 : inTok;
	return (effectiveIn * inRate + outTok * outRate) / 1_000_000;
}

function evaluate(
	sc: Scenario,
	cacheOn: boolean,
	cacheThreshold: number,
	smartRouterOn: boolean,
	routerThreshold: number,
	primaryDown: boolean,
) {
	const steps: TraceStep[] = [];
	const baselineCost = calcCostUsd(sc.inTokens, sc.outTokens, 'strong', false);

	// 1. Auth & Rate Limits
	steps.push({
		label: 'Virtual Key, бюджет и TPM/RPM',
		status: 'pass',
		text: `Ключ команды валиден, лимит $150/день не исчерпан. Вход ~${sc.inTokens.toLocaleString('ru-RU')} токенов — проходит по TPM-квоте.`,
	});

	// 2. Semantic Cache
	if (!cacheOn) {
		steps.push({
			label: 'Semantic Cache',
			status: 'skip',
			text: 'Кэш выключен — идём сразу к роутеру и модели.',
		});
	} else if (sc.multiTurn) {
		steps.push({
			label: 'Semantic Cache',
			status: 'skip',
			text: 'Многошаговый агентский запрос с историей: semantic cache принудительно обойдён (bypass), чтобы не вернуть чужой шаг.',
		});
	} else if (sc.cacheSim >= cacheThreshold) {
		if (sc.cacheIsTrap) {
			steps.push({
				label: 'Semantic Cache',
				status: 'fail',
				text: `ЛОЖНОЕ СРАБАТЫВАНИЕ! Cosine = ${sc.cacheSim.toFixed(2)} ≥ ${cacheThreshold.toFixed(2)}. Похоже на «${sc.cacheMatch}», но ID клиента другой — шлюз отдал чужой SQL-запрос!`,
			});
			steps.push({ label: 'Smart Router (MF / ModernBERT)', status: 'skip', text: 'не дошли — ответ взят из кэша' });
			steps.push({ label: 'Провайдер и Fallback', status: 'skip', text: 'не дошли — ответ взят из кэша' });
			return {
				steps,
				target: 'Semantic Cache (ошибка данных!)',
				latencyMs: 38,
				costUsd: 0.00001,
				baselineCost,
				verdictType: 'danger' as const,
				verdictText:
					'⚠️ Запрос закрыт за 38 мс и почти бесплатно, но ответ неверный: в кэше лежал запрос для id=1024, а просили id=8841. Запросы с ID и параметрами нельзя пускать в семантический кэш без guard-фильтра.',
			};
		}
		steps.push({
			label: 'Semantic Cache',
			status: 'pass',
			text: `HIT! Cosine = ${sc.cacheSim.toFixed(2)} ≥ ${cacheThreshold.toFixed(2)} к записи «${sc.cacheMatch}». Эмбеддинг + поиск заняли ~35 мс.`,
		});
		steps.push({ label: 'Smart Router (MF / ModernBERT)', status: 'skip', text: 'не нужен — ответ уже готов' });
		steps.push({ label: 'Провайдер и Fallback', status: 'skip', text: 'LLM вообще не вызывали' });
		return {
			steps,
			target: 'Semantic Cache (HIT)',
			latencyMs: 35,
			costUsd: 0.00001,
			baselineCost,
			verdictType: 'ok' as const,
			verdictText: `✅ Ответ отдан из кэша за 35 мс вместо ~1 400 мс. Экономия на запросе — почти 100%.`,
		};
	} else {
		steps.push({
			label: 'Semantic Cache',
			status: 'warn',
			text: `MISS (cosine = ${sc.cacheSim.toFixed(2)} < ${cacheThreshold.toFixed(2)}). Добавили +25 мс на эмбеддинг, идём дальше.`,
		});
	}

	// 3. Smart Router
	const cacheOverhead = cacheOn && !sc.multiTurn ? 25 : 0;
	let chosenTier: 'strong' | 'weak' = 'strong';
	let routerOverhead = 0;

	if (!smartRouterOn) {
		steps.push({
			label: 'Smart Router (MF / ModernBERT)',
			status: 'skip',
			text: 'Умный роутинг выключен — всё летит в сильную модель (frontier).',
		});
	} else {
		routerOverhead = 18;
		if (sc.complexity >= routerThreshold) {
			chosenTier = 'strong';
			steps.push({
				label: 'Smart Router (MF / ModernBERT)',
				status: 'pass',
				text: `Оценка сложности = ${sc.complexity.toFixed(2)} ≥ порога ${routerThreshold.toFixed(2)} → отправляем на сильную модель (frontier).`,
			});
		} else {
			chosenTier = 'weak';
			steps.push({
				label: 'Smart Router (MF / ModernBERT)',
				status: 'pass',
				text: `Оценка сложности = ${sc.complexity.toFixed(2)} < порога ${routerThreshold.toFixed(2)} → достаточно быстрой дешёвой модели (~20× дешевле).`,
			});
		}
	}

	// 4. Provider & Fallback + Sticky KV-cache
	const effectiveDown = primaryDown || sc.id === 'outage';
	let providerLatency = chosenTier === 'strong' ? 1950 : 480;
	let prefixHit = false;
	let targetName = chosenTier === 'strong' ? 'Frontier Model (primary)' : 'Fast/Small Model (primary)';

	if (effectiveDown) {
		providerLatency += 320;
		targetName = chosenTier === 'strong' ? 'Frontier Model (fallback-регион)' : 'Fast/Small Model (fallback)';
		steps.push({
			label: 'Провайдер и Fallback',
			status: 'warn',
			text: 'Primary вернул 429 Too Many Requests → шлюз отправил его в cooldown на 60 сек и прозрачно переключил запрос на резервный эндпоинт (+320 мс).',
		});
	} else if (sc.multiTurn) {
		prefixHit = true;
		providerLatency = 1150;
		steps.push({
			label: 'Провайдер и Fallback',
			status: 'pass',
			text: 'Sticky-маршрутизация по session_id приклеила запрос к тому же бэкенду → сработал Prompt / KV Cache на 12K системных токенов (вход в ~6× дешевле и быстрее TTFT).',
		});
	} else {
		steps.push({
			label: 'Провайдер и Fallback',
			status: 'pass',
			text: `Отправлено в ${targetName}. Стрим SSE проксируется клиенту, учёт токенов и логи улетают асинхронно.`,
		});
	}

	const costUsd = calcCostUsd(sc.inTokens, sc.outTokens, chosenTier, prefixHit);
	const totalLatency = cacheOverhead + routerOverhead + providerLatency;
	const savedPct = Math.max(0, Math.round((1 - costUsd / baselineCost) * 100));

	return {
		steps,
		target: targetName,
		latencyMs: totalLatency,
		costUsd,
		baselineCost,
		verdictType: effectiveDown ? ('warn' as const) : ('ok' as const),
		verdictText:
			savedPct > 5
				? `✅ Ушло в ${targetName} за ${totalLatency} мс. Экономия на запросе: −${savedPct}% по сравнению со «всё на frontier без кэша».`
				: `✅ Ушло в ${targetName} за ${totalLatency} мс. Сэкономить здесь нельзя (задача сложная), но шлюз отработал лимиты${effectiveDown ? ' и спас от 429 через fallback' : ''}.`,
	};
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
	presets: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' as const, marginBottom: '1rem' } as React.CSSProperties,
	chip: (active: boolean) =>
		({
			padding: '0.35rem 0.72rem',
			borderRadius: '8px',
			border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
			background: active ? 'var(--bg-secondary)' : 'transparent',
			color: active ? 'var(--text)' : 'var(--text-secondary)',
			fontSize: '0.78rem',
			fontWeight: 700,
			cursor: 'pointer',
		}) as React.CSSProperties,
	controls: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
		gap: '0.75rem',
		marginBottom: '1rem',
		padding: '0.85rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
	} as React.CSSProperties,
	ctrlBlock: { display: 'flex', flexDirection: 'column' as const, gap: '0.35rem' } as React.CSSProperties,
	check: { display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', cursor: 'pointer' } as React.CSSProperties,
	sliderRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)' } as React.CSSProperties,
	promptBox: {
		padding: '0.65rem 0.85rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
		fontSize: '0.77rem',
		color: 'var(--text)',
		lineHeight: 1.55,
		marginBottom: '1rem',
	} as React.CSSProperties,
	step: { display: 'flex', gap: '0.65rem', marginBottom: '0.55rem', alignItems: 'flex-start' } as React.CSSProperties,
	badge: (s: StepStatus) =>
		({
			flexShrink: 0,
			width: '1.5rem',
			height: '1.5rem',
			borderRadius: '50%',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			fontSize: '0.75rem',
			fontWeight: 800,
			color: 'var(--bg)',
			background:
				s === 'pass'
					? 'var(--cat-tools)'
					: s === 'fail'
						? 'var(--accent-magenta)'
						: s === 'warn'
							? 'var(--accent-yellow)'
							: 'var(--border-light)',
		}) as React.CSSProperties,
	stepLabel: { fontSize: '0.79rem', fontWeight: 800, color: 'var(--text)' } as React.CSSProperties,
	stepText: (s: StepStatus) =>
		({ fontSize: '0.8rem', color: s === 'skip' ? 'var(--text-muted)' : 'var(--text-secondary)', lineHeight: 1.5 }) as React.CSSProperties,
	metrics: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
		gap: '0.6rem',
		marginTop: '0.9rem',
	} as React.CSSProperties,
	metricCard: {
		padding: '0.6rem 0.75rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
	} as React.CSSProperties,
	mLabel: { fontSize: '0.68rem', textTransform: 'uppercase' as const, letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 700 } as React.CSSProperties,
	mVal: { fontSize: '0.92rem', fontWeight: 800, color: 'var(--text)', marginTop: '0.15rem' } as React.CSSProperties,
	verdict: (t: 'ok' | 'warn' | 'danger') =>
		({
			marginTop: '0.85rem',
			padding: '0.75rem 0.9rem',
			borderRadius: '8px',
			border: `1px solid ${t === 'ok' ? 'var(--cat-tools)' : t === 'danger' ? 'var(--accent-magenta)' : 'var(--accent-yellow)'}`,
			background: 'var(--bg-secondary)',
			fontSize: '0.85rem',
			color: 'var(--text)',
			lineHeight: 1.6,
		}) as React.CSSProperties,
};

const ICON: Record<StepStatus, string> = { pass: '✓', fail: '✕', warn: '!', skip: '·' };

export default function GatewayRouterSim() {
	const [idx, setIdx] = useState(0);
	const [cacheOn, setCacheOn] = useState(true);
	const [cacheThreshold, setCacheThreshold] = useState(0.92);
	const [smartRouterOn, setSmartRouterOn] = useState(true);
	const [routerThreshold, setRouterThreshold] = useState(0.55);
	const [primaryDown, setPrimaryDown] = useState(false);

	const sc = SCENARIOS[idx];
	const res = evaluate(sc, cacheOn, cacheThreshold, smartRouterOn, routerThreshold, primaryDown);

	return (
		<div style={css.wrap}>
			<div style={css.title}>🚦 Прогони запрос через LLM Gateway</div>
			<div style={css.desc}>
				Выбери тип запроса и покрути ручки шлюза: порог semantic cache, порог умного роутера и падение основного
				провайдера. Попробуй «Ловушка кэша (ID)» при пороге <code>0.92</code> и <code>0.96</code>.
			</div>

			<div style={css.presets}>
				{SCENARIOS.map((s, i) => (
					<button key={s.id} style={css.chip(i === idx)} onClick={() => setIdx(i)}>
						{s.label}
					</button>
				))}
			</div>

			<div style={css.controls}>
				<div style={css.ctrlBlock}>
					<label style={css.check}>
						<input type="checkbox" checked={cacheOn} onChange={(e) => setCacheOn(e.target.checked)} />
						Semantic Cache
					</label>
					<div style={css.sliderRow}>
						<span>Порог cosine</span>
						<code>{cacheThreshold.toFixed(2)}</code>
					</div>
					<input
						type="range"
						min={0.8}
						max={0.98}
						step={0.01}
						disabled={!cacheOn}
						value={cacheThreshold}
						onChange={(e) => setCacheThreshold(parseFloat(e.target.value))}
					/>
				</div>

				<div style={css.ctrlBlock}>
					<label style={css.check}>
						<input type="checkbox" checked={smartRouterOn} onChange={(e) => setSmartRouterOn(e.target.checked)} />
						Smart Router (strong/weak)
					</label>
					<div style={css.sliderRow}>
						<span>Порог сложности α</span>
						<code>{routerThreshold.toFixed(2)}</code>
					</div>
					<input
						type="range"
						min={0.2}
						max={0.85}
						step={0.05}
						disabled={!smartRouterOn}
						value={routerThreshold}
						onChange={(e) => setRouterThreshold(parseFloat(e.target.value))}
					/>
				</div>

				<div style={css.ctrlBlock}>
					<label style={css.check}>
						<input type="checkbox" checked={primaryDown} onChange={(e) => setPrimaryDown(e.target.checked)} />
						Уронить primary (429)
					</label>
					<div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
						Имитирует исчерпание квоты или 503 у основного провайдера — сработает cooldown + fallback.
					</div>
				</div>
			</div>

			<div style={css.promptBox}>
				<strong>POST /v1/chat/completions</strong>
				<br />
				{sc.prompt}
			</div>

			{res.steps.map((s, i) => (
				<div key={i} style={css.step}>
					<span style={css.badge(s.status)}>{ICON[s.status]}</span>
					<div>
						<div style={css.stepLabel}>
							{i + 1}. {s.label}
						</div>
						<div style={css.stepText(s.status)}>{s.text}</div>
					</div>
				</div>
			))}

			<div style={css.metrics}>
				<div style={css.metricCard}>
					<div style={css.mLabel}>Итоговая цель</div>
					<div style={css.mVal}>{res.target}</div>
				</div>
				<div style={css.metricCard}>
					<div style={css.mLabel}>Задержка</div>
					<div style={css.mVal}>{res.latencyMs} мс</div>
				</div>
				<div style={css.metricCard}>
					<div style={css.mLabel}>Цена запроса</div>
					<div style={css.mVal}>${res.costUsd.toFixed(5)}</div>
				</div>
				<div style={css.metricCard}>
					<div style={css.mLabel}>Без шлюза (frontier)</div>
					<div style={css.mVal}>${res.baselineCost.toFixed(5)}</div>
				</div>
			</div>

			<div style={css.verdict(res.verdictType)}>{res.verdictText}</div>
		</div>
	);
}
