import { useState } from 'react';

type Intensity = 'light' | 'medium' | 'heavy';

const intensityLabels: Record<Intensity, string> = { light: 'Лёгкое', medium: 'Среднее', heavy: 'Интенсивное' };

type Tool = {
	name: string;
	color: string;
	price: Record<Intensity, string>;
};

const tools: Tool[] = [
	{ name: 'Cursor', color: '#00d1b2', price: { light: 'Hobby — $0', medium: 'Pro — $20/мес', heavy: 'Pro+/Ultra — от $20/мес (лимиты agent-запросов ×3/×20)' } },
	{ name: 'GitHub Copilot', color: '#8957e5', price: { light: 'Free — $0 (2000 completions/мес)', medium: 'Pro — $10/мес', heavy: 'Pro+ — $39/мес' } },
	{ name: 'Claude Code (подписка)', color: '#ff6b2b', price: { light: 'Pro — $20/мес', medium: 'Max 5x — $100/мес', heavy: 'Max 20x — $200/мес' } },
	{ name: 'Codex (через ChatGPT)', color: '#10a37f', price: { light: 'Plus — $20/мес', medium: 'Pro 5x — $100/мес', heavy: 'Pro 20x — $200/мес' } },
	{ name: 'Gemini CLI / Antigravity', color: '#4285f4', price: { light: 'Free-тир Antigravity CLI', medium: 'Pro — $20/мес', heavy: 'Pro + overage — от $20/мес, дальше по кредитам ($25/2500)' } },
	{ name: 'Self-hosted (OpenCode/Aider/Hermes Agent/OpenClaw и т.д.)', color: 'var(--text-muted)', price: { light: '~$5–20/мес (свой API-ключ, лёгкая модель)', medium: '~$20–50/мес (регулярное использование)', heavy: '$50–150+/мес (тяжёлая модель, много токенов)' } },
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
		marginBottom: '1.1rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	tabs: {
		display: 'flex',
		gap: '0.4rem',
		marginBottom: '1.25rem',
	} as React.CSSProperties,
	tab: (active: boolean) => ({
		padding: '0.45rem 0.95rem',
		borderRadius: '100px',
		border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
		background: active ? 'var(--accent-glow)' : 'var(--bg-secondary)',
		color: active ? 'var(--accent-light)' : 'var(--text-muted)',
		fontSize: '0.82rem',
		fontWeight: 700,
		cursor: 'pointer',
		fontFamily: 'inherit',
	} as React.CSSProperties),
	rows: { display: 'grid', gap: '0.5rem' } as React.CSSProperties,
	row: (color: string) => ({
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		padding: '0.75rem 1rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
	} as React.CSSProperties),
	toolName: (color: string) => ({
		width: '220px',
		flexShrink: 0,
		fontSize: '0.85rem',
		fontWeight: 700,
		color,
	} as React.CSSProperties),
	price: {
		fontSize: '0.86rem',
		color: 'var(--text)',
	} as React.CSSProperties,
	note: {
		marginTop: '1rem',
		fontSize: '0.78rem',
		color: 'var(--text-muted)',
		fontStyle: 'italic' as const,
	} as React.CSSProperties,
};

export default function CostCalculator() {
	const [intensity, setIntensity] = useState<Intensity>('medium');

	return (
		<div style={css.wrap}>
			<div style={css.title}>💸 Сколько это стоит в месяц</div>
			<div style={css.desc}>Выбери интенсивность использования — увидишь реальные тарифы (или ориентир для self-hosted-инструментов).</div>

			<div style={css.tabs}>
				{(['light', 'medium', 'heavy'] as Intensity[]).map((i) => (
					<button key={i} style={css.tab(intensity === i)} onClick={() => setIntensity(i)}>{intensityLabels[i]}</button>
				))}
			</div>

			<div style={css.rows}>
				{tools.map((t) => (
					<div key={t.name} style={css.row(t.color)}>
						<span style={css.toolName(t.color)}>{t.name}</span>
						<span style={css.price}>{t.price[intensity]}</span>
					</div>
				))}
			</div>

			<div style={css.note}>
				Self-hosted-строка — ориентир, не точная цена конкретного тарифа: зависит от выбранной модели и объёма токенов.
			</div>
		</div>
	);
}
