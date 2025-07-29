# Интеграция связывания ролей со стадиями в формах

## 🎯 Задача

Добавить возможность связывать роли со стадиями прямо в формах `StageFormModal` и `RoleFormModal`.

## ✅ Реализация

### 1. Обновленный StageFormModal

#### Новые возможности:
- ✅ **Выбор ролей** - чекбоксы для выбора ролей, которые могут работать на стадии
- ✅ **Настройки ролей** - для каждой выбранной роли можно настроить:
  - `is_required` - обязательная ли роль для завершения стадии
  - `auto_assign` - автоматически назначать пользователей с этой ролью
- ✅ **Визуальная обратная связь** - отображение названия и описания роли
- ✅ **Динамическая загрузка** - роли загружаются из API

#### Код реализации:

```vue
<!-- Роли стадии -->
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
          <input v-model="getRoleSettings(role.id).is_required" type="checkbox" />
          <span class="text-gray-700">Обязательная</span>
        </label>
        <label class="flex items-center text-sm">
          <input v-model="getRoleSettings(role.id).auto_assign" type="checkbox" />
          <span class="text-gray-700">Автоназначение</span>
        </label>
      </div>
    </div>
  </div>
</div>
```

### 2. Обновленный RoleFormModal

#### Новые возможности:
- ✅ **Выбор стадий** - чекбоксы для выбора стадий, на которых может работать роль
- ✅ **Настройки стадий** - для каждой выбранной стадии можно настроить:
  - `is_required` - обязательная ли роль для завершения стадии
  - `auto_assign` - автоматически назначать пользователей с этой ролью
- ✅ **Цветовая индикация** - отображение цвета стадии
- ✅ **Динамическая загрузка** - стадии загружаются из API

#### Код реализации:

```vue
<!-- Стадии для этой роли -->
<div>
  <label class="block text-sm font-medium text-gray-700 mb-2">
    Стадии для этой роли
  </label>
  <div class="space-y-3">
    <div v-for="stage in availableStages" :key="stage.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div class="flex items-center space-x-3">
        <input
          type="checkbox"
          :checked="selectedStages.some(s => s.stage_id === stage.id)"
          @change="toggleStage(stage)"
          class="rounded border-gray-300 text-blue-600"
        />
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: stage.color }"></div>
          <div>
            <span class="font-medium text-gray-900">{{ stage.display_name }}</span>
            <p class="text-sm text-gray-500">{{ stage.description || 'Нет описания' }}</p>
          </div>
        </div>
      </div>
      <div v-if="selectedStages.some(s => s.stage_id === stage.id)" class="flex space-x-2">
        <label class="flex items-center text-sm">
          <input v-model="getStageSettings(stage.id).is_required" type="checkbox" />
          <span class="text-gray-700">Обязательная</span>
        </label>
        <label class="flex items-center text-sm">
          <input v-model="getStageSettings(stage.id).auto_assign" type="checkbox" />
          <span class="text-gray-700">Автоназначение</span>
        </label>
      </div>
    </div>
  </div>
</div>
```

### 3. Обновленные типы

#### Role.ts
```typescript
export interface Role {
  id: number
  name: string
  display_name: string
  description?: string | null
  created_at: string
  updated_at: string
  users_count?: number
  users?: User[]
  pivot?: {
    is_required: boolean
    auto_assign: boolean
  }
}
```

#### Stage.ts
```typescript
export interface Stage {
  id: number
  name: string
  display_name: string
  description?: string | null
  order: number
  is_active: boolean
  color?: string
  created_at: string
  updated_at: string
  roles?: Role[]
}
```

### 4. Функциональность

#### StageFormModal:
- **Загрузка ролей**: `loadAvailableRoles()` - загружает все доступные роли
- **Переключение роли**: `toggleRole(role)` - добавляет/удаляет роль из выбранных
- **Настройки роли**: `getRoleSettings(roleId)` - возвращает настройки для роли
- **Отправка данных**: включает `roles` массив с выбранными ролями и их настройками

#### RoleFormModal:
- **Загрузка стадий**: `loadAvailableStages()` - загружает все доступные стадии
- **Переключение стадии**: `toggleStage(stage)` - добавляет/удаляет стадию из выбранных
- **Настройки стадии**: `getStageSettings(stageId)` - возвращает настройки для стадии
- **Отправка данных**: включает `stages` массив с выбранными стадиями и их настройками

## 🔧 Как использовать

### Создание стадии с ролями:
1. Откройте форму создания стадии
2. Заполните основные поля (название, внутреннее имя, описание, порядок)
3. В разделе "Роли для этой стадии" выберите нужные роли
4. Для каждой выбранной роли настройте:
   - **Обязательная** - если роль обязательна для завершения стадии
   - **Автоназначение** - если пользователей с этой ролью нужно назначать автоматически
5. Сохраните стадию

### Создание роли со стадиями:
1. Откройте форму создания роли
2. Заполните основные поля (название, внутреннее имя, описание)
3. В разделе "Стадии для этой роли" выберите нужные стадии
4. Для каждой выбранной стадии настройте:
   - **Обязательная** - если роль обязательна для завершения стадии
   - **Автоназначение** - если пользователей с этой ролью нужно назначать автоматически
5. Сохраните роль

## 🎉 Результат

Теперь в формах стадий и ролей можно:

1. **Динамически связывать** роли со стадиями
2. **Настраивать параметры** связей (обязательность, автоназначение)
3. **Визуально видеть** все доступные роли/стадии с их описаниями
4. **Легко управлять** связями без необходимости использовать отдельные интерфейсы

## 🔄 Обратная совместимость

- ✅ Существующие стадии и роли продолжают работать
- ✅ Старые связи сохраняются при редактировании
- ✅ Формы работают как с новыми, так и со старыми данными

## 🚀 Преимущества

1. **Удобство использования** - все в одном месте
2. **Визуальная обратная связь** - четко видно что выбрано
3. **Гибкость настроек** - можно настроить каждый параметр связи
4. **Динамичность** - автоматически загружаются все доступные роли/стадии
5. **Консистентность** - единый интерфейс для управления связями

Теперь управление связями стадий и ролей стало намного проще и удобнее! 🎉 