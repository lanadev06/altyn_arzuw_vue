# Отчет об исправлении динамических цветов ролей

## Проблема

Цвета ролей были статическими и не соответствовали цветам связанных стадий. Роли отображались с хардкодными цветами, что не позволяло системе адаптироваться к изменениям цветов стадий.

## Решение

Реализована динамическая система цветов ролей, которая:

1. Загружает роли со связанными стадиями из API
2. Использует цвета связанных стадий для ролей
3. Поддерживает кастомные цвета ролей
4. Имеет fallback на дефолтные цвета

## Изменения

### 1. API Service (src/services/api.ts)

Добавлена функция для загрузки ролей со стадиями:

```typescript
// Получить роли со связанными стадиями и их цветами
export async function getRolesWithStages(): Promise<any> {
  const res = await apiRequest('/roles?with=stages')
  return res
}
```

### 2. Утилита roleColors.ts (src/utils/roleColors.ts)

Полностью переработана логика получения цветов ролей:

#### Новая функция getRoleColor:

```typescript
// Дефолтные цвета для администратора и менеджера
const DEFAULT_ADMIN_COLORS = {
  admin: '#ef4444', // red-500
  manager: '#3b82f6', // blue-500
}

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
```

#### Обновленные функции:

```typescript
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
    return ''
  }

  // Если есть кастомный цвет, используем inline стили
  if (color !== '#6b7280') {
    return ''
  }

  // Fallback к дефолтным Tailwind классам для других ролей
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
): Record<string, string>
```

### 3. UsersView (src/views/UsersView.vue)

Обновлена загрузка ролей для получения связанных стадий:

```typescript
const availableRoles = ref<any[]>([])
const loadingRoles = ref(false)
const stagesData = ref<any[]>([])

// Загружаем роли и стадии из API
async function loadRoles() {
  loadingRoles.value = true
  try {
    // Загружаем роли со связанными стадиями
    const rolesResponse = await getRolesWithStages()
    const roles = Array.isArray(rolesResponse) ? rolesResponse : rolesResponse.data || []

    // Загружаем стадии для дополнительной информации о цветах
    const stagesResponse = await getAllStages()
    const stages = Array.isArray(stagesResponse) ? stagesResponse : stagesResponse.data || []

    availableRoles.value = roles
    stagesData.value = stages
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
    stagesData.value = []
  } finally {
    loadingRoles.value = false
  }
}
```

Передача данных в UserList:

```vue
<UserList
  :search="search"
  :role="selectedRole"
  :activeFilter="activeFilter"
  :showCreateModal="showCreateModal"
  :roles-data="availableRoles"
  :stages-data="stagesData"
  @close-create-modal="closeCreateModal"
/>
```

### 4. UserList (src/components/users/UserList/UserList.vue)

Обновлены props и функции для работы с динамическими цветами:

#### Новые props:

```typescript
const props = defineProps<{
  search?: string
  role?: string
  showCreateModal?: boolean
  activeFilter?: string
  rolesData?: any[]
  stagesData?: any[]
}>()
```

#### Обновленные функции:

```typescript
const getRoleBadgeClass = (role: string) => {
  // Находим данные роли
  const roleData = props.rolesData?.find((r) => r.name === role)
  return getRoleColorClasses(role, roleData, props.stagesData)
}

const getRoleBadgeStyle = (role: string) => {
  // Находим данные роли
  const roleData = props.rolesData?.find((r) => r.name === role)
  return getRoleColorStyles(role, roleData, props.stagesData)
}
```

#### Обновленный шаблон:

```vue
<span
  v-for="role in user.roles"
  :key="role.id"
  class="px-2 py-1 rounded-full text-xs font-medium mr-1"
  :class="getRoleBadgeClass(role.name)"
  :style="getRoleBadgeStyle(role.name)"
>
  {{ getRoleLabel(role.display_name || role.name) }}
</span>
```

