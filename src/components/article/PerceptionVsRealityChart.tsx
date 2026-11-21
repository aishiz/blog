import { useState } from 'react';

// Интерактивное сравнение главных исследований продуктивности с AI (2024–2026):
// METR (2025), METR Follow-up (Feb 2026), Harvard 700+ фирм (2026), MIT 500K GitHub devs (2026),
// Anthropic Skill Mastery RCT (2026). Показывает реальную картину 2026 года:
// генерация кода взлетела, а узким горлышком стали ревью, верификация и понимание кода.

interface Study {
	id: string;
	tab: string;
	title: string;
	meta: string;
	bar1Label: string;
	bar1Val: number;
	bar1Text: string;
	bar2Label: string;
	bar2Val: number;
	bar2Text: string;
	context: string;
	takeaway: string;
}

const STUDIES: Study[] = [
	{
		id: 'metr25',
		tab: 'METR (2025)',
		title: 'METR RCT (июль 2025): 16 опытных OSS-разработчиков, 246 задач',
		meta: 'Зрелые репозитории (стаж ~5 лет) · Cursor Pro + Claude 3.5/3.7 Sonnet',
		bar1Label: 'Ощущение разработчиков после задач',
		bar1Val: 20,
		bar1Text: '+20% быстрее',
		bar2Label: 'Реальный замер по секундомеру',
		bar2Val: -19,
		bar2Text: '−19% (медленнее!)',
		context:
			'Точка отсчёта спора: опытные мейнтейнеры в знакомых репо были уверены в бусте +20%, но промптинг, ожидание и чистка диффов замедлили их на 19%.',
		takeaway: 'Разрыв между ощущением и секундомером — 39 п.п. Но это были модели начала 2025 года.',
	},
	{
		id: 'metr26',
		tab: 'METR (фев 2026)',
		title: 'METR Follow-up (февраль 2026): 57 разработчиков, 800+ задач — RCT сломался',
		meta: 'Новая когорта (47 чел.) и старая (10 чел.) · Агентские воркфлоу 2025–2026',
		bar1Label: 'Новая когорта (47 чел., 95% ДИ: −15%…+9%)',
		bar1Val: -4,
		bar1Text: '−4% (в пределах шума)',
		bar2Label: 'Вернувшаяся когорта (10 чел., 95% ДИ: −38%…+9%)',
		bar2Val: -18,
		bar2Text: '−18% (ДИ пересекает 0)',
		context:
			'Сама METR признала количественный замер ненадёжным и закрыла дизайн RCT: 30–50% участников просто отказывались делать сложные задачи в контрольной группе «без AI», а параллельный запуск нескольких агентов сломал трекинг времени.',
		takeaway:
			'К 2026 году «чистый эксперимент без AI» стал почти невозможен — инженеры уже перестроили сам способ работы под агентов.',
	},
	{
		id: 'harvard26',
		tab: 'Harvard · 700+ фирм (2026)',
		title: 'Harvard (Chen & Stratton, 2026): телеметрия 700+ компаний (Jellyfish + GitHub)',
		meta: 'Реальный прод с агентами (Claude Code / Devin-класс) vs обычные ассистенты',
		bar1Label: 'Объём кода и PR на инженера (LOC +30%, PR +23%)',
		bar1Val: 30,
		bar1Text: '+30% строк / +23% PR',
		bar2Label: 'Время до мерджа PR (ревью-горлышко!)',
		bar2Val: -52,
		bar2Text: '+49…56% дольше ждать merge',
		context:
			'Агенты резко подняли сырой объём кода (+30% LOC, +20% коммитов, +23% PR), но число закрытых продуктовых тикетов почти не сдвинулось: время ожидания мерджа выросло на 49–56%, число правок по ревью почти удвоилось, комментариев стало на 35% больше.',
		takeaway: 'Узкое горлышко 2026 года — не написание кода, а пропускная способность человеческого код-ревью.',
	},
	{
		id: 'mit26',
		tab: 'MIT · 500K devs (2026)',
		title: 'MIT Sloan / NBER (Demirer, Musolff, Yang, 2026): 500 000+ разработчиков GitHub',
		meta: 'Масштабная статистика активности vs реальных релизов',
		bar1Label: 'Рост сырой активности и коммитов (80–180%)',
		bar1Val: 65,
		bar1Text: '+80…180% активности',
		bar2Label: 'Рост реально отгруженного софта / релизов',
		bar2Val: 40,
		bar2Text: '+30…50% релизов',
		context:
			'Кода и коммитов стало в 2–3 раза больше, но до реальных релизов доходит только треть–половина этого буста: остальное съедают переделки (rework), интеграция и отладка.',
		takeaway: 'Ускорение на уровне 2026 года реально есть (+30–50%), но оно в 3 раза меньше, чем кажется по счётчику коммитов.',
	},
	{
		id: 'anthropic26',
		tab: 'Anthropic · Навыки (2026)',
		title: 'Anthropic RCT (2026): цена когнитивного аутсорса при освоении новых библиотек',
		meta: 'Контролируемый эксперимент на понимание и дебаг после работы с AI',
		bar1Label: 'Ощущение быстрого прогресса с ассистентом',
		bar1Val: 25,
		bar1Text: 'быстрее закрыли задачу',
		bar2Label: 'Тест на понимание и дебаг после задачи',
		bar2Val: -17,
		bar2Text: '−17% к оценке (~2 балла)',
		context:
			'Разработчики, осваивавшие новую библиотеку с AI, набрали примерно на 17% меньше на последующих тестах на понимание и отладку кода по сравнению с теми, кто разбирался руками.',
		takeaway: 'AI экономит время сегодня в кредит под завтрашний дебаг — особенно больно бьёт по росту джунов.',
	},
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
	tabs: { display: 'flex', gap: '0.45rem', flexWrap: 'wrap' as const, marginBottom: '1rem' } as React.CSSProperties,
	tab: (active: boolean) =>
		({
			padding: '0.38rem 0.74rem',
			borderRadius: '8px',
			border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
			background: active ? 'var(--bg-secondary)' : 'transparent',
			color: active ? 'var(--text)' : 'var(--text-secondary)',
			fontSize: '0.77rem',
			fontWeight: 700,
			cursor: 'pointer',
		}) as React.CSSProperties,
	panel: {
		padding: '1rem 1.1rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
	} as React.CSSProperties,
	head: { fontSize: '0.98rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.2rem' } as React.CSSProperties,
	meta: { fontSize: '0.76rem', color: 'var(--accent-light)', fontWeight: 600, marginBottom: '0.95rem' } as React.CSSProperties,
	barBlock: { marginBottom: '0.8rem' } as React.CSSProperties,
	barHead: { display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' as const, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.3rem' } as React.CSSProperties,
	axisWrap: {
		position: 'relative' as const,
		height: '18px',
		borderRadius: '999px',
		background: 'var(--bg-card)',
		border: '1px solid var(--border)',
		overflow: 'hidden',
	} as React.CSSProperties,
	zeroLine: {
		position: 'absolute' as const,
		left: '42%',
		top: 0,
		bottom: 0,
		width: '2px',
		background: 'var(--border-light)',
		zIndex: 2,
	} as React.CSSProperties,
	text: { fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '0.65rem' } as React.CSSProperties,
	takeaway: (neg: boolean) =>
		({
			padding: '0.7rem 0.85rem',
			borderRadius: '8px',
			background: 'var(--bg-card)',
			border: `1px solid ${neg ? 'var(--accent-magenta)' : 'var(--cat-tools)'}`,
			fontSize: '0.83rem',
			color: 'var(--text)',
			lineHeight: 1.55,
		}) as React.CSSProperties,
};

