import { useState, useEffect, useRef } from 'react';

type Pillar = {
	id: string;
	year: string;
	name: string;
	nameEn: string;
	icon: string;
	color: string;
	desc: string;
	autonomy: number;
};

const pillars: Pillar[] = [
	{ id: 'chatbot', year: '2022–2023', name: 'Чат-боты', nameEn: 'Human-like UI', icon: '💬', color: '#ef4444', desc: 'Диалог вопрос-ответ. Агент реагирует, не действует.', autonomy: 10 },
	{ id: 'vibecoding', year: '2024', name: 'Vibe Coding', nameEn: 'Вайб-кодинг', icon: '✨', color: '#f59e0b', desc: 'Описываешь намерение, агент генерирует код. Первое абстрагирование.', autonomy: 25 },
	{ id: 'agentic', year: '2025', name: 'Agentic Engineering', nameEn: 'Агентная инженерия', icon: '🤖', color: '#3b82f6', desc: 'Человек — архитектор агентов. SKILL-ы как модули знаний.', autonomy: 50 },
	{ id: 'vibetools', year: '2025–2026', name: 'Вайб-инструменты', nameEn: 'Vibe Tools', icon: '🎯', color: '#8b5cf6', desc: 'Пользователь ставит цель. Агент выбирает SKILL-ы и оркестрирует инструменты.', autonomy: 75 },
	{ id: 'vibeclouding', year: '2026+', name: 'Вайбклаудинг', nameEn: 'Vibeclouding', icon: '☁️', color: '#10b981', desc: 'Человек описывает боль. Агент строит всю инфру: IaaS, PaaS, k8s, S3.', autonomy: 95 },
];

const N = pillars.length;
const DOT_DESKTOP = 36;
const DOT_MOBILE = 30;

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

