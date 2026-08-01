# «Собери свой Claude Code» — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Опубликовать статью-туториал `src/content/blog/build-coding-agent.mdx`, по которой читатель пошагово собирает рабочего кодового агента на tool-calling (~150 строк Python, без фреймворков) и запускает его на Cloud.ru Foundation Models или любом другом OpenAI-совместимом endpoint.

**Architecture:** Сначала пишется и проверяется эталонный код агента в скретчпаде (он же даёт данные для интерактива), затем — один React-компонент-визуализатор агент-лупа, затем — сама MDX-статья, в которую вставляются уже проверенные куски кода. Порядок обязателен: код статьи не пишется «по памяти», он копируется из проверенного эталона.

**Tech Stack:** Astro 5 + MDX (статья), React 19 island с `client:visible` (визуализатор), Python 3.9+ и `openai>=2.52` (эталонный код агента, живёт только в скретчпаде — в репозиторий блога Python не коммитим).

## Global Constraints

Всё нижеследующее — проверенные факты и правила проекта. Каждая задача обязана им следовать.

**Факты по Cloud.ru Foundation Models (подтверждены research-пассом, источники — cloud.ru/docs):**
- `base_url` = `https://foundation-models.api.cloud.ru/v1` — **без завершающего слэша** (точно как в квикстарте Cloud.ru).
- Авторизация — простой `Authorization: Bearer <API_KEY>`, **без обмена на временный токен**. То есть `OpenAI(api_key=..., base_url=...)` работает напрямую. В статье дать одну строчку-оговорку: если не работает — проверь, что скопирован **Key Secret**, а не Key ID.
- Ключ создаётся: Консоль → **Пользователи → Сервисные аккаунты** → сервисный аккаунт → **Учетные данные доступа** → API-ключ со скоупом **Foundation Models**. Key Secret показывается **один раз**.
- Путь чата: `/v1/chat/completions`. Доступен также `GET /v1/models`.
- **ID моделей обязательно с префиксом провайдера.** Дефолт туториала — `ai-sage/GigaChat3-10B-A1.8B` (модель из официального квикстарта, маленькая и быстрая, Function Calling есть). Альтернативы с Function Calling: `ai-sage/GigaChat3.5-432B-A28B`, `moonshotai/Kimi-K2.6`, `zai-org/GLM-5.1`, `deepseek-ai/DeepSeek-V4-Pro`.
- Схема запроса Cloud.ru — надмножество OpenAI: `tools`, `tool_choice`, `parallel_tool_calls`, `response_format` поддерживаются.
- **Честная оговорка:** живой tool-calling-вызов к Cloud.ru в research-пассе НЕ выполнялся (не было ключа) — подтверждено по OpenAPI-схеме и таблице моделей. Статья не должна утверждать «я прогнал именно на Cloud.ru», если это не так.

**Факты по `openai` Python SDK (проверено чтением исходников установленного пакета v2.52.0):**
- Запрос: `client.chat.completions.create(model=..., messages=..., tools=[...], tool_choice=...)`. Один элемент `tools`: `{"type": "function", "function": {"name": ..., "description": ..., "parameters": <json-schema dict>}}`.
- `functions=` / `function_call=` — **устаревшая** форма, не использовать.
- Ответ: `resp.choices[0].message.tool_calls` — список; у элемента `.id`, `.type`, `.function.name`, `.function.arguments`.
- `.function.arguments` — **JSON-строка**, нужен `json.loads`; SDK прямо предупреждает, что модель не всегда генерит валидный JSON → парсинг оборачивать в try.
- Результат возвращается сообщением `{"role": "tool", "tool_call_id": <id>, "content": <строка>}` — по одному на каждый `tool_call_id`.
- В один assistant-ход может прийти **несколько** `tool_calls` — обрабатывать все.
- Объект сообщения из ответа можно класть обратно в `messages` как есть (SDK сериализует pydantic-модель сам).

**Правила репозитория:**
- Контент и UI-текст — на русском, в стиле блога (дерзкий, без канцелярита).
- Компонент статьи: `.tsx` в `src/components/article/`, inline-объект `css` с типом `React.CSSProperties`, цвета только через CSS-переменные темы, дефолтный экспорт без пропсов, **никаких новых npm-зависимостей**, детерминированные данные (никаких `Math.random` / `new Date`).
- Хайдрация — `client:visible`.
- Категория статьи — `'тулы'` (валидное значение zod-схемы: `'фундамент' | 'тулы' | 'модели' | 'хайп'`).
- `Callout` принимает `type` из `'info' | 'warning' | 'tip' | 'fire'` и `title`. `StepList` принимает `steps={[{ num, text }]}`, где `text` рендерится как HTML.
- Python-файлы эталона **не коммитятся** в репозиторий блога — только в скретчпад.

