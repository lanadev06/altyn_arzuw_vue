<template>
  <div class="project-list flex flex-col h-full">
    <div class="flex justify-end items-center mb-3">
      <UIButton v-if="canCreateEdit()" @click="showCreateModal = true" variant="primary"
        >Добавить проект</UIButton
      >
    </div>

    <div class="flex-1 flex flex-col min-h-0">
      <div class="flex items-center justify-between py-2 px-4 bg-white border-b mb-2">
        <div class="flex items-center gap-6 text-gray-700 text-base font-medium">
          <div class="flex items-center gap-1">
            <span class="text-gray-500 font-semibold">Всего:</span>
            <span class="text-blue-600 font-bold">{{ pagination?.total || 0 }}</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="text-gray-500 font-semibold">Страницы:</span>
            <span class="text-blue-600 font-bold">{{ pagination?.last_page || 1 }}</span>
          </div>
        </div>
        <div
          class="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1 shadow-sm border border-gray-200"
        >
          <span class="text-gray-600 font-semibold">На странице:</span>
          <select
            v-model.number="perPage"
            @change="changePerPage"
            class="bg-white border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-900 font-semibold"
          >
            <option v-for="n in [10, 20, 50, 100, 200, 500]" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
      </div>
      <div class="bg-white border border-gray-200">
        <table class="w-full border-collapse border-gray-300 text-gray-900 text-base">
          <thead class="bg-gray-50 text-gray-900 font-medium">
            <tr ref="columnsHeader">
              <th
                class="border border-gray-200 px-3 py-2 text-center no-drag"
                style="width: 50px"
              >
                <input
                  type="checkbox"
                  v-model="selectAll"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  @click.stop
                />
              </th>
              <th
                v-for="col in columns"
                :key="col.key"
                @click="col.sortable ? setSort(col.key, props.search) : null"
                :class="[
                  'border border-gray-200 px-3 py-2 cursor-pointer hover:bg-gray-100 text-left whitespace-nowrap',
                  col.sortable ? 'select-none' : '',
                  col.key === 'created_at' ? 'w-[170px]' : '',
                ]"
              >
                <div class="flex items-center justify-between">
                  <span>{{ col.label }}</span>
                  <span v-if="col.sortable && sortBy === col.key" class="ml-1 text-blue-600">
                    {{ sortOrder === 'asc' ? '↑' : '↓' }}
                  </span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(project, index) in pagination.data"
              :key="project.id"
              :class="[
                'cursor-pointer border-b border-gray-100',
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                'hover:bg-blue-50 transition-colors',
              ]"
              style="height: 44px"
              @click="openProjectDetails(project)"
            >
              <td
                class="border-r border-gray-200 px-3 py-2 text-center align-middle"
              >
                <input
                  type="checkbox"
                  :value="project.id"
                  v-model="selectedIds"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  @click.stop
                />
              </td>
              <td v-for="(col, colIndex) in columns" :key="`${project.id}-${col.key}-${colIndex}`"
                  :class="[
                    'border-r border-gray-200 px-3 py-2 text-base whitespace-nowrap align-middle',
                    col.key === 'client' ? 'max-w-[220px]' : '',
                  ]"
                >
                  <template v-if="col.key === 'id'">
                    <span class="font-mono text-gray-600">{{ project.id }}</span>
                  </template>
                  <template v-else-if="col.key === 'title'">
                    <span class="font-medium text-gray-900">{{ project.title }}</span>
                  </template>
                  <template v-else-if="col.key === 'client'">
                    <span class="text-gray-700 block truncate">
                      {{
                        getClientNameById(project.orders?.[0]?.client_id) ||
                        (project.client
                          ? `${project.client.name}${project.client.company_name ? ` (${project.client.company_name})` : ''}`
                          : '-')
                      }}
                    </span>
                  </template>
                  <template v-else-if="col.key === 'deadline'">
                    <span class="text-gray-700">{{ formatDate(project.deadline) }}</span>
                  </template>
                  <template v-else-if="col.key === 'total_price'">
                    <span class="text-blue-500 font-semibold">
                      {{ project.total_price ?? '-' }} <span class="text-sm">TMT</span>
                    </span>
                  </template>
                  <template v-else-if="col.key === 'payment_amount'">
                    <span :class="getPaymentClass(project)">
                      {{ project.payment_amount ?? '-' }} <span class="text-sm">TMT</span>
                    </span>
                  </template>
                  <template v-else-if="col.key === 'created_at'">
                    <span class="text-gray-600">{{ formatDate(project.created_at) }}</span>
                  </template>
                  <template v-else>
                    {{ (project as Record<string, any>)[col.key] }}
                  </template>
                </td>
            </tr>

            <tr v-if="loading">
              <td :colspan="columns.length + 1" class="px-3 py-8 text-center text-gray-500">
                Загрузка проектов...
              </td>
            </tr>
            <tr v-if="error">
              <td :colspan="columns.length + 1" class="px-3 py-8 text-center text-red-500">
                {{ error }}
              </td>
            </tr>
            <tr v-if="!loading && !error && pagination.data.length === 0">
              <td :colspan="columns.length + 1" class="px-3 py-8 text-center text-gray-500">
                {{ props.search ? 'Проекты не найдены' : 'Проекты отсутствуют' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-if="!loading && !error && pagination.total > 0"
        :current-page="pagination.current_page"
        :last-page="pagination.last_page"
        @go-to-page="goToPage"
        class="mt-1 shrink-0"
      />
    </div>

    <ProjectFormModal
      v-if="showCreateModal"
      :project="null"
      @close="showCreateModal = false"
      @submit="handleCreateProject"
    />

    <ProjectDetailsModal
      v-if="showDetailsModal && selectedProject"
      :project="getSelectedProject()"
      :orders="selectedProjectOrders"
      :comments="selectedProjectComments"
      :assignments="selectedProjectAssignments"
      @close="closeProjectDetails"
      @update-project="onUpdateProject"
      @add-comment="onAddComment"
      @edit-comment="onEditComment"
      @open-order="onOpenOrder"
      @order-created="onOrderCreated"
      @delete-comment="onDeleteComment"
      @detach-order="handleDetachOrder"
      @attach-order="handleAttachOrder"
      @create-and-attach-order="handleCreateAndAttachOrder"
    />

    <OrderDetailsModal v-if="showOrderModal" :order-id="selectedOrderId" @close="closeOrderModal" />
    
    <!-- Модалка создания заказа для проекта -->
    <OrderFormModal
      v-if="showOrderFormModal && selectedProject?.id"
      :key="selectedProject.id"
      :project-id="selectedProject.id"
      @close="handleCloseOrderForm"
      @submit="handleOrderFormSubmit"
    />

    <BulkActionPanel
      :show="hasSelection"
      :count="selectedCount"
      :is-processing="isProcessing"
      @clear="clearSelection"
      @delete="handleBulkDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick, computed } from 'vue'
import Sortable from 'sortablejs'
import UIButton from '@/components/ui/UIButton.vue'
import Pagination from '@/components/users/UserList/Pagination.vue'
import { API_CONFIG } from '@/config/api'
import ProjectFormModal from './ProjectFormModal.vue'
import ProjectDetailsModal from './ProjectDetailsModal.vue'
import OrderDetailsModal from '@/components/orders/OrderList/OrderDetailsModal.vue'
import OrderFormModal from '@/components/orders/OrderList/OrderFormModal.vue'
import projectController from '@/controllers/projectControllerInstance'
import type { Project } from '@/types/project'
import { canCreateEdit, canViewPrices } from '@/utils/permissions'
import { useToast } from '@/stores/toast'
import { useBulkActions } from '../../../composables/useBulkActions'
import BulkActionPanel from '../../ui/BulkActionPanel.vue'

const props = defineProps({
  search: { type: String, default: '' },
})

const toast = useToast()

const {
  projects,
  pagination,
  loading,
  error,
  fetchProjects,
  sortBy,
  sortOrder,
  create,
  update,
  remove,
} = projectController

const defaultColumns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'title', label: 'Название', sortable: true },
  { key: 'client', label: 'Клиент', sortable: false },
  { key: 'deadline', label: 'Дедлайн', sortable: true },
]
if (canViewPrices()) {
  defaultColumns.push({ key: 'total_price', label: 'Сумма', sortable: true })
  defaultColumns.push({ key: 'payment_amount', label: 'Оплачено', sortable: true })
}
defaultColumns.push({ key: 'created_at', label: 'Создано', sortable: true })

