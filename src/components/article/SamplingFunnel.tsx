import { useState, useEffect } from 'react';

// Иллюстративный размер словаря — как у большинства современных LLM
// (реальные варианты лежат в диапазоне ~30–150 тысяч токенов, см. текст статьи).
const VOCAB = 128_000;

type StageKey = 'vocab' | 'temp' | 'minp' | 'topk' | 'topp' | 'final';

const STAGES: { key: StageKey; label: string; color: string }[] = [
	{ key: 'vocab', label: 'Словарь', color: 'var(--text-muted)' },
	{ key: 'temp', label: 'После temperature', color: 'var(--accent-light)' },
	{ key: 'minp', label: 'После min_p', color: 'var(--accent-magenta)' },
	{ key: 'topk', label: 'После top_k', color: 'var(--accent-yellow-text)' },
	{ key: 'topp', label: 'После top_p', color: 'var(--accent-secondary)' },
	{ key: 'final', label: 'Выбран токен', color: 'var(--accent)' },
];

// Смоделированные числа кандидатов на каждой ступени — НЕ измерены на реальной модели
// (для этого нужны были бы логиты конкретного форвард-пасса). Подобраны так, чтобы
// честно показывать эффект каждой ручки при её параметрах: temperature не режет число
// кандидатов вообще, min_p режет тем агрессивнее, чем острее распределение после
// temperature, top_k — жёсткий потолок, top_p — довершает по накопленной массе.
type Preset = {
	id: string;
	name: string;
	color: string;
	temp: number;
	minP: number;
	topK: number; // 0 = выключен (дефолт vLLM)
	topP: number;
	counts: Record<StageKey, number>;
};

const PRESETS: Preset[] = [
	{
		id: 'code',
		name: 'код / детерминированно',
		color: '#22c55e',
		temp: 0.2,
		minP: 0.1,
		topK: 20,
		topP: 0.9,
		counts: { vocab: VOCAB, temp: VOCAB, minp: 15, topk: 15, topp: 6, final: 1 },
	},
	{
		id: 'balanced',
		name: 'сбалансированно',
		color: 'var(--accent-yellow-text)',
		temp: 0.7,
		minP: 0.05,
		topK: 50,
		topP: 0.95,
		counts: { vocab: VOCAB, temp: VOCAB, minp: 900, topk: 50, topp: 33, final: 1 },
	},
	{
		id: 'creative',
		name: 'творческий текст',
		color: 'var(--accent-magenta)',
		temp: 1.3,
		minP: 0.02,
		topK: 0,
		topP: 0.98,
		counts: { vocab: VOCAB, temp: VOCAB, minp: 8000, topk: 8000, topp: 4200, final: 1 },
	},
];

function useIsMobile(bp = 520) {
	const [m, setM] = useState(false);
	useEffect(() => {
		const c = () => setM(window.innerWidth <= bp);
		c();
		window.addEventListener('resize', c, { passive: true });
		return () => window.removeEventListener('resize', c);
	}, [bp]);
	return m;
}

// Ширина полоски — по логарифмической шкале: диапазон значений (1 … 128 000)
// слишком широк для линейной, там были бы не видны все ступени, кроме первой.
function barPct(count: number): number {
	const num = Math.log10(count + 1);
	const den = Math.log10(VOCAB + 1);
	return Math.min(100, Math.max(2, (num / den) * 100));
}

function fmt(n: number): string {
	return n.toLocaleString('ru-RU');
}

