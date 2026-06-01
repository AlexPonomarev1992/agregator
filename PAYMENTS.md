# Интеграция Т-Банк Acquiring

## Как работает

1. Клиент нажимает «Купить» → фронтенд вызывает `POST /api/payments/init`
2. Сервер создаёт заказ в таблице `payment_logs` со статусом `pending`
3. Сервер обращается к Т-Банк API Init и получает `PaymentURL`
4. Клиент редиректится на страницу оплаты Т-Банка
5. После оплаты Т-Банк отправляет вебхук на `POST /api/payments/webhook`
6. Сервер проверяет подпись вебхука (HMAC-SHA256)
7. Если статус `CONFIRMED`:
   - **Кредиты**: начисляются на баланс + запись в `credit_transactions` + уведомление
   - **Подписка**: создаётся/обновляется `subscriptions` + бейдж "Королевская особа" + уведомление
8. Все операции в одной транзакции (атомарность)

## Файлы

- `src/lib/payments/tbank.ts` — клиент Т-Банк API, верификация подписи
- `src/app/api/payments/init/route.ts` — инициализация платежа
- `src/app/api/payments/webhook/route.ts` — обработка вебхука
- `src/app/api/payments/history/route.ts` — история платежей

## Проверка подписи вебхука

```ts
// src/lib/payments/tbank.ts
export function verifyWebhookSignature(
  params: Record<string, string>,
  secretKey: string
): boolean {
  const { Token, ...rest } = params

  // Сортировать ключи по алфавиту, взять значения
  const values = Object.keys(rest)
    .sort()
    .map(key => rest[key])
    .join("")

  // SHA-256 от конкатенации значений + SecretKey
  const hash = crypto
    .createHash("sha256")
    .update(values + secretKey)
    .digest("hex")

  return hash === Token?.toLowerCase()
}
```

## Цены (в копейках)

| Продукт | Цена |
|---|---|
| 50 кредитов | 29 900 (299 ₽) |
| 150 кредитов | 79 900 (799 ₽) |
| 500 кредитов | 249 900 (2 499 ₽) |
| RoyalPass месяц | 99 900 (999 ₽) |
| RoyalPass год | 799 900 (7 999 ₽) |

## Статусы платежа

| Статус Т-Банк | Действие |
|---|---|
| `AUTHORIZED` | Ждём подтверждения |
| `CONFIRMED` | Начислить кредиты / активировать подписку |
| `CANCELLED` | Обновить статус на `cancelled` |
| `REJECTED` | Обновить статус на `cancelled` |

## Идемпотентность

Вебхук обрабатывает только платежи в статусе `pending`. Повторные вызовы для уже обработанных платежей игнорируются (non-critical path).

## Фоллбэк (development mode)

Если `TBANK_TERMINAL_KEY` не настроен, возвращается mock payment URL для тестирования.

## Тестовые карты

- Успешная оплата: `4300 0000 0000 0777`
- Отклонённая: `4300 0000 0000 0049`
- CVV: любые 3 цифры, срок: любой будущий

## Переменные окружения

| Переменная | Описание |
|---|---|
| `TBANK_API_URL` | URL API (default: `https://rest-api-test.tinkoff.ru/v2`) |
| `TBANK_TERMINAL_KEY` | Ключ терминала мерчанта |
| `TBANK_SECRET_KEY` | Секрет для подписи вебхуков |
| `TBANK_NOTIFICATION_URL` | URL для callback вебхука |
