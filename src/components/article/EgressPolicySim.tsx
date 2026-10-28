import { useState } from 'react';

// Упрощённая модель проверки исходящего запроса в OpenShell v0.1.x по документации
// (how-it-works/policies/network-rules, schema, providers). Политика — пример из
// schema.mdx: gh → api.github.com и node → registry.npmjs.org, оба read-only.
// Реальный супервизор проверяет больше (DNS, TLS, middleware), здесь только порядок
// решений: бинарь → запрещённые адреса → L4-правило → L7-правило → креды.

type Binary = 'gh' | 'node' | 'curl' | 'python3';
type Method = 'GET' | 'POST' | 'DELETE';
type Mode = 'enforce' | 'audit';

const BINARIES: Binary[] = ['gh', 'node', 'curl', 'python3'];
const HOSTS = ['api.github.com', 'registry.npmjs.org', 'files.example.net', '169.254.169.254'];
const METHODS: Method[] = ['GET', 'POST', 'DELETE'];
const PATHS = ['/repos/aishiz/blog', '/repos/aishiz/blog/issues', '/@types%2fnode', '/latest/meta-data/'];

const RULES = [
	{ name: 'github_rest_api', host: 'api.github.com', bin: 'gh' as Binary, encodedSlash: false },
	{ name: 'npm_registry', host: 'registry.npmjs.org', bin: 'node' as Binary, encodedSlash: true },
];
const READ_ONLY: Method[] = ['GET'];
// Креды провайдера github привязаны только к api.github.com:443
const CRED_HOST = 'api.github.com';

type Req = { bin: Binary; host: string; method: Method; path: string; token: boolean; tampered: boolean };
type Step = { label: string; status: 'pass' | 'fail' | 'warn' | 'skip'; text: string };

const PRESETS: { label: string; req: Req }[] = [
	{ label: 'gh читает репо', req: { bin: 'gh', host: 'api.github.com', method: 'GET', path: '/repos/aishiz/blog', token: true, tampered: false } },
	{ label: 'gh создаёт issue', req: { bin: 'gh', host: 'api.github.com', method: 'POST', path: '/repos/aishiz/blog/issues', token: true, tampered: false } },
	{ label: 'curl идёт в GitHub', req: { bin: 'curl', host: 'api.github.com', method: 'GET', path: '/repos/aishiz/blog', token: true, tampered: false } },
	{ label: 'токен едет в npm', req: { bin: 'node', host: 'registry.npmjs.org', method: 'GET', path: '/@types%2fnode', token: true, tampered: false } },
	{ label: 'выгрузка наружу', req: { bin: 'python3', host: 'files.example.net', method: 'POST', path: '/repos/aishiz/blog', token: false, tampered: false } },
	{ label: 'метаданные облака', req: { bin: 'python3', host: '169.254.169.254', method: 'GET', path: '/latest/meta-data/', token: false, tampered: false } },
	{ label: 'подменённый gh', req: { bin: 'gh', host: 'api.github.com', method: 'GET', path: '/repos/aishiz/blog', token: true, tampered: true } },
];

