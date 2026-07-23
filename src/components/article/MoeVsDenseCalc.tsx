import { useState, useEffect } from 'react';

// Референс — плотная 70B. Сравниваем с MoE-пресетами.
// Память: BF16, total × 2 байта. Компьют и скорость декода ∝ активным параметрам
// (декод memory-bound: на токен читаются только веса активных экспертов).
const DENSE = { name: 'Llama 3.3 70B (dense)', total: 70, active: 70 };

const PRESETS = [
	{ name: 'Mixtral 8x7B', total: 47, active: 13 },
	{ name: 'Qwen3.5 397B', total: 397, active: 17 },
	{ name: 'DeepSeek-V3 671B', total: 671, active: 37 },
	{ name: 'Kimi K2.5 1T', total: 1000, active: 32 },
];

function useIsMobile(breakpoint = 560) {
	const [m, setM] = useState(false);
	useEffect(() => {
		const check = () => setM(window.innerWidth <= breakpoint);
		check();
		window.addEventListener('resize', check, { passive: true });
		return () => window.removeEventListener('resize', check);
	}, [breakpoint]);
	return m;
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
		marginBottom: '1.1rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	toggles: {
		display: 'flex',
		gap: '0.5rem',
		marginBottom: '1.2rem',
		flexWrap: 'wrap' as const,
	} as React.CSSProperties,
	btn: (active: boolean) => ({
		padding: '0.45rem 0.85rem',
		borderRadius: '8px',
		border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
		background: active ? 'var(--accent-glow)' : 'var(--bg-secondary)',
		color: active ? 'var(--accent-light)' : 'var(--text)',
		fontSize: '0.78rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
		transition: 'all 0.2s ease',
	} as React.CSSProperties),
	metric: {
		marginBottom: '1.1rem',
	} as React.CSSProperties,
	metricTitle: {
		fontSize: '0.75rem',
		fontWeight: 700,
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.04em',
		marginBottom: '0.4rem',
	} as React.CSSProperties,
	row: {
		display: 'grid',
		gridTemplateColumns: '8.5rem 1fr 5.5rem',
		gap: '0.6rem',
		alignItems: 'center',
		marginBottom: '0.35rem',
	} as React.CSSProperties,
	rowMobile: {
		gridTemplateColumns: '6.5rem 1fr 4.5rem',
	} as React.CSSProperties,
	label: {
		fontSize: '0.72rem',
		fontWeight: 600,
		color: 'var(--text-muted)',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap' as const,
	} as React.CSSProperties,
	track: {
		height: '1.1rem',
		borderRadius: '4px',
		background: 'var(--bg-secondary)',
		overflow: 'hidden',
	} as React.CSSProperties,
	fill: (w: number, color: string) => ({
		width: `${Math.max(w, 1.5)}%`,
		height: '100%',
		borderRadius: '4px',
		background: color,
		transition: 'width 0.55s ease',
	} as React.CSSProperties),
	val: {
		fontSize: '0.75rem',
		fontWeight: 700,
		fontVariantNumeric: 'tabular-nums',
		textAlign: 'right' as const,
		color: 'var(--text)',
	} as React.CSSProperties,
	verdict: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: '0.75rem',
		marginTop: '0.4rem',
	} as React.CSSProperties,
	card: (color: string) => ({
		padding: '0.75rem 0.9rem',
		borderRadius: '8px',
		border: `1px solid ${color}55`,
		background: `${color}11`,
	} as React.CSSProperties),
	cardVal: (color: string) => ({
		fontSize: '1.5rem',
		fontWeight: 900,
		color,
		fontVariantNumeric: 'tabular-nums',
	} as React.CSSProperties),
	cardLabel: {
		fontSize: '0.68rem',
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.04em',
		fontWeight: 600,
		marginTop: '0.15rem',
	} as React.CSSProperties,
};

export default function MoeVsDenseCalc() {
	const [idx, setIdx] = useState(1); // Qwen3.5 по умолчанию
	const mobile = useIsMobile();
	const moe = PRESETS[idx];

	const memDense = DENSE.total * 2;
	const memMoe = moe.total * 2;
	const memMax = Math.max(memDense, memMoe);

	const speedup = DENSE.active / moe.active;
	const memRatio = memMoe / memDense;

	const rowStyle = { ...css.row, ...(mobile ? css.rowMobile : {}) };

	return (
		<div style={{ ...css.wrap, ...(mobile ? { padding: '1rem', margin: '1.25em 0' } : {}) }}>
			<div style={css.title}>⚔️ Dense 70B против MoE</div>
			<div style={css.desc}>
				Память считаем по всем параметрам (BF16), вычисления на токен — только по активным: остальные
				эксперты в этом токене не участвуют, их веса даже не читаются.
			</div>

			<div style={css.toggles}>
				{PRESETS.map((p, i) => (
					<button key={p.name} style={css.btn(i === idx)} onClick={() => setIdx(i)}>
						{p.name}
					</button>
				))}
			</div>

			<div style={css.metric}>
				<div style={css.metricTitle}>💾 Память под веса (BF16)</div>
				<div style={rowStyle}>
					<span style={css.label}>{DENSE.name}</span>
					<div style={css.track}>
						<div style={css.fill((memDense / memMax) * 100, '#3b82f6')} />
					</div>
					<span style={css.val}>{memDense} ГБ</span>
				</div>
				<div style={rowStyle}>
					<span style={css.label}>{moe.name}</span>
					<div style={css.track}>
						<div style={css.fill((memMoe / memMax) * 100, '#f59e0b')} />
					</div>
					<span style={css.val}>{memMoe} ГБ</span>
				</div>
			</div>

			<div style={css.metric}>
				<div style={css.metricTitle}>⚡ Параметров в работе на каждый токен</div>
				<div style={rowStyle}>
					<span style={css.label}>{DENSE.name}</span>
					<div style={css.track}>
						<div style={css.fill(100, '#3b82f6')} />
					</div>
					<span style={css.val}>{DENSE.active}B</span>
				</div>
				<div style={rowStyle}>
					<span style={css.label}>{moe.name}</span>
					<div style={css.track}>
						<div style={css.fill((moe.active / DENSE.active) * 100, '#10b981')} />
					</div>
					<span style={css.val}>{moe.active}B</span>
				</div>
			</div>

			<div style={css.verdict}>
				<div style={css.card('#10b981')}>
					<div style={css.cardVal('#10b981')}>×{speedup.toFixed(1)}</div>
					<div style={css.cardLabel}>Меньше вычислений на токен</div>
				</div>
				<div style={css.card('#f59e0b')}>
					<div style={css.cardVal('#f59e0b')}>×{memRatio.toFixed(1)}</div>
					<div style={css.cardLabel}>Больше памяти под веса</div>
				</div>
			</div>
		</div>
	);
}
