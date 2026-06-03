# API VibeLab

Все эндпоинты требуют авторизации через сессионный куки (Better Auth), кроме помеченных `[public]`.

Базовый URL: `/api`

Формат ответов: `{data, meta?}` (успех) / `{error: {code, message}}` (ошибка)

---

## Auth

Better Auth catch-all — автоматическая маршрутизация.

| Метод | Эндпоинт | Описание |
|---|---|---|
| POST | `/api/auth/sign-up` | Регистрация (email/password) |
| POST | `/api/auth/sign-in` | Вход |
| POST | `/api/auth/sign-out` | Выход |
| GET | `/api/auth/session` | Текущая сессия |

При регистрации автоматически создаются: `user_credits` (balance: 0), `user_ratings` (xp: 0), `game_profiles`. Генерируется DiceBear аватар.

---

## Пользователь

| Метод | Эндпоинт | Описание |
|---|---|---|
| GET | `/api/user/profile` | Профиль + кредиты + рейтинг + подписка |
| PATCH | `/api/user/profile` | Обновить name, bio, avatarUrl, socialLinks |
| GET | `/api/user/credits` | Баланс кредитов (balance, totalBought, totalSpent) |

---

## Генерация контента

| Метод | Эндпоинт | Описание | Стоимость |
|---|---|---|---|
| POST | `/api/generate/video` | Генерация видео | 20 кредитов |
| POST | `/api/generate/photo` | Генерация фото | 5 кредитов |
| GET | `/api/generate/status/:id` | Статус генерации (поллинг KIE.ai) | — |
| GET | `/api/generate/history` | История генераций пользователя | — |

### POST /api/generate/video
```json
{
  "prompt": "string (required)",
  "modelId": "string (kling-3.0 | kling-2.6 | hailuo-02 | wan-2.6)",
  "duration": "number (5 | 10)",
  "aspectRatio": "string (16:9 | 9:16 | 1:1)",
  "resolution": "string",
  "sound": "boolean",
  "mode": "string",
  "imageUrl": "string (reference image URL)",
  "endFrameUrl": "string"
}
```

### POST /api/generate/photo
```json
{
  "prompt": "string (required)",
  "modelId": "string (nanobanana | nanobanana-2 | ideogram-v3 | imagen-4 | grok-imagine)",
  "style": "string",
  "aspectRatio": "string",
  "resolution": "string",
  "negativePrompt": "string",
  "renderingSpeed": "string",
  "imageUrl": "string (reference image URL)"
}
```

**Процесс генерации**: проверка кредитов → атомарное списание → prompt enhancement через LLM → создание задачи KIE.ai → запись в generations → начисление XP.

---

## Проекты (ИИ-ассистент)

| Метод | Эндпоинт | Описание |
|---|---|---|
| GET | `/api/projects` | Список проектов (не архивных) |
| POST | `/api/projects` | Создать проект |
| GET | `/api/projects/:id` | Получить проект |
| PATCH | `/api/projects/:id` | Обновить проект |
| DELETE | `/api/projects/:id` | Архивировать проект |
| GET | `/api/projects/:id/chat` | История чата проекта |
| POST | `/api/projects/:id/chat` | Отправить сообщение (SSE стриминг ответа) |

### POST /api/projects
```json
{
  "name": "string (required)",
  "description": "string",
  "context": "string (системный контекст)",
  "modelId": "string",
  "personaId": "string"
}
```

---

## AI-агент (чат без проекта)

| Метод | Эндпоинт | Rate limit | Описание |
|---|---|---|---|
| GET | `/api/agent/chat` | — | Последние 50 сообщений из скрытого проекта `__agent__` |
| POST | `/api/agent/chat` | 15/min | Отправить сообщение + SSE стриминг ответа |
| POST | `/api/agent/orchestrate` | — | Kimi-оркестратор: определяет намерение и при запросе генерации возвращает целевой режим + модель + переформулированный промпт |
| POST | `/api/agent/chat/generation` | — | Сохраняет генерацию (фото/видео/аудио) в историю чата по `generationId` — чтобы медиа появилось при возврате, даже если клиент был офлайн |
| POST/GET | `/api/cron/reconcile-generations` | — | Фоновый досмотр незавершённых генераций у KIE (независимо от клиента). Защита: `Authorization: Bearer <CRON_SECRET>` или Vercel Cron. Вешать на расписание ~30–60 сек |

### POST /api/agent/chat
```json
{
  "message": "string (required)",
  "modelId": "string (optional)"
}
```

**SSE-стрим ответа** (`text/event-stream`, заголовки `no-cache`, `X-Accel-Buffering: no`):
- `data: {"content":"<токен>"}` — токен текста ответа (тайпинг)
- `data: {"reasoning":"<токен>"}` — токен размышлений reasoning-моделей (Kimi); клиент показывает индикатор «думает…», в текст ответа/БД не сохраняется
- `data: [DONE]` — конец стрима

