# Проблема с данными о стадиях в ProductList

## 🚨 Проблема
В ProductList отображаются только колонки ID, Название и Создано, но нет данных о стадиях и назначениях.

## 🔍 Причина
Данные о стадиях и назначениях должны приходить из:
- `product_assignments` - назначения сотрудников на стадии
- `product_stages` - доступные стадии для продукта

Но сейчас API возвращает только старые поля:
- `designers`, `print_operators`, `engraving_operators`, `workshop_workers`
- `has_design_stage`, `has_print_stage`, etc.

## ✅ Временное решение

### 1. Динамические колонки с fallback
Система пытается создать динамические колонки на основе `product.available_stages`, но если их нет, использует статичные колонки.

### 2. Отладочная информация
Добавлены console.log для отслеживания:
- Какие данные приходят с сервера
- Сколько стадий у каждого продукта
- Какие роли есть в стадиях
- Сколько колонок создается

### 3. Fallback на старые поля
Если новые данные недоступны, система использует старые поля для отображения назначений.

## 🔧 Что нужно исправить на бэкенде

### 1. Обновить API `/products`
```php
// В ProductController или ProductResource
public function index()
{
    $products = Product::with([
        'availableStages.roles',  // Загрузить стадии с ролями
        'assignments.user',       // Загрузить назначения с пользователями
        'designers.user',         // Оставить для обратной совместимости
        'printOperators.user',
        'engravingOperators.user',
        'workshopWorkers.user'
    ])->paginate();
    
    return ProductResource::collection($products);
}
```

### 2. Обновить ProductResource
```php
public function toArray($request)
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'created_at' => $this->created_at,
        
        // Новые поля
        'available_stages' => $this->availableStages->map(function($stage) {
            return [
                'id' => $stage->id,
                'name' => $stage->name,
                'display_name' => $stage->display_name,
                'color' => $stage->color,
                'roles' => $stage->roles->map(function($role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                        'display_name' => $role->display_name
                    ];
                })
            ];
        }),
        
        // Назначения по стадиям (новая структура)
        'stage_assignments' => $this->assignments->groupBy('stage_id')->map(function($assignments, $stageId) {
            return $assignments->map(function($assignment) {
                return [
                    'id' => $assignment->id,
                    'user_id' => $assignment->user_id,
                    'stage_id' => $assignment->stage_id,
                    'role_type' => $assignment->role_type,
                    'user' => $assignment->user ? [
                        'id' => $assignment->user->id,
                        'name' => $assignment->user->name
                    ] : null
                ];
            });
        }),
        
        // Старые поля для обратной совместимости
        'designers' => $this->designers,
        'print_operators' => $this->printOperators,
        'engraving_operators' => $this->engravingOperators,
        'workshop_workers' => $this->workshopWorkers,
    ];
}
```

## 🧪 Как проверить

### 1. Откройте консоль браузера
- Нажмите F12 → Console
- Перейдите на страницу товаров

### 2. Проверьте логи
Должны появиться сообщения:
```
🔍 Building dynamic columns from products: X
📦 Product 1: { id: 1, name: "...", available_stages: 0, ... }
⚠️ Product 1 has no available_stages
⚠️ No dynamic columns created, using static fallback
```

### 3. Проверьте API ответ
В Network tab найдите запрос к `/products` и проверьте, какие данные возвращаются.

## 🎯 Ожидаемый результат

### После исправления бэкенда:
1. **Динамические колонки** - создаются автоматически для каждой стадии с ролями
2. **Названия колонок** - "Дизайн (Дизайнеры)", "Печать (Печатники)", etc.
3. **Назначения** - отображаются корректно для каждой стадии
4. **Новые стадии** - автоматически добавляют новые колонки

### Пока бэкенд не исправлен:
1. **Статичные колонки** - "Дизайнеры", "Печатники", "Гравировщики", "Работники цеха"
2. **Назначения** - отображаются из старых полей
3. **Функциональность** - работает, но не динамически

## 📋 Следующие шаги

1. **Исправить бэкенд** - обновить API для возврата `available_stages` и `stage_assignments`
2. **Обновить фронтенд** - переключиться на новую структуру данных
3. **Убрать fallback** - удалить статичные колонки после полного перехода
4. **Протестировать** - убедиться, что новые стадии автоматически создают колонки 