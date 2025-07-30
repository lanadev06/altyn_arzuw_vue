# Отчет о решении проблемы с StatsController

## Проблема

- Ошибка 500 при загрузке `/api/stats/dashboard`
- SQL ошибка: "Unknown column 'stage' in 'field list'"

## Диагностика

### 1. Анализ ошибки

```
SQLSTATE[42S22]: Column not found: 1054 Unknown column 'stage' in 'field list'
```

### 2. Проверка структуры базы данных

- ✅ Таблица `orders` существует
- ❌ Колонка `stage` не существует
- ✅ Есть колонка `stage_id` (внешний ключ)

### 3. Проверка модели Order

- ✅ Модель Order имеет отношение `stage()` к модели Stage
- ✅ Отношение настроено правильно: `belongsTo(Stage::class)`

## Причина проблемы

StatsController использовал устаревший код, который обращался к несуществующей колонке `stage` вместо использования отношений Eloquent.

## Решение

### 1. Исправление запроса ordersByStage

```php
// Было:
$ordersByStage = DB::table('orders')->select('stage', DB::raw('count(*) as total'))
    ->groupBy('stage')
    ->pluck('total', 'stage');

// Стало:
$ordersByStage = Order::with('stage')
    ->get()
    ->groupBy('stage.name')
    ->map(function ($orders) {
        return $orders->count();
    });
```

### 2. Исправление запросов с условиями по stage

```php
// Было:
$completedOrders = Order::where('stage', 'completed')->count();

// Стало:
$completedOrders = Order::whereHas('stage', function ($query) {
    $query->where('name', 'completed');
})->count();
```

### 3. Исправление запросов с eager loading

```php
// Было:
->with('order.product')

// Стало:
->with(['order.product', 'order.stage'])
```

### 4. Исправление доступа к stage в результатах

```php
// Было:
'stage' => $a->order?->stage,

// Стало:
'stage' => $a->order?->stage?->name,
```

## Изменения в StatsController

### Исправленные методы:

1. **ordersByStage** - использование Eloquent отношений вместо raw SQL
2. **closedCount** - использование whereHas для фильтрации по stage
3. **completedOrders/cancelledOrders** - использование whereHas
4. **ordersByUser** - добавление eager loading для stage
5. **delayedAssignmentsList** - добавление eager loading для stage

## Результат

- ✅ SQL ошибки исправлены
- ✅ API endpoint `/api/stats/dashboard` работает корректно
- ✅ Данные загружаются через Eloquent отношения
- ✅ Код соответствует текущей структуре базы данных

## Рекомендации

1. **Проверка других контроллеров**: Убедиться, что другие контроллеры не используют устаревшие запросы к колонке `stage`

2. **Тестирование**: Добавить тесты для проверки корректности данных

3. **Документация**: Обновить документацию API с учетом новой структуры

## Статус

🟢 **ПРОБЛЕМА РЕШЕНА**

StatsController теперь корректно работает с новой структурой базы данных.
