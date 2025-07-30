<template>
  <transition name="modal-fade">
    <div
      class="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center"
      @click="onOverlayClick"
    >
      <transition name="modal-scale">
        <div
          class="relative w-[1300px] max-w-[98vw] h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          @click.stop
        >
          <button
            @click="emit('close')"
            class="absolute top-6 right-6 text-3xl text-gray-400 hover:text-red-500 transition font-bold z-10"
          >
            ✕
          </button>
          <div class="flex gap-1 items-center justify-center px-0 pt-8 pb-4 w-full">
            <template v-for="(stage, idx) in stages" :key="stage.value">
              <button
                :class="[
                  'relative px-5 py-2 font-semibold text-base transition border-none outline-none focus:ring-2 focus:ring-yellow-300',
                  'rounded-l-full',
                  idx === stages.length - 1 ? 'rounded-r-full' : 'chevron-right',
                  getStageColor(stage.value, order?.stage, completedStages),
                  'hover:brightness-110',
                  'min-w-[120px] text-center',
                  idx !== 0 ? '-ml-2' : '',
                  'transition-all duration-150',
                ]"
                @click="handleStageClick(stage.value)"
                :disabled="order?.stage === stage.value"
                :style="{
                  zIndex: stages.length - idx,
                  ...getStageStyle(stage.value, order?.stage, completedStages),
                }"
              >
                {{ stage.label }}
                <span
                  v-if="idx !== stages.length - 1"
                  class="chevron absolute right-0 top-0 h-full w-4"
                ></span>
              </button>
            </template>
          </div>
          <div class="flex-1 flex flex-row h-full min-h-0">
            <div
              class="w-1/2 bg-gradient-to-br from-blue-200 via-purple-200 to-cyan-200 p-10 flex flex-col gap-8 border-r border-gray-200 min-w-[340px] overflow-y-auto"
            >
              <div>
                <div class="flex items-center gap-4 mb-2">
                  <div class="text-3xl font-extrabold text-gray-900 tracking-tight">
                    Заказ #{{ order?.id }}
                  </div>
                  <div class="flex flex-col gap-2">
                    <span
                      v-if="order"
                      :class="[
                        'inline-block px-4 py-1 rounded-full text-base font-bold shadow',
                        statusBadge(order.stage?.name || ''),
                      ]"
                      :style="getStatusBadgeStyle(order.stage?.name || '')"
                    >
                      {{ getStatusText(order.stage?.name || '') }}
                    </span>
                  </div>
                </div>
                <div class="text-lg text-gray-500 font-medium mb-6">{{ order?.product?.name }}</div>
                <div
                  class="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-blue-100 flex flex-col gap-4"
                >
                  <div class="text-2xl font-extrabold text-blue-900 mb-2">Детали заказа</div>
                  <div class="flex flex-col gap-3">
                    <div class="flex items-center gap-2 text-base text-gray-800">
                      <span class="font-semibold w-28">Кол-во:</span>
                      <EditableField
                        v-if="order && canCreateEdit()"
                        :model-value="order.quantity"
                        type="number"
                        :min="1"
                        :required="true"
                        @save="(val) => updateOrderField('quantity', val)"
                        class="w-24"
                      />
                      <span v-else-if="order" class="text-gray-900">{{ order.quantity }}</span>
                    </div>
                    <div
                      v-if="canViewPrices()"
                      class="flex items-center gap-2 text-base text-gray-800"
                    >
                      <span class="font-semibold w-28">Общая сумма:</span>
                      <EditableField
                        v-if="order && canCreateEdit()"
                        :model-value="order.price"
                        type="number"
                        :min="0"
                        :required="true"
                        @save="(val) => updateOrderField('price', val)"
                        class="w-32"
                      />
                      <span v-else-if="order" class="text-gray-900">{{ order.price }}</span>
                      <span class="ml-1">TMT</span>
                    </div>
                    <div class="flex items-center gap-2 text-base text-gray-800 group">
                      <span class="font-semibold w-28">Дедлайн:</span>
                      <div class="flex-1">
                        <div v-if="!showDeadlineInput" class="flex items-center">
                          <span>{{ formatDateTime(order?.deadline) || 'Не установлен' }}</span>
                          <button
                            v-if="canCreateEdit()"
                            @click="startDeadlineEdit"
                            class="ml-2 p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Изменить дедлайн"
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
                            class="w-48 text-gray-700 text-base p-2 border border-gray-300 rounded-md flatpickr-uiinput focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                          />
                          <button
                            @click="confirmDeadline"
                            class="p-1 rounded hover:bg-green-100 text-green-500"
                            title="Подтвердить"
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
                            title="Отмена"
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
                    </div>
                  </div>
                  <!-- Бейдж архивирования внизу -->
                  <div
                    v-if="order?.is_archived && order?.archived_at"
                    class="mt-6 flex items-center justify-end"
                  >
                    <span
                      class="px-3 py-1 rounded-full text-xs font-normal bg-gray-100 text-gray-500 border border-gray-200"
                    >
                      Архивировано: {{ formatArchiveDate(order.archived_at) }}
                    </span>
                  </div>
                </div>
                <hr class="my-4 border-blue-100" />
                <div
                  class="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-blue-100 flex flex-col gap-3"
                >
                  <div class="text-2xl font-extrabold text-blue-900 mb-2">Проект</div>
                  <div class="text-base text-gray-800">
                    Название: <b>{{ project?.title }}</b>
                  </div>
                  <div class="text-base text-gray-800">
                    Клиент:
                    <b>
                      {{ order?.client?.name
                      }}<template v-if="order?.client?.company_name">
                        ({{ order.client.company_name }})</template
                      ><template v-else-if="!order?.client?.name">-</template>
                    </b>
                  </div>
                </div>
              </div>
            </div>
            <div class="w-1/2 flex flex-col gap-8 p-10 bg-[#f8fafc] min-w-[340px] overflow-y-auto">
              <div
                v-if="showCancelForm"
                class="bg-white border border-red-100 rounded-xl shadow-md p-4 mb-6 flex flex-col gap-3 animate-fade-in"
              >
                <div class="text-red-500 text-base font-semibold mb-1">
                  Подтвердите отмену заказа
                </div>
                <div class="flex flex-col gap-2">
                  <label class="font-medium text-gray-700 text-sm">Причина отмены</label>
                  <textarea
                    v-model="cancelReason"
                    class="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-red-200 transition w-full resize-none"
                    placeholder="Опишите причину отмены..."
                    rows="2"
                  />
                </div>
                <div class="flex flex-col gap-2">
                  <label class="font-medium text-gray-700 text-sm">Статус причины</label>
                  <select
                    v-model="cancelReasonStatus"
                    class="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-red-200 transition w-full"
                  >
                    <option value="refused">Отказ клиента</option>
                    <option value="not_responding">Не отвечает</option>
                    <option value="defective_product">Брак/Дефект</option>
                  </select>
                </div>
                <div class="flex gap-2 justify-end mt-1">
                  <button
                    @click="confirmCancel"
                    class="rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-1.5 text-sm shadow transition"
                  >
                    Подтвердить
                  </button>
                  <button
                    @click="cancelCancel"
                    class="rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-4 py-1.5 text-sm shadow transition"
                  >
                    Отмена
                  </button>
                </div>
              </div>
              <div class="rounded-xl shadow p-6 border border-blue-100 flex flex-col bg-white">
                <div class="font-extrabold text-2xl text-blue-700 mb-4 tracking-tight">
                  Комментарии
                </div>
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
                      <div
                        class="bg-white rounded-xl p-3 flex-1 shadow-sm border border-blue-100 relative"
                      >
                        <button
                          @click="deleteComment(comment.id)"
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
                          <span class="font-bold text-sm text-gray-900">{{
                            comment.user.name
                          }}</span>
                          <span v-if="comment.user.roles && comment.user.roles.length">
                            <span
                              v-for="role in comment.user.roles"
                              :key="typeof role === 'string' ? role : role.name"
                              class="text-[10px] rounded px-2 py-0.5 font-semibold mr-1"
                              :class="
                                getRoleBadgeClass(typeof role === 'string' ? role : role.name)
                              "
                            >
                              {{
                                getRoleLabel(
                                  typeof role === 'string' ? role : role.display_name || role.name,
                                )
                              }}
                            </span>
                          </span>
                          <span v-else>
                            <span
                              class="text-[10px] rounded px-2 py-0.5 font-semibold"
                              :class="getRoleBadgeClass(comment.user.role || '')"
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
                <div
                  class="bg-white rounded-xl shadow border border-blue-200 p-3 flex flex-col gap-2"
                >
                  <input
                    v-model="newComment"
                    @focus="commentFocused = true"
                    @blur="onCommentBlur"
                    @keydown.enter.prevent="addComment"
                    type="text"
                    class="w-full border-none outline-none text-base text-gray-800 bg-transparent px-2 py-2"
                    placeholder="Добавить комментарий..."
                  />
                  <div
                    v-if="commentFocused || newComment.trim()"
                    class="flex gap-2 mt-1 justify-end"
                  >
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
              <!-- Блок причины отмены -->
              <div
                v-if="order?.stage === 'cancelled' && order?.reason && order?.reason_status"
                class="bg-red-50 border border-red-100 rounded-xl p-3 mt-4 flex flex-col gap-1"
              >
                <div class="text-gray-700 font-semibold text-sm mb-1">Заказ отменён</div>
                <div class="text-gray-700 text-sm font-semibold break-words whitespace-pre-line">
                  Причина: {{ order.reason }}
                </div>
                <div class="text-gray-700 text-sm font-semibold break-words whitespace-pre-line">
                  Статус: {{ reasonStatusText(order.reason_status) }}
                </div>
              </div>
              <!-- Назначенные сотрудники -->
              <div
                class="bg-white rounded-xl shadow p-4 border border-blue-100 mb-6"
                :class="{ 'assignment-highlight': highlightAssignments }"
              >
                <div class="font-semibold text-gray-700 mb-2 text-lg">Назначенные сотрудники</div>
                <div v-if="assignments.length === 0" class="text-gray-400 text-sm mb-2">
                  Нет назначенных сотрудников
                </div>

                <div
                  v-for="assignment in currentStageAssignments"
                  :key="assignment.id"
                  :class="`flex flex-col rounded-lg shadow-sm px-3 py-2 mb-2 border border-gray-100 ${getAssignmentBg(assignment.status)}`"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="font-semibold text-gray-900">{{
                        assignment.user?.name || '—'
                      }}</span>
                      <span
                        class="inline-block rounded px-2 py-0.5 text-xs font-semibold ml-2 align-middle leading-tight"
                        :style="getRoleBadgeStyle(assignment.role_type)"
                      >
                        {{ getRoleLabel(assignment.role_type) }}
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <select
                        v-model="assignment.status"
                        @change="updateAssignmentStatus(assignment)"
                        :class="`border rounded px-2 py-1 text-xs ${getStatusTextColor(assignment.status)}`"
                      >
                        <option value="pending">Ожидание</option>
                        <option value="in_progress">В работе</option>
                        <option value="cancelled">Отменено</option>
                        <option value="under_review">На проверке</option>
                        <option value="approved">Одобрено</option>
                      </select>
                      <button
                        v-if="assignment.status === 'cancelled' && canCreateEdit()"
                        @click="deleteAssignment(assignment)"
                        class="text-red-500 hover:underline text-xs ml-2"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                  <div class="flex items-center justify-between mt-1">
                    <span class="text-xs text-gray-400">
                      Назначил:
                      <span class="font-semibold">{{
                        assignment.assigned_by && assignment.assigned_by.name
                          ? assignment.assigned_by.name
                          : assignment.assigned_by
                      }}</span>
                    </span>
                    <!-- Можно добавить дату назначения или другую инфу -->
                  </div>
                </div>
                <div class="flex items-center gap-2 mt-4">
                  <Vue3Select
                    v-model="selectedUserId"
                    :options="currentStageUsersWithRoles"
                    label="displayName"
                    :reduce="(user) => user.id"
                    placeholder="Добавить сотрудника..."
                    class="w-80"
                    @update:modelValue="assignUser"
                  />
                  <span class="text-xs text-gray-400"> ({{ getCurrentStageRolesText() }}) </span>
                  <span v-if="assignError" class="text-xs text-red-500 mt-1 block">{{
                    assignError
                  }}</span>
                </div>
              </div>
              <!-- Timeline -->
              <div class="flex-1">
                <div class="flex flex-col gap-4">
                  <div
                    v-for="log in statusLogs"
                    :key="log.id"
                    class="flex items-center bg-white rounded-xl shadow p-4 border border-gray-100 min-h-[48px]"
                  >
                    <div class="flex-1 flex flex-row items-center gap-2">
                      <span class="font-medium text-gray-500 text-sm">Стадия изменена</span>
                      <span class="text-xs text-gray-300">{{ formatTime(log.changed_at) }}</span>
                      <span
                        class="inline-block px-3 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium"
                        >{{ getStatusText(log.from_status) }}</span
                      >
                      <span class="text-base text-gray-300">→</span>
                      <span
                        class="inline-block px-3 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium"
                        >{{ getStatusText(log.to_status) }}</span
                      >
                      <span class="text-xs text-gray-300 ml-2"
                        >{{ log.user?.name
                        }}<span
                          v-if="log.user?.role"
                          class="inline-block rounded px-1 py-0.5 text-xs font-semibold ml-1"
                          :style="getRoleBadgeStyle(log.user.role)"
                        >
                          {{ getRoleLabel(log.user.role) }}</span
                        ></span
                      >
                    </div>
                    <div class="ml-3 flex-shrink-0">
                      <div
                        class="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-semibold text-xs"
                      >
                        {{ log.user?.name ? log.user.name[0] : '?' }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

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
.chevron-right::after,
.chevron::after {
  content: '';
  display: block;
  position: absolute;
  top: 0;
  right: -8px;
  width: 16px;
  height: 100%;
  background: inherit;
  clip-path: polygon(0 0, 100% 50%, 0 100%);
  z-index: 2;
  pointer-events: none;
}
.chevron-right:last-child::after {
  display: none;
}

.vs__dropdown-menu {
  max-height: 70px !important;
  overflow-y: auto !important;
  min-width: 220px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  transition: max-height 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.vs__dropdown-menu .vs__dropdown-option,
.vs__dropdown-menu .vs__dropdown-option--selected {
  min-height: 24px !important;
  padding: 2px 10px !important;
  font-size: 15px !important;
  line-height: 1.2 !important;
  color: #374151 !important;
  background: #fff !important;
}

.flatpickr-uiinput .flatpickr-input {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  margin: 0 !important;
  font-size: inherit !important;
  color: inherit !important;
  width: 100% !important;
  outline: none !important;
}

.flatpickr-uiinput .flatpickr-input:focus {
  outline: none !important;
  box-shadow: none !important;
}

:deep(.flatpickr-calendar) {
  z-index: 9999 !important;
  font-family: inherit !important;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-to,

/* Плавная подсветка карточки назначений */
.assignment-highlight {
  box-shadow:
    0 0 0 4px rgba(239, 68, 68, 0.3),
    0 0 0 0 transparent;
  border-color: #ef4444 !important;
  background-color: white !important;
  transform: scale(1.02) !important;
  transition:
    box-shadow 0.7s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.7s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: assignmentPulse 2s ease-in-out infinite;
}

.assignment-highlight-leave-active,
.assignment-highlight-enter-active {
  transition:
    box-shadow 0.7s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.7s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.assignment-highlight-leave-from,
.assignment-highlight-enter-to {
  box-shadow:
    0 0 0 4px rgba(239, 68, 68, 0.3),
    0 0 0 0 transparent;
  border-color: #ef4444 !important;
  transform: scale(1.02) !important;
}

.assignment-highlight-leave-to,
.assignment-highlight-enter-from {
  box-shadow: 0 0 0 0 transparent;
  border-color: #e5e7eb !important;
  transform: scale(1) !important;
}

@keyframes assignmentPulse {
  0%,
  100% {
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.3);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0.15);
  }
}
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

<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import EditableField from '../../ui/EditableField.vue'
import { API_CONFIG } from '../../../config/api'
import { canCreateEdit, canViewPrices } from '../../../utils/permissions'
import { getUserImageUrl } from '../../../utils/user'
import { toast } from '../../../stores/toast'
import {
  getStageColorClasses,
  getStageColorStyles,
  getLightColor,
  getContrastColor,
} from '../../../utils/stageColors'
import {
  getOrderDetails,
  getOrderComments,
  postOrderComment,
  getProjectDetails,
  getOrderStatusLogs,
  deleteOrderComment,
  getAllStages,
  getAllUsersByStageRoles,
  assignOrderToUser,
  updateOrderAssignmentStatus,
  deleteOrderAssignment,
  getOrderAssignments,
  getRoles,
} from '../../../services/api'
import type { Order } from '../../../types/order'
import type { Project } from '../../../types/project'
import { OrderController } from '../../../controllers/OrderController'
import Vue3Select from 'vue3-select'
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { Russian } from 'flatpickr/dist/l10n/ru.js'

const props = defineProps<{ orderId?: number | null; errorMsg?: string }>()
const emit = defineEmits(['close', 'updated'])

// Состояние для подсветки назначений
const highlightAssignments = ref(false)
const assignmentMessage = ref('')

const loading = ref(true)
const order = ref<Order | null>(null)
const project = ref<Project | null>(null)

// Исправление типов для OrderComment
interface OrderComment {
  id: number
  text: string
  user: { name: string; role?: string; roles?: { name: string; display_name: string }[] }
  created_at: string
}
interface StatusLog {
  id: number
  from_status: string
  to_status: string
  changed_at: string
  user?: { name: string; role?: string }
}
const comments = ref<OrderComment[]>([])
const statusLogs = ref<StatusLog[]>([])
const newComment = ref('')
const commentFocused = ref(false)
const showDeadlineInput = ref(false)
const tempDeadline = ref('')
const showCancelForm = ref(false)
const cancelReason = ref('')
const cancelReasonStatus = ref('refused')
// Исправление типов для assignments, availableUsers
const assignments = ref<Array<any>>([])
const availableUsers = ref<Array<any>>([])
const selectedUserId = ref<number | null>(null)
const assignError = ref('')

const stages = ref<Array<{ value: string; label: string; color?: string }>>([])
const completedStages = computed(() => {
  if (!order.value || !order.value.stage) return []
  const idx = stages.value.findIndex((s) => s.value === order.value!.stage.name)
  return stages.value.slice(0, idx).map((s) => s.value)
})

// Динамический вывод ролей для комментариев и назначений
function getRoleLabel(role: string) {
  // Ищем в динамически загруженных ролях
  const dynamicRole = roles.value.find((r: any) => r.name === role)
  if (dynamicRole && dynamicRole.display_name) {
    return dynamicRole.display_name
  }

  // Если роль не найдена, возвращаем оригинальное имя
  return role
}

// Динамическая функция для цветов бейджа роли на основе цвета стадии (inline стили)
function getRoleBadgeStyle(role: string) {
  if (!order.value?.stage?.name) {
    return {
      backgroundColor: '#f3f4f6',
      color: '#374151',
    }
  }

  const stage = order.value.stage.name
  const stageData = stageUsersByRole.value[stage]

  if (!stageData || !stageData.users_by_role) {
    return {
      backgroundColor: '#f3f4f6',
      color: '#374151',
    }
  }

  // Ищем роль в текущей стадии
  const roleData = stageData.users_by_role[role]
  if (roleData && roleData.role) {
    // Используем цвет стадии для бейджа роли
    const stageColor = stageData.stage?.color || '#64748b'

    // Создаем светлую версию цвета для фона
    const lightColor = getLightColor(stageColor)
    const textColor = getContrastColor(stageColor)

    return {
      backgroundColor: lightColor,
      color: textColor,
    }
  }

  // Если роль не найдена в текущей стадии, ищем её в других стадиях
  for (const [stageName, stageInfo] of Object.entries(stageUsersByRole.value)) {
    const roleInfo = stageInfo.users_by_role[role]
    if (roleInfo && roleInfo.role) {
      const stageColor = stageInfo.stage?.color || '#64748b'
      const lightColor = getLightColor(stageColor)
      const textColor = getContrastColor(stageColor)

      return {
        backgroundColor: lightColor,
        color: textColor,
      }
    }
  }

  // Если роль не найдена нигде, используем серый цвет
  return {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  }
}

// Динамическая функция для цветов бейджа роли на основе цвета стадии (классы)
function getRoleBadgeClass(role: string) {
  if (!order.value?.stage?.name) {
    return 'bg-gray-100 text-gray-800'
  }

  const stage = order.value.stage.name
  const stageData = stageUsersByRole.value[stage]

  if (!stageData || !stageData.users_by_role) {
    return 'bg-gray-100 text-gray-800'
  }

  // Ищем роль в текущей стадии
  const roleData = stageData.users_by_role[role]
  if (roleData && roleData.role) {
    // Используем цвет стадии для бейджа роли
    const stageColor = stageData.stage?.color || '#64748b'

    // Создаем светлую версию цвета для фона
    const lightColor = getLightColor(stageColor)
    const textColor = getContrastColor(stageColor)

    return `bg-[${lightColor}] text-[${textColor}]`
  }

  // Если роль не найдена в текущей стадии, ищем её в других стадиях
  for (const [stageName, stageInfo] of Object.entries(stageUsersByRole.value)) {
    const roleInfo = stageInfo.users_by_role[role]
    if (roleInfo && roleInfo.role) {
      const stageColor = stageInfo.stage?.color || '#64748b'
      const lightColor = getLightColor(stageColor)
      const textColor = getContrastColor(stageColor)

      return `bg-[${lightColor}] text-[${textColor}]`
    }
  }

  // Если роль не найдена нигде, используем серый цвет
  return 'bg-gray-100 text-gray-800'
}

// Удалено: filteredUsers больше не используется, заменен на currentStageUsers

// Удалено: hasRole больше не используется

function normalizeUsers(users: any[]): any[] {
  // Преобразуем roles: string[] или role: string в roles: {name, display_name}[] для селектора и отображения
  return users.map((u: any) => {
    if (Array.isArray(u.roles) && typeof u.roles[0] === 'string') {
      return {
        ...u,
        roles: u.roles.map((r: string) => ({ name: r, display_name: getRoleLabel(r) })),
      }
    }
    if (!u.roles && u.role) {
      return {
        ...u,
        roles: [{ name: u.role, display_name: getRoleLabel(u.role) }],
      }
    }
    return u
  })
}

// Добавить функцию для нормализации одного пользователя
function normalizeUser(u: any): any {
  if (Array.isArray(u.roles) && typeof u.roles[0] === 'string') {
    return {
      ...u,
      roles: u.roles.map((r: string) => ({ name: r, display_name: getRoleLabel(r) })),
    }
  }
  if (!u.roles && u.role) {
    return {
      ...u,
      roles: [{ name: u.role, display_name: getRoleLabel(u.role) }],
    }
  }
  return u
}

const { updateStage, update } = OrderController()

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

async function fetchAll() {
  if (!props.orderId) return
  loading.value = true

  // Загружаем стадии
  try {
    const stagesData = await getAllStages()

    stages.value = stagesData.map((stage: any) => ({
      value: stage.name,
      label: stage.display_name || stage.name,
      color: stage.color,
    }))
  } catch (error) {
    console.error('Ошибка загрузки стадий:', error)
    // Fallback к статическим стадиям с дефолтными цветами
    stages.value = [
      { value: 'draft', label: 'Черновик', color: '#6b7280' },
      { value: 'design', label: 'Дизайн', color: '#3b82f6' },
      { value: 'print', label: 'Печать', color: '#f59e0b' },
      { value: 'engraving', label: 'Гравировка', color: '#f97316' },
      { value: 'workshop', label: 'Цех', color: '#8b5cf6' },
      { value: 'die_cutting', label: 'Высечка', color: '#10b981' },
      { value: 'final', label: 'Финал', color: '#10b981' },
      { value: 'completed', label: 'Завершен', color: '#059669' },
      { value: 'cancelled', label: 'Отменен', color: '#ef4444' },
    ]
  }

  order.value = await getOrderDetails(props.orderId)

  if (order.value?.project_id) {
    project.value = await getProjectDetails(order.value.project_id)
  }
  // Нормализуем пользователей в комментариях
  const rawComments = await getOrderComments(props.orderId)
  comments.value = rawComments.map((c: any) => ({ ...c, user: normalizeUser(c.user) }))
  statusLogs.value = await getOrderStatusLogs(props.orderId)

  // Загружаем пользователей и роли стадий
  await fetchAvailableUsers()

  // Загружаем роли для динамического отображения
  try {
    const rolesData = await getRoles()
    roles.value = rolesData
  } catch (e) {
    console.error('❌ Ошибка загрузки ролей:', e)
  }

  loading.value = false

  // Используем назначения из деталей заказа вместо отдельного запроса
  if (order.value && order.value.assignments) {
    assignments.value = order.value.assignments.map((a: any) => ({
      ...a,
      user: normalizeUser(a.user),
    }))
  } else {
    // Fallback: загружаем назначения отдельно
    await fetchAssignments()
  }

  // Проверяем, нужно ли подсвечивать назначения
  const shouldHighlight = sessionStorage.getItem('highlightAssignments')
  const message = sessionStorage.getItem('assignmentMessage')

  if (shouldHighlight === 'true') {
    highlightAssignments.value = true
    assignmentMessage.value = message || ''
    // Очищаем sessionStorage
    sessionStorage.removeItem('highlightAssignments')
    sessionStorage.removeItem('assignmentMessage')

    // Убираем подсветку через 5 секунд
    setTimeout(() => {
      highlightAssignments.value = false
      assignmentMessage.value = ''
    }, 5000)
  }
}

async function addComment() {
  if (!newComment.value.trim()) return
  await postOrderComment(props.orderId as number, newComment.value)
  newComment.value = ''
  commentFocused.value = false
  await fetchAll()
}

function formatDate(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleString('ru-RU')
}

function formatTime(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function getStatusText(stage: string) {
  const stageData = stages.value.find((s) => s.value === stage)
  return stageData?.label || stage
}

function statusBadge(stage: string) {
  // Находим стадию в загруженных данных
  const stageData = stages.value.find((s) => s.value === stage)

  if (stageData && stageData.color) {
    // Используем цвет из API с inline стилями
    return `text-white`
  }

  // Fallback к утилите, если цвет не найден
  return getStageColorClasses(stage, undefined, true)
}

function getStatusBadgeStyle(stage: string) {
  const stageData = stages.value.find((s) => s.value === stage)

  if (stageData && stageData.color) {
    return {
      backgroundColor: stageData.color,
      color: '#ffffff',
    }
  }

  return {}
}

function getStageColor(stage: string, current: string | undefined, completed: string[]) {
  // Находим стадию в загруженных данных
  const stageData = stages.value.find((s) => s.value === stage)

  if (current === stage) {
    // Текущая стадия - активный цвет
    if (stageData && stageData.color) {
      return `text-white`
    }
    return getStageColorClasses(stage, undefined, true)
  }

  if (completed.includes(stage)) {
    // Завершенная стадия - приглушенный цвет
    if (stageData && stageData.color) {
      return `text-[${stageData.color}]`
    }
    return getStageColorClasses(stage, undefined, false)
  }

  // Неактивная стадия
  return 'bg-gray-100 text-gray-400'
}

function getStageStyle(stage: string, current: string | undefined, completed: string[]) {
  const stageData = stages.value.find((s) => s.value === stage)

  if (!stageData || !stageData.color) {
    return {}
  }

  if (current === stage) {
    // Текущая стадия - активный цвет
    return {
      backgroundColor: stageData.color,
      color: '#ffffff',
    }
  }

  if (completed.includes(stage)) {
    // Завершенная стадия - приглушенный цвет
    return {
      backgroundColor: `${stageData.color}20`, // 20% opacity
      color: stageData.color,
    }
  }

  return {}
}

async function deleteComment(commentId: number) {
  if (confirm('Удалить комментарий?')) {
    await deleteOrderComment(props.orderId as number, commentId)
    await fetchAll()
  }
}

// --- Автоподстановка исполнителей на стадию при переходе ---
async function autoAssignForStage(
  orderId: number,
  stageKey: string,
  availableUsers: any[],
  roleType: string,
) {
  // Получить текущие назначения
  const res = await fetch(`${API_CONFIG.BASE_URL}/assignments?order_id=${orderId}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
    },
  })
  const data = await res.json()
  const currentAssignments = data.data || data

  // Фильтруем только тех, кто уже назначен с нужной ролью
  const assignedForRole = currentAssignments.filter((a: any) => a.role_type === roleType)

  // Если никого нет — ничего не делаем
  if (assignedForRole.length === 0) return

  // Для каждого назначенного сотрудника обновляем чекбокс стадии, если нужно
  for (const a of assignedForRole) {
    if (!a[stageKey]) {
      await fetch(`${API_CONFIG.BASE_URL}/assignments/${a.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          [stageKey]: true,
          action: 'stage_update',
        }),
      })
    }
  }
}

