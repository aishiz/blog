import { useState, useEffect } from 'react';

export default function ScrollToTop() {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const onScroll = () => setVisible(window.scrollY > 400);
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	if (!visible) return null;

	return (
		<button
			onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
			aria-label="Наверх"
			style={{
				position: 'fixed',
				bottom: '2rem',
				right: '2rem',
				width: '44px',
				height: '44px',
				borderRadius: '50%',
				border: '1px solid var(--border-light)',
				background: 'var(--bg-card)',
				color: 'var(--accent-light)',
				cursor: 'pointer',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
				zIndex: 90,
				transition: 'all 0.2s ease',
				opacity: visible ? 1 : 0,
			}}
			onMouseEnter={(e) => {
				e.currentTarget.style.background = 'var(--bg-card-hover)';
				e.currentTarget.style.borderColor = 'var(--accent)';
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.background = 'var(--bg-card)';
				e.currentTarget.style.borderColor = 'var(--border-light)';
			}}
		>
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
				<path d="M18 15l-6-6-6 6" />
			</svg>
		</button>
	);
}
