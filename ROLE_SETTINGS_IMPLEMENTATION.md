# Реализация настроек ролей: "Обязательная" и "Автоназначение"

## 🎯 **Обзор**

Система позволяет настраивать две ключевые характеристики для связи ролей и стадий:

### 🔴 **"Обязательная" (is_required)**
- **Назначение**: Роль, которая **обязательно** должна быть назначена на стадию
- **Логика**: Без этой роли стадия не может быть выполнена
- **Валидация**: Система проверяет наличие назначенных пользователей

### 🟢 **"Автоназначение" (auto_assign)**
- **Назначение**: Автоматическое назначение пользователей с этой ролью
- **Логика**: Система автоматически распределяет работу
- **Приоритет**: Находит первого свободного пользователя

## 🏗️ **Архитектура реализации**

### 1. **База данных**

#### Таблица `stage_roles` (pivot table)
```sql
CREATE TABLE stage_roles (
    id BIGINT PRIMARY KEY,
    stage_id BIGINT,
    role_id BIGINT,
    is_required BOOLEAN DEFAULT FALSE,
    auto_assign BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### Модели Laravel
```php
// Stage.php
public function roles()
{
    return $this->belongsToMany(Role::class, 'stage_roles')
                ->withPivot('is_required', 'auto_assign')
                ->withTimestamps();
}

// Role.php
public function stages()
{
    return $this->belongsToMany(Stage::class, 'stage_roles')
                ->withPivot('is_required', 'auto_assign')
                ->withTimestamps();
}
```

### 2. **Frontend компоненты**

#### StageFormModal.vue - Настройка ролей
```vue
<!-- Роли для этой стадии -->
<div>
  <label class="block text-sm font-medium text-gray-700 mb-2">
    Роли для этой стадии
  </label>
  <div class="space-y-3">
    <div v-for="role in availableRoles" :key="role.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div class="flex items-center space-x-3">
        <input
          type="checkbox"
          :checked="selectedRoles.some(r => r.role_id === role.id)"
          @change="toggleRole(role)"
          class="rounded border-gray-300 text-blue-600"
        />
        <div>
          <span class="font-medium text-gray-900">{{ role.display_name }}</span>
          <p class="text-sm text-gray-500">{{ role.description || 'Нет описания' }}</p>
        </div>
      </div>
      <div v-if="selectedRoles.some(r => r.role_id === role.id)" class="flex space-x-2">
        <label class="flex items-center text-sm">
          <input
            v-model="getRoleSettings(role.id).is_required"
            type="checkbox"
            class="mr-1 rounded border-gray-300 text-red-600"
          />
          <span class="text-gray-700">Обязательная</span>
        </label>
        <label class="flex items-center text-sm">
          <input
            v-model="getRoleSettings(role.id).auto_assign"
            type="checkbox"
            class="mr-1 rounded border-gray-300 text-green-600"
          />
          <span class="text-gray-700">Автоназначение</span>
        </label>
      </div>
    </div>
  </div>
</div>
```

#### ProductFormModal.vue - Автоматическое назначение
```javascript
// 🔧 НОВАЯ ЛОГИКА: Автоматическое назначение на основе настроек ролей
Object.keys(usersByStageRoles).forEach((stageName) => {
  const stageData = usersByStageRoles[stageName]
  const stageRoles = stageData.users_by_role || {}
  
  Object.keys(stageRoles).forEach((roleName) => {
    const roleData = stageRoles[roleName]
    const role = roleData.role
    const users = roleData.users || []
    
    // Проверяем настройки роли для этой стадии
    if (role && role.pivot) {
      const isRequired = role.pivot.is_required
      const autoAssign = role.pivot.auto_assign
      
      // Если роль обязательная, проверяем что есть назначенные пользователи
      if (isRequired && users.length === 0) {
        console.warn(`⚠️ Required role ${roleName} has no available users for stage ${stageName}`)
      }
      
      // Если автоназначение включено и есть свободные пользователи
      if (autoAssign && users.length > 0) {
        const availableUser = users.find(user => user.is_available !== false)
        if (availableUser) {
          // Автоматически назначаем пользователя в форму
          if (roleName === 'designer' && !form.designer_id) {
            form.designer_id = availableUser.id
          }
          // ... другие роли
        }
      }
    }
  })
})
```

### 3. **UI компоненты**

#### RoleSettingsInfo.vue - Информационная панель
```vue
<template>
  <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
    <div class="flex items-start space-x-3">
      <div class="flex-1">
        <h3 class="text-sm font-medium text-blue-900 mb-2">
          Настройки ролей для стадий
        </h3>
        <div class="space-y-2 text-sm text-blue-800">
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-red-500 rounded-full"></div>
            <span><strong>Обязательная</strong> - роль необходима для выполнения стадии</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span><strong>Автоназначение</strong> - система автоматически назначает пользователей</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

