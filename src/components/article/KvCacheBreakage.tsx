import { useState } from 'react';

type Mode = 'ar' | 'diffusion';

// Матрица внимания 6×6: строки = запрос (query), столбцы = ключ (key).
// AR: каузальная маска (нижнетреугольная) — токен видит только прошлое.
// Diffusion: полная (двунаправленная) — каждый токен видит всю последовательность.
const N = 6;

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
	tabs: {
		display: 'flex',
		gap: '0.4rem',
		marginBottom: '1.25rem',
	} as React.CSSProperties,
	tab: (active: boolean, color: string) => ({
		padding: '0.45rem 0.95rem',
		borderRadius: '100px',
		border: `1px solid ${active ? color : 'var(--border)'}`,
		background: active ? `${color}18` : 'var(--bg-secondary)',
		color: active ? color : 'var(--text-muted)',
		fontSize: '0.82rem',
		fontWeight: 700,
		cursor: 'pointer',
		fontFamily: 'inherit',
	} as React.CSSProperties),
	gridWrap: {
		display: 'flex',
		gap: '1.25rem',
		flexWrap: 'wrap' as const,
		alignItems: 'flex-start',
	} as React.CSSProperties,
	grid: (n: number) => ({
		display: 'grid',
		gridTemplateColumns: `repeat(${n}, 1.6rem)`,
		gap: '3px',
	} as React.CSSProperties),
	cell: (active: boolean, color: string) => ({
		width: '1.6rem',
		height: '1.6rem',
		borderRadius: '4px',
		background: active ? color : 'var(--bg-secondary)',
		border: `1px solid ${active ? color : 'var(--border)'}`,
		opacity: active ? 0.9 : 0.35,
	} as React.CSSProperties),
	side: {
		flex: 1,
		minWidth: '220px',
		fontSize: '0.86rem',
		color: 'var(--text-secondary)',
		lineHeight: 1.6,
	} as React.CSSProperties,
	verdict: (color: string) => ({
		marginTop: '0.75rem',
		padding: '0.7rem 0.9rem',
		borderRadius: '8px',
		background: `${color}10`,
		border: `1px solid ${color}`,
		fontSize: '0.84rem',
		color: 'var(--text-secondary)',
		lineHeight: 1.55,
	} as React.CSSProperties),
	axisNote: {
		fontSize: '0.72rem',
		color: 'var(--text-muted)',
		marginTop: '0.4rem',
	} as React.CSSProperties,
};

export default function KvCacheBreakage() {
	const [mode, setMode] = useState<Mode>('ar');
	const color = mode === 'ar' ? '#3b82f6' : '#8b5cf6';

	// active[row][col]: виден ли ключ col запросу row.
	const isActive = (row: number, col: number) => (mode === 'ar' ? col <= row : true);

	return (
		<div style={css.wrap}>
			<div style={css.title}>🧱 Почему diffusion ломает KV-кэш</div>
			<div style={css.desc}>Матрица внимания: строка — токен-запрос, столбец — токен-ключ. Закрашено = запрос видит ключ. Переключи режим.</div>

			<div style={css.tabs}>
				<button style={css.tab(mode === 'ar', '#3b82f6')} onClick={() => setMode('ar')}>Авторегрессия</button>
				<button style={css.tab(mode === 'diffusion', '#8b5cf6')} onClick={() => setMode('diffusion')}>Diffusion</button>
			</div>

			<div style={css.gridWrap}>
				<div>
					<div style={css.grid(N)}>
						{Array.from({ length: N }).map((_, row) =>
							Array.from({ length: N }).map((__, col) => (
								<div key={`${row}-${col}`} style={css.cell(isActive(row, col), color)} />
							))
						)}
					</div>
					<div style={css.axisNote}>↓ запрос · → ключ</div>
				</div>

				<div style={css.side}>
					{mode === 'ar' ? (
						<>
							Каузальная маска: токен видит только прошлое (нижний треугольник). K и V прошлых токенов уже посчитаны и <strong>заморожены</strong> — их кладут в KV-кэш и переиспользуют на каждом следующем шаге, не пересчитывая.
							<div style={css.verdict('#3b82f6')}>Кэш работает: прошлое неизменно, дописываем по одному столбцу.</div>
						</>
					) : (
						<>
							Двунаправленное внимание: каждый токен видит всю последовательность (полный квадрат, без маски). И сами токены <strong>меняются между шагами denoising</strong> — то, что было замаскировано, раскрывается и переписывает представления соседей.
							<div style={css.verdict('#8b5cf6')}>Кэшировать нечего: «прошлого» в привычном смысле нет, K/V пересчитываются. Нужны отдельные приближения (block-wise cache в Fast-dLLM, arXiv:2505.22618).</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
