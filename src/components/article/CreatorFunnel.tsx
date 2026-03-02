import { useState, useEffect } from 'react';

type FunnelStep = {
	name: string;
	time: string;
	survivalOld: number;
	survivalNew: number;
};

const steps: FunnelStep[] = [
	{ name: 'Идея', time: '', survivalOld: 100, survivalNew: 100 },
	{ name: 'Изучить программирование', time: '6–24 месяца', survivalOld: 15, survivalNew: 95 },
	{ name: 'Нанять команду', time: 'бюджет $50k+', survivalOld: 5, survivalNew: 90 },
	{ name: 'Настроить инфраструктуру', time: '1–3 месяца', survivalOld: 3, survivalNew: 85 },
	{ name: 'Запустить MVP', time: '6–12 месяцев', survivalOld: 1, survivalNew: 80 },
];

const newStepNames = [
	'Идея + Боль',
	'Описать задачу агенту (5–15 минут)',
	'Агент планирует архитектуру (автоматически)',
	'Агент разворачивает инфру (часы)',
	'Работающий MVP (1 день – 1 неделя)',
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

export default function CreatorFunnel() {
	const [side, setSide] = useState<'old' | 'new'>('old');
	const [step, setStep] = useState(0);
	const [auto, setAuto] = useState(true);
	const mobile = useIsMobile();

	useEffect(() => {
		if (!auto || step >= steps.length - 1) {
			if (auto && step >= steps.length - 1) setAuto(false);
			return;
		}
		const id = setTimeout(() => setStep(s => s + 1), 1200);
		return () => clearTimeout(id);
	}, [auto, step]);

	const restart = () => { setStep(0); setAuto(true); };

	return (
		<div style={{
			margin: '1.75em 0', padding: mobile ? '0.85rem' : '1.5rem',
			borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)',
		}}>
			<div style={{
				fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)',
				textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem',
			}}>
				🔻 Путь от Идеи до Продукта
			</div>

			<div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem' }}>
				<button onClick={() => { setSide('old'); restart(); }} style={{
					flex: 1, padding: mobile ? '0.4rem' : '0.45rem 0.85rem',
					borderRadius: '8px',
					border: `2px solid ${side === 'old' ? '#ef4444' : 'var(--border)'}`,
					background: side === 'old' ? '#ef444412' : 'var(--bg-secondary)',
					color: side === 'old' ? '#ef4444' : 'var(--text-muted)',
					fontSize: mobile ? '0.72rem' : '0.78rem', fontWeight: 700,
					cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
					textAlign: 'center' as const,
				}}>
					🏗️ Старый путь
				</button>
				<button onClick={() => { setSide('new'); restart(); }} style={{
					flex: 1, padding: mobile ? '0.4rem' : '0.45rem 0.85rem',
					borderRadius: '8px',
					border: `2px solid ${side === 'new' ? '#10b981' : 'var(--border)'}`,
					background: side === 'new' ? '#10b98112' : 'var(--bg-secondary)',
					color: side === 'new' ? '#10b981' : 'var(--text-muted)',
					fontSize: mobile ? '0.72rem' : '0.78rem', fontWeight: 700,
					cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
					textAlign: 'center' as const,
				}}>
					☁️ Вайбклаудинг
				</button>
			</div>

			<div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.3rem' }}>
				{steps.map((s, i) => {
					const reached = i <= step;
					const current = i === step;
					const survival = side === 'old' ? s.survivalOld : s.survivalNew;
					const color = side === 'old' ? '#ef4444' : '#10b981';
					const name = side === 'new' ? newStepNames[i] : s.name;

					return (
						<button
							key={`${side}-${i}`}
							onClick={() => { setStep(i); setAuto(false); }}
							style={{
								display: 'flex', alignItems: 'center', gap: mobile ? '0.4rem' : '0.6rem',
								width: '100%', textAlign: 'left' as const,
								padding: mobile ? '0.5rem 0.6rem' : '0.6rem 0.85rem',
								borderRadius: '8px',
								border: `1.5px solid ${current ? color : reached ? `${color}44` : 'var(--border)'}`,
								background: current ? `${color}10` : 'var(--bg-secondary)',
								opacity: reached ? 1 : 0.3,
								cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.4s ease',
							}}
						>
							<div style={{
								width: mobile ? '32px' : '40px', flexShrink: 0,
							}}>
								<div style={{
									height: mobile ? '6px' : '8px', borderRadius: '4px',
									background: 'var(--bg-card)', border: '1px solid var(--border)',
									overflow: 'hidden',
								}}>
									<div style={{
										height: '100%', borderRadius: '4px',
										width: reached ? `${survival}%` : '0%',
										background: color,
										transition: 'width 0.6s ease',
									}} />
								</div>
							</div>
							<div style={{ flex: 1, minWidth: 0 }}>
								<div style={{
									fontSize: mobile ? '0.75rem' : '0.82rem', fontWeight: 600,
									color: current ? color : 'var(--text)', lineHeight: 1.3,
								}}>
									{name}
								</div>
								{side === 'old' && s.time && (
									<div style={{
										fontSize: mobile ? '0.6rem' : '0.65rem', color: 'var(--text-muted)',
										marginTop: '0.1rem',
									}}>
										{s.time}
									</div>
								)}
							</div>
							<span style={{
								fontSize: mobile ? '0.72rem' : '0.82rem', fontWeight: 800,
								color: reached ? color : 'var(--text-muted)',
								fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
							}}>
								~{reached ? survival : '?'}%
							</span>
						</button>
					);
				})}
			</div>

			<button
				onClick={restart}
				style={{
					marginTop: '0.6rem', width: '100%',
					padding: '0.4rem 1rem', borderRadius: '8px',
					border: '1px solid var(--border)', background: 'var(--bg-secondary)',
					color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600,
					cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
				}}
			>
				▶ Перезапустить
			</button>

			<div style={{
				display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.75rem',
			}}>
				<div style={{
					padding: mobile ? '0.55rem' : '0.65rem 0.85rem',
					borderRadius: '8px', background: '#ef444408', border: '1px solid #ef444433',
					textAlign: 'center' as const,
				}}>
					<div style={{ fontSize: mobile ? '1rem' : '1.2rem', fontWeight: 900, color: '#ef4444' }}>99%</div>
					<div style={{ fontSize: mobile ? '0.58rem' : '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
						людей с идеями так и не создали продукт
					</div>
				</div>
				<div style={{
					padding: mobile ? '0.55rem' : '0.65rem 0.85rem',
					borderRadius: '8px', background: '#10b98108', border: '1px solid #10b98133',
					textAlign: 'center' as const,
				}}>
					<div style={{ fontSize: mobile ? '1rem' : '1.2rem', fontWeight: 900, color: '#10b981' }}>80%</div>
					<div style={{ fontSize: mobile ? '0.58rem' : '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
						людей с идеями могут создать продукт
					</div>
				</div>
			</div>
		</div>
	);
}
