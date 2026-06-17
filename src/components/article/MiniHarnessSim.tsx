import { useState, useEffect } from 'react';

// Капстоун: собери свой харнес — выключай слои и смотри, что ломается.
interface Guard {
	key: string;
	label: string;
	icon: string;
	fail: string;
	color: string;
}

const GUARDS: Guard[] = [
	{ key: 'loop', label: 'Лимит итераций', icon: '♾️', color: '#ef4444', fail: 'Агент зациклился на 47-й итерации, повторяя одно и то же. Счёт за API: $312 💸' },
	{ key: 'sandbox', label: 'Песочница и права', icon: '💀', color: '#ff6b2b', fail: 'Модель сгаллюцинировала и выполнила `rm -rf` без спроса. Полрепозитория снесено.' },
	{ key: 'compaction', label: 'Компакция контекста', icon: '🧠', color: '#f59e0b', fail: 'Окно контекста переполнилось на 12-м шаге. Агент забыл исходную задачу и поплыл.' },
	{ key: 'validation', label: 'Парсинг и валидация', icon: '🎭', color: '#e040a0', fail: 'Модель вернула битый JSON в вызове инструмента. Харнес упал с traceback.' },
];

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

export default function MiniHarnessSim() {
	const [on, setOn] = useState<Record<string, boolean>>({ loop: true, sandbox: true, compaction: true, validation: true });
	const [ran, setRan] = useState(false);
	const mobile = useIsMobile();

	const toggle = (k: string) => {
		setOn((p) => ({ ...p, [k]: !p[k] }));
		setRan(false);
	};

	const failures = GUARDS.filter((g) => !on[g.key]);
	const allOn = failures.length === 0;

	return (
		<div style={{ margin: '1.75em 0', padding: mobile ? '0.85rem' : '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
			<div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
				🧰 Собери свой харнес
			</div>
			<div style={{ fontSize: mobile ? '0.78rem' : '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
				Задача: «почини баг и прогони тесты». Выключай слои харнеса и запускай — смотри, что именно ломается без каждого.
			</div>

			{/* Toggles */}
			<div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.4rem', marginBottom: '1rem' }}>
				{GUARDS.map((g) => {
					const enabled = on[g.key];
					return (
						<button
							key={g.key}
							onClick={() => toggle(g.key)}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.7rem',
								padding: mobile ? '0.55rem 0.7rem' : '0.6rem 0.9rem',
								borderRadius: '9px',
								border: `1px solid ${enabled ? 'var(--border)' : g.color + '55'}`,
								background: enabled ? 'transparent' : `${g.color}0c`,
								cursor: 'pointer',
								WebkitTapHighlightColor: 'transparent',
								transition: 'all 0.2s ease',
								textAlign: 'left' as const,
							}}
						>
							{/* switch */}
							<span
								style={{
									width: '36px',
									height: '20px',
									borderRadius: '100px',
									background: enabled ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--bg-secondary)',
									border: `1px solid ${enabled ? '#10b981' : 'var(--border-light)'}`,
									position: 'relative' as const,
									flexShrink: 0,
									transition: 'background 0.2s ease',
								}}
							>
								<span
									style={{
										position: 'absolute' as const,
										top: '2px',
										left: enabled ? '18px' : '2px',
										width: '14px',
										height: '14px',
										borderRadius: '50%',
										background: 'white',
										transition: 'left 0.2s ease',
									}}
								/>
							</span>
							<span style={{ fontSize: mobile ? '0.82rem' : '0.9rem', fontWeight: 600, color: enabled ? 'var(--text)' : g.color }}>
								{g.label}
							</span>
							<span style={{ marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 700, color: enabled ? '#10b981' : g.color }}>
								{enabled ? 'ВКЛ' : 'ВЫКЛ'}
							</span>
						</button>
					);
				})}
			</div>

			<button
				onClick={() => setRan(true)}
				style={{
					padding: mobile ? '0.5rem 1.2rem' : '0.55rem 1.5rem',
					borderRadius: '8px',
					border: 'none',
					background: 'linear-gradient(135deg, #ff6b2b, #f97316)',
					color: 'white',
					fontSize: mobile ? '0.82rem' : '0.88rem',
					fontWeight: 700,
					cursor: 'pointer',
					WebkitTapHighlightColor: 'transparent',
				}}
			>
				▶ Запустить агента
			</button>

			{ran && (
				<div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column' as const, gap: '0.45rem' }}>
					{allOn ? (
						<div style={{ padding: mobile ? '0.7rem 0.85rem' : '0.85rem 1.1rem', borderRadius: '10px', border: '1px solid #10b98155', background: '#10b9810c', fontSize: mobile ? '0.84rem' : '0.9rem', color: 'var(--text)', lineHeight: 1.55, fontWeight: 600 }}>
							✅ Задача решена за 3 итерации. Баг пофикшен, 12 тестов зелёные. Юзер доволен 🫡
						</div>
					) : (
						failures.map((g) => (
							<div key={g.key} style={{ padding: mobile ? '0.7rem 0.85rem' : '0.8rem 1.1rem', borderRadius: '10px', border: `1px solid ${g.color}55`, background: `${g.color}0c`, fontSize: mobile ? '0.82rem' : '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
								<span style={{ fontSize: '1.05rem', marginRight: '0.4rem' }}>{g.icon}</span>
								<strong style={{ color: g.color }}>Нет «{g.label}»:</strong> {g.fail}
							</div>
						))
					)}
				</div>
			)}
		</div>
	);
}
