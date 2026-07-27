import { useMemo, useState } from 'react';

function diagnose(recall: number, faithfulness: number) {
	const lowRecall = recall < 50;
	const lowFaith = faithfulness < 50;
	if (!lowRecall && !lowFaith) {
		return { verdict: 'Всё в порядке', color: '#10b981', text: 'Контекст найден почти весь, и модель ему верна. Дальше смотри на Context Precision (нет ли лишнего шума) и Answer Relevancy (отвечает ли ответ ровно на заданный вопрос).' };
	}
	if (lowRecall && !lowFaith) {
		return { verdict: 'Чини поиск', color: 'var(--accent-yellow)', text: 'Модель честно отвечает по тому, что нашла, но нашла не всё. Проблема в retrieval: индексации, top-k, hybrid search, чанкинге — не в промпте и не в генерации.' };
	}
	if (!lowRecall && lowFaith) {
		return { verdict: 'Чини генерацию', color: 'var(--accent-magenta)', text: 'Контекст на месте, найдено достаточно — но модель его игнорирует и выдумывает поверх. Проблема в промпте или в самой генерации, не в поиске.' };
	}
	return { verdict: 'Плохо и там, и там', color: 'var(--accent)', text: 'Поиск не нашёл нужное, и модель выдумывает вдобавок. Начинай с retrieval — почини его, потом переоцени faithfulness заново, отдельно от проблем с поиском.' };
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
	sliderRow: {
		marginBottom: '1.1rem',
	} as React.CSSProperties,
	sliderLabel: {
		display: 'flex',
		justifyContent: 'space-between',
		fontSize: '0.85rem',
		color: 'var(--text-secondary)',
		marginBottom: '0.4rem',
	} as React.CSSProperties,
	sliderVal: {
		fontWeight: 800,
		color: 'var(--text)',
		fontVariantNumeric: 'tabular-nums' as const,
	} as React.CSSProperties,
	slider: {
		width: '100%',
	} as React.CSSProperties,
	quadrantWrap: {
		position: 'relative' as const,
		width: '100%',
		aspectRatio: '2 / 1',
		marginTop: '1.25rem',
		marginBottom: '1.1rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		overflow: 'hidden',
	} as React.CSSProperties,
	quadLine: {
		position: 'absolute' as const,
		background: 'var(--border)',
	} as React.CSSProperties,
	quadLabel: {
		position: 'absolute' as const,
		fontSize: '0.68rem',
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.03em',
	} as React.CSSProperties,
	dot: (x: number, y: number, color: string) => ({
		position: 'absolute' as const,
		left: `${x}%`,
		top: `${y}%`,
		width: '18px',
		height: '18px',
		borderRadius: '50%',
		background: color,
		border: '2px solid white',
		transform: 'translate(-50%, -50%)',
		boxShadow: `0 0 14px ${color}`,
		transition: 'left 0.15s ease, top 0.15s ease',
	} as React.CSSProperties),
	verdictBox: (color: string) => ({
		padding: '1rem 1.1rem',
		borderRadius: '10px',
		background: `color-mix(in srgb, ${color} 10%, var(--bg-secondary))`,
		border: `1px solid ${color}`,
	} as React.CSSProperties),
	verdictTitle: (color: string) => ({
		fontSize: '0.95rem',
		fontWeight: 800,
		color,
		marginBottom: '0.4rem',
	} as React.CSSProperties),
	verdictText: {
		fontSize: '0.88rem',
		color: 'var(--text-secondary)',
		lineHeight: 1.6,
	} as React.CSSProperties,
};

export default function RagasDiagnostic() {
	const [recall, setRecall] = useState(80);
	const [faithfulness, setFaithfulness] = useState(30);
	const d = useMemo(() => diagnose(recall, faithfulness), [recall, faithfulness]);

	return (
		<div style={css.wrap}>
			<div style={css.title}>🩺 Диагностика по метрикам</div>
			<div style={css.desc}>
				Подвигай Context Recall и Faithfulness — посмотри, какой вывод получается в каждой комбинации. Именно так эти две метрики читают вместе, а не по отдельности.
			</div>

			<div style={css.sliderRow}>
				<div style={css.sliderLabel}>
					<span>Context Recall (нашли ли всё нужное)</span>
					<span style={css.sliderVal}>{recall}%</span>
				</div>
				<input aria-label="Context Recall" type="range" min={0} max={100} value={recall} onChange={(e) => setRecall(Number(e.target.value))} style={css.slider} />
			</div>

			<div style={css.sliderRow}>
				<div style={css.sliderLabel}>
					<span>Faithfulness (опирается ли ответ на контекст)</span>
					<span style={css.sliderVal}>{faithfulness}%</span>
				</div>
				<input aria-label="Faithfulness" type="range" min={0} max={100} value={faithfulness} onChange={(e) => setFaithfulness(Number(e.target.value))} style={css.slider} />
			</div>

			<div style={css.quadrantWrap}>
				<div style={{ ...css.quadLine, left: '50%', top: 0, bottom: 0, width: '1px' }} />
				<div style={{ ...css.quadLine, top: '50%', left: 0, right: 0, height: '1px' }} />
				<span style={{ ...css.quadLabel, left: '4%', top: '4%' }}>чини поиск</span>
				<span style={{ ...css.quadLabel, right: '4%', top: '4%', textAlign: 'right' }}>ок</span>
				<span style={{ ...css.quadLabel, left: '4%', bottom: '4%' }}>плохо всё</span>
				<span style={{ ...css.quadLabel, right: '4%', bottom: '4%', textAlign: 'right' }}>чини генерацию</span>
				<div style={css.dot(recall, 100 - faithfulness, d.color)} />
			</div>

			<div style={css.verdictBox(d.color)}>
				<div style={css.verdictTitle(d.color)}>{d.verdict}</div>
				<div style={css.verdictText}>{d.text}</div>
			</div>
		</div>
	);
}
