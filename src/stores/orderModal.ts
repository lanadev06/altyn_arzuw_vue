import { computed, ref } from 'vue'

interface OpenOptions {
  errorMsg?: string
}

const orderId = ref<number | null>(null)
const errorMsg = ref('')
const updateTick = ref(0)

function open(id: number | string | null | undefined, options: OpenOptions = {}) {
  if (id === null || id === undefined) {
    return
  }

  const numericId = Number(id)
  if (!Number.isFinite(numericId) || numericId <= 0) {
    return
  }

  orderId.value = numericId
  errorMsg.value = options.errorMsg || ''
}

function close() {
  orderId.value = null
  errorMsg.value = ''
}

function markUpdated() {
  updateTick.value++
}

export function useOrderModal() {
  return {
    orderId,
    errorMsg,
    isOpen: computed(() => orderId.value !== null),
    updateTick,
    open,
    close,
    markUpdated,
  }
}

