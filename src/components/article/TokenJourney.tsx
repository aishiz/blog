import { useEffect, useRef, useState } from 'react';

// Реальный прогон Qwen3-0.6B (revision c1899de2, CPU, float32, transformers 5.21, torch 2.14.1).
// Всё ниже посчитано моделью, ничего не выдумано:
// - токены, id, топ-10 вероятностей и greedy-генерация;
// - VIZ.lens — logit lens: финальная RMSNorm + lm_head к выходу каждого из 28 слоёв на последней позиции,
//   [top1, p, p(итогового токена), top2, p, top3, p]; на 28-м слое совпадает с настоящим выходом;
// - VIZ.pParis — вероятность «Paris» (токены ' Paris' и 'Paris' вместе) после каждого слоя;
// - VIZ.temp — точный softmax(logits / T) по всему словарю для тех же топ-10 токенов;
// - VIZ.emb — первые 48 из 1024 чисел настоящих эмбеддингов токенов промпта.
// «Сырой текст» — промпт без chat template; «Чат» — шаблон Qwen3 с enable_thinking=False.
type Tok = [string, number];
type ModeKey = 'en' | 'ru' | 'chat';
type Mode = {
	label: string;
	text: string;
	pieces?: string[];
	ids?: number[];
	nPrompt: number;
	next: Tok[];
	greedy: Tok[];
	note: string;
	lensNote: string;
};

