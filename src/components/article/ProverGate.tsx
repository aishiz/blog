import { useState } from 'react';

// Модель проверки предложений policy advisor по crates/openshell-prover/README.md:
// четыре категории находок (link_local_reach, l7_bypass_credentialed,
// credential_reach_expansion, capability_expansion), две последние считаются как дельта
// между базовой и объединённой политикой. Плюс отдельная эвристика advisor-а на
// приватные адреса и wildcard-хосты (docs/how-it-works/policies/advisor.mdx).
// Настоящий prover решает это через Z3 по всей политике, здесь всё на пальцах.

type Rule = { bin: string; host: string; port: number; methods: string[]; tcp?: boolean };

// Базовая политика: gh только читает API GitHub
const BASELINE: Rule[] = [{ bin: 'gh', host: 'api.github.com', port: 443, methods: ['GET', 'HEAD', 'OPTIONS'] }];
// Где в песочнице есть креды: провайдер GitHub (токен API и ssh-ключ)
const CRED_SCOPE = ['api.github.com:443', 'github.com:22'];
// Реестр бинарей: кто умеет ходить мимо HTTP-инспекции
const BYPASSES_L7: Record<string, boolean> = { ssh: true };

const PROPOSALS: { label: string; why: string; rule: Rule }[] = [
	{ label: 'pip → pypi.org', why: 'Агенту надо поставить пакет.', rule: { bin: 'pip', host: 'pypi.org', port: 443, methods: ['GET', 'HEAD', 'OPTIONS'] } },
	{ label: 'gh → read-write', why: 'Агент хочет создать issue, а для этого нужен POST.', rule: { bin: 'gh', host: 'api.github.com', port: 443, methods: ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH'] } },
	{ label: 'curl → api.github.com', why: 'Агент хочет дёрнуть API напрямую, мимо gh.', rule: { bin: 'curl', host: 'api.github.com', port: 443, methods: ['GET', 'HEAD', 'OPTIONS'] } },
	{ label: 'ssh → github.com:22', why: 'Агент хочет git push по ssh.', rule: { bin: 'ssh', host: 'github.com', port: 22, methods: [], tcp: true } },
	{ label: 'python3 → 169.254.169.254', why: 'Скрипт хочет узнать регион инстанса.', rule: { bin: 'python3', host: '169.254.169.254', port: 80, methods: ['GET', 'HEAD', 'OPTIONS'] } },
	{ label: 'python3 → *.example.net', why: 'Агенту нужен «какой-то CDN».', rule: { bin: 'python3', host: '*.example.net', port: 443, methods: ['GET', 'HEAD', 'OPTIONS'] } },
];

type Finding = { id: string; q: string; hit: boolean; why: string };

function check(p: Rule) {
	const key = `${p.host}:${p.port}`;
	const cred = CRED_SCOPE.includes(key);
	const base = BASELINE.find((b) => b.bin === p.bin && b.host === p.host && b.port === p.port);
	const linkLocal = p.host.startsWith('169.254.') || p.host.toLowerCase().startsWith('fe80:');
	const bypass = (p.tcp || BYPASSES_L7[p.bin]) && cred;
	const reach = cred && !base;
	const newMethods = base ? p.methods.filter((m) => !base.methods.includes(m)) : [];
	const capability = cred && !!base && newMethods.length > 0 && !reach;

	const findings: Finding[] = [
		{ id: 'link_local_reach', q: 'Пускает на 169.254.0.0/16 или fe80::/10?', hit: linkLocal, why: 'Там метаданные облака и временные креды инстанса.' },
		{ id: 'l7_bypass_credentialed', q: 'Бинарь без HTTP достаёт до хоста с кредами?', hit: !!bypass, why: `${p.bin} ходит по ${p.tcp ? 'голому TCP' : 'своему протоколу'}, L7-правила его не видят, а для ${key} есть ключ.` },
		{ id: 'credential_reach_expansion', q: 'Бинарь впервые достаёт до хоста с кредами?', hit: reach, why: `Раньше ${p.bin} не мог ходить на ${key}, а для него есть кред.` },
		{ id: 'capability_expansion', q: 'Новый HTTP-метод там, где креды уже были?', hit: capability, why: `К уже разрешённому ${p.bin} → ${key} добавляются ${newMethods.join(', ')}.` },
	];
	const heuristic = p.host.includes('*') ? 'wildcard-хост' : linkLocal ? 'приватный адрес' : null;
	return { findings, heuristic };
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
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.1rem', lineHeight: 1.6 } as React.CSSProperties,
	chips: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' as const, marginBottom: '1rem' } as React.CSSProperties,
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
			fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
		}) as React.CSSProperties,
	proposal: {
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
		whiteSpace: 'pre-wrap' as const,
	} as React.CSSProperties,
	why: { fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' } as React.CSSProperties,
	row: (hit: boolean) =>
		({
			display: 'flex',
			gap: '0.6rem',
			alignItems: 'flex-start',
			padding: '0.5rem 0.6rem',
			borderRadius: '8px',
			marginBottom: '0.35rem',
			border: `1px solid ${hit ? 'var(--accent-magenta)' : 'var(--border)'}`,
		}) as React.CSSProperties,
	mark: (hit: boolean) =>
		({
			flexShrink: 0,
			width: '2.6rem',
			fontSize: '0.72rem',
			fontWeight: 800,
			color: hit ? 'var(--accent-magenta)' : 'var(--text-muted)',
			paddingTop: '0.1rem',
		}) as React.CSSProperties,
	cat: { fontSize: '0.74rem', fontWeight: 800, color: 'var(--text)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', overflowWrap: 'anywhere' as const } as React.CSSProperties,
	q: { fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 } as React.CSSProperties,
	toggle: { display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.9rem 0 0', cursor: 'pointer' } as React.CSSProperties,
	verdict: (ok: boolean) =>
		({
			marginTop: '0.7rem',
			padding: '0.75rem 0.9rem',
			borderRadius: '8px',
			border: `1px solid ${ok ? 'var(--cat-tools)' : 'var(--accent-yellow)'}`,
			background: 'var(--bg-secondary)',
			fontSize: '0.86rem',
			color: 'var(--text)',
			lineHeight: 1.6,
		}) as React.CSSProperties,
	note: { marginTop: '0.9rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

function yaml(r: Rule) {
	const lines = [`- host: ${r.host}`, `  port: ${r.port}`];
	if (r.tcp) lines.push('  protocol: tcp');
	else lines.push('  protocol: rest', '  enforcement: enforce', `  access: ${r.methods.length > 3 ? 'read-write' : 'read-only'}`);
	lines.push(`  binaries: [/usr/bin/${r.bin}]`);
	return lines.join('\n');
}

export default function ProverGate() {
	const [idx, setIdx] = useState(0);
	const [auto, setAuto] = useState(true);
	const p = PROPOSALS[idx];
	const { findings, heuristic } = check(p.rule);
	const hits = findings.filter((f) => f.hit);
	const clean = hits.length === 0 && !heuristic;

	let verdict: string;
	if (!clean) {
		const what = [...hits.map((h) => h.id), ...(heuristic ? [`эвристика: ${heuristic}`] : [])].join(', ');
		verdict = `🧑‍⚖️ Ждёт человека. Найдено: ${what}. С такими находками автоодобрения не будет.`;
	} else if (auto) {
		verdict = '✅ Одобрено автоматически. Сетевые правила меняются на ходу, так что новое подхватится без рестарта песочницы.';
	} else {
		verdict = '🕐 Находок нет, но автоодобрение выключено (как и по умолчанию). Ждёт твоего решения.';
	}

	return (
		<div style={css.wrap}>
			<div style={css.title}>🧮 Агент просит доступ, prover решает</div>
			<div style={css.desc}>
				Сейчас в политике одно правило: <code>gh</code> читает <code>api.github.com</code>. В песочнице лежат креды
				GitHub для <code>api.github.com:443</code> и <code>github.com:22</code>. Агент упёрся в отказ и
				просит новое правило. Выбери, что он просит.
			</div>
			<div style={css.chips}>
				{PROPOSALS.map((x, i) => (
					<button key={x.label} style={css.chip(i === idx)} onClick={() => setIdx(i)}>{x.label}</button>
				))}
			</div>

			<div style={css.why}>{p.why}</div>
			<div style={css.proposal}>{yaml(p.rule)}</div>

			{findings.map((f) => (
				<div key={f.id} style={css.row(f.hit)}>
					<span style={css.mark(f.hit)}>{f.hit ? 'ДА' : 'нет'}</span>
					<div>
						<div style={css.cat}>{f.id}</div>
						<div style={css.q}>{f.hit ? f.why : f.q}</div>
					</div>
				</div>
			))}
			<div style={css.row(!!heuristic)}>
				<span style={css.mark(!!heuristic)}>{heuristic ? 'ДА' : 'нет'}</span>
				<div>
					<div style={css.cat}>эвристика advisor-а</div>
					<div style={css.q}>{heuristic ? `Флаг: ${heuristic}. Это не Z3, а отдельная проверка на адреса, с которыми часто бывают проблемы.` : 'Приватные адреса и wildcard-хосты?'}</div>
				</div>
			</div>

			<label style={css.toggle}>
				<input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
				автоодобрение (proposal_approval_mode, по умолчанию выключено)
			</label>
			<div style={css.verdict(clean && auto)}>{verdict}</div>

			<div style={css.note}>
				Настоящий prover переводит политику, набор кредов и реестр бинарей в SMT-модель для Z3 и ищет пути до
				хостов с кредами. capability_expansion он не показывает, если для того же бинаря и хоста уже нашёл
				credential_reach_expansion. Опасно ли действие по смыслу, он не решает: GET и PUT в репозиторий для
				него одинаково «можно».
			</div>
		</div>
	);
}
