# Отчет о добавлении чекбоксов и назначений в массовый заказ

## 🎯 Проблема

В массовом заказе не было чекбоксов для выбора стадий и назначений при выборе продуктов. Пользователи могли только указать продукты, количество, цену и дедлайн, но не могли выбрать стадии производства и назначить исполнителей.

## ✅ Решение

### 1. Обновлена структура данных массовых заказов

**Было:**
```typescript
const bulkOrders = ref<
  Array<{
    product_id: number | null
    quantity: number
    price: number | null
    deadline: string | null
  }>
>([])
```

**Стало:**
```typescript
const bulkOrders = ref<
  Array<{
    product_id: number | null
    quantity: number
    price: number | null
    deadline: string | null
    selected_stages: number[]           // ✅ НОВОЕ: выбранные стадии
    assignments: Record<number, Record<string, ProductAssignment[]>>  // ✅ НОВОЕ: назначения
  }>
>([])
```

### 2. Добавлен интерфейс для стадий и назначений В КАРТОЧКЕ КАЖДОГО ЗАКАЗА

**✅ Чекбоксы и назначения теперь находятся в карточке каждого заказа, чтобы не путались между заказами!**

**Новая структура карточки заказа:**
```vue
<div v-for="(order, index) in bulkOrders" :key="index" class="bg-gray-50 rounded-lg p-4 border border-gray-200">
  <!-- Заголовок заказа -->
  <div class="flex items-center justify-between mb-3">
    <h4 class="font-medium text-gray-900">Заказ {{ index + 1 }}</h4>
    <UIButton @click="removeBulkOrder(index)">Удалить</UIButton>
  </div>

  <!-- Основные поля заказа -->
  <div class="grid grid-cols-4 gap-3">
    <!-- Продукт, количество, цена, дедлайн -->
  </div>

  <!-- ✅ НОВОЕ: Стадии для этого заказа -->
  <div v-if="order.product_id && workingStages.length > 0" class="mt-4 space-y-3">
    <div class="flex items-center justify-between">
      <label class="block text-sm font-medium text-gray-700">
        Стадии производства <span class="text-red-500">*</span>
      </label>
      <div class="flex gap-2">
        <UIButton @click="selectAllStagesForBulkOrder(index)">Выбрать все</UIButton>
        <UIButton @click="clearAllStagesForBulkOrder(index)">Очистить</UIButton>
      </div>
    </div>

    <!-- Чекбоксы для стадий -->
    <div class="grid grid-cols-2 gap-2">
      <label
        v-for="stage in workingStages"
        :key="stage.id"
        class="flex items-center p-2 bg-white rounded border border-gray-200"
        :class="order.selected_stages.includes(stage.id) ? 'border-blue-500 bg-blue-50' : ''"
        @click="toggleBulkOrderStage(index, stage.id)"
      >
        <!-- Чекбокс -->
        <div class="mr-2 w-4 h-4 border-2 rounded flex items-center justify-center">
          <svg v-if="order.selected_stages.includes(stage.id)" class="w-3 h-3 text-white" fill="currentColor">
            <!-- Иконка галочки -->
          </svg>
        </div>
        <!-- Название стадии -->
        <span class="text-sm font-medium text-gray-900">{{ stage.display_name }}</span>
      </label>
    </div>
  </div>

  <!-- ✅ НОВОЕ: Назначения для этого заказа -->
  <div v-if="order.selected_stages.length > 0" class="mt-4 space-y-3">
    <div
      v-for="stage in getSelectedStageObjectsForBulkOrder(index)"
      :key="stage.id"
      class="border border-gray-200 rounded p-3 bg-white"
    >
      <!-- Заголовок стадии -->
      <div class="flex items-center mb-2">
        <div class="w-3 h-3 rounded-full mr-2" :style="{ backgroundColor: stage.color }"></div>
        <h5 class="text-sm font-medium text-gray-900">{{ stage.display_name }}</h5>
      </div>

      <!-- Роли и назначения для этой стадии -->
      <div v-if="stage.roles && stage.roles.length > 0" class="space-y-2">
        <div v-for="role in stage.roles" :key="role.id" class="space-y-2">
          <!-- Заголовок роли -->
          <div class="flex items-center justify-between">
            <label class="block text-xs font-medium text-gray-700">
              {{ getRoleDisplayName(role.name) }}
              <span class="text-xs text-gray-500">({{ role.name }})</span>
            </label>
            <UIButton @click="addBulkOrderAssignment(index, stage.id, role.name)">
              Добавить
            </UIButton>
          </div>

          <!-- Список назначений -->
          <div v-if="getBulkOrderAssignmentsForStageRole(index, stage.id, role.name).length === 0"
               class="text-xs text-gray-500 italic py-1">
            Назначения не добавлены
          </div>

          <div v-else class="space-y-1">
            <div
              v-for="(assignment, assignmentIndex) in getBulkOrderAssignmentsForStageRole(index, stage.id, role.name)"
              :key="assignment.id || assignmentIndex"
              class="flex items-center gap-2 p-2 border border-gray-200 rounded bg-gray-50"
            >
              <!-- Выбор пользователя -->
              <div class="flex-1">
                <Vue3Select
                  v-model="assignment.user"
                  :options="getUsersForRole(role.name)"
                  label="name"
                  placeholder="Выберите пользователя"
                  :clearable="true"
                  :searchable="true"
                  @update:model-value="(val) => handleBulkOrderUserSelect(val, assignment, index, stage.id, role.name, assignmentIndex)"
                />
              </div>

              <!-- Кнопка удаления -->
              <UIButton
                variant="danger"
                size="sm"
                @click="removeBulkOrderAssignment(index, stage.id, role.name, assignmentIndex)"
              >
                Удалить
              </UIButton>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-xs text-gray-500">Для этой стадии не настроены роли</div>
    </div>
  </div>
</div>
```

