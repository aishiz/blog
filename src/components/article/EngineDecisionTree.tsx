import { useState } from 'react';

type Step = {
	question: string;
	options: { label: string; icon: string; next: number | string }[];
};

type Result = {
	engine: string;
	color: string;
	why: string;
	runner_up: string;
	cmd: string;
};

const steps: Record<number, Step> = {
	0: {
		question: 'Какая у вас платформа?',
		options: [
			{ label: 'Linux + NVIDIA GPU', icon: '🐧', next: 1 },
			{ label: 'Linux + AMD GPU', icon: '🔴', next: 10 },
			{ label: 'Windows', icon: '🪟', next: 20 },
			{ label: 'macOS (Apple Silicon)', icon: '🍎', next: 30 },
		],
	},
	1: {
		question: 'Какой у вас сценарий?',
		options: [
			{ label: 'Production API (много пользователей)', icon: '🏭', next: 2 },
			{ label: 'RAG / агенты (общие префиксы)', icon: '🔍', next: 'sglang' },
			{ label: 'Batch-обработка (максимум throughput)', icon: '⚡', next: 'trtllm' },
			{ label: 'Локальная разработка / эксперименты', icon: '🧪', next: 3 },
		],
	},
	2: {
		question: 'Какой GPU?',
		options: [
			{ label: 'H100 / H200 / Blackwell', icon: '🚀', next: 'vllm' },
			{ label: 'A100 / A10G', icon: '💪', next: 'vllm_or_sglang' },
			{ label: 'RTX 3090 / 4090', icon: '🎮', next: 'vllm_consumer' },
		],
	},
	3: {
		question: 'Что важнее?',
		options: [
			{ label: 'Простота (одна команда)', icon: '🚀', next: 'ollama' },
			{ label: 'Контроль (сборка, флаги, GGUF)', icon: '🔧', next: 'llamacpp' },
			{ label: 'Production-фичи (LoRA, TP)', icon: '🏭', next: 'vllm' },
		],
	},
	10: {
		question: 'Какой сценарий на AMD?',
		options: [
			{ label: 'Production API', icon: '🏭', next: 'vllm_amd' },
			{ label: 'Локальная разработка', icon: '🧪', next: 'ollama' },
		],
	},
	20: {
		question: 'Готовы настроить WSL2?',
		options: [
			{ label: 'Да, мне нужен production', icon: '✅', next: 21 },
			{ label: 'Нет, хочу нативно', icon: '❌', next: 'ollama_win' },
		],
	},
	21: {
		question: 'Какой сценарий в WSL2?',
		options: [
			{ label: 'Production API', icon: '🏭', next: 'vllm' },
			{ label: 'RAG / агенты', icon: '🔍', next: 'sglang' },
			{ label: 'Максимум throughput', icon: '⚡', next: 'lmdeploy' },
		],
	},
	30: {
		question: 'Что важнее на macOS?',
		options: [
			{ label: 'Простота', icon: '🚀', next: 'ollama_mac' },
			{ label: 'Максимум из Metal', icon: '⚡', next: 'llamacpp_mac' },
		],
	},
};

