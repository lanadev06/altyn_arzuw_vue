# Отчет о добавлении сохранения perPage в localStorage

## Проблема

Размер страницы (page size selector) не сохранялся в localStorage, в отличие от других настроек (сортировка, порядок колонок). Пользователи теряли свои настройки при перезагрузке страницы.

## Изменения

### 1. Добавление константы для ключа localStorage

**Было:**
```typescript
const SORT_KEY = 'userList_sortBy'
const ORDER_KEY = 'userList_sortOrder'
const COLUMNS_KEY = 'userList_columns'

const savedSortBy = localStorage.getItem(SORT_KEY)
const savedSortOrder = localStorage.getItem(ORDER_KEY)
const savedColumns = localStorage.getItem(COLUMNS_KEY)
```

**Стало:**
```typescript
const SORT_KEY = 'userList_sortBy'
const ORDER_KEY = 'userList_sortOrder'
const COLUMNS_KEY = 'userList_columns'
const PER_PAGE_KEY = 'userList_perPage'

const savedSortBy = localStorage.getItem(SORT_KEY)
const savedSortOrder = localStorage.getItem(ORDER_KEY)
const savedColumns = localStorage.getItem(COLUMNS_KEY)
const savedPerPage = localStorage.getItem(PER_PAGE_KEY)
```

### 2. Инициализация perPage с сохраненным значением

**Было:**
```typescript
const perPage = ref(30)
```

**Стало:**
```typescript
const perPage = ref(savedPerPage ? parseInt(savedPerPage) : 30)
```

### 3. Сохранение perPage в функции changePerPage

**Было:**
```typescript
function changePerPage() {
  perPage.value = validatePerPage(perPage.value)
  goToPage(1)
}
```

**Стало:**
```typescript
function changePerPage() {
  perPage.value = validatePerPage(perPage.value)
  localStorage.setItem(PER_PAGE_KEY, perPage.value.toString())
  goToPage(1)
}
```

### 4. Сохранение perPage в watch

**Было:**
```typescript
watch(perPage, (newVal) => {
  perPage.value = validatePerPage(newVal)
  goToPage(1)
})
```

**Стало:**
```typescript
watch(perPage, (newVal) => {
  perPage.value = validatePerPage(newVal)
  localStorage.setItem(PER_PAGE_KEY, perPage.value.toString())
  goToPage(1)
})
```

### 5. Сброс perPage в функции resetSettings

**Было:**
```typescript
function resetSettings() {
  columns.value = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Имя', sortable: true },
    { key: 'username', label: 'Логин', sortable: true },
    { key: 'role', label: 'Роль', sortable: false },
    { key: 'phone', label: 'Телефон', sortable: false },
    { key: 'is_active', label: 'Статус', sortable: false },
    { key: 'created_at', label: 'Создано', sortable: true },
    { key: 'updated_at', label: 'Обновлено', sortable: false },
  ]
  localStorage.setItem(COLUMNS_KEY, JSON.stringify(columns.value))
  sortBy.value = 'id'
  sortOrder.value = 'asc'
  localStorage.setItem(SORT_KEY, sortBy.value)
  localStorage.setItem(ORDER_KEY, sortOrder.value)
  currentPage.value = 1
  // Используем вспомогательную функцию для получения правильного параметра сортировки
  const sortByParam = getSortByParam(sortBy.value)

  fetchUsers(
    1,
    props.search || '',
    sortByParam,
    sortOrder.value,
    perPage.value,
    props.role,
    props.activeFilter === 'active' ? true : props.activeFilter === 'inactive' ? false : null,
  )
}
```

