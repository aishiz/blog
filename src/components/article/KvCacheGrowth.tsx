import { useState, useEffect } from 'react';

// Llama 3 8B: 32 слоя, kv_dim = 8 KV-голов × 128 = 1024, fp16 (2 байта).
// Память на 1 токен = 2(K+V) × 32 × 1024 × 2 = 131072 байт = 0.125 МиБ.
const PER_TOKEN_MIB = (2 * 32 * 1024 * 2) / (1024 * 1024); // 0.125
const WEIGHTS_GIB = 16; // 8B параметров × 2 байта
const GPU_GIB = 24; // например RTX 4090 / A10
const MAX_CTX = 131072; // 128K

function useIsMobile(breakpoint = 560) {
	const [m, setM] = useState(false);
	useEffect(() => {
		const check = () => setM(window.innerWidth <= breakpoint);
		check();
		window.addEventListener('resize', check, { passive: true });
		return () => window.removeEventListener('resize', check);
	}, [breakpoint]);
	return m;
}

const fmtCtx = (n: number) => (n >= 1024 ? `${(n / 1024).toFixed(n % 1024 === 0 ? 0 : 1)}K` : `${n}`);

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
	layout: {
		display: 'grid',
		gridTemplateColumns: '120px 1fr',
		gap: '1.5rem',
		alignItems: 'stretch',
	} as React.CSSProperties,
	tank: (oom: boolean) => ({
		position: 'relative' as const,
		height: '240px',
		borderRadius: '10px',
		border: `2px solid ${oom ? '#ef4444' : 'var(--border)'}`,
		background: 'var(--bg-secondary)',
		display: 'flex',
		flexDirection: 'column-reverse' as const,
		overflow: 'hidden' as const,
		transition: 'border-color 0.3s ease',
	} as React.CSSProperties),
	seg: (h: number, bg: string) => ({
		height: `${h}%`,
		background: bg,
		transition: 'height 0.3s ease',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: '0.62rem',
		fontWeight: 700,
		color: '#fff',
		overflow: 'hidden' as const,
		whiteSpace: 'nowrap' as const,
	} as React.CSSProperties),
	capLine: {
		position: 'absolute' as const,
		left: 0,
		right: 0,
		top: 0,
		borderTop: '2px dashed #ef4444',
		fontSize: '0.6rem',
		color: '#ef4444',
		fontWeight: 700,
		padding: '2px 4px',
	} as React.CSSProperties,
	right: {
		display: 'flex',
		flexDirection: 'column' as const,
		justifyContent: 'center',
		gap: '0.9rem',
	} as React.CSSProperties,
	statRow: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'baseline',
		gap: '0.75rem',
		paddingBottom: '0.5rem',
		borderBottom: '1px solid var(--border)',
	} as React.CSSProperties,
	statLabel: { fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 } as React.CSSProperties,
	statVal: (color: string) => ({
		fontSize: '1.05rem',
		fontWeight: 800,
		color,
		fontVariantNumeric: 'tabular-nums',
	} as React.CSSProperties),
	oomBanner: {
		marginTop: '0.25rem',
		padding: '0.5rem 0.75rem',
		borderRadius: '8px',
		background: '#ef444418',
		border: '1px solid #ef444466',
		color: '#ef4444',
		fontSize: '0.8rem',
		fontWeight: 700,
	} as React.CSSProperties,
	controls: {
		display: 'flex',
		gap: '0.75rem',
		marginTop: '1.4rem',
		alignItems: 'center',
		flexWrap: 'wrap' as const,
	} as React.CSSProperties,
	slider: { flex: 1, minWidth: '140px', accentColor: 'var(--accent)' } as React.CSSProperties,
	btn: (active?: boolean) => ({
		padding: '0.5rem 1rem',
		borderRadius: '8px',
		border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
		background: active ? 'var(--accent-glow)' : 'var(--bg-secondary)',
		color: active ? 'var(--accent-light)' : 'var(--text)',
		fontSize: '0.82rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
		transition: 'all 0.2s ease',
	} as React.CSSProperties),
};