const SORT_KEY = 'projectList_sortBy'
const ORDER_KEY = 'projectList_sortOrder'
const COLUMNS_KEY = 'projectList_columns'

const savedSortBy = localStorage.getItem(SORT_KEY)
const savedSortOrder = localStorage.getItem(ORDER_KEY)
const savedColumns = localStorage.getItem(COLUMNS_KEY)
const savedPerPage = localStorage.getItem('projectList_perPage')

const columns = ref(savedColumns ? JSON.parse(savedColumns) : defaultColumns)

if (savedSortBy && sortBy.value !== savedSortBy) sortBy.value = savedSortBy
if (savedSortOrder && sortOrder.value !== savedSortOrder) sortOrder.value = savedSortOrder as 'asc' | 'desc'

const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingProject = ref<Project | null>(null)
// Сохраняем текущую страницу в localStorage
const savedCurrentPage = localStorage.getItem('projectList_currentPage')
const currentPage = ref(savedCurrentPage ? parseInt(savedCurrentPage) : 1)
const columnsHeader = ref<HTMLElement | null>(null)

const showDetailsModal = ref(false)
function getSelectedProject(): any {
  return selectedProject.value
}

const selectedProject = ref<Project | null>(null)
const selectedProjectOrders = ref<any[]>([])
const selectedProjectComments = ref<any[]>([])
const selectedProjectAssignments = ref([])