function evaluate(r: Req, mode: Mode): { steps: Step[]; verdict: 'allow' | 'deny' | 'audit' } {
	const steps: Step[] = [];
	const deny = () => {
		while (steps.length < 5) steps.push({ label: STEP_LABELS[steps.length], status: 'skip', text: 'не дошли' });
		return { steps, verdict: 'deny' as const };
	};

	if (r.tampered) {
		steps.push({ label: STEP_LABELS[0], status: 'fail', text: `Хэш /usr/bin/${r.bin} не совпал с тем, что OpenShell запомнил при первом соединении. Файл подменили, соединение запрещено.` });
		return deny();
	}
	steps.push({ label: STEP_LABELS[0], status: 'pass', text: `seccomp перехватил connect(), песочница определила бинарь /usr/bin/${r.bin}, хэш совпал.` });

	if (r.host.startsWith('169.254.')) {
		steps.push({ label: STEP_LABELS[1], status: 'fail', text: 'Это link-local адрес, на нём сидят метаданные облака. Сюда политика не пустит никогда, даже если ты сам впишешь правило.' });
		return deny();
	}
	steps.push({ label: STEP_LABELS[1], status: 'pass', text: 'Это не loopback, не link-local и не 0.0.0.0.' });

	const byHost = RULES.find((x) => x.host === r.host);
	const rule = RULES.find((x) => x.host === r.host && x.bin === r.bin);
	if (!rule) {
		steps.push({
			label: STEP_LABELS[2],
			status: 'fail',
			text: byHost
				? `Правило ${byHost.name} пускает на ${r.host} только /usr/bin/${byHost.bin}, а ${r.bin} в списке binaries нет.`
				: `Ни в одном правиле нет ${r.host}, а всё, что не разрешено, запрещено. OpenShell сам набросает черновик правила, но этот запрос уже отклонён.`,
		});
		return deny();
	}
	steps.push({ label: STEP_LABELS[2], status: 'pass', text: `Правило ${rule.name}: ${r.host}:443 для /usr/bin/${r.bin}.` });

	let l7: string | null = null;
	if (!READ_ONLY.includes(r.method)) l7 = `${r.method} не входит в access: read-only (GET, HEAD, OPTIONS).`;
	else if (r.path.toLowerCase().includes('%2f') && !rule.encodedSlash) l7 = `В пути %2F, а allow_encoded_slash у ${rule.name} выключен.`;
	let audited = false;
	if (l7) {
		if (mode === 'enforce') {
			steps.push({ label: STEP_LABELS[3], status: 'fail', text: `${l7} Стоит enforcement: enforce, поэтому 403.` });
			return deny();
		}
		audited = true;
		steps.push({ label: STEP_LABELS[3], status: 'warn', text: `${l7} Но стоит enforcement: audit, так что нарушение просто записали в лог и запрос пропустили.` });
	} else {
		steps.push({ label: STEP_LABELS[3], status: 'pass', text: `${r.method} ${r.path} укладывается в read-only.` });
	}

	if (!r.token) {
		steps.push({ label: STEP_LABELS[4], status: 'skip', text: 'Заглушек в запросе нет, подставлять нечего.' });
	} else if (r.host !== CRED_HOST) {
		steps.push({ label: STEP_LABELS[4], status: 'fail', text: `В запросе заглушка GITHUB_TOKEN, но кред к ${r.host} не привязан. 403, credential_endpoint_mismatch.` });
		return { steps, verdict: 'deny' };
	} else {
		steps.push({ label: STEP_LABELS[4], status: 'pass', text: 'Супервизор заменил openshell:resolve:env:GITHUB_TOKEN на настоящий токен уже на выходе. Агент этот токен так и не увидел.' });
	}
	return { steps, verdict: audited ? 'audit' : 'allow' };
}

