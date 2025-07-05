<template>
  <div class="project-list flex flex-col h-full">
    <div class="flex justify-end items-center mb-3">
      <UIButton @click="showCreateModal = true" variant="primary">Добавить проект</UIButton>
    </div>

    <div class="flex-1 flex flex-col min-h-0">
      <div class="bg-white border border-gray-200">
        <table class="w-full border-collapse border-gray-300 text-gray-900 text-base">
          <thead class="bg-gray-50 text-gray-900 font-medium">
            <tr ref="columnsHeader">
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
              @click="editProject(project)"
              style="height: 44px"
            >
              <td
                v-for="col in columns"
                :key="col.key"
                class="border-r border-gray-200 px-3 py-2 text-base whitespace-nowrap align-middle"
              >
                <template v-if="col.key === 'id'">
                  <span class="font-mono text-gray-600">{{ project.id }}</span>
                </template>
                <template v-else-if="col.key === 'title'">
                  <span class="font-medium text-gray-900">{{ project.title }}</span>
                </template>
                <template v-else-if="col.key === 'client'">
                  <span class="text-gray-700">{{ project.client?.name || '-' }}</span>
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
              </td>
            </tr>

            <tr v-if="loading">
              <td :colspan="columns.length" class="px-3 py-8 text-center text-gray-500">
                Загрузка проектов...
              </td>
            </tr>
            <tr v-if="error">
              <td :colspan="columns.length" class="px-3 py-8 text-center text-red-500">
                {{ error }}
              </td>
            </tr>
            <tr v-if="!loading && !error && pagination.data.length === 0">
              <td :colspan="columns.length" class="px-3 py-8 text-center text-gray-500">
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

    <ProjectFormModal
      v-if="showEditModal"
      :project="editingProject"
      @close="showEditModal = false"
      @submit="handleUpdateProject"
      @delete="handleDeleteProject"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import Sortable from 'sortablejs'
import UIButton from '@/components/ui/UIButton.vue'
import Pagination from '@/components/users/UserList/Pagination.vue'
import ProjectFormModal from './ProjectFormModal.vue'
import { ProjectController } from '@/controllers/ProjectController'
import type { Project } from '@/types/project'

const props = defineProps({
  search: { type: String, default: '' },
})

const columns = ref([
  { key: 'id', label: 'ID', sortable: true },
  { key: 'title', label: 'Название', sortable: true },
  { key: 'client', label: 'Клиент', sortable: false },
  { key: 'deadline', label: 'Дедлайн', sortable: true },
  { key: 'total_price', label: 'Сумма', sortable: true },
  { key: 'payment_amount', label: 'Оплачено', sortable: true },
  { key: 'created_at', label: 'Создано', sortable: true },
])

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
} = ProjectController()

const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingProject = ref<Project | null>(null)
const currentPage = ref(1)
const columnsHeader = ref<HTMLElement | null>(null)

function setSort(key: string, search = '') {
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = key
    sortOrder.value = 'asc'
  }
  fetchProjects(1, search, sortBy.value, sortOrder.value)
}

function goToPage(page: number) {
  if (page < 1 || page > pagination.value.last_page) return
  currentPage.value = page
  fetchProjects(page, props.search, sortBy.value, sortOrder.value)
}

function editProject(project: Project) {
  editingProject.value = project
  showEditModal.value = true
}

async function handleCreateProject(newProject: Project) {
  await create(newProject)
  showCreateModal.value = false
  currentPage.value = 1
  fetchProjects(currentPage.value, props.search, sortBy.value, sortOrder.value)
}

async function handleUpdateProject(updatedProject: Project) {
  await update(updatedProject.id, updatedProject)
  showEditModal.value = false
  fetchProjects(currentPage.value, props.search, sortBy.value, sortOrder.value)
}

async function handleDeleteProject(projectId: number) {
  await remove(projectId)
  showEditModal.value = false
  if (pagination.value.data.length === 1 && currentPage.value > 1) {
    currentPage.value--
  }
  fetchProjects(currentPage.value, props.search, sortBy.value, sortOrder.value)
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

watch(
  () => props.search,
  (newVal) => {
    currentPage.value = 1
    fetchProjects(1, newVal, sortBy.value, sortOrder.value)
  },
)

onMounted(async () => {
  await nextTick()
  if (columnsHeader.value) {
    Sortable.create(columnsHeader.value, {
      animation: 150,
      direction: 'horizontal',
      onEnd(evt) {
        const oldIndex = evt.oldIndex
        const newIndex = evt.newIndex
        if (oldIndex === undefined || newIndex === undefined) return
        const moved = columns.value.splice(oldIndex, 1)[0]
        columns.value.splice(newIndex, 0, moved)
      },
    })
  }
  fetchProjects(currentPage.value, props.search, sortBy.value, sortOrder.value)
})
</script>
