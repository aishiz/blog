import { useState } from 'react';

interface Neighbor {
	i: number;
	sim: number;
}

interface Sentence {
	text: string;
	cluster: string;
	x: number;
	y: number;
	neighbors: Neighbor[];
}

const DATA: Sentence[] = [
	{ "text": "My cat sleeps on the windowsill all day.", "cluster": "pets", "x": -100.0, "y": -11.17, "neighbors": [{ "i": 1, "sim": 0.501 }, { "i": 17, "sim": 0.5 }, { "i": 2, "sim": 0.445 }, { "i": 3, "sim": 0.432 }] },
	{ "text": "Dogs need daily walks to stay healthy.", "cluster": "pets", "x": -74.09, "y": -36.29, "neighbors": [{ "i": 3, "sim": 0.681 }, { "i": 0, "sim": 0.501 }, { "i": 10, "sim": 0.499 }, { "i": 17, "sim": 0.485 }] },
	{ "text": "The kitten chased a ball of yarn.", "cluster": "pets", "x": -50.97, "y": 33.1, "neighbors": [{ "i": 10, "sim": 0.493 }, { "i": 4, "sim": 0.473 }, { "i": 5, "sim": 0.46 }, { "i": 0, "sim": 0.445 }] },
	{ "text": "A golden retriever is a friendly, loyal breed.", "cluster": "pets", "x": -67.79, "y": -64.15, "neighbors": [{ "i": 1, "sim": 0.681 }, { "i": 13, "sim": 0.504 }, { "i": 12, "sim": 0.468 }, { "i": 10, "sim": 0.458 }] },
	{ "text": "Add two cups of flour and mix well.", "cluster": "cooking", "x": 11.63, "y": 67.63, "neighbors": [{ "i": 7, "sim": 0.664 }, { "i": 5, "sim": 0.631 }, { "i": 6, "sim": 0.601 }, { "i": 14, "sim": 0.556 }] },
	{ "text": "The pasta needs to boil for ten minutes.", "cluster": "cooking", "x": -1.17, "y": 69.67, "neighbors": [{ "i": 4, "sim": 0.631 }, { "i": 6, "sim": 0.613 }, { "i": 7, "sim": 0.605 }, { "i": 16, "sim": 0.517 }] },
	{ "text": "Season the steak with salt and pepper.", "cluster": "cooking", "x": -19.36, "y": 81.32, "neighbors": [{ "i": 7, "sim": 0.655 }, { "i": 5, "sim": 0.613 }, { "i": 4, "sim": 0.601 }, { "i": 16, "sim": 0.489 }] },
	{ "text": "Fresh basil makes the sauce taste better.", "cluster": "cooking", "x": -8.8, "y": 63.28, "neighbors": [{ "i": 4, "sim": 0.664 }, { "i": 6, "sim": 0.655 }, { "i": 5, "sim": 0.605 }, { "i": 14, "sim": 0.546 }] },
	{ "text": "The function returns null if the input is empty.", "cluster": "code", "x": 79.91, "y": 8.1, "neighbors": [{ "i": 9, "sim": 0.57 }, { "i": 11, "sim": 0.554 }, { "i": 15, "sim": 0.486 }, { "i": 14, "sim": 0.462 }] },
	{ "text": "Use a for loop to iterate over the array.", "cluster": "code", "x": 56.94, "y": 31.56, "neighbors": [{ "i": 8, "sim": 0.57 }, { "i": 11, "sim": 0.564 }, { "i": 15, "sim": 0.538 }, { "i": 4, "sim": 0.51 }] },
	{ "text": "This bug was caused by a race condition.", "cluster": "code", "x": -6.16, "y": -25.13, "neighbors": [{ "i": 14, "sim": 0.542 }, { "i": 12, "sim": 0.526 }, { "i": 11, "sim": 0.523 }, { "i": 16, "sim": 0.521 }] },
	{ "text": "Refactor the code to remove duplicate logic.", "cluster": "code", "x": 66.64, "y": 9.49, "neighbors": [{ "i": 14, "sim": 0.6 }, { "i": 9, "sim": 0.564 }, { "i": 8, "sim": 0.554 }, { "i": 4, "sim": 0.547 }] },
	{ "text": "Large language models predict the next token.", "cluster": "ai", "x": 49.46, "y": -62.57, "neighbors": [{ "i": 15, "sim": 0.717 }, { "i": 14, "sim": 0.712 }, { "i": 13, "sim": 0.643 }, { "i": 11, "sim": 0.545 }] },
	{ "text": "The transformer architecture uses self-attention.", "cluster": "ai", "x": 15.86, "y": -64.32, "neighbors": [{ "i": 14, "sim": 0.678 }, { "i": 12, "sim": 0.643 }, { "i": 15, "sim": 0.597 }, { "i": 10, "sim": 0.504 }] },
	{ "text": "Fine-tuning adapts a pretrained model to a task.", "cluster": "ai", "x": 42.91, "y": -44.51, "neighbors": [{ "i": 12, "sim": 0.712 }, { "i": 13, "sim": 0.678 }, { "i": 15, "sim": 0.627 }, { "i": 11, "sim": 0.6 }] },
	{ "text": "Embeddings map text into a vector space.", "cluster": "ai", "x": 62.38, "y": -53.03, "neighbors": [{ "i": 12, "sim": 0.717 }, { "i": 14, "sim": 0.627 }, { "i": 13, "sim": 0.597 }, { "i": 9, "sim": 0.538 }] },
	{ "text": "The team scored a goal in the final minute.", "cluster": "sports", "x": 4.5, "y": 13.18, "neighbors": [{ "i": 10, "sim": 0.521 }, { "i": 5, "sim": 0.517 }, { "i": 6, "sim": 0.489 }, { "i": 12, "sim": 0.47 }] },
	{ "text": "She trains every morning before the marathon.", "cluster": "sports", "x": -61.89, "y": -16.16, "neighbors": [{ "i": 14, "sim": 0.515 }, { "i": 0, "sim": 0.5 }, { "i": 1, "sim": 0.485 }, { "i": 13, "sim": 0.455 }] },
];

