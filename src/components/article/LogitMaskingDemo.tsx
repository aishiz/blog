import { useState, useEffect } from 'react';

// Шаг генерации: модель уже написала {"name": "Гоша", "age": и выбирает следующий токен.
// Схема требует integer — с constraint все нечисловые токены получают logit = −∞.
const TOKENS = [
	{ t: '"', hint: 'начало строки', p: 0.36, ok: false },
	{ t: '25', hint: '', p: 0.22, ok: true },
	{ t: 'null', hint: '', p: 0.12, ok: false },
	{ t: ' двадцать', hint: 'словом', p: 0.09, ok: false },
	{ t: '2', hint: '', p: 0.08, ok: true },
	{ t: '[', hint: 'массив', p: 0.05, ok: false },
	{ t: '42', hint: '', p: 0.04, ok: true },
	{ t: ' примерно', hint: '', p: 0.04, ok: false },
];

const VALID_SUM = TOKENS.filter((x) => x.ok).reduce((s, x) => s + x.p, 0);

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
		marginBottom: '1rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	context: {
		fontFamily: 'var(--font-mono, monospace)',
		fontSize: '0.82rem',
		padding: '0.7rem 0.9rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		marginBottom: '0.6rem',
		overflowX: 'auto' as const,
		whiteSpace: 'nowrap' as const,
	} as React.CSSProperties,
	schema: {
		fontFamily: 'var(--font-mono, monospace)',
		fontSize: '0.72rem',
		color: 'var(--text-muted)',
		marginBottom: '1.1rem',
	} as React.CSSProperties,
	toggles: {
		display: 'flex',
		gap: '0.5rem',
		marginBottom: '1.1rem',
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
		gridTemplateColumns: '7.5rem 1fr 4.5rem',
		gap: '0.6rem',
		alignItems: 'center',
		marginBottom: '0.4rem',
	} as React.CSSProperties,
	rowMobile: {
		gridTemplateColumns: '5.5rem 1fr 4rem',
	} as React.CSSProperties,
	tok: (masked: boolean) => ({
		fontFamily: 'var(--font-mono, monospace)',
		fontSize: '0.75rem',
		fontWeight: 600,
		color: masked ? 'var(--text-muted)' : 'var(--text)',
		textDecoration: masked ? 'line-through' : 'none',
		opacity: masked ? 0.45 : 1,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap' as const,
	} as React.CSSProperties),
	track: {
		height: '1.1rem',
		borderRadius: '4px',
		background: 'var(--bg-secondary)',
		overflow: 'hidden',
	} as React.CSSProperties,
	fill: (w: number, color: string) => ({
		width: `${w}%`,
		height: '100%',
		borderRadius: '4px',
		background: color,
		transition: 'width 0.45s ease, background 0.3s ease',
	} as React.CSSProperties),
	pct: (masked: boolean, color: string) => ({
		fontSize: '0.72rem',
		fontWeight: 700,
		fontVariantNumeric: 'tabular-nums',
		textAlign: 'right' as const,
		color: masked ? 'var(--text-muted)' : color,
		opacity: masked ? 0.45 : 1,
	} as React.CSSProperties),
	foot: {
		fontSize: '0.78rem',
		color: 'var(--text-muted)',
		marginTop: '0.9rem',
		lineHeight: 1.55,
	} as React.CSSProperties,
};

export default function LogitMaskingDemo() {
	const [on, setOn] = useState(false);
	const mobile = useIsMobile();

	return (
		<div style={{ ...css.wrap, ...(mobile ? { padding: '1rem', margin: '1.25em 0' } : {}) }}>
			<div style={css.title}>🎛️ Logit masking на одном шаге генерации</div>
			<div style={css.desc}>
				Модель дописала объект до значения поля <code>age</code> и выбирает следующий токен. Включи
				constraint и смотри, что происходит с распределением.
			</div>

			<div style={css.context}>
				{'{'}"name": "Гоша", "age": <span style={{ opacity: 0.6 }}>▊</span>
			</div>
			<div style={css.schema}>схема: "age": {'{'} "type": "integer" {'}'}</div>

			<div style={css.toggles}>
				<button style={css.btn(!on, '#f59e0b')} onClick={() => setOn(false)}>
					🔓 Без ограничений
				</button>
				<button style={css.btn(on, '#10b981')} onClick={() => setOn(true)}>
					🔒 Constraint включён
				</button>
			</div>

			{TOKENS.map((x, i) => {
				const masked = on && !x.ok;
				const p = on ? (x.ok ? x.p / VALID_SUM : 0) : x.p;
				const color = on && x.ok ? '#10b981' : masked ? 'var(--border)' : 'var(--accent)';
				return (
					<div key={i} style={{ ...css.row, ...(mobile ? css.rowMobile : {}) }}>
						<span style={css.tok(masked)}>
							{x.t}
							{x.hint && !mobile ? ` · ${x.hint}` : ''}
						</span>
						<div style={css.track}>
							<div style={css.fill(p * 100, color)} />
						</div>
						<span style={css.pct(masked, on && x.ok ? '#10b981' : 'var(--text)')}>
							{masked ? '−∞' : `${(p * 100).toFixed(1)}%`}
						</span>
					</div>
				);
			})}

			<div style={css.foot}>
				{on ? (
					<>
						Невалидным токенам выставили logit = −∞, их вероятность стала нулевой. Оставшиеся{' '}
						<strong>ренормализовались</strong> — сумма снова 100%, и любой выбор модели даст валидное
						целое число.
					</>
				) : (
					<>
						Самый вероятный токен — <code>"</code>: модель хочет начать строку «"двадцать пять"». Парсер
						такого не переживёт, но модели всё равно — она просто генератор вероятностей.
					</>
				)}
			</div>
		</div>
	);
}
