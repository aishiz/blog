import { useState, useEffect } from 'react';

type Layer = {
	id: string;
	name: string;
	icon: string;
	color: string;
	items: { name: string; desc: string }[];
};

const layers: Layer[] = [
	{
		id: 'human', name: 'ЧЕЛОВЕК', icon: '👤', color: '#ef4444',
		items: [
			{ name: 'Описание задачи', desc: '«Мне нужен сервис на 1М пользователей, GDPR, $5k/мес, высокая доступность»' },
		],
	},
	{
		id: 'orchestrator', name: 'АГЕНТ-ОРКЕСТРАТОР', icon: '🧠', color: '#8b5cf6',
		items: [
			{ name: 'SKILL: arch-planner', desc: 'Проектирует архитектуру системы' },
			{ name: 'SKILL: cost-optimizer', desc: 'Оптимизирует бюджет и ресурсы' },
			{ name: 'SKILL: security-audit', desc: 'Проверяет безопасность и комплаенс' },
			{ name: 'SKILL: compliance-gdpr', desc: 'Обеспечивает соответствие GDPR' },
		],
	},
	{
		id: 'cloud', name: 'ОБЛАЧНАЯ ИНФРАСТРУКТУРА', icon: '☁️', color: '#10b981',
		items: [
			{ name: 'IaaS', desc: 'ВМ, сети, хранилища' },
			{ name: 'PaaS', desc: 'Платформа приложений, CI/CD, runtime' },
			{ name: 'DBaaS', desc: 'Postgres, Redis, ClickHouse' },
			{ name: 'S3 / Storage', desc: 'Файлы, бэкапы, статика' },
			{ name: 'mk8s / k8s', desc: 'Оркестрация контейнеров, автомасштабирование' },
			{ name: 'CDN / DNS', desc: 'Глобальная доставка, балансировка' },
		],
	},
	{
		id: 'agents', name: 'СПЕЦИАЛИЗИРОВАННЫЕ АГЕНТЫ', icon: '⚙️', color: '#3b82f6',
		items: [
			{ name: 'DevOps Агент', desc: 'Настраивает инфраструктуру и деплой' },
			{ name: 'Security Агент', desc: 'Применяет политики безопасности' },
			{ name: 'Cost Агент', desc: 'Оптимизирует расходы в реальном времени' },
			{ name: 'Monitor Агент', desc: 'Следит за здоровьем системы 24/7' },
		],
	},
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

export default function VibecloudingArch() {
	const [activeLayer, setActiveLayer] = useState(0);
	const [activeItem, setActiveItem] = useState<number | null>(null);
	const [auto, setAuto] = useState(true);
	const mobile = useIsMobile();

	useEffect(() => {
		if (!auto) return;
		const id = setInterval(() => {
			setActiveItem(null);
			setActiveLayer(p => (p + 1) % layers.length);
		}, 3000);
		return () => clearInterval(id);
	}, [auto]);

	const layer = layers[activeLayer];

	return (
		<div style={{
			margin: '1.75em 0', padding: mobile ? '0.85rem' : '1.5rem',
			borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)',
		}}>
			<div style={{
				fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)',
				textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem',
			}}>
				🏗️ Архитектура Вайбклаудинга
			</div>
			<div style={{
				fontSize: mobile ? '0.78rem' : '0.85rem', color: 'var(--text-muted)',
				marginBottom: '1rem', lineHeight: 1.5, fontStyle: 'italic' as const,
			}}>
				От описания проблемы — к работающей инфраструктуре
			</div>

			<div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.35rem', marginBottom: '1rem' }}>
				{layers.map((l, i) => (
					<button
						key={l.id}
						onClick={() => { setActiveLayer(i); setActiveItem(null); setAuto(false); }}
						style={{
							display: 'flex', alignItems: 'center', gap: mobile ? '0.4rem' : '0.6rem',
							width: '100%', textAlign: 'left' as const,
							padding: mobile ? '0.5rem 0.65rem' : '0.6rem 0.85rem',
							borderRadius: '8px',
							border: `2px solid ${activeLayer === i ? l.color : 'var(--border)'}`,
							background: activeLayer === i ? `${l.color}10` : 'var(--bg-secondary)',
							cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.3s ease',
							transform: activeLayer === i ? 'scale(1.01)' : 'scale(1)',
						}}
					>
						<span style={{ fontSize: mobile ? '1rem' : '1.2rem', flexShrink: 0 }}>{l.icon}</span>
						<span style={{
							fontSize: mobile ? '0.75rem' : '0.82rem', fontWeight: 700,
							color: activeLayer === i ? l.color : 'var(--text)',
							flex: 1, transition: 'color 0.2s ease',
						}}>
							{l.name}
						</span>
						<span style={{
							fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)',
							padding: '0.1rem 0.4rem', borderRadius: '100px',
							background: 'var(--bg-card)', border: '1px solid var(--border)',
						}}>
							{l.items.length}
						</span>
						{activeLayer === i && (
							<span style={{
								width: '8px', height: '8px', borderRadius: '50%',
								background: l.color, flexShrink: 0,
								boxShadow: `0 0 8px ${l.color}`,
							}} />
						)}
					</button>
				))}
			</div>

			{activeLayer > 0 && activeLayer < layers.length - 1 && (
				<div style={{
					display: 'flex', justifyContent: 'center', margin: '-0.15rem 0 0.35rem',
				}}>
					<span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>▼ передаёт задачу ▼</span>
				</div>
			)}

			<div style={{
				padding: mobile ? '0.75rem' : '1rem',
				borderRadius: '10px',
				border: `1.5px solid ${layer.color}44`,
				background: `${layer.color}06`,
			}}>
				<div style={{
					fontSize: mobile ? '0.72rem' : '0.78rem', fontWeight: 700,
					color: layer.color, marginBottom: '0.5rem',
					textTransform: 'uppercase' as const, letterSpacing: '0.04em',
				}}>
					{layer.icon} {layer.name}
				</div>
				<div style={{
					display: 'grid',
					gridTemplateColumns: mobile
						? (layer.items.length === 1 ? '1fr' : '1fr 1fr')
						: (layer.items.length <= 2 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'),
					gap: '0.35rem',
				}}>
					{layer.items.map((item, j) => (
						<button
							key={item.name}
							onClick={() => setActiveItem(activeItem === j ? null : j)}
							style={{
								padding: mobile ? '0.45rem 0.55rem' : '0.55rem 0.7rem',
								borderRadius: '6px',
								border: `1px solid ${activeItem === j ? layer.color : 'var(--border)'}`,
								background: activeItem === j ? `${layer.color}15` : 'var(--bg-secondary)',
								cursor: 'pointer', fontFamily: 'inherit',
								textAlign: 'left' as const, transition: 'all 0.2s ease',
								gridColumn: layer.items.length === 1 ? '1 / -1' : 'auto',
							}}
						>
							<div style={{
								fontSize: mobile ? '0.7rem' : '0.78rem', fontWeight: 700,
								color: activeItem === j ? layer.color : 'var(--text)',
								lineHeight: 1.3,
							}}>
								{item.name}
							</div>
							{activeItem === j && (
								<div style={{
									fontSize: mobile ? '0.65rem' : '0.72rem', color: 'var(--text-muted)',
									lineHeight: 1.4, marginTop: '0.2rem',
								}}>
									{item.desc}
								</div>
							)}
						</button>
					))}
				</div>
			</div>

			<div style={{
				marginTop: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '8px',
				background: '#10b98108', border: '1px solid #10b98133',
				fontSize: mobile ? '0.68rem' : '0.75rem', color: '#10b981',
				textAlign: 'center' as const, fontWeight: 600,
			}}>
				Работающая инфраструктура — без единой строки конфига от пользователя
			</div>
		</div>
	);
}
