# Отчет о решении проблемы с отображением процентов в Dashboard

## Проблема
В dashboard кружочки отображались корректно, но проценты не показывались. Вместо числовых значений отображался символ "—".

## Диагностика

### 1. Анализ кода DashboardView.vue
Обнаружено несоответствие в ключах данных:

**В SVG кружочках использовались:**
```javascript
dashboardStats.completed_percent
dashboardStats.cancelled_percent
```

**В тексте использовались:**
```javascript
dashboardStats.percent_completed
dashboardStats.percent_cancelled
```

### 2. Проверка API
Проверил StatsController в Laravel и обнаружил, что API возвращает:
```php
'completed_percent' => $completedPercent,
'cancelled_percent' => $cancelledPercent,
```

## Решение

### 1. Исправление ключей в Laravel API
Изменил ключи в StatsController.php:
```php
// Было:
'completed_percent' => $completedPercent,
'cancelled_percent' => $cancelledPercent,

// Стало:
'percent_completed' => $completedPercent,
'percent_cancelled' => $cancelledPercent,
```

### 2. Исправление SVG кружочков во фронтенде
Обновил DashboardView.vue:
```javascript
// Было:
:stroke-dashoffset="276.46 - (dashboardStats.completed_percent / 100) * 276.46"
:stroke-dashoffset="276.46 - (dashboardStats.cancelled_percent / 100) * 276.46"

// Стало:
:stroke-dashoffset="276.46 - (dashboardStats.percent_completed / 100) * 276.46"
:stroke-dashoffset="276.46 - (dashboardStats.percent_cancelled / 100) * 276.46"
```

## Результат
- ✅ Проценты теперь отображаются корректно в dashboard
- ✅ Кружочки и текст синхронизированы
- ✅ API возвращает правильные ключи
- ✅ Фронтенд использует единообразные ключи

## Технические детали

### Структура данных API
```json
{
  "orders_by_stage": {...},
  "orders_by_user": [...],
  "closed_last_30_days": 0,
  "delayed_assignments": 0,
  "delayed_assignments_list": [...],
  "percent_completed": 25.5,
  "percent_cancelled": 5.2
}
```

### Логика отображения
```javascript
// Проверка на NaN и отображение процента
isNaN(Number(dashboardStats.percent_completed))
  ? '—'
  : dashboardStats.percent_completed + '%'
```

## Статус
🟢 **ПРОБЛЕМА РЕШЕНА**

Проценты в dashboard теперь отображаются корректно. 