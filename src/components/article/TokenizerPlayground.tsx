import { useMemo, useState } from 'react';
import { encode, decode } from 'gpt-tokenizer/encoding/cl100k_base';

const PALETTE = ['var(--accent)', 'var(--accent-secondary)', 'var(--accent-yellow)', 'var(--accent-magenta)', '#06b6d4'];

const PRESETS = [
	{
		label: 'Простой пример',
		ru: 'Токенизация делит текст на части.',
		en: 'Tokenization splits text into pieces.',
	},
	{
		label: 'Пример сложнее',
		ru: 'Большие языковые модели токенизируют текст перед тем, как его обработать.',
		en: 'Large language models tokenize text before processing it.',
	},
];

const PRICE_PER_1M = 2; // $/1M входных токенов — усреднённый ориентир по тарифам уровня GPT-4, не тариф конкретного провайдера

function tokenize(text: string) {
	if (!text) return [];
	const ids = encode(text);
	return ids.map((id) => decode([id]));
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
	presetRow: {
		display: 'flex',
		gap: '0.5rem',
		marginBottom: '1.1rem',
		flexWrap: 'wrap' as const,
	} as React.CSSProperties,
	presetBtn: (active: boolean) => ({
		padding: '0.4rem 0.9rem',
		borderRadius: '100px',
		border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
		background: active ? 'color-mix(in srgb, var(--accent) 14%, var(--bg-card))' : 'var(--bg-secondary)',
		color: active ? 'var(--accent-light)' : 'var(--text-secondary)',
		fontSize: '0.8rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
	} as React.CSSProperties),
	compareGrid: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: '1rem',
	} as React.CSSProperties,
	langCard: {
		padding: '0.9rem 1rem',
		borderRadius: '10px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
	} as React.CSSProperties,
	langLabel: {
		fontSize: '0.72rem',
		fontWeight: 700,
		color: 'var(--text-muted)',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.04em',
		marginBottom: '0.5rem',
	} as React.CSSProperties,
	tokens: {
		display: 'flex',
		flexWrap: 'wrap' as const,
		gap: '2px',
		marginBottom: '0.6rem',
		lineHeight: 1.9,
	} as React.CSSProperties,
	chip: (color: string) => ({
		whiteSpace: 'pre' as const,
		padding: '0.05rem 0.15rem',
		borderRadius: '3px',
		fontSize: '0.85rem',
		fontFamily: 'var(--font-mono, monospace)',
		background: `color-mix(in srgb, ${color} 30%, transparent)`,
		color: 'var(--text)',
	} as React.CSSProperties),
	count: {
		fontSize: '0.8rem',
		color: 'var(--text-secondary)',
	} as React.CSSProperties,
	countNum: {
		fontWeight: 800,
		color: 'var(--text)',
		fontVariantNumeric: 'tabular-nums' as const,
	} as React.CSSProperties,
	ratioBox: {
		marginTop: '1rem',
		padding: '0.9rem 1.1rem',
		borderRadius: '10px',
		textAlign: 'center' as const,
		background: 'linear-gradient(135deg, rgba(255,107,43,0.1), rgba(201,70,255,0.08))',
		border: '1px solid rgba(255,107,43,0.25)',
	} as React.CSSProperties,
	ratioNum: {
		fontSize: '1.5rem',
		fontWeight: 900,
		background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))',
		WebkitBackgroundClip: 'text',
		WebkitTextFillColor: 'transparent',
		backgroundClip: 'text',
	} as React.CSSProperties,
	divider: {
		margin: '1.5rem 0',
		border: 'none',
		borderTop: '1px solid var(--border)',
	} as React.CSSProperties,
	textarea: {
		width: '100%',
		minHeight: '5rem',
		padding: '0.75rem 0.9rem',
		borderRadius: '10px',
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
		color: 'var(--text)',
		fontSize: '0.9rem',
		fontFamily: 'inherit',
		resize: 'vertical' as const,
		boxSizing: 'border-box' as const,
	} as React.CSSProperties,
	playgroundStats: {
		display: 'flex',
		gap: '1.5rem',
		flexWrap: 'wrap' as const,
		marginTop: '0.75rem',
	} as React.CSSProperties,
};

export default function TokenizerPlayground() {
	const [presetIdx, setPresetIdx] = useState(0);
	const [customText, setCustomText] = useState('Привет! Напиши что-нибудь своё — увидишь, как это порежет токенизатор.');

	const preset = PRESETS[presetIdx];
	const ruTokens = useMemo(() => tokenize(preset.ru), [preset.ru]);
	const enTokens = useMemo(() => tokenize(preset.en), [preset.en]);
	const ratio = ruTokens.length / enTokens.length;

	const customTokens = useMemo(() => tokenize(customText), [customText]);
	const costPer1k = (customTokens.length * PRICE_PER_1M) / 1000;

	return (
		<div style={css.wrap}>
			<div style={css.title}>🔤 Токенизатор вживую</div>
			<div style={css.desc}>
				Настоящий токенизатор OpenAI (cl100k_base — GPT-4/GPT-3.5) прямо в браузере. Одинаковая мысль на двух языках — сравни счётчики.
			</div>

			<div style={css.presetRow}>
				{PRESETS.map((p, i) => (
					<button key={p.label} style={css.presetBtn(i === presetIdx)} onClick={() => setPresetIdx(i)}>
						{p.label}
					</button>
				))}
			</div>

			<div style={css.compareGrid}>
				<div style={css.langCard}>
					<div style={css.langLabel}>🇷🇺 Русский</div>
					<div style={css.tokens}>
						{ruTokens.map((t, i) => (
							<span key={i} style={css.chip(PALETTE[i % PALETTE.length])}>{t}</span>
						))}
					</div>
					<div style={css.count}><span style={css.countNum}>{ruTokens.length}</span> токенов · {preset.ru.length} симв.</div>
				</div>
				<div style={css.langCard}>
					<div style={css.langLabel}>🇬🇧 English</div>
					<div style={css.tokens}>
						{enTokens.map((t, i) => (
							<span key={i} style={css.chip(PALETTE[i % PALETTE.length])}>{t}</span>
						))}
					</div>
					<div style={css.count}><span style={css.countNum}>{enTokens.length}</span> токенов · {preset.en.length} симв.</div>
				</div>
			</div>

			<div style={css.ratioBox}>
				Русский текст занял <span style={css.ratioNum}>{ratio.toFixed(2)}×</span> больше токенов, чем тот же смысл по-английски
			</div>

			<hr style={css.divider} />

			<div style={css.desc}>Теперь свой текст — что угодно, от бытовой фразы до куска кода:</div>
			<textarea
				aria-label="Текст для токенизации"
				style={css.textarea}
				value={customText}
				onChange={(e) => setCustomText(e.target.value)}
			/>
			<div style={css.tokens}>
				{customTokens.map((t, i) => (
					<span key={i} style={css.chip(PALETTE[i % PALETTE.length])}>{t}</span>
				))}
			</div>
			<div style={css.playgroundStats}>
				<div style={css.count}><span style={css.countNum}>{customTokens.length}</span> токенов</div>
				<div style={css.count}><span style={css.countNum}>{customText.length}</span> символов</div>
				<div style={css.count}>≈ <span style={css.countNum}>${costPer1k.toFixed(4)}</span> за 1000 таких запросов (по ${PRICE_PER_1M}/1M входных токенов — ориентир уровня GPT-4, не тариф конкретного провайдера)</div>
			</div>
		</div>
	);
}