### 3. ✅ НОВОЕ: Автоматический выбор стадий и автоподстановка назначений

**Обновленная функция onBulkOrderProductChange:**
```typescript
async function onBulkOrderProductChange(index: number) {
  const order = bulkOrders.value[index]
  if (!order || !order.product_id) return

  try {
    console.log(`🔄 Product changed for bulk order ${index}:`, order.product_id)
    
    // Сбрасываем выбранные стадии и назначения для этого заказа
    order.selected_stages = []
    order.assignments = {}

    // Находим выбранный продукт
    const selectedProduct = products.value.find((p) => p.id === order.product_id)
    if (!selectedProduct) {
      console.warn(`⚠️ Product not found for bulk order ${index}:`, order.product_id)
      return
    }

    // ✅ АВТОМАТИЧЕСКИ ВЫБИРАЕМ ВСЕ ДОСТУПНЫЕ СТАДИИ ПРОДУКТА
    if (selectedProduct.available_stages && Array.isArray(selectedProduct.available_stages)) {
      order.selected_stages = selectedProduct.available_stages.map((stage) => stage.id)
      console.log(`✅ Selected stages for bulk order ${index}:`, order.selected_stages)

      // ✅ АВТОПОДСТАВЛЯЕМ НАЗНАЧЕНИЯ ПРОДУКТА
      const productAssignmentsResponse = await getProductAssignments(order.product_id)
      
      if (productAssignmentsResponse?.assignments?.length > 0) {
        // Группируем назначения продукта по ролям
        const productAssignmentsByRole: Record<string, ProductAssignment[]> = {}

        productAssignmentsResponse.assignments.forEach((assignment: any) => {
          const roleType = assignment.role_type
          if (!productAssignmentsByRole[roleType]) {
            productAssignmentsByRole[roleType] = []
          }
          productAssignmentsByRole[roleType].push({
            id: assignment.id,
            user_id: assignment.user_id,
            role_type: assignment.role_type,
            user: assignment.user,
          })
        })

        // Копируем назначения продукта в заказ для каждой стадии
        Object.keys(productAssignmentsByRole).forEach((roleType) => {
          const assignments = productAssignmentsByRole[roleType]
          
          // Находим стадии, которые используют эту роль
          const stagesWithRole = availableStages.value.filter((stage) => {
            return stage.roles && stage.roles.some((role: any) => role.name === roleType)
          })

          // Копируем назначения для каждой стадии с этой ролью
          stagesWithRole.forEach((stage) => {
            if (!order.assignments[stage.id]) {
              order.assignments[stage.id] = {}
            }
            if (!order.assignments[stage.id][roleType]) {
              order.assignments[stage.id][roleType] = []
            }

            // Копируем назначения с новыми ID
            order.assignments[stage.id][roleType] = assignments.map(assignment => ({
              ...assignment,
              id: Date.now() + Math.random(), // Новый ID для массового заказа
            }))
          })
        })

        console.log(`✅ Product assignments copied to bulk order ${index}`)
      }
    }
  } catch (error) {
    console.error(`❌ Error processing product change for bulk order ${index}:`, error)
  }
}
```

