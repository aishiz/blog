import { useState, useEffect } from 'react';

const PUBLICATIONS = [
	{
		outlet: 'Forbes',
		date: 'Фев 16, 2026',
		title: 'OpenAI Hires OpenClaw Creator Peter Steinberger And Sets Up Foundation',
		quote: 'Каждая смена имени расширяла аудиторию и её профиль риска.',
		color: '#ef4444',
		emoji: '📰',
	},
	{
		outlet: 'WIRED',
		date: 'Фев 11, 2026',
		title: 'I Loved My OpenClaw AI Agent — Until It Turned on Me',
		quote: 'Агент, получив доступ к электронной почте, начал отправлять фишинговые письма от имени пользователя.',
		color: '#3b82f6',
		emoji: '🔌',
	},
	{
		outlet: 'The Guardian',
		date: 'Фев 2, 2026',
		title: 'Viral AI personal assistant seen as step change — but experts warn of risks',
		quote: 'Вирусный AI-ассистент воспринимается как качественный скачок — но эксперты предупреждают о рисках.',
		color: '#10b981',
		emoji: '🌍',
	},
	{
		outlet: 'TechCrunch',
		date: 'Фев 15, 2026',
		title: 'OpenClaw creator Peter Steinberger joins OpenAI',
		quote: 'Создатель самого быстрорастущего open-source проекта в истории присоединяется к OpenAI.',
		color: '#8b5cf6',
		emoji: '⚡',
	},
	{
		outlet: 'Medium',
		date: 'Фев 24, 2026',
		title: '210,000 GitHub Stars in 10 Days',
		quote: 'A weekend WhatsApp hack became the fastest-growing open-source AI project of 2026.',
		color: '#f59e0b',
		emoji: '✍️',
	},
	{
		outlet: 'GenDigital',
		date: 'Фев 2, 2026',
		title: 'OpenClaw: Handing AI the keys to your digital life',
		quote: 'Платформы вроде OpenClaw делают простым для любого человека развёртывание автономных AI-агентов.',
		color: '#ff6b2b',
		emoji: '🔐',
	},
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

export default function MediaBuzz() {
	const [active, setActive] = useState(0);
	const [auto, setAuto] = useState(true);
	const mobile = useIsMobile();

	useEffect(() => {
		if (!auto) return;
		const t = setInterval(() => setActive(a => (a + 1) % PUBLICATIONS.length), 4000);
		return () => clearInterval(t);
	}, [auto]);

	const pub = PUBLICATIONS[active];

	return (
		<div style={{
			margin: '1.75em 0', padding: mobile ? '0.85rem' : '1.5rem',
			borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)',
		}}>
			<div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
				📡 Медиа-шторм
			</div>
			<div style={{ fontSize: mobile ? '0.78rem' : '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
				Что писали мировые издания об OpenClaw
			</div>

			{/* Active publication */}
			<div style={{
				padding: mobile ? '1rem' : '1.5rem',
				borderRadius: '10px',
				border: `1.5px solid ${pub.color}35`,
				background: `${pub.color}06`,
				marginBottom: '1rem',
				minHeight: mobile ? '140px' : '120px',
				transition: 'border-color 0.3s ease',
			}}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
					<span style={{ fontSize: '1.4rem' }}>{pub.emoji}</span>
					<div>
						<div style={{ fontWeight: 800, fontSize: mobile ? '0.95rem' : '1.05rem', color: pub.color }}>
							{pub.outlet}
						</div>
						<div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{pub.date}</div>
					</div>
				</div>
				<div style={{
					fontWeight: 600, fontSize: mobile ? '0.85rem' : '0.92rem',
					color: 'var(--text)', lineHeight: 1.5, marginBottom: '0.6rem',
				}}>
					{pub.title}
				</div>
				<div style={{
					fontSize: mobile ? '0.82rem' : '0.88rem',
					color: 'var(--text-secondary)', lineHeight: 1.6,
					fontStyle: 'italic',
					borderLeft: `3px solid ${pub.color}40`,
					paddingLeft: '0.75rem',
				}}>
					«{pub.quote}»
				</div>
			</div>

			{/* Navigation dots */}
			<div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
				{PUBLICATIONS.map((p, i) => (
					<button
						key={i}
						onClick={() => { setActive(i); setAuto(false); }}
						style={{
							width: active === i ? '24px' : '8px',
							height: '8px',
							borderRadius: '4px',
							background: active === i ? p.color : 'var(--border)',
							border: 'none',
							cursor: 'pointer',
							transition: 'all 0.3s ease',
							WebkitTapHighlightColor: 'transparent',
							padding: 0,
						}}
					/>
				))}
				<button
					onClick={() => setAuto(!auto)}
					style={{
						marginLeft: '0.75rem',
						fontSize: '0.7rem',
						color: auto ? '#10b981' : 'var(--text-muted)',
						background: 'none',
						border: `1px solid ${auto ? '#10b981' : 'var(--border)'}`,
						borderRadius: '4px',
						padding: '0.15rem 0.4rem',
						cursor: 'pointer',
						WebkitTapHighlightColor: 'transparent',
					}}
				>
					{auto ? '⏸' : '▶'} авто
				</button>
			</div>
		</div>
	);
}
