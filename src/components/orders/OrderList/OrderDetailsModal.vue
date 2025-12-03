<template>
  <transition name="modal-fade">
    <div
      v-if="orderId"
      class="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center"
      @click="onOverlayClick"
    >
      <transition name="modal-scale">
        <div
          v-if="orderId"
          class="relative w-[1300px] max-w-[98vw] h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          @click.stop
        >
          <!-- Кнопка закрытия -->
          <button
            @click="emit('close')"
            class="absolute top-6 right-6 text-3xl text-gray-400 hover:text-red-500 transition font-bold z-10"
          >
            ✕
          </button>

          <!-- Прогресс бар стадий -->
          <OrderStagesProgress
            :stages="stages"
            :current-stage="getCurrentStage(order)"
            :completed-stages="completedStages"
            @stage-click="handleStageClick"
          />

          <!-- Основной контент -->
          <div class="flex-1 flex flex-row h-full min-h-0">
            <!-- Левая панель - информация о заказе -->
            <div
              class="w-1/2 bg-gradient-to-br from-blue-200 via-purple-200 to-cyan-200 p-10 flex flex-col gap-2 border-r border-gray-200 min-w-[340px] overflow-y-auto"
            >
              <!-- Заголовок заказа -->
              <OrderHeader
                :order="order"
                :stages="stages"
              />

              <!-- Информация о заказе -->
              <OrderInfo :order="order" @update-field="updateOrderField" />


              <!-- Назначенные сотрудники -->
              <OrderAssignments
                :assignments="assignments"
                :available-users="availableUsers"
                :stages="stagesWithRoles"
                :roles="roles"
                :current-stage="getCurrentStage(order)"
                :highlight-assignments="highlightAssignments"
                @assign-user="assignUser"
                @update-assignment-status="updateAssignmentStatus"
                @delete-assignment="deleteAssignment"
              />


              <!-- Информация о проекте и клиенте -->
              <OrderProject :order="order" :project="project" @refresh="forceRefresh" />
            </div>

            <!-- Правая панель - комментарии и таймлайн -->
            <div class="w-1/2 flex flex-col gap-2 p-10 bg-[#f8fafc] min-w-[340px] overflow-y-auto">
              <!-- Форма отмены заказа -->
              <OrderCancelForm
                :show="showCancelForm"
                @confirm="confirmCancel"
                @cancel="cancelCancel"
              />

              <!-- Комментарии -->
              <OrderComments
                :comments="comments"
                :roles="roles"
                @add-comment="addComment"
                @delete-comment="deleteComment"
              />

              <!-- Временная шкала -->
              <OrderTimeline :status-logs="statusLogs" :stages="stagesWithRoles" :roles="roles" />
              
              <!-- Кнопка удаления заказа -->
              <div v-if="canDelete() && canViewAllOrders()" class="mt-4 flex justify-end">
                <button
                  @click="showDeleteConfirm = true"
                  class="w-8 h-8 bg-gray-200 hover:bg-red-500 text-gray-500 hover:text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                  :title="t('order.form.delete')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </transition>

  <!-- Модальное окно подтверждения удаления -->
  <ConfirmationModal
    :visible="showDeleteConfirm"
    :title="t('order.deleteConfirm')"
    :message="t('order.deleteConfirmMessage')"
    @confirm="confirmDeleteOrder"
    @cancel="showDeleteConfirm = false"
    @close="showDeleteConfirm = false"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { canDelete, canViewAllOrders } from '../../../utils/permissions'
import { useOrderDetails } from '../../../composables/useOrderDetails'
import OrderStagesProgress from '../OrderDetails/OrderStagesProgress.vue'
import OrderCancelForm from '../OrderDetails/OrderCancelForm.vue'
import OrderHeader from '../OrderDetails/OrderHeader.vue'
import OrderInfo from '../OrderDetails/OrderInfo.vue'
import OrderProject from '../OrderDetails/OrderProject.vue'
import OrderComments from '../OrderDetails/OrderComments.vue'
import OrderAssignments from '../OrderDetails/OrderAssignments.vue'
import OrderTimeline from '../OrderDetails/OrderTimeline.vue'
import ConfirmationModal from '../../ui/ConfirmationModal.vue'

