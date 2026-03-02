import { useState, useEffect } from 'react';

type Barrier = {
	before: string;
	after: string;
	icon: string;
};

const barriers: Barrier[] = [
	{ before: 'Нужно знать Python/JS', after: 'Достаточно описать идею', icon: '💻' },
	{ before: 'Нужно знать Docker/k8s', after: 'Агент сам выберет инфру', icon: '🐳' },
	{ before: 'Нужно понимать SQL/БД', after: 'Агент создаст схему', icon: '🗄️' },
	{ before: 'Нужен бюджет на DevOps', after: 'Агент оптимизирует расходы', icon: '💰' },
	{ before: 'Нужно 3-6 мес. разработки', after: 'Часы или дни до MVP', icon: '⏱️' },
	{ before: 'Нужна команда 5-10 человек', after: 'Ты + агент = продукт', icon: '👥' },
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

export default function BarrierBreaker() {
	const [revealed, setRevealed] = useState<Set<number>>(new Set());
	const mobile = useIsMobile();

	const revealAll = () => setRevealed(new Set(barriers.map((_, i) => i)));
	const resetAll = () => setRevealed(new Set());
	const allRevealed = revealed.size === barriers.length;

	return (
		<div style={{
			margin: '1.75em 0', padding: mobile ? '0.85rem' : '1.5rem',
			borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)',
		}}>
			<div style={{
				fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)',
				textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem',
			}}>
				🔓 Барьеры входа: Раньше vs. Теперь
			</div>
			<div style={{
				fontSize: mobile ? '0.78rem' : '0.85rem', color: 'var(--text-muted)',
				marginBottom: '1rem', lineHeight: 1.5,
			}}>
				Нажмите на барьер, чтобы увидеть, как Вайбклаудинг его устраняет.
			</div>

			<div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.35rem' }}>
				{barriers.map((b, i) => {
					const isRevealed = revealed.has(i);
					return (
						<button
							key={i}
							onClick={() => {
								const next = new Set(revealed);
								if (isRevealed) next.delete(i); else next.add(i);
								setRevealed(next);
							}}
							style={{
								display: 'flex', alignItems: 'center', gap: mobile ? '0.4rem' : '0.6rem',
								width: '100%', textAlign: 'left' as const,
								padding: mobile ? '0.55rem 0.65rem' : '0.65rem 0.85rem',
								borderRadius: '8px',
								border: `1.5px solid ${isRevealed ? '#10b981' : '#ef444466'}`,
								background: isRevealed ? '#10b98108' : 'var(--bg-secondary)',
								cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.35s ease',
							}}
						>
							<span style={{ fontSize: mobile ? '1rem' : '1.15rem', flexShrink: 0 }}>{b.icon}</span>
							<div style={{ flex: 1, minWidth: 0 }}>
								<div style={{
									fontSize: mobile ? '0.75rem' : '0.82rem', fontWeight: 600,
									color: isRevealed ? 'var(--text-muted)' : '#ef4444',
									textDecoration: isRevealed ? 'line-through' : 'none',
									transition: 'all 0.3s ease', lineHeight: 1.3,
								}}>
									{b.before}
								</div>
								{isRevealed && (
									<div style={{
										fontSize: mobile ? '0.75rem' : '0.82rem', fontWeight: 700,
										color: '#10b981', marginTop: '0.15rem', lineHeight: 1.3,
									}}>
										→ {b.after}
									</div>
								)}
							</div>
							<span style={{
								fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
								color: isRevealed ? '#10b981' : 'var(--text-muted)',
							}}>
								{isRevealed ? '✅' : '❌'}
							</span>
						</button>
					);
				})}
			</div>

			<button
				onClick={allRevealed ? resetAll : revealAll}
				style={{
					marginTop: '0.6rem', width: '100%',
					padding: '0.45rem 1rem', borderRadius: '8px',
					border: '1px solid var(--border)', background: 'var(--bg-secondary)',
					color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600,
					cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
				}}
			>
				{allRevealed ? '🔄 Сбросить' : '⚡ Показать все'}
			</button>

			<div style={{
				marginTop: '0.6rem', padding: '0.55rem 0.75rem', borderRadius: '8px',
				border: '1px dashed var(--border)', background: 'var(--bg-secondary)',
				fontSize: mobile ? '0.68rem' : '0.75rem', color: 'var(--text-muted)',
				textAlign: 'center' as const, lineHeight: 1.5, fontStyle: 'italic' as const,
			}}>
				Аналогия: появление смартфонов не убило Nokia — оно создало миллиард новых пользователей мобильного интернета. Вайбклаудинг — это смартфон для создания продуктов.
			</div>
		</div>
	);
}
