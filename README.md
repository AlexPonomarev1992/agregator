# VibeLab — AI Creative Platform

> Платформа для вайбкодеров: генерация видео/фото через множество AI-моделей, ИИ-ассистент с проектами, лаборатория экспериментов, геймификация с рейтингом и бейджами.

**Домен**: vibelab.polimatai.site  
**Порт разработки**: 3005

---

## Быстрый старт

```bash
git clone https://github.com/your-org/vibelab.git
cd vibelab
cp .env.example .env.local
npm install
npm run dev
```

Открой [http://localhost:3005](http://localhost:3005)

---

## Стек

| Слой | Технология |
|---|---|
| Фронтенд | Next.js 14 (App Router), React 18 |
| Язык | TypeScript (строгий режим) |
| Стили | Tailwind CSS v4 |
| Компоненты | shadcn/ui + Radix UI |
| Анимации | Framer Motion 11 |
| Иконки | HugeIcons (@hugeicons/react) |
| Шрифт | Geist Sans |
| Стейт | Zustand 5 |
| Запросы | TanStack Query 5 |
| Auth | Better Auth 1.0 |
| База данных | PostgreSQL (VPS) |
| ORM | Drizzle ORM 0.36 |
| Realtime | Soketi (self-hosted Pusher) |
| Медиа | Cloudflare R2 CDN |
| Платежи | Т-Банк Acquiring |
| AI генерация | KIE.ai (Kling 3.0, Hailuo, Wan, NanoBanana, Ideogram, Imagen 4, Grok) |
| LLM | Claude / GPT / Gemini / OpenRouter |
| 3D | Three.js (лендинг) |
| Markdown | react-markdown + highlight.js |
| Тесты | Playwright (E2E) |

---

## Структура проекта

```
vibelab/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Страницы авторизации
│   │   │   ├── login/                # Вход
│   │   │   ├── signup/               # Регистрация
│   │   │   └── game-login/           # Вход через игру (SSO)
│   │   ├── (dashboard)/              # Защищённые страницы
│   │   │   ├── content/              # Генератор контента (главная)
│   │   │   ├── ai/                   # ИИ-ассистент с проектами
│   │   │   ├── lab/                  # Лаборатория экспериментов + игра
│   │   │   ├── history/              # История генераций
│   │   │   ├── rating/               # Рейтинг и лидерборд
│   │   │   └── profile/              # Профиль + настройки
│   │   └── api/                      # 28 API эндпоинтов
│   │       ├── auth/                 # Better Auth catch-all
│   │       ├── user/                 # Профиль, кредиты
│   │       ├── generate/             # Генерация видео/фото
│   │       ├── projects/             # AI проекты + чат
│   │       ├── experiments/          # Эксперименты лаборатории
│   │       ├── rating/               # Рейтинг, бейджи, XP
│   │       ├── payments/             # Т-Банк платежи
│   │       ├── agent/                # AI-агент (чат без проекта)
│   │       ├── game/                 # Game SSO авторизация
│   │       ├── upload/               # Загрузка файлов
│   │       ├── notifications/        # Уведомления
│   │       └── cron/                 # Фоновые задачи
│   ├── components/
│   │   ├── ui/                       # 17 shadcn/ui компонентов + HugeIcons
│   │   ├── layout/                   # DashboardLayout, Sidebar, Topbar, BottomNav
│   │   │   ├── CommandPalette/       # Cmd+K поиск
│   │   │   └── NotificationCenter/   # Центр уведомлений
│   │   ├── features/                 # 70+ фичевых компонентов
│   │   │   ├── content/              # Генератор контента (12 компонентов)
│   │   │   ├── ai/                   # ИИ-ассистент (17 компонентов)
│   │   │   ├── generator/            # Генератор (7 компонентов)
│   │   │   ├── lab/                  # Лаборатория (5 компонентов)
│   │   │   ├── history/              # История (1 компонент)
│   │   │   ├── profile/              # Профиль (10 компонентов)
│   │   │   └── rating/               # Рейтинг (4 компонента)
│   │   ├── landing/                  # 9 компонентов лендинга
│   │   └── providers/                # ThemeProvider + QueryClient
│   ├── lib/
│   │   ├── db/                       # Drizzle ORM
│   │   │   ├── schema/               # 17 таблиц
│   │   │   └── queries/              # 9 модулей запросов
│   │   ├── auth/                     # Better Auth конфиг
│   │   ├── payments/                 # Т-Банк интеграция
│   │   ├── api/                      # API клиенты и утилиты
│   │   │   ├── kie.ts                # KIE.ai — основной провайдер генерации
│   │   │   ├── kling.ts              # Kling API (прямой)
│   │   │   ├── nanobanana.ts         # NanoBanana API (прямой)
│   │   │   ├── llm.ts               # LLM мультипровайдер
│   │   │   ├── prompt-enhance.ts     # Улучшение промптов через LLM
│   │   │   ├── auth-guard.ts         # Middleware авторизации
│   │   │   ├── response.ts           # Форматирование ответов API
│   │   │   ├── validate.ts           # Middleware валидации
│   │   │   └── validation.ts         # Zod-схемы
│   │   ├── services/                 # Бизнес-сервисы
│   │   │   ├── badges.ts             # Автовыдача бейджей
│   │   │   └── notify.ts             # Система уведомлений
│   │   ├── stores/                   # Zustand сторы
│   │   │   ├── ui-store.ts           # UI состояние
│   │   │   └── user-store.ts         # Профиль, кредиты, подписка
│   │   ├── constants/                # Навигация и константы
│   │   ├── env.ts                    # Валидация env переменных
│   │   └── utils.ts                  # Утилиты (cn)
│   ├── types/                        # 10 файлов, 40+ интерфейсов
│   └── middleware.ts                 # Rate limiting (per-IP, per-category)
├── drizzle/                          # Миграции БД
├── tests/                            # E2E тесты (Playwright)
├── scripts/                          # Утилиты сборки
├── Documentation:
│   ├── CLAUDE.md                     # Claude Code контекст
│   ├── ARCHITECTURE.md               # Архитектура системы
│   ├── API.md                        # 28 API эндпоинтов
│   ├── DATABASE.md                   # 17 таблиц БД
│   ├── PAYMENTS.md                   # Т-Банк интеграция
│   └── BACKEND_PLAN.md              # План разработки (статус)
├── drizzle.config.ts
├── next.config.mjs
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

---

## Разделы платформы

### Контент-генератор (основной продукт)
Создание видео и фото через KIE.ai — единый API для множества моделей. Поддерживаемые модели:
- **Видео**: Kling 3.0, Kling 2.6, Hailuo 02, Wan 2.6
- **Изображения**: NanoBanana, NanoBanana 2, Ideogram v3, Imagen 4, Grok Imagine

Промпты автоматически улучшаются через LLM перед отправкой в модель. Стоимость: 5 кредитов (фото), 20 кредитов (видео).

### ИИ-ассистент
Чат с ИИ с поддержкой проектов и контекста. Мультимодельная поддержка:
- Claude (Anthropic), GPT (OpenAI), Gemini (Google)
- Фоллбэк через OpenRouter
- Персоны, системные промпты, файловые вложения

### Лаборатория
Эксперименты в формате «А что если...» + встроенная игра VibeCode. XP за прохождение, геймификация.

### Рейтинг
Лидерборд по XP, 11 бейджей с автовыдачей, ранги пользователей.

### RoyalPass (подписка)
Месяц (999₽) или год (7999₽) через Т-Банк. Доступ к расширенным экспериментам, видеоурокам, созвонам, закрытому чату.

---

## Монетизация

- **Кредиты** — покупаются пакетами (50/150/500), тратятся на генерацию
- **RoyalPass** — подписка месяц/год, доступ к сообществу и обучению
- **Игра** — бесплатно для всех, воронка в RoyalPass

---

## Ключевые особенности реализации

- **Атомарные кредиты** — row-level locking для предотвращения race conditions
- **Rate limiting** — per-IP, per-category на всех API эндпоинтах
- **11 бейджей** — автовыдача по триггерам (XP, активность, подписка)
- **SSE стриминг** — ответы ИИ-ассистента стримятся в реальном времени
- **Prompt enhancement** — автоулучшение промптов через LLM перед генерацией
- **Game SSO** — HMAC-SHA256 токены для интеграции с игрой VibeCode
- **Webhook signature verification** — все вебхуки Т-Банка проверяются по подписи
- **Notification system** — 7 типов уведомлений с автообновлением

---

## Команды

```bash
npm run dev          # Локальная разработка (Turbopack)
npm run build        # Продакшн сборка
npm run start        # Запуск продакшн сервера
npm run lint         # ESLint
npm run typecheck    # TypeScript проверка
npm run db:generate  # Создать миграцию
npm run db:migrate   # Применить миграции
npm run db:studio    # Drizzle Studio UI
npm run db:push      # Push схемы (без миграции)
```

---

## Переменные окружения

Скопируй `.env.example` в `.env.local` и заполни. Ключевые:

| Переменная | Назначение |
|---|---|
| `DATABASE_URL` | PostgreSQL подключение |
| `BETTER_AUTH_SECRET` | Секрет сессий |
| `BETTER_AUTH_URL` | URL приложения |
| `TBANK_TERMINAL_KEY` | Т-Банк мерчант |
| `TBANK_SECRET_KEY` | Т-Банк подпись вебхуков |
| `ANTHROPIC_API_KEY` | Claude API (LLM + prompt enhance) |
| `OPENAI_API_KEY` | GPT API |
| `OPENROUTER_API_KEY` | OpenRouter (фоллбэк) |
| `VIBELAB_SSO_SECRET` | Game SSO подпись |
| `CLOUDFLARE_R2_*` | Хранилище медиа |
| `SOKETI_*` | Realtime сервер |

---

## Деплой

- **Фронтенд**: Vercel
- **БД + Soketi**: VPS
- **Медиа**: Cloudflare R2 CDN

---

## Статистика проекта

- **11 страниц** + 2 вложенных
- **28 API эндпоинтов**
- **97+ компонентов**
- **17 таблиц БД** с индексами
- **40+ TypeScript интерфейсов**
- **11 бейджей** с автовыдачей
- **7 типов уведомлений**

---

## Лицензия

Proprietary — VibeLab Agency. Все права защищены.
