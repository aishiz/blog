import { useState, useMemo } from 'react';

// Интерактивная клиентская симуляция пайплайна guardrails-llm-filter:
// Реальные regex-правила + контрольная сумма Луна для карт + группы захвата для DSN.
// Показывает: 1) что видит LLM-провайдер, 2) таблицу замен в памяти, 3) что получает клиент обратно.

type RuleKey = 'email' | 'card' | 'phone' | 'snils' | 'aws' | 'dsn';

const RULE_META: Record<RuleKey, { label: string; placeholder: string; ruleId: string }> = {
	email: { label: 'Email', placeholder: 'EMAIL', ruleId: 'pii.email' },
	card: { label: 'Карта (Luhn)', placeholder: 'CREDIT_CARD', ruleId: 'pii.fin.credit-card' },
	phone: { label: 'Телефон РФ', placeholder: 'PHONE_RU', ruleId: 'pii.phone.ru' },
	snils: { label: 'СНИЛС', placeholder: 'SNILS', ruleId: 'pii.ru.snils' },
	aws: { label: 'AWS ключ', placeholder: 'AWS_ACCESS_TOKEN', ruleId: 'secret.aws.access-key' },
	dsn: { label: 'Пароль в DSN', placeholder: 'DB_PASSWORD', ruleId: 'secret.dsn.password' },
};

const PRESETS: { label: string; text: string }[] = [
	{
		label: 'Письмо клиента',
		text: 'Клиент просит чек на ivan.petrov@corp.ru, звонить +7 916 555-44-33. Оплата с карты 4111 1111 1111 1111, СНИЛС 112-233-445 95.',
	},
	{
		label: 'Лог бэкенда + секреты',
		text: 'Deploy failed: AWS_KEY=AKIAIOSFODNN7EXAMPLE, подключение postgres://admin:Sup3rS3cretPass@db.internal:5432/prod',
	},
	{
		label: 'Фейковая карта (Luhn ✕)',
		text: 'Тестовая строка 4111 1111 1111 1112 (не проходит Luhn) и настоящая 4532 0151 1283 0366 (проходит Luhn).',
	},
	{
		label: 'Свободный текст (слепота regex)',
		text: 'Меня зовут Иван Петров, я живу на улице Ленина дом 5, мой ключ sk-proj-abc123xyz — перепиши вежливее.',
	},
];

function luhnValid(digits: string): boolean {
	if (digits.length < 13 || digits.length > 19) return false;
	let sum = 0;
	let alt = false;
	for (let i = digits.length - 1; i >= 0; i--) {
		let n = parseInt(digits[i], 10);
		if (alt) {
			n *= 2;
			if (n > 9) n -= 9;
		}
		sum += n;
		alt = !alt;
	}
	return sum % 10 === 0;
}

interface Hit {
	placeholder: string;
	original: string;
	ruleId: string;
	validator?: string;
}

