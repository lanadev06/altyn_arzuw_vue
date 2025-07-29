# Настройка связей между стадиями и ролями

## Проблема

Когда вы добавляете новую стадию, она не появляется в формах продуктов, заказов и деталях заказов, потому что:

1. Новая стадия не связана с ролями
2. Фронтенд не знает, какие пользователи должны быть доступны для этой стадии
3. Нужно настроить связь между стадией и ролями

## Решение

### 1. Создание связей стадия-роль

В Laravel проекте нужно выполнить:

```bash
# Создать связь между стадией и ролями
php artisan tinker

# Пример для новой стадии "quality_check"
$stage = \App\Models\Stage::where('name', 'quality_check')->first();
$role = \App\Models\Role::where('name', 'quality_controller')->first();

if ($stage && $role) {
    \App\Models\StageRole::create([
        'stage_id' => $stage->id,
        'role_id' => $role->id,
        'is_required' => true,
        'auto_assign' => true,
    ]);
}
```

### 2. Существующие связи

Текущие связи стадий с ролями:

- `design` → `designer`
- `print` → `print_operator`
- `engraving` → `engraving_operator`
- `workshop` → `workshop_worker`

### 3. Добавление новой роли

Если для новой стадии нужна новая роль:

```bash
php artisan tinker

\App\Models\Role::create([
    'name' => 'quality_controller',
    'display_name' => 'Контролер качества',
    'description' => 'Отвечает за контроль качества продукции'
]);
```

### 4. Назначение пользователей на роль

```bash
php artisan tinker

$role = \App\Models\Role::where('name', 'quality_controller')->first();
$user = \App\Models\User::find(1); // ID пользователя

$user->roles()->attach($role->id);
```

### 5. Проверка связей

```bash
php artisan tinker

# Проверить все стадии с ролями
\App\Models\Stage::with('roles')->get()->each(function($stage) {
    echo "Stage: {$stage->name} ({$stage->display_name})\n";
    $stage->roles->each(function($role) {
        echo "  - Role: {$role->name} ({$role->display_name})\n";
    });
    echo "\n";
});
```

## Автоматическое обновление фронтенда

После настройки связей в бэкенде, фронтенд автоматически:

1. Загрузит новую стадию через `getAllStages()`
2. Загрузит пользователей по ролям через `getAllUsersByStageRoles()`
3. Покажет новую стадию в формах продуктов и заказов
4. Покажет соответствующих пользователей для назначения

## Проверка работы

1. Откройте форму создания/редактирования продукта
2. Проверьте, что новая стадия появилась в списке доступных стадий
3. Выберите новую стадию
4. Проверьте, что появились пользователи с соответствующей ролью
5. Назначьте пользователей на стадию
6. Сохраните продукт

## Устранение проблем

Если стадия не появляется:

1. Проверьте, что стадия активна (`is_active = true`)
2. Проверьте, что стадия связана с ролями
3. Проверьте, что у ролей есть активные пользователи
4. Проверьте консоль браузера на ошибки API