async function changeStatus(newStatus: string) {
  if (!order.value || order.value.stage?.name === newStatus) return

  // Проверяем, есть ли назначения для новой стадии
  const newStageRoles = stageRoleMap.value[newStatus] || []
  const hasAssignments =
    newStageRoles.length === 0 ||
    assignments.value.some((a: any) => newStageRoles.includes(a.role_type))

  try {
    // Автоматическое назначение для известных стадий (fallback)
    if (newStatus === 'design') {
      await autoAssignForStage(
        order.value.id,
        'has_design_stage',
        availableUsers.value || [],
        'designer',
      )
    }
    if (newStatus === 'print') {
      await autoAssignForStage(
        order.value.id,
        'has_print_stage',
        availableUsers.value || [],
        'print_operator',
      )
    }
    if (newStatus === 'engraving') {
      await autoAssignForStage(
        order.value.id,
        'has_engraving_stage',
        availableUsers.value || [],
        'engraving_operator',
      )
    }
    if (newStatus === 'workshop') {
      await autoAssignForStage(
        order.value.id,
        'has_workshop_stage',
        availableUsers.value || [],
        'workshop_worker',
      )
    }

    await updateStage(order.value.id, { stage: newStatus })
    toast.show('Статус заказа обновлён!')
    await fetchAll() // <-- всегда обновлять все детали заказа
    emit('updated') // Эмитим событие обновления

    // Если нет назначений, показываем предупреждение
    if (!hasAssignments && newStageRoles.length > 0) {
      toast.show('Внимание: на этой стадии нет назначенных сотрудников', 'error')
      // Активируем красную подсветку назначений
      highlightAssignments.value = true
      assignmentMessage.value = `Рекомендуется назначить сотрудника для стадии "${getStatusText(newStatus)}"`

      // Убираем подсветку через 5 секунд
      setTimeout(() => {
        highlightAssignments.value = false
        assignmentMessage.value = ''
      }, 5000)
    }
  } catch (err: any) {
    const msg = err?.message || 'Ошибка смены стадии'
    toast.show(msg, 'error')
  }
}

