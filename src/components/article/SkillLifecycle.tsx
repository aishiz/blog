import { useState, useEffect } from 'react';

type Category = {
	name: string;
	color: string;
	skills: string[];
};

type Stage = {
	num: number;
	name: string;
	color: string;
	desc: string;
};

const categories: Category[] = [
	{ name: 'Инфраструктура', color: '#3b82f6', skills: ['aws-vpc-setup', 'k8s-cluster-deploy', 'terraform-plan', 'cost-optimizer'] },
	{ name: 'Данные и БД', color: '#10b981', skills: ['postgres-ha-setup', 'redis-cluster', 'clickhouse-analytics', 'backup-policy'] },
	{ name: 'Безопасность', color: '#f59e0b', skills: ['security-hardening', 'gdpr-compliance', 'ssl-certificates', 'iam-policies'] },
	{ name: 'Мониторинг', color: '#ec4899', skills: ['prometheus-setup', 'alerting-rules', 'log-aggregation', 'slo-tracking'] },
];

const stages: Stage[] = [
	{ num: 1, name: 'Создание', color: '#3b82f6', desc: 'Эксперт пишет SKILL.md — инструкции, примеры, форматы вывода' },
	{ num: 2, name: 'Тестирование', color: '#10b981', desc: 'Агент автоматически проверяет SKILL на наборе тест-кейсов' },
	{ num: 3, name: 'Ревью', color: '#f59e0b', desc: 'Команда проверяет качество навыка, точность инструкций, edge-cases' },
	{ num: 4, name: 'Публикация', color: '#8b5cf6', desc: 'SKILL попадает в корпоративный реестр. Аналог npm/pypi для экспертизы' },
	{ num: 5, name: 'Использование', color: '#ec4899', desc: 'Агенты загружают SKILL по запросу. Один раз создал — используй везде' },
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

export default function SkillLifecycle() {
	const [activeStage, setActiveStage] = useState(0);
	const [activeCategory, setActiveCategory] = useState<number | null>(null);
	const [view, setView] = useState<'registry' | 'lifecycle'>('registry');
	const mobile = useIsMobile();

	return (
		<div style={{
			margin: '1.75em 0', padding: mobile ? '0.85rem' : '1.5rem',
			borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)',
		}}>
			<div style={{
				fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)',
				textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem',
			}}>
				📚 Реестр SKILL-ов и Жизненный Цикл
			</div>

			<div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem' }}>
				{(['registry', 'lifecycle'] as const).map(v => (
					<button key={v} onClick={() => setView(v)} style={{
						padding: mobile ? '0.35rem 0.6rem' : '0.4rem 0.85rem',
						borderRadius: '100px',
						border: `1px solid ${view === v ? 'var(--accent)' : 'var(--border)'}`,
						background: view === v ? 'var(--accent-glow)' : 'var(--bg-secondary)',
						color: view === v ? 'var(--accent-light)' : 'var(--text-muted)',
						fontSize: mobile ? '0.72rem' : '0.78rem', fontWeight: 600,
						cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
					}}>
						{v === 'registry' ? '🗂️ Реестр' : '🔄 Жизненный цикл'}
					</button>
				))}
			</div>

			{view === 'registry' ? (
				<div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.5rem' }}>
					{categories.map((cat, ci) => (
						<div key={cat.name}>
							<button
								onClick={() => setActiveCategory(activeCategory === ci ? null : ci)}
								style={{
									width: '100%', textAlign: 'left' as const,
									padding: mobile ? '0.55rem 0.7rem' : '0.65rem 0.85rem',
									borderRadius: '8px',
									border: `1.5px solid ${activeCategory === ci ? cat.color : 'var(--border)'}`,
									background: activeCategory === ci ? `${cat.color}10` : 'var(--bg-secondary)',
									cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.25s ease',
									display: 'flex', alignItems: 'center', gap: '0.5rem',
								}}
							>
								<span style={{
									width: '10px', height: '10px', borderRadius: '50%',
									background: cat.color, flexShrink: 0,
								}} />
								<span style={{
									fontSize: mobile ? '0.82rem' : '0.88rem', fontWeight: 700, color: 'var(--text)',
									flex: 1,
								}}>
									{cat.name}
								</span>
								<span style={{
									fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)',
									fontFamily: "'JetBrains Mono', monospace",
								}}>
									{cat.skills.length} skills
								</span>
								<span style={{
									fontSize: '0.7rem', color: 'var(--text-muted)',
									transform: activeCategory === ci ? 'rotate(180deg)' : 'rotate(0deg)',
									transition: 'transform 0.2s ease',
								}}>
									▼
								</span>
							</button>
							{activeCategory === ci && (
								<div style={{
									display: 'grid',
									gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4, 1fr)',
									gap: '0.3rem', marginTop: '0.35rem', paddingLeft: '0.25rem',
								}}>
									{cat.skills.map(s => (
										<div key={s} style={{
											padding: mobile ? '0.35rem 0.45rem' : '0.4rem 0.6rem',
											borderRadius: '6px',
											border: `1px solid ${cat.color}33`,
											background: `${cat.color}08`,
											fontSize: mobile ? '0.62rem' : '0.68rem',
											fontWeight: 600, color: cat.color,
											fontFamily: "'JetBrains Mono', monospace",
											whiteSpace: 'nowrap' as const,
											overflow: 'hidden', textOverflow: 'ellipsis',
										}}>
											{s}
										</div>
									))}
								</div>
							)}
						</div>
					))}
					<div style={{
						marginTop: '0.5rem', padding: '0.6rem 0.85rem', borderRadius: '8px',
						border: '1px dashed var(--border)', background: 'var(--bg-secondary)',
						fontSize: mobile ? '0.72rem' : '0.78rem', color: 'var(--text-muted)',
						fontStyle: 'italic' as const, lineHeight: 1.5, textAlign: 'center' as const,
					}}>
						Корпоративная библиотека навыков — живой актив, который растёт вместе с экспертизой команды
					</div>
				</div>
			) : (
				<div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.4rem' }}>
					{stages.map((st, i) => (
						<button
							key={st.num}
							onClick={() => setActiveStage(i)}
							style={{
								display: 'flex', alignItems: 'center', gap: mobile ? '0.5rem' : '0.75rem',
								padding: mobile ? '0.55rem 0.7rem' : '0.7rem 1rem',
								borderRadius: '10px',
								border: `1.5px solid ${activeStage === i ? st.color : 'var(--border)'}`,
								background: activeStage === i ? `${st.color}10` : 'var(--bg-secondary)',
								cursor: 'pointer', fontFamily: 'inherit', width: '100%',
								textAlign: 'left' as const, transition: 'all 0.25s ease',
							}}
						>
							<span style={{
								width: mobile ? '28px' : '34px', height: mobile ? '28px' : '34px',
								borderRadius: '50%', flexShrink: 0,
								background: `linear-gradient(135deg, ${st.color}, ${st.color}bb)`,
								display: 'flex', alignItems: 'center', justifyContent: 'center',
								color: 'white', fontWeight: 800, fontSize: mobile ? '0.72rem' : '0.82rem',
							}}>
								{st.num}
							</span>
							<div style={{ flex: 1, minWidth: 0 }}>
								<div style={{
									fontSize: mobile ? '0.82rem' : '0.9rem', fontWeight: 700,
									color: activeStage === i ? st.color : 'var(--text)',
									transition: 'color 0.2s ease',
								}}>
									{st.name}
								</div>
								{activeStage === i && (
									<div style={{
										fontSize: mobile ? '0.72rem' : '0.78rem', color: 'var(--text-muted)',
										lineHeight: 1.5, marginTop: '0.2rem',
									}}>
										{st.desc}
									</div>
								)}
							</div>
						</button>
					))}
					<div style={{
						marginTop: '0.5rem', padding: '0.6rem 0.85rem', borderRadius: '8px',
						border: `1px solid var(--border)`, background: 'var(--bg-secondary)',
						fontSize: mobile ? '0.68rem' : '0.75rem', color: 'var(--text-muted)',
						textAlign: 'center' as const, lineHeight: 1.5,
					}}>
						<strong style={{ color: 'var(--text)' }}>SKILL как пакет:</strong> semantic versioning, changelog, тесты, ownership
					</div>
				</div>
			)}
		</div>
	);
}
