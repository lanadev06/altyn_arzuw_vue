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
                  getStageColor(stage.value, getCurrentStage(order), completedStages),
                  'hover:brightness-110',
                  'min-w-[120px] text-center',
                  idx !== 0 ? '-ml-2' : '',
                  'transition-all duration-150',
                ]"
                @click="handleStageClick(stage.value)"
                :disabled="getCurrentStage(order) === stage.value"
                :style="{
                  zIndex: stages.length - idx,
                  ...getStageStyle(stage.value, getCurrentStage(order), completedStages),
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
                        statusBadge(getCurrentStage(order)),
                      ]"
                      :style="getStatusBadgeStyle(getCurrentStage(order))"
                    >
                      {{ getStatusText(getCurrentStage(order)) }}
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
                        :model-value="order.quantity || 0"
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
                        :model-value="order.price || 0"
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
                          <span>{{
                            formatDateTime(order?.deadline || undefined) || 'Не установлен'
                          }}</span>
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
                          <input
                            v-model="tempDeadline"
                            type="datetime-local"
                            class="w-48 text-gray-900 text-base p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white"
                            placeholder="Выберите дату и время"
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
                            @click="clearDeadline"
                            class="p-1 rounded hover:bg-yellow-100 text-yellow-600"
                            title="Очистить дедлайн"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
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

                  <!-- Контакты клиента -->
                  <div
                    v-if="order?.client?.contacts && order.client.contacts.length > 0"
                    class="mt-4"
                  >
                    <div class="text-base font-semibold text-gray-800 mb-2">Контакты клиента:</div>
                    <div class="flex flex-col gap-2">
                      <div
                        v-for="contact in order.client.contacts"
                        :key="contact.id"
                        class="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <!-- Иконка типа контакта -->
                        <div class="flex-shrink-0">
                          <svg
                            v-if="contact.type === 'phone'"
                            class="w-5 h-5 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"
                            />
                          </svg>
                          <svg
                            v-else-if="contact.type === 'email'"
                            class="w-5 h-5 text-blue-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"
                            />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                          <svg
                            v-else-if="contact.type === 'telegram'"
                            class="w-5 h-5 text-blue-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
                            />
                          </svg>
                          <svg
                            v-else-if="contact.type === 'whatsapp'"
                            class="w-5 h-5 text-green-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"
                            />
                          </svg>
                          <svg
                            v-else-if="contact.type === 'instagram'"
                            class="w-5 h-5 text-pink-600"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.781c-.49 0-.928-.175-1.297-.49-.368-.315-.49-.753-.49-1.243 0-.49.122-.928.49-1.243.369-.315.807-.49 1.297-.49s.928.175 1.297.49c.368.315.49.753.49 1.243 0 .49-.122.928-.49 1.243-.369.315-.807.49-1.297.49z"
                            />
                          </svg>
                          <svg
                            v-else
                            class="w-5 h-5 text-gray-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clip-rule="evenodd"
                            />
                          </svg>
                        </div>

                        <!-- Значение контакта -->
                        <div class="flex-1 min-w-0">
                          <div class="text-sm font-medium text-gray-900 truncate">
                            {{ contact.value }}
                          </div>
                          <div class="text-xs text-gray-500 capitalize">
                            {{ getContactTypeLabel(contact.type) }}
                          </div>
                        </div>

                        <!-- Кнопка действия -->
                        <div class="flex-shrink-0">
                          <button
                            v-if="contact.type === 'phone'"
                            @click="callPhone(contact.value)"
                            class="p-1 text-green-600 hover:text-green-700 transition-colors"
                            title="Позвонить"
                          >
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"
                              />
                            </svg>
                          </button>
                          <button
                            v-else-if="contact.type === 'email'"
                            @click="sendEmail(contact.value)"
                            class="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                            title="Написать email"
                          >
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"
                              />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                          </button>
                          <button
                            v-else-if="contact.type === 'telegram'"
                            @click="openTelegram(contact.value)"
                            class="p-1 text-blue-500 hover:text-blue-600 transition-colors"
                            title="Открыть в Telegram"
                          >
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path
                                d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
                              />
                            </svg>
                          </button>
                          <button
                            v-else-if="contact.type === 'whatsapp'"
                            @click="openWhatsApp(contact.value)"
                            class="p-1 text-green-500 hover:text-green-600 transition-colors"
                            title="Открыть в WhatsApp"
                          >
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path
                                d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"
                              />
                            </svg>
                          </button>
                          <button
                            v-else
                            @click="copyToClipboard(contact.value)"
                            class="p-1 text-gray-600 hover:text-gray-700 transition-colors"
                            title="Копировать"
                          >
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                              <path
                                d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
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
                    class="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-red-200 transition w-full resize-none text-gray-900 bg-white"
                    placeholder="Опишите причину отмены..."
                    rows="2"
                  />
                </div>
                <div class="flex flex-col gap-2">
                  <label class="font-medium text-gray-700 text-sm">Статус причины</label>
                  <select
                    v-model="cancelReasonStatus"
                    class="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-red-200 transition w-full text-gray-900 bg-white"
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
                              :style="
                                getRoleBadgeStyle(typeof role === 'string' ? role : role.name)
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
                <div
                  class="bg-white rounded-xl shadow border border-blue-200 p-3 flex flex-col gap-2"
                >
                  <input
                    v-model="newComment"
                    @focus="commentFocused = true"
                    @blur="onCommentBlur"
                    @keydown.enter.prevent="addComment"
                    type="text"
                    class="w-full border-none outline-none text-base text-gray-900 bg-transparent px-2 py-2"
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
                <div class="font-semibold text-gray-700 mb-2 text-lg">
                  Назначенные сотрудники
                  <span class="text-sm font-normal text-gray-500">
                    ({{ getStatusText(getCurrentStage(order)) }})
                  </span>
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
                        :class="`border rounded px-2 py-1 text-xs text-gray-900 bg-white ${getStatusTextColor(assignment.status)}`"
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
                        getAssignedByName(assignment.assigned_by)
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
                    :reduce="(user: any) => user.id"
                    placeholder="Добавить сотрудника..."
                    class="w-80"
                    @update:modelValue="assignUser"
                  />
                  <span class="text-xs text-gray-400"> ({{ getCurrentStageRolesText() }}) </span>
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