const showOrderModal = ref(false)
const selectedOrderId = ref<number | null>(null)

const showOrderFormModal = ref(false)

const allClients = ref<any[]>([])

// Bulk actions - используем computed для создания реактивного источника
const projectsList = computed(() => pagination.data || [])
const {
  selectedIds,
  isProcessing,
  selectAll,
  hasSelection,
  selectedCount,
  clearSelection,
  bulkDelete
} = useBulkActions(projectsList as any)

function setSort(key: string, search = '') {
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = key
    sortOrder.value = 'asc'
  }
  localStorage.setItem(SORT_KEY, sortBy.value)
  localStorage.setItem(ORDER_KEY, sortOrder.value)
  // При изменении сортировки остаемся на той же странице
  fetchProjects(currentPage.value, search, sortBy.value, sortOrder.value, perPage.value)
}

function goToPage(page: number) {
  if (page < 1 || page > pagination.last_page) return
  // Обновляем текущую страницу и сохраняем в localStorage
  currentPage.value = page
  localStorage.setItem('projectList_currentPage', page.toString())
  fetchProjects(page, props.search, sortBy.value, sortOrder.value, perPage.value)
}

function editProject(project: Project) {
  editingProject.value = project
  showEditModal.value = true
}

async function handleCreateProject(newProject: Project) {
  await create(newProject)
  showCreateModal.value = false
  currentPage.value = 1
}

async function handleUpdateProject(updatedProject: Project) {
  await update(updatedProject.id, updatedProject)
  showEditModal.value = false
  fetchProjects(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value)
}

async function handleDeleteProject(projectId: number) {
  try {
    await remove(projectId)
    showEditModal.value = false
    editingProject.value = null
    if (pagination?.data?.length === 1 && currentPage.value > 1) {
      currentPage.value--
    }
    await fetchProjects(
      currentPage.value,
      props.search,
      sortBy.value,
      sortOrder.value,
      perPage.value,
    )
  } catch (err: any) {
    // Показываем ошибку пользователю
    if (err instanceof Error) {
      toast.show(`Ошибка удаления проекта: ${err.message}`, 'error')
    } else {
      toast.show('Произошла неизвестная ошибка при удалении проекта', 'error')
    }
  }
}

function formatDate(date: string | null | undefined) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getPaymentClass(project: Project) {
  if (project.total_price == null || project.payment_amount == null) return 'text-gray-400'
  const percent = project.payment_amount / project.total_price
  if (percent < 0.5) return 'text-red-600 font-semibold'
  if (percent < 0.9) return 'text-orange-500 font-semibold'
  return 'text-green-600 font-semibold'
}

