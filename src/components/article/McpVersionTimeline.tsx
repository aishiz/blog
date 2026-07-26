import { useState } from 'react';

const VERSIONS = [
	{
		date: '2024-11-05',
		label: 'Запуск',
		tag: 'Первая публичная версия',
		color: '#8a7faa',
		changes: [
			'Базовый JSON-RPC поверх stdio и HTTP+SSE',
			'Примитивы: tools, resources, prompts на сервере',
			'Sampling — сервер может попросить клиента сходить к LLM',
			'Авторизации ещё нет вообще — только локальные доверенные серверы',
		],
	},
	{
		date: '2025-03-26',
		label: 'OAuth и Streamable HTTP',
		tag: 'Протокол выходит из локальной песочницы',
		color: '#3b82f6',
		changes: [
			'Авторизация на базе OAuth 2.1 — MCP можно безопасно выставлять наружу',
			'HTTP+SSE заменён на Streamable HTTP — один эндпоинт, гибче под прокси и балансировщики',
			'JSON-RPC batching — можно слать несколько запросов одним пакетом',
			'Tool annotations — readOnlyHint, destructiveHint и другие метки поведения тула',
			'Аудио как тип контента, capability для автодополнения аргументов',
		],
	},
	{
		date: '2025-06-18',
		label: 'Resource Server и Elicitation',
		tag: 'Авторизация формализована, серверы просят инфу у юзера',
		color: '#10b981',
		changes: [
			'JSON-RPC batching выпилен обратно — прожил одну версию',
			'MCP-серверы классифицированы как OAuth Resource Server, добавлен discovery',
			'Elicitation — сервер может запросить у пользователя данные прямо посреди работы',
			'Structured tool output — тул возвращает не только текст, но и типизированный JSON',
			'Resource links в результатах тулов, обязательный заголовок MCP-Protocol-Version',
		],
	},
	{
		date: '2025-11-25',
		label: 'Текущая версия',
		tag: 'Tasks, тонкая авторизация, зрелая элиситация',
		color: 'var(--accent)',
		changes: [
			'Tasks (experimental) — долгие запросы с поллингом вместо висящего соединения',
			'OpenID Connect Discovery поверх OAuth-слоя авторизации',
			'Incremental scope consent — сервер просит доступ по мере необходимости, не всё сразу',
			'Tool calling внутри sampling — сервер может дать модели тулы прямо в запросе к LLM',
			'URL-элиситация, стандартизированный ElicitResult, иконки у тулов/ресурсов/промптов',
		],
	},
];

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
		marginBottom: '1.3rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	tabs: {
		display: 'flex',
		gap: '0.4rem',
		marginBottom: '1.2rem',
		flexWrap: 'wrap' as const,
	} as React.CSSProperties,
	tab: (active: boolean, color: string) => ({
		flex: '1 1 auto',
		minWidth: '7rem',
		padding: '0.55rem 0.7rem',
		borderRadius: '8px',
		border: `1px solid ${active ? color : 'var(--border)'}`,
		background: active ? `${color}18` : 'var(--bg-secondary)',
		cursor: 'pointer',
		fontFamily: 'inherit',
		textAlign: 'left' as const,
		transition: 'all 0.2s ease',
	} as React.CSSProperties),
	tabDate: (active: boolean, color: string) => ({
		display: 'block',
		fontSize: '0.78rem',
		fontWeight: 800,
		fontFamily: 'var(--font-mono, monospace)',
		color: active ? color : 'var(--text)',
	} as React.CSSProperties),
	tabLabel: {
		display: 'block',
		fontSize: '0.68rem',
		color: 'var(--text-muted)',
		marginTop: '0.15rem',
	} as React.CSSProperties,
	panel: (color: string) => ({
		padding: '1.1rem 1.25rem',
		borderRadius: '10px',
		border: `1px solid ${color}55`,
		background: `${color}0d`,
	} as React.CSSProperties),
	panelTag: (color: string) => ({
		fontSize: '0.78rem',
		fontWeight: 700,
		color,
		marginBottom: '0.7rem',
	} as React.CSSProperties),
	changeRow: {
		display: 'flex',
		gap: '0.55rem',
		fontSize: '0.85rem',
		color: 'var(--text-secondary)',
		lineHeight: 1.6,
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	bullet: (color: string) => ({
		color,
		flexShrink: 0,
	} as React.CSSProperties),
};

export default function McpVersionTimeline() {
	const [idx, setIdx] = useState(3);
	const v = VERSIONS[idx];

	return (
		<div style={css.wrap}>
			<div style={css.title}>🕰️ Четыре версии спецификации</div>
			<div style={css.desc}>
				MCP версионируется датой ревизии, а не semver: номер меняется только при обратно
				несовместимых изменениях. Кликай по вехам.
			</div>

			<div style={css.tabs}>
				{VERSIONS.map((ver, i) => (
					<button key={ver.date} style={css.tab(i === idx, ver.color)} onClick={() => setIdx(i)}>
						<span style={css.tabDate(i === idx, ver.color)}>{ver.date}</span>
						<span style={css.tabLabel}>{ver.label}</span>
					</button>
				))}
			</div>

			<div style={css.panel(v.color)}>
				<div style={css.panelTag(v.color)}>{v.tag}</div>
				{v.changes.map((c, i) => (
					<div key={i} style={css.changeRow}>
						<span style={css.bullet(v.color)}>▸</span>
						<span>{c}</span>
					</div>
				))}
			</div>
		</div>
	);
}