/* Ensure Vue3Select input has good visibility */
.vs__selected-options {
  color: #111827 !important;
}

.vs__search {
  color: #111827 !important;
  background: transparent !important;
}

.vs__dropdown-toggle {
  background: white !important;
  border: 1px solid #d1d5db !important;
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
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import EditableField from '../../ui/EditableField.vue'
import { API_CONFIG } from '../../../config/api'
import { canCreateEdit, canViewPrices } from '../../../utils/permissions'
import { getUserImageUrl } from '../../../utils/user'
import { toast } from '../../../stores/toast'
import { getStageColorClasses } from '../../../utils/stageColors'
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
  getRoles,
} from '../../../services/api'
import type { Order } from '../../../types/order'
import type { Project } from '../../../types/project'
import { OrderController } from '../../../controllers/OrderController'
import Vue3Select from 'vue3-select'

// Типы для исправления any
interface User {
  id: number
  name: string
  role?: string
  roles?: Array<{ name: string; display_name: string }>
}

interface Role {
  id: number
  name: string
  display_name?: string
  color?: string
}

interface Stage {
  id: number
  name: string
  display_name?: string
  color?: string
  roles?: Role[]
}

interface Assignment {
  id: number
  user_id: number
  user?: User
  role_type: string
  status: string
  assigned_stages?: Stage[]
  stage_name?: string
  order_stage?: string
  order_id?: number
  assigned_by?: User | number | string | unknown
}

// Типы для API ответов
interface RawComment {
  id: number
  text: string
  user: unknown // Будет нормализован
  created_at: string
}

interface RawAssignment {
  id: number
  user_id: number
  user?: unknown // Будет нормализован
  role_type: string
  status: string
  assigned_stages?: Stage[]
  stage_name?: string
  order_stage?: string
  order_id?: number
  assigned_by?: unknown
}

const props = defineProps<{ orderId?: number | null; errorMsg?: string }>()
const emit = defineEmits(['close', 'updated'])

// Состояние для подсветки назначений
const highlightAssignments = ref(false)
const assignmentMessage = ref('')

// Флаг для отключения автоматического переключения стадий
const disableAutoStageSwitch = ref(false)

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
const assignments = ref<Assignment[]>([])
const availableUsers = ref<User[]>([])
const selectedUserId = ref<number | null>(null)

const stages = ref<Array<{ value: string; label: string; color?: string }>>([])
const completedStages = computed(() => {
  if (!order.value || !order.value.stage) return []
  const currentStage = getCurrentStage(order.value)
  const idx = stages.value.findIndex((s) => s.value === currentStage)
  return stages.value.slice(0, idx).map((s) => s.value)
})

// Динамический вывод ролей для комментариев и назначений
function getRoleLabel(role: string) {
  // Ищем в динамически загруженных ролях
  const dynamicRole = roles.value.find((r: Role) => r.name === role)
  if (dynamicRole && dynamicRole.display_name) {
    return dynamicRole.display_name
  }

  // Если роль не найдена, возвращаем оригинальное имя
  return role
}

// Функция для цветов бейджа роли с цветом стадии
function getRoleBadgeStyle(role: string) {
  const stageColor = getStageColorForRole(role)

  if (stageColor) {
    return {
      backgroundColor: stageColor,
      color: '#ffffff',
    }
  }

  // Fallback к серому цвету
  return {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  }
}

// Функция для классов бейджа роли с цветом стадии
function getRoleBadgeClass(role: string) {
  const stageColor = getStageColorForRole(role)

  if (stageColor) {
    return 'text-white font-semibold' // Только белый текст, фон через inline стили
  }

  return 'bg-gray-100 text-gray-800'
}

// Удалено: normalizeUsers больше не используется

