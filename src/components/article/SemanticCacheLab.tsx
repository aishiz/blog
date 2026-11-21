import { useState } from 'react';

// Интерактивный стенд порога cosine similarity для Semantic Caching.
// Наглядно показывает конфликт между hit rate (перефразированные дубли) и
// false positive rate (запросы с разными ID, отрицанием или временем).

interface CachePair {
	id: string;
	cached: string;
	incoming: string;
	sim: number;
	safe: boolean;
	reason: string;
}

const PAIRS: CachePair[] = [
	{
		id: 'pwd',
		cached: 'Как сбросить пароль от личного кабинета?',
		incoming: 'Забыл пароль, как восстановить доступ?',
		sim: 0.94,
		safe: true,
		reason: 'Обычная перефразировка FAQ — безопасно отдать из кэша.',
	},
	{
		id: 'hours',
		cached: 'Во сколько закрывается техподдержка?',
		incoming: 'До скольки сегодня работает саппорт?',
		sim: 0.91,
		safe: true,
		reason: 'Смысл тот же, ответ статичный — хороший cache hit.',
	},
	{
		id: 'deploy',
		cached: 'Как переводится термин blue-green deployment?',
		incoming: 'Объясни, что такое blue-green деплой',
		sim: 0.87,
		safe: true,
		reason: 'Перефразировка по смыслу, но формулировки дальше друг от друга.',
	},
	{
		id: 'user_id',
		cached: 'Сформируй выписку по счёту клиента id=1024',
		incoming: 'Сформируй выписку по счёту клиента id=8841',
		sim: 0.96,
		safe: false,
		reason: 'ОПАСНО: поменялось только число! Эмбеддинги почти идентичны, но данные чужого клиента.',
	},
	{
		id: 'year',
		cached: 'Сколько стоит корпоративный тариф в 2025 году?',
		incoming: 'Сколько стоит корпоративный тариф в 2026 году?',
		sim: 0.93,
		safe: false,
		reason: 'ОПАСНО: сдвиг на один год меняет цифры ответа, но cosine similarity огромный.',
	},
	{
		id: 'negation',
		cached: 'Напиши обход дерева на Python с рекурсией',
		incoming: 'Напиши обход дерева на Python без рекурсии',
		sim: 0.89,
		safe: false,
		reason: 'ОПАСНО: предлог «с» → «без» меняет смысл на противоположный, а вектор почти не сдвинулся.',
	},
	{
		id: 'weather',
		cached: 'Какая погода в Москве сегодня?',
		incoming: 'Какая погода в Москве завтра?',
		sim: 0.86,
		safe: false,
		reason: 'ОПАСНО: времязависимый запрос — без TTL и bypass кэш врёт.',
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
	topBar: {
		display: 'flex',
		flexWrap: 'wrap' as const,
		gap: '1rem',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: '0.85rem 1rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		marginBottom: '1rem',
	} as React.CSSProperties,
	sliderBox: { flex: '1 1 260px', display: 'flex', flexDirection: 'column' as const, gap: '0.35rem' } as React.CSSProperties,
	stats: { display: 'flex', gap: '0.6rem', flexWrap: 'wrap' as const } as React.CSSProperties,
	stat: (color: string) =>
		({
			padding: '0.45rem 0.75rem',
			borderRadius: '8px',
			border: `1px solid ${color}`,
			background: 'var(--bg-card)',
			minWidth: '115px',
		}) as React.CSSProperties,
	statLabel: { fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase' as const, color: 'var(--text-muted)' } as React.CSSProperties,
	statVal: { fontSize: '1rem', fontWeight: 800, color: 'var(--text)' } as React.CSSProperties,
	row: (kind: 'good-hit' | 'bad-hit' | 'miss') =>
		({
			padding: '0.7rem 0.85rem',
			borderRadius: '9px',
			marginBottom: '0.5rem',
			border: `1px solid ${
				kind === 'good-hit' ? 'var(--cat-tools)' : kind === 'bad-hit' ? 'var(--accent-magenta)' : 'var(--border)'
			}`,
			background: kind === 'bad-hit' ? 'var(--bg-secondary)' : 'transparent',
		}) as React.CSSProperties,
	rowHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' as const, marginBottom: '0.35rem' } as React.CSSProperties,
	tag: (kind: 'good-hit' | 'bad-hit' | 'miss') =>
		({
			fontSize: '0.7rem',
			fontWeight: 800,
			padding: '0.15rem 0.55rem',
			borderRadius: '100px',
			color: kind === 'miss' ? 'var(--text-muted)' : 'var(--bg)',
			background:
				kind === 'good-hit' ? 'var(--cat-tools)' : kind === 'bad-hit' ? 'var(--accent-magenta)' : 'var(--bg-secondary)',
			border: kind === 'miss' ? '1px solid var(--border)' : 'none',
		}) as React.CSSProperties,
	simCode: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 700 } as React.CSSProperties,
	pairText: { fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.5 } as React.CSSProperties,
	pairMuted: { fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45, marginTop: '0.25rem' } as React.CSSProperties,
	toggle: { display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', marginTop: '0.35rem' } as React.CSSProperties,
};

export default function SemanticCacheLab() {
	const [threshold, setThreshold] = useState(0.91);
	const [entityGuard, setEntityGuard] = useState(false);

	const safePairs = PAIRS.filter((p) => p.safe);
	const trapPairs = PAIRS.filter((p) => !p.safe);

	const evaluated = PAIRS.map((p) => {
		const blockedByGuard = entityGuard && (p.id === 'user_id' || p.id === 'year' || p.id === 'weather');
		const hit = !blockedByGuard && p.sim >= threshold;
		const kind: 'good-hit' | 'bad-hit' | 'miss' = !hit ? 'miss' : p.safe ? 'good-hit' : 'bad-hit';
		return { ...p, hit, blockedByGuard, kind };
	});

	const goodHits = evaluated.filter((e) => e.kind === 'good-hit').length;
	const badHits = evaluated.filter((e) => e.kind === 'bad-hit').length;

	return (
		<div style={css.wrap}>
			<div style={css.title}>🎯 Порог Semantic Cache: где экономия, а где враньё</div>
			<div style={css.desc}>
				Покрути порог cosine similarity. Обрати внимание: на стандартном <code>0.90–0.92</code> в кэш легко пролетают
				ловушки с другими числами и отрицанием. Потом включи пре-фильтр сущностей — и посмотри, что изменится.
			</div>

			<div style={css.topBar}>
				<div style={css.sliderBox}>
					<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)' }}>
						<span>Порог cosine similarity</span>
						<code>{threshold.toFixed(2)}</code>
					</div>
					<input
						type="range"
						min={0.82}
						max={0.98}
						step={0.01}
						value={threshold}
						onChange={(e) => setThreshold(parseFloat(e.target.value))}
					/>
					<label style={css.toggle}>
						<input type="checkbox" checked={entityGuard} onChange={(e) => setEntityGuard(e.target.checked)} />
						Включить bypass для запросов с числами/ID и словами времени («сегодня/завтра/2026»)
					</label>
				</div>

				<div style={css.stats}>
					<div style={css.stat('var(--cat-tools)')}>
						<div style={css.statLabel}>Полезных hit</div>
						<div style={css.statVal}>
							{goodHits} / {safePairs.length}
						</div>
					</div>
					<div style={css.stat(badHits > 0 ? 'var(--accent-magenta)' : 'var(--border)')}>
						<div style={css.statLabel}>Ложных (баги!)</div>
						<div style={css.statVal}>
							{badHits} / {trapPairs.length}
						</div>
					</div>
				</div>
			</div>

			{evaluated.map((e) => (
				<div key={e.id} style={css.row(e.kind)}>
					<div style={css.rowHead}>
						<span style={css.simCode}>cosine = {e.sim.toFixed(2)}</span>
						<span style={css.tag(e.kind)}>
							{e.blockedByGuard
								? 'BYPASS (guard)'
								: e.kind === 'good-hit'
									? 'HIT · верно'
									: e.kind === 'bad-hit'
										? 'FALSE HIT · сломали ответ!'
										: 'MISS · к модели'}
						</span>
					</div>
					<div style={css.pairText}>
						<strong>В кэше:</strong> {e.cached}
						<br />
						<strong>Пришло:</strong> {e.incoming}
					</div>
					<div style={css.pairMuted}>{e.reason}</div>
				</div>
			))}
		</div>
	);
}
