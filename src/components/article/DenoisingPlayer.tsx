import { useEffect, useState } from 'react';

// Иллюстративная демка механики, не воспроизведение конкретной модели: 8 «токенов»,
// раскрываемых за проходы модели (forward passes). Diffusion раскрывает по 2 токена за
// проход в неслева-направо порядке (confidence-ordered), укладываясь в 4 прохода;
// авторегрессия — строго по одному токену слева направо, 8 проходов. Суть: параллельная
// выдача токенов у diffusion против одного-за-проход у AR.
const TOKENS = ['диффузия', 'раскрывает', 'сразу', 'много', 'токенов', 'за', 'четыре', 'прохода'];

// schedule[p] — индексы токенов, раскрываемые на p-м проходе diffusion (p от 1). Порядок
// намеренно не слева-направо, чтобы показать: позиция раскрытия не привязана к позиции в тексте.
const DIFFUSION_SCHEDULE: number[][] = [
	[0, 4], // проход 1
	[1, 6], // проход 2
	[3, 7], // проход 3
	[2, 5], // проход 4
];
const DIFFUSION_PASSES = DIFFUSION_SCHEDULE.length; // 4
const AR_PASSES = TOKENS.length; // 8
const MAX_PASS = AR_PASSES; // общий счётчик проходов идёт до 8

// Множество индексов, раскрытых diffusion к проходу p (объединение расписания за 1..p).
function diffusionRevealed(pass: number): Set<number> {
	const s = new Set<number>();
	for (let p = 0; p < Math.min(pass, DIFFUSION_PASSES); p++) {
		for (const idx of DIFFUSION_SCHEDULE[p]) s.add(idx);
	}
	return s;
}

// AR раскрывает индекс i на проходе i+1: к проходу p раскрыты индексы 0..p-1.
function arRevealed(pass: number): Set<number> {
	const s = new Set<number>();
	for (let i = 0; i < Math.min(pass, AR_PASSES); i++) s.add(i);
	return s;
}

const css = {
	wrap: {
		margin: '1.75em 0',
		padding: '1.5rem',
		borderRadius: '12px',
		border: '1px solid var(--border)',
		background: 'var(--bg-card)',
	} as React.CSSProperties,
	title: {
		fontSize: '0.85rem',
		fontWeight: 700,
		color: 'var(--accent-light)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.04em',
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	desc: {
		fontSize: '0.88rem',
		color: 'var(--text-muted)',
		marginBottom: '1.1rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	lane: {
		marginBottom: '1.1rem',
	} as React.CSSProperties,
	laneHead: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'baseline',
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	laneLabel: (color: string) => ({
		fontSize: '0.82rem',
		fontWeight: 800,
		color,
	} as React.CSSProperties),
	lanePasses: {
		fontSize: '0.78rem',
		color: 'var(--text-muted)',
		fontVariantNumeric: 'tabular-nums' as const,
	} as React.CSSProperties,
	slots: {
		display: 'flex',
		flexWrap: 'wrap' as const,
		gap: '0.4rem',
	} as React.CSSProperties,
	slot: (revealed: boolean, color: string) => ({
		padding: '0.4rem 0.6rem',
		borderRadius: '6px',
		fontSize: '0.82rem',
		fontWeight: 600,
		fontFamily: revealed ? 'inherit' : 'monospace',
		border: `1px solid ${revealed ? color : 'var(--border)'}`,
		background: revealed ? `${color}18` : 'var(--bg-secondary)',
		color: revealed ? 'var(--text)' : 'var(--text-muted)',
		transition: 'all 0.2s ease',
		minWidth: '2ch',
		textAlign: 'center' as const,
	} as React.CSSProperties),
	ctrlRow: {
		display: 'flex',
		gap: '0.5rem',
		marginTop: '0.5rem',
	} as React.CSSProperties,
	ctrlBtn: {
		padding: '0.45rem 1rem',
		borderRadius: '100px',
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
		color: 'var(--text)',
		fontSize: '0.82rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
	} as React.CSSProperties,
	note: {
		marginTop: '0.9rem',
		fontSize: '0.8rem',
		color: 'var(--text-muted)',
		lineHeight: 1.6,
	} as React.CSSProperties,
};

export default function DenoisingPlayer() {
	const [pass, setPass] = useState(0);
	const [playing, setPlaying] = useState(false);

	useEffect(() => {
		if (!playing) return;
		if (pass >= MAX_PASS) { setPlaying(false); return; }
		const t = setTimeout(() => setPass((p) => p + 1), 900);
		return () => clearTimeout(t);
	}, [playing, pass]);

	const diff = diffusionRevealed(pass);
	const ar = arRevealed(pass);
	const isLast = pass >= MAX_PASS;
	const diffUsed = Math.min(pass, DIFFUSION_PASSES);
	const arUsed = Math.min(pass, AR_PASSES);

	return (
		<div style={css.wrap}>
			<div style={css.title}>🌫️ Denoising vs авторегрессия по проходам</div>
			<div style={css.desc}>
				Один «проход» — один forward модели. Diffusion раскрывает несколько токенов за проход (и не слева направо), авторегрессия — строго по одному слева направо. Жми «шаг» или «играть».
			</div>

			<div style={css.lane}>
				<div style={css.laneHead}>
					<span style={css.laneLabel('#8b5cf6')}>Diffusion (параллельно)</span>
					<span style={css.lanePasses}>проходов: {diffUsed} / {DIFFUSION_PASSES}</span>
				</div>
				<div style={css.slots}>
					{TOKENS.map((tok, i) => (
						<span key={i} style={css.slot(diff.has(i), '#8b5cf6')}>{diff.has(i) ? tok : '▓▓'}</span>
					))}
				</div>
			</div>

			<div style={css.lane}>
				<div style={css.laneHead}>
					<span style={css.laneLabel('#3b82f6')}>Авторегрессия (по одному)</span>
					<span style={css.lanePasses}>проходов: {arUsed} / {AR_PASSES}</span>
				</div>
				<div style={css.slots}>
					{TOKENS.map((tok, i) => (
						<span key={i} style={css.slot(ar.has(i), '#3b82f6')}>{ar.has(i) ? tok : '▓▓'}</span>
					))}
				</div>
			</div>

			<div style={css.ctrlRow}>
				<button style={css.ctrlBtn} onClick={() => { setPlaying(false); setPass((p) => Math.max(0, p - 1)); }} disabled={pass === 0}>← Назад</button>
				<button
					style={css.ctrlBtn}
					onClick={() => {
						if (playing) { setPlaying(false); return; }
						if (isLast) { setPass(0); setPlaying(true); return; }
						setPlaying(true);
					}}
				>
					{playing ? '⏸ Пауза' : isLast ? '↺ Сначала' : '▶ Играть'}
				</button>
				<button style={css.ctrlBtn} onClick={() => { setPlaying(false); setPass((p) => Math.min(MAX_PASS, p + 1)); }} disabled={isLast}>Шаг →</button>
			</div>

			<div style={css.note}>
				К 4-му проходу diffusion уже собрал всю фразу, авторегрессии нужно 8. Именно параллельная выдача токенов за проход даёт diffusion-моделям throughput — ценой того, что каждый проход тяжелее (нужно двунаправленное внимание по всей длине). Схема расписания здесь иллюстративная, у реальных моделей раскрытие идёт по уверенности предсказаний.
			</div>
		</div>
	);
}
