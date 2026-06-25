import { useState, useEffect, useCallback } from 'react';

const TOKENS = ['Мама', 'мыла', 'раму', 'очень', 'чисто', 'и', 'аккуратно'];

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
		marginBottom: '1.25rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	row: {
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '0.5rem',
		marginBottom: '1.1rem',
	} as React.CSSProperties,
	rowTitle: (color: string) => ({
		fontSize: '0.8rem',
		fontWeight: 700,
		color,
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'baseline',
		gap: '0.5rem',
	} as React.CSSProperties),
	rowOps: {
		fontSize: '0.72rem',
		fontWeight: 600,
		color: 'var(--text-muted)',
		fontVariantNumeric: 'tabular-nums',
	} as React.CSSProperties,
	cells: {
		display: 'flex',
		gap: '4px',
		flexWrap: 'wrap' as const,
	} as React.CSSProperties,
	cell: (state: 'empty' | 'cached' | 'recompute' | 'new') => {
		const map = {
			empty: { bg: 'var(--bg-secondary)', bd: 'var(--border)', fg: 'var(--text-muted)', op: 0.3 },
			cached: { bg: 'var(--accent-glow)', bd: 'var(--accent)', fg: 'var(--accent-light)', op: 0.55 },
			recompute: { bg: '#f59e0b22', bd: '#f59e0b', fg: '#f59e0b', op: 1 },
			new: { bg: '#10b98122', bd: '#10b981', fg: '#10b981', op: 1 },
		}[state];
		return {
			minWidth: '2.2rem',
			padding: '0.4rem 0.45rem',
			borderRadius: '6px',
			border: `1px solid ${map.bd}`,
			background: map.bg,
			color: map.fg,
			opacity: map.op,
			fontSize: '0.72rem',
			fontWeight: 600,
			textAlign: 'center' as const,
			transition: 'all 0.25s ease',
		} as React.CSSProperties;
	},
	verdict: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: '0.75rem',
		marginTop: '0.5rem',
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
	controls: {
		display: 'flex',
		gap: '0.5rem',
		marginTop: '1.25rem',
		alignItems: 'center',
		flexWrap: 'wrap' as const,
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
		fontVariantNumeric: 'tabular-nums',
	} as React.CSSProperties,
};

export default function KvCacheReplay() {
	const [step, setStep] = useState(1);
	const [auto, setAuto] = useState(true);
	const mobile = useIsMobile();
	const maxStep = TOKENS.length;

	const advance = useCallback(() => {
		setStep((s) => (s >= maxStep ? 1 : s + 1));
	}, [maxStep]);

	useEffect(() => {
		if (!auto) return;
		const id = setInterval(advance, 1700);
		return () => clearInterval(id);
	}, [auto, advance]);

	// На шаге s генерируется токен с индексом s-1.
	// Без кэша: пересчитываем K,V для всех s токенов. С кэшем: только 1 новый.
	const naiveOps = (step * (step + 1)) / 2; // 1+2+...+s
	const cachedOps = step; // 1 на каждый шаг

	return (
		<div style={{ ...css.wrap, ...(mobile ? { padding: '1rem', margin: '1.25em 0' } : {}) }}>
			<div style={css.title}>♻️ Без кэша vs с кэшем</div>
			<div style={css.desc}>
				Модель генерирует токены по одному. Оранжевый — K/V считаются заново на этом шаге, синий — лежат
				в кэше, зелёный — новый токен. Жми «Вперёд» и смотри, сколько лишней работы без кэша.
			</div>

			<div style={css.row}>
				<div style={css.rowTitle('#f59e0b')}>
					<span>❌ Без кэша — пересчёт всего на каждом шаге</span>
					<span style={css.rowOps}>{naiveOps} вычислений K/V</span>
				</div>
				<div style={css.cells}>
					{TOKENS.map((t, i) => (
						<div key={i} style={css.cell(i < step ? 'recompute' : 'empty')}>
							{t}
						</div>
					))}
				</div>
			</div>

			<div style={css.row}>
				<div style={css.rowTitle('#10b981')}>
					<span>✅ С кэшем — считаем только новый токен</span>
					<span style={css.rowOps}>{cachedOps} вычислений K/V</span>
				</div>
				<div style={css.cells}>
					{TOKENS.map((t, i) => (
						<div key={i} style={css.cell(i === step - 1 ? 'new' : i < step ? 'cached' : 'empty')}>
							{t}
						</div>
					))}
				</div>
			</div>

			<div style={css.verdict}>
				<div style={css.card('#f59e0b')}>
					<div style={css.cardVal('#f59e0b')}>{naiveOps}</div>
					<div style={css.cardLabel}>Операций без кэша · O(n²)</div>
				</div>
				<div style={css.card('#10b981')}>
					<div style={css.cardVal('#10b981')}>{cachedOps}</div>
					<div style={css.cardLabel}>Операций с кэшем · O(n)</div>
				</div>
			</div>

			<div style={css.controls}>
				<button style={css.btn()} onClick={() => { setStep((s) => Math.max(1, s - 1)); setAuto(false); }}>← Назад</button>
				<button style={css.btn()} onClick={() => { advance(); setAuto(false); }}>Вперёд →</button>
				<button style={css.btn(auto)} onClick={() => setAuto(!auto)}>{auto ? '⏸ Пауза' : '▶ Авто'}</button>
				<span style={css.stepLabel}>Токен {step}/{maxStep}</span>
			</div>
		</div>
	);
}
