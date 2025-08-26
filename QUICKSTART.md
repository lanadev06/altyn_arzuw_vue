# 🚀 Быстрый старт - Alytn Arzuw Frontend

## ⚡ За 5 минут

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка окружения
Создайте `.env.local`:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### 3. Запуск
```bash
npm run dev
```

Готово! 🎉 Приложение доступно по адресу: `http://localhost:5173`

## 🔧 Основные команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск в режиме разработки |
| `npm run build` | Сборка для продакшена |
| `npm run preview` | Предварительный просмотр сборки |
| `npm run lint` | Проверка кода |
| `npm run test` | Запуск тестов |

## 📁 Структура проекта

```
src/
├── components/     # Компоненты
├── views/         # Страницы
├── services/      # API
├── utils/         # Утилиты
└── types/         # TypeScript типы
```

## 🎯 Основные компоненты

- **Layout** - основной макет
- **OrderList** - список заказов
- **OrderKanban** - канбан доска
- **Modal** - модальные окна

## 🔌 API интеграция

```typescript
import { getOrders, createOrder } from '@/services/api'

// Получить заказы
const orders = await getOrders({ page: '1' })

// Создать заказ
const newOrder = await createOrder(orderData)
```

## 🎨 Стилизация

Используйте Tailwind CSS классы:

```vue
<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <h2 class="text-xl font-bold text-gray-900 mb-4">
      {{ title }}
    </h2>
    <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
      {{ buttonText }}
    </button>
  </div>
</template>
```

## 📱 Адаптивность

```vue
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <!-- Адаптивная сетка -->
  </div>
</template>
```

## 🔒 Безопасность

```typescript
import { canCreateEdit, canViewAllUsers } from '@/utils/permissions'

// Проверка разрешений
if (canCreateEdit()) {
  // Показать кнопку создания
}
```

## 🚀 Готово к разработке!

Теперь вы можете:
- Создавать новые компоненты
- Добавлять новые страницы
- Интегрировать с API
- Стилизовать интерфейс

**Удачи в разработке! 🎉**

