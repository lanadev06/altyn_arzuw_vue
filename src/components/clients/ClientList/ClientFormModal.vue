<template>
  <Modal @close="$emit('close')">
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center"
        >
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            ></path>
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-900">
            {{ client ? 'Редактировать клиента' : 'Добавить клиента' }}
          </h2>
          <p class="text-sm text-gray-500 mt-1">
            {{ client ? 'Обновите информацию о клиенте' : 'Создайте нового клиента в системе' }}
          </p>
        </div>
      </div>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="bg-gray-50 rounded-xl p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            ></path>
          </svg>
          Основная информация
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <span class="text-red-500">*</span>
              Имя
            </label>
            <UIInput
              v-model="form.name"
              placeholder="Введите имя клиента"
              :error="errors.name"
              required
              @input="
                () => {
                  if (errors.name) errors.name = ''
                }
              "
            />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Компания</label>
            <UIInput
              v-model="form.company_name"
              placeholder="Введите название компании"
              :error="errors.company_name"
            />
          </div>
        </div>
      </div>

      <div class="bg-gray-50 rounded-xl p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            ></path>
          </svg>
          Контактная информация
        </h3>
        <div class="space-y-4">
          <div
            v-for="(contact, idx) in form.contacts"
            :key="contact.localId || contact.id"
            class="flex gap-3 items-center p-4 bg-white rounded-lg border border-gray-200"
          >
            <select
              v-model="contact.type"
              class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              required
              @change="handleContactTypeChange($event, idx)"
            >
              <option value="phone">Телефон</option>
              <option value="email">Email</option>
              <option value="telegram">Telegram</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="other">Другое</option>
            </select>
            <ContactTypeIcon :type="contact.type || 'phone'" class="mr-2" />
            <UIInputNoError
              v-if="contact.type === 'phone'"
              :model-value="contact.value ?? ''"
              @update:model-value="(value) => handleContactValueChange(String(value || ''), idx)"
              placeholder="Значение"
              :error="errors.contactErrors[idx]"
              required
              class="flex-1"
            />
            <UIInput
              v-else
              :model-value="contact.value ?? ''"
              @update:model-value="(value) => handleContactValueChange(value, idx)"
              placeholder="Значение"
              required
              class="flex-1"
            />
            <UIButton
              type="button"
              variant="danger"
              @click="removeContactHandler(idx)"
              class="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 border border-red-200"
            >
              ✕
            </UIButton>
          </div>
          <UIButton
            type="button"
            variant="secondary"
            @click="addContact"
            class="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
          >
            + Добавить контакт
          </UIButton>
        </div>
        <div v-if="errors.contacts" class="text-red-600 text-sm mt-3 flex items-center gap-1">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            ></path>
          </svg>
          {{ errors.contacts }}
        </div>
      </div>

      <div class="flex gap-4 pt-6 border-t border-gray-200">
        <UIButton
          type="submit"
          :loading="loading"
          class="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {{ client ? 'Сохранить изменения' : 'Создать клиента' }}
        </UIButton>
        <UIButton v-if="client" type="button" variant="danger" @click="handleDelete" class="px-6">
          Удалить
        </UIButton>
        <UIButton v-else type="button" variant="secondary" @click="$emit('close')" class="px-6">
          Отмена
        </UIButton>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import UIInput from '@/components/ui/UIInput.vue'
import UIInputNoError from '@/components/ui/UIInputNoError.vue'
import UIButton from '@/components/ui/UIButton.vue'
import type { Client, ClientContact } from '@/types/client'
import clientController from '@/controllers/clientControllerInstance'
import ContactTypeIcon from '@/components/clients/ClientList/ContactTypeIcon.vue'
import { toast } from '@/stores/toast'

const { createContact, updateContact, removeContact, create, update, remove } = clientController

const props = defineProps<{ client?: Client | null }>()
const emit = defineEmits(['close', 'submit', 'delete'])

const loading = ref(false)
const errors = reactive({
  name: '',
  company_name: '',
  contacts: '',
  contactErrors: [] as string[],
})

const form = reactive({
  name: '',
  company_name: '',
  contacts: [] as (Partial<ClientContact> & { localId?: number; id?: number })[],
})

const formatPhoneNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, '')

  if (cleaned.startsWith('993')) {
    const rest = cleaned.slice(3)
    if (rest.length <= 2) {
      return `+993 ${rest}`
    } else if (rest.length <= 8) {
      return `+993 ${rest.slice(0, 2)} ${rest.slice(2)}`
    } else {
      return `+993 ${rest.slice(0, 2)} ${rest.slice(2, 8)}`
    }
  }

  if (cleaned.startsWith('7') || cleaned.startsWith('8')) {
    const rest = cleaned.slice(1)
    if (rest.length <= 2) {
      return `+993 ${rest}`
    } else if (rest.length <= 8) {
      return `+993 ${rest.slice(0, 2)} ${rest.slice(2)}`
    } else {
      return `+993 ${rest.slice(0, 2)} ${rest.slice(2, 8)}`
    }
  }

  if (cleaned.startsWith('9')) {
    const rest = cleaned.slice(1)
    if (rest.length <= 2) {
      return `+993 ${rest}`
    } else if (rest.length <= 8) {
      return `+993 ${rest.slice(0, 2)} ${rest.slice(2)}`
    } else {
      return `+993 ${rest.slice(0, 2)} ${rest.slice(2, 8)}`
    }
  }

  if (cleaned.length <= 2) {
    return `+993 ${cleaned}`
  } else if (cleaned.length <= 8) {
    return `+993 ${cleaned.slice(0, 2)} ${cleaned.slice(2)}`
  } else {
    return `+993 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 8)}`
  }
}

const validatePhoneNumber = (phone: string): string => {
  if (!phone || !phone.trim()) {
    return ''
  }

  const cleanPhone = phone.replace(/[\s-]/g, '')
  const phoneRegex = /^\+993\d{8}$/

  if (!phoneRegex.test(cleanPhone)) {
    return 'Телефон должен быть в формате +993 XX YYYYYY'
  }

  const operatorCode = cleanPhone.substring(4, 6)
  const validCodes = [
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '21',
    '22',
    '23',
    '24',
    '25',
    '26',
    '27',
    '28',
    '29',
    '30',
    '31',
    '32',
    '33',
    '34',
    '35',
    '36',
    '37',
    '38',
    '39',
    '40',
    '41',
    '42',
    '43',
    '44',
    '45',
    '46',
    '47',
    '48',
    '49',
    '50',
    '51',
    '52',
    '53',
    '54',
    '55',
    '56',
    '57',
    '58',
    '59',
    '60',
    '61',
    '62',
    '63',
    '64',
    '65',
    '66',
    '67',
    '68',
    '69',
    '70',
    '71',
    '72',
    '73',
    '74',
    '75',
    '76',
    '77',
    '78',
    '79',
    '80',
    '81',
    '82',
    '83',
    '84',
    '85',
    '86',
    '87',
    '88',
    '89',
    '90',
    '91',
    '92',
    '93',
    '94',
    '95',
    '96',
    '97',
    '98',
    '99',
  ]

  if (!validCodes.includes(operatorCode)) {
    return 'Неверный код оператора. Используйте код оператора Туркменистана'
  }

  return ''
}

onMounted(() => {
  if (props.client) {
    form.name = props.client.name || ''
    form.company_name = props.client.company_name || ''
    form.contacts = props.client.contacts.map((c) => ({ ...c }))
    errors.contactErrors = new Array(form.contacts.length).fill('')
  } else {
    form.name = ''
    form.company_name = ''
    form.contacts = []
    errors.contactErrors = []
  }
})

async function addContact() {
  const newContact = {
    type: 'phone' as const,
    value: '',
    localId: Date.now() + Math.random(),
  }
  form.contacts.push(newContact)
  errors.contactErrors.push('')
}

async function updateContactField(idx: number, field: 'type' | 'value', value: string) {
  const contact = form.contacts[idx]
  if (field === 'type') {
    contact.type = value as 'phone' | 'email' | 'telegram' | 'whatsapp' | 'instagram' | 'other'
  } else {
    contact.value = value
  }
}

async function removeContactHandler(idx: number) {
  const contact = form.contacts[idx]
  if (props.client?.id && contact.id) {
    try {
      await removeContact(props.client.id, contact.id)
    } catch {}
  }
  form.contacts.splice(idx, 1)
  errors.contactErrors.splice(idx, 1)
}

