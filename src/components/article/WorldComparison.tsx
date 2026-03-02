import { useState, useEffect } from 'react';

type OldRole = { name: string; desc: string };
type NewRole = { name: string; color: string; desc: string };

const oldRoles: OldRole[] = [
	{ name: 'Бизнес-аналитик', desc: 'Формулирует требования' },
	{ name: 'Архитектор решений', desc: 'Проектирует систему' },
	{ name: 'Cloud Engineer', desc: 'Настраивает IaaS/PaaS' },
	{ name: 'DevOps / SRE', desc: 'Kubernetes, CI/CD, мониторинг' },
	{ name: 'DBA', desc: 'Управляет базами данных' },
	{ name: 'Security Engineer', desc: 'Настраивает политики безопасности' },
	{ name: 'FinOps Engineer', desc: 'Оптимизирует облачные расходы' },
	{ name: 'Data Engineer', desc: 'Настраивает аналитику и логи' },
];

const newRoles: NewRole[] = [
	{ name: 'Человек с болью', color: '#10b981', desc: 'Описывает проблему на естественном языке' },
	{ name: 'Агент-оркестратор', color: '#3b82f6', desc: 'Анализирует требования, строит план' },
	{ name: 'SKILL: arch-planner', color: '#8b5cf6', desc: 'Проектирует архитектуру системы' },
	{ name: 'SKILL: iaas-deploy', color: '#8b5cf6', desc: 'Поднимает виртуальные машины и сети' },
	{ name: 'SKILL: k8s-orchestrate', color: '#8b5cf6', desc: 'Настраивает Kubernetes кластер' },
	{ name: 'SKILL: dbaas-setup', color: '#8b5cf6', desc: 'Создаёт и настраивает БД' },
	{ name: 'SKILL: security-harden', color: '#8b5cf6', desc: 'Применяет политики безопасности' },
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

export default function WorldComparison() {
	const [side, setSide] = useState<'old' | 'new'>('old');
	const [hovered, setHovered] = useState<number | null>(null);
	const mobile = useIsMobile();

	const items = side === 'old' ? oldRoles : newRoles;

	return (
		<div style={{
			margin: '1.75em 0', padding: mobile ? '0.85rem' : '1.5rem',
			borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)',
		}}>
			<div style={{
				fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)',
				textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem',
			}}>
				⚔️ Старый мир vs. Вайбклаудинг
			</div>
			<div style={{
				fontSize: mobile ? '0.78rem' : '0.85rem', color: 'var(--text-muted)',
				marginBottom: '1rem', lineHeight: 1.5,
			}}>
				Кто нужен для запуска продукта? Переключайтесь между мирами.
			</div>

			<div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem' }}>
				<button onClick={() => { setSide('old'); setHovered(null); }} style={{
					flex: 1, padding: mobile ? '0.45rem' : '0.5rem 0.85rem',
					borderRadius: '8px',
					border: `2px solid ${side === 'old' ? '#ef4444' : 'var(--border)'}`,
					background: side === 'old' ? '#ef444412' : 'var(--bg-secondary)',
					color: side === 'old' ? '#ef4444' : 'var(--text-muted)',
					fontSize: mobile ? '0.72rem' : '0.82rem', fontWeight: 700,
					cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
					textAlign: 'center' as const,
				}}>
					🏗️ Старый мир (2020–2024)
				</button>
				<button onClick={() => { setSide('new'); setHovered(null); }} style={{
					flex: 1, padding: mobile ? '0.45rem' : '0.5rem 0.85rem',
					borderRadius: '8px',
					border: `2px solid ${side === 'new' ? '#10b981' : 'var(--border)'}`,
					background: side === 'new' ? '#10b98112' : 'var(--bg-secondary)',
					color: side === 'new' ? '#10b981' : 'var(--text-muted)',
					fontSize: mobile ? '0.72rem' : '0.82rem', fontWeight: 700,
					cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
					textAlign: 'center' as const,
				}}>
					☁️ Вайбклаудинг (2026+)
				</button>
			</div>

			<div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.3rem' }}>
				{items.map((item, i) => {
					const isNew = side === 'new';
					const color = isNew ? (item as NewRole).color : '#ef4444';
					const isActive = hovered === i;
					return (
						<button
							key={`${side}-${i}`}
							onClick={() => setHovered(isActive ? null : i)}
							style={{
								display: 'flex', alignItems: 'center', gap: mobile ? '0.5rem' : '0.65rem',
								width: '100%', textAlign: 'left' as const,
								padding: mobile ? '0.5rem 0.65rem' : '0.6rem 0.85rem',
								borderRadius: '8px',
								border: `1.5px solid ${isActive ? color : `${color}33`}`,
								background: isActive ? `${color}10` : 'var(--bg-secondary)',
								cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.25s ease',
							}}
						>
							<span style={{
								width: '8px', height: '8px', borderRadius: '50%',
								background: color, flexShrink: 0,
								opacity: isActive ? 1 : 0.5,
							}} />
							<span style={{
								fontSize: mobile ? '0.78rem' : '0.85rem', fontWeight: 700,
								color: isActive ? color : 'var(--text)', flex: 1,
								transition: 'color 0.2s ease',
							}}>
								{item.name}
							</span>
							<span style={{
								fontSize: mobile ? '0.65rem' : '0.72rem', color: 'var(--text-muted)',
								flexShrink: 0, maxWidth: mobile ? '45%' : '50%',
								textAlign: 'right' as const, lineHeight: 1.3,
							}}>
								{item.desc}
							</span>
						</button>
					);
				})}
			</div>

			<div style={{
				display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem',
				marginTop: '1rem',
			}}>
				<div style={{
					padding: mobile ? '0.55rem 0.65rem' : '0.65rem 0.85rem',
					borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
					textAlign: 'center' as const,
				}}>
					<div style={{
						fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)',
						textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '0.2rem',
					}}>
						Время запуска
					</div>
					<div style={{
						fontSize: mobile ? '0.95rem' : '1.1rem', fontWeight: 900,
						color: side === 'old' ? '#ef4444' : '#10b981',
					}}>
						{side === 'old' ? '3–6 месяцев' : 'Часы–дни'}
					</div>
				</div>
				<div style={{
					padding: mobile ? '0.55rem 0.65rem' : '0.65rem 0.85rem',
					borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
					textAlign: 'center' as const,
				}}>
					<div style={{
						fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)',
						textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '0.2rem',
					}}>
						Команда
					</div>
					<div style={{
						fontSize: mobile ? '0.95rem' : '1.1rem', fontWeight: 900,
						color: side === 'old' ? '#ef4444' : '#10b981',
					}}>
						{side === 'old' ? '5–10 специалистов' : '1 человек + агент'}
					</div>
				</div>
			</div>
		</div>
	);
}
