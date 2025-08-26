<template>
  <div class="rounded-xl shadow p-6 border border-blue-100 flex flex-col bg-white">
    <div class="font-extrabold text-2xl text-blue-700 mb-4 tracking-tight">Комментарии</div>
    <div class="mb-4">
      <ul class="space-y-3">
        <li
          v-for="comment in comments"
          :key="comment.id"
          class="flex gap-3 items-start group relative"
        >
          <div
            class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-extrabold text-base shadow"
          >
            <img
              v-if="userImageUrls[comment.user.name]"
              :src="userImageUrls[comment.user.name]"
              :alt="comment.user?.name"
              class="w-8 h-8 rounded-full object-cover"
            />
            <span v-else>
              {{ comment.user?.name ? comment.user.name[0] : '?' }}
            </span>
          </div>
          <div class="bg-white rounded-xl p-3 flex-1 shadow-sm border border-blue-100 relative">
            <button
              @click="$emit('delete-comment', comment.id)"
              title="Удалить"
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
              <span class="font-bold text-sm text-gray-900">{{ comment.user.name }}</span>
              <span v-if="comment.user.roles && comment.user.roles.length">
                <span
                  v-for="role in comment.user.roles"
                  :key="role.name"
                  class="text-[10px] rounded px-2 py-0.5 font-semibold mr-1"
                  :class="getRoleBadgeClass(role.name)"
                  :style="getRoleBadgeStyle(role.name)"
                >
                  {{ getRoleLabel(role.display_name || role.name) }}
                </span>
              </span>
              <span v-else>
                <span
                  class="text-[10px] rounded px-2 py-0.5 font-semibold"
                  :class="getRoleBadgeClass(comment.user.role || '')"
                  :style="getRoleBadgeStyle(comment.user.role || '')"
                >
                  {{ getRoleLabel(comment.user.role || '') }}
                </span>
              </span>
              <span class="text-[10px] text-gray-400 ml-auto">{{
                formatDate(comment.created_at)
              }}</span>
            </div>
            <div class="text-sm text-gray-700 leading-snug">{{ comment.text }}</div>
          </div>
        </li>
      </ul>
    </div>
    <!-- Минималистичная форма комментария -->
    <div class="bg-white rounded-xl shadow border border-blue-200 p-3 flex flex-col gap-2">
      <input
        v-model="newComment"
        @focus="commentFocused = true"
        @blur="onCommentBlur"
        @keydown.enter.prevent="addComment"
        type="text"
        class="w-full border-none outline-none text-base text-gray-900 bg-transparent px-2 py-2"
        placeholder="Добавить комментарий..."
      />
      <div v-if="commentFocused || newComment.trim()" class="flex gap-2 mt-1 justify-end">
        <button
          @click="addComment"
          type="button"
          class="rounded-full bg-blue-300 hover:bg-blue-400 text-white text-xs font-bold px-4 py-1 shadow transition"
        >
          ОТПРАВИТЬ
        </button>
        <button
          @click="cancelComment"
          type="button"
          class="rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold px-4 py-1 shadow transition"
        >
          ОТМЕНА
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { User as ApiUser } from '../../../types/api'
import type { OrderComment, Role, User } from '../../../types/orderDetails'

interface Props {
  comments: OrderComment[]
  roles: Role[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'add-comment': [text: string]
  'delete-comment': [commentId: number]
}>()

const newComment = ref('')
const commentFocused = ref(false)
const userImageUrls = ref<Record<string, string>>({})

function onCommentBlur() {
  // Задержка нужна, чтобы не скрывать кнопки при клике на них
  setTimeout(() => {
    if (!newComment.value.trim()) commentFocused.value = false
  }, 100)
}

function cancelComment() {
  newComment.value = ''
  commentFocused.value = false
}

function addComment() {
  if (!newComment.value.trim()) return

  emit('add-comment', newComment.value)
  newComment.value = ''
  commentFocused.value = false
}

function formatDate(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleString('ru-RU')
}

function getRoleLabel(role: string) {
  // Ищем в динамически загруженных ролях
  const dynamicRole = props.roles.find((r: Role) => r.name === role)
  if (dynamicRole && dynamicRole.display_name) {
    return dynamicRole.display_name
  }

  // Если роль не найдена, возвращаем оригинальное имя
  return role
}

function getRoleBadgeStyle(role: string) {
  // Получаем цвет роли из props.roles если есть
  const roleData = props.roles.find((r: Role) => r.name === role)

  if (roleData?.color) {
    return {
      backgroundColor: roleData.color,
      color: '#ffffff',
    }
  }

  // Fallback к серому цвету
  return {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  }
}

function getRoleBadgeClass(role: string) {
  const roleData = props.roles.find((r: Role) => r.name === role)

  if (roleData?.color) {
    return 'text-white font-semibold'
  }

  return 'bg-gray-100 text-gray-800'
}

async function loadUserImageUrl(user: User) {
  if (!user || !user.name) return
  if (!userImageUrls.value[user.name]) {
    try {
      // Преобразуем User в ApiUser для getUserImageUrl
      const apiUser: ApiUser = {
        id: user.id,
        name: user.name,
        username: user.name, // fallback
        is_active: true, // fallback
        created_at: '', // fallback
        updated_at: '', // fallback
        roles: user.roles?.map((r) => ({ ...r, id: 0, created_at: '', updated_at: '' })) || [],
      }
      const { getUserImageUrl } = await import('../../../utils/user')
      const url = await getUserImageUrl(apiUser)
      userImageUrls.value[user.name] = url
    } catch {
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
</script>