function validateForm() {
  errors.name = ''
  errors.company_name = ''
  errors.contacts = ''
  errors.contactErrors = new Array(form.contacts.length).fill('')

  let valid = true

  if (!form.name || !form.name.trim()) {
    errors.name = 'Имя обязательно'
    valid = false
  }

  const phoneContacts = form.contacts.filter((c) => c.type === 'phone')
  if (phoneContacts.length === 0) {
    errors.contacts = 'Нужно указать хотя бы один телефон'
    valid = false
  }

  for (let i = 0; i < form.contacts.length; i++) {
    const c = form.contacts[i]

    if (!c.value || !c.type) {
      errors.contacts = 'Все контакты должны быть заполнены'
      valid = false
      break
    }

    if (c.type === 'phone' && c.value) {
      const phoneError = validatePhoneNumber(c.value)
      if (phoneError) {
        errors.contacts = phoneError
        errors.contactErrors[i] = phoneError
        valid = false
        break
      }
    }
  }

  return valid
}

async function handleSubmit() {
  if (!validateForm()) return
  loading.value = true
  try {
    let clientId = props.client?.id
    if (clientId) {
      const clientData: Partial<Client> = {
        name: form.name,
        company_name: form.company_name || undefined,
        contacts: form.contacts.map((contact) => ({
          id: contact.id || 0,
          client_id: clientId || 0,
          name: contact.type || 'phone',
          phone: contact.type === 'phone' ? contact.value || '' : '',
          email: contact.type === 'email' ? contact.value || '' : '',
          type: contact.type || 'phone',
          value: contact.value || '',
          is_primary: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
      }
      await update(clientId, clientData)
      toast.show('Клиент успешно обновлён!')
    } else {
      const clientData: Partial<Client> = {
        name: form.name,
        company_name: form.company_name || undefined,
        contacts: form.contacts.map((contact) => ({
          id: 0,
          client_id: 0,
          name: contact.type || 'phone',
          phone: contact.type === 'phone' ? contact.value || '' : '',
          email: contact.type === 'email' ? contact.value || '' : '',
          type: contact.type || 'phone',
          value: contact.value || '',
          is_primary: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
      }
      const created = await create(clientData)
      clientId = created.id
      toast.show('Клиент успешно добавлен!')
    }
    for (const contact of form.contacts) {
      if (!contact.id && contact.type && contact.value) {
        try {
          const createdContact = await createContact(clientId, {
            type: contact.type,
            value: contact.value,
          })
          contact.id = createdContact.id
        } catch {
          // Игнорируем ошибку при создании контакта
        }
      } else if (contact.id) {
        try {
          await updateContact(clientId, contact.id, {
            type: contact.type || 'phone',
            value: contact.value || '',
          })
        } catch {
          // Игнорируем ошибку при обновлении контакта
        }
      }
    }
    emit('submit', { id: clientId, ...form })
    emit('close')
  } finally {
    loading.value = false
  }
}

function handleContactTypeChange(event: Event, idx: number) {
  const target = event.target as HTMLSelectElement
  updateContactField(idx, 'type', target?.value || '')
}

function handleContactValueChange(value: string | number | null, idx: number) {
  const contact = form.contacts[idx]
  const stringValue = String(value || '')

  if (contact.type === 'phone' && stringValue && stringValue.trim()) {
    const formattedValue = formatPhoneNumber(stringValue)
    updateContactField(idx, 'value', formattedValue)
    errors.contacts = ''
    errors.contactErrors[idx] = ''
  } else {
    updateContactField(idx, 'value', stringValue)
  }
}

async function handleDelete() {
  if (props.client && props.client.id) {
    const clientId = props.client.id
    try {
      await remove(clientId)
      toast.show('Клиент удалён!')
      emit('delete', clientId)
      emit('close')
    } catch (err: unknown) {
      let message = 'Произошла неизвестная ошибка при удалении клиента'
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data
      ) {
        message = String(err.response.data.message)
      } else if (err instanceof Error && err.message) {
        message = `Ошибка удаления клиента: ${err.message}`
      }
      toast.show(message, 'error')
    }
  }
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

.bg-gray-50 {
  transition: all 0.3s ease;
}

.bg-gray-50:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

h3 svg {
  transition: transform 0.2s ease;
}

h3:hover svg {
  transform: scale(1.1);
}

.space-y-4 > div {
  transition: all 0.2s ease;
}

.space-y-4 > div:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
