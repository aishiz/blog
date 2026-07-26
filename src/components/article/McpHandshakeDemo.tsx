import { useState, useEffect, useCallback } from 'react';

const STEPS = [
	{
		actor: 'client' as const,
		method: 'initialize',
		note: 'Клиент открывает сессию: шлёт версию протокола, свои capabilities (что умеет клиент) и информацию о себе',
		json: `{
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-11-25",
    "capabilities": {
      "roots": { "listChanged": true },
      "sampling": {},
      "elicitation": {}
    },
    "clientInfo": {
      "name": "ExampleClient",
      "version": "1.0.0"
    }
  }
}`,
	},
	{
		actor: 'server' as const,
		method: 'initialize → результат',
		note: 'Сервер отвечает своей версией (может отличаться — см. version negotiation), своими capabilities и опциональными инструкциями для модели',
		json: `{
  "result": {
    "protocolVersion": "2025-11-25",
    "capabilities": {
      "tools": { "listChanged": true },
      "resources": { "subscribe": true }
    },
    "serverInfo": {
      "name": "ExampleServer",
      "version": "1.0.0"
    },
    "instructions": "Optional instructions for the client"
  }
}`,
	},
	{
		actor: 'client' as const,
		method: 'notifications/initialized',
		note: 'Клиент подтверждает: рукопожатие завершено, можно работать. До этой нотификации — только ping',
		json: `{
  "method": "notifications/initialized"
}`,
	},
	{
		actor: 'client' as const,
		method: 'tools/list',
		note: 'Обычная работа началась. Клиент спрашивает: какие инструменты у тебя есть?',
		json: `{
  "method": "tools/list",
  "params": {}
}`,
	},
	{
		actor: 'server' as const,
		method: 'tools/list → результат',
		note: 'Сервер отдаёт список: имя, описание и JSON Schema входных параметров — этим и питается модель, выбирая тул',
		json: `{
  "result": {
    "tools": [{
      "name": "get_weather",
      "description": "Get current weather",
      "inputSchema": {
        "type": "object",
        "properties": {
          "location": { "type": "string" }
        },
        "required": ["location"]
      }
    }]
  }
}`,
	},
	{
		actor: 'client' as const,
		method: 'tools/call',
		note: 'Модель решила вызвать тул — клиент шлёт имя и аргументы, ровно по той схеме, что вернул tools/list',
		json: `{
  "method": "tools/call",
  "params": {
    "name": "get_weather",
    "arguments": { "location": "Москва" }
  }
}`,
	},
	{
		actor: 'server' as const,
		method: 'tools/call → результат',
		note: 'Сервер выполнил тул и вернул content — этот текст (или картинку, ресурс) клиент отдаёт модели как результат вызова',
		json: `{
  "result": {
    "content": [{
      "type": "text",
      "text": "Москва: 18°C, облачно"
    }],
    "isError": false
  }
}`,
	},
];

