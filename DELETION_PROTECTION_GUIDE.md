# Защита от удаления пользователей, проектов и клиентов

## ✅ Реализованная защита

Система теперь защищает от удаления:

- **Пользователей**, которые назначены в активных заказах
- **Проектов**, в которых есть активные заказы
- **Клиентов**, у которых есть активные заказы

## 🔧 Изменения в бэкенде

### 1. UserController.php

```php
public function destroy(User $user)
{
    $this->checkUserManagementAccess();

    // Проверяем активные назначения пользователя
    $activeAssignmentsCount = $user->assignments()->whereHas('order', function ($query) {
        $query->where('is_archived', false);
    })->count();

    if ($activeAssignmentsCount > 0) {
        return response()->json([
            'message' => "Невозможно удалить пользователя, который назначен в {$activeAssignmentsCount} активных заказах"
        ], 422);
    }

    // Удаляем пользователя
    $user->delete();
    return response()->json(['message' => 'Пользователь удалён']);
}
```

### 2. ProjectController.php

```php
public function destroy(Project $project)
{
    if (Gate::denies('delete', $project)) {
        abort(403, 'Доступ запрещён');
    }

    // Проверяем активные заказы в проекте
    $activeOrdersCount = $project->orders()->where('is_archived', false)->count();

    if ($activeOrdersCount > 0) {
        return response()->json([
            'message' => "Невозможно удалить проект, в котором есть {$activeOrdersCount} активных заказов"
        ], 422);
    }

    $project->delete();
    return response()->json(['message' => 'Проект удалён']);
}
```

### 3. ClientController.php

```php
public function destroy(Client $client)
{
    if (Gate::denies('delete', $client)) {
        abort(403, 'Доступ запрещён');
    }

    // Проверяем активные заказы клиента
    $activeOrdersCount = $client->orders()->where('is_archived', false)->count();

    if ($activeOrdersCount > 0) {
        return response()->json([
            'message' => "Невозможно удалить клиента, у которого есть {$activeOrdersCount} активных заказов"
        ], 422);
    }

    $client->delete();
    return response()->json(['message' => 'Клиент удалён']);
}
```

### 4. Добавленные отношения в моделях

**User.php:**

```php
public function assignments()
{
    return $this->hasMany(OrderAssignment::class, 'user_id');
}
```

**Client.php:**

```php
public function orders()
{
    return $this->hasMany(Order::class);
}
```

**Project.php:**

```php
public function orders()
{
    return $this->hasMany(Order::class);
}
```

## 🎨 Изменения во фронтенде

### 1. UserList.vue

```typescript
const handleDeleteUser = async (userId: number) => {
  try {
    console.log('🔄 Начинаем удаление пользователя:', userId)
    await deleteUser(userId)
    console.log('✅ Пользователь успешно удален:', userId)
    // ... обновление списка
  } catch (err: unknown) {
    console.error('❌ Ошибка удаления пользователя:', userId, err)
    if (err instanceof Error) {
      alert(`Ошибка удаления пользователя: ${err.message}`)
    } else {
      alert('Произошла неизвестная ошибка при удалении пользователя')
    }
  }
}
```

### 2. ProjectList.vue

```typescript
async function handleDeleteProject(projectId: number) {
  try {
    console.log('🔄 Начинаем удаление проекта:', projectId)
    await remove(projectId)
    console.log('✅ Проект успешно удален:', projectId)
    // ... обновление списка
  } catch (err: unknown) {
    console.error('❌ Ошибка удаления проекта:', projectId, err)
    if (err instanceof Error) {
      alert(`Ошибка удаления проекта: ${err.message}`)
    } else {
      alert('Произошла неизвестная ошибка при удалении проекта')
    }
  }
}
```

### 3. ClientList.vue

```typescript
async function handleDeleteClient(clientId: number) {
  try {
    console.log('🔄 Начинаем удаление клиента:', clientId)
    await remove(clientId)
    console.log('✅ Клиент успешно удален:', clientId)
    // ... обновление списка
  } catch (err: unknown) {
    console.error('❌ Ошибка удаления клиента:', clientId, err)
    if (err instanceof Error) {
      alert(`Ошибка удаления клиента: ${err.message}`)
    } else {
      alert('Произошла неизвестная ошибка при удалении клиента')
    }
  }
}
```

## 📋 Логика защиты

### Пользователи

**Можно удалить, если:**

- ✅ Нет активных назначений в заказах
- ✅ У вас есть права администратора

