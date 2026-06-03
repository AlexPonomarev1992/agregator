# Схема базы данных VibeLab

**ORM**: Drizzle ORM 0.36  
**СУБД**: PostgreSQL  
**Таблиц**: 19  
**Схемы**: `src/lib/db/schema/`  
**Запросы**: `src/lib/db/queries/`

---

## Таблицы

### users — пользователи
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
email         text UNIQUE NOT NULL
name          text
password      text
avatar_url    text                -- DiceBear генерация при регистрации
bio           text
social_links  jsonb               -- массив социальных ссылок
is_creator    boolean DEFAULT false
created_at    timestamp DEFAULT now()
updated_at    timestamp DEFAULT now()
```

### sessions — сессии (Better Auth)
```sql
id            uuid PRIMARY KEY
user_id       uuid → users.id
token         text UNIQUE
expires_at    timestamp
ip_address    text
user_agent    text
created_at    timestamp
```

### accounts — OAuth аккаунты (Better Auth)
```sql
id            uuid PRIMARY KEY
user_id       uuid → users.id
provider      text               -- 'google', 'email', etc.
access_token  text
refresh_token text
scope         text
created_at    timestamp
```

### verifications — верификация email (Better Auth)
```sql
id            uuid PRIMARY KEY
identifier    text               -- email
value         text               -- verification code
expires_at    timestamp
created_at    timestamp
```

### user_credits — кредиты на генерацию
```sql
user_id       uuid → users.id PRIMARY KEY (UNIQUE)
balance       integer DEFAULT 0
total_bought  integer DEFAULT 0
total_spent   integer DEFAULT 0
updated_at    timestamp
```

### credit_transactions — история транзакций кредитов
```sql
id            uuid PRIMARY KEY
user_id       uuid → users.id
amount        integer            -- + начисление, − списание
type          text               -- 'purchase' | 'generation' | 'bonus'
description   text
reference_id  uuid               -- id генерации или платежа
created_at    timestamp
```

### subscriptions — подписки RoyalPass
```sql
id            uuid PRIMARY KEY
user_id       uuid → users.id
status        text               -- 'active' | 'cancelled' | 'expired'
plan          text               -- 'monthly' | 'yearly'
started_at    timestamp
expires_at    timestamp
tbank_order_id text
created_at    timestamp
```

### payment_logs — логи платежей Т-Банка
```sql
id            uuid PRIMARY KEY
user_id       uuid → users.id
order_id      text UNIQUE
amount        integer            -- в копейках
status        text               -- 'pending' | 'confirmed' | 'cancelled'
payment_type  text               -- 'credits' | 'subscription'
metadata      jsonb              -- дополнительные данные (credits count, plan)
created_at    timestamp
updated_at    timestamp
```

### generations — история генераций
```sql
id                    uuid PRIMARY KEY
user_id               uuid → users.id
type                  text               -- 'video' | 'photo' | 'avatar' | 'mascot'
status                text DEFAULT 'queued'  -- queued/running/succeeded/failed/cancelled
prompt                text
result_url            text               -- legacy single result URL
credits_spent         integer
provider              text               -- kie/elevenlabs/suno/...
provider_job_id       text               -- legacy provider job ID
metadata              jsonb              -- модель, настройки, enhanced prompt
created_at            timestamp
updated_at            timestamp

