<template>
  <Modal @close="$emit('close')" :class="`orderMode-${orderMode}`">
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center"
        >
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-900">
            {{ order ? 'Редактировать заказ' : 'Новый заказ' }}
          </h2>
          <p class="text-sm text-gray-500 mt-1">
            {{ order ? 'Обновите информацию о заказе' : 'Создайте новый заказ в системе' }}
          </p>
        </div>
      </div>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-6 pb-4">
      <!-- Переключатель режима заказа -->
      <div v-if="!order" class="bg-gray-50 rounded-xl p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Тип заказа
        </h3>
        <div class="grid grid-cols-2 gap-4">
          <label
            class="flex items-center p-4 bg-white rounded-lg border border-gray-200 transition-all duration-200 cursor-pointer hover:bg-gray-50 hover:border-gray-300"
            :class="orderMode === 'single' ? 'border-blue-500 bg-blue-50 shadow-sm' : ''"
            @click="orderMode = 'single'"
          >
            <div
              class="mr-3 w-4 h-4 border-2 rounded-full flex items-center justify-center transition-colors"
              :class="
                orderMode === 'single' ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'
              "
            >
              <div v-if="orderMode === 'single'" class="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div>
              <div class="font-medium text-gray-900">Одиночный заказ</div>
              <div class="text-sm text-gray-500">Создать один заказ с продуктом</div>
            </div>
          </label>

          <label
            class="flex items-center p-4 bg-white rounded-lg border border-gray-200 transition-all duration-200 cursor-pointer hover:bg-gray-50 hover:border-gray-300"
            :class="orderMode === 'bulk' ? 'border-blue-500 bg-blue-50 shadow-sm' : ''"
            @click="orderMode = 'bulk'"
          >
            <div
              class="mr-3 w-4 h-4 border-2 rounded-full flex items-center justify-center transition-colors"
              :class="
                orderMode === 'bulk' ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'
              "
            >
              <div v-if="orderMode === 'bulk'" class="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div>
              <div class="font-medium text-gray-900">Массовый заказ</div>
              <div class="text-sm text-gray-500">Создать несколько заказов с проектом</div>
            </div>
          </label>
        </div>
      </div>

      <!-- Основная информация о заказе -->
      <div class="space-y-6">
        <!-- Клиент -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Клиент <span class="text-red-500">*</span>
          </label>
          <div class="flex gap-2">
            <Vue3Select
              v-model="form.client_id"
              :options="clients"
              label="name"
              :reduce="(client) => client.id"
              placeholder="Выберите клиента"
              :clearable="true"
              :searchable="true"
              :error="errors.client_id"
              required
              class="flex-1"
            />
            <UIButton
              type="button"
              variant="secondary"
              size="sm"
              @click="showClientModal = true"
              title="Создать нового клиента"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </UIButton>
          </div>
          <div v-if="errors.client_id" class="text-red-600 text-sm mt-1">
            {{ errors.client_id }}
          </div>
        </div>

        <!-- Проект -->
        <div v-if="orderMode === 'single'">
          <label class="block text-sm font-medium text-gray-700 mb-2"> Проект </label>
          <div class="flex gap-2">
            <Vue3Select
              v-model="form.project_id"
              :options="projects"
              label="title"
              :reduce="(project) => project.id"
              placeholder="Выберите проект (необязательно)"
              :clearable="true"
              :searchable="true"
              :error="errors.project_id"
              class="flex-1"
            />
            <UIButton
              type="button"
              variant="secondary"
              size="sm"
              @click="showProjectModal = true"
              title="Создать новый проект"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </UIButton>
          </div>
          <div v-if="errors.project_id" class="text-red-600 text-sm mt-1">
            {{ errors.project_id }}
          </div>
        </div>

        <!-- Проект для массового заказа -->
        <div v-if="orderMode === 'bulk'">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Проект <span class="text-red-500">*</span>
          </label>
          <div class="flex gap-2">
            <Vue3Select
              v-model="form.project_id"
              :options="projects"
              label="title"
              :reduce="(project) => project.id"
              placeholder="Выберите существующий проект"
              :clearable="true"
              :searchable="true"
              :error="errors.project_id"
              class="flex-1"
              @update:model-value="onProjectSelect"
            />
            <UIButton
              type="button"
              variant="secondary"
              size="sm"
              @click="showProjectModal = true"
              title="Создать новый проект"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </UIButton>
          </div>
          <div class="mt-2">
            <div class="text-sm text-gray-600 mb-2">Или введите название проекта:</div>
            <UIInput
              v-model="bulkProjectTitle"
              placeholder="Название проекта для массового заказа"
              :error="errors.bulk_project_title"
              @input="onProjectTitleInput"
            />
          </div>
          <div v-if="errors.project_id" class="text-red-600 text-sm mt-1">
            {{ errors.project_id }}
          </div>
          <div v-if="errors.bulk_project_title" class="text-red-600 text-sm mt-1">
            {{ errors.bulk_project_title }}
          </div>
        </div>

        <!-- Продукты для массового заказа -->
        <div v-if="orderMode === 'bulk'">
          <label class="block text-sm font-medium text-gray-700 mb-2"> Продукты для заказа </label>

          <!-- Список добавленных продуктов -->
          <div v-if="bulkOrders.length > 0" class="space-y-3 mb-4">
            <div
              v-for="(order, index) in bulkOrders"
              :key="index"
              class="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-medium text-gray-900">Заказ {{ index + 1 }}</h4>
                <UIButton
                  type="button"
                  variant="danger"
                  size="sm"
                  @click="removeBulkOrder(index)"
                  title="Удалить заказ"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </UIButton>
              </div>

              <div class="grid grid-cols-4 gap-3">
                <div>
                  <label class="block text-sm text-gray-600 mb-1">Продукт</label>
                  <Vue3Select
                    v-model="order.product_id"
                    :options="products"
                    label="name"
                    :reduce="(product) => product.id"
                    placeholder="Выберите продукт"
                    :clearable="true"
                    :searchable="true"
                    @update:model-value="() => onBulkOrderProductChange(index)"
                  />
                </div>
                <div>
                  <label class="block text-sm text-gray-600 mb-1">Количество</label>
                  <UIInput
                    v-model.number="order.quantity"
                    type="number"
                    min="1"
                    placeholder="Количество"
                  />
                </div>
                <div>
                  <label class="block text-sm text-gray-600 mb-1">Цена</label>
                  <UIInput
                    v-model.number="order.price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Цена"
                  />
                </div>
                <div>
                  <label class="block text-sm text-gray-600 mb-1">Дедлайн</label>
                  <UIInput v-model="order.deadline" type="datetime-local" placeholder="Дедлайн" />
                </div>
              </div>

              <!-- Стадии для этого заказа -->
              <div v-if="order.product_id && workingStages.length > 0" class="mt-4 space-y-3">
                <div class="flex items-center justify-between">
                  <label class="block text-sm font-medium text-gray-700">
                    Стадии производства <span class="text-red-500">*</span>
                  </label>
                  <div class="flex gap-2">
                    <UIButton
                      type="button"
                      variant="secondary"
                      size="sm"
                      @click="selectAllStagesForBulkOrder(index)"
                      :disabled="order.selected_stages.length === workingStages.length"
                    >
                      Выбрать все
                    </UIButton>
                    <UIButton
                      type="button"
                      variant="secondary"
                      size="sm"
                      @click="clearAllStagesForBulkOrder(index)"
                      :disabled="order.selected_stages.length === 0"
                    >
                      Очистить
                    </UIButton>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <label
                    v-for="stage in workingStages"
                    :key="stage.id"
                    class="flex items-center p-2 bg-white rounded border border-gray-200 transition-all duration-200 cursor-pointer hover:bg-gray-50 hover:border-gray-300"
                    :class="
                      order.selected_stages.includes(stage.id) ? 'border-blue-500 bg-blue-50' : ''
                    "
                    @click="toggleBulkOrderStage(index, stage.id)"
                  >
                    <div
                      class="mr-2 w-4 h-4 border-2 rounded flex items-center justify-center transition-colors"
                      :class="
                        order.selected_stages.includes(stage.id)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 bg-white'
                      "
                    >
                      <svg
                        v-if="order.selected_stages.includes(stage.id)"
                        class="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </div>
                    <div class="flex items-center">
                      <div
                        class="w-3 h-3 rounded-full mr-2"
                        :style="{ backgroundColor: stage.color }"
                      ></div>
                      <span class="text-sm font-medium text-gray-900">{{
                        stage.display_name
                      }}</span>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Назначения для этого заказа -->
              <div v-if="order.selected_stages.length > 0" class="mt-4 space-y-4">
                <div
                  v-for="stage in getSelectedStageObjectsForBulkOrder(index)"
                  :key="stage.id"
                  class="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
                >
                  <div class="flex items-center mb-3">
                    <div
                      class="w-4 h-4 rounded-full mr-3"
                      :style="{ backgroundColor: stage.color }"
                    ></div>
                    <h5 class="text-sm font-semibold text-gray-900">{{ stage.display_name }}</h5>
                  </div>

                  <!-- Роли для этой стадии -->
                  <div v-if="stage.roles && stage.roles.length > 0" class="space-y-4">
                    <div v-for="role in stage.roles" :key="role.id" class="space-y-3">
                      <div class="flex items-center justify-between">
                        <label class="block text-sm font-medium text-gray-700">
                          {{ role.display_name || getRoleDisplayName(role.name) }}
                          <span class="text-xs text-gray-500 ml-1">({{ role.name }})</span>
                        </label>
                        <UIButton
                          type="button"
                          variant="secondary"
                          size="sm"
                          @click="addBulkOrderAssignment(index, stage.id, role.name)"
                        >
                          Добавить
                        </UIButton>
                      </div>

                      <div
                        v-if="
                          getBulkOrderAssignmentsForStageRole(index, stage.id, role.name).length ===
                          0
                        "
                        class="text-sm text-gray-500 italic py-2 px-3 bg-gray-50 rounded border border-gray-100"
                      >
                        Назначения не добавлены
                      </div>

                      <div v-else class="space-y-2">
                        <div
                          v-for="(
                            assignment, assignmentIndex
                          ) in getBulkOrderAssignmentsForStageRole(index, stage.id, role.name)"
                          :key="assignment.id || assignmentIndex"
                          class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div class="flex-1 min-w-0">
                            <Vue3Select
                              v-model="assignment.user"
                              :options="getUsersForRole(role.name)"
                              label="name"
                              placeholder="Выберите пользователя"
                              :clearable="true"
                              :searchable="true"
                              class="text-sm"
                              @update:model-value="
                                (val) =>
                                  handleBulkOrderUserSelect(
                                    val,
                                    assignment,
                                    index,
                                    stage.id,
                                    role.name,
                                    assignmentIndex,
                                  )
                              "
                            />
                          </div>

                          <UIButton
                            type="button"
                            variant="danger"
                            size="sm"
                            @click="
                              removeBulkOrderAssignment(index, stage.id, role.name, assignmentIndex)
                            "
                          >
                            Удалить
                          </UIButton>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    v-else
                    class="text-sm text-gray-500 py-2 px-3 bg-gray-50 rounded border border-gray-100"
                  >
                    Для этой стадии не настроены роли
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Кнопка добавления нового заказа -->
          <UIButton
            type="button"
            variant="secondary"
            size="sm"
            @click="addBulkOrder"
            class="w-full"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Добавить продукт
          </UIButton>

          <div v-if="errors.bulk_orders" class="text-red-600 text-sm mt-1">
            {{ errors.bulk_orders }}
          </div>
        </div>

        <div v-if="orderMode === 'single' || order">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Продукт <span class="text-red-500">*</span>
          </label>
          <Vue3Select
            v-model="form.product_id"
            :options="products"
            label="name"
            :reduce="(product) => product.id"
            placeholder="Выберите продукт"
            :clearable="true"
            :searchable="true"
            :error="errors.product_id"
            required
          />
          <div v-if="errors.product_id" class="text-red-600 text-sm mt-1">
            {{ errors.product_id }}
          </div>
        </div>

        <!-- Количество и цена в одной строке (только для одиночного заказа) -->
        <div v-if="orderMode === 'single' || order" class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Количество <span class="text-red-500">*</span>
            </label>
            <UIInput
              v-model.number="form.quantity"
              type="number"
              min="1"
              placeholder="Введите количество"
              :error="errors.quantity"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Цена</label>
            <UIInput
              v-model.number="form.price"
              type="number"
              step="0.01"
              min="0"
              placeholder="Введите цену"
            />
          </div>
        </div>

        <!-- Дедлайн (только для одиночного заказа) -->
        <div v-if="orderMode === 'single' || order">
          <label class="block text-sm font-medium text-gray-700 mb-2">Дедлайн</label>
          <UIInput
            v-model="form.deadline"
            type="datetime-local"
            placeholder="Выберите дату и время"
          />
        </div>
      </div>

      <!-- Стадии производства (только если выбран продукт) -->
      <div
        v-if="(orderMode === 'single' || order) && form.product_id && workingStages.length > 0"
        class="relative"
      >
        <div
          v-if="stagesLoading"
          class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg z-10"
        >
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
        <div class="flex items-center justify-between mb-3">
          <label class="block text-sm font-medium text-gray-700">
            Стадии производства <span class="text-red-500">*</span>
          </label>
          <div class="flex gap-2">
            <UIButton
              type="button"
              variant="secondary"
              size="sm"
              @click="selectAllStages"
              :disabled="selectedOrderStages.length === workingStages.length"
            >
              Выбрать все
            </UIButton>
            <UIButton
              type="button"
              variant="secondary"
              size="sm"
              @click="clearAllStages"
              :disabled="selectedOrderStages.length === 0"
            >
              Очистить
            </UIButton>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <label
            v-for="stage in workingStages"
            :key="stage.id"
            class="flex items-center p-3 bg-white rounded-lg border border-gray-200 transition-all duration-200 cursor-pointer hover:bg-gray-50 hover:border-gray-300 transform hover:scale-[1.02]"
            :class="
              selectedOrderStages.includes(stage.id)
                ? 'border-blue-500 bg-blue-50 shadow-sm scale-[1.02]'
                : ''
            "
            @click="toggleOrderStage(stage.id)"
          >
            <div
              class="mr-2 w-4 h-4 border-2 rounded flex items-center justify-center transition-colors"
              :class="
                selectedOrderStages.includes(stage.id)
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 bg-white'
              "
            >
              <svg
                v-if="selectedOrderStages.includes(stage.id)"
                class="w-3 h-3 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="flex items-center">
              <div
                class="w-3 h-3 rounded-full mr-2"
                :style="{ backgroundColor: stage.color }"
              ></div>
              <span class="font-medium text-gray-900">{{ stage.display_name }}</span>
            </div>
          </label>
        </div>

        <p v-if="errors.stages" class="text-sm text-red-600 mt-1">
          {{ errors.stages }}
        </p>
      </div>

      <!-- Назначения исполнителей по стадиям (только если выбраны стадии) -->
      <div
        v-if="(orderMode === 'single' || order) && selectedOrderStages.length > 0"
        class="space-y-6"
      >
        <div v-for="stage in selectedOrderStageObjects" :key="stage.id" class="space-y-4">
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex items-center mb-3">
              <div
                class="w-4 h-4 rounded-full mr-2"
                :style="{ backgroundColor: stage.color }"
              ></div>
              <h4 class="text-md font-medium text-gray-900">{{ stage.display_name }}</h4>
            </div>

            <!-- Роли для этой стадии -->
            <div v-if="stage.roles && stage.roles.length > 0" class="space-y-3">
              <div v-for="role in stage.roles" :key="role.id" class="space-y-2">
                <label class="block text-sm font-medium text-gray-700">
                  {{ role.display_name || getRoleDisplayName(role.name) }}
                  <span class="text-xs text-gray-500">({{ role.name }})</span>
                </label>
                <!-- Простой компонент назначений -->
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-700">Назначенные пользователи</span>
                    <UIButton
                      type="button"
                      variant="secondary"
                      size="sm"
                      @click="addAssignment(stage.id, role.name)"
                    >
                      Добавить
                    </UIButton>
                  </div>

                  <div
                    v-if="getAssignmentsForStageRole(stage.id, role.name).length === 0"
                    class="text-sm text-gray-500 italic py-2"
                  >
                    Назначения не добавлены
                  </div>

                  <div v-else class="space-y-2">
                    <div
                      v-for="(assignment, index) in getAssignmentsForStageRole(stage.id, role.name)"
                      :key="assignment.id || index"
                      class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div class="flex-1">
                        <Vue3Select
                          v-model="assignment.user"
                          :options="getUsersForRole(role.name)"
                          label="name"
                          placeholder="Выберите пользователя"
                          :clearable="true"
                          :searchable="true"
                          @update:model-value="
                            (val) => handleUserSelect(val, assignment, stage.id, role.name, index)
                          "
                        />
                      </div>

                      <UIButton
                        type="button"
                        variant="danger"
                        size="sm"
                        @click="removeAssignment(stage.id, role.name, index)"
                      >
                        Удалить
                      </UIButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-sm text-gray-500">Для этой стадии не настроены роли</div>
          </div>
        </div>
      </div>

      <!-- Кнопки действий -->
      <div class="flex gap-3 pt-4 border-t border-gray-200 mt-6">
        <UIButton type="submit" :loading="loading" class="flex-1" :disabled="!isFormValid">
          {{
            order ? 'Сохранить' : orderMode === 'bulk' ? 'Создать массовый заказ' : 'Создать заказ'
          }}
        </UIButton>

        <UIButton v-if="order" type="button" variant="danger" @click="handleDelete">
          Удалить
        </UIButton>

        <UIButton type="button" variant="secondary" @click="$emit('close')"> Отмена </UIButton>
      </div>
    </form>

    <!-- Модальное окно для создания клиента -->
    <ClientFormModal
      v-if="showClientModal"
      @close="showClientModal = false"
      @submit="onClientCreated"
    />

    <!-- Модальное окно для создания проекта -->
    <ProjectFormModal
      v-if="showProjectModal"
      @close="showProjectModal = false"
      @submit="onProjectCreated"
    />
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import Modal from '../../ui/Modal.vue'
import UIInput from '../../ui/UIInput.vue'
import UIButton from '../../ui/UIButton.vue'
import Vue3Select from 'vue3-select'
import 'vue3-select/dist/vue3-select.css'
// import AssignmentManager from '../../products/ProductList/AssignmentManager.vue'
import type { Order, OrderForm, OrderAssignmentCreate } from '../../../types/order'
import type { Product } from '../../../types/product'
import type { Stage } from '../../../types/stage'
import {
  getAllClients,
  getAllProducts,
  getAllProjects,
  getAllStages,
  getAllUsersByStageRoles,
  getProductAssignments,
  createProject,
  getUsersByRole,
  getByRole,
} from '../../../services/api'
import type { ProductAssignment } from '../../../types/product'
import type { User } from '../../../types/user'
import orderController from '../../../controllers/orderControllerInstance'
import { toast } from '../../../stores/toast'
import ClientFormModal from '../../clients/ClientList/ClientFormModal.vue'
import ProjectFormModal from '../../projects/ProjectList/ProjectFormModal.vue'