function useIsMobile(breakpoint = 640) {
	const [m, setM] = useState(false);
	useEffect(() => {
		const check = () => setM(window.innerWidth <= breakpoint);
		check();
		window.addEventListener('resize', check, { passive: true });
		return () => window.removeEventListener('resize', check);
	}, [breakpoint]);
	return m;
}

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
		marginBottom: '1.2rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	rail: {
		display: 'flex',
		gap: '4px',
		marginBottom: '1.1rem',
	} as React.CSSProperties,
	railDot: (state: 'done' | 'current' | 'future', actor: 'client' | 'server') => {
		const color = actor === 'client' ? 'var(--accent)' : '#10b981';
		return {
			flex: 1,
			height: '5px',
			borderRadius: '3px',
			background: state === 'future' ? 'var(--border)' : color,
			opacity: state === 'current' ? 1 : state === 'done' ? 0.55 : 1,
			transition: 'all 0.3s ease',
		} as React.CSSProperties;
	},
	actorRow: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.6rem',
		marginBottom: '0.7rem',
	} as React.CSSProperties,
	actorBadge: (actor: 'client' | 'server') => ({
		fontSize: '0.72rem',
		fontWeight: 700,
		padding: '0.25rem 0.65rem',
		borderRadius: '100px',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.04em',
		color: actor === 'client' ? 'var(--accent-light)' : '#10b981',
		background: actor === 'client' ? 'var(--accent-glow)' : '#10b98122',
		border: `1px solid ${actor === 'client' ? 'var(--accent)' : '#10b981'}55`,
	} as React.CSSProperties),
	arrow: {
		fontSize: '0.85rem',
		color: 'var(--text-muted)',
	} as React.CSSProperties,
	method: {
		fontSize: '0.85rem',
		fontWeight: 700,
		color: 'var(--text)',
		fontFamily: 'var(--font-mono, monospace)',
	} as React.CSSProperties,
	note: {
		fontSize: '0.82rem',
		color: 'var(--text-secondary)',
		lineHeight: 1.55,
		marginBottom: '0.9rem',
	} as React.CSSProperties,
	pre: {
		fontFamily: 'var(--font-mono, monospace)',
		fontSize: '0.76rem',
		lineHeight: 1.6,
		padding: '0.9rem 1rem',
		borderRadius: '8px',
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
		overflowX: 'auto' as const,
		margin: 0,
		whiteSpace: 'pre' as const,
	} as React.CSSProperties,
	controls: {
		display: 'flex',
		gap: '0.5rem',
		marginTop: '1.1rem',
		alignItems: 'center',
		flexWrap: 'wrap' as const,
	} as React.CSSProperties,
	btn: (active?: boolean) => ({
		padding: '0.5rem 1rem',
		borderRadius: '8px',
		border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
		background: active ? 'var(--accent-glow)' : 'var(--bg-secondary)',
		color: active ? 'var(--accent-light)' : 'var(--text)',
		fontSize: '0.82rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
		transition: 'all 0.2s ease',
	} as React.CSSProperties),
	stepLabel: {
		fontSize: '0.82rem',
		color: 'var(--text-muted)',
		fontWeight: 600,
		marginLeft: 'auto',
		fontVariantNumeric: 'tabular-nums',
	} as React.CSSProperties,
};

export default function McpHandshakeDemo() {
	const [step, setStep] = useState(0);
	const mobile = useIsMobile();
	const cur = STEPS[step];

	const advance = useCallback(() => {
		setStep((s) => (s >= STEPS.length - 1 ? 0 : s + 1));
	}, []);

	return (
		<div style={{ ...css.wrap, ...(mobile ? { padding: '1rem', margin: '1.25em 0' } : {}) }}>
			<div style={css.title}>🤝 Рукопожатие и первый вызов тула</div>
			<div style={css.desc}>
				Реальные (сокращённые) JSON-RPC сообщения одной MCP-сессии: от <code>initialize</code> до
				результата <code>tools/call</code>. Заголовки <code>jsonrpc: "2.0"</code> и <code>id</code>{' '}
				опущены для читаемости.
			</div>

			<div style={css.rail}>
				{STEPS.map((s, i) => (
					<div key={i} style={css.railDot(i < step ? 'done' : i === step ? 'current' : 'future', s.actor)} />
				))}
			</div>

			<div style={css.actorRow}>
				<span style={css.actorBadge(cur.actor)}>{cur.actor === 'client' ? '💻 Клиент' : '🖥️ Сервер'}</span>
				<span style={css.arrow}>{cur.actor === 'client' ? '→' : '←'}</span>
				<span style={css.method}>{cur.method}</span>
			</div>

			<div style={css.note}>{cur.note}</div>

			<pre style={css.pre}>{cur.json}</pre>

			<div style={css.controls}>
				<button style={css.btn()} onClick={() => setStep((s) => Math.max(0, s - 1))}>← Назад</button>
				<button style={css.btn()} onClick={advance}>Вперёд →</button>
				<span style={css.stepLabel}>Шаг {step + 1}/{STEPS.length}</span>
			</div>
		</div>
	);
}
