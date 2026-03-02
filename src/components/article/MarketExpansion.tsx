import { useState, useEffect } from 'react';

type Segment = {
	label: string;
	population: string;
	rawValue: number;
	color: string;
	icon: string;
	examples: string[];
	barrier: string;
	barrierNew: string;
};

const segments: Segment[] = [
	{
		label: 'Профессиональные разработчики',
		population: '~30 млн',
		rawValue: 30,
		color: '#3b82f6',
		icon: '💻',
		examples: ['Backend-инженеры', 'DevOps', 'ML-инженеры', 'Архитекторы'],
		barrier: 'Уже умеют',
		barrierNew: 'Строят SKILL-ы и платформы',
	},
	{
		label: 'Технически грамотные',
		population: '~200 млн',
		rawValue: 200,
		color: '#8b5cf6',
		icon: '🔧',
		examples: ['Сисадмины', 'Аналитики', 'Data-инженеры', 'QA'],
		barrier: 'Знают основы, но не код',
		barrierNew: 'Vibe Coding → полноценные продукты',
	},
	{
		label: 'Бизнес-профессионалы',
		population: '~800 млн',
		rawValue: 800,
		color: '#f59e0b',
		icon: '📊',
		examples: ['Менеджеры', 'Маркетологи', 'Финансисты', 'HR'],
		barrier: 'Нет технических навыков',
		barrierNew: 'Описывают боль → получают MVP',
	},
	{
		label: 'Доменные эксперты',
		population: '~1.5 млрд',
		rawValue: 1500,
		color: '#10b981',
		icon: '🏥',
		examples: ['Учителя', 'Врачи', 'Юристы', 'Фермеры'],
		barrier: 'Даже не думали о создании ПО',
		barrierNew: 'Впервые могут создать свой инструмент',
	},
	{
		label: 'Все остальные с идеей',
		population: '~2+ млрд',
		rawValue: 2000,
		color: '#ec4899',
		icon: '💡',
		examples: ['Предприниматели', 'Студенты', 'Хобби-создатели', 'Активисты'],
		barrier: 'Идея есть, навыков нет',
		barrierNew: 'Идея → работающий продукт за часы',
	},
];

const totalOld = 30;
const totalNew = 30 + 200 + 800 + 1500 + 2000;

function useIsMobile(breakpoint = 480) {
	const [m, setM] = useState(false);
	useEffect(() => {
		const check = () => setM(window.innerWidth <= breakpoint);
		check();
		window.addEventListener('resize', check, { passive: true });
		return () => window.removeEventListener('resize', check);
	}, [breakpoint]);
	return m;
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
		marginBottom: '1.25rem',
		lineHeight: 1.6,
	} as React.CSSProperties,
	toggleRow: {
		display: 'flex',
		gap: '0.5rem',
		marginBottom: '1.25rem',
	} as React.CSSProperties,
	toggleBtn: (active: boolean) => ({
		padding: '0.5rem 1.1rem',
		borderRadius: '100px',
		border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
		background: active ? 'var(--accent-glow)' : 'var(--bg-secondary)',
		color: active ? 'var(--accent-light)' : 'var(--text-muted)',
		fontSize: '0.82rem',
		fontWeight: 700,
		cursor: 'pointer',
		fontFamily: 'inherit',
		transition: 'all 0.2s ease',
	} as React.CSSProperties),
	barSection: {
		marginBottom: '1.25rem',
	} as React.CSSProperties,
	barRow: {
		marginBottom: '0.75rem',
	} as React.CSSProperties,
	barHeader: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: '0.3rem',
	} as React.CSSProperties,
	barLabel: {
		fontSize: '0.82rem',
		fontWeight: 600,
		color: 'var(--text)',
		display: 'flex',
		alignItems: 'center',
		gap: '0.4rem',
	} as React.CSSProperties,
	barPop: {
		fontSize: '0.78rem',
		fontWeight: 800,
		fontFamily: "'JetBrains Mono', monospace",
	} as React.CSSProperties,
	barTrack: {
		height: '32px',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		overflow: 'hidden',
		position: 'relative' as const,
		cursor: 'pointer',
	} as React.CSSProperties,
	barFill: (pct: number, color: string, enabled: boolean) => ({
		height: '100%',
		width: enabled ? `${Math.max(pct, 1)}%` : '0%',
		background: `linear-gradient(90deg, ${color}, ${color}cc)`,
		borderRadius: '8px',
		transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'flex-end',
		paddingRight: pct > 8 ? '10px' : '0',
	} as React.CSSProperties),
	barValInside: {
		fontSize: '0.72rem',
		fontWeight: 800,
		color: 'white',
		fontFamily: "'JetBrains Mono', monospace",
	} as React.CSSProperties,
	detailBox: {
		padding: '1rem 1.25rem',
		borderRadius: '10px',
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
		marginTop: '1.25rem',
	} as React.CSSProperties,
	detailTitle: (color: string) => ({
		fontSize: '1rem',
		fontWeight: 800,
		color: color,
		marginBottom: '0.5rem',
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
	} as React.CSSProperties),
	detailGrid: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: '0.75rem',
		marginTop: '0.75rem',
	} as React.CSSProperties,
	detailCard: {
		padding: '0.6rem 0.85rem',
		borderRadius: '8px',
		border: '1px solid var(--border)',
		background: 'var(--bg-card)',
	} as React.CSSProperties,
	detailCardLabel: {
		fontSize: '0.65rem',
		fontWeight: 700,
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.06em',
		marginBottom: '0.2rem',
	} as React.CSSProperties,
	detailCardVal: {
		fontSize: '0.82rem',
		color: 'var(--text)',
		lineHeight: 1.5,
	} as React.CSSProperties,
	megaStat: {
		display: 'flex',
		gap: '2rem',
		marginTop: '1.25rem',
		padding: '1rem 1.25rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		flexWrap: 'wrap' as const,
	} as React.CSSProperties,
	megaStatItem: {
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '0.1rem',
	} as React.CSSProperties,
	megaStatVal: (color: string) => ({
		fontSize: '1.6rem',
		fontWeight: 900,
		color: color,
	} as React.CSSProperties),
	megaStatLabel: {
		fontSize: '0.68rem',
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.06em',
		fontWeight: 600,
	} as React.CSSProperties,
};

