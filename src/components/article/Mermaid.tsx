import { useEffect, useState } from 'react';
import mermaid from 'mermaid';

// Клиентский рендер mermaid-диаграмм. Тема следует за data-theme блога (dark/light),
// перерисовывается при переключении темы. Контейнер скроллится по X — широкие схемы
// не ломают вёрстку на мобиле.

let counter = 0;

function currentTheme(): 'dark' | 'default' {
	if (typeof document === 'undefined') return 'dark';
	return document.documentElement.getAttribute('data-theme') === 'light' ? 'default' : 'dark';
}

export default function Mermaid({ chart, caption }: { chart: string; caption?: string }) {
	const [svg, setSvg] = useState('');

	useEffect(() => {
		let cancelled = false;

		const draw = async () => {
			const theme = currentTheme();
			mermaid.initialize({
				startOnLoad: false,
				theme,
				securityLevel: 'loose',
				fontFamily: 'Inter, system-ui, sans-serif',
				themeVariables: { fontSize: '14px' },
			});
			try {
				const { svg } = await mermaid.render(`mmd-${counter++}`, chart);
				if (!cancelled) setSvg(svg);
			} catch {
				if (!cancelled) setSvg(`<pre style="color:var(--text-muted);font-size:0.8rem">${chart}</pre>`);
			}
		};

		draw();

		// перерисовка при смене темы
		const obs = new MutationObserver((muts) => {
			if (muts.some((m) => m.attributeName === 'data-theme')) draw();
		});
		obs.observe(document.documentElement, { attributes: true });

		return () => { cancelled = true; obs.disconnect(); };
	}, [chart]);

	return (
		<figure
			style={{
				margin: '1.75em 0',
				padding: '1.25rem',
				borderRadius: '12px',
				border: '1px solid var(--border)',
				background: 'var(--bg-card)',
				overflowX: 'auto',
				textAlign: 'center',
			}}
		>
			<div style={{ display: 'inline-block', minWidth: 0 }} dangerouslySetInnerHTML={{ __html: svg }} />
			{caption && (
				<figcaption style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
					{caption}
				</figcaption>
			)}
		</figure>
	);
}
