import { useState } from 'react';

// Интерактивная демонстрация парадокса Джевонса в AI:
// Цена за 1M токенов падает в 10×, но переход от чата к reasoning и многошаговым агентам
// с квадратичным перечитыванием истории раздувает реальный чек на задачу.

interface ModePreset {
	id: string;
	label: string;
	steps: number;
	basePrompt: number;
	deltaPerStep: number;
	outPerStep: number;
	thinkingMult: number; // во сколько раз reasoning раздувает output
	note: string;
}

const MODES: ModePreset[] = [
	{
		id: 'chat',
		label: '2023 · Обычный чат',
		steps: 1,
		basePrompt: 1200,
		deltaPerStep: 0,
		outPerStep: 450,
		thinkingMult: 1,
		note: 'Один вопрос — один ответ. Цена за 1M токенов высокая, но самих токенов кот наплакал.',
	},
	{
		id: 'rag',
		label: '2024 · RAG + 3 шага',
		steps: 3,
		basePrompt: 6000,
		deltaPerStep: 1200,
		outPerStep: 500,
		thinkingMult: 1,
		note: 'Подтянули чанки из базы, переписали запрос, проверили ответ — вход вырос в ~15×.',
	},
	{
		id: 'reason',
		label: '2025 · Reasoning-модель',
		steps: 2,
		basePrompt: 5000,
		deltaPerStep: 1500,
		outPerStep: 600,
		thinkingMult: 10,
		note: 'Модель «думает» по 5–6K скрытых токенов на шаг — а биллинг считает их как самый дорогой output.',
	},
	{
		id: 'agent',
		label: '2026 · Кодовый агент',
		steps: 18,
		basePrompt: 14000,
		deltaPerStep: 2200,
		outPerStep: 550,
		thinkingMult: 4,
		note: 'На каждом шаге k агент пересылает ВЕСЬ накопленный контекст: системный промпт + тулы + диффы + логи тестов. Вход растёт квадратично!',
	},
];

// Базовый тариф 2023 (условно GPT-4-класса): $30 in / $60 out за 1M
const BASE_IN_PRICE = 30.0;
const BASE_OUT_PRICE = 60.0;

function simulateTask(m: ModePreset, priceDrop: number, promptCache: boolean) {
	const inPrice = BASE_IN_PRICE / priceDrop;
	const outPrice = BASE_OUT_PRICE / priceDrop;

	let totalFreshIn = 0;
	let totalCachedIn = 0;
	let totalOut = 0;

	for (let step = 0; step < m.steps; step++) {
		const ctx = m.basePrompt + step * m.deltaPerStep;
		if (promptCache && step > 0) {
			// Предыдущий префикс попал в кэш (90% скидка), свежий только новый хвост
			const prevCtx = m.basePrompt + (step - 1) * m.deltaPerStep;
			totalCachedIn += prevCtx;
			totalFreshIn += ctx - prevCtx;
		} else {
			totalFreshIn += ctx;
		}
		totalOut += m.outPerStep * m.thinkingMult;
	}

	const totalIn = totalFreshIn + totalCachedIn;
	const costUsd =
		((totalFreshIn + totalCachedIn * 0.1) * inPrice + totalOut * outPrice) / 1_000_000;

	return { totalIn, totalOut, totalTokens: totalIn + totalOut, costUsd, inPrice, outPrice };
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
	controls: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
		gap: '0.8rem',
		marginBottom: '1rem',
		padding: '0.85rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
	} as React.CSSProperties,
	ctrl: { display: 'flex', flexDirection: 'column' as const, gap: '0.35rem' } as React.CSSProperties,
	ctrlHead: { display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)' } as React.CSSProperties,
	check: { display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', cursor: 'pointer', marginTop: '0.2rem' } as React.CSSProperties,
	row: {
		padding: '0.75rem 0.9rem',
		borderRadius: '9px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		marginBottom: '0.6rem',
	} as React.CSSProperties,
	rowHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' as const, gap: '0.5rem', marginBottom: '0.3rem' } as React.CSSProperties,
	rowName: { fontSize: '0.86rem', fontWeight: 800, color: 'var(--text)' } as React.CSSProperties,
	rowStats: { fontSize: '0.78rem', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: 'var(--text-secondary)' } as React.CSSProperties,
	track: { height: '12px', borderRadius: '999px', background: 'var(--bg-card)', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '0.35rem' } as React.CSSProperties,
	fill: (pct: number, color: string) =>
		({
			width: `${Math.max(2, Math.min(100, pct))}%`,
			height: '100%',
			background: color,
			borderRadius: '999px',
			transition: 'width 0.25s ease',
		}) as React.CSSProperties,
	rowNote: { fontSize: '0.77rem', color: 'var(--text-muted)', lineHeight: 1.45 } as React.CSSProperties,
	verdict: {
		marginTop: '0.9rem',
		padding: '0.8rem 0.95rem',
		borderRadius: '9px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--accent)',
		fontSize: '0.85rem',
		color: 'var(--text)',
		lineHeight: 1.6,
	} as React.CSSProperties,
};

