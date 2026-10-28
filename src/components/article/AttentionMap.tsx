import { useEffect, useState } from 'react';

// Настоящие веса attention Qwen3-0.6B (revision c1899de2, eager attention, float32) на одной фразе.
// Три головы выбраны автоматически: coref — максимум «он»→«кот» за вычетом среднего веса на «кот» от остальных
// токенов; prev — максимум среднего веса на предыдущий токен; sink — максимум среднего веса на первый токен.
// Строка матрицы — «кто смотрит», столбец — «на кого». Над диагональю пусто: будущее закрыто маской.
type Head = { label: string; layer: number; head: number; note: string; m: number[][] };

const TOKENS: string[] = ["В", "ч", "ера", " к", "от", " с", "ел", " на", " к", "ов", "ёр", ",", " потому", " что", " он", " у", "стал"];

const HEADS: Record<'coref' | 'prev' | 'sink', Head> = {
	coref: {
		label: '«он» → «кот»',
		layer: 7,
		head: 10,
		note: 'На «кот» здесь смотрят «он» (кто устал?) и «сел» (кто сел?), а «ковёр» и «потому что» — почти нет. Похоже, голова связывает слова с тем, к кому они относятся. Но это один пример, а не доказательство.',
		m: [
			[1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.819, 0.181, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.64, 0.048, 0.312, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.716, 0.022, 0.129, 0.133, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.618, 0.023, 0.047, 0.167, 0.145, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.194, 0.013, 0.116, 0.077, 0.589, 0.011, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.425, 0.002, 0.007, 0.051, 0.374, 0.114, 0.027, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.389, 0.005, 0.026, 0.067, 0.249, 0.097, 0.092, 0.075, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.654, 0.001, 0.008, 0.005, 0.007, 0.005, 0.065, 0.115, 0.139, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.599, 0.0, 0.001, 0.0, 0.002, 0.001, 0.002, 0.012, 0.104, 0.279, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.322, 0.0, 0.001, 0.001, 0.007, 0.0, 0.004, 0.014, 0.108, 0.417, 0.128, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.074, 0.004, 0.012, 0.032, 0.084, 0.01, 0.036, 0.043, 0.025, 0.339, 0.324, 0.017, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.167, 0.005, 0.013, 0.03, 0.025, 0.01, 0.13, 0.069, 0.009, 0.108, 0.104, 0.082, 0.248, 0.0, 0.0, 0.0, 0.0],
			[0.073, 0.002, 0.059, 0.084, 0.103, 0.016, 0.228, 0.05, 0.003, 0.098, 0.14, 0.055, 0.031, 0.059, 0.0, 0.0, 0.0],
			[0.023, 0.005, 0.062, 0.021, 0.665, 0.056, 0.085, 0.005, 0.003, 0.038, 0.027, 0.006, 0.0, 0.002, 0.004, 0.0, 0.0],
			[0.847, 0.002, 0.008, 0.032, 0.022, 0.004, 0.004, 0.002, 0.001, 0.003, 0.003, 0.001, 0.003, 0.016, 0.04, 0.012, 0.0],
			[0.21, 0.007, 0.017, 0.028, 0.193, 0.017, 0.056, 0.017, 0.009, 0.099, 0.059, 0.006, 0.007, 0.018, 0.053, 0.007, 0.197]
		],
	},
	prev: {
		label: 'предыдущий токен',
		layer: 15,
		head: 3,
		note: 'Почти каждый токен смотрит на соседа слева. Похоже, так модель склеивает куски одного слова: « у» + «стал», « к» + «ов» + «ёр».',
		m: [
			[1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.906, 0.094, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.335, 0.558, 0.107, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.155, 0.045, 0.77, 0.029, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.147, 0.0, 0.074, 0.751, 0.028, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.074, 0.0, 0.0, 0.038, 0.851, 0.038, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.079, 0.0, 0.0, 0.0, 0.137, 0.74, 0.043, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.089, 0.0, 0.0, 0.0, 0.0, 0.048, 0.835, 0.029, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.146, 0.001, 0.0, 0.0, 0.0, 0.0, 0.051, 0.79, 0.011, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.19, 0.001, 0.0, 0.0, 0.0, 0.0, 0.0, 0.114, 0.668, 0.026, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.079, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.001, 0.103, 0.769, 0.047, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.179, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.031, 0.707, 0.083, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.106, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.085, 0.786, 0.023, 0.0, 0.0, 0.0, 0.0],
			[0.107, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.001, 0.195, 0.582, 0.115, 0.0, 0.0, 0.0],
			[0.134, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.04, 0.775, 0.051, 0.0, 0.0],
			[0.127, 0.001, 0.001, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.076, 0.771, 0.024, 0.0],
			[0.066, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.001, 0.151, 0.686, 0.096]
		],
	},
	sink: {
		label: 'всё в начало',
		layer: 19,
		head: 4,
		note: 'Почти всё внимание уходит на первый токен, о чём бы ни шла речь. Это называют attention sink. Одно из объяснений: так голове проще «ничего не делать», когда ей нечего добавить.',
		m: [
			[1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.999, 0.001, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.999, 0.0, 0.001, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.999, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.997, 0.001, 0.001, 0.0, 0.0, 0.001, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.997, 0.0, 0.0, 0.0, 0.0, 0.0, 0.002, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.996, 0.0, 0.0, 0.0, 0.0, 0.0, 0.001, 0.003, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.998, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.002, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.998, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.001, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.988, 0.0, 0.001, 0.0, 0.0, 0.001, 0.002, 0.001, 0.0, 0.0, 0.0, 0.006, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.998, 0.0, 0.0, 0.0, 0.0, 0.0, 0.001, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
			[0.992, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.001, 0.001, 0.005, 0.0, 0.0, 0.0],
			[0.991, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.002, 0.005, 0.0, 0.0],
			[0.998, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.001, 0.001, 0.0],
			[0.998, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.001, 0.0, 0.001]
		],
	},
};

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
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 } as React.CSSProperties,
	tabs: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' as const, marginBottom: '0.9rem' } as React.CSSProperties,
	chip: (active: boolean) =>
		({
			padding: '0.35rem 0.7rem',
			borderRadius: '8px',
			border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
			background: active ? 'var(--bg-secondary)' : 'transparent',
			color: active ? 'var(--text)' : 'var(--text-secondary)',
			fontSize: '0.78rem',
			fontWeight: 700,
			cursor: 'pointer',
		}) as React.CSSProperties,
	sentence: { display: 'flex', flexWrap: 'wrap' as const, gap: '0.25rem', marginBottom: '0.9rem' } as React.CSSProperties,
	tok: (selected: boolean, future: boolean) =>
		({
			position: 'relative' as const,
			padding: '0.3rem 0.4rem',
			borderRadius: '6px',
			border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
			background: 'var(--bg-secondary)',
			fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
			fontSize: '0.86rem',
			color: future ? 'var(--text-muted)' : 'var(--text)',
			whiteSpace: 'pre' as const,
			cursor: 'pointer',
			overflow: 'hidden',
			boxShadow: selected ? '0 0 0 1px var(--accent)' : 'none',
			opacity: future ? 0.45 : 1,
		}) as React.CSSProperties,
	glow: (w: number) =>
		({
			position: 'absolute' as const,
			inset: 0,
			background: 'var(--accent-secondary)',
			opacity: Math.min(0.85, w * 1.1),
			pointerEvents: 'none' as const,
			transition: 'opacity 0.15s ease',
		}) as React.CSSProperties,
	tokText: { position: 'relative' as const } as React.CSSProperties,
	readout: {
		padding: '0.75rem 0.9rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		fontSize: '0.84rem',
		color: 'var(--text)',
		lineHeight: 1.6,
		marginTop: '0.9rem',
	} as React.CSSProperties,
	legend: { display: 'flex', gap: '1rem', flexWrap: 'wrap' as const, fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '0.4rem 0' } as React.CSSProperties,
	swatch: (bg: string, op = 1) =>
		({ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: bg, opacity: op, marginRight: '0.35rem', verticalAlign: 'middle' }) as React.CSSProperties,
	note: { marginTop: '0.9rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

const show = (s: string) => s.replace(/ /g, '␣');

function Matrix({ h, q, setQ, mobile }: { h: Head; q: number; setQ: (i: number) => void; mobile: boolean }) {
	const [hover, setHover] = useState<[number, number] | null>(null);
	const n = TOKENS.length;
	const lab = mobile ? 52 : 70;
	const c = mobile ? 17 : 22;
	const W = lab + n * c + 4;
	const H = lab + n * c + 4;
	return (
		<>
			<svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: `${W * 1.25}px`, height: 'auto', display: 'block', margin: '0 auto' }}
				role="img" aria-label="Матрица весов attention: строка — кто смотрит, столбец — на кого"
				onMouseLeave={() => setHover(null)}>
				{TOKENS.map((t, j) => (
					<text key={`c${j}`} x={lab + j * c + c / 2} y={lab - 6} fontSize={mobile ? 10 : 12} fill={hover?.[1] === j ? 'var(--accent)' : 'var(--text-muted)'}
						transform={`rotate(-60 ${lab + j * c + c / 2} ${lab - 6})`} fontFamily="ui-monospace, Menlo, monospace">{show(t)}</text>
				))}
				{TOKENS.map((t, i) => (
					<text key={`r${i}`} x={lab - 6} y={lab + i * c + c / 2 + 4} textAnchor="end" fontSize={mobile ? 10 : 12}
						fill={i === q ? 'var(--accent)' : 'var(--text-muted)'} fontWeight={i === q ? 800 : 400}
						fontFamily="ui-monospace, Menlo, monospace" style={{ cursor: 'pointer' }} onClick={() => setQ(i)}>{show(t)}</text>
				))}
				{h.m.map((row, i) =>
					row.map((w, j) => {
						const future = j > i;
						return (
							<rect key={`${i}-${j}`} x={lab + j * c + 1} y={lab + i * c + 1} width={c - 2} height={c - 2} rx={2}
								fill={future ? 'var(--bg-secondary)' : 'var(--accent-secondary)'}
								fillOpacity={future ? 1 : 0.06 + Math.min(1, w) * 0.94}
								stroke={i === q ? 'var(--accent)' : 'none'} strokeWidth={i === q ? 1 : 0}
								style={{ cursor: future ? 'default' : 'pointer' }}
								onMouseEnter={() => { if (!future) { setHover([i, j]); setQ(i); } }}
								onClick={() => { if (!future) setQ(i); }} />
						);
					}),
				)}
			</svg>
			<div style={css.legend}>
				<span><span style={css.swatch('var(--accent-secondary)', 0.95)} />большой вес</span>
				<span><span style={css.swatch('var(--accent-secondary)', 0.15)} />маленький</span>
				<span><span style={{ ...css.swatch('var(--bg-secondary)'), border: '1px solid var(--border)' }} />будущее, закрыто маской</span>
				{hover && (
					<span style={{ color: 'var(--text)' }}>
						<strong>{show(TOKENS[hover[0]])}</strong> → <strong>{show(TOKENS[hover[1]])}</strong>: {Math.round(h.m[hover[0]][hover[1]] * 100)}%
					</span>
				)}
			</div>
		</>
	);
}

