import { useState, useEffect } from 'react';

const REVIEW = '«Наушники огонь, бас качает 🔥 Брал на распродаже, не жалею»';

const VARIANTS = {
	good: {
		label: '😌 Нормальная схема',
		color: '#10b981',
		schema: `{
  "product":   { "type": "string" },
  "price":     { "type": ["number", "null"] },
  "sentiment": { "enum": ["positive",
    "negative", "neutral", "mixed"] }
}`,
		result: `{
  "product": "наушники",
  "price": null,
  "sentiment": "positive"
}`,
		notes: [
			{ icon: '✅', text: 'Цены в отзыве нет — null разрешён, модель честно его ставит' },
			{ icon: '✅', text: 'Enum покрывает реальные случаи, «огонь 🔥» уверенно ложится в positive' },
		],
	},
	bad: {
		label: '🫠 Схема-душегубка',
		color: '#f59e0b',
		schema: `{
  "product":   { "type": "string",
                 "maxLength": 6 },
  "price":     { "type": "number" },
  "sentiment": { "enum": ["ok", "bad"] }
}`,
		result: `{
  "product": "наушни",
  "price": 2990,
  "sentiment": "ok"
}`,
		notes: [
			{ icon: '⚠️', text: 'maxLength: 6 — грамматика обрезала слово посреди буквы, и это валидный JSON' },
			{ icon: '⚠️', text: 'null запрещён, а число обязано быть — модель выдумала цену из воздуха' },
			{ icon: '⚠️', text: '«огонь 🔥» не описывается ни «ok», ни «bad» — оттенок потерян навсегда' },
		],
	},
} as const;

type Variant = keyof typeof VARIANTS;

function useIsMobile(breakpoint = 640) {
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
	review: {
		fontSize: '0.88rem',
		fontStyle: 'italic',
		padding: '0.7rem 1rem',
		borderLeft: '3px solid var(--accent)',
		background: 'var(--bg-secondary)',
		borderRadius: '0 8px 8px 0',
		marginBottom: '1.1rem',
		color: 'var(--text-secondary)',
	} as React.CSSProperties,
	tabs: {
		display: 'flex',
		gap: '0.5rem',
		marginBottom: '1.1rem',
		flexWrap: 'wrap' as const,
	} as React.CSSProperties,
	tab: (active: boolean, color: string) => ({
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
	grid: (mobile: boolean) => ({
		display: 'grid',
		gridTemplateColumns: mobile ? '1fr' : '1fr 1fr',
		gap: '0.75rem',
		marginBottom: '0.9rem',
	} as React.CSSProperties),
	paneLabel: {
		fontSize: '0.68rem',
		fontWeight: 700,
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.04em',
		marginBottom: '0.35rem',
	} as React.CSSProperties,
	pre: (color: string) => ({
		fontFamily: 'var(--font-mono, monospace)',
		fontSize: '0.72rem',
		lineHeight: 1.55,
		padding: '0.7rem 0.85rem',
		borderRadius: '8px',
		border: `1px solid ${color}44`,
		background: 'var(--bg-secondary)',
		overflowX: 'auto' as const,
		margin: 0,
		whiteSpace: 'pre' as const,
	} as React.CSSProperties),
	note: {
		display: 'flex',
		gap: '0.5rem',
		fontSize: '0.8rem',
		color: 'var(--text-secondary)',
		lineHeight: 1.55,
		marginBottom: '0.35rem',
	} as React.CSSProperties,
};

export default function ConstraintQualityDemo() {
	const [v, setV] = useState<Variant>('good');
	const mobile = useIsMobile();
	const cur = VARIANTS[v];

	return (
		<div style={{ ...css.wrap, ...(mobile ? { padding: '1rem', margin: '1.25em 0' } : {}) }}>
			<div style={css.title}>🧪 Одна модель, один отзыв, две схемы</div>
			<div style={css.desc}>
				Задача: извлечь из отзыва товар, цену и тональность. Constraint гарантирует валидность —
				но не спасает от плохой схемы.
			</div>

			<div style={css.review}>{REVIEW}</div>

			<div style={css.tabs}>
				{(Object.keys(VARIANTS) as Variant[]).map((k) => (
					<button key={k} style={css.tab(v === k, VARIANTS[k].color)} onClick={() => setV(k)}>
						{VARIANTS[k].label}
					</button>
				))}
			</div>

			<div style={css.grid(mobile)}>
				<div>
					<div style={css.paneLabel}>Схема</div>
					<pre style={css.pre(cur.color)}>{cur.schema}</pre>
				</div>
				<div>
					<div style={css.paneLabel}>Что выдала модель</div>
					<pre style={css.pre(cur.color)}>{cur.result}</pre>
				</div>
			</div>

			{cur.notes.map((n, i) => (
				<div key={i} style={css.note}>
					<span>{n.icon}</span>
					<span>{n.text}</span>
				</div>
			))}
		</div>
	);
}
