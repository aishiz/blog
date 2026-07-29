import { useState } from 'react';

type Model = {
	name: string;
	maker: string;
	params: string;
	context: string;
	date: string;
	benchmark: string;
	access: string;
	color: string;
};

const models: Model[] = [
	{
		name: 'Kimi K3',
		maker: 'Moonshot AI',
		params: '2.8T всего / 104B активных',
		context: '1M токенов',
		date: '27 июля 2026 (анонс 16 июля)',
		benchmark: 'SWE-bench Verified 93.40% — подтверждено на vals.ai',
		access: 'Открытые веса (Kimi K3 License, revenue-triggered) + API',
		color: '#c946ff',
	},
	{
		name: 'Qwen3.8-Max-Preview',
		maker: 'Alibaba',
		params: '2.4T всего / не раскрыто',
		context: 'Не раскрыто',
		date: '19 июля 2026',
		benchmark: 'Не опубликовано — заявление «уступает только Fable 5» без независимой проверки',
		access: 'Закрытая: Token Plan, Qoder, QoderWork',
		color: '#f0a020',
	},
	{
		name: 'DeepSeek V4-Pro',
		maker: 'DeepSeek',
		params: '1.6T всего / 49B активных',
		context: '1M токенов',
		date: '24 апреля 2026',
		benchmark: 'Нет единого подтверждённого числа — цифры расходятся между источниками',
		access: 'Не уточнялось в этой статье',
		color: '#4f7cff',
	},
	{
		name: 'DeepSeek V4-Flash',
		maker: 'DeepSeek',
		params: '284B всего / 13B активных',
		context: '1M токенов',
		date: '24 апреля 2026',
		benchmark: 'Нет единого подтверждённого числа',
		access: 'Не уточнялось в этой статье',
		color: '#4f7cff',
	},
];

const fields: { key: keyof Model; label: string }[] = [
	{ key: 'maker', label: 'Разработчик' },
	{ key: 'params', label: 'Параметры' },
	{ key: 'context', label: 'Контекст' },
	{ key: 'date', label: 'Дата' },
	{ key: 'benchmark', label: 'SWE-bench' },
	{ key: 'access', label: 'Доступность' },
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
	modelName: (color: string) => ({
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

export default function PositioningTabs() {
	const [selected, setSelected] = useState(0);
	const model = models[selected];

	return (
		<div style={css.wrap}>
			<div style={css.title}>🌍 Кто ещё выкатил триллион+ параметров в это полугодие</div>
			<div style={css.desc}>Три лаборатории, четыре модели, одно полугодие — переключай вкладки.</div>

			<div style={css.tabs}>
				{models.map((m, i) => (
					<button key={m.name} style={css.tab(i === selected, m.color)} onClick={() => setSelected(i)}>{m.name}</button>
				))}
			</div>

			<div style={css.header}>
				<span style={css.modelName(model.color)}>{model.name}</span>
			</div>

			<div style={css.card}>
				{fields.map((f) => (
					<div key={f.key} style={css.row}>
						<span style={css.rowLabel}>{f.label}</span>
						<span style={css.rowValue}>{model[f.key]}</span>
					</div>
				))}
			</div>
		</div>
	);
}
