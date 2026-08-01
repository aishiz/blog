import { useState } from 'react';

// Demo: self-attention без позиционной информации перестановочно-инвариантно.
// Показываем это на permutation-invariant агрегате (сумме векторов токенов):
// перемешивание порядка не меняет сумму — модель "без позиции" не видит порядок.
// А "с позицией" каждый токен помечен своим индексом, и порядок различим.
const BASE = [
	{ w: 'кот', v: 3 },
	{ w: 'ловит', v: 5 },
	{ w: 'мышь', v: 2 },
	{ w: 'ночью', v: 4 },
];

function shuffle<T>(arr: T[], seed: number): T[] {
	// детерминированная перестановка по seed — воспроизводима и не зависит от Math.random
	const a = arr.slice();
	for (let i = a.length - 1; i > 0; i--) {
		const j = (i * 7 + seed * 13 + 3) % (i + 1);
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

const css = {
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.1rem', lineHeight: 1.6 } as React.CSSProperties,
	row: { marginBottom: '1rem' } as React.CSSProperties,
	rowLabel: (color: string) => ({ fontSize: '0.78rem', fontWeight: 700, color, marginBottom: '0.4rem' } as React.CSSProperties),
	tokens: { display: 'flex', flexWrap: 'wrap' as const, gap: '0.4rem', marginBottom: '0.5rem' } as React.CSSProperties,
	token: (color: string) => ({ padding: '0.4rem 0.7rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, background: `${color}18`, border: `1px solid ${color}`, color: 'var(--text)' } as React.CSSProperties),
	tokenIdx: { fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: '0.3rem' } as React.CSSProperties,
	verdict: (ok: boolean) => ({ fontSize: '0.82rem', fontWeight: 700, color: ok ? '#ef4444' : '#22c55e' } as React.CSSProperties),
	btn: { marginTop: '0.5rem', padding: '0.45rem 1rem', borderRadius: '100px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' } as React.CSSProperties,
	note: { marginTop: '0.9rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

export default function PermutationInvariance() {
	const [seed, setSeed] = useState(0);
	const order = shuffle(BASE, seed);
	const sum = order.reduce((s, t) => s + t.v, 0); // порядко-независимый агрегат

	return (
		<div style={css.wrap}>
			<div style={css.title}>🔀 Attention без позиции не видит порядок</div>
			<div style={css.desc}>Жми «перемешать». Сверху — «без позиции»: агрегат (сумма) не меняется от порядка. Снизу — «с позицией»: каждый токен помечен индексом, порядок различим.</div>

			<div style={css.row}>
				<div style={css.rowLabel('#ef4444')}>Без позиционного кодирования</div>
				<div style={css.tokens}>
					{order.map((t, i) => (
						<span key={i} style={css.token('#ef4444')}>{t.w}</span>
					))}
				</div>
				<div style={css.verdict(true)}>Σ = {sum} — тот же результат при любом порядке (порядок потерян)</div>
			</div>

			<div style={css.row}>
				<div style={css.rowLabel('#22c55e')}>С позиционным кодированием</div>
				<div style={css.tokens}>
					{order.map((t, i) => (
						<span key={i} style={css.token('#22c55e')}>{t.w}<span style={css.tokenIdx}>#{i}</span></span>
					))}
				</div>
				<div style={css.verdict(false)}>Каждый токен знает свою позицию #i — порядок восстановим</div>
			</div>

			<button style={css.btn} onClick={() => setSeed((s) => s + 1)}>🔀 Перемешать</button>

			<div style={css.note}>Self-attention сам по себе — функция от множества токенов, не от последовательности: переставь вход, и выход переставится так же, но содержательно не изменится. Позицию нужно впрыснуть отдельно. RoPE — один из способов.</div>
		</div>
	);
}
