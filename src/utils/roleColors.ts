// Утилита для работы с цветами ролей

// Дефолтные цвета для администратора и менеджера
const DEFAULT_ADMIN_COLORS: Record<string, string> = {
  admin: '#ef4444', // red-500
  manager: '#3b82f6', // blue-500
}

// Получить цвет роли на основе связанных стадий
export function getRoleColor(roleName: string, roleData?: any, stagesData?: any[]): string {
  // Администратор и менеджер всегда используют дефолтные цвета
  if (DEFAULT_ADMIN_COLORS[roleName]) {
    return DEFAULT_ADMIN_COLORS[roleName]
  }

  // Если есть кастомный цвет в данных роли
  if (roleData?.color) {
    return roleData.color
  }

  // Если есть связанные стадии, берем цвет первой стадии
  if (roleData?.stages && roleData.stages.length > 0) {
    const firstStage = roleData.stages[0]
    if (firstStage.color) {
      return firstStage.color
    }
  }

  // Если есть данные стадий, ищем стадию с этой ролью
  if (stagesData && stagesData.length > 0) {
    for (const stage of stagesData) {
      if (stage.roles && stage.roles.some((r: any) => r.name === roleName)) {
        if (stage.color) {
          return stage.color
        }
      }
    }
  }

  // Fallback к дефолтному цвету
  return '#6b7280'
}

// Получить CSS классы для роли
export function getRoleColorClasses(
  roleName: string,
  roleData?: any,
  stagesData?: any[],
  isActive: boolean = true,
): string {
  const color = getRoleColor(roleName, roleData, stagesData)

  // Администратор и менеджер всегда используют дефолтные цвета
  if (DEFAULT_ADMIN_COLORS[roleName]) {
    return 'font-semibold'
  }

  // Если есть кастомный цвет, используем только font-semibold
  if (color !== '#6b7280') {
    return 'font-semibold'
  }

  // Fallback к дефолтным Tailwind классам для известных ролей
  const colorMap: Record<string, { active: string; inactive: string }> = {
    designer: { active: 'bg-green-100 text-green-800', inactive: 'bg-green-50 text-green-600' },
    print_operator: {
      active: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-yellow-50 text-yellow-600',
    },
    workshop_worker: {
      active: 'bg-purple-100 text-purple-800',
      inactive: 'bg-purple-50 text-purple-600',
    },
  }

  const colors = colorMap[roleName] || {
    active: 'bg-gray-100 text-gray-800',
    inactive: 'bg-gray-50 text-gray-600',
  }

  return isActive ? colors.active : colors.inactive
}

// Получить стили для роли (inline стили для кастомных цветов)
export function getRoleColorStyles(
  roleName: string,
  roleData?: any,
  stagesData?: any[],
  isActive: boolean = true,
): Record<string, string> {
  const color = getRoleColor(roleName, roleData, stagesData)

  if (isActive) {
    return {
      backgroundColor: color,
      color: 'white', // Всегда белый текст для лучшей читаемости
    }
  } else {
    const lightColor = getLightColor(color)
    return {
      backgroundColor: lightColor,
      color: color,
    }
  }
}

// Функция для создания светлой версии цвета
export function getLightColor(hexColor: string): string {
  // Убираем # если есть
  const hex = hexColor.replace('#', '')

  // Парсим RGB
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  // Создаем светлую версию (добавляем 80% белого)
  const lightR = Math.round(r + (255 - r) * 0.8)
  const lightG = Math.round(g + (255 - g) * 0.8)
  const lightB = Math.round(b + (255 - b) * 0.8)

  return `rgb(${lightR}, ${lightG}, ${lightB})`
}

// Функция для определения контрастного цвета текста
export function getContrastColor(hexColor: string): string {
  // Убираем # если есть
  const hex = hexColor.replace('#', '')

  // Парсим RGB
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  // Вычисляем яркость
  const brightness = (r * 299 + g * 587 + b * 114) / 1000

  // Возвращаем черный или белый в зависимости от яркости
  return brightness > 128 ? '#000000' : '#ffffff'
}

// Функция для получения метки роли
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Администратор',
    manager: 'Менеджер',
    designer: 'Дизайнер',
    print_operator: 'Печатник',
    workshop_worker: 'Работник цеха',
  }
  return labels[role] || role
}

// Расширенная палитра цветов для выбора ролей
export const AVAILABLE_ROLE_COLORS = [
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

  // Серые оттенки
  { value: '#6b7280', label: 'Серый' },
  { value: '#4b5563', label: 'Темно-серый' },
  { value: '#9ca3af', label: 'Светло-серый' },
  { value: '#374151', label: 'Графитовый' },
  { value: '#d1d5db', label: 'Серебристый' },
  { value: '#111827', label: 'Угольный' },
  { value: '#f3f4f6', label: 'Белый дым' },
  { value: '#1f2937', label: 'Сланцевый' },
]
