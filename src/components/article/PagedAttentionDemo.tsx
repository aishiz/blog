import { useState, useEffect, useCallback, useMemo } from 'react';

const TOTAL_BLOCKS = 24;
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#7c3aed', '#06b6d4'];

type Block = { reqId: number | null; fragmented: boolean };

function generateNaive(step: number): { blocks: Block[]; requests: number; wasted: number } {
	const blocks: Block[] = Array.from({ length: TOTAL_BLOCKS }, () => ({ reqId: null, fragmented: false }));
	const sizes = [4, 6, 3, 5, 2, 4];
	let pos = 0;
	let requests = 0;

	for (let i = 0; i < Math.min(step, sizes.length); i++) {
		const size = sizes[i];
		const allocated = Math.ceil(size * 1.5);
		if (pos + allocated > TOTAL_BLOCKS) break;
		for (let j = 0; j < allocated; j++) {
			blocks[pos + j] = { reqId: i, fragmented: j >= size };
		}
		pos += allocated;
		requests++;
	}

	const wasted = blocks.filter((b) => b.fragmented).length;
	return { blocks, requests, wasted };
}

function generatePaged(step: number): { blocks: Block[]; requests: number; wasted: number } {
	const blocks: Block[] = Array.from({ length: TOTAL_BLOCKS }, () => ({ reqId: null, fragmented: false }));
	const sizes = [4, 6, 3, 5, 2, 4, 3, 2];
	let pos = 0;
	let requests = 0;

	for (let i = 0; i < Math.min(step, sizes.length); i++) {
		const size = sizes[i];
		if (pos + size > TOTAL_BLOCKS) break;
		for (let j = 0; j < size; j++) {
			blocks[pos + j] = { reqId: i, fragmented: false };
		}
		pos += size;
		requests++;
	}

	return { blocks, requests, wasted: 0 };
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
		marginBottom: '1.25rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	comparison: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: '1.25rem',
	} as React.CSSProperties,
	column: {
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '0.75rem',
	} as React.CSSProperties,
	colTitle: (color: string) => ({
		fontSize: '0.82rem',
		fontWeight: 700,
		color: color,
		textTransform: 'uppercase' as const,
		letterSpacing: '0.04em',
	} as React.CSSProperties),
	grid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(6, 1fr)',
		gap: '3px',
	} as React.CSSProperties,
	cell: (reqId: number | null, fragmented: boolean) => {
		const color = reqId !== null ? COLORS[reqId % COLORS.length] : 'var(--bg-secondary)';
		return {
			aspectRatio: '1',
			borderRadius: '4px',
			border: `1px solid ${reqId !== null ? (fragmented ? '#ef4444' : `${color}88`) : 'var(--border)'}`,
			background: fragmented
				? `repeating-linear-gradient(45deg, ${color}33, ${color}33 3px, #ef444433 3px, #ef444433 6px)`
				: reqId !== null
					? color
					: 'var(--bg-secondary)',
			transition: 'all 0.3s ease',
			opacity: reqId !== null ? (fragmented ? 0.6 : 0.9) : 0.3,
		} as React.CSSProperties;
	},
	stats: {
		display: 'flex',
		gap: '1rem',
		marginTop: '0.5rem',
	} as React.CSSProperties,
	stat: {
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '0.1rem',
	} as React.CSSProperties,
	statVal: (color: string) => ({
		fontSize: '1.2rem',
		fontWeight: 900,
		color: color,
	} as React.CSSProperties),
	statLabel: {
		fontSize: '0.65rem',
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.05em',
		fontWeight: 600,
	} as React.CSSProperties,
	controls: {
		display: 'flex',
		gap: '0.5rem',
		marginTop: '1.25rem',
		alignItems: 'center',
	} as React.CSSProperties,
	btn: (active?: boolean) => ({
		padding: '0.5rem 1rem',
		borderRadius: '8px',
		border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
		background: active ? 'var(--accent-glow)' : 'var(--bg-secondary)',
		color: active ? 'var(--accent-light)' : 'var(--text)',
		fontSize: '0.82rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
		transition: 'all 0.2s ease',
	} as React.CSSProperties),
	stepLabel: {
		fontSize: '0.82rem',
		color: 'var(--text-muted)',
		fontWeight: 600,
		marginLeft: 'auto',
	} as React.CSSProperties,
};

function useIsMobile(breakpoint = 480) {
	const [m, setM] = useState(false);
	useEffect(() => {
		const check = () => setM(window.innerWidth <= breakpoint);
		check();
		window.addEventListener('resize', check, { passive: true });
		return () => window.removeEventListener('resize', check);
	}, [breakpoint]);
	return m;
}

