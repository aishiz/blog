import { useState, useEffect } from 'react';

type FileEntry = {
	name: string;
	required: boolean;
	color: string;
	desc: string;
};

type FlowStep = {
	num: number;
	name: string;
	color: string;
	desc: string;
};

const files: FileEntry[] = [
	{ name: 'SKILL.md', required: true, color: '#10b981', desc: 'YAML-фронтматтер: name, description. Markdown-инструкции: когда и как применять. Примеры, чеклисты, форматы вывода.' },
	{ name: 'scripts/', required: false, color: '#3b82f6', desc: 'Python, Bash, любые исполняемые файлы. Агент запускает их при необходимости.' },
	{ name: 'references/', required: false, color: '#8b5cf6', desc: 'Документация, спецификации, примеры. Загружается только при активации навыка.' },
	{ name: 'assets/', required: false, color: '#f59e0b', desc: 'Шаблоны, конфиги, ресурсы.' },
];

const flow: FlowStep[] = [
	{ num: 1, name: 'Запрос пользователя', color: '#ef4444', desc: '«Проанализируй отток клиентов»' },
	{ num: 2, name: 'Сканирование реестра', color: '#f59e0b', desc: 'Агент читает только YAML-заголовки (name + description) всех навыков' },
	{ num: 3, name: 'Обнаружение SKILL-а', color: '#3b82f6', desc: 'Найден: customer-churn-analysis. Загружается полный SKILL.md' },
	{ num: 4, name: 'Выполнение по инструкции', color: '#8b5cf6', desc: 'Агент следует шагам: валидация данных, вычисление метрик, сегментация, отчёт' },
	{ num: 5, name: 'Результат', color: '#10b981', desc: 'Структурированный аналитический отчёт с рекомендациями по удержанию' },
];

function useIsMobile(bp = 520) {
	const [m, setM] = useState(false);
	useEffect(() => {
		const c = () => setM(window.innerWidth <= bp);
		c();
		window.addEventListener('resize', c, { passive: true });
		return () => window.removeEventListener('resize', c);
	}, [bp]);
	return m;
}