const CLUSTER_COLORS: Record<string, string> = {
	pets: 'var(--accent-yellow)',
	cooking: 'var(--accent)',
	code: '#06b6d4',
	ai: 'var(--accent-secondary)',
	sports: 'var(--accent-magenta)',
};

const CLUSTER_LABELS: Record<string, string> = {
	pets: 'питомцы',
	cooking: 'готовка',
	code: 'код',
	ai: 'AI/LLM',
	sports: 'спорт',
};

function toPct(v: number) {
	return ((v + 110) / 220) * 100;
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
	desc: {
		fontSize: '0.88rem',
		color: 'var(--text-muted)',
		marginBottom: '1rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	legend: {
		display: 'flex',
		gap: '0.9rem',
		flexWrap: 'wrap' as const,
		marginBottom: '1rem',
		fontSize: '0.78rem',
		color: 'var(--text-secondary)',
	} as React.CSSProperties,
	legendDot: (color: string) => ({
		display: 'inline-block',
		width: '8px',
		height: '8px',
		borderRadius: '50%',
		background: color,
		marginRight: '0.35rem',
	} as React.CSSProperties),
	plotWrap: {
		position: 'relative' as const,
		width: '100%',
		aspectRatio: '4 / 3',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		overflow: 'hidden',
	} as React.CSSProperties,
	dot: (color: string, selected: boolean, dimmed: boolean) => ({
		position: 'absolute' as const,
		width: selected ? '14px' : '10px',
		height: selected ? '14px' : '10px',
		borderRadius: '50%',
		background: color,
		border: selected ? '2px solid white' : '1px solid rgba(0,0,0,0.2)',
		transform: 'translate(-50%, -50%)',
		cursor: 'pointer',
		opacity: dimmed ? 0.25 : 1,
		boxShadow: selected ? `0 0 12px ${color}` : 'none',
		transition: 'opacity 0.2s ease, width 0.2s ease, height 0.2s ease',
		zIndex: selected ? 2 : 1,
	} as React.CSSProperties),
	panel: {
		marginTop: '1.1rem',
		padding: '1rem 1.1rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
	} as React.CSSProperties,
	panelTitle: {
		fontSize: '0.78rem',
		fontWeight: 700,
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.04em',
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	selectedText: {
		fontSize: '0.92rem',
		color: 'var(--text)',
		fontWeight: 600,
		marginBottom: '0.75rem',
	} as React.CSSProperties,
	neighborRow: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.6rem',
		padding: '0.3rem 0',
		fontSize: '0.85rem',
		color: 'var(--text-secondary)',
	} as React.CSSProperties,
	simBadge: {
		fontSize: '0.75rem',
		fontWeight: 700,
		color: 'var(--accent-light)',
		fontVariantNumeric: 'tabular-nums' as const,
		flexShrink: 0,
		width: '3.2rem',
	} as React.CSSProperties,
};

