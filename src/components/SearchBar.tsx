import { useState, useCallback } from 'react';

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

	const results = useCallback(() => {
		if (!query.trim()) return [];
		const q = query.toLowerCase();
		return posts.filter(
			(p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
		);
	}, [query, posts])();

	const showResults = focused && query.trim().length > 0;

	return (
		<div style={{ position: 'relative', width: '100%', maxWidth: '440px' }}>
			<div style={{
				display: 'flex',
				alignItems: 'center',
				background: 'var(--bg-card)',
				border: `1px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
				borderRadius: 'var(--radius-sm)',
				padding: '0 0.85rem',
				transition: 'border-color 0.2s ease',
			}}>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<circle cx="11" cy="11" r="8" />
					<path d="m21 21-4.35-4.35" />
				</svg>
				<input
					type="text"
					placeholder="Поиск статей..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onFocus={() => setFocused(true)}
					onBlur={() => setTimeout(() => setFocused(false), 200)}
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
			</div>

			{showResults && (
				<div style={{
					position: 'absolute',
					top: 'calc(100% + 6px)',
					left: 0,
					right: 0,
					background: 'var(--bg-card)',
					border: '1px solid var(--border-light)',
					borderRadius: 'var(--radius-sm)',
					boxShadow: 'var(--shadow-lg)',
					zIndex: 50,
					maxHeight: '280px',
					overflowY: 'auto',
				}}>
					{results.length > 0 ? (
						results.map((post) => (
							<a
								key={post.slug}
								href={`/blog/${post.slug}/`}
								style={{
									display: 'block',
									padding: '0.7rem 0.85rem',
									textDecoration: 'none',
									borderBottom: '1px solid var(--border)',
									transition: 'background 0.15s ease',
								}}
								onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
								onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
							>
								<div style={{ fontSize: '0.88rem', color: 'var(--text)', fontWeight: 500 }}>
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
