// Утилита для работы с цветами стадий

// Дефолтные цвета для стадий
export const DEFAULT_STAGE_COLORS: Record<string, string> = {
  draft: '#6b7280', // gray-500
  design: '#3b82f6', // blue-500
  print: '#f59e0b', // yellow-500
  engraving: '#f97316', // orange-500
  workshop: '#8b5cf6', // purple-500
  die_cutting: '#10b981', // green-500
  final: '#10b981', // green-500
  completed: '#059669', // emerald-600
  cancelled: '#ef4444', // red-500
}

// Получить цвет стадии
export function getStageColor(stageName: string, customColor?: string): string {
  if (customColor) {
    return customColor
  }
  return DEFAULT_STAGE_COLORS[stageName] || '#6366f1'
}

// Получить CSS классы для стадии
export function getStageColorClasses(
  stageName: string,
  customColor?: string,
  isActive: boolean = true,
): string {
  const color = getStageColor(stageName, customColor)

  if (isActive) {
    return `bg-[${color}] text-white`
  } else {
    return `bg-[${color}] bg-opacity-20 text-[${color}]`
  }
}

// Получить стили для стадии
export function getStageColorStyles(
  stageName: string,
  customColor?: string,
): Record<string, string> {
  const color = getStageColor(stageName, customColor)

  return {
    backgroundColor: color,
    color: '#ffffff',
  }
}