const VIZ: {
	temps: number[];
} & Record<ModeKey, { lens: (string | number)[][]; pParis: number[]; tempTokens: string[]; temp: number[][]; emb?: number[][] }> = {"temps": [0.3, 0.6, 1.0, 1.5, 2.0], "en": {"lens": [[" only", 0.1806, 0.0, " often", 0.1103, " indeed", 0.1], [" only", 0.1158, 0.0, " both", 0.0768, " indeed", 0.0762], [" not", 0.228, 0.0, " a", 0.1949, " the", 0.1158], [" not", 0.2359, 0.0, " both", 0.1737, " only", 0.0853], [" not", 0.5462, 0.0, " a", 0.1568, " both", 0.0285], [" not", 0.1633, 0.0, " a", 0.1373, " only", 0.0808], [" only", 0.3946, 0.0, " a", 0.2984, " the", 0.0866], [" a", 0.5481, 0.0, ",", 0.0862, " the", 0.0683], [" a", 0.5277, 0.0, " has", 0.102, ",", 0.0539], [" a", 0.4453, 0.0, ",", 0.3282, " ", 0.0686], [" a", 0.3803, 0.0, " ", 0.1825, ",", 0.1243], [" a", 0.2284, 0.0, ",", 0.1668, " ", 0.1576], [" a", 0.2072, 0.0, " ", 0.1576, " the", 0.1391], [" ", 0.1464, 0.0, " a", 0.144, " the", 0.1334], [" a", 0.3789, 0.0, " ", 0.1917, " the", 0.0735], [" ", 0.3081, 0.0, ",", 0.1791, " a", 0.0928], ["____", 0.199, 0.0, " a", 0.1722, ",", 0.1283], ["____", 0.7662, 0.0, "________", 0.0696, " ______", 0.0629], ["____", 0.7852, 0.0, " ______", 0.0609, " __", 0.0375], ["____", 0.687, 0.0, " ______", 0.1635, "________", 0.0367], ["____", 0.5589, 0.0, " ______", 0.3075, " __", 0.0442], ["____", 0.4514, 0.0128, " ______", 0.2538, " France", 0.0586], [" Paris", 0.551, 0.551, " city", 0.1264, " ______", 0.0704], [" Paris", 0.7919, 0.7919, "____", 0.0518, " France", 0.0343], [" Paris", 0.955, 0.955, "____", 0.0081, " city", 0.0064], [" Paris", 0.9637, 0.9637, "____", 0.0043, " ______", 0.0028], [" Paris", 0.9227, 0.9227, " France", 0.014, " ", 0.0034], [" Paris", 0.6569, 0.6569, " located", 0.0278, " the", 0.0235]], "tempTokens": [" Paris", " located", " the", "...", " ____", " ", " ______", " in", " a", " Vers"], "temp": [[0.99994, 3e-05, 2e-05, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.97518, 0.00502, 0.00379, 0.00194, 0.00156, 0.00145, 0.00137, 0.00109, 0.00072, 0.0007], [0.65693, 0.02782, 0.02352, 0.01572, 0.01378, 0.01321, 0.01278, 0.01114, 0.00867, 0.00853], [0.15365, 0.01867, 0.01669, 0.01276, 0.01169, 0.01136, 0.01112, 0.01014, 0.00858, 0.00849], [0.02826, 0.00582, 0.00535, 0.00437, 0.00409, 0.00401, 0.00394, 0.00368, 0.00325, 0.00322]], "emb": [[-0.002, 0.017, -0.044, 0.015, 0.007, 0.008, -0.002, 0.025, -0.041, 0.037, -0.039, 0.005, 0.021, -0.05, -0.051, 0.018, -0.028, 0.025, 0.009, 0.005, -0.016, -0.001, 0.004, 0.053, -0.013, -0.001, 0.004, 0.025, -0.014, 0.03, 0.007, 0.011, 0.012, -0.041, -0.014, -0.052, 0.011, -0.021, 0.038, 0.01, -0.0, 0.009, -0.002, 0.006, 0.008, 0.039, -0.024, 0.03], [0.017, -0.075, 0.015, 0.027, 0.017, -0.052, 0.021, -0.014, 0.015, -0.024, -0.0, 0.017, 0.018, -0.001, -0.026, -0.016, -0.03, -0.005, -0.006, -0.003, 0.04, -0.011, 0.062, 0.036, -0.004, -0.03, -0.032, -0.066, 0.033, -0.012, 0.014, -0.025, -0.015, 0.009, 0.013, -0.018, 0.015, 0.012, -0.047, 0.031, 0.011, 0.037, -0.085, -0.022, -0.022, -0.065, 0.007, 0.032], [0.032, 0.026, -0.029, -0.013, -0.004, 0.023, 0.023, -0.032, -0.029, 0.032, -0.031, -0.023, 0.025, -0.029, -0.043, 0.015, -0.01, 0.003, 0.007, -0.024, -0.017, -0.013, 0.007, -0.011, -0.019, 0.009, -0.044, -0.054, 0.03, 0.029, 0.042, 0.033, 0.025, -0.026, 0.026, -0.033, 0.033, -0.058, -0.01, 0.026, 0.008, -0.033, -0.035, 0.007, -0.026, 0.014, -0.035, -0.005], [0.0, -0.017, 0.031, 0.053, -0.012, -0.051, 0.019, 0.012, 0.035, 0.015, 0.021, -0.024, 0.023, 0.007, 0.023, -0.012, 0.006, 0.026, -0.015, -0.015, 0.04, -0.018, 0.008, 0.041, 0.013, 0.045, 0.036, -0.068, 0.02, -0.058, 0.025, 0.018, 0.024, 0.064, -0.008, -0.0, 0.031, 0.015, 0.015, -0.017, 0.011, -0.001, -0.062, 0.027, 0.006, -0.012, 0.063, 0.021], [0.019, 0.021, -0.054, -0.04, -0.021, 0.023, -0.021, -0.033, -0.018, 0.033, -0.039, 0.025, 0.029, -0.055, -0.052, 0.041, 0.005, -0.029, -0.004, -0.018, 0.012, -0.002, 0.002, 0.01, 0.018, 0.008, 0.02, -0.047, 0.018, 0.016, 0.026, 0.043, 0.025, 0.014, -0.03, -0.041, -0.026, 0.029, -0.02, -0.001, 0.015, -0.033, -0.006, -0.028, -0.019, 0.017, 0.03, -0.014]], "pParis": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0128, 0.5524, 0.7936, 0.9558, 0.9648, 0.9252, 0.658]}, "ru": {"lens": [["Μ", 0.0751, 0.0, "ыва", 0.0647, "ा�", 0.0548], ["学习", 0.0455, 0.0, "对", 0.0375, " extracting", 0.0272], [" extracting", 0.1341, 0.0, "ahoo", 0.0334, "学习", 0.0307], [" God", 0.0574, 0.0, "ogy", 0.0236, "oss", 0.0218], [" God", 0.3508, 0.0, " bi", 0.1218, "|--", 0.0462], ["ifact", 0.0717, 0.0, " bi", 0.0677, " best", 0.0672], [" God", 0.1692, 0.0, " \"", 0.0421, " believed", 0.0356], [" God", 0.187, 0.0, " is", 0.0744, " a", 0.0714], [" \"", 0.2743, 0.0, " a", 0.1603, " E", 0.0826], [" a", 0.2272, 0.0, " the", 0.117, " is", 0.0775], [" ", 0.5316, 0.0, " a", 0.1167, " the", 0.0375], [" Bl", 0.4021, 0.0, " ", 0.1503, " the", 0.0886], [" a", 0.2565, 0.0, " Bl", 0.1423, " ", 0.0977], [" a", 0.2884, 0.0, " the", 0.0563, " ", 0.0529], [" ", 0.2503, 0.0, " a", 0.187, " -", 0.061], [" ", 0.3242, 0.0, "–", 0.0962, " a", 0.0878], [" Mil", 0.1372, 0.0, " ", 0.1034, " Mir", 0.0893], [" \"", 0.1375, 0.0, " Bl", 0.0939, "_", 0.0605], [" ", 0.4059, 0.0, " ", 0.2703, " \n", 0.0484], [" ", 0.6817, 0.0001, " \n\n", 0.1151, " \n", 0.0255], [" ", 0.6127, 0.0008, " Europe", 0.0696, "首都", 0.0216], [" ", 0.4714, 0.0114, " ", 0.1199, " Europe", 0.0534], [" city", 0.2441, 0.0059, " Paris", 0.1435, " City", 0.0852], [" Paris", 0.2825, 0.0493, " city", 0.0939, " это", 0.0493], [" Paris", 0.1911, 0.0196, " city", 0.1115, " г", 0.0319], [" Paris", 0.0939, 0.0325, " city", 0.0393, " это", 0.0325], [" г", 0.0708, 0.0212, " Б", 0.0428, " с", 0.0424], [" это", 0.1351, 0.1351, " Б", 0.0942, " П", 0.061]], "tempTokens": [" это", " Б", " П", " Е", " Г", " М", " город", " С", " в", " Р"], "temp": [[0.6932, 0.20861, 0.04897, 0.01491, 0.00972, 0.00549, 0.00511, 0.00496, 0.00163, 0.00124], [0.34877, 0.19133, 0.0927, 0.05115, 0.04129, 0.03104, 0.02993, 0.02952, 0.01692, 0.01474], [0.13505, 0.0942, 0.06099, 0.04268, 0.03754, 0.03163, 0.03095, 0.03069, 0.02198, 0.02024], [0.03394, 0.02669, 0.01998, 0.01575, 0.01446, 0.0129, 0.01271, 0.01264, 0.01012, 0.00958], [0.00814, 0.0068, 0.00547, 0.00458, 0.00429, 0.00394, 0.0039, 0.00388, 0.00329, 0.00315]], "emb": [[0.029, -0.033, 0.029, 0.017, -0.03, -0.023, 0.014, 0.077, -0.044, -0.008, 0.054, 0.014, 0.01, 0.005, 0.01, -0.045, 0.008, 0.057, -0.005, -0.033, 0.045, -0.01, -0.026, 0.059, 0.026, 0.084, 0.026, -0.041, 0.005, -0.04, -0.024, -0.012, -0.062, -0.012, 0.049, 0.028, -0.006, -0.006, -0.062, -0.02, 0.026, -0.046, -0.008, 0.037, -0.048, 0.015, 0.039, 0.043], [0.03, -0.04, -0.002, 0.058, 0.021, 0.003, 0.01, 0.075, 0.002, -0.068, -0.017, 0.032, 0.016, 0.006, 0.048, 0.033, -0.014, 0.023, 0.037, -0.043, -0.008, 0.051, -0.004, 0.059, 0.017, 0.018, 0.009, -0.056, 0.019, 0.025, 0.01, -0.03, -0.029, 0.028, 0.015, -0.004, 0.021, -0.006, 0.013, 0.04, 0.027, 0.021, -0.003, -0.0, -0.06, 0.021, -0.014, 0.004], [-0.001, -0.045, -0.055, 0.007, -0.021, 0.022, 0.006, 0.06, -0.003, -0.06, 0.025, -0.031, 0.024, -0.033, -0.04, -0.004, -0.01, 0.005, 0.036, -0.015, -0.034, 0.057, 0.064, 0.058, -0.006, -0.019, 0.056, -0.037, -0.005, 0.052, 0.018, 0.011, -0.023, -0.02, -0.062, -0.052, 0.009, 0.023, -0.009, -0.021, 0.003, 0.003, 0.003, 0.039, -0.067, 0.037, -0.031, 0.058], [-0.031, -0.047, -0.025, 0.058, 0.014, -0.017, 0.045, 0.064, -0.073, -0.009, 0.034, -0.004, 0.064, -0.013, 0.013, 0.024, -0.009, -0.007, 0.01, -0.032, -0.029, -0.013, 0.022, 0.048, -0.006, 0.008, 0.013, -0.065, -0.017, -0.029, 0.005, 0.005, -0.06, 0.004, -0.007, -0.066, -0.037, 0.028, 0.062, -0.004, 0.032, 0.001, -0.024, 0.027, -0.007, 0.0, -0.022, 0.015], [-0.014, -0.021, 0.019, 0.027, 0.019, 0.024, -0.001, 0.021, -0.028, -0.004, 0.006, -0.004, -0.011, 0.005, -0.001, -0.033, 0.001, 0.026, -0.019, -0.01, -0.007, -0.002, -0.021, 0.018, 0.024, -0.016, 0.013, -0.058, -0.013, -0.023, 0.004, -0.02, -0.035, -0.017, 0.006, 0.014, -0.003, -0.01, -0.024, 0.008, 0.041, -0.008, -0.02, 0.017, -0.049, -0.0, -0.006, 0.019], [-0.09, -0.043, 0.05, 0.031, 0.013, 0.013, 0.023, 0.058, -0.019, -0.034, 0.048, 0.019, 0.015, -0.016, -0.01, 0.037, 0.007, -0.001, 0.028, -0.009, -0.003, 0.031, -0.018, 0.055, -0.077, -0.011, 0.003, -0.06, 0.024, 0.016, -0.008, 0.007, -0.044, 0.013, -0.016, -0.002, 0.023, 0.037, -0.042, -0.021, 0.033, -0.012, -0.012, 0.027, -0.011, 0.009, 0.006, 0.018], [-0.007, -0.054, -0.019, 0.028, -0.016, 0.004, 0.063, 0.062, -0.064, -0.037, 0.053, -0.014, 0.056, 0.032, 0.006, -0.012, -0.018, 0.026, -0.018, -0.012, 0.043, 0.04, -0.018, 0.05, -0.028, 0.005, 0.017, -0.068, 0.02, 0.002, -0.006, -0.005, -0.075, -0.031, 0.019, -0.077, 0.002, -0.008, 0.018, 0.043, 0.007, 0.02, -0.015, -0.01, -0.017, -0.001, -0.001, 0.013], [0.044, -0.005, -0.021, 0.05, 0.025, -0.014, -0.006, -0.003, -0.057, 0.048, -0.01, -0.02, 0.036, -0.043, -0.081, 0.028, -0.01, -0.035, 0.006, 0.035, -0.035, -0.053, -0.014, -0.02, -0.018, -0.084, 0.052, -0.031, -0.021, 0.095, -0.009, 0.001, 0.005, -0.056, -0.034, -0.044, 0.034, 0.009, 0.009, 0.024, -0.025, -0.006, 0.002, 0.049, -0.011, 0.016, -0.023, -0.029]], "pParis": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0001, 0.0055, 0.0241, 0.1439, 0.2837, 0.1918, 0.0945, 0.0181, 0.0052]}, "chat": {"lens": [[" internally", 0.0257, 0.0, " addresses", 0.0151, " language", 0.0151], ["-the", 0.0383, 0.0, "-depth", 0.0272, " organization", 0.0252], ["nation", 0.0384, 0.0, "no", 0.0329, "lib", 0.0315], ["no", 0.1979, 0.0, "nts", 0.0652, "nation", 0.0433], ["no", 0.3489, 0.0, "###", 0.0466, "مي", 0.0401], ["no", 0.0735, 0.0, "nts", 0.0278, "ate", 0.0275], ["anse", 0.0286, 0.0, "no", 0.0247, "acing", 0.0187], ["ح", 0.0465, 0.0, "أ", 0.0253, "nts", 0.0244], ["1", 0.061, 0.0, "unction", 0.0444, "nts", 0.0363], ["advance", 0.0372, 0.0, "ierte", 0.0301, " Independent", 0.0288], ["is", 0.2846, 0.0, "1", 0.212, "any", 0.0139], ["is", 0.3082, 0.0, "1", 0.2339, "s", 0.0269], ["<|endoftext|>", 0.2876, 0.0, "1", 0.2492, "is", 0.1296], ["1", 0.1727, 0.0, "<|endoftext|>", 0.1715, "is", 0.1493], ["s", 0.1953, 0.0, "1", 0.1328, "<|endoftext|>", 0.0815], ["<|endoftext|>", 0.1531, 0.0, "s", 0.1473, "any", 0.1309], ["1", 0.4079, 0.0, "2", 0.1073, "3", 0.0887], ["None", 0.2687, 0.0, "name", 0.125, "<|endoftext|>", 0.1193], ["<|endoftext|>", 0.9908, 0.0, " ", 0.0033, "1", 0.0016], ["<|endoftext|>", 0.3681, 0.0013, " ", 0.1722, "is", 0.083], [" ", 0.1725, 0.0004, " Paris", 0.1113, "Paris", 0.1025], ["France", 0.7432, 0.0, " Paris", 0.1099, "Paris", 0.0951], ["Paris", 0.4534, 0.0, " Paris", 0.3839, "巴黎", 0.0851], ["Paris", 0.3646, 0.0, " Paris", 0.3307, "France", 0.1662], [" Paris", 0.5031, 0.0001, "Paris", 0.3003, "巴黎", 0.1713], ["Paris", 0.4017, 0.0011, " Paris", 0.3561, "巴黎", 0.1795], ["Paris", 0.5547, 0.0561, " Paris", 0.1214, "П", 0.0561], ["П", 0.3481, 0.3481, "Ф", 0.1882, "М", 0.091]], "tempTokens": ["П", "Ф", "М", "С", "Р", "Paris", "Б", "В", "Г", "Л"], "temp": [[0.86817, 0.11171, 0.00991, 0.00556, 0.00229, 0.00131, 0.00046, 0.00044, 0.00011, 2e-05], [0.58487, 0.2098, 0.06248, 0.04682, 0.03006, 0.0227, 0.01342, 0.01314, 0.00647, 0.00287], [0.34813, 0.18819, 0.09098, 0.07652, 0.05866, 0.04955, 0.03616, 0.03571, 0.02334, 0.01433], [0.18091, 0.12005, 0.07395, 0.06589, 0.05519, 0.04932, 0.03997, 0.03964, 0.02985, 0.02156], [0.06581, 0.04839, 0.03365, 0.03085, 0.02701, 0.02483, 0.02121, 0.02108, 0.01704, 0.01335]], "pParis": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0027, 0.2137, 0.205, 0.8373, 0.6953, 0.8035, 0.7578, 0.6761, 0.0496]}};