const props = defineProps<{ order?: Order | null }>()
const emit = defineEmits(['close', 'submit', 'delete'])

const { create, update, remove } = orderController

const loading = ref(false)
const stagesLoading = ref(false)
const clients = ref([])
const products = ref<Product[]>([])
const projects = ref([])
const availableStages = ref<Stage[]>([])
const selectedOrderStages = ref<number[]>([])

// Новый режим заказа
const orderMode = ref<'single' | 'bulk'>('single')

const showClientModal = ref(false)
const showProjectModal = ref(false)

// Переменная для названия проекта в массовом заказе
const bulkProjectTitle = ref('')

// Массив для массовых заказов
const bulkOrders = ref<
  Array<{
    product_id: number | null
    quantity: number
    price: number | null
    deadline: string | null
    selected_stages: number[]
    assignments: Record<number, Record<string, ProductAssignment[]>>
  }>
>([])

const form = reactive<OrderForm>({
  client_id: 0,
  project_id: undefined,
  product_id: undefined,
  quantity: 1,
  price: null,
  deadline: getTodayDateTime(),
})

const errors = reactive({
  client_id: '',
  project_id: '',
  product_id: '',
  quantity: '',
  price: '',
  deadline: '',
  stages: '',
  bulk_project_title: '',
  bulk_orders: '',
})

