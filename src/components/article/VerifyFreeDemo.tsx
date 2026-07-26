import { useState, useEffect } from 'react';

// Декод — memory-bound: время шага определяется чтением весов из VRAM, а не арифметикой.
// Прочитать веса один раз и посчитать 1 токен или 5 токенов параллельно — почти одно и то же время.
const MODES = {
	normal: {
		label: '1 токен за проход',
		reads: 1,
		tokensOut: 1,
		color: '#f59e0b',
	},
	batch: {
		label: 'Проверка черновика (5 токенов)',
		reads: 1,
		tokensOut: 5,
		color: '#10b981',
	},
} as const;

type Mode = keyof typeof MODES;

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
		marginBottom: '1.2rem',
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
		marginBottom: '1rem',
	} as React.CSSProperties,
	rowLabel: {
		fontSize: '0.75rem',
		fontWeight: 700,
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.04em',
		marginBottom: '0.4rem',
	} as React.CSSProperties,
	track: {
		height: '1.6rem',
		borderRadius: '5px',
		background: 'var(--bg-secondary)',
		overflow: 'hidden',
		display: 'flex',
		alignItems: 'center',
	} as React.CSSProperties,
	fill: (w: number, color: string) => ({
		width: `${w}%`,
		height: '100%',
		borderRadius: '5px',
		background: color,
		transition: 'width 0.5s ease, background 0.3s ease',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'flex-end',
		paddingRight: '0.5rem',
	} as React.CSSProperties),
	fillLabel: {
		fontSize: '0.72rem',
		fontWeight: 700,
		color: '#fff',
		whiteSpace: 'nowrap' as const,
	} as React.CSSProperties,
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
	foot: {
		fontSize: '0.78rem',
		color: 'var(--text-muted)',
		marginTop: '1rem',
		lineHeight: 1.55,
	} as React.CSSProperties,
};

export default function VerifyFreeDemo() {
	const [mode, setMode] = useState<Mode>('normal');
	const mobile = useIsMobile();
	const m = MODES[mode];

	return (
		<div style={{ ...css.wrap, ...(mobile ? { padding: '1rem', margin: '1.25em 0' } : {}) }}>
			<div style={css.title}>💾 Почему проверка почти бесплатна</div>
			<div style={css.desc}>
				Декод — <strong>memory-bound</strong>: время шага определяется чтением весов из VRAM, а не
				арифметикой (подробно — в статье про <a href="/blog/kv-cache/">KV-кэш</a>). GPU читает веса
				один раз за проход независимо от того, для скольких токенов считает.
			</div>

			<div style={css.toggles}>
				<button style={css.btn(mode === 'normal', MODES.normal.color)} onClick={() => setMode('normal')}>
					🐢 Сгенерить 1 токен
				</button>
				<button style={css.btn(mode === 'batch', MODES.batch.color)} onClick={() => setMode('batch')}>
					🚀 Проверить 5 токенов
				</button>
			</div>

			<div style={css.row}>
				<div style={css.rowLabel}>Чтение весов из VRAM (тяжёлая часть)</div>
				<div style={css.track}>
					<div style={css.fill(100, m.color)}>
						<span style={css.fillLabel}>{m.reads} проход по весам</span>
					</div>
				</div>
			</div>

			<div style={css.row}>
				<div style={css.rowLabel}>Токенов получено за этот проход</div>
				<div style={css.track}>
					<div style={css.fill((m.tokensOut / 5) * 100, m.color)}>
						<span style={css.fillLabel}>{m.tokensOut} {m.tokensOut === 1 ? 'токен' : 'токенов'}</span>
					</div>
				</div>
			</div>

			<div style={css.verdict}>
				<div style={css.card(m.color)}>
					<div style={css.cardVal(m.color)}>{m.tokensOut}×</div>
					<div style={css.cardLabel}>Токенов на 1 чтение весов</div>
				</div>
				<div style={css.card(m.color)}>
					<div style={css.cardVal(m.color)}>~{mode === 'normal' ? '1.0' : '1.1'}×</div>
					<div style={css.cardLabel}>Время прохода относительно обычного</div>
				</div>
			</div>

			<div style={css.foot}>
				{mode === 'batch' ? (
					<>Проверка черновика из 5 токенов — это один forward pass с последовательностью длины 5. GPU читает те же веса тот же один раз, просто применяет их к пяти позициям параллельно. Заплатили как за 1 токен, получили черновой ответ сразу для 5.</>
				) : (
					<>Так работает обычный автогрессивный декод: один проход весов — один токен на выходе. Вся пропускная способность VRAM потрачена на то, чтобы вычислить единственное число.</>
				)}
			</div>
		</div>
	);
}
