import { useState } from 'react';

type Result = {
	name: string;
	color: string;
	why: string;
	watch: string;
};

const options: { label: string; result: string }[] = [
	{ label: 'Точное решение задачи (код проходит тесты, ответ верный)', result: 'verifiable' },
	{ label: 'Качество открытого результата (документ, ревью, план)', result: 'judge' },
	{ label: 'Общее впечатление от общения, сравнение стиля ответа', result: 'arena' },
];

const results: Record<string, Result> = {
	verifiable: { name: 'Verifiable', color: '#22c55e', why: 'Точный ответ или прогон тестов — без судьи и без его предвзятостей.', watch: 'Следи за контаминацией: задачи и решения утекают в претрейн со временем.' },
	judge: { name: 'LLM-judge', color: '#f59e0b', why: 'Единственный вариант, когда «правильного ответа» в одном числе не существует.', watch: 'Следи за verbosity bias: и модели, и люди-эксперты склонны предпочитать более длинные ответы.' },
	arena: { name: 'Arena/ELO', color: '#3b82f6', why: 'Живые предпочтения реальных людей — не имитация оценки, а сама оценка.', watch: 'Следи за style bias и смещением выборки голосующих — плюс за специально настроенными под чат вариантами моделей.' },
};

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
	question: {
		fontSize: '1.05rem',
		fontWeight: 800,
		color: 'var(--text)',
		marginBottom: '1rem',
	} as React.CSSProperties,
	optionsGrid: { display: 'grid', gap: '0.5rem' } as React.CSSProperties,
	option: {
		padding: '0.85rem 1.1rem',
		borderRadius: '10px',
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
		cursor: 'pointer',
		fontFamily: 'inherit',
		fontSize: '0.9rem',
		fontWeight: 600,
		color: 'var(--text)',
		textAlign: 'left' as const,
		width: '100%',
	} as React.CSSProperties,
	result: (color: string) => ({
		padding: '1.5rem',
		borderRadius: '12px',
		border: `2px solid ${color}`,
		background: `${color}08`,
	} as React.CSSProperties),
	resultName: (color: string) => ({
		fontSize: '1.5rem',
		fontWeight: 900,
		color,
		marginBottom: '0.5rem',
	} as React.CSSProperties),
	resultWhy: {
		fontSize: '0.9rem',
		lineHeight: 1.6,
		color: 'var(--text-secondary)',
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	resultWatch: {
		fontSize: '0.85rem',
		lineHeight: 1.6,
		color: 'var(--text-muted)',
		fontStyle: 'italic' as const,
	} as React.CSSProperties,
	resetBtn: {
		marginTop: '1rem',
		padding: '0.55rem 1.25rem',
		borderRadius: '8px',
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
		color: 'var(--text)',
		fontSize: '0.85rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
	} as React.CSSProperties,
};

export default function BenchmarkTypeQuiz() {
	const [picked, setPicked] = useState<string | null>(null);
	const result = picked ? results[picked] : null;

	return (
		<div style={css.wrap}>
			<div style={css.title}>🧭 Какой тип бенчмарка тебе честно нужен</div>
			<div style={css.desc}>Что ты на самом деле хочешь оценить?</div>

			{!result && (
				<div style={css.optionsGrid}>
					{options.map((opt) => (
						<button key={opt.result} style={css.option} onClick={() => setPicked(opt.result)}>{opt.label}</button>
					))}
				</div>
			)}

			{result && (
				<>
					<div style={css.result(result.color)}>
						<div style={css.resultName(result.color)}>→ {result.name}</div>
						<div style={css.resultWhy}>{result.why}</div>
						<div style={css.resultWatch}>{result.watch}</div>
					</div>
					<button style={css.resetBtn} onClick={() => setPicked(null)}>🔄 Начать заново</button>
				</>
			)}
		</div>
	);
}
