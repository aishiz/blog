import { useMemo, useState } from 'react';

// Подсветка стилистических маркеров. Не детектор ИИ: сила маркера — редакторская
// эвристика. Лифты (частота у модели / частота у человека) для русских маркеров взяты
// из замеров humanizer-ru (references/catalog.md: корпуса AINL-Eval 2025 и M4-ru,
// генераторы 2023–24) и показываются как есть, без нашей перепроверки.
// \b в JS не работает с кириллицей, поэтому границы слова — через \p{L}.
type Strength = 'strong' | 'weak' | 'none';
type Rule = { re: string; s: Strength; label: string; why: string };

const W0 = '(?<![\\p{L}\\p{N}])';
const W1 = '(?![\\p{L}\\p{N}])';

const RULES: Rule[] = [
	{ re: 'не просто[^.!?\\n]{1,60}?,\\s*а' + W1, s: 'strong', label: '«не просто X, а Y»', why: 'Отрицает то, чего никто не утверждал, чтобы Y звучал весомее. Скажи Y прямо.' },
	{ re: 'не только[^.!?\\n]{1,60}?,\\s*но и' + W1, s: 'strong', label: '«не только X, но и Y»', why: 'Пустой оборот снимается; если X и Y — разные реальные факты, оставь.' },
	{ re: 'в современном мире|в эпоху [\\p{L}-]+|не секрет, что', s: 'strong', label: 'пустое открытие', why: 'Начни с первого факта, который уже есть в тексте.' },
	{ re: '(?:стоит|важно|следует|необходимо) (?:отметить|понимать|помнить|подчеркнуть)', s: 'strong', label: 'подводка', why: 'Убери подводку, утверждение оставь.' },
	{ re: 'давайте (?:разберёмся|разберемся|посмотрим|погрузимся)|погрузимся в', s: 'strong', label: 'анонс', why: 'Сразу суть, без «давайте».' },
	{ re: 'игра(?:е|ю)т (?:важную|ключевую|огромную) роль', s: 'strong', label: '«играет ключевую роль» · лифт 5.7 / 9.4', why: 'Самый устойчивый маркер в замерах humanizer-ru. Скажи, что от этого зависит.' },
	{ re: 'комплексн(?:ый|ого|ое|ую) (?:подход|решени\\p{L}*)', s: 'strong', label: '«комплексный подход» · лифт 3.0 / 2.8', why: 'Перечисли, что входит, или убери.' },
	{ re: 'раскры(?:ть|вает|вают) потенциал|на новый уровень|открыва(?:е|ю)т новые (?:горизонты|возможности|перспективы)', s: 'strong', label: 'рекламный штамп', why: 'Назови конкретный результат, если он есть.' },
	{ re: 'подводя итоги?|в заключение', s: 'strong', label: 'формульный вывод', why: 'Если вывод повторяет сказанное — удали.' },
	{ re: 'надеюсь, (?:это )?помог\\p{L}*|отличный вопрос', s: 'strong', label: 'обвязка чат-бота', why: 'Самый надёжный признак: остаток диалога в тексте.' },
	{ re: 'delv(?:e|es|ed|ing)' + W1, s: 'strong', label: 'delve', why: 'Главное слово-маркер 2024 года в научных аннотациях.' },
	{ re: "it'?s not (?:just|merely|only)", s: 'strong', label: 'not just X', why: 'Английский вариант «не просто X, а Y».' },
	{ re: "let'?s dive in|here'?s the thing|great question|i hope this helps", s: 'strong', label: 'chat residue', why: 'Анонс или обвязка чат-бота.' },

	{ re: 'являе?т(?:ся|ь)|являются', s: 'weak', label: '«является» · лифт 0.1 / 4.5', why: 'Переворачивается от жанра: в науке у людей его даже больше, в постах — у моделей.' },
	{ re: 'данн(?:ый|ая|ое|ые|ого|ой|ом|ую|ых|ым|ыми|ому)' + W1, s: 'weak', label: '«данный» · лифт 0.9 / 3.1', why: 'В научном тексте норма, в блоге — «этот».' },
	{ re: 'осуществлени\\p{L}*|реализаци\\p{L}*|обеспечени\\p{L}*|в рамках', s: 'weak', label: 'канцелярит · лифт 1.1 / 1.2', why: 'Людей от моделей не отличает. Это про качество текста, не про авторство.' },
	{ re: ' — ', s: 'weak', label: 'тире', why: 'Слабый сигнал. Если автор сам пишет с тире, это его голос.' },
	{ re: '(?:intricate|underscores?|showcas\\p{L}*|realm|pivotal|tapestry|testament)' + W1, s: 'weak', label: 'EN маркер', why: 'Из списков 2412.11385 / 2406.07016. Смотри на смысл, а не заменяй синонимом.' },

	{ re: 'не [\\p{L}-]+,\\s*а' + W1, s: 'none', label: 'обычное «не X, а Y»', why: 'По замерам humanizer-ru у людей встречается так же часто, как у моделей. Не маркер.' },
];

