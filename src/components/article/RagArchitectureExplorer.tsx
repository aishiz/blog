import { Fragment, useState } from 'react';

interface Step {
	label: string;
	note?: string;
	parallel?: boolean;
}

interface Architecture {
	key: string;
	title: string;
	group: string;
	description: string;
	steps: Step[];
}

const GROUPS = [
	'Основной путь',
	'Другая структура поиска',
	'Знает, когда и как искать',
	'Эффективность',
	'Без retrieval вообще',
];

const ARCHITECTURES: Architecture[] = [
	{
		key: 'naive',
		group: 'Основной путь',
		title: 'Naive RAG',
		description: 'Самый простой вариант: один проход поиска, найденное пихается в промпт как есть. Работает, пока запросы простые, а корпус небольшой.',
		steps: [
			{ label: 'Запрос' },
			{ label: 'Векторный поиск' },
			{ label: 'Промпт + контекст' },
			{ label: 'Генерация' },
			{ label: 'Ответ' },
		],
	},
	{
		key: 'advanced',
		group: 'Основной путь',
		title: 'Advanced RAG',
		description: 'Добавляет обработку до и после поиска: переформулировка запроса, чтобы искать лучше, и reranking после, чтобы отсеять шум перед генерацией.',
		steps: [
			{ label: 'Запрос' },
			{ label: 'Rewriting / HyDE', note: 'pre-retrieval' },
			{ label: 'Hybrid search' },
			{ label: 'Reranking', note: 'post-retrieval' },
			{ label: 'Генерация' },
			{ label: 'Ответ' },
		],
	},
	{
		key: 'modular',
		group: 'Основной путь',
		title: 'Modular RAG',
		description: 'Поиск — не один блок, а набор взаимозаменяемых модулей (векторный, по ключевым словам, по графу, по памяти прошлых диалогов), которые роутер комбинирует под конкретный запрос.',
		steps: [
			{ label: 'Запрос' },
			{ label: 'Роутинг' },
			{ label: 'Модуль A · Модуль B · Модуль C', parallel: true },
			{ label: 'Слияние результатов' },
			{ label: 'Генерация' },
			{ label: 'Ответ' },
		],
	},
	{
		key: 'agentic',
		group: 'Основной путь',
		title: 'Agentic RAG',
		description: 'Поиск — это tool, который агент вызывает сам, когда решит, что нужно. Может обратиться к нескольким источникам по очереди и повторить попытку, если первый заход не дал ответа.',
		steps: [
			{ label: 'Запрос' },
			{ label: 'Агент решает: нужен ли retrieval и какой tool' },
			{ label: 'Retrieval как вызов tool' },
			{ label: 'Агент оценивает результат', note: '↻ при необходимости — новый вызов retrieval' },
			{ label: 'Генерация' },
			{ label: 'Ответ' },
		],
	},
	{
		key: 'self-rag',
		group: 'Знает, когда и как искать',
		title: 'Self-RAG / CRAG',
		description: 'Модель сама критикует то, что нашла: релевантно, нерелевантно, двусмысленно? Если поиск не удался — включается запасной план, а не генерация по мусорному контексту.',
		steps: [
			{ label: 'Запрос' },
			{ label: 'Retrieval' },
			{ label: 'Критика найденного', note: 'self-reflection токены' },
			{ label: 'Ок → генерация; плохо → fallback-поиск' },
			{ label: 'Генерация' },
			{ label: 'Ответ' },
		],
	},
	{
		key: 'graphrag',
		group: 'Другая структура поиска',
		title: 'GraphRAG',
		description: 'Совсем другой старт: документы сначала превращаются в граф сущностей и связей ещё до всяких запросов. Поиск — это обход графа или чтение саммари сообществ (кластеров графа), а не similarity search по чанкам.',
		steps: [
			{ label: 'Документы → граф сущностей', note: 'оффлайн, один раз при индексации' },
			{ label: 'Запрос' },
			{ label: 'Обход графа / саммари community' },
			{ label: 'Генерация' },
			{ label: 'Ответ' },
		],
	},
	{
		key: 'raptor',
		group: 'Другая структура поиска',
		title: 'RAPTOR',
		description: 'Чанки кластеризуются, каждый кластер суммаризируется в более общий узел, и так рекурсивно вверх — получается дерево. Поиск может забрать конкретный чанк-лист или обобщающее саммари уровня выше, смотря нужен точный факт или общая картина по всему корпусу.',
		steps: [
			{ label: 'Чанки → кластеры → саммари (рекурсивно)', note: 'оффлайн, строит дерево один раз' },
			{ label: 'Запрос' },
			{ label: 'Поиск по дереву: лист или саммари' },
			{ label: 'Генерация' },
			{ label: 'Ответ' },
		],
	},
	{
		key: 'flare',
		group: 'Знает, когда и как искать',
		title: 'FLARE',
		description: 'Retrieval не перед генерацией, а во время неё. Модель следит за уверенностью собственных предсказаний по ходу ответа — как только уверенность падает, это сигнал «не уверен, надо проверить», и система на лету запускает дополнительный поиск, не дожидаясь конца генерации.',
		steps: [
			{ label: 'Запрос' },
			{ label: 'Генерация начинается' },
			{ label: 'Confidence упал?', note: '↻ да → retrieval на лету, продолжить генерацию' },
			{ label: 'Ответ' },
		],
	},
	{
		key: 'adaptive',
		group: 'Знает, когда и как искать',
		title: 'Adaptive-RAG',
		description: 'Не все запросы одинаково сложны. Классификатор (часто отдельная маленькая модель) сначала оценивает сложность запроса и направляет его в подходящий пайплайн — простой факт вообще без retrieval, средний через один проход поиска, сложный многошагово. Экономит деньги и задержку там, где сложный пайплайн не нужен.',
		steps: [
			{ label: 'Запрос' },
			{ label: 'Классификатор сложности' },
			{ label: 'Без поиска · Один поиск · Многошаговый поиск', parallel: true },
			{ label: 'Генерация' },
			{ label: 'Ответ' },
		],
	},
	{
		key: 'speculative',
		group: 'Эффективность',
		title: 'Speculative RAG',
		description: 'Идея параллельна спекулятивному декодингу: быстрая модель генерирует сразу несколько черновых ответов по разным подмножествам найденных документов параллельно, а модель-верификатор выбирает лучший черновик — вместо того чтобы честно и медленно генерировать с нуля.',
		steps: [
			{ label: 'Запрос' },
			{ label: 'Retrieval' },
			{ label: 'Подмножества документов', parallel: true },
			{ label: 'Черновики параллельно', note: 'быстрая модель' },
			{ label: 'Верификация', note: 'крупная модель выбирает лучший' },
			{ label: 'Ответ' },
		],
	},
	{
		key: 'replug',
		group: 'Эффективность',
		title: 'REPLUG',
		description: 'LLM остаётся чёрным ящиком — её веса вообще не трогают. Ретривер отдельный и обучаемый: сигнал о том, какие документы реально помогли модели (насколько выросла вероятность правильного продолжения), используют, чтобы дообучить именно ретривер, а не генеративную модель.',
		steps: [
			{ label: 'Запрос' },
			{ label: 'Retrieval', note: 'отдельный обучаемый ретривер' },
			{ label: 'LLM как чёрный ящик' },
			{ label: 'Сигнал качества → дообучение ретривера' },
			{ label: 'Ответ' },
		],
	},
	{
		key: 'cag',
		group: 'Без retrieval вообще',
		title: 'CAG',
		description: 'Формально не RAG — retrieval здесь нет вообще. Весь корпус (если влезает) грузится в контекст модели заранее, а его KV-cache сохраняется и переиспользуется на каждый запрос. Быстрее и проще RAG, пока база знаний небольшая, стабильная и умещается в контекстное окно.',
		steps: [
			{ label: 'Корпус → в контекст модели', note: 'оффлайн, один раз' },
			{ label: 'KV-cache сохраняется' },
			{ label: 'Запрос' },
			{ label: 'Генерация из закешированного контекста' },
			{ label: 'Ответ' },
		],
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
	desc: {
		fontSize: '0.88rem',
		color: 'var(--text-muted)',
		marginBottom: '1.1rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	groupBlock: {
		marginBottom: '0.75rem',
	} as React.CSSProperties,
	groupLabel: {
		fontSize: '0.68rem',
		fontWeight: 700,
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.05em',
		marginBottom: '0.4rem',
	} as React.CSSProperties,
	presetRow: {
		display: 'flex',
		gap: '0.5rem',
		flexWrap: 'wrap' as const,
	} as React.CSSProperties,
	presetBtn: (active: boolean) => ({
		padding: '0.4rem 0.9rem',
		borderRadius: '100px',
		border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
		background: active ? 'color-mix(in srgb, var(--accent) 14%, var(--bg-card))' : 'var(--bg-secondary)',
		color: active ? 'var(--accent-light)' : 'var(--text-secondary)',
		fontSize: '0.8rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
	} as React.CSSProperties),
	archDesc: {
		fontSize: '0.9rem',
		color: 'var(--text-secondary)',
		lineHeight: 1.65,
		marginBottom: '1.25rem',
	} as React.CSSProperties,
	flow: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.4rem',
		flexWrap: 'wrap' as const,
	} as React.CSSProperties,
	stepBox: (parallel: boolean) => ({
		padding: '0.7rem 0.9rem',
		borderRadius: '10px',
		background: parallel ? 'color-mix(in srgb, var(--accent-secondary) 12%, var(--bg-secondary))' : 'var(--bg-secondary)',
		border: `1px solid ${parallel ? 'var(--accent-secondary)' : 'var(--border)'}`,
		fontSize: '0.82rem',
		fontWeight: 600,
		color: 'var(--text)',
		textAlign: 'center' as const,
		minWidth: '110px',
	} as React.CSSProperties),
	stepNote: {
		display: 'block',
		fontSize: '0.68rem',
		fontWeight: 400,
		color: 'var(--accent-light)',
		marginTop: '0.3rem',
	} as React.CSSProperties,
	stepArrow: {
		color: 'var(--text-muted)',
		fontSize: '1.1rem',
		flexShrink: 0,
	} as React.CSSProperties,
};

