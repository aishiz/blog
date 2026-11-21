import { useState } from 'react';

// Интерактивное сравнение 4 видов синтетических данных:
// почему «сырой AI-слоп из веба» травит модель, а Phi-4 и DeepSeek-R1 на синтетике только растут.

interface Regime {
	id: string;
	tab: string;
	title: string;
	examples: string;
	collapseRisk: number; // 0..100
	signal: string;
	tails: string;
	strength: string;
	limit: string;
}

const REGIMES: Regime[] = [
	{
		id: 'slop',
		tab: '1. Сырой веб-слоп',
		title: 'Рекурсивный скрейп непроверенных AI-текстов',
		examples: 'SEO-блоги, автопереводы, фермы отзывов без фильтрации',
		collapseRisk: 92,
		signal: 'Замкнутый круг: модель учится на собственных усреднённых догадках без притока новой информации.',
		tails: 'Вымирают первыми: редкие факты, нетипичный стиль и свежие идеи исчезают за 3–5 поколений.',
		strength: 'Бесплатно и бесконечно много по объёму.',
		limit: 'Прямая дорога к model collapse и «пластиковому» стилю с delve и гобеленами.',
	},
	{
		id: 'accum',
		tab: '2. Накопление (Accumulate)',
		title: 'Живая база прошлых лет + свежая смесь веба',
		examples: 'Pre-2022 архивы (книги, Wikipedia, arXiv) + отфильтрованный Common Crawl',
		collapseRisk: 28,
		signal: 'Исходное человеческое распределение остаётся якорем в датасете и ограничивает ошибку сверху.',
		tails: 'Старые хвосты сохраняются, но новые культурные/технические явления после 2023 года размываются шумом.',
		strength: 'Коллапса как в Nature не происходит (теорема Gerstgrasser et al., Stanford).',
		limit: 'Модель застревает во вкусе и фактах «до-нейросетевого» интернета; свежий качественный текст всё дороже добывать.',
	},
	{
		id: 'seed',
		tab: '3. Seed-синтетика (Phi-4)',
		title: 'Учебники и задачи, сгенерированные по жёстким «семенам»',
		examples: 'Microsoft Phi-4 (14B), Cosmopedia, Nemotron-4 synthetic pipelines',
		collapseRisk: 18,
		signal: 'Сильный учитель перерабатывает проверенные человеческие «семена» (статьи, код, учебники) в чистые пошаговые разборы.',
		tails: 'Контролируемое разнообразие задаётся каталогом тем и персон — меньше мусора, чем в сыром вебе.',
		strength: 'Компактная 14B-модель обходит старых гигантов благодаря идеальной плотности знаний.',
		limit: 'Упирается в потолок качества учителя и ширину исходных «семян» — принципиально нового открытия не родит.',
	},
	{
		id: 'rlvr',
		tab: '4. RLVR (DeepSeek-R1)',
		title: 'Синтетика с детерминированным внешним верификатором',
		examples: 'DeepSeek-R1, SYNTHETIC-1, олимпиадная математика, код с юнит-тестами',
		collapseRisk: 5,
		signal: 'Внешний мир (компилятор, тесты, формальный доказыватель) даёт честный бинарный сигнал 0/1 — петля разомкнута!',
		tails: 'Наоборот — поощряются редкие, неочевидные, но верные цепочки рассуждений, которых не было в учебниках.',
		strength: 'Модель может превзойти людей-разметчиков и старых учителей без риска коллапса.',
		limit: 'Работает только там, где есть формальный чекер. На вкус в литературе, юморе и продуктовой эмпатии юнит-тест не напишешь.',
	},
];

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
	tabs: { display: 'flex', gap: '0.45rem', flexWrap: 'wrap' as const, marginBottom: '1rem' } as React.CSSProperties,
	tab: (active: boolean) =>
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
	box: {
		padding: '1rem 1.1rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
	} as React.CSSProperties,
	head: { fontSize: '1rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.2rem' } as React.CSSProperties,
	ex: { fontSize: '0.78rem', color: 'var(--accent-light)', marginBottom: '0.85rem', fontWeight: 600 } as React.CSSProperties,
	riskRow: { marginBottom: '0.9rem' } as React.CSSProperties,
	riskHead: { display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.3rem' } as React.CSSProperties,
	track: { height: '10px', borderRadius: '999px', background: 'var(--bg-card)', border: '1px solid var(--border)', overflow: 'hidden' } as React.CSSProperties,
	grid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
		gap: '0.65rem',
	} as React.CSSProperties,
	cell: {
		padding: '0.65rem 0.8rem',
		borderRadius: '8px',
		background: 'var(--bg-card)',
		border: '1px solid var(--border)',
	} as React.CSSProperties,
	cTitle: { fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.25rem' } as React.CSSProperties,
	cText: { fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 } as React.CSSProperties,
};

export default function SyntheticDataSpectrum() {
	const [idx, setIdx] = useState(0);
	const r = REGIMES[idx];
	const riskColor =
		r.collapseRisk >= 70 ? 'var(--accent-magenta)' : r.collapseRisk >= 25 ? 'var(--accent-yellow)' : 'var(--cat-tools)';

	return (
		<div style={css.wrap}>
			<div style={css.title}>🧪 Почему не вся синтетика одинакова</div>
			<div style={css.desc}>
				В новостях всю синтетику валят в одну кучу. Покликай по четырём режимам — разница между отравлением модели и
				бустом DeepSeek-R1 ровно в том, есть ли в петле внешний источник истины.
			</div>

			<div style={css.tabs}>
				{REGIMES.map((x, i) => (
					<button key={x.id} style={css.tab(i === idx)} onClick={() => setIdx(i)}>
						{x.tab}
					</button>
				))}
			</div>

			<div style={css.box}>
				<div style={css.head}>{r.title}</div>
				<div style={css.ex}>Примеры: {r.examples}</div>

				<div style={css.riskRow}>
					<div style={css.riskHead}>
						<span>Риск Model Collapse</span>
						<span>{r.collapseRisk}%</span>
					</div>
					<div style={css.track}>
						<div
							style={{
								width: `${r.collapseRisk}%`,
								height: '100%',
								background: riskColor,
								borderRadius: '999px',
								transition: 'width 0.25s ease',
							}}
						/>
					</div>
				</div>

				<div style={css.grid}>
					<div style={css.cell}>
						<div style={css.cTitle}>Источник сигнала</div>
						<div style={css.cText}>{r.signal}</div>
					</div>
					<div style={css.cell}>
						<div style={css.cTitle}>Что с редкими хвостами</div>
						<div style={css.cText}>{r.tails}</div>
					</div>
					<div style={css.cell}>
						<div style={css.cTitle}>Главный плюс</div>
						<div style={css.cText}>{r.strength}</div>
					</div>
					<div style={css.cell}>
						<div style={css.cTitle}>Где потолок</div>
						<div style={css.cText}>{r.limit}</div>
					</div>
				</div>
			</div>
		</div>
	);
}
