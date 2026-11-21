import { useState, useMemo, useEffect } from 'react';

interface Post {
	title: string;
	description: string;
	slug: string;
	date: string;
}

interface SearchBarProps {
	posts: Post[];
}

export default function SearchBar({ posts }: SearchBarProps) {
	const [query, setQuery] = useState('');
	const [focused, setFocused] = useState(false);
	const [activeIdx, setActiveIdx] = useState(0);

	// Поддержка ?q=... из WebSite SearchAction
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const q = params.get('q');
		if (q) {
			setQuery(q);
			setFocused(true);
		}
	}, []);

	const results = useMemo(() => {
		if (!query.trim()) return [];
		const q = query.toLowerCase();
		return posts.filter(
			(p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
		);
	}, [query, posts]);

	useEffect(() => {
		setActiveIdx(0);
	}, [query]);

	const showResults = focused && query.trim().length > 0;

	const onKeyDown = (e: React.KeyboardEvent) => {
		if (!showResults) return;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			setActiveIdx((i) => Math.min(results.length - 1, i + 1));
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			setActiveIdx((i) => Math.max(0, i - 1));
		} else if (e.key === 'Enter' && results[activeIdx]) {
			e.preventDefault();
			window.location.href = `/blog/${results[activeIdx].slug}/`;
		} else if (e.key === 'Escape') {
			setFocused(false);
		}
	};

	return (
		<div style={{ position: 'relative', width: '100%', maxWidth: '460px' }}>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					background: 'var(--bg-card)',
					border: `1px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
					borderRadius: 'var(--radius-sm)',
					padding: '0 0.85rem',
					transition: 'border-color 0.2s ease',
				}}
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<circle cx="11" cy="11" r="8" />
					<path d="m21 21-4.35-4.35" />
				</svg>
				<input
					type="text"
					placeholder="Поиск статей... (или ⌘K)"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onKeyDown={onKeyDown}
					onFocus={() => setFocused(true)}
					onBlur={() => setTimeout(() => setFocused(false), 180)}
					style={{
						flex: 1,
						border: 'none',
						background: 'transparent',
						padding: '0.65rem 0.7rem',
						color: 'var(--text)',
						fontSize: '0.88rem',
						outline: 'none',
						fontFamily: 'inherit',
					}}
				/>
				{query && (
					<button
						type="button"
						aria-label="Очистить поиск"
						onMouseDown={(e) => {
							e.preventDefault();
							setQuery('');
						}}
						style={{
							border: 'none',
							background: 'var(--bg-secondary)',
							color: 'var(--text-muted)',
							borderRadius: '6px',
							padding: '0.15rem 0.45rem',
							fontSize: '0.72rem',
							cursor: 'pointer',
						}}
					>
						✕
					</button>
				)}
			</div>

			{showResults && (
				<div
					style={{
						position: 'absolute',
						top: 'calc(100% + 6px)',
						left: 0,
						right: 0,
						background: 'var(--bg-card)',
						border: '1px solid var(--border-light)',
						borderRadius: 'var(--radius-sm)',
						boxShadow: 'var(--shadow-lg)',
						zIndex: 50,
						maxHeight: '300px',
						overflowY: 'auto',
					}}
				>
					{results.length > 0 ? (
						results.map((post, i) => (
							<a
								key={post.slug}
								href={`/blog/${post.slug}/`}
								onMouseEnter={() => setActiveIdx(i)}
								style={{
									display: 'block',
									padding: '0.7rem 0.85rem',
									textDecoration: 'none',
									borderBottom: '1px solid var(--border)',
									background: i === activeIdx ? 'var(--bg-card-hover)' : 'transparent',
									transition: 'background 0.15s ease',
								}}
							>
								<div style={{ fontSize: '0.88rem', color: i === activeIdx ? 'var(--accent-light)' : 'var(--text)', fontWeight: 600 }}>
									{post.title}
								</div>
								<div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
									{post.date}
								</div>
							</a>
						))
					) : (
						<div style={{ padding: '0.85rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
							Ничего не найдено
						</div>
					)}
				</div>
			)}
		</div>
	);
}
