import { useState } from 'react';

// Интерактивный симулятор Disaggregated Prefill/Decode + KVBM в NVIDIA Dynamo:
// Показывает конфликт compute-bound (prefill) и memory-bound (decode) на кластере из 8 GPU
// и как разбивка на отдельные пулы P:D + выгрузка KVBM меняют TTFT, ITL и ёмкость.

const TOTAL_GPUS = 8;

const WORKLOADS = [
	{ id: 'rag', label: 'RAG / длинный промпт', promptK: 24, outTok: 250 },
	{ id: 'chat', label: 'Обычный чат', promptK: 3, outTok: 450 },
	{ id: 'reason', label: 'Reasoning-модель', promptK: 4, outTok: 2200 },
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
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 } as React.CSSProperties,
	pills: { display: 'flex', gap: '0.45rem', flexWrap: 'wrap' as const, marginBottom: '0.9rem' } as React.CSSProperties,
	chip: (active: boolean) =>
		({
			padding: '0.36rem 0.75rem',
			borderRadius: '8px',
			border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
			background: active ? 'var(--bg-secondary)' : 'transparent',
			color: active ? 'var(--text)' : 'var(--text-secondary)',
			fontSize: '0.78rem',
			fontWeight: 700,
			cursor: 'pointer',
		}) as React.CSSProperties,
	controls: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
		gap: '0.75rem',
		padding: '0.8rem 0.9rem',
		borderRadius: '9px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		marginBottom: '1rem',
	} as React.CSSProperties,
	ctrl: { display: 'flex', flexDirection: 'column' as const, gap: '0.3rem' } as React.CSSProperties,
	cHead: { display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)' } as React.CSSProperties,
	gpus: { display: 'flex', gap: '0.35rem', flexWrap: 'wrap' as const, marginBottom: '1rem' } as React.CSSProperties,
	gpuBox: (role: 'P' | 'D') =>
		({
			flex: '1 1 68px',
			padding: '0.5rem 0.35rem',
			borderRadius: '8px',
			textAlign: 'center' as const,
			fontSize: '0.74rem',
			fontWeight: 800,
			border: `1px solid ${role === 'P' ? 'var(--accent)' : 'var(--cat-fundament)'}`,
			background: 'var(--bg-secondary)',
			color: role === 'P' ? 'var(--accent-light)' : 'var(--cat-fundament)',
		}) as React.CSSProperties,
	cards: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
		gap: '0.75rem',
		marginBottom: '0.85rem',
	} as React.CSSProperties,
	card: (border: string) =>
		({
			padding: '0.85rem 0.95rem',
			borderRadius: '10px',
			background: 'var(--bg-secondary)',
			border: `1px solid ${border}`,
		}) as React.CSSProperties,
	verdict: {
		padding: '0.75rem 0.9rem',
		borderRadius: '9px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--cat-tools)',
		fontSize: '0.84rem',
		color: 'var(--text)',
		lineHeight: 1.55,
	} as React.CSSProperties,
};

