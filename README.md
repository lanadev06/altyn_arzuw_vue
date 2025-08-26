# 🚀 Alytn Arzuw - Frontend (Vue.js)

Современный фронтенд для системы управления заказами и проектами, построенный на Vue 3 с TypeScript.

## 📋 Содержание

- [Технологии](#технологии)
- [Установка и запуск](#установка-и-запуск)
- [Архитектура проекта](#архитектура-проекта)
- [Компоненты](#компоненты)
- [API интеграция](#api-интеграция)
- [Состояние приложения](#состояние-приложения)
- [Маршрутизация](#маршрутизация)
- [Утилиты и хелперы](#утилиты-и-хелперы)
- [Разработка](#разработка)
- [Производительность](#производительность)
- [Безопасность](#безопасность)

## 🛠 Технологии

- **Vue 3** - современный фреймворк с Composition API
- **TypeScript** - типизированный JavaScript
- **Vite** - быстрый сборщик и dev-сервер
- **Tailwind CSS** - utility-first CSS фреймворк
- **Vue Router 4** - маршрутизация для Vue 3
- **Pinia** - управление состоянием (готово к миграции)
- **Axios** - HTTP клиент для API запросов

## 🚀 Установка и запуск

### Предварительные требования

- Node.js 18+ 
- npm или yarn
- Backend Laravel API (должен быть запущен)

### Установка зависимостей

```bash
npm install
# или
yarn install
```

### Настройка окружения

Создайте файл `.env.local` в корне проекта:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_TITLE=Alytn Arzuw
VITE_APP_VERSION=1.0.0
```

### Запуск в режиме разработки

```bash
npm run dev
# или
yarn dev
```

Приложение будет доступно по адресу: `http://localhost:5173`

### Сборка для продакшена

```bash
npm run build
# или
yarn build
```

### Предварительный просмотр сборки

```bash
npm run preview
# или
yarn preview
```

## 🏗 Архитектура проекта

```
src/
├── assets/          # Статические ресурсы (CSS, изображения)
├── components/      # Переиспользуемые компоненты
├── composables/     # Vue 3 composables
├── config/          # Конфигурация приложения
├── controllers/     # Контроллеры для управления состоянием
├── router/          # Конфигурация маршрутизации
├── services/        # API сервисы и внешние интеграции
├── stores/          # Управление состоянием (готово к Pinia)
├── types/           # TypeScript типы и интерфейсы
├── utils/           # Утилиты и хелперы
├── views/           # Страницы приложения
├── App.vue          # Корневой компонент
└── main.ts          # Точка входа
```

## 🧩 Компоненты

### Основные компоненты

- **Layout** - основной макет приложения
- **Navbar** - навигационная панель
- **Sidebar** - боковая панель навигации
- **Modal** - модальные окна
- **Toast** - уведомления

### Специализированные компоненты

#### Заказы
- `OrderList` - список заказов в табличном виде
- `OrderKanban` - канбан доска для заказов
- `OrderDetailsModal` - детальная информация о заказе
- `OrderFormModal` - форма создания/редактирования заказа

#### Клиенты
- `ClientList` - список клиентов
- `ClientFormModal` - форма клиента

#### Продукты
- `ProductList` - список продуктов
- `ProductFormModal` - форма продукта

#### Пользователи
- `UserList` - список пользователей
- `UserFormModal` - форма пользователя

## 🔌 API интеграция

### Конфигурация API

```typescript
// config/api.ts
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  TIMEOUT: 30000,
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
}
```

### Основные API функции

```typescript
// services/api.ts
export async function getOrders(params: OrderParams): Promise<PaginatedResponse<Order>>
export async function createOrder(data: CreateOrderData): Promise<Order>
export async function updateOrder(id: number, data: UpdateOrderData): Promise<Order>
export async function deleteOrder(id: number): Promise<void>
```

### Обработка ошибок

```typescript
// utils/errorHandler.ts
export function handleApiError(error: any): string {
  if (error.response?.status === 401) {
    // Обработка неавторизованного доступа
    handle401Error()
    return 'Сессия истекла'
  }
  return error.message || 'Произошла ошибка'
}
```

## 📊 Состояние приложения

### Текущая архитектура

Проект использует **реактивные переменные Vue 3** с готовностью к миграции на Pinia:

```typescript
// controllers/OrderController.ts
export function useOrderController() {
  const orders = ref<Order[]>([])
  const pagination = reactive({...})
  const loading = ref(false)
  
  // ... методы управления состоянием
}
```

### Планируемая миграция на Pinia

```typescript
// stores/orders.ts (готово к использованию)
export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<Order[]>([])
  const pagination = reactive({...})
  
  const fetchOrders = async (params: OrderParams) => {
    // логика загрузки
  }
  
  return { orders, pagination, fetchOrders }
})
```

## 🛣 Маршрутизация

### Конфигурация маршрутов

```typescript
// router/index.ts
const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/orders',
    name: 'Orders',
    component: OrdersView,
    meta: { requiresAuth: true }
  }
  // ... другие маршруты
]
```

### Защищенные маршруты

```typescript
// router/index.ts
router.beforeEach((to, from, next) => {
  const isAuthenticated = checkAuthStatus()
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})
```

## 🛠 Утилиты и хелперы

### Авторизация

```typescript
// utils/auth.ts
export function getCurrentUser(): User | null
export function checkAuthStatus(): boolean
export function handle401Error(): void
```

### Разрешения

```typescript
// utils/permissions.ts
export function canCreateEdit(): boolean
export function canViewAllUsers(): boolean
export function canViewAllClients(): boolean
```

### Безопасные данные

```typescript
// utils/safeData.ts
export function safeApiRequest<T>(request: () => Promise<T>): Promise<T>
export function safeProcessActivityData(data: any): any
```

### Цвета и стили

```typescript
// utils/stageColors.ts
export function stageColor(stageName: string): string
export function stageColorStyle(stageName: string): CSSProperties
export function getContrastColor(backgroundColor: string): string
```

## 🔧 Разработка

### Структура компонента

```vue
<template>
  <!-- Шаблон компонента -->
</template>

<script setup lang="ts">
// Импорты
import { ref, computed, onMounted } from 'vue'
import type { ComponentProps } from '@/types'

// Props
interface Props {
  title: string
  data?: any[]
}
const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  update: [value: any]
  close: []
}>()

// Состояние
const loading = ref(false)
const error = ref('')

// Computed
const processedData = computed(() => {
  return props.data?.map(item => processItem(item)) || []
})

// Методы
const handleUpdate = (value: any) => {
  emit('update', value)
}

// Lifecycle
onMounted(() => {
  // Инициализация
})
</script>

<style scoped>
/* Стили компонента */
</style>
```

### TypeScript типы

```typescript
// types/api.ts
export interface Order {
  id: number
  client_id: number
  product_id: number
  quantity: number
  stage?: string
  created_at: string
  updated_at: string
  client?: Client
  product?: Product
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  total: number
  per_page: number
}
```

## ⚡ Производительность

### Оптимизации

✅ **Отсутствие N+1 проблем** - все данные загружаются одним API вызовом
✅ **Eager loading** - связанные данные загружаются вместе с основными
✅ **Кэширование** - данные хранятся в состоянии компонентов
✅ **Ленивая загрузка** - компоненты загружаются по требованию

### Лучшие практики

```typescript
// ✅ Хорошо - один API вызов
const fetchOrders = async () => {
  const response = await getOrders(params)
  orders.value = response.data // Все данные загружены
}

// ❌ Плохо - множественные API вызовы
orders.value.forEach(async (order) => {
  const details = await getOrderDetails(order.id) // N+1 проблема!
})
```

## 🔒 Безопасность

### Аутентификация

- JWT токены через Laravel Sanctum
- Автоматическое обновление токенов
- Обработка 401 ошибок

### Авторизация

- Проверка ролей пользователя
- Защищенные маршруты
- Условное отображение элементов

### Валидация данных

- TypeScript типы для всех API ответов
- Проверка данных перед отправкой
- Обработка ошибок валидации

## 📱 Адаптивность

### Tailwind CSS классы

```vue
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <!-- Адаптивная сетка -->
  </div>
</template>
```

### Breakpoints

- `sm`: 640px+
- `md`: 768px+
- `lg`: 1024px+
- `xl`: 1280px+
- `2xl`: 1536px+

## 🧪 Тестирование

### Unit тесты

```bash
npm run test:unit
```

### E2E тесты

```bash
npm run test:e2e
```

### Покрытие кода

```bash
npm run test:coverage
```

## 🚀 Деплой

### Сборка

```bash
npm run build
```

### Предварительный просмотр

```bash
npm run preview
```

### Деплой на сервер

```bash
# Копируем dist/ папку на сервер
scp -r dist/ user@server:/var/www/html/
```

## 📚 Дополнительные ресурсы

- [Vue 3 Documentation](https://vuejs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект является частью системы Alytn Arzuw и защищен авторским правом.

## 📞 Поддержка

Если у вас есть вопросы или предложения:

- Создайте Issue в репозитории
- Обратитесь к команде разработки
- Проверьте документацию по API

---

**Создано с ❤️ командой LTM**

