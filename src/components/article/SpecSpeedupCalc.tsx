import { useState, useEffect, useMemo } from 'react';

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
		marginBottom: '1.3rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	sliderRow: {
		marginBottom: '1.1rem',
	} as React.CSSProperties,
	sliderHead: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'baseline',
		marginBottom: '0.4rem',
	} as React.CSSProperties,
	sliderLabel: {
		fontSize: '0.82rem',
		fontWeight: 600,
		color: 'var(--text)',
	} as React.CSSProperties,
	sliderVal: {
		fontSize: '0.82rem',
		fontWeight: 700,
		color: 'var(--accent-light)',
		fontVariantNumeric: 'tabular-nums',
	} as React.CSSProperties,
	slider: {
		width: '100%',
		accentColor: 'var(--accent)',
		cursor: 'pointer',
	} as React.CSSProperties,
	sliderHint: {
		fontSize: '0.7rem',
		color: 'var(--text-muted)',
		marginTop: '0.25rem',
	} as React.CSSProperties,
	verdict: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: '0.75rem',
		marginTop: '1.3rem',
	} as React.CSSProperties,
	card: (color: string) => ({
		padding: '1rem 0.9rem',
		borderRadius: '8px',
		border: `1px solid ${color}55`,
		background: `${color}11`,
		textAlign: 'center' as const,
	} as React.CSSProperties),
	cardVal: (color: string) => ({
		fontSize: '2rem',
		fontWeight: 900,
		color,
		fontVariantNumeric: 'tabular-nums',
		lineHeight: 1,
	} as React.CSSProperties),
	cardLabel: {
		fontSize: '0.7rem',
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.04em',
		fontWeight: 600,
		marginTop: '0.4rem',
	} as React.CSSProperties,
	foot: {
		fontSize: '0.78rem',
		color: 'var(--text-muted)',
		marginTop: '1rem',
		lineHeight: 1.55,
	} as React.CSSProperties,
};

export default function SpecSpeedupCalc() {
	const [alpha, setAlpha] = useState(0.75); // acceptance rate
	const [k, setK] = useState(4); // длина черновика
	const [draftCost, setDraftCost] = useState(0.1); // цена драфт-модели относительно большой (доля времени 1 шага)
	const mobile = useIsMobile();

	// Классическая формула спекулятивного декодинга (Leviathan et al., 2023):
	// ожидаемое число принятых токенов за раунд = (1 - α^(k+1)) / (1 - α)
	// стоимость раунда ≈ k * draftCost + 1 (k шагов черновика + 1 проверка большой моделью)
	const { expectedTokens, speedup } = useMemo(() => {
		const tokens = alpha >= 0.999
			? k + 1
			: (1 - Math.pow(alpha, k + 1)) / (1 - alpha);
		const roundCost = k * draftCost + 1;
		const baselineCost = tokens; // обычный декод: 1 проход = 1 токен
		const sp = baselineCost / roundCost;
		return { expectedTokens: tokens, speedup: sp };
	}, [alpha, k, draftCost]);

	const verdictColor = speedup >= 2 ? '#10b981' : speedup >= 1.3 ? '#f59e0b' : '#ef4444';

	return (
		<div style={{ ...css.wrap, ...(mobile ? { padding: '1rem', margin: '1.25em 0' } : {}) }}>
			<div style={css.title}>🧮 Калькулятор ускорения</div>
			<div style={css.desc}>
				Три параметра решают всё: насколько черновик похож на оригинал, сколько токенов угадывать
				за раз, и насколько драфт-модель дешевле целевой.
			</div>

			<div style={css.sliderRow}>
				<div style={css.sliderHead}>
					<span style={css.sliderLabel}>Acceptance rate (α)</span>
					<span style={css.sliderVal}>{Math.round(alpha * 100)}%</span>
				</div>
				<input
					aria-label="Acceptance rate"
					type="range" min={0.3} max={0.98} step={0.01} value={alpha}
					onChange={(e) => setAlpha(parseFloat(e.target.value))}
					style={css.slider}
				/>
				<div style={css.sliderHint}>Как часто большая модель соглашается с черновиком — зависит от сложности текста и температуры</div>
			</div>

			<div style={css.sliderRow}>
				<div style={css.sliderHead}>
					<span style={css.sliderLabel}>Длина черновика (k)</span>
					<span style={css.sliderVal}>{k} токенов</span>
				</div>
				<input
					aria-label="Длина черновика"
					type="range" min={1} max={10} step={1} value={k}
					onChange={(e) => setK(parseInt(e.target.value))}
					style={css.slider}
				/>
				<div style={css.sliderHint}>Сколько токенов вперёд угадывает черновая модель за один раунд</div>
			</div>

			<div style={css.sliderRow}>
				<div style={css.sliderHead}>
					<span style={css.sliderLabel}>Цена черновика</span>
					<span style={css.sliderVal}>{Math.round(draftCost * 100)}% от большой модели</span>
				</div>
				<input
					aria-label="Цена черновика"
					type="range" min={0.02} max={0.6} step={0.01} value={draftCost}
					onChange={(e) => setDraftCost(parseFloat(e.target.value))}
					style={css.slider}
				/>
				<div style={css.sliderHint}>Насколько черновая модель легче целевой — EAGLE почти бесплатен, отдельная 7B-модель дороже</div>
			</div>

			<div style={css.verdict}>
				<div style={css.card(verdictColor)}>
					<div style={css.cardVal(verdictColor)}>×{speedup.toFixed(1)}</div>
					<div style={css.cardLabel}>Ожидаемое ускорение</div>
				</div>
				<div style={css.card('var(--accent)')}>
					<div style={css.cardVal('var(--accent-light)')}>{expectedTokens.toFixed(1)}</div>
					<div style={css.cardLabel}>Токенов за раунд</div>
				</div>
			</div>

			<div style={css.foot}>
				{speedup >= 2
					? 'Sweet spot: высокий acceptance rate и дешёвый черновик — почти вся стоимость раунда уходит на одну проверку большой моделью.'
					: speedup >= 1.3
					? 'Средний выигрыш. Либо черновик слишком часто ошибается, либо сам стоит заметную долю от большой модели.'
					: 'Почти не помогает или даже вредит: слишком длинный черновик при низком α сжигает бюджет на отклонённые токены.'}
			</div>
		</div>
	);
}
