<template>
  <div class="input-wrapper">
    <label v-if="label" :for="id" class="block text-sm font-medium text-gray-900 mb-1">
      {{ label }}
    </label>
    <input
      :id="id"
      :type="type"
      :placeholder="placeholder"
      :value="modelValue"
      :disabled="disabled"
      :class="[
        'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200',
        'text-black placeholder:text-gray-900',
        {
          'opacity-50 cursor-not-allowed': disabled,
          'border-red-500 focus:ring-red-500': error,
        },
      ]"
      @input="handleInput"
      @blur="$emit('blur')"
      @focus="$emit('focus')"
    />
    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'UIInput',
})

interface Props {
  modelValue: string
  label?: string
  placeholder?: string
  type?: 'text' | 'username' | 'password' | 'number'
  disabled?: boolean
  error?: string
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  id: () => `input-${Math.random().toString(36).substr(2, 9)}`,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: []
  focus: []
}>()

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>