// Правила, которые начинаются не с буквы (тире с пробелами), граница слова слева не нужна
const COMPILED = RULES.map((r) => ({
	...r,
	rx: new RegExp((/^[\s—]/.test(r.re) ? '' : W0) + '(?:' + r.re + ')', 'giu'),
}));

const SAMPLE_AI =
	'В современном мире искусственный интеллект играет ключевую роль в науке. Важно отметить, что это не просто инструмент, а настоящий партнёр исследователя — он открывает новые горизонты. Давайте разберёмся, как данный подход обеспечивает комплексный подход к анализу. Подводя итог, можно сказать, что LLM является будущим. Надеюсь, это помогло!';
const SAMPLE_HUMAN =
	'Я полгода гонял vLLM на двух 4090, и больше всего времени съел не тюнинг, а дурацкий OOM на длинных промптах. Оказалось, виноват KV-кэш: при 32k контекста он занимал больше, чем сами веса. Поставил квантизацию кэша в FP8 — OOM ушёл, качество на моих задачах не просело.';

type Hit = { start: number; end: number; rule: (typeof COMPILED)[number] };

function findHits(text: string): Hit[] {
	const all: Hit[] = [];
	for (const rule of COMPILED) {
		rule.rx.lastIndex = 0;
		let m: RegExpExecArray | null;
		while ((m = rule.rx.exec(text))) {
			if (m[0].length === 0) { rule.rx.lastIndex++; continue; }
			all.push({ start: m.index, end: m.index + m[0].length, rule });
		}
	}
	// Сильные правила важнее слабых: при пересечении побеждает более сильное и более раннее
	const rank: Record<Strength, number> = { strong: 0, weak: 1, none: 2 };
	all.sort((a, b) => rank[a.rule.s] - rank[b.rule.s] || a.start - b.start);
	const kept: Hit[] = [];
	for (const h of all) {
		if (!kept.some((k) => h.start < k.end && k.start < h.end)) kept.push(h);
	}
	return kept.sort((a, b) => a.start - b.start);
}

const COLORS: Record<Strength, string> = {
	strong: 'var(--accent-magenta)',
	weak: 'var(--accent-yellow)',
	none: 'var(--text-muted)',
};
const NAMES: Record<Strength, string> = { strong: 'сильный', weak: 'слабый', none: 'не маркер' };

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
	btns: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as const, marginBottom: '0.6rem' } as React.CSSProperties,
	btn: {
		padding: '0.35rem 0.75rem',
		borderRadius: '8px',
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
		color: 'var(--text-secondary)',
		fontSize: '0.78rem',
		fontWeight: 700,
		cursor: 'pointer',
	} as React.CSSProperties,
	area: {
		width: '100%',
		boxSizing: 'border-box' as const,
		minHeight: '110px',
		padding: '0.75rem',
		borderRadius: '8px',
		border: '1px solid var(--border)',
		background: 'var(--bg)',
		color: 'var(--text)',
		fontSize: '0.88rem',
		lineHeight: 1.6,
		fontFamily: 'inherit',
		resize: 'vertical' as const,
	} as React.CSSProperties,
	out: {
		marginTop: '0.9rem',
		padding: '0.85rem 0.95rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		fontSize: '0.9rem',
		lineHeight: 1.8,
		color: 'var(--text)',
		whiteSpace: 'pre-wrap' as const,
		overflowWrap: 'anywhere' as const,
	} as React.CSSProperties,
	mark: (s: Strength, active: boolean) =>
		({
			background: `color-mix(in srgb, ${COLORS[s]} ${active ? 45 : 22}%, transparent)`,
			borderBottom: `2px ${s === 'none' ? 'dotted' : 'solid'} ${COLORS[s]}`,
			borderRadius: '3px',
			padding: '0 1px',
			cursor: 'pointer',
			color: 'inherit',
		}) as React.CSSProperties,
	stats: { display: 'flex', gap: '1rem', flexWrap: 'wrap' as const, marginTop: '0.8rem', fontSize: '0.8rem', color: 'var(--text-secondary)' } as React.CSSProperties,
	dot: (s: Strength) =>
		({ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: COLORS[s], marginRight: '0.35rem', verticalAlign: 'middle' }) as React.CSSProperties,
	explain: {
		marginTop: '0.8rem',
		padding: '0.7rem 0.9rem',
		borderRadius: '8px',
		border: '1px solid var(--border)',
		fontSize: '0.84rem',
		lineHeight: 1.6,
		color: 'var(--text)',
	} as React.CSSProperties,
	warn: {
		marginTop: '0.9rem',
		fontSize: '0.8rem',
		fontWeight: 700,
		color: 'var(--text-secondary)',
		lineHeight: 1.6,
	} as React.CSSProperties,
};

