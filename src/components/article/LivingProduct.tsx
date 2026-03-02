import { useState, useEffect, useCallback } from 'react';

type Module = {
	id: string;
	name: string;
	icon: string;
	color: string;
	description: string;
	userSaid: string;
	skill: string;
};

const coreModule: Module = {
	id: 'core',
	name: 'Ядро приложения',
	icon: '🏠',
	color: '#3b82f6',
	description: 'Базовое веб-приложение с логином и страницей заданий',
	userSaid: '«Мне нужен простой инструмент для публикации домашних заданий»',
	skill: 'web-app-scaffold',
};

const expansions: Module[] = [
	{
		id: 'grading',
		name: 'Система оценок',
		icon: '📝',
		color: '#10b981',
		description: 'Загрузка работ учениками + выставление оценок преподавателем',
		userSaid: '«Хочу, чтобы ученики загружали работы, а я ставил оценки»',
		skill: 'submission-grading-module',
	},
	{
		id: 'analytics',
		name: 'Аналитика прогресса',
		icon: '📊',
		color: '#f59e0b',
		description: 'Дашборды успеваемости, еженедельные отчёты, подсветка рисков',
		userSaid: '«Нужна аналитика, которая покажет прогресс учеников»',
		skill: 'student-performance-analytics',
	},
	{
		id: 'notifications',
		name: 'Уведомления',
		icon: '🔔',
		color: '#ec4899',
		description: 'Push-уведомления, email-рассылки, напоминания о дедлайнах',
		userSaid: '«Ученики забывают про дедлайны, нужны напоминания»',
		skill: 'notification-engine',
	},
	{
		id: 'ai-check',
		name: 'AI-проверка',
		icon: '🤖',
		color: '#7c3aed',
		description: 'Автоматическая проверка работ с помощью LLM, подсказки ученикам',
		userSaid: '«Я трачу 4 часа на проверку. Пусть AI проверяет черновики»',
		skill: 'ai-grading-assistant',
	},
	{
		id: 'parents',
		name: 'Портал родителей',
		icon: '👨‍👩‍👧',
		color: '#06b6d4',
		description: 'Отдельный вход для родителей, просмотр оценок и посещаемости',
		userSaid: '«Родители хотят видеть успеваемость детей»',
		skill: 'parent-portal-module',
	},
];

const SIZE = 300;
const CX = SIZE / 2;
const CY = SIZE / 2;
const CORE_R = 40;
const MODULE_R = 26;
const ORBIT_R = 115;

function getModulePos(i: number, total: number) {
	const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
	return {
		x: CX + Math.cos(angle) * ORBIT_R,
		y: CY + Math.sin(angle) * ORBIT_R,
		angle,
	};
}

