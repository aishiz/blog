import { useState, useEffect } from 'react';

interface Props {
	wordCount?: number;
}

export default function ReadingProgress({ wordCount }: Props) {
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

	const totalMinutes = wordCount ? Math.max(1, Math.round(wordCount / 200)) : null;
	const remaining = totalMinutes !== null ? Math.round(totalMinutes * (1 - progress / 100)) : null;

	return (
		<>
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
			{remaining !== null && remaining > 0 && progress < 99 && (
				<div className="reading-remaining" style={{
					position: 'fixed',
					top: '66px',
					right: '1.5rem',
					zIndex: 99,
					padding: '0.3rem 0.75rem',
					borderRadius: '100px',
					fontSize: '0.72rem',
					fontWeight: 600,
					color: 'var(--text-muted)',
					background: 'color-mix(in srgb, var(--bg-card) 85%, transparent)',
					border: '1px solid var(--border)',
					backdropFilter: 'blur(6px)',
					pointerEvents: 'none',
				}}>
					≈{remaining} мин осталось
				</div>
			)}
		</>
	);
}