export default function HeroOverview() {
	const [active, setActive] = useState(0);
	const [auto, setAuto] = useState(true);
	const mobile = useIsMobile();
	const containerRef = useRef<HTMLDivElement>(null);
	const [trackWidth, setTrackWidth] = useState(0);

	const DOT = mobile ? DOT_MOBILE : DOT_DESKTOP;

	useEffect(() => {
		if (!auto) return;
		const id = setInterval(() => setActive(p => (p + 1) % N), 2800);
		return () => clearInterval(id);
	}, [auto]);

	useEffect(() => {
		const measure = () => {
			if (containerRef.current) {
				setTrackWidth(containerRef.current.offsetWidth);
			}
		};
		measure();
		window.addEventListener('resize', measure, { passive: true });
		return () => window.removeEventListener('resize', measure);
	}, []);

	const p = pillars[active];

	const gap = N > 1 ? (trackWidth - DOT * N) / (N - 1) : 0;
	const dotCenters = pillars.map((_, i) => DOT / 2 + i * (DOT + gap));
	const lineLeft = dotCenters[0] || 0;
	const lineRight = dotCenters[N - 1] || trackWidth;
	const lineWidth = lineRight - lineLeft;
	const fillWidth = N > 1 ? (active / (N - 1)) * lineWidth : 0;

	return (
		<div style={{
			margin: '1.75em 0',
			padding: mobile ? '0.85rem' : '1.5rem',
			borderRadius: '12px',
			border: '1px solid var(--border)',
			background: 'var(--bg-card)',
		}}>
			<div style={{
				fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)',
				textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem',
			}}>
				🗺️ Эволюция взаимодействия человека с технологиями
			</div>
			<div style={{
				fontSize: mobile ? '0.78rem' : '0.88rem', color: 'var(--text-muted)',
				marginBottom: '1.25rem', lineHeight: 1.6,
			}}>
				От низкой автономности к полной. Нажмите на эпоху.
			</div>

			<div ref={containerRef} style={{ position: 'relative' as const, marginBottom: '0.5rem' }}>
				{trackWidth > 0 && (
					<svg
						width={trackWidth}
						height="4"
						style={{
							position: 'absolute' as const,
							top: `${DOT / 2 - 2}px`,
							left: 0,
							display: 'block',
							overflow: 'visible',
						}}
					>
						<line
							x1={lineLeft} y1={2}
							x2={lineRight} y2={2}
							stroke="var(--border)"
							strokeWidth={4}
							strokeLinecap="round"
						/>
						<line
							x1={lineLeft} y1={2}
							x2={lineLeft + fillWidth} y2={2}
							stroke={p.color}
							strokeWidth={4}
							strokeLinecap="round"
							style={{ transition: 'all 0.5s ease' }}
						/>
					</svg>
				)}

				<div style={{
					display: 'flex',
					justifyContent: 'space-between',
					position: 'relative' as const,
					zIndex: 1,
				}}>
					{pillars.map((pl, i) => (
						<button
							key={pl.id}
							onClick={() => { setActive(i); setAuto(false); }}
							style={{
								width: `${DOT}px`,
								height: `${DOT}px`,
								borderRadius: '50%',
								border: `2.5px solid ${i <= active ? pl.color : 'var(--border)'}`,
								background: i === active ? `${pl.color}25` : i < active ? `${pl.color}12` : 'var(--bg-card)',
								cursor: 'pointer',
								display: 'flex', alignItems: 'center', justifyContent: 'center',
								fontSize: mobile ? '0.85rem' : '1rem',
								transition: 'all 0.3s ease',
								transform: i === active ? 'scale(1.15)' : 'scale(1)',
								boxShadow: i === active ? `0 0 14px ${pl.color}55` : 'none',
								fontFamily: 'inherit', padding: 0,
								zIndex: i === active ? 2 : 1,
								flexShrink: 0,
							}}
						>
							{pl.icon}
						</button>
					))}
				</div>

				<div style={{
					display: 'flex',
					justifyContent: 'space-between',
					marginTop: '0.35rem',
				}}>
					{pillars.map((pl, i) => (
						<span key={pl.id} style={{
							fontSize: mobile ? '0.5rem' : '0.6rem',
							fontWeight: 700,
							color: i === active ? pl.color : 'var(--text-muted)',
							textAlign: 'center' as const,
							width: `${DOT}px`,
							transition: 'color 0.3s ease',
							lineHeight: 1.2,
							flexShrink: 0,
							whiteSpace: 'pre-line' as const,
						}}>
							{pl.year}
						</span>
					))}
				</div>
			</div>

			<div style={{
				display: 'flex', justifyContent: 'space-between', alignItems: 'center',
				marginBottom: '1rem', fontSize: '0.6rem', fontWeight: 600,
				color: 'var(--text-muted)', padding: '0 0.15rem',
			}}>
				<span>← Низкая автономность</span>
				<span>Полная автономность →</span>
			</div>

			<div style={{
				padding: mobile ? '0.85rem' : '1.25rem',
				borderRadius: '10px',
				border: `1.5px solid ${p.color}44`,
				background: `${p.color}08`,
				transition: 'all 0.4s ease',
			}}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
					<span style={{ fontSize: mobile ? '1.4rem' : '1.8rem' }}>{p.icon}</span>
					<div>
						<div style={{
							fontSize: mobile ? '1rem' : '1.2rem', fontWeight: 900, color: p.color,
						}}>
							{p.name}
						</div>
						<div style={{
							fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)',
							fontStyle: 'italic' as const,
						}}>
							{p.nameEn} · {p.year}
						</div>
					</div>
				</div>

				<div style={{
					fontSize: mobile ? '0.82rem' : '0.9rem', color: 'var(--text-secondary)',
					lineHeight: 1.6, marginBottom: '0.75rem',
				}}>
					{p.desc}
				</div>

				<div>
					<div style={{
						display: 'flex', justifyContent: 'space-between', alignItems: 'center',
						marginBottom: '0.3rem',
					}}>
						<span style={{
							fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)',
							textTransform: 'uppercase' as const, letterSpacing: '0.06em',
						}}>
							Автономность
						</span>
						<span style={{
							fontSize: '0.78rem', fontWeight: 900, color: p.color,
							fontFamily: "'JetBrains Mono', monospace",
						}}>
							{p.autonomy}%
						</span>
					</div>
					<div style={{
						height: '8px', borderRadius: '4px',
						background: 'var(--bg-secondary)', border: '1px solid var(--border)',
						overflow: 'hidden',
					}}>
						<div style={{
							height: '100%', borderRadius: '4px',
							width: `${p.autonomy}%`,
							background: `linear-gradient(90deg, ${p.color}, ${p.color}bb)`,
							transition: 'width 0.6s ease',
						}} />
					</div>
				</div>
			</div>
		</div>
	);
}