#### AssignmentStatus.vue - Статус назначений
```vue
<template>
  <div class="space-y-3">
    <h4 class="text-sm font-medium text-gray-700">Статус назначений</h4>
    
    <!-- Статус по ролям -->
    <div class="space-y-2">
      <div v-for="role in roles" :key="role.name" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div class="flex items-center space-x-3">
          <!-- Иконка статуса -->
          <div class="w-4 h-4 rounded-full flex items-center justify-center" :class="getStatusClass(role)">
            <!-- Иконки для разных статусов -->
          </div>
          
          <!-- Информация о роли -->
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-medium text-gray-900">{{ role.displayName }}</span>
              <div v-if="role.isRequired" class="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                Обязательная
              </div>
              <div v-if="role.autoAssign" class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                Автоназначение
              </div>
            </div>
            <p class="text-sm text-gray-500">{{ getStatusText(role) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

## 🎯 **Практические сценарии использования**

### Сценарий 1: Дизайн-студия
```
Стадия: "Дизайн"
Роль: "Дизайнер"
Настройки: ✅ Обязательная, ✅ Автоназначение

Результат:
- Без дизайнера стадия не может быть выполнена
- Система автоматически назначает свободного дизайнера
- Менеджер может переназначить вручную при необходимости
```

### Сценарий 2: Контроль качества
```
Стадия: "Проверка качества"
Роль: "Контролер качества"
Настройки: ✅ Обязательная, ❌ Автоназначение

Результат:
- Без контролера стадия не может быть выполнена
- Контролер назначается вручную менеджером
- Система не автоматизирует назначение контролеров
```

### Сценарий 3: Вспомогательные роли
```
Стадия: "Печать"
Роль: "Помощник печатника"
Настройки: ❌ Обязательная, ✅ Автоназначение

Результат:
- Стадия может быть выполнена без помощника
- Если есть свободный помощник, он автоматически назначается
- Помощник может быть удален без блокировки стадии
```

## 🔧 **API Endpoints**

### Получение ролей для стадии
```http
GET /api/stages/{stage}/users-by-roles
```

### Получение всех пользователей по ролям стадий
```http
GET /api/stages/users-by-roles/all
```

### Создание/обновление связи роли и стадии
```http
POST /api/stages/{stage}/roles
{
  "role_id": 1,
  "is_required": true,
  "auto_assign": true
}
```

## 🚀 **Преимущества системы**

### 1. **Гибкость**
- Можно настроить любую комбинацию параметров
- Подходит для разных типов бизнес-процессов

### 2. **Автоматизация**
- Снижает ручную работу менеджеров
- Оптимизирует распределение нагрузки

### 3. **Контроль качества**
- Обеспечивает обязательное назначение ключевых ролей
- Предотвращает пропуск важных этапов

### 4. **Масштабируемость**
- Легко добавлять новые роли и стадии
- Настройки применяются динамически

## 📋 **Рекомендации по настройке**

### Для основных производственных ролей:
- **Дизайнер** → ✅ Обязательная, ✅ Автоназначение
- **Печатник** → ✅ Обязательная, ✅ Автоназначение
- **Сборщик** → ✅ Обязательная, ✅ Автоназначение

### Для контрольных ролей:
- **Контролер качества** → ✅ Обязательная, ❌ Автоназначение
- **Технолог** → ✅ Обязательная, ❌ Автоназначение

### Для вспомогательных ролей:
- **Помощник** → ❌ Обязательная, ✅ Автоназначение
- **Курьер** → ❌ Обязательная, ✅ Автоназначение

### Для административных ролей:
- **Менеджер проекта** → ❌ Обязательная, ❌ Автоназначение
- **Координатор** → ❌ Обязательная, ❌ Автоназначение

## 🎉 **Итог**

Система настроек ролей обеспечивает:
- **Интеллектуальное назначение** пользователей
- **Контроль качества** процессов
- **Автоматизацию** рутинных задач
- **Гибкость** в настройке бизнес-процессов

Это позволяет создать эффективную систему управления производственными процессами, которая адаптируется к потребностям конкретного бизнеса! 🚀 