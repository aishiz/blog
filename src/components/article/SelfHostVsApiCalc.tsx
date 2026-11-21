import { useState } from 'react';

// Калькулятор «Свои GPU vs API»: учитывает реальную суточную утилизацию (ночью и в выходные
// трафик падает, а счётчик аренды GPU тикает 24/7) и оверхед на MLOps/поддержку.

function fmtUsd(n: number) {
	if (n >= 1000) return `$${Math.round(n).toLocaleString('ru-RU')}`;
	return `$${n.toFixed(0)}`;
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
	grid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
		gap: '0.75rem',
		marginBottom: '1rem',
	} as React.CSSProperties,
	ctrl: {
		padding: '0.7rem 0.85rem',
		borderRadius: '9px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '0.3rem',
	} as React.CSSProperties,
	head: { display: 'flex', justifyContent: 'space-between', fontSize: '0.77rem', fontWeight: 700, color: 'var(--text)' } as React.CSSProperties,
	cards: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
		gap: '0.75rem',
		marginBottom: '1rem',
	} as React.CSSProperties,
	card: (border: string) =>
		({
			padding: '0.85rem 0.95rem',
			borderRadius: '10px',
			background: 'var(--bg-secondary)',
			border: `1px solid ${border}`,
		}) as React.CSSProperties,
	cLabel: { fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' as const, color: 'var(--text-muted)', letterSpacing: '0.04em' } as React.CSSProperties,
	cVal: { fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)', margin: '0.2rem 0' } as React.CSSProperties,
	cSub: { fontSize: '0.77rem', color: 'var(--text-secondary)', lineHeight: 1.45 } as React.CSSProperties,
	verdict: (selfWins: boolean) =>
		({
			padding: '0.8rem 0.95rem',
			borderRadius: '9px',
			background: 'var(--bg-secondary)',
			border: `1px solid ${selfWins ? 'var(--cat-tools)' : 'var(--accent-yellow)'}`,
			fontSize: '0.85rem',
			color: 'var(--text)',
			lineHeight: 1.6,
		}) as React.CSSProperties,
	note: { marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 } as React.CSSProperties,
};

