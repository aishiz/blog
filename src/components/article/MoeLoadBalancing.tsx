import { useState, useEffect } from 'react';

// Доля токенов, уходящих каждому эксперту (в процентах).
const COLLAPSED = [11, 4, 41, 2, 32, 1, 9, 0];
const BALANCED = [14, 13, 15, 12, 13, 11, 12, 10];
const DEAD_THRESHOLD = 3;

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
	btn: (active: boolean, color: string) => ({
		padding: '0.5rem 1rem',
		borderRadius: '8px',
		border: `1px solid ${active ? color : 'var(--border)'}`,
		background: active ? `${color}22` : 'var(--bg-secondary)',
		color: active ? color : 'var(--text)',
		fontSize: '0.82rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
		transition: 'all 0.2s ease',
	} as React.CSSProperties),
	row: {
		display: 'grid',
		gridTemplateColumns: '3.2rem 1fr 4.5rem',
		gap: '0.6rem',
		alignItems: 'center',
		marginBottom: '0.45rem',
	} as React.CSSProperties,
	name: (dead: boolean) => ({
		fontSize: '0.78rem',
		fontWeight: 700,
		fontFamily: 'var(--font-mono, monospace)',
		color: dead ? 'var(--text-muted)' : 'var(--text)',
		opacity: dead ? 0.5 : 1,
	} as React.CSSProperties),
	track: {
		height: '1.2rem',
		borderRadius: '4px',
		background: 'var(--bg-secondary)',
		overflow: 'hidden',
	} as React.CSSProperties,
	fill: (w: number, dead: boolean, overloaded: boolean) => ({
		width: `${Math.max(w * 2, 1)}%`,
		height: '100%',
		borderRadius: '4px',
		background: dead ? 'var(--border)' : overloaded ? '#f59e0b' : '#10b981',
		transition: 'width 0.55s ease, background 0.3s ease',
	} as React.CSSProperties),
	pct: (dead: boolean) => ({
		fontSize: '0.75rem',
		fontWeight: 700,
		fontVariantNumeric: 'tabular-nums',
		textAlign: 'right' as const,
		color: dead ? 'var(--text-muted)' : 'var(--text)',
		opacity: dead ? 0.6 : 1,
	} as React.CSSProperties),
	verdict: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: '0.75rem',
		marginTop: '1rem',
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
	foot: {
		fontSize: '0.78rem',
		color: 'var(--text-muted)',
		marginTop: '0.9rem',
		lineHeight: 1.55,
	} as React.CSSProperties,
};

export default function MoeLoadBalancing() {
	const [balanced, setBalanced] = useState(false);
	const mobile = useIsMobile();
	const data = balanced ? BALANCED : COLLAPSED;
	const dead = data.filter((v) => v < DEAD_THRESHOLD).length;
	const wasted = Math.round((dead / data.length) * 100);

	return (
		<div style={{ ...css.wrap, ...(mobile ? { padding: '1rem', margin: '1.25em 0' } : {}) }}>
			<div style={css.title}>⚖️ Куда роутер отправляет токены</div>
			<div style={css.desc}>
				Доля токенов на каждого из 8 экспертов после обучения. Оранжевый — перегруз, серый — эксперт
				практически мёртв.
			</div>

			<div style={css.toggles}>
				<button style={css.btn(!balanced, '#f59e0b')} onClick={() => setBalanced(false)}>
					💥 Без балансировки
				</button>
				<button style={css.btn(balanced, '#10b981')} onClick={() => setBalanced(true)}>
					⚖️ С балансировкой
				</button>
			</div>

			{data.map((v, i) => {
				const isDead = v < DEAD_THRESHOLD;
				const isOver = v > 25;
				return (
					<div key={i} style={css.row}>
						<span style={css.name(isDead)}>
							E{i + 1}
							{isDead ? ' 💀' : ''}
						</span>
						<div style={css.track}>
							<div style={css.fill(v, isDead, isOver)} />
						</div>
						<span style={css.pct(isDead)}>{v}%</span>
					</div>
				);
			})}

			<div style={css.verdict}>
				<div style={css.card(balanced ? '#10b981' : '#f59e0b')}>
					<div style={css.cardVal(balanced ? '#10b981' : '#f59e0b')}>{dead}</div>
					<div style={css.cardLabel}>Мёртвых экспертов</div>
				</div>
				<div style={css.card(balanced ? '#10b981' : '#f59e0b')}>
					<div style={css.cardVal(balanced ? '#10b981' : '#f59e0b')}>{wasted}%</div>
					<div style={css.cardLabel}>Параметров выброшено зря</div>
				</div>
			</div>

			<div style={css.foot}>
				{balanced ? (
					<>
						Балансировка заставила роутер раздавать токены ровнее: все эксперты учатся, вся ёмкость
						модели работает. Цена — роутер иногда шлёт токен не самому лучшему эксперту.
					</>
				) : (
					<>
						Классический коллапс: E3 и E5 тащат 73% трафика, три эксперта умерли. Их параметры лежат
						в VRAM мёртвым грузом — ты платишь памятью за ёмкость, которой нет.
					</>
				)}
			</div>
		</div>
	);
}