### 5. UserController (src/controllers/UserController.ts)

Обновлена функция getRoleBadgeClass:

```typescript
// Функция для получения класса бейджа роли
function getRoleBadgeClass(role: string, roleData?: any, stagesData?: any[]): string {
  return getRoleColorClasses(role, roleData, stagesData)
}
```

## Логика определения цветов ролей

### Специальные дефолтные цвета

Администратор и менеджер имеют фиксированные цвета, которые не зависят от стадий:

```typescript
const DEFAULT_ADMIN_COLORS = {
  admin: '#ef4444', // red-500 - красный
  manager: '#3b82f6', // blue-500 - синий
}
```

Эти роли всегда используют свои дефолтные цвета, независимо от связей со стадиями или кастомных настроек.

### Приоритет цветов:

1. **Дефолтные цвета администратора и менеджера** - всегда используют статические цвета
2. **Кастомный цвет роли** - если роль имеет собственный цвет
3. **Цвет связанной стадии** - если роль связана со стадией, используем её цвет
4. **Цвет стадии по имени** - ищем стадию, которая использует эту роль
5. **Дефолтный цвет** - серый цвет для неизвестных ролей

### Примеры:

- Роль "Администратор" → всегда красный цвет (дефолтный)
- Роль "Менеджер" → всегда синий цвет (дефолтный)
- Роль "Дизайнер" связана со стадией "Дизайн" (синий цвет) → синий цвет
- Роль "Печатник" связана со стадией "Печать" (желтый цвет) → желтый цвет
- Роль с кастомным цветом → кастомный цвет

## Преимущества нового подхода

### 1. Динамичность

- Цвета ролей автоматически адаптируются к цветам связанных стадий
- Изменение цвета стадии автоматически обновляет цвета связанных ролей
- Поддержка кастомных цветов для ролей
- Фиксированные цвета для администратора и менеджера

### 2. Консистентность

- Роли и стадии имеют согласованные цвета
- Визуальная связь между ролями и их функциями
- Единообразное отображение во всех компонентах

### 3. Гибкость

- Возможность настройки цветов на уровне ролей
- Автоматическое наследование цветов от стадий
- Fallback система для надежности

### 4. Расширяемость

- Легкое добавление новых ролей и стадий
- Поддержка сложных связей между ролями и стадиями
- Возможность добавления новых типов цветов

## API интеграция

### Загрузка ролей со стадиями:

```typescript
const roles = await getRolesWithStages()
// Возвращает роли с полями: id, name, display_name, color, stages[]
```

### Структура данных:

```typescript
interface Role {
  id: number
  name: string
  display_name?: string
  color?: string
  stages?: Stage[]
}

interface Stage {
  id: number
  name: string
  display_name?: string
  color?: string
  roles?: Role[]
}
```

## Тестирование

### Проверка динамических цветов:

1. Откройте страницу пользователей
2. Проверьте, что роли отображаются с цветами связанных стадий
3. Измените цвет стадии в админке
4. Убедитесь, что цвета ролей обновились

### Проверка дефолтных цветов администратора и менеджера:

1. Проверьте, что администратор всегда отображается красным цветом
2. Проверьте, что менеджер всегда отображается синим цветом
3. Убедитесь, что эти цвета не меняются при изменении цветов стадий

### Проверка кастомных цветов:

1. Создайте роль с кастомным цветом
2. Убедитесь, что роль отображается с кастомным цветом
3. Проверьте, что кастомный цвет имеет приоритет над цветом стадии

### Проверка fallback:

1. Создайте роль без связей со стадиями
2. Убедитесь, что роль отображается с дефолтным серым цветом

## Заключение

Система цветов ролей теперь полностью динамическая и:

- Автоматически адаптируется к цветам связанных стадий
- Поддерживает кастомные цвета ролей
- Обеспечивает визуальную консистентность
- Имеет надежную систему fallback
- Легко расширяется для новых требований
