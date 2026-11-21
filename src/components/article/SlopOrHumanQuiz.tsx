import { useState } from 'react';

// Мини-квиз для статьи про Model Collapse:
// 4 коротких отрывка — угадай, где живой автор (G=0), где ранний коллапс / AI-слоп,
// а где верифицированная синтетика (RLVR / seed).

type AnswerKind = 'human' | 'slop' | 'rlvr';

interface Round {
	quote: string;
	answer: AnswerKind;
	explain: string;
}

const ROUNDS: Round[] = [
	{
		quote:
			'В современном быстро меняющемся цифровом ландшафте оптимизация баз данных играет ключевую роль и является важным свидетельством зрелости инженерной культуры. Давайте погрузимся в богатый гобелен практик индексирования…',
		answer: 'slop',
		explain:
			'Классический ранний коллапс / AI-слоп: ноль конкретики, стёрты все «хвосты» и детали, сплошные высоковероятные клише («быстро меняющийся ландшафт», «богатый гобелен»).',
	},
	{
		quote:
			'В 3 ночи у нас отвалился pgbouncer на 14-й ноде: кто-то в миграции забыл CONCURRENTLY на таблице в 90M строк и повесил AccessExclusiveLock на 11 минут. В логах тишина, пока не глянули pg_stat_activity.',
		answer: 'human',
		explain:
			'Живой автор (G=0): редкий конкретный хвост — точные цифры, конкретный тип блокировки, человеческий контекст («в 3 ночи», «пока не глянули»).',
	},
	{
		quote:
			'Шаг 1: проверим крайний случай n = 0 → возвращаем []. Шаг 2: инвариант цикла — left ≤ right; проверка на массиве [1, 1, 2] даёт индекс 2. Запускаем 47 юнит-тестов: 47 passed, O(log n) по времени.',
		answer: 'rlvr',
		explain:
			'Верифицированная синтетика (RLVR / seed): структурная пошаговая проверка инвариантов и явный прогон через внешний детерминированный чекер — идеальный сигнал без воды.',
	},
	{
		quote:
			'Для выбора кэша важно учитывать множество факторов, таких как производительность, масштабируемость и надёжность. В целом оба решения обладают уникальными преимуществами и зависят от конкретных потребностей вашего проекта.',
		answer: 'slop',
		explain:
			'Усреднённый AI-слоп: максимально «безопасный» ответ из самой середины распределения, который формально верен и абсолютно бесполезен на практике.',
	},
];

const LABELS: Record<AnswerKind, string> = {
	human: '✍️ Живой автор (G=0)',
	slop: '🪞 AI-слоп (ранний коллапс)',
	rlvr: '✅ Верифицированная синтетика (RLVR)',
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
	quote: {
		padding: '0.95rem 1.1rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		borderLeft: '3px solid var(--accent)',
		fontSize: '0.9rem',
		color: 'var(--text)',
		lineHeight: 1.65,
		fontStyle: 'italic',
		marginBottom: '1rem',
	} as React.CSSProperties,
	btns: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as const, marginBottom: '0.9rem' } as React.CSSProperties,
	btn: (state: 'idle' | 'right' | 'wrong') =>
		({
			padding: '0.45rem 0.85rem',
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
			border: `1px solid ${ok ? 'var(--cat-tools)' : 'var(--accent-magenta)'}`,
			fontSize: '0.84rem',
			color: 'var(--text)',
			lineHeight: 1.55,
			marginBottom: '0.8rem',
		}) as React.CSSProperties,
	footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' } as React.CSSProperties,
	nextBtn: {
		padding: '0.4rem 0.9rem',
		borderRadius: '999px',
		border: '1px solid var(--accent)',
		background: 'var(--bg-secondary)',
		color: 'var(--accent-light)',
		fontSize: '0.78rem',
		fontWeight: 700,
		cursor: 'pointer',
	} as React.CSSProperties,
};

export default function SlopOrHumanQuiz() {
	const [round, setRound] = useState(0);
	const [picked, setPicked] = useState<AnswerKind | null>(null);
	const [score, setScore] = useState(0);

	const cur = ROUNDS[round];
	const isRight = picked === cur.answer;

	const choose = (k: AnswerKind) => {
		if (picked) return;
		setPicked(k);
		if (k === cur.answer) setScore((s) => s + 1);
	};

	const next = () => {
		if (round + 1 < ROUNDS.length) {
			setRound((r) => r + 1);
			setPicked(null);
		} else {
			setRound(0);
			setPicked(null);
			setScore(0);
		}
	};

	return (
		<div style={css.wrap}>
			<div style={css.title}>🕵️ Мини-тест: живой автор, AI-слоп или RLVR?</div>
			<div style={css.desc}>
				Раунд {round + 1} из {ROUNDS.length}. Прочитай отрывок и угадай, из какого источника он пришёл.
			</div>

			<div style={css.quote}>«{cur.quote}»</div>

			<div style={css.btns}>
				{(['human', 'slop', 'rlvr'] as AnswerKind[]).map((k) => {
					const state = !picked ? 'idle' : k === cur.answer ? 'right' : k === picked ? 'wrong' : 'idle';
					return (
						<button key={k} style={css.btn(state)} onClick={() => choose(k)}>
							{LABELS[k]}
						</button>
					);
				})}
			</div>

			{picked && (
				<div style={css.explain(isRight)}>
					<strong>{isRight ? '✅ В точку!' : '❌ Мимо.'}</strong> {cur.explain}
				</div>
			)}

			<div style={css.footer}>
				<span>
					Счёт: <strong>{score}</strong> / {round + (picked ? 1 : 0)}
				</span>
				{picked && (
					<button style={css.nextBtn} onClick={next}>
						{round + 1 < ROUNDS.length ? 'Следующий отрывок →' : 'Пройти заново ↻'}
					</button>
				)}
			</div>
		</div>
	);
}
