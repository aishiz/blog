import { useState } from 'react';

type Step = {
	question: string;
	options: { label: string; next: number | string }[];
};

type Result = {
	name: string;
	color: string;
	why: string;
};

const steps: Record<number, Step> = {
	0: {
		question: 'Что тебе нужно от агента?',
		options: [
			{ label: 'Писать код', next: 1 },
			{ label: 'Личный ассистент в мессенджерах', next: 2 },
			{ label: 'Компаньон/vtuber, не по работе', next: 'airi' },
			{ label: 'Просто интересно, что вообще бывает', next: 'meta' },
		],
	},
	1: {
		question: 'Где ты хочешь работать?',
		options: [
			{ label: 'В терминале', next: 3 },
			{ label: 'В IDE, без переключения окон', next: 'cursor' },
			{ label: 'Пусть работает в облаке без меня', next: 'devin' },
		],
	},
	2: {
		question: 'Какой приоритет?',
		options: [
			{ label: 'Максимум каналов и платформ', next: 'openclaw' },
			{ label: 'Обучаемая память, растёт с тобой', next: 'hermes_assistant' },
			{ label: 'Минимальный, для embedded/edge', next: 'zeroclaw' },
			{ label: 'Китайские мессенджеры (WeChat/DingTalk)', next: 'qwenpaw' },
			{ label: 'Простая альтернатива без лишнего', next: 'nanobot' },
			{ label: 'Личная память из почты и документов', next: 'openhuman' },
		],
	},
	3: {
		question: 'Что решает выбор?',
		options: [
			{ label: 'Топовый бенчмарк-скор, неважно что закрытое', next: 'codex' },
			{ label: 'Официальный инструмент от Anthropic', next: 'claude_code' },
			{ label: 'Максимум провайдеров, гибкость', next: 'opencode' },
			{ label: 'git-native, простой и предсказуемый', next: 'aider' },
			{ label: 'Скиллы, память, делегирование другим CLI', next: 'hermes_coding' },
			{ label: 'Бесплатно от Google', next: 'gemini_cli' },
		],
	},
};

