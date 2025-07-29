# Решение проблемы с динамическими стадиями и ролями

## 🎯 Проблема

Когда вы добавляете новую стадию, она не появляется в формах продуктов, заказов и деталях заказов, потому что:

1. **Новая стадия не связана с ролями** - система не знает, какие пользователи должны быть доступны для этой стадии
2. **Фронтенд использует старую логику** - загружает пользователей по жестко заданным ролям
3. **Отсутствует динамическая связь** - нет API для получения пользователей по ролям стадий

## ✅ Решение

### 1. Новые API Endpoints

Добавлены новые endpoints в Laravel:

```php
// Получить пользователей по ролям конкретной стадии
GET /api/stages/{stage}/users-by-roles

// Получить всех пользователей по ролям всех стадий
GET /api/stages/users-by-roles/all
```

### 2. Обновленный StageController

```php
public function getUsersByStageRoles(Request $request, Stage $stage)
{
    // Получаем роли, связанные со стадией
    $stageRoles = $stage->roles()->with('users')->get();
    
    $usersByRole = [];
    
    foreach ($stageRoles as $role) {
        $users = $role->users()
            ->where('is_active', true)
            ->select('id', 'name', 'username')
            ->get();
            
        $usersByRole[$role->name] = [
            'role' => $role,
            'users' => $users
        ];
    }

    return response()->json([
        'stage' => $stage,
        'users_by_role' => $usersByRole
    ]);
}
```

### 3. Обновленный фронтенд API

```typescript
// Новые методы в src/services/api.ts
export async function getUsersByStageRoles(stageId: number): Promise<any> {
  const res = await apiRequest(`/stages/${stageId}/users-by-roles`)
  return res
}

export async function getAllUsersByStageRoles(): Promise<any> {
  const res = await apiRequest('/stages/users-by-roles/all')
  return res
}
```

### 4. Обновленные компоненты

#### ProductFormModal.vue
- Заменена логика загрузки пользователей с `getByRole()` на `getAllUsersByStageRoles()`
- Пользователи теперь загружаются динамически по ролям стадий
- Автоматическое удаление дубликатов пользователей

#### OrderFormModal.vue
- Аналогичные изменения для динамической загрузки пользователей
- Поддержка новых стадий без изменения кода

### 5. Новый компонент управления

Создан `StageRoleManager.vue` для управления связями стадий и ролей в админке.

## 🔧 Как настроить новую стадию

### Шаг 1: Создать стадию
```bash
php artisan tinker

\App\Models\Stage::create([
    'name' => 'quality_check',
    'display_name' => 'Контроль качества',
    'order' => 6,
    'color' => '#22c55e',
    'is_active' => true
]);
```

### Шаг 2: Создать роль (если нужно)
```bash
\App\Models\Role::create([
    'name' => 'quality_controller',
    'display_name' => 'Контролер качества',
    'description' => 'Отвечает за контроль качества продукции'
]);
```

### Шаг 3: Связать стадию с ролью
```bash
$stage = \App\Models\Stage::where('name', 'quality_check')->first();
$role = \App\Models\Role::where('name', 'quality_controller')->first();

\App\Models\StageRole::create([
    'stage_id' => $stage->id,
    'role_id' => $role->id,
    'is_required' => true,
    'auto_assign' => true,
]);
```

### Шаг 4: Назначить пользователей на роль
```bash
$role = \App\Models\Role::where('name', 'quality_controller')->first();
$user = \App\Models\User::find(1);

$user->roles()->attach($role->id);
```

## 🎉 Результат

После настройки:

1. **Новая стадия автоматически появится** в формах продуктов и заказов
2. **Пользователи с соответствующей ролью** будут доступны для назначения
3. **Система полностью динамическая** - не нужно изменять код при добавлении новых стадий
4. **Обратная совместимость** - старые стадии продолжают работать

## 🔍 Проверка работы

1. Откройте форму создания/редактирования продукта
2. Проверьте, что новая стадия появилась в списке доступных стадий
3. Выберите новую стадию
4. Проверьте, что появились пользователи с соответствующей ролью
5. Назначьте пользователей на стадию
6. Сохраните продукт

## 📋 Текущие связи стадий с ролями

- `design` → `designer`
- `print` → `print_operator` 
- `engraving` → `engraving_operator`
- `workshop` → `workshop_worker`

## 🚀 Преимущества новой системы

1. **Полная динамичность** - новые стадии добавляются без изменения кода
2. **Гибкие связи** - одна стадия может иметь несколько ролей
3. **Автоматическое назначение** - пользователи автоматически назначаются по ролям
4. **Масштабируемость** - легко добавлять новые стадии и роли
5. **Улучшенный UX** - пользователи видят только релевантные стадии и роли

## 🔧 Техническая архитектура

```
stages (стадии)
├── id, name, display_name, order, is_active, color

stage_roles (связи стадий с ролями)
├── stage_id → stages.id
├── role_id → roles.id
├── is_required, auto_assign

roles (роли)
├── id, name, display_name, description

users (пользователи)
├── id, name, username, is_active

role_user (связи пользователей с ролями)
├── role_id → roles.id
├── user_id → users.id
```

Теперь система полностью поддерживает динамическое добавление стадий и ролей! 🎉 