import { useState, useEffect, useCallback } from 'react';

// Пошаговая генерация {"name": "Гоша", "age": 42} по схеме
// {name: string (required), age: integer (required), additionalProperties: false}.
// gen — текст ДО текущего шага, pick — что модель выбирает на этом шаге.
const STEPS = [
	{
		gen: '',
		state: 'START — ждём начало объекта',
		allowed: ['{'],
		forbidden: ['Вот', '```json', '"'],
		pick: '{',
		note: 'Разрешён один токен — выбора нет вообще. Никаких «Конечно, вот ваш JSON:»',
	},
	{
		gen: '{',
		state: 'KEY — ждём ключ из схемы',
		allowed: ['"name"', '"age"'],
		forbidden: ['"color"', '}'],
		pick: '"name"',
		note: 'Ключи только из схемы. Закрыться нельзя — оба поля обязательные',
	},
	{
		gen: '{"name"',
		state: 'COLON — после ключа только двоеточие',
		allowed: [':'],
		forbidden: [',', '}'],
		pick: ':',
	},
	{
		gen: '{"name":',
		state: 'STRING — значение-строка',
		allowed: ['"…любой текст…"'],
		forbidden: ['42', 'null', '{'],
		pick: '"Гоша"',
		note: 'Внутри кавычек модель свободна — здесь работают её знания, а не грамматика',
	},
	{
		gen: '{"name": "Гоша"',
		state: 'NEXT — «age» ещё не заполнен',
		allowed: [','],
		forbidden: ['}'],
		pick: ',',
		note: '«age» обязателен — грамматика не даст закрыть объект раньше времени',
	},
	{
		gen: '{"name": "Гоша",',
		state: 'KEY — остался один ключ',
		allowed: ['"age"'],
		forbidden: ['"name"'],
		pick: '"age"',
		note: 'Повторить уже использованный ключ нельзя',
	},
	{
		gen: '{"name": "Гоша", "age"',
		state: 'COLON',
		allowed: [':'],
		forbidden: [','],
		pick: ':',
	},
	{
		gen: '{"name": "Гоша", "age":',
		state: 'INT — целое число',
		allowed: ['0–9', '-'],
		forbidden: ['"', 'null', '['],
		pick: '42',
		note: 'Схема сказала integer — кавычку даже не начать. Тот самый шаг из демки выше',
	},
	{
		gen: '{"name": "Гоша", "age": 42',
		state: 'END — все ключи заполнены',
		allowed: ['}'],
		forbidden: [',', '0–9'],
		pick: '}',
	},
	{
		gen: '{"name": "Гоша", "age": 42}',
		state: 'DONE — объект закрыт',
		allowed: ['EOS (стоп)'],
		forbidden: ['любой текст'],
		pick: '',
		note: 'После валидного JSON — только стоп-токен. «Надеюсь, помог! 😊» в конце невозможен',
	},
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
	genBox: {
		fontFamily: 'var(--font-mono, monospace)',
		fontSize: '0.85rem',
		padding: '0.8rem 1rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		marginBottom: '1rem',
		minHeight: '2.6rem',
		overflowX: 'auto' as const,
		whiteSpace: 'nowrap' as const,
	} as React.CSSProperties,
	pick: {
		color: '#10b981',
		fontWeight: 700,
		background: '#10b98122',
		borderRadius: '3px',
		padding: '0 2px',
	} as React.CSSProperties,
	state: {
		display: 'inline-block',
		fontSize: '0.75rem',
		fontWeight: 700,
		color: 'var(--accent-light)',
		background: 'var(--accent-glow)',
		border: '1px solid var(--accent)',
		borderRadius: '6px',
		padding: '0.25rem 0.6rem',
		marginBottom: '0.8rem',
	} as React.CSSProperties,
	chipsRow: {
		display: 'flex',
		gap: '0.4rem',
		flexWrap: 'wrap' as const,
		alignItems: 'center',
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	chipsLabel: {
		fontSize: '0.72rem',
		fontWeight: 700,
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.04em',
		minWidth: '6.2rem',
	} as React.CSSProperties,
	chip: (kind: 'ok' | 'no' | 'picked') => {
		const map = {
			ok: { bd: '#10b981', bg: '#10b98111', fg: '#10b981', deco: 'none' },
			picked: { bd: '#10b981', bg: '#10b981', fg: '#fff', deco: 'none' },
			no: { bd: '#ef4444', bg: '#ef444411', fg: '#ef4444', deco: 'line-through' },
		}[kind];
		return {
			fontFamily: 'var(--font-mono, monospace)',
			fontSize: '0.72rem',
			fontWeight: 600,
			padding: '0.2rem 0.5rem',
			borderRadius: '5px',
			border: `1px solid ${map.bd}`,
			background: map.bg,
			color: map.fg,
			textDecoration: map.deco as 'none' | 'line-through',
		} as React.CSSProperties;
	},
	note: {
		fontSize: '0.78rem',
		color: 'var(--text-muted)',
		lineHeight: 1.55,
		marginTop: '0.7rem',
		minHeight: '2.2rem',
	} as React.CSSProperties,
	controls: {
		display: 'flex',
		gap: '0.5rem',
		marginTop: '1rem',
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

export default function JsonFsmWalkthrough() {
	const [step, setStep] = useState(0);
	const [auto, setAuto] = useState(false);
	const mobile = useIsMobile();
	const s = STEPS[step];

	const advance = useCallback(() => {
		setStep((i) => (i >= STEPS.length - 1 ? 0 : i + 1));
	}, []);

	useEffect(() => {
		if (!auto) return;
		const id = setInterval(advance, 2200);
		return () => clearInterval(id);
	}, [auto, advance]);

	return (
		<div style={{ ...css.wrap, ...(mobile ? { padding: '1rem', margin: '1.25em 0' } : {}) }}>
			<div style={css.title}>🤖 Автомат генерирует JSON по шагам</div>
			<div style={css.desc}>
				Схема: <code>name</code> — строка, <code>age</code> — целое, оба обязательны. На каждом шаге
				автомат знает своё состояние и разрешает только легальные токены.
			</div>

			<div style={css.genBox}>
				{s.gen}
				{s.pick && <span style={css.pick}>{s.pick}</span>}
				<span style={{ opacity: 0.5 }}>▊</span>
			</div>

			<div style={css.state}>{s.state}</div>

			<div style={css.chipsRow}>
				<span style={css.chipsLabel}>✅ Разрешено</span>
				{s.allowed.map((t, i) => (
					<span key={i} style={css.chip(s.pick && (t === s.pick || s.allowed.length === 1) ? 'picked' : 'ok')}>
						{t}
					</span>
				))}
			</div>
			<div style={css.chipsRow}>
				<span style={css.chipsLabel}>⛔ Запрещено</span>
				{s.forbidden.map((t, i) => (
					<span key={i} style={css.chip('no')}>
						{t}
					</span>
				))}
			</div>

			<div style={css.note}>{s.note ?? ''}</div>

			<div style={css.controls}>
				<button style={css.btn()} onClick={() => { setStep((i) => Math.max(0, i - 1)); setAuto(false); }}>
					← Назад
				</button>
				<button style={css.btn()} onClick={() => { advance(); setAuto(false); }}>
					Вперёд →
				</button>
				<button style={css.btn(auto)} onClick={() => setAuto(!auto)}>
					{auto ? '⏸ Пауза' : '▶ Авто'}
				</button>
				<span style={css.stepLabel}>
					Шаг {step + 1}/{STEPS.length}
				</span>
			</div>
		</div>
	);
}
