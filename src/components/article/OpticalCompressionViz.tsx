import { useState, useEffect } from 'react';

// Идея DeepSeek-OCR / Unlimited-OCR: вместо того чтобы скармливать LLM текст токенами,
// страницу кодируют в картинку → горстку визуальных токенов. Их число почти не растёт
// с длиной текста, в отличие от текстовых токенов.
const VISION_TOKENS = 256; // ~ для base-режима (1024px), грубо
const TOK_PER_WORD = 1.4; // приблизительно токенов на слово (с разметкой)

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
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.6 } as React.CSSProperties,
	cols: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' } as React.CSSProperties,
	col: { display: 'flex', flexDirection: 'column' as const, gap: '0.6rem' } as React.CSSProperties,
	colTitle: (c: string) => ({ fontSize: '0.8rem', fontWeight: 700, color: c, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' } as React.CSSProperties),
	colNum: (c: string) => ({ fontSize: '1.25rem', fontWeight: 900, color: c, fontVariantNumeric: 'tabular-nums' } as React.CSSProperties),
	dots: { display: 'flex', flexWrap: 'wrap' as const, gap: '2px', alignContent: 'flex-start' as const, minHeight: '120px', padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' } as React.CSSProperties,
	dot: (c: string, big?: boolean) => ({ width: big ? '10px' : '5px', height: big ? '10px' : '5px', borderRadius: '2px', background: c } as React.CSSProperties),
	verdict: { marginTop: '1.25rem', padding: '0.9rem 1.1rem', borderRadius: '10px', background: 'var(--accent-glow)', border: '1px solid var(--accent)', textAlign: 'center' as const } as React.CSSProperties,
	ratio: { fontSize: '2rem', fontWeight: 900, color: 'var(--accent-light)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' } as React.CSSProperties,
	ratioLabel: { fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginTop: '0.2rem' } as React.CSSProperties,
	controls: { display: 'flex', gap: '0.75rem', marginTop: '1.25rem', alignItems: 'center', flexWrap: 'wrap' as const } as React.CSSProperties,
	slider: { flex: 1, minWidth: '150px', accentColor: 'var(--accent)' } as React.CSSProperties,
	sliderVal: { fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, fontVariantNumeric: 'tabular-nums', minWidth: '110px', textAlign: 'right' as const } as React.CSSProperties,
};

export default function OpticalCompressionViz() {
	const [words, setWords] = useState(800);
	const mobile = useIsMobile();

	const textTokens = Math.round(words * TOK_PER_WORD);
	const ratio = (textTokens / VISION_TOKENS).toFixed(1);

	// Сколько точек рисуем (визуально режем, число пишем цифрой).
	const textDots = Math.min(700, Math.round(textTokens / 4));
	const visionDots = Math.min(256, VISION_TOKENS);

	return (
		<div style={{ ...css.wrap, ...(mobile ? { padding: '1rem', margin: '1.25em 0' } : {}) }}>
			<div style={css.title}>🗜️ Оптическое сжатие: текст → картинка</div>
			<div style={css.desc}>
				Слева — во сколько токенов превратится страница, если кормить LLM <strong>текстом</strong>. Справа —
				во сколько, если закодировать ту же страницу как <strong>картинку</strong> (визуальные токены). Тяни
				ползунок: текст растёт, картинка — почти нет.
			</div>

			<div style={{ ...css.cols, ...(mobile ? { gridTemplateColumns: '1fr', gap: '1rem' } : {}) }}>
				<div style={css.col}>
					<div style={css.colTitle('#f59e0b')}>
						<span>📝 Текстовые токены</span>
						<span style={css.colNum('#f59e0b')}>{textTokens.toLocaleString('ru-RU')}</span>
					</div>
					<div style={css.dots}>
						{Array.from({ length: textDots }, (_, i) => <div key={i} style={css.dot('#f59e0b')} />)}
					</div>
				</div>
				<div style={css.col}>
					<div style={css.colTitle('#10b981')}>
						<span>🖼️ Визуальные токены</span>
						<span style={css.colNum('#10b981')}>{VISION_TOKENS}</span>
					</div>
					<div style={css.dots}>
						{Array.from({ length: visionDots }, (_, i) => <div key={i} style={css.dot('#10b981', true)} />)}
					</div>
				</div>
			</div>

			<div style={css.verdict}>
				<div style={css.ratio}>×{ratio}</div>
				<div style={css.ratioLabel}>во столько раз меньше токенов через картинку</div>
			</div>

			<div style={css.controls}>
				<input type="range" min={200} max={2500} step={100} value={words} onChange={(e) => setWords(Number(e.target.value))} style={css.slider} />
				<span style={css.sliderVal}>{words.toLocaleString('ru-RU')} слов</span>
			</div>
		</div>
	);
}