const results: Record<string, Result> = {
	vllm: { engine: 'vLLM', color: '#3b82f6', why: 'Production-стандарт с PagedAttention, 100+ архитектур, FP8/NVFP4, gRPC. Лучший выбор для серьёзных API.', runner_up: 'SGLang', cmd: 'vllm serve Qwen/Qwen3-8B --quantization fp8' },
	vllm_or_sglang: { engine: 'vLLM или SGLang', color: '#3b82f6', why: 'На A100 SGLang может быть быстрее на +22%. Протестируйте оба на вашей нагрузке — результат зависит от модели.', runner_up: 'LMDeploy', cmd: 'vllm serve <model> --gpu-memory-utilization 0.90' },
	vllm_consumer: { engine: 'vLLM', color: '#3b82f6', why: 'Даже на потребительских GPU vLLM даёт continuous batching и prefix caching. Для одного пользователя — Ollama проще.', runner_up: 'Ollama', cmd: 'vllm serve Qwen/Qwen3-8B --gpu-memory-utilization 0.90' },
	vllm_amd: { engine: 'vLLM (ROCm)', color: '#3b82f6', why: 'vLLM поддерживает AMD через ROCm 6.2. SGLang тоже работает на MI300X.', runner_up: 'SGLang', cmd: 'pip install vllm --extra-index-url https://download.pytorch.org/whl/rocm6.2' },
	sglang: { engine: 'SGLang', color: '#10b981', why: 'RadixAttention переиспользует KV-кэш для общих префиксов — идеально для RAG и агентов. Лучший TTFT.', runner_up: 'vLLM', cmd: 'python -m sglang.launch_server --model-path <model> --tp 8' },
	trtllm: { engine: 'TensorRT-LLM', color: '#f59e0b', why: 'Максимальный throughput на dense-моделях: +82% на Qwen3-32B, +129% на длинных промптах. Требует компиляции модели.', runner_up: 'vLLM (optimized)', cmd: 'trtllm-build --model_dir <model> --output_dir <engine>' },
	lmdeploy: { engine: 'LMDeploy', color: '#06b6d4', why: 'TurboMind C++ движок без Python overhead. Простая установка, хорошая производительность.', runner_up: 'vLLM', cmd: 'lmdeploy serve api_server <model> --server-port 23333' },
	ollama: { engine: 'Ollama', color: '#ec4899', why: 'Одна команда — и модель работает. REST API, менеджер моделей, GPU-ускорение из коробки.', runner_up: 'llama.cpp', cmd: 'ollama run qwen3:8b' },
	ollama_win: { engine: 'Ollama (Windows)', color: '#ec4899', why: 'Нативный установщик для Windows с поддержкой NVIDIA и AMD GPU. Для production-фич — настройте WSL2.', runner_up: 'llama.cpp', cmd: 'ollama run qwen3:8b' },
	ollama_mac: { engine: 'Ollama (macOS)', color: '#ec4899', why: 'Metal-ускорение включено автоматически. Самый простой способ запустить LLM на Mac.', runner_up: 'llama.cpp', cmd: 'ollama run llama3.2:3b' },
	llamacpp: { engine: 'llama.cpp', color: '#7c3aed', why: 'Максимальный контроль: выбор бэкенда (CUDA/Vulkan/Metal), тонкая настройка слоёв на GPU, формат GGUF.', runner_up: 'Ollama', cmd: './llama-server -m model.gguf -c 8192 -ngl 99' },
	llamacpp_mac: { engine: 'llama.cpp (Metal)', color: '#7c3aed', why: 'Нативная поддержка Metal, оптимизация под Apple Silicon. Максимальная производительность на Mac.', runner_up: 'Ollama', cmd: './llama-cli -m model.gguf -c 4096 -ngl 99' },
};

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
	question: {
		fontSize: '1.15rem',
		fontWeight: 800,
		color: 'var(--text)',
		marginBottom: '1rem',
	} as React.CSSProperties,
	options: {
		display: 'grid',
		gap: '0.5rem',
	} as React.CSSProperties,
	option: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		padding: '0.85rem 1.15rem',
		borderRadius: '10px',
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
		cursor: 'pointer',
		fontFamily: 'inherit',
		fontSize: '0.92rem',
		fontWeight: 600,
		color: 'var(--text)',
		transition: 'all 0.2s ease',
		textAlign: 'left' as const,
		width: '100%',
	} as React.CSSProperties,
	optionIcon: {
		fontSize: '1.3rem',
		flexShrink: 0,
	} as React.CSSProperties,
	breadcrumb: {
		display: 'flex',
		gap: '0.35rem',
		flexWrap: 'wrap' as const,
		marginBottom: '1.25rem',
		alignItems: 'center',
	} as React.CSSProperties,
	crumb: (clickable: boolean) => ({
		padding: '0.25rem 0.65rem',
		borderRadius: '100px',
		fontSize: '0.72rem',
		fontWeight: 600,
		background: 'var(--bg-secondary)',
		color: clickable ? 'var(--accent-light)' : 'var(--text-muted)',
		border: '1px solid var(--border)',
		cursor: clickable ? 'pointer' : 'default',
		fontFamily: 'inherit',
		transition: 'all 0.2s ease',
	} as React.CSSProperties),
	arrow: {
		color: 'var(--text-muted)',
		fontSize: '0.7rem',
	} as React.CSSProperties,
	result: (color: string) => ({
		padding: '1.5rem',
		borderRadius: '12px',
		border: `2px solid ${color}`,
		background: `${color}08`,
	} as React.CSSProperties),
	resultEngine: (color: string) => ({
		fontSize: '1.6rem',
		fontWeight: 900,
		color: color,
		marginBottom: '0.5rem',
	}) as React.CSSProperties,
	resultWhy: {
		fontSize: '0.92rem',
		lineHeight: 1.7,
		color: 'var(--text-secondary)',
		marginBottom: '1rem',
	} as React.CSSProperties,
	resultMeta: {
		display: 'flex',
		gap: '1rem',
		flexWrap: 'wrap' as const,
		marginBottom: '1rem',
	} as React.CSSProperties,
	resultTag: (color: string) => ({
		padding: '0.3rem 0.75rem',
		borderRadius: '100px',
		fontSize: '0.72rem',
		fontWeight: 700,
		background: `${color}18`,
		color: color,
		border: `1px solid ${color}33`,
	} as React.CSSProperties),
	resultCmd: {
		padding: '0.75rem 1rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		fontFamily: "'JetBrains Mono', monospace",
		fontSize: '0.82rem',
		color: 'var(--text)',
		overflowX: 'auto' as const,
		whiteSpace: 'pre' as const,
	} as React.CSSProperties,
	resetBtn: {
		marginTop: '1rem',
		padding: '0.55rem 1.25rem',
		borderRadius: '8px',
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
		color: 'var(--text)',
		fontSize: '0.85rem',
		fontWeight: 600,
		cursor: 'pointer',
		fontFamily: 'inherit',
		transition: 'all 0.2s ease',
	} as React.CSSProperties,
};

