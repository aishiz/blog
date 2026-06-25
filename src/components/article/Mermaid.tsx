import { useEffect, useState } from 'react';
import mermaid from 'mermaid';

// Клиентский рендер mermaid. Тема base + явная высококонтрастная палитра блога,
// чтобы узлы были чётко видны и в тёмной, и в светлой теме. Перерисовка при смене темы.

let counter = 0;

// p.node — заливка узла (заметно отличается от фона карточки), p.border — рамка (акцент),
// p.text — текст узлов, p.line — стрелки/линии.
const PALETTES = {
	dark: { bg: '#141435', node: '#2e2e74', node2: '#20204e', border: '#ff8f4d', text: '#ffffff', line: '#b3a8d4', note: '#3a2718', noteText: '#ffcaa0', edge: '#101030' },
	light: { bg: '#ffffff', node: '#ece7fb', node2: '#f4f1fc', border: '#e85d1a', text: '#1a1a2e', line: '#6b6688', note: '#fdeadd', noteText: '#b8480f', edge: '#ffffff' },
};

// Mermaid по умолчанию вписывает SVG в ширину контейнера, ужимая шрифт до нечитаемого.
// Форсим нативный размер (по viewBox) + снимаем max-width — текст крупный, широкие схемы скроллятся.
function nativeSize(svg: string): string {
	const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
	if (!vb) return svg.replace(/max-width:\s*[\d.]+px/g, 'max-width:none');
	const w = Math.ceil(parseFloat(vb[1]));
	let out = svg.replace(/max-width:\s*[\d.]+px/g, 'max-width:none');
	if (/<svg[^>]*\swidth="/.test(out)) out = out.replace(/(<svg[^>]*\swidth=")[^"]*(")/, `$1${w}$2`);
	else out = out.replace(/<svg /, `<svg width="${w}" `);
	return out;
}

function themeVars(p: typeof PALETTES.dark) {
	return {
		fontSize: '17px',
		background: p.bg,
		primaryColor: p.node,
		primaryTextColor: p.text,
		primaryBorderColor: p.border,
		secondaryColor: p.node2,
		tertiaryColor: p.node2,
		lineColor: p.line,
		mainBkg: p.node,
		nodeBorder: p.border,
		nodeTextColor: p.text,
		textColor: p.text,
		titleColor: p.text,
		edgeLabelBackground: p.edge,
		clusterBkg: p.node2,
		clusterBorder: p.border,
		// sequence diagram
		actorBkg: p.node,
		actorBorder: p.border,
		actorTextColor: p.text,
		actorLineColor: p.line,
		signalColor: p.text,
		signalTextColor: p.text,
		labelBoxBkgColor: p.node,
		labelBoxBorderColor: p.border,
		labelTextColor: p.text,
		loopTextColor: p.text,
		noteBkgColor: p.note,
		noteTextColor: p.noteText,
		noteBorderColor: p.border,
		activationBkgColor: p.node2,
		activationBorderColor: p.border,
		sequenceNumberColor: p.bg,
	};
}

function isLight(): boolean {
	return typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light';
}

export default function Mermaid({ chart, caption }: { chart: string; caption?: string }) {
	const [svg, setSvg] = useState('');

	useEffect(() => {
		let cancelled = false;

		const draw = async () => {
			const p = isLight() ? PALETTES.light : PALETTES.dark;
			mermaid.initialize({
				startOnLoad: false,
				theme: 'base',
				securityLevel: 'loose',
				fontFamily: 'Inter, system-ui, sans-serif',
				themeVariables: themeVars(p),
				flowchart: { curve: 'basis', padding: 14, nodeSpacing: 45, rankSpacing: 50 },
			});
			try {
				const { svg } = await mermaid.render(`mmd-${counter++}`, chart);
				if (!cancelled) setSvg(nativeSize(svg));
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

	return (
		<figure
			style={{
				margin: '1.75em 0',
				padding: '1.25rem 1rem',
				borderRadius: '12px',
				border: '1px solid var(--border)',
				background: 'var(--bg-card)',
				overflowX: 'auto',
				textAlign: 'center',
			}}
		>
			<div
				style={{ minWidth: 'min-content' }}
				dangerouslySetInnerHTML={{ __html: svg }}
			/>
			{caption && (
				<figcaption style={{ marginTop: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
					{caption}
				</figcaption>
			)}
		</figure>
	);
}