-- новые поля (миграция 0003_0004_studio_generation_presets)
model_id              text NOT NULL DEFAULT ''  -- slug модели: "kling-3", "veo-31", ...
mode                  text               -- t2v / i2v / edit / motion / remix
parameters            jsonb NOT NULL DEFAULT '{}'  -- все параметры формы
cost_credits          integer DEFAULT 0  -- списанные кредиты
cost_breakdown        jsonb              -- { base: int, modifiers: { key: int } }
kie_task_id           text               -- ID задачи в kie.ai
result_urls           jsonb              -- массив URL (несколько изображений)
thumbnail_url         text
duration_ms           integer            -- фактическое время генерации
error_code            text
error_message         text
parent_generation_id  uuid → generations.id ON DELETE SET NULL  -- для Extend/Remix
priority              integer DEFAULT 0  -- 0 = обычный, 10 = RoyalPass
```

### projects — проекты ИИ-ассистента
```sql
id            uuid PRIMARY KEY
user_id       uuid → users.id
name          text NOT NULL
description   text
context       text               -- системный контекст для LLM
model_id      text               -- ID модели (claude, gpt-4o, gemini)
persona_id    text               -- ID персоны
is_archived   boolean DEFAULT false
created_at    timestamp
updated_at    timestamp
```

### chat_messages — сообщения чата проектов
```sql
id            uuid PRIMARY KEY
project_id    uuid → projects.id
role          text               -- 'user' | 'assistant'
content       text
attachments   jsonb              -- массив файловых вложений
generation_id uuid               -- привязка к генерации студии (медиа в истории чата)
media_type    text               -- 'video' | 'image' | 'audio' (для сообщений-генераций)
is_edited     boolean DEFAULT false
created_at    timestamp
```

### experiments — эксперименты лаборатории
```sql
id            uuid PRIMARY KEY
title         text               -- «А что если...»
description   text
xp_reward     integer
is_published  boolean DEFAULT false
order         integer
created_at    timestamp
```

### user_experiments — прохождение экспериментов
```sql
id            uuid PRIMARY KEY
user_id       uuid → users.id
experiment_id uuid → experiments.id
status        text               -- 'started' | 'completed'
xp_earned     integer
started_at    timestamp
completed_at  timestamp

UNIQUE INDEX (user_id, experiment_id)
```

### xp_events — события начисления XP
```sql
id            uuid PRIMARY KEY
user_id       uuid → users.id
amount        integer
reason        text               -- 'photo_generation' | 'video_generation' | 'experiment_complete' | ...
reference_id  uuid               -- id генерации/эксперимента
created_at    timestamp
```

### user_ratings — рейтинг пользователей
```sql
user_id       uuid → users.id PRIMARY KEY
total_xp      integer DEFAULT 0
rank          integer            -- позиция в лидерборде
badges_count  integer DEFAULT 0
updated_at    timestamp
```

### badges — список бейджей (11 штук)
```sql
id            uuid PRIMARY KEY
name          text               -- "Первопроходец", "Восходящая звезда", ...
description   text
icon_name     text               -- имя иконки HugeIcons
condition     jsonb              -- условие автовыдачи
created_at    timestamp
```

**11 бейджей**:
| Бейдж | Условие |
|-------|---------|
| Первопроходец | ≥1 эксперимент завершён |
| Восходящая звезда | totalXp ≥ 500 |
| Ракета | totalXp ≥ 2000 |
| Королевская особа | Активная подписка RoyalPass |
| Мастер генераций | ≥100 генераций |
| Ветеран | Аккаунт ≥3 месяцев |
| Молния | ≥10 генераций за один день |
| Чемпион | Ранг ≤ 3 |
| Снайпер | 5 подряд успешных генераций |
| Бриллиант | Все опубликованные эксперименты завершены |

### user_badges — бейджи пользователей
```sql
id            uuid PRIMARY KEY
user_id       uuid → users.id
badge_id      uuid → badges.id
earned_at     timestamp
```

### model_presets — пресеты параметров модели
```sql
id            uuid PRIMARY KEY
user_id       uuid → users.id ON DELETE CASCADE
model_id      text NOT NULL      -- slug модели
mode          text               -- t2v / i2v / edit / ...
name          text NOT NULL      -- название пресета (задаётся пользователем)
parameters    jsonb NOT NULL     -- сохранённые параметры формы
thumbnail_url text               -- превью из одной из генераций пресета
created_at    timestamp DEFAULT now()
updated_at    timestamp DEFAULT now()
```

### model_overrides — административные переопределения моделей
```sql
model_id          text PRIMARY KEY   -- slug модели, совпадает с generations.model_id
enabled           boolean DEFAULT true
badges            jsonb              -- массив строк-бейджей для UI: ["new", "hot", "beta"]
priority_override integer            -- переопределить порядок сортировки в списке
price_multiplier  numeric(5,3) DEFAULT 1.000  -- множитель базовой цены кредитов
updated_at        timestamp DEFAULT now()
```

### notifications — уведомления
```sql
id            uuid PRIMARY KEY
user_id       uuid → users.id
type          text               -- 'badge' | 'generation' | 'rank' | 'credits' | 'subscription' | 'xp' | 'system'
title         text
description   text
icon_name     text
reference_id  text               -- ID связанного объекта
is_read       boolean DEFAULT false
created_at    timestamp
```

---

## Индексы

```sql
-- Генерации
CREATE INDEX generations_user_created_idx ON generations(user_id, created_at DESC);
CREATE INDEX generations_model_id_idx ON generations(model_id);
CREATE INDEX generations_user_status_idx ON generations(user_id, status);
CREATE INDEX generations_parent_id_idx ON generations(parent_generation_id);

