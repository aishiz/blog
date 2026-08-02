# «Ручки сэмплинга» — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Опубликовать статью `src/content/blog/sampling-knobs.mdx` — разбор ручек сэмплинга (temperature, top-k, top-p, min-p) с четырьмя интерактивными компонентами, кульминация — почему `temperature=0` не даёт детерминизма.

**Architecture:** Сначала четыре независимых React-компонента (каждый самодостаточен), потом статья, которая их импортирует, потом проверка в браузере. Компоненты идут первыми, потому что статья ссылается на то, что они показывают.

**Tech Stack:** Astro 5 + MDX, React 19 islands с `client:visible`, инлайновые стили через CSS-переменные темы. Никаких новых зависимостей.

## Global Constraints

Всё нижеследующее — проверенная фактура (факт-пасс 2026-08-02, чтение исходников vLLM/HF, arXiv API, локальный численный эксперимент) и правила проекта. Отклонение — дефект.

**Порядок применения ручек — САМОЕ ВАЖНОЕ:**
- **vLLM v1:** `temperature → min_p → top_k → top_p → один финальный softmax → сэмпл`. Источники: docstring `vllm/v1/sample/sampler.py:20-59`, код `sampler.py:276,282-283,286-291`; top-k перед top-p — `vllm/v1/sample/ops/topk_topp_sampler.py:367-408`; min_p argmax-инвариантен и потому стоит до обрезок — `vllm/v1/sample/logits_processor/builtin.py:47-49`.
- **HuggingFace transformers — ДРУГОЙ порядок:** `temperature → top_k → top_p → min_p` (min_p последним), `transformers/generation/utils.py:1302-1318`.
- «Интуитивный» порядок из туториалов (`top_k → top_p → min_p`) — это порядок HF, а не универсальная истина. Компоненты моделируют **порядок vLLM** и подписывают это.

**Формулы (как реализовано):**
- temperature — простое деление логитов: `logits / T` (`sampler.py:237`, HF `logits_process.py:302`).
- top-k — маскируется **строго меньшее**, чем k-е по величине значение; при точном равенстве выживает больше k токенов (`topk_topp_sampler.py:392-396`, HF `logits_process.py:591-595`).
- top-p — минимальный набор с кумулятивной массой ≥ p, **граничный токен включается**, топовый токен сохраняется всегда (`topk_topp_sampler.py:398-405`).
- min-p — `порог = min_p × max(вероятностей ПОСЛЕ температуры)`, маскируется строго меньшее (`builtin.py:106-115`, HF `logits_process.py:761-777`).
- Перенормировка **одна**, в конце: `-inf` в маскированные позиции, затем единственный softmax (`topk_topp_sampler.py:149`).
- `temperature=0` в vLLM — спец-кейс в честный argmax, не деление на ноль (`sampling_params.py:499-505,717-721`; `sampler.py:236,239-241,296-301`). В HF — `ValueError` («use `do_sample=False`»), `logits_process.py:288-296`.

**Дефолты vLLM `SamplingParams`:** `temperature=1.0` (диапазон [0,2]; значения из (0, 0.01) молча поднимаются до 0.01), `top_p=1.0` (диапазон (0,1]), `top_k=0` (0 и −1 = «не ограничивать»), `min_p=0.0` (диапазон [0,1]). В официальном OpenAI API есть только `temperature` и `top_p`; `top_k` и `min_p` — расширения vLLM (`vllm/entrypoints/openai/chat_completion/protocol.py:213-235` против `:264-300`).

**min-p — происхождение:** llama.cpp PR #3841, автор **kalomaze**, открыт 2023-10-28, влит 2023-10-31; в исходниках HF благодарность @menhguin и @kalomaze. Статья — arXiv **2407.01082**, «Turning Up the Heat: Min-p Sampling for Creative and **Coherent** LLM Outputs» (именно Coherent), авторы Nguyen, Baker, Neo, Roush, Kirsch, Shwartz-Ziv, **oral на ICLR 2025**. Комьюнити опередило академию примерно на 8 месяцев.