### 4. Добавлены функции для работы со стадиями

**Функции для управления стадиями:**
```typescript
// Переключение стадии
function toggleBulkOrderStage(orderIndex: number, stageId: number) {
  const order = bulkOrders.value[orderIndex]
  if (!order) return

  const stageIndex = order.selected_stages.indexOf(stageId)
  if (stageIndex > -1) {
    order.selected_stages.splice(stageIndex, 1)
  } else {
    order.selected_stages.push(stageId)
  }
}

// Выбрать все стадии
function selectAllStagesForBulkOrder(orderIndex: number) {
  const order = bulkOrders.value[orderIndex]
  if (!order) return
  order.selected_stages = workingStages.value.map(stage => stage.id)
}

// Очистить все стадии
function clearAllStagesForBulkOrder(orderIndex: number) {
  const order = bulkOrders.value[orderIndex]
  if (!order) return
  order.selected_stages = []
}

// Получить объекты выбранных стадий
function getSelectedStageObjectsForBulkOrder(orderIndex: number) {
  const order = bulkOrders.value[orderIndex]
  if (!order) return []

  return availableStages.value
    .filter(stage => order.selected_stages.includes(stage.id))
    .filter(stage => stage.roles && stage.roles.length > 0)
}
```

### 5. Добавлены функции для работы с назначениями

**Функции для управления назначениями:**
```typescript
// Добавить назначение
function addBulkOrderAssignment(orderIndex: number, stageId: number, roleName: string) {
  const order = bulkOrders.value[orderIndex]
  if (!order) return

  if (!order.assignments[stageId]) {
    order.assignments[stageId] = {}
  }
  if (!order.assignments[stageId][roleName]) {
    order.assignments[stageId][roleName] = []
  }

  order.assignments[stageId][roleName].push({
    id: Date.now() + Math.random(),
    user: null,
    stage_id: stageId,
    role_type: roleName,
  })
}

// Удалить назначение
function removeBulkOrderAssignment(orderIndex: number, stageId: number, roleName: string, assignmentIndex: number) {
  const order = bulkOrders.value[orderIndex]
  if (!order || !order.assignments[stageId] || !order.assignments[stageId][roleName]) return

  order.assignments[stageId][roleName].splice(assignmentIndex, 1)
}

// Получить назначения для стадии и роли
function getBulkOrderAssignmentsForStageRole(orderIndex: number, stageId: number, roleName: string) {
  const order = bulkOrders.value[orderIndex]
  if (!order || !order.assignments[stageId] || !order.assignments[stageId][roleName]) {
    return []
  }
  return order.assignments[stageId][roleName]
}

// Обработка выбора пользователя
function handleBulkOrderUserSelect(user: User | null, assignment: ProductAssignment, orderIndex: number, stageId: number, roleName: string, assignmentIndex: number) {
  if (user) {
    assignment.user_id = user.id
    assignment.user = user
  } else {
    assignment.user_id = null
    assignment.user = null
  }
}
```

