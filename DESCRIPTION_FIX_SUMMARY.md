# Исправление проблемы с удалением описания в стадиях и ролях

## ✅ Проблема решена

**Проблема:** Описание не удалялось в стадиях и ролях при попытке очистить поле.

## 🔧 Внесенные изменения

### 1. StageFormModal.vue

```typescript
// БЫЛО:
description: form.description || undefined,

// СТАЛО:
description: form.description.trim() || null,
```

### 2. RoleFormModal.vue

```typescript
// БЫЛО:
description: form.description || undefined,

// СТАЛО:
description: form.description.trim() || null,
```

### 3. StageManager.vue

```typescript
// Добавлено:
const submitData = {
  ...form.value,
  description: form.value.description.trim() || null,
}
```

### 4. RoleManager.vue

```typescript
// Добавлено:
const submitData = {
  ...form.value,
  description: form.value.description.trim() || null,
}
```

## 🎯 Результат

- ✅ Описание теперь корректно удаляется при очистке поля
- ✅ Пробелы автоматически удаляются
- ✅ Бэкенд получает `null` вместо `undefined`
- ✅ В списках отображается `-` для пустых описаний

## 🧪 Как протестировать

1. Создайте стадию/роль с описанием
2. Отредактируйте и очистите поле описания
3. Сохраните
4. Проверьте, что описание удалилось

## 📝 Техническое объяснение

**Причина проблемы:**

- `form.description || undefined` не работало для пустых строк
- Бэкенд ожидал `null` для удаления описания

**Решение:**

- `form.description.trim() || null` удаляет пробелы и возвращает `null` для пустых строк
- `null` корректно обрабатывается бэкендом
