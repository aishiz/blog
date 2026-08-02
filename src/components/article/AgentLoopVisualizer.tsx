import { useState } from 'react';

// Трейс реального прогона агента по задаче «почини баг, добейся зелёных тестов».
// Решения модели сценарные, результаты тулов — настоящий вывод (pytest и файлы).
type Step = {
	kind: 'user' | 'llm' | 'tool' | 'final';
	title: string;
	detail?: string;
	tool?: string;
	args?: string;
	result?: string;
	messages: number;
};

const TRACE: Step[] = [
	{
		kind: 'user',
		title: 'Задача',
		detail: 'Тесты падают. Найди причину, почини код и добейся, чтобы все тесты прошли.',
		messages: 2,
	},
	{
		kind: 'llm',
		title: 'Модель просит list_dir',
		tool: 'list_dir',
		args: '{"path": "."}',
		messages: 3,
	},
	{
		kind: 'tool',
		title: 'Результат list_dir',
		result: 'calc.py\ntest_calc.py',
		messages: 4,
	},
	{
		kind: 'llm',
		title: 'Модель просит run_shell',
		tool: 'run_shell',
		args: '{"cmd": "python -m pytest -q"}',
		messages: 5,
	},
	{
		kind: 'tool',
		title: 'Тесты упали',
		result: 'exit=1\nF.  [100%]\nFAILED test_calc.py::test_add - assert -1 == 5\n1 failed, 1 passed in 0.01s',
		messages: 6,
	},
	{
		kind: 'llm',
		title: 'Модель просит read_file',
		tool: 'read_file',
		args: '{"path": "calc.py"}',
		messages: 7,
	},
	{
		kind: 'tool',
		title: 'Содержимое calc.py',
		result: 'def add(a, b):\n    return a - b\n\n\ndef mul(a, b):\n    return a * b',
		messages: 8,
	},
	{
		kind: 'llm',
		title: 'Модель правит файл',
		tool: 'write_file',
		args: '{"path": "calc.py", "content": "def add(a, b):\\n    return a + b\\n\\n\\ndef mul(a, b):\\n    return a * b\\n"}',
		messages: 9,
	},
	{
		kind: 'tool',
		title: 'Файл записан',
		result: 'записано: calc.py (66 символов)',
		messages: 10,
	},
	{
		kind: 'llm',
		title: 'Модель просит run_shell',
		tool: 'run_shell',
		args: '{"cmd": "python -m pytest -q"}',
		messages: 11,
	},
	{
		kind: 'tool',
		title: 'Тесты зелёные',
		result: 'exit=0\n..  [100%]\n2 passed in 0.00s',
		messages: 12,
	},
	{
		kind: 'final',
		title: 'Финальный ответ',
		detail: 'Готово: баг в add() был в знаке, тесты зелёные.',
		messages: 13,
	},
];

const KIND_COLOR: Record<Step['kind'], string> = {
	user: 'var(--accent-secondary)',
	llm: 'var(--accent)',
	tool: 'var(--accent-yellow)',
	final: '#22c55e',
};

const KIND_LABEL: Record<Step['kind'], string> = {
	user: 'ты',
	llm: 'модель',
	tool: 'наш код',
	final: 'ответ',
};