interface Props {
  orderId?: number | null
  errorMsg?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  updated: []
}>()

const { t } = useI18n()

// Используем composable для всей логики заказа
const {
  // Состояние
  loading,
  order,
  project,
  comments,
  statusLogs,
  assignments,
  availableUsers,
  roles,
  stages,
  stagesWithRoles,
  showCancelForm,
  cancelReason,
  cancelReasonStatus,
  highlightAssignments,
  isPollingActive,
  lastPollingUpdate,
  completedStages,
  
  // Функции
  fetchAll,
  forceRefresh,
  addComment,
  deleteComment,
  assignUser,
  updateAssignmentStatus,
  deleteAssignment,
  changeStatus,
  updateOrderField,
  startCancelFlow,
  cancelCancel,
  confirmCancel: confirmCancelBase,
  handleStageClick: handleStageClickBase,
  deleteOrderHandler: deleteOrderHandlerBase,
  getCurrentStage,
  getStatusText,
  getStageColor,
  getStageStyle,
} = useOrderDetails(props.orderId)

// Обработчики событий
function handleStageClick(stageValue: string) {
  // Сотрудники не могут менять стадии заказов
  if (!canViewAllOrders()) {
    return
  }
  
  if (stageValue === 'cancelled') {
    startCancelFlow()
  } else {
    changeStatus(stageValue)
  }
}

async function confirmCancel(reason: string, reasonStatus: string) {
  if (!order.value) return
  
  try {
    // Обновляем локальное состояние
    cancelReason.value = reason
    cancelReasonStatus.value = reasonStatus
    
    // Вызываем базовую функцию
    await confirmCancelBase()
    
    emit('updated')
  } catch (error) {
    // Игнорируем ошибку
  }
}

const showDeleteConfirm = ref(false)

async function confirmDeleteOrder() {
  showDeleteConfirm.value = false
  try {
    await deleteOrderHandlerBase()
    emit('close')
    emit('updated')
  } catch (error) {
  }
}

function onOverlayClick() {
  emit('close')
}

// Дебаунсинг для handleGlobalUpdate чтобы избежать множественных обновлений
let globalUpdateTimeout: ReturnType<typeof setTimeout> | null = null

// Обработчик глобальных событий обновления
function handleGlobalUpdate(event: CustomEvent) {
  if (event.detail?.orderId === props.orderId) {
    // Дебаунсинг: обновляем только через 500ms после последнего события
    if (globalUpdateTimeout) {
      clearTimeout(globalUpdateTimeout)
    }
    
    globalUpdateTimeout = setTimeout(() => {
      forceRefresh()
      globalUpdateTimeout = null
    }, 500)
  }
}

// Слушаем глобальные события обновления
onMounted(async () => {
  window.addEventListener('order-updated', handleGlobalUpdate as EventListener)
  
  // Принудительно обновляем список пользователей при открытии модального окна
  // Это гарантирует, что новые сотрудники будут доступны в селекторе
  try {
    // Используем уже существующий composable
    await forceRefresh()
  } catch (error) {
    // Игнорируем ошибку, если пользователи не загрузились
  }
})

onUnmounted(() => {
  window.removeEventListener('order-updated', handleGlobalUpdate as EventListener)
})

defineOptions({
  name: 'OrderDetailsModal'
})
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-to,
.modal-fade-leave-from {
  opacity: 1;
}

.modal-scale-enter-active,
.modal-scale-leave-active {
  transition:
    opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-scale-enter-from,
.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.97);
}

.modal-scale-enter-to,
.modal-scale-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
