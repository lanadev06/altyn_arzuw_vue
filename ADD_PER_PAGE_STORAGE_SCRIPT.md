# Скрипт для добавления сохранения perPage в localStorage

## Компоненты для обновления:

### 1. ✅ UserList.vue - УЖЕ СДЕЛАНО
- Ключ: `userList_perPage`
- Статус: ✅ Завершено

### 2. ✅ ClientList.vue - УЖЕ СДЕЛАНО
- Ключ: `clientList_perPage`
- Статус: ✅ Завершено

### 3. ✅ OrderList.vue - УЖЕ СДЕЛАНО
- Ключ: `orderList_perPage`
- Статус: ✅ Завершено

### 4. ✅ ProductList.vue - УЖЕ СДЕЛАНО
- Ключ: `productList_perPage`
- Статус: ✅ Завершено

### 5. ProjectList.vue - НУЖНО СДЕЛАТЬ
- Ключ: `projectList_perPage`
- Статус: ⏳ Ожидает

### 6. RoleList.vue - НУЖНО СДЕЛАТЬ
- Ключ: `roleList_perPage`
- Статус: ⏳ Ожидает

### 7. StageList.vue - НУЖНО СДЕЛАТЬ
- Ключ: `stageList_perPage`
- Статус: ⏳ Ожидает

## Шаблон изменений для каждого компонента:

### 1. Добавить загрузку сохраненного значения:
```typescript
const savedPerPage = localStorage.getItem('{componentName}_perPage')
```

### 2. Инициализировать perPage с сохраненным значением:
```typescript
const perPage = ref(savedPerPage ? parseInt(savedPerPage) : 30)
```

### 3. Сохранять в changePerPage:
```typescript
function changePerPage() {
  perPage.value = validatePerPage(perPage.value)
  localStorage.setItem('{componentName}_perPage', perPage.value.toString())
  // ... остальной код
}
```

### 4. Сохранять в watch:
```typescript
watch(perPage, (newVal) => {
  perPage.value = validatePerPage(newVal)
  localStorage.setItem('{componentName}_perPage', perPage.value.toString())
  // ... остальной код
})
```

### 5. Сбрасывать в resetSettings:
```typescript
function resetSettings() {
  // ... существующий код
  perPage.value = 30
  localStorage.setItem('{componentName}_perPage', perPage.value.toString())
  // ... остальной код
}
```

## Ключи localStorage для каждого компонента:

```typescript
// UserList
const PER_PAGE_KEY = 'userList_perPage'

// ClientList  
const PER_PAGE_KEY = 'clientList_perPage'

// OrderList
const PER_PAGE_KEY = 'orderList_perPage'

// ProductList
const PER_PAGE_KEY = 'productList_perPage'

// ProjectList
const PER_PAGE_KEY = 'projectList_perPage'

// RoleList
const PER_PAGE_KEY = 'roleList_perPage'

// StageList
const PER_PAGE_KEY = 'stageList_perPage'
```

## Проверка результатов:

После применения изменений в каждом компоненте:

1. **Откройте страницу компонента**
2. **Измените размер страницы**
3. **Перезагрузите страницу**
4. **Убедитесь, что размер страницы сохранился**
5. **Проверьте сброс настроек**

## Структура localStorage после изменений:

```json
{
  "userList_perPage": "50",
  "clientList_perPage": "100", 
  "orderList_perPage": "20",
  "productList_perPage": "30",
  "projectList_perPage": "25",
  "roleList_perPage": "15",
  "stageList_perPage": "10"
}
```

## Преимущества:

- ✅ **Консистентность** - все компоненты используют одинаковый подход
- ✅ **UX** - пользователи не теряют настройки при перезагрузке
- ✅ **Производительность** - быстрая загрузка с предпочитаемым размером
- ✅ **Масштабируемость** - легко добавить новые компоненты 