function SignedBar({ value, color }: { value: number; color: string }) {
	const zero = 42;
	const scale = 0.72;
	const widthPct = Math.min(value >= 0 ? 57 : 41, Math.abs(value) * scale);
	const leftPct = value >= 0 ? zero : Math.max(1, zero - widthPct);
	return (
		<div style={css.axisWrap}>
			<div style={css.zeroLine} />
			<div
				style={{
					position: 'absolute',
					left: `${leftPct}%`,
					width: `${Math.max(3, widthPct)}%`,
					top: 0,
					bottom: 0,
					background: color,
					transition: 'all 0.28s ease',
				}}
			/>
		</div>
	);
}

export default function PerceptionVsRealityChart() {
	const [idx, setIdx] = useState(1); // По умолчанию открываем свежий METR 2026!
	const st = STUDIES[idx];

	return (
		<div style={css.wrap}>
			<div style={css.title}>⏱️ Замеры 2025–2026: от скандала METR до 700+ фирм Harvard и 500K devs MIT</div>
			<div style={css.desc}>
				Покликай по пяти главным исследованиям. Вертикальная черта — <code>0%</code> (эффект без AI). Видно, как за
				год картина сместилась от «модель тупит» к «агент генерит тонны кода, а ревью и понимание не успевают».
			</div>

			<div style={css.tabs}>
				{STUDIES.map((s, i) => (
					<button key={s.id} style={css.tab(i === idx)} onClick={() => setIdx(i)}>
						{s.tab}
					</button>
				))}
			</div>

			<div style={css.panel}>
				<div style={css.head}>{st.title}</div>
				<div style={css.meta}>{st.meta}</div>

				<div style={css.barBlock}>
					<div style={css.barHead}>
						<span>{st.bar1Label}</span>
						<span style={{ color: st.bar1Val < 0 ? 'var(--accent-yellow-text)' : 'var(--cat-fundament)' }}>
							{st.bar1Text}
						</span>
					</div>
					<SignedBar value={st.bar1Val} color={st.bar1Val < 0 ? 'var(--accent-yellow)' : 'var(--cat-fundament)'} />
				</div>

				<div style={css.barBlock}>
					<div style={css.barHead}>
						<span>{st.bar2Label}</span>
						<span style={{ color: st.bar2Val < 0 ? 'var(--accent-magenta)' : 'var(--cat-tools)' }}>
							{st.bar2Text}
						</span>
					</div>
					<SignedBar value={st.bar2Val} color={st.bar2Val < 0 ? 'var(--accent-magenta)' : 'var(--cat-tools)'} />
				</div>

				<div style={css.text}>{st.context}</div>
				<div style={css.takeaway(st.bar2Val < 0)}>
					<strong>Вывод:</strong> {st.takeaway}
				</div>
			</div>
		</div>
	);
}