**Скретчпад-директория (для эталонного кода):**
`/tmp/claude-1000/-home-mr8bit-Projects-blog/7b0c6b05-55b5-485b-91d0-52fe80b09a4c/scratchpad/agent-ref/`

---

## File Structure

| Файл | Ответственность |
|---|---|
| `<scratchpad>/agent-ref/agent.py` | Эталонный агент целиком. Источник истины для всех код-блоков статьи. Не коммитится. |
| `<scratchpad>/agent-ref/sandbox/calc.py` | Мини-проект с багом — задача для агента. Не коммитится. |
| `<scratchpad>/agent-ref/sandbox/test_calc.py` | Тест, который агент должен «озеленить». Не коммитится. |
| `<scratchpad>/agent-ref/verify_loop.py` | Прогон лупа со стаб-клиентом: доказывает, что цикл, диспатч тулов и песочница работают без API-ключа. Не коммитится. |
| `<scratchpad>/agent-ref/trace.json` | Трейс прогона — данные для визуализатора. Не коммитится. |
| `src/components/article/AgentLoopVisualizer.tsx` | Единственный интерактив статьи: пошаговый просмотр агент-лупа с растущим контекстом. |
| `src/content/blog/build-coding-agent.mdx` | Сама статья. |

**Решение по объёму интерактива (YAGNI):** делаем **один** компонент — `AgentLoopVisualizer`. Заявленный в спеке `ToolCallAnatomy` не создаём отдельным компонентом: три JSON-формы одного round-trip показываются обычными код-блоками (Shiki и так их красиво рендерит), это дешевле и не плодит однотипных «табов», за которые блог уже критиковали.

---

## Task 1: Эталонный агент и проверенный трейс

**Files:**
- Create: `<scratchpad>/agent-ref/agent.py`
- Create: `<scratchpad>/agent-ref/sandbox/calc.py`
- Create: `<scratchpad>/agent-ref/sandbox/test_calc.py`
- Create: `<scratchpad>/agent-ref/verify_loop.py`
- Create: `<scratchpad>/agent-ref/trace.json`

**Interfaces:**
- Produces: файл `trace.json` — массив шагов, который Task 2 зашивает в компонент. Формат шага зафиксирован в Шаге 6 ниже.
- Produces: проверенный текст `agent.py` — Task 3 копирует из него код-блоки **дословно**.

- [ ] **Шаг 1: Создать директорию и venv, поставить openai**

```bash
SCRATCH=/tmp/claude-1000/-home-mr8bit-Projects-blog/7b0c6b05-55b5-485b-91d0-52fe80b09a4c/scratchpad/agent-ref
mkdir -p "$SCRATCH/sandbox"
cd "$SCRATCH"
python3 -m venv venv
./venv/bin/pip install -q --upgrade pip
./venv/bin/pip install -q "openai>=2.52" pytest
./venv/bin/python -c "import openai; print(openai.__version__)"
```

Ожидаемо: печатается версия `2.52.x` или новее.

- [ ] **Шаг 2: Написать песочницу с багом**

`sandbox/calc.py`:

```python
def add(a, b):
    return a - b


def mul(a, b):
    return a * b
```

`sandbox/test_calc.py`:

```python
from calc import add, mul


def test_add():
    assert add(2, 3) == 5


def test_mul():
    assert mul(2, 3) == 6
```

- [ ] **Шаг 3: Убедиться, что баг реально воспроизводится**

```bash
cd "$SCRATCH/sandbox" && ../venv/bin/python -m pytest -q
```

Ожидаемо: `test_add` падает (`assert -1 == 5`), `test_mul` проходит. Итог вида `1 failed, 1 passed`.

- [ ] **Шаг 4: Написать `agent.py` целиком**

