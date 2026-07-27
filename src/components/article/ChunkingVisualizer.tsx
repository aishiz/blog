import { useMemo, useState } from 'react';

const TEXT = 'RAG соединяет языковую модель с внешней базой знаний. Модель находит релевантные документы и подставляет их в промпт вместо того, чтобы полагаться только на веса модели. Так RAG снижает галлюцинации и решает проблему устаревших знаний модели. Чанкинг — это разбиение длинных документов на чанки перед индексацией. Слишком большой чанк размывает эмбеддинг чанка между несколькими темами. Слишком маленький чанк теряет контекст, необходимый для понимания смысла чанка. Оверлап между соседними чанками помогает не терять информацию на границах разбиения. Без оверлапа предложение может быть разорвано ровно на границе чанка, и оверлап это чинит.';

const PALETTE = ['var(--accent)', 'var(--accent-secondary)', 'var(--accent-yellow)', 'var(--accent-magenta)', '#06b6d4', '#10b981'];

function chunkFixed(text: string, size: number, overlap: number): string[] {
	const chunks: string[] = [];
	let start = 0;
	while (start < text.length) {
		const end = Math.min(start + size, text.length);
		chunks.push(text.slice(start, end));
		if (end === text.length) break;
		start = end - overlap;
	}
	return chunks;
}

function chunkRecursive(text: string, maxSize: number): string[] {
	const separators = ['\n\n', '. ', ' '];
	function split(t: string, sepIdx: number): string[] {
		if (t.length <= maxSize) return [t];
		if (sepIdx >= separators.length) {
			const out: string[] = [];
			for (let i = 0; i < t.length; i += maxSize) out.push(t.slice(i, i + maxSize));
			return out;
		}
		const sep = separators[sepIdx];
		const parts = t.split(sep).filter((p) => p.length > 0);
		const chunks: string[] = [];
		let current = '';
		for (const part of parts) {
			const candidate = current ? current + sep + part : part;
			if (candidate.length <= maxSize) {
				current = candidate;
			} else {
				if (current) chunks.push(current);
				if (part.length > maxSize) {
					chunks.push(...split(part, sepIdx + 1));
					current = '';
				} else {
					current = part;
				}
			}
		}
		if (current) chunks.push(current);
		return chunks;
	}
	return split(text, 0);
}

const STOP = new Set(['для', 'что', 'это', 'как', 'или', 'его', 'она', 'они', 'был', 'где', 'при', 'более', 'только', 'также', 'если', 'быть', 'всех', 'этой', 'этого', 'так']);

function tokenizeStems(s: string): string[] {
	const words = s.toLowerCase().match(/[а-яa-z]{4,}/gi) || [];
	return words.filter((w) => !STOP.has(w)).map((w) => w.slice(0, 4));
}

function jaccard(a: string[], b: string[]): number {
	const setA = new Set(a);
	const setB = new Set(b);
	const inter = [...setA].filter((x) => setB.has(x)).length;
	const union = new Set([...setA, ...setB]).size;
	return union === 0 ? 0 : inter / union;
}

function chunkSemantic(text: string, threshold: number): string[] {
	const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
	const chunks: string[] = [];
	let current = sentences[0] ?? '';
	let currentStems = tokenizeStems(current);
	for (let i = 1; i < sentences.length; i++) {
		const stems = tokenizeStems(sentences[i]);
		if (jaccard(currentStems, stems) >= threshold) {
			current += ' ' + sentences[i];
			currentStems = [...currentStems, ...stems];
		} else {
			chunks.push(current);
			current = sentences[i];
			currentStems = stems;
		}
	}
	if (current) chunks.push(current);
	return chunks;
}

type Strategy = 'fixed' | 'recursive' | 'semantic';

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
		marginBottom: '1rem',
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
	sliderRow: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		marginBottom: '1.1rem',
		fontSize: '0.82rem',
		color: 'var(--text-secondary)',
		flexWrap: 'wrap' as const,
	} as React.CSSProperties,
	textBlock: {
		padding: '1rem 1.1rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		fontSize: '0.9rem',
		lineHeight: 2,
		color: 'var(--text-secondary)',
	} as React.CSSProperties,
	chunkSpan: (color: string) => ({
		background: `color-mix(in srgb, ${color} 26%, transparent)`,
		borderRadius: '3px',
		padding: '0.1rem 0',
	} as React.CSSProperties),
	stats: {
		marginTop: '0.75rem',
		fontSize: '0.82rem',
		color: 'var(--text-muted)',
	} as React.CSSProperties,
};