const COLORS = ['var(--cat-fundament)', 'var(--cat-tools)', 'var(--accent-yellow)', 'var(--accent-magenta)'];

export default function JevonsAgentExplosion() {
	const [priceDrop, setPriceDrop] = useState(10); // во сколько раз упала цена за 1M токенов с 2023
	const [agentSteps, setAgentSteps] = useState(18);
	const [promptCache, setPromptCache] = useState(false);

	const modes = MODES.map((m) => (m.id === 'agent' ? { ...m, steps: agentSteps } : m));
	// Для 2023-чата оставляем историческую цену 1×, для современных режимов применяем падение цены priceDrop
	const results = modes.map((m) => {
		const effectiveDrop = m.id === 'chat' ? 1 : m.id === 'rag' ? Math.max(1, priceDrop * 0.4) : priceDrop;
		return { mode: m, ...simulateTask(m, effectiveDrop, m.id === 'chat' ? false : promptCache), effectiveDrop };
	});

	const maxCost = Math.max(...results.map((r) => r.costUsd));
	const chatRes = results[0];
	const agentRes = results[3];
	const ratio = agentRes.costUsd / chatRes.costUsd;

	return (
		<div style={css.wrap}>
			<div style={css.title}>📈 Парадокс Джевонса в действии: цена токена ↓, чек за задачу ↑</div>
			<div style={css.desc}>
				В 2023 году один запрос стоил дорого (<code>$30/$60</code> за 1M), но тратил ~1.6K токенов. Покрути падение цены API
				и число шагов кодового агента — посмотри, обгоняет ли объём токенов скидку.
			</div>

			<div style={css.controls}>
				<div style={css.ctrl}>
					<div style={css.ctrlHead}>
						<span>Цена API упала с 2023 в</span>
						<code>{priceDrop}×</code>
					</div>
					<input type="range" min={2} max={30} step={1} value={priceDrop} onChange={(e) => setPriceDrop(Number(e.target.value))} />
					<div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
						Тариф 2026: ${(BASE_IN_PRICE / priceDrop).toFixed(2)} in / ${(BASE_OUT_PRICE / priceDrop).toFixed(2)} out за 1M
					</div>
				</div>

				<div style={css.ctrl}>
					<div style={css.ctrlHead}>
						<span>Шагов кодового агента</span>
						<code>{agentSteps}</code>
					</div>
					<input type="range" min={5} max={40} step={1} value={agentSteps} onChange={(e) => setAgentSteps(Number(e.target.value))} />
					<label style={css.check}>
						<input type="checkbox" checked={promptCache} onChange={(e) => setPromptCache(e.target.checked)} />
						Включить Prompt Caching (−90% на повторный вход)
					</label>
				</div>
			</div>

			{results.map((r, i) => (
				<div key={r.mode.id} style={css.row}>
					<div style={css.rowHead}>
						<span style={css.rowName}>{r.mode.label}</span>
						<span style={css.rowStats}>
							{(r.totalTokens / 1000).toFixed(1)}K tok · <strong>${r.costUsd.toFixed(3)} / задачу</strong>
						</span>
					</div>
					<div style={css.track}>
						<div style={css.fill((r.costUsd / maxCost) * 100, COLORS[i])} />
					</div>
					<div style={css.rowNote}>{r.mode.note}</div>
				</div>
			))}

			<div style={css.verdict}>
				Токен подешевел в <strong>{priceDrop}×</strong>, но одна задача кодового агента на{' '}
				<strong>{agentSteps} шагов</strong> съедает <strong>{(agentRes.totalTokens / 1000).toFixed(0)}K токенов</strong>{' '}
				(в <strong>{Math.round(agentRes.totalTokens / chatRes.totalTokens)}×</strong> больше чата 2023 года) и стоит{' '}
				<strong>${agentRes.costUsd.toFixed(2)}</strong> — это в{' '}
				<strong>{ratio >= 1 ? `${ratio.toFixed(1)}× дороже` : `${(1 / ratio).toFixed(1)}× дешевле`}</strong> одного
				вопроса эпохи «дорогого» GPT-4. {!promptCache && 'Попробуй включить Prompt Caching выше — увидишь, почему без него агентская экономика просто не сходится.'}
			</div>
		</div>
	);
}