export default function SelfHostVsApiCalc() {
	const [tokensPerDayM, setTokensPerDayM] = useState(40); // млн токенов в день (in + out)
	const [apiBlended, setApiBlended] = useState(1.2); // $ за 1M blended-токенов
	const [gpuHourly, setGpuHourly] = useState(2.8); // $/час за 1×H100 (облако)
	const [gpuCount, setGpuCount] = useState(4); // кол-во GPU (например 4×H100 под 70B-235B MoE)
	const [mlopsMonthly, setMlopsMonthly] = useState(4000); // доля инженеров/инфры в $/мес

	const monthlyTokensM = tokensPerDayM * 30;
	const apiMonthly = monthlyTokensM * apiBlended;

	// Железо тикает 730 часов в месяц независимо от того, спят ли юзеры ночью
	const gpuMonthly = gpuCount * gpuHourly * 730;
	const selfMonthly = gpuMonthly + mlopsMonthly;

	// Оценочная ёмкость кластера (условно ~1 200 tok/s на H100 на батче с vLLM/SGLang -> ~103M tok/день на GPU)
	const clusterCapMPerDay = gpuCount * 100;
	const utilizationPct = Math.min(100, Math.round((tokensPerDayM / clusterCapMPerDay) * 100));
	const effectivePerM = selfMonthly / Math.max(1, monthlyTokensM);
	const breakEvenMPerDay = selfMonthly / (30 * apiBlended);

	const overloaded = tokensPerDayM > clusterCapMPerDay;
	const selfWins = !overloaded && selfMonthly < apiMonthly;

	return (
		<div style={css.wrap}>
			<div style={css.title}>⚖️ Свои GPU (vLLM/SGLang) против API: точка безубыточности</div>
			<div style={css.desc}>
				На слайдах свои GPU всегда дешевле API, потому что их считают при 100% загрузке 24/7. Покрути реальный объём
				токенов, цену API и долю MLOps — увидишь, где экономика реально переворачивается.
			</div>

			<div style={css.grid}>
				<div style={css.ctrl}>
					<div style={css.head}>
						<span>Объём трафика / день</span>
						<code>{tokensPerDayM}M tok</code>
					</div>
					<input type="range" min={5} max={350} step={5} value={tokensPerDayM} onChange={(e) => setTokensPerDayM(Number(e.target.value))} />
				</div>
				<div style={css.ctrl}>
					<div style={css.head}>
						<span>Blended-цена API / 1M</span>
						<code>${apiBlended.toFixed(2)}</code>
					</div>
					<input type="range" min={0.2} max={5.0} step={0.1} value={apiBlended} onChange={(e) => setApiBlended(Number(e.target.value))} />
				</div>
				<div style={css.ctrl}>
					<div style={css.head}>
						<span>Кластер (× H100)</span>
						<code>{gpuCount} GPU</code>
					</div>
					<input type="range" min={1} max={8} step={1} value={gpuCount} onChange={(e) => setGpuCount(Number(e.target.value))} />
				</div>
				<div style={css.ctrl}>
					<div style={css.head}>
						<span>Аренда 1×H100 / час</span>
						<code>${gpuHourly.toFixed(1)}</code>
					</div>
					<input type="range" min={1.5} max={4.5} step={0.1} value={gpuHourly} onChange={(e) => setGpuHourly(Number(e.target.value))} />
				</div>
				<div style={css.ctrl}>
					<div style={css.head}>
						<span>MLOps + инфра / мес</span>
						<code>{fmtUsd(mlopsMonthly)}</code>
					</div>
					<input type="range" min={0} max={12000} step={500} value={mlopsMonthly} onChange={(e) => setMlopsMonthly(Number(e.target.value))} />
				</div>
			</div>

			<div style={css.cards}>
				<div style={css.card(!selfWins && !overloaded ? 'var(--cat-tools)' : 'var(--border)')}>
					<div style={css.cLabel}>Платим по API</div>
					<div style={css.cVal}>{fmtUsd(apiMonthly)} / мес</div>
					<div style={css.cSub}>
						Эффективная цена: <strong>${apiBlended.toFixed(2)} / 1M</strong>. Ноль простоев ночью, мгновенный скейл на пиках.
					</div>
				</div>

				<div style={css.card(overloaded ? 'var(--accent-magenta)' : selfWins ? 'var(--cat-tools)' : 'var(--border)')}>
					<div style={css.cLabel}>Свой кластер ({gpuCount}×H100)</div>
					<div style={css.cVal}>{fmtUsd(selfMonthly)} / мес</div>
					<div style={css.cSub}>
						Железо {fmtUsd(gpuMonthly)} + MLOps {fmtUsd(mlopsMonthly)}. Эффективно:{' '}
						<strong>${effectivePerM.toFixed(2)} / 1M</strong> (утилизация ~{utilizationPct}%).
					</div>
				</div>
			</div>

			<div style={css.verdict(selfWins)}>
				{overloaded ? (
					<>
						🔥 <strong>Кластер захлёбывается!</strong> {gpuCount}×H100 в таком режиме вытянут ~{clusterCapMPerDay}M
						токенов/день без деградации задержки. Добавь GPU — и пересчитай точку безубыточности.
					</>
				) : selfWins ? (
					<>
						✅ <strong>Свои GPU отбиваются:</strong> экономия <strong>{fmtUsd(apiMonthly - selfMonthly)}/мес</strong>{' '}
						(−{Math.round((1 - selfMonthly / apiMonthly) * 100)}%). Точка безубыточности для этого сетапа —{' '}
						<strong>{Math.ceil(breakEvenMPerDay)}M токенов/день</strong>.
					</>
				) : (
					<>
						💡 <strong>API пока дешевле</strong> на <strong>{fmtUsd(selfMonthly - apiMonthly)}/мес</strong>. При загрузке{' '}
						{utilizationPct}% ты платишь за простаивающий кремний. Свой кластер начнёт отбиваться от{' '}
						<strong>~{Math.ceil(breakEvenMPerDay)}M токенов/день</strong> — если, конечно, тебя не гонит в on-prem
						безопасность и 152-ФЗ.
					</>
				)}
			</div>

			<div style={css.note}>
				Расчёт предполагает среднюю пропускную способность ~1 150 tok/s на H100 (порядка 100M токенов/день на GPU при
				нормальном SLA без очередей). В реальности для пикового дневного трафика запас по GPU часто нужен 2× от
				среднесуточного.
			</div>
		</div>
	);
}
