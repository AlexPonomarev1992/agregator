# План разработки бэкенда VibeLab

> Статус на апрель 2026. Фазы 1-6 реализованы. Фаза 7 частично. Фаза 8 в процессе.

---

## Фаза 1. Фундамент (БД + Auth) — DONE

- [x] PostgreSQL + Drizzle ORM подключены
- [x] 17 таблиц в `src/lib/db/schema/` (включая notifications)
- [x] Better Auth настроен (email/password)
- [x] Drizzle-адаптер для сессий
- [x] Auth guard middleware (`requireAuth`)
- [x] Auto-creation: user_credits, user_ratings, game_profiles при регистрации
- [x] DiceBear аватары при регистрации
- [x] Все запросы в `src/lib/db/queries/` (9 модулей)
- [x] Стандартные ответы `{data, meta}` / `{error: {code, message}}`
- [x] Zod-схемы для валидации

---

## Фаза 2. Профиль и кредиты — DONE

- [x] `GET/PATCH /api/user/profile` — профиль + join credits/rating/subscription
- [x] `GET /api/user/credits` — баланс
- [x] Dashboard layout загружает данные из API в Zustand store
- [x] Редирект на `/login` без сессии

---

## Фаза 3. Генерация контента — DONE

- [x] KIE.ai клиент (`src/lib/api/kie.ts`) — единый API для множества моделей
- [x] Поддержка моделей: Kling 3.0, Kling 2.6, Hailuo 02, Wan 2.6 (видео), NanoBanana, Ideogram v3, Imagen 4, Grok Imagine (фото)
- [x] Prompt enhancement через LLM (`src/lib/api/prompt-enhance.ts`)
- [x] Kling API прямой клиент (`src/lib/api/kling.ts`)
- [x] NanoBanana API прямой клиент (`src/lib/api/nanobanana.ts`)
- [x] `POST /api/generate/video` — 20 кредитов
- [x] `POST /api/generate/photo` — 5 кредитов
- [x] `GET /api/generate/status/:id` — поллинг KIE.ai
- [x] `GET /api/generate/history` — с пагинацией
- [x] Атомарное списание кредитов (FOR UPDATE)
- [x] XP начисление за генерацию (5 XP фото, 10 XP видео)
- [x] Автопроверка бейджей

### Не реализовано:
- [ ] Cloudflare R2 интеграция (скачивание + загрузка результатов)
- [ ] Фоновый поллинг статусов (сейчас — поллинг с клиента)

---

## Фаза 4. ИИ-ассистент — DONE

- [x] `GET/POST /api/projects` — CRUD проектов
- [x] `POST /api/projects/:id/chat` — SSE стриминг
- [x] `POST /api/agent/chat` — агент без проекта (скрытый `__agent__` проект)
- [x] LLM мультипровайдер (`src/lib/api/llm.ts`): Claude, GPT, Gemini, OpenRouter
- [x] Персоны и системные промпты
- [x] Файловые вложения (`POST /api/upload`)
- [x] Контекст: project.context + persona + последние 20 сообщений

---

## Фаза 5. Лаборатория и рейтинг — DONE

- [x] `GET /api/experiments` [public] — список + прогресс пользователя
- [x] `POST /api/experiments/:id/start` — начать эксперимент
- [x] `POST /api/experiments/:id/complete` — завершить + XP + бейджи
- [x] `GET /api/rating/leaderboard` [public] — топ-100
- [x] `GET /api/rating/me` — рейтинг текущего пользователя
- [x] `GET /api/rating/badges` — бейджи пользователя
- [x] `GET /api/rating/xp-events` — история XP
- [x] 11 бейджей с автовыдачей через `checkAndAwardBadges()`
- [x] Ранги через `ROW_NUMBER() OVER (ORDER BY total_xp DESC)`
- [x] VibeCode game SSO интеграция

---

## Фаза 6. Платежи (Т-Банк) — DONE

- [x] `src/lib/payments/tbank.ts` — initPayment + verifyWebhookSignature
- [x] `POST /api/payments/init` — кредиты (50/150/500) + подписка (monthly/yearly)
- [x] `POST /api/payments/webhook` — HMAC-SHA256 верификация + обработка
- [x] `GET /api/payments/history` — с пагинацией
- [x] Идемпотентная обработка вебхуков
- [x] Фоллбэк на mock URL без TBANK_TERMINAL_KEY
- [x] Бейдж "Королевская особа" при оплате подписки
- [x] Уведомления о начислении кредитов и активации подписки

---

## Фаза 7. Realtime (Soketi) — PARTIAL

- [ ] Soketi серверный клиент (`src/lib/api/soketi.ts`)
- [ ] Каналы: `private-user-{userId}`, `public-leaderboard`, `public-experiments`
- [ ] Триггеры: генерация завершена, XP, бейдж
- [ ] Клиентский хук `useSoketiChannel()`
- [x] Уведомления реализованы через polling (NotificationCenter, каждые 30 сек)

---

## Фаза 8. Замена моков на реальные данные — IN PROGRESS

- [x] Dashboard layout загружает реальные данные
- [x] Zustand store заполняется из API
- [x] API endpoints возвращают реальные данные из PostgreSQL
- [ ] TanStack Query хуки (useProfile, useCredits, useGenerations, etc.)
- [ ] Инвалидация кэша после мутаций
- [ ] Полные empty states

---

## Дополнительно реализовано (не в исходном плане)

- [x] **Rate limiting middleware** — per-IP, per-category (5 категорий)
- [x] **Notification system** — 7 типов, async создание, mark-as-read
- [x] **Prompt enhancement** — LLM-based улучшение промптов
- [x] **Game SSO** — HMAC-SHA256 токены для VibeCode game
- [x] **File upload** — до 10MB, whitelist расширений
- [x] **Command Palette** — Cmd+K поиск по навигации/действиям/моделям
- [x] **Notification Center** — UI с фильтрами и автообновлением
- [x] **Landing page** — 9 секций (hero, features, pricing, FAQ, etc.)
- [x] **Cron cleanup** — удаление старых генераций (14 дней)
