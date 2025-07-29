# Динамическая загрузка пользователей по ролям в ProductFormModal

## 🎯 Проблема
В `ProductFormModal` не загружались работники по стадиям динамически. Система использовала статичные роли вместо загрузки ролей из `stage_roles` и пользователей по этим ролям.

## ✅ Решение

### 🔄 Динамическая загрузка пользователей

#### Было (статично):
```typescript
// Жестко заданные роли
allUsers.designer = []
allUsers.print_operator = []
allUsers.engraving_operator = []
allUsers.workshop_worker = []

// Статичное распределение пользователей
if (roleName === 'designer') {
  allUsers.designer = [...allUsers.designer, ...users]
} else if (roleName === 'print_operator') {
  allUsers.print_operator = [...allUsers.print_operator, ...users]
}
// ... и так далее для каждой роли
```

#### Стало (динамически):
```typescript
// Динамический объект для пользователей по ролям
const dynamicUsers: Record<string, any[]> = {}

// Обрабатываем данные по стадиям и ролям
Object.keys(usersByStageRoles).forEach((stageName) => {
  const stageData = usersByStageRoles[stageName]
  const stageRoles = stageData.users_by_role || {}

  // Для каждой роли в стадии добавляем пользователей
  Object.keys(stageRoles).forEach((roleName) => {
    const roleData = stageRoles[roleName]
    const users = roleData.users || []

    // Инициализируем массив для роли, если его нет
    if (!dynamicUsers[roleName]) {
      dynamicUsers[roleName] = []
    }

    // Добавляем пользователей в динамический массив
    dynamicUsers[roleName] = [...dynamicUsers[roleName], ...users]
  })
})

// Обновляем allUsers динамически
Object.keys(dynamicUsers).forEach((roleName) => {
  allUsers[roleName] = dynamicUsers[roleName]
})
```

### 🆕 Поддержка новых ролей

#### Расширенная функция `getRoleDisplayName`:
```typescript
function getRoleDisplayName(roleName: string): string {
  const names: Record<string, string> = {
    designer: 'Дизайнеры',
    print_operator: 'Печатники',
    engraving_operator: 'Гравировщики',
    workshop_worker: 'Работники цеха',
    // Новые роли
    lamination_operator: 'Операторы ламинирования',
    cutting_operator: 'Операторы резки',
    packaging_worker: 'Упаковщики',
    quality_controller: 'Контролеры качества',
    shipping_operator: 'Операторы доставки',
  }
  
  // Автоматическое создание названий для новых ролей
  if (!names[roleName]) {
    return roleName.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') + 'ы'
  }
  
  return names[roleName]
}
```

### 🔄 Динамический fallback

#### Было (статично):
```typescript
if (
  allUsers.designer.length === 0 &&
  allUsers.print_operator.length === 0 &&
  allUsers.engraving_operator.length === 0 &&
  allUsers.workshop_worker.length === 0
) {
  // Жестко заданные fallback пользователи
}
```

#### Стало (динамически):
```typescript
const totalUsers = Object.keys(allUsers).reduce(
  (sum, role) => sum + (allUsers[role]?.length || 0), 0
)

if (totalUsers === 0) {
  // Динамически распределяем пользователей по ролям
  Object.keys(allUsers).forEach((roleName) => {
    allUsers[roleName] = fallbackUsers.filter((u) => 
      u.roles.some((r) => r.name === roleName)
    )
  })
}
```

## 🚀 Преимущества

### ✅ Автоматичность
- Новые роли автоматически добавляются в систему
- Не нужно изменять код при добавлении новых ролей
- Пользователи автоматически распределяются по ролям

### ✅ Гибкость
- Работает с любым количеством ролей
- Поддерживает любые названия ролей
- Адаптируется к изменениям в базе данных

### ✅ Масштабируемость
- Система готова к росту количества ролей
- Не требует переписывания кода
- Легко добавлять новые роли через админку

## 📊 Примеры работы

### Текущие роли:
- `designer` → "Дизайнеры"
- `print_operator` → "Печатники"
- `engraving_operator` → "Гравировщики"
- `workshop_worker` → "Работники цеха"

### Новые роли (автоматически):
- `lamination_operator` → "Операторы ламинирования"
- `cutting_operator` → "Операторы резки"
- `packaging_worker` → "Упаковщики"
- `quality_controller` → "Контролеры качества"
- `shipping_operator` → "Операторы доставки"

### Неизвестные роли (автоматически):
- `new_custom_role` → "New Custom Roleы"
- `special_operator` → "Special Operatorы"

## 🧪 Тестирование

### Как проверить:
1. Откройте консоль браузера (F12)
2. Перейдите в ProductFormModal
3. Посмотрите логи загрузки пользователей

### Ожидаемые логи:
```
🔍 Processing users by stage roles: {...}
📋 Processing stage: design {...}
  👥 Role designer: 5 users
📋 Processing stage: print {...}
  👥 Role print_operator: 3 users
👥 Loaded users by roles: {designer: 5, print_operator: 3, ...}
```

## 🔄 Обратная совместимость

Система полностью обратно совместима:
- Старые роли продолжают работать
- Fallback пользователи создаются для всех ролей
- API не требует изменений

## 📋 Следующие шаги

1. **Добавить новые роли** через админку
2. **Назначить пользователей** на новые роли
3. **Протестировать** автоматическое появление новых ролей в модале
4. **Убедиться** что пользователи загружаются корректно 