**Доступные chat-модели** (`modelId`, по умолчанию `auto`):

| `modelId` | Модель | Провайдер | Ключ |
|---|---|---|---|
| `auto` | Auto (оркестратор на Kimi K2.6) | Gonka (OpenAI-совместимый прокси) | `GONKA_API_KEY` |
| `gpt-5-5` | GPT-5.5 | KIE `/codex/v1/responses` | `KLING_API_KEY` |
| `claude-opus-4-8` | Claude Opus 4.8 | KIE | `KLING_API_KEY` |
| `gemini-3-5-flash` | Gemini 3.5 Flash | KIE | `KLING_API_KEY` |

Только `auto` занимается оркестрацией (определяет намерение и уводит в нужную генерацию через `/api/agent/orchestrate`). При выборе любой другой модели чат работает как обычный диалог без авто-роутинга. `auto` — это алиас бэкенд-модели `kimi-k2-6` (`/codex`-реестр).

### POST /api/agent/orchestrate
```json
{
  "prompt": "string (required, 1..5000)"
}
```

**Ответ** — одно из:
```json
{ "data": { "action": "chat" } }
```
```json
{
  "data": {
    "action": "generate",
    "mode": "music | video | image | tts",
    "modelSlug": "string",
    "modelMode": "string",
    "mediaType": "video | image | audio",
    "prompt": "переформулированный промпт под модель",
    "parameters": { "prompt": "...", "...": "извлечённые параметры под выбранную модель" }
  }
}
```
```json
{ "data": { "action": "notice", "message": "текст для показа в чате (напр. про STT)" } }
```
Логика: Kimi (`kimi-k2-6`) классифицирует намерение и переформулирует промпт (шаг 1), затем для `generate` извлекает **структурированные параметры** под выбранную модель (шаг 2, валидируются той же Zod-схемой, что и `/api/studio/generate`). Модель выбирается **хаотично** из нужной категории и только в режиме без обязательных загрузок (t2v/t2i/generate/tts) — временно; позже добавим полноценную логику оркестрации. STT (Whisper) распознаётся, но возвращается `notice`: пайплайна транскрипции из чата пока нет (нужен аудиофайл). Клиент автоматически переключает вкладку и запускает генерацию.

---

## Лаборатория (Эксперименты)

| Метод | Эндпоинт | Описание |
|---|---|---|
| GET | `/api/experiments` `[public]` | Список опубликованных экспериментов (+ прогресс для auth) |
| GET | `/api/experiments/:id` `[public]` | Детали эксперимента |
| POST | `/api/experiments/:id/start` | Начать эксперимент (409 если уже начат) |
| POST | `/api/experiments/:id/complete` | Завершить + начислить XP + проверить бейджи |

---

## Рейтинг

| Метод | Эндпоинт | Описание |
|---|---|---|
| GET | `/api/rating/leaderboard` `[public]` | Топ-100 (page, limit до 100) |
| GET | `/api/rating/me` | Мой рейтинг: totalXp, rank, badgesCount |
| GET | `/api/rating/badges` | Мои бейджи с деталями |
| GET | `/api/rating/xp-events` | История XP событий |

---

## Платежи (Т-Банк)

| Метод | Эндпоинт | Описание |
|---|---|---|
| POST | `/api/payments/init` | Инициировать платёж |
| POST | `/api/payments/webhook` `[public, signed]` | Вебхук от Т-Банка (HMAC-SHA256) |
| GET | `/api/payments/history` | История платежей (page, limit до 100) |

### POST /api/payments/init
```json
{
  "type": "credits | subscription",
  "credits": 50 | 150 | 500,
  "plan": "monthly | yearly"
}
```

### Ответ
```json
{
  "data": {
    "orderId": "string",
    "paymentUrl": "https://securepay.tinkoff.ru/...",
    "amount": 29900
  }
}
```

---

## Game SSO

| Метод | Эндпоинт | Описание |
|---|---|---|
| POST | `/api/game/auth` | Авторизация игры (email + password) |
| POST | `/api/game/sso-token` | Получить SSO токен (HMAC-SHA256, TTL 60s) |

---

## Загрузка файлов

| Метод | Эндпоинт | Описание |
|---|---|---|
| POST | `/api/upload` | Загрузить файл (до 10MB, jpg/png/gif/webp/mp4/webm/pdf) |
| GET | `/api/upload/:filename` | Скачать загруженный файл |

---

## Уведомления

| Метод | Эндпоинт | Описание |
|---|---|---|
| GET | `/api/notifications` | Последние 30 уведомлений + unread count |
| PATCH | `/api/notifications` | Пометить все как прочитанные |

**Типы**: badge, generation, rank, credits, subscription, xp, experiment, system

---

## Studio API

Универсальный генератор контента. Поддерживает 7 моделей: `kling-3`, `veo-31`, `nano-banana-2`, `flux-2-pro`, `suno-v5`, `elevenlabs-tts`, `seedance-2`.

