import { Fragment, useEffect, useState } from 'react';

interface Step {
	label: string;
	detail: string;
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
			{ label: 'Запрос', detail: 'Пользователь присылает вопрос как есть, без какой-либо предобработки.' },
			{ label: 'Векторный поиск', detail: 'Запрос превращается в эмбеддинг и сравнивается со всеми эмбеддингами в базе — берутся top-k ближайших по косинусной близости.' },
			{ label: 'Промпт + контекст', detail: 'Найденные документы просто вставляются в промпт целиком, без фильтрации и без проверки, действительно ли они релевантны.' },
			{ label: 'Генерация', detail: 'Модель генерирует ответ, опираясь на весь подставленный контекст — хороший он или нет.' },
			{ label: 'Ответ', detail: 'Готово. Если поиск промахнулся, ответ будет основан на нерелевантном контексте, и никто это не проверит.' },
		],
	},
	{
		key: 'advanced',
		group: 'Основной путь',
		title: 'Advanced RAG',
		description: 'Добавляет обработку до и после поиска: переформулировка запроса, чтобы искать лучше, и reranking после, чтобы отсеять шум перед генерацией.',
		steps: [
			{ label: 'Запрос', detail: 'Пользователь присылает вопрос — часто короткий и неоднозначный.' },
			{ label: 'Rewriting / HyDE', note: 'pre-retrieval', detail: 'Запрос переписывается в развёрнутую форму или превращается в гипотетический ответ (HyDE) — так его эмбеддинг оказывается ближе к реальным документам в базе.' },
			{ label: 'Hybrid search', detail: 'Ищем сразу двумя способами — векторным поиском и BM25 — и сливаем результаты через Reciprocal Rank Fusion.' },
			{ label: 'Reranking', note: 'post-retrieval', detail: 'Cross-encoder пересматривает top-N кандидатов ещё раз, парой за парой, и выставляет финальный порядок точнее, чем позволял быстрый поиск.' },
			{ label: 'Генерация', detail: 'Модель генерирует ответ уже по очищенному от шума контексту.' },
			{ label: 'Ответ', detail: 'В отличие от naive, контекст прошёл две дополнительные проверки ещё до того, как попал в промпт.' },
		],
	},
	{
		key: 'modular',
		group: 'Основной путь',
		title: 'Modular RAG',
		description: 'Поиск — не один блок, а набор взаимозаменяемых модулей (векторный, по ключевым словам, по графу, по памяти прошлых диалогов), которые роутер комбинирует под конкретный запрос.',
		steps: [
			{ label: 'Запрос', detail: 'Вопрос поступает в систему, где источников данных несколько и они разнородны.' },
			{ label: 'Роутинг', detail: 'Отдельный компонент решает, какие источники вообще релевантны этому запросу — не любой вопрос нужно слать во все модули сразу.' },
			{ label: 'Модуль A · Модуль B · Модуль C', parallel: true, detail: 'Выбранные модули (например, векторный поиск по документам, SQL-запрос к базе метрик, поиск по памяти прошлых диалогов) работают параллельно и независимо друг от друга.' },
			{ label: 'Слияние результатов', detail: 'Результаты разнородных модулей приводятся к общему формату и объединяются в один контекст.' },
			{ label: 'Генерация', detail: 'Модель отвечает, опираясь на контекст, собранный сразу из нескольких источников.' },
			{ label: 'Ответ', detail: 'Цена — сложность роутинга: система должна правильно понимать, какой источник за что отвечает.' },
		],
	},
	{
		key: 'agentic',
		group: 'Основной путь',
		title: 'Agentic RAG',
		description: 'Поиск — это tool, который агент вызывает сам, когда решит, что нужно. Может обратиться к нескольким источникам по очереди и повторить попытку, если первый заход не дал ответа.',
		steps: [
			{ label: 'Запрос', detail: 'Вопрос поступает агенту — LLM с доступом к набору инструментов, а не к жёстко зашитому пайплайну.' },
			{ label: 'Агент решает: нужен ли retrieval и какой tool', detail: 'Агент сам решает, нужен ли вообще поиск, и если да — какой именно инструмент вызвать: векторную базу, веб-поиск, внутренний API.' },
			{ label: 'Retrieval как вызов tool', detail: 'Retrieval оформлен как обычный вызов функции — такой же tool, как любой другой в распоряжении агента, а не привилегированный шаг пайплайна.' },
			{ label: 'Агент оценивает результат', note: '↻ при необходимости — новый вызов retrieval', detail: 'Агент смотрит на то, что вернулось, и решает: хватает ли этого для ответа, или нужно повторить retrieval с другим запросом, или попробовать другой источник.' },
			{ label: 'Генерация', detail: 'Финальный ответ собирается только после того, как агент сам решил, что данных достаточно.' },
			{ label: 'Ответ', detail: 'Цена гибкости — непредсказуемая задержка: число шагов retrieval заранее неизвестно.' },
		],
	},
	{
		key: 'self-rag',
		group: 'Знает, когда и как искать',
		title: 'Self-RAG / CRAG',
		description: 'Модель сама критикует то, что нашла: релевантно, нерелевантно, двусмысленно? Если поиск не удался — включается запасной план, а не генерация по мусорному контексту.',
		steps: [
			{ label: 'Запрос', detail: 'Вопрос обрабатывается как в наивном варианте — один проход поиска.' },
			{ label: 'Retrieval', detail: 'Стандартный поиск по базе, ничего необычного на этом шаге.' },
			{ label: 'Критика найденного', note: 'self-reflection токены', detail: 'Модель (или отдельный классификатор) оценивает каждый найденный документ — релевантен, частично релевантен или нерелевантен — используя специальные reflection-токены, обученные именно для этой оценки.' },
			{ label: 'Ок → генерация; плохо → fallback-поиск', detail: 'Если найденное признано нерелевантным, включается запасной план: переформулировать запрос и повторить поиск, или уйти в веб вместо закрытой базы.' },
			{ label: 'Генерация', detail: 'Модель генерирует ответ, уже зная, что контекст прошёл проверку на релевантность.' },
			{ label: 'Ответ', detail: 'В отличие от naive, система не генерирует уверенно по мусорному контексту — она это заметила заранее.' },
		],
	},
	{
		key: 'graphrag',
		group: 'Другая структура поиска',
		title: 'GraphRAG',
		description: 'Совсем другой старт: документы сначала превращаются в граф сущностей и связей ещё до всяких запросов. Поиск — это обход графа или чтение саммари сообществ (кластеров графа), а не similarity search по чанкам.',
		steps: [
			{ label: 'Документы → граф сущностей', note: 'оффлайн, один раз при индексации', detail: 'LLM читает корпус и извлекает сущности (людей, организации, события) и связи между ними, строя граф знаний. Дорогой этап, но выполняется один раз при индексации, а не на каждый запрос.' },
			{ label: 'Запрос', detail: 'Вопрос часто про связь между сущностями, а не про факт внутри одного документа.' },
			{ label: 'Обход графа / саммари community', detail: 'Вместо similarity search по чанкам, система обходит граф по связям, релевантным запросу, или читает заранее сгенерированные саммари «сообществ» — плотно связанных кластеров графа — для более общих вопросов.' },
			{ label: 'Генерация', detail: 'Ответ строится на пути в графе, а не на наборе похожих по тексту фрагментов.' },
			{ label: 'Ответ', detail: 'Находит связи, которые обычный similarity search в принципе не видит, сколько чанков ни читай по отдельности.' },
		],
	},
	{
		key: 'raptor',
		group: 'Другая структура поиска',
		title: 'RAPTOR',
		description: 'Чанки кластеризуются, каждый кластер суммаризируется в более общий узел, и так рекурсивно вверх — получается дерево. Поиск может забрать конкретный чанк-лист или обобщающее саммари уровня выше, смотря нужен точный факт или общая картина по всему корпусу.',
		steps: [
			{ label: 'Чанки → кластеры → саммари (рекурсивно)', note: 'оффлайн, строит дерево один раз', detail: 'Чанки кластеризуются по смысловой близости, каждый кластер суммаризируется LLM в более общий текст, и процесс повторяется рекурсивно — получается дерево от конкретных чанков внизу до общих саммари наверху.' },
			{ label: 'Запрос', detail: 'Вопрос может требовать как точного факта, так и общей картины по разделу или всему корпусу.' },
			{ label: 'Поиск по дереву: лист или саммари', detail: 'В зависимости от запроса поиск забирает либо конкретный лист-чанк (точный факт), либо узел повыше (обобщающее саммари раздела или всего корпуса).' },
			{ label: 'Генерация', detail: 'Модель отвечает, опираясь на нужный уровень детализации — не всегда самый мелкий.' },
			{ label: 'Ответ', detail: 'То, что обычный чанк-поиск в принципе не умеет отдать: цельную картину, а не набор разрозненных кусков.' },
		],
	},
	{
		key: 'flare',
		group: 'Знает, когда и как искать',
		title: 'FLARE',
		description: 'Retrieval не перед генерацией, а во время неё. Модель следит за уверенностью собственных предсказаний по ходу ответа — как только уверенность падает, это сигнал «не уверен, надо проверить», и система на лету запускает дополнительный поиск, не дожидаясь конца генерации.',
		steps: [
			{ label: 'Запрос', detail: 'Вопрос может быть длинным, требующим развёрнутого многосоставного ответа.' },
			{ label: 'Генерация начинается', detail: 'Модель начинает генерировать ответ так, как будто retrieval вообще не нужен.' },
			{ label: 'Confidence упал?', note: '↻ да → retrieval на лету, продолжить генерацию', detail: 'Система следит за вероятностью, которую модель присваивает каждому следующему токену. Как только вероятность падает ниже порога — модель, вероятно, начинает выдумывать — запускается retrieval по уже сгенерированному куску текста, и генерация продолжается с новым контекстом.' },
			{ label: 'Ответ', detail: 'Retrieval мог сработать несколько раз за один ответ — ровно там, где модели не хватало уверенности, а не обязательно в начале.' },
		],
	},
	{
		key: 'adaptive',
		group: 'Знает, когда и как искать',
		title: 'Adaptive-RAG',
		description: 'Не все запросы одинаково сложны. Классификатор (часто отдельная маленькая модель) сначала оценивает сложность запроса и направляет его в подходящий пайплайн — простой факт вообще без retrieval, средний через один проход поиска, сложный многошагово. Экономит деньги и задержку там, где сложный пайплайн не нужен.',
		steps: [
			{ label: 'Запрос', detail: 'Вопрос ещё не классифицирован — может быть и «сколько будет 2+2», и многошаговым сравнением.' },
			{ label: 'Классификатор сложности', detail: 'Маленькая отдельная модель, в разы дешевле основной LLM, классифицирует запрос: простой факт, требующий одного документа, средний, требующий поиска, или сложный составной вопрос.' },
			{ label: 'Без поиска · Один поиск · Многошаговый поиск', parallel: true, detail: 'В зависимости от класса запрос идёт по одному из трёх путей — от прямого ответа модели без retrieval вообще до полноценного многошагового поиска.' },
			{ label: 'Генерация', detail: 'Модель отвечает, используя ровно тот объём контекста, который реально нужен для этого конкретного вопроса.' },
			{ label: 'Ответ', detail: 'Простые вопросы не тратят время и деньги на пайплайн, рассчитанный на сложные.' },
		],
	},
	{
		key: 'speculative',
		group: 'Эффективность',
		title: 'Speculative RAG',
		description: 'Идея параллельна спекулятивному декодингу: быстрая модель генерирует сразу несколько черновых ответов по разным подмножествам найденных документов параллельно, а модель-верификатор выбирает лучший черновик — вместо того чтобы честно и медленно генерировать с нуля.',
		steps: [
			{ label: 'Запрос', detail: 'Вопрос, для которого важна скорость ответа не меньше, чем точность.' },
			{ label: 'Retrieval', detail: 'Стандартный поиск возвращает набор документов-кандидатов.' },
			{ label: 'Подмножества документов', parallel: true, detail: 'Найденные документы разбиваются на несколько непересекающихся подмножеств — каждое видит только часть контекста.' },
			{ label: 'Черновики параллельно', note: 'быстрая модель', detail: 'Быстрая и дешёвая модель генерирует черновой ответ по каждому подмножеству параллельно — сразу несколько черновиков, а не один медленный проход.' },
			{ label: 'Верификация', note: 'крупная модель выбирает лучший', detail: 'Крупная модель оценивает все черновики разом и выбирает лучший — вместо того чтобы генерировать финальный ответ с нуля.' },
			{ label: 'Ответ', detail: 'Суммарно быстрее полного honest-прохода крупной модели, при сопоставимом качестве.' },
		],
	},
	{
		key: 'replug',
		group: 'Эффективность',
		title: 'REPLUG',
		description: 'LLM остаётся чёрным ящиком — её веса вообще не трогают. Ретривер отдельный и обучаемый: сигнал о том, какие документы реально помогли модели (насколько выросла вероятность правильного продолжения), используют, чтобы дообучить именно ретривер, а не генеративную модель.',
		steps: [
			{ label: 'Запрос', detail: 'Вопрос поступает в систему, где основная LLM закрыта — например, доступна только по API.' },
			{ label: 'Retrieval', note: 'отдельный обучаемый ретривер', detail: 'Отдельная обучаемая модель-ретривер находит документы. В отличие от многих других подходов, именно она дообучается, а не LLM.' },
			{ label: 'LLM как чёрный ящик', detail: 'Найденные документы подставляются в промпт основной LLM, чьи веса вообще не трогают — она может быть даже закрытой API-моделью.' },
			{ label: 'Сигнал качества → дообучение ретривера', detail: 'По тому, насколько вырос prob правильного продолжения у LLM с этими документами против без них, считается сигнал качества, которым дообучают ретривер. LLM выступает учителем для retrieval-модели, сама оставаясь неизменной.' },
			{ label: 'Ответ', detail: 'Со временем ретривер учится находить именно то, что помогает конкретно этой LLM, а не абстрактно «релевантные» документы.' },
		],
	},
	{
		key: 'cag',
		group: 'Без retrieval вообще',
		title: 'CAG',
		description: 'Формально не RAG — retrieval здесь нет вообще. Весь корпус (если влезает) грузится в контекст модели заранее, а его KV-cache сохраняется и переиспользуется на каждый запрос. Быстрее и проще RAG, пока база знаний небольшая, стабильная и умещается в контекстное окно.',
		steps: [
			{ label: 'Корпус → в контекст модели', note: 'оффлайн, один раз', detail: 'Весь корпус документов, если он помещается, целиком скармливается модели заранее, как один длинный промпт.' },
			{ label: 'KV-cache сохраняется', detail: 'Внутреннее состояние модели после обработки этого промпта (KV-cache) сохраняется на диск — его не нужно пересчитывать заново на каждый запрос.' },
			{ label: 'Запрос', detail: 'Приходит вопрос — retrieval для него запускать не нужно, корпус уже «внутри» модели.' },
			{ label: 'Генерация из закешированного контекста', detail: 'К сохранённому KV-cache добавляется только сам запрос — модели не нужно заново читать весь корпус, только вопрос поверх уже готового состояния.' },
			{ label: 'Ответ', detail: 'Никакого retrieval не было вообще — вся релевантность обеспечена тем, что модель уже «видела» весь корпус целиком.' },
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
	stepBox: (parallel: boolean, active: boolean, done: boolean) => ({
		padding: '0.7rem 0.9rem',
		borderRadius: '10px',
		background: active
			? 'linear-gradient(135deg, var(--accent), var(--accent-secondary))'
			: parallel
				? 'color-mix(in srgb, var(--accent-secondary) 12%, var(--bg-secondary))'
				: 'var(--bg-secondary)',
		border: `1px solid ${active ? 'transparent' : parallel ? 'var(--accent-secondary)' : 'var(--border)'}`,
		fontSize: '0.82rem',
		fontWeight: 600,
		color: active ? 'white' : 'var(--text)',
		textAlign: 'center' as const,
		minWidth: '110px',
		cursor: 'pointer',
		opacity: done ? 0.55 : 1,
		boxShadow: active ? '0 0 16px rgba(255,107,43,0.4)' : 'none',
		transition: 'all 0.3s ease',
	} as React.CSSProperties),
	stepNote: {
		display: 'block',
		fontSize: '0.68rem',
		fontWeight: 400,
		marginTop: '0.3rem',
		opacity: 0.85,
	} as React.CSSProperties,
	stepArrow: {
		color: 'var(--text-muted)',
		fontSize: '1.1rem',
		flexShrink: 0,
	} as React.CSSProperties,
	detailPanel: {
		marginTop: '1.1rem',
		padding: '1rem 1.1rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--accent)',
		fontSize: '0.88rem',
		color: 'var(--text)',
		lineHeight: 1.65,
		minHeight: '3.5em',
	} as React.CSSProperties,
	controls: {
		display: 'flex',
		gap: '0.5rem',
		marginTop: '1rem',
		alignItems: 'center',
		flexWrap: 'wrap' as const,
	} as React.CSSProperties,
	ctrlBtn: {
		padding: '0.5rem 1.1rem',
		borderRadius: '8px',
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
		color: 'var(--text)',
		fontSize: '0.82rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
	} as React.CSSProperties,
	stepLabel: {
		fontSize: '0.78rem',
		color: 'var(--text-muted)',
		fontVariantNumeric: 'tabular-nums' as const,
	} as React.CSSProperties,
};

export default function RagArchitectureExplorer() {
	const [key, setKey] = useState('naive');
	const [stepIdx, setStepIdx] = useState(0);
	const [playing, setPlaying] = useState(false);
	const arch = ARCHITECTURES.find((a) => a.key === key)!;

	useEffect(() => {
		setStepIdx(0);
		setPlaying(false);
	}, [key]);

	useEffect(() => {
		if (!playing) return;
		if (stepIdx >= arch.steps.length - 1) {
			setPlaying(false);
			return;
		}
		const id = setTimeout(() => setStepIdx((i) => i + 1), 1800);
		return () => clearTimeout(id);
	}, [playing, stepIdx, arch.steps.length]);

	return (
		<div style={css.wrap}>
			<div style={css.title}>🗺️ Архитектуры RAG: процесс шаг за шагом</div>
			<div style={css.desc}>Выбери архитектуру, потом жми «Играть» или кликай по шагам — узнаешь, что происходит на каждом из них.</div>

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
						<div
							role="button"
							tabIndex={0}
							style={css.stepBox(!!s.parallel, i === stepIdx, i < stepIdx)}
							onClick={() => { setStepIdx(i); setPlaying(false); }}
							onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setStepIdx(i); setPlaying(false); } }}
						>
							{s.label}
							{s.note && <span style={css.stepNote}>{s.note}</span>}
						</div>
						{i < arch.steps.length - 1 && <span style={css.stepArrow} aria-hidden="true">→</span>}
					</Fragment>
				))}
			</div>

			<div style={css.detailPanel}>
				<strong style={{ color: 'var(--accent-light)' }}>{arch.steps[stepIdx].label}: </strong>
				{arch.steps[stepIdx].detail}
			</div>

			<div style={css.controls}>
				<button
					style={css.ctrlBtn}
					onClick={() => {
						if (playing) { setPlaying(false); return; }
						if (stepIdx >= arch.steps.length - 1) setStepIdx(0);
						setPlaying(true);
					}}
				>
					{playing ? '⏸ Пауза' : stepIdx >= arch.steps.length - 1 ? '↺ Сначала' : '▶ Играть'}
				</button>
				<button
					style={css.ctrlBtn}
					disabled={stepIdx === 0}
					onClick={() => { setStepIdx((i) => Math.max(0, i - 1)); setPlaying(false); }}
				>
					← Назад
				</button>
				<button
					style={css.ctrlBtn}
					disabled={stepIdx >= arch.steps.length - 1}
					onClick={() => { setStepIdx((i) => Math.min(arch.steps.length - 1, i + 1)); setPlaying(false); }}
				>
					Далее →
				</button>
				<span style={css.stepLabel}>шаг {stepIdx + 1} из {arch.steps.length}</span>
			</div>
		</div>
	);
}
