import { useState } from 'react';

// Интерактивная проверка защиты нашего 166-строчного агента:
// Показывает, что ловит _safe(path) с is_relative_to(WORKDIR), а где run_shell(shell=True)
// напрочь обходит питоновскую проверку — мостик к Docker / OpenShell.

interface AttackCase {
	id: string;
	label: string;
	tool: 'read_file' | 'write_file' | 'run_shell';
	arg: string;
	resolved: string;
	blocked: boolean;
	why: string;
}

const CASES: AttackCase[] = [
	{
		id: 'ok',
		label: 'Нормальный файл (calc.py)',
		tool: 'read_file',
		arg: 'calc.py',
		resolved: '/app/sandbox/calc.py',
		blocked: false,
		why: 'Путь внутри WORKDIR (/app/sandbox) → _safe() пропускает, агент читает файл.',
	},
	{
		id: 'traversal',
		label: 'Path traversal (../../etc/passwd)',
		tool: 'read_file',
		arg: '../../etc/passwd',
		resolved: '/etc/passwd',
		blocked: true,
		why: 'resolve() схлопнул «..» в /etc/passwd, is_relative_to("/app/sandbox") вернул False → ValueError! Агент получил текст ошибки вместо файла.',
	},
	{
		id: 'abs',
		label: 'Абсолютный путь (/home/user/.ssh/id_rsa)',
		tool: 'read_file',
		arg: '/home/user/.ssh/id_rsa',
		resolved: '/home/user/.ssh/id_rsa',
		blocked: true,
		why: 'В Python Path("/app/sandbox") / "/home/..." даёт абсолютный путь, но is_relative_to() тут же ловит побег → заблокировано!',
	},
	{
		id: 'nested',
		label: 'Хитрый выход (sub/../../.env)',
		tool: 'write_file',
		arg: 'sub/../../.env',
		resolved: '/app/.env',
		blocked: true,
		why: 'resolve() нормализует путь ДО проверки — перезаписать родительский .env не выйдет.',
	},
	{
		id: 'shell_bypass',
		label: 'Побег через run_shell (cat /etc/passwd)',
		tool: 'run_shell',
		arg: 'cat /etc/passwd',
		resolved: 'cwd=/app/sandbox, но bash имеет доступ ко всей ФС!',
		blocked: false,
		why: '⚠️ ПРОБИТО! _safe() проверяет только файловые тулы. Как только у агента есть run_shell(shell=True), он спокойно читает любые файлы и переменные окружения (env). Поэтому в проде нужен Docker или NVIDIA OpenShell!',
	},
	{
		id: 'env_leak',
		label: 'Утечка ключа через env',
		tool: 'run_shell',
		arg: 'printenv API_KEY',
		resolved: 'subprocess наследует os.environ родителя!',
		blocked: false,
		why: '⚠️ ПРОБИТО! Дочерний shell унаследовал твой API_KEY прямо из окружения agent.py. Лечится передачей очищенного env={} или запуском в песочнице с подстановкой кредов снаружи.',
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
	chips: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' as const, marginBottom: '1rem' } as React.CSSProperties,
	chip: (active: boolean) =>
		({
			padding: '0.36rem 0.72rem',
			borderRadius: '8px',
			border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
			background: active ? 'var(--bg-secondary)' : 'transparent',
			color: active ? 'var(--text)' : 'var(--text-secondary)',
			fontSize: '0.78rem',
			fontWeight: 700,
			cursor: 'pointer',
		}) as React.CSSProperties,
	codeBox: {
		padding: '0.75rem 0.9rem',
		borderRadius: '9px',
		background: 'var(--code-bg)',
		border: '1px solid var(--border)',
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
		fontSize: '0.78rem',
		color: 'var(--text)',
		lineHeight: 1.6,
		marginBottom: '0.85rem',
	} as React.CSSProperties,
	verdict: (kind: 'safe' | 'blocked' | 'breach') =>
		({
			padding: '0.8rem 0.95rem',
			borderRadius: '9px',
			background: 'var(--bg-secondary)',
			border: `1px solid ${
				kind === 'breach' ? 'var(--accent-magenta)' : kind === 'blocked' ? 'var(--cat-tools)' : 'var(--cat-fundament)'
			}`,
			fontSize: '0.84rem',
			color: 'var(--text)',
			lineHeight: 1.6,
		}) as React.CSSProperties,
};

export default function SandboxEscapeTester() {
	const [idx, setIdx] = useState(1);
	const c = CASES[idx];
	const isBreach = !c.blocked && c.tool === 'run_shell';
	const kind = isBreach ? 'breach' : c.blocked ? 'blocked' : 'safe';

	return (
		<div style={css.wrap}>
			<div style={css.title}>🔒 Попробуй сломать песочницу нашего агента</div>
			<div style={css.desc}>
				Потыкай разные вызовы тулов и посмотри, где питоновская <code>_safe(path)</code> реально держит удар, а где
				<code>run_shell</code> открывает дыру размером с гаражные ворота.
			</div>

			<div style={css.chips}>
				{CASES.map((item, i) => (
					<button key={item.id} style={css.chip(i === idx)} onClick={() => setIdx(i)}>
						{item.label}
					</button>
				))}
			</div>

			<div style={css.codeBox}>
				<div>
					<span style={{ color: 'var(--text-muted)' }}>tool_call → </span>
					<strong>
						{c.tool}({c.tool === 'run_shell' ? `cmd="${c.arg}"` : `path="${c.arg}"`})
					</strong>
				</div>
				<div>
					<span style={{ color: 'var(--text-muted)' }}>resolve() → </span>
					<span>{c.resolved}</span>
				</div>
				<div>
					<span style={{ color: 'var(--text-muted)' }}>статус    → </span>
					<strong style={{ color: isBreach ? 'var(--accent-magenta)' : c.blocked ? 'var(--cat-tools)' : 'var(--cat-fundament)' }}>
						{isBreach ? 'БРЕШЬ (выполнилось вне песочницы!)' : c.blocked ? 'ЗАБЛОКИРОВАНО (_safe)' : 'РАЗРЕШЕНО (внутри WORKDIR)'}
					</strong>
				</div>
			</div>

			<div style={css.verdict(kind)}>{c.why}</div>
		</div>
	);
}