function useIsMobile(breakpoint = 520) {
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
	layout: {
		display: 'flex',
		gap: '1.25rem',
		alignItems: 'flex-start',
	} as React.CSSProperties,
	sidebar: {
		flex: 1,
		minWidth: 0,
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '0.35rem',
	} as React.CSSProperties,
	addBtn: (mod: Module, added: boolean, isSelected: boolean) => ({
		display: 'flex',
		alignItems: 'center',
		gap: '0.6rem',
		width: '100%',
		padding: '0.55rem 0.85rem',
		borderRadius: '8px',
		border: `1.5px solid ${isSelected ? mod.color : added ? `${mod.color}55` : 'var(--border)'}`,
		background: isSelected ? `${mod.color}12` : added ? `${mod.color}06` : 'var(--bg-secondary)',
		cursor: 'pointer',
		fontFamily: 'inherit',
		fontSize: '0.82rem',
		fontWeight: 600,
		color: added ? mod.color : 'var(--text)',
		transition: 'all 0.25s ease',
		textAlign: 'left' as const,
	} as React.CSSProperties),
	addIcon: {
		fontSize: '1rem',
		flexShrink: 0,
		lineHeight: 1,
	} as React.CSSProperties,
	addCheck: (color: string) => ({
		marginLeft: 'auto',
		fontSize: '0.7rem',
		fontWeight: 700,
		color: color,
		flexShrink: 0,
	} as React.CSSProperties),
	detailPanel: (color: string) => ({
		marginTop: '1rem',
		padding: '1rem 1.15rem',
		borderRadius: '10px',
		border: `1px solid ${color}44`,
		background: `${color}06`,
	} as React.CSSProperties),
	detailQuote: {
		fontSize: '0.92rem',
		fontWeight: 700,
		color: 'var(--text)',
		fontStyle: 'italic' as const,
		marginBottom: '0.5rem',
		lineHeight: 1.5,
	} as React.CSSProperties,
	detailDesc: {
		fontSize: '0.82rem',
		color: 'var(--text-secondary)',
		lineHeight: 1.6,
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	skillTag: (color: string) => ({
		display: 'inline-flex',
		alignItems: 'center',
		gap: '0.3rem',
		padding: '0.2rem 0.6rem',
		borderRadius: '100px',
		fontSize: '0.68rem',
		fontWeight: 700,
		background: `${color}15`,
		color: color,
		border: `1px solid ${color}30`,
		fontFamily: "'JetBrains Mono', monospace",
	} as React.CSSProperties),
	stats: {
		display: 'flex',
		gap: '1.5rem',
		marginTop: '1.25rem',
		padding: '0.85rem 1.15rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		flexWrap: 'wrap' as const,
	} as React.CSSProperties,
	stat: {
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '0.1rem',
	} as React.CSSProperties,
	statVal: {
		fontSize: '1.3rem',
		fontWeight: 900,
		background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
		WebkitBackgroundClip: 'text',
		WebkitTextFillColor: 'transparent',
		backgroundClip: 'text',
	} as React.CSSProperties,
	statLabel: {
		fontSize: '0.65rem',
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.06em',
		fontWeight: 600,
	} as React.CSSProperties,
	resetBtn: {
		marginTop: '0.4rem',
		padding: '0.45rem 1rem',
		borderRadius: '8px',
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
		color: 'var(--text-muted)',
		fontSize: '0.78rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
		transition: 'all 0.2s ease',
		width: '100%',
	} as React.CSSProperties,
};

function OrbitSVG({
	addedIds,
	selectedId,
	onSelect,
}: {
	addedIds: Set<string>;
	selectedId: string | null;
	onSelect: (id: string) => void;
}) {
	return (
		<svg
			viewBox={`0 0 ${SIZE} ${SIZE}`}
			width={SIZE}
			height={SIZE}
			style={{ flexShrink: 0, display: 'block' }}
		>
			{/* orbit ring */}
			<circle
				cx={CX} cy={CY} r={ORBIT_R}
				fill="none"
				stroke="var(--border)"
				strokeWidth="1"
				strokeDasharray="4 4"
				opacity={0.5}
			/>

			{/* connectors */}
			{expansions.map((mod, i) => {
				const { x, y } = getModulePos(i, expansions.length);
				const visible = addedIds.has(mod.id);
				return (
					<line
						key={`line-${mod.id}`}
						x1={CX} y1={CY}
						x2={x} y2={y}
						stroke={visible ? mod.color : 'var(--border)'}
						strokeWidth={visible ? 2 : 1}
						opacity={visible ? 0.5 : 0.12}
						strokeDasharray={visible ? 'none' : '3 3'}
						style={{ transition: 'all 0.5s ease' }}
					/>
				);
			})}

			{/* module nodes */}
			{expansions.map((mod, i) => {
				const { x, y } = getModulePos(i, expansions.length);
				const visible = addedIds.has(mod.id);
				const active = selectedId === mod.id;
				return (
					<g
						key={mod.id}
						onClick={() => { if (visible) onSelect(mod.id); }}
						style={{ cursor: visible ? 'pointer' : 'default' }}
					>
						{active && (
							<circle
								cx={x} cy={y} r={MODULE_R + 5}
								fill="none"
								stroke={mod.color}
								strokeWidth="2"
								opacity={0.4}
								style={{ transition: 'all 0.3s ease' }}
							/>
						)}
						<circle
							cx={x} cy={y} r={MODULE_R}
							fill={visible ? `${mod.color}20` : 'var(--bg-secondary)'}
							stroke={visible ? mod.color : 'var(--border)'}
							strokeWidth={active ? 2.5 : 1.5}
							opacity={visible ? 1 : 0.25}
							style={{ transition: 'all 0.5s ease' }}
						/>
						<text
							x={x} y={y}
							textAnchor="middle"
							dominantBaseline="central"
							fontSize={visible ? 18 : 14}
							style={{ transition: 'all 0.3s ease', pointerEvents: 'none' }}
						>
							{visible ? mod.icon : '?'}
						</text>
						{visible && (
							<text
								x={x}
								y={y + MODULE_R + 12}
								textAnchor="middle"
								fontSize="8"
								fontWeight="700"
								fill={mod.color}
								style={{ pointerEvents: 'none' }}
							>
								{mod.name}
							</text>
						)}
					</g>
				);
			})}

			{/* core glow */}
			<defs>
				<radialGradient id="coreGlow">
					<stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
					<stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
				</radialGradient>
			</defs>
			<circle cx={CX} cy={CY} r={CORE_R + 12} fill="url(#coreGlow)" />

			{/* core node */}
			<circle
				cx={CX} cy={CY} r={CORE_R}
				fill="#3b82f6"
				stroke={selectedId === 'core' ? 'white' : '#3b82f6'}
				strokeWidth={selectedId === 'core' ? 3 : 0}
				onClick={() => onSelect('core')}
				style={{ cursor: 'pointer', filter: 'drop-shadow(0 2px 8px rgba(59,130,246,0.4))' }}
			/>
			<text
				x={CX} y={CY - 6}
				textAnchor="middle"
				dominantBaseline="central"
				fontSize="22"
				style={{ pointerEvents: 'none' }}
			>
				🏠
			</text>
			<text
				x={CX} y={CY + 14}
				textAnchor="middle"
				fontSize="9"
				fontWeight="800"
				fill="white"
				style={{ pointerEvents: 'none' }}
			>
				Ядро
			</text>
		</svg>
	);
}

export default function LivingProduct() {
	const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const mobile = useIsMobile();

	const addModule = useCallback((id: string) => {
		setAddedIds(prev => new Set(prev).add(id));
		setSelectedId(id);
	}, []);

	const reset = useCallback(() => {
		setAddedIds(new Set());
		setSelectedId(null);
	}, []);

	const selectedMod = selectedId
		? (selectedId === 'core' ? coreModule : expansions.find(e => e.id === selectedId) ?? null)
		: null;

	const version = `V${1 + addedIds.size}`;
	const moduleCount = 1 + addedIds.size;

	return (
		<div style={{ ...css.wrap, ...(mobile ? { padding: '0.85rem', margin: '1.25em -0.25rem', borderRadius: '10px' } : {}) }}>
			<div style={css.title}>🧬 Живой продукт — Симулятор эволюции</div>
			<div style={{ ...css.desc, ...(mobile ? { fontSize: '0.82rem', marginBottom: '1rem' } : {}) }}>
				{mobile
					? 'Нажимайте «+» чтобы расширить продукт.'
					: 'Нажимайте «+» в списке справа, чтобы расширить продукт. Модули появятся на орбите вокруг ядра.'
				}
			</div>

			<div style={{
				...css.layout,
				...(mobile ? { flexDirection: 'column' as const, gap: '0.5rem' } : {}),
			}}>
				{!mobile && (
					<OrbitSVG
						addedIds={addedIds}
						selectedId={selectedId}
						onSelect={setSelectedId}
					/>
				)}

				{mobile && (
					<div style={{
						display: 'flex',
						flexWrap: 'wrap' as const,
						gap: '0.35rem',
						justifyContent: 'center',
						padding: '0.5rem 0',
					}}>
						<div
							style={{
								width: '48px',
								height: '48px',
								borderRadius: '50%',
								background: '#3b82f6',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: '1.2rem',
								border: selectedId === 'core' ? '2px solid white' : '2px solid #3b82f6',
								boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
								cursor: 'pointer',
							}}
							onClick={() => setSelectedId('core')}
						>
							🏠
						</div>
						{expansions.map((mod) => {
							const added = addedIds.has(mod.id);
							return (
								<div
									key={mod.id}
									style={{
										width: '48px',
										height: '48px',
										borderRadius: '50%',
										background: added ? `${mod.color}20` : 'var(--bg-secondary)',
										border: `2px solid ${added ? mod.color : 'var(--border)'}`,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: added ? '1.2rem' : '0.9rem',
										opacity: added ? 1 : 0.4,
										cursor: added ? 'pointer' : 'default',
										transition: 'all 0.3s ease',
									}}
									onClick={() => { if (added) setSelectedId(mod.id); }}
								>
									{added ? mod.icon : '?'}
								</div>
							);
						})}
					</div>
				)}

				<div style={{ ...css.sidebar, ...(mobile ? { gap: '0.25rem' } : {}) }}>
					<button
						style={{
							...css.addBtn(coreModule, true, selectedId === 'core'),
							...(mobile ? { fontSize: '0.78rem', padding: '0.45rem 0.65rem', borderRadius: '7px' } : {}),
						}}
						onClick={() => setSelectedId('core')}
					>
						<span style={{ ...css.addIcon, ...(mobile ? { fontSize: '0.9rem' } : {}) }}>{coreModule.icon}</span>
						Ядро приложения
						<span style={{ ...css.addCheck(coreModule.color), ...(mobile ? { fontSize: '0.62rem' } : {}) }}>✅ V1</span>
					</button>

					{expansions.map((mod) => {
						const added = addedIds.has(mod.id);
						const isSelected = selectedId === mod.id;
						return (
							<button
								key={mod.id}
								style={{
									...css.addBtn(mod, added, isSelected),
									...(mobile ? { fontSize: '0.78rem', padding: '0.45rem 0.65rem', borderRadius: '7px' } : {}),
								}}
								onClick={() => {
									if (!added) addModule(mod.id);
									else setSelectedId(mod.id);
								}}
								onMouseEnter={(e) => {
									if (!added && !isSelected) e.currentTarget.style.borderColor = mod.color;
								}}
								onMouseLeave={(e) => {
									if (!added && !isSelected) e.currentTarget.style.borderColor = 'var(--border)';
								}}
							>
								<span style={{ ...css.addIcon, ...(mobile ? { fontSize: '0.9rem' } : {}) }}>{added ? mod.icon : '➕'}</span>
								{mod.name}
								{added && <span style={{ ...css.addCheck(mod.color), ...(mobile ? { fontSize: '0.62rem' } : {}) }}>✅</span>}
							</button>
						);
					})}

					{addedIds.size > 0 && (
						<button
							style={{ ...css.resetBtn, ...(mobile ? { fontSize: '0.72rem', padding: '0.35rem 0.75rem', marginTop: '0.25rem' } : {}) }}
							onClick={reset}
							onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
							onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
						>
							🔄 Сбросить
						</button>
					)}
				</div>
			</div>

			{selectedMod && (
				<div style={{
					...css.detailPanel(selectedMod.color),
					...(mobile ? { padding: '0.75rem 0.85rem', marginTop: '0.75rem' } : {}),
				}}>
					<div style={{ ...css.detailQuote, ...(mobile ? { fontSize: '0.82rem', lineHeight: 1.4 } : {}) }}>
						👤 {selectedMod.userSaid}
					</div>
					<div style={{ ...css.detailDesc, ...(mobile ? { fontSize: '0.75rem' } : {}) }}>
						🤖 Агент: {selectedMod.description}
					</div>
					<span style={{
						...css.skillTag(selectedMod.color),
						...(mobile ? { fontSize: '0.6rem' } : {}),
					}}>
						SKILL: {selectedMod.skill}
					</span>
				</div>
			)}

			<div style={{
				...css.stats,
				...(mobile ? { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', padding: '0.65rem 0.75rem', marginTop: '0.75rem' } : {}),
			}}>
				<div style={css.stat}>
					<span style={{ ...css.statVal, ...(mobile ? { fontSize: '1rem' } : {}) }}>{version}</span>
					<span style={{ ...css.statLabel, ...(mobile ? { fontSize: '0.58rem' } : {}) }}>Версия</span>
				</div>
				<div style={css.stat}>
					<span style={{ ...css.statVal, ...(mobile ? { fontSize: '1rem' } : {}) }}>{moduleCount}</span>
					<span style={{ ...css.statLabel, ...(mobile ? { fontSize: '0.58rem' } : {}) }}>Модулей</span>
				</div>
				<div style={css.stat}>
					<span style={{ ...css.statVal, ...(mobile ? { fontSize: '1rem' } : {}) }}>{addedIds.size}</span>
					<span style={{ ...css.statLabel, ...(mobile ? { fontSize: '0.58rem' } : {}) }}>Расшир.</span>
				</div>
				<div style={css.stat}>
					<span style={{ ...css.statVal, ...(mobile ? { fontSize: '1rem' } : {}) }}>0</span>
					<span style={{ ...css.statLabel, ...(mobile ? { fontSize: '0.58rem' } : {}) }}>Строк</span>
				</div>
			</div>
		</div>
	);
}
