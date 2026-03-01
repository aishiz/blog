import { useState, useEffect } from 'react';

type Platform = {
	id: string;
	label: string;
	icon: string;
};

type Support = 'full' | 'partial' | 'wsl' | 'none';

type EngineSupport = {
	engine: string;
	color: string;
	platforms: Record<string, { support: Support; note: string }>;
};

const platforms: Platform[] = [
	{ id: 'linux_nvidia', label: 'Linux NVIDIA', icon: '🐧' },
	{ id: 'linux_amd', label: 'Linux AMD', icon: '🔴' },
	{ id: 'win_native', label: 'Windows', icon: '🪟' },
	{ id: 'win_wsl', label: 'WSL2', icon: '🐧🪟' },
	{ id: 'mac_arm', label: 'macOS M-серия', icon: '🍎' },
	{ id: 'mac_intel', label: 'macOS Intel', icon: '💻' },
];

const engines: EngineSupport[] = [
	{
		engine: 'Ollama', color: '#ec4899',
		platforms: {
			linux_nvidia: { support: 'full', note: 'CUDA, автоопределение GPU' },
			linux_amd: { support: 'full', note: 'ROCm' },
			win_native: { support: 'full', note: 'Нативный установщик' },
			win_wsl: { support: 'full', note: 'Через WSL2' },
			mac_arm: { support: 'full', note: 'Metal ускорение' },
			mac_intel: { support: 'partial', note: 'Только CPU' },
		},
	},
	{
		engine: 'llama.cpp', color: '#7c3aed',
		platforms: {
			linux_nvidia: { support: 'full', note: 'CUDA' },
			linux_amd: { support: 'full', note: 'ROCm / Vulkan' },
			win_native: { support: 'full', note: 'CUDA / Vulkan' },
			win_wsl: { support: 'full', note: 'Через WSL2' },
			mac_arm: { support: 'full', note: 'Metal (по умолчанию)' },
			mac_intel: { support: 'partial', note: 'Только CPU' },
		},
	},
	{
		engine: 'vLLM', color: '#3b82f6',
		platforms: {
			linux_nvidia: { support: 'full', note: 'Production-ready' },
			linux_amd: { support: 'full', note: 'ROCm 6.2' },
			win_native: { support: 'none', note: 'Не поддерживается' },
			win_wsl: { support: 'wsl', note: 'Через WSL2 + CUDA' },
			mac_arm: { support: 'partial', note: 'Только CPU, экспериментально' },
			mac_intel: { support: 'none', note: 'Не поддерживается' },
		},
	},
	{
		engine: 'SGLang', color: '#10b981',
		platforms: {
			linux_nvidia: { support: 'full', note: 'Production-ready' },
			linux_amd: { support: 'full', note: 'ROCm (MI300X)' },
			win_native: { support: 'none', note: 'Не поддерживается' },
			win_wsl: { support: 'wsl', note: 'Через WSL2 + CUDA' },
			mac_arm: { support: 'none', note: 'Не поддерживается' },
			mac_intel: { support: 'none', note: 'Не поддерживается' },
		},
	},
	{
		engine: 'LMDeploy', color: '#06b6d4',
		platforms: {
			linux_nvidia: { support: 'full', note: 'TurboMind C++' },
			linux_amd: { support: 'none', note: 'Не поддерживается' },
			win_native: { support: 'none', note: 'Не поддерживается' },
			win_wsl: { support: 'wsl', note: 'Через WSL2 + CUDA' },
			mac_arm: { support: 'none', note: 'Не поддерживается' },
			mac_intel: { support: 'none', note: 'Не поддерживается' },
		},
	},
];

