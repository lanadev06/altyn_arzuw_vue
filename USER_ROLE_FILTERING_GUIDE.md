# Руководство по фильтрации по ролям в UserView/UserList

## Обзор системы фильтрации

Система фильтрации пользователей по ролям работает на нескольких уровнях:

1. **UsersView** - компонент с UI элементами фильтрации
2. **UserList** - компонент с логикой фильтрации и отображения
3. **UserController** - контроллер с бизнес-логикой
4. **API Service** - сервис для API запросов

## Архитектура фильтрации

### 1. UsersView (src/views/UsersView.vue)

```vue
<template>
  <Layout v-slot="{ search }">
    <div class="flex items-center justify-between mb-3 gap-4">
      <div class="flex items-center gap-4">
        <!-- Селект для фильтрации по ролям -->
        <select
          v-model="selectedRole"
          @change="handleRoleChange"
          class="px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          style="min-width: 180px"
        >
          <option value="">Все роли</option>
          <option value="admin">Администратор</option>
          <option value="manager">Менеджер</option>
          <option value="designer">Дизайнер</option>
          <option value="print_operator">Печатник</option>
          <option value="workshop_worker">Работник цеха</option>
        </select>

        <!-- Селект для фильтрации по активности -->
        <select
          v-model="activeFilter"
          class="px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          style="min-width: 180px"
        >
          <option value="">Все пользователи</option>
          <option value="1">Только активные</option>
          <option value="0">Только неактивные</option>
        </select>
      </div>
      <UIButton @click="openCreateModal" variant="primary">Добавить пользователя</UIButton>
    </div>

    <!-- Передача параметров в UserList -->
    <UserList
      :search="search"
      :role="selectedRole"
      :activeFilter="activeFilter"
      :showCreateModal="showCreateModal"
      @close-create-modal="closeCreateModal"
    />
  </Layout>
</template>
```

**Ключевые моменты:**

- `selectedRole` - реактивная переменная для выбранной роли
- `activeFilter` - реактивная переменная для фильтра активности
- Параметры передаются в `UserList` как props

### 2. UserList (src/components/users/UserList/UserList.vue)

#### Props и реактивность:

```typescript
const props = defineProps<{
  search?: string
  role?: string
  showCreateModal?: boolean
  activeFilter?: string
}>()
```

#### Watch для реактивной фильтрации:

```typescript
// Следим за изменениями фильтров и сбрасываем на первую страницу
watch([() => props.search, () => props.role, () => props.activeFilter], () => {
  goToPage(1)
})

// Следим за изменениями сортировки
watch([sortBy, sortOrder], () => {
  fetchUsers(
    currentPage.value,
    props.search || '',
    sortBy.value,
    sortOrder.value,
    perPage.value,
    props.role,
    props.activeFilter === 'active' ? true : props.activeFilter === 'inactive' ? false : null,
  )
})
```

#### Функция загрузки данных:

```typescript
function goToPage(page: number) {
  if (!pagination || !pagination.last_page) return
  if (page < 1 || page > pagination.last_page) return
  currentPage.value = page
  fetchUsers(
    page,
    props.search || '',
    sortBy.value,
    sortOrder.value,
    perPage.value,
    props.role, // Передаем выбранную роль
    props.activeFilter === 'active' ? true : props.activeFilter === 'inactive' ? false : null,
  )
}
```

### 3. UserController (src/controllers/UserController.ts)

#### Функция fetchUsers:

```typescript
async function fetchUsers(
  page = 1,
  search = '',
  sort_by = sortBy.value,
  sort_order = sortOrder.value,
  per_page = 30,
  role = '', // Параметр роли
  is_active = null, // Параметр активности
) {
  loading.value = true
  error.value = ''
  try {
    const res = await getUsers({
      page,
      search,
      sort_by,
      sort_order,
      per_page,
      role, // Передаем в API
      is_active,
    })
    // Обработка ответа...
  } catch (e: any) {
    error.value = e.message || 'Ошибка загрузки пользователей'
  } finally {
    loading.value = false
  }
}
```

### 4. API Service (src/services/api.ts)

#### Функция getUsers:

```typescript
export async function getUsers({
  page = 1,
  search = '',
  sort_by = 'id',
  sort_order = 'asc',
  per_page = 30,
  role = '', // Параметр роли
  is_active = null, // Параметр активности
} = {}): Promise<any> {
  const params = new URLSearchParams({
    page: page.toString(),
    search,
    sort_by,
    sort_order,
    per_page: per_page.toString(),
  })

  // Добавляем параметры фильтрации в URL
  if (role) params.append('role', role)
  if (is_active !== null) params.append('is_active', is_active.toString())

  const res = await apiRequest(`/users?${params.toString()}`)
  return res
}
```

