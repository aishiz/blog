import { useState, useEffect } from 'react';

export default function ReadingProgress() {
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		const update = () => {
			const scrollTop = window.scrollY || document.documentElement.scrollTop;
			const docHeight = document.documentElement.scrollHeight;
			const winHeight = window.innerHeight;
			const scrollable = docHeight - winHeight;
			if (scrollable <= 0) { setProgress(100); return; }
			setProgress(Math.min(100, Math.max(0, (scrollTop / scrollable) * 100)));
		};
		window.addEventListener('scroll', update, { passive: true });
		update();
		return () => window.removeEventListener('scroll', update);
	}, []);

	if (progress <= 0) return null;

	return (
		<div style={{
			position: 'fixed',
			top: 56,
			left: 0,
			width: '100%',
			height: '3px',
			zIndex: 99,
			background: 'var(--border)',
		}}>
			<div style={{
				height: '100%',
				width: `${progress}%`,
				background: 'linear-gradient(90deg, var(--accent), var(--accent-secondary))',
				transition: 'width 0.1s linear',
				borderRadius: '0 2px 2px 0',
			}} />
		</div>
	);
}
