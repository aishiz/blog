import { useState, useEffect, useCallback } from 'react';

const TOTAL_EXPERTS = 64;
const ACTIVE_COUNT = 8;

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
	grid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(16, 1fr)',
		gap: '4px',
		marginBottom: '1.25rem',
	} as React.CSSProperties,
	cell: (active: boolean) => ({
		aspectRatio: '1',
		borderRadius: '6px',
		border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
		background: active
			? 'linear-gradient(135deg, var(--accent), var(--accent-secondary))'
			: 'var(--bg-secondary)',
		transition: 'all 0.3s ease',
		transform: active ? 'scale(1.08)' : 'scale(1)',
		boxShadow: active ? '0 2px 12px rgba(255,107,43,0.3)' : 'none',
		cursor: 'pointer',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: '0.6rem',
		fontWeight: 700,
		color: active ? 'white' : 'var(--text-muted)',
	} as React.CSSProperties),
	stats: {
		display: 'flex',
		gap: '1.5rem',
		flexWrap: 'wrap' as const,
	} as React.CSSProperties,
	stat: {
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '0.15rem',
	} as React.CSSProperties,
	statVal: {
		fontSize: '1.4rem',
		fontWeight: 900,
		background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
		WebkitBackgroundClip: 'text',
		WebkitTextFillColor: 'transparent',
		backgroundClip: 'text',
	} as React.CSSProperties,
	statLabel: {
		fontSize: '0.72rem',
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.06em',
		fontWeight: 600,
	} as React.CSSProperties,
	btn: {
		marginTop: '1rem',
		padding: '0.55rem 1.25rem',
		borderRadius: '8px',
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
		color: 'var(--text)',
		fontSize: '0.85rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
		transition: 'all 0.2s ease',
	} as React.CSSProperties,
};

function pickRandom(total: number, count: number): Set<number> {
	const set = new Set<number>();
	while (set.size < count) {
		set.add(Math.floor(Math.random() * total));
	}
	return set;
}

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

export default function MoeExplorer() {
	const [active, setActive] = useState<Set<number>>(() => pickRandom(TOTAL_EXPERTS, ACTIVE_COUNT));
	const [auto, setAuto] = useState(true);
	const mobile = useIsMobile();

	const shuffle = useCallback(() => {
		setActive(pickRandom(TOTAL_EXPERTS, ACTIVE_COUNT));
	}, []);

	useEffect(() => {
		if (!auto) return;
		const id = setInterval(shuffle, 1500);
		return () => clearInterval(id);
	}, [auto, shuffle]);

	const pct = ((ACTIVE_COUNT / TOTAL_EXPERTS) * 100).toFixed(1);

	return (
		<div style={{
			...css.wrap,
			...(mobile ? { padding: '0.85rem', margin: '1.25em -0.25rem', borderRadius: '10px' } : {}),
		}}>
			<div style={css.title}>⚡ MoE Explorer</div>
			<div style={{ ...css.desc, ...(mobile ? { fontSize: '0.82rem', marginBottom: '1rem' } : {}) }}>
				Каждый квадрат — «эксперт». Маршрутизатор активирует <strong style={{ color: 'var(--text)' }}>{ACTIVE_COUNT} из {TOTAL_EXPERTS}</strong>.
				{!mobile && ' Нажмите на сетку или кнопку, чтобы смоделировать новый токен.'}
			</div>

			<div
				style={{
					...css.grid,
					...(mobile ? { gridTemplateColumns: 'repeat(8, 1fr)', gap: '3px', marginBottom: '1rem' } : {}),
				}}
				onClick={() => { shuffle(); setAuto(false); }}
			>
				{Array.from({ length: TOTAL_EXPERTS }, (_, i) => (
					<div key={i} style={{
						...css.cell(active.has(i)),
						...(mobile ? { borderRadius: '4px', fontSize: '0.5rem' } : {}),
					}}>
						{active.has(i) ? '✓' : ''}
					</div>
				))}
			</div>

			<div style={{
				...css.stats,
				...(mobile ? {
					display: 'grid',
					gridTemplateColumns: '1fr 1fr',
					gap: '0.5rem',
				} : {}),
			}}>
				<div style={css.stat}>
					<span style={{ ...css.statVal, ...(mobile ? { fontSize: '1.1rem' } : {}) }}>{ACTIVE_COUNT}/{TOTAL_EXPERTS}</span>
					<span style={css.statLabel}>Активных</span>
				</div>
				<div style={css.stat}>
					<span style={{ ...css.statVal, ...(mobile ? { fontSize: '1.1rem' } : {}) }}>{pct}%</span>
					<span style={css.statLabel}>Разреженность</span>
				</div>
				<div style={css.stat}>
					<span style={{ ...css.statVal, ...(mobile ? { fontSize: '1.1rem' } : {}) }}>~{(ACTIVE_COUNT / TOTAL_EXPERTS * 397).toFixed(0)}B</span>
					<span style={css.statLabel}>Активных парам.</span>
				</div>
				<div style={css.stat}>
					<span style={{ ...css.statVal, ...(mobile ? { fontSize: '1.1rem' } : {}) }}>{((1 - ACTIVE_COUNT / TOTAL_EXPERTS) * 100).toFixed(0)}%</span>
					<span style={css.statLabel}>Экономия</span>
				</div>
			</div>

			<div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap' as const }}>
				<button
					style={{ ...css.btn, marginTop: 0, ...(mobile ? { padding: '0.5rem 1rem', fontSize: '0.8rem' } : {}) }}
					onClick={() => { shuffle(); setAuto(false); }}
					onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
					onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
				>
					{auto ? '⏸ Стоп' : '🔄 Токен'}
				</button>
				{!auto && (
					<button
						style={{ ...css.btn, marginTop: 0, ...(mobile ? { padding: '0.5rem 1rem', fontSize: '0.8rem' } : {}) }}
						onClick={() => setAuto(true)}
						onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
						onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
					>
						▶ Авто
					</button>
				)}
			</div>
		</div>
	);
}