-- Пресеты моделей
CREATE INDEX model_presets_user_id_idx ON model_presets(user_id);

-- Проекты и чат
CREATE INDEX projects_user_id_idx ON projects(user_id);
CREATE INDEX chat_messages_project_id_idx ON chat_messages(project_id);

-- Эксперименты
CREATE INDEX user_experiments_user_status_idx ON user_experiments(user_id, status);

-- Рейтинг и XP
CREATE INDEX user_ratings_total_xp_idx ON user_ratings(total_xp DESC);  -- для лидерборда
CREATE INDEX xp_events_user_created_idx ON xp_events(user_id, created_at DESC);
CREATE INDEX user_badges_user_id_idx ON user_badges(user_id);

-- Уведомления
CREATE INDEX notifications_user_created_idx ON notifications(user_id, created_at DESC);
CREATE INDEX notifications_user_unread_idx ON notifications(user_id, is_read);

-- Платежи и кредиты
CREATE INDEX payment_logs_user_id_idx ON payment_logs(user_id);
CREATE INDEX credit_transactions_user_created_idx ON credit_transactions(user_id, created_at DESC);
CREATE INDEX subscriptions_user_id_idx ON subscriptions(user_id);
```

---

## Правила

- Все UUID генерируются на уровне БД (`defaultRandom()`)
- Списание кредитов — только через транзакцию с `FOR UPDATE` (row-level locking)
- XP пересчитывается через `ROW_NUMBER() OVER (ORDER BY total_xp DESC)`
- `payment_logs` никогда не удаляются, только статус меняется
- `notifications` создаются асинхронно, не блокируют основной поток
- Бейджи проверяются через `checkAndAwardBadges()` после ключевых действий
- При регистрации автоматически создаются: `user_credits`, `user_ratings`

---

## Модули запросов (src/lib/db/queries/)

| Файл | Функции |
|------|---------|
| `users.ts` | getUserById (join credits/rating/subscription), getUserByEmail, updateUserProfile |
| `credits.ts` | getCredits, deductCredits (atomic FOR UPDATE), addCredits |
| `generations.ts` | createGeneration, getGenerationById, getGenerationsByUser, updateGenerationStatus, deleteOldGenerations |
| `studio.ts` | getGenerationsByUser (limit/offset/modelId), getGenerationById (auth check), getActiveJobsByUser, countActiveJobsByUser, createGeneration, updateGenerationStatus (new fields), getPresetsByUser, getPresetById, createPreset, updatePreset, deletePreset |
| `projects.ts` | CRUD проектов + сообщения чата |
| `experiments.ts` | getPublishedExperiments, getUserExperiments, startExperiment, completeExperiment |
| `rating.ts` | getLeaderboard, getUserRating, addXp, recalculateRanks, getUserBadges, awardBadge |
| `notifications.ts` | getUserNotifications, markAllRead, createNotification |
| `payments.ts` | createPaymentLog, updatePaymentStatus, getPaymentHistory |