const css = {
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.1rem', lineHeight: 1.6 } as React.CSSProperties,
	order: { fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.7rem', marginBottom: '1.1rem', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' } as React.CSSProperties,
	tabs: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' as const, marginBottom: '1rem' } as React.CSSProperties,
	tab: (active: boolean, color: string) => ({
		padding: '0.45rem 0.9rem', borderRadius: '100px',
		border: `1px solid ${active ? color : 'var(--border)'}`,
		// не строим альфа-вариант через конкатенацию строки с цветом: часть цветов здесь —
		// CSS custom properties (var(--accent-...)), а не hex-литералы, «var(...)18» — невалидный CSS.
		background: active ? 'var(--accent-glow)' : 'var(--bg-secondary)',
		color: active ? color : 'var(--text-muted)',
		fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
	} as React.CSSProperties),
	presetNote: { fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 } as React.CSSProperties,
	params: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' } as React.CSSProperties,
	paramsMobile: { gridTemplateColumns: 'repeat(2, 1fr)' } as React.CSSProperties,
	param: { padding: '0.5rem 0.6rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', textAlign: 'center' as const } as React.CSSProperties,
	paramLabel: (color: string) => ({ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.03em', color, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' } as React.CSSProperties),
	paramVal: { fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)', marginTop: '0.15rem', fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties,
	stage: { marginBottom: '0.55rem' } as React.CSSProperties,
	stageHead: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.25rem', gap: '0.5rem' } as React.CSSProperties,
	stageLabel: (color: string) => ({ fontSize: '0.78rem', fontWeight: 700, color } as React.CSSProperties),
	stageCount: { fontSize: '0.8rem', fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' as const, whiteSpace: 'nowrap' as const } as React.CSSProperties,
	track: { height: '16px', borderRadius: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', overflow: 'hidden' } as React.CSSProperties,
	fill: (pct: number, color: string) => ({ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.25s ease' } as React.CSSProperties),
	tempCallout: {
		display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem', marginBottom: '0.55rem',
		fontSize: '0.74rem', color: 'var(--accent-light)', background: 'var(--accent-glow)',
		border: '1px solid var(--border)', borderRadius: '8px', padding: '0.4rem 0.6rem', lineHeight: 1.5,
	} as React.CSSProperties,
	note: { marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

export default function SamplingFunnel() {
	const [presetId, setPresetId] = useState(PRESETS[0].id);
	const mobile = useIsMobile();
	const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];

	return (
		<div style={css.wrap}>
			<div style={css.title}>🔻 Воронка сэмплинга целиком</div>
			<div style={css.desc}>
				Один шаг генерации — от полного словаря до одного выбранного токена. Ничего нового: это те же четыре
				ручки, только собранные в один конвейер, чтобы увидеть всю форму сразу. Числа кандидатов ниже —
				смоделированы для наглядности, а не измерены на реальном форвард-пассе: точные значения зависят от
				логитов конкретной модели на конкретном шаге, которых у нас нет. Порядок ручек и характер их эффекта —
				настоящие.
			</div>
			<div style={css.order}>порядок как в vLLM: словарь → temperature → min_p → top_k → top_p → 1 токен</div>

			<div style={css.tabs}>
				{PRESETS.map((p) => (
					<button key={p.id} style={css.tab(p.id === presetId, p.color)} onClick={() => setPresetId(p.id)}>
						{p.name}
					</button>
				))}
			</div>
			<div style={css.presetNote}>
				Пресеты иллюстративные — не production-конфиг, а пример того, как разный набор ручек по-разному режёт хвост.
			</div>

			<div style={{ ...css.params, ...(mobile ? css.paramsMobile : {}) }}>
				<div style={css.param}>
					<div style={css.paramLabel('var(--accent-light)')}>temperature</div>
					<div style={css.paramVal}>{preset.temp.toFixed(1)}</div>
				</div>
				<div style={css.param}>
					<div style={css.paramLabel('var(--accent-magenta)')}>min_p</div>
					<div style={css.paramVal}>{preset.minP.toFixed(2)}</div>
				</div>
				<div style={css.param}>
					<div style={css.paramLabel('var(--accent-yellow-text)')}>top_k</div>
					<div style={css.paramVal}>{preset.topK === 0 ? 'off' : preset.topK}</div>
				</div>
				<div style={css.param}>
					<div style={css.paramLabel('var(--accent-secondary)')}>top_p</div>
					<div style={css.paramVal}>{preset.topP.toFixed(2)}</div>
				</div>
			</div>

			{STAGES.map((s) => {
				const count = preset.counts[s.key];
				return (
					<div key={s.key}>
						<div style={css.stage}>
							<div style={css.stageHead}>
								<span style={css.stageLabel(s.color)}>{s.label}</span>
								<span style={css.stageCount}>{fmt(count)}{s.key === 'vocab' ? ' токенов' : ''}</span>
							</div>
							<div style={css.track}><div style={css.fill(barPct(count), s.color)} /></div>
						</div>
						{s.key === 'temp' && (
							<div style={css.tempCallout}>
								<span>⚠️</span>
								<span>
									Кандидатов ровно столько же, сколько в словаре — <strong>{fmt(count)}</strong>. Temperature
									переформовывает распределение (у кого-то вероятность выросла, у кого-то упала), но никого
									не выбрасывает. Резать хвост — работа min_p, top_k и top_p, которые идут дальше.
								</span>
							</div>
						)}
					</div>
				);
			})}

			<div style={css.note}>
				Размер словаря ({fmt(VOCAB)} токенов) — иллюстративный, ориентир по порядку величины для современных LLM.
				Числа кандидатов на каждой ступени — смоделированы для наглядности, а не измерены на реальном форвард-пассе:
				чтобы получить точные значения, нужны логиты конкретной модели на конкретном шаге. Но порядок ручек и то,
				какая из них на что похожа по эффекту — min_p подстраивается под форму распределения, top_k — жёсткий
				потолок по рангу, top_p — по накопленной вероятностной массе — реальные, из частей 1–3 этой статьи.
			</div>
		</div>
	);
}
