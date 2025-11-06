<template>
  <div>
    <!-- Основная модалка проекта -->
    <transition name="modal-fade">
      <div
        class="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center"
        v-if="props.project"
        @click="onOverlayClick"
      >
        <transition name="modal-scale">
          <div
            class="relative w-[1100px] max-w-[98vw] h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            @click.stop
          >
          <button
            @click="emit('close')"
            class="absolute top-6 right-6 text-3xl text-gray-400 hover:text-red-500 transition font-bold z-10"
          >
            ✕
          </button>
          

          <div class="flex-1 flex flex-row h-full min-h-0">
            <!-- Левая часть: детали проекта -->
            <div
              class="w-1/2 bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-50 p-10 flex flex-col gap-8 border-r border-gray-200 min-w-[340px] overflow-y-auto"
            >
              <div>
                <div class="flex items-center gap-4 mb-2">
                  <div class="text-3xl font-extrabold text-gray-900 tracking-tight">
                    {{ t('projects.details.projectTitle') }}{{ props.project?.id }}
                  </div>
                  <span
                    v-if="props.project"
                    :class="[
                      'inline-block px-4 py-1 rounded-full text-base font-bold shadow',
                      statusBadge(props.project.status || ''),
                    ]"
                  >
                    {{ getStatusText(props.project.status || '') }}
                  </span>
                </div>
                <div class="text-lg text-gray-500 font-medium mb-6">
                  {{ props.project?.title || '' }}
                </div>
                <div
                  class="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-blue-100 flex flex-col gap-4"
                >
                  <div
                    class="text-2xl font-extrabold text-blue-900 mb-2 flex items-center gap-2 group"
                  >
                    <svg
                      class="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      ></path>
                    </svg>
                    {{ t('projects.details.projectDetails') }}
                  </div>
                  <div class="flex flex-col gap-2">
                    <div
                      class="grid grid-cols-[140px_1fr_40px] items-center gap-x-2 text-base text-gray-800"
                    >
                      <span class="font-semibold">{{ t('projects.details.title') }}</span>
                      <EditableField
                        v-if="props.project"
                        :model-value="props.project.title ?? ''"
                        type="text"
                        :required="true"
                        @save="(val) => updateProjectField('title', val)"
                        class="w-64"
                      />
                      <span></span>
                    </div>
                    <div
                      class="grid grid-cols-[140px_1fr_40px] items-center gap-x-2 text-base text-gray-800"
                    >
                      <span class="font-semibold">{{ t('projects.details.client') }}</span>
                      <span class="text-gray-700 block truncate">
                        {{
                          getClientNameById(props.project.orders?.[0]?.client_id) ||
                          (props.project?.client
                            ? `${props.project.client.name}${props.project.client.company_name ? ` (${props.project.client.company_name})` : ''}`
                            : '-')
                        }}
                      </span>
                      <span></span>
                    </div>
                    <div
                      class="grid grid-cols-[140px_1fr_40px] items-center gap-x-2 text-base text-gray-800"
                    >
                      <span class="font-semibold">{{ t('projects.details.deadline') }}</span>
                      <div>
                        <div v-if="!showDeadlineInput" class="flex items-center group">
                          <span>{{
                            formatDateTime(
                              props.project?.deadline ? String(props.project.deadline) : '',
                            )
                          }}</span>
                          <button
                            @click="startDeadlineEdit"
                            class="ml-2 p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                            :title="t('projects.details.editDeadline')"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              class="h-4 w-4 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4 1a1 1 0 01-1.263-1.263l1-4a4 4 0 01.828-1.414z"
                              />
                            </svg>
                          </button>
                        </div>
                        <div v-if="showDeadlineInput" class="flex items-center gap-2 mt-1">
                          <flatPickr
                            v-model="tempDeadline"
                            :config="{
                              dateFormat: 'Y-m-d H:i',
                              altInput: true,
                              altFormat: 'd F Y H:i',
                              enableTime: true,
                              time_24hr: true,
                              allowInput: true,
                              clickOpens: true,
                              locale: Russian,
                            }"
                            class="w-48 text-gray-900 text-base p-2 border border-gray-300 rounded-md flatpickr-uiinput focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white"
                          />
                          <button
                            @click="confirmDeadline"
                            class="p-1 rounded hover:bg-green-100 text-green-500"
                            :title="t('projects.details.confirm')"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              class="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                          <button
                            @click="cancelDeadline"
                            class="p-1 rounded hover:bg-red-100 text-red-500"
                            :title="t('projects.details.cancel')"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              class="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <span></span>
                    </div>
                    <div
                      v-if="canViewPrices()"
                      class="grid grid-cols-[140px_1fr_40px] items-center gap-x-2 text-base text-gray-800"
                    >
                      <span class="font-semibold">{{ t('projects.details.totalPrice') }}</span>
                      <EditableField
                        v-if="props.project"
                        :model-value="props.project.total_price ?? 0"
                        type="number"
                        :min="0"
                        @save="(val) => updateProjectField('total_price', val)"
                        class="w-32"
                      />
                      <span class="ml-1">TMT</span>
                    </div>
                    <div
                      v-if="canViewPrices()"
                      class="grid grid-cols-[140px_1fr_40px] items-center gap-x-2 text-base text-gray-800"
                    >
                      <span class="font-semibold">{{ t('projects.details.paymentAmount') }}</span>
                      <EditableField
                        v-if="props.project"
                        :model-value="props.project.payment_amount ?? 0"
                        type="number"
                        :min="0"
                        @save="(val) => updateProjectField('payment_amount', val)"
                        class="w-32"
                      />
                      <span class="ml-1">TMT</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Связанные заказы -->
              <div
                class="bg-white border border-blue-100 rounded-2xl shadow-lg p-6 mb-4 flex flex-col gap-4"
              >
                <div class="mb-4">
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex-1">
                      <div
                        class="text-2xl font-extrabold text-blue-900 flex items-center gap-2"
                      >
                        <svg
                          class="w-6 h-6 text-orange-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                          ></path>
                        </svg>
                        {{ t('projects.details.relatedOrders') }}
                      </div>
                      <!-- Чекбокс "Выбрать всё" -->
                      <div v-if="canCreateEdit() && orders.length > 0" class="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          :checked="selectedOrdersForDetach.length === orders.length && orders.length > 0"
                          @change="toggleSelectAllOrders"
                          class="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                        />
                        <span class="text-sm text-gray-600 cursor-pointer" @click="toggleSelectAllOrders">{{ t('projects.details.selectAll') }}</span>
                      </div>
                    </div>
                    <div v-if="canCreateEdit()" class="flex gap-2">
                      <button
                        @click="showAttachExistingModal = true"
                        class="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                      >
                        + {{ t('projects.details.add') }}
                      </button>
                      <button
                        @click="emit('create-and-attach-order')"
                        class="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition"
                      >
                        + {{ t('projects.details.create') }}
                      </button>
                    </div>
                  </div>
                  
                  <!-- Информация о выбранных заказах для отвязки -->
                  <div v-if="selectedOrdersForDetach.length > 0" class="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium text-red-800">
                        {{ t('projects.details.selectedForDetach') }} {{ selectedOrdersForDetach.length }}
                      </span>
                      <div class="flex gap-2">
                        <button
                          @click="detachSelectedOrders"
                          class="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition"
                        >
                          {{ t('projects.details.detachAll') }}
                        </button>
                        <button
                          @click="clearDetachSelection"
                          class="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-300 transition"
                        >
                          {{ t('projects.details.cancel') }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="localOrders.length === 0" class="text-gray-500">{{ t('projects.details.noRelatedOrders') }}</div>
                <div v-else class="flex flex-col gap-3">
                  <div
                    v-for="order in localOrders"
                    :key="order.id"
                    :class="[
                      'rounded-xl shadow p-4 border border-blue-100 flex flex-col gap-2 transition-all duration-200',
                      order.stage ? orderStatusBadge(order.stage) : 'bg-gray-100',
                      isOrderSelectedForDetach(order.id) ? 'ring-2 ring-red-400 border-red-400' : ''
                    ]"
                  >
                    <div class="flex items-center gap-2">
                      <!-- Чекбокс для выбора -->
                      <div v-if="canCreateEdit()" class="flex-shrink-0">
                        <input
                          type="checkbox"
                          :checked="isOrderSelectedForDetach(order.id)"
                          @change="toggleOrderDetachSelection(order.id)"
                          class="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                      </div>
                      
                      <!-- Информация о заказе -->
                      <div class="flex-1">
                        <div class="flex items-center justify-between">
                          <div>
                            <span class="font-semibold text-blue-700 mr-2">{{ order.id }}</span>
                            <span
                              v-if="order.stage"
                              :class="[
                                'inline-block align-middle px-2 py-0.5 rounded-full text-xs font-semibold mr-2',
                                orderStatusBadge(order.stage),
                              ]"
                            >
                              {{ orderStatusText(order.stage) }}
                            </span>
                            <span class="text-gray-800 align-middle">{{
                              order.product?.name || '—'
                            }}</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <button
                              v-if="canCreateEdit() || isMyOrder(order)"
                              @click="openOrderDetails(order)"
                              class="text-blue-500 font-semibold hover:underline text-sm"
                            >
                              {{ t('projects.details.open') }}
                            </button>
                            <button
                              v-if="canCreateEdit()"
                              @click="detachOrder(order.id)"
                              class="text-red-500 font-semibold hover:underline text-sm"
                              :title="t('projects.details.detachOrder')"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        <div class="text-xs text-gray-400 mt-1">
                          {{ formatDateTime(order.created_at ? String(order.created_at) : '') }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- Правая часть: комментарии -->
            <div class="w-1/2 flex flex-col gap-4 p-10 bg-[#f8fafc] min-w-[340px] overflow-y-auto">
              <!-- Комментарии -->
              <div
                class="bg-white rounded-xl shadow p-6 mb-4 border border-blue-100 flex flex-col mt-8"
              >
                <div
                  class="text-2xl font-extrabold text-blue-900 mb-2 flex items-center gap-2 group"
                >
                  <svg
                    class="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    ></path>
                  </svg>
                  {{ t('projects.details.comments') }}
                </div>
                <div>
                  <ul class="space-y-3">
                    <li
                      v-for="comment in comments"
                      :key="comment.id"
                      class="flex gap-3 items-start group relative"
                    >
                      <div class="w-8 h-8 rounded-full overflow-hidden shadow">
                        <img
                          v-if="comment.user?.name && userImageUrls[comment.user.name]"
                          :src="comment.user?.name ? userImageUrls[comment.user.name] : ''"
                          :alt="comment.user?.name"
                          class="w-8 h-8 rounded-full object-cover"
                        />
                        <div
                          v-else
                          class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-extrabold text-base"
                        >
                          {{ comment.user?.name ? comment.user.name[0] : '?' }}
                        </div>
                      </div>
                      <div
                        class="bg-white rounded-xl p-3 flex-1 shadow-sm border border-blue-100 relative"
                      >
                        <button
                          @click="$emit('delete-comment', comment.id)"
                          :title="t('projects.details.delete')"
                          class="absolute top-8 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-400"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 20 20"
                            class="w-4 h-4"
                          >
                            <path
                              stroke="currentColor"
                              stroke-width="1.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M7.5 9v3.5m5-3.5V12.5M4.5 6.5h11M8.5 4.5h3a1 1 0 0 1 1 1v1h-5v-1a1 1 0 0 1 1-1Zm-3 2v9a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-9"
                            />
                          </svg>
                        </button>
                        <div class="flex items-center gap-2 mb-0.5">
                          <span class="font-bold text-sm text-gray-900">{{
                            comment.user?.name
                          }}</span>
                          <span v-if="comment.user?.roles && comment.user.roles.length">
                            <span
                              v-for="(role, index) in comment.user.roles"
                              :key="index"
                              class="text-[10px] rounded px-2 py-0.5 font-semibold mr-1"
                              :class="
                                getRoleBadgeClass(
                                  typeof role === 'string' ? role : (role as any)?.name || '',
                                )
                              "
                            >
                              {{
                                getRoleLabel(
                                  typeof role === 'string'
                                    ? role
                                    : (role as any)?.name || '',
                                )
                              }}
                            </span>
                          </span>
                          <span v-else>
                            <span
                              class="text-[10px] rounded px-2 py-0.5 font-semibold"
                              :class="getRoleBadgeClass(comment.user?.role || '')"
                            >
                              {{ getRoleLabel(comment.user?.role || '') }}
                            </span>
                          </span>
                          <span class="text-[10px] text-gray-400 ml-auto">{{
                            formatDateTime(comment.created_at ? String(comment.created_at) : '')
                          }}</span>
                        </div>
                        <div class="text-sm text-gray-700 leading-snug">{{ comment.text }}</div>
                      </div>
                    </li>
                  </ul>
                </div>
                <!-- Минималистичная форма комментария -->
                <div
                  class="bg-white rounded-xl shadow border border-blue-200 p-3 flex flex-col gap-2 mt-2"
                >
                  <input
                    v-model="newComment"
                    @focus="commentFocused = true"
                    @blur="onCommentBlur"
                    @keydown.enter.prevent="addComment"
                    type="text"
                    class="w-full border-none outline-none text-base text-gray-800 bg-transparent px-2 py-2"
                    :placeholder="t('projects.details.addComment')"
                  />
                  <div
                    v-if="commentFocused || newComment.trim()"
                    class="flex gap-2 mt-1 justify-end"
                  >
                    <button
                      @click="addComment"
                      type="button"
                      class="rounded-full bg-blue-300 hover:bg-blue-400 text-white text-xs font-bold px-4 py-1 shadow transition-colors duration-200 uppercase"
                    >
                      {{ t('projects.details.send') }}
                    </button>
                    <button
                      @click="cancelComment"
                      type="button"
                      class="rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold px-4 py-1 shadow transition-colors duration-200 uppercase"
                    >
                      {{ t('projects.details.cancelUppercase') }}
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Кнопка удаления проекта -->
              <div v-if="canDelete()" class="mt-4 flex justify-end">
                <button
                  @click="deleteProjectHandler"
                  class="w-8 h-8 bg-gray-200 hover:bg-red-500 text-gray-500 hover:text-white rounded-full flex items-center justify-center transition-colors duration-200"
                  :title="t('projects.details.deleteProject')"
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
    
    <!-- Модалка для добавления существующего заказа -->
    <!-- Используем key для пересоздания модалки при каждом открытии -->
    <AttachOrderModal
      v-if="showAttachExistingModal && props.project"
      :key="`attach-modal-${props.project.id}-${showAttachExistingModal}`"
      :project-id="props.project.id"
      @close="showAttachExistingModal = false"
      @attach="handleAttachOrder"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import EditableField from '@/components/ui/EditableField.vue'
import Vue3Select from 'vue3-select'
import flatPickr from 'vue-flatpickr-component'
import { API_CONFIG } from '@/config/api'
import 'flatpickr/dist/flatpickr.css'
import { Russian } from 'flatpickr/dist/l10n/ru.js'
import { canCreateEdit, canViewPrices, getCurrentUser, canDelete } from '@/utils/permissions'
import { deleteProject } from '@/services/api'
import { toast } from '@/stores/toast'
import AttachOrderModal from './AttachOrderModal.vue'

const { t } = useI18n()

interface Client {
  id: number
  name: string
  company_name?: string // Added company_name to Client interface
}
interface Project {
  id: number
  title: string
  client: Client | null
  deadline: string | null
  budget: number | null
  total_price?: number | null
  payment_amount?: number | null
  status?: string
  orders?: { client_id?: number }[]
}
interface Order {
  id: number
  product?: { name: string }
  created_at?: string
  stage?: string
  client?: { name: string } // Added client property to Order interface
}
interface Comment {
  id: number
  text: string
  user?: { name: string; role?: string; roles?: string[] } // Added roles to Comment interface
  created_at: string
}

const emit = defineEmits([
  'close',
  'update-project',
  'add-comment',
  'edit-comment',
  'delete-comment',
  'open-order',
  'detach-order',
  'attach-order',
  'create-and-attach-order',
])

function getClientId(client: any): number | undefined {
  return (client as any)?.id
}

function getUserImageUrlLocal(user: any): string | undefined {
  return (user as any)?.image_url
}

const props = defineProps<{
  project: Project
  orders: Order[]
  comments: Comment[]
  assignments: { order_id: number; user_id: number }[]
}>()

// Локальное состояние для списка заказов (для реактивного обновления)
const localOrders = ref<Order[]>(props.orders)

// Обновляем локальный список при изменении props
watch(() => props.orders, (newOrders) => {
  localOrders.value = newOrders
}, { deep: true, immediate: true })

const newComment = ref('')
const commentFocused = ref(false)

const allClients = ref<Client[]>([])
const selectedClientId = ref<number | null>(null)
const tempDeadline = ref<string | null>(null)
const showClientSelect = ref(false)
const showDeadlineInput = ref(false)
const showAttachExistingModal = ref(false)
const selectedOrdersForDetach = ref<number[]>([])

// Прокси для v-model, чтобы не было null
const selectedClientIdProxy = computed({
  get: () => selectedClientId.value ?? '',
  set: (val: string | number) => {
    selectedClientId.value = typeof val === 'string' ? (val ? Number(val) : null) : val
  },
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const clientIdReduce = (client: any) => client.id

onMounted(async () => {
  // Загрузить всех клиентов для селекта
  const res = await fetch('/api/clients/all', {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  const data = await res.json()
  allClients.value = Array.isArray(data) ? data : []
  if (props.project?.client?.id) selectedClientId.value = props.project.client.id
  if (props.project?.deadline) tempDeadline.value = props.project.deadline
})

watch(
  () => props.project,
  (newProject) => {
    if (newProject?.client?.id) selectedClientId.value = newProject.client.id
    if (newProject?.deadline) tempDeadline.value = newProject.deadline
  },
  { immediate: true },
)

function onOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}

// Функция удаления проекта
async function deleteProjectHandler() {
  if (!props.project) return
  
  try {
    await deleteProject(props.project.id)
    
    toast.show(t('projects.details.projectDeleted'), 'success')
    emit('close')
    emit('update-project', null) // Уведомляем родительский компонент об удалении
  } catch (error) {
    toast.show(t('projects.details.deleteError'), 'error')
  }
}

type ProjectField = keyof Project | 'client_id' | 'total_price' | 'payment_amount'
async function updateProjectField(field: ProjectField, value: any) {
  if (!props.project) return
  // PATCH-запрос на /api/projects/{id}
  const payload: Record<string, unknown> = {}
  payload[field] = value
  
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}/projects/${props.project.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify(payload),
    })
    
    if (res.ok) {
      // Update local project data immediately
      if (props.project) {
        (props.project as any)[field] = value
      }
      
      // Emit update to parent component
      emit('update-project', props.project)
    } else {
      toast.show(t('projects.details.updateError'), 'error')
    }
  } catch (error) {
    toast.show(t('projects.details.updateError'), 'error')
  }
}

function formatDateTime(date: string | null | undefined) {
  if (!date) return '-'
  const d = new Date(String(date))
  return d.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function addComment() {
  if (!newComment.value.trim()) return
  emit('add-comment', newComment.value)
  newComment.value = ''
  commentFocused.value = false
}

function onCommentBlur() {
  setTimeout(() => {
    if (!newComment.value.trim()) commentFocused.value = false
  }, 100)
}
function cancelComment() {
  newComment.value = ''
  commentFocused.value = false
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    active: t('projects.details.status.active'),
    completed: t('projects.details.status.completed'),
    paused: t('projects.details.status.paused'),
    cancelled: t('projects.details.status.cancelled'),
  }
  return map[status] || status
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    paused: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

function startDeadlineEdit() {
  if (!props.project) return
  tempDeadline.value = props.project.deadline || ''
  showDeadlineInput.value = true
}
async function confirmDeadline() {
  await updateProjectField('deadline', tempDeadline.value)
  showDeadlineInput.value = false
}
function cancelDeadline() {
  showDeadlineInput.value = false
  tempDeadline.value = props.project.deadline || null
}
async function confirmClient() {
  if (selectedClientId.value !== null && selectedClientId.value !== undefined) {
    await updateProjectField('client_id', selectedClientId.value)
  }
  showClientSelect.value = false
}
function cancelClient() {
  showClientSelect.value = false
  selectedClientId.value = props.project?.client?.id || null
}

function orderStatusBadge(status: string) {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-700'
    case 'design':
      return 'bg-blue-100 text-blue-700'
    case 'print':
      return 'bg-yellow-100 text-yellow-700'
    case 'engraving':
      return 'bg-orange-100 text-orange-700'
    case 'workshop':
      return 'bg-purple-100 text-purple-700'
    case 'final':
      return 'bg-green-100 text-green-700'
    case 'completed':
      return 'bg-emerald-200 text-emerald-800'
    case 'cancelled':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}
function orderStatusText(status: string) {
  // Используем переводы из i18n для статусов заказов
  return t(`status.${status}`) || status
}

// Проверяем, является ли заказ заказом текущего пользователя
function isMyOrder(order: Order): boolean {
  const currentUser = getCurrentUser()
  if (!currentUser) return false
  if (!props.assignments) return false
  return props.assignments.some((a) => a.order_id === order.id && a.user_id === currentUser.id)
}

// Открываем заказ в новой модалке
function openOrderDetails(order: Order) {
  emit('open-order', order)
}

// Функции для работы с множественной отвязкой
function toggleOrderDetachSelection(orderId: number) {
  const index = selectedOrdersForDetach.value.indexOf(orderId)
  if (index > -1) {
    selectedOrdersForDetach.value.splice(index, 1)
  } else {
    selectedOrdersForDetach.value.push(orderId)
  }
}

function isOrderSelectedForDetach(orderId: number): boolean {
  return selectedOrdersForDetach.value.includes(orderId)
}

function clearDetachSelection() {
  selectedOrdersForDetach.value = []
}

function toggleSelectAllOrders() {
  if (selectedOrdersForDetach.value.length === localOrders.value.length) {
    // Если все выбраны - снять выбор
    selectedOrdersForDetach.value = []
  } else {
    // Выбрать все
    selectedOrdersForDetach.value = localOrders.value.map(order => order.id)
  }
}

// Отвязываем несколько заказов одновременно (используем batch endpoint)
async function detachSelectedOrders() {
  if (selectedOrdersForDetach.value.length === 0) return
  
  try {
    // Используем batch endpoint для массовой отвязки
    const response = await fetch(`${API_CONFIG.BASE_URL}/orders/bulk-detach-from-project`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify({ 
        order_ids: selectedOrdersForDetach.value 
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      
      // Отправляем события для каждого отвязанного заказа
      selectedOrdersForDetach.value.forEach((orderId) => {
        emit('detach-order', orderId)
        window.dispatchEvent(new CustomEvent('order-updated', {
          detail: { orderId }
        }))
      })
      
      toast.show(
        result.message || t('projects.details.detachedOrders', { count: result.detached || selectedOrdersForDetach.value.length }), 
        'success'
      )
      
      // Показываем предупреждения, если были ошибки
      if (result.errors && result.errors.length > 0) {
        console.warn('Некоторые заказы не были отвязаны:', result.errors)
      }
      
      // Обновляем локальный список заказов - загружаем свежие данные проекта
      const projectResponse = await fetch(`${API_CONFIG.BASE_URL}/projects/${props.project.id}`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })
      
      if (projectResponse.ok) {
        const freshProject = await projectResponse.json()
        if (freshProject && freshProject.orders) {
          localOrders.value = freshProject.orders
        }
      } else {
        console.warn('Не удалось загрузить обновленный проект после массовой отвязки')
        // Все равно обновляем через родительский компонент
        // События detach-order уже отправлены выше
      }
      
      selectedOrdersForDetach.value = []
    } else {
      const errorData = await response.json().catch(() => ({ message: t('projects.details.detachOrdersError') }))
      console.error('Ошибка отвязки заказов:', response.status, errorData)
      toast.show(`${t('messages.error')}: ${errorData.message || t('projects.details.detachOrdersError')}`, 'error')
    }
  } catch (error) {
    console.error('Ошибка при отвязке заказов:', error)
    toast.show(t('projects.details.detachOrdersError'), 'error')
  }
}

// Отвязываем заказ от проекта
async function detachOrder(orderId: number) {
  
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify({ project_id: null })
    })
    
    if (response.ok) {
      toast.show(t('projects.details.orderDetached'), 'success')
      
      // Обновляем локальный список заказов - загружаем свежие данные проекта
      const projectResponse = await fetch(`${API_CONFIG.BASE_URL}/projects/${props.project.id}`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })
      
      if (projectResponse.ok) {
        const freshProject = await projectResponse.json()
        if (freshProject && freshProject.orders) {
          localOrders.value = freshProject.orders
        }
      } else {
        console.warn('Не удалось загрузить обновленный проект после отвязки заказа')
      }
      
      // Отправляем событие в родительский компонент
      // Родительский компонент обновит props.orders, что автоматически обновится через watch
      emit('detach-order', orderId)
      
      // Отправляем глобальное событие обновления заказа
      window.dispatchEvent(new CustomEvent('order-updated', {
        detail: { orderId }
      }))
    } else {
      const errorData = await response.json().catch(() => ({ message: t('projects.details.detachOrderError') }))
      console.error('Ошибка отвязки заказа:', response.status, errorData)
      toast.show(`${t('messages.error')}: ${errorData.message || t('projects.details.failedToDetach')}`, 'error')
    }
  } catch (error) {
    console.error('Ошибка при отвязке заказа:', error)
    toast.show(t('projects.details.detachOrderError'), 'error')
  }
}

