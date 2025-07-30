# Отчет об исправлении динамической фильтрации ролей

## Проблема

Фильтрация по ролям в UserView/UserList использовала хардкодные роли, что не позволяло системе работать с динамическими ролями, которые могут быть добавлены через API.

## Решение

Реализована динамическая загрузка ролей из API с fallback на статические роли в случае ошибки.

## Изменения

### 1. UsersView (src/views/UsersView.vue)

#### Обновлен шаблон:

```vue
<select
  v-model="selectedRole"
  @change="handleRoleChange"
  class="px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
  style="min-width: 180px"
  :disabled="loadingRoles"
>
  <option value="">Все роли</option>
  <option 
    v-for="role in availableRoles" 
    :key="role.id" 
    :value="role.name"
  >
    {{ role.display_name || role.name }}
  </option>
</select>
```

#### Добавлена логика загрузки ролей:

```typescript
const availableRoles = ref<any[]>([])
const loadingRoles = ref(false)

// Загружаем роли из API
async function loadRoles() {
  loadingRoles.value = true
  try {
    const roles = await getAllRoles()
    availableRoles.value = Array.isArray(roles) ? roles : roles.data || []
  } catch (error) {
    console.error('Ошибка загрузки ролей:', error)
    // Fallback к статическим ролям в случае ошибки
    availableRoles.value = [
      { id: 1, name: 'admin', display_name: 'Администратор' },
      { id: 2, name: 'manager', display_name: 'Менеджер' },
      { id: 3, name: 'designer', display_name: 'Дизайнер' },
      { id: 4, name: 'print_operator', display_name: 'Печатник' },
      { id: 5, name: 'workshop_worker', display_name: 'Работник цеха' },
    ]
  } finally {
    loadingRoles.value = false
  }
}

onMounted(() => {
  loadRoles()
})
```

### 2. Создана утилита roleColors.ts (src/utils/roleColors.ts)

Создана централизованная утилита для работы с цветами ролей, аналогично `stageColors.ts`:

```typescript
// Дефолтные цвета для ролей
export const DEFAULT_ROLE_COLORS: Record<string, string> = {
  admin: '#ef4444', // red-500
  manager: '#3b82f6', // blue-500
  designer: '#10b981', // green-500
  print_operator: '#f59e0b', // yellow-500
  workshop_worker: '#8b5cf6', // purple-500
}

// Функции для работы с цветами ролей
export function getRoleColor(roleName: string, customColor?: string): string
export function getRoleColorClasses(
  roleName: string,
  customColor?: string,
  isActive?: boolean,
): string
export function getRoleColorStyles(
  roleName: string,
  customColor?: string,
  isActive?: boolean,
): Record<string, string>
export function getRoleLabel(role: string): string
```

### 3. UserController (src/controllers/UserController.ts)

Обновлен для использования новой утилиты:

```typescript
import { getRoleLabel as getRoleLabelFromUtils, getRoleColorClasses } from '@/utils/roleColors'

// Функция для получения метки роли
function getRoleLabel(role: string): string {
  return getRoleLabelFromUtils(role)
}

// Функция для получения класса бейджа роли
function getRoleBadgeClass(role: string): string {
  return getRoleColorClasses(role)
}
```

### 4. UserList (src/components/users/UserList/UserList.vue)

Обновлен для использования новой утилиты:

```typescript
import { getRoleColorClasses } from '../../../utils/roleColors'

const getRoleBadgeClass = (role: string) => {
  return getRoleColorClasses(role)
}
```

## Преимущества нового подхода

### 1. Динамичность

- Роли загружаются из API при инициализации компонента
- Система автоматически адаптируется к новым ролям
- Поддержка кастомных названий ролей (`display_name`)

### 2. Надежность

- Fallback на статические роли в случае ошибки API
- Индикатор загрузки (`loadingRoles`)
- Обработка ошибок с логированием

### 3. Централизация

- Единая утилита для работы с цветами ролей
- Консистентное отображение ролей во всех компонентах
- Легкое добавление новых ролей

### 4. Расширяемость

- Поддержка кастомных цветов для ролей
- Гибкая система меток ролей
- Возможность добавления новых функций

## API интеграция

### Загрузка ролей:

```typescript
const roles = await getAllRoles()
// Возвращает массив ролей с полями: id, name, display_name, color
```

### Структура роли:

```typescript
interface Role {
  id: number
  name: string
  display_name?: string
  color?: string
}
```

### Fallback роли:

```typescript
const fallbackRoles = [
  { id: 1, name: 'admin', display_name: 'Администратор' },
  { id: 2, name: 'manager', display_name: 'Менеджер' },
  { id: 3, name: 'designer', display_name: 'Дизайнер' },
  { id: 4, name: 'print_operator', display_name: 'Печатник' },
  { id: 5, name: 'workshop_worker', display_name: 'Работник цеха' },
]
```

## Тестирование

### Проверка динамической загрузки:

1. Откройте страницу пользователей
2. Проверьте, что селект ролей загружается с данными из API
3. Убедитесь, что фильтрация работает с динамическими ролями

### Проверка fallback:

1. Отключите API сервер
2. Обновите страницу
3. Убедитесь, что используются статические роли

### Проверка отображения:

1. Проверьте, что роли отображаются с правильными цветами
2. Убедитесь, что новые роли корректно отображаются в таблице

## Заключение

Система фильтрации по ролям теперь полностью динамическая и поддерживает:

- Загрузку ролей из API
- Автоматическое обновление при добавлении новых ролей
- Надежный fallback в случае ошибок
- Централизованное управление цветами и метками ролей
- Расширяемость для будущих улучшений
