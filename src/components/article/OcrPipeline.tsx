import { useState, useEffect, useCallback } from 'react';

const STAGES = [
	{ icon: '📄', name: 'Картинка', detail: 'Страница или PDF масштабируется (base 1024px / gundam 640px с нарезкой на тайлы).' },
	{ icon: '👁️', name: 'Vision-энкодер', detail: 'Визуальный энкодер сжимает картинку в горстку визуальных токенов — это и есть «оптическое сжатие».' },
	{ icon: '🔢', name: 'Визуальные токены', detail: '~256 токенов на страницу несут весь её текст и вёрстку. На порядок меньше, чем текстом.' },
	{ icon: '🧠', name: 'LLM-декодер 3B', detail: 'Языковая модель разворачивает визуальные токены обратно в текст, читая до 32K токенов контекста.' },
	{ icon: '📝', name: 'Markdown', detail: 'На выходе — структурированный текст: заголовки, таблицы, формулы, многостраничный документ целиком.' },
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
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.6 } as React.CSSProperties,
	flow: { display: 'flex', alignItems: 'stretch', gap: '0.4rem', overflowX: 'auto', minWidth: 0 } as React.CSSProperties,
	stage: (active: boolean, mobile: boolean) => ({
		flex: 1,
		padding: mobile ? '0.6rem 0.4rem' : '0.85rem 0.5rem',
		borderRadius: '10px',
		border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
		background: active ? 'var(--accent-glow)' : 'var(--bg-secondary)',
		textAlign: 'center' as const,
		transition: 'all 0.3s ease',
		opacity: active ? 1 : 0.55,
		transform: active ? 'translateY(-2px)' : 'none',
	} as React.CSSProperties),
	stageIcon: (mobile: boolean) => ({ fontSize: mobile ? '1.2rem' : '1.6rem', lineHeight: 1, marginBottom: '0.3rem' } as React.CSSProperties),
	stageName: (active: boolean, mobile: boolean) => ({ fontSize: mobile ? '0.6rem' : '0.72rem', fontWeight: 700, color: active ? 'var(--accent-light)' : 'var(--text-muted)', lineHeight: 1.2 } as React.CSSProperties),
	arrow: { display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', flexShrink: 0 } as React.CSSProperties,
	detail: { marginTop: '1.1rem', padding: '0.9rem 1.1rem', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, minHeight: '3.5em' } as React.CSSProperties,
	detailNum: { color: 'var(--accent-light)', fontWeight: 700, marginRight: '0.4rem' } as React.CSSProperties,
	controls: { display: 'flex', gap: '0.5rem', marginTop: '1.1rem', alignItems: 'center' } as React.CSSProperties,
	btn: (active?: boolean) => ({ padding: '0.5rem 1rem', borderRadius: '8px', border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`, background: active ? 'var(--accent-glow)' : 'var(--bg-secondary)', color: active ? 'var(--accent-light)' : 'var(--text)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease' } as React.CSSProperties),
	stepLabel: { fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' } as React.CSSProperties,
};

export default function OcrPipeline() {
	const [step, setStep] = useState(0);
	const [auto, setAuto] = useState(true);
	const mobile = useIsMobile();

	const advance = useCallback(() => setStep((s) => (s + 1) % STAGES.length), []);

	useEffect(() => {
		if (!auto) return;
		const id = setInterval(advance, 1800);
		return () => clearInterval(id);
	}, [auto, advance]);

	return (
		<div style={{ ...css.wrap, ...(mobile ? { padding: '1rem', margin: '1.25em 0' } : {}) }}>
			<div style={css.title}>⚙️ Как Unlimited-OCR читает страницу</div>
			<div style={css.desc}>
				Это не «распознавалка букв», а vision-language модель: картинка кодируется в визуальные токены, а
				LLM разворачивает их обратно в текст. Смотри по шагам:
			</div>

			<div style={{ ...css.flow, ...(mobile ? { flexDirection: 'column' as const } : {}) }}>
				{STAGES.map((s, i) => (
					<div key={i} style={{ display: mobile ? 'block' : 'contents' }}>
						<div style={css.stage(i === step, mobile)} onClick={() => { setStep(i); setAuto(false); }}>
							{mobile ? (
								<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
									<span style={{ fontSize: '1.2rem' }}>{s.icon}</span>
									<span style={css.stageName(i === step, mobile)}>{s.name}</span>
								</div>
							) : (
								<>
									<div style={css.stageIcon(mobile)}>{s.icon}</div>
									<div style={css.stageName(i === step, mobile)}>{s.name}</div>
								</>
							)}
						</div>
						{i < STAGES.length - 1 && <div style={{ ...css.arrow, ...(mobile ? { padding: '0.2rem 0' } : {}) }}>{mobile ? '↓' : '→'}</div>}
					</div>
				))}
			</div>

			<div style={css.detail}>
				<span style={css.detailNum}>{step + 1}/{STAGES.length}</span>
				{STAGES[step].detail}
			</div>

			<div style={css.controls}>
				<button style={css.btn()} onClick={() => { setStep((s) => (s - 1 + STAGES.length) % STAGES.length); setAuto(false); }}>← Назад</button>
				<button style={css.btn()} onClick={() => { advance(); setAuto(false); }}>Вперёд →</button>
				<button style={css.btn(auto)} onClick={() => setAuto(!auto)}>{auto ? '⏸ Пауза' : '▶ Авто'}</button>
				<span style={css.stepLabel}>Шаг {step + 1}/{STAGES.length}</span>
			</div>
		</div>
	);
}
