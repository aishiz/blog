import { useState, useEffect, useRef, useMemo } from 'react';

export interface SearchPost {
	title: string;
	description: string;
	slug: string;
	date: string;
	category?: string;
}

const CAT_VAR: Record<string, string> = {
	фундамент: 'var(--cat-fundament)',
	тулы: 'var(--cat-tools)',
	модели: 'var(--cat-models)',
	хайп: 'var(--cat-hype)',
};

export default function CommandSearch({ posts }: { posts: SearchPost[] }) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [activeIdx, setActiveIdx] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);

	const results = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return posts.slice(0, 6);
		return posts
			.filter(
				(p) =>
					p.title.toLowerCase().includes(q) ||
					p.description.toLowerCase().includes(q) ||
					(p.category && p.category.toLowerCase().includes(q)),
			)
			.slice(0, 10);
	}, [query, posts]);

	useEffect(() => {
		setActiveIdx(0);
	}, [query, open]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const tag = (e.target as HTMLElement | null)?.tagName;
			const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement | null)?.isContentEditable;
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault();
				setOpen((v) => !v);
			} else if (e.key === '/' && !isInput && !open) {
				e.preventDefault();
				setOpen(true);
			} else if (e.key === 'Escape' && open) {
				setOpen(false);
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [open]);

	useEffect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
			setTimeout(() => inputRef.current?.focus(), 20);
		} else {
			document.body.style.overflow = '';
			setQuery('');
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [open]);

	const onInputKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			setActiveIdx((i) => Math.min(results.length - 1, i + 1));
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			setActiveIdx((i) => Math.max(0, i - 1));
		} else if (e.key === 'Enter' && results[activeIdx]) {
			e.preventDefault();
			window.location.href = `/blog/${results[activeIdx].slug}/`;
		}
	};

	return (
		<>
			<button
				type="button"
				className="cmd-trigger"
				onClick={() => setOpen(true)}
				aria-label="Поиск по статьям (Cmd+K)"
				title="Поиск по статьям (⌘K или /)"
				style={{
					display: 'inline-flex',
					alignItems: 'center',
					gap: '0.45rem',
					height: '34px',
					padding: '0 0.65rem',
					borderRadius: '999px',
					border: '1px solid var(--border)',
					background: 'var(--bg-card)',
					color: 'var(--text-muted)',
					fontSize: '0.78rem',
					fontWeight: 500,
					fontFamily: 'inherit',
					cursor: 'pointer',
					transition: 'border-color 0.2s ease, color 0.2s ease',
				}}
			>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
					<circle cx="11" cy="11" r="8" />
					<path d="m21 21-4.35-4.35" />
				</svg>
				<span className="cmd-trigger-label">Поиск</span>
				<kbd
					className="cmd-trigger-kbd"
					style={{
						fontSize: '0.66rem',
						fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
						padding: '0.08rem 0.35rem',
						borderRadius: '5px',
						border: '1px solid var(--border-light)',
						background: 'var(--bg-secondary)',
						color: 'var(--text-muted)',
					}}
				>
					⌘K
				</kbd>
			</button>

			{open && (
				<div
					role="dialog"
					aria-modal="true"
					aria-label="Поиск по блогу"
					onClick={(e) => {
						if (e.target === e.currentTarget) setOpen(false);
					}}
					style={{
						position: 'fixed',
						inset: 0,
						zIndex: 9000,
						background: 'rgba(8, 8, 22, 0.72)',
						backdropFilter: 'blur(8px)',
						WebkitBackdropFilter: 'blur(8px)',
						display: 'flex',
						alignItems: 'flex-start',
						justifyContent: 'center',
						padding: 'min(12vh, 96px) 1rem 1rem',
					}}
				>
					<div
						style={{
							width: '100%',
							maxWidth: '580px',
							background: 'var(--bg-card)',
							border: '1px solid var(--border-light)',
							borderRadius: '16px',
							boxShadow: 'var(--shadow-lg)',
							overflow: 'hidden',
						}}
					>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.65rem',
								padding: '0.85rem 1rem',
								borderBottom: '1px solid var(--border)',
							}}
						>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
								<circle cx="11" cy="11" r="8" />
								<path d="m21 21-4.35-4.35" />
							</svg>
							<input
								ref={inputRef}
								type="text"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								onKeyDown={onInputKeyDown}
								placeholder="Искать статьи по названию, теме или рубрике..."
								style={{
									flex: 1,
									border: 'none',
									background: 'transparent',
									color: 'var(--text)',
									fontSize: '0.96rem',
									outline: 'none',
									fontFamily: 'inherit',
								}}
							/>
							{query && (
								<button
									type="button"
									onClick={() => setQuery('')}
									aria-label="Очистить"
									style={{
										border: 'none',
										background: 'var(--bg-secondary)',
										color: 'var(--text-muted)',
										borderRadius: '6px',
										padding: '0.15rem 0.45rem',
										fontSize: '0.75rem',
										cursor: 'pointer',
									}}
								>
									✕
								</button>
							)}
							<button
								type="button"
								onClick={() => setOpen(false)}
								style={{
									border: '1px solid var(--border)',
									background: 'var(--bg-secondary)',
									color: 'var(--text-muted)',
									borderRadius: '6px',
									padding: '0.15rem 0.45rem',
									fontSize: '0.7rem',
									fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
									cursor: 'pointer',
								}}
							>
								ESC
							</button>
						</div>

						<div style={{ maxHeight: 'min(58vh, 420px)', overflowY: 'auto', padding: '0.45rem' }}>
							<div
								style={{
									fontSize: '0.68rem',
									fontWeight: 700,
									textTransform: 'uppercase',
									letterSpacing: '0.06em',
									color: 'var(--text-muted)',
									padding: '0.35rem 0.6rem',
								}}
							>
								{query.trim() ? `Найдено: ${results.length}` : 'Свежие статьи'}
							</div>

							{results.length > 0 ? (
								results.map((post, i) => {
									const active = i === activeIdx;
									const catColor = post.category ? CAT_VAR[post.category] : undefined;
									return (
										<a
											key={post.slug}
											href={`/blog/${post.slug}/`}
											onMouseEnter={() => setActiveIdx(i)}
											style={{
												display: 'block',
												padding: '0.65rem 0.75rem',
												borderRadius: '10px',
												textDecoration: 'none',
												background: active ? 'var(--bg-card-hover)' : 'transparent',
												border: `1px solid ${active ? 'var(--border-light)' : 'transparent'}`,
												transition: 'background 0.12s ease',
											}}
										>
											<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem' }}>
												<span style={{ fontSize: '0.9rem', fontWeight: 700, color: active ? 'var(--accent-light)' : 'var(--text)', lineHeight: 1.35 }}>
													{post.title}
												</span>
												{post.category && catColor && (
													<span
														style={{
															flexShrink: 0,
															fontSize: '0.65rem',
															fontWeight: 700,
															textTransform: 'uppercase',
															letterSpacing: '0.04em',
															padding: '0.12rem 0.5rem',
															borderRadius: '999px',
															color: catColor,
															border: `1px solid color-mix(in srgb, ${catColor} 45%, transparent)`,
															background: `color-mix(in srgb, ${catColor} 12%, transparent)`,
														}}
													>
														{post.category}
													</span>
												)}
											</div>
											<div
												style={{
													fontSize: '0.78rem',
													color: 'var(--text-muted)',
													marginTop: '0.2rem',
													display: '-webkit-box',
													WebkitLineClamp: 1,
													WebkitBoxOrient: 'vertical',
													overflow: 'hidden',
												}}
											>
												{post.description}
											</div>
										</a>
									);
								})
							) : (
								<div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
									Ничего не нашлось по запросу «{query}»
								</div>
							)}
						</div>

						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								padding: '0.5rem 0.9rem',
								borderTop: '1px solid var(--border)',
								background: 'var(--bg-secondary)',
								fontSize: '0.7rem',
								color: 'var(--text-muted)',
							}}
						>
							<span>↑↓ навигация · Enter открыть · Esc закрыть</span>
							<span>{posts.length} материалов</span>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
