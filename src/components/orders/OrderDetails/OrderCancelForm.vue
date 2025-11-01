<template>
  <div
    v-if="show"
    class="bg-white border border-red-100 rounded-xl shadow-md p-4 mb-6 flex flex-col gap-3 animate-fade-in"
  >
    <div class="text-red-500 text-base font-semibold mb-1">
      {{ t('order.confirmCancel') }}
    </div>
    
    <div class="flex flex-col gap-2">
      <label class="font-medium text-gray-700 text-sm">{{ t('order.cancelReason') }}</label>
      <textarea
        v-model="reason"
        class="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-red-200 transition w-full resize-none text-gray-900 bg-white"
        :placeholder="t('order.cancelReasonPlaceholder')"
        rows="2"
      />
    </div>
    
    <div class="flex flex-col gap-2">
      <label class="font-medium text-gray-700 text-sm">{{ t('order.reasonStatus') }}</label>
      <select
        v-model="reasonStatus"
        class="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-red-200 transition w-full text-gray-900 bg-white"
      >
        <option value="refused">{{ t('order.clientRefusal') }}</option>
        <option value="not_responding">{{ t('order.notResponding') }}</option>
        <option value="defective_product">{{ t('order.defectiveProduct') }}</option>
      </select>
    </div>
    
    <div class="flex gap-2 justify-end mt-1">
      <button
        @click="handleConfirm"
        class="rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-1.5 text-sm shadow transition"
      >
        {{ t('common.confirm') }}
      </button>
      <button
        @click="handleCancel"
        class="rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-4 py-1.5 text-sm shadow transition"
      >
        {{ t('common.cancel') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  show: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  confirm: [reason: string, reasonStatus: string]
  cancel: []
}>()

const reason = ref('')
const reasonStatus = ref('refused')

// Сбрасываем форму при скрытии
watch(() => props.show, (newValue) => {
  if (!newValue) {
    reason.value = ''
    reasonStatus.value = 'refused'
  }
})

function handleConfirm() {
  if (!reason.value.trim()) {
    alert(t('order.cancelReasonPlaceholder'))
    return
  }
  
  emit('confirm', reason.value, reasonStatus.value)
}

function handleCancel() {
  emit('cancel')
}

</script>

<style scoped>
.animate-fade-in {
  animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.97);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
