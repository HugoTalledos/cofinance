<script setup lang="ts">
import type { ItemProps } from './ListItem.vue';

interface Props {
  items: ItemProps[]
}

const props = defineProps<Props>()
</script>
<template>
  <ul class="size-full bg-white rounded-md p-2 overflow-auto flex flex-col gap-4">
    <template v-for="item in items" :key="item.id">
      <list-item
        :id="item.id"
        :icon="item.icon"
        :title="item.title"
        :description="item.description"
        :amount="item.amount"
        :author="item.author"
        :date="item.date"
      />
    </template>
  </ul>
</template>