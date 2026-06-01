# VibeLab — Claude Code контекст

Это главный файл контекста для Claude Code. Читай его перед любой задачей.

---

## Что такое VibeLab

AI Creative Platform для вайбкодеров. Три продукта в одном:
1. **Генератор** — видео и фото через KIE.ai (Kling 3.0, Hailuo, Wan, NanoBanana, Ideogram, Imagen 4, Grok) + prompt enhancement
2. **ИИ-ассистент** — чат с проектами и контекстом
3. **Лаборатория** — эксперименты в формате «А что если...», игра, рейтинг

Монетизация: кредиты на генерацию + подписка RoyalPass (видеоуроки, созвоны, закрытый чат).

---

## Стек (обязательно знать)

- **Next.js 14** — App Router, не Pages Router. Всегда используй серверные компоненты где возможно.
- **TypeScript** — строгий режим, никакого `any`
- **Tailwind CSS v4** — утилитарные классы, CSS переменные для темизации
- **shadcn/ui** — компоненты живут в `src/components/ui/`, не устанавливаются как пакет
- **Framer Motion** — все анимации через него
- **Drizzle ORM** — схемы в `src/lib/db/schema/`, запросы в `src/lib/db/queries/`
- **Better Auth** — конфиг в `src/lib/auth/`
- **Zustand** — глобальный стейт (кредиты, профиль, UI состояние)
- **TanStack Query** — все серверные запросы, кэширование

---

## Структура файлов

```
src/app/(dashboard)/         — защищённые страницы платформы
src/app/(auth)/              — страницы входа/регистрации
src/app/api/                 — API routes (Next.js Route Handlers)
src/components/ui/           — shadcn/ui базовые компоненты
src/components/layout/       — Sidebar, Topbar, BottomNav
src/components/features/     — фичевые компоненты по разделам
src/lib/db/schema/           — Drizzle схемы таблиц
src/lib/db/queries/          — переиспользуемые запросы к БД
src/lib/auth/                — Better Auth конфиг и хелперы
src/lib/payments/            — Т-Банк Acquiring интеграция
src/lib/api/                 — клиенты внешних API (Kling, NanoBanana и др.)
src/types/                   — глобальные TypeScript типы
```

---

## Правила разработки

### Компоненты
- Серверный компонент по умолчанию. `"use client"` только если нужен стейт или браузерные API.
- Каждый компонент в своей папке: `ComponentName/index.tsx`
- Пропсы описывать через интерфейс `ComponentNameProps`
- Анимации через Framer Motion: `motion.div`, `AnimatePresence`

### База данных
- Все схемы в `src/lib/db/schema/` — отдельный файл на каждую сущность
- Никогда не писать сырой SQL — только через Drizzle
- Миграции только через `npm run db:generate` + `npm run db:migrate`
- Все запросы оборачивать в try/catch

### API Routes
- Все эндпоинты в `src/app/api/`
- Проверка авторизации в начале каждого handler
- Возвращать типизированные ответы через `NextResponse.json()`
- Валидация входных данных через Zod

### Внешние API
- Все вызовы к KIE.ai, Kling, NanoBanana, LLM провайдерам — только через серверные route handlers
- Никогда не светить API ключи на клиенте
- Логировать ошибки внешних API

### Стиль кода
- Именование: компоненты PascalCase, функции camelCase, константы UPPER_SNAKE_CASE
- Экспорт: именованный экспорт для всего кроме page.tsx и layout.tsx
- Комментарии на русском для бизнес-логики, на английском для технических деталей

---

## Дизайн-система

Современный тёмный стиль как у Kling / Lovable / GPT.

- **Шрифт**: Geist Sans
- **Иконки**: HugeIcons (@hugeicons/react, никаких emoji в UI)
- **Анимации**: Framer Motion, `whileTap={{ scale: 0.97 }}` на кнопках
- **Glassmorphism**: `backdrop-blur-md bg-white/5 border border-white/10`
- **Тёмная тема**: по умолчанию через `next-themes`
- **Цветовые акценты**: фиолетовый `#7F77DD` для RoyalPass и акцентов

### Навигация
- Desktop: Sidebar слева (220px) + Topbar сверху
- Mobile: Bottom nav (5 разделов) + Topbar сверху
- Sidebar можно свернуть до иконок (56px)

### Топбар
- Слева: кнопка toggle sidebar + логотип VibeLab
- Справа: счётчик кредитов + аватар пользователя

---

## Бизнес-логика

### Кредиты
- Хранятся в таблице `user_credits`
- Списываются при каждой генерации
- Проверять перед запуском генерации, не после
- При нехватке — показывать модалку покупки

### RoyalPass
- Подписка через Т-Банк Acquiring
- Статус хранится в `subscriptions`
- Проверять через middleware для защищённых маршрутов
- Даёт доступ к: видеоурокам, созвонам, закрытому Telegram чату

### Рейтинг
- Считается из: XP за эксперименты + активность + покупки
- XP начисляются через события в таблице `xp_events`
- Leaderboard обновляется в реальном времени через Soketi
- Бейджи выдаются автоматически по триггерам

### Эксперименты (игра)
- Каждый эксперимент начинается с «А что если...»
- Пользователь проходит шаги, получает XP
- Результат можно шерить в Telegram канал
- Бесплатны для всех, RoyalPass открывает больше экспериментов

