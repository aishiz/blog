import { useState } from 'react';

type View = 'wins' | 'doubts';

const domains = [
	{ name: 'Brand & Marketing', win: true },
	{ name: 'Reference-Based Design', win: true },
	{ name: 'Data & Analytics', win: true },
	{ name: 'Consumer Product', win: true },
	{ name: 'Simulations', win: true },
	{ name: 'Content Creation Tools', win: true },
	{ name: 'Gaming', win: false },
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
	bigNumber: {
		fontSize: '2.2rem',
		fontWeight: 900,
		color: '#22c55e',
		lineHeight: 1,
	} as React.CSSProperties,
	bigNumberLabel: {
		fontSize: '0.8rem',
		color: 'var(--text-muted)',
		marginBottom: '1rem',
	} as React.CSSProperties,
	domainGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
		gap: '0.5rem',
	} as React.CSSProperties,
	domainBadge: (win: boolean) => ({
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
		padding: '0.55rem 0.8rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: `1px solid ${win ? '#22c55e40' : '#ef444440'}`,
		fontSize: '0.78rem',
		fontWeight: 600,
		color: 'var(--text)',
	} as React.CSSProperties),
	doubtBlock: {
		marginBottom: '1rem',
	} as React.CSSProperties,
	doubtLabel: {
		fontSize: '0.8rem',
		fontWeight: 700,
		color: 'var(--text)',
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	barRow: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.6rem',
		marginBottom: '0.4rem',
	} as React.CSSProperties,
	barLabel: {
		width: '150px',
		flexShrink: 0,
		fontSize: '0.78rem',
		color: 'var(--text-muted)',
	} as React.CSSProperties,
	barTrack: {
		flex: 1,
		height: '18px',
		borderRadius: '4px',
		background: 'var(--bg-secondary)',
		overflow: 'hidden',
		position: 'relative' as const,
	} as React.CSSProperties,
	barFill: (pct: number, color: string) => ({
		width: `${pct}%`,
		height: '100%',
		background: color,
	} as React.CSSProperties),
	barValue: {
		width: '48px',
		flexShrink: 0,
		fontSize: '0.78rem',
		fontWeight: 700,
		color: 'var(--text)',
		textAlign: 'right' as const,
	} as React.CSSProperties,
	note: {
		marginTop: '0.75rem',
		fontSize: '0.78rem',
		color: 'var(--text-muted)',
		lineHeight: 1.55,
		fontStyle: 'italic' as const,
	} as React.CSSProperties,
};

export default function ReceptionPanel() {
	const [view, setView] = useState<View>('wins');

	return (
		<div style={css.wrap}>
			<div style={css.title}>📡 Как отреагировал мир</div>
			<div style={css.desc}>Две стороны одного релиза — переключи вкладку.</div>

			<div style={css.tabs}>
				<button style={css.tab(view === 'wins', '#22c55e')} onClick={() => setView('wins')}>🏆 Успехи</button>
				<button style={css.tab(view === 'doubts', '#ef4444')} onClick={() => setView('doubts')}>🔍 Скепсис</button>
			</div>

			{view === 'wins' && (
				<div>
					<div style={css.bigNumber}>1679</div>
					<div style={css.bigNumberLabel}>очков на Frontend Code Arena — #1, обошёл Claude Fable 5, прыжок с 18-го места у Kimi K2.6</div>
					<div style={css.domainGrid}>
						{domains.map((d) => (
							<div key={d.name} style={css.domainBadge(d.win)}>
								<span>{d.win ? '🥇' : '🥈'}</span>
								<span>{d.name}</span>
							</div>
						))}
					</div>
					<div style={css.note}>Плюс HF: 4000+ лайков за первые 30 минут после выкладки весов, топ трендов — по словам CEO платформы, «самый быстрый рост релиза, который видела платформа».</div>
				</div>
			)}

			{view === 'doubts' && (
				<div>
					<div style={css.doubtBlock}>
						<div style={css.doubtLabel}>Precision на security-бенчмарке Semgrep (guided-prompt)</div>
						<div style={css.barRow}>
							<span style={css.barLabel}>Kimi K3</span>
							<div style={css.barTrack}><div style={css.barFill(68, '#ef4444')} /></div>
							<span style={css.barValue}>0.68</span>
						</div>
						<div style={css.barRow}>
							<span style={css.barLabel}>Остальные модели теста</span>
							<div style={css.barTrack}><div style={css.barFill(88, '#22c55e')} /></div>
							<span style={css.barValue}>0.84–0.91</span>
						</div>
					</div>
					<div style={css.doubtBlock}>
						<div style={css.doubtLabel}>F1 на самом крупном enterprise-репозитории теста</div>
						<div style={css.barRow}>
							<span style={css.barLabel}>Kimi K3</span>
							<div style={css.barTrack}><div style={css.barFill(6, '#ef4444')} /></div>
							<span style={css.barValue}>~6%</span>
						</div>
						<div style={css.barRow}>
							<span style={css.barLabel}>GLM и фронтир-модели</span>
							<div style={css.barTrack}><div style={css.barFill(20, '#22c55e')} /></div>
							<span style={css.barValue}>~20%</span>
						</div>
					</div>
					<div style={css.note}>Отдельно — независимые наблюдения, что K3 иногда называет себя Claude (по одной оценке, ~1 из 10 диалогов) и воспроизводит паттерны форматирования Claude. Moonshot это не комментировала; прямых доказательств дистилляции нет, как и опровержения.</div>
				</div>
			)}
		</div>
	);
}
