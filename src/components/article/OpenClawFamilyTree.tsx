import { useState } from 'react';

type Node = {
	name: string;
	stars: string;
	lang: string;
	license: string;
	diff: string;
	color: string;
};

const root: Node = {
	name: 'OpenClaw',
	stars: '384 388',
	lang: 'TypeScript',
	license: 'открытый код (GitHub помечает как "Other", не классический MIT)',
	diff: 'корень — родился 24 ноября 2025, сейчас под некоммерческим OpenClaw Foundation',
	color: '#ff6b2b',
};

const children: Node[] = [
	{ name: 'Hermes Agent', stars: '221 624', lang: 'Python', license: 'MIT', diff: 'не форк кода, а отдельный продукт Nous Research в той же нише — с придачей ~78 coding-скиллов', color: '#8b5cf6' },
	{ name: 'Nanobot', stars: '46 322', lang: 'Python', license: 'MIT', diff: 'README прямо называет себя «знакомой точкой входа, если пришёл из OpenClaw» — минималистичное ядро вместо полного фреймворка', color: '#10b981' },
	{ name: 'OpenHuman', stars: '35 546', lang: 'Rust', license: 'GPL-3.0', diff: 'десктоп-приложение, а не headless gateway — строит knowledge-graph из почты и документов, а не просто отвечает в чатах', color: '#06b6d4' },
	{ name: 'ZeroClaw', stars: '32 418', lang: 'Rust', license: 'MIT/Apache-2.0 (по README; GitHub определяет только Apache-2.0)', diff: 'один бинарник ~3.4МБ, работает на Raspberry Pi — и, в отличие от остальных, вообще не упоминает OpenClaw в README', color: '#f59e0b' },
	{ name: 'QwenPaw', stars: '29 408', lang: 'Python', license: 'Apache-2.0', diff: 'на стеке Alibaba Qwen/AgentScope — китайские каналы (DingTalk, WeChat, QQ) вместо западных', color: '#ef4444' },
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
		marginBottom: '1.25rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	rootBox: (color: string) => ({
		padding: '1rem 1.25rem',
		borderRadius: '10px',
		border: `2px solid ${color}`,
		background: `${color}12`,
		marginBottom: '1rem',
		textAlign: 'center' as const,
	} as React.CSSProperties),
	rootName: (color: string) => ({
		fontSize: '1.3rem',
		fontWeight: 900,
		color,
	} as React.CSSProperties),
	branchGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
		gap: '0.6rem',
	} as React.CSSProperties,
	branch: (color: string, active: boolean) => ({
		padding: '0.85rem 1rem',
		borderRadius: '10px',
		border: `1px solid ${active ? color : 'var(--border)'}`,
		background: active ? `${color}14` : 'var(--bg-secondary)',
		cursor: 'pointer',
		textAlign: 'left' as const,
		transition: 'all 0.15s ease',
	} as React.CSSProperties),
	branchName: (color: string) => ({
		fontSize: '0.95rem',
		fontWeight: 800,
		color,
		marginBottom: '0.2rem',
	} as React.CSSProperties),
	branchStars: {
		fontSize: '0.72rem',
		color: 'var(--text-muted)',
	} as React.CSSProperties,
	detail: {
		marginTop: '1rem',
		padding: '0.9rem 1rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		fontSize: '0.86rem',
		color: 'var(--text-secondary)',
		lineHeight: 1.6,
	} as React.CSSProperties,
};

export default function OpenClawFamilyTree() {
	const [activeIdx, setActiveIdx] = useState<number | null>(null);
	const active = activeIdx === null ? root : children[activeIdx];

	return (
		<div style={css.wrap}>
			<div style={css.title}>🌳 OpenClaw и его экосистема</div>
			<div style={css.desc}>
				Не буквальные форки кода (кроме явных случаев вроде Nanobot) — скорее волна продуктов, вышедших в ту же нишу почти одновременно, часть явно ссылается на OpenClaw как на отправную точку. Клик по узлу — детали.
			</div>

			<div style={css.rootBox(root.color)} onClick={() => setActiveIdx(null)}>
				<div style={css.rootName(root.color)}>{root.name}</div>
				<div style={css.branchStars}>⭐ {root.stars}</div>
			</div>

			<div style={css.branchGrid}>
				{children.map((c, i) => (
					<div key={c.name} style={css.branch(c.color, activeIdx === i)} onClick={() => setActiveIdx(i)}>
						<div style={css.branchName(c.color)}>{c.name}</div>
						<div style={css.branchStars}>⭐ {c.stars} · {c.lang}</div>
					</div>
				))}
			</div>

			<div style={css.detail}>
				<strong style={{ color: 'var(--text)' }}>{active.name}</strong> — {active.license}. {active.diff}
			</div>
		</div>
	);
}
