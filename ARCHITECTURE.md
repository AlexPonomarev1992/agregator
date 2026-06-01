# Архитектура VibeLab

## Общая схема

```
[Браузер / Мобильный]
        │
        ▼
[Next.js 14 на Vercel]
   │         │
   │    [Middleware]
   │    Rate Limiting
   │    (per-IP, per-category)
   │         │
   │         ▼
   │   [API Routes] (28 эндпоинтов)
   │         │
   │    ┌────┴─────────────────┐
   │    │         │            │
   ▼    ▼         ▼            ▼
[Soketi]  [PostgreSQL]  [Cloudflare R2]  [/tmp uploads]
 VPS        VPS           CDN медиа        Temp files
              │
    ┌─────────┼──────────────────────┐
    ▼         ▼         ▼            ▼
[KIE.ai]  [Т-Банк]  [LLM API]  [DiceBear]
Kling 3.0   Платежи   Claude      Аватары
Hailuo                GPT
Wan                   Gemini
NanoBanana            OpenRouter
Ideogram
Imagen 4
Grok
```

## Слои

### 1. Фронтенд (Vercel)
- **Next.js 14** с App Router и серверными компонентами
- **Tailwind CSS v4** + dark-only тема
- **Framer Motion** для всех анимаций
- **Zustand** — два стора (UI состояние, пользовательские данные)
- **TanStack Query** — серверные запросы с кэшированием
- **Geist Sans** — основной шрифт
- **HugeIcons** — иконки

### 2. Middleware (Rate Limiting)
- In-memory rate limiter с per-IP + per-category трекингом
- Категории:
  - `generate`: 10 req/min (генерация контента)
  - `payments`: 20 req/min
  - `agent-chat`: 15 req/min
  - `game-auth`: 10 req/min
  - `default`: 60 req/min
- Автоочистка stale записей каждые 2 минуты
- Заголовки `X-RateLimit-*` в ответах
- 429 при превышении лимита

### 3. API Layer (28 Route Handlers)
- **Авторизация**: Better Auth middleware (`requireAuth`) на защищённых маршрутах
- **Валидация**: Zod-схемы для всех входных данных
- **Ответы**: Стандартный формат `{data, meta}` / `{error: {code, message}}`
- **Модули**:
  - Auth — Better Auth catch-all (email/password, OAuth)
  - User — профиль, кредиты
  - Generate — видео/фото через KIE.ai + prompt enhancement
  - Projects — AI проекты с чатом (SSE стриминг)
  - Agent — AI-агент (чат без проекта)
  - Experiments — лабораторные эксперименты
  - Rating — лидерборд, XP, бейджи
  - Payments — Т-Банк с webhook verification
  - Game — SSO авторизация (HMAC-SHA256)
  - Upload — файлы до 10MB
  - Notifications — 7 типов с mark-as-read
  - Cron — фоновая очистка данных

### 4. База данных (PostgreSQL на VPS)
- **17 таблиц** через Drizzle ORM
- **12 индексов** для оптимизации запросов
- **Атомарные транзакции** для кредитов (row-level locking via `FOR UPDATE`)
- **UUID** первичные ключи
- Схемы в `src/lib/db/schema/`, запросы в `src/lib/db/queries/`

### 5. Генерация контента
- **KIE.ai** — основной провайдер (единый API для множества моделей)
- **Prompt Enhancement** — автоулучшение промптов через LLM перед генерацией
  - OpenRouter (приоритет) или Anthropic API
  - Модель-специфичные системные промпты
  - Фоллбэк на rule-based enhancement
- **Стоимость**: 5 кредитов (фото), 20 кредитов (видео)
- **Процесс**: проверка кредитов → атомарное списание → enhance prompt → создание задачи → начисление XP → проверка бейджей

### 6. LLM интеграция (AI-ассистент)
- **Приоритет провайдеров**: Anthropic → OpenAI → Google AI → OpenRouter → Mock
- **SSE стриминг** ответов
- **Проекты** с отдельными контекстами и историей
- **Персоны** — настраиваемые системные промпты
- **Файловые вложения** через Upload API

### 7. Realtime (Soketi на VPS)
- Pusher-совместимый self-hosted сервер
- Каналы: `private-user-{id}`, `public-leaderboard`, `public-experiments`
- События: генерация завершена, XP изменился, бейдж выдан

### 8. Медиа (Cloudflare R2)
- Загрузка через signed URL с сервера
- Публичный CDN URL для раздачи
- Структура: `/{userId}/{type}/{filename}`

### 9. Система уведомлений
- 7 типов: badge, generation, rank, credits, subscription, xp, experiment
- Асинхронное создание (не блокирует основной поток)
- Автообновление в NotificationCenter каждые 30 секунд
- Mark-as-read batch операция

### 10. Геймификация
- **XP** — начисляется за генерации, эксперименты, активность
- **Ранги** — пересчитываются через `ROW_NUMBER() OVER (ORDER BY total_xp DESC)`
- **11 бейджей** — автовыдача через `checkAndAwardBadges()` после ключевых событий
- **Лидерборд** — топ-100 с пагинацией

---

## Безопасность

- API ключи только на сервере (env)
- Авторизация в каждом route handler (Better Auth session)
- Кредиты списываются атомарно через транзакции с row-level locking
- Вебхуки Т-Банка проверяются по HMAC-SHA256 подписи
- Game SSO токены: HMAC-SHA256 с TTL 60 секунд
- Rate limiting на всех API эндпоинтах
- Валидация входных данных через Zod
- Загрузка файлов: whitelist расширений, лимит 10MB

---

## Масштабирование

Текущая архитектура рассчитана на 0–10,000 пользователей без изменений.

При росте:
- Vercel автоматически масштабирует фронтенд
- PostgreSQL — добавить read replica на VPS
- Rate limiter — перейти с in-memory на Redis
- Soketi — перейти на кластерный режим или Ably
- R2 — уже готов к любому объёму
- Upload — перейти с /tmp на R2 (сейчас локальное хранение)

---

## Диаграмма потоков данных

### Генерация контента
```
Пользователь → POST /api/generate/photo
  → requireAuth()
  → validateBody(generatePhotoSchema)
  → deductCredits(userId, 5)  // atomic, FOR UPDATE
  → enhancePrompt(prompt, model)  // LLM
  → kieClient.createTask(enhancedPrompt)
  → db.insert(generations, {status: "pending"})
  → addXp(userId, 5)  // async
  → checkAndAwardBadges(userId)  // async
  → return {generationId}
```

### Платёжный вебхук
```
Т-Банк → POST /api/payments/webhook
  → verifySignature(SHA256)
  → findPaymentLog(orderId)
  → if CONFIRMED + credits:
      → upsert user_credits (balance += amount)
      → insert credit_transactions
      → notify.creditsAdded(userId)
  → if CONFIRMED + subscription:
      → upsert subscriptions (status: active)
      → awardBadge("Королевская особа")
      → notify.subscriptionActivated(userId)
```
