<script setup lang="ts">
import type { ItemProps } from './ListItem.vue';

interface Props {
  items: ItemProps[]
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'itemClick', item: ItemProps): void
}>()
</script>
<template>
  <ul class="size-full overflow-auto flex flex-col gap-2">
    <p v-if="items.length === 0" class="text-center text-on-surface-variant">No hay items</p>
    <template v-else v-for="item in items" :key="item.id">
      <list-item
        :id="item.id"
        :type="item.type"
        :icon="item.icon"
        :title="item.title"
        :description="item.description"
        :amount="item.amount"
        :author="item.author"
        :date="item.date"
        :clickable="item.clickable"
        @click="emit('itemClick', item)"
      />
    </template>
  </ul>
</template>