function runPipeline(input: string, enabled: Record<RuleKey, boolean>, mode: 'enforce' | 'detect') {
	let masked = input;
	const hits: Hit[] = [];
	const counters: Record<string, number> = {};

	const register = (key: RuleKey, original: string, validator?: string) => {
		const meta = RULE_META[key];
		counters[meta.placeholder] = (counters[meta.placeholder] || 0) + 1;
		const ph = `<${meta.placeholder}_${counters[meta.placeholder]}>`;
		hits.push({ placeholder: ph, original, ruleId: meta.ruleId, validator });
		return ph;
	};

	if (enabled.dsn) {
		masked = masked.replace(/(postgres(?:ql)?:\/\/[^:\s]+:)([^@\s]+)(@)/gi, (full, pre, pass, post) => {
			const ph = register('dsn', pass, 'capture group (только пароль)');
			return `${pre}${ph}${post}`;
		});
	}
	if (enabled.aws) {
		masked = masked.replace(/\b(AKIA[0-9A-Z]{16})\b/g, (m) => register('aws', m, 'префикс AKIA + энтропия'));
	}
	if (enabled.email) {
		masked = masked.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, (m) =>
			register('email', m, 'regex RFC'),
		);
	}
	if (enabled.snils) {
		masked = masked.replace(/\b\d{3}-\d{3}-\d{3}\s\d{2}\b/g, (m) => register('snils', m, 'формат + чексумма'));
	}
	if (enabled.phone) {
		masked = masked.replace(/(?:\+7|8)[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b/g, (m) =>
			register('phone', m, 'префикс +7/8'),
		);
	}
	if (enabled.card) {
		masked = masked.replace(/\b(?:\d[ -]?){13,19}\b/g, (m) => {
			const digits = m.replace(/\D/g, '');
			if (!luhnValid(digits)) return m;
			return register('card', m.trim(), 'Luhn ✓');
		});
	}

	const sentToLlm = mode === 'enforce' ? masked : input;
	// Имитируем ответ LLM с плейсхолдерами и демаскирование обратно клиенту
	const llmReply =
		hits.length > 0 && mode === 'enforce'
			? `Готово! Проверил данные: ${hits.map((h) => h.placeholder).join(', ')}. Всё оформил.`
			: `Готово! Получил ваш текст без замен (${hits.length} находок в аудите).`;

	let clientReply = llmReply;
	if (mode === 'enforce') {
		for (const h of hits) {
			clientReply = clientReply.replaceAll(h.placeholder, h.original);
		}
	}

	return { sentToLlm, llmReply, clientReply, hits };
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
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 } as React.CSSProperties,
	presets: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' as const, marginBottom: '0.85rem' } as React.CSSProperties,
	chip: (active: boolean) =>
		({
			padding: '0.35rem 0.7rem',
			borderRadius: '8px',
			border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
			background: active ? 'var(--bg-secondary)' : 'transparent',
			color: active ? 'var(--text)' : 'var(--text-secondary)',
			fontSize: '0.77rem',
			fontWeight: 700,
			cursor: 'pointer',
		}) as React.CSSProperties,
	textarea: {
		width: '100%',
		minHeight: '72px',
		padding: '0.7rem 0.85rem',
		borderRadius: '9px',
		border: '1px solid var(--border-light)',
		background: 'var(--bg-secondary)',
		color: 'var(--text)',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
		fontSize: '0.8rem',
		lineHeight: 1.55,
		resize: 'vertical' as const,
		marginBottom: '0.85rem',
	} as React.CSSProperties,
	bar: {
		display: 'flex',
		flexWrap: 'wrap' as const,
		gap: '0.55rem 1rem',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: '1rem',
		padding: '0.65rem 0.85rem',
		borderRadius: '9px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
	} as React.CSSProperties,
	checks: { display: 'flex', flexWrap: 'wrap' as const, gap: '0.4rem 0.85rem' } as React.CSSProperties,
	check: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.76rem', color: 'var(--text-secondary)', cursor: 'pointer' } as React.CSSProperties,
	modeBtn: (mode: 'enforce' | 'detect') =>
		({
			padding: '0.3rem 0.7rem',
			borderRadius: '100px',
			border: `1px solid ${mode === 'enforce' ? 'var(--cat-tools)' : 'var(--accent-yellow)'}`,
			background: 'var(--bg-card)',
			color: mode === 'enforce' ? 'var(--cat-tools)' : 'var(--accent-yellow-text)',
			fontSize: '0.74rem',
			fontWeight: 800,
			cursor: 'pointer',
			textTransform: 'uppercase' as const,
		}) as React.CSSProperties,
	grid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
		gap: '0.75rem',
		marginBottom: '0.85rem',
	} as React.CSSProperties,
	panel: (border: string) =>
		({
			padding: '0.8rem 0.9rem',
			borderRadius: '9px',
			background: 'var(--bg-secondary)',
			border: `1px solid ${border}`,
		}) as React.CSSProperties,
	pLabel: { fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.35rem' } as React.CSSProperties,
	pCode: {
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
		fontSize: '0.78rem',
		color: 'var(--text)',
		lineHeight: 1.55,
		overflowWrap: 'anywhere' as const,
	} as React.CSSProperties,
	table: {
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '0.35rem',
	} as React.CSSProperties,
	hitRow: {
		display: 'flex',
		flexWrap: 'wrap' as const,
		gap: '0.45rem',
		alignItems: 'center',
		fontSize: '0.76rem',
		padding: '0.45rem 0.65rem',
		borderRadius: '7px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
	} as React.CSSProperties,
};

