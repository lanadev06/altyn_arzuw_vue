import { ref } from 'vue'
import { useOrderController } from '@/controllers/OrderController'

export function useOrderListLoadOrders() {
  const { fetchOrders } = useOrderController()
  const selectedStage = ref<string | null>(null)
  const isArchived = ref<boolean>(false)
  const search = ref('')
  const currentPage = ref(1)

  const loadOrders = async () => {
    await fetchOrders(
      currentPage.value,
      search.value,
      'id',
      'desc',
      selectedStage.value || undefined,
      isArchived.value,
      30,
      undefined,
    )
  }

  return {
    selectedStage,
    isArchived,
    search,
    currentPage,
    loadOrders,
  }
}
