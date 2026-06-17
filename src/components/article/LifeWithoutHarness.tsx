import { useState, useEffect } from 'react';

// Один и тот же таск — «почини баг» — проигран двумя способами.
// Без харнеса ИСПОЛНИТЕЛЬ — это ты, руками. С харнесом — обвязка делает всё сама.
type Actor = 'you' | 'llm' | 'harness';

interface Row {
	actor: Actor;
	text: string;
}

const WITHOUT: Row[] = [
	{ actor: 'you', text: 'Копируешь логи из терминала' },
	{ actor: 'you', text: 'Вставляешь в окно ChatGPT' },
	{ actor: 'llm', text: '«Похоже на NullPointer, покажи user.py»' },
	{ actor: 'you', text: 'Открываешь файл, копируешь, вставляешь обратно' },
	{ actor: 'llm', text: '«Добавь проверку на None вот сюда»' },
	{ actor: 'you', text: 'Руками правишь файл по инструкции' },
	{ actor: 'you', text: 'Сам запускаешь pytest в терминале' },
	{ actor: 'you', text: 'Копируешь вывод тестов обратно в чат' },
	{ actor: 'llm', text: '«Отлично, всё зелёное 🎉»' },
];

const WITH: Row[] = [
	{ actor: 'llm', text: 'Думает: надо посмотреть логи' },
	{ actor: 'harness', text: 'read_file("app.log") → отдаёт хвост лога' },
	{ actor: 'llm', text: 'Думает: NullPointer, правлю user.py' },
	{ actor: 'harness', text: 'edit_file(user.py) → патч применён' },
	{ actor: 'llm', text: 'Думает: проверю тестами' },
	{ actor: 'harness', text: 'run("pytest") → 12 passed' },
	{ actor: 'llm', text: 'Готово, отчитываюсь юзеру 🫡' },
];

const ACTOR_META: Record<Actor, { label: string; color: string; icon: string }> = {
	you: { label: 'ТЫ, вручную', color: '#ef4444', icon: '🩸' },
	llm: { label: 'LLM', color: '#8b5cf6', icon: '🧠' },
	harness: { label: 'Харнес', color: '#ff6b2b', icon: '⚙️' },
};

function useIsMobile(bp = 480) {
	const [m, setM] = useState(false);
	useEffect(() => {
		const check = () => setM(window.innerWidth <= bp);
		check();
		window.addEventListener('resize', check, { passive: true });
		return () => window.removeEventListener('resize', check);
	}, [bp]);
	return m;
}

export default function LifeWithoutHarness() {
	const [withHarness, setWithHarness] = useState(false);
	const mobile = useIsMobile();
	const rows = withHarness ? WITH : WITHOUT;
	const manual = rows.filter((r) => r.actor === 'you').length;

	return (
		<div
			style={{
				margin: '1.75em 0',
				padding: mobile ? '0.85rem' : '1.5rem',
				borderRadius: '12px',
				border: '1px solid var(--border)',
				background: 'var(--bg-card)',
			}}
		>
			{/* Toggle */}
			<div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' as const }}>
				{[
					{ on: false, label: '🩸 Без харнеса (2015–2023)' },
					{ on: true, label: '🤖 С харнесом (сейчас)' },
				].map((opt) => {
					const active = withHarness === opt.on;
					const accent = opt.on ? '#ff6b2b' : '#ef4444';
					return (
						<button
							key={String(opt.on)}
							onClick={() => setWithHarness(opt.on)}
							style={{
								padding: mobile ? '0.4rem 0.7rem' : '0.45rem 1rem',
								borderRadius: '8px',
								border: `1.5px solid ${active ? accent : 'var(--border)'}`,
								background: active ? `${accent}18` : 'transparent',
								color: active ? accent : 'var(--text-muted)',
								fontSize: mobile ? '0.74rem' : '0.82rem',
								fontWeight: active ? 700 : 500,
								cursor: 'pointer',
								WebkitTapHighlightColor: 'transparent',
								transition: 'all 0.2s ease',
							}}
						>
							{opt.label}
						</button>
					);
				})}
			</div>

			{/* Counter */}
			<div
				style={{
					fontSize: mobile ? '0.8rem' : '0.88rem',
					marginBottom: '1rem',
					color: 'var(--text-secondary)',
					lineHeight: 1.5,
				}}
			>
				Ручных действий с твоей стороны:{' '}
				<strong style={{ color: manual ? '#ef4444' : '#10b981', fontSize: '1.05em' }}>
					{manual === 0 ? '0 — ты просто ждёшь ☕' : manual}
				</strong>
			</div>

			{/* Rows */}
			<div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.4rem' }}>
				{rows.map((r, i) => {
					const m = ACTOR_META[r.actor];
					return (
						<div
							key={i}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.65rem',
								padding: mobile ? '0.5rem 0.65rem' : '0.6rem 0.9rem',
								borderRadius: '8px',
								border: `1px solid ${r.actor === 'you' ? m.color + '40' : 'var(--border)'}`,
								background: r.actor === 'you' ? `${m.color}0c` : 'transparent',
							}}
						>
							<span style={{ fontSize: mobile ? '0.95rem' : '1.05rem', flexShrink: 0 }}>{m.icon}</span>
							<span
								style={{
									flexShrink: 0,
									fontSize: '0.58rem',
									fontWeight: 700,
									color: 'white',
									background: m.color,
									padding: '0.12rem 0.45rem',
									borderRadius: '100px',
									textTransform: 'uppercase' as const,
									letterSpacing: '0.02em',
									minWidth: mobile ? '52px' : '64px',
									textAlign: 'center' as const,
								}}
							>
								{m.label}
							</span>
							<span style={{ fontSize: mobile ? '0.8rem' : '0.86rem', color: 'var(--text)', lineHeight: 1.45 }}>{r.text}</span>
						</div>
					);
				})}
			</div>

			<div style={{ marginTop: '1rem', fontSize: mobile ? '0.76rem' : '0.82rem', color: 'var(--text-muted)', lineHeight: 1.55, fontStyle: 'italic' }}>
				{withHarness
					? 'Цикл крутится сам. Ты приносишь проблему — обвязка делает всю беготню.'
					: 'Заметил? Исполнитель — это ТЫ. Ты и был тем самым харнесом, только медленным и на ручном приводе.'}
			</div>
		</div>
	);
}