const MODES: Record<ModeKey, Mode> = {
	en: {
		label: 'Сырой текст, EN',
		text: 'The capital of France is',
		pieces: ['The', ' capital', ' of', ' France', ' is'],
		ids: [785, 6722, 315, 9625, 374],
		nPrompt: 5,
		next: [[' Paris', 0.65694], [' located', 0.02782], [' the', 0.02352], ['...', 0.01572], [' ____', 0.01378], [' ', 0.01321], [' ______', 0.01278], [' in', 0.01114], [' a', 0.00867], [' Vers', 0.00853]],
		greedy: [[' Paris', 0.65694], ['.', 0.50938], [' The', 0.27988], [' capital', 0.67805], [' of', 0.89404], [' Italy', 0.16932], [' is', 0.98537], [' Rome', 0.91501], ['.', 0.95037], [' The', 0.5894]],
		note: 'Модель без чата просто продолжает текст. Ответила «Paris», а дальше сама себе придумала следующий вопрос про Италию.',
		lensNote: 'До 22-го слоя наверху мусор вроде « a» и «____». На 23-м резко всплывает « Paris», к 26-му его вероятность доходит до 96%.',
	},
	ru: {
		label: 'Сырой текст, RU',
		text: 'Столица Франции —',
		pieces: ['Ст', 'ол', 'и', 'ца', ' Ф', 'ран', 'ции', ' —'],
		ids: [73498, 7819, 1802, 86894, 66791, 34582, 56086, 1959],
		nPrompt: 8,
		next: [[' это', 0.13505], [' Б', 0.0942], [' П', 0.06098], [' Е', 0.04268], [' Г', 0.03754], [' М', 0.03163], [' город', 0.03095], [' С', 0.03069], [' в', 0.02198], [' Р', 0.02024]],
		greedy: [[' это', 0.13505], [' город', 0.12744], [',', 0.13918], [' где', 0.35966], [' находится', 0.04024], [' больш', 0.04569], ['ая', 0.79107], [' часть', 0.94555], [' населения', 0.16326], [' Ф', 0.24675]],
		note: 'По-русски маленькая модель не уверена: лидер всего 13,5%, и это не «Париж», а « это». Дальше её уносит в рассуждения.',
		lensNote: 'Промпт русский, но к 24-му слою английский «Paris» набирает 28%. На последних слоях он падает до 0,5%, а наверх выходит русское « это».',
	},
	chat: {
		label: 'Чат, RU',
		text: '<|im_start|>user\nКакая столица Франции? Ответь одним словом.<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n',
		nPrompt: 28,
		next: [['П', 0.34813], ['Ф', 0.18819], ['М', 0.09098], ['С', 0.07652], ['Р', 0.05866], ['Paris', 0.04955], ['Б', 0.03616], ['В', 0.03571], ['Г', 0.02334], ['Л', 0.01433]],
		greedy: [['П', 0.34813], ['ари', 0.90141], ['ж', 0.85852], ['<|im_end|>', 0.69629]],
		note: 'С шаблоном чата модель понимает, что от неё ждут ответа. «Париж» собирается из трёх токенов, а <|im_end|> значит «я закончила».',
		lensNote: 'На 23-м слое английский «Paris» набирает 84%. К последнему слою он падает до 5%, а наверх выходит русское «П» с 35%.',
	},
};

