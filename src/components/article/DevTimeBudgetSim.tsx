import { useState } from 'react';

// Симулятор реального времени 2-часовой задачи:
// Почему ускорение «печатания кода» в 3× может дать итоговые −15% или +35%,
// и откуда берётся когнитивная иллюзия «мне показалось, что я стал быстрее».

interface Preset {
	label: string;
	typingShare: number; // % времени задачи, которое уходит именно на набор кода
	repoComplexity: number; // 1 (greenfield) .. 5 (тяжёлый 5-летний монолит)
	hasTests: boolean;
}

const PRESETS: Preset[] = [
	{ label: 'Скрипт / greenfield с нуля', typingShare: 55, repoComplexity: 1, hasTests: true },
	{ label: 'Фича в 5-летнем монолите (Senior)', typingShare: 20, repoComplexity: 5, hasTests: false },
	{ label: 'Новый проект / мидл + тесты', typingShare: 38, repoComplexity: 2, hasTests: true },
	{ label: '«Вайбкодинг» без тестов в проде', typingShare: 30, repoComplexity: 4, hasTests: false },
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
	presets: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' as const, marginBottom: '0.9rem' } as React.CSSProperties,
	chip: (active: boolean) =>
		({
			padding: '0.35rem 0.72rem',
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
		gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
		gap: '0.75rem',
		padding: '0.8rem 0.9rem',
		borderRadius: '9px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		marginBottom: '1rem',
	} as React.CSSProperties,
	ctrl: { display: 'flex', flexDirection: 'column' as const, gap: '0.3rem' } as React.CSSProperties,
	cHead: { display: 'flex', justifyContent: 'space-between', fontSize: '0.77rem', fontWeight: 700, color: 'var(--text)' } as React.CSSProperties,
	stackRow: { marginBottom: '0.85rem' } as React.CSSProperties,
	stackHead: { display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.3rem' } as React.CSSProperties,
	stackTrack: {
		display: 'flex',
		height: '22px',
		borderRadius: '8px',
		overflow: 'hidden',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
	} as React.CSSProperties,
	legend: { display: 'flex', gap: '0.9rem', flexWrap: 'wrap' as const, fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: '0.95rem' } as React.CSSProperties,
	metrics: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
		gap: '0.7rem',
		marginBottom: '0.85rem',
	} as React.CSSProperties,
	mCard: (border: string) =>
		({
			padding: '0.75rem 0.9rem',
			borderRadius: '9px',
			background: 'var(--bg-secondary)',
			border: `1px solid ${border}`,
		}) as React.CSSProperties,
	verdict: {
		padding: '0.75rem 0.9rem',
		borderRadius: '9px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border-light)',
		fontSize: '0.84rem',
		color: 'var(--text)',
		lineHeight: 1.55,
	} as React.CSSProperties,
};

export default function DevTimeBudgetSim() {
	const [typingShare, setTypingShare] = useState(20);
	const [repoComplexity, setRepoComplexity] = useState(5);
	const [hasTests, setHasTests] = useState(false);

	// Базовая задача без AI = 120 минут (включая ожидание код-ревью в PR)
	const baseTotal = 120;
	const baseTyping = Math.round((baseTotal * typingShare) / 100);
	const baseReviewQueue = 22;
	const baseContext = Math.round((baseTotal - baseTyping - baseReviewQueue) * 0.58);
	const baseVerify = baseTotal - baseTyping - baseContext - baseReviewQueue;

	// С AI (с учётом данных Harvard 2026: +49–56% к времени ожидания мерджа PR без мелких батчей/CI):
	const aiTyping = Math.round(baseTyping * 0.35 + 4 + repoComplexity * 2.2);
	const aiContext = Math.round(baseContext * (repoComplexity >= 4 ? 0.94 : 0.76));
	const verifyMult = (hasTests ? 0.72 : 1.32) * (0.65 + repoComplexity * 0.2);
	const aiVerify = Math.round(baseVerify * verifyMult + (hasTests ? 2 : 8));
	const aiReviewQueue = Math.round(baseReviewQueue * (hasTests ? 1.15 : 1.54));

	const aiTotal = aiTyping + aiContext + aiVerify + aiReviewQueue;
	const realDeltaPct = Math.round(((baseTotal - aiTotal) / baseTotal) * 100); // >0 быстрее, <0 медленнее

	// Субъективное ощущение: мозг переоценивает лёгкость набора кода (где стало в 3× меньше ручной печати)
	const perceivedDeltaPct = Math.min(55, Math.max(12, Math.round(realDeltaPct + 16 + (repoComplexity >= 4 ? 14 : 4))));
	const maxBar = Math.max(baseTotal, aiTotal);

	return (
		<div style={css.wrap}>
			<div style={css.title}>🧮 Разбор 2-часовой задачи: куда утекает ускорение</div>
			<div style={css.desc}>
				По закону Амдала, если чистое печатание кода занимает 20% задачи, то даже его 3× ускорение не перекроет
				налог на объяснение контекста и ревью чужого кода в старом монолите. Покрути параметры:
			</div>

			<div style={css.presets}>
				{PRESETS.map((p) => (
					<button
						key={p.label}
						style={css.chip(typingShare === p.typingShare && repoComplexity === p.repoComplexity && hasTests === p.hasTests)}
						onClick={() => {
							setTypingShare(p.typingShare);
							setRepoComplexity(p.repoComplexity);
							setHasTests(p.hasTests);
						}}
					>
						{p.label}
					</button>
				))}
			</div>

			<div style={css.controls}>
				<div style={css.ctrl}>
					<div style={css.cHead}>
						<span>Доля «печатания кода»</span>
						<code>{typingShare}%</code>
					</div>
					<input type="range" min={10} max={65} step={5} value={typingShare} onChange={(e) => setTypingShare(Number(e.target.value))} />
				</div>
				<div style={css.ctrl}>
					<div style={css.cHead}>
						<span>Сложность / легаси репо</span>
						<code>{repoComplexity} / 5</code>
					</div>
					<input type="range" min={1} max={5} step={1} value={repoComplexity} onChange={(e) => setRepoComplexity(Number(e.target.value))} />
				</div>
				<div style={css.ctrl}>
					<label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', cursor: 'pointer', marginTop: '0.2rem' }}>
						<input type="checkbox" checked={hasTests} onChange={(e) => setHasTests(e.target.checked)} />
						Быстрые автотесты + строгий CI
					</label>
					<div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
						Тесты резко снижают время на ручную проверку AI-диффа.
					</div>
				</div>
			</div>

			<div style={css.legend}>
				<span>🟦 Контекст и чтение</span>
				<span>🟧 Написание / агент</span>
				<span>🟪 Локальный дебаг</span>
				<span>🟨 Очередь PR-ревью (Harvard +54%)</span>
			</div>

			<div style={css.stackRow}>
				<div style={css.stackHead}>
					<span>Без AI (база)</span>
					<code>{baseTotal} мин</code>
				</div>
				<div style={css.stackTrack}>
					<div style={{ width: `${(baseContext / maxBar) * 100}%`, background: 'var(--cat-fundament)', transition: 'width 0.25s' }} />
					<div style={{ width: `${(baseTyping / maxBar) * 100}%`, background: 'var(--accent)', transition: 'width 0.25s' }} />
					<div style={{ width: `${(baseVerify / maxBar) * 100}%`, background: 'var(--accent-secondary)', transition: 'width 0.25s' }} />
					<div style={{ width: `${(baseReviewQueue / maxBar) * 100}%`, background: 'var(--accent-yellow)', transition: 'width 0.25s' }} />
				</div>
			</div>

			<div style={css.stackRow}>
				<div style={css.stackHead}>
					<span>С AI-агентом</span>
					<code>{aiTotal} мин</code>
				</div>
				<div style={css.stackTrack}>
					<div style={{ width: `${(aiContext / maxBar) * 100}%`, background: 'var(--cat-fundament)', transition: 'width 0.25s' }} />
					<div style={{ width: `${(aiTyping / maxBar) * 100}%`, background: 'var(--accent)', transition: 'width 0.25s' }} />
					<div style={{ width: `${(aiVerify / maxBar) * 100}%`, background: 'var(--accent-secondary)', transition: 'width 0.25s' }} />
					<div style={{ width: `${(aiReviewQueue / maxBar) * 100}%`, background: 'var(--accent-yellow)', transition: 'width 0.25s' }} />
				</div>
			</div>

			<div style={css.metrics}>
				<div style={css.mCard(realDeltaPct >= 0 ? 'var(--cat-tools)' : 'var(--accent-magenta)')}>
					<div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
						Реальный секундомер
					</div>
					<div style={{ fontSize: '1.25rem', fontWeight: 800, color: realDeltaPct >= 0 ? 'var(--cat-tools)' : 'var(--accent-magenta)', marginTop: '0.15rem' }}>
						{realDeltaPct >= 0 ? `+${realDeltaPct}% быстрее` : `${realDeltaPct}% (медленнее)`}
					</div>
				</div>
				<div style={css.mCard('var(--cat-fundament)')}>
					<div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
						Как кажется разработчику
					</div>
					<div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginTop: '0.15rem' }}>
						≈ +{perceivedDeltaPct}% быстрее
					</div>
				</div>
			</div>

			<div style={css.verdict}>
				{realDeltaPct < 0 ? (
					<>
						🪞 <strong>Ловушка METR в чистом виде:</strong> писать код руками почти не пришлось, мозг устал меньше и
						ощущает буст на <strong>+{perceivedDeltaPct}%</strong> — но на промптинг и вычистку AI-правок без
						автотестов ушло <strong>{aiTotal} мин</strong> вместо <strong>{baseTotal} мин</strong>.
					</>
				) : (
					<>
						✅ <strong>Реальный плюс ({realDeltaPct}%):</strong> доля чернового кода высокая{hasTests ? ', а автотесты быстро ловят ошибки модели' : ''},
						поэтому налог на ревью не съедает выигрыш от генерации.
					</>
				)}
			</div>
		</div>
	);
}
