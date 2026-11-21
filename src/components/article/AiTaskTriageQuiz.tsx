import { useState } from 'react';

// Интерактивный триаж инженерных задач:
// когда отдавать задачу агенту целиком, когда работать парно, а когда быстрее написать руками.

type Strategy = 'agent' | 'pair' | 'manual';

interface CaseItem {
	task: string;
	best: Strategy;
	why: string;
}

const CASES: CaseItem[] = [
	{
		task: 'Написать 25 юнит-тестов и фикстур для нового парсера JSON, у которого чёткая спецификация.',
		best: 'agent',
		why: 'Идеальный кейс для агента: низкий риск по архитектуре, мгновенная проверка через pytest, много шаблонного кода — реальное ускорение в 2–4×.',
	},
	{
		task: 'Починить редкий race condition в ядре биллинга, которое ты сам писал 4 года и знаешь каждую блокировку.',
		best: 'manual',
		why: 'Классический случай из METR: объяснять агенту все скрытые инварианты дольше, чем открыть нужные 30 строк и исправить руками. AI максимум пригодится как «резиновая уточка» или чтобы дописать регрессионный тест после фикса.',
	},
	{
		task: 'Перевести 35 файлов с устаревшего HTTP-клиента на новый SDK с похожим интерфейсом.',
		best: 'agent',
		why: 'Механический рефакторинг по чёткому паттерну + проверка компилятором и тестами. Делать это руками — пустая трата жизни.',
	},
	{
		task: 'Спроектировать и внедрить новую систему ролей и прав доступа в существующем монолите.',
		best: 'pair',
		why: 'Архитектуру, модель угроз и границы модулей проектируешь сам (иначе AI наплодит дублей и дыр — привет GitClear), а черновые миграции, DTO и тесты делегируешь модели.',
	},
	{
		task: 'Разобраться, как устроен незнакомый Go-сервис соседней команды, чтобы найти, откуда летят 502.',
		best: 'pair',
		why: 'AI-агент отлично работает как скоростной навигатор по чужой кодовой базе (read-only исследование), но финальную гипотезу по логам и метрикам проверяешь сам.',
	},
];

const LABELS: Record<Strategy, string> = {
	agent: '🤖 Отдать агенту целиком',
	pair: '🤝 Парно (дизайн мой, код AI)',
	manual: '✍️ Быстрее и чище руками',
};

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
	taskBox: {
		padding: '0.9rem 1.05rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		borderLeft: '3px solid var(--accent)',
		fontSize: '0.92rem',
		fontWeight: 600,
		color: 'var(--text)',
		lineHeight: 1.55,
		marginBottom: '1rem',
	} as React.CSSProperties,
	btns: { display: 'flex', gap: '0.45rem', flexWrap: 'wrap' as const, marginBottom: '0.9rem' } as React.CSSProperties,
	btn: (state: 'idle' | 'right' | 'wrong') =>
		({
			padding: '0.42rem 0.82rem',
			borderRadius: '8px',
			border: `1px solid ${
				state === 'right' ? 'var(--cat-tools)' : state === 'wrong' ? 'var(--accent-magenta)' : 'var(--border)'
			}`,
			background: state === 'idle' ? 'transparent' : 'var(--bg-secondary)',
			color: 'var(--text)',
			fontSize: '0.8rem',
			fontWeight: 700,
			cursor: 'pointer',
		}) as React.CSSProperties,
	explain: (ok: boolean) =>
		({
			padding: '0.75rem 0.9rem',
			borderRadius: '9px',
			background: 'var(--bg-secondary)',
			border: `1px solid ${ok ? 'var(--cat-tools)' : 'var(--accent-yellow)'}`,
			fontSize: '0.84rem',
			color: 'var(--text)',
			lineHeight: 1.55,
			marginBottom: '0.8rem',
		}) as React.CSSProperties,
	foot: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' } as React.CSSProperties,
	nextBtn: {
		padding: '0.38rem 0.88rem',
		borderRadius: '999px',
		border: '1px solid var(--accent)',
		background: 'var(--bg-secondary)',
		color: 'var(--accent-light)',
		fontSize: '0.78rem',
		fontWeight: 700,
		cursor: 'pointer',
	} as React.CSSProperties,
};

export default function AiTaskTriageQuiz() {
	const [idx, setIdx] = useState(0);
	const [picked, setPicked] = useState<Strategy | null>(null);
	const [score, setScore] = useState(0);

	const cur = CASES[idx];
	const ok = picked === cur.best;

	const choose = (s: Strategy) => {
		if (picked) return;
		setPicked(s);
		if (s === cur.best) setScore((v) => v + 1);
	};

	const next = () => {
		if (idx + 1 < CASES.length) {
			setIdx((i) => i + 1);
			setPicked(null);
		} else {
			setIdx(0);
			setPicked(null);
			setScore(0);
		}
	};

	return (
		<div style={css.wrap}>
			<div style={css.title}>🚦 Триаж задач: агенту, парно или руками?</div>
			<div style={css.desc}>
				Задача {idx + 1} из {CASES.length}. Выбери режим, который реально сэкономит время, а не создаст долг на ревью.
			</div>

			<div style={css.taskBox}>{cur.task}</div>

			<div style={css.btns}>
				{(['agent', 'pair', 'manual'] as Strategy[]).map((s) => {
					const state = !picked ? 'idle' : s === cur.best ? 'right' : s === picked ? 'wrong' : 'idle';
					return (
						<button key={s} style={css.btn(state)} onClick={() => choose(s)}>
							{LABELS[s]}
						</button>
					);
				})}
			</div>

			{picked && (
				<div style={css.explain(ok)}>
					<strong>{ok ? '✅ Точно в цель!' : `💡 Оптимальнее: ${LABELS[cur.best]}.`}</strong> {cur.why}
				</div>
			)}

			<div style={css.foot}>
				<span>
					Совпадений: <strong>{score}</strong> / {idx + (picked ? 1 : 0)}
				</span>
				{picked && (
					<button style={css.nextBtn} onClick={next}>
						{idx + 1 < CASES.length ? 'Следующая задача →' : 'Начать заново ↻'}
					</button>
				)}
			</div>
		</div>
	);
}