const STEP_LABELS = ['Кто звонит', 'Куда нельзя никогда', 'L4: хост + порт + бинарь', 'L7: метод + путь', 'Креды'];

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
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.1rem', lineHeight: 1.6 } as React.CSSProperties,
	presets: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' as const, marginBottom: '1rem' } as React.CSSProperties,
	chip: (active: boolean) =>
		({
			padding: '0.35rem 0.7rem',
			borderRadius: '8px',
			border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
			background: active ? 'var(--bg-secondary)' : 'transparent',
			color: active ? 'var(--text)' : 'var(--text-secondary)',
			fontSize: '0.78rem',
			fontWeight: 700,
			cursor: 'pointer',
		}) as React.CSSProperties,
	grid: { display: 'flex', flexWrap: 'wrap' as const, gap: '0.6rem', marginBottom: '0.8rem' } as React.CSSProperties,
	field: { display: 'flex', flexDirection: 'column' as const, gap: '0.25rem', flex: '1 1 130px', minWidth: 0 } as React.CSSProperties,
	flabel: { fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'var(--text-secondary)' } as React.CSSProperties,
	select: {
		padding: '0.4rem 0.5rem',
		borderRadius: '6px',
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
		color: 'var(--text)',
		fontSize: '0.8rem',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
		minWidth: 0,
	} as React.CSSProperties,
	toggles: { display: 'flex', flexWrap: 'wrap' as const, gap: '0.5rem 1.2rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' } as React.CSSProperties,
	check: { display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' } as React.CSSProperties,
	req: {
		padding: '0.6rem 0.8rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
		fontSize: '0.76rem',
		color: 'var(--text)',
		lineHeight: 1.6,
		marginBottom: '0.9rem',
		overflowWrap: 'anywhere' as const,
	} as React.CSSProperties,
	step: { display: 'flex', gap: '0.6rem', marginBottom: '0.5rem', alignItems: 'flex-start' } as React.CSSProperties,
	badge: (s: Step['status']) =>
		({
			flexShrink: 0,
			width: '1.5rem',
			height: '1.5rem',
			borderRadius: '50%',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			fontSize: '0.75rem',
			fontWeight: 800,
			color: 'var(--bg)',
			background:
				s === 'pass' ? 'var(--cat-tools)' : s === 'fail' ? 'var(--accent-magenta)' : s === 'warn' ? 'var(--accent-yellow)' : 'var(--border-light)',
		}) as React.CSSProperties,
	stepLabel: { fontSize: '0.78rem', fontWeight: 800, color: 'var(--text)' } as React.CSSProperties,
	stepText: (s: Step['status']) =>
		({ fontSize: '0.8rem', color: s === 'skip' ? 'var(--text-muted)' : 'var(--text-secondary)', lineHeight: 1.5 }) as React.CSSProperties,
	verdict: (v: 'allow' | 'deny' | 'audit') =>
		({
			marginTop: '0.9rem',
			padding: '0.75rem 0.9rem',
			borderRadius: '8px',
			border: `1px solid ${v === 'allow' ? 'var(--cat-tools)' : v === 'deny' ? 'var(--accent-magenta)' : 'var(--accent-yellow)'}`,
			background: 'var(--bg-secondary)',
			fontSize: '0.86rem',
			color: 'var(--text)',
			lineHeight: 1.6,
		}) as React.CSSProperties,
	note: { marginTop: '0.9rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

const ICON: Record<Step['status'], string> = { pass: '✓', fail: '✕', warn: '!', skip: '·' };
const VERDICT = {
	allow: '✅ Пропущено. Запрос ушёл, ответ вернётся агенту.',
	deny: '⛔ Отклонено. До адресата запрос не дошёл.',
	audit: '⚠️ Пропущено в режиме audit. Нарушение есть только в логе, запрос ушёл.',
};

export default function EgressPolicySim() {
	const [req, setReq] = useState<Req>(PRESETS[0].req);
	const [mode, setMode] = useState<Mode>('enforce');
	const set = <K extends keyof Req>(k: K, v: Req[K]) => setReq((r) => ({ ...r, [k]: v }));
	const { steps, verdict } = evaluate(req, mode);
	const active = PRESETS.findIndex((p) => JSON.stringify(p.req) === JSON.stringify(req));

	return (
		<div style={css.wrap}>
			<div style={css.title}>🚦 Пропустит или нет</div>
			<div style={css.desc}>
				Политика из документации: <code>gh</code> может читать <code>api.github.com</code>, <code>node</code> может
				читать <code>registry.npmjs.org</code>, больше ничего. К песочнице подключён провайдер GitHub. Собери
				запрос и посмотри, на каком шаге его пропустят или завернут.
			</div>

			<div style={css.presets}>
				{PRESETS.map((p, i) => (
					<button key={p.label} style={css.chip(i === active)} onClick={() => setReq(p.req)}>{p.label}</button>
				))}
			</div>

			<div style={css.grid}>
				<label style={css.field}>
					<span style={css.flabel}>бинарь</span>
					<select style={css.select} value={req.bin} onChange={(e) => set('bin', e.target.value as Binary)}>
						{BINARIES.map((b) => <option key={b}>{b}</option>)}
					</select>
				</label>
				<label style={css.field}>
					<span style={css.flabel}>хост</span>
					<select style={css.select} value={req.host} onChange={(e) => set('host', e.target.value)}>
						{HOSTS.map((h) => <option key={h}>{h}</option>)}
					</select>
				</label>
				<label style={css.field}>
					<span style={css.flabel}>метод</span>
					<select style={css.select} value={req.method} onChange={(e) => set('method', e.target.value as Method)}>
						{METHODS.map((m) => <option key={m}>{m}</option>)}
					</select>
				</label>
				<label style={css.field}>
					<span style={css.flabel}>путь</span>
					<select style={css.select} value={req.path} onChange={(e) => set('path', e.target.value)}>
						{PATHS.map((p) => <option key={p}>{p}</option>)}
					</select>
				</label>
			</div>

			<div style={css.toggles}>
				<label style={css.check}>
					<input type="checkbox" checked={req.token} onChange={(e) => set('token', e.target.checked)} />
					приложить GITHUB_TOKEN
				</label>
				<label style={css.check}>
					<input type="checkbox" checked={req.tampered} onChange={(e) => set('tampered', e.target.checked)} />
					бинарь подменили
				</label>
				<label style={css.check}>
					<input type="checkbox" checked={mode === 'audit'} onChange={(e) => setMode(e.target.checked ? 'audit' : 'enforce')} />
					enforcement: audit (это дефолт!)
				</label>
			</div>

			<div style={css.req}>
				/usr/bin/{req.bin} → {req.method} https://{req.host}{req.path}
				{req.token && <><br />Authorization: Bearer openshell:resolve:env:GITHUB_TOKEN</>}
			</div>

			{steps.map((s, i) => (
				<div key={i} style={css.step}>
					<span style={css.badge(s.status)}>{ICON[s.status]}</span>
					<div>
						<div style={css.stepLabel}>{i + 1}. {s.label}</div>
						<div style={css.stepText(s.status)}>{s.text}</div>
					</div>
				</div>
			))}

			<div style={css.verdict(verdict)}>{VERDICT[verdict]}</div>

			<div style={css.note}>
				Это игрушечная модель по документации v0.1.6, а не сам супервизор. Настоящий ещё отвечает на DNS
				заглушками, расшифровывает TLS, чтобы заглянуть в запрос, и прогоняет трафик через middleware. Порядок
				проверок и тексты отказов упрощены.
			</div>
		</div>
	);
}
