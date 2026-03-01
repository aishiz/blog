import { useState } from 'react';

export default function CopyLink() {
	const [copied, setCopied] = useState(false);

	const copy = async () => {
		await navigator.clipboard.writeText(window.location.href);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<button
			onClick={copy}
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: '0.4rem',
				padding: '0.4rem 0.85rem',
				fontSize: '0.82rem',
				fontWeight: 500,
				fontFamily: 'inherit',
				color: copied ? 'var(--accent-yellow)' : 'var(--text-muted)',
				background: 'var(--bg-card)',
				border: `1px solid ${copied ? 'rgba(255, 217, 61, 0.3)' : 'var(--border)'}`,
				borderRadius: '100px',
				cursor: 'pointer',
				transition: 'all 0.2s ease',
			}}
			onMouseEnter={(e) => {
				if (!copied) e.currentTarget.style.borderColor = 'var(--border-light)';
			}}
			onMouseLeave={(e) => {
				if (!copied) e.currentTarget.style.borderColor = 'var(--border)';
			}}
		>
			{copied ? (
				<>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
						<path d="M20 6L9 17l-5-5" />
					</svg>
					Скопировано
				</>
			) : (
				<>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
						<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
					</svg>
					Копировать ссылку
				</>
			)}
		</button>
	);
}