async function openProjectDetails(project: Project) {
  const res = await fetch(`${API_CONFIG.BASE_URL}/projects/${project.id}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  const freshProject = await res.json()
  selectedProject.value = freshProject
  selectedProjectOrders.value = freshProject.orders || []
  selectedProjectComments.value = await getProjectComments(project.id)

  const assignRes = await fetch('/api/assignments', {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  const json = assignRes.ok ? await assignRes.json() : { data: [] }
  const allAssignments = Array.isArray(json) ? json : json.data || []
  selectedProjectAssignments.value = allAssignments.filter((a: any) =>
    selectedProjectOrders.value.some((order) => order.id === a.order_id),
  )

  showDetailsModal.value = true
}
function closeProjectDetails() {
  showDetailsModal.value = false
  selectedProject.value = null
}

function handleCloseOrderForm() {
  showOrderFormModal.value = false
  selectedProject.value = null
}
async function onUpdateProject(updatedProject: any) {
  await fetchProjects(currentPage.value, props.search, sortBy.value, sortOrder.value)
  
  // Если проект удален (updatedProject === null), закрываем модальное окно
  if (updatedProject === null) {
    closeProjectDetails()
    return
  }
  
  // Если проект обновлен, обновляем данные в модальном окне
  if (selectedProject.value && updatedProject && updatedProject.id === selectedProject.value.id) {
    selectedProject.value = { ...selectedProject.value, ...updatedProject }
  }
}
async function onAddComment(text: string) {
  if (!selectedProject.value) return
  await addProjectComment(selectedProject.value.id, text)
  selectedProjectComments.value = await getProjectComments(selectedProject.value.id)
}
async function onDeleteComment(commentId: number) {
  if (!selectedProject.value) return

  try {
    await deleteProjectComment(commentId)
    selectedProjectComments.value = await getProjectComments(selectedProject.value.id)
  } catch (error) {
  }
}
function onEditComment(payload: any) {}
function onOpenOrder(order: any) {
  selectedOrderId.value = order.id
  showOrderModal.value = true
}
function closeOrderModal() {
  showOrderModal.value = false
  selectedOrderId.value = null
}
async function onOrderCreated(order: any) {
  if (!selectedProject.value) return
  const res = await fetch(`${API_CONFIG.BASE_URL}/projects/${selectedProject.value.id}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  const freshProject = await res.json()
  selectedProject.value = freshProject
  selectedProjectOrders.value = freshProject.orders || []
}

// Обработчик отвязки заказа от проекта
async function handleDetachOrder(orderId: number) {
  // Перезагружаем проект с обновленным списком заказов
  if (selectedProject.value) {
    const res = await fetch(`${API_CONFIG.BASE_URL}/projects/${selectedProject.value.id}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    })
    const freshProject = await res.json()
    selectedProject.value = freshProject
    selectedProjectOrders.value = freshProject.orders || []
  }
}

// Обработчик привязки заказа к проекту
async function handleAttachOrder(orderId: number) {
  // Перезагружаем проект с обновленным списком заказов
  if (selectedProject.value) {
    const res = await fetch(`${API_CONFIG.BASE_URL}/projects/${selectedProject.value.id}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    })
    const freshProject = await res.json()
    selectedProject.value = freshProject
    selectedProjectOrders.value = freshProject.orders || []
  }
}

// Обработчик создания и привязки нового заказа
function handleCreateAndAttachOrder() {
  if (!selectedProject.value) return
  
  // Сохраняем ID проекта перед закрытием модалки
  const projectId = selectedProject.value.id
  
  // Закрываем модалку деталей проекта
  closeProjectDetails()
  
  // Небольшая задержка для корректного закрытия предыдущей модалки
  setTimeout(() => {
    // Открываем модалку создания заказа для этого проекта
    selectedProject.value = { id: projectId } as Project
    showOrderFormModal.value = true
  }, 100)
}

