import { useState, useEffect } from 'react';

interface Harness {
	name: string;
	kind: 'CLI' | 'IDE' | 'Фреймворк';
	what: string;
	trait: string;
	color: string;
}

const HARNESSES: Harness[] = [
	{ name: 'Claude Code', kind: 'CLI', what: 'CLI-агент для кода', trait: 'Агрессивная компакция контекста, субагенты, права на каждое действие.', color: '#ff6b2b' },
	{ name: 'Cursor / Windsurf', kind: 'IDE', what: 'IDE с агентом', trait: 'Харнес встроен в редактор: видит весь проект, diff-первый подход.', color: '#3b82f6' },
	{ name: 'Aider', kind: 'CLI', what: 'CLI для парного кодинга', trait: 'Работает через git-коммиты — харнес использует git как память.', color: '#10b981' },
	{ name: 'OpenClaw', kind: 'CLI', what: 'Опенсорсный агент-рой', trait: 'Оркестрация множества агентов поверх любой модели.', color: '#e040a0' },
	{ name: 'LangGraph', kind: 'Фреймворк', what: 'Конструктор агентов', trait: 'Не готовый агент, а кубики: граф состояний для сборки своего харнеса.', color: '#8b5cf6' },
	{ name: 'OpenAI Agents SDK', kind: 'Фреймворк', what: 'Официальный тулкит', trait: 'Цикл + tools + handoff между агентами из коробки.', color: '#f59e0b' },
];

const KINDS = ['Все', 'CLI', 'IDE', 'Фреймворк'] as const;

function useIsMobile(bp = 480) {
	const [m, setM] = useState(false);
	useEffect(() => {
		const check = () => setM(window.innerWidth <= bp);
		check();
		window.addEventListener('resize', check, { passive: true });
		return () => window.removeEventListener('resize', check);
	}, [bp]);
	return m;
}

export default function HarnessComparison() {
	const [filter, setFilter] = useState<(typeof KINDS)[number]>('Все');
	const [open, setOpen] = useState<string | null>('Claude Code');
	const mobile = useIsMobile();

	const list = filter === 'Все' ? HARNESSES : HARNESSES.filter((h) => h.kind === filter);

	return (
		<div style={{ margin: '1.75em 0', padding: mobile ? '0.85rem' : '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
			<div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
				🛠️ Реальные харнесы — фильтруй и раскрывай
			</div>
			<div style={{ fontSize: mobile ? '0.78rem' : '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
				Все крутятся поверх одних и тех же моделей. Разница — в харнесе. Тыкни, чтобы увидеть фишку каждого.
			</div>

			{/* Filter chips */}
			<div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '0.35rem', marginBottom: '0.85rem' }}>
				{KINDS.map((k) => {
					const active = filter === k;
					return (
						<button
							key={k}
							onClick={() => setFilter(k)}
							style={{
								padding: mobile ? '0.32rem 0.7rem' : '0.38rem 0.9rem',
								borderRadius: '7px',
								border: `1.5px solid ${active ? '#ff6b2b' : 'var(--border)'}`,
								background: active ? '#ff6b2b18' : 'transparent',
								color: active ? '#ff6b2b' : 'var(--text-muted)',
								fontSize: mobile ? '0.74rem' : '0.82rem',
								fontWeight: active ? 700 : 500,
								cursor: 'pointer',
								WebkitTapHighlightColor: 'transparent',
								transition: 'all 0.2s ease',
							}}
						>
							{k}
						</button>
					);
				})}
			</div>

			{/* Rows */}
			<div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.45rem' }}>
				{list.map((h) => {
					const isOpen = open === h.name;
					return (
						<div
							key={h.name}
							onClick={() => setOpen(isOpen ? null : h.name)}
							style={{
								borderRadius: '10px',
								border: `1px solid ${isOpen ? h.color + '60' : 'var(--border)'}`,
								background: isOpen ? `${h.color}0a` : 'transparent',
								cursor: 'pointer',
								transition: 'all 0.2s ease',
								overflow: 'hidden',
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: mobile ? '0.6rem 0.75rem' : '0.7rem 1rem' }}>
								<span style={{ width: '8px', height: '8px', borderRadius: '50%', background: h.color, flexShrink: 0 }} />
								<span style={{ fontWeight: 700, color: 'var(--text)', fontSize: mobile ? '0.86rem' : '0.95rem', flexShrink: 0 }}>{h.name}</span>
								<span style={{ fontSize: '0.6rem', fontWeight: 700, color: h.color, border: `1px solid ${h.color}55`, borderRadius: '100px', padding: '0.1rem 0.45rem', textTransform: 'uppercase' as const, flexShrink: 0 }}>
									{h.kind}
								</span>
								{!mobile && <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{h.what}</span>}
								<span style={{ marginLeft: mobile ? 'auto' : '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', flexShrink: 0, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s ease' }}>›</span>
							</div>
							{isOpen && (
								<div style={{ padding: mobile ? '0 0.75rem 0.7rem 1.5rem' : '0 1rem 0.8rem 1.75rem', fontSize: mobile ? '0.8rem' : '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
									{h.trait}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