### 6. Обновлена функция создания массовых заказов

**Обновленная функция handleSubmit:**
```typescript
// Для массового заказа создаем несколько заказов
if (orderMode.value === 'bulk') {
  console.log('📦 Creating bulk orders with stages and assignments...')

  // Создаем все заказы
  const createdOrders = []
  for (let i = 0; i < bulkOrders.value.length; i++) {
    const order = bulkOrders.value[i]
    
    // Подготавливаем данные заказа
    const orderData = {
      client_id: form.client_id,
      project_id: form.project_id,
      product_id: order.product_id,
      quantity: order.quantity,
      price: order.price,
      deadline: order.deadline || null,
      is_bulk: true,
      project_title: bulkProjectTitle.value.trim() || undefined,
      stages: order.selected_stages || [],           // ✅ НОВОЕ: стадии
      assignments: getBulkOrderAssignments(i),       // ✅ НОВОЕ: назначения
    }

    console.log(`📦 Creating bulk order ${i + 1}:`, orderData)
    const createdOrder = await create(orderData)
    createdOrders.push(createdOrder)
  }

  toast.show(`Создано ${createdOrders.length} заказов успешно!`)
  emit('submit')
  emit('close')
  return
}
```

### 7. Добавлена функция подготовки назначений

**Функция getBulkOrderAssignments:**
```typescript
function getBulkOrderAssignments(orderIndex: number): OrderAssignmentCreate[] {
  const order = bulkOrders.value[orderIndex]
  if (!order) return []

  const allAssignments: OrderAssignmentCreate[] = []

  Object.keys(order.assignments).forEach((stageId) => {
    const stageIdNum = parseInt(stageId)

    // Проверяем, выбрана ли эта стадия
    if (!order.selected_stages.includes(stageIdNum)) {
      return // Пропускаем эту стадию
    }

    const stageAssignmentsForStage = order.assignments[stageIdNum]

    if (stageAssignmentsForStage && typeof stageAssignmentsForStage === 'object') {
      Object.keys(stageAssignmentsForStage).forEach((roleName) => {
        const assignments = stageAssignmentsForStage[roleName]

        if (Array.isArray(assignments)) {
          assignments.forEach((assignment) => {
            if (assignment && assignment.user_id && assignment.user_id > 0) {
              const assignmentData = {
                user_id: assignment.user_id,
                role_type: roleName,
                stage_id: stageIdNum,
              }
              allAssignments.push(assignmentData)
            }
          })
        }
      })
    }
  })

  return allAssignments
}
```

## 🔄 Сценарии работы

### Сценарий 1: Создание массового заказа
1. **Выбрать режим "Массовый заказ"**
2. **Выбрать клиента и проект**
3. **Добавить продукты** (количество, цена, дедлайн)
4. **✅ АВТОМАТИЧЕСКИ:** стадии выбираются и назначения подставляются при выборе продукта
5. **Создать заказы**

### Сценарий 2: ✅ НОВОЕ: Автоматический выбор стадий
1. **Выбрать продукт** в массовом заказе
2. **✅ АВТОМАТИЧЕСКИ:** все доступные стадии продукта выбираются
3. **✅ АВТОМАТИЧЕСКИ:** назначения продукта подставляются
4. **При необходимости:** изменить выбор стадий или назначения

### Сценарий 3: ✅ НОВОЕ: Автоподстановка назначений
1. **Выбрать продукт** в массовом заказе
2. **Появляются назначения** из настроек продукта
3. **Можно изменить** назначения при необходимости
4. **Добавить/удалить** назначения вручную

## 📊 Структура данных

### Массовый заказ теперь содержит:
```typescript
{
  product_id: number | null,
  quantity: number,
  price: number | null,
  deadline: string | null,
  selected_stages: number[],           // ID выбранных стадий (автоматически)
  assignments: {                       // Назначения по стадиям и ролям (автоподстановка)
    [stageId]: {
      [roleName]: [
        {
          id: number,
          user: User | null,
          user_id: number | null,
          role_type: string,
        }
      ]
    }
  }
}
```