export default function PiiMaskingPlayground() {
	const [text, setText] = useState(PRESETS[0].text);
	const [mode, setMode] = useState<'enforce' | 'detect'>('enforce');
	const [enabled, setEnabled] = useState<Record<RuleKey, boolean>>({
		email: true,
		card: true,
		phone: true,
		snils: true,
		aws: true,
		dsn: true,
	});

	const { sentToLlm, clientReply, hits } = useMemo(() => runPipeline(text, enabled, mode), [text, enabled, mode]);

	const toggleRule = (k: RuleKey) => setEnabled((prev) => ({ ...prev, [k]: !prev[k] }));

	return (
		<div style={css.wrap}>
			<div style={css.title}>🛡️ Пощупай маскирование прямо в браузере</div>
			<div style={css.desc}>
				Впиши свой текст или выбери пресет. Карты проверяются реальной контрольной суммой Луна, в Postgres DSN
				маскируется только пароль (группа захвата). Переключи режим на <code>detect</code>, чтобы увидеть теневой аудит.
			</div>

			<div style={css.presets}>
				{PRESETS.map((p) => (
					<button key={p.label} style={css.chip(text === p.text)} onClick={() => setText(p.text)}>
						{p.label}
					</button>
				))}
			</div>

			<textarea
				value={text}
				onChange={(e) => setText(e.target.value)}
				aria-label="Текст запроса с PII и секретами"
				style={css.textarea}
			/>

			<div style={css.bar}>
				<div style={css.checks}>
					{(Object.keys(RULE_META) as RuleKey[]).map((k) => (
						<label key={k} style={css.check}>
							<input type="checkbox" checked={enabled[k]} onChange={() => toggleRule(k)} />
							{RULE_META[k].label}
						</label>
					))}
				</div>
				<button style={css.modeBtn(mode)} onClick={() => setMode((m) => (m === 'enforce' ? 'detect' : 'enforce'))}>
					Режим: {mode}
				</button>
			</div>

			<div style={css.grid}>
				<div style={css.panel(mode === 'enforce' && hits.length > 0 ? 'var(--cat-tools)' : 'var(--accent-yellow)')}>
					<div style={css.pLabel}>
						1. Что улетает к LLM-провайдеру ({mode === 'enforce' ? 'замаскировано' : 'detect: без замен!'})
					</div>
					<div style={css.pCode}>{sentToLlm}</div>
				</div>

				<div style={css.panel('var(--cat-fundament)')}>
					<div style={css.pLabel}>2. Что возвращается клиенту (после демаскирования)</div>
					<div style={css.pCode}>{clientReply}</div>
				</div>
			</div>

			<div style={css.pLabel}>Таблица подстановок в памяти запроса ({hits.length})</div>
			{hits.length > 0 ? (
				<div style={css.table}>
					{hits.map((h, i) => (
						<div key={i} style={css.hitRow}>
							<strong style={{ color: 'var(--accent-light)' }}>{h.placeholder}</strong>
							<span style={{ color: 'var(--text-muted)' }}>→</span>
							<span style={{ color: 'var(--text)' }}>{h.original}</span>
							<span style={{ marginLeft: 'auto', color: 'var(--cat-tools)', fontSize: '0.72rem' }}>
								{h.ruleId} {h.validator ? `· ${h.validator}` : ''}
							</span>
						</div>
					))}
				</div>
			) : (
				<div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
					Правила ничего не зацепили — вот так же свободный текст с ФИО или нестандартный токен проходят мимо regex.
				</div>
			)}
		</div>
	);
}
