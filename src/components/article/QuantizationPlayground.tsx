import { useState } from 'react';

// Интерактивный симулятор линейной квантизации весов (FP32 -> INT8 / INT4 / INT2):
// Наглядно показывает, как один выброс (outlier) ломает per-tensor квантизацию
// и почему group-wise квантизация (AWQ/GPTQ) и сохранение MoE Router в FP16 спасают точность.

type Bits = 8 | 4 | 2;

const PRESETS: { label: string; weights: number[]; note: string }[] = [
	{
		label: 'Обычный слой (ровные веса)',
		weights: [-0.82, -0.41, -0.15, 0.08, 0.27, 0.54, 0.73, 0.91],
		note: 'Веса лежат компактно в [−1, 1] — даже INT4 передаёт их довольно чисто.',
	},
	{
		label: 'Слой с выбросом (Outlier!)',
		weights: [-0.32, -0.18, 0.09, 0.21, -0.25, 0.14, 0.36, 6.4],
		note: 'Один вес = 6.4 растянул шкалу scale в 15× — в per-tensor INT4 почти все мелкие веса схлопнулись в ноль!',
	},
	{
		label: 'MoE Router (логиты экспертов)',
		weights: [1.12, 1.09, 1.05, 0.98, 0.42, 0.31, -0.22, -0.85],
		note: 'Топ-2 эксперта отличаются на 0.03 (1.12 vs 1.09). Агрессивная квантизация уравнивает их и ломает выбор эксперта!',
	},
];

function quantizeBlock(vals: number[], bits: Bits) {
	const qMax = Math.pow(2, bits - 1) - 1; // 127, 7, 1 (для симметричной signed; для 2-бит возьмём асимметричный шаг)
	const levels = Math.pow(2, bits) - 1; // 255, 15, 3
	const min = Math.min(...vals);
	const max = Math.max(...vals);
	const scale = (max - min) / levels || 1e-6;

	return vals.map((w) => {
		const q = Math.round((w - min) / scale);
		const deq = min + q * scale;
		const err = Math.abs(w - deq);
		return { orig: w, q: q - Math.floor(levels / 2), deq, err, qMax };
	});
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
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 } as React.CSSProperties,
	row: { display: 'flex', gap: '0.45rem', flexWrap: 'wrap' as const, marginBottom: '0.9rem' } as React.CSSProperties,
	chip: (active: boolean) =>
		({
			padding: '0.36rem 0.74rem',
			borderRadius: '8px',
			border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
			background: active ? 'var(--bg-secondary)' : 'transparent',
			color: active ? 'var(--text)' : 'var(--text-secondary)',
			fontSize: '0.78rem',
			fontWeight: 700,
			cursor: 'pointer',
		}) as React.CSSProperties,
	controls: {
		display: 'flex',
		flexWrap: 'wrap' as const,
		gap: '0.75rem 1.25rem',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: '0.75rem 0.9rem',
		borderRadius: '9px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		marginBottom: '1rem',
	} as React.CSSProperties,
	toggle: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', cursor: 'pointer' } as React.CSSProperties,
	grid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
		gap: '0.55rem',
		marginBottom: '0.9rem',
	} as React.CSSProperties,
	cell: (highErr: boolean) =>
		({
			padding: '0.55rem 0.65rem',
			borderRadius: '8px',
			background: 'var(--bg-secondary)',
			border: `1px solid ${highErr ? 'var(--accent-magenta)' : 'var(--border)'}`,
			fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
			fontSize: '0.75rem',
		}) as React.CSSProperties,
	summary: (bad: boolean) =>
		({
			padding: '0.75rem 0.9rem',
			borderRadius: '9px',
			background: 'var(--bg-secondary)',
			border: `1px solid ${bad ? 'var(--accent-magenta)' : 'var(--cat-tools)'}`,
			fontSize: '0.84rem',
			color: 'var(--text)',
			lineHeight: 1.55,
		}) as React.CSSProperties,
};

export default function QuantizationPlayground() {
	const [presetIdx, setPresetIdx] = useState(1);
	const [bits, setBits] = useState<Bits>(4);
	const [groupWise, setGroupWise] = useState(false);

	const preset = PRESETS[presetIdx];
	const items = groupWise
		? [...quantizeBlock(preset.weights.slice(0, 4), bits), ...quantizeBlock(preset.weights.slice(4), bits)]
		: quantizeBlock(preset.weights, bits);

	const mse = items.reduce((a, x) => a + x.err * x.err, 0) / items.length;
	const maxErr = Math.max(...items.map((x) => x.err));
	const collapsedZeros = items.filter((x) => Math.abs(x.orig) > 0.05 && Math.abs(x.deq - items[0].deq) < 1e-6).length;

	return (
		<div style={css.wrap}>
			<div style={css.title}>🔬 Живой квантизатор весов: посмотри, как outlier ломает INT4</div>
			<div style={css.desc}>
				Выбери слой с выбросом (<code>6.4</code>), поставь <strong>INT4</strong> и посмотри на ошибку мелких весов — а
				потом включи <strong>Group-wise (блоки по 4)</strong>, как это делают AWQ и GPTQ.
			</div>

			<div style={css.row}>
				{PRESETS.map((p, i) => (
					<button key={p.label} style={css.chip(i === presetIdx)} onClick={() => setPresetIdx(i)}>
						{p.label}
					</button>
				))}
			</div>

			<div style={css.controls}>
				<div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
					{([8, 4, 2] as Bits[]).map((b) => (
						<button key={b} style={css.chip(bits === b)} onClick={() => setBits(b)}>
							INT{b} ({Math.pow(2, b)} уровней)
						</button>
					))}
				</div>
				<label style={css.toggle}>
					<input type="checkbox" checked={groupWise} onChange={(e) => setGroupWise(e.target.checked)} />
					Group-wise (отдельный scale на каждую четвёрку)
				</label>
			</div>

			<div style={css.grid}>
				{items.map((x, i) => {
					const highErr = x.err > 0.15;
					return (
						<div key={i} style={css.cell(highErr)}>
							<div style={{ color: 'var(--text-muted)', fontSize: '0.67rem' }}>
								w[{i}] {groupWise ? (i < 4 ? '· гр.1' : '· гр.2') : ''}
							</div>
							<div style={{ color: 'var(--text)', fontWeight: 700, marginTop: '0.15rem' }}>
								{x.orig.toFixed(2)} → <span style={{ color: highErr ? 'var(--accent-magenta)' : 'var(--cat-tools)' }}>{x.deq.toFixed(2)}</span>
							</div>
							<div style={{ color: highErr ? 'var(--accent-magenta)' : 'var(--text-muted)', fontSize: '0.7rem' }}>
								Δ = {x.err.toFixed(3)}
							</div>
						</div>
					);
				})}
			</div>

			<div style={css.summary(maxErr > 0.18)}>
				<strong>MSE: {mse.toFixed(4)}</strong> · Макс. ошибка: <strong>{maxErr.toFixed(3)}</strong>.{' '}
				{preset.note}{' '}
				{groupWise && presetIdx === 1 && (
					<>
						✅ <strong>Group-wise спас первую четвёрку:</strong> выброс <code>6.4</code> остался во второй группе и
						перестал портить scale для остальных весов!
					</>
				)}
				{!groupWise && presetIdx === 1 && bits <= 4 && collapsedZeros >= 3 && (
					<>
						⚠️ Включи <strong>Group-wise</strong> — увидишь, как ошибка на первых четырёх весах упадёт на порядок.
					</>
				)}
			</div>
		</div>
	);
}