async function updateOrderField(field: string, value: unknown) {
  if (!order.value) return
  const payload: Record<string, unknown> = {}
  // Удалить все поля, отображения, методы, связанные с manager, manager_id, allManagers, showManagerSelect, updateManager и т.д.
  payload[field] = value
  await update(order.value.id, payload)
  await fetchAll()
  emit('updated')
}

// Удалить все поля, отображения, методы, связанные с manager, manager_id, allManagers, showManagerSelect, updateManager и т.д.

function startDeadlineEdit() {
  if (!order.value) return
  tempDeadline.value = order.value.deadline || ''
  showDeadlineInput.value = true
}

async function confirmDeadline() {
  if (!order.value) return

  let deadline = tempDeadline.value

  // Преобразуем строку даты в правильный формат для Laravel
  if (deadline && typeof deadline === 'string') {
    // Если строка в формате 'YYYY-MM-DD HH:mm', добавляем секунды
    if (deadline.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)) {
      deadline = deadline + ':00'
    }
    // Если строка в формате 'YYYY-MM-DD HH:mm:ss', оставляем как есть
    else if (deadline.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
      // Уже в правильном формате
    }
  }

  await updateOrderField('deadline', deadline)
  showDeadlineInput.value = false
}

function cancelDeadline() {
  showDeadlineInput.value = false
  tempDeadline.value = ''
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function startCancelFlow() {
  showCancelForm.value = true
  cancelReason.value = ''
  cancelReasonStatus.value = 'refused'
}

function cancelCancel() {
  showCancelForm.value = false
  cancelReason.value = ''
  cancelReasonStatus.value = 'refused'
}

async function confirmCancel() {
  if (!order.value) return
  if (!cancelReason.value.trim()) {
    alert('Пожалуйста, укажите причину отмены!')
    return
  }
  try {
    await updateStage(order.value.id, {
      stage: 'cancelled',
      reason: cancelReason.value,
      reason_status: cancelReasonStatus.value,
    })
    toast.show('Заказ отменён!')
    showCancelForm.value = false
    cancelReason.value = ''
    cancelReasonStatus.value = 'refused'
    await fetchAll()
    emit('updated') // Эмитим событие обновления
  } catch (err: any) {
    const msg = err?.message || 'Ошибка при отмене заказа!'

    // Проверяем, связана ли ошибка с отсутствием назначений
    if (
      msg.includes('дизайнер') ||
      msg.includes('печатник') ||
      msg.includes('цех') ||
      msg.includes('назначен')
    ) {
      toast.show('Назначьте сотрудника для перехода на этот этап', 'error')
      // Активируем подсветку назначений
      highlightAssignments.value = true
      assignmentMessage.value = 'Необходимо назначить сотрудника для отмены заказа'

      // Убираем подсветку через 5 секунд
      setTimeout(() => {
        highlightAssignments.value = false
        assignmentMessage.value = ''
      }, 5000)
    } else {
      alert(msg)
    }
  }
}

function reasonStatusText(status: string) {
  return (
    {
      refused: 'Отказ клиента',
      not_responding: 'Не отвечает',
      defective_product: 'Брак/Дефект',
    }[status] || status
  )
}

function handleStageClick(value: string) {
  if (value === 'cancelled') {
    startCancelFlow()
  } else {
    showCancelForm.value = false
    cancelReason.value = ''
    cancelReasonStatus.value = 'refused'
    changeStatus(value)
  }
}

function onOverlayClick() {
  emit('close')
}

async function fetchAssignments() {
  if (!order.value || !order.value.id) return
  try {
    const data = await getOrderAssignments()

    assignments.value = (data.data || data).map((a: any) => ({ ...a, user: normalizeUser(a.user) }))

    // ДЕТАЛЬНЫЕ ЛОГИ для отладки
  } catch (e) {
    console.error('❌ Ошибка загрузки назначений:', e)
    assignments.value = []
  }
}

async function fetchAvailableUsers() {
  try {
    // Загружаем динамические роли стадий из API
    const data = await getAllUsersByStageRoles()

    // Обновляем карту ролей стадий
    stageRoleMap.value = {}
    stageUsersByRole.value = data

    // Собираем всех пользователей для селектора
    let allUsers: any[] = []

    Object.entries(data).forEach(([stageName, stageData]: [string, any]) => {
      const roles = Object.keys(stageData.users_by_role)
      stageRoleMap.value[stageName] = roles

      // Добавляем пользователей для каждой роли
      Object.values(stageData.users_by_role).forEach((roleData: any) => {
        if (roleData.users && Array.isArray(roleData.users)) {
          allUsers = allUsers.concat(roleData.users)
        }
      })
    })

    // Убираем дубликаты по id
    availableUsers.value = allUsers.filter(
      (user, index, self) => index === self.findIndex((u) => u.id === user.id),
    )
  } catch (e) {
    console.error('❌ Ошибка загрузки пользователей:', e)
    availableUsers.value = []

    // Fallback к статическим ролям
    stageRoleMap.value = {
      design: ['designer'],
      print: ['print_operator'],
      engraving: ['engraving_operator'],
      workshop: ['workshop_worker'],
    }
  }
}

async function assignUser(userId: number) {
  if (!order.value || !order.value.id || !userId) return

  // Находим пользователя в списке с ролями для текущей стадии
  const userWithRole = currentStageUsersWithRoles.value.find((u) => u.id === userId)

  if (!userWithRole) {
    console.error('Пользователь не найден в списке доступных для текущей стадии')
    return
  }

  // Используем роль, определенную для текущей стадии
  const roleType = userWithRole.roleForStage

  try {
    const assignmentData: any = { user_id: userId }
    if (roleType) {
      assignmentData.role_type = roleType
    }

    await assignOrderToUser(order.value.id, assignmentData)
    selectedUserId.value = null
    await fetchAll() // Обновляем все данные, включая назначения
  } catch (e) {
    console.error('Ошибка назначения пользователя:', e)
  }
}

async function updateAssignmentStatus(assignment: any) {
  if (!assignment?.id) return
  try {
    await updateOrderAssignmentStatus(assignment.id, assignment.status)
    await fetchAll() // Обновляем все данные, включая назначения
  } catch (e) {
    console.error('Ошибка обновления статуса назначения:', e)
  }
}

async function deleteAssignment(assignment: any) {
  if (!assignment?.id) return
  try {
    await deleteOrderAssignment(assignment.id)
    await fetchAll() // Обновляем все данные, включая назначения
  } catch (e) {
    console.error('Ошибка удаления назначения:', e)
  }
}

function getAssignmentBg(status: string) {
  return (
    {
      pending: 'bg-yellow-50 border-yellow-200',
      in_progress: 'bg-blue-50 border-blue-200',
      cancelled: 'bg-red-50 border-red-200',
      under_review: 'bg-purple-50 border-purple-200',
      approved: 'bg-emerald-50 border-emerald-200',
    }[status] || 'bg-gray-50 border-gray-200'
  )
}

function getStatusTextColor(status: string) {
  return (
    {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      under_review: 'bg-purple-100 text-purple-800',
      approved: 'bg-emerald-100 text-emerald-800',
    }[status] || 'bg-gray-100 text-gray-800'
  )
}

function formatArchiveDate(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Динамическая карта ролей стадий - будет загружаться из API
const stageRoleMap = ref<Record<string, string[]>>({})
const stageUsersByRole = ref<Record<string, Record<string, any[]>>>({})

// Динамические роли - будет загружаться из API
const roles = ref<any[]>([])

// Отображение назначений для текущей стадии
const currentStageAssignments = computed(() => {
  if (!order.value) return []

  const stage = order.value.stage?.name
  const stageRoles = stageRoleMap.value[stage] || []

  if (stageRoles.length === 0) {
    // Если стадия не требует назначений (draft, final, completed, cancelled), показываем все

    return assignments.value
  }

  // Для конкретной стадии показываем только сотрудников нужных ролей
  const filtered = assignments.value.filter((a: any) => stageRoles.includes(a.role_type))

  return filtered
})

// Пользователи для текущей стадии
const currentStageUsers = computed(() => {
  if (!order.value?.stage?.name) return availableUsers.value

  const stage = order.value.stage.name
  const stageData = stageUsersByRole.value[stage]

  if (!stageData || !stageData.users_by_role) {
    return availableUsers.value
  }

  let users: any[] = []
  Object.values(stageData.users_by_role).forEach((roleData: any) => {
    if (roleData.users && Array.isArray(roleData.users)) {
      users = users.concat(roleData.users)
    }
  })

  return users
})

// Пользователи для текущей стадии с отображением роли
const currentStageUsersWithRoles = computed(() => {
  if (!order.value?.stage?.name) {
    return availableUsers.value
  }

  const stage = order.value.stage.name
  const stageData = stageUsersByRole.value[stage]
  const stageRoles = stageRoleMap.value[stage] || []

  if (!stageData || !stageData.users_by_role) {
    return availableUsers.value
  }

  let users: any[] = []

  Object.entries(stageData.users_by_role).forEach(([roleName, roleData]: [string, any]) => {
    if (roleData.users && Array.isArray(roleData.users)) {
      const roleLabel = roleData.role?.display_name || getRoleLabel(roleName)
      const usersWithRole = roleData.users.map((user: any) => ({
        ...user,
        displayName: `${user.name} (${roleLabel})`,
        roleForStage: roleName,
      }))
      users = users.concat(usersWithRole)
    }
  })

  return users
})

// Функция для получения текста ролей текущей стадии
function getCurrentStageRolesText() {
  if (!order.value?.stage?.name) return 'Все сотрудники'

  const stage = order.value.stage.name
  const stageData = stageUsersByRole.value[stage]

  if (!stageData || !stageData.users_by_role) {
    return 'Все сотрудники'
  }

  const roleNames = Object.values(stageData.users_by_role).map(
    (roleData: any) => roleData.role?.display_name || roleData.role?.name || 'Неизвестная роль',
  )

  return roleNames.join(', ')
}

let pollingInterval: any = null

onMounted(() => {
  fetchAll()
  fetchAvailableUsers()
  pollingInterval = setInterval(() => {
    fetchAll()
  }, 7000) // каждые 7 секунд
})

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval)
})