// Обработчик submit из формы создания заказа
async function handleOrderFormSubmit() {
  showOrderFormModal.value = false
  
  // После создания заказа обновляем список проектов и заказов
  if (selectedProject.value) {
    const res = await fetch(`${API_CONFIG.BASE_URL}/projects/${selectedProject.value.id}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    })
    const freshProject = await res.json()
    selectedProject.value = freshProject
    selectedProjectOrders.value = freshProject.orders || []
    
    // Открываем обратно модалку деталей проекта с обновленными данными
    openProjectDetails(freshProject)
  }
}

async function getProjectComments(projectId: number) {
  const res = await fetch(`${API_CONFIG.BASE_URL}/comments?project_id=${projectId}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  if (!res.ok) throw new Error('Ошибка загрузки комментариев')
  return await res.json()
}
async function addProjectComment(projectId: number, text: string) {
  const res = await fetch('/api/comments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
    body: JSON.stringify({ text, project_id: projectId }),
  })
  if (!res.ok) throw new Error('Ошибка при добавлении комментария')
  return await res.json()
}
async function deleteProjectComment(commentId: number) {
  const res = await fetch(`${API_CONFIG.BASE_URL}/comments/${commentId}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })

  if (!res.ok) {
    let errorMessage = 'Ошибка при удалении комментария'
    try {
      const errorData = await res.json()
      errorMessage = errorData.message || errorMessage
    } catch (e) {
    }
    throw new Error(errorMessage)
  }

  try {
    const responseData = await res.json()
    return responseData
  } catch (e) {
    return { success: true }
  }
}

function getClientNameById(clientId: number | undefined) {
  if (!clientId) return '-'
  const client = (allClients.value as any[]).find((c) => c.id === clientId)
  if (!client) return '-'
  return client.company_name ? `${client.name} (${client.company_name})` : client.name
}

watch(
  () => props.search,
  (newVal) => {
    currentPage.value = 1
    fetchProjects(1, newVal, sortBy.value, sortOrder.value, perPage.value)
  },
)

const allowedPerPage = [10, 20, 50, 100, 200, 500]
const perPage = ref(savedPerPage ? parseInt(savedPerPage) : 30)
function validatePerPage(val: any) {
  if (!allowedPerPage.includes(val)) return 30
  return val
}
function changePerPage() {
  perPage.value = validatePerPage(perPage.value)
  localStorage.setItem('projectList_perPage', perPage.value.toString())
  // При изменении количества элементов на странице возвращаемся на первую страницу
  currentPage.value = 1
  localStorage.setItem('projectList_currentPage', '1')
  goToPage(1)
}
watch(perPage, (newVal) => {
  perPage.value = validatePerPage(newVal)
  localStorage.setItem('projectList_perPage', perPage.value.toString())
  // При изменении количества элементов на странице возвращаемся на первую страницу
  currentPage.value = 1
  localStorage.setItem('projectList_currentPage', '1')
  goToPage(1)
})

async function handleBulkDelete() {
  const result = await bulkDelete('projects')
  if (result.deleted > 0) {
    await fetchProjects(currentPage.value, props.search, sortBy.value, sortOrder.value)
  }
}

onMounted(async () => {
  await nextTick()
  if (columnsHeader.value) {
    Sortable.create(columnsHeader.value, {
      animation: 150,
      direction: 'horizontal',
      filter: '.no-drag',
      onEnd(evt) {
        const oldIndex = evt.oldIndex
        const newIndex = evt.newIndex
        
        // Skip if dragging checkbox column
        if (oldIndex === 0 || newIndex === 0) return
        if (oldIndex === undefined || newIndex === undefined) return
        
        // Adjust indices because checkbox column is at index 0
        const adjustedOldIndex = oldIndex - 1
        const adjustedNewIndex = newIndex - 1
        
        const newColumns = [...columns.value]
        const moved = newColumns.splice(adjustedOldIndex, 1)[0]
        newColumns.splice(adjustedNewIndex, 0, moved)
        columns.value = newColumns
        localStorage.setItem(COLUMNS_KEY, JSON.stringify(columns.value))
      },
    })
  }
  fetchProjects(currentPage.value, props.search, sortBy.value, sortOrder.value, perPage.value)
  try {
    const res = await fetch('/api/clients/all', {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    })
    const data = await res.json()
    allClients.value = Array.isArray(data) ? data : ([] as any[])
  } catch (e) {
    allClients.value = []
  }
})


defineOptions({
  name: 'ProjectList'
})
</script>