```python
"""Мини кодовый агент на tool-calling. ~150 строк, без фреймворков."""

import json
import os
import subprocess
from pathlib import Path

from openai import OpenAI

# --- Песочница: всё, что делает агент, ограничено этой папкой -----------------
WORKDIR = Path(os.environ.get("AGENT_WORKDIR", "sandbox")).resolve()

client = OpenAI(
    base_url=os.environ.get("BASE_URL", "https://foundation-models.api.cloud.ru/v1"),
    api_key=os.environ.get("API_KEY", ""),
)
MODEL = os.environ.get("MODEL", "ai-sage/GigaChat3-10B-A1.8B")


def _safe(path: str) -> Path:
    """Не выпускаем агента за пределы песочницы."""
    p = (WORKDIR / path).resolve()
    if not p.is_relative_to(WORKDIR):
        raise ValueError(f"путь вне песочницы: {path}")
    return p


# --- Тулы: обычные python-функции --------------------------------------------
def read_file(path: str) -> str:
    return _safe(path).read_text(encoding="utf-8")


def write_file(path: str, content: str) -> str:
    p = _safe(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")
    return f"записано: {path} ({len(content)} символов)"


def list_dir(path: str = ".") -> str:
    p = _safe(path)
    items = sorted(x.name + ("/" if x.is_dir() else "") for x in p.iterdir())
    return "\n".join(items) or "(пусто)"


def run_shell(cmd: str) -> str:
    r = subprocess.run(
        cmd, shell=True, cwd=WORKDIR,
        capture_output=True, text=True, timeout=30,
    )
    return f"exit={r.returncode}\nstdout:\n{r.stdout}\nstderr:\n{r.stderr}"


IMPL = {
    "read_file": read_file,
    "write_file": write_file,
    "list_dir": list_dir,
    "run_shell": run_shell,
}

# --- Те же тулы, но описанные для модели -------------------------------------
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Прочитать файл и вернуть его содержимое.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Путь относительно рабочей папки"},
                },
                "required": ["path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Записать содержимое в файл, перезаписав существующий.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Путь относительно рабочей папки"},
                    "content": {"type": "string", "description": "Новое содержимое файла целиком"},
                },
                "required": ["path", "content"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_dir",
            "description": "Показать список файлов и папок.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Путь относительно рабочей папки"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "run_shell",
            "description": "Выполнить shell-команду в рабочей папке и вернуть stdout, stderr и код возврата.",
            "parameters": {
                "type": "object",
                "properties": {
                    "cmd": {"type": "string", "description": "Команда, например 'python -m pytest -q'"},
                },
                "required": ["cmd"],
            },
        },
    },
]

SYSTEM = (
    "Ты — кодовый агент. У тебя есть тулы для работы с файлами и запуска команд "
    "в рабочей папке. Действуй пошагово: сначала осмотрись, потом читай, потом правь. "
    "После правок обязательно перезапусти тесты и убедись, что они зелёные. "
    "Когда задача решена — ответь коротким текстом без вызова тулов."
)


def run_agent(task: str, max_steps: int = 25) -> str:
    messages = [
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": task},
    ]

    for step in range(max_steps):
        resp = client.chat.completions.create(
            model=MODEL, messages=messages, tools=TOOLS,
        )
        msg = resp.choices[0].message
        messages.append(msg)

        # Модель ответила текстом без тулов — значит, это финальный ответ.
        if not msg.tool_calls:
            return msg.content or ""

        for call in msg.tool_calls:
            name = call.function.name
            try:
                args = json.loads(call.function.arguments or "{}")
                result = str(IMPL[name](**args))
            except Exception as e:  # ошибку возвращаем модели, а не падаем
                result = f"ОШИБКА {type(e).__name__}: {e}"

            print(f"  [{step}] {name}({args if 'args' in dir() else ''}) -> {result[:80]!r}")
            messages.append({
                "role": "tool",
                "tool_call_id": call.id,
                "content": result[:8000],  # не раздуваем контекст
            })

    return "Лимит шагов исчерпан."


if __name__ == "__main__":
    print(run_agent("Тесты падают. Найди причину, почини код и добейся, чтобы все тесты прошли."))
```

- [ ] **Шаг 5: Прогнать луп со стаб-клиентом (проверка без API-ключа)**

Так как ключа Cloud.ru нет, доказываем работоспособность цикла подменой только LLM-ответов: **решения модели сценарные, а исполнение тулов настоящее** (реальные файлы, реальный pytest).

`verify_loop.py`:

```python
"""Проверка агент-лупа без API-ключа: LLM подменяем стабом, тулы работают по-настоящему."""

import json
import shutil
from pathlib import Path
from types import SimpleNamespace

import agent

HERE = Path(__file__).parent
# чистая песочница на каждый прогон
shutil.rmtree(HERE / "sandbox", ignore_errors=True)
shutil.copytree(HERE / "sandbox_fixture", HERE / "sandbox")


def _call(cid, name, args):
    return SimpleNamespace(
        id=cid, type="function",
        function=SimpleNamespace(name=name, arguments=json.dumps(args)),
    )


# Сценарий: то, что вернула бы модель на каждом шаге.
SCRIPT = [
    [_call("c1", "list_dir", {"path": "."})],
    [_call("c2", "run_shell", {"cmd": "python -m pytest -q"})],
    [_call("c3", "read_file", {"path": "calc.py"})],
    [_call("c4", "write_file", {
        "path": "calc.py",
        "content": "def add(a, b):\n    return a + b\n\n\ndef mul(a, b):\n    return a * b\n",
    })],
    [_call("c5", "run_shell", {"cmd": "python -m pytest -q"})],
    None,  # финальный текстовый ответ без тулов
]

TRACE = []
_step = {"i": 0}


class _FakeCompletions:
    def create(self, model, messages, tools):
        i = _step["i"]
        _step["i"] += 1
        calls = SCRIPT[i] if i < len(SCRIPT) else None
        content = None if calls else "Готово: баг в add() был в знаке, тесты зелёные."
        TRACE.append({"step": i, "messages_before": len(messages), "calls": bool(calls)})
        return SimpleNamespace(
            choices=[SimpleNamespace(
                message=SimpleNamespace(tool_calls=calls, content=content, role="assistant")
            )]
        )


agent.client = SimpleNamespace(chat=SimpleNamespace(completions=_FakeCompletions()))
agent.WORKDIR = (HERE / "sandbox").resolve()

final = agent.run_agent("Тесты падают. Почини код и добейся зелёных тестов.")
print("ФИНАЛ:", final)

# Проверки
assert "зелёные" in final or "Готово" in final, f"неожиданный финал: {final}"
fixed = (HERE / "sandbox" / "calc.py").read_text(encoding="utf-8")
assert "a + b" in fixed, "агент не починил файл"

# Песочница действительно защищена
try:
    agent.read_file("../../etc/passwd")
except ValueError as e:
    print("ПЕСОЧНИЦА OK:", e)
else:
    raise AssertionError("побег из песочницы не заблокирован!")

print("ВСЁ ОК, шагов:", _step["i"])
```

Перед запуском положить исходную (сломанную) версию в `sandbox_fixture/`, чтобы прогон был повторяемым:

```bash
cd "$SCRATCH"
mkdir -p sandbox_fixture && cp sandbox/calc.py sandbox/test_calc.py sandbox_fixture/
```

- [ ] **Шаг 6: Запустить проверку и снять трейс**

```bash
cd "$SCRATCH" && ./venv/bin/python verify_loop.py
```

Ожидаемо в выводе: строки вызовов тулов, `ПЕСОЧНИЦА OK: путь вне песочницы: ../../etc/passwd`, `ВСЁ ОК, шагов: 6`, и в `sandbox/calc.py` теперь `a + b`.

Если ассерты не прошли — чинить `agent.py`, а не ослаблять проверки.

- [ ] **Шаг 7: Записать `trace.json` для визуализатора**

Из прогона выше собрать файл со шагами в таком формате (реальные результаты тулов из прогона, обрезанные до читаемого размера):

