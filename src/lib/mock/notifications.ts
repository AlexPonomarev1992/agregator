export type NotificationType = 'badge' | 'generation' | 'rank' | 'system' | 'credits' | 'subscription';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  isRead: boolean;
  iconName: string;
}

export const mockNotifications: AppNotification[] = [
  {
    id: 'n-001',
    type: 'badge',
    title: 'Новый бейдж',
    description: 'Вы получили бейдж "Первопроходец"',
    time: '5 мин назад',
    isRead: false,
    iconName: 'Award',
  },
  {
    id: 'n-002',
    type: 'generation',
    title: 'Генерация завершена',
    description: 'Видео "Закат над городом" готово к просмотру',
    time: '15 мин назад',
    isRead: false,
    iconName: 'Video',
  },
  {
    id: 'n-003',
    type: 'rank',
    title: 'Ранг повысился',
    description: 'Ваш ранг повысился до #5 в рейтинге',
    time: '1 час назад',
    isRead: false,
    iconName: 'TrendingUp',
  },
  {
    id: 'n-004',
    type: 'credits',
    title: 'Кредиты зачислены',
    description: 'На ваш баланс зачислено 50 кредитов',
    time: '3 часа назад',
    isRead: true,
    iconName: 'Coins',
  },
  {
    id: 'n-005',
    type: 'generation',
    title: 'Генерация завершена',
    description: 'Фото "Портрет в стиле Ренессанс" готово',
    time: '5 часов назад',
    isRead: true,
    iconName: 'Image',
  },
  {
    id: 'n-006',
    type: 'badge',
    title: 'Новый бейдж',
    description: 'Вы получили бейдж "Креативный гений"',
    time: '1 день назад',
    isRead: true,
    iconName: 'Award',
  },
  {
    id: 'n-007',
    type: 'subscription',
    title: 'RoyalPass активен',
    description: 'Ваша подписка RoyalPass успешно продлена',
    time: '2 дня назад',
    isRead: true,
    iconName: 'Crown',
  },
  {
    id: 'n-008',
    type: 'system',
    title: 'Добро пожаловать в VibeLab!',
    description: 'Начните с создания первого проекта',
    time: '2 дня назад',
    isRead: true,
    iconName: 'Sparkles',
  },
  {
    id: 'n-009',
    type: 'rank',
    title: 'Новый XP',
    description: 'Вы получили 150 XP за завершение эксперимента',
    time: '3 дня назад',
    isRead: true,
    iconName: 'Zap',
  },
  {
    id: 'n-010',
    type: 'system',
    title: 'Обновление платформы',
    description: 'Добавлена поддержка новых моделей генерации',
    time: '5 дней назад',
    isRead: true,
    iconName: 'RefreshCw',
  },
];