export default function DisaggPoolSim() {
	const [wlIdx, setWlIdx] = useState(0);
	const [prefillGpus, setPrefillGpus] = useState(4);
	const [kvbmOn, setKvbmOn] = useState(true);

	const wl = WORKLOADS[wlIdx];
	const decodeGpus = TOTAL_GPUS - prefillGpus;

	// Оценочная физика: в Colocated длинный prefill стопорит decode-батч (interference)
	const prefillLoad = wl.promptK * 28; // условная тяжесть prefill (мс на 1 GPU)
	const decodeLoad = wl.outTok * 0.045; // условная тяжесть decode на 1 GPU

	const colocatedTtft = Math.round((prefillLoad / (TOTAL_GPUS * 0.55)) * (kvbmOn ? 0.85 : 1.15));
	const colocatedItl = Math.round(18 + wl.promptK * 1.45); // decode дёргается из-за prefill-спайков!

	const disaggTtft = Math.round((prefillLoad / prefillGpus) * (kvbmOn ? 0.65 : 1.0) + 14); // +14 мс NIXL transfer
	const disaggItl = Math.round(11 + decodeLoad / decodeGpus);

	// Рекомендуемый баланс для выбранного профиля
	const idealP = wl.id === 'rag' ? 5 : wl.id === 'reason' ? 2 : 3;
	const maxSessions = Math.round((kvbmOn ? 3.4 : 1.0) * (decodeGpus * 48) / Math.max(1, wl.promptK / 4));

	return (
		<div style={css.wrap}>
			<div style={css.title}>🎻 Симулятор Disaggregated Prefill / Decode (кластер 8×GPU)</div>
			<div style={css.desc}>
				Выбери тип нагрузки и распредели 8 GPU между пулом <strong>Prefill</strong> и пулом <strong>Decode</strong>.
				Обрати внимание на ITL (задержку между токенами): в обычном режиме длинный промпт «замораживает» генерацию соседям.
			</div>

			<div style={css.pills}>
				{WORKLOADS.map((w, i) => (
					<button
						key={w.id}
						style={css.chip(i === wlIdx)}
						onClick={() => {
							setWlIdx(i);
							setPrefillGpus(w.id === 'rag' ? 5 : w.id === 'reason' ? 2 : 3);
						}}
					>
						{w.label} ({w.promptK}K in / {w.outTok} out)
					</button>
				))}
			</div>

			<div style={css.controls}>
				<div style={css.ctrl}>
					<div style={css.cHead}>
						<span>Разбивка 8 GPU (Prefill : Decode)</span>
						<code>
							{prefillGpus}P : {decodeGpus}D
						</code>
					</div>
					<input
						type="range"
						min={1}
						max={7}
						step={1}
						value={prefillGpus}
						onChange={(e) => setPrefillGpus(Number(e.target.value))}
					/>
				</div>
				<div style={css.ctrl}>
					<label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', cursor: 'pointer', marginTop: '0.2rem' }}>
						<input type="checkbox" checked={kvbmOn} onChange={(e) => setKvbmOn(e.target.checked)} />
						KVBM offload (GPU HBM → CPU RAM → SSD)
					</label>
					<div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
						Активных длинных сессий в кэше: <strong>~{maxSessions}</strong>
					</div>
				</div>
			</div>

			<div style={css.gpus}>
				{Array.from({ length: TOTAL_GPUS }).map((_, i) => {
					const role = i < prefillGpus ? 'P' : 'D';
					return (
						<div key={i} style={css.gpuBox(role)}>
							GPU {i + 1}
							<div style={{ fontSize: '0.66rem', opacity: 0.85 }}>{role === 'P' ? 'PREFILL' : 'DECODE'}</div>
						</div>
					);
				})}
			</div>

			<div style={css.cards}>
				<div style={css.card('var(--border-light)')}>
					<div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
						Обычный Colocated (8 GPU делают всё)
					</div>
					<div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', margin: '0.3rem 0' }}>
						TTFT ~{colocatedTtft} мс · ITL ~{colocatedItl} мс/tok
					</div>
					<div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
						Каждый новый длинный промпт отбирает FLOPS и дёргает стрим у остальных юзеров.
					</div>
				</div>

				<div style={css.card('var(--cat-tools)')}>
					<div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--cat-tools)' }}>
						Dynamo Disaggregated ({prefillGpus}P : {decodeGpus}D)
					</div>
					<div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', margin: '0.3rem 0' }}>
						TTFT ~{disaggTtft} мс · ITL ~{disaggItl} мс/tok
					</div>
					<div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
						KV-кэш уезжает по NIXL в Decode-пул — стрим ровный, без просадок на спайках prefill.
					</div>
				</div>
			</div>

			<div style={css.verdict}>
				Под профиль «{wl.label}» Planner в Dynamo стремится к раскладке около{' '}
				<strong>
					{idealP}P : {TOTAL_GPUS - idealP}D
				</strong>
				.{' '}
				{prefillGpus === idealP
					? '✅ Ты попал точно в оптимум для этой нагрузки!'
					: prefillGpus < idealP
						? 'Попробуй перекинуть ещё GPU в Prefill — сейчас очередь prefill раздувает TTFT.'
						: 'Prefill с запасом, но Decode-пул узковат — перекинь пару карт в Decode, чтобы ускорить генерацию.'}
			</div>
		</div>
	);
}
