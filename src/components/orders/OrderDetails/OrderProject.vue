<template>
  <div class="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-blue-100 flex flex-col gap-3">
    <div class="text-2xl font-extrabold text-blue-900 mb-2">Проект</div>
    <div class="text-base text-gray-800">
      Название: <b>{{ project?.title }}</b>
    </div>
    <div class="text-base text-gray-800">
      Клиент:
      <b>
        {{ order?.client?.name
        }}<template v-if="order?.client?.company_name"> ({{ order.client.company_name }})</template
        ><template v-else-if="!order?.client?.name">-</template>
      </b>
    </div>

    <!-- Контакты клиента -->
    <div v-if="order?.client?.contacts && order.client.contacts.length > 0" class="mt-4">
      <div class="text-base font-semibold text-gray-800 mb-2">Контакты клиента:</div>
      <div class="flex flex-col gap-2">
        <div
          v-for="contact in order.client.contacts"
          :key="contact.id"
          class="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200"
        >
          <!-- Иконка типа контакта -->
          <div class="flex-shrink-0">
            <component
              :is="getContactIcon(contact.type)"
              class="w-5 h-5"
              :class="getContactIconClass(contact.type)"
            />
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
              @click="handleContactAction(contact)"
              :class="getContactActionClass(contact.type)"
              :title="getContactActionTitle(contact.type)"
            >
              <component :is="getContactIcon(contact.type)" class="w-4 h-4" />
            </button>
          </div>
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
  </div>
</template>

<script setup lang="ts">
import { h, type VNode } from 'vue'
import { toast } from '../../../stores/toast'
import type { OrderInfo, ProjectInfo, ContactInfo } from '../../../types/orderDetails'

interface Props {
  order?: OrderInfo | null
  project?: ProjectInfo | null
}

defineProps<Props>()

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

function getContactIcon(type: string) {
  const icons: Record<string, () => VNode> = {
    phone: () =>
      h(
        'svg',
        {
          fill: 'currentColor',
          viewBox: '0 0 20 20',
        },
        [
          h('path', {
            d: 'M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z',
          }),
        ],
      ),
    email: () =>
      h(
        'svg',
        {
          fill: 'currentColor',
          viewBox: '0 0 20 20',
        },
        [
          h('path', {
            d: 'M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z',
          }),
          h('path', {
            d: 'M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z',
          }),
        ],
      ),
    telegram: () =>
      h(
        'svg',
        {
          fill: 'currentColor',
          viewBox: '0 0 24 24',
        },
        [
          h('path', {
            d: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z',
          }),
        ],
      ),
    whatsapp: () =>
      h(
        'svg',
        {
          fill: 'currentColor',
          viewBox: '0 0 24 24',
        },
        [
          h('path', {
            d: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488',
          }),
        ],
      ),
    instagram: () =>
      h(
        'svg',
        {
          fill: 'currentColor',
          viewBox: '0 0 24 24',
        },
        [
          h('path', {
            d: 'M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.781c-.49 0-.928-.175-1.297-.49-.368-.315-.49-.753-.49-1.243 0-.49.122-.928.49-1.243.369-.315.807-.49 1.297-.49s.928.175 1.297.49c.368.315.49.753.49 1.243 0 .49-.122.928-.49 1.243-.369.315-.807.49-1.297.49z',
          }),
        ],
      ),
    other: () =>
      h(
        'svg',
        {
          fill: 'currentColor',
          viewBox: '0 0 20 20',
        },
        [
          h('path', {
            'fill-rule': 'evenodd',
            d: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z',
            'clip-rule': 'evenodd',
          }),
        ],
      ),
  }
  return icons[type] || icons.other
}

function getContactIconClass(type: string): string {
  const classes: Record<string, string> = {
    phone: 'text-green-600',
    email: 'text-blue-600',
    telegram: 'text-blue-500',
    whatsapp: 'text-green-500',
    instagram: 'text-pink-600',
    other: 'text-gray-600',
  }
  return classes[type] || classes.other
}

function getContactActionClass(type: string): string {
  const baseClass = 'p-1 transition-colors'
  const classes: Record<string, string> = {
    phone: 'text-green-600 hover:text-green-700',
    email: 'text-blue-600 hover:text-blue-700',
    telegram: 'text-blue-500 hover:text-blue-600',
    whatsapp: 'text-green-500 hover:text-green-600',
    other: 'text-gray-600 hover:text-gray-700',
  }
  return `${baseClass} ${classes[type] || classes.other}`
}

function getContactActionTitle(type: string): string {
  const titles: Record<string, string> = {
    phone: 'Позвонить',
    email: 'Написать email',
    telegram: 'Открыть в Telegram',
    whatsapp: 'Открыть в WhatsApp',
    other: 'Копировать',
  }
  return titles[type] || titles.other
}

function handleContactAction(contact: ContactInfo) {
  switch (contact.type) {
    case 'phone':
      callPhone(contact.value)
      break
    case 'email':
      sendEmail(contact.value)
      break
    case 'telegram':
      openTelegram(contact.value)
      break
    case 'whatsapp':
      openWhatsApp(contact.value)
      break
    default:
      copyToClipboard(contact.value)
  }
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

function reasonStatusText(status: string) {
  return (
    {
      refused: 'Отказ клиента',
      not_responding: 'Не отвечает',
      defective_product: 'Брак/Дефект',
    }[status] || status
  )
}


defineOptions({
  name: 'OrderProject'
})
</script>
