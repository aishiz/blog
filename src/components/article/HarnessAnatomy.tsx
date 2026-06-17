import { useState, useEffect } from 'react';

// Кликабельная «луковица» слоёв харнеса вокруг ядра-LLM.
interface Layer {
	id: number;
	name: string;
	icon: string;
	color: string;
	role: string;
	breaks: string;
}

const LAYERS: Layer[] = [
	{ id: 1, name: 'Agent loop', icon: '🔁', color: '#8b5cf6', role: 'Цикл think → act → observe. Гоняет модель, пока задача не решена.', breaks: 'Без него агент отвечает один раз и затыкается — это просто чат.' },
	{ id: 2, name: 'Tool calling', icon: '🔧', color: '#3b82f6', role: 'Набор функций (read_file, run, search) и приём структурированных вызовов.', breaks: 'Без рук модель только болтает, но ничего не делает.' },
	{ id: 3, name: 'Контекст', icon: '🧠', color: '#10b981', role: 'Решает, что положить в окно, что выкинуть, когда сжать историю.', breaks: 'Без управления — окно переполняется, агент забывает задачу.' },
	{ id: 4, name: 'Песочница и права', icon: '⚙️', color: '#ff6b2b', role: 'Изоляция, permissions, лимиты на опасные действия.', breaks: 'Без неё автономный агент = заряженный пистолет в твой прод.' },
	{ id: 5, name: 'Парсинг и валидация', icon: '🛡️', color: '#e040a0', role: 'Проверяет, что вызов корректен; кривой — ретрай или ошибка модели.', breaks: 'Без неё одна галлюцинация в аргументах роняет весь харнес.' },
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

export default function HarnessAnatomy() {
	const [sel, setSel] = useState(1);
	const mobile = useIsMobile();
	const selected = LAYERS.find((l) => l.id === sel)!;
	const pad = mobile ? 13 : 20;

	// Строим вложенные кольца снаружи (слой 5) внутрь (ядро).
	let node = (
		<div
			style={{
				width: mobile ? '60px' : '76px',
				height: mobile ? '60px' : '76px',
				borderRadius: '50%',
				background: 'radial-gradient(circle, #c946ff, #7c3aed)',
				display: 'flex',
				flexDirection: 'column' as const,
				alignItems: 'center',
				justifyContent: 'center',
				boxShadow: '0 0 24px rgba(201,70,255,0.5)',
				flexShrink: 0,
			}}
		>
			<span style={{ fontSize: mobile ? '1.2rem' : '1.5rem' }}>🧠</span>
			<span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'white', letterSpacing: '0.04em' }}>LLM</span>
		</div>
	);

	for (const l of LAYERS) {
		const active = sel === l.id;
		const inner = node;
		node = (
			<div
				key={l.id}
				onClick={(e) => {
					e.stopPropagation();
					setSel(l.id);
				}}
				style={{
					padding: pad,
					borderRadius: '50%',
					border: `2px solid ${active ? l.color : 'var(--border-light)'}`,
					background: active ? `${l.color}12` : 'transparent',
					boxShadow: active ? `0 0 18px ${l.color}55` : 'none',
					cursor: 'pointer',
					transition: 'all 0.25s ease',
					position: 'relative' as const,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<span
					style={{
						position: 'absolute' as const,
						top: pad / 2 - (mobile ? 7 : 9),
						fontSize: mobile ? '0.78rem' : '1rem',
						opacity: active ? 1 : 0.5,
					}}
				>
					{l.icon}
				</span>
				{inner}
			</div>
		);
	}

	return (
		<div style={{ margin: '1.75em 0', padding: mobile ? '0.85rem' : '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
			<div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
				🧅 Анатомия харнеса — кликай по слоям
			</div>
			<div style={{ fontSize: mobile ? '0.78rem' : '0.85rem', color: 'var(--text-muted)', marginBottom: '1.1rem', lineHeight: 1.5 }}>
				В центре — мозг (LLM). Вокруг — пять слоёв обвязки. Тыкни любой, чтобы узнать, что он делает и что ломается без него.
			</div>

			<div style={{ display: 'flex', flexDirection: mobile ? 'column' as const : 'row' as const, alignItems: 'center', gap: mobile ? '1rem' : '1.5rem' }}>
				<div style={{ display: 'flex', justifyContent: 'center', flexShrink: 0 }}>{node}</div>

				<div style={{ flex: 1, minWidth: 0, width: mobile ? '100%' : 'auto' }}>
					{/* Layer chips */}
					<div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '0.35rem', marginBottom: '0.85rem' }}>
						{LAYERS.map((l) => {
							const active = sel === l.id;
							return (
								<button
									key={l.id}
									onClick={() => setSel(l.id)}
									style={{
										padding: '0.3rem 0.6rem',
										borderRadius: '7px',
										border: `1.5px solid ${active ? l.color : 'var(--border)'}`,
										background: active ? `${l.color}18` : 'transparent',
										color: active ? l.color : 'var(--text-muted)',
										fontSize: mobile ? '0.68rem' : '0.74rem',
										fontWeight: active ? 700 : 500,
										cursor: 'pointer',
										WebkitTapHighlightColor: 'transparent',
										transition: 'all 0.2s ease',
									}}
								>
									{l.id}. {l.name}
								</button>
							);
						})}
					</div>

					<div style={{ padding: mobile ? '0.85rem' : '1.1rem', borderRadius: '10px', border: `1px solid ${selected.color}40`, background: `${selected.color}0a` }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
							<span style={{ fontSize: '1.2rem' }}>{selected.icon}</span>
							<span style={{ fontWeight: 800, color: 'var(--text)', fontSize: mobile ? '0.95rem' : '1.05rem' }}>{selected.name}</span>
						</div>
						<div style={{ fontSize: mobile ? '0.82rem' : '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.6rem' }}>{selected.role}</div>
						<div style={{ fontSize: mobile ? '0.78rem' : '0.83rem', color: selected.color, lineHeight: 1.5, fontWeight: 600 }}>
							💥 {selected.breaks}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