export default function MarketExpansion() {
	const [mode, setMode] = useState<'old' | 'new'>('new');
	const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
	const mobile = useIsMobile();

	const maxVal = Math.max(...segments.map(s => s.rawValue));
	const hovered = hoveredIdx !== null ? segments[hoveredIdx] : null;

	return (
		<div style={{ ...css.wrap, ...(mobile ? { padding: '0.85rem', margin: '1.25em -0.25rem', borderRadius: '10px' } : {}) }}>
			<div style={css.title}>📈 Расширение рынка создателей</div>
			<div style={{ ...css.desc, ...(mobile ? { fontSize: '0.82rem', marginBottom: '1rem' } : {}) }}>
				{mobile ? 'Переключайтесь между мирами. Нажмите на сегмент.' : 'Переключайтесь между мирами. Нажмите на сегмент, чтобы увидеть детали.'}
			</div>

			<div style={{ ...css.toggleRow, ...(mobile ? { gap: '0.35rem', marginBottom: '1rem' } : {}) }}>
				<button style={{
					...css.toggleBtn(mode === 'old'),
					...(mobile ? { flex: 1, textAlign: 'center' as const, fontSize: '0.78rem', padding: '0.45rem 0.5rem' } : {}),
				}} onClick={() => { setMode('old'); setHoveredIdx(null); }}>
					🏗️ Старый мир
				</button>
				<button style={{
					...css.toggleBtn(mode === 'new'),
					...(mobile ? { flex: 1, textAlign: 'center' as const, fontSize: '0.78rem', padding: '0.45rem 0.5rem' } : {}),
				}} onClick={() => { setMode('new'); setHoveredIdx(null); }}>
					🚀 Вайбклаудинг
				</button>
			</div>

			<div style={css.barSection}>
				{segments.map((seg, i) => {
					const enabled = mode === 'new' || i === 0;
					const pct = (seg.rawValue / maxVal) * 100;
					return (
						<div key={i} style={{ ...css.barRow, ...(mobile ? { marginBottom: '0.55rem' } : {}) }}>
							<div style={css.barHeader}>
								<span style={{ ...css.barLabel, opacity: enabled ? 1 : 0.35, transition: 'opacity 0.5s ease' }}>
									<span>{seg.icon}</span>
									<span style={mobile ? { fontSize: '0.7rem', lineHeight: 1.3 } : {}}>{seg.label}</span>
								</span>
								<span style={{
									...css.barPop,
									color: enabled ? seg.color : 'var(--text-muted)',
									opacity: enabled ? 1 : 0.35,
									transition: 'all 0.5s ease',
									...(mobile ? { fontSize: '0.7rem', flexShrink: 0 } : {}),
								}}>
									{seg.population}
								</span>
							</div>
							<div
								style={{ ...css.barTrack, ...(mobile ? { height: '26px', borderRadius: '6px' } : {}) }}
								onClick={() => setHoveredIdx(hoveredIdx === i ? null : i)}
								onMouseEnter={() => { if (!mobile) setHoveredIdx(i); }}
								onMouseLeave={() => { if (!mobile) setHoveredIdx(null); }}
							>
								<div style={css.barFill(pct, seg.color, enabled)}>
									{enabled && pct > 12 && (
										<span style={{ ...css.barValInside, ...(mobile ? { fontSize: '0.62rem' } : {}) }}>{seg.population}</span>
									)}
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{hovered && (
				<div style={{ ...css.detailBox, ...(mobile ? { padding: '0.75rem 0.85rem', marginTop: '1rem' } : {}) }}>
					<div style={{
						...css.detailTitle(hovered.color),
						...(mobile ? { fontSize: '0.88rem', gap: '0.35rem' } : {}),
					}}>
						<span>{hovered.icon}</span> {hovered.label}
					</div>
					<div style={{
						...css.detailGrid,
						gridTemplateColumns: '1fr',
						...(mobile ? { gap: '0.5rem' } : {}),
					}}>
						<div style={{ ...css.detailCard, ...(mobile ? { padding: '0.5rem 0.7rem' } : {}) }}>
							<div style={css.detailCardLabel}>Примеры</div>
							<div style={{ ...css.detailCardVal, ...(mobile ? { fontSize: '0.78rem' } : {}) }}>{hovered.examples.join(', ')}</div>
						</div>
						<div style={{ ...css.detailCard, ...(mobile ? { padding: '0.5rem 0.7rem' } : {}) }}>
							<div style={css.detailCardLabel}>Барьер раньше</div>
							<div style={{ ...css.detailCardVal, ...(mobile ? { fontSize: '0.78rem' } : {}) }}>{hovered.barrier}</div>
						</div>
						<div style={{ ...css.detailCard, ...(mobile ? { padding: '0.5rem 0.7rem' } : {}) }}>
							<div style={css.detailCardLabel}>С Вайбклаудингом</div>
							<div style={{ ...css.detailCardVal, color: hovered.color, fontWeight: 700, ...(mobile ? { fontSize: '0.78rem' } : {}) }}>{hovered.barrierNew}</div>
						</div>
					</div>
				</div>
			)}

			<div style={{
				...css.megaStat,
				...(mobile ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', padding: '0.7rem 0.85rem' } : {}),
			}}>
				<div style={css.megaStatItem}>
					<span style={{ ...css.megaStatVal('#3b82f6'), ...(mobile ? { fontSize: '1.15rem' } : {}) }}>
						{mode === 'old' ? '30 млн' : '4.5+ млрд'}
					</span>
					<span style={{ ...css.megaStatLabel, ...(mobile ? { fontSize: '0.6rem' } : {}) }}>Создателей</span>
				</div>
				<div style={css.megaStatItem}>
					<span style={{ ...css.megaStatVal('#10b981'), ...(mobile ? { fontSize: '1.15rem' } : {}) }}>
						{mode === 'old' ? '1×' : '~150×'}
					</span>
					<span style={{ ...css.megaStatLabel, ...(mobile ? { fontSize: '0.6rem' } : {}) }}>Рост рынка</span>
				</div>
				<div style={css.megaStatItem}>
					<span style={{ ...css.megaStatVal('#f59e0b'), ...(mobile ? { fontSize: '1.15rem' } : {}) }}>
						{mode === 'old' ? '~1%' : '~80%'}
					</span>
					<span style={{ ...css.megaStatLabel, ...(mobile ? { fontSize: '0.6rem' } : {}) }}>Идея → MVP</span>
				</div>
				<div style={css.megaStatItem}>
					<span style={{ ...css.megaStatVal('#7c3aed'), ...(mobile ? { fontSize: '1.15rem' } : {}) }}>
						{mode === 'old' ? 'Месяцы' : 'Часы'}
					</span>
					<span style={{ ...css.megaStatLabel, ...(mobile ? { fontSize: '0.6rem' } : {}) }}>Время до MVP</span>
				</div>
			</div>
		</div>
	);
}
