<template>
  <Layout>
    <div class="flex flex-col gap-4">
      <OrderList />
    </div>
  </Layout>
</template>

<script setup lang="ts">
import Layout from '@/components/layout/Layout.vue'
import OrderList from '@/components/orders/OrderList/OrderList.vue'
</script>
