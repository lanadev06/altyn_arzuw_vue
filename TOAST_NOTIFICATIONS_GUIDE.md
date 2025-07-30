# Замена Alert на Toast уведомления

## ✅ Выполненные изменения

Все `alert()` уведомления заменены на `toast.show()` для лучшего пользовательского опыта.

## 🔧 Изменения в компонентах

### 1. UserList.vue

```typescript
// Добавлен импорт
import { useToast } from '@/stores/toast'

// Добавлен toast
const toast = useToast()

// Заменены alert на toast
if (err instanceof Error) {
  toast.show(`Ошибка удаления пользователя: ${err.message}`, 'error')
} else {
  toast.show('Произошла неизвестная ошибка при удалении пользователя', 'error')
}
```

### 2. ProjectList.vue

```typescript
// Добавлен импорт
import { useToast } from '@/stores/toast'

// Добавлен toast
const toast = useToast()

// Заменены alert на toast
if (err instanceof Error) {
  toast.show(`Ошибка удаления проекта: ${err.message}`, 'error')
} else {
  toast.show('Произошла неизвестная ошибка при удалении проекта', 'error')
}
```

### 3. ClientList.vue

```typescript
// Добавлен импорт
import { useToast } from '@/stores/toast'

// Добавлен toast
const toast = useToast()

// Заменены alert на toast
if (err instanceof Error) {
  toast.show(`Ошибка удаления клиента: ${err.message}`, 'error')
} else {
  toast.show('Произошла неизвестная ошибка при удалении клиента', 'error')
}
```

### 4. RoleList.vue

```typescript
// Добавлен импорт
import { useToast } from '../../../stores/toast'

// Добавлен toast
const toast = useToast()

// Заменены alert на toast
if (err instanceof Error) {
  toast.show(`Ошибка удаления роли: ${err.message}`, 'error')
} else {
  toast.show('Произошла неизвестная ошибка при удалении роли', 'error')
}
```

### 5. StageList.vue

```typescript
// Добавлен импорт
import { useToast } from '../../../stores/toast'

// Добавлен toast
const toast = useToast()

// Заменены alert на toast
if (err instanceof Error) {
  toast.show(`Ошибка удаления стадии: ${err.message}`, 'error')
} else {
  toast.show('Произошла неизвестная ошибка при удалении стадии', 'error')
}
```

## 📋 Как использовать Toast

### Импорт

```typescript
import { useToast } from '@/stores/toast'
```

### Инициализация

```typescript
const toast = useToast()
```

### Использование

```typescript
// Успешное сообщение
toast.show('Операция выполнена успешно!')

// Сообщение об ошибке
toast.show('Произошла ошибка', 'error')

// Кастомная длительность (в миллисекундах)
toast.show('Сообщение', 'success', 5000)
```

## 🎨 Преимущества Toast над Alert

### Alert (старый способ):

- ❌ Блокирует интерфейс
- ❌ Требует клика для закрытия
- ❌ Плохо выглядит
- ❌ Не соответствует современному UX

### Toast (новый способ):

- ✅ Не блокирует интерфейс
- ✅ Автоматически исчезает
- ✅ Красивый дизайн
- ✅ Современный UX
- ✅ Можно настроить длительность
- ✅ Поддерживает разные типы (success/error)

## 📱 Примеры сообщений

### Успешные операции:

```typescript
toast.show('Пользователь успешно удален!')
toast.show('Проект создан!')
toast.show('Клиент обновлен!')
toast.show('Роль добавлена!')
```

### Ошибки:

```typescript
toast.show('Невозможно удалить пользователя, который назначен в 13 активных заказах', 'error')
toast.show('Невозможно удалить проект, в котором есть 3 активных заказа', 'error')
toast.show('Невозможно удалить клиента, у которого есть 11 активных заказов', 'error')
toast.show('Произошла неизвестная ошибка при удалении', 'error')
```

## 🔧 Система Toast

### Файл: `src/stores/toast.ts`

```typescript
import { ref } from 'vue'

const message = ref('')
const visible = ref(false)
const type = ref<'success' | 'error'>('success')
let timeout: ReturnType<typeof setTimeout>

function show(msg: string, toastType: 'success' | 'error' = 'success', duration = 3000) {
  // Форсируем обновление даже если сообщение то же самое
  message.value = ''
  visible.value = false
  setTimeout(() => {
    message.value = msg
    type.value = toastType
    visible.value = true
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      visible.value = false
    }, duration)
  }, 10)
}

export const toast = { message, visible, type, show }

// Add useToast composable for compatibility
export function useToast() {
  return toast
}
```

### Компонент: `src/components/ui/Toast.vue`

```vue
<template>
  <Transition name="toast">
    <div
      v-if="toast.visible"
      :class="[
        'fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm',
        toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white',
      ]"
    >
      {{ toast.message }}
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useToast } from '@/stores/toast'

const toast = useToast()
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
```

## ✅ Результат

Теперь все уведомления в системе:

- 🎨 Выглядят современно и красиво
- ⚡ Не блокируют интерфейс
- 🔄 Автоматически исчезают
- 📱 Адаптивны для мобильных устройств
- 🎯 Показывают правильные типы сообщений (success/error)

**Пользовательский опыт значительно улучшен!** 🎉