```json
[
  {"kind": "user",  "title": "Задача",            "detail": "Тесты падают. Почини код и добейся зелёных тестов.", "messages": 2},
  {"kind": "llm",   "title": "Модель просит list_dir", "tool": "list_dir", "args": "{\"path\": \".\"}", "messages": 3},
  {"kind": "tool",  "title": "Результат list_dir", "result": "calc.py\ntest_calc.py", "messages": 4},
  {"kind": "llm",   "title": "Модель просит run_shell", "tool": "run_shell", "args": "{\"cmd\": \"python -m pytest -q\"}", "messages": 5},
  {"kind": "tool",  "title": "Тесты упали",       "result": "exit=1 ... assert -1 == 5 ... 1 failed, 1 passed", "messages": 6},
  {"kind": "llm",   "title": "Модель просит read_file", "tool": "read_file", "args": "{\"path\": \"calc.py\"}", "messages": 7},
  {"kind": "tool",  "title": "Содержимое calc.py", "result": "def add(a, b):\n    return a - b", "messages": 8},
  {"kind": "llm",   "title": "Модель правит файл", "tool": "write_file", "args": "{\"path\": \"calc.py\", \"content\": \"...a + b...\"}", "messages": 9},
  {"kind": "tool",  "title": "Файл записан",      "result": "записано: calc.py (62 символов)", "messages": 10},
  {"kind": "llm",   "title": "Модель просит run_shell", "tool": "run_shell", "args": "{\"cmd\": \"python -m pytest -q\"}", "messages": 11},
  {"kind": "tool",  "title": "Тесты зелёные",     "result": "exit=0 ... 2 passed", "messages": 12},
  {"kind": "final", "title": "Финальный ответ",   "detail": "Готово: баг в add() был в знаке, тесты зелёные.", "messages": 13}
]
```

Значения `result` брать **из реального вывода** прогона (особенно вывод pytest), а не выдумывать.

- [ ] **Шаг 8: Зафиксировать результат**

Коммита нет — Python в репозиторий не идёт. Записать в отчёт: путь к `agent.py`, что `verify_loop.py` прошёл, и содержимое `trace.json`.

---

## Task 2: Компонент AgentLoopVisualizer

**Files:**
- Create: `src/components/article/AgentLoopVisualizer.tsx`

**Interfaces:**
- Consumes: `trace.json` из Task 1 — зашивается в файл как константа `TRACE`.
- Produces: дефолтный экспорт `AgentLoopVisualizer` без пропсов; Task 3 импортирует его в MDX.

- [ ] **Шаг 1: Написать компонент**

Требования: пошаговый просмотр (кнопки «назад»/«вперёд» + клик по шагу), подсветка текущего шага, показ вызванного тула с аргументами и результата, счётчик растущего контекста («сообщений в контексте: N»). Цвета — только из CSS-переменных темы. Данные — константа, никаких `Math.random`/`new Date`.

