import { useState } from 'react';

type Category = 'cli' | 'ide' | 'cloud';

type Agent = {
	name: string;
	category: Category;
	maker: string;
	model: string;
	license: string;
	stars: string;
	price: string;
	diff: string;
	color: string;
};

const categoryLabels: Record<Category, string> = { cli: 'CLI', ide: 'IDE', cloud: 'Cloud' };

const agents: Agent[] = [
	{ name: 'Claude Code', category: 'cli', maker: 'Anthropic', model: 'Claude Sonnet 5 (по умолчанию)', license: 'проприетарный', stars: '—', price: 'включён в Pro/Max/Team + API', diff: 'вложенные суб-агенты (3 уровня), маркетплейс тулов, Auto Mode (preview)', color: '#ff6b2b' },
	{ name: 'Codex', category: 'cli', maker: 'OpenAI', model: 'GPT-5.5', license: 'Apache-2.0', stars: '102 019', price: 'ChatGPT Plus $20 / Pro 5x $100 / Pro 20x $200 или API', diff: '#2 на Terminal-Bench 2.1 (83.1%), sandboxed execution + approval workflow', color: '#10a37f' },
	{ name: 'OpenCode', category: 'cli', maker: 'Anomaly (anomalyco/opencode)', model: 'любая (75+ провайдеров)', license: 'MIT', stars: '190 380', price: 'бесплатный, платишь за свой API', diff: 'provider-agnostic, режимы build/plan', color: '#3b82f6' },
	{ name: 'Hermes Agent', category: 'cli', maker: 'Nous Research', model: 'любая (Nous Portal/OpenRouter/OpenAI)', license: 'MIT', stars: '221 624', price: 'бесплатный, self-hosted', diff: '~78 скиллов (TDD/debugging/review), умеет делегировать в Claude Code/Codex — и это тот же продукт, что в разделе про ассистентов', color: '#8b5cf6' },
	{ name: 'Cursor', category: 'ide', maker: 'Anysphere', model: 'на выбор', license: 'проприетарный', stars: '—', price: 'Hobby бесплатно / Pro $20 / Teams $40', diff: 'агент прямо в IDE, не нужно переключаться в терминал', color: '#00d1b2' },
	{ name: 'Aider', category: 'cli', maker: 'Aider-AI', model: 'любая (свой API-ключ)', license: 'Apache-2.0', stars: '47 750', price: 'бесплатный, платишь за свой API', diff: 'git-native с самого начала, один из старейших в жанре', color: '#f59e0b' },
	{ name: 'Devin', category: 'cloud', maker: 'Cognition', model: 'своя', license: 'проприетарный', stars: '—', price: 'подписка (девин.ai)', diff: 'полностью автономный облачный агент, Windsurf в 2026 поглощён как Devin Desktop', color: '#ec4899' },
	{ name: 'Gemini CLI', category: 'cli', maker: 'Google', model: 'Gemini 3.1 Pro', license: 'Apache-2.0', stars: '—', price: 'бесплатный тир закрыт 18 июня 2026, сейчас Antigravity CLI (free + Pro $20)', diff: '65.8% на Terminal-Bench 2.1', color: '#4285f4' },
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
	filterRow: {
		display: 'flex',
		gap: '0.4rem',
		marginBottom: '1.1rem',
		flexWrap: 'wrap' as const,
	} as React.CSSProperties,
	filterBtn: (active: boolean) => ({
		padding: '0.4rem 0.9rem',
		borderRadius: '100px',
		border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
		background: active ? 'var(--accent-glow)' : 'var(--bg-secondary)',
		color: active ? 'var(--accent-light)' : 'var(--text-muted)',
		fontSize: '0.8rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
	} as React.CSSProperties),
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
	agentName: (color: string) => ({
		fontSize: '1.4rem',
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
		width: '140px',
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

const fields: { key: keyof Agent; label: string }[] = [
	{ key: 'maker', label: 'Разработчик' },
	{ key: 'model', label: 'Модель' },
	{ key: 'license', label: 'Лицензия' },
	{ key: 'stars', label: 'GitHub Stars' },
	{ key: 'price', label: 'Цена' },
	{ key: 'diff', label: 'Чем отличается' },
];

export default function AgentCompare() {
	const [filter, setFilter] = useState<Category | null>(null);
	const filtered = filter ? agents.filter((a) => a.category === filter) : agents;
	const [selected, setSelected] = useState(0);
	const list = filtered.length > 0 ? filtered : agents;
	const agent = list[Math.min(selected, list.length - 1)];

	return (
		<div style={css.wrap}>
			<div style={css.title}>⚔️ Сравнение coding-агентов</div>
			<div style={css.desc}>
				Фильтруй по подходу (CLI / IDE / Cloud), выбирай инструмент — увидишь его характеристики. Звёзды и цены — на момент написания статьи, в этой нише они меняются быстро.
			</div>

			<div style={css.filterRow}>
				<button style={css.filterBtn(!filter)} onClick={() => { setFilter(null); setSelected(0); }}>Все</button>
				{(['cli', 'ide', 'cloud'] as Category[]).map((c) => (
					<button key={c} style={css.filterBtn(filter === c)} onClick={() => { setFilter(c); setSelected(0); }}>{categoryLabels[c]}</button>
				))}
			</div>

			<div style={css.tabs}>
				{list.map((a, i) => (
					<button key={a.name} style={css.tab(i === selected, a.color)} onClick={() => setSelected(i)}>{a.name}</button>
				))}
			</div>

			<div style={css.header}>
				<span style={css.agentName(agent.color)}>{agent.name}</span>
			</div>

			<div style={css.card}>
				{fields.map((f) => (
					<div key={f.key} style={css.row}>
						<span style={css.rowLabel}>{f.label}</span>
						<span style={css.rowValue}>{agent[f.key]}</span>
					</div>
				))}
			</div>
		</div>
	);
}