watch(
  () => props.orderId,
  (val) => {
    if (val) fetchAll()
  },
  { immediate: true },
)

watch(
  () => order.value?.stage,
  (newStage) => {
    if (showCancelForm.value && newStage !== 'cancelled') {
      showCancelForm.value = false
      cancelReason.value = ''
      cancelReasonStatus.value = 'refused'
    }
  },
)

watch(
  () => assignments.value,
  (newAssignments) => {
    if (!order.value?.stage?.name) return

    // Проверяем только назначения для текущей стадии
    const currentStageRoles = stageRoleMap.value[order.value?.stage?.name || ''] || []
    const currentStageAssignments = newAssignments.filter((a: any) =>
      currentStageRoles.includes(a.role_type),
    )

    // Проверяем, что все назначения для текущей стадии действительно approved
    const allCurrentStageApproved =
      currentStageAssignments.length > 0 &&
      currentStageAssignments.every((a) => a.status === 'approved')

    // Автоматический переход только если есть назначения для текущей стадии и все они approved
    if (allCurrentStageApproved && currentStageRoles.length > 0) {
      // Находим следующую стадию
      const currentStageIndex = stages.value.findIndex((s) => s.value === order.value?.stage?.name)
      const nextStage = stages.value[currentStageIndex + 1]

      if (nextStage && nextStage.value !== 'completed' && nextStage.value !== 'cancelled') {
        // Получаем названия ролей для сообщения
        const roleNames = currentStageRoles.map((role) => getRoleLabel(role)).join(', ')

        updateStage(order.value.id, { stage: nextStage.value })
          .then(() => {
            toast.show(
              `Все ${roleNames} одобрили — заказ переведён на стадию "${nextStage.label}"!`,
            )
            fetchAll()
          })
          .catch(() => {})
      }
    }
  },
  { deep: true },
)

// Исправление getUserImageUrl (ожидает Promise)
// Используем v-if="userImageUrls[comment.user.name]" и асинхронно загружаем аватарки
const userImageUrls = ref<Record<string, string>>({})
async function loadUserImageUrl(user: any) {
  if (!user || !user.name) return
  if (!userImageUrls.value[user.name]) {
    try {
      const url = await getUserImageUrl(user)
      userImageUrls.value[user.name] = url
    } catch {
      userImageUrls.value[user.name] = ''
    }
  }
}
watch(
  () => comments.value,
  (newComments) => {
    newComments.forEach((c) => loadUserImageUrl(c.user))
  },
  { immediate: true, deep: true },
)
</script>
