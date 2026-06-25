import { useState, useEffect, useMemo } from 'react';

// Конфиги моделей (близкие к реальным). type: 'gqa' — обычная формула с KV-головами;
// 'mla' — DeepSeek-style сжатый латент (Kimi/DeepSeek), кэшируется один вектор на слой.
// latent = kv_lora_rank(512) + rope(64) = 576.
const MODELS = [
	{ id: 'llama31-8b', name: 'Llama 3.1 8B', tag: 'GQA', type: 'gqa', layers: 32, kvHeads: 8, headDim: 128, latent: 0, params: 8 },
	{ id: 'qwen3-8b', name: 'Qwen3 8B', tag: 'GQA', type: 'gqa', layers: 36, kvHeads: 8, headDim: 128, latent: 0, params: 8 },
	{ id: 'qwen3-32b', name: 'Qwen3 32B', tag: 'GQA', type: 'gqa', layers: 64, kvHeads: 8, headDim: 128, latent: 0, params: 32 },
	{ id: 'qwen3-235b', name: 'Qwen3 235B-A22B (MoE)', tag: 'GQA', type: 'gqa', layers: 94, kvHeads: 4, headDim: 128, latent: 0, params: 235 },
	{ id: 'deepseek-v3', name: 'DeepSeek-V3 671B (MoE)', tag: 'MLA', type: 'mla', layers: 61, kvHeads: 0, headDim: 0, latent: 576, params: 671 },
	{ id: 'kimi-k25', name: 'Kimi K2.5 1T (MoE)', tag: 'MLA', type: 'mla', layers: 61, kvHeads: 0, headDim: 0, latent: 576, params: 1000 },
	{ id: 'llama2-7b', name: 'Llama 2 7B (старый)', tag: 'MHA', type: 'gqa', layers: 32, kvHeads: 32, headDim: 128, latent: 0, params: 7 },
];

const CTX_OPTS = [2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 1048576];
const BATCH_OPTS = [1, 4, 8, 16, 32, 64];
const DTYPES = [
	{ id: 'fp16', name: 'FP16', bytes: 2 },
	{ id: 'fp8', name: 'FP8', bytes: 1 },
	{ id: 'int4', name: 'INT4', bytes: 0.5 },
];

const GIB = 1024 ** 3;
const fmtCtx = (n: number) => (n >= 1048576 ? '1M' : `${n / 1024}K`);
const fmtGiB = (bytes: number) => {
	const g = bytes / GIB;
	if (g >= 1000) return `${(g / 1024).toFixed(2)} ТБ`;
	if (g >= 1) return `${g.toFixed(2)} ГБ`;
	return `${(bytes / (1024 * 1024)).toFixed(0)} МБ`;
};

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

const css = {
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.6 } as React.CSSProperties,
	field: { marginBottom: '1rem' } as React.CSSProperties,
	label: { fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.4rem', display: 'block' } as React.CSSProperties,
	select: { width: '100%', padding: '0.55rem 0.7rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: '0.85rem', fontFamily: 'inherit', fontWeight: 600 } as React.CSSProperties,
	chips: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' as const } as React.CSSProperties,
	chip: (active: boolean) => ({
		padding: '0.4rem 0.7rem',
		borderRadius: '7px',
		border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
		background: active ? 'var(--accent-glow)' : 'var(--bg-secondary)',
		color: active ? 'var(--accent-light)' : 'var(--text)',
		fontSize: '0.78rem',
		fontWeight: 700,
		cursor: 'pointer',
		fontFamily: 'inherit',
		transition: 'all 0.15s ease',
	} as React.CSSProperties),
	result: { marginTop: '1.25rem', padding: '1.1rem 1.25rem', borderRadius: '10px', background: 'var(--accent-glow)', border: '1px solid var(--accent)' } as React.CSSProperties,
	bigVal: { fontSize: '2rem', fontWeight: 900, color: 'var(--accent-light)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' } as React.CSSProperties,
	bigLabel: { fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginTop: '0.2rem' } as React.CSSProperties,
	breakdown: { marginTop: '1rem', display: 'flex', flexDirection: 'column' as const, gap: '0.5rem' } as React.CSSProperties,
	bRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.82rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)' } as React.CSSProperties,
	bLabel: { color: 'var(--text-muted)', fontWeight: 600 } as React.CSSProperties,
	bVal: (color?: string) => ({ fontWeight: 800, color: color || 'var(--text)', fontVariantNumeric: 'tabular-nums' } as React.CSSProperties),
	formula: { marginTop: '1rem', padding: '0.75rem 0.9rem', borderRadius: '8px', background: 'var(--code-bg, var(--bg-secondary))', border: '1px solid var(--border)', fontSize: '0.74rem', color: 'var(--text-secondary)', fontFamily: 'ui-monospace, monospace', lineHeight: 1.6, overflowX: 'auto' as const } as React.CSSProperties,
	mlaNote: { marginTop: '0.6rem', fontSize: '0.78rem', color: '#10b981', fontWeight: 600 } as React.CSSProperties,
};