// Привязываем существующий заказ к проекту
async function handleAttachOrder(orderId: number) {
  try {
    // Загружаем данные обновленного заказа
    const response = await fetch(`${API_CONFIG.BASE_URL}/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify({ project_id: props.project.id })
    })
    
    if (response.ok) {
      const updatedOrder = await response.json()
      
      toast.show(t('projects.details.orderAttached'), 'success')
      
      // Обновляем список заказов проекта - загружаем свежие данные проекта
      const projectResponse = await fetch(`${API_CONFIG.BASE_URL}/projects/${props.project.id}`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })
      
      if (projectResponse.ok) {
        const freshProject = await projectResponse.json()
        // Обновляем локальный список заказов сразу
        if (freshProject && freshProject.orders) {
          localOrders.value = freshProject.orders
        }
        // Отправляем событие в родительский компонент для обновления списка заказов
        // Родитель обновит props.orders, что автоматически обновится через watch
        emit('attach-order', orderId)
      } else {
        console.warn('Не удалось загрузить обновленный проект после привязки заказа')
        // Все равно отправляем событие, чтобы родитель обновил
        emit('attach-order', orderId)
      }
      
      // Отправляем глобальное событие обновления заказа
      window.dispatchEvent(new CustomEvent('order-updated', {
        detail: { orderId }
      }))
    } else {
      const errorData = await response.json().catch(() => ({ message: t('projects.details.attachOrderError') }))
      console.error('Ошибка добавления заказа:', errorData)
      toast.show(t('projects.details.attachOrderError'), 'error')
    }
  } catch (error) {
    console.error('Ошибка при привязке заказа:', error)
    toast.show(t('projects.details.attachOrderError'), 'error')
  }
}

// Добавляем функцию для поиска имени клиента по client_id
function getClientNameById(clientId: number | undefined) {
  if (!clientId) return '-'
  const client = allClients.value.find((c) => c.id === clientId)
  if (!client) return '-'
  return client.company_name ? `${client.name} (${client.company_name})` : client.name
}

function getRoleBadgeClass(role: string) {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800'
    case 'manager':
      return 'bg-purple-100 text-purple-800'
    case 'designer':
      return 'bg-blue-100 text-blue-800'
    case 'print_worker':
      return 'bg-yellow-100 text-yellow-800'
    case 'engraver':
      return 'bg-orange-100 text-orange-800'
    case 'workshop_worker':
      return 'bg-green-100 text-green-800'
    case 'client':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getRoleLabel(role: string) {
  if (!role) return ''
  const translationKey = `roles.${role}`
  const translation = t(translationKey)
  // Если перевод вернул сам ключ (т.е. перевод не найден), возвращаем оригинальное значение
  return translation !== translationKey ? translation : role
}

// Загружаем изображения пользователей синхронно
const userImageUrls = ref<Record<string, string>>({})
function loadUserImageUrl(user: any) {
  if (!user || !user.name) return
  if (!userImageUrls.value[user.name]) {
    // Используем image_url если есть, иначе строим путь к изображению
    if (user?.image_url) {
      userImageUrls.value[user.name] = user.image_url
    } else if (user?.image) {
      const image = user.image
      if (image.startsWith('http')) {
        userImageUrls.value[user.name] = image
      } else {
        userImageUrls.value[user.name] = `/storage/${image}`
      }
    } else {
      userImageUrls.value[user.name] = ''
    }
  }
}
watch(
  () => props.comments,
  (newComments) => {
    newComments.forEach((c) => loadUserImageUrl(c.user))
  },
  { immediate: true, deep: true },
)


defineOptions({
  name: 'ProjectDetailsModal'
})
</script>