**Недетерминизм:** «Defeating Nondeterminism in LLM Inference», **Horace He** и коллеги из **Thinking Machines**, **10 сентября 2025**. Источник прямо называет объяснение «неассоциативность float + конкурентность» неполным («not entirely wrong… doesn't reveal the full picture») и показывает битово воспроизводимый матмул на GPU. Настоящая причина — **отсутствие batch invariance**: стратегия редукции в ядрах меняется с размером батча, поэтому выход зависит от того, кто попал с тобой в один батч. Лечение — batch-invariant ядра (RMSNorm, matmul, attention). Статья обязана провести это различие и не сваливать всё на float.

**Запрещено писать:** любую конкретику про дискуссию вокруг ICLR-ревью min-p (проверить не удалось — OpenReview за бот-защитой, снапшоты пустые). Не утверждать, что @menhguin — первый автор статьи.

**Согласованность с существующими статьями:** `structured-outputs.mdx:19,46-48` уже описывает маскирование грамматикой до сэмплинга и ренормализацию — продолжаем, не противоречим. `speculative-decoding.mdx:83-85,95` привязывает гарантию к greedy/обычному сэмплированию и связывает температуру с acceptance rate, но **не** разбирает top-k/top-p/min-p — нельзя писать, будто там это уже есть.

**Правила репозитория:**
- Компоненты: `.tsx` в `src/components/article/`, инлайновый объект `css` с записями `as React.CSSProperties`, цвета **только** через CSS-переменные темы (`--accent`, `--accent-secondary`, `--accent-yellow`, `--accent-magenta`, `--text`, `--text-secondary`, `--text-muted`, `--bg-card`, `--bg-secondary`, `--border`, `--border-light`), допустимы литералы `#22c55e` (успех) и `#ef4444` (ошибка) — они уже используются в соседних компонентах. Дефолтный экспорт **без пропсов**. Никаких новых npm-зависимостей. Никаких `Math.random` / `new Date` — псевдослучайность только через seeded-генератор.
- Хайдрация — `client:visible`.
- Категория статьи — `'фундамент'`.
- `Callout` принимает `type` ∈ `'info' | 'warning' | 'tip' | 'fire'` и `title`. `StepList` — `steps={[{ num, text }]}`, где `text` рендерится как HTML.
- **MDX-ловушка:** включён remark-math, поэтому голый `$` в прозе съедается как формула — экранировать `\$`. Внутри кодовых блоков `$` безопасен.
- Текст и UI — на русском, в стиле блога: прямо, дерзко, на «ты», длинные тире — часть стиля. Никакого канцелярита.
- **Осознанное дублирование:** компоненты блога — одноразовые визуализации, а не библиотека (см. CLAUDE.md). Логика сэмплинга повторяется в двух компонентах намеренно; выносить общий модуль **не надо**, это противоречит конвенции репозитория.

---

## File Structure

| Файл | Ответственность |
|---|---|
| `src/components/article/SamplingPlayground.tsx` | Главный интерактив: распределение + все четыре ручки в порядке vLLM |
| `src/components/article/TopPvsMinP.tsx` | Дуэль top-p и min-p на уверенном и размазанном распределении |
| `src/components/article/SamplingDice.tsx` | Многократный сэмпл из выживших, частоты сходятся к вероятностям |
| `src/components/article/BatchNondeterminism.tsx` | Порядок суммирования float → другая сумма → другой argmax |
| `src/content/blog/sampling-knobs.mdx` | Статья |

---

## Task 1: Компонент SamplingPlayground

**Files:**
- Create: `src/components/article/SamplingPlayground.tsx`

**Interfaces:**
- Produces: дефолтный экспорт `SamplingPlayground` без пропсов. Task 4 импортирует его в MDX.

- [ ] **Шаг 1: Написать компонент**

Требования: распределение из 12 токенов; четыре ползунка; пайплайн строго в порядке vLLM; для каждого токена видно, выжил он или какой ручкой убит; у выживших показана вероятность **после финальной перенормировки**; порядок ручек подписан в интерфейсе.

```tsx
import { useState } from 'react';

// Иллюстративное распределение: «Кот сидит на ___».
// Логиты выдуманы для наглядности, механика — настоящая.
const TOKENS = [
	{ t: 'коврике', l: 3.2 },
	{ t: 'диване', l: 2.9 },
	{ t: 'окне', l: 2.4 },
	{ t: 'крыше', l: 1.8 },
	{ t: 'столе', l: 1.5 },
	{ t: 'полу', l: 1.1 },
	{ t: 'дереве', l: 0.6 },
	{ t: 'заборе', l: 0.2 },
	{ t: 'ветке', l: -0.3 },
	{ t: 'капоте', l: -0.9 },
	{ t: 'луне', l: -2.1 },
	{ t: 'ассемблере', l: -3.4 },
];

type Kill = null | 'min_p' | 'top_k' | 'top_p';

function softmax(logits: number[]): number[] {
	const alive = logits.filter((x) => Number.isFinite(x));
	const max = alive.length ? Math.max(...alive) : 0;
	const exps = logits.map((x) => (Number.isFinite(x) ? Math.exp(x - max) : 0));
	const z = exps.reduce((a, b) => a + b, 0);
	return exps.map((e) => (z > 0 ? e / z : 0));
}

// Пайплайн ровно в порядке vLLM: temperature -> min_p -> top_k -> top_p -> softmax.
function pipeline(temp: number, topK: number, topP: number, minP: number) {
	const n = TOKENS.length;
	const scaled = TOKENS.map((x) => x.l / Math.max(temp, 0.01));
	const killedBy: Kill[] = new Array(n).fill(null);
	let masked = scaled.slice();

	// 1) min_p: порог относительно лидера, по вероятностям ПОСЛЕ температуры
	if (minP > 0) {
		const p = softmax(masked);
		const thr = minP * Math.max(...p);
		for (let i = 0; i < n; i++) {
			if (p[i] < thr) { killedBy[i] = 'min_p'; masked[i] = -Infinity; }
		}
	}

	// 2) top_k: маскируем строго меньшее, чем k-е по величине
	if (topK > 0 && topK < n) {
		const sorted = masked.slice().sort((a, b) => b - a);
		const kth = sorted[topK - 1];
		for (let i = 0; i < n; i++) {
			if (masked[i] < kth && killedBy[i] === null) { killedBy[i] = 'top_k'; masked[i] = -Infinity; }
		}
	}

	// 3) top_p: минимальный набор с массой >= p, граничный включается, лидер всегда жив
	if (topP < 1) {
		const p = softmax(masked);
		const order = p.map((v, i) => i).sort((a, b) => p[b] - p[a]);
		let cum = 0;
		const keep = new Set<number>();
		for (const i of order) {
			if (p[i] <= 0) break;
			keep.add(i);
			cum += p[i];
			if (cum >= topP) break;
		}
		for (let i = 0; i < n; i++) {
			if (!keep.has(i) && killedBy[i] === null && Number.isFinite(masked[i])) {
				killedBy[i] = 'top_p'; masked[i] = -Infinity;
			}
		}
	}

	return { final: softmax(masked), killedBy };
}

const KILL_COLOR: Record<string, string> = {
	min_p: 'var(--accent-magenta)',
	top_k: 'var(--accent-yellow)',
	top_p: 'var(--accent-secondary)',
};

const css = {
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 } as React.CSSProperties,
	order: { fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 0.7rem', marginBottom: '1.1rem', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' } as React.CSSProperties,
	row: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' } as React.CSSProperties,
	tok: (dead: boolean) => ({ width: '96px', flexShrink: 0, fontSize: '0.8rem', fontWeight: dead ? 500 : 700, color: dead ? 'var(--text-muted)' : 'var(--text)', textDecoration: dead ? 'line-through' : 'none', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' } as React.CSSProperties),
	track: { flex: 1, height: '14px', borderRadius: '4px', background: 'var(--bg-secondary)', overflow: 'hidden' } as React.CSSProperties,
	fill: (pct: number, color: string) => ({ width: `${Math.max(pct, 0)}%`, height: '100%', background: color, transition: 'width 0.15s ease' } as React.CSSProperties),
	val: { width: '54px', flexShrink: 0, fontSize: '0.75rem', fontWeight: 700, textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' as const, color: 'var(--text-secondary)' } as React.CSSProperties,
	tag: (color: string) => ({ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.04em', color, width: '52px', flexShrink: 0 } as React.CSSProperties),
	controls: { marginTop: '1.1rem', display: 'grid', gap: '0.5rem' } as React.CSSProperties,
	ctl: { display: 'flex', alignItems: 'center', gap: '0.6rem' } as React.CSSProperties,
	label: (color: string) => ({ width: '112px', flexShrink: 0, fontSize: '0.78rem', fontWeight: 700, color, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' } as React.CSSProperties),
	slider: { flex: 1, accentColor: 'var(--accent)' } as React.CSSProperties,
	num: { width: '46px', flexShrink: 0, fontSize: '0.8rem', fontWeight: 800, textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' as const, color: 'var(--text)' } as React.CSSProperties,
	note: { marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

export default function SamplingPlayground() {
	const [temp, setTemp] = useState(1);
	const [topK, setTopK] = useState(0);
	const [topP, setTopP] = useState(1);
	const [minP, setMinP] = useState(0);

	const { final, killedBy } = pipeline(temp, topK, topP, minP);
	const maxP = Math.max(...final, 0.0001);
	const aliveCount = killedBy.filter((k) => k === null).length;

	return (
		<div style={css.wrap}>
			<div style={css.title}>🎛 Песочница сэмплинга</div>
			<div style={css.desc}>
				«Кот сидит на ___». Крути ручки и смотри, что происходит с распределением: кто выжил, кого какая
				ручка убила и какие вероятности стали у выживших после перенормировки. Логиты иллюстративные, механика настоящая.
			</div>
			<div style={css.order}>порядок как в vLLM: temperature → min_p → top_k → top_p → softmax</div>

			{TOKENS.map((tk, i) => {
				const dead = killedBy[i] !== null;
				const pct = dead ? 0 : (final[i] / maxP) * 100;
				return (
					<div key={tk.t} style={css.row}>
						<span style={css.tok(dead)}>{tk.t}</span>
						<div style={css.track}><div style={css.fill(pct, 'var(--accent)')} /></div>
						<span style={css.val}>{dead ? '—' : `${(final[i] * 100).toFixed(1)}%`}</span>
						<span style={css.tag(dead ? KILL_COLOR[killedBy[i] as string] : 'transparent')}>
							{dead ? killedBy[i] : ''}
						</span>
					</div>
				);
			})}

			<div style={css.controls}>
				<div style={css.ctl}>
					<span style={css.label('var(--accent)')}>temperature</span>
					<input style={css.slider} type="range" min={0.1} max={2} step={0.1} value={temp} onChange={(e) => setTemp(Number(e.target.value))} />
					<span style={css.num}>{temp.toFixed(1)}</span>
				</div>
				<div style={css.ctl}>
					<span style={css.label('var(--accent-magenta)')}>min_p</span>
					<input style={css.slider} type="range" min={0} max={0.5} step={0.01} value={minP} onChange={(e) => setMinP(Number(e.target.value))} />
					<span style={css.num}>{minP.toFixed(2)}</span>
				</div>
				<div style={css.ctl}>
					<span style={css.label('var(--accent-yellow)')}>top_k</span>
					<input style={css.slider} type="range" min={0} max={TOKENS.length} step={1} value={topK} onChange={(e) => setTopK(Number(e.target.value))} />
					<span style={css.num}>{topK === 0 ? 'off' : topK}</span>
				</div>
				<div style={css.ctl}>
					<span style={css.label('var(--accent-secondary)')}>top_p</span>
					<input style={css.slider} type="range" min={0.05} max={1} step={0.01} value={topP} onChange={(e) => setTopP(Number(e.target.value))} />
					<span style={css.num}>{topP.toFixed(2)}</span>
				</div>
			</div>

			<div style={css.note}>
				Выжило токенов: <strong>{aliveCount}</strong> из {TOKENS.length}. Обрати внимание: <code>top_k=0</code> означает
				«не ограничивать» — это дефолт vLLM, как и <code>top_p=1.0</code> и <code>min_p=0</code>. Порядок ручек не
				косметика: min_p считает порог от лидера <em>до</em> того, как top_k и top_p что-то отрежут.
			</div>
		</div>
	);
}
```

- [ ] **Шаг 2: Проверить сборку**

```bash
cd /home/mr8bit/Projects/blog && npm run build 2>&1 | grep -E "page\(s\) built|error"
```
Ожидаемо: ошибок нет, `34 page(s) built`.

- [ ] **Шаг 3: Проверить математику пайплайна**

Написать одноразовый скрипт в скретчпаде, который повторяет функции `softmax` и `pipeline` и проверяет:
1. при дефолтах (`temp=1, topK=0, topP=1, minP=0`) ничего не убито и сумма вероятностей ≈ 1;
2. `minP=0.5` оставляет только токены с вероятностью ≥ половины лидера;
3. `topK=3` оставляет ровно 3 (на этом распределении равенств нет);
4. `topP=0.5` оставляет минимальный набор с суммой ≥ 0.5, включая граничный токен;
5. после любой обрезки сумма вероятностей выживших ≈ 1 (перенормировка).

Все пять проверок должны пройти. Если нет — чинить компонент, а не проверку.

- [ ] **Шаг 4: Коммит**

```bash
git add src/components/article/SamplingPlayground.tsx
git commit -m "Add SamplingPlayground component"
```

---

## Task 2: Компоненты TopPvsMinP и SamplingDice

**Files:**
- Create: `src/components/article/TopPvsMinP.tsx`
- Create: `src/components/article/SamplingDice.tsx`

**Interfaces:**
- Produces: два дефолтных экспорта без пропсов для Task 4.

- [ ] **Шаг 1: Написать TopPvsMinP**

Два распределения бок о бок, один ползунок, переключатель между top-p и min-p. Смысл: одно и то же значение ведёт себя по-разному, и min-p адаптируется к уверенности.

```tsx
import { useState } from 'react';

// Два иллюстративных распределения: уверенное и размазанное.
const CONFIDENT = [
	{ t: 'Париж', p: 0.90 }, { t: 'Лион', p: 0.04 }, { t: 'Марсель', p: 0.02 },
	{ t: 'Ницца', p: 0.015 }, { t: 'Тулуза', p: 0.01 }, { t: 'Брест', p: 0.008 },
	{ t: 'банан', p: 0.004 }, { t: 'ассемблер', p: 0.003 },
];
const FLAT = [
	{ t: 'тихо', p: 0.17 }, { t: 'странно', p: 0.16 }, { t: 'весело', p: 0.15 },
	{ t: 'грустно', p: 0.14 }, { t: 'душно', p: 0.13 }, { t: 'светло', p: 0.12 },
	{ t: 'пусто', p: 0.08 }, { t: 'вязко', p: 0.05 },
];

function surviveTopP(dist: { t: string; p: number }[], p: number): boolean[] {
	const order = dist.map((_, i) => i).sort((a, b) => dist[b].p - dist[a].p);
	const keep = new Set<number>();
	let cum = 0;
	for (const i of order) {
		keep.add(i);
		cum += dist[i].p;
		if (cum >= p) break;
	}
	return dist.map((_, i) => keep.has(i));
}

function surviveMinP(dist: { t: string; p: number }[], m: number): boolean[] {
	const thr = m * Math.max(...dist.map((d) => d.p));
	return dist.map((d) => d.p >= thr);
}

const css = {
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.1rem', lineHeight: 1.6 } as React.CSSProperties,
	toggle: { display: 'flex', gap: '0.4rem', marginBottom: '1rem' } as React.CSSProperties,
	tbtn: (on: boolean) => ({ padding: '0.35rem 0.9rem', borderRadius: '100px', border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`, background: on ? 'var(--accent-glow)' : 'var(--bg-secondary)', color: on ? 'var(--accent-light)' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' } as React.CSSProperties),
	cols: { display: 'flex', gap: '1.25rem', flexWrap: 'wrap' as const } as React.CSSProperties,
	col: { flex: '1 1 240px', minWidth: '230px' } as React.CSSProperties,
	colTitle: { fontSize: '0.78rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.1rem' } as React.CSSProperties,
	colSub: { fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.6rem' } as React.CSSProperties,
	row: { display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' } as React.CSSProperties,
	tok: (alive: boolean) => ({ width: '80px', flexShrink: 0, fontSize: '0.76rem', fontWeight: alive ? 700 : 500, color: alive ? 'var(--text)' : 'var(--text-muted)', textDecoration: alive ? 'none' : 'line-through', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' } as React.CSSProperties),
	track: { flex: 1, height: '11px', borderRadius: '3px', background: 'var(--bg-secondary)', overflow: 'hidden' } as React.CSSProperties,
	fill: (pct: number, alive: boolean) => ({ width: `${pct}%`, height: '100%', background: alive ? 'var(--accent)' : 'var(--border-light)' } as React.CSSProperties),
	val: { width: '42px', flexShrink: 0, fontSize: '0.7rem', textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' as const, color: 'var(--text-muted)' } as React.CSSProperties,
	count: (color: string) => ({ marginTop: '0.5rem', fontSize: '0.78rem', fontWeight: 700, color } as React.CSSProperties),
	ctl: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '1.1rem' } as React.CSSProperties,
	slider: { flex: 1, accentColor: 'var(--accent)' } as React.CSSProperties,
	num: { width: '46px', flexShrink: 0, fontSize: '0.82rem', fontWeight: 800, textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' as const, color: 'var(--text)' } as React.CSSProperties,
	note: { marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

function Column({ name, sub, dist, alive }: { name: string; sub: string; dist: { t: string; p: number }[]; alive: boolean[] }) {
	const max = Math.max(...dist.map((d) => d.p));
	const n = alive.filter(Boolean).length;
	return (
		<div style={css.col}>
			<div style={css.colTitle}>{name}</div>
			<div style={css.colSub}>{sub}</div>
			{dist.map((d, i) => (
				<div key={d.t} style={css.row}>
					<span style={css.tok(alive[i])}>{d.t}</span>
					<div style={css.track}><div style={css.fill((d.p / max) * 100, alive[i])} /></div>
					<span style={css.val}>{(d.p * 100).toFixed(1)}</span>
				</div>
			))}
			<div style={css.count(n <= 2 ? 'var(--accent-yellow)' : 'var(--accent)')}>выжило: {n} из {dist.length}</div>
		</div>
	);
}

export default function TopPvsMinP() {
	const [mode, setMode] = useState<'top_p' | 'min_p'>('top_p');
	const [v, setV] = useState(0.9);

	const conf = mode === 'top_p' ? surviveTopP(CONFIDENT, v) : surviveMinP(CONFIDENT, v);
	const flat = mode === 'top_p' ? surviveTopP(FLAT, v) : surviveMinP(FLAT, v);

	return (
		<div style={css.wrap}>
			<div style={css.title}>⚔️ top-p против min-p</div>
			<div style={css.desc}>
				Одно и то же значение ручки на двух распределениях: слева модель уверена, справа мечется. Переключай
				ручку и смотри, как меняется число выживших. Вот тут и видно разницу в характере.
			</div>

			<div style={css.toggle}>
				<button style={css.tbtn(mode === 'top_p')} onClick={() => setMode('top_p')}>top_p</button>
				<button style={css.tbtn(mode === 'min_p')} onClick={() => setMode('min_p')}>min_p</button>
			</div>

			<div style={css.cols}>
				<Column name="Уверенное распределение" sub="«Столица Франции — ___»" dist={CONFIDENT} alive={conf} />
				<Column name="Размазанное распределение" sub="«В комнате было ___»" dist={FLAT} alive={flat} />
			</div>

			<div style={css.ctl}>
				<span style={{ ...css.num, width: '58px', textAlign: 'left' }}>{mode}</span>
				<input style={css.slider} type="range" min={0.02} max={mode === 'top_p' ? 1 : 0.6} step={0.01} value={v} onChange={(e) => setV(Number(e.target.value))} />
				<span style={css.num}>{v.toFixed(2)}</span>
			</div>

			<div style={css.note}>
				<strong>top_p</strong> считает накопленную массу, поэтому на уверенном распределении он добирает хвост
				(лидер уже 90%, но до порога надо «дособрать») — а на размазанном пропускает почти всё.
				<strong> min_p</strong> считает порог от лидера, поэтому на уверенном режет жёстко, а на размазанном
				отпускает. Одно значение — разное поведение, и в этом весь смысл.
			</div>
		</div>
	);
}
```

- [ ] **Шаг 2: Написать SamplingDice**

Кнопка «сэмплировать», счётчики выпадений, сходимость частот к вероятностям. Генератор — seeded (mulberry32), чтобы прогон был воспроизводим и без `Math.random`.

```tsx
import { useState } from 'react';

const DIST = [
	{ t: 'коврике', p: 0.45 },
	{ t: 'диване', p: 0.28 },
	{ t: 'окне', p: 0.15 },
	{ t: 'крыше', p: 0.08 },
	{ t: 'столе', p: 0.04 },
];

// Детерминированный ГПСЧ: одинаковая последовательность у всех читателей.
function mulberry32(a: number) {
	return function () {
		a |= 0; a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const SEED = 20260802;

function pick(r: number): number {
	let cum = 0;
	for (let i = 0; i < DIST.length; i++) {
		cum += DIST[i].p;
		if (r < cum) return i;
	}
	return DIST.length - 1;
}

const css = {
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.1rem', lineHeight: 1.6 } as React.CSSProperties,
	row: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' } as React.CSSProperties,
	tok: (hot: boolean) => ({ width: '84px', flexShrink: 0, fontSize: '0.8rem', fontWeight: hot ? 800 : 600, color: hot ? '#22c55e' : 'var(--text-secondary)' } as React.CSSProperties),
	track: { flex: 1, height: '13px', borderRadius: '4px', background: 'var(--bg-secondary)', overflow: 'hidden', position: 'relative' as const } as React.CSSProperties,
	target: (pct: number) => ({ position: 'absolute' as const, left: `${pct}%`, top: 0, bottom: 0, width: '2px', background: 'var(--accent-yellow)' } as React.CSSProperties),
	fill: (pct: number) => ({ width: `${pct}%`, height: '100%', background: 'var(--accent)' } as React.CSSProperties),
	val: { width: '96px', flexShrink: 0, fontSize: '0.74rem', textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' as const, color: 'var(--text-muted)' } as React.CSSProperties,
	btns: { display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center', flexWrap: 'wrap' as const } as React.CSSProperties,
	btn: { padding: '0.45rem 1.1rem', borderRadius: '100px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' } as React.CSSProperties,
	total: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties,
	note: { marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

export default function SamplingDice() {
	const [counts, setCounts] = useState<number[]>(() => DIST.map(() => 0));
	const [step, setStep] = useState(0);
	const [last, setLast] = useState<number | null>(null);

	const draw = (times: number) => {
		const rng = mulberry32(SEED + step);
		const next = counts.slice();
		let idx = last;
		for (let i = 0; i < times; i++) {
			idx = pick(rng());
			next[idx]++;
		}
		setCounts(next);
		setStep(step + times);
		setLast(idx);
	};

	const reset = () => { setCounts(DIST.map(() => 0)); setStep(0); setLast(null); };
	const total = counts.reduce((a, b) => a + b, 0);

	return (
		<div style={css.wrap}>
			<div style={css.title}>🎲 Сэмплирование — это бросок костей</div>
			<div style={css.desc}>
				Ручки решают, кто вообще участвует. Дальше токен выбирается случайно, с весом своей вероятности.
				Жми — жёлтая риска показывает истинную вероятность, столбик — накопленную частоту. Чем больше бросков,
				тем ближе одно к другому.
			</div>

			{DIST.map((d, i) => {
				const freq = total > 0 ? counts[i] / total : 0;
				return (
					<div key={d.t} style={css.row}>
						<span style={css.tok(last === i)}>{d.t}</span>
						<div style={css.track}>
							<div style={css.fill(freq * 100)} />
							<div style={css.target(d.p * 100)} />
						</div>
						<span style={css.val}>{counts[i]} · {(freq * 100).toFixed(1)}% / {(d.p * 100).toFixed(0)}%</span>
					</div>
				);
			})}

			<div style={css.btns}>
				<button style={css.btn} onClick={() => draw(1)}>сэмплировать</button>
				<button style={css.btn} onClick={() => draw(100)}>×100</button>
				<button style={css.btn} onClick={reset}>сброс</button>
				<span style={css.total}>бросков: {total}</span>
			</div>

			<div style={css.note}>
				Именно поэтому один и тот же запрос даёт разные ответы: модель не «передумала», просто кости легли иначе.
				Последовательность здесь детерминированная (фиксированный сид) — у тебя и у соседа она совпадёт.
			</div>
		</div>
	);
}
```

- [ ] **Шаг 3: Проверить сборку**

```bash
cd /home/mr8bit/Projects/blog && npm run build 2>&1 | grep -E "page\(s\) built|error"
```

- [ ] **Шаг 4: Коммит**

```bash
git add src/components/article/TopPvsMinP.tsx src/components/article/SamplingDice.tsx
git commit -m "Add TopPvsMinP and SamplingDice components"
```

---

## Task 3: Компонент BatchNondeterminism

**Files:**
- Create: `src/components/article/BatchNondeterminism.tsx`

**Interfaces:**
- Produces: дефолтный экспорт без пропсов для Task 4.

**Данные — из реального численного эксперимента факт-пасса, не выдумывать.** Мини-пример компонент считает **вживую** через `Math.fround` (это настоящая float32-арифметика в браузере, воспроизводится точно). Результаты эксперимента размерности 8192 показываются как приведённые числа с подписью, что это внешний прогон.

- [ ] **Шаг 1: Написать компонент**

```tsx
import { useState } from 'react';

// Мини-пример считается вживую во float32 (Math.fround) — воспроизводится прямо в браузере.
const A = Math.fround(-992.28125);
const B = Math.fround(-0.0025840395);
const C = Math.fround(8535.3);

const f32 = (x: number) => Math.fround(x);
const leftFirst = f32(f32(A + B) + C);   // (a + b) + c
const rightFirst = f32(A + f32(B + C));  // a + (b + c)

// Числа ниже — из реального прогона на векторах размерности 8192 (float32 против float64).
const DOT = {
	trueA: 80.36561892, trueB: 80.36568176,
	seqA: 80.36564, seqB: 80.3654,
};

const css = {
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.1rem', lineHeight: 1.6 } as React.CSSProperties,
	sub: { fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.04em', color: 'var(--text-muted)', margin: '1.1rem 0 0.5rem' } as React.CSSProperties,
	code: { display: 'block', padding: '0.7rem 0.85rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: '0.8rem', lineHeight: 1.7, color: 'var(--text-secondary)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', whiteSpace: 'pre-wrap' as const, wordBreak: 'break-word' as const } as React.CSSProperties,
	hl: { color: 'var(--accent-yellow)', fontWeight: 800 } as React.CSSProperties,
	btns: { display: 'flex', gap: '0.5rem', marginTop: '0.8rem', flexWrap: 'wrap' as const } as React.CSSProperties,
	btn: (on: boolean) => ({ padding: '0.4rem 0.9rem', borderRadius: '100px', border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`, background: on ? 'var(--accent-glow)' : 'var(--bg-secondary)', color: on ? 'var(--accent-light)' : 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' } as React.CSSProperties),
	table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.78rem', fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties,
	th: { textAlign: 'left' as const, padding: '0.4rem 0.5rem', color: 'var(--text-muted)', fontWeight: 700, borderBottom: '1px solid var(--border)' } as React.CSSProperties,
	td: { padding: '0.4rem 0.5rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' } as React.CSSProperties,
	win: (ok: boolean) => ({ fontWeight: 800, color: ok ? '#22c55e' : '#ef4444' } as React.CSSProperties),
	note: { marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

export default function BatchNondeterminism() {
	const [order, setOrder] = useState<'left' | 'right'>('left');
	const sum = order === 'left' ? leftFirst : rightFirst;

	return (
		<div style={css.wrap}>
			<div style={css.title}>💥 Один и тот же вход, разный ответ</div>
			<div style={css.desc}>
				Сложение float неассоциативно: переставь скобки — получишь другое число. Ниже это считается прямо
				в твоём браузере во float32.
			</div>

			<div style={css.sub}>переставь скобки</div>
			<div style={css.btns}>
				<button style={css.btn(order === 'left')} onClick={() => setOrder('left')}>(a + b) + c</button>
				<button style={css.btn(order === 'right')} onClick={() => setOrder('right')}>a + (b + c)</button>
			</div>
			<code style={{ ...css.code, marginTop: '0.6rem' }}>
				a = {A}
				{'\n'}b = {B}
				{'\n'}c = {C}
				{'\n'}
				{'\n'}{order === 'left' ? '(a + b) + c' : 'a + (b + c)'} = <span style={css.hl}>{sum}</span>
				{'\n'}разница между порядками: <span style={css.hl}>{Math.abs(leftFirst - rightFirst)}</span>
			</code>

			<div style={css.sub}>а теперь то же самое на логитах</div>
			<table style={css.table}>
				<thead>
					<tr><th style={css.th}>как считали</th><th style={css.th}>токен «a»</th><th style={css.th}>токен «b»</th><th style={css.th}>argmax</th></tr>
				</thead>
				<tbody>
					<tr>
						<td style={css.td}>float64 (эталон)</td>
						<td style={css.td}>{DOT.trueA}</td>
						<td style={css.td}>{DOT.trueB}</td>
						<td style={css.td}><span style={css.win(true)}>b</span></td>
					</tr>
					<tr>
						<td style={css.td}>float32, последовательно</td>
						<td style={css.td}>{DOT.seqA}</td>
						<td style={css.td}>{DOT.seqB}</td>
						<td style={css.td}><span style={css.win(false)}>a</span></td>
					</tr>
					<tr>
						<td style={css.td}>float32, попарно / чанками</td>
						<td style={css.td} colSpan={2}>совпало с эталоном</td>
						<td style={css.td}><span style={css.win(true)}>b</span></td>
					</tr>
				</tbody>
			</table>

			<div style={css.note}>
				Скалярные произведения размерности 8192, истинный зазор между кандидатами — около 0.00006. Порядок
				суммирования изменился — и argmax перевернулся. Числа в таблице получены отдельным прогоном на Python
				(не в браузере). <strong>Но сам по себе float — только нижний слой.</strong> Чтобы недетерминизм стал
				наблюдаемым, порядок редукции должен меняться от запроса к запросу — а он меняется вместе с размером
				батча. Об этом — в тексте под компонентом.
			</div>
		</div>
	);
}
```

- [ ] **Шаг 2: Проверить, что мини-пример реально расходится**

```bash
cd /home/mr8bit/Projects/blog && node -e "
const f=Math.fround; const A=f(-992.28125), B=f(-0.0025840395), C=f(8535.3);
const l=f(f(A+B)+C), r=f(A+f(B+C));
console.log('left', l, 'right', r, 'diff', Math.abs(l-r));
if (l === r) { console.error('ПРОВАЛ: порядки совпали, пример не демонстрирует расхождение'); process.exit(1); }
console.log('OK: порядки дают разный результат');
"
```
Ожидаемо: `OK` и ненулевая разница. **Если результаты совпали — подобрать другую тройку чисел (сохранив реалистичный масштаб логитов) и обновить константы, а не убирать проверку.**

- [ ] **Шаг 3: Сборка и коммит**

```bash
cd /home/mr8bit/Projects/blog && npm run build 2>&1 | grep -E "page\(s\) built|error"
git add src/components/article/BatchNondeterminism.tsx
git commit -m "Add BatchNondeterminism component"
```

---

## Task 4: Статья sampling-knobs.mdx

**Files:**
- Create: `src/content/blog/sampling-knobs.mdx`

**Interfaces:**
- Consumes: все четыре компонента из Task 1–3.

- [ ] **Шаг 1: Frontmatter и импорты**

```mdx
---
title: 'Ручки сэмплинга: почему temperature=0.7 — это карго-культ 🎛🎲'
description: 'Что на самом деле делают temperature, top-k, top-p и min-p с распределением вероятностей, в каком порядке они применяются (в vLLM и в HuggingFace он разный), что ставить под код, JSON и творчество — и почему temperature=0 всё равно не даёт детерминизма.'
pubDate: 'Aug 02 2026'
category: 'фундамент'
---

import Callout from '../../components/article/Callout.astro';
import StepList from '../../components/article/StepList.astro';
import SamplingPlayground from '../../components/article/SamplingPlayground';
import TopPvsMinP from '../../components/article/TopPvsMinP';
import SamplingDice from '../../components/article/SamplingDice';
import BatchNondeterminism from '../../components/article/BatchNondeterminism';
```

- [ ] **Шаг 2: Вступление**

Крючок: `temperature=0.7`, `top_p=0.95` копируют из чужого конфига как заклинание. Обещание: разберём, что каждая ручка делает с распределением, в каком порядке они применяются (спойлер: в vLLM и HF по-разному), и почему `temperature=0` не спасает от недетерминизма. `Callout type="fire"` с сутью за 10 секунд.

- [ ] **Шаг 3: Часть 1 — откуда берутся вероятности**

Логиты → softmax. Главная деконструкция: temperature делит логиты **внутри** softmax, то есть управляет остротой распределения, а не «креативностью». T→0 упирается в argmax, T>1 размазывает. Формулу дать через KaTeX (в блоге он подключён):

$$
p_i = \frac{\exp(z_i / T)}{\sum_j \exp(z_j / T)}
$$

- [ ] **Шаг 4: Часть 2 — обрезка хвоста, плюс два компонента**

Зачем резать: длинный хвост мусора суммарно весит достаточно, чтобы иногда выстрелить. Разобрать `top_k` (тупо по рангу, не адаптивно; маскируется строго меньшее k-го значения, при равенстве выживает больше k) и `top_p` (минимальный набор с массой ≥ p, граничный токен включается, лидер сохраняется всегда). Явно сказать про перенормировку: в vLLM это **один** финальный softmax по маскированным логитам, а не софтмакс после каждой ручки.

Дефолты vLLM: `temperature=1.0`, `top_p=1.0`, `top_k=0` (0 и −1 — «не ограничивать»), `min_p=0.0`.

В конце части — компоненты:

```mdx
<SamplingPlayground client:visible />
```
и следом
```mdx
<SamplingDice client:visible />
```

- [ ] **Шаг 5: Часть 3 — min-p, его история и порядок ручек**

Формула порога: `min_p × max(вероятностей после температуры)`, маскируется строго меньшее. Отсюда адаптивность.

История (точные факты, не приукрашивать): llama.cpp PR #3841, автор **kalomaze**, открыт 28 октября 2023, влит 31 октября 2023; в исходниках HuggingFace благодарность @menhguin и @kalomaze. Препринт — arXiv 2407.01082, «Turning Up the Heat: Min-p Sampling for Creative and Coherent LLM Outputs», авторы Nguyen, Baker, Neo, Roush, Kirsch, Shwartz-Ziv, **oral на ICLR 2025**. Комьюнити опередило академию примерно на восемь месяцев — рифма с NTK-aware из статьи про RoPE. **Никакой конкретики про споры вокруг ревью — это не проверено.**

Компонент после определения min-p:

```mdx
<TopPvsMinP client:visible />
```

Затем отдельный блок про **порядок ручек** — с `Callout type="warning"`: в vLLM `temperature → min_p → top_k → top_p`, в HuggingFace `temperature → top_k → top_p → min_p`. «Общепринятый» порядок из туториалов — это порядок HF. Один конфиг на двух движках даст разные распределения.

Также: `top_k` и `min_p` — расширения vLLM, в официальном OpenAI API их нет, есть только `temperature` и `top_p`.

- [ ] **Шаг 6: Часть 4 — рецепты и взаимодействия**

Что ставить: код и детерминированные задачи (низкая температура или greedy); JSON и structured outputs; творческий текст (высокая температура + min-p, что и есть тезис пейпера).

Два взаимодействия:
- **structured outputs** — грамматика маскирует недопустимые токены **до** сэмплинга (в vLLM allowed-token маскирование идёт в самом начале конвейера), поэтому ручки работают уже по урезанному набору. Ссылка на `/blog/structured-outputs/`.
- **спекулятивное декодирование** — существующая статья связывает температуру с acceptance rate, но не разбирает top-k/top-p/min-p. Написать аккуратно: «оттуда мы знаем, что…», без приписывания той статье того, чего в ней нет. Ссылка на `/blog/speculative-decoding/`.

Одно предложение про экзотику (repetition/frequency penalty, DRY, XTC, typical-p, mirostat) — перечислением, без разбора.

- [ ] **Шаг 7: Часть 5 — твист про детерминизм**

Сначала: что делает `temperature=0`. В vLLM — спец-кейс в честный argmax (не деление на ноль); в HuggingFace — `ValueError` с советом использовать `do_sample=False`.

Дальше — почему argmax всё равно не спасает. Компонент:

```mdx
<BatchNondeterminism client:visible />
```

И **точная формулировка причины**: популярное объяснение «неассоциативность float + конкурентность GPU» источник называет неполным — дословно «not entirely wrong… doesn't reveal the full picture» — и показывает, что повторный матмул на GPU битово воспроизводим. Настоящая причина — отсутствие **batch invariance**: стратегия редукции в ядрах меняется вместе с размером батча, поэтому результат твоего запроса зависит от того, кто попал с тобой в один батч, а нагрузка на сервер плавает. Лечение — batch-invariant ядра (RMSNorm, matmul, attention). Источник: Horace He и коллеги, Thinking Machines, «Defeating Nondeterminism in LLM Inference», 10 сентября 2025.

Практический вывод: на своём железе с фиксированным батчем воспроизводимость достижима; через публичный API — нет, и `temperature=0` этого не чинит.

- [ ] **Шаг 8: TL;DR через StepList**

```mdx
<StepList steps={[
	{ num: "1", text: "<strong>temperature</strong> — это острота распределения, а не «креативность»: логиты делятся на T ещё до softmax" },
	{ num: "2", text: "<strong>top_k</strong> режет по рангу, <strong>top_p</strong> — по накопленной массе; оба неадаптивны к тому, насколько модель уверена" },
	{ num: "3", text: "<strong>min_p</strong> берёт порог от лидера (<code>min_p × p_max</code>), поэтому подстраивается: на уверенном распределении режет жёстко, на размазанном отпускает" },
	{ num: "4", text: "<strong>Порядок разный:</strong> vLLM — temperature → min_p → top_k → top_p; HuggingFace — temperature → top_k → top_p → min_p. Один конфиг, два движка, разные распределения" },
	{ num: "5", text: "<strong>temperature=0 не даёт детерминизма:</strong> дело не только во float, а в отсутствии batch invariance — твой ответ зависит от того, кто попал с тобой в батч" },
]} />
```

- [ ] **Шаг 9: Источники**

arXiv 2407.01082 (min-p), llama.cpp PR #3841, «Defeating Nondeterminism in LLM Inference» (Thinking Machines), исходники vLLM `v1/sample/sampler.py` и `ops/topk_topp_sampler.py`, HF `generation/logits_process.py`, плюс внутренние ссылки: `/blog/structured-outputs/`, `/blog/speculative-decoding/`, `/blog/tokenization/`, `/blog/kv-cache/`, `/blog/positional-encoding-rope/`.

- [ ] **Шаг 10: Сборка**

```bash
cd /home/mr8bit/Projects/blog && npm run build 2>&1 | grep -E "page\(s\) built|error"
```
Ожидаемо: `35 page(s) built` (было 34), ошибок нет.

- [ ] **Шаг 11: Проверить, что нет голых `$` в прозе**

```bash
cd /home/mr8bit/Projects/blog && grep -n '\$' src/content/blog/sampling-knobs.mdx | grep -v '^\s*[0-9]*:\s*\$\$' || echo "голых $ в прозе нет"
```
Формульные блоки `$$…$$` — норма. Одиночный `$` в прозе — дефект, экранировать `\$`.

- [ ] **Шаг 12: Коммит**

```bash
git add src/content/blog/sampling-knobs.mdx
git commit -m "Add article: sampling knobs (temperature, top-k, top-p, min-p)"
```

---

## Task 5: Проверка в браузере

**Files:**
- Modify (при необходимости): любой из четырёх компонентов или статья

- [ ] **Шаг 1: Поднять превью**

```bash
cd /home/mr8bit/Projects/blog && npm run preview &
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/blog/sampling-knobs/
```
Ожидаемо: `200`.

- [ ] **Шаг 2: Проверить каждый компонент вживую**

Через chrome-devtools. Смена темы — установить **оба** атрибута на `<html>`: `data-theme` и `data-theme-pref` (`dark` | `light`). Прокрутка — `element.scrollIntoView({block:'center', behavior:'instant'})` (плавный скролл ломает `window.scrollTo`). Мобильный — инструмент `emulate` с вьюпортом `390x844x3,mobile,touch`.

Проверить:
- **SamplingPlayground:** подвигать все четыре ползунка; убедиться, что метки убийцы (`min_p`/`top_k`/`top_p`) появляются и меняются, у выживших сумма процентов ≈ 100, при дефолтах никто не убит.
- **TopPvsMinP:** переключить режим; убедиться, что счётчики выживших в двух колонках ведут себя по-разному и что при `min_p` на уверенном распределении выживает заметно меньше, чем на размазанном.
- **SamplingDice:** нажать «сэмплировать», потом ×100; частоты должны поехать к жёлтым рискам; «сброс» обнуляет.
- **BatchNondeterminism:** переключить скобки; число должно измениться, разница ненулевая.

**Скриншоты обязательно открывать и смотреть.** Скриншот, который не прочитан, ничего не доказывает.

- [ ] **Шаг 3: Светлая тема**

Повторить обход в светлой теме. Особое внимание контрасту: у блога уже были баги, где `--accent-yellow` на белом фоне не читался мелким текстом.

- [ ] **Шаг 4: Мобильный**

Вьюпорт `390x844x3`. Колонки `TopPvsMinP` должны переноситься, таблица в `BatchNondeterminism` не должна вылезать, ползунки должны быть кликабельны. Горизонтального скролла быть не должно:

```js
document.documentElement.scrollWidth - document.documentElement.clientWidth  // ожидаемо 0
```

- [ ] **Шаг 5: Консоль**

Ошибок и React-варнингов быть не должно.

- [ ] **Шаг 6: Коммит правок**

```bash
git add -A && git commit -m "Polish sampling-knobs article after visual check"
```
Если правок не потребовалось — коммита нет, так и сказать.

---

## Self-Review (выполнено при написании плана)

**Покрытие спеки:** пять частей арка → Task 4 (шаги 2–8); четыре компонента → Task 1–3, размещение соответствует спеке (Playground и Dice в конце Части 2, TopPvsMinP в Части 3, BatchNondeterminism в Части 5); проверенная фактура целиком перенесена в Global Constraints; запрет на разговоры про ICLR-ревью продублирован в Task 4 (шаг 5).

**Плейсхолдеров нет:** весь код компонентов приведён целиком; прозу статьи имплементер пишет по конспекту каждого шага, точные факты и формулировки заданы дословно.

**Согласованность типов:** `Kill` и `KILL_COLOR` в Task 1 согласованы; функции `surviveTopP`/`surviveMinP` в Task 2 принимают один и тот же тип `{t, p}[]`; `DOT` в Task 3 используется только внутри своего компонента. Общий модуль сэмплинга намеренно не выделяется — см. Global Constraints про конвенцию репозитория.

**Известный риск, снятый проверкой:** мини-пример во `BatchNondeterminism` обязан реально расходиться в браузерном float32 — на это есть отдельная проверка в Task 3 (шаг 2) с явным указанием, что делать, если расхождения нет.
