<template>
  <IconPhone stroke="2" v-if="type === 'phone'" class="w-5 h-5 text-blue-500 flex-shrink-0" />
  <IconMail stroke="2" v-else-if="type === 'email'" class="w-5 h-5 text-red-500 flex-shrink-0" />
  <IconBrandTelegram stroke="2" v-else-if="type === 'telegram'" class="w-5 h-5 text-blue-400 flex-shrink-0" />
  <IconBrandWhatsapp stroke="2" v-else-if="type === 'whatsapp'" class="w-5 h-5 text-green-500 flex-shrink-0" />
  <IconBrandInstagram
    stroke="2"
    v-else-if="type === 'instagram'"
    class="w-5 h-5 text-pink-500 flex-shrink-0"
  />
  <IconLink stroke="2" v-else class="w-5 h-5 text-gray-400 flex-shrink-0" />
</template>

<script setup lang="ts">
import {
  IconPhone,
  IconMail,
  IconBrandTelegram,
  IconBrandWhatsapp,
  IconBrandInstagram,
  IconLink,
} from '@tabler/icons-vue'

defineProps<{ type: string }>()


defineOptions({
  name: 'ContactTypeIcon'
})
</script>

<style scoped>
/* Обеспечиваем одинаковый размер всех иконок */
svg {
  width: 1.25rem !important;
  height: 1.25rem !important;
  display: block;
}
</style>