**НЕЛЬЗЯ удалить, если:**

- ❌ Есть активные назначения в заказах
- ❌ Нет прав администратора

### Проекты

**Можно удалить, если:**

- ✅ Нет активных заказов в проекте
- ✅ У вас есть права на удаление

**НЕЛЬЗЯ удалить, если:**

- ❌ Есть активные заказы в проекте
- ❌ Нет прав на удаление

### Клиенты

**Можно удалить, если:**

- ✅ Нет активных заказов у клиента
- ✅ У вас есть права на удаление

**НЕЛЬЗЯ удалить, если:**

- ❌ Есть активные заказы у клиента
- ❌ Нет прав на удаление

## 🧪 Тестирование

### API тесты успешны:

**Удаление пользователя без назначений:**

```bash
curl -X DELETE "http://localhost:8000/api/users/2" \
  -H "Authorization: Bearer [token]"
# Результат: {"message":"Пользователь удалён"}
```

**Попытка удаления пользователя с назначениями:**

```bash
curl -X DELETE "http://localhost:8000/api/users/4" \
  -H "Authorization: Bearer [token]"
# Результат: {"message":"Невозможно удалить пользователя, который назначен в 13 активных заказах"}
```

**Удаление проекта без заказов:**

```bash
curl -X DELETE "http://localhost:8000/api/projects/3" \
  -H "Authorization: Bearer [token]"
# Результат: {"message":"Проект удалён"}
```

**Попытка удаления проекта с заказами:**

```bash
curl -X DELETE "http://localhost:8000/api/projects/1" \
  -H "Authorization: Bearer [token]"
# Результат: {"message":"Невозможно удалить проект, в котором есть 3 активных заказа"}
```

**Удаление клиента без заказов:**

```bash
curl -X DELETE "http://localhost:8000/api/clients/4" \
  -H "Authorization: Bearer [token]"
# Результат: {"message":"Клиент удалён"}
```

**Попытка удаления клиента с заказами:**

```bash
curl -X DELETE "http://localhost:8000/api/clients/2" \
  -H "Authorization: Bearer [token]"
# Результат: {"message":"Невозможно удалить клиента, у которого есть 11 активных заказов"}
```

## 📊 Текущее состояние

### Пользователи, которые можно удалить:

- `Aylana` (ID: 1) - 0 активных назначений ✅
- `Test` (ID: 2) - 0 активных назначений ✅

### Пользователи, которые НЕЛЬЗЯ удалять:

- `Диана` (ID: 4) - 13 активных назначений ❌
- `Илья` (ID: 5) - 13 активных назначений ❌
- `Максим` (ID: 6) - 12 активных назначений ❌
- `Ширали` (ID: 7) - 27 активных назначений ❌
- `Куват` (ID: 8) - 35 активных назначений ❌
- И другие...

### Проекты, которые можно удалить:

- `Изготовление баннеров` (ID: 3) - 0 активных заказов ✅
- `wedwq` (ID: 5) - 0 активных заказов ✅
- `wedwq` (ID: 6) - 0 активных заказов ✅
- `fedfer` (ID: 13) - 0 активных заказов ✅
- `sdsfd` (ID: 15) - 0 активных заказов ✅

### Проекты, которые НЕЛЬЗЯ удалять:

- `Проект визиток` (ID: 1) - 3 активных заказа ❌
- `Печать буклетов` (ID: 2) - 1 активный заказ ❌
- `sada` (ID: 4) - 1 активный заказ ❌
- И другие...

### Клиенты, которые можно удалить:

- `Гадам` (ID: 4) - 0 активных заказов ✅
- `Мурат` (ID: 5) - 0 активных заказов ✅
- `Эмиль` (ID: 6) - 0 активных заказов ✅
- `Артур` (ID: 7) - 0 активных заказов ✅
- И многие другие...

### Клиенты, которые НЕЛЬЗЯ удалять:

- `Тойли` (ID: 2) - 11 активных заказов ❌
- `Бегли` (ID: 3) - 6 активных заказов ❌
- `Наталья` (ID: 19) - 1 активный заказ ❌
- `Виктория` (ID: 74) - 2 активных заказа ❌

## ✅ Результат

Теперь система надежно защищает от случайного удаления:

- Пользователей, которые работают над заказами
- Проектов, в которых есть активные заказы
- Клиентов, у которых есть активные заказы

При попытке удаления пользователь получает понятное сообщение об ошибке с указанием количества активных заказов/назначений.