export default function KvCacheGrowth() {
	const [ctx, setCtx] = useState(8192);
	const [auto, setAuto] = useState(true);
	const mobile = useIsMobile();

	useEffect(() => {
		if (!auto) return;
		const id = setInterval(() => {
			setCtx((c) => (c >= MAX_CTX ? 1024 : Math.min(MAX_CTX, c + 4096)));
		}, 350);
		return () => clearInterval(id);
	}, [auto]);

	const cacheGiB = (ctx * PER_TOKEN_MIB) / 1024;
	const totalGiB = WEIGHTS_GIB + cacheGiB;
	const oom = totalGiB > GPU_GIB;

	// Высоты сегментов в % от GPU (визуально режем по 100%).
	const weightsH = Math.min(100, (WEIGHTS_GIB / GPU_GIB) * 100);
	const cacheH = Math.min(100 - weightsH, (cacheGiB / GPU_GIB) * 100);

	return (
		<div style={{ ...css.wrap, ...(mobile ? { padding: '1rem', margin: '1.25em 0' } : {}) }}>
			<div style={css.title}>📈 KV-кэш сжирает VRAM</div>
			<div style={css.desc}>
				Llama 3 8B на видеокарте 24 ГБ. Вес модели (16 ГБ) — фиксированный, KV-кэш растёт{' '}
				<strong>линейно</strong> с длиной контекста. Тяни ползунок: при ~64K токенов кэш забивает остаток
				памяти и всё падает в <strong>OOM</strong> — а это всего один запрос.
			</div>

			<div style={{ ...css.layout, ...(mobile ? { gridTemplateColumns: '90px 1fr', gap: '1rem' } : {}) }}>
				<div style={css.tank(oom)}>
					<div style={css.seg(weightsH, 'linear-gradient(180deg, #475569, #334155)')}>вес 16 ГБ</div>
					<div style={css.seg(cacheH, oom ? 'linear-gradient(180deg, #ef4444, #b91c1c)' : 'linear-gradient(180deg, #10b981, #059669)')}>
						{cacheH > 12 ? `кэш ${cacheGiB.toFixed(1)}` : ''}
					</div>
					<div style={css.capLine}>24 ГБ</div>
				</div>

				<div style={css.right}>
					<div style={css.statRow}>
						<span style={css.statLabel}>Контекст</span>
						<span style={css.statVal('var(--accent-light)')}>{fmtCtx(ctx)} токенов</span>
					</div>
					<div style={css.statRow}>
						<span style={css.statLabel}>KV-кэш</span>
						<span style={css.statVal(oom ? '#ef4444' : '#10b981')}>{cacheGiB.toFixed(2)} ГБ</span>
					</div>
					<div style={css.statRow}>
						<span style={css.statLabel}>Вес + кэш</span>
						<span style={css.statVal(oom ? '#ef4444' : 'var(--text)')}>{totalGiB.toFixed(1)} / 24 ГБ</span>
					</div>
					{oom ? (
						<div style={css.oomBanner}>💥 OOM! Не влезает в 24 ГБ — нужна карта побольше или сжатие кэша</div>
					) : (
						<div style={{ ...css.oomBanner, background: '#10b98118', borderColor: '#10b98166', color: '#10b981' }}>
							✅ Влезает, запас {(GPU_GIB - totalGiB).toFixed(1)} ГБ
						</div>
					)}
				</div>
			</div>

			<div style={css.controls}>
				<input
					type="range"
					min={1024}
					max={MAX_CTX}
					step={1024}
					value={ctx}
					onChange={(e) => { setCtx(Number(e.target.value)); setAuto(false); }}
					style={css.slider}
				/>
				<button style={css.btn(auto)} onClick={() => setAuto(!auto)}>{auto ? '⏸ Пауза' : '▶ Авто'}</button>
			</div>
		</div>
	);
}
