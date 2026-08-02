import { useState } from 'react';

// Мини-пример считается вживую во float32 (Math.fround) — воспроизводится прямо в браузере.
const A = Math.fround(-992.28125);
const B = Math.fround(-0.0025840395);
const C = Math.fround(8535.3);

const f32 = (x: number) => Math.fround(x);
const leftFirst = f32(f32(A + B) + C);   // (a + b) + c
const rightFirst = f32(A + f32(B + C));  // a + (b + c)

// Числа ниже — из реального прогона на векторах размерности 8192 (float32 против float64).
const DOT = {
	trueA: 80.36561892, trueB: 80.36568176,
	seqA: 80.36564, seqB: 80.3654,
};

const css = {
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.1rem', lineHeight: 1.6 } as React.CSSProperties,
	sub: { fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.04em', color: 'var(--text-muted)', margin: '1.1rem 0 0.5rem' } as React.CSSProperties,
	code: { display: 'block', padding: '0.7rem 0.85rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: '0.8rem', lineHeight: 1.7, color: 'var(--text-secondary)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', whiteSpace: 'pre-wrap' as const, wordBreak: 'break-word' as const } as React.CSSProperties,
	hl: { color: 'var(--accent-yellow)', fontWeight: 800 } as React.CSSProperties,
	btns: { display: 'flex', gap: '0.5rem', marginTop: '0.8rem', flexWrap: 'wrap' as const } as React.CSSProperties,
	btn: (on: boolean) => ({ padding: '0.4rem 0.9rem', borderRadius: '100px', border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`, background: on ? 'var(--accent-glow)' : 'var(--bg-secondary)', color: on ? 'var(--accent-light)' : 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' } as React.CSSProperties),
	table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.78rem', fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties,
	th: { textAlign: 'left' as const, padding: '0.4rem 0.5rem', color: 'var(--text-muted)', fontWeight: 700, borderBottom: '1px solid var(--border)' } as React.CSSProperties,
	td: { padding: '0.4rem 0.5rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' } as React.CSSProperties,
	win: (ok: boolean) => ({ fontWeight: 800, color: ok ? '#22c55e' : '#ef4444' } as React.CSSProperties),
	note: { marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

export default function BatchNondeterminism() {
	const [order, setOrder] = useState<'left' | 'right'>('left');
	const sum = order === 'left' ? leftFirst : rightFirst;

	return (
		<div style={css.wrap}>
			<div style={css.title}>💥 Один и тот же вход, разный ответ</div>
			<div style={css.desc}>
				Сложение float неассоциативно: переставь скобки — получишь другое число. Ниже это считается прямо
				в твоём браузере во float32.
			</div>

			<div style={css.sub}>переставь скобки</div>
			<div style={css.btns}>
				<button style={css.btn(order === 'left')} onClick={() => setOrder('left')}>(a + b) + c</button>
				<button style={css.btn(order === 'right')} onClick={() => setOrder('right')}>a + (b + c)</button>
			</div>
			<code style={{ ...css.code, marginTop: '0.6rem' }}>
				a = {A}
				{'\n'}b = {B}
				{'\n'}c = {C}
				{'\n'}
				{'\n'}{order === 'left' ? '(a + b) + c' : 'a + (b + c)'} = <span style={css.hl}>{sum}</span>
				{'\n'}разница между порядками: <span style={css.hl}>{Math.abs(leftFirst - rightFirst)}</span>
			</code>

			<div style={css.sub}>а теперь то же самое на логитах</div>
			<table style={css.table}>
				<thead>
					<tr><th style={css.th}>как считали</th><th style={css.th}>токен «a»</th><th style={css.th}>токен «b»</th><th style={css.th}>argmax</th></tr>
				</thead>
				<tbody>
					<tr>
						<td style={css.td}>float64 (эталон)</td>
						<td style={css.td}>{DOT.trueA}</td>
						<td style={css.td}>{DOT.trueB}</td>
						<td style={css.td}><span style={css.win(true)}>b</span></td>
					</tr>
					<tr>
						<td style={css.td}>float32, последовательно</td>
						<td style={css.td}>{DOT.seqA}</td>
						<td style={css.td}>{DOT.seqB}</td>
						<td style={css.td}><span style={css.win(false)}>a</span></td>
					</tr>
					<tr>
						<td style={css.td}>float32, попарно / чанками</td>
						<td style={css.td} colSpan={2}>совпало с эталоном</td>
						<td style={css.td}><span style={css.win(true)}>b</span></td>
					</tr>
				</tbody>
			</table>

			<div style={css.note}>
				Скалярные произведения размерности 8192, истинный зазор между кандидатами — около 0.00006. Порядок
				суммирования изменился — и argmax перевернулся. Числа в таблице получены отдельным прогоном на Python
				(не в браузере). <strong>Но сам по себе float — только нижний слой.</strong> Чтобы недетерминизм стал
				наблюдаемым, порядок редукции должен меняться от запроса к запросу — а он меняется вместе с размером
				батча. Об этом — в тексте под компонентом.
			</div>
		</div>
	);
}