export default function RagArchitectureExplorer() {
	const [key, setKey] = useState('naive');
	const arch = ARCHITECTURES.find((a) => a.key === key)!;

	return (
		<div style={css.wrap}>
			<div style={css.title}>🗺️ Архитектуры RAG</div>
			<div style={css.desc}>Переключай архитектуру — смотри, как меняется путь запроса через систему.</div>

			{GROUPS.map((g) => (
				<div key={g} style={css.groupBlock}>
					<div style={css.groupLabel}>{g}</div>
					<div style={css.presetRow}>
						{ARCHITECTURES.filter((a) => a.group === g).map((a) => (
							<button key={a.key} style={css.presetBtn(a.key === key)} onClick={() => setKey(a.key)}>
								{a.title}
							</button>
						))}
					</div>
				</div>
			))}

			<div style={{ ...css.archDesc, marginTop: '1.1rem' }}>{arch.description}</div>

			<div style={css.flow}>
				{arch.steps.map((s, i) => (
					<Fragment key={s.label}>
						<div style={css.stepBox(!!s.parallel)}>
							{s.label}
							{s.note && <span style={css.stepNote}>{s.note}</span>}
						</div>
						{i < arch.steps.length - 1 && <span style={css.stepArrow} aria-hidden="true">→</span>}
					</Fragment>
				))}
			</div>
		</div>
	);
}
