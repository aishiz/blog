import { useState, useEffect } from 'react';

type TraditionalVersion = {
	version: string;
	time: string;
	note: string;
};

type LivingModule = {
	name: string;
	icon: string;
	color: string;
};

const traditional: TraditionalVersion[] = [
	{ version: 'Версия 1.0', time: '6 месяцев разработки, 5 инженеров', note: '' },
	{ version: 'Версия 2.0', time: 'Ещё 4 месяца. Новый спринт, новые расходы', note: 'Ждать 4-6 мес.' },
	{ version: 'Версия 3.0', time: 'Ещё 3 месяца. Очередь из заявок', note: 'Ждать 6-8 мес.' },
];

const wishlist = [
	'Аналитика успеваемости',
	'Автоматическая проверка',
	'Уведомления для родителей',
	'Экспорт в Excel',
];

const livingModules: LivingModule[] = [
	{ name: 'Ядро', icon: '🏠', color: '#3b82f6' },
	{ name: 'Аналитика успеваемости', icon: '📊', color: '#f59e0b' },
	{ name: 'Автопроверка работ', icon: '🤖', color: '#8b5cf6' },
	{ name: 'Календарь заданий', icon: '📅', color: '#ec4899' },
	{ name: 'Экспорт отчётов', icon: '📄', color: '#06b6d4' },
	{ name: 'Чат с родителями', icon: '💬', color: '#10b981' },
	{ name: 'Уведомления родителей', icon: '🔔', color: '#f97316' },
];

function useIsMobile(bp = 520) {
	const [m, setM] = useState(false);
	useEffect(() => {
		const c = () => setM(window.innerWidth <= bp);
		c();
		window.addEventListener('resize', c, { passive: true });
		return () => window.removeEventListener('resize', c);
	}, [bp]);
	return m;
}