```tsx
import { useState } from 'react';

// Трейс реального прогона агента по задаче «почини баг, добейся зелёных тестов».
// Решения модели сценарные, результаты тулов — настоящий вывод (pytest и файлы).
type Step = {
	kind: 'user' | 'llm' | 'tool' | 'final';
	title: string;
	detail?: string;
	tool?: string;
	args?: string;
	result?: string;
	messages: number;
};

const TRACE: Step[] = [
	/* сюда — содержимое trace.json из Task 1, дословно */
];

const KIND_COLOR: Record<Step['kind'], string> = {
	user: 'var(--accent-secondary)',
	llm: 'var(--accent)',
	tool: 'var(--accent-yellow)',
	final: '#22c55e',
};

const KIND_LABEL: Record<Step['kind'], string> = {
	user: 'ты',
	llm: 'модель',
	tool: 'наш код',
	final: 'ответ',
};

const css = {
	wrap: { margin: '1.75em 0', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)' } as React.CSSProperties,
	title: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: '0.5rem' } as React.CSSProperties,
	desc: { fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.1rem', lineHeight: 1.6 } as React.CSSProperties,
	main: { display: 'flex', gap: '1.25rem', flexWrap: 'wrap' as const, alignItems: 'flex-start' } as React.CSSProperties,
	rail: { flex: '1 1 210px', minWidth: '190px', display: 'flex', flexDirection: 'column' as const, gap: '0.3rem' } as React.CSSProperties,
	railItem: (active: boolean, color: string) => ({
		display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', borderRadius: '8px', cursor: 'pointer',
		background: active ? 'var(--bg-secondary)' : 'transparent',
		border: `1px solid ${active ? color : 'transparent'}`,
		fontSize: '0.78rem', fontWeight: active ? 700 : 500,
		color: active ? 'var(--text)' : 'var(--text-muted)', textAlign: 'left' as const, width: '100%',
	} as React.CSSProperties),
	dot: (color: string) => ({ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 } as React.CSSProperties),
	panel: { flex: '2 1 300px', minWidth: '260px' } as React.CSSProperties,
	badge: (color: string) => ({ display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.04em', color, border: `1px solid ${color}`, marginBottom: '0.5rem' } as React.CSSProperties),
	panelTitle: { fontSize: '1rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 0.6rem' } as React.CSSProperties,
	code: { display: 'block', padding: '0.7rem 0.85rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: '0.78rem', lineHeight: 1.5, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' as const, wordBreak: 'break-word' as const, marginBottom: '0.6rem', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' } as React.CSSProperties,
	label: { fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.25rem' } as React.CSSProperties,
	ctx: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.8rem', fontSize: '0.8rem', color: 'var(--text-muted)' } as React.CSSProperties,
	ctxBar: (pct: number) => ({ flex: 1, height: '6px', borderRadius: '3px', background: 'var(--bg-secondary)', overflow: 'hidden', position: 'relative' as const } as React.CSSProperties),
	ctxFill: (pct: number) => ({ width: `${pct}%`, height: '100%', background: 'var(--accent)' } as React.CSSProperties),
	nav: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '1rem' } as React.CSSProperties,
	btn: (disabled: boolean) => ({ padding: '0.4rem 0.9rem', borderRadius: '100px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: disabled ? 'var(--text-muted)' : 'var(--text)', fontSize: '0.8rem', fontWeight: 700, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1 } as React.CSSProperties),
	counter: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' as const } as React.CSSProperties,
};

export default function AgentLoopVisualizer() {
	const [i, setI] = useState(0);
	const step = TRACE[i];
	const maxMsg = TRACE[TRACE.length - 1].messages;
	const color = KIND_COLOR[step.kind];

	return (
		<div style={css.wrap}>
			<div style={css.title}>🔁 Агент-луп по шагам</div>
			<div style={css.desc}>
				Тот самый цикл из статьи, шаг за шагом: модель просит тул → наш код его выполняет → результат
				возвращается в контекст → модель решает, что дальше. Листай и смотри, как растёт список сообщений.
			</div>

			<div style={css.main}>
				<div style={css.rail}>
					{TRACE.map((s, idx) => (
						<button
							key={idx}
							style={css.railItem(idx === i, KIND_COLOR[s.kind])}
							onClick={() => setI(idx)}
							aria-current={idx === i}
						>
							<span style={css.dot(KIND_COLOR[s.kind])} />
							{s.title}
						</button>
					))}
				</div>

				<div style={css.panel}>
					<span style={css.badge(color)}>{KIND_LABEL[step.kind]}</span>
					<h4 style={css.panelTitle}>{step.title}</h4>

					{step.detail && <code style={css.code}>{step.detail}</code>}

					{step.tool && (
						<>
							<div style={css.label}>вызов тула</div>
							<code style={css.code}>{step.tool}({step.args})</code>
						</>
					)}

					{step.result && (
						<>
							<div style={css.label}>результат → в контекст как role: "tool"</div>
							<code style={css.code}>{step.result}</code>
						</>
					)}

					<div style={css.ctx}>
						<span>сообщений в контексте: <strong>{step.messages}</strong></span>
						<span style={css.ctxBar(0)}>
							<span style={css.ctxFill((step.messages / maxMsg) * 100)} />
						</span>
					</div>

					<div style={css.nav}>
						<button style={css.btn(i === 0)} onClick={() => setI((v) => Math.max(0, v - 1))} disabled={i === 0}>← назад</button>
						<button style={css.btn(i === TRACE.length - 1)} onClick={() => setI((v) => Math.min(TRACE.length - 1, v + 1))} disabled={i === TRACE.length - 1}>вперёд →</button>
						<span style={css.counter}>{i + 1} / {TRACE.length}</span>
					</div>
				</div>
			</div>
		</div>
	);
}
```

Заменить заглушку `TRACE` содержимым `trace.json` из Task 1. Лишний параметр `pct` у `ctxBar` убрать, если он не используется.

- [ ] **Шаг 2: Проверить сборку**

```bash
npm run build 2>&1 | grep -iE "error|page\(s\) built"
```

Ожидаемо: ошибок нет, `33 page(s) built` (число вырастет на 1 после Task 3).

- [ ] **Шаг 3: Коммит**

```bash
git add src/components/article/AgentLoopVisualizer.tsx
git commit -m "Add AgentLoopVisualizer component for coding-agent tutorial"
```

---

## Task 3: Статья build-coding-agent.mdx

**Files:**
- Create: `src/content/blog/build-coding-agent.mdx`

**Interfaces:**
- Consumes: `AgentLoopVisualizer` из Task 2; проверенный код из `agent.py` (Task 1).

