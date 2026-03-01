import { useState } from 'react';

type GPU = { name: string; vram: number; bf16_tflops: number; tier: string };
type Model = { name: string; params: number; activeParams: number; isMoE: boolean };
type Engine = { name: string; color: string; overhead: number };

const gpus: GPU[] = [
	{ name: 'RTX 3090 (24GB)', vram: 24, bf16_tflops: 71, tier: 'consumer' },
	{ name: 'RTX 4090 (24GB)', vram: 24, bf16_tflops: 165, tier: 'consumer' },
	{ name: 'A100 80GB', vram: 80, bf16_tflops: 312, tier: 'datacenter' },
	{ name: 'H100 80GB', vram: 80, bf16_tflops: 990, tier: 'datacenter' },
	{ name: 'H200 141GB', vram: 141, bf16_tflops: 990, tier: 'datacenter' },
];

const models: Model[] = [
	{ name: 'Qwen3-8B', params: 8, activeParams: 8, isMoE: false },
	{ name: 'Llama 3.1 8B', params: 8, activeParams: 8, isMoE: false },
	{ name: 'Qwen3-32B', params: 32, activeParams: 32, isMoE: false },
	{ name: 'Qwen3-72B', params: 72, activeParams: 72, isMoE: false },
	{ name: 'Qwen3-235B-A22B (MoE)', params: 235, activeParams: 22, isMoE: true },
	{ name: 'DeepSeek-V3 (MoE)', params: 671, activeParams: 37, isMoE: true },
];

const enginesList: Engine[] = [
	{ name: 'vLLM', color: '#3b82f6', overhead: 1.0 },
	{ name: 'SGLang', color: '#10b981', overhead: 1.05 },
	{ name: 'LMDeploy', color: '#06b6d4', overhead: 1.08 },
	{ name: 'llama.cpp', color: '#7c3aed', overhead: 0.7 },
	{ name: 'Ollama', color: '#ec4899', overhead: 0.65 },
];

const quantOptions = [
	{ label: 'FP16', bytes: 2, factor: 1.0 },
	{ label: 'FP8', bytes: 1, factor: 0.97 },
	{ label: 'INT8', bytes: 1, factor: 0.95 },
	{ label: 'INT4 (GPTQ/AWQ)', bytes: 0.5, factor: 0.88 },
	{ label: 'INT4 (GGUF Q4_K_M)', bytes: 0.5, factor: 0.85 },
];

function estimateThroughput(gpu: GPU, model: Model, quant: typeof quantOptions[0], engine: Engine, gpuCount: number): {
	fits: boolean;
	vramNeeded: number;
	vramAvailable: number;
	estimatedTPS: number;
	gpusNeeded: number;
} {
	const vramModel = model.params * quant.bytes;
	const vramOverhead = model.activeParams * 0.15;
	const vramNeeded = vramModel + vramOverhead;
	const vramAvailable = gpu.vram * gpuCount;
	const fits = vramNeeded <= vramAvailable;

	const computeParams = model.isMoE ? model.activeParams : model.params;
	const rawTPS = (gpu.bf16_tflops * 1000 * gpuCount) / (computeParams * 2 / quant.factor);
	const estimatedTPS = Math.round(rawTPS * engine.overhead * quant.factor * (fits ? 1 : 0.3));
	const gpusNeeded = Math.ceil(vramNeeded / gpu.vram);

	return { fits, vramNeeded: Math.round(vramNeeded), vramAvailable, estimatedTPS, gpusNeeded };
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
		marginBottom: '1.25rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	selectors: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
		gap: '0.75rem',
		marginBottom: '1.25rem',
	} as React.CSSProperties,
	selectGroup: {
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '0.3rem',
	} as React.CSSProperties,
	label: {
		fontSize: '0.75rem',
		fontWeight: 600,
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.04em',
	} as React.CSSProperties,
	select: {
		padding: '0.55rem 0.75rem',
		borderRadius: '8px',
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
		color: 'var(--text)',
		fontSize: '0.85rem',
		fontFamily: 'inherit',
		cursor: 'pointer',
	} as React.CSSProperties,
	results: {
		display: 'grid',
		gap: '0.5rem',
		marginTop: '0.5rem',
	} as React.CSSProperties,
	resultRow: (fits: boolean, color: string) => ({
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		padding: '0.85rem 1rem',
		borderRadius: '10px',
		border: `1px solid ${fits ? `${color}44` : '#ef444444'}`,
		background: fits ? `${color}08` : '#ef444408',
		transition: 'all 0.3s ease',
	} as React.CSSProperties),
	engineLabel: (color: string) => ({
		width: '90px',
		flexShrink: 0,
		fontSize: '0.88rem',
		fontWeight: 800,
		color: color,
	} as React.CSSProperties),
	tpsValue: (fits: boolean) => ({
		fontSize: '1.1rem',
		fontWeight: 900,
		color: fits ? 'var(--text)' : '#ef4444',
		fontFamily: "'JetBrains Mono', monospace",
		minWidth: '90px',
	} as React.CSSProperties),
	meta: {
		display: 'flex',
		gap: '0.75rem',
		flex: 1,
		flexWrap: 'wrap' as const,
	} as React.CSSProperties,
	metaTag: (color: string) => ({
		padding: '0.2rem 0.55rem',
		borderRadius: '100px',
		fontSize: '0.68rem',
		fontWeight: 600,
		background: `${color}15`,
		color: color,
		whiteSpace: 'nowrap' as const,
	} as React.CSSProperties),
	vramBar: {
		marginTop: '1.25rem',
		padding: '1rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
	} as React.CSSProperties,
	vramHeader: {
		display: 'flex',
		justifyContent: 'space-between',
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	vramLabel: {
		fontSize: '0.78rem',
		fontWeight: 600,
		color: 'var(--text-muted)',
	} as React.CSSProperties,
	vramValue: {
		fontSize: '0.78rem',
		fontWeight: 800,
		color: 'var(--accent-light)',
		fontFamily: "'JetBrains Mono', monospace",
	} as React.CSSProperties,
	vramTrack: {
		height: '12px',
		borderRadius: '6px',
		background: 'var(--bg-card)',
		border: '1px solid var(--border)',
		overflow: 'hidden',
		position: 'relative' as const,
	} as React.CSSProperties,
	vramFill: (pct: number, fits: boolean) => ({
		height: '100%',
		width: `${Math.min(pct, 100)}%`,
		borderRadius: '6px',
		background: fits
			? 'linear-gradient(90deg, #10b981, #3b82f6)'
			: 'linear-gradient(90deg, #f59e0b, #ef4444)',
		transition: 'width 0.6s ease',
	} as React.CSSProperties),
	disclaimer: {
		fontSize: '0.72rem',
		color: 'var(--text-muted)',
		marginTop: '0.75rem',
		lineHeight: 1.5,
	} as React.CSSProperties,
};