| Метод | Эндпоинт | Rate limit | Описание |
|---|---|---|---|
| POST | `/api/studio/generate` | 10/min | Запустить генерацию |
| GET | `/api/studio/status/:id` | 60/min | Статус генерации (поллинг провайдера) |
| GET | `/api/studio/feed` | 60/min | Лента генераций пользователя |
| GET | `/api/studio/models` `[public]` | 60/min | Список моделей (кэш 60с) |
| GET | `/api/studio/presets` | 60/min | Пресеты пользователя |
| POST | `/api/studio/presets` | 60/min | Создать пресет |
| PATCH | `/api/studio/presets/:id` | 60/min | Обновить пресет |
| DELETE | `/api/studio/presets/:id` | 60/min | Удалить пресет |

### POST /api/studio/generate

```json
{
  "modelSlug": "kling-3",
  "mode": "t2v",
  "parameters": {
    "prompt": "string (required)",
    "mode": "std | pro",
    "duration": "5 | 10",
    "aspectRatio": "16:9 | 9:16 | 1:1"
  },
  "parentGenerationId": "uuid (optional)"
}
```

Ответ:
```json
{
  "data": {
    "generationId": "uuid",
    "status": "queued",
    "costCredits": 15,
    "costBreakdown": [{ "label": "Базовая цена", "value": 15 }]
  }
}
```

Коды ошибок:
| Код | HTTP | Описание |
|---|---|---|
| `MODEL_NOT_FOUND` | 404 | Неизвестный modelSlug |
| `MODE_NOT_FOUND` | 404 | Неизвестный mode для модели |
| `QUEUE_FULL` | 429 | Достигнут лимит параллельных задач (3 для free, 6 для RoyalPass) |
| `INSUFFICIENT_CREDITS` | 402 | Нет кредитов |
| `DISPATCH_FAILED` | async | Ошибка отправки в провайдер (кредиты возвращаются автоматически) |

### GET /api/studio/status/:id

Ответ:
```json
{
  "data": {
    "id": "uuid",
    "status": "queued | running | succeeded | failed",
    "resultUrls": ["https://..."],
    "thumbnailUrl": "https://...",
    "errorCode": null,
    "errorMessage": null
  }
}
```

### GET /api/studio/feed

Query params: `limit` (1-100, default 50), `offset` (default 0), `modelSlug`, `category` (video|image|audio|music).

### GET /api/studio/models

Возвращает массив `ModelDefinition[]` с применёнными admin-override'ами из `model_overrides`. Кэш 60 секунд.

### POST /api/studio/presets

```json
{
  "modelSlug": "kling-3",
  "mode": "t2v",
  "name": "Мой пресет",
  "parameters": { "duration": "10", "aspectRatio": "9:16" },
  "thumbnailUrl": "https://... (optional)"
}
```

---

## Cron

| Метод | Эндпоинт | Описание |
|---|---|---|
| POST | `/api/cron/cleanup` `[Bearer token]` | Удалить генерации старше 14 дней |

Требует Bearer token = `CRON_SECRET` или `BETTER_AUTH_SECRET`.

---

## Rate Limiting

Все `/api/*` эндпоинты защищены rate limiter'ом (per-IP, окно 60 сек):

| Категория | Лимит | Эндпоинты |
|---|---|---|
| `generate` | 10/min | /api/generate/photo, /api/generate/video |
| `studio_generate` | 10/min | /api/studio/generate |
| `payments` | 20/min | /api/payments/* |
| `agent-chat` | 15/min | /api/agent/chat |
| `game-auth` | 10/min | /api/game/* |
| `default` | 60/min | Все остальные |

Заголовки ответа: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Форматы ответов

### Успех
```json
{
  "data": { ... },
  "meta": { "page": 1, "total": 100 }
}
```

### Ошибка
```json
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Недостаточно кредитов для генерации"
  }
}
```

### Коды ошибок

| Код | HTTP | Описание |
|---|---|---|
| `UNAUTHORIZED` | 401 | Не авторизован |
| `FORBIDDEN` | 403 | Нет доступа |
| `NOT_FOUND` | 404 | Не найдено |
| `INSUFFICIENT_CREDITS` | 402 | Недостаточно кредитов |
| `SUBSCRIPTION_REQUIRED` | 402 | Нужна подписка RoyalPass |
| `VALIDATION_ERROR` | 400 | Ошибка валидации |
| `ALREADY_STARTED` | 409 | Эксперимент уже начат |
| `RATE_LIMIT_EXCEEDED` | 429 | Превышен лимит запросов |
| `QUEUE_FULL` | 429 | Достигнут лимит параллельных генераций |
| `MODEL_NOT_FOUND` | 404 | Модель не найдена в реестре |
| `MODE_NOT_FOUND` | 404 | Режим не поддерживается моделью |
| `EXTERNAL_API_ERROR` | 502 | Ошибка внешнего API |
| `INTERNAL_ERROR` | 500 | Внутренняя ошибка |