- [ ] **Шаг 1: Написать frontmatter и импорты**

```mdx
---
title: 'Собери свой Claude Code: кодовый агент на tool-calling за 150 строк 🤖🔧'
description: 'Пошаговый туториал: пишем кодового агента, который читает репозиторий, правит код и сам гоняет тесты до зелёного. Чистый Python и openai SDK, без фреймворков. Работает на Cloud.ru Foundation Models и на любом OpenAI-совместимом endpoint — локальном vLLM, Ollama, OpenRouter.'
pubDate: 'Aug 02 2026'
category: 'тулы'
---

import Callout from '../../components/article/Callout.astro';
import StepList from '../../components/article/StepList.astro';
import AgentLoopVisualizer from '../../components/article/AgentLoopVisualizer';
```

- [ ] **Шаг 2: Вступление + предупреждение о безопасности**

Содержание: крючок — «агент» это не магия и не фреймворк, это `while` вокруг tool-calling; за статью соберём мини-Claude Code, который сам чинит баг. Что понадобится: Python 3.9+, `pip install openai`, ключ к любому OpenAI-совместимому API.

Обязательный `Callout type="warning"`: агент выполняет команды и правит файлы, которые ему продиктовала модель. Запускать **только** в отдельной папке-песочнице (а лучше в контейнере), никогда — на рабочем проекте.

- [ ] **Шаг 3: Часть 1 — голый вызов LLM**

Показать подключение к Cloud.ru Foundation Models и первый запрос:

```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="https://foundation-models.api.cloud.ru/v1",
    api_key=os.environ["API_KEY"],
)

resp = client.chat.completions.create(
    model="ai-sage/GigaChat3-10B-A1.8B",
    messages=[{"role": "user", "content": "Почини баг в файле calc.py"}],
)
print(resp.choices[0].message.content)
```

Прописать: где взять ключ (Консоль → **Пользователи → Сервисные аккаунты** → **Учетные данные доступа** → API-ключ со скоупом Foundation Models; Key Secret показывают один раз). Оговорка одной строкой: если ловишь 401 — проверь, что скопирован Key Secret, а не Key ID.

Пуанта части: модель отвечает текстом «конечно, покажите файл» — руками она ничего не сделает. Ей нужны руки.

`Callout type="tip"` — «тот же код, другой провайдер»: поменяй две строки и работает на локальном vLLM (`http://localhost:8000/v1`), Ollama (`http://localhost:11434/v1`) или OpenRouter. Стандарт один — Chat Completions с `tools`.

- [ ] **Шаг 4: Часть 2 — первый тул и анатомия tool-calling**

Дать `read_file` + его JSON-схему (дословно из `agent.py`), затем разобрать протокол round-trip тремя код-блоками (это заменяет отдельный компонент-схему):

1. что мы отправляем — `tools=[...]`;
2. что вернула модель — `message.tool_calls[0]` с `.id`, `.function.name`, `.function.arguments` (подчеркнуть: **arguments это JSON-строка**, нужен `json.loads`, и SDK предупреждает, что JSON бывает битым → парсим в try);
3. что отправляем обратно — `{"role": "tool", "tool_call_id": ..., "content": ...}`.

Явно сказать: `functions=`/`function_call=` — устаревшая форма, не использовать.

Сюда же — интерактив:

```mdx
<AgentLoopVisualizer client:visible />
```

- [ ] **Шаг 5: Часть 3 — полный луп и остальные тулы**

Дать `_safe`, `write_file`, `list_dir`, `run_shell`, реестр `IMPL`, `SYSTEM` и функцию `run_agent` — **дословно из проверенного `agent.py`**. Объяснить три вещи: почему цикл, почему выход из него — это «ответ без `tool_calls`», и почему в один ход может прийти несколько `tool_calls` (обрабатываем все, на каждый — свой `role: "tool"`).

- [ ] **Шаг 6: Часть 4 — реальная задача**

Создать песочницу с багом (`calc.py` с `a - b`, `test_calc.py`), запустить агента и показать реальный лог прогона: осмотрелся → запустил тесты → увидел фейл → прочитал файл → починил → перезапустил тесты → зелено. Тексты вывода брать из реального прогона Task 1.

- [ ] **Шаг 7: Часть 5 — прод-нюансы**