export default function ThroughputCalculator() {
	const [gpuIdx, setGpuIdx] = useState(3);
	const [modelIdx, setModelIdx] = useState(0);
	const [quantIdx, setQuantIdx] = useState(0);
	const [gpuCount, setGpuCount] = useState(1);

	const gpu = gpus[gpuIdx];
	const model = models[modelIdx];
	const quant = quantOptions[quantIdx];

	const estimates = enginesList.map((engine) => ({
		engine,
		...estimateThroughput(gpu, model, quant, engine, gpuCount),
	}));

	const vramNeeded = estimates[0].vramNeeded;
	const vramAvailable = estimates[0].vramAvailable;
	const vramPct = (vramNeeded / vramAvailable) * 100;
	const fits = vramNeeded <= vramAvailable;

	return (
		<div style={css.wrap}>
			<div style={css.title}>⚡ Калькулятор производительности</div>
			<div style={css.desc}>
				Выберите модель, GPU и квантизацию — получите оценку throughput для каждого движка и требования к VRAM.
			</div>

			<div style={css.selectors}>
				<div style={css.selectGroup}>
					<span style={css.label}>Модель</span>
					<select style={css.select} value={modelIdx} onChange={(e) => setModelIdx(Number(e.target.value))}>
						{models.map((m, i) => (
							<option key={i} value={i}>{m.name}</option>
						))}
					</select>
				</div>
				<div style={css.selectGroup}>
					<span style={css.label}>GPU</span>
					<select style={css.select} value={gpuIdx} onChange={(e) => setGpuIdx(Number(e.target.value))}>
						{gpus.map((g, i) => (
							<option key={i} value={i}>{g.name}</option>
						))}
					</select>
				</div>
				<div style={css.selectGroup}>
					<span style={css.label}>Количество GPU</span>
					<select style={css.select} value={gpuCount} onChange={(e) => setGpuCount(Number(e.target.value))}>
						{[1, 2, 4, 8].map((n) => (
							<option key={n} value={n}>{n}× GPU</option>
						))}
					</select>
				</div>
				<div style={css.selectGroup}>
					<span style={css.label}>Квантизация</span>
					<select style={css.select} value={quantIdx} onChange={(e) => setQuantIdx(Number(e.target.value))}>
						{quantOptions.map((q, i) => (
							<option key={i} value={i}>{q.label}</option>
						))}
					</select>
				</div>
			</div>

			<div style={css.vramBar}>
				<div style={css.vramHeader}>
					<span style={css.vramLabel}>
						VRAM: {vramNeeded} ГБ нужно / {vramAvailable} ГБ доступно
						{!fits && ` (нужно минимум ${estimates[0].gpusNeeded}× GPU)`}
					</span>
					<span style={css.vramValue}>{vramPct.toFixed(0)}%</span>
				</div>
				<div style={css.vramTrack}>
					<div style={css.vramFill(vramPct, fits)} />
				</div>
			</div>

			<div style={{ ...css.results, marginTop: '1.25rem' }}>
				{estimates
					.sort((a, b) => b.estimatedTPS - a.estimatedTPS)
					.map(({ engine, fits: f, estimatedTPS, gpusNeeded }) => (
						<div key={engine.name} style={css.resultRow(f, engine.color)}>
							<span style={css.engineLabel(engine.color)}>{engine.name}</span>
							<span style={css.tpsValue(f)}>~{estimatedTPS.toLocaleString()} tok/s</span>
							<div style={css.meta}>
								{f ? (
									<span style={css.metaTag('#10b981')}>✅ Влезает</span>
								) : (
									<span style={css.metaTag('#ef4444')}>❌ Нужно {gpusNeeded}× GPU</span>
								)}
								{model.isMoE && (
									<span style={css.metaTag('#7c3aed')}>MoE: {model.activeParams}B активных</span>
								)}
							</div>
						</div>
					))}
			</div>

			<div style={css.disclaimer}>
				* Приблизительная оценка на основе TFLOPS GPU, размера модели и типичного overhead движка. Реальная производительность зависит от batch size, длины контекста, конфигурации и нагрузки.
			</div>
		</div>
	);
}
