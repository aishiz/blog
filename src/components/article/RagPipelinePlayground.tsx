import { useState } from 'react';

interface ScoredDoc {
	doc: number;
	text: string;
	score?: number;
}

interface Example {
	query: string;
	vector: ScoredDoc[];
	bm25: ScoredDoc[];
	fused: ScoredDoc[];
	reranked: ScoredDoc[];
}

const CORPUS = [
	"Vector databases store high-dimensional embeddings and support approximate nearest neighbor search.",
	"BM25 is a keyword-based ranking function used in classical search engines like Elasticsearch.",
	"Cats are independent animals that sleep up to sixteen hours a day.",
	"HNSW is a graph-based algorithm for fast approximate nearest neighbor lookup.",
	"A cross-encoder reranker scores a query-document pair jointly for higher accuracy than bi-encoders.",
	"The recipe calls for simmering the tomato sauce for twenty minutes.",
	"Reciprocal Rank Fusion combines multiple ranked lists into a single ranking without tuning weights.",
	"Chunking splits long documents into smaller passages before indexing.",
	"Query expansion rewrites a user's question into multiple related queries to improve recall.",
	"The stock market fell sharply after the interest rate announcement.",
];

const EXAMPLES: Example[] = [
	{
		"query": "How do I combine keyword search and semantic search results?",
		"vector": [{ "doc": 4, "text": CORPUS[4], "score": 0.694 }, { "doc": 1, "text": CORPUS[1], "score": 0.6936 }, { "doc": 8, "text": CORPUS[8], "score": 0.6772 }, { "doc": 6, "text": CORPUS[6], "score": 0.6603 }, { "doc": 7, "text": CORPUS[7], "score": 0.6454 }, { "doc": 0, "text": CORPUS[0], "score": 0.6277 }],
		"bm25": [{ "doc": 1, "text": CORPUS[1], "score": 3.5159 }, { "doc": 0, "text": CORPUS[0], "score": 1.8969 }, { "doc": 2, "text": CORPUS[2], "score": 0.0 }, { "doc": 3, "text": CORPUS[3], "score": 0.0 }, { "doc": 4, "text": CORPUS[4], "score": 0.0 }, { "doc": 5, "text": CORPUS[5], "score": 0.0 }],
		"fused": [{ "doc": 1, "text": CORPUS[1] }, { "doc": 4, "text": CORPUS[4] }, { "doc": 0, "text": CORPUS[0] }, { "doc": 6, "text": CORPUS[6] }, { "doc": 3, "text": CORPUS[3] }, { "doc": 8, "text": CORPUS[8] }],
		"reranked": [{ "doc": 1, "text": CORPUS[1], "score": -6.6362 }, { "doc": 4, "text": CORPUS[4], "score": -10.3213 }, { "doc": 8, "text": CORPUS[8], "score": -10.8666 }, { "doc": 6, "text": CORPUS[6], "score": -11.1837 }, { "doc": 0, "text": CORPUS[0], "score": -11.2201 }, { "doc": 3, "text": CORPUS[3], "score": -11.2976 }],
	},
	{
		"query": "What makes similarity search over embeddings fast at scale?",
		"vector": [{ "doc": 0, "text": CORPUS[0], "score": 0.8392 }, { "doc": 4, "text": CORPUS[4], "score": 0.7678 }, { "doc": 3, "text": CORPUS[3], "score": 0.754 }, { "doc": 6, "text": CORPUS[6], "score": 0.6892 }, { "doc": 7, "text": CORPUS[7], "score": 0.6524 }, { "doc": 8, "text": CORPUS[8], "score": 0.6384 }],
		"bm25": [{ "doc": 0, "text": CORPUS[0], "score": 1.8969 }, { "doc": 3, "text": CORPUS[3], "score": 1.8969 }, { "doc": 1, "text": CORPUS[1], "score": 1.7579 }, { "doc": 2, "text": CORPUS[2], "score": 0.0 }, { "doc": 4, "text": CORPUS[4], "score": 0.0 }, { "doc": 5, "text": CORPUS[5], "score": 0.0 }],
		"fused": [{ "doc": 0, "text": CORPUS[0] }, { "doc": 3, "text": CORPUS[3] }, { "doc": 4, "text": CORPUS[4] }, { "doc": 1, "text": CORPUS[1] }, { "doc": 6, "text": CORPUS[6] }, { "doc": 2, "text": CORPUS[2] }],
		"reranked": [{ "doc": 0, "text": CORPUS[0], "score": -3.6391 }, { "doc": 3, "text": CORPUS[3], "score": -9.6519 }, { "doc": 1, "text": CORPUS[1], "score": -11.0421 }, { "doc": 6, "text": CORPUS[6], "score": -11.3645 }, { "doc": 4, "text": CORPUS[4], "score": -11.3706 }, { "doc": 2, "text": CORPUS[2], "score": -11.4888 }],
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
		textAlign: 'left' as const,
		maxWidth: '340px',
	} as React.CSSProperties),
	stageGrid: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: '1rem',
		marginBottom: '1rem',
	} as React.CSSProperties,
	stageCard: {
		padding: '0.9rem 1rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
	} as React.CSSProperties,
	stageLabel: {
		fontSize: '0.72rem',
		fontWeight: 700,
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.04em',
		marginBottom: '0.6rem',
	} as React.CSSProperties,
	row: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: '0.5rem',
		padding: '0.35rem 0',
		fontSize: '0.82rem',
		color: 'var(--text-secondary)',
		borderTop: '1px solid var(--border)',
	} as React.CSSProperties,
	rank: {
		flexShrink: 0,
		width: '1.2rem',
		color: 'var(--text-muted)',
		fontWeight: 700,
		fontVariantNumeric: 'tabular-nums' as const,
	} as React.CSSProperties,
	score: {
		flexShrink: 0,
		width: '3.6rem',
		color: 'var(--accent-light)',
		fontWeight: 700,
		fontVariantNumeric: 'tabular-nums' as const,
		fontSize: '0.78rem',
	} as React.CSSProperties,
	zeroScore: {
		color: 'var(--text-muted)',
		fontWeight: 400,
	} as React.CSSProperties,
	arrow: {
		textAlign: 'center' as const,
		color: 'var(--text-muted)',
		fontSize: '1.2rem',
		margin: '0.25rem 0',
	} as React.CSSProperties,
};

