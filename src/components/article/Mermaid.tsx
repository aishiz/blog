import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// Рендер в стиле GitHub: встроенные темы mermaid (default / dark), SVG вписан в ширину
// контейнера, а в углу — гитхабовские контролы: зум, сброс, панорамирование драгом.

let counter = 0;

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;

function isLight(): boolean {
	return typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light';
}

const btnStyle: React.CSSProperties = {
	width: '2rem',
	height: '2rem',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: '6px',
	border: '1px solid var(--border)',
	background: 'var(--bg-secondary)',
	color: 'var(--text)',
	fontSize: '0.95rem',
	cursor: 'pointer',
	fontFamily: 'inherit',
	lineHeight: 1,
	padding: 0,
};

export default function Mermaid({ chart, caption }: { chart: string; caption?: string }) {
	const [svg, setSvg] = useState('');
	const [scale, setScale] = useState(1);
	const [pos, setPos] = useState({ x: 0, y: 0 });
	const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

	useEffect(() => {
		let cancelled = false;

		const draw = async () => {
			mermaid.initialize({
				startOnLoad: false,
				theme: isLight() ? 'default' : 'dark',
				securityLevel: 'loose',
				fontFamily: '-apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
			});
			try {
				const { svg } = await mermaid.render(`mmd-${counter++}`, chart);
				if (!cancelled) setSvg(svg);
			} catch {
				if (!cancelled) setSvg(`<pre style="color:var(--text-muted);font-size:0.8rem;white-space:pre-wrap">${chart}</pre>`);
			}
		};

		draw();
		const obs = new MutationObserver((muts) => {
			if (muts.some((m) => m.attributeName === 'data-theme')) draw();
		});
		obs.observe(document.documentElement, { attributes: true });
		return () => { cancelled = true; obs.disconnect(); };
	}, [chart]);

	const zoom = (dir: 1 | -1) =>
		setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s * (dir > 0 ? 1.25 : 0.8))));

	const reset = () => { setScale(1); setPos({ x: 0, y: 0 }); };

	const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
		(e.target as HTMLElement).setPointerCapture?.(e.pointerId);
	};
	const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!drag.current) return;
		setPos({ x: drag.current.ox + e.clientX - drag.current.sx, y: drag.current.oy + e.clientY - drag.current.sy });
	};
	const onPointerUp = () => { drag.current = null; };

	const moved = scale !== 1 || pos.x !== 0 || pos.y !== 0;

	return (
		<figure
			style={{
				margin: '1.75em 0',
				padding: '1.25rem 1rem',
				borderRadius: '12px',
				border: '1px solid var(--border)',
				background: 'var(--bg-card)',
				position: 'relative',
			}}
		>
			<div
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
				onPointerCancel={onPointerUp}
				style={{
					overflow: 'hidden',
					textAlign: 'center',
					cursor: drag.current ? 'grabbing' : 'grab',
					touchAction: 'pan-y',
				}}
			>
				<div
					style={{
						transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
						transformOrigin: 'center center',
						transition: drag.current ? 'none' : 'transform 0.15s ease',
					}}
					dangerouslySetInnerHTML={{ __html: svg }}
				/>
			</div>

			{svg && (
				<div
					style={{
						position: 'absolute',
						right: '0.6rem',
						bottom: caption ? '3.2rem' : '0.6rem',
						display: 'flex',
						flexDirection: 'column',
						gap: '0.3rem',
						opacity: 0.85,
					}}
				>
					<button style={btnStyle} onClick={() => zoom(1)} aria-label="Приблизить" title="Приблизить">＋</button>
					<button style={btnStyle} onClick={() => zoom(-1)} aria-label="Отдалить" title="Отдалить">－</button>
					{moved && (
						<button style={btnStyle} onClick={reset} aria-label="Сбросить вид" title="Сбросить вид">⟲</button>
					)}
				</div>
			)}

			{caption && (
				<figcaption style={{ marginTop: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
					{caption}
				</figcaption>
			)}
		</figure>
	);
}
