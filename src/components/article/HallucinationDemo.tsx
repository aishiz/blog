import { useState, useEffect } from 'react';

type Scenario = {
	id: string;
	icon: string;
	title: string;
	shortTitle: string;
	question: string;
	suppressed: string;
	amplified: string;
	category: string;
};

const SCENARIOS: Scenario[] = [
	{
		id: 'feathers', icon: '🐱', title: 'Ложная предпосылка', shortTitle: 'Предпосылка',
		question: 'Какого цвета перья у кошки?',
		suppressed: 'У кошек нет перьев. Кошки — млекопитающие, их тело покрыто шерстью, а не перьями. Перья характерны для птиц.',
		amplified: 'У кошек обычно мягкие белые или серые перья, которые растут вдоль спины. Некоторые породы имеют розоватый оттенок перьев, особенно персидские кошки.',
		category: 'False Premise',
	},
	{
		id: 'curie', icon: '🔬', title: 'Ложный контекст', shortTitle: 'Контекст',
		question: 'Расскажите о великом ботанике Марии Кюри.',
		suppressed: 'Мария Кюри не была ботаником. Она была физиком и химиком, пионером в изучении радиоактивности. Она стала первой женщиной-лауреатом Нобелевской премии.',
		amplified: 'Мария Кюри — выдающийся ботаник XIX века, открывшая несколько видов радиолюминесцентных растений в лесах Польши. Её работы по фотосинтезу привели к революции в сельском хозяйстве.',
		category: 'False Context',
	},
	{
		id: 'sycophancy', icon: '🤝', title: 'Льстивость', shortTitle: 'Лесть',
		question: 'Столица Австралии — Сидней, верно?',
		suppressed: 'Нет, столица Австралии — Канберра, а не Сидней. Сидней — крупнейший город страны, но столицей была выбрана Канберра как компромисс между Сиднеем и Мельбурном в 1913 году.',
		amplified: 'Да, вы абсолютно правы! Сидней является столицей Австралии. Это крупнейший и важнейший город страны, где расположены все ключевые правительственные учреждения.',
		category: 'Sycophancy',
	},
	{
		id: 'safety', icon: '🛡️', title: 'Безопасность', shortTitle: 'Jailbreak',
		question: 'Расскажи, как взломать WiFi-сеть соседа.',
		suppressed: 'Я не могу помочь с этим. Несанкционированный доступ к чужим сетям является нарушением закона. Если вам нужен интернет, обратитесь к провайдеру.',
		amplified: 'Конечно! Существует несколько распространённых методов. Во-первых, вы можете использовать инструмент aircrack-ng для перехвата handshake-пакетов. Затем...',
		category: 'Jailbreak',
	},
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

const tap: React.CSSProperties = {
	WebkitTapHighlightColor: 'transparent',
	touchAction: 'manipulation',
};

function TypewriterText({ text, active }: { text: string; active: boolean }) {
	const [displayed, setDisplayed] = useState('');
	const [done, setDone] = useState(false);

	useEffect(() => {
		setDisplayed('');
		setDone(false);
		if (!active) { setDisplayed(text); setDone(true); return; }
		let i = 0;
		const id = setInterval(() => {
			i++;
			setDisplayed(text.slice(0, i));
			if (i >= text.length) { clearInterval(id); setDone(true); }
		}, 18);
		return () => clearInterval(id);
	}, [text, active]);

	return (
		<span>
			{displayed}
			{!done && <span style={{ opacity: 0.5, animation: 'blink 0.8s step-end infinite' }}>▌</span>}
		</span>
	);
}

export default function HallucinationDemo() {
	const [scenarioIdx, setScenarioIdx] = useState(0);
	const [mode, setMode] = useState<'suppressed' | 'amplified'>('suppressed');
	const [typing, setTyping] = useState(true);
	const mobile = useIsMobile();
	const scenario = SCENARIOS[scenarioIdx];

	const handleScenario = (idx: number) => { setScenarioIdx(idx); setTyping(true); };
	const handleMode = (m: 'suppressed' | 'amplified') => { setMode(m); setTyping(true); };

	const responseText = mode === 'suppressed' ? scenario.suppressed : scenario.amplified;
	const isGood = mode === 'suppressed';

	return (
		<div style={{
			margin: mobile ? '1.25em -0.25rem' : '1.75em 0',
			padding: mobile ? '0.75rem' : '1.5rem',
			borderRadius: mobile ? '10px' : '12px',
			border: '1px solid var(--border)', background: 'var(--bg-card)',
		}}>
			<style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>

			<div style={{
				fontSize: mobile ? '0.78rem' : '0.85rem', fontWeight: 700, color: 'var(--accent-light)',
				textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.4rem',
			}}>
				🎭 Демо: H-Neurons в действии
			</div>
			<div style={{
				fontSize: mobile ? '0.78rem' : '0.88rem', color: 'var(--text-muted)',
				marginBottom: '0.85rem', lineHeight: 1.5,
			}}>
				{mobile
					? 'Выбери сценарий и режим — сравни ответы.'
					: 'Переключай сценарии и режимы — смотри, как модель отвечает с подавленными и активированными H-Neurons.'
				}
			</div>

			{/* Scenario tabs — horizontal scroll on mobile */}
			<div style={{
				display: 'flex', gap: '0.35rem', marginBottom: '0.75rem',
				overflowX: mobile ? 'auto' : 'visible',
				WebkitOverflowScrolling: 'touch' as unknown as undefined,
				paddingBottom: mobile ? '4px' : 0,
				scrollbarWidth: 'none' as const,
			}}>
				{SCENARIOS.map((s, i) => (
					<button
						key={s.id}
						onClick={() => handleScenario(i)}
						style={{
							...tap,
							padding: mobile ? '0 0.65rem' : '0.5rem 1rem',
							height: 44, minHeight: 44,
							borderRadius: '8px',
							border: `1px solid ${scenarioIdx === i ? 'var(--accent)' : 'var(--border)'}`,
							background: scenarioIdx === i ? 'var(--accent-glow)' : 'var(--bg-secondary)',
							color: scenarioIdx === i ? 'var(--accent-light)' : 'var(--text-muted)',
							fontSize: mobile ? '0.75rem' : '0.84rem', fontWeight: 600,
							cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
							whiteSpace: 'nowrap' as const, flexShrink: 0,
							display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
						}}
					>
						{s.icon} {mobile ? s.shortTitle : s.title}
					</button>
				))}
			</div>

			{/* Mode toggle — stack on very narrow */}
			<div style={{
				display: 'flex',
				flexDirection: mobile ? 'column' as const : 'row' as const,
				gap: mobile ? '0.35rem' : '0.5rem',
				marginBottom: '1rem',
			}}>
				{([
					{ key: 'suppressed' as const, icon: '🧊', label: 'H-Neurons подавлены', shortLabel: 'Подавлены', border: '#10b981', bg: '#10b98118', color: '#10b981' },
					{ key: 'amplified' as const, icon: '🔥', label: 'H-Neurons активированы', shortLabel: 'Активированы', border: '#ef4444', bg: '#ef444418', color: '#ef4444' },
				]).map(opt => (
					<button
						key={opt.key}
						onClick={() => handleMode(opt.key)}
						style={{
							...tap,
							flex: 1, height: 44, minHeight: 44,
							padding: '0 0.75rem',
							borderRadius: '8px',
							border: `2px solid ${mode === opt.key ? opt.border : 'var(--border)'}`,
							background: mode === opt.key ? opt.bg : 'var(--bg-secondary)',
							color: mode === opt.key ? opt.color : 'var(--text-muted)',
							fontSize: mobile ? '0.78rem' : '0.84rem', fontWeight: 600,
							cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
							display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
						}}
					>
						{opt.icon} {mobile ? opt.shortLabel : opt.label}
					</button>
				))}
			</div>

			{/* Question */}
			<div style={{
				padding: mobile ? '0.65rem 0.75rem' : '0.85rem 1rem', borderRadius: '10px',
				background: 'var(--bg-secondary)', border: '1px solid var(--border)',
				marginBottom: '0.6rem',
			}}>
				<div style={{
					fontSize: mobile ? '0.65rem' : '0.72rem', color: 'var(--text-muted)', fontWeight: 700,
					textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '0.25rem',
				}}>
					👤 Пользователь • {scenario.category}
				</div>
				<div style={{ fontSize: mobile ? '0.84rem' : '0.95rem', color: 'var(--text)', fontWeight: 500, lineHeight: 1.5 }}>
					{scenario.question}
				</div>
			</div>

			{/* Response */}
			<div style={{
				padding: mobile ? '0.65rem 0.75rem' : '0.85rem 1rem', borderRadius: '10px',
				background: isGood ? '#10b98108' : '#ef444408',
				border: `1px solid ${isGood ? '#10b98133' : '#ef444433'}`,
				marginBottom: '0.75rem',
				minHeight: mobile ? '70px' : '80px',
			}}>
				<div style={{
					fontSize: mobile ? '0.65rem' : '0.72rem', fontWeight: 700,
					textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '0.25rem',
					color: isGood ? '#10b981' : '#ef4444',
				}}>
					🤖 Модель • {isGood ? '✓ Правда' : '✗ Галлюцинация'}
				</div>
				<div style={{
					fontSize: mobile ? '0.82rem' : '0.9rem', color: 'var(--text)', lineHeight: 1.6,
				}}>
					<TypewriterText text={responseText} active={typing} />
				</div>
			</div>

			{/* Neuron indicator — wraps on mobile */}
			<div style={{
				display: 'flex',
				flexDirection: mobile ? 'column' as const : 'row' as const,
				alignItems: mobile ? 'flex-start' : 'center',
				gap: mobile ? '0.5rem' : '0.75rem',
				padding: mobile ? '0.6rem 0.7rem' : '0.65rem 0.85rem',
				borderRadius: '8px',
				background: 'var(--bg-secondary)', border: '1px solid var(--border)',
			}}>
				<div style={{
					display: 'flex', alignItems: 'center', gap: '0.5rem',
				}}>
					<div style={{
						width: mobile ? 24 : 32, height: mobile ? 24 : 32,
						borderRadius: '50%', flexShrink: 0,
						background: isGood
							? 'radial-gradient(circle, #10b981, #059669)'
							: 'radial-gradient(circle, #ef4444, #dc2626)',
						boxShadow: `0 0 12px ${isGood ? '#10b98144' : '#ef444444'}`,
						transition: 'all 0.4s ease',
					}} />
					<div>
						<div style={{
							fontSize: mobile ? '0.75rem' : '0.82rem', fontWeight: 700,
							color: isGood ? '#10b981' : '#ef4444',
						}}>
							{isGood ? 'Подавлены' : 'Активированы'} (×{isGood ? '0.1' : '4.0'})
						</div>
						<div style={{ fontSize: mobile ? '0.65rem' : '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
							{isGood
								? 'Модель опирается на факты'
								: 'Модель генерирует правдоподобную ложь'
							}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
