<template>
  <Layout v-slot="{ search }">
    <div class="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      <ProjectList
        :search="search"
        :show-create-modal="showCreateModal"
        @close-create-modal="closeCreateModal"
      />
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ProjectList from '../components/projects/ProjectList/ProjectList.vue'
import UIButton from '../components/ui/UIButton.vue'
import Layout from '../components/layout/Layout.vue'

const showCreateModal = ref(false)

function openCreateModal() {
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}
</script>