## 🎯 Преимущества

### ✅ Полноценный массовый заказ:
- **Выбор стадий** для каждого заказа
- **Назначение исполнителей** по стадиям и ролям
- **Индивидуальные настройки** для каждого заказа в массовом режиме

### ✅ Удобный интерфейс:
- **Чекбоксы** для быстрого выбора стадий
- **Кнопки "Выбрать все" / "Очистить"** для массовых операций
- **Визуальное разделение** заказов в массовом режиме

### ✅ ✅ НОВОЕ: Чекбоксы и назначения в карточке заказа:
- **Каждый заказ имеет свои чекбоксы** - нет путаницы между заказами
- **Назначения привязаны к конкретному заказу** - четкое разделение
- **Компактный интерфейс** - все настройки в одной карточке
- **Логическая группировка** - стадии и назначения рядом с продуктом

### ✅ ✅ НОВОЕ: Автоматический выбор и автоподстановка:
- **Автоматический выбор стадий** - как в одиночном заказе
- **Автоподстановка назначений** - из настроек продукта
- **Быстрое создание заказов** - минимум ручной настройки
- **Консистентность с одиночным заказом** - одинаковое поведение

### ✅ Консистентность:
- **Аналогичный интерфейс** с одиночным заказом
- **Те же функции** назначения исполнителей
- **Единообразная валидация** данных
- **Одинаковое поведение** автоматического выбора

## 🧪 Тестирование

### Что проверить:
1. ✅ **Переключение в режим массового заказа**
2. ✅ **Добавление продуктов** в массовый заказ
3. ✅ **Автоматический выбор стадий** при выборе продукта
4. ✅ **Автоподстановка назначений** из настроек продукта
5. ✅ **Ручное изменение** стадий и назначений
6. ✅ **Кнопки "Выбрать все" / "Очистить"** для стадий в карточке
7. ✅ **Добавление/удаление назначений** в карточке заказа
8. ✅ **Выбор пользователей** в назначениях в карточке заказа
9. ✅ **Создание заказов** с стадиями и назначениями
10. ✅ **Валидация** - проверка обязательных полей
11. ✅ **Нет путаницы** между заказами - каждый заказ имеет свои чекбоксы и назначения
12. ✅ **Консистентность** с одиночным заказом - одинаковое поведение

### Команды для тестирования:
```javascript
// Проверить структуру массового заказа
console.log(bulkOrders.value)

// Проверить автоматически выбранные стадии для первого заказа
console.log(bulkOrders.value[0]?.selected_stages)

// Проверить автоподставленные назначения для первого заказа
console.log(bulkOrders.value[0]?.assignments)

// Проверить автоматически выбранные стадии для второго заказа
console.log(bulkOrders.value[1]?.selected_stages)

// Проверить, что стадии выбираются автоматически при смене продукта
// Выберите продукт в массовом заказе и проверьте консоль
```

## Заключение

**Чекбоксы автоматически выбираются и назначения автоподставляются в массовом заказе!** 🎉

Теперь пользователи могут:
- ✅ **Автоматически получать выбранные стадии** при выборе продукта
- ✅ **Автоматически получать назначения** из настроек продукта
- ✅ **Быстро создавать заказы** с минимальной ручной настройкой
- ✅ **Избегать путаницы** - каждый заказ имеет свои чекбоксы и назначения
- ✅ **Наслаждаться консистентностью** - как в одиночном заказе

**Ключевые улучшения:**
1. **Автоматический выбор стадий** - все доступные стадии продукта выбираются автоматически
2. **Автоподстановка назначений** - назначения из настроек продукта подставляются автоматически
3. **Консистентность с одиночным заказом** - одинаковое поведение в обоих режимах
4. **Чекбоксы и назначения в карточке заказа** - четкое разделение между заказами

Массовый заказ теперь работает точно так же, как одиночный заказ, но позволяет создавать несколько заказов одновременно с автоматической настройкой для каждого! 