const css = {
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.1rem', lineHeight: 1.6 } as React.CSSProperties,
	main: { display: 'flex', gap: '1.25rem', flexWrap: 'wrap' as const, alignItems: 'flex-start' } as React.CSSProperties,
	rail: { flex: '1 1 210px', minWidth: '190px', display: 'flex', flexDirection: 'column' as const, gap: '0.3rem' } as React.CSSProperties,
	railItem: (active: boolean, color: string) => ({
		display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', borderRadius: '8px', cursor: 'pointer',
		background: active ? 'var(--bg-secondary)' : 'transparent',
		border: `1px solid ${active ? color : 'transparent'}`,
		fontSize: '0.78rem', fontWeight: active ? 700 : 500,
		color: active ? 'var(--text)' : 'var(--text-muted)', textAlign: 'left' as const, width: '100%',
	} as React.CSSProperties),
	dot: (color: string) => ({ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 } as React.CSSProperties),
	panel: { flex: '2 1 300px', minWidth: '260px' } as React.CSSProperties,
	badge: (color: string) => ({ display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.04em', color, border: `1px solid ${color}`, marginBottom: '0.5rem' } as React.CSSProperties),
	panelTitle: { fontSize: '1rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.6rem' } as React.CSSProperties,
	code: { display: 'block', padding: '0.7rem 0.85rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: '0.78rem', lineHeight: 1.5, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' as const, wordBreak: 'break-word' as const, marginBottom: '0.6rem', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' } as React.CSSProperties,
	label: { fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.25rem' } as React.CSSProperties,
	ctx: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.8rem', fontSize: '0.8rem', color: 'var(--text-muted)' } as React.CSSProperties,
	ctxBar: { flex: 1, height: '6px', borderRadius: '3px', background: 'var(--bg-secondary)', overflow: 'hidden', position: 'relative' as const } as React.CSSProperties,
	ctxFill: (pct: number) => ({ width: `${pct}%`, height: '100%', background: 'var(--accent)' } as React.CSSProperties),
	nav: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '1rem' } as React.CSSProperties,
	btn: (disabled: boolean) => ({ padding: '0.4rem 0.9rem', borderRadius: '100px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: disabled ? 'var(--text-muted)' : 'var(--text)', fontSize: '0.8rem', fontWeight: 700, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1 } as React.CSSProperties),
	counter: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties,
};

export default function AgentLoopVisualizer() {
	const [i, setI] = useState(0);
	const step = TRACE[i];
	const maxMsg = TRACE[TRACE.length - 1].messages;
	const color = KIND_COLOR[step.kind];

	return (
		<div style={css.wrap}>
			<div style={css.title}>🔁 Агент-луп по шагам</div>
			<div style={css.desc}>
				Тот самый цикл из статьи, шаг за шагом: модель просит тул → наш код его выполняет → результат
				возвращается в контекст → модель решает, что дальше. Листай и смотри, как растёт список сообщений.
				Решения по шагам в этом трейсе сценарные, результаты тулов — настоящие (см. часть 4).
			</div>

			<div style={css.main}>
				<div style={css.rail}>
					{TRACE.map((s, idx) => (
						<button
							key={idx}
							style={css.railItem(idx === i, KIND_COLOR[s.kind])}
							onClick={() => setI(idx)}
							aria-current={idx === i}
						>
							<span style={css.dot(KIND_COLOR[s.kind])} />
							{s.title}
						</button>
					))}
				</div>

				<div style={css.panel}>
					<span style={css.badge(color)}>{KIND_LABEL[step.kind]}</span>
					<h4 style={css.panelTitle}>{step.title}</h4>

					{step.detail && <code style={css.code}>{step.detail}</code>}

					{step.tool && (
						<>
							<div style={css.label}>вызов тула</div>
							<code style={css.code}>{step.tool}({step.args})</code>
						</>
					)}

					{step.result && (
						<>
							<div style={css.label}>результат → в контекст как role: "tool"</div>
							<code style={css.code}>{step.result}</code>
						</>
					)}

					<div style={css.ctx}>
						<span>сообщений в контексте: <strong>{step.messages}</strong></span>
						<span style={css.ctxBar}>
							<span style={css.ctxFill((step.messages / maxMsg) * 100)} />
						</span>
					</div>

					<div style={css.nav}>
						<button style={css.btn(i === 0)} onClick={() => setI((v) => Math.max(0, v - 1))} disabled={i === 0}>← назад</button>
						<button style={css.btn(i === TRACE.length - 1)} onClick={() => setI((v) => Math.min(TRACE.length - 1, v + 1))} disabled={i === TRACE.length - 1}>вперёд →</button>
						<span style={css.counter}>{i + 1} / {TRACE.length}</span>
					</div>
				</div>
			</div>
		</div>
	);
}