export default function TellSpotter() {
	const [text, setText] = useState(SAMPLE_AI);
	const [active, setActive] = useState<number | null>(null);
	const hits = useMemo(() => findHits(text), [text]);

	const words = (text.match(/[\p{L}\p{N}]+/gu) || []).length;
	const count = (s: Strength) => hits.filter((h) => h.rule.s === s).length;
	const per100 = (n: number) => (words ? ((n / words) * 100).toFixed(1) : '0');

	const pieces: React.ReactNode[] = [];
	let pos = 0;
	hits.forEach((h, i) => {
		if (h.start > pos) pieces.push(text.slice(pos, h.start));
		pieces.push(
			<mark key={i} style={css.mark(h.rule.s, active === i)} onClick={() => setActive(i)} onMouseEnter={() => setActive(i)}>
				{text.slice(h.start, h.end)}
			</mark>,
		);
		pos = h.end;
	});
	if (pos < text.length) pieces.push(text.slice(pos));

	const cur = active !== null ? hits[active] : null;

	return (
		<div style={css.wrap}>
			<div style={css.title}>🔍 Подсветка маркеров</div>
			<div style={css.desc}>
				Вставь свой текст или возьми пример. Подсвечиваются штампы из нашего скилла human-writing: сильные,
				слабые и один «не маркер», который часто ошибочно считают признаком ИИ. Наведи или тапни на подсветку,
				чтобы увидеть, почему она там.
			</div>
			<div style={css.btns}>
				<button style={css.btn} onClick={() => { setText(SAMPLE_AI); setActive(null); }}>Пример «как ChatGPT»</button>
				<button style={css.btn} onClick={() => { setText(SAMPLE_HUMAN); setActive(null); }}>Пример «как человек»</button>
				<button style={css.btn} onClick={() => { setText(''); setActive(null); }}>Очистить</button>
			</div>
			<textarea style={css.area} value={text} onChange={(e) => { setText(e.target.value); setActive(null); }}
				placeholder="Вставь сюда абзац на русском или английском…" aria-label="Текст для проверки" />
			<div style={css.out}>{text ? pieces : <span style={{ color: 'var(--text-muted)' }}>Тут будет подсветка.</span>}</div>
			<div style={css.stats}>
				<span>{words} слов</span>
				{(['strong', 'weak', 'none'] as Strength[]).map((s) => (
					<span key={s}><span style={css.dot(s)} />{NAMES[s]}: {count(s)}{s !== 'none' && ` (${per100(count(s))} на 100 слов)`}</span>
				))}
			</div>
			{cur && (
				<div style={{ ...css.explain, borderLeft: `4px solid ${COLORS[cur.rule.s]}` }}>
					<strong>{cur.rule.label}</strong> · {NAMES[cur.rule.s]}
					<br />
					{cur.rule.why}
				</div>
			)}
			<div style={css.warn}>
				⚠️ Это не детектор ИИ. Регулярки ловят штампы, а не авторство: такие обороты пишут и люди, а модель
				легко пишет без них. Лифт — это во сколько раз маркер чаще у модели, чем у человека, на научных
				аннотациях / на смешанном корпусе (замеры humanizer-ru, генераторы 2023–24).
			</div>
		</div>
	);
}
