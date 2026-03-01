import { useState } from 'react';

const models = [
	{ name: 'LLaMA 3 8B', params: 8 },
	{ name: 'Mistral 7B', params: 7 },
	{ name: 'LLaMA 3 70B', params: 70 },
	{ name: 'Mixtral 8x7B (MoE)', params: 46.7 },
	{ name: 'DeepSeek-V3 (MoE)', params: 671 },
	{ name: 'Qwen3.5-235B (MoE)', params: 235 },
];

const precisions = [
	{ label: 'FP32', bytes: 4 },
	{ label: 'FP16 / BF16', bytes: 2 },
	{ label: 'INT8', bytes: 1 },
	{ label: 'INT4', bytes: 0.5 },
];

export default function VramCalculator() {
	const [modelIdx, setModelIdx] = useState(2);
	const [precIdx, setPrecIdx] = useState(0);

	const model = models[modelIdx];
	const prec = precisions[precIdx];
	const vram = (model.params * prec.bytes).toFixed(1);

	return (
		<div style={{
			margin: '1.75em 0',
			padding: '1.5rem',
			borderRadius: '12px',
			border: '1px solid var(--border)',
			background: 'var(--bg-card)',
		}}>
			<div style={{
				fontSize: '0.85rem',
				fontWeight: 700,
				color: 'var(--accent-light)',
				textTransform: 'uppercase' as const,
				letterSpacing: '0.04em',
				marginBottom: '1rem',
			}}>
				🧮 Калькулятор VRAM
			</div>

			<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' as const, marginBottom: '1.25rem' }}>
				<div style={{ flex: '1', minWidth: '180px' }}>
					<label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
						Модель
					</label>
					<select
						value={modelIdx}
						onChange={(e) => setModelIdx(Number(e.target.value))}
						style={{
							width: '100%',
							padding: '0.55rem 0.75rem',
							borderRadius: '8px',
							border: '1px solid var(--border)',
							background: 'var(--bg-secondary)',
							color: 'var(--text)',
							fontSize: '0.9rem',
							fontFamily: 'inherit',
							cursor: 'pointer',
						}}
					>
						{models.map((m, i) => (
							<option key={i} value={i}>{m.name} ({m.params}B)</option>
						))}
					</select>
				</div>

				<div style={{ flex: '1', minWidth: '180px' }}>
					<label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
						Точность
					</label>
					<select
						value={precIdx}
						onChange={(e) => setPrecIdx(Number(e.target.value))}
						style={{
							width: '100%',
							padding: '0.55rem 0.75rem',
							borderRadius: '8px',
							border: '1px solid var(--border)',
							background: 'var(--bg-secondary)',
							color: 'var(--text)',
							fontSize: '0.9rem',
							fontFamily: 'inherit',
							cursor: 'pointer',
						}}
					>
						{precisions.map((p, i) => (
							<option key={i} value={i}>{p.label} ({p.bytes} байт/параметр)</option>
						))}
					</select>
				</div>
			</div>

			<div style={{
				display: 'flex',
				alignItems: 'baseline',
				gap: '0.5rem',
				padding: '1rem 1.25rem',
				borderRadius: '10px',
				background: 'var(--bg-secondary)',
				border: '1px solid var(--border)',
			}}>
				<span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Требуется VRAM:</span>
				<span style={{
					fontSize: '1.75rem',
					fontWeight: 900,
					background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
					WebkitBackgroundClip: 'text',
					WebkitTextFillColor: 'transparent',
					backgroundClip: 'text',
				}}>
					~{vram} ГБ
				</span>
			</div>

			<div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.6rem' }}>
				* Приблизительная оценка: параметры × байт/параметр. Реальное потребление может быть выше из-за KV-cache, активаций и overhead.
			</div>
		</div>
	);
}