// Пользователи по ролям (динамическая структура)
const allUsers = reactive<Record<string, User[]>>({})

// Структура для хранения назначений по стадиям и ролям
const stageAssignments = reactive<Record<number, Record<string, ProductAssignment[]>>>({})

// Вычисляемое свойство для валидации формы
const isFormValid = computed(() => {
  if (orderMode.value === 'bulk') {
    // Для массового заказа нужны клиент, (проект ИЛИ название проекта) и хотя бы один продукт
    const hasExistingProject = form.project_id && form.project_id > 0
    const hasProjectTitle = bulkProjectTitle.value.trim() !== ''
    const hasProject = hasExistingProject || hasProjectTitle
    const hasProducts =
      bulkOrders.value.length > 0 &&
      bulkOrders.value.every((order) => order.product_id !== null && order.quantity > 0)
    return form.client_id > 0 && hasProject && hasProducts
  } else {
    // Для одиночного заказа нужны клиент, продукт, количество и стадии (проект необязателен)
    return (
      form.client_id > 0 &&
      form.product_id !== null &&
      form.quantity > 0 &&
      selectedOrderStages.value.length > 0
    )
  }
})

// Выбранный продукт для отображения назначений
const selectedProduct = computed(() => {
  if (!Array.isArray(products.value)) {
    console.warn('⚠️ products.value is not an array:', products.value)
    return null
  }
  const product = products.value.find((p) => p.id === form.product_id) || null

  return product
})

// Вычисляемое свойство для получения только рабочих стадий (исключаем служебные)
const workingStages = computed(() => {
  const serviceStages = ['draft', 'completed', 'cancelled', 'final']
  const filtered = availableStages.value.filter((stage) => !serviceStages.includes(stage.name))

  return filtered
})

// Вычисляемое свойство для получения объектов выбранных стадий заказа
const selectedOrderStageObjects = computed(() => {
  const result = availableStages.value
    .filter((stage) => selectedOrderStages.value.includes(stage.id))
    .filter((stage) => stage.roles && stage.roles.length > 0) // Показываем только стадии с ролями

  return result
})

// Очищаем несуществующие стадии из выбранных
watch(
  selectedOrderStages,
  (newStages) => {
    const validStageIds = workingStages.value.map((stage) => stage.id)
    const invalidStages = newStages.filter((id) => !validStageIds.includes(id))

    if (invalidStages.length > 0) {
      console.warn('⚠️ Removing invalid stage IDs:', invalidStages)
      selectedOrderStages.value = newStages.filter((id) => validStageIds.includes(id))
    }
  },
  { immediate: true },
)

// Функции для работы с назначениями по стадиям
function getAssignmentsForStageRole(stageId: number, roleName: string): ProductAssignment[] {
  if (!stageAssignments[stageId]) {
    stageAssignments[stageId] = {}
  }
  if (!stageAssignments[stageId][roleName]) {
    stageAssignments[stageId][roleName] = []
  }
  const assignments = stageAssignments[stageId][roleName]
  return Array.isArray(assignments) ? assignments : []
}

function updateAssignmentsForStageRole(
  stageId: number,
  roleName: string,
  assignments: ProductAssignment[],
) {
  if (!stageAssignments[stageId]) {
    stageAssignments[stageId] = {}
  }

  stageAssignments[stageId][roleName] = assignments
}

function getUsersForRole(roleName: string): User[] {
  const users = allUsers[roleName] || []
  return users
}

function getErrorsForStageRole(stageId: number, roleName: string): string[] {
  // Здесь можно добавить валидацию для конкретных стадий и ролей
  return []
}

// Функции для работы с назначениями
function addAssignment(stageId: number, roleName: string) {
  const newAssignment: ProductAssignment = {
    id: 0, // Временный ID, будет заменен сервером
    role_type: roleName,
    user: null,
    user_id: 0,
  }

  const currentAssignments = getAssignmentsForStageRole(stageId, roleName)
  const updatedAssignments = [...currentAssignments, newAssignment]
  updateAssignmentsForStageRole(stageId, roleName, updatedAssignments)
}

function removeAssignment(stageId: number, roleName: string, index: number) {
  const currentAssignments = getAssignmentsForStageRole(stageId, roleName)
  const updatedAssignments = currentAssignments.filter((_, i) => i !== index)
  updateAssignmentsForStageRole(stageId, roleName, updatedAssignments)
}

function handleUserSelect(
  val: User | undefined,
  assignment: ProductAssignment,
  stageId: number,
  roleName: string,
  index: number,
): void {
  const currentAssignments = getAssignmentsForStageRole(stageId, roleName)
  const updatedAssignments = [...currentAssignments]

  if (val) {
    updatedAssignments[index] = {
      ...assignment,
      user: val,
      user_id: val.id,
    }
  } else {
    updatedAssignments[index] = {
      ...assignment,
      user: null,
      user_id: 0,
    }
  }

  updateAssignmentsForStageRole(stageId, roleName, updatedAssignments)
}

function getRoleDisplayName(roleName: string): string {
  // Автоматически создаем красивое название из имени роли
  return (
    roleName
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') + 'ы'
  )
}

function toggleOrderStage(stageId: number) {
  try {
    // Проверяем, что стадия существует в доступных стадиях
    const stageExists = workingStages.value.some((stage) => stage.id === stageId)
    if (!stageExists) {
      return
    }

    const index = selectedOrderStages.value.indexOf(stageId)
    if (index > -1) {
      // Удаляем стадию из выбранных
      selectedOrderStages.value.splice(index, 1)

      // Очищаем назначения для этой стадии
      if (stageAssignments[stageId]) {
        delete stageAssignments[stageId]
      }
    } else {
      // Добавляем стадию в выбранные
      selectedOrderStages.value.push(stageId)

      // Инициализируем пустые назначения для новой стадии
      if (!stageAssignments[stageId]) {
        stageAssignments[stageId] = {}
      }
    }

    // Принудительно обновляем реактивность
    selectedOrderStages.value = [...selectedOrderStages.value]
  } catch (error) {
    console.error('❌ Error toggling order stage:', error)
  }
}

