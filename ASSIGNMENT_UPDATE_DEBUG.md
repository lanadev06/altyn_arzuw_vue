# 🔄 ОТЧЕТ: Отладка проблемы с обновлением назначений

## 🎯 Проблема

Пользователь сообщил: **"sohranyayu no naznachennye ne menyayutsya"** - назначения сохраняются, но не изменяются/обновляются.

## 🔍 Анализ проблемы

### Возможные причины:

1. **Проблема с логикой уникальности** в `updateAssignment`
2. **Проблема с передачей данных** между компонентами
3. **Проблема с фильтрацией** в `prepareFormData`
4. **Проблема с реактивностью** Vue

## 🔧 Выполненные исправления

### 1. **Улучшение функции updateAssignment**

```typescript
// Было: Простая проверка уникальности
function updateAssignment(index: number) {
  const updatedAssignments = [...props.assignments]
  const userIds = updatedAssignments.map((a) => a.user_id).filter((id) => id && id > 0)
  const uniqueUserIds = new Set(userIds)

  if (userIds.length !== uniqueUserIds.size) {
    const lastIndex = userIds.lastIndexOf(updatedAssignments[index].user_id)
    if (lastIndex !== index) {
      updatedAssignments[index].user_id = null as any
    }
  }

  emit('update', updatedAssignments)
}

// Стало: Улучшенная логика с отладкой
function updateAssignment(index: number) {
  console.log('updateAssignment called for index:', index)

  const updatedAssignments = [...props.assignments]
  const currentAssignment = updatedAssignments[index]

  console.log('Current assignment:', currentAssignment)

  // Проверяем уникальность user_id только если user_id не null
  if (currentAssignment.user_id && currentAssignment.user_id > 0) {
    const userIds = updatedAssignments.map((a) => a.user_id).filter((id) => id && id > 0)
    const uniqueUserIds = new Set(userIds)

    if (userIds.length !== uniqueUserIds.size) {
      // Есть дубликаты - находим все индексы с этим user_id
      const duplicateIndexes = updatedAssignments
        .map((a, i) => ({ assignment: a, index: i }))
        .filter(({ assignment }) => assignment.user_id === currentAssignment.user_id)
        .map(({ index }) => index)

      console.log('Duplicate indexes:', duplicateIndexes)

      // Если текущий индекс не первый в списке дубликатов, сбрасываем его
      if (duplicateIndexes[0] !== index) {
        console.log('Resetting assignment at index:', index)
        updatedAssignments[index].user_id = null as any
      }
    }
  }

  console.log('Updated assignments:', updatedAssignments)
  emit('update', updatedAssignments)
}
```

### 2. **Добавление отладочной информации в ProductFormModal**

```typescript
// Обработчики обновления назначений
@update="
  (assignments) => {
    console.log('Designers updated:', assignments)
    form.designers = assignments
  }
"

@update="
  (assignments) => {
    console.log('Print operators updated:', assignments)
    form.print_operators = assignments
  }
"

@update="
  (assignments) => {
    console.log('Engraving operators updated:', assignments)
    form.engraving_operators = assignments
  }
"

@update="
  (assignments) => {
    console.log('Workshop workers updated:', assignments)
    form.workshop_workers = assignments
  }
"
```

### 3. **Отладка функции prepareFormData**

```typescript
function prepareFormData() {
  const formData = { ...form }

  console.log('prepareFormData - исходные данные:', {
    designers: formData.designers,
    print_operators: formData.print_operators,
    engraving_operators: formData.engraving_operators,
    workshop_workers: formData.workshop_workers,
  })

  // Фильтруем назначения с валидными user_id
  formData.designers = formData.designers.filter((d) => d.user_id && d.user_id > 0)
  formData.print_operators = formData.print_operators.filter((p) => p.user_id && p.user_id > 0)
  formData.engraving_operators = formData.engraving_operators.filter(
    (e) => e.user_id && e.user_id > 0,
  )
  formData.workshop_workers = formData.workshop_workers.filter((w) => w.user_id && w.user_id > 0)

  console.log('prepareFormData - отфильтрованные данные:', {
    designers: formData.designers,
    print_operators: formData.print_operators,
    engraving_operators: formData.engraving_operators,
    workshop_workers: formData.workshop_workers,
  })

  return formData
}
```