---

## Платежи (Т-Банк)

- Инициализация платежа: `POST /api/payments/init`
- Вебхук подтверждения: `POST /api/payments/webhook`
- Логика в `src/lib/payments/tbank.ts`
- Все транзакции логировать в `payment_logs`

---

## Переменные окружения

Все переменные в `.env.local`. Никогда не коммитить в git.
Полный список в `.env.example`.

Критичные:
- `DATABASE_URL` — строка подключения к PostgreSQL
- `BETTER_AUTH_SECRET` — секрет для сессий
- `BETTER_AUTH_URL` — URL приложения (default: `https://vibelab.polimatai.site`)
- `TBANK_TERMINAL_KEY` + `TBANK_SECRET_KEY` — Т-Банк Acquiring
- `ANTHROPIC_API_KEY` — Claude API (LLM + prompt enhancement)
- `OPENAI_API_KEY` — GPT API (LLM)
- `OPENROUTER_API_KEY` — OpenRouter (фоллбэк для всех LLM)
- `VIBELAB_SSO_SECRET` — подпись Game SSO токенов
- `CLOUDFLARE_R2_*` — доступ к хранилищу медиа
- `SOKETI_*` — Realtime сервер

---

## Частые задачи

### Добавить новый раздел
1. Создать папку в `src/app/(dashboard)/new-section/`
2. Добавить `page.tsx` и `layout.tsx`
3. Добавить пункт в навигацию в `src/components/layout/Sidebar/`
4. Обновить `src/types/navigation.ts`

### Добавить новый компонент
1. Создать папку `src/components/features/ComponentName/`
2. `index.tsx` — основной компонент
3. Типы описать в том же файле или в `src/types/`

### Добавить новую таблицу БД
1. Создать схему в `src/lib/db/schema/table-name.ts`
2. Экспортировать из `src/lib/db/schema/index.ts`
3. Запустить `npm run db:generate`
4. Запустить `npm run db:migrate`

### Добавить API эндпоинт
1. Создать `src/app/api/resource/route.ts`
2. Проверить авторизацию через `requireAuth()` из `src/lib/api/auth-guard.ts`
3. Валидировать входные данные через Zod (схемы в `src/lib/api/validation.ts`)
4. Возвращать ответы через `apiSuccess()` / `apiError()` из `src/lib/api/response.ts`
5. Обновить `API.md`

---

## Обязательное обновление документации

**ПРАВИЛО**: После КАЖДОЙ доработки проекта обновляй соответствующие файлы документации. Это обязательное требование, не опциональное.

### Когда обновлять

| Что изменилось | Какие файлы обновить |
|---|---|
| Новая/изменённая страница или маршрут | `README.md` (структура), `ARCHITECTURE.md` |
| Новый/изменённый API эндпоинт | `API.md` (эндпоинт + схема запроса/ответа) |
| Новая/изменённая таблица или поле БД | `DATABASE.md` (схема + индексы) |
| Изменения в платежах | `PAYMENTS.md` |
| Новая зависимость или инструмент | `README.md` (стек) |
| Изменения в бизнес-логике | `CLAUDE.md` (секция бизнес-логики) |
| Завершение фазы разработки | `BACKEND_PLAN.md` (чекбоксы) |
| Новая env переменная | `CLAUDE.md` + `README.md` |
| Новый компонент/модуль | `README.md` (структура) |

### Как обновлять
1. Вноси изменения в документацию **в том же ответе**, где вносишь код
2. Не откладывай обновление на потом
3. Обновляй только затронутые секции, не переписывай весь файл
4. Сохраняй формат и стиль существующей документации
5. Обновляй числовую статистику при необходимости (количество эндпоинтов, компонентов, таблиц и т.д.)

### Текущая статистика (обновлять при изменениях)
- **Страниц**: 11 + 2 вложенных
- **API эндпоинтов**: 28
- **Компонентов**: 97+
- **Таблиц БД**: 17
- **TypeScript интерфейсов**: 40+
- **Бейджей**: 11
- **Типов уведомлений**: 7

---

## RuFlo V3 — Мультиагентная оркестрация

### Конфигурация
- **Topology**: hierarchical-mesh
- **Max Agents**: 15
- **Memory**: hybrid с HNSW vector search
- **Agent Teams**: включены (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`)

### Swarm-правила
- Все операции максимально параллельны в одном сообщении
- Используй Agent tool для спавна подагентов
- После спавна — жди результаты, не поллинг
- Hierarchical topology для кодинг-задач
- Raft consensus для hive-mind координации

### Кастомные VibeLab-агенты
- `vibelab-nextjs` — Next.js App Router + TypeScript specialist
- `vibelab-drizzle` — Drizzle ORM схемы и миграции
- `vibelab-security` — Security audit (API keys, XSS, injection)
- `vibelab-payments` — Т-Банк интеграция и кредитная система
- `vibelab-ui` — UI компоненты, Framer Motion, shadcn/ui
- `vibelab-api` — API routes, Zod validation, auth checks

### CLI команды

```bash
# Swarm management
claude-flow swarm init --topology hierarchical --max-agents 8
claude-flow agent list
claude-flow memory search --query "pattern"

# Diagnostics
claude-flow doctor --fix
```
