import { useState } from 'react';

// Интерактивная модель надёжности и стоимости мультиагентных систем:
// Сравнивает 1 агента, последовательную цепочку из N агентов (p^N) и
// оркестратор + параллельные воркеры (с учётом налога на токены ~15x по данным Anthropic).

type TaskKind = 'sequential' | 'parallel';

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
	pills: { display: 'flex', gap: '0.45rem', flexWrap: 'wrap' as const, marginBottom: '1rem' } as React.CSSProperties,
	pill: (active: boolean) =>
		({
			padding: '0.4rem 0.8rem',
			borderRadius: '8px',
			border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
			background: active ? 'var(--bg-secondary)' : 'transparent',
			color: active ? 'var(--text)' : 'var(--text-secondary)',
			fontSize: '0.8rem',
			fontWeight: 700,
			cursor: 'pointer',
		}) as React.CSSProperties,
	grid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
		gap: '0.8rem',
		marginBottom: '1rem',
	} as React.CSSProperties,
	ctrl: {
		padding: '0.75rem 0.85rem',
		borderRadius: '9px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '0.35rem',
	} as React.CSSProperties,
	ctrlHead: { display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)' } as React.CSSProperties,
	toggle: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.45rem',
		fontSize: '0.82rem',
		color: 'var(--text)',
		padding: '0.7rem 0.85rem',
		borderRadius: '9px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		marginBottom: '1.1rem',
		cursor: 'pointer',
	} as React.CSSProperties,
	cards: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
		gap: '0.75rem',
		marginBottom: '1rem',
	} as React.CSSProperties,
	card: (accent: string) =>
		({
			padding: '0.85rem 0.95rem',
			borderRadius: '10px',
			background: 'var(--bg-secondary)',
			border: `1px solid ${accent}`,
		}) as React.CSSProperties,
	cLabel: { fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' as const, color: 'var(--text-muted)', letterSpacing: '0.03em' } as React.CSSProperties,
	cBig: { fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)', margin: '0.2rem 0' } as React.CSSProperties,
	cSub: { fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 } as React.CSSProperties,
	barWrap: { marginBottom: '0.5rem' } as React.CSSProperties,
	track: { height: '10px', borderRadius: '999px', background: 'var(--bg-card)', overflow: 'hidden', border: '1px solid var(--border)', marginTop: '0.35rem' } as React.CSSProperties,
	fill: (pct: number, color: string) =>
		({
			width: `${Math.max(2, Math.min(100, pct))}%`,
			height: '100%',
			background: color,
			borderRadius: '999px',
			transition: 'width 0.25s ease',
		}) as React.CSSProperties,
	verdict: (good: boolean) =>
		({
			padding: '0.8rem 0.95rem',
			borderRadius: '9px',
			background: 'var(--bg-secondary)',
			border: `1px solid ${good ? 'var(--cat-tools)' : 'var(--accent-yellow)'}`,
			fontSize: '0.85rem',
			color: 'var(--text)',
			lineHeight: 1.6,
		}) as React.CSSProperties,
};

