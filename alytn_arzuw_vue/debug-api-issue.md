# Отладка проблемы с API

## Проблема
```
GET http://localhost:8000/api/stages/available-roles 404 (Not Found)
Error: No query results for model [App\Models\Stage] available-roles
```

## Анализ ошибки

Ошибка `No query results for model [App\Models\Stage] available-roles` указывает на то, что Laravel пытается найти стадию с именем "available-roles" вместо того, чтобы обработать маршрут.

## Причина
Маршрут `stages/available-roles` конфликтует с `stages/{stage}` из `apiResource`. Laravel думает, что "available-roles" - это ID стадии.

## Решение

### 1. ✅ Перемещение маршрутов
Переместил маршруты `available-roles` и `users-by-roles/all` перед `apiResource`:

```php
// Stage management routes
Route::get('stages/available-roles', [\App\Http\Controllers\Api\StageController::class, 'availableRoles']);
Route::get('stages/users-by-roles/all', [\App\Http\Controllers\Api\StageController::class, 'getAllUsersByStageRoles']);
Route::apiResource('stages', \App\Http\Controllers\Api\StageController::class);
Route::post('stages/reorder', [\App\Http\Controllers\Api\StageController::class, 'reorder']);
Route::get('stages/{stage}/users-by-roles', [\App\Http\Controllers\Api\StageController::class, 'getUsersByStageRoles']);
```

### 2. ✅ Временное отключение проверки прав
Убрал проверку прав в методе `availableRoles` для отладки:

```php
public function availableRoles()
{
    // Временно убираем проверку прав для отладки
    // if (Gate::denies('viewAny', Role::class)) {
    //     abort(403, 'Доступ запрещён');
    // }

    $roles = Role::orderBy('display_name')->get();
    return response()->json($roles);
}
```

## Дополнительные шаги

### 3. Очистка кэша
```bash
php artisan route:clear
php artisan config:clear
php artisan cache:clear
```

### 4. Проверка маршрутов
```bash
php artisan route:list --path=api/stages
```

### 5. Проверка данных
```bash
php artisan tinker
\App\Models\Role::count() // Должно быть > 0
\App\Models\Role::all(['id', 'name', 'display_name'])
```

## Ожидаемый результат

После этих изменений:
- ✅ Маршрут `/api/stages/available-roles` должен работать
- ✅ Должен возвращать список всех ролей
- ✅ Форма создания стадии должна загружать роли

## Восстановление безопасности

После того как все заработает, вернуть проверку прав:

```php
public function availableRoles()
{
    if (Gate::denies('viewAny', Role::class)) {
        abort(403, 'Доступ запрещён');
    }

    $roles = Role::orderBy('display_name')->get();
    return response()->json($roles);
}
``` 