// Добавить функцию для нормализации одного пользователя
function normalizeUser(u: unknown): User {
  if (typeof u === 'object' && u !== null) {
    const user = u as Record<string, unknown>

    if (Array.isArray(user.roles) && typeof user.roles[0] === 'string') {
      return {
        ...user,
        roles: user.roles.map((r: string) => ({ name: r, display_name: getRoleLabel(r) })),
      } as User
    }
    if (!user.roles && user.role && typeof user.role === 'string') {
      return {
        ...user,
        roles: [{ name: user.role, display_name: getRoleLabel(user.role) }],
      } as User
    }
  }
  return u as User
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

  try {
    // Загружаем стадии
    const stagesData = await getAllStages()

    // Сохраняем полные данные стадий с ролями для определения цветов ролей
    stagesWithRoles.value = stagesData

    // Специальная проверка для стадии гравировки
    const engravingStage = stagesData.find(
      (stage: Stage) =>
        stage.name === 'engraving' ||
        stage.name === 'grav' ||
        stage.display_name?.toLowerCase().includes('гравировка'),
    )

    stages.value = stagesData.map((stage: Stage) => ({
      value: stage.name,
      label: stage.display_name || stage.name,
      color: stage.color,
    }))
  } catch (error) {
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

  try {
    const orderData = await getOrderDetails(props.orderId)
    order.value = orderData as Order
  } catch (error) {
    toast.show('Ошибка загрузки заказа', 'error')
    return
  }

  try {
    if (order.value?.project_id) {
      const projectData = await getProjectDetails(order.value.project_id)
      project.value = projectData as Project
    }
  } catch (error) {
    // Не прерываем загрузку, проект не критичен
  }

  try {
    const rawComments = await getOrderComments(props.orderId)
    comments.value = (rawComments as RawComment[]).map((c: RawComment) => ({
      ...c,
      user: normalizeUser(c.user),
    }))
  } catch (error) {
    comments.value = []
  }

  try {
    const logsData = await getOrderStatusLogs(props.orderId)
    statusLogs.value = logsData as StatusLog[]
  } catch (error) {
    statusLogs.value = []
  }

  try {
    // Загружаем пользователей и роли стадий
    await fetchAvailableUsers()
  } catch (error) {
    availableUsers.value = []
  }

  // Загружаем роли для динамического отображения
  try {
    const rolesData = await getRoles()
    roles.value = rolesData
  } catch (e) {
    roles.value = []
  }

  loading.value = false

  // Используем назначения из деталей заказа
  if (order.value && order.value.assignments) {
    assignments.value = order.value.assignments.map((a: RawAssignment) => ({
      ...a,
      user: normalizeUser(a.user),
    }))

    // Проверяем, нужно ли вернуть заказ на стадию с неодобренными назначениями
    const currentStage = getCurrentStage(order.value)
    if (currentStage === 'completed') {
      // Ищем стадию с неодобренными назначениями
      const pendingAssignments = assignments.value.filter(
        (assignment: Assignment) => assignment.status !== 'approved',
      )

      if (pendingAssignments.length > 0) {
        // Находим стадию с неодобренными назначениями
        const stagesWithPendingAssignments = new Set<string>()

        pendingAssignments.forEach((assignment: Assignment) => {
          if (assignment.assigned_stages) {
            assignment.assigned_stages.forEach((stage: Stage) => {
              stagesWithPendingAssignments.add(stage.name)
            })
          }
        })

        // Находим первую стадию с неодобренными назначениями в правильном порядке
        const orderedStages = stages.value.map((s) => s.value)
        let targetStage = null

        for (const stageName of orderedStages) {
          if (stagesWithPendingAssignments.has(stageName)) {
            targetStage = stageName
            break
          }
        }

        if (targetStage && targetStage !== 'completed') {
          await changeStatus(targetStage)
        }
      }
    }
  } else {
    assignments.value = []
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

  // Убираем автоматический переход стадий во фронтенде - теперь это делается только на backend
  // determineInitialStage()

  // Специальная проверка для стадии гравировки
  if (order.value && getCurrentStage(order.value) === 'engraving') {
    // Проверяем, есть ли стадия гравировки в stagesWithRoles
    const engravingStageData = stagesWithRoles.value.find(
      (stage: Stage) => stage.name === 'engraving',
    )

    // Проверяем, есть ли пользователи с ролью гравировщика
    const engravingUsers = availableUsers.value.filter((user: User) => {
      const userRoles = user.roles?.map((r: { name: string; display_name: string }) => r.name) || [
        user.role,
      ]
      return userRoles.some((role: string | undefined) => role === 'engraving_operator')
    })
  }
}

async function addComment() {
  if (!newComment.value.trim()) return

  try {
    await postOrderComment(props.orderId as number, newComment.value)
    newComment.value = ''
    commentFocused.value = false
    toast.show('Комментарий добавлен!')
    await fetchAll()
  } catch (error) {
    toast.show('Ошибка добавления комментария', 'error')
  }
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

  // Fallback цвета для стадий без цвета в API
  const fallbackColors: Record<string, string> = {
    draft: '#6b7280',
    design: '#3b82f6',
    print: '#f59e0b',
    engraving: '#f97316',
    workshop: '#8b5cf6',
    die_cutting: '#10b981',
    final: '#10b981',
    completed: '#059669',
    cancelled: '#ef4444',
  }

  const fallbackColor = fallbackColors[stage]
  if (fallbackColor) {
    return {
      backgroundColor: fallbackColor,
      color: '#ffffff',
    }
  }

  return {
    backgroundColor: '#6b7280',
    color: '#ffffff',
  }
}

function getStageColor(stage: string, current: string | undefined, completed: string[]) {
  // Находим стадию в загруженных данных
  const stageData = stages.value.find((s) => s.value === stage)

  if (current === stage) {
    // Текущая стадия - активный цвет
    if (stageData && stageData.color) {
      return `text-white font-semibold` // Только белый текст, фон через inline стили
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

  // Fallback цвета для стадий без цвета в API
  const fallbackColors = {
    draft: '#6b7280',
    design: '#3b82f6',
    print: '#f59e0b',
    engraving: '#f97316',
    workshop: '#8b5cf6',
    die_cutting: '#10b981',
    final: '#10b981',
    completed: '#059669',
    cancelled: '#ef4444',
  }

  const color =
    stageData?.color || fallbackColors[stage as keyof typeof fallbackColors] || '#6b7280'

  if (current === stage) {
    // Текущая стадия - активный цвет
    return {
      backgroundColor: color,
      color: '#ffffff',
    }
  }

  if (completed.includes(stage)) {
    // Завершенная стадия - приглушенный цвет
    return {
      backgroundColor: `${color}20`, // 20% opacity
      color: color,
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

async function changeStatus(newStatus: string) {
  if (!order.value || getCurrentStage(order.value) === newStatus) return

  // Проверяем, можно ли перевести на completed
  if (newStatus === 'completed') {
    // Проверяем, есть ли неодобренные назначения
    const pendingAssignments = assignments.value.filter(
      (assignment: Assignment) => assignment.status !== 'approved',
    )

    if (pendingAssignments.length > 0) {
      // Находим стадию с неодобренными назначениями по ролям
      const stagesWithPendingAssignments = new Set<string>()

      pendingAssignments.forEach((assignment: Assignment) => {
        // Ищем стадию, которая содержит роль этого назначения
        const stageWithRole = stagesWithRoles.value.find((stage: Stage) => {
          return stage.roles && stage.roles.some((role: Role) => role.name === assignment.role_type)
        })

        if (stageWithRole) {
          stagesWithPendingAssignments.add(stageWithRole.name)
        }
      })

      // Находим первую стадию с неодобренными назначениями в правильном порядке
      const orderedStages = stages.value.map((s) => s.value)
      let targetStage = null

      for (const stageName of orderedStages) {
        if (stagesWithPendingAssignments.has(stageName)) {
          targetStage = stageName
          break
        }
      }

      if (targetStage && targetStage !== 'completed') {
        console.log(
          `🔄 Возвращаем заказ с completed на ${targetStage} из-за неодобренных назначений`,
        )

        // Показываем уведомление пользователю
        toast.show(
          `Заказ возвращен на стадию "${getStatusText(targetStage)}" из-за неодобренных назначений`,
          'error',
        )

        // Переходим на найденную стадию вместо completed
        await updateStage(order.value.id, targetStage)
        toast.show('Статус заказа обновлён!')

        // Принудительно обновляем данные с небольшой задержкой для синхронизации
        setTimeout(async () => {
          await fetchAll()
        }, 200)

        emit('updated')
        return
      } else {
        toast.show('Нельзя завершить заказ, пока есть неодобренные назначения!', 'error')
        return
      }
    }
  }

  // Устанавливаем флаг отключения автоматического переключения
  disableAutoStageSwitch.value = true

  try {
    await updateStage(order.value.id, newStatus)
    toast.show('Статус заказа обновлён!')

    // Принудительно обновляем данные с небольшой задержкой для синхронизации
    setTimeout(async () => {
      await fetchAll()

      // Проверяем назначения для новой стадии и подсвечиваем если их нет
      const newStageAssignments = assignments.value.filter((assignment: Assignment) => {
        return (
          assignment.assigned_stages &&
          assignment.assigned_stages.some((stage: Stage) => stage.name === newStatus)
        )
      })

      console.log(
        '🔍 changeStatus - проверяем назначения для стадии:',
        newStatus,
        'найдено:',
        newStageAssignments.length,
      )

      // Показываем предупреждение только если это не автоматический переход
      // и на стадии нет назначений (кроме draft и completed)
      if (newStageAssignments.length === 0 && newStatus !== 'draft' && newStatus !== 'completed') {
        // Активируем подсветку назначений
        highlightAssignments.value = true
        assignmentMessage.value = `Рекомендуется назначить сотрудника для стадии "${getStatusText(newStatus)}"`

        // Показываем информативное toast уведомление (не ошибку)
        toast.show(
          `На стадии "${getStatusText(newStatus)}" нет назначенных сотрудников. Заказ будет автоматически переходить дальше.`,
          'success',
        )

        // Убираем подсветку через 3 секунды
        setTimeout(() => {
          highlightAssignments.value = false
          assignmentMessage.value = ''
        }, 3000)
      }
    }, 200) // Увеличиваем задержку для лучшей синхронизации

    emit('updated')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ошибка смены стадии'
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

  // Преобразуем дату в формат для input type="datetime-local" (YYYY-MM-DDTHH:mm)
  if (order.value.deadline) {
    const date = new Date(order.value.deadline)
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      tempDeadline.value = `${year}-${month}-${day}T${hours}:${minutes}`
    } else {
      tempDeadline.value = ''
    }
  } else {
    tempDeadline.value = ''
  }

  showDeadlineInput.value = true
}

async function confirmDeadline() {
  if (!order.value) return

  let deadline = tempDeadline.value

  // Преобразуем строку даты из формата datetime-local в формат для Laravel
  if (deadline && typeof deadline === 'string') {
    // Если строка в формате 'YYYY-MM-DDTHH:mm', преобразуем в 'YYYY-MM-DD HH:mm:ss'
    if (deadline.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
      deadline = deadline.replace('T', ' ') + ':00'
    }
    // Если строка в формате 'YYYY-MM-DD HH:mm:ss', оставляем как есть
    else if (deadline.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
      // Уже в правильном формате
    }
  }

  try {
    await updateOrderField('deadline', deadline || null)
    showDeadlineInput.value = false
    toast.show('Дедлайн обновлен успешно!')
  } catch (error) {
    console.error('Ошибка обновления дедлайна:', error)
    toast.show('Ошибка при обновлении дедлайна', 'error')
  }
}

async function clearDeadline() {
  if (!order.value) return

  try {
    await updateOrderField('deadline', null)
    showDeadlineInput.value = false
    tempDeadline.value = ''
    toast.show('Дедлайн очищен!')
  } catch (error) {
    console.error('Ошибка очистки дедлайна:', error)
    toast.show('Ошибка при очистке дедлайна', 'error')
  }
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
    await updateStage(order.value.id, 'cancelled')
    toast.show('Заказ отменён!')
    showCancelForm.value = false
    cancelReason.value = ''
    cancelReasonStatus.value = 'refused'
    await fetchAll()
    emit('updated') // Эмитим событие обновления
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ошибка при отмене заказа!'

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

// Удалено: fetchAssignments больше не используется

async function fetchAvailableUsers() {
  try {
    console.log('🔍 fetchAvailableUsers - начинаем загрузку пользователей')

    // Попробуем несколько вариантов загрузки пользователей
    let users = []

    // Вариант 1: Используем apiRequest для /users
    try {
      const { apiRequest } = await import('../../../services/api')
      const data = await apiRequest('/users')
      users = (data as any).data || data || []
    } catch (e) {
      console.error('❌ Ошибка загрузки через apiRequest:', e)
    }

    // Вариант 2: Если первый не сработал, попробуем через getAllUsersByStageRoles
    if (users.length === 0) {
      try {
        const data = await getAllUsersByStageRoles()
        console.log('🔍 getAllUsersByStageRoles ответ:', data)
        let allUsers: User[] = []

        if (data && typeof data === 'object' && !Array.isArray(data)) {
          Object.values(data).forEach((stageData: unknown) => {
            if (stageData && typeof stageData === 'object' && stageData !== null) {
              const stage = stageData as Record<string, unknown>
              if (stage.users_by_role) {
                Object.values(stage.users_by_role).forEach((roleData: unknown) => {
                  if (roleData && typeof roleData === 'object' && roleData !== null) {
                    const role = roleData as Record<string, unknown>
                    if (role.users && Array.isArray(role.users)) {
                      allUsers = allUsers.concat(role.users as User[])
                    }
                  }
                })
              }
            }
          })
        }

        // Убираем дубликаты по id
        users = allUsers.filter(
          (user, index, self) => index === self.findIndex((u) => u.id === user.id),
        )

        console.log(
          '🔍 Уникальные пользователи:',
          users.map((u) => ({ id: u.id, name: u.name, roles: u.roles })),
        )
      } catch (e) {
        console.error('❌ Ошибка загрузки через getAllUsersByStageRoles:', e)
      }
    }

    // Если ничего не сработало, оставляем пустой массив
    if (users.length === 0) {
      console.warn('⚠️ Не удалось загрузить пользователей')
    }

    availableUsers.value = users

    // Подробная информация о всех пользователях и их ролях
    users.forEach((user: User, index: number) => {})

    // Специальная проверка для гравировщиков
    const engravingUsers = users.filter((user: User) => {
      const userRoles = user.roles?.map((r: { name: string; display_name: string }) => r.name) || [
        user.role,
      ]
      return userRoles.some(
        (role: string | undefined) =>
          role === 'engraving_operator' ||
          role === 'grav' ||
          (role && role.toLowerCase().includes('гравировка')),
      )
    })
    console.log(
      '🔍 Найдены гравировщики:',
      engravingUsers.map((u: any) => ({ name: u.name, roles: u.roles || u.role })),
    )
  } catch (e) {
    console.error('❌ Ошибка загрузки пользователей:', e)
    availableUsers.value = []
  }
}

async function assignUser(userId: number) {
  if (!order.value || !order.value.id || !userId) return

  try {
    console.log(
      '🔍 assignUser - доступные пользователи:',
      currentStageUsers.value.map((u) => ({ id: u.id, name: u.name, roles: u.roles || u.role })),
    )

    // Находим пользователя
    const user = currentStageUsers.value.find((u: User) => u.id === userId)
    if (!user) {
      console.log(
        '❌ Доступные пользователи:',
        currentStageUsers.value.map((u) => ({ id: u.id, name: u.name })),
      )
      return
    }

    // Определяем текущую стадию
    const currentStage = getCurrentStage(order.value)

    // Находим данные стадии с ролями
    const stageData = stagesWithRoles.value.find((stage: Stage) => stage.name === currentStage)
    if (!stageData) {
      return
    }

    // Определяем роль пользователя для этой стадии
    const userRoles = user.roles?.map((r: { name: string; display_name: string }) => r.name) || [
      user.role,
    ]
    const stageRoles = stageData.roles?.map((role: Role) => role.name) || []

    // Находим подходящую роль, но НЕ БЛОКИРУЕМ если её нет
    const matchingRole = userRoles.find((role) => stageRoles.includes(role || ''))

    // Используем первую доступную роль пользователя или дефолтную
    const roleToAssign = matchingRole || userRoles[0] || user.role || 'unknown'

    // Создаем данные назначения с ролью пользователя
    const assignmentData = {
      user_id: userId,
      role_type: roleToAssign,
      // Возможно, API ожидает stage вместо stage_name
      stage: currentStage,
      stage_name: currentStage,
    }

    try {
      const result = await assignOrderToUser(order.value.id, assignmentData)

      selectedUserId.value = null
      await fetchAll() // Обновляем все данные, включая назначения

      toast.show('Пользователь успешно назначен', 'success')
    } catch (apiError: unknown) {
      toast.show(
        `Ошибка назначения пользователя: ${apiError instanceof Error ? apiError.message : 'Неизвестная ошибка'}`,
        'error',
      )
    }
  } catch (e) {
    toast.show('Ошибка назначения пользователя', 'error')
  }
}

async function updateAssignmentStatus(assignment: Assignment) {
  if (!assignment?.id) return
  try {
    const response = await updateOrderAssignmentStatus(assignment.id, assignment.status)

    // Проверяем, произошел ли автоматический переход стадии
    if (
      response.stage_transition &&
      response.stage_transition.from &&
      response.stage_transition.to
    ) {
      toast.show(
        `✅ ${response.stage_transition.message}: ${response.stage_transition.from} → ${response.stage_transition.to}`,
        'success',
      )
    }

    await fetchAll() // Обновляем все данные, включая назначения
    emit('updated') // Уведомляем родительский компонент об обновлении
  } catch (e) {
    toast.show('Ошибка обновления статуса', 'error')
  }
}

async function deleteAssignment(assignment: Assignment) {
  if (!assignment?.id) return
  try {
    await deleteOrderAssignment(assignment.id)
    await fetchAll() // Обновляем все данные, включая назначения
  } catch (e) {}
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
// Удалено: stageRoleMap и stageUsersByRole больше не используются

// Динамические роли - будет загружаться из API
const roles = ref<Role[]>([])

// Добавляем состояние для стадий с ролями
const stagesWithRoles = ref<Stage[]>([])

// Вспомогательная функция для получения текущей стадии
function getCurrentStage(order: Order | null): string {
  if (!order?.stage) return ''
  return typeof order.stage === 'string'
    ? order.stage
    : (order.stage as { name: string })?.name || ''
}

// Функция для получения цвета стадии для роли
function getStageColorForRole(roleName: string): string | null {
  // Ищем стадию, которая содержит эту роль
  const stageWithRole = stagesWithRoles.value.find(
    (stage: Stage) => stage.roles && stage.roles.some((role: Role) => role.name === roleName),
  )

  return stageWithRole?.color || null
}

// Отображение назначений для текущей стадии
const currentStageAssignments = computed(() => {
  if (!order.value) return []

  const currentStage = getCurrentStage(order.value)
  console.log(
    '🔍 currentStageAssignments - все назначения:',
    assignments.value.map((a) => ({
      id: a.id,
      user_name: a.user?.name,
      role_type: a.role_type,
      status: a.status,
      assigned_stages: a.assigned_stages?.map((s) => s.name) || [],
      stage_name: a.stage_name,
      order_stage: a.order_stage,
      order_id: a.order_id,
    })),
  )

  console.log(
    'currentStageAssignments debug - all assignments:',
    assignments.value.map((a) => ({
      id: a.id,
      user_name: a.user?.name,
      role_type: a.role_type,
      status: a.status,
      assigned_stages: a.assigned_stages?.map((s) => s.name) || [],
      stage_name: a.stage_name,
      order_stage: a.order_stage,
      order_id: a.order_id,
    })),
  )

  // Получаем роли для текущей стадии
  const stageData = stagesWithRoles.value.find((stage: Stage) => stage.name === currentStage)
  const stageRoles = stageData?.roles?.map((role: Role) => role.name) || []

  // Фильтруем назначения для текущей стадии
  const stageAssignments = assignments.value.filter((assignment: Assignment) => {
    // Проверяем несколько способов связи назначения со стадией:

    // 1. Через assigned_stages (если есть)
    const hasStageAssignment =
      assignment.assigned_stages &&
      assignment.assigned_stages.some((stage: Stage) => stage.name === currentStage)

    // 2. Через stage_name (новый способ)
    const hasStageName = assignment.stage_name === currentStage

    // 3. Через order_stage (если назначение привязано к заказу)
    const hasOrderStage = assignment.order_stage === currentStage

    // Проверяем, соответствует ли роль назначения текущей стадии
    const hasMatchingRole = stageRoles.includes(assignment.role_type)

    console.log('stageAssignments filter debug:', {
      assignment: assignment,
      currentStage,
      assignmentStages: assignment.assigned_stages?.map((s: Stage) => s.name) || [],
      stageName: assignment.stage_name,
      orderStage: assignment.order_stage,
      hasStageAssignment,
      hasStageName,
      hasOrderStage,
      roleType: assignment.role_type,
      stageRoles,
      hasMatchingRole,
      // Добавляем детальную информацию о назначении
      assignmentDetails: {
        id: assignment.id,
        user_id: assignment.user_id,
        user_name: assignment.user?.name,
        role_type: assignment.role_type,
        status: assignment.status,
        assigned_stages: assignment.assigned_stages,
        stage_name: assignment.stage_name,
        order_stage: assignment.order_stage,
        order_id: assignment.order_id,
      },
    })

    // Показываем назначение если есть связь со стадией И роль соответствует
    const hasStageConnection = hasStageAssignment || hasStageName || hasOrderStage

    // Если назначение было создано вручную (есть stage_name), показываем его
    // независимо от других связей - НЕ ПРОВЕРЯЕМ РОЛЬ!
    const isManualAssignment = assignment.stage_name === currentStage

    // Для ручного назначения показываем ВСЕГДА, независимо от роли
    if (isManualAssignment) {
      return true
    }

    // ИСПРАВЛЕНИЕ: Показываем назначения с подходящей ролью на всех стадиях
    // где эта роль нужна, независимо от assigned_stages
    if (hasMatchingRole) {
      console.log(
        `✅ Назначение с подходящей ролью для стадии ${currentStage}:`,
        assignment.user?.name,
      )
      return true
    }

    // Для остальных назначений проверяем все связи
    const shouldShow = hasStageConnection && hasMatchingRole
    console.log('shouldShow debug:', {
      user: assignment.user?.name,
      hasStageConnection,
      hasMatchingRole,
      shouldShow,
    })
    return shouldShow
  })

  console.log(
    '🔍 currentStageAssignments - назначения для текущей стадии:',
    stageAssignments.length,
  )
  return stageAssignments
})

// Пользователи для текущей стадии
const currentStageUsers = computed(() => {
  if (!order.value) return []

  const currentStage = getCurrentStage(order.value)

  // Получаем роли для текущей стадии
  const stageData = stagesWithRoles.value.find((stage: Stage) => stage.name === currentStage)
  const stageRoles = stageData?.roles?.map((role: Role) => role.name) || []

  // Фильтруем пользователей по ролям стадии
  const stageUsers = availableUsers.value.filter((user: User) => {
    const userRoles = user.roles?.map((role: { name: string }) => role.name) || []
    const hasMatchingRole = userRoles.some((role: string) => stageRoles.includes(role))

    console.log('stageUsers filter debug:', {
      userRoles,
      hasMatchingRole,
      stageRoles,
    })

    return hasMatchingRole
  })

  return stageUsers
})

// Функция для пользователей с ролями
const currentStageUsersWithRoles = computed(() => {
  const currentStage = getCurrentStage(order.value)
  const stageData = stagesWithRoles.value.find((stage: Stage) => stage.name === currentStage)
  const stageRoles = stageData?.roles?.map((role: Role) => role.name) || []

  const result = currentStageUsers.value.map((user: User) => {
    // Находим роль пользователя, которая соответствует текущей стадии
    const userRoles = user.roles?.map((r: { name: string; display_name: string }) => r.name) || [
      user.role,
    ]
    const matchingRole =
      userRoles.find((role) => stageRoles.includes(role || '')) ||
      userRoles[0] ||
      user.role ||
      'Неизвестная роль'

    return {
      ...user,
      displayName: `${user.name} (${getRoleLabel(matchingRole)})`,
      roleForStage: matchingRole,
    }
  })

  return result
})

// Убираем автоматический переход стадий во фронтенде - теперь это делается только на backend
// function determineInitialStage() {
//   if (!order.value || !stages.value.length) return

//   // Если автоматическое переключение отключено - не выполняем
//   if (disableAutoStageSwitch.value) {
//     return
//   }

//   const currentStage = getCurrentStage(order.value)

//   // Если заказ уже на черновике или завершен - не меняем
//   if (currentStage === 'draft' || currentStage === 'completed' || currentStage === 'cancelled') {
//     return
//   }

//   // Проверяем, есть ли назначения для текущей стадии
//   const currentStageAssignments = assignments.value.filter((assignment: Assignment) => {
//     const stageData = stagesWithRoles.value.find((s: Stage) => s.name === currentStage)
//     const stageRoles = stageData?.roles?.map((role: Role) => role.name) || []
//     const hasMatchingRole = stageRoles.includes(assignment.role_type)

//     // ИСПРАВЛЕНИЕ: Показываем назначения с подходящей ролью на всех стадиях
//     return hasMatchingRole
//   })

//   // Если на текущей стадии есть назначения - не меняем
//   if (currentStageAssignments.length > 0) {
//     return
//   }

//   // Ищем первую стадию с назначениями
//   const firstStageWithAssignments = findFirstStageWithAssignments()

//   if (firstStageWithAssignments) {
//     // Если текущая стадия не совпадает с первой стадией с назначениями
//     if (currentStage !== firstStageWithAssignments) {
//       changeStatus(firstStageWithAssignments)
//     }
//   } else {
//     // Если нет назначений ни на одной стадии - переводим на черновик
//     if (currentStage !== 'draft') {
//       changeStatus('draft')
//     }
//   }
// }

// Убираем автоматический переход стадий во фронтенде - теперь это делается только на backend
// function checkAutoAdvanceStage() {
//   if (!order.value || disableAutoStageSwitch.value) return

//   const currentStage = getCurrentStage(order.value)

//   // Пропускаем служебные стадии
//   if (currentStage === 'draft' || currentStage === 'completed' || currentStage === 'cancelled') {
//     return
//   }

//   // Получаем назначения для текущей стадии
//   const currentStageAssignments = assignments.value.filter((assignment: Assignment) => {
//     const hasStageAssignment =
//       assignment.assigned_stages &&
//       assignment.assigned_stages.some((stage: Stage) => stage.name === currentStage)

//     const stageData = stagesWithRoles.value.find((s: Stage) => s.name === currentStage)
//     const stageRoles = stageData?.roles?.map((role: Role) => role.name) || []
//     const hasMatchingRole = stageRoles.includes(assignment.role_type)

//     // ИСПРАВЛЕНИЕ: Показываем назначения с подходящей ролью на всех стадиях
//     // где эта роль нужна, независимо от assigned_stages
//     if (hasMatchingRole) {
//       return true
//     }

//     return hasStageAssignment && hasMatchingRole
//   })

//   // Если нет назначений на текущей стадии - не переходим
//     if (currentStageAssignments.length === 0) {
//       return
//     }

//   // Проверяем, все ли назначения одобрены
//   const allApproved = currentStageAssignments.every(
//     (assignment: any) => assignment.status === 'approved',
//   )

//   if (allApproved) {
//     // Ищем следующую стадию с назначениями
//     const nextStage = findNextStageWithAssignments(currentStage)

//     if (nextStage) {
//       // Показываем уведомление
//       toast.show(
//         `Все задачи на стадии "${getStatusText(currentStage)}" выполнены. Переходим на "${getStatusText(nextStage)}"`,
//         'success',
//       )

//       // Переходим на следующую стадию
//       changeStatus(nextStage)
//     } else {
//       // Если следующей стадии нет - завершаем заказ
//       toast.show(`Все задачи выполнены. Заказ завершен!`, 'success')
//       changeStatus('completed')
//     }
//   }
// }

// Функция для поиска следующей стадии с назначениями
function findNextStageWithAssignments(currentStageName: string): string | null {
  // Получаем все стадии в правильном порядке
  const orderedStages = stages.value.map((s) => s.value)

  // Находим индекс текущей стадии
  const currentIndex = orderedStages.indexOf(currentStageName)

  if (currentIndex === -1) {
    return null
  }

  // Ищем следующую стадию с назначениями
  for (let i = currentIndex + 1; i < orderedStages.length; i++) {
    const stageName = orderedStages[i]

    // Пропускаем служебные стадии
    if (stageName === 'draft' || stageName === 'completed' || stageName === 'cancelled') {
      continue
    }

    // Проверяем, есть ли назначения для этой стадии
    const hasAssignments = assignments.value.some((assignment: Assignment) => {
      const stageData = stagesWithRoles.value.find((s: Stage) => s.name === stageName)
      const stageRoles = stageData?.roles?.map((role: Role) => role.name) || []
      const hasMatchingRole = stageRoles.includes(assignment.role_type)

      // ИСПРАВЛЕНИЕ: Показываем назначения с подходящей ролью на всех стадиях
      // где эта роль нужна, независимо от assigned_stages
      return hasMatchingRole
    })

    if (hasAssignments) {
      return stageName
    }
  }

  return null
}

// Функция для поиска первой стадии с назначениями
function findFirstStageWithAssignments(): string | null {
  // Проходим по стадиям в правильном порядке
  for (const stage of stages.value) {
    const stageName = stage.value

    // Пропускаем служебные стадии
    if (stageName === 'draft' || stageName === 'completed' || stageName === 'cancelled') {
      continue
    }

    // Проверяем, есть ли назначения для этой стадии
    const hasAssignments = assignments.value.some((assignment: Assignment) => {
      const stageData = stagesWithRoles.value.find((s: Stage) => s.name === stageName)
      const stageRoles = stageData?.roles?.map((role: Role) => role.name) || []
      const hasMatchingRole = stageRoles.includes(assignment.role_type)

      return hasMatchingRole
    })

    if (hasAssignments) {
      return stageName
    }
  }

  return null
}

// Функция для получения имени того, кто назначил
function getAssignedByName(assignedBy: any): string {
  if (!assignedBy) return '—'

  // Если это объект с именем
  if (typeof assignedBy === 'object' && assignedBy.name) {
    return assignedBy.name
  }

  // Если это ID, попробуем найти пользователя в доступных пользователях
  if (typeof assignedBy === 'number' || typeof assignedBy === 'string') {
    const user = availableUsers.value.find((u: any) => u.id == assignedBy)
    if (user && user.name) {
      return user.name
    }
  }

  // Если это строка (возможно имя)
  if (typeof assignedBy === 'string') {
    return assignedBy
  }

  return '—'
}

// Функция для получения текста ролей
function getCurrentStageRolesText() {
  if (!order.value) return 'Все сотрудники'

  const currentStage = getCurrentStage(order.value)
  const stageData = stagesWithRoles.value.find((stage: any) => stage.name === currentStage)
  const stageRoles = stageData?.roles || []

  if (stageRoles.length === 0) {
    return 'Нет доступных ролей'
  }

  const roleLabels = stageRoles.map((role: any) => getRoleLabel(role.name)).join(', ')
  return roleLabels
}

let pollingInterval: ReturnType<typeof setInterval> | null = null

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

// Убираем автоматический переход стадий во фронтенде - теперь это делается только на backend
// watch(
//   () => assignments.value,
//   () => {
//     checkAutoAdvanceStage()
//   },
//   { deep: true },
// )

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

// Функции для работы с контактами клиента
function getContactTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    phone: 'Телефон',
    email: 'Email',
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    other: 'Другое',
  }
  return labels[type] || type
}

function callPhone(phone: string) {
  window.open(`tel:${phone}`, '_blank')
}

function sendEmail(email: string) {
  window.open(`mailto:${email}`, '_blank')
}

function openTelegram(username: string) {
  // Убираем @ если есть
  const cleanUsername = username.replace('@', '')
  window.open(`https://t.me/${cleanUsername}`, '_blank')
}

function openWhatsApp(phone: string) {
  // Убираем все кроме цифр
  const cleanPhone = phone.replace(/\D/g, '')
  window.open(`https://wa.me/${cleanPhone}`, '_blank')
}

function copyToClipboard(text: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      toast.show('Скопировано в буфер обмена', 'success')
    })
    .catch(() => {
      toast.show('Не удалось скопировать', 'error')
    })
}
</script>