export default function KvCacheCalculator() {
	const [modelId, setModelId] = useState(MODELS[0].id);
	const [ctx, setCtx] = useState(8192);
	const [batch, setBatch] = useState(1);
	const [dtypeId, setDtypeId] = useState('fp16');
	const mobile = useIsMobile();

	const model = MODELS.find((m) => m.id === modelId)!;
	const dtype = DTYPES.find((d) => d.id === dtypeId)!;
	const isMla = model.type === 'mla';

	const { perToken, perReq, total, weights, ratio } = useMemo(() => {
		const perToken = isMla
			? model.layers * model.latent * dtype.bytes // MLA: один сжатый латент на слой
			: 2 * model.layers * model.kvHeads * model.headDim * dtype.bytes; // K + V
		const perReq = perToken * ctx;
		const total = perReq * batch;
		const weights = model.params * 1e9 * 2; // веса в fp16
		return { perToken, perReq, total, weights, ratio: total / weights };
	}, [model, dtype, ctx, batch, isMla]);

	return (
		<div style={{ ...css.wrap, ...(mobile ? { padding: '1rem', margin: '1.25em 0' } : {}) }}>
			<div style={css.title}>🧰 Калькулятор VRAM под KV-кэш</div>
			<div style={css.desc}>
				Покрути параметры и посмотри, сколько памяти сожрёт кэш. Формула — та же, что в движках инференса
				(конфиги моделей — близкие к реальным). Сравни GQA-модели с MLA (Kimi, DeepSeek) — разница в разы.
			</div>

			<div style={css.field}>
				<label style={css.label}>Модель</label>
				<select style={css.select} value={modelId} onChange={(e) => setModelId(e.target.value)}>
					{MODELS.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.tag}</option>)}
				</select>
			</div>

			<div style={css.field}>
				<label style={css.label}>Длина контекста</label>
				<div style={css.chips}>
					{CTX_OPTS.map((c) => <button key={c} style={css.chip(ctx === c)} onClick={() => setCtx(c)}>{fmtCtx(c)}</button>)}
				</div>
			</div>

			<div style={css.field}>
				<label style={css.label}>Batch (параллельных запросов)</label>
				<div style={css.chips}>
					{BATCH_OPTS.map((b) => <button key={b} style={css.chip(batch === b)} onClick={() => setBatch(b)}>{b}</button>)}
				</div>
			</div>

			<div style={css.field}>
				<label style={css.label}>Точность кэша</label>
				<div style={css.chips}>
					{DTYPES.map((d) => <button key={d.id} style={css.chip(dtypeId === d.id)} onClick={() => setDtypeId(d.id)}>{d.name}</button>)}
				</div>
			</div>

			<div style={css.result}>
				<div style={css.bigVal}>{fmtGiB(total)}</div>
				<div style={css.bigLabel}>KV-кэш на {batch} запрос{batch === 1 ? '' : 'ов'} · контекст {fmtCtx(ctx)}</div>

				<div style={css.breakdown}>
					<div style={css.bRow}>
						<span style={css.bLabel}>На 1 токен</span>
						<span style={css.bVal()}>{fmtGiB(perToken)}</span>
					</div>
					<div style={css.bRow}>
						<span style={css.bLabel}>На 1 запрос ({fmtCtx(ctx)})</span>
						<span style={css.bVal()}>{fmtGiB(perReq)}</span>
					</div>
					<div style={css.bRow}>
						<span style={css.bLabel}>Вес модели (fp16)</span>
						<span style={css.bVal()}>{fmtGiB(weights)}</span>
					</div>
					<div style={css.bRow}>
						<span style={css.bLabel}>Кэш / вес модели</span>
						<span style={css.bVal(ratio >= 1 ? '#ef4444' : '#10b981')}>{(ratio * 100).toFixed(ratio < 0.1 ? 1 : 0)}%</span>
					</div>
				</div>

				<div style={css.formula}>
					{isMla
						? `слои(${model.layers}) × латент(${model.latent}) × контекст(${ctx}) × batch(${batch}) × ${dtype.bytes} байт`
						: `2 × слои(${model.layers}) × kv_голов(${model.kvHeads}) × head_dim(${model.headDim}) × контекст(${ctx}) × batch(${batch}) × ${dtype.bytes} байт`}
				</div>
				{isMla && <div style={css.mlaNote}>⚡ MLA сжимает все K/V в один латент — поэтому кэш у 1T-модели меньше, чем у Llama 70B</div>}
			</div>
		</div>
	);
}