const VOCAB = 151936;
const HIDDEN = 1024;
const LAYERS = 28;

const STAGES = [
	{ name: 'Токены', shape: (n: number) => `[${n}]` },
	{ name: 'Векторы', shape: (n: number) => `[${n}×${HIDDEN}]` },
	{ name: '28 слоёв', shape: (n: number) => `[${n}×${HIDDEN}]` },
	{ name: 'Логиты', shape: () => `[${VOCAB.toLocaleString('ru-RU')}]` },
	{ name: 'Вероятности', shape: () => 'softmax' },
	{ name: 'Цикл', shape: () => '+1 токен' },
];

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
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 } as React.CSSProperties,
	tabs: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' as const, marginBottom: '0.9rem' } as React.CSSProperties,
	chip: (active: boolean) =>
		({
			padding: '0.35rem 0.7rem',
			borderRadius: '8px',
			border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
			background: active ? 'var(--bg-secondary)' : 'transparent',
			color: active ? 'var(--text)' : 'var(--text-secondary)',
			fontSize: '0.78rem',
			fontWeight: 700,
			cursor: 'pointer',
		}) as React.CSSProperties,
	pipe: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(92px, 1fr))', gap: '0.35rem', marginBottom: '1rem' } as React.CSSProperties,
	stage: (active: boolean, done: boolean) =>
		({
			position: 'relative' as const,
			padding: '0.45rem 0.4rem',
			borderRadius: '8px',
			border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
			background: active ? 'var(--bg-secondary)' : 'transparent',
			cursor: 'pointer',
			textAlign: 'center' as const,
			opacity: active || done ? 1 : 0.65,
			transition: 'all 0.15s ease',
			boxShadow: active ? '0 0 0 1px var(--accent)' : 'none',
		}) as React.CSSProperties,
	stageNum: (active: boolean) =>
		({ fontSize: '0.66rem', fontWeight: 800, color: active ? 'var(--accent)' : 'var(--text-muted)' }) as React.CSSProperties,
	stageName: { fontSize: '0.78rem', fontWeight: 800, color: 'var(--text)' } as React.CSSProperties,
	stageShape: { fontSize: '0.66rem', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: 'var(--text-secondary)', marginTop: '0.15rem' } as React.CSSProperties,
	panel: {
		padding: '0.9rem 1rem',
		borderRadius: '8px',
		background: 'var(--bg-secondary)',
		border: '1px solid var(--border)',
		minHeight: '220px',
	} as React.CSSProperties,
	h: { fontSize: '0.9rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.5rem' } as React.CSSProperties,
	p: { fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0.5rem 0' } as React.CSSProperties,
	toks: { display: 'flex', flexWrap: 'wrap' as const, gap: '0.35rem', margin: '0.5rem 0' } as React.CSSProperties,
	tok: (fresh = false) =>
		({
			display: 'inline-flex',
			flexDirection: 'column' as const,
			alignItems: 'center',
			padding: '0.25rem 0.45rem',
			borderRadius: '6px',
			border: `1px solid ${fresh ? 'var(--accent-magenta)' : 'var(--accent)'}`,
			background: 'var(--bg-card)',
			animation: fresh ? 'tjPop 0.25s ease' : undefined,
		}) as React.CSSProperties,
	tokText: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.82rem', color: 'var(--text)', whiteSpace: 'pre' as const } as React.CSSProperties,
	tokId: { fontSize: '0.66rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties,
	code: {
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
		fontSize: '0.76rem',
		color: 'var(--text)',
		background: 'var(--bg-card)',
		border: '1px solid var(--border)',
		borderRadius: '6px',
		padding: '0.5rem 0.6rem',
		whiteSpace: 'pre-wrap' as const,
		overflowWrap: 'anywhere' as const,
		margin: '0.5rem 0',
	} as React.CSSProperties,
	shape: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent)' } as React.CSSProperties,
	row: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' } as React.CSSProperties,
	label: {
		width: '96px',
		flexShrink: 0,
		fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
		fontSize: '0.78rem',
		color: 'var(--text)',
		whiteSpace: 'pre' as const,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
	} as React.CSSProperties,
	track: { flex: 1, height: '12px', borderRadius: '4px', background: 'var(--bg-card)', overflow: 'hidden' } as React.CSSProperties,
	fill: (pct: number, top: boolean) =>
		({ width: `${pct}%`, height: '100%', background: top ? 'var(--accent)' : 'var(--accent-secondary)', transition: 'width 0.25s ease' }) as React.CSSProperties,
	val: { width: '56px', flexShrink: 0, fontSize: '0.74rem', textAlign: 'right' as const, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties,
	legend: { display: 'flex', gap: '1rem', flexWrap: 'wrap' as const, fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '0.3rem 0' } as React.CSSProperties,
	swatch: (c: string) =>
		({ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', background: c, marginRight: '0.35rem', verticalAlign: 'middle' }) as React.CSSProperties,
	ctl: { display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0.4rem 0 0.8rem' } as React.CSSProperties,
	ctlLabel: { flexShrink: 0, fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' } as React.CSSProperties,
	slider: { flex: 1, minWidth: 0, accentColor: 'var(--accent)' } as React.CSSProperties,
	ctlVal: { width: '48px', flexShrink: 0, fontSize: '0.82rem', fontWeight: 800, textAlign: 'right' as const, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties,
	heat: { display: 'grid', gap: '2px', margin: '0.5rem 0' } as React.CSSProperties,
	heatRow: { display: 'flex', alignItems: 'center', gap: '0.4rem' } as React.CSSProperties,
	heatLabel: { width: '64px', flexShrink: 0, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.74rem', color: 'var(--text)', whiteSpace: 'pre' as const, overflow: 'hidden', textOverflow: 'ellipsis' } as React.CSSProperties,
	heatCells: { flex: 1, display: 'grid', gridTemplateColumns: 'repeat(48, 1fr)', gap: '1px', minWidth: 0 } as React.CSSProperties,
	btn: {
		padding: '0.4rem 0.9rem',
		borderRadius: '8px',
		border: '1px solid var(--accent)',
		background: 'transparent',
		color: 'var(--text)',
		fontSize: '0.8rem',
		fontWeight: 800,
		cursor: 'pointer',
	} as React.CSSProperties,
	nav: { display: 'flex', justifyContent: 'space-between', marginTop: '0.8rem' } as React.CSSProperties,
	navBtn: (disabled: boolean) =>
		({
			padding: '0.4rem 0.8rem',
			borderRadius: '8px',
			border: '1px solid var(--border)',
			background: 'transparent',
			color: disabled ? 'var(--text-muted)' : 'var(--text)',
			fontSize: '0.8rem',
			fontWeight: 700,
			cursor: disabled ? 'default' : 'pointer',
			opacity: disabled ? 0.5 : 1,
		}) as React.CSSProperties,
	note: { marginTop: '0.9rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 } as React.CSSProperties,
};

const pct = (p: number) => `${(p * 100).toFixed(p >= 0.1 ? 1 : p >= 0.001 ? 2 : 3).replace('.', ',')}%`;
const show = (s: string) => s.replace(/ /g, '␣').replace(/\n/g, '⏎').replace(/ /g, '⍽');
const num = (n: number) => n.toLocaleString('ru-RU');

function TokenChips({ m }: { m: Mode }) {
	if (!m.pieces) {
		return (
			<>
				<div style={css.code}>{m.text}</div>
				<div style={css.p}>
					Шаблон чата — тоже просто текст. Роли написаны словами, а <code>&lt;|im_start|&gt;</code> и{' '}
					<code>&lt;|im_end|&gt;</code> — специальные токены (151644 и 151645). Всего {m.nPrompt} токенов.
				</div>
			</>
		);
	}
	return (
		<>
			<div style={css.toks}>
				{m.pieces.map((p, i) => (
					<span key={i} style={css.tok()}>
						<span style={css.tokText}>{show(p)}</span>
						<span style={css.tokId}>{m.ids![i]}</span>
					</span>
				))}
			</div>
			<div style={css.p}>
				«{m.text}» — {m.nPrompt} токенов. Под каждым куском его номер в словаре. Знак ␣ — пробел, он приклеен к
				началу токена.
			</div>
		</>
	);
}

// Цвет клетки эмбеддинга: знак — оттенок, модуль — непрозрачность. Максимум |x| в данных около 0,095.
function cell(x: number): React.CSSProperties {
	const a = Math.min(1, Math.abs(x) / 0.06);
	return { height: '14px', borderRadius: '2px', background: x >= 0 ? 'var(--accent)' : 'var(--accent-secondary)', opacity: 0.12 + a * 0.88 };
}

function Embeddings({ m, k }: { m: Mode; k: ModeKey }) {
	const emb = VIZ[k].emb;
	return (
		<>
			<div style={css.h}>2. Каждый id превращается в вектор</div>
			<div style={css.p}>
				У модели есть таблица <span style={css.shape}>{num(VOCAB)} × {num(HIDDEN)}</span>: по строке на каждый токен
				словаря, это {num(VOCAB * HIDDEN)} параметров. Берём строки с нашими id:{' '}
				<span style={css.shape}>[{m.nPrompt}]</span> → <span style={css.shape}>[{m.nPrompt} × {HIDDEN}]</span>.
			</div>
			{emb ? (
				<>
					<div style={css.heat}>
						{emb.map((row, i) => (
							<div key={i} style={css.heatRow}>
								<span style={css.heatLabel}>{show(m.pieces![i])}</span>
								<div style={css.heatCells}>
									{row.map((x, j) => <span key={j} style={cell(x)} title={x.toFixed(3)} />)}
								</div>
							</div>
						))}
					</div>
					<div style={css.p}>
						Это настоящие первые 48 чисел из 1024 у каждого вектора: оранжевое — плюс, фиолетовое — минус. У каждого
						токена свой узор, но читать его глазами бессмысленно. Пока вектор знает только «какой я токен», без
						контекста.
					</div>
				</>
			) : (
				<div style={css.p}>У чата 28 токенов, картинка была бы слишком длинной. Переключись на «Сырой текст», там видно векторы.</div>
			)}
		</>
	);
}

function LogitLens({ m, k }: { m: Mode; k: ModeKey }) {
	const lens = VIZ[k].lens;
	const [layer, setLayer] = useState(LAYERS);
	const L = lens[layer - 1];
	const W = 560;
	const H = 150;
	const pad = { l: 44, r: 10, t: 10, b: 24 };
	const x = (l: number) => pad.l + ((l - 1) / (LAYERS - 1)) * (W - pad.l - pad.r);
	const y = (p: number) => pad.t + (1 - p) * (H - pad.t - pad.b);
	const pts = lens.map((r, i) => `${x(i + 1)},${y(r[2] as number)}`).join(' ');
	const pParis = VIZ[k].pParis;
	const ptsParis = pParis.map((p, i) => `${x(i + 1)},${y(p)}`).join(' ');
	const sameAsFinal = k === 'en';
	return (
		<>
			<div style={css.h}>3. Векторы проходят {LAYERS} слоёв</div>
			<div style={css.p}>
				В каждом слое: нормализация → <strong>attention</strong> → прибавить к вектору; нормализация → <strong>MLP</strong> →
				прибавить к вектору. Форма не меняется, <span style={css.shape}>[{m.nPrompt} × {HIDDEN}]</span>, меняется
				содержимое.
			</div>
			<div style={css.p}>
				Подсмотрим, что модель «сказала бы», если бы её оборвали после слоя N (это приём logit lens).
				{sameAsFinal ? ' Линия — вероятность итогового « Paris».' : ' Две линии: английский «Paris» и то, что модель выдаёт на самом деле.'}
			</div>
			<svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img"
				aria-label="Вероятность итогового токена после каждого слоя">
				{[0, 0.5, 1].map((p) => (
					<g key={p}>
						<line x1={pad.l} x2={W - pad.r} y1={y(p)} y2={y(p)} stroke="var(--border)" />
						<text x={pad.l - 6} y={y(p) + 4} textAnchor="end" fontSize={12} fill="var(--text-muted)">{p * 100}%</text>
					</g>
				))}
				{[1, 7, 14, 21, 28].map((l) => (
					<text key={l} x={x(l)} y={H - 6} textAnchor="middle" fontSize={12} fill="var(--text-muted)">{l}</text>
				))}
				<line x1={x(layer)} x2={x(layer)} y1={pad.t} y2={H - pad.b} stroke="var(--accent-magenta)" strokeDasharray="3 3" />
				{!sameAsFinal && <polyline fill="none" stroke="var(--accent-secondary)" strokeWidth={2.5} points={ptsParis} />}
				<polyline fill="none" stroke="var(--accent)" strokeWidth={2.5} points={pts} />
				{lens.map((r, i) => (
					<rect key={i} x={x(i + 1) - 9} y={pad.t} width={18} height={H - pad.t - pad.b} fill="transparent"
						style={{ cursor: 'pointer' }} onMouseEnter={() => setLayer(i + 1)} onClick={() => setLayer(i + 1)} />
				))}
				{!sameAsFinal && <circle cx={x(layer)} cy={y(pParis[layer - 1])} r={5} fill="var(--accent-secondary)" pointerEvents="none" />}
				<circle cx={x(layer)} cy={y(L[2] as number)} r={5} fill="var(--accent)" pointerEvents="none" />
			</svg>
			<div style={css.legend}>
				<span><span style={css.swatch('var(--accent)')} />итоговый «{show(m.next[0][0])}»: {pct(L[2] as number)}</span>
				{!sameAsFinal && <span><span style={css.swatch('var(--accent-secondary)')} />английский «Paris»: {pct(pParis[layer - 1])}</span>}
			</div>
			<div style={css.ctl}>
				<span style={css.ctlLabel}>слой</span>
				<input style={css.slider} type="range" min={1} max={LAYERS} step={1} value={layer} onChange={(e) => setLayer(Number(e.target.value))} />
				<span style={css.ctlVal}>{layer}</span>
			</div>
			<div style={css.toks}>
				{[0, 3, 5].map((o) => (
					<span key={o} style={css.tok(o === 0)}>
						<span style={css.tokText}>{show(L[o] as string)}</span>
						<span style={css.tokId}>{pct(L[o + 1] as number)}</span>
					</span>
				))}
			</div>
			<div style={css.p}>{m.lensNote}</div>
		</>
	);
}

function Probs({ m, k }: { m: Mode; k: ModeKey }) {
	const [ti, setTi] = useState(VIZ.temps.indexOf(1));
	const toks = VIZ[k].tempTokens;
	const probs = VIZ[k].temp[ti];
	const max = Math.max(...probs);
	const sum = probs.reduce((s, p) => s + p, 0);
	return (
		<>
			<div style={css.h}>5. Softmax → вероятности</div>
			<div style={css.ctl}>
				<span style={css.ctlLabel}>temperature</span>
				<input style={css.slider} type="range" min={0} max={VIZ.temps.length - 1} step={1} value={ti} onChange={(e) => setTi(Number(e.target.value))} />
				<span style={css.ctlVal}>{String(VIZ.temps[ti]).replace('.', ',')}</span>
			</div>
			{toks.map((t, i) => (
				<div key={i} style={css.row}>
					<span style={css.label} title={t}>{show(t)}</span>
					<div style={css.track}><div style={css.fill((probs[i] / max) * 100, i === 0)} /></div>
					<span style={css.val}>{pct(probs[i])}</span>
				</div>
			))}
			<div style={css.p}>
				Настоящие вероятности Qwen3-0.6B, топ-10 из {num(VOCAB)}, в сумме {pct(sum)}. Temperature делит логиты перед
				softmax: меньше 1 — лидер забирает почти всё, больше 1 — распределение расплывается по хвосту.
			</div>
		</>
	);
}

function Generate({ m }: { m: Mode }) {
	const [shown, setShown] = useState(m.greedy.length);
	const timer = useRef<number | null>(null);
	useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);
	useEffect(() => setShown(m.greedy.length), [m]);
	const play = () => {
		if (timer.current) window.clearInterval(timer.current);
		setShown(0);
		let i = 0;
		timer.current = window.setInterval(() => {
			i += 1;
			setShown(i);
			if (i >= m.greedy.length && timer.current) window.clearInterval(timer.current);
		}, 450);
	};
	const prompt = m.pieces ? m.text : '…<|im_start|>assistant\n';
	return (
		<>
			<div style={css.h}>6. Выбрали токен — и всё сначала</div>
			<div style={css.code}>
				<span style={{ color: 'var(--text-muted)' }}>{prompt}</span>
				<span style={{ color: 'var(--accent)' }}>{m.greedy.slice(0, shown).map(([t]) => t).join('')}</span>
				<span style={{ color: 'var(--accent-magenta)' }}>▍</span>
			</div>
			<div style={css.toks}>
				{m.greedy.slice(0, shown).map(([t, p], i) => (
					<span key={i} style={css.tok(i === shown - 1)}>
						<span style={css.tokText}>{show(t)}</span>
						<span style={css.tokId}>{pct(p)}</span>
					</span>
				))}
			</div>
			<button style={css.btn} onClick={play}>▶ сгенерировать заново</button>
			<div style={css.p}>
				Каждый кубик — отдельный проход модели. Берём самый вероятный токен (greedy), дописываем в конец и считаем снова.
				Под токеном — его вероятность в момент выбора. {m.note}
			</div>
		</>
	);
}

export default function TokenJourney() {
	const [mode, setMode] = useState<ModeKey>('en');
	const [step, setStep] = useState(0);
	const m = MODES[mode];
	const max = m.next[0][1];

	const body = [
		<>
			<div style={css.h}>1. Текст режется на токены</div>
			<TokenChips m={m} />
		</>,
		<Embeddings m={m} k={mode} />,
		<LogitLens key={mode} m={m} k={mode} />,
		<>
			<div style={css.h}>4. Вектор → оценка для каждого токена словаря</div>
			<div style={css.p}>
				После финальной нормализации вектор последнего токена умножается на ту же таблицу из шага 2 (у Qwen3-0.6B она
				общая) и даёт <span style={css.shape}>{num(VOCAB)}</span> чисел — логитов, по одному на каждый возможный токен.
			</div>
			{m.next.slice(0, 5).map(([t, p], i) => (
				<div key={i} style={css.row}>
					<span style={css.label}>{show(t)}</span>
					<div style={css.track}><div style={css.fill((p / max) * 100, i === 0)} /></div>
					<span style={css.val}>№{i + 1}</span>
				</div>
			))}
			<div style={css.p}>Логиты сами по себе — просто оценки «за» и «против». В вероятности их превратит softmax на следующем шаге.</div>
		</>,
		<Probs key={mode} m={m} k={mode} />,
		<Generate m={m} />,
	];

	return (
		<div style={css.wrap}>
			<style>{'@keyframes tjPop{from{transform:scale(0.6);opacity:0}to{transform:scale(1);opacity:1}}'}</style>
			<div style={css.title}>🧭 Путь одного токена через Qwen3-0.6B</div>
			<div style={css.desc}>
				Всё ниже посчитано настоящей моделью Qwen3-0.6B: токены, векторы, вероятности по слоям. Выбери промпт и кликай по
				шагам конвейера.
			</div>
			<div style={css.tabs}>
				{(Object.keys(MODES) as ModeKey[]).map((k) => (
					<button key={k} style={css.chip(mode === k)} onClick={() => setMode(k)}>{MODES[k].label}</button>
				))}
			</div>
			<div style={css.pipe}>
				{STAGES.map((s, i) => (
					<button key={s.name} style={css.stage(i === step, i < step)} onClick={() => setStep(i)}>
						<div style={css.stageNum(i === step)}>{i + 1} {i < STAGES.length - 1 ? '→' : '↺'}</div>
						<div style={css.stageName}>{s.name}</div>
						<div style={css.stageShape}>{s.shape(m.nPrompt)}</div>
					</button>
				))}
			</div>
			<div style={css.panel}>{body[step]}</div>
			<div style={css.nav}>
				<button style={css.navBtn(step === 0)} disabled={step === 0} onClick={() => setStep(step - 1)}>← назад</button>
				<button style={css.navBtn(step === STAGES.length - 1)} disabled={step === STAGES.length - 1} onClick={() => setStep(step + 1)}>дальше →</button>
			</div>
			<div style={css.note}>
				Прогон на CPU в float32, revision c1899de2. Logit lens — грубый приём: промежуточные слои не обучали выдавать
				ответ напрямую, так что это подсказка, а не точное «мнение» слоя.
			</div>
		</div>
	);
}
