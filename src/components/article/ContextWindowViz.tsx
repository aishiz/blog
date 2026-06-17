import { useState, useEffect } from 'react';

// Живая демка окна контекста: добавляй мусор, смотри переполнение, жми «Сжать».
const MAX = 200; // K токенов
const BASE = { label: 'Системный промпт + инструменты', tokens: 8, color: '#8b5cf6' };

interface Block {
	label: string;
	tokens: number;
	color: string;
}

const ADDABLE: Block[] = [
	{ label: 'Шаг диалога', tokens: 12, color: '#3b82f6' },
	{ label: 'Вывод команды', tokens: 35, color: '#f59e0b' },
	{ label: 'Большой файл', tokens: 60, color: '#ef4444' },
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

export default function ContextWindowViz() {
	const [blocks, setBlocks] = useState<Block[]>([]);
	const mobile = useIsMobile();

	const all = [BASE, ...blocks];
	const total = all.reduce((s, b) => s + b.tokens, 0);
	const pct = Math.min(100, (total / MAX) * 100);
	const overflow = total > MAX;

	const add = (b: Block) => setBlocks((prev) => [...prev, b]);
	const compact = () => {
		// Всё, кроме базы и последнего блока, сжимаем в одно саммари.
		setBlocks((prev) => {
			if (prev.length <= 1) return prev;
			const last = prev[prev.length - 1];
			return [{ label: 'Саммари прошлых шагов', tokens: 10, color: '#10b981' }, last];
		});
	};
	const reset = () => setBlocks([]);

	return (
		<div style={{ margin: '1.75em 0', padding: mobile ? '0.85rem' : '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
			<div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
				📜 Окно контекста — заполни и сожми
			</div>
			<div style={{ fontSize: mobile ? '0.78rem' : '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
				Добавляй данные в контекст и смотри, как он забивается. Переполнил — жми «Сжать», харнес свернёт историю в саммари.
			</div>

			{/* Track */}
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.3rem' }}>
				<span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)' }}>Заполнено</span>
				<span style={{ fontSize: '0.82rem', fontWeight: 800, color: overflow ? '#ef4444' : 'var(--accent-light)', fontVariantNumeric: 'tabular-nums' }}>
					{total}K / {MAX}K
				</span>
			</div>
			<div style={{ display: 'flex', height: '22px', borderRadius: '6px', overflow: 'hidden', border: `1px solid ${overflow ? '#ef4444' : 'var(--border)'}`, background: 'var(--bg-secondary)', marginBottom: '0.6rem' }}>
				{all.map((b, i) => (
					<div
						key={i}
						title={`${b.label}: ${b.tokens}K`}
						style={{ width: `${(b.tokens / MAX) * 100}%`, background: b.color, transition: 'width 0.4s ease', borderRight: '1px solid rgba(0,0,0,0.2)' }}
					/>
				))}
			</div>

			{overflow && (
				<div style={{ fontSize: mobile ? '0.78rem' : '0.84rem', color: '#ef4444', fontWeight: 700, marginBottom: '0.7rem', lineHeight: 1.5 }}>
					💥 Переполнение! Агент тупеет и забывает, с чего начал. Нужна компакция.
				</div>
			)}

			{/* Controls */}
			<div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '0.4rem', marginTop: '0.5rem' }}>
				{ADDABLE.map((b) => (
					<button
						key={b.label}
						onClick={() => add(b)}
						style={{
							padding: mobile ? '0.4rem 0.6rem' : '0.45rem 0.8rem',
							borderRadius: '7px',
							border: `1.5px solid ${b.color}`,
							background: `${b.color}14`,
							color: b.color,
							fontSize: mobile ? '0.72rem' : '0.8rem',
							fontWeight: 600,
							cursor: 'pointer',
							WebkitTapHighlightColor: 'transparent',
						}}
					>
						+ {b.label} ({b.tokens}K)
					</button>
				))}
				<button
					onClick={compact}
					style={{
						padding: mobile ? '0.4rem 0.8rem' : '0.45rem 1rem',
						borderRadius: '7px',
						border: 'none',
						background: 'linear-gradient(135deg, #10b981, #059669)',
						color: 'white',
						fontSize: mobile ? '0.72rem' : '0.8rem',
						fontWeight: 700,
						cursor: 'pointer',
						WebkitTapHighlightColor: 'transparent',
					}}
				>
					✂️ Сжать (компакция)
				</button>
				<button
					onClick={reset}
					style={{
						padding: mobile ? '0.4rem 0.7rem' : '0.45rem 0.85rem',
						borderRadius: '7px',
						border: '1px solid var(--border)',
						background: 'transparent',
						color: 'var(--text-muted)',
						fontSize: mobile ? '0.72rem' : '0.8rem',
						fontWeight: 500,
						cursor: 'pointer',
						WebkitTapHighlightColor: 'transparent',
					}}
				>
					↻ Сброс
				</button>
			</div>

			<div style={{ marginTop: '0.85rem', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
				{pct < 50 ? 'Контекст просторный — модели легко думать.' : pct < 90 ? 'Окно забивается. Скоро пора сжимать.' : overflow ? 'Окно лопнуло. Вот тут агенты и тупеют.' : 'На грани. Один большой файл — и привет.'}
			</div>
		</div>
	);
}