export default function RagPipelinePlayground() {
	const [idx, setIdx] = useState(0);
	const ex = EXAMPLES[idx];

	return (
		<div style={css.wrap}>
			<div style={css.title}>🔍 RAG-конвейер вживую</div>
			<div style={css.desc}>
				10 документов, реальные эмбеддинги (BAAI/bge-small-en-v1.5), настоящий BM25 (rank_bm25) и настоящий cross-encoder reranker (ms-marco-MiniLM). Никаких придуманных цифр — весь путь запроса от векторного поиска до финального реранкинга посчитан по-настоящему.
			</div>

			<div style={css.presetRow}>
				{EXAMPLES.map((e, i) => (
					<button key={i} style={css.presetBtn(i === idx)} onClick={() => setIdx(i)}>
						«{e.query}»
					</button>
				))}
			</div>

			<div style={css.stageGrid}>
				<div style={css.stageCard}>
					<div style={css.stageLabel}>Vector search (косинусная близость)</div>
					{ex.vector.map((d, i) => (
						<div key={d.doc} style={css.row}>
							<span style={css.rank}>{i + 1}.</span>
							<span style={css.score}>{d.score!.toFixed(3)}</span>
							<span>{d.text}</span>
						</div>
					))}
				</div>
				<div style={css.stageCard}>
					<div style={css.stageLabel}>BM25 (совпадение ключевых слов)</div>
					{ex.bm25.map((d, i) => (
						<div key={d.doc} style={css.row}>
							<span style={css.rank}>{i + 1}.</span>
							<span style={{ ...css.score, ...(d.score === 0 ? css.zeroScore : {}) }}>{d.score!.toFixed(2)}</span>
							<span style={d.score === 0 ? css.zeroScore : undefined}>{d.text}</span>
						</div>
					))}
				</div>
			</div>

			<div style={css.arrow}>↓ Reciprocal Rank Fusion объединяет оба списка без ручной настройки весов ↓</div>

			<div style={css.stageCard}>
				<div style={css.stageLabel}>После fusion (RRF)</div>
				{ex.fused.map((d, i) => (
					<div key={d.doc} style={css.row}>
						<span style={css.rank}>{i + 1}.</span>
						<span>{d.text}</span>
					</div>
				))}
			</div>

			<div style={css.arrow}>↓ Cross-encoder реранкер смотрит на пары (запрос, документ) заново ↓</div>

			<div style={{ ...css.stageCard, borderColor: 'var(--accent)' }}>
				<div style={css.stageLabel}>Финальный порядок после reranking</div>
				{ex.reranked.map((d, i) => (
					<div key={d.doc} style={css.row}>
						<span style={css.rank}>{i + 1}.</span>
						<span style={css.score}>{d.score!.toFixed(2)}</span>
						<span>{d.text}</span>
					</div>
				))}
			</div>
		</div>
	);
}
