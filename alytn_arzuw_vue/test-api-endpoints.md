# Тестирование API Endpoints

## Проблема
API endpoint `/api/stages/available-roles` возвращает 404 ошибку.

## Диагностика

### 1. Проверка маршрутов
Маршрут зарегистрирован в `routes/api.php`:
```php
Route::get('stages/available-roles', [\App\Http\Controllers\Api\StageController::class, 'availableRoles']);
```

### 2. Проверка метода
Метод `availableRoles` существует в `StageController`:
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

### 3. Возможные причины ошибки

#### A. Конфликт маршрутов
Маршрут `stages/available-roles` конфликтует с `stages/{stage}`.
**Решение**: Переместить `available-roles` перед `apiResource`.

#### B. Проблемы с правами доступа
Пользователь может не иметь прав для просмотра ролей.
**Решение**: Проверить политики доступа.

#### C. Проблемы с аутентификацией
Токен может быть недействительным.
**Решение**: Проверить токен аутентификации.

## Тестирование

### 1. Проверка маршрутов
```bash
php artisan route:list --path=api/stages
```

### 2. Тестирование через Postman/curl
```bash
curl -X GET "http://localhost:8000/api/stages/available-roles" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

### 3. Проверка прав доступа
```bash
php artisan tinker
# Проверить политики для ролей
```

## Решение

1. ✅ Переместить маршрут `available-roles` перед `apiResource`
2. 🔄 Проверить права доступа пользователя
3. 🔄 Проверить токен аутентификации
4. 🔄 Очистить кэш маршрутов: `php artisan route:clear` 