export default function ChunkingVisualizer() {
	const [strategy, setStrategy] = useState<Strategy>('fixed');
	const [fixedSize, setFixedSize] = useState(120);
	const [overlap, setOverlap] = useState(20);
	const [maxSize, setMaxSize] = useState(150);
	const [threshold, setThreshold] = useState(0.06);

	const chunks = useMemo(() => {
		if (strategy === 'fixed') return chunkFixed(TEXT, fixedSize, overlap);
		if (strategy === 'recursive') return chunkRecursive(TEXT, maxSize);
		return chunkSemantic(TEXT, threshold);
	}, [strategy, fixedSize, overlap, maxSize, threshold]);

	return (
		<div style={css.wrap}>
			<div style={css.title}>✂️ Чанкинг вживую</div>
			<div style={css.desc}>
				Один и тот же текст, три разные стратегии разбиения на чанки. Fixed-size и recursive — рабочий алгоритм (как в LangChain). Semantic — упрощённая версия: реальные системы сравнивают эмбеддинги соседних предложений, здесь для наглядности — пересечение значимых слов (без загрузки модели эмбеддингов в браузер).
			</div>

			<div style={css.presetRow}>
				<button style={css.presetBtn(strategy === 'fixed')} onClick={() => setStrategy('fixed')}>Fixed-size</button>
				<button style={css.presetBtn(strategy === 'recursive')} onClick={() => setStrategy('recursive')}>Recursive</button>
				<button style={css.presetBtn(strategy === 'semantic')} onClick={() => setStrategy('semantic')}>Semantic (упрощ.)</button>
			</div>

			{strategy === 'fixed' && (
				<div style={css.sliderRow}>
					<label>
						Размер чанка: <strong style={{ color: 'var(--text)' }}>{fixedSize}</strong> симв.
						<input aria-label="Размер чанка" type="range" min={40} max={250} step={10} value={fixedSize} onChange={(e) => setFixedSize(Number(e.target.value))} style={{ marginLeft: '0.5rem', verticalAlign: 'middle' }} />
					</label>
					<label>
						Оверлап: <strong style={{ color: 'var(--text)' }}>{overlap}</strong> симв.
						<input aria-label="Оверлап" type="range" min={0} max={80} step={5} value={overlap} onChange={(e) => setOverlap(Number(e.target.value))} style={{ marginLeft: '0.5rem', verticalAlign: 'middle' }} />
					</label>
				</div>
			)}
			{strategy === 'recursive' && (
				<div style={css.sliderRow}>
					<label>
						Макс. размер чанка: <strong style={{ color: 'var(--text)' }}>{maxSize}</strong> симв.
						<input aria-label="Максимальный размер чанка" type="range" min={60} max={300} step={10} value={maxSize} onChange={(e) => setMaxSize(Number(e.target.value))} style={{ marginLeft: '0.5rem', verticalAlign: 'middle' }} />
					</label>
				</div>
			)}
			{strategy === 'semantic' && (
				<div style={css.sliderRow}>
					<label>
						Порог схожести: <strong style={{ color: 'var(--text)' }}>{threshold.toFixed(2)}</strong>
						<input aria-label="Порог схожести" type="range" min={0} max={0.3} step={0.01} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} style={{ marginLeft: '0.5rem', verticalAlign: 'middle' }} />
					</label>
				</div>
			)}

			<div style={css.textBlock}>
				{chunks.map((c, i) => (
					<span key={i} style={css.chunkSpan(PALETTE[i % PALETTE.length])}>{c}</span>
				))}
			</div>

			<div style={css.stats}>Чанков: <strong style={{ color: 'var(--text)' }}>{chunks.length}</strong></div>
		</div>
	);
}