## Как работает фильтрация

### 1. Выбор роли пользователем

1. Пользователь выбирает роль в селекте в `UsersView`
2. Срабатывает `@change="handleRoleChange"`
3. Обновляется `selectedRole.value`
4. Параметр передается в `UserList` как prop `:role="selectedRole"`

### 2. Реактивная фильтрация

1. `watch` в `UserList` отслеживает изменения `props.role`
2. При изменении вызывается `goToPage(1)` - сброс на первую страницу
3. `goToPage()` вызывает `fetchUsers()` с новыми параметрами

### 3. API запрос

1. `fetchUsers()` в `UserController` получает параметр `role`
2. Передает его в `getUsers()` из API сервиса
3. `getUsers()` добавляет параметр в URL: `?role=admin`
4. Отправляется GET запрос на `/api/users?role=admin`

### 4. Обработка ответа

1. API возвращает отфильтрованных пользователей
2. `UserController` обновляет `users.value`
3. `UserList` отображает отфильтрованный список

## Доступные роли для фильтрации

```typescript
const availableRoles = [
  { value: '', label: 'Все роли' },
  { value: 'admin', label: 'Администратор' },
  { value: 'manager', label: 'Менеджер' },
  { value: 'designer', label: 'Дизайнер' },
  { value: 'print_operator', label: 'Печатник' },
  { value: 'workshop_worker', label: 'Работник цеха' },
]
```

## Дополнительные фильтры

### Фильтр по активности

```typescript
// В UsersView
<select v-model="activeFilter">
  <option value="">Все пользователи</option>
  <option value="1">Только активные</option>
  <option value="0">Только неактивные</option>
</select>

// В UserController
props.activeFilter === 'active' ? true : props.activeFilter === 'inactive' ? false : null
```

### Поиск по тексту

```typescript
// Передается из Layout через search prop
<UserList :search="search" />
```

## Пагинация с фильтрами

При изменении фильтров:

1. Сбрасывается на первую страницу (`goToPage(1)`)
2. Сохраняются все параметры фильтрации
3. Пагинация работает с учетом активных фильтров

## Сохранение состояния

```typescript
// Сохраняются в localStorage
const SORT_KEY = 'userList_sortBy'
const ORDER_KEY = 'userList_sortOrder'
const COLUMNS_KEY = 'userList_columns'

// Восстанавливаются при загрузке
const savedSortBy = localStorage.getItem(SORT_KEY)
const savedSortOrder = localStorage.getItem(ORDER_KEY)
```

## Отображение ролей в таблице

```vue
<template v-else-if="col.key === 'role'">
  <template v-if="user.roles && user.roles.length">
    <span
      v-for="role in user.roles"
      :key="role.id"
      class="px-2 py-1 rounded-full text-xs font-medium mr-1"
      :class="getRoleBadgeClass(role.name)"
    >
      {{ getRoleLabel(role.display_name || role.name) }}
    </span>
  </template>
  <template v-else>
    <span class="px-2 py-1 rounded-full text-xs font-medium" :class="getRoleBadgeClass(user.role)">
      {{ getRoleLabel(user.role) }}
    </span>
  </template>
</template>
```

## Цветовая схема ролей

```typescript
const getRoleBadgeClass = (role: string) => {
  const classes: Record<string, string> = {
    admin: 'bg-red-100 text-red-800',
    manager: 'bg-blue-100 text-blue-800',
    designer: 'bg-green-100 text-green-800',
    print_operator: 'bg-yellow-100 text-yellow-800',
    workshop_worker: 'bg-purple-100 text-purple-800',
  }
  return classes[role] || 'bg-gray-100 text-gray-800'
}
```

## Заключение

Система фильтрации по ролям в UserView/UserList работает следующим образом:

1. **UI уровень**: Селект в UsersView для выбора роли
2. **Компонентный уровень**: UserList получает параметры через props
3. **Контроллерный уровень**: UserController обрабатывает логику фильтрации
4. **API уровень**: Сервис формирует запрос с параметрами фильтрации
5. **Реактивность**: Watch отслеживает изменения и автоматически обновляет данные

Система поддерживает комбинированную фильтрацию по ролям, активности и поиску, с сохранением состояния сортировки и пагинации.