export default function PagedAttentionDemo() {
	const [step, setStep] = useState(1);
	const [auto, setAuto] = useState(true);
	const maxStep = 6;
	const mobile = useIsMobile();

	const advance = useCallback(() => {
		setStep((s) => (s >= maxStep ? 1 : s + 1));
	}, []);

	useEffect(() => {
		if (!auto) return;
		const id = setInterval(advance, 2000);
		return () => clearInterval(id);
	}, [auto, advance]);

	const naive = generateNaive(step);
	const paged = generatePaged(step);

	const naiveUsed = naive.blocks.filter((b) => b.reqId !== null).length;
	const pagedUsed = paged.blocks.filter((b) => b.reqId !== null).length;
	const naiveUtil = ((naiveUsed - naive.wasted) / TOTAL_BLOCKS * 100).toFixed(0);
	const pagedUtil = (pagedUsed / TOTAL_BLOCKS * 100).toFixed(0);

	return (
		<div style={{ ...css.wrap, ...(mobile ? { padding: '1rem', margin: '1.25em 0' } : {}) }}>
			<div style={css.title}>🧠 PagedAttention vs Наивный подход</div>
			<div style={css.desc}>
				{mobile ? 'Сверху — наивное выделение (фрагментация). Снизу — PagedAttention (без потерь).' : 'Слева — наивное выделение памяти (фрагментация, пустые блоки). Справа — PagedAttention (страничная аллокация без потерь). Каждый цвет — отдельный запрос.'}
			</div>

			<div style={{ ...css.comparison, ...(mobile ? { gridTemplateColumns: '1fr', gap: '1rem' } : {}) }}>
				<div style={css.column}>
					<div style={css.colTitle('#ef4444')}>❌ Наивный подход</div>
					<div style={{ ...css.grid, ...(mobile ? { gridTemplateColumns: 'repeat(8, 1fr)' } : {}) }}>
						{naive.blocks.map((b, i) => (
							<div key={i} style={css.cell(b.reqId, b.fragmented)} />
						))}
					</div>
					<div style={{ ...css.stats, ...(mobile ? { gap: '0.75rem' } : {}) }}>
						<div style={css.stat}>
							<span style={{ ...css.statVal('#ef4444'), ...(mobile ? { fontSize: '1rem' } : {}) }}>{naive.requests}</span>
							<span style={css.statLabel}>Запросов</span>
						</div>
						<div style={css.stat}>
							<span style={{ ...css.statVal('#ef4444'), ...(mobile ? { fontSize: '1rem' } : {}) }}>{naive.wasted}</span>
							<span style={css.statLabel}>Потеряно</span>
						</div>
						<div style={css.stat}>
							<span style={{ ...css.statVal('#ef4444'), ...(mobile ? { fontSize: '1rem' } : {}) }}>{naiveUtil}%</span>
							<span style={css.statLabel}>Утилизация</span>
						</div>
					</div>
				</div>

				<div style={css.column}>
					<div style={css.colTitle('#10b981')}>✅ PagedAttention</div>
					<div style={{ ...css.grid, ...(mobile ? { gridTemplateColumns: 'repeat(8, 1fr)' } : {}) }}>
						{paged.blocks.map((b, i) => (
							<div key={i} style={css.cell(b.reqId, b.fragmented)} />
						))}
					</div>
					<div style={{ ...css.stats, ...(mobile ? { gap: '0.75rem' } : {}) }}>
						<div style={css.stat}>
							<span style={{ ...css.statVal('#10b981'), ...(mobile ? { fontSize: '1rem' } : {}) }}>{paged.requests}</span>
							<span style={css.statLabel}>Запросов</span>
						</div>
						<div style={css.stat}>
							<span style={{ ...css.statVal('#10b981'), ...(mobile ? { fontSize: '1rem' } : {}) }}>{paged.wasted}</span>
							<span style={css.statLabel}>Потеряно</span>
						</div>
						<div style={css.stat}>
							<span style={{ ...css.statVal('#10b981'), ...(mobile ? { fontSize: '1rem' } : {}) }}>{pagedUtil}%</span>
							<span style={css.statLabel}>Утилизация</span>
						</div>
					</div>
				</div>
			</div>

			<div style={{ ...css.controls, ...(mobile ? { flexWrap: 'wrap' as const } : {}) }}>
				<button style={{ ...css.btn(), ...(mobile ? { padding: '0.45rem 0.75rem', fontSize: '0.78rem' } : {}) }} onClick={() => { setStep((s) => Math.max(1, s - 1)); setAuto(false); }}>← Назад</button>
				<button style={{ ...css.btn(), ...(mobile ? { padding: '0.45rem 0.75rem', fontSize: '0.78rem' } : {}) }} onClick={() => { advance(); setAuto(false); }}>Вперёд →</button>
				<button style={{ ...css.btn(auto), ...(mobile ? { padding: '0.45rem 0.75rem', fontSize: '0.78rem' } : {}) }} onClick={() => setAuto(!auto)}>
					{auto ? '⏸ Пауза' : '▶ Авто'}
				</button>
				<span style={css.stepLabel}>Шаг {step}/{maxStep}</span>
			</div>
		</div>
	);
}