export default function EngineDecisionTree() {
	const [history, setHistory] = useState<{ stepId: number; choiceLabel: string }[]>([]);
	const [current, setCurrent] = useState<number | string>(0);

	const handleChoice = (label: string, next: number | string) => {
		if (typeof current === 'number') {
			setHistory((h) => [...h, { stepId: current, choiceLabel: label }]);
		}
		setCurrent(next);
	};

	const goBack = (idx: number) => {
		const newHistory = history.slice(0, idx);
		setHistory(newHistory);
		setCurrent(idx === 0 ? 0 : history[idx - 1]?.stepId !== undefined ? steps[history[idx - 1].stepId]?.options.find(o => o.label === history[idx - 1].choiceLabel)?.next ?? 0 : 0);
		if (idx === 0) {
			setCurrent(0);
		} else {
			const prevStep = history[idx - 1];
			const step = steps[prevStep.stepId];
			const opt = step.options.find(o => o.label === prevStep.choiceLabel);
			setCurrent(opt?.next ?? 0);
		}
	};

	const reset = () => {
		setHistory([]);
		setCurrent(0);
	};

	const isResult = typeof current === 'string';
	const step = typeof current === 'number' ? steps[current] : null;
	const result = typeof current === 'string' ? results[current] : null;

	return (
		<div style={css.wrap}>
			<div style={css.title}>🧭 Мастер выбора движка</div>
			<div style={css.desc}>
				Ответьте на несколько вопросов — получите рекомендацию с командой для запуска.
			</div>

			{history.length > 0 && (
				<div style={css.breadcrumb}>
					<button style={css.crumb(true)} onClick={reset}>Начало</button>
					{history.map((h, i) => (
						<span key={i} style={{ display: 'contents' }}>
							<span style={css.arrow}>→</span>
							<button style={css.crumb(i < history.length - 1 || isResult)} onClick={() => goBack(i + 1)}>
								{h.choiceLabel}
							</button>
						</span>
					))}
				</div>
			)}

			{step && (
				<>
					<div style={css.question}>{step.question}</div>
					<div style={css.options}>
						{step.options.map((opt, i) => (
							<button
								key={i}
								style={css.option}
								onClick={() => handleChoice(opt.label, opt.next)}
								onMouseEnter={(e) => {
									e.currentTarget.style.borderColor = 'var(--accent)';
									e.currentTarget.style.transform = 'translateX(4px)';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.borderColor = 'var(--border)';
									e.currentTarget.style.transform = 'translateX(0)';
								}}
							>
								<span style={css.optionIcon}>{opt.icon}</span>
								{opt.label}
							</button>
						))}
					</div>
				</>
			)}

			{result && (
				<>
					<div style={css.result(result.color)}>
						<div style={css.resultEngine(result.color)}>→ {result.engine}</div>
						<div style={css.resultWhy}>{result.why}</div>
						<div style={css.resultMeta}>
							<span style={css.resultTag(result.color)}>Рекомендация</span>
							<span style={css.resultTag('#64748b')}>Альтернатива: {result.runner_up}</span>
						</div>
						<div style={css.resultCmd}>{result.cmd}</div>
					</div>
					<button
						style={css.resetBtn}
						onClick={reset}
						onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
						onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
					>
						🔄 Начать заново
					</button>
				</>
			)}
		</div>
	);
}