function selectAllStages() {
  try {
    selectedOrderStages.value = workingStages.value.map((stage) => stage.id)

    // Инициализируем назначения для всех стадий
    workingStages.value.forEach((stage) => {
      if (!stageAssignments[stage.id]) {
        stageAssignments[stage.id] = {}
      }
    })

    // Принудительно обновляем реактивность
    selectedOrderStages.value = [...selectedOrderStages.value]
  } catch (error) {
    console.error('❌ Error selecting all order stages:', error)
  }
}

function clearAllStages() {
  try {
    selectedOrderStages.value = []

    // Очищаем все назначения
    if (stageAssignments && typeof stageAssignments === 'object') {
      Object.keys(stageAssignments).forEach((key) => {
        delete stageAssignments[parseInt(key)]
      })
    }

    // Принудительно обновляем реактивность
    selectedOrderStages.value = [...selectedOrderStages.value]
  } catch (error) {
    console.error('❌ Error clearing all order stages:', error)
  }
}

async function onProductChange(productId: number | null) {
  try {
    form.product_id = productId || undefined
    selectedOrderStages.value = [] // Сбрасываем выбранные стадии

    // Очищаем назначения
    if (stageAssignments && typeof stageAssignments === 'object') {
      Object.keys(stageAssignments).forEach((key) => {
        delete stageAssignments[parseInt(key)]
      })
    }

    // Если есть доступные стадии и выбран продукт
    if (productId && selectedProduct.value?.available_stages) {
      stagesLoading.value = true

      try {
        // Загружаем назначения продукта для автоматического подтягивания

        const productAssignmentsResponse = await getProductAssignments(productId)
        console.log('📋 Product assignments response:', productAssignmentsResponse)

        if (
          productAssignmentsResponse &&
          productAssignmentsResponse.assignments &&
          Array.isArray(productAssignmentsResponse.assignments)
        ) {
          console.log(
            '📋 Found assignments in response:',
            productAssignmentsResponse.assignments.length,
          )

          // Группируем назначения продукта по ролям (без stage_id)
          const productAssignmentsByRole: Record<string, ProductAssignment[]> = {}

          productAssignmentsResponse.assignments.forEach((assignment: any) => {
            const roleType = assignment.role_type

            console.log(
              `📋 Processing assignment: role ${roleType}, user ${assignment.user?.name || 'unknown'}`,
            )

            if (!productAssignmentsByRole[roleType]) {
              productAssignmentsByRole[roleType] = []
            }

            productAssignmentsByRole[roleType].push({
              id: assignment.id,
              user_id: assignment.user_id,
              role_type: assignment.role_type,
              user: assignment.user,
            })
          })

          console.log('📋 Product assignments by role:', productAssignmentsByRole)

          // Выбираем все доступные стадии продукта по умолчанию
          if (
            selectedProduct.value &&
            selectedProduct.value.available_stages &&
            Array.isArray(selectedProduct.value.available_stages)
          ) {
            selectedOrderStages.value = selectedProduct.value.available_stages.map(
              (stage) => stage.id,
            )
            console.log('✅ Selected stages for order:', selectedOrderStages.value)
          } else {
            console.warn('⚠️ No available stages found for product, using empty selection')
            selectedOrderStages.value = []
          }

          // Копируем назначения продукта в заказ для каждой стадии
          if (productAssignmentsByRole && typeof productAssignmentsByRole === 'object') {
            Object.keys(productAssignmentsByRole).forEach((roleType) => {
              const assignments = productAssignmentsByRole[roleType]
              if (Array.isArray(assignments)) {
                console.log(`📋 Copying ${assignments.length} assignments for role ${roleType}`)

                // Находим стадии, которые используют эту роль
                const stagesWithRole = availableStages.value.filter((stage) => {
                  // Проверяем, есть ли у стадии эта роль
                  return stage.roles && stage.roles.some((role: any) => role.name === roleType)
                })

                // Копируем назначения для каждой стадии с этой ролью
                stagesWithRole.forEach((stage) => {
                  updateAssignmentsForStageRole(
                    stage.id,
                    roleType,
                    [...assignments], // Копируем массив
                  )
                })
              }
            })
          }

          console.log('✅ Product assignments copied to order')
          console.log('📋 Final stageAssignments:', stageAssignments)
        } else {
          console.warn('⚠️ No assignments found in product response or invalid format')
          console.log('📋 Response structure:', productAssignmentsResponse)

          // Если нет назначений, все равно выбираем стадии продукта
          if (
            selectedProduct.value &&
            selectedProduct.value.available_stages &&
            Array.isArray(selectedProduct.value.available_stages)
          ) {
            selectedOrderStages.value = selectedProduct.value.available_stages.map(
              (stage) => stage.id,
            )
            console.log('✅ Selected stages for order (no assignments):', selectedOrderStages.value)
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not load product assignments:', error)
        // Продолжаем без назначений продукта, но выбираем стадии
        if (
          selectedProduct.value &&
          selectedProduct.value.available_stages &&
          Array.isArray(selectedProduct.value.available_stages)
        ) {
          selectedOrderStages.value = selectedProduct.value.available_stages.map(
            (stage) => stage.id,
          )
          console.log('✅ Selected stages for order (error fallback):', selectedOrderStages.value)
        }
      } finally {
        stagesLoading.value = false
      }
    } else {
      console.log('⚠️ No product selected or no available stages')
    }

    console.log('🔄 ===== PRODUCT CHANGE FINISHED =====')
    console.log('🔄 Final form.product_id:', form.product_id)
    console.log('🔄 Final selectedOrderStages:', selectedOrderStages.value)
    console.log('🔄 Final stageAssignments:', stageAssignments)
  } catch (error) {
    console.error('❌ Error in onProductChange:', error)
    stagesLoading.value = false
  }
}

onMounted(async () => {
  try {
    console.log('🚀 OrderFormModal mounted, loading data...')

    // Загружаем стадии и собираем все роли
    const stagesResult = await getAllStages().catch((error) => {
      console.error('❌ Error loading stages:', error)
      return { data: [] }
    })

    // Обрабатываем данные стадий
    if (Array.isArray(stagesResult)) {
      availableStages.value = stagesResult
    } else if (
      stagesResult &&
      typeof stagesResult === 'object' &&
      'data' in stagesResult &&
      Array.isArray((stagesResult as any).data)
    ) {
      availableStages.value = (stagesResult as any).data
    } else {
      console.warn('⚠️ Invalid stages data format:', stagesResult)
      availableStages.value = []
    }

    // Собираем все роли из стадий
    const allRoles = new Set<string>()
    availableStages.value.forEach((stage) => {
      if (stage.roles) {
        stage.roles.forEach((role) => {
          allRoles.add(role.name)
        })
      }
    })

    console.log('🔍 Found roles from stages:', Array.from(allRoles))

    // Загружаем пользователей по ролям стадий и альтернативные источники
    let usersByStageRoles, roleUsersData
    try {
      ;[usersByStageRoles, ...roleUsersData] = await Promise.all([
        getAllUsersByStageRoles(),
        // Динамическая загрузка пользователей по всем ролям
        ...Array.from(allRoles).map((roleName) =>
          getUsersByRole(roleName)
            .then((result) => {
              console.log(`✅ Successfully loaded ${roleName} users via getUsersByRole:`, result)
              return result
            })
            .catch((error) => {
              console.error(`❌ Error loading ${roleName} users via getUsersByRole:`, error)
              // Пробуем альтернативный метод
              return getByRole(roleName)
                .then((result) => {
                  console.log(`✅ Successfully loaded ${roleName} users via getByRole:`, result)
                  return result
                })
                .catch((error2) => {
                  console.error(`❌ Error loading ${roleName} users via getByRole:`, error2)
                  return { data: [], roleName }
                })
            }),
        ),
      ])
    } catch (error) {
      console.error('❌ Failed to load users data:', error)
      usersByStageRoles = {}
      roleUsersData = []
    }

    // Загружаем остальные данные
    const [clientsData, productsData, projectsData] = await Promise.all([
      getAllClients().catch((error) => {
        console.error('❌ Error loading clients:', error)
        return []
      }),
      getAllProducts().catch((error) => {
        console.error('❌ Error loading products:', error)
        return []
      }),
      getAllProjects().catch((error) => {
        console.error('❌ Error loading projects:', error)
        return []
      }),
    ])

    console.log('📋 Raw data loaded:', {
      clients: clientsData,
      products: productsData,
      projects: projectsData,
      stages: availableStages.value,
      usersByStageRoles: usersByStageRoles,
    })

    // Обрабатываем данные клиентов
    if (Array.isArray(clientsData)) {
      clients.value = clientsData
    } else if (
      clientsData &&
      typeof clientsData === 'object' &&
      'data' in clientsData &&
      Array.isArray((clientsData as any).data)
    ) {
      clients.value = (clientsData as any).data
    } else {
      console.warn('⚠️ Invalid clients data format:', clientsData)
      clients.value = []
    }

    // Обрабатываем данные продуктов
    if (Array.isArray(productsData)) {
      products.value = productsData
    } else if (
      productsData &&
      typeof productsData === 'object' &&
      'data' in productsData &&
      Array.isArray((productsData as any).data)
    ) {
      products.value = (productsData as any).data
    } else {
      console.warn('⚠️ Invalid products data format:', productsData)
      products.value = []
    }

    // Обрабатываем данные проектов
    if (Array.isArray(projectsData)) {
      projects.value = projectsData
    } else if (
      projectsData &&
      typeof projectsData === 'object' &&
      'data' in projectsData &&
      Array.isArray((projectsData as any).data)
    ) {
      projects.value = (projectsData as any).data
    } else {
      console.warn('⚠️ Invalid projects data format:', projectsData)
      projects.value = []
    }

    console.log('✅ Processed data:', {
      clientsCount: clients.value.length,
      productsCount: products.value.length,
      projectsCount: projects.value.length,
      stagesCount: availableStages.value.length,
    })

    // Если клиенты не загрузились, создаем fallback клиентов
    if (clients.value.length === 0) {
      console.log('⚠️ No clients from API, creating fallback clients')
      clients.value = [
        { id: 1, name: 'Тестовый клиент 1', company_name: 'Компания 1' },
        { id: 2, name: 'Тестовый клиент 2', company_name: 'Компания 2' },
      ]
    }

    // Если продукты не загрузились, создаем fallback продукты
    if (products.value.length === 0) {
      console.log('⚠️ No products from API, creating fallback products')
      products.value = [
        {
          id: 1,
          name: 'Тестовый продукт 1',
          available_stages: [
            {
              id: 2,
              name: 'design',
              display_name: 'Дизайн',
              color: '#3B82F6',
              order: 2,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              roles: [{ id: 1, name: 'designer', display_name: 'Дизайнер' }],
            },
            {
              id: 3,
              name: 'print',
              display_name: 'Печать',
              color: '#10B981',
              order: 3,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              roles: [{ id: 2, name: 'print_operator', display_name: 'Печатник' }],
            },
          ],
        },
        {
          id: 2,
          name: 'Тестовый продукт 2',
          available_stages: [
            {
              id: 2,
              name: 'design',
              display_name: 'Дизайн',
              color: '#3B82F6',
              order: 2,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              roles: [{ id: 1, name: 'designer', display_name: 'Дизайнер' }],
            },
          ],
        },
      ] as any
    }

    // Если проекты не загрузились, создаем fallback проекты
    if (projects.value.length === 0) {
      console.log('⚠️ No projects from API, creating fallback projects')
      projects.value = [
        { id: 1, title: 'Тестовый проект 1' },
        { id: 2, title: 'Тестовый проект 2' },
      ] as any
    }

    // Если стадии не загрузились, создаем fallback стадии
    if (availableStages.value.length === 0) {
      console.log('⚠️ No stages from API, creating fallback stages')
      availableStages.value = [
        {
          id: 2,
          name: 'design',
          display_name: 'Дизайн',
          color: '#3B82F6',
          order: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          roles: [{ id: 1, name: 'designer', display_name: 'Дизайнер' }],
        },
        {
          id: 3,
          name: 'print',
          display_name: 'Печать',
          color: '#10B981',
          order: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          roles: [{ id: 2, name: 'print_operator', display_name: 'Печатник' }],
        },
        {
          id: 4,
          name: 'engraving',
          display_name: 'Гравировка',
          color: '#8B5CF6',
          order: 4,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          roles: [{ id: 3, name: 'engraving_operator', display_name: 'Гравировщик' }],
        },
        {
          id: 5,
          name: 'workshop',
          display_name: 'Цех',
          color: '#F59E0B',
          order: 5,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          roles: [{ id: 4, name: 'workshop_worker', display_name: 'Работник цеха' }],
        },
      ]
    }

    // Загружаем пользователей по ролям из новой динамической системы
    console.log('👥 Loading users by stage roles:', usersByStageRoles)

    // Инициализируем все роли пустыми массивами (динамически)
    // Очищаем предыдущие данные
    if (allUsers && typeof allUsers === 'object') {
      Object.keys(allUsers).forEach((key) => delete allUsers[key])
    }

    // Динамически заполняем пользователей по ролям из стадий
    console.log('🔍 Processing users by stage roles:', usersByStageRoles)

    // Создаем динамический объект для пользователей по ролям
    const dynamicUsers: Record<string, any[]> = {}

    // Обрабатываем данные по стадиям и ролям
    if (usersByStageRoles && typeof usersByStageRoles === 'object') {
      // Проверяем разные возможные форматы данных
      if (Array.isArray(usersByStageRoles)) {
        // Если API возвращает массив пользователей
        console.log('📋 API returned array of users, processing by roles from stages')

        // Распределяем пользователей по ролям
        usersByStageRoles.forEach((user: any) => {
          if (user.roles && Array.isArray(user.roles)) {
            user.roles.forEach((role: any) => {
              const roleName = role.name || role
              if (allRoles.has(roleName)) {
                if (!dynamicUsers[roleName]) {
                  dynamicUsers[roleName] = []
                }
                const existingUser = dynamicUsers[roleName].find((u: any) => u.id === user.id)
                if (!existingUser) {
                  dynamicUsers[roleName].push(user)
                }
              }
            })
          }
        })
      } else {
        // Если API возвращает объект с пользователями по стадиям
        Object.keys(usersByStageRoles).forEach((stageName) => {
          const stageData = usersByStageRoles[stageName]

          if (Array.isArray(stageData)) {
            // Если стадия содержит массив пользователей
            console.log(`📋 Processing stage: ${stageName} with ${stageData.length} users`)

            stageData.forEach((user: any) => {
              if (user.roles && Array.isArray(user.roles)) {
                user.roles.forEach((role: any) => {
                  const roleName = role.name || role
                  if (!dynamicUsers[roleName]) {
                    dynamicUsers[roleName] = []
                  }
                  const existingUser = dynamicUsers[roleName].find((u: any) => u.id === user.id)
                  if (!existingUser) {
                    dynamicUsers[roleName].push(user)
                  }
                })
              }
            })
          } else if (stageData && typeof stageData === 'object') {
            // Если стадия содержит объект с ролями
            const stageRoles = stageData.users_by_role || stageData.roles || {}

            console.log(`📋 Processing stage: ${stageName}`, stageRoles)

            Object.keys(stageRoles).forEach((roleName) => {
              const roleData = stageRoles[roleName]
              const users = roleData.users || roleData || []

              console.log(`  👥 Role ${roleName}: ${users.length} users`)

              if (!dynamicUsers[roleName]) {
                dynamicUsers[roleName] = []
              }

              if (Array.isArray(users)) {
                users.forEach((user: any) => {
                  const existingUser = dynamicUsers[roleName].find((u: any) => u.id === user.id)
                  if (!existingUser) {
                    dynamicUsers[roleName].push(user)
                  }
                })
              }
            })
          }
        })
      }
    } else {
      console.warn('⚠️ usersByStageRoles is not defined or not an object:', usersByStageRoles)
    }

    // Обрабатываем данные пользователей по ролям из альтернативных источников
    if (roleUsersData && Array.isArray(roleUsersData)) {
      roleUsersData.forEach((roleData: any) => {
        console.log('📋 Processing roleData:', roleData)

        if (roleData && roleData.roleName && roleData.data) {
          const roleName = roleData.roleName
          const users = Array.isArray(roleData.data) ? roleData.data : []

          console.log(`📋 Processing alternative users for role ${roleName}:`, users.length)

          if (!dynamicUsers[roleName]) {
            dynamicUsers[roleName] = []
          }

          users.forEach((user: any) => {
            const existingUser = dynamicUsers[roleName].find((u: any) => u.id === user.id)
            if (!existingUser) {
              dynamicUsers[roleName].push(user)
            }
          })
        } else if (roleData && roleData.data) {
          // Обрабатываем случай, когда roleName не указан, но есть data
          console.log('📋 Processing roleData without roleName:', roleData)

          // Пытаемся определить роль из данных или использовать общую роль
          const users = Array.isArray(roleData.data) ? roleData.data : []

          if (users.length > 0 && users[0].roles) {
            // Если у пользователей есть роли, распределяем их по ролям
            users.forEach((user: any) => {
              if (user.roles && Array.isArray(user.roles)) {
                user.roles.forEach((role: any) => {
                  const roleName = role.name || role
                  if (allRoles.has(roleName)) {
                    if (!dynamicUsers[roleName]) {
                      dynamicUsers[roleName] = []
                    }
                    const existingUser = dynamicUsers[roleName].find((u: any) => u.id === user.id)
                    if (!existingUser) {
                      dynamicUsers[roleName].push(user)
                    }
                  }
                })
              }
            })
          }
        }
      })
    }

    // Удаляем дубликаты пользователей для каждой роли
    if (dynamicUsers && typeof dynamicUsers === 'object') {
      Object.keys(dynamicUsers).forEach((roleName) => {
        dynamicUsers[roleName] = Array.from(
          new Map(dynamicUsers[roleName].map((user) => [user.id, user])).values(),
        )
      })

      // Обновляем allUsers динамически
      Object.keys(dynamicUsers).forEach((roleName) => {
        allUsers[roleName] = dynamicUsers[roleName]
      })
    }

    console.log(
      '👥 Loaded users by roles:',
      allUsers && typeof allUsers === 'object'
        ? Object.keys(allUsers).reduce(
            (acc, role) => {
              acc[role] = allUsers[role]?.length || 0
              return acc
            },
            {} as Record<string, number>,
          )
        : {},
    )

    console.log('👥 Final allUsers object:', allUsers)
    console.log('👥 Dynamic users object:', dynamicUsers)

    // Если пользователи не загрузились, создаем fallback пользователей
    const totalUsers =
      allUsers && typeof allUsers === 'object'
        ? Object.keys(allUsers).reduce((sum, role) => sum + (allUsers[role]?.length || 0), 0)
        : 0

    console.log('👥 Total users loaded:', totalUsers)

    if (totalUsers === 0) {
      console.log('⚠️ No users from API, creating fallback users')

      // Динамически создаем fallback пользователей для всех ролей из стадий
      const allRoles = new Set<string>()

      // Собираем все роли из всех стадий
      availableStages.value.forEach((stage) => {
        if (stage.roles) {
          stage.roles.forEach((role) => {
            allRoles.add(role.name)
          })
        }
      })

      // Создаем fallback пользователей для каждой роли
      allRoles.forEach((roleName, index) => {
        const fallbackUser = {
          id: 100 + index,
          name: `Оператор ${roleName.replace(/_/g, ' ')}`,
          username: `operator_${roleName}`,
          email: `operator_${roleName}@example.com`,
          roles: [{ name: roleName }],
        } as any
        allUsers[roleName] = [fallbackUser]
      })

      console.log(
        '✅ Fallback users created:',
        allUsers && typeof allUsers === 'object'
          ? Object.keys(allUsers).reduce(
              (acc, role) => {
                acc[role] = allUsers[role]?.length || 0
                return acc
              },
              {} as Record<string, number>,
            )
          : {},
      )
    } else {
      console.log('✅ Real users loaded successfully!')
    }

    // Если редактируем заказ
    if (props.order) {
      Object.assign(form, {
        client_id: props.order.client_id || 0,
        project_id: props.order.project_id || null,
        product_id: props.order.product_id || null,
        quantity: props.order.quantity || 1,
        price: props.order.price || null,
        deadline: props.order.deadline
          ? formatDateForInput(props.order.deadline)
          : getTodayDateTime(),
      })

      // Загружаем стадии заказа
      if (props.order.stages) {
        selectedOrderStages.value = props.order.stages.map((stage) => stage.id)
      }

      // Загружаем назначения заказа
      if (props.order.assignments) {
        props.order.assignments.forEach((assignment) => {
          if (assignment.stage_id && assignment.role_type) {
            const existingAssignments = getAssignmentsForStageRole(
              assignment.stage_id,
              assignment.role_type,
            )
            existingAssignments.push({
              id: assignment.user_id,
              role_type: assignment.role_type,
              user: assignment.user,
              user_id: assignment.user_id,
            })
          }
        })
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки данных:', error)
    toast.show('Ошибка загрузки данных', 'error')
  }
})

// Отслеживаем изменения выбранных стадий
watch(
  selectedOrderStages,
  (newStages, oldStages) => {
    console.log('👀 selectedOrderStages changed:', {
      old: oldStages,
      new: newStages,
      added: newStages.filter((id) => !oldStages.includes(id)),
      removed: oldStages.filter((id) => !newStages.includes(id)),
      workingStages: workingStages.value.map((s) => ({ id: s.id, name: s.name })),
    })

    // Обновляем stageAssignments при изменении выбранных стадий
    const removedStages = oldStages.filter((id) => !newStages.includes(id))
    if (removedStages.length > 0) {
      console.log('⚠️ Stages removed, keeping assignments for:', removedStages)
      // Назначения сохраняются даже для отключенных стадий
    }
  },
  { deep: true },
)

// Отслеживаем изменения продукта
watch(
  () => form.product_id,
  (newProductId, oldProductId) => {
    console.log('👀 form.product_id changed:', { old: oldProductId, new: newProductId })
    if (newProductId !== oldProductId) {
      onProductChange(newProductId || null)
    }
  },
  { immediate: false },
)

function getTodayDateTime(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function formatDateForInput(dateString: string): string {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''

  // Форматируем для input type="datetime-local"
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function validateForm(): boolean {
  console.log('🔍 Validating order form:', {
    orderMode: orderMode.value,
    client_id: form.client_id,
    project_id: form.project_id,
    product_id: form.product_id,
    quantity: form.quantity,
    selectedStages: selectedOrderStages.value,
  })

  // Очищаем ошибки
  Object.keys(errors).forEach((key) => {
    ;(errors as any)[key] = ''
  })

  let valid = true

  if (!form.client_id || form.client_id <= 0) {
    errors.client_id = 'Выберите клиента'
    valid = false
    console.log('❌ Client validation failed')
  }

  // Проект обязателен только для массового заказа
  if (orderMode.value === 'bulk') {
    const hasExistingProject = form.project_id && form.project_id > 0
    const hasProjectTitle = bulkProjectTitle.value.trim() !== ''

    if (!hasExistingProject && !hasProjectTitle) {
      errors.project_id = 'Выберите проект или введите название проекта'
      errors.bulk_project_title = 'Выберите проект или введите название проекта'
      valid = false
      console.log('❌ Project validation failed (bulk order)')
    }

    // Проверяем, что есть хотя бы один продукт
    if (bulkOrders.value.length === 0) {
      errors.bulk_orders = 'Добавьте хотя бы один продукт'
      valid = false
      console.log('❌ Bulk orders validation failed - no products')
    } else {
      // Проверяем каждый продукт
      bulkOrders.value.forEach((order, index) => {
        if (!order.product_id || order.product_id <= 0) {
          errors.bulk_orders = `Выберите продукт для заказа ${index + 1}`
          valid = false
          console.log(`❌ Bulk order ${index + 1} product validation failed`)
        }
        if (!order.quantity || order.quantity <= 0) {
          errors.bulk_orders = `Укажите количество для заказа ${index + 1}`
          valid = false
          console.log(`❌ Bulk order ${index + 1} quantity validation failed`)
        }
      })
    }
  }

  if (orderMode.value === 'single' && (!form.product_id || form.product_id <= 0)) {
    errors.product_id = 'Выберите продукт'
    valid = false
    console.log('❌ Product validation failed')
  }

  if (orderMode.value === 'single' && (!form.quantity || form.quantity <= 0)) {
    errors.quantity = 'Введите корректное количество'
    valid = false
    console.log('❌ Quantity validation failed')
  }

  if (orderMode.value === 'single' && selectedOrderStages.value.length === 0) {
    errors.stages = 'Выберите хотя бы одну стадию'
    valid = false
    console.log('❌ Stages validation failed')
  }

  console.log('✅ Order form validation result:', valid)
  return valid
}

async function handleSubmit() {
  if (!validateForm()) {
    return
  }

  loading.value = true
  try {
    let orderData: any = {
      ...form,
      deadline: form.deadline || null,
      price: form.price || null,
    }

    // Для массового заказа создаем несколько заказов
    if (orderMode.value === 'bulk') {
      console.log('📦 Creating bulk orders with stages and assignments...')

      // Если указано название проекта, создаем один проект для всех заказов
      let projectId = form.project_id
      if (bulkProjectTitle.value.trim() && !form.project_id) {
        try {
          console.log('📦 Creating project for bulk orders:', bulkProjectTitle.value.trim())
          const projectData = {
            title: bulkProjectTitle.value.trim(),
            description: `Массовый заказ - ${bulkProjectTitle.value.trim()}`,
            client_id: form.client_id,
          }
          const createdProject = await createProject(projectData)
          projectId = createdProject.id
          console.log('✅ Project created for bulk orders:', projectId)
        } catch (error) {
          console.error('❌ Error creating project for bulk orders:', error)
          toast.show('Ошибка при создании проекта', 'error')
          return
        }
      }

      // Создаем все заказы
      const createdOrders = []
      for (let i = 0; i < bulkOrders.value.length; i++) {
        const order = bulkOrders.value[i]

        // Подготавливаем данные заказа
        const orderData = {
          client_id: form.client_id,
          project_id: projectId, // Используем один project_id для всех заказов
          product_id: order.product_id || undefined,
          quantity: order.quantity,
          price: order.price,
          deadline: order.deadline || null,
          is_bulk: true, // Флаг для массового заказа
          stages: order.selected_stages || [],
          assignments: getBulkOrderAssignments(i),
        }

        console.log(`📦 Creating bulk order ${i + 1}:`, orderData)
        const createdOrder = await create(orderData)
        createdOrders.push(createdOrder)
      }

      toast.show(`Создано ${createdOrders.length} заказов успешно!`)
      emit('submit')
      emit('close')
      return
    } else {
      // Для одиночного заказа добавляем все данные
      const assignments = getAllAssignments()
      console.log('📋 Assignments for order:', assignments)

      orderData = {
        ...orderData,
        stages: selectedOrderStages.value,
        assignments: assignments,
      }
    }

    console.log('💾 Saving order with data:', orderData)

    if (props.order) {
      // Обновляем существующий заказ
      await update(props.order.id, orderData)
      toast.show('Заказ обновлен успешно!')
    } else {
      // Создаем новый заказ
      await create(orderData)
      toast.show('Заказ создан успешно!')
    }

    emit('submit')
    emit('close')
  } catch (error) {
    console.error('Ошибка сохранения заказа:', error)
    toast.show('Ошибка при сохранении заказа', 'error')
  } finally {
    loading.value = false
  }
}

function getAllAssignments(): OrderAssignmentCreate[] {
  const allAssignments: OrderAssignmentCreate[] = []
  console.log('🔍 Getting all assignments from stageAssignments:', stageAssignments)
  console.log('🔍 Selected stages:', selectedOrderStages.value)

  Object.keys(stageAssignments).forEach((stageId) => {
    const stageIdNum = parseInt(stageId)

    // Проверяем, выбрана ли эта стадия
    if (!selectedOrderStages.value.includes(stageIdNum)) {
      console.log(`⏭️ Skipping stage ${stageId} - not selected`)
      return // Пропускаем эту стадию
    }

    const stageAssignmentsForStage = stageAssignments[stageIdNum]
    console.log(`📋 Stage ${stageId} assignments:`, stageAssignmentsForStage)

    if (stageAssignmentsForStage && typeof stageAssignmentsForStage === 'object') {
      Object.keys(stageAssignmentsForStage).forEach((roleName) => {
        const assignments = stageAssignmentsForStage[roleName]
        console.log(`  👥 Role ${roleName} assignments:`, assignments)

        if (Array.isArray(assignments)) {
          assignments.forEach((assignment) => {
            console.log(`    📝 Assignment:`, assignment)
            if (assignment && assignment.user_id && assignment.user_id > 0) {
              const assignmentData = {
                user_id: assignment.user_id,
                role_type: roleName,
                stage_id: stageIdNum,
              }
              allAssignments.push(assignmentData)
              console.log(`    ✅ Added assignment for selected stage:`, assignmentData)
            } else {
              console.log(`    ❌ Skipped assignment (invalid):`, assignment)
            }
          })
        }
      })
    }
  })

  console.log('📋 Final allAssignments (only for selected stages):', allAssignments)
  return allAssignments
}

// Функции для работы с массовыми заказами
function addBulkOrder() {
  bulkOrders.value.push({
    product_id: null,
    quantity: 1,
    price: null,
    deadline: getTodayDateTime(),
    selected_stages: [],
    assignments: {},
  })
  console.log('➕ Added bulk order, total:', bulkOrders.value.length)
}

function removeBulkOrder(index: number) {
  bulkOrders.value.splice(index, 1)
  console.log('➖ Removed bulk order at index:', index)
}

async function onBulkOrderProductChange(index: number) {
  const order = bulkOrders.value[index]
  if (!order || !order.product_id) return

  try {
    console.log(`🔄 Product changed for bulk order ${index}:`, order.product_id)

    // Сбрасываем выбранные стадии и назначения для этого заказа
    order.selected_stages = []
    order.assignments = {}

    // Находим выбранный продукт
    const selectedProduct = products.value.find((p) => p.id === order.product_id)
    if (!selectedProduct) {
      console.warn(`⚠️ Product not found for bulk order ${index}:`, order.product_id)
      return
    }

    // Если есть доступные стадии продукта
    if (selectedProduct.available_stages && Array.isArray(selectedProduct.available_stages)) {
      // Выбираем все доступные стадии продукта по умолчанию
      order.selected_stages = selectedProduct.available_stages.map((stage) => stage.id)
      console.log(`✅ Selected stages for bulk order ${index}:`, order.selected_stages)

      // Загружаем назначения продукта для автоматического подтягивания
      const productAssignmentsResponse = await getProductAssignments(order.product_id)
      console.log(
        `📋 Product assignments response for bulk order ${index}:`,
        productAssignmentsResponse,
      )

      if (
        productAssignmentsResponse &&
        productAssignmentsResponse.assignments &&
        Array.isArray(productAssignmentsResponse.assignments)
      ) {
        console.log(
          `📋 Found assignments in response for bulk order ${index}:`,
          productAssignmentsResponse.assignments.length,
        )

        // Группируем назначения продукта по ролям
        const productAssignmentsByRole: Record<string, ProductAssignment[]> = {}

        productAssignmentsResponse.assignments.forEach((assignment: any) => {
          const roleType = assignment.role_type

          console.log(
            `📋 Processing assignment for bulk order ${index}: role ${roleType}, user ${assignment.user?.name || 'unknown'}`,
          )

          if (!productAssignmentsByRole[roleType]) {
            productAssignmentsByRole[roleType] = []
          }

          productAssignmentsByRole[roleType].push({
            id: assignment.id,
            user_id: assignment.user_id,
            role_type: assignment.role_type,
            user: assignment.user,
          })
        })

        console.log(
          `📋 Product assignments by role for bulk order ${index}:`,
          productAssignmentsByRole,
        )

        // Копируем назначения продукта в заказ для каждой стадии
        if (productAssignmentsByRole && typeof productAssignmentsByRole === 'object') {
          Object.keys(productAssignmentsByRole).forEach((roleType) => {
            const assignments = productAssignmentsByRole[roleType]
            if (Array.isArray(assignments)) {
              console.log(
                `📋 Copying ${assignments.length} assignments for role ${roleType} in bulk order ${index}`,
              )

              // Находим стадии, которые используют эту роль
              const stagesWithRole = availableStages.value.filter((stage) => {
                return stage.roles && stage.roles.some((role: any) => role.name === roleType)
              })

              // Копируем назначения для каждой стадии с этой ролью
              stagesWithRole.forEach((stage) => {
                if (!order.assignments[stage.id]) {
                  order.assignments[stage.id] = {}
                }
                if (!order.assignments[stage.id][roleType]) {
                  order.assignments[stage.id][roleType] = []
                }

                // Копируем назначения
                order.assignments[stage.id][roleType] = assignments.map((assignment) => ({
                  ...assignment,
                  id: Date.now() + Math.random(), // Новый ID для массового заказа
                }))
              })
            }
          })
        }

        console.log(`✅ Product assignments copied to bulk order ${index}`)
        console.log(`📋 Final assignments for bulk order ${index}:`, order.assignments)
      } else {
        console.log(`⚠️ No assignments found for product in bulk order ${index}`)
      }
    } else {
      console.warn(
        `⚠️ No available stages found for product in bulk order ${index}, using empty selection`,
      )
      order.selected_stages = []
    }
  } catch (error) {
    console.error(`❌ Error processing product change for bulk order ${index}:`, error)
  }
}

// Функции для работы со стадиями в массовом заказе
function toggleBulkOrderStage(orderIndex: number, stageId: number) {
  const order = bulkOrders.value[orderIndex]
  if (!order) return

  const stageIndex = order.selected_stages.indexOf(stageId)
  if (stageIndex > -1) {
    order.selected_stages.splice(stageIndex, 1)
  } else {
    order.selected_stages.push(stageId)
  }
  console.log(`🔄 Toggled stage ${stageId} for bulk order ${orderIndex}:`, order.selected_stages)
}

function selectAllStagesForBulkOrder(orderIndex: number) {
  const order = bulkOrders.value[orderIndex]
  if (!order) return

  order.selected_stages = workingStages.value.map((stage) => stage.id)
  console.log(`✅ Selected all stages for bulk order ${orderIndex}:`, order.selected_stages)
}

function clearAllStagesForBulkOrder(orderIndex: number) {
  const order = bulkOrders.value[orderIndex]
  if (!order) return

  order.selected_stages = []
  console.log(`🗑️ Cleared all stages for bulk order ${orderIndex}`)
}

function getSelectedStageObjectsForBulkOrder(orderIndex: number) {
  const order = bulkOrders.value[orderIndex]
  if (!order) return []

  return availableStages.value
    .filter((stage) => order.selected_stages.includes(stage.id))
    .filter((stage) => stage.roles && stage.roles.length > 0)
}

// Функции для работы с назначениями в массовом заказе
function addBulkOrderAssignment(orderIndex: number, stageId: number, roleName: string) {
  const order = bulkOrders.value[orderIndex]
  if (!order) return

  if (!order.assignments[stageId]) {
    order.assignments[stageId] = {}
  }
  if (!order.assignments[stageId][roleName]) {
    order.assignments[stageId][roleName] = []
  }

  // Проверяем, есть ли уже пустые назначения (без пользователя)
  const existingEmptyAssignments = order.assignments[stageId][roleName].filter(
    (assignment) => !assignment.user_id || assignment.user_id === 0,
  )

  // Если есть пустые назначения, не добавляем новые
  if (existingEmptyAssignments.length > 0) {
    console.log(
      `⚠️ Skipping assignment addition - there are ${existingEmptyAssignments.length} empty assignments for bulk order ${orderIndex}, stage ${stageId}, role ${roleName}`,
    )
    return
  }

  order.assignments[stageId][roleName].push({
    id: Date.now() + Math.random(), // Временный ID
    user: null,
    stage_id: stageId,
    role_type: roleName,
  })

  console.log(
    `➕ Added assignment for bulk order ${orderIndex}, stage ${stageId}, role ${roleName}`,
  )
}

function removeBulkOrderAssignment(
  orderIndex: number,
  stageId: number,
  roleName: string,
  assignmentIndex: number,
) {
  const order = bulkOrders.value[orderIndex]
  if (!order || !order.assignments[stageId] || !order.assignments[stageId][roleName]) return

  order.assignments[stageId][roleName].splice(assignmentIndex, 1)
  console.log(
    `➖ Removed assignment ${assignmentIndex} for bulk order ${orderIndex}, stage ${stageId}, role ${roleName}`,
  )
}

function getBulkOrderAssignmentsForStageRole(
  orderIndex: number,
  stageId: number,
  roleName: string,
) {
  const order = bulkOrders.value[orderIndex]
  if (!order || !order.assignments[stageId] || !order.assignments[stageId][roleName]) {
    return []
  }
  return order.assignments[stageId][roleName]
}

function handleBulkOrderUserSelect(
  user: User | null,
  assignment: ProductAssignment,
  orderIndex: number,
  stageId: number,
  roleName: string,
  assignmentIndex: number,
) {
  const order = bulkOrders.value[orderIndex]
  if (!order || !order.assignments[stageId] || !order.assignments[stageId][roleName]) return

  if (user) {
    assignment.user_id = user.id
    assignment.user = user
    console.log(
      `👤 User selected for bulk order ${orderIndex}, stage ${stageId}, role ${roleName}:`,
      user.name,
    )

    // Удаляем все пустые назначения для этой роли
    const assignments = order.assignments[stageId][roleName]
    const emptyAssignments = assignments.filter(
      (a, index) => index !== assignmentIndex && (!a.user_id || a.user_id === 0),
    )

    if (emptyAssignments.length > 0) {
      console.log(`🗑️ Removing ${emptyAssignments.length} empty assignments`)
      order.assignments[stageId][roleName] = assignments.filter(
        (a, index) => index === assignmentIndex || (a.user_id && a.user_id > 0),
      )
    }
  } else {
    assignment.user_id = 0
    assignment.user = undefined
    console.log(`❌ User cleared for bulk order ${orderIndex}, stage ${stageId}, role ${roleName}`)
  }
}

function getBulkOrderAssignments(orderIndex: number): OrderAssignmentCreate[] {
  const order = bulkOrders.value[orderIndex]
  if (!order) return []

  const allAssignments: OrderAssignmentCreate[] = []
  console.log(`🔍 Getting assignments for bulk order ${orderIndex}:`, order.assignments)

  Object.keys(order.assignments).forEach((stageId) => {
    const stageIdNum = parseInt(stageId)

    // Проверяем, выбрана ли эта стадия
    if (!order.selected_stages.includes(stageIdNum)) {
      console.log(`⏭️ Skipping stage ${stageId} - not selected for bulk order ${orderIndex}`)
      return // Пропускаем эту стадию
    }

    const stageAssignmentsForStage = order.assignments[stageIdNum]
    console.log(
      `📋 Stage ${stageId} assignments for bulk order ${orderIndex}:`,
      stageAssignmentsForStage,
    )

    if (stageAssignmentsForStage && typeof stageAssignmentsForStage === 'object') {
      Object.keys(stageAssignmentsForStage).forEach((roleName) => {
        const assignments = stageAssignmentsForStage[roleName]
        console.log(`  👥 Role ${roleName} assignments for bulk order ${orderIndex}:`, assignments)

        if (Array.isArray(assignments)) {
          assignments.forEach((assignment) => {
            console.log(`    📝 Assignment for bulk order ${orderIndex}:`, assignment)
            if (assignment && assignment.user_id && assignment.user_id > 0) {
              const assignmentData = {
                user_id: assignment.user_id,
                role_type: roleName,
                stage_id: stageIdNum,
              }
              allAssignments.push(assignmentData)
              console.log(`    ✅ Added assignment for bulk order ${orderIndex}:`, assignmentData)
            } else {
              console.log(
                `    ❌ Skipped assignment for bulk order ${orderIndex} (invalid):`,
                assignment,
              )
            }
          })
        }
      })
    }
  })

  console.log(`📋 Final assignments for bulk order ${orderIndex}:`, allAssignments)
  return allAssignments
}

// Функция для обработки выбора проекта
function onProjectSelect(projectId: number | null) {
  if (projectId) {
    // Если выбран существующий проект, очищаем поле названия проекта
    bulkProjectTitle.value = ''
  }
}

// Функция для обработки ввода названия проекта
function onProjectTitleInput() {
  if (bulkProjectTitle.value.trim()) {
    // Если вводится название проекта, очищаем выбранный проект
    form.project_id = undefined
  }
}

async function handleDelete() {
  if (!props.order) return

  if (!confirm('Вы уверены, что хотите удалить этот заказ?')) return

  try {
    await remove(props.order.id)
    toast.show('Заказ удален!')
    emit('delete', props.order.id)
    emit('close')
  } catch (error) {
    console.error('Ошибка удаления заказа:', error)
    toast.show('Ошибка при удалении заказа', 'error')
  }
}

function onClientCreated(client: any) {
  clients.value.push(client)
  form.client_id = client.id
  showClientModal.value = false
  toast.show('Клиент создан!')
}

function onProjectCreated(project: any) {
  projects.value.push(project)
  form.project_id = project.id
  showProjectModal.value = false
  toast.show('Проект создан!')
}
</script>

<style scoped>
.modal {
  border-radius: 20px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.15);
  padding: 32px 24px;
  background: #fff;
  max-width: 600px;
  width: 90vw;
}

/* Анимации для секций - убираем transform чтобы не мешать dropdown */
.bg-gray-50 {
  transition: all 0.3s ease;
}

.bg-gray-50:hover {
  transform: none;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* Стили для иконок в заголовках */
h3 svg {
  transition: transform 0.2s ease;
}

h3:hover svg {
  transform: scale(1.1);
}
</style>

<style>
@import 'vue3-select/dist/vue3-select.css';

/* Исправляем проблему с dropdown под другими элементами */
.vs__dropdown-menu {
  max-height: 120px !important;
  overflow-y: auto !important;
  padding: 0 !important;
  z-index: 9999 !important;
  position: absolute !important;
  min-width: 250px !important;
}

.vs__dropdown-menu .vs__dropdown-option,
.vs__dropdown-menu .vs__dropdown-option--selected {
  min-height: 32px !important;
  padding: 6px 12px !important;
  font-size: 14px !important;
  line-height: 1.4 !important;
  color: #374151 !important;
  background: #fff !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

/* Специальные стили для массового режима */
.orderMode-bulk .vs__dropdown-menu {
  max-height: 150px !important;
  min-width: 300px !important;
}

.orderMode-bulk .vs__dropdown-menu .vs__dropdown-option,
.orderMode-bulk .vs__dropdown-menu .vs__dropdown-option--selected {
  min-height: 36px !important;
  padding: 8px 12px !important;
  font-size: 15px !important;
  line-height: 1.5 !important;
}

/* Увеличиваем z-index для контейнера селектора */
.vue3-select {
  position: relative !important;
  z-index: 1 !important;
}

/* Убираем transition для элементов, которые могут мешать dropdown */
.bg-gray-50 {
  transition: all 0.3s ease;
  transform: none !important;
}

.bg-gray-50:hover {
  transform: none !important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* Убираем transition для карточек с назначениями */
.border.border-gray-200.rounded-lg {
  transition: none !important;
  transform: none !important;
}

.border.border-gray-200.rounded-lg:hover {
  transform: none !important;
}
</style>
