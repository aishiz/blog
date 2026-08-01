import { useState } from 'react';

// Интерактив: поверни вектор запроса — и увидишь, какое слово он "выбирает".
// Иллюстративно и в 2D: attention = softmax по косинусу угла между запросом и
// каждым ключом-словом (единичные векторы). Победитель — argmax внимания.
// Именно это делает RoPE осязаемым: поворот вектора (позицией) меняет, к какому
// токену запрос ближе, а значит — что модель достаёт на выход.
const KEYS: { word: string; deg: number }[] = [
	{ word: 'кот', deg: 30 },
	{ word: 'ловит', deg: 100 },
	{ word: 'мышь', deg: 175 },
	{ word: 'спит', deg: 250 },
	{ word: 'днём', deg: 320 },
];
const SCALE = 4; // резкость softmax — чтобы был явный победитель

const CX = 150;
const CY = 150;
const R = 100;

function polar(deg: number, r: number) {
	const a = (deg * Math.PI) / 180;
	return { x: CX + r * Math.cos(a), y: CY - r * Math.sin(a) }; // SVG y вниз → минус для CCW
}

function attention(qDeg: number) {
	const scores = KEYS.map((k) => Math.cos(((qDeg - k.deg) * Math.PI) / 180));
	const max = Math.max(...scores);
	const exps = scores.map((s) => Math.exp(SCALE * (s - max)));
	const z = exps.reduce((a, b) => a + b, 0);
	const weights = exps.map((e) => e / z);
	let win = 0;
	for (let i = 1; i < weights.length; i++) if (weights[i] > weights[win]) win = i;
	return { weights, win };
}

const css = {
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.1rem', lineHeight: 1.6 } as React.CSSProperties,
	main: { display: 'flex', gap: '1.5rem', flexWrap: 'wrap' as const, alignItems: 'center' } as React.CSSProperties,
	side: { flex: 1, minWidth: '240px' } as React.CSSProperties,
	output: { padding: '0.9rem 1.1rem', borderRadius: '10px', background: '#22c55e12', border: '2px solid #22c55e', marginBottom: '1rem' } as React.CSSProperties,
	outputLabel: { fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '0.2rem' } as React.CSSProperties,
	outputWord: { fontSize: '1.6rem', fontWeight: 900, color: '#22c55e' } as React.CSSProperties,
	barRow: { display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.4rem' } as React.CSSProperties,
	barLabel: (win: boolean) => ({ width: '52px', flexShrink: 0, fontSize: '0.8rem', fontWeight: win ? 800 : 600, color: win ? '#22c55e' : 'var(--text-muted)' } as React.CSSProperties),
	barTrack: { flex: 1, height: '12px', borderRadius: '4px', background: 'var(--bg-secondary)', overflow: 'hidden' } as React.CSSProperties,
	barFill: (pct: number, win: boolean) => ({ width: `${pct}%`, height: '100%', background: win ? '#22c55e' : '#3b82f6' } as React.CSSProperties),
	barVal: { width: '38px', flexShrink: 0, fontSize: '0.76rem', fontWeight: 700, color: 'var(--text)', textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties,
	sliderRow: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.9rem' } as React.CSSProperties,
	sliderLabel: { fontSize: '0.82rem', fontWeight: 700, color: '#8b5cf6', minWidth: '112px' } as React.CSSProperties,
	slider: { flex: 1, accentColor: '#8b5cf6' } as React.CSSProperties,
	angleVal: { fontSize: '0.9rem', fontWeight: 800, color: '#8b5cf6', minWidth: '3.5ch', textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties,
	note: { marginTop: '0.9rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

export default function AttentionVectorPlayground() {
	const [q, setQ] = useState(30);
	const { weights, win } = attention(q);
	const qv = polar(q, R);

	return (
		<div style={css.wrap}>
			<div style={css.title}>🎯 Поверни запрос — сменится выходное слово</div>
			<div style={css.desc}>Пять слов-ключей смотрят в разные стороны. Фиолетовый вектор — запрос. Крути его: чем он ближе по направлению к слову, тем выше внимание к нему, и то слово выходит на выход. Иллюстративно, 2D, одна голова.</div>

			<div style={css.main}>
				<svg width={CX * 2} height={CY * 2} role="img" aria-label={`выходное слово ${KEYS[win].word}`}>
					<circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border)" strokeWidth="1.5" />
					{KEYS.map((k, i) => {
						const tip = polar(k.deg, R);
						const label = polar(k.deg, R + 22);
						const isWin = i === win;
						const col = isWin ? '#22c55e' : '#3b82f6';
						return (
							<g key={k.word}>
								<line x1={CX} y1={CY} x2={tip.x} y2={tip.y} stroke={col} strokeWidth={isWin ? 3 : 1.5} strokeLinecap="round" opacity={isWin ? 1 : 0.35 + weights[i] * 0.6} />
								<circle cx={tip.x} cy={tip.y} r={isWin ? 5 : 3.5} fill={col} opacity={isWin ? 1 : 0.5 + weights[i] * 0.5} />
								<text x={label.x} y={label.y} fill={isWin ? '#22c55e' : 'var(--text-muted)'} fontSize="13" fontWeight={isWin ? 800 : 600} textAnchor="middle" dominantBaseline="middle">{k.word}</text>
							</g>
						);
					})}
					<line x1={CX} y1={CY} x2={qv.x} y2={qv.y} stroke="#8b5cf6" strokeWidth="3.5" strokeLinecap="round" />
					<circle cx={qv.x} cy={qv.y} r="5.5" fill="#8b5cf6" />
					<circle cx={CX} cy={CY} r="3" fill="var(--text-muted)" />
				</svg>

				<div style={css.side}>
					<div style={css.output}>
						<div style={css.outputLabel}>Выходное слово (максимум внимания)</div>
						<div style={css.outputWord}>→ {KEYS[win].word}</div>
					</div>

					{KEYS.map((k, i) => (
						<div key={k.word} style={css.barRow}>
							<span style={css.barLabel(i === win)}>{k.word}</span>
							<div style={css.barTrack}><div style={css.barFill(weights[i] * 100, i === win)} /></div>
							<span style={css.barVal}>{(weights[i] * 100).toFixed(0)}%</span>
						</div>
					))}

					<div style={css.sliderRow}>
						<span style={css.sliderLabel}>поверни запрос</span>
						<input style={css.slider} type="range" min={0} max={359} value={q} onChange={(e) => setQ(Number(e.target.value))} />
						<span style={css.angleVal}>{q}°</span>
					</div>
				</div>
			</div>

			<div style={css.note}>Внимание тут — softmax по косинусу угла между запросом и ключами (в реальных моделях — по скалярному произведению q·k в многомерном пространстве). Поворот вектора меняет эти углы, а значит и то, какой токен выигрывает. Именно поэтому позиция, закодированная как поворот (RoPE), напрямую влияет на то, что модель достаёт на выход.</div>
		</div>
	);
}
