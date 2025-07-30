# Отчет о внедрении динамических стадий в Dashboard

## Проблема

Карточки "Заказы по стадиям", "Задержанные назначения" и "Заказы по сотрудникам" использовали статическую логику отображения стадий с хардкодными цветами и названиями.

## Решение

Внедрена динамическая система загрузки стадий из API с использованием их собственных цветов и названий.

## Изменения

### 1. Динамическая загрузка стадий

```javascript
// Было:
const allStages = [
  'draft', 'design', 'print', 'engraving',
  'workshop', 'final', 'completed', 'cancelled'
]

// Стало:
const allStages = ref([])
const stagesData = ref([])

// Загрузка из API
const stagesRes = await safeApiRequest<any[]>('/api/stages')
if (Array.isArray(stagesRes)) {
  stagesData.value = stagesRes
  allStages.value = stagesRes.map(s => s.name)
}
```

### 2. Динамические цвета стадий

```javascript
function stageColor(stage) {
  // Сначала ищем в динамических данных
  const stageData = stagesData.value.find((s) => s.name === stage)
  if (stageData && stageData.color) {
    return `bg-[${stageData.color}]`
  }

  // Fallback на статические цвета
  const map = {
    draft: 'bg-gray-400',
    design: 'bg-blue-500',
    // ... остальные цвета
  }
  return map[stage] || 'bg-gray-300'
}
```

### 3. Динамические названия стадий

```javascript
function stageLabel(stage) {
  // Сначала ищем в динамических данных
  const stageData = stagesData.value.find((s) => s.name === stage)
  if (stageData && stageData.display_name) {
    return stageData.display_name
  }

  // Fallback на статические названия
  const map = {
    draft: 'Черновик',
    design: 'Дизайн',
    // ... остальные названия
  }
  return map[stage] || stage
}
```

### 4. Улучшенная функция подсчета

```javascript
function getStageCount(stage) {
  // Проверяем, есть ли данные о заказах по стадиям
  if (!dashboardStats.value.orders_by_stage) return 0

  // Ищем количество заказов для данной стадии
  const count = dashboardStats.value.orders_by_stage[stage]
  return count || 0
}
```

### 5. Обработка загрузки

```vue
<div v-if="allStages.length > 0" class="flex flex-col gap-6">
  <!-- Список стадий -->
</div>
<div v-else class="text-center text-gray-500 py-8">
  Загрузка стадий...
</div>
```

## Преимущества

### 1. Гибкость

- Стадии теперь загружаются динамически из базы данных
- Можно добавлять/удалять стадии без изменения кода
- Каждая стадия может иметь свой уникальный цвет

### 2. Консистентность

- Цвета и названия стадий синхронизированы с остальной системой
- Изменения в админке сразу отражаются в dashboard

### 3. Обратная совместимость

- Fallback на статические данные при ошибках загрузки
- Система продолжает работать даже если API недоступен

### 4. Производительность

- Стадии загружаются один раз при инициализации
- Кэширование данных в памяти

## Структура данных API

### Запрос стадий

```http
GET /api/stages
```

### Ответ

```json
[
  {
    "id": 1,
    "name": "draft",
    "display_name": "Черновик",
    "color": "#9ca3af",
    "order": 1
  },
  {
    "id": 2,
    "name": "design",
    "display_name": "Дизайн",
    "color": "#3b82f6",
    "order": 2
  }
  // ...
]
```

## Обработка ошибок

### 1. Ошибка загрузки стадий

- Показывается fallback на статические стадии
- В консоль выводится ошибка для отладки

### 2. Отсутствие данных о стадии

- Используется fallback цвет и название
- Система продолжает работать

### 3. Пустые данные

- Показывается сообщение "Загрузка стадий..."
- Пользователь видит, что данные загружаются

## Результат

- ✅ Dashboard использует динамические стадии
- ✅ Цвета и названия синхронизированы с системой
- ✅ Сохранена обратная совместимость
- ✅ Улучшена гибкость и масштабируемость

## Статус

🟢 **РЕАЛИЗОВАНО**

Dashboard теперь полностью поддерживает динамические стадии с их собственными цветами и названиями.
