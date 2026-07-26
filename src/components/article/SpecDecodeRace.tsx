import { useState, useEffect, useCallback } from 'react';

// Целевая фраза, которую обе дорожки должны сгенерировать
const TARGET = ['Кот', 'сидел', 'на', 'окне', 'и', 'смотрел', 'на', 'дождь'];

// Раунды спекулятивного декодинга: черновик предлагает 4 токена,
// verified — сколько из них подтвердила большая модель (остальные заменяются).
// accepted.length < 4 значит был отказ — following токен берётся из проверки, не из драфта.
const SPEC_ROUNDS: { draft: string[]; accepted: number }[] = [
	{ draft: ['Кот', 'сидел', 'на', 'диване'], accepted: 3 },
	{ draft: ['окне', 'и', 'думал', 'о'], accepted: 2 },
	{ draft: ['смотрел', 'на', 'дождь', 'молча'], accepted: 3 },
];

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
		marginBottom: '1.25rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	lane: {
		marginBottom: '1.1rem',
	} as React.CSSProperties,
	laneHead: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'baseline',
		marginBottom: '0.45rem',
	} as React.CSSProperties,
	laneTitle: (color: string) => ({
		fontSize: '0.8rem',
		fontWeight: 700,
		color,
	} as React.CSSProperties),
	laneStat: {
		fontSize: '0.72rem',
		fontWeight: 600,
		color: 'var(--text-muted)',
		fontVariantNumeric: 'tabular-nums',
	} as React.CSSProperties,
	track: {
		display: 'flex',
		gap: '4px',
		flexWrap: 'wrap' as const,
		minHeight: '2.3rem',
	} as React.CSSProperties,
	cell: (state: 'empty' | 'done' | 'accepted' | 'rejected' | 'bonus') => {
		const map = {
			empty: { bg: 'var(--bg-secondary)', bd: 'var(--border)', fg: 'var(--text-muted)', op: 0.3 },
			done: { bg: 'var(--accent-glow)', bd: 'var(--accent)', fg: 'var(--accent-light)', op: 1 },
			accepted: { bg: '#10b98122', bd: '#10b981', fg: '#10b981', op: 1 },
			rejected: { bg: '#ef444422', bd: '#ef4444', fg: '#ef4444', op: 1, deco: 'line-through' },
			bonus: { bg: '#3b82f622', bd: '#3b82f6', fg: '#3b82f6', op: 1 },
		}[state];
		return {
			minWidth: '3.4rem',
			padding: '0.4rem 0.5rem',
			borderRadius: '6px',
			border: `1px solid ${map.bd}`,
			background: map.bg,
			color: map.fg,
			opacity: map.op,
			fontSize: '0.72rem',
			fontWeight: 600,
			textAlign: 'center' as const,
			transition: 'all 0.3s ease',
			textDecoration: (map as any).deco ?? 'none',
		} as React.CSSProperties;
	},
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
	legend: {
		display: 'flex',
		gap: '1rem',
		flexWrap: 'wrap' as const,
		fontSize: '0.72rem',
		color: 'var(--text-muted)',
		marginTop: '0.9rem',
	} as React.CSSProperties,
	legendItem: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.35rem',
	} as React.CSSProperties,
	dot: (color: string) => ({
		width: '9px',
		height: '9px',
		borderRadius: '3px',
		background: color,
		flexShrink: 0,
	} as React.CSSProperties),
	controls: {
		display: 'flex',
		gap: '0.5rem',
		marginTop: '1.1rem',
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

// Строим плоский список токенов спек-дорожки со статусом на конкретный шаг раунда.
// phase: 0 = только черновик (серый), 1 = верификация показана (зелёный/красный/бонус)
function buildSpecTokens(roundIdx: number, phase: 0 | 1) {
	const tokens: { text: string; state: 'empty' | 'done' | 'accepted' | 'rejected' | 'bonus' }[] = [];
	for (let r = 0; r < roundIdx; r++) {
		const { draft, accepted } = SPEC_ROUNDS[r];
		draft.forEach((t, i) => {
			if (i < accepted) tokens.push({ text: TARGET[tokens.length] ?? t, state: 'accepted' });
			else if (i === accepted) tokens.push({ text: TARGET[tokens.length] ?? t, state: 'bonus' });
		});
	}
	if (roundIdx < SPEC_ROUNDS.length) {
		const { draft, accepted } = SPEC_ROUNDS[roundIdx];
		draft.forEach((t, i) => {
			if (phase === 0) {
				tokens.push({ text: t, state: 'done' });
			} else {
				if (i < accepted) tokens.push({ text: TARGET[tokens.length] ?? t, state: 'accepted' });
				else if (i === accepted) tokens.push({ text: TARGET[tokens.length] ?? t, state: 'bonus' });
				else tokens.push({ text: t, state: 'rejected' });
			}
		});
	}
	return tokens;
}

export default function SpecDecodeRace() {
	// step: индекс "тика" анимации. Каждый раунд спек-дорожки = 2 тика (черновик, потом верификация).
	const [step, setStep] = useState(0);
	const [auto, setAuto] = useState(true);
	const mobile = useIsMobile();

	const maxStep = SPEC_ROUNDS.length * 2;

	const advance = useCallback(() => {
		setStep((s) => (s >= maxStep ? 0 : s + 1));
	}, [maxStep]);

	useEffect(() => {
		if (!auto) return;
		const id = setInterval(advance, 1600);
		return () => clearInterval(id);
	}, [auto, advance]);

	// Обычная дорожка: 1 токен за шаг спек-цикла (t = step, но растягиваем на весь maxStep)
	const normalCount = Math.min(TARGET.length, Math.ceil((step / maxStep) * TARGET.length) + (step > 0 ? 0 : 0));
	const normalTokensShown = Math.min(TARGET.length, Math.round((step / maxStep) * TARGET.length));

	const roundIdx = Math.min(SPEC_ROUNDS.length - 1, Math.floor(step / 2));
	const phase: 0 | 1 = (step % 2 === 0 && step < maxStep) ? 0 : 1;
	const specTokens = step === 0 ? [] : buildSpecTokens(roundIdx, phase);
	const specAcceptedCount = specTokens.filter((t) => t.state === 'accepted' || t.state === 'bonus').length;

	const normalSteps = step; // 1 forward-pass = 1 шаг на обычной дорожке в тех же "тиках"
	const specForwardPasses = Math.min(SPEC_ROUNDS.length, Math.ceil(step / 2));

	return (
		<div style={{ ...css.wrap, ...(mobile ? { padding: '1rem', margin: '1.25em 0' } : {}) }}>
			<div style={css.title}>🏎️ Обычный декод vs спекулятивный</div>
			<div style={css.desc}>
				Цель — сгенерировать «Кот сидел на окне и смотрел на дождь». Серый — черновик мелкой модели
				(ещё не проверен), зелёный — подтверждено большой моделью, синий — бонусный токен «в
				подарок», красный — отклонено и переписано.
			</div>

			<div style={css.lane}>
				<div style={css.laneHead}>
					<span style={css.laneTitle('#f59e0b')}>🐢 Обычный декод — 1 токен за проход GPU</span>
					<span style={css.laneStat}>{normalSteps} проходов GPU</span>
				</div>
				<div style={css.track}>
					{TARGET.map((t, i) => (
						<div key={i} style={css.cell(i < normalTokensShown ? 'accepted' : 'empty')}>
							{i < normalTokensShown ? t : '···'}
						</div>
					))}
				</div>
			</div>

			<div style={css.lane}>
				<div style={css.laneHead}>
					<span style={css.laneTitle('#10b981')}>🚀 Спекулятивный — пачками по 4</span>
					<span style={css.laneStat}>{specForwardPasses} проходов GPU</span>
				</div>
				<div style={css.track}>
					{specTokens.map((t, i) => (
						<div key={i} style={css.cell(t.state)}>
							{t.text}
						</div>
					))}
					{specTokens.length === 0 && <div style={css.cell('empty')}>···</div>}
				</div>
			</div>

			<div style={css.verdict}>
				<div style={css.card('#f59e0b')}>
					<div style={css.cardVal('#f59e0b')}>{normalSteps}</div>
					<div style={css.cardLabel}>Проходов GPU — обычный</div>
				</div>
				<div style={css.card('#10b981')}>
					<div style={css.cardVal('#10b981')}>{specForwardPasses}</div>
					<div style={css.cardLabel}>Проходов GPU — спекулятивный</div>
				</div>
			</div>

			<div style={css.legend}>
				<span style={css.legendItem}><span style={css.dot('var(--accent)')} />черновик</span>
				<span style={css.legendItem}><span style={css.dot('#10b981')} />принято</span>
				<span style={css.legendItem}><span style={css.dot('#3b82f6')} />бонус</span>
				<span style={css.legendItem}><span style={css.dot('#ef4444')} />отклонено</span>
			</div>

			<div style={css.controls}>
				<button style={css.btn()} onClick={() => { setStep((s) => Math.max(0, s - 1)); setAuto(false); }}>← Назад</button>
				<button style={css.btn()} onClick={() => { advance(); setAuto(false); }}>Вперёд →</button>
				<button style={css.btn(auto)} onClick={() => setAuto(!auto)}>{auto ? '⏸ Пауза' : '▶ Авто'}</button>
				<span style={css.stepLabel}>Шаг {step}/{maxStep}</span>
			</div>
		</div>
	);
}
