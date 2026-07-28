import { useMemo, useState } from 'react';

interface Preset {
	key: string;
	label: string;
	n: number;
}

const PRESETS: Preset[] = [
	{ key: '1k', label: '1K токенов', n: 1024 },
	{ key: '4k', label: '4K токенов', n: 4096 },
	{ key: '16k', label: '16K токенов', n: 16384 },
	{ key: '64k', label: '64K токенов', n: 65536 },
];

function formatBytes(bytes: number): string {
	if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} ГБ`;
	if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} МБ`;
	if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
	return `${bytes} Б`;
}

// Naive attention материализует в HBM две N×N-матрицы (S = QKᵀ и P = softmax(S)) в fp16 —
// это точная формула, не оценка. FlashAttention никогда не пишет S/P в HBM: они существуют
// только внутри блока в SRAM, поэтому их вклад в HBM-трафик не растёт с длиной контекста.
function naiveIntermediateBytes(n: number): number {
	return 2 * n * n * 2;
}

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
	presetRow: {
		display: 'flex',
		gap: '0.5rem',
		marginBottom: '1.25rem',
		flexWrap: 'wrap' as const,
	} as React.CSSProperties,
	presetBtn: (active: boolean) => ({
		padding: '0.4rem 0.9rem',
		borderRadius: '100px',
		border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
		background: active ? 'color-mix(in srgb, var(--accent) 14%, var(--bg-card))' : 'var(--bg-secondary)',
		color: active ? 'var(--accent-light)' : 'var(--text-secondary)',
		fontSize: '0.8rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
	} as React.CSSProperties),
	barRow: {
		marginBottom: '0.9rem',
	} as React.CSSProperties,
	barLabel: {
		display: 'flex',
		justifyContent: 'space-between',
		fontSize: '0.82rem',
		color: 'var(--text-secondary)',
		marginBottom: '0.35rem',
	} as React.CSSProperties,
	barTrack: {
		height: '10px',
		borderRadius: '100px',
		background: 'var(--bg-secondary)',
		overflow: 'hidden',
		border: '1px solid var(--border)',
	} as React.CSSProperties,
	barFill: (pct: number, color: string) => ({
		height: '100%',
		width: `${pct}%`,
		background: color,
		borderRadius: '100px',
		transition: 'width 0.25s ease',
	} as React.CSSProperties),
	citation: {
		marginTop: '1.1rem',
		padding: '0.9rem 1rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		fontSize: '0.85rem',
		color: 'var(--text-muted)',
		lineHeight: 1.6,
	} as React.CSSProperties,
};

export default function BenchmarkCompare() {
	const [presetKey, setPresetKey] = useState('4k');
	const preset = PRESETS.find((p) => p.key === presetKey)!;

	const naiveBytes = useMemo(() => naiveIntermediateBytes(preset.n), [preset.n]);
	const maxBytes = useMemo(() => naiveIntermediateBytes(PRESETS[PRESETS.length - 1].n), []);
	const naivePct = (naiveBytes / maxBytes) * 100;

	return (
		<div style={css.wrap}>
			<div style={css.title}>📊 Память: naive vs FlashAttention</div>
			<div style={css.desc}>
				Naive attention материализует в HBM две полные N×N-матрицы (S и P) в fp16 — это считается точно по формуле, не на глаз. FlashAttention их туда никогда не пишет: они живут только в SRAM, блок за блоком, поэтому этот объём не растёт с длиной контекста вообще.
			</div>

			<div style={css.presetRow}>
				{PRESETS.map((p) => (
					<button key={p.key} style={css.presetBtn(p.key === presetKey)} onClick={() => setPresetKey(p.key)}>{p.label}</button>
				))}
			</div>

			<div style={css.barRow}>
				<div style={css.barLabel}>
					<span>Naive: S + P в HBM</span>
					<span style={{ fontWeight: 700, color: 'var(--text)' }}>{formatBytes(naiveBytes)}</span>
				</div>
				<div style={css.barTrack}><div style={css.barFill(naivePct, 'var(--accent)')} /></div>
			</div>

			<div style={css.barRow}>
				<div style={css.barLabel}>
					<span>FlashAttention: S + P в HBM</span>
					<span style={{ fontWeight: 700, color: 'var(--text)' }}>0 Б (только SRAM)</span>
				</div>
				<div style={css.barTrack}><div style={css.barFill(0.6, 'var(--accent-secondary)')} /></div>
			</div>

			<div style={css.citation}>
				Квадратичный рост выше — точный расчёт по формуле (2 матрицы × N² × 2 байта), не бенчмарк. А по данным авторов FlashAttention: на GPT-2 (seq len 1K) — ускорение end-to-end обучения и заметно больший доступный контекст при том же бюджете VRAM (источник: <a href="https://github.com/Dao-AILab/flash-attention" target="_blank" rel="noopener">Dao-AILab/flash-attention</a>).
			</div>
		</div>
	);
}
