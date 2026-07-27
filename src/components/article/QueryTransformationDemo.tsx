import { useState } from 'react';

interface Technique {
	key: string;
	title: string;
	original: string;
	originalLabel: string;
	resultLabel: string;
	result: string[];
	why: string;
}

const TECHNIQUES: Technique[] = [
	{
		key: 'rewriting',
		title: 'Query Rewriting',
		original: 'Как сделать RAG быстрее?',
		originalLabel: 'Исходный запрос',
		resultLabel: 'Переформулированный запрос',
		result: ['Какие техники и архитектурные решения снижают задержку пайплайна Retrieval-Augmented Generation, не жертвуя качеством ответов?'],
		why: 'Короткий разговорный запрос переписан в развёрнутую, однозначную форму — его эмбеддинг оказывается ближе к тому, как эта тема обычно описана в самих документах.',
	},
	{
		key: 'hyde',
		title: 'HyDE',
		original: 'Как сделать RAG быстрее?',
		originalLabel: 'Исходный запрос',
		resultLabel: 'Гипотетический ответ (ищем по его эмбеддингу)',
		result: ['Для ускорения RAG применяют hybrid search вместо полного перебора, кешируют эмбеддинги часто повторяющихся запросов, используют более быстрые reranker-модели и сокращают число retrieval-проходов через adaptive-роутинг по сложности запроса.'],
		why: 'Ищем не по эмбеддингу вопроса, а по эмбеддингу правдоподобного ответа на него — по структуре он гораздо ближе к реальным документам в базе, чем короткий вопрос.',
	},
	{
		key: 'multi-query',
		title: 'Multi-query',
		original: 'Как сделать RAG быстрее?',
		originalLabel: 'Исходный запрос',
		resultLabel: 'Параллельные перефразировки (ищем по каждой)',
		result: [
			'Какие есть способы снизить latency в RAG-пайплайне?',
			'Как уменьшить время ответа при retrieval-augmented generation?',
			'Какие компоненты RAG обычно являются узким местом по скорости?',
		],
		why: 'Один запрос превращается в несколько разных формулировок — каждая ищется отдельно, а результаты объединяются той же RRF-логикой. Ловит документы, которые не всплыли бы по одной формулировке.',
	},
	{
		key: 'decomposition',
		title: 'Декомпозиция',
		original: 'Сравни задержку GraphRAG и обычного hybrid RAG и посоветуй, что выбрать для чат-бота поддержки',
		originalLabel: 'Исходный составной вопрос',
		resultLabel: 'Подвопросы (ищутся отдельно, ответы объединяются)',
		result: [
			'Какая задержка обычно у GraphRAG?',
			'Какая задержка обычно у hybrid RAG?',
			'Какие требования к задержке ответа у чат-бота поддержки?',
		],
		why: 'Сложный составной вопрос сам по себе плохо ищется — ни один документ не отвечает сразу на всё. Разбивка на независимые подвопросы даёт каждому шанс найти свой релевантный кусок.',
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
	presetRow: {
		display: 'flex',
		gap: '0.5rem',
		marginBottom: '1.1rem',
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
	block: {
		padding: '0.9rem 1rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		marginBottom: '0.75rem',
	} as React.CSSProperties,
	blockLabel: {
		fontSize: '0.72rem',
		fontWeight: 700,
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.04em',
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	blockText: {
		fontSize: '0.9rem',
		color: 'var(--text-secondary)',
		lineHeight: 1.6,
	} as React.CSSProperties,
	resultBlock: {
		padding: '0.9rem 1rem',
		borderRadius: '10px',
		background: 'color-mix(in srgb, var(--accent) 8%, var(--bg-secondary))',
		border: '1px solid var(--accent)',
		marginBottom: '0.75rem',
	} as React.CSSProperties,
	resultItem: {
		fontSize: '0.9rem',
		color: 'var(--text)',
		lineHeight: 1.6,
		padding: '0.3rem 0',
	} as React.CSSProperties,
	arrow: {
		textAlign: 'center' as const,
		color: 'var(--text-muted)',
		fontSize: '1.2rem',
		margin: '0.25rem 0',
	} as React.CSSProperties,
	why: {
		fontSize: '0.85rem',
		color: 'var(--text-muted)',
		lineHeight: 1.6,
		fontStyle: 'italic' as const,
	} as React.CSSProperties,
};

export default function QueryTransformationDemo() {
	const [key, setKey] = useState('rewriting');
	const t = TECHNIQUES.find((x) => x.key === key)!;

	return (
		<div style={css.wrap}>
			<div style={css.title}>🔀 Трансформация запроса</div>
			<div style={css.desc}>
				Один и тот же (или похожий) неудачный запрос — четыре разных способа его починить перед поиском. Примеры иллюстративные, написаны вручную для наглядности, не результат живого вызова LLM.
			</div>

			<div style={css.presetRow}>
				{TECHNIQUES.map((tech) => (
					<button key={tech.key} style={css.presetBtn(tech.key === key)} onClick={() => setKey(tech.key)}>
						{tech.title}
					</button>
				))}
			</div>

			<div style={css.block}>
				<div style={css.blockLabel}>{t.originalLabel}</div>
				<div style={css.blockText}>«{t.original}»</div>
			</div>

			<div style={css.arrow} aria-hidden="true">↓ {t.title} ↓</div>

			<div style={css.resultBlock}>
				<div style={css.blockLabel}>{t.resultLabel}</div>
				{t.result.map((r, i) => (
					<div key={i} style={css.resultItem}>{t.result.length > 1 ? `${i + 1}. ` : ''}«{r}»</div>
				))}
			</div>

			<div style={css.why}>{t.why}</div>
		</div>
	);
}