export default function EmbeddingSpaceExplorer() {
	const [selected, setSelected] = useState<number | null>(null);

	const selectedNeighbors = selected !== null ? new Set(DATA[selected].neighbors.map((n) => n.i)) : null;

	return (
		<div style={css.wrap}>
			<div style={css.title}>🧭 Пространство эмбеддингов</div>
			<div style={css.desc}>
				18 предложений, настоящие эмбеддинги (BAAI/bge-small-en-v1.5), сжатые в 2D через PCA. Кликни на точку — увидишь её ближайших соседей по косинусной близости, посчитанной по полным 384-мерным векторам (не по 2D-проекции — та сильно теряет структуру).
			</div>

			<div style={css.legend}>
				{Object.entries(CLUSTER_LABELS).map(([key, label]) => (
					<span key={key}>
						<span style={css.legendDot(CLUSTER_COLORS[key])} />
						{label}
					</span>
				))}
			</div>

			<div style={css.plotWrap}>
				<svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
					{selected !== null && DATA[selected].neighbors.map((n) => (
						<line
							key={n.i}
							x1={`${toPct(DATA[selected].x)}%`}
							y1={`${toPct(-DATA[selected].y)}%`}
							x2={`${toPct(DATA[n.i].x)}%`}
							y2={`${toPct(-DATA[n.i].y)}%`}
							stroke="var(--accent-light)"
							strokeWidth={1}
							strokeDasharray="3,3"
							opacity={0.5}
						/>
					))}
				</svg>
				{DATA.map((s, i) => {
					const isSelected = selected === i;
					const isNeighbor = selectedNeighbors?.has(i) ?? false;
					const dimmed = selected !== null && !isSelected && !isNeighbor;
					return (
						<div
							key={i}
							role="button"
							tabIndex={0}
							aria-label={s.text}
							title={s.text}
							style={{ ...css.dot(CLUSTER_COLORS[s.cluster], isSelected, dimmed), left: `${toPct(s.x)}%`, top: `${toPct(-s.y)}%` }}
							onClick={() => setSelected(selected === i ? null : i)}
							onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(selected === i ? null : i); } }}
						/>
					);
				})}
			</div>

			<div style={css.panel}>
				{selected !== null ? (
					<>
						<div style={css.panelTitle}>Выбрано</div>
						<div style={css.selectedText}>«{DATA[selected].text}»</div>
						<div style={css.panelTitle}>Ближайшие соседи по смыслу</div>
						{DATA[selected].neighbors.map((n) => (
							<div key={n.i} style={css.neighborRow}>
								<span style={css.simBadge}>{n.sim.toFixed(3)}</span>
								<span>«{DATA[n.i].text}»</span>
							</div>
						))}
					</>
				) : (
					<div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
						Кликни на любую точку на графике выше.
					</div>
				)}
			</div>
		</div>
	);
}