export default function MultiAgentCompounding() {
	const [taskKind, setTaskKind] = useState<TaskKind>('sequential');
	const [stepAcc, setStepAcc] = useState(92); // точность одного шага/передачи, %
	const [agentsCount, setAgentsCount] = useState(6); // число агентов / handoffs
	const [hasVerifier, setHasVerifier] = useState(false);

	const p = stepAcc / 100;
	// С детерминированным верификатором (тесты/схема) и 1 ретраем вероятность успеха шага: 1 - (1 - p)^2
	const pEffective = hasVerifier ? 1 - (1 - p) * (1 - p) : p;

	// 1 агент: единый контекст без handoff-потерь, оцениваем ~2 ключевых решения внутри цикла
	const singleProb = Math.pow(pEffective, taskKind === 'parallel' ? 3 : 2);
	const singleTokensMult = 4; // ~4× от одиночного чата (по ориентиру Anthropic)

	// Мультиагентная цепочка / рой:
	// Для последовательной задачи ошибки перемножаются на каждом handoff (p^N) + риск конфликта контекста.
	// Для параллельного поиска (research) воркеры независимы: оркестратор + агрегация теряют меньше, а широта растёт.
	const multiProb =
		taskKind === 'sequential'
			? Math.pow(pEffective, agentsCount) * Math.max(0.75, 1 - (agentsCount - 1) * 0.02)
			: Math.min(0.98, pEffective * (1 - Math.pow(1 - pEffective, Math.min(3, agentsCount))) * 0.97);

	const multiTokensMult = Math.round(4 + (agentsCount - 1) * (taskKind === 'parallel' ? 2.4 : 2.1));

	const multiWins = taskKind === 'parallel' && agentsCount >= 3 && multiProb > singleProb + 0.03;

	return (
		<div style={css.wrap}>
			<div style={css.title}>📉 Математика роя: накопление ошибок и налог на токены</div>
			<div style={css.desc}>
				Покрути точность одного шага и число агентов. Посмотри, что происходит с итоговой надёжностью{' '}
				<code>p^N</code> на связанной задаче — и как меняется картина на параллельном поиске.
			</div>

			<div style={css.pills}>
				<button style={css.pill(taskKind === 'sequential')} onClick={() => setTaskKind('sequential')}>
					🔗 Связанная задача (рефакторинг, миграция, фича)
				</button>
				<button style={css.pill(taskKind === 'parallel')} onClick={() => setTaskKind('parallel')}>
					🌐 Параллельный поиск (research, аудит разных сервисов)
				</button>
			</div>

			<div style={css.grid}>
				<div style={css.ctrl}>
					<div style={css.ctrlHead}>
						<span>Точность одного шага (p)</span>
						<code>{stepAcc}%</code>
					</div>
					<input type="range" min={80} max={99} step={1} value={stepAcc} onChange={(e) => setStepAcc(Number(e.target.value))} />
				</div>
				<div style={css.ctrl}>
					<div style={css.ctrlHead}>
						<span>Число агентов / передач (N)</span>
						<code>{agentsCount}</code>
					</div>
					<input type="range" min={2} max={12} step={1} value={agentsCount} onChange={(e) => setAgentsCount(Number(e.target.value))} />
				</div>
			</div>

			<label style={css.toggle}>
				<input type="checkbox" checked={hasVerifier} onChange={(e) => setHasVerifier(e.target.checked)} />
				<span>
					<strong>Детерминированный верификатор</strong> на каждом шаге (тесты, компилятор, JSON-схема + 1 ретрай)
				</span>
			</label>

			<div style={css.cards}>
				<div style={css.card('var(--cat-tools)')}>
					<div style={css.cLabel}>Один агент + хорошие тулы</div>
					<div style={css.cBig}>{Math.round(singleProb * 100)}% успеха</div>
					<div style={css.barWrap}>
						<div style={css.track}>
							<div style={css.fill(singleProb * 100, 'var(--cat-tools)')} />
						</div>
					</div>
					<div style={css.cSub}>
						Расход токенов: <strong>~{singleTokensMult}×</strong> от обычного чата. Единый контекст, ноль потерь на
						пересказе между агентами.
					</div>
				</div>

				<div style={css.card(multiProb < 0.65 ? 'var(--accent-magenta)' : 'var(--cat-fundament)')}>
					<div style={css.cLabel}>Рой из {agentsCount} агентов</div>
					<div style={css.cBig}>{Math.round(multiProb * 100)}% успеха</div>
					<div style={css.barWrap}>
						<div style={css.track}>
							<div style={css.fill(multiProb * 100, multiProb < 0.65 ? 'var(--accent-magenta)' : 'var(--cat-fundament)')} />
						</div>
					</div>
					<div style={css.cSub}>
						Расход токенов: <strong>~{multiTokensMult}×</strong> от чата (в{' '}
						<strong>{(multiTokensMult / singleTokensMult).toFixed(1)}×</strong> дороже одного агента).
					</div>
				</div>
			</div>

			<div style={css.verdict(multiWins)}>
				{multiWins ? (
					<>
						✅ <strong>Здесь рой оправдан.</strong> Задача хорошо режется на независимые read-only ветки: параллельные
						воркеры не наступают друг другу на ноги, а оркестратор собирает итог. Главное — окупает ли ценность задачи
						расход <strong>~{multiTokensMult}×</strong> токенов.
					</>
				) : taskKind === 'sequential' ? (
					<>
						⚠️ <strong>Один агент здесь почти наверняка лучше.</strong> На {agentsCount} последовательных передачах
						контекста надёжность проседает до <strong>{Math.round(multiProb * 100)}%</strong>, а счёт растёт в{' '}
						<strong>{(multiTokensMult / singleTokensMult).toFixed(1)}×</strong>. Вместо роя дай одному агенту
						нормальные инструменты, тесты и компактный контекст.
					</>
				) : (
					<>
						⚖️ <strong>Пограничный случай.</strong> Выигрыш по качеству минимален, а переплата за оркестрацию и
						дублирование контекста уже ~{(multiTokensMult / singleTokensMult).toFixed(1)}×. Начни с одного агента с
						параллельными вызовами инструментов (parallel tool calls).
					</>
				)}
			</div>
		</div>
	);
}