export default function ProductEvolution() {
	const [view, setView] = useState<'traditional' | 'living'>('traditional');
	const [addedModules, setAddedModules] = useState<Set<number>>(new Set([0]));
	const mobile = useIsMobile();

	const addModule = (i: number) => {
		setAddedModules(prev => new Set(prev).add(i));
	};

	const resetModules = () => setAddedModules(new Set([0]));

	return (
		<div style={{
			margin: '1.75em 0', padding: mobile ? '0.85rem' : '1.5rem',
			borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)',
		}}>
			<div style={{
				fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)',
				textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem',
			}}>
				🔄 От статичного продукта к живому организму
			</div>

			<div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem' }}>
				<button onClick={() => setView('traditional')} style={{
					flex: 1, padding: mobile ? '0.4rem' : '0.45rem 0.85rem',
					borderRadius: '8px',
					border: `2px solid ${view === 'traditional' ? '#ef4444' : 'var(--border)'}`,
					background: view === 'traditional' ? '#ef444412' : 'var(--bg-secondary)',
					color: view === 'traditional' ? '#ef4444' : 'var(--text-muted)',
					fontSize: mobile ? '0.72rem' : '0.78rem', fontWeight: 700,
					cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
					textAlign: 'center' as const,
				}}>
					📦 Традиционный
				</button>
				<button onClick={() => setView('living')} style={{
					flex: 1, padding: mobile ? '0.4rem' : '0.45rem 0.85rem',
					borderRadius: '8px',
					border: `2px solid ${view === 'living' ? '#10b981' : 'var(--border)'}`,
					background: view === 'living' ? '#10b98112' : 'var(--bg-secondary)',
					color: view === 'living' ? '#10b981' : 'var(--text-muted)',
					fontSize: mobile ? '0.72rem' : '0.78rem', fontWeight: 700,
					cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
					textAlign: 'center' as const,
				}}>
					🧬 Живой продукт
				</button>
			</div>

			{view === 'traditional' ? (
				<div>
					<div style={{
						fontSize: mobile ? '0.72rem' : '0.78rem', color: 'var(--text-muted)',
						marginBottom: '0.5rem', fontStyle: 'italic' as const,
					}}>
						«Заморожен в коде»
					</div>
					<div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.35rem' }}>
						{traditional.map((v, i) => (
							<div key={i}>
								<div style={{
									padding: mobile ? '0.55rem 0.65rem' : '0.65rem 0.85rem',
									borderRadius: '8px',
									border: '1.5px solid #3b82f644',
									background: '#3b82f608',
								}}>
									<div style={{
										fontSize: mobile ? '0.85rem' : '0.92rem', fontWeight: 800,
										color: '#3b82f6',
									}}>
										{v.version}
									</div>
									<div style={{
										fontSize: mobile ? '0.7rem' : '0.75rem', color: 'var(--text-muted)',
										marginTop: '0.15rem',
									}}>
										{v.time}
									</div>
								</div>
								{v.note && (
									<div style={{
										textAlign: 'center' as const,
										fontSize: mobile ? '0.62rem' : '0.68rem',
										color: '#ef4444', fontWeight: 700,
										padding: '0.25rem 0',
									}}>
										⏳ {v.note}
									</div>
								)}
							</div>
						))}
					</div>
					<div style={{
						marginTop: '0.75rem', padding: mobile ? '0.55rem 0.65rem' : '0.65rem 0.85rem',
						borderRadius: '8px', border: '1px dashed #ef444444', background: '#ef444408',
					}}>
						<div style={{
							fontSize: mobile ? '0.68rem' : '0.75rem', fontWeight: 700,
							color: '#ef4444', marginBottom: '0.35rem',
						}}>
							Очередь неудовлетворённых желаний:
						</div>
						{wishlist.map((w, i) => (
							<div key={i} style={{
								fontSize: mobile ? '0.68rem' : '0.75rem', color: 'var(--text-muted)',
								padding: '0.1rem 0', display: 'flex', gap: '0.3rem',
							}}>
								<span style={{ color: '#ef4444' }}>{i + 1}.</span> {w}
							</div>
						))}
						<div style={{
							marginTop: '0.35rem', fontSize: mobile ? '0.65rem' : '0.72rem',
							color: '#ef4444', fontWeight: 700, fontStyle: 'italic' as const,
						}}>
							Пользователь ждёт. Продукт стоит.
						</div>
					</div>
				</div>
			) : (
				<div>
					<div style={{
						fontSize: mobile ? '0.72rem' : '0.78rem', color: 'var(--text-muted)',
						marginBottom: '0.5rem', fontStyle: 'italic' as const,
					}}>
						Расширяется вместе с болью пользователя. Нажимайте «+» чтобы добавить модуль.
					</div>

					<div style={{
						display: 'flex', flexWrap: 'wrap' as const, gap: '0.3rem',
						justifyContent: 'center', padding: '0.5rem 0', marginBottom: '0.5rem',
					}}>
						{livingModules.map((mod, i) => {
							const added = addedModules.has(i);
							return (
								<div
									key={i}
									onClick={() => { if (!added && i !== 0) addModule(i); }}
									style={{
										width: mobile ? '44px' : '52px', height: mobile ? '44px' : '52px',
										borderRadius: '50%',
										background: added ? `${mod.color}20` : 'var(--bg-secondary)',
										border: `2px solid ${added ? mod.color : 'var(--border)'}`,
										display: 'flex', alignItems: 'center', justifyContent: 'center',
										fontSize: added ? (mobile ? '1.1rem' : '1.3rem') : (mobile ? '0.8rem' : '0.9rem'),
										opacity: added ? 1 : 0.4,
										cursor: added || i === 0 ? 'default' : 'pointer',
										transition: 'all 0.3s ease',
										boxShadow: added && i === 0 ? `0 0 12px ${mod.color}44` : 'none',
									}}
								>
									{added ? mod.icon : '➕'}
								</div>
							);
						})}
					</div>

					<div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.25rem' }}>
						{livingModules.map((mod, i) => {
							const added = addedModules.has(i);
							if (i === 0) return null;
							return (
								<button
									key={i}
									onClick={() => { if (!added) addModule(i); }}
									style={{
										display: 'flex', alignItems: 'center', gap: '0.4rem',
										width: '100%', textAlign: 'left' as const,
										padding: mobile ? '0.4rem 0.55rem' : '0.45rem 0.7rem',
										borderRadius: '6px',
										border: `1px solid ${added ? `${mod.color}55` : 'var(--border)'}`,
										background: added ? `${mod.color}06` : 'var(--bg-secondary)',
										cursor: added ? 'default' : 'pointer',
										fontFamily: 'inherit', transition: 'all 0.25s ease',
									}}
								>
									<span style={{ fontSize: mobile ? '0.85rem' : '0.95rem', flexShrink: 0 }}>
										{added ? mod.icon : '➕'}
									</span>
									<span style={{
										fontSize: mobile ? '0.72rem' : '0.78rem', fontWeight: 600,
										color: added ? mod.color : 'var(--text)',
									}}>
										{mod.name}
									</span>
									{added && (
										<span style={{
											marginLeft: 'auto', fontSize: '0.6rem', fontWeight: 700,
											color: mod.color,
										}}>
											✅
										</span>
									)}
								</button>
							);
						})}
					</div>

					{addedModules.size > 1 && (
						<button
							onClick={resetModules}
							style={{
								marginTop: '0.4rem', width: '100%',
								padding: '0.35rem', borderRadius: '6px',
								border: '1px solid var(--border)', background: 'var(--bg-secondary)',
								color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600,
								cursor: 'pointer', fontFamily: 'inherit',
							}}
						>
							🔄 Сбросить
						</button>
					)}

					<div style={{
						marginTop: '0.6rem', padding: mobile ? '0.55rem 0.65rem' : '0.65rem 0.85rem',
						borderRadius: '8px', border: '1px solid #f59e0b44', background: '#f59e0b08',
					}}>
						<div style={{
							fontSize: mobile ? '0.72rem' : '0.78rem', fontWeight: 700,
							color: 'var(--text)', fontStyle: 'italic' as const, lineHeight: 1.5,
						}}>
							Учитель: «Мне не хватает аналитики по отстающим»
						</div>
						<div style={{
							fontSize: mobile ? '0.68rem' : '0.75rem', color: '#10b981',
							fontWeight: 600, marginTop: '0.2rem',
						}}>
							Агент: SKILL найден → Модуль развёрнут → Функционал добавлен
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
