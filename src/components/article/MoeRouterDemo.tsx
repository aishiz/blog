import { useState, useEffect, useCallback } from 'react';

// 8 экспертов, top-2 роутинг. Данные подобраны так, чтобы была видна
// специализация: пунктуация, числа и код стабильно уходят к «своим» экспертам.
const EXPERTS = [
	{ id: 0, tag: 'слова' },
	{ id: 1, tag: 'морфемы' },
	{ id: 2, tag: 'пунктуация' },
	{ id: 3, tag: 'числа' },
	{ id: 4, tag: 'код' },
	{ id: 5, tag: 'скобки' },
	{ id: 6, tag: 'общий' },
	{ id: 7, tag: '???' },
];

// [токен, [эксперт, вес], [эксперт, вес]]
const TOKENS: [string, [number, number], [number, number]][] = [
	['Функция', [0, 0.54], [4, 0.46]],
	['get_price', [4, 0.81], [5, 0.19]],
	['(', [5, 0.86], [2, 0.14]],
	[')', [5, 0.83], [2, 0.17]],
	['вернула', [1, 0.71], [6, 0.29]],
	['42', [3, 0.77], [2, 0.23]],
	[',', [2, 0.88], [6, 0.12]],
	['а', [6, 0.63], [0, 0.37]],
	['не', [6, 0.58], [1, 0.42]],
	['null', [4, 0.74], [3, 0.26]],
	['!', [2, 0.9], [6, 0.1]],
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
	tokens: {
		display: 'flex',
		gap: '4px',
		flexWrap: 'wrap' as const,
		marginBottom: '1.1rem',
	} as React.CSSProperties,
	token: (state: 'past' | 'current' | 'future') => {
		const map = {
			past: { bg: 'var(--bg-secondary)', bd: 'var(--border)', fg: 'var(--text-muted)', op: 0.6 },
			current: { bg: 'var(--accent-glow)', bd: 'var(--accent)', fg: 'var(--accent-light)', op: 1 },
			future: { bg: 'var(--bg-secondary)', bd: 'var(--border)', fg: 'var(--text-muted)', op: 0.3 },
		}[state];
		return {
			fontFamily: 'var(--font-mono, monospace)',
			fontSize: '0.75rem',
			fontWeight: 600,
			padding: '0.3rem 0.5rem',
			borderRadius: '6px',
			border: `1px solid ${map.bd}`,
			background: map.bg,
			color: map.fg,
			opacity: map.op,
			transition: 'all 0.25s ease',
		} as React.CSSProperties;
	},
	grid: (mobile: boolean) => ({
		display: 'grid',
		gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
		gap: '0.5rem',
		marginBottom: '1rem',
	} as React.CSSProperties),
	expert: (active: boolean, weight: number) => ({
		padding: '0.55rem 0.6rem',
		borderRadius: '8px',
		border: `1px solid ${active ? '#10b981' : 'var(--border)'}`,
		background: active ? `rgba(16, 185, 129, ${0.08 + weight * 0.25})` : 'var(--bg-secondary)',
		transition: 'all 0.3s ease',
	} as React.CSSProperties),
	expertName: (active: boolean) => ({
		fontSize: '0.72rem',
		fontWeight: 700,
		color: active ? '#10b981' : 'var(--text-muted)',
		display: 'flex',
		justifyContent: 'space-between',
		gap: '0.3rem',
	} as React.CSSProperties),
	expertTag: {
		fontSize: '0.65rem',
		color: 'var(--text-muted)',
		marginTop: '0.1rem',
	} as React.CSSProperties,
	load: {
		display: 'flex',
		gap: '3px',
		marginTop: '0.35rem',
		flexWrap: 'wrap' as const,
		minHeight: '8px',
	} as React.CSSProperties,
	dot: {
		width: '6px',
		height: '6px',
		borderRadius: '2px',
		background: 'var(--accent)',
		opacity: 0.65,
	} as React.CSSProperties,
	foot: {
		fontSize: '0.78rem',
		color: 'var(--text-muted)',
		lineHeight: 1.55,
		minHeight: '2.2rem',
	} as React.CSSProperties,
	controls: {
		display: 'flex',
		gap: '0.5rem',
		marginTop: '0.9rem',
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

export default function MoeRouterDemo() {
	const [step, setStep] = useState(0);
	const [auto, setAuto] = useState(true);
	const mobile = useIsMobile();

	const advance = useCallback(() => {
		setStep((s) => (s >= TOKENS.length - 1 ? 0 : s + 1));
	}, []);

	useEffect(() => {
		if (!auto) return;
		const id = setInterval(advance, 1800);
		return () => clearInterval(id);
	}, [auto, advance]);

	const [, top1, top2] = TOKENS[step];
	const picks = new Map<number, number>([top1, top2]);

	// Сколько раз каждый эксперт был выбран до текущего шага включительно
	const counts = new Array(EXPERTS.length).fill(0);
	for (let i = 0; i <= step; i++) {
		counts[TOKENS[i][1][0]]++;
		counts[TOKENS[i][2][0]]++;
	}

	return (
		<div style={{ ...css.wrap, ...(mobile ? { padding: '1rem', margin: '1.25em 0' } : {}) }}>
			<div style={css.title}>🎛️ Роутер выбирает top-2 из 8 экспертов</div>
			<div style={css.desc}>
				Для каждого токена роутер считает скоры по всем экспертам и включает двух лучших. Точки под
				экспертом — сколько токенов он уже обработал. Смотри, как похожие токены липнут к одним и тем
				же экспертам.
			</div>

			<div style={css.tokens}>
				{TOKENS.map(([t], i) => (
					<span key={i} style={css.token(i === step ? 'current' : i < step ? 'past' : 'future')}>
						{t}
					</span>
				))}
			</div>

			<div style={css.grid(mobile)}>
				{EXPERTS.map((e) => {
					const w = picks.get(e.id);
					const active = w !== undefined;
					return (
						<div key={e.id} style={css.expert(active, w ?? 0)}>
							<div style={css.expertName(active)}>
								<span>E{e.id + 1}</span>
								{active && <span>{Math.round((w ?? 0) * 100)}%</span>}
							</div>
							<div style={css.expertTag}>{e.tag}</div>
							<div style={css.load}>
								{Array.from({ length: counts[e.id] }, (_, i) => (
									<span key={i} style={css.dot} />
								))}
							</div>
						</div>
					);
				})}
			</div>

			<div style={css.foot}>
				Выход слоя = {Math.round(top1[1] * 100)}% × E{top1[0] + 1} + {Math.round(top2[1] * 100)}% ×
				E{top2[0] + 1}. Остальные шесть экспертов для этого токена <strong>не считаются вообще</strong> —
				их веса даже не читаются из памяти.
			</div>

			<div style={css.controls}>
				<button style={css.btn()} onClick={() => { setStep((s) => Math.max(0, s - 1)); setAuto(false); }}>
					← Назад
				</button>
				<button style={css.btn()} onClick={() => { advance(); setAuto(false); }}>
					Вперёд →
				</button>
				<button style={css.btn(auto)} onClick={() => setAuto(!auto)}>
					{auto ? '⏸ Пауза' : '▶ Авто'}
				</button>
				<span style={css.stepLabel}>
					Токен {step + 1}/{TOKENS.length}
				</span>
			</div>
		</div>
	);
}