Пять пунктов, каждый с куском кода или одним абзацем: лимит шагов (`max_steps`), ошибки тула возвращаем модели, а не падаем; обрезка результата (`[:8000]`), чтобы не раздувать контекст; параллельные `tool_calls`; безопасность `run_shell` (таймаут, песочница, а лучше контейнер). Финал — куда расти, со ссылками на существующие статьи: `/blog/agent-harness/`, `/blog/ai-agents-landscape/`, `/blog/mcp-protocol-deep-dive/`, `/blog/structured-outputs/`.

- [ ] **Шаг 8: TL;DR через StepList**

```mdx
<StepList steps={[
	{ num: "1", text: "<strong>Агент — это цикл</strong>, а не фреймворк: спросил модель → выполнил тулы → вернул результаты → повторил" },
	{ num: "2", text: "<strong>Тул</strong> = обычная функция + её JSON-схема в <code>tools</code>" },
	{ num: "3", text: "<strong>arguments — строка JSON</strong>, парсить через <code>json.loads</code> и обязательно в try" },
	{ num: "4", text: "<strong>Результат возвращается</strong> сообщением <code>role: \"tool\"</code> с тем же <code>tool_call_id</code>" },
	{ num: "5", text: "<strong>Выход из цикла</strong> — ответ модели без <code>tool_calls</code>; плюс жёсткий лимит шагов" },
]} />
```

- [ ] **Шаг 9: Источники**

Список ссылок: квикстарт Cloud.ru Foundation Models, справочник API/аутентификация Cloud.ru, таблица доступных моделей, документация OpenAI по function calling, и 3–4 внутренние ссылки на статьи блога.

- [ ] **Шаг 10: Сборка и проверка**

```bash
npm run build 2>&1 | grep -iE "error|page\(s\) built"
```

Ожидаемо: ошибок нет, число страниц выросло на 1 (было 33 → стало 34).

- [ ] **Шаг 11: Коммит**

```bash
git add src/content/blog/build-coding-agent.mdx
git commit -m "Add tutorial: build your own coding agent with tool-calling"
```

---

## Task 4: Финальная проверка в браузере

**Files:**
- Modify (при необходимости): `src/components/article/AgentLoopVisualizer.tsx`, `src/content/blog/build-coding-agent.mdx`

- [ ] **Шаг 1: Поднять превью и открыть статью**

```bash
npm run preview &
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4321/blog/build-coding-agent/
```

Ожидаемо: `200`.

- [ ] **Шаг 2: Проверить визуализатор в обеих темах**

Через chrome-devtools: открыть страницу, прокрутить к `AgentLoopVisualizer`, покликать «вперёд»/«назад» и по шагам в рельсе. Убедиться: подсветка текущего шага работает, счётчик контекста растёт, код-блоки не вылезают за карточку. Повторить с `data-theme="light"`.

- [ ] **Шаг 3: Проверить мобильную раскладку**

Эмулировать вьюпорт `390x844x3,mobile,touch`. Убедиться: колонки визуализатора переносятся, горизонтального скролла нет:

```js
document.documentElement.scrollWidth - document.documentElement.clientWidth  // ожидаемо 0
```

- [ ] **Шаг 4: Проверить консоль**

Ошибок и React-варнингов быть не должно.

- [ ] **Шаг 5: Финальный коммит и пуш**

```bash
git add -A && git commit -m "Polish coding-agent tutorial after visual check"
git push origin main
```

---

## Self-Review (выполнено при написании плана)

**Покрытие спеки:** все 5 шагов арки → Task 3 (шаги 2–8); тулы и песочница → Task 1 (шаг 4); интеграция Cloud.ru → Global Constraints + Task 3 (шаг 3); интерактив → Task 2; факт-пасс → выполнен до плана, результаты вшиты в Global Constraints. Отклонение от спеки одно и осознанное: `ToolCallAnatomy` отдельным компонентом не делаем (см. File Structure), его роль выполняют три код-блока в Task 3 (шаг 4).

**Плейсхолдеры:** в Task 2 намеренно оставлена заглушка `TRACE` — её содержимое физически не может существовать до прогона Task 1; в Task 2 (шаг 1) явно указано, чем её заменить.

**Согласованность типов:** формат шага трейса (`kind`, `title`, `detail`, `tool`, `args`, `result`, `messages`) задан один раз в Task 1 (шаг 7) и используется типом `Step` в Task 2 — совпадает поле в поле.