const results: Record<string, Result> = {
	claude_code: { name: 'Claude Code', color: '#ff6b2b', why: 'Официальный инструмент Anthropic — вложенные суб-агенты, маркетплейс тулов, включён в подписки Pro/Max/Team.' },
	codex: { name: 'Codex', color: '#10a37f', why: '#2 на Terminal-Bench 2.1 (83.1%) — если важнее всего сырой бенчмарк-скор, это он.' },
	opencode: { name: 'OpenCode', color: '#3b82f6', why: 'Provider-agnostic, 75+ провайдеров — не привязан к одному вендору, режимы build/plan.' },
	hermes_coding: { name: 'Hermes Agent', color: '#8b5cf6', why: '~78 скиллов (TDD, debugging, review), персистентная память, умеет делегировать в Claude Code/Codex.' },
	aider: { name: 'Aider', color: '#f59e0b', why: 'git-native с самого начала, простой и предсказуемый — один из старейших в жанре не просто так.' },
	gemini_cli: { name: 'Gemini CLI (Antigravity)', color: '#4285f4', why: 'Бесплатный тир у Google закрылся 18 июня 2026, но Antigravity CLI (преемник) сохранил free-уровень.' },
	cursor: { name: 'Cursor', color: '#00d1b2', why: 'Агент прямо в IDE — не нужно переключаться в терминал. $20/мес Pro.' },
	devin: { name: 'Devin', color: '#ec4899', why: 'Полностью автономный облачный агент от Cognition. В 2026 поглотил Windsurf как Devin Desktop.' },
	openclaw: { name: 'OpenClaw', color: '#ff6b2b', why: '384K+ звёзд, максимум каналов из всей подборки. Открытый код (не классический MIT — см. LICENSE).' },
	hermes_assistant: { name: 'Hermes Agent', color: '#8b5cf6', why: 'Тот же инструмент, что и в coding-ветке — умеет и то, и другое: Telegram/Discord/Slack/WhatsApp/Email плюс постоянная память.' },
	zeroclaw: { name: 'ZeroClaw', color: '#f59e0b', why: 'Один бинарник ~3.4МБ, холодный старт <10мс, работает на Raspberry Pi — для edge, не для десктопа.' },
	qwenpaw: { name: 'QwenPaw', color: '#ef4444', why: 'На стеке Alibaba Qwen/AgentScope — родные DingTalk, WeChat, QQ, которых нет у западных аналогов.' },
	nanobot: { name: 'Nanobot', color: '#10b981', why: 'Минималистичное ядро на Python, README прямо называет себя точкой входа «если пришёл из OpenClaw».' },
	openhuman: { name: 'OpenHuman', color: '#06b6d4', why: 'Не gateway, а память: строит knowledge-graph из почты и документов через 100+ OAuth-интеграций.' },
	airi: { name: 'airi', color: '#ec4899', why: 'Это не coding-инструмент — vtuber/companion-платформа с VRM-аватарами. Но раз ты хочешь именно это — вот оно.' },
	meta: { name: '15 инструментов, 4 категории', color: 'var(--accent)', why: 'Если конкретики пока нет — лучше просто прочитать статью целиком, там разложено по категориям.' },
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
	desc: {
		fontSize: '0.88rem',
		color: 'var(--text-muted)',
		marginBottom: '1.25rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	question: {
		fontSize: '1.1rem',
		fontWeight: 800,
		color: 'var(--text)',
		marginBottom: '1rem',
	} as React.CSSProperties,
	options: { display: 'grid', gap: '0.5rem' } as React.CSSProperties,
	option: {
		padding: '0.85rem 1.1rem',
		borderRadius: '10px',
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
		cursor: 'pointer',
		fontFamily: 'inherit',
		fontSize: '0.9rem',
		fontWeight: 600,
		color: 'var(--text)',
		textAlign: 'left' as const,
		width: '100%',
	} as React.CSSProperties,
	result: (color: string) => ({
		padding: '1.5rem',
		borderRadius: '12px',
		border: `2px solid ${color}`,
		background: `${color}08`,
	} as React.CSSProperties),
	resultName: (color: string) => ({
		fontSize: '1.5rem',
		fontWeight: 900,
		color,
		marginBottom: '0.5rem',
	} as React.CSSProperties),
	resultWhy: {
		fontSize: '0.9rem',
		lineHeight: 1.6,
		color: 'var(--text-secondary)',
	} as React.CSSProperties,
	resetBtn: {
		marginTop: '1rem',
		padding: '0.55rem 1.25rem',
		borderRadius: '8px',
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
		color: 'var(--text)',
		fontSize: '0.85rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
	} as React.CSSProperties,
};

export default function AgentDecisionQuiz() {
	const [current, setCurrent] = useState<number | string>(0);
	const step = typeof current === 'number' ? steps[current] : null;
	const result = typeof current === 'string' ? results[current] : null;

	return (
		<div style={css.wrap}>
			<div style={css.title}>🧭 Какой агент твой</div>
			<div style={css.desc}>Пара вопросов — получи рекомендацию из всех 15 инструментов статьи.</div>

			{step && (
				<>
					<div style={css.question}>{step.question}</div>
					<div style={css.options}>
						{step.options.map((opt) => (
							<button key={opt.label} style={css.option} onClick={() => setCurrent(opt.next)}>{opt.label}</button>
						))}
					</div>
				</>
			)}

			{result && (
				<>
					<div style={css.result(result.color)}>
						<div style={css.resultName(result.color)}>→ {result.name}</div>
						<div style={css.resultWhy}>{result.why}</div>
					</div>
					<button style={css.resetBtn} onClick={() => setCurrent(0)}>🔄 Начать заново</button>
				</>
			)}
		</div>
	);
}