export default function SkillAnatomy() {
	const [view, setView] = useState<'anatomy' | 'flow'>('anatomy');
	const [activeFile, setActiveFile] = useState(0);
	const [activeStep, setActiveStep] = useState(0);
	const [autoFlow, setAutoFlow] = useState(false);
	const mobile = useIsMobile();

	useEffect(() => {
		if (view !== 'flow' || !autoFlow) return;
		if (activeStep >= flow.length - 1) { setAutoFlow(false); return; }
		const t = setTimeout(() => setActiveStep(s => s + 1), 1200);
		return () => clearTimeout(t);
	}, [view, autoFlow, activeStep]);

	const startFlow = () => { setActiveStep(0); setAutoFlow(true); };

	return (
		<div style={{
			margin: '1.75em 0', padding: mobile ? '0.85rem' : '1.5rem',
			borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)',
		}}>
			<div style={{
				fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)',
				textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem',
			}}>
				🔬 Анатомия SKILL-а и Прогрессивное Раскрытие
			</div>

			<div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem' }}>
				{(['anatomy', 'flow'] as const).map(v => (
					<button key={v} onClick={() => setView(v)} style={{
						padding: mobile ? '0.35rem 0.6rem' : '0.4rem 0.85rem',
						borderRadius: '100px',
						border: `1px solid ${view === v ? 'var(--accent)' : 'var(--border)'}`,
						background: view === v ? 'var(--accent-glow)' : 'var(--bg-secondary)',
						color: view === v ? 'var(--accent-light)' : 'var(--text-muted)',
						fontSize: mobile ? '0.72rem' : '0.78rem', fontWeight: 600,
						cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
					}}>
						{v === 'anatomy' ? '📁 Структура' : mobile ? '⚡ Раскрытие' : '⚡ Прогрессивное раскрытие'}
					</button>
				))}
			</div>

			{view === 'anatomy' ? (
				<div>
					<div style={{
						padding: mobile ? '0.5rem 0.65rem' : '0.6rem 0.85rem',
						borderRadius: '8px', background: 'var(--bg-secondary)',
						border: '1px solid var(--border)', marginBottom: '0.5rem',
						fontSize: mobile ? '0.82rem' : '0.9rem', fontWeight: 700, color: 'var(--text)',
						fontFamily: "'JetBrains Mono', monospace",
					}}>
						📂 my-skill/
					</div>
					<div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.35rem' }}>
						{files.map((f, i) => (
							<button
								key={f.name}
								onClick={() => setActiveFile(i)}
								style={{
									display: 'flex', alignItems: 'center', gap: mobile ? '0.4rem' : '0.6rem',
									width: '100%', textAlign: 'left' as const,
									padding: mobile ? '0.5rem 0.65rem' : '0.6rem 0.85rem',
									paddingLeft: mobile ? '1.2rem' : '1.5rem',
									borderRadius: '8px',
									border: `1.5px solid ${activeFile === i ? f.color : 'var(--border)'}`,
									background: activeFile === i ? `${f.color}10` : 'var(--bg-secondary)',
									cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.25s ease',
								}}
							>
								<span style={{
									fontSize: mobile ? '0.78rem' : '0.85rem', fontWeight: 700,
									color: f.color, fontFamily: "'JetBrains Mono', monospace",
									flex: 1,
								}}>
									{f.name}
								</span>
								<span style={{
									fontSize: '0.6rem', fontWeight: 700,
									padding: '0.12rem 0.4rem', borderRadius: '100px',
									background: f.required ? '#10b98118' : 'var(--bg-card)',
									color: f.required ? '#10b981' : 'var(--text-muted)',
									border: `1px solid ${f.required ? '#10b98133' : 'var(--border)'}`,
								}}>
									{f.required ? 'ОБЯЗАТЕЛЬНЫЙ' : 'опционально'}
								</span>
							</button>
						))}
					</div>
					<div style={{
						marginTop: '0.6rem', padding: mobile ? '0.65rem 0.75rem' : '0.75rem 1rem',
						borderRadius: '8px',
						border: `1px solid ${files[activeFile].color}44`,
						background: `${files[activeFile].color}08`,
						fontSize: mobile ? '0.78rem' : '0.85rem', color: 'var(--text-secondary)',
						lineHeight: 1.6, transition: 'all 0.3s ease',
					}}>
						{files[activeFile].desc}
					</div>
				</div>
			) : (
				<div>
					<div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.35rem' }}>
						{flow.map((st, i) => {
							const reached = i <= activeStep;
							const current = i === activeStep;
							return (
								<button
									key={st.num}
									onClick={() => { setActiveStep(i); setAutoFlow(false); }}
									style={{
										display: 'flex', alignItems: 'center', gap: mobile ? '0.5rem' : '0.65rem',
										width: '100%', textAlign: 'left' as const,
										padding: mobile ? '0.5rem 0.65rem' : '0.65rem 0.85rem',
										borderRadius: '8px',
										border: `1.5px solid ${current ? st.color : reached ? `${st.color}55` : 'var(--border)'}`,
										background: current ? `${st.color}12` : 'var(--bg-secondary)',
										opacity: reached ? 1 : 0.35,
										cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.4s ease',
									}}
								>
									<span style={{
										width: mobile ? '24px' : '28px', height: mobile ? '24px' : '28px',
										borderRadius: '50%', flexShrink: 0,
										background: reached ? st.color : 'var(--bg-card)',
										border: `2px solid ${reached ? st.color : 'var(--border)'}`,
										display: 'flex', alignItems: 'center', justifyContent: 'center',
										color: reached ? 'white' : 'var(--text-muted)',
										fontWeight: 800, fontSize: mobile ? '0.62rem' : '0.7rem',
										transition: 'all 0.4s ease',
									}}>
										{reached ? '✓' : st.num}
									</span>
									<div style={{ flex: 1, minWidth: 0 }}>
										<div style={{
											fontSize: mobile ? '0.78rem' : '0.85rem', fontWeight: 700,
											color: current ? st.color : 'var(--text)',
										}}>
											{st.name}
										</div>
										{current && (
											<div style={{
												fontSize: mobile ? '0.7rem' : '0.75rem', color: 'var(--text-muted)',
												lineHeight: 1.4, marginTop: '0.15rem',
											}}>
												{st.desc}
											</div>
										)}
									</div>
								</button>
							);
						})}
					</div>
					<button
						onClick={startFlow}
						style={{
							marginTop: '0.6rem', width: '100%',
							padding: '0.45rem 1rem', borderRadius: '8px',
							border: '1px solid var(--accent)', background: 'var(--accent-glow)',
							color: 'var(--accent-light)', fontSize: '0.78rem', fontWeight: 700,
							cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
						}}
					>
						▶ Запустить анимацию
					</button>
					<div style={{
						marginTop: '0.5rem', padding: '0.55rem 0.75rem', borderRadius: '8px',
						border: '1px solid #10b98133', background: '#10b98108',
						fontSize: mobile ? '0.68rem' : '0.75rem', color: '#10b981',
						textAlign: 'center' as const, fontWeight: 600, lineHeight: 1.5,
					}}>
						Контекстное окно остаётся чистым: загружен только один релевантный SKILL
					</div>
				</div>
			)}
		</div>
	);
}