**Стало:**
```typescript
function resetSettings() {
  columns.value = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Имя', sortable: true },
    { key: 'username', label: 'Логин', sortable: true },
    { key: 'role', label: 'Роль', sortable: false },
    { key: 'phone', label: 'Телефон', sortable: false },
    { key: 'is_active', label: 'Статус', sortable: false },
    { key: 'created_at', label: 'Создано', sortable: true },
    { key: 'updated_at', label: 'Обновлено', sortable: false },
  ]
  localStorage.setItem(COLUMNS_KEY, JSON.stringify(columns.value))
  sortBy.value = 'id'
  sortOrder.value = 'asc'
  localStorage.setItem(SORT_KEY, sortBy.value)
  localStorage.setItem(ORDER_KEY, sortOrder.value)
  perPage.value = 30
  localStorage.setItem(PER_PAGE_KEY, perPage.value.toString())
  currentPage.value = 1
  // Используем вспомогательную функцию для получения правильного параметра сортировки
  const sortByParam = getSortByParam(sortBy.value)

  fetchUsers(
    1,
    props.search || '',
    sortByParam,
    sortOrder.value,
    perPage.value,
    props.role,
    props.activeFilter === 'active' ? true : props.activeFilter === 'inactive' ? false : null,
  )
}
```

## Результат

### ✅ Сохраняемые настройки:
- **Сортировка** - `userList_sortBy`
- **Порядок сортировки** - `userList_sortOrder`
- **Порядок колонок** - `userList_columns`
- **Размер страницы** - `userList_perPage` (НОВОЕ)

### ✅ Поведение:
1. **При загрузке страницы** - восстанавливается последний выбранный размер страницы
2. **При изменении размера** - новое значение сохраняется в localStorage
3. **При сбросе настроек** - размер страницы сбрасывается к 30 и сохраняется
4. **При перезагрузке** - все настройки восстанавливаются

### ✅ Поддерживаемые размеры страниц:
```typescript
const allowedPerPage = [10, 20, 50, 100, 200, 500]
```

## API

### Ключи localStorage:
```typescript
const SORT_KEY = 'userList_sortBy'
const ORDER_KEY = 'userList_sortOrder'
const COLUMNS_KEY = 'userList_columns'
const PER_PAGE_KEY = 'userList_perPage' // НОВЫЙ
```

### Значения по умолчанию:
- **Сортировка:** `'id'`
- **Порядок:** `'asc'`
- **Колонки:** стандартный порядок
- **Размер страницы:** `30`

## Тестирование

### Сценарий 1: Сохранение размера страницы
1. Откройте страницу пользователей
2. Измените размер страницы на 50
3. Перезагрузите страницу
4. **Ожидаемый результат:** размер страницы остается 50

### Сценарий 2: Сброс настроек
1. Измените размер страницы на 100
2. Нажмите "Сбросить настройки"
3. **Ожидаемый результат:** размер страницы сбрасывается к 30

### Сценарий 3: Валидация значений
1. Попробуйте установить недопустимое значение (например, 25)
2. **Ожидаемый результат:** значение автоматически корректируется к ближайшему допустимому

## Структура localStorage

### До изменений:
```json
{
  "userList_sortBy": "id",
  "userList_sortOrder": "asc",
  "userList_columns": "[...]"
}
```

### После изменений:
```json
{
  "userList_sortBy": "id",
  "userList_sortOrder": "asc",
  "userList_columns": "[...]",
  "userList_perPage": "50"
}
```

## Совместимость

### Обратная совместимость:
- ✅ Если `userList_perPage` отсутствует в localStorage, используется значение по умолчанию (30)
- ✅ Все существующие настройки продолжают работать
- ✅ Нет влияния на другие компоненты

### Миграция:
- Автоматическая - при первом изменении размера страницы создается запись в localStorage
- Безопасная - отсутствие записи не вызывает ошибок

## Заключение

Успешно добавлено сохранение размера страницы в localStorage:
- ✅ **Сохранение настроек** - размер страницы теперь сохраняется
- ✅ **Восстановление при загрузке** - настройки восстанавливаются автоматически
- ✅ **Сброс настроек** - размер страницы сбрасывается вместе с остальными настройками
- ✅ **Валидация** - проверка допустимых значений
- ✅ **Совместимость** - обратная совместимость с существующими настройками

Теперь все пользовательские настройки UserList полностью сохраняются! 🚀 