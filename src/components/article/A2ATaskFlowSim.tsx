import { useState } from 'react';

// Пошаговый инспектор жизненного цикла задачи в протоколе A2A v1.0:
// Discovery (Agent Card) -> Task submitted/working -> input-required -> SSE progress -> Artifact.

interface A2AStep {
	id: string;
	short: string;
	title: string;
	state: string;
	direction: string;
	explain: string;
	payload: string;
	mcpDiff: string;
}

const STEPS: A2AStep[] = [
	{
		id: 'card',
		short: '1. Agent Card',
		title: 'Discovery: оркестратор читает визитку агента',
		state: 'discovery',
		direction: 'Client Agent → GET /.well-known/agent-card.json → Security Agent',
		explain:
			'Удалённый агент публикует JSON-манифест: кто он, какие навыки (skills) умеет, поддерживает ли стриминг и какую авторизацию требует. Внутренние промпты, модель и память скрыты — это чёрный ящик.',
		payload: `{
  "name": "AppSec Audit Agent",
  "version": "1.2.0",
  "url": "https://sec-agent.corp.internal/a2a",
  "capabilities": { "streaming": true, "pushNotifications": true },
  "skills": [
    {
      "id": "pr-security-review",
      "name": "PR Security Audit",
      "tags": ["sast", "secrets", "owasp"]
    }
  ]
}`,
		mcpDiff: 'В MCP ты заранее знаешь сервер и дёргаешь tools/list — видишь конкретные функции и их JSON-схемы аргументов.',
	},
	{
		id: 'send',
		short: '2. Task Start',
		title: 'Делегирование: создаётся stateful Task',
		state: 'working',
		direction: 'Client Agent → POST /a2a (JSON-RPC / HTTP / gRPC) → Security Agent',
		explain:
			'В отличие от обычного RPC, работа оформляется как долгоживущая задача (Task) со своим ID и машиной состояний. Внутри удалённый агент может сам ходить в свои MCP-серверы (GitHub, Trivy, Semgrep).',
		payload: `{
  "jsonrpc": "2.0",
  "method": "message/stream",
  "params": {
    "message": {
      "role": "user",
      "parts": [
        { "kind": "text", "text": "Проверь PR #418 на утечки и SQLi" },
        { "kind": "data", "data": { "repo": "core/billing", "pr": 418 } }
      ]
    }
  }
}`,
		mcpDiff: 'В MCP tool call обычно синхронный и без многоходового диалога; в A2A задача может жить минуты и часы.',
	},
	{
		id: 'input',
		short: '3. Input Required',
		title: 'Уточнение: агент сам просит недостающие данные',
		state: 'input-required',
		direction: 'Security Agent → SSE event (status: input-required) → Client Agent',
		explain:
			'Удалённый агент увидел миграцию БД, но не знает, публичный ли это эндпоинт. Он переводит Task в статус input-required и задаёт вопрос оркестратору — тот отвечает в тот же taskId.',
		payload: `{
  "taskId": "task_9f3a",
  "status": {
    "state": "input-required",
    "message": {
      "role": "agent",
      "parts": [{
        "kind": "text",
        "text": "Эндпоинт /v2/export доступен снаружи VPC или только внутренним сервисам?"
      }]
    }
  }
}`,
		mcpDiff: 'Пассивный инструмент по MCP либо падает с ошибкой валидации, либо возвращает то, что есть. Агент по A2A ведёт переговоры.',
	},
	{
		id: 'artifact',
		short: '4. Artifact',
		title: 'Финал: задача закрыта, возвращён структурированный Artifact',
		state: 'completed',
		direction: 'Security Agent → SSE event (Artifact + completed) → Client Agent',
		explain:
			'После получения ответа Security Agent завершает проверку и отдаёт результат как Artifact (текст, JSON или файл). Оркестратору вообще всё равно, на чём написан партнёр — хоть LangGraph, хоть голый Go.',
		payload: `{
  "taskId": "task_9f3a",
  "status": { "state": "completed" },
  "artifacts": [
    {
      "name": "security-report.json",
      "parts": [{
        "kind": "data",
        "data": { "verdict": "block", "critical": 1, "finding": "Unparameterized SQL in export.py:84" }
      }]
    }
  ]
}`,
		mcpDiff: 'MCP = вертикаль «агент ↔ его инструменты» (North-South). A2A = горизонталь «агент ↔ чужой агент» (East-West). В проде они работают вместе.',
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
			padding: '0.4rem 0.78rem',
			borderRadius: '8px',
			border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
			background: active ? 'var(--bg-secondary)' : 'transparent',
			color: active ? 'var(--text)' : 'var(--text-secondary)',
			fontSize: '0.79rem',
			fontWeight: 700,
			cursor: 'pointer',
		}) as React.CSSProperties,
	headRow: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		flexWrap: 'wrap' as const,
		gap: '0.5rem',
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	stepTitle: { fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)' } as React.CSSProperties,
	badge: (state: string) =>
		({
			fontSize: '0.72rem',
			fontWeight: 800,
			padding: '0.18rem 0.6rem',
			borderRadius: '100px',
			fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
			color: 'var(--bg)',
			background:
				state === 'completed'
					? 'var(--cat-tools)'
					: state === 'input-required'
						? 'var(--accent-yellow)'
						: 'var(--cat-fundament)',
		}) as React.CSSProperties,
	dir: {
		fontSize: '0.76rem',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
		color: 'var(--accent-light)',
		marginBottom: '0.6rem',
	} as React.CSSProperties,
	explain: { fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.8rem' } as React.CSSProperties,
	pre: {
		margin: '0 0 0.85rem 0',
		padding: '0.85rem 1rem',
		borderRadius: '9px',
		background: 'var(--code-bg)',
		border: '1px solid var(--border)',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
		fontSize: '0.75rem',
		lineHeight: 1.55,
		color: 'var(--text)',
		overflowX: 'auto' as const,
	} as React.CSSProperties,
	mcpBox: {
		padding: '0.7rem 0.9rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border-light)',
		fontSize: '0.82rem',
		color: 'var(--text)',
		lineHeight: 1.55,
	} as React.CSSProperties,
};

export default function A2ATaskFlowSim() {
	const [idx, setIdx] = useState(0);
	const st = STEPS[idx];

	return (
		<div style={css.wrap}>
			<div style={css.title}>🔌 Протокол A2A по шагам: от Agent Card до Artifact</div>
			<div style={css.desc}>
				Покликай по фазам диалога двух независимых агентов — и сравни внизу, чем каждый шаг отличается от
				обычного вызова инструмента по MCP.
			</div>

			<div style={css.tabs}>
				{STEPS.map((s, i) => (
					<button key={s.id} style={css.tab(i === idx)} onClick={() => setIdx(i)}>
						{s.short}
					</button>
				))}
			</div>

			<div style={css.headRow}>
				<div style={css.stepTitle}>{st.title}</div>
				<span style={css.badge(st.state)}>state: {st.state}</span>
			</div>
			<div style={css.dir}>{st.direction}</div>
			<div style={css.explain}>{st.explain}</div>
			<pre style={css.pre}>{st.payload}</pre>
			<div style={css.mcpBox}>
				<strong>Отличие от MCP:</strong> {st.mcpDiff}
			</div>
		</div>
	);
}
