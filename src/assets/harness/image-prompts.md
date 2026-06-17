# Промпты для картинок — «Харнес агента»

Под **GPT-Image / DALL·E 3**. Натуральный язык, описательно.

**Палитра блога** (вставляй в каждый промпт): тёмный фон navy/indigo `#0b0b1e`, акцент оранжевый `#ff6b2b`, фиолетовый `#c946ff`, маджента `#e040a0`, мягкое свечение. Стиль — чистая техническая редакционная иллюстрация / инфографика, плоский дизайн с лёгким глоу, без фотореализма.

> ⚠️ DALL·E плохо рисует текст — проси **без подписей** или с минимумом коротких слов. Соотношение **16:9** (1792×1024).

После генерации: положи PNG в `src/assets/harness/` под нужным именем и **раскомментируй** соответствующую строку `{/* IMG NN … */}` в `agent-harness.mdx`, заменив её на `![alt](../../assets/harness/ИМЯ.png)`. Для обложки — раскомментируй `heroImage` во frontmatter.

---

## #0 — Обложка → `00_cover.png`
> A clean editorial tech illustration on a deep dark navy background (#0b0b1e). Center: a glowing AI brain made of soft purple (#c946ff) light, wrapped in a sleek mechanical exoskeleton / harness of orange (#ff6b2b) frames, cables and gears that give it robotic arms reaching outward. The harness clearly powers and controls the brain. Subtle glow, flat vector style with depth, cinematic, minimal, no text. 16:9.

alt: `Харнес как экзоскелет вокруг мозга-LLM`

## #1 — Мозг в банке vs мозг в экзоскелете → `01_brain_vs_body.png`
> A side-by-side comparison illustration on dark navy background (#0b0b1e), flat vector tech style. Left side: a glowing purple (#c946ff) brain floating helplessly inside a glass jar, isolated, no limbs, dim. Right side: the same glowing brain fitted into a powerful orange (#ff6b2b) mechanical body with robotic arms actively grabbing tools — a wrench, a file, a terminal. Clear contrast between passive and capable. Soft glow, minimal, no text. 16:9.

alt: `Голая LLM против LLM в харнесе`

## #2 — Человек-реле (как жили без харнеса) → `02_human_relay.png`
> A slightly humorous editorial illustration on dark navy background (#0b0b1e), flat vector style. A tired developer sits between two screens, acting as a manual relay: on the left a glowing purple (#c946ff) chat window, on the right an orange (#ff6b2b) terminal. Big looping copy-paste arrows run through the human connecting the two screens, showing endless manual back-and-forth. The human is clearly the bottleneck. Soft glow, retro-tech vibe, no text. 16:9.

alt: `Человек как ручной харнес между чатом и терминалом`

## #3 — 5 слоёв харнеса → `03_anatomy_layers.png`
> A concentric layered diagram on dark navy background (#0b0b1e), clean flat infographic style. At the very center a small glowing purple (#c946ff) core labelled as the brain/LLM. Around it five distinct glowing concentric rings in graduated colors from purple through orange (#ff6b2b) to magenta (#e040a0), each ring representing a protective layer of a system. The outermost ring connects to small tool icons (file, terminal, gear, shield). Symmetric, technical, elegant, minimal labels or no text. 16:9.

alt: `Пять концентрических слоёв харнеса вокруг ядра-LLM`

## #4 — Окно контекста и компакция → `04_context_window.png`
> A tech infographic on dark navy background (#0b0b1e), flat vector style. A tall container or memory bar filling up with stacked colored blocks (purple #c946ff, blue, orange #ff6b2b, red at the top) representing a context window approaching overflow. To the side, an arrow shows the lower blocks being compressed into a single small neat block (compaction), freeing space. Conveys a filling-and-compressing memory. Soft glow, minimal, no text. 16:9.

alt: `Заполнение окна контекста и его сжатие`

## #5 — Ландшафт харнесов → `05_harness_landscape.png`
> A clean tech diagram on dark navy background (#0b0b1e), flat vector style. At the bottom, one wide glowing foundation bar of purple (#c946ff) light labelled abstractly as shared AI models. Standing on top of it, several distinct orange (#ff6b2b) and magenta (#e040a0) modular blocks/towers of different shapes, each representing a different agent harness built on the same foundation. Shows many different tools sharing one model layer. Symmetric, architectural, minimal, no text. 16:9.

alt: `Разные харнесы поверх общего слоя моделей`
