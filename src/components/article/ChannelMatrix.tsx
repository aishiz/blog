import { useState } from 'react';

type Support = 'yes' | 'no' | 'unclear';

type Tool = {
	name: string;
	color: string;
	channels: Record<string, Support>;
};

const channelIds = ['whatsapp', 'telegram', 'discord', 'slack', 'email', 'wechat'] as const;
const channelLabels: Record<(typeof channelIds)[number], string> = {
	whatsapp: 'WhatsApp',
	telegram: 'Telegram',
	discord: 'Discord',
	slack: 'Slack',
	email: 'Email',
	wechat: 'WeChat',
};

const tools: Tool[] = [
	{ name: 'OpenClaw', color: '#ff6b2b', channels: { whatsapp: 'yes', telegram: 'yes', discord: 'yes', slack: 'yes', email: 'unclear', wechat: 'unclear' } },
	{ name: 'Hermes Agent', color: '#8b5cf6', channels: { whatsapp: 'yes', telegram: 'yes', discord: 'yes', slack: 'yes', email: 'yes', wechat: 'unclear' } },
	{ name: 'Nanobot', color: '#10b981', channels: { whatsapp: 'unclear', telegram: 'yes', discord: 'yes', slack: 'yes', email: 'yes', wechat: 'yes' } },
	{ name: 'OpenHuman', color: '#06b6d4', channels: { whatsapp: 'yes', telegram: 'yes', discord: 'yes', slack: 'yes', email: 'yes', wechat: 'unclear' } },
	{ name: 'ZeroClaw', color: '#f59e0b', channels: { whatsapp: 'unclear', telegram: 'yes', discord: 'yes', slack: 'unclear', email: 'yes', wechat: 'unclear' } },
	{ name: 'QwenPaw', color: '#ef4444', channels: { whatsapp: 'unclear', telegram: 'yes', discord: 'yes', slack: 'unclear', email: 'unclear', wechat: 'yes' } },
];

const supportStyle: Record<Support, { bg: string; color: string; icon: string; label: string }> = {
	yes: { bg: '#10b98118', color: '#10b981', icon: '✅', label: 'есть' },
	no: { bg: '#ef444412', color: '#ef4444', icon: '❌', label: 'нет' },
	unclear: { bg: 'var(--bg-secondary)', color: 'var(--text-muted)', icon: '❔', label: 'не подтверждено' },
};

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
		marginBottom: '1.25rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	table: {
		width: '100%',
		borderCollapse: 'collapse' as const,
		minWidth: '520px',
	} as React.CSSProperties,
	th: {
		textAlign: 'left' as const,
		fontSize: '0.72rem',
		fontWeight: 700,
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		padding: '0.5rem 0.6rem',
		borderBottom: '1px solid var(--border)',
	} as React.CSSProperties,
	toolTh: (color: string) => ({
		textAlign: 'left' as const,
		fontSize: '0.85rem',
		fontWeight: 800,
		color,
		padding: '0.6rem',
		borderBottom: '1px solid var(--border)',
	} as React.CSSProperties),
	cell: (s: Support) => ({
		textAlign: 'center' as const,
		padding: '0.5rem',
		borderBottom: '1px solid var(--border)',
	} as React.CSSProperties),
	badge: (s: Support) => {
		const st = supportStyle[s];
		return {
			display: 'inline-flex',
			alignItems: 'center',
			justifyContent: 'center',
			width: '28px',
			height: '28px',
			borderRadius: '50%',
			background: st.bg,
			fontSize: '0.9rem',
		} as React.CSSProperties;
	},
	legend: {
		display: 'flex',
		gap: '1rem',
		flexWrap: 'wrap' as const,
		marginTop: '1rem',
	} as React.CSSProperties,
	legendItem: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.3rem',
		fontSize: '0.75rem',
		color: 'var(--text-muted)',
	} as React.CSSProperties,
};

export default function ChannelMatrix() {
	const [hovered, setHovered] = useState<string | null>(null);

	return (
		<div style={css.wrap}>
			<div style={css.title}>🔌 Каналы: кто куда пишет</div>
			<div style={css.desc}>
				По README каждого проекта. «Не подтверждено» — значит README явно не заявляет поддержку, не то же самое, что «нет».
			</div>

			<table style={css.table}>
				<thead>
					<tr>
						<th style={css.th}>Инструмент</th>
						{channelIds.map((c) => (
							<th key={c} style={css.th}>{channelLabels[c]}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{tools.map((t) => (
						<tr key={t.name} onMouseEnter={() => setHovered(t.name)} onMouseLeave={() => setHovered(null)}>
							<td style={css.toolTh(t.color)}>{t.name}</td>
							{channelIds.map((c) => {
								const s = t.channels[c];
								return (
									<td key={c} style={css.cell(s)} title={supportStyle[s].label}>
										<span style={css.badge(s)}>{supportStyle[s].icon}</span>
									</td>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>

			<div style={css.legend}>
				{(Object.keys(supportStyle) as Support[]).map((s) => (
					<span key={s} style={css.legendItem}>{supportStyle[s].icon} {supportStyle[s].label}</span>
				))}
			</div>
		</div>
	);
}
