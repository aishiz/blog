import { useState, useEffect } from 'react';

const hints = [
	{ icon: '🖱️', text: 'Нажимай кнопки' },
	{ icon: '🔀', text: 'Переключай режимы' },
	{ icon: '✨', text: 'Смотри анимации' },
	{ icon: '📊', text: 'Исследуй данные' },
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

export default function InteractiveBanner() {
	const [pulse, setPulse] = useState(false);
	const [hintIdx, setHintIdx] = useState(0);
	const mobile = useIsMobile();

	useEffect(() => {
		const p = setInterval(() => setPulse(v => !v), 1800);
		return () => clearInterval(p);
	}, []);

	useEffect(() => {
		const h = setInterval(() => setHintIdx(i => (i + 1) % hints.length), 1600);
		return () => clearInterval(h);
	}, []);

	return (
		<div style={{
			margin: '1.25em 0 1.75em',
			borderRadius: mobile ? '10px' : '14px',
			padding: mobile ? '0.9rem 1rem' : '1.25rem 1.5rem',
			background: 'linear-gradient(135deg, #10b98112, #3b82f608)',
			border: '2px solid #10b981',
			boxShadow: pulse
				? '0 0 0 4px #10b98128, 0 4px 24px #10b98120'
				: '0 0 0 0px #10b98100, 0 2px 8px #10b98110',
			transition: 'box-shadow 0.9s ease',
			position: 'relative' as const,
			overflow: 'hidden',
		}}>
			<style>{`
				@keyframes ib-shimmer {
					0% { transform: translateX(-100%); }
					100% { transform: translateX(100%); }
				}
				@keyframes ib-blink {
					0%, 100% { opacity: 1; }
					50% { opacity: 0.35; }
				}
			`}</style>

			<div style={{
				position: 'absolute' as const, inset: 0,
				background: 'linear-gradient(90deg, transparent, #10b98106, transparent)',
				animation: 'ib-shimmer 3s ease-in-out infinite',
				pointerEvents: 'none',
			}} />

			<div style={{ display: 'flex', alignItems: 'flex-start', gap: mobile ? '0.6rem' : '0.85rem' }}>
				<div style={{
					fontSize: mobile ? '1.4rem' : '1.8rem',
					lineHeight: 1, flexShrink: 0,
					filter: 'drop-shadow(0 0 6px #10b98188)',
					animation: 'ib-blink 1.8s ease-in-out infinite',
				}}>
					👆
				</div>

				<div style={{ flex: 1, minWidth: 0 }}>
					<div style={{
						fontWeight: 900,
						fontSize: mobile ? '0.9rem' : '1rem',
						color: '#10b981',
						letterSpacing: '0.01em',
						marginBottom: '0.25rem',
						lineHeight: 1.3,
					}}>
						Это интерактивная статья — её нужно тыкать
					</div>
					<div style={{
						fontSize: mobile ? '0.8rem' : '0.88rem',
						color: 'var(--text-secondary)',
						lineHeight: 1.55,
					}}>
						Каждый блок с рамкой — живой компонент.{' '}
						<strong style={{ color: 'var(--text)' }}>
							{mobile
								? 'Кнопки работают, данные меняются.'
								: 'Кнопки работают, данные меняются, анимации крутятся.'}
						</strong>
						{!mobile && ' Просто скроллить — значит потерять половину контента.'}
					</div>
				</div>
			</div>

			<div style={{
				display: 'flex', gap: '0.3rem', marginTop: mobile ? '0.65rem' : '0.85rem',
				flexWrap: 'wrap' as const,
			}}>
				{hints.map((h, i) => (
					<div key={i} style={{
						display: 'flex', alignItems: 'center', gap: '0.25rem',
						padding: mobile ? '0.2rem 0.45rem' : '0.25rem 0.6rem',
						borderRadius: '100px',
						background: i === hintIdx ? '#10b98118' : 'var(--bg-secondary)',
						border: `1px solid ${i === hintIdx ? '#10b98155' : 'var(--border)'}`,
						fontSize: mobile ? '0.65rem' : '0.72rem',
						fontWeight: 600,
						color: i === hintIdx ? '#10b981' : 'var(--text-muted)',
						transition: 'all 0.4s ease',
					}}>
						<span>{h.icon}</span>
						<span>{h.text}</span>
					</div>
				))}
			</div>
		</div>
	);
}
