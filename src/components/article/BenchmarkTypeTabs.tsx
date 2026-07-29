import { useState } from 'react';

type TypeInfo = {
	key: string;
	label: string;
	examples: string;
	scoring: string;
	filter: string;
	vulnerability: string;
	color: string;
};

const TYPES: TypeInfo[] = [
	{
		key: 'verifiable',
		label: 'Verifiable',
		examples: 'SWE-bench Verified, AIME, FrontierMath',
		scoring: 'Точный ответ или прогон тестов — без судьи',
		filter: 'SWE-bench Verified: 93 разработчика, по 3 аннотатора на пример, 500 задач в финальном сете (OpenAI отдельно называет долю отбракованных — 68.3% — с 1699 к 500 в простой процент не сводится)',
		vulnerability: 'Контаминация — задачи утекают в претрейн; FrontierMath: OpenAI финансирует создание задач и частично видит их (кроме holdout-набора)',
		color: '#22c55e',
	},
	{
		key: 'judge',
		label: 'LLM-judge',
		examples: 'GDPval',
		scoring: 'Панель экспертов + экспериментальный авто-грейдер сравнивают с человеческим результатом',
		filter: '44 профессии, 9 отраслей, 1320 задач от экспертов со средним стажем 14 лет, ~5 раундов ревью',
		vulnerability: 'Verbosity bias — судьи (люди и модели) предпочитают длинные ответы вне зависимости от качества (Zheng et al., arXiv:2306.05685)',
		color: '#f59e0b',
	},
	{
		key: 'arena',
		label: 'Arena/ELO',
		examples: 'LMArena (бывший Chatbot Arena)',
		scoring: 'Слепое попарное голосование живых людей → рейтинг Bradley-Terry',
		filter: '~240 000 голосов от ~90 000 пользователей на момент публикации пейпера — но выборка смещена к энтузиастам и исследователям (признание самих авторов)',
		vulnerability: 'Style/length bias — после введения Style Control рейтинги реально сдвинулись (например, GPT-4o-mini упал с 6-го места на 11-е)',
		color: '#3b82f6',
	},
];

const fields: { key: keyof TypeInfo; label: string }[] = [
	{ key: 'examples', label: 'Примеры' },
	{ key: 'scoring', label: 'Как считается' },
	{ key: 'filter', label: 'Кто фильтрует' },
	{ key: 'vulnerability', label: 'Уязвимость' },
];

const css = {
	wrap: {
		margin: '1.75em 0',
		padding: '1.5rem',
		borderRadius: '12px',
		border: '1px solid var(--border)',
		background: 'var(--bg-card)',
		overflowX: 'auto' as const,
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
	tabs: {
		display: 'flex',
		gap: '0.4rem',
		flexWrap: 'wrap' as const,
		marginBottom: '1.25rem',
	} as React.CSSProperties,
	tab: (active: boolean, color: string) => ({
		padding: '0.45rem 0.95rem',
		borderRadius: '100px',
		border: `1px solid ${active ? color : 'var(--border)'}`,
		background: active ? `${color}18` : 'var(--bg-secondary)',
		color: active ? color : 'var(--text-muted)',
		fontSize: '0.82rem',
		fontWeight: 700,
		cursor: 'pointer',
		fontFamily: 'inherit',
	} as React.CSSProperties),
	header: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		marginBottom: '1rem',
	} as React.CSSProperties,
	typeName: (color: string) => ({
		fontSize: '1.3rem',
		fontWeight: 900,
		color,
	} as React.CSSProperties),
	card: { display: 'grid', gap: '0.6rem' } as React.CSSProperties,
	row: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: '0.75rem',
		padding: '0.7rem 1rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
	} as React.CSSProperties,
	rowLabel: {
		width: '130px',
		flexShrink: 0,
		fontSize: '0.8rem',
		fontWeight: 600,
		color: 'var(--text-muted)',
	} as React.CSSProperties,
	rowValue: {
		fontSize: '0.86rem',
		fontWeight: 600,
		color: 'var(--text)',
		lineHeight: 1.5,
	} as React.CSSProperties,
};

export default function BenchmarkTypeTabs() {
	const [selected, setSelected] = useState(0);
	const t = TYPES[selected];

	return (
		<div style={css.wrap}>
			<div style={css.title}>🗂️ Три типа бенчмарков</div>
			<div style={css.desc}>У каждого типа своя методология и свой вектор обмана — переключай вкладки.</div>

			<div style={css.tabs}>
				{TYPES.map((tp, i) => (
					<button key={tp.key} style={css.tab(i === selected, tp.color)} onClick={() => setSelected(i)}>{tp.label}</button>
				))}
			</div>

			<div style={css.header}>
				<span style={css.typeName(t.color)}>{t.label}</span>
			</div>

			<div style={css.card}>
				{fields.map((f) => (
					<div key={f.key} style={css.row}>
						<span style={css.rowLabel}>{f.label}</span>
						<span style={css.rowValue}>{t[f.key]}</span>
					</div>
				))}
			</div>
		</div>
	);
}
