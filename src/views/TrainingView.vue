<template>
  <Layout>
    <div class="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-gray-50">
      <div class="flex-1 overflow-y-auto">
        <!-- Видео инструкция -->
        <section class="mb-6">
          <div class="pt-6 pb-4 px-6">
            <h2 class="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <svg class="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {{ t('training.video.title', 'Видео инструкция') }}
            </h2>
          </div>
          <video
            controls
            class="w-full"
            preload="metadata"
          >
            <source src="/videos/Altyn_arzuw_learning_video%20(1).mp4" type="video/mp4">
            {{ t('training.video.notSupported', 'Ваш браузер не поддерживает воспроизведение видео.') }}
          </video>
        </section>

        <div class="flex-1 overflow-y-auto">
          <div class="space-y-6">
            <!-- Заголовок -->
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h1 class="text-3xl font-bold text-gray-900 mb-2">
                {{ t('training.title', 'Обучение работе с системой') }}
              </h1>
              <p class="text-gray-600">
                {{ t('training.subtitle', 'Часто задаваемые вопросы и полезная информация') }}
              </p>
            </div>

          <!-- Роли и права -->
          <section class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {{ t('training.roles.title', 'Кто что может делать в системе?') }}
            </h2>
            
            <div class="space-y-4">
              <div class="border-l-4 border-blue-500 pl-4 py-2">
                <h3 class="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ t('training.roles.admin', 'Администратор') }}
                </h3>
                <p class="text-gray-600">
                  {{ t('training.roles.adminDesc', 'Администратор может всё: создавать и редактировать заказы, управлять сотрудниками, настраивать систему (стадии, роли), видеть всю статистику и удалять данные.') }}
                </p>
              </div>

              <div class="border-l-4 border-green-500 pl-4 py-2">
                <h3 class="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {{ t('training.roles.manager', 'Менеджер') }}
                </h3>
                <p class="text-gray-600">
                  {{ t('training.roles.managerDesc', 'Менеджер может управлять заказами и клиентами: создавать заказы, назначать их сотрудникам, менять стадии заказов, добавлять клиентов. Но не может управлять настройками системы (стадиями, ролями) и пользователями.') }}
                </p>
              </div>

              <div class="border-l-4 border-orange-500 pl-4 py-2">
                <h3 class="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {{ t('training.roles.staff', 'Сотрудники') }}
                </h3>
                <p class="text-gray-600">
                  {{ t('training.roles.staffDesc', 'Сотрудники видят только заказы, которые им назначены. Могут менять статус своей работы (например, "в работе", "выполнено"), оставлять комментарии к заказам. Не могут создавать или редактировать заказы.') }}
                </p>
              </div>
            </div>
          </section>

          <!-- FAQ секции -->
          <div class="space-y-4">
            <FaqSection
              v-for="section in faqSections"
              :key="section.id"
              :section="section"
            />
          </div>

          <!-- Что можно/нельзя -->
          <section class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ t('training.permissions.title', 'Что можно и нельзя делать') }}
            </h2>
            
            <div class="grid md:grid-cols-2 gap-4">
              <div class="border border-green-200 rounded-lg p-4 bg-green-50">
                <h3 class="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ t('training.permissions.canDo', 'Что можно делать') }}
                </h3>
                <ul class="space-y-2 text-sm text-gray-700">
                  <li v-for="(item, idx) in canDoItems" :key="idx" class="flex items-start gap-2">
                    <svg class="w-4 h-4 text-green-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{{ item }}</span>
                  </li>
                </ul>
              </div>

              <div class="border border-red-200 rounded-lg p-4 bg-red-50">
                <h3 class="font-semibold text-red-900 mb-2 flex items-center gap-2">
                  <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ t('training.permissions.cannotDo', 'Что нельзя делать') }}
                </h3>
                <ul class="space-y-2 text-sm text-gray-700">
                  <li v-for="(item, idx) in cannotDoItems" :key="idx" class="flex items-start gap-2">
                    <svg class="w-4 h-4 text-red-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>{{ item }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <!-- Полезные советы -->
          <section class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-sm p-6">
            <h2 class="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg class="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {{ t('training.tips.title', 'Полезные советы') }}
            </h2>
            
            <div class="space-y-4">
              <div
                v-for="(tip, idx) in tips"
                :key="idx"
                class="bg-white rounded-lg p-4 shadow-sm"
              >
                <h3 class="font-semibold text-gray-800 mb-2">{{ tip.title }}</h3>
                <ul class="space-y-1 text-gray-600 text-sm">
                  <li v-for="(item, itemIdx) in tip.items" :key="itemIdx" class="flex items-start gap-2">
                    <svg class="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="5" />
                    </svg>
                    <span>{{ item }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Layout from '../components/layout/Layout.vue'
import FaqSection from '../components/training/FaqSection.vue'

const { t } = useI18n()

// FAQ секции
const faqSections = computed(() => [
  {
    id: 'users',
    icon: '👤',
    title: t('training.faq.users.title', 'О сотрудниках и доступе'),
    questions: [
      {
        q: t('training.faq.users.q1', 'Кто может добавлять новых сотрудников в систему?'),
        a: t('training.faq.users.a1', 'Только администратор может добавлять и редактировать сотрудников.')
      },
      {
        q: t('training.faq.users.q2', 'Может ли менеджер изменить данные сотрудника?'),
        a: t('training.faq.users.a2', 'Нет, это может делать только администратор.')
      },
      {
        q: t('training.faq.users.q3', 'Может ли обычный сотрудник видеть других сотрудников?'),
        a: t('training.faq.users.a3', 'Да, сотрудники видят список всех сотрудников, но не могут их изменять.')
      },
      {
        q: t('training.faq.users.q4', 'Может ли администратор удалить самого себя?'),
        a: t('training.faq.users.a4', 'Нет, администратор не может удалить свой собственный аккаунт.')
      }
    ]
  },
  {
    id: 'orders',
    icon: '📦',
    title: t('training.faq.orders.title', 'О заказах'),
    questions: [
      {
        q: t('training.faq.orders.q1', 'Кто может создавать новые заказы?'),
        a: t('training.faq.orders.a1', 'Только администраторы и менеджеры могут создавать заказы.')
      },
      {
        q: t('training.faq.orders.q2', 'Могут ли сотрудники редактировать заказы?'),
        a: t('training.faq.orders.a2', 'Нет, сотрудники не могут редактировать заказы. Они могут только просматривать заказы, которые им назначены, и обновлять статус своей работы.')
      },
      {
        q: t('training.faq.orders.q3', 'Что видит сотрудник в списке заказов?'),
        a: t('training.faq.orders.a3', 'Сотрудник видит только те заказы, которые ему назначены для выполнения работы.')
      },
      {
        q: t('training.faq.orders.q4', 'Кто может менять стадию заказа (например, "дизайн" → "печать")?'),
        a: t('training.faq.orders.a4', 'Только администраторы и менеджеры могут менять стадию заказа.')
      },
      {
        q: t('training.faq.orders.q5', 'Что происходит, когда заказ завершён?'),
        a: t('training.faq.orders.a5', 'Заказ автоматически попадает в архив, его можно найти в архиве.')
      },
      {
        q: t('training.faq.orders.q6', 'Как заказ переходит со стадии на стадию?'),
        a: t('training.faq.orders.a6', 'Система автоматически переводит заказ на следующую стадию, когда все сотрудники на текущей стадии завершили и подтвердили свою работу.')
      },
      {
        q: t('training.faq.orders.q7', 'Кто может удалять заказы?'),
        a: t('training.faq.orders.a7', 'Только администраторы могут удалять заказы.')
      }
    ]
  },
  {
    id: 'assignments',
    icon: '👥',
    title: t('training.faq.assignments.title', 'О назначении работы'),
    questions: [
      {
        q: t('training.faq.assignments.q1', 'Кто может назначать заказы сотрудникам?'),
        a: t('training.faq.assignments.a1', 'Администраторы и менеджеры могут назначать заказы сотрудникам.')
      },
      {
        q: t('training.faq.assignments.q2', 'Может ли сотрудник сам выбрать себе заказ?'),
        a: t('training.faq.assignments.a2', 'Нет, заказы назначаются администратором или менеджером.')
      },
      {
        q: t('training.faq.assignments.q3', 'Может ли сотрудник изменить статус своей работы?'),
        a: t('training.faq.assignments.a3', 'Да, сотрудник может изменить статус назначенной ему работы (например, отметить "в работе" или "выполнено").')
      },
      {
        q: t('training.faq.assignments.q4', 'Какие статусы работы есть?'),
        a: t('training.faq.assignments.a4', '"Ожидает" - работа назначена, но ещё не начата\n"В работе" - сотрудник начал выполнять работу\n"Завершено" - работа выполнена\n"Одобрено" - работа проверена и одобрена')
      },
      {
        q: t('training.faq.assignments.q5', 'Можно ли назначить один заказ сразу нескольким сотрудникам?'),
        a: t('training.faq.assignments.a5', 'Да, администратор или менеджер могут назначить один заказ нескольким сотрудникам одновременно.')
      }
    ]
  },
  {
    id: 'stages',
    icon: '🏷️',
    title: t('training.faq.stages.title', 'О стадиях и ролях'),
    questions: [
      {
        q: t('training.faq.stages.q1', 'Что такое стадия заказа?'),
        a: t('training.faq.stages.a1', 'Стадия - это этап производства заказа. Например: "Дизайн", "Печать", "Гравировка", "Цех", "Готово".')
      },
      {
        q: t('training.faq.stages.q2', 'Кто может настраивать стадии в системе?'),
        a: t('training.faq.stages.a2', 'Только администраторы могут добавлять, изменять или удалять стадии.')
      },
      {
        q: t('training.faq.stages.q3', 'Как работают стадии для разных товаров?'),
        a: t('training.faq.stages.a3', 'Каждый товар может иметь свои доступные стадии. Например, для одного товара может не потребоваться стадия "Гравировка".')
      },
      {
        q: t('training.faq.stages.q4', 'Что такое роли в системе?'),
        a: t('training.faq.stages.a4', 'Роль определяет, какие функции доступны сотруднику. Есть роли: Администратор, Менеджер, Дизайнер, Оператор печати, Работник цеха, Оператор гравировки, Бухгалтер.')
      },
      {
        q: t('training.faq.stages.q5', 'Кто может настраивать роли?'),
        a: t('training.faq.stages.a5', 'Только администраторы могут управлять ролями.')
      },
      {
        q: t('training.faq.stages.q6', 'Может ли менеджер назначить сотруднику роль администратора?'),
        a: t('training.faq.stages.a6', 'Нет, это может сделать только администратор.')
      }
    ]
  },
  {
    id: 'permissions',
    icon: '💰',
    title: t('training.faq.permissions.title', 'О правах доступа и информации'),
    questions: [
      {
        q: t('training.faq.permissions.q1', 'Кто может видеть цены в заказах?'),
        a: t('training.faq.permissions.a1', 'Только администраторы и менеджеры могут видеть цены. Обычные сотрудники не видят цены.')
      },
      {
        q: t('training.faq.permissions.q2', 'Что видит обычный сотрудник в системе?'),
        a: t('training.faq.permissions.a2', 'Сотрудник видит:\n- Только заказы, которые ему назначены\n- Информацию о клиентах, у которых есть назначенные ему заказы\n- Свою статистику работы (сколько заказов выполнил, сколько в работе)')
      },
      {
        q: t('training.faq.permissions.q3', 'Может ли сотрудник видеть все заказы компании?'),
        a: t('training.faq.permissions.a3', 'Нет, сотрудники видят только свои назначенные заказы.')
      }
    ]
  },
  {
    id: 'stats',
    icon: '📊',
    title: t('training.faq.stats.title', 'О статистике и отчётах'),
    questions: [
      {
        q: t('training.faq.stats.q1', 'Какую статистику видит сотрудник?'),
        a: t('training.faq.stats.a1', 'Сотрудник видит только свою статистику:\n- Сколько заказов ему назначено всего\n- Сколько заказов он завершил\n- Сколько заказов в работе\n- Сколько заказов ожидает начала работы')
      },
      {
        q: t('training.faq.stats.q2', 'Какую статистику видит администратор или менеджер?'),
        a: t('training.faq.stats.a2', 'Они видят полную статистику компании:\n- Общее количество заказов\n- Общее количество клиентов\n- Общее количество сотрудников\n- Выручку по месяцам\n- Новых клиентов за последние 30 дней\n- Статистику по всем стадиям')
      }
    ]
  },
  {
    id: 'notifications',
    icon: '🔔',
    title: t('training.faq.notifications.title', 'Об уведомлениях'),
    questions: [
      {
        q: t('training.faq.notifications.q1', 'Какие уведомления приходят в системе?'),
        a: t('training.faq.notifications.a1', 'В системе есть уведомления о:\n- Назначении нового заказа\n- Изменении стадии заказа\n- Изменении статуса работы\n- Добавлении комментария к заказу\n- Напоминании о конце рабочего дня')
      },
      {
        q: t('training.faq.notifications.q2', 'Как приходят уведомления?'),
        a: t('training.faq.notifications.a2', 'Уведомления приходят в самой программе (в виде уведомлений в интерфейсе) и, если настроено, через push-уведомления на телефон.')
      },
      {
        q: t('training.faq.notifications.q3', 'Можно ли отключить уведомления?'),
        a: t('training.faq.notifications.a3', 'Да, можно пометить уведомления как прочитанные. В настройках можно управлять push-уведомлениями.')
      }
    ]
  },
  {
    id: 'bulk',
    icon: '🗑️',
    title: t('training.faq.bulk.title', 'О массовых операциях'),
    questions: [
      {
        q: t('training.faq.bulk.q1', 'Что такое массовые операции?'),
        a: t('training.faq.bulk.a1', 'Это возможность выполнить одно действие сразу для нескольких заказов, клиентов или других записей одновременно.')
      },
      {
        q: t('training.faq.bulk.q2', 'Какие массовые операции доступны?'),
        a: t('training.faq.bulk.a2', '- Массовое удаление (удалить несколько записей сразу)\n- Массовое назначение заказов (назначить несколько заказов сотрудникам сразу)\n- Массовое изменение статуса (изменить стадию у нескольких заказов сразу)')
      },
      {
        q: t('training.faq.bulk.q3', 'Кто может выполнять массовые операции?'),
        a: t('training.faq.bulk.a3', 'Только администраторы и менеджеры могут выполнять массовые операции.')
      }
    ]
  },
  {
    id: 'audit',
    icon: '📝',
    title: t('training.faq.audit.title', 'О журнале действий'),
    questions: [
      {
        q: t('training.faq.audit.q1', 'Что такое журнал действий?'),
        a: t('training.faq.audit.a1', 'Это список всех изменений в системе: кто создал заказ, кто изменил стадию, кто удалил клиента и т.д.')
      },
      {
        q: t('training.faq.audit.q2', 'Кто может просматривать журнал действий?'),
        a: t('training.faq.audit.a2', 'Только администраторы могут просматривать журнал действий (audit log).')
      },
      {
        q: t('training.faq.audit.q3', 'Какие действия записываются в журнал?'),
        a: t('training.faq.audit.a3', 'Записываются все важные действия: создание, изменение и удаление заказов, клиентов, проектов, товаров, сотрудников и другие операции.')
      }
    ]
  },
  {
    id: 'clients',
    icon: '👤',
    title: t('training.faq.clients.title', 'О клиентах и проектах'),
    questions: [
      {
        q: t('training.faq.clients.q1', 'Кто может добавлять новых клиентов?'),
        a: t('training.faq.clients.a1', 'Администраторы и менеджеры могут добавлять клиентов.')
      },
      {
        q: t('training.faq.clients.q2', 'Что видит сотрудник о клиентах?'),
        a: t('training.faq.clients.a2', 'Сотрудник видит информацию только о тех клиентах, у которых есть заказы, назначенные этому сотруднику.')
      },
      {
        q: t('training.faq.clients.q3', 'Что такое проект?'),
        a: t('training.faq.clients.a3', 'Проект - это группа заказов, связанных между собой. Например, один большой заказ может состоять из нескольких заказов, которые объединены в проект.')
      },
      {
        q: t('training.faq.clients.q4', 'Кто может создавать проекты?'),
        a: t('training.faq.clients.a4', 'Администраторы и менеджеры могут создавать проекты.')
      }
    ]
  }
])

// Полезные советы
const tips = computed(() => [
  {
    title: t('training.tips.staff.title', 'Для сотрудников:'),
    items: [
      t('training.tips.staff.item1', 'Регулярно проверяйте свои назначенные заказы'),
      t('training.tips.staff.item2', 'Обновляйте статус работы, чтобы менеджеры знали о прогрессе'),
      t('training.tips.staff.item3', 'Используйте комментарии для общения с менеджерами и другими сотрудниками')
    ]
  },
  {
    title: t('training.tips.manager.title', 'Для менеджеров:'),
    items: [
      t('training.tips.manager.item1', 'Назначайте заказы сотрудникам сразу после создания'),
      t('training.tips.manager.item2', 'Следите за стадиями заказов и переводите их вовремя'),
      t('training.tips.manager.item3', 'Используйте статистику для контроля работы')
    ]
  },
  {
    title: t('training.tips.admin.title', 'Для администраторов:'),
    items: [
      t('training.tips.admin.item1', 'Регулярно проверяйте журнал действий для безопасности'),
      t('training.tips.admin.item2', 'Настраивайте стадии и роли под специфику вашего производства'),
      t('training.tips.admin.item3', 'Контролируйте активность всех пользователей через статистику')
    ]
  }
])

// Что можно делать
const canDoItems = computed(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isStaff = !user?.roles?.some((r: any) => ['admin', 'manager'].includes(r.name))
  
  if (isStaff) {
    return [
      t('training.permissions.can.staff1', 'Просматривать заказы, которые им назначены'),
      t('training.permissions.can.staff2', 'Изменять статус своей работы'),
      t('training.permissions.can.staff3', 'Оставлять комментарии к заказам'),
      t('training.permissions.can.staff4', 'Просматривать свою статистику работы'),
      t('training.permissions.can.staff5', 'Получать уведомления о новых назначениях')
    ]
  }
  
  return [
    t('training.permissions.can.manager1', 'Создавать и редактировать заказы'),
    t('training.permissions.can.manager2', 'Назначать заказы сотрудникам'),
    t('training.permissions.can.manager3', 'Менять стадию заказов'),
    t('training.permissions.can.manager4', 'Видеть все заказы и данные компании'),
    t('training.permissions.can.manager5', 'Просматривать полную статистику')
  ]
})

// Что нельзя делать
const cannotDoItems = computed(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isStaff = !user?.roles?.some((r: any) => ['admin', 'manager'].includes(r.name))
  
  if (isStaff) {
    return [
      t('training.permissions.cannot.staff1', 'Создавать новые заказы'),
      t('training.permissions.cannot.staff2', 'Редактировать заказы'),
      t('training.permissions.cannot.staff3', 'Менять стадию заказа'),
      t('training.permissions.cannot.staff4', 'Видеть цены в заказах'),
      t('training.permissions.cannot.staff5', 'Видеть все заказы компании')
    ]
  }
  
  return [
    t('training.permissions.cannot.manager1', 'Управлять стадиями и ролями'),
    t('training.permissions.cannot.manager2', 'Редактировать сотрудников'),
    t('training.permissions.cannot.manager3', 'Удалять заказы')
  ]
})
</script>