export default function AttentionMap() {
	const [hk, setHk] = useState<keyof typeof HEADS>('coref');
	const [q, setQ] = useState(14); // « он»
	const mobile = useIsMobile();
	const h = HEADS[hk];
	const row = h.m[q];
	const top = row
		.map((w, j) => [w, j] as const)
		.filter(([, j]) => j <= q)
		.sort((a, b) => b[0] - a[0])
		.slice(0, 3);

	return (
		<div style={css.wrap}>
			<div style={css.title}>👀 Кто на кого смотрит: настоящие головы Qwen3-0.6B</div>
			<div style={css.desc}>
				Кликни на токен во фразе или наведи на клетку матрицы. Строка матрицы — кто смотрит, столбец — на кого. Чем
				ярче, тем больше вес. Правее диагонали пусто: будущие токены закрыты маской.
			</div>
			<div style={css.tabs}>
				{(Object.keys(HEADS) as (keyof typeof HEADS)[]).map((k) => (
					<button key={k} style={css.chip(hk === k)} onClick={() => setHk(k)}>
						{HEADS[k].label} · слой {HEADS[k].layer}, голова {HEADS[k].head}
					</button>
				))}
			</div>
			<div style={css.sentence}>
				{TOKENS.map((t, j) => (
					<span key={j} style={css.tok(j === q, j > q)} onClick={() => setQ(j)} onMouseEnter={() => setQ(j)}>
						{j <= q && <span style={css.glow(row[j])} />}
						<span style={css.tokText}>{show(t)}</span>
					</span>
				))}
			</div>
			<Matrix h={h} q={q} setQ={setQ} mobile={mobile} />
			<div style={css.readout}>
				Токен <strong>{show(TOKENS[q])}</strong> смотрит на:{' '}
				{top.map(([w, j], i) => (
					<span key={j}>
						{i > 0 && ', '}
						<strong>{show(TOKENS[j])}</strong> {Math.round(w * 100)}%
					</span>
				))}
				.
				<br />
				{h.note}
			</div>
			<div style={css.note}>
				Веса посчитаны моделью на этой фразе, а головы найдены автоматически по простому критерию. У Qwen3-0.6B 28 слоёв
				по 16 голов, и большинство из них выглядит куда менее понятно. Слово «кот» модель видит как два токена:
				« к» и «от».
			</div>
		</div>
	);
}