// Расширенная палитра цветов для выбора
export const AVAILABLE_COLORS = [
  // Основные цвета
  { value: '#3b82f6', label: 'Синий' },
  { value: '#1d4ed8', label: 'Темно-синий' },
  { value: '#06b6d4', label: 'Голубой' },
  { value: '#0891b2', label: 'Бирюзовый' },
  { value: '#0ea5e9', label: 'Небесно-синий' },
  { value: '#0284c7', label: 'Кобальтовый' },

  // Зеленые оттенки
  { value: '#10b981', label: 'Зеленый' },
  { value: '#059669', label: 'Темно-зеленый' },
  { value: '#84cc16', label: 'Лаймовый' },
  { value: '#65a30d', label: 'Оливковый' },
  { value: '#22c55e', label: 'Изумрудный' },
  { value: '#16a34a', label: 'Лесной' },
  { value: '#4ade80', label: 'Мятный' },
  { value: '#22d3ee', label: 'Циан' },

  // Желтые и оранжевые
  { value: '#f59e0b', label: 'Желтый' },
  { value: '#d97706', label: 'Темно-желтый' },
  { value: '#f97316', label: 'Оранжевый' },
  { value: '#ea580c', label: 'Темно-оранжевый' },
  { value: '#fbbf24', label: 'Золотистый' },
  { value: '#f59e0b', label: 'Янтарный' },
  { value: '#fb923c', label: 'Коралловый' },
  { value: '#fdba74', label: 'Персиковый' },

  // Красные оттенки
  { value: '#ef4444', label: 'Красный' },
  { value: '#dc2626', label: 'Темно-красный' },
  { value: '#f43f5e', label: 'Розовый' },
  { value: '#e11d48', label: 'Малиновый' },
  { value: '#be185d', label: 'Бордовый' },
  { value: '#ec4899', label: 'Фуксия' },
  { value: '#f87171', label: 'Светло-красный' },
  { value: '#b91c1c', label: 'Кроваво-красный' },

  // Фиолетовые оттенки
  { value: '#8b5cf6', label: 'Фиолетовый' },
  { value: '#7c3aed', label: 'Темно-фиолетовый' },
  { value: '#a855f7', label: 'Пурпурный' },
  { value: '#9333ea', label: 'Темно-пурпурный' },
  { value: '#c084fc', label: 'Лавандовый' },
  { value: '#a78bfa', label: 'Светло-фиолетовый' },
  { value: '#7c2d12', label: 'Бургундский' },
  { value: '#581c87', label: 'Королевский' },

  // Серые оттенки
  { value: '#6b7280', label: 'Серый' },
  { value: '#4b5563', label: 'Темно-серый' },
  { value: '#9ca3af', label: 'Светло-серый' },
  { value: '#374151', label: 'Графитовый' },
  { value: '#d1d5db', label: 'Серебристый' },
  { value: '#111827', label: 'Угольный' },
  { value: '#f3f4f6', label: 'Белый дым' },
  { value: '#1f2937', label: 'Сланцевый' },

  // Дополнительные цвета
  { value: '#f97316', label: 'Тыквенный' },
  { value: '#84cc16', label: 'Лайм' },
  { value: '#06b6d4', label: 'Аквамарин' },
  { value: '#8b5cf6', label: 'Аметист' },
  { value: '#ec4899', label: 'Малина' },
  { value: '#f59e0b', label: 'Медовый' },
  { value: '#10b981', label: 'Изумруд' },
  { value: '#3b82f6', label: 'Сапфир' },
  { value: '#ef4444', label: 'Рубин' },
  { value: '#fbbf24', label: 'Топаз' },
  { value: '#a855f7', label: 'Аметист' },
  { value: '#22c55e', label: 'Малахит' },
  { value: '#0ea5e9', label: 'Аквамарин' },
  { value: '#f43f5e', label: 'Коралл' },
  { value: '#84cc16', label: 'Хризолит' },
  { value: '#8b5cf6', label: 'Аметист' },
  { value: '#f59e0b', label: 'Янтарь' },
  { value: '#10b981', label: 'Нефрит' },
  { value: '#3b82f6', label: 'Лазурит' },
  { value: '#ef4444', label: 'Гранат' },
  { value: '#fbbf24', label: 'Цитрин' },
  { value: '#a855f7', label: 'Кунцит' },
  { value: '#22c55e', label: 'Перидот' },
  { value: '#0ea5e9', label: 'Бирюза' },
  { value: '#f43f5e', label: 'Розовый кварц' },
  { value: '#84cc16', label: 'Хризопраз' },
  { value: '#8b5cf6', label: 'Чароит' },
  { value: '#f59e0b', label: 'Тигровый глаз' },
  { value: '#10b981', label: 'Авантюрин' },
  { value: '#3b82f6', label: 'Содалит' },
  { value: '#ef4444', label: 'Красный агат' },
  { value: '#fbbf24', label: 'Желтый агат' },
  { value: '#a855f7', label: 'Фиолетовый агат' },
  { value: '#22c55e', label: 'Зеленый агат' },
  { value: '#0ea5e9', label: 'Голубой агат' },
  { value: '#f43f5e', label: 'Розовый агат' },
  { value: '#84cc16', label: 'Зеленый халцедон' },
  { value: '#8b5cf6', label: 'Фиолетовый халцедон' },
  { value: '#f59e0b', label: 'Желтый халцедон' },
  { value: '#10b981', label: 'Зеленый сердолик' },
  { value: '#3b82f6', label: 'Синий сердолик' },
  { value: '#ef4444', label: 'Красный сердолик' },
  { value: '#fbbf24', label: 'Оранжевый сердолик' },
  { value: '#a855f7', label: 'Фиолетовый сердолик' },
  { value: '#22c55e', label: 'Зеленый сердолик' },
  { value: '#0ea5e9', label: 'Голубой сердолик' },
  { value: '#f43f5e', label: 'Розовый сердолик' },
  { value: '#84cc16', label: 'Зеленый оникс' },
  { value: '#8b5cf6', label: 'Фиолетовый оникс' },
  { value: '#f59e0b', label: 'Желтый оникс' },
  { value: '#10b981', label: 'Зеленый оникс' },
  { value: '#3b82f6', label: 'Синий оникс' },
  { value: '#ef4444', label: 'Красный оникс' },
  { value: '#fbbf24', label: 'Оранжевый оникс' },
  { value: '#a855f7', label: 'Фиолетовый оникс' },
  { value: '#22c55e', label: 'Зеленый оникс' },
  { value: '#0ea5e9', label: 'Голубой оникс' },
  { value: '#f43f5e', label: 'Розовый оникс' },
  { value: '#84cc16', label: 'Зеленый халцедон' },
  { value: '#8b5cf6', label: 'Фиолетовый халцедон' },
  { value: '#f59e0b', label: 'Желтый халцедон' },
  { value: '#10b981', label: 'Зеленый халцедон' },
  { value: '#3b82f6', label: 'Синий халцедон' },
  { value: '#ef4444', label: 'Красный халцедон' },
  { value: '#fbbf24', label: 'Оранжевый халцедон' },
  { value: '#a855f7', label: 'Фиолетовый халцедон' },
  { value: '#22c55e', label: 'Зеленый халцедон' },
  { value: '#0ea5e9', label: 'Голубой халцедон' },
  { value: '#f43f5e', label: 'Розовый халцедон' },
]