const supportStyles: Record<Support, { bg: string; color: string; label: string; icon: string }> = {
	full: { bg: '#10b98118', color: '#10b981', label: 'Полная', icon: '✅' },
	partial: { bg: '#f59e0b18', color: '#f59e0b', label: 'Частичная', icon: '⚠️' },
	wsl: { bg: '#3b82f618', color: '#3b82f6', label: 'WSL2', icon: '🐧' },
	none: { bg: '#ef444412', color: '#ef4444', label: 'Нет', icon: '❌' },
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
	filters: {
		display: 'flex',
		gap: '0.4rem',
		flexWrap: 'wrap' as const,
		marginBottom: '1.25rem',
	} as React.CSSProperties,
	filterBtn: (active: boolean) => ({
		padding: '0.4rem 0.85rem',
		borderRadius: '100px',
		border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
		background: active ? 'var(--accent-glow)' : 'var(--bg-secondary)',
		color: active ? 'var(--accent-light)' : 'var(--text-muted)',
		fontSize: '0.78rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
		transition: 'all 0.2s ease',
	} as React.CSSProperties),
	grid: {
		display: 'grid',
		gap: '0.5rem',
	} as React.CSSProperties,
	row: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		padding: '0.75rem 1rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		transition: 'all 0.3s ease',
	} as React.CSSProperties,
	rowHidden: {
		opacity: 0,
		height: 0,
		padding: 0,
		margin: 0,
		overflow: 'hidden',
		border: 'none',
	} as React.CSSProperties,
	engineName: (color: string) => ({
		width: '100px',
		flexShrink: 0,
		fontSize: '0.88rem',
		fontWeight: 800,
		color: color,
	} as React.CSSProperties),
	badges: {
		display: 'flex',
		gap: '0.35rem',
		flexWrap: 'wrap' as const,
		flex: 1,
	} as React.CSSProperties,
	badge: (support: Support) => {
		const s = supportStyles[support];
		return {
			display: 'inline-flex',
			alignItems: 'center',
			gap: '0.3rem',
			padding: '0.25rem 0.6rem',
			borderRadius: '100px',
			fontSize: '0.7rem',
			fontWeight: 600,
			background: s.bg,
			color: s.color,
			border: `1px solid ${s.color}22`,
			whiteSpace: 'nowrap' as const,
		} as React.CSSProperties;
	},
	tooltip: {
		fontSize: '0.72rem',
		color: 'var(--text-muted)',
		fontStyle: 'italic' as const,
	} as React.CSSProperties,
	legend: {
		display: 'flex',
		gap: '1rem',
		flexWrap: 'wrap' as const,
		marginTop: '1rem',
		paddingTop: '0.75rem',
		borderTop: '1px solid var(--border)',
	} as React.CSSProperties,
	legendItem: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.3rem',
		fontSize: '0.72rem',
		color: 'var(--text-muted)',
		fontWeight: 500,
	} as React.CSSProperties,
};

function useIsMobile(breakpoint = 480) {
	const [m, setM] = useState(false);
	useEffect(() => {
		const check = () => setM(window.innerWidth <= breakpoint);
		check();
		window.addEventListener('resize', check, { passive: true });
		return () => window.removeEventListener('resize', check);
	}, [breakpoint]);
	return m;
}

export default function PlatformMatrix() {
	const [selected, setSelected] = useState<string | null>(null);
	const mobile = useIsMobile();

	const filteredPlatforms = selected ? platforms.filter((p) => p.id === selected) : platforms;

	return (
		<div style={{ ...css.wrap, ...(mobile ? { padding: '1rem', margin: '1.25em 0' } : {}) }}>
			<div style={css.title}>🖥️ Совместимость платформ</div>
			<div style={css.desc}>
				Выберите вашу платформу, чтобы увидеть какие движки доступны. Или смотрите всё сразу.
			</div>

			<div style={css.filters}>
				<button style={css.filterBtn(!selected)} onClick={() => setSelected(null)}>
					Все
				</button>
				{platforms.map((p) => (
					<button key={p.id} style={css.filterBtn(selected === p.id)} onClick={() => setSelected(selected === p.id ? null : p.id)}>
						{p.icon} {mobile ? '' : p.label}
						{mobile && <span style={{ fontSize: '0.68rem' }}>{p.label.split(' ').pop()}</span>}
					</button>
				))}
			</div>

			<div style={css.grid}>
				{engines.map((eng) => {
					const relevantPlatforms = filteredPlatforms.map((p) => ({
						...p,
						...eng.platforms[p.id],
					}));

					const hasAnySupport = selected
						? eng.platforms[selected]?.support !== 'none'
						: true;

					return (
						<div
							key={eng.engine}
							style={{
								...css.row,
								...(hasAnySupport ? {} : { opacity: 0.4 }),
								...(mobile ? { flexDirection: 'column' as const, alignItems: 'flex-start', gap: '0.5rem', padding: '0.65rem 0.75rem' } : {}),
							}}
						>
							<span style={{ ...css.engineName(eng.color), ...(mobile ? { width: 'auto', fontSize: '0.82rem' } : {}) }}>{eng.engine}</span>
							<div style={css.badges}>
								{relevantPlatforms.map((p) => (
									<span key={p.id} style={css.badge(p.support)} title={p.note}>
										{supportStyles[p.support].icon} {mobile ? '' : p.label + ' '}<span style={css.tooltip}>({p.note})</span>
									</span>
								))}
							</div>
						</div>
					);
				})}
			</div>

			<div style={css.legend}>
				{Object.entries(supportStyles).map(([key, val]) => (
					<span key={key} style={css.legendItem}>
						{val.icon} {val.label}
					</span>
				))}
			</div>
		</div>
	);
}