### 4. **Улучшение отладки в AssignmentManager**

```typescript
const availableUsers = computed(() => {
  const assignedUserIds = props.assignments.map((a) => a.user_id).filter((id) => id && id > 0)
  const filtered = props.allUsers.filter((user) => !assignedUserIds.includes(user.id))

  console.log('AssignmentManager availableUsers:', {
    allUsers: props.allUsers.length,
    assignedUserIds,
    availableUsers: filtered.length,
    assignments: props.assignments.length,
  })

  return filtered
})

function addAssignment() {
  console.log('addAssignment called:', {
    availableUsers: availableUsers.value.length,
    currentAssignments: props.assignments.length,
  })

  // ... остальной код
}
```

## 📊 Что проверяется отладочной информацией

### 1. **AssignmentManager**:

- Количество доступных пользователей
- Количество назначений
- Вызов функции addAssignment
- Вызов функции updateAssignment
- Логика проверки дубликатов

### 2. **ProductFormModal**:

- Обновление назначений дизайнеров
- Обновление назначений печатников
- Обновление назначений гравировки
- Обновление назначений цеха
- Данные перед отправкой на сервер

### 3. **prepareFormData**:

- Исходные данные формы
- Отфильтрованные данные
- Что именно отправляется на сервер

## 🎯 Следующие шаги для диагностики

### 1. **Открыть Developer Tools** (F12)

### 2. **Перейти на вкладку Console**

### 3. **Открыть модальное окно** создания/редактирования товара

### 4. **Попробовать изменить назначения** и наблюдать за логами

### Ожидаемые логи:

```
// При загрузке
Загружены пользователи: {designers: 2, printOperators: 3, workshopWorkers: 1}

// При добавлении назначения
addAssignment called: {availableUsers: 3, currentAssignments: 0}
Adding new assignment: {id: 1234567890, user_id: null, priority: 1}

// При выборе пользователя
updateAssignment called for index: 0
Current assignment: {id: 1234567890, user_id: 5, priority: 1}
Updated assignments: [{id: 1234567890, user_id: 5, priority: 1}]

// При обновлении в ProductFormModal
Designers updated: [{id: 1234567890, user_id: 5, priority: 1}]

// При сохранении
prepareFormData - исходные данные: {designers: [{id: 1234567890, user_id: 5, priority: 1}]}
prepareFormData - отфильтрованные данные: {designers: [{id: 1234567890, user_id: 5, priority: 1}]}
```

## 🔍 Возможные проблемы и решения

### 1. **Если назначения не обновляются в UI**:

- Проблема с реактивностью Vue
- Проверить, правильно ли передаются props

### 2. **Если назначения обновляются, но не сохраняются**:

- Проблема с фильтрацией в prepareFormData
- Проверить, что user_id не null

### 3. **Если назначения сбрасываются**:

- Проблема с логикой уникальности
- Проверить, не срабатывает ли проверка дубликатов

### 4. **Если нет доступных пользователей**:

- Проблема с загрузкой пользователей из API
- Проверить Network tab в Developer Tools

## 📋 Статус отладки

- ✅ **Отладочная информация**: Добавлена
- ✅ **Улучшена логика updateAssignment**: Готова
- ✅ **Логирование всех этапов**: Настроено
- 🔄 **Тестирование**: В процессе

---

**🎯 Цель**: Определить точную причину, почему назначения не изменяются, несмотря на сохранение.

**📝 Примечание**: Отладочная информация поможет точно определить, на каком этапе происходит сбой в процессе обновления назначений.
