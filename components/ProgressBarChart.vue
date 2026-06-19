<template>
  <div class="size-full overflow-x-auto scrollbar-hide">
    <div class="size-full flex items-end justify-start gap-4 bg-white rounded-3xl min-w-max p-4">
      <div
        v-for="(item, index) in data"
        :key="index"
        class="relative flex flex-col items-center w-24 min-w-[120px] group cursor-pointer transition-opacity duration-300"
        :class="{ 'opacity-40': selectedCategoryId && selectedCategoryId !== item.categoryId }"
        @click="emit('bar-click', { categoryId: item.categoryId, categoryName: item.categoryName })"
      >
        <div class="relative w-full h-80 flex items-end">
          <!-- Barra de color (Gasto) -->
          <div
            :class="[
              item.color,
              'w-full rounded-2xl z-10 transition-all duration-500 ease-out flex flex-col items-center justify-end pb-4 shadow-sm',
              selectedCategoryId === item.categoryId ? 'ring-2 ring-gray-800 ring-offset-2' : ''
            ]"
            :style="{ height: item.actualHeight + '%' }"
          >
            <span class="text-2xl mb-2">{{ item.icon }}</span>
            <div class="text-center font-bold text-gray-800 leading-tight">
              {{ item.value }}
            </div>
            <div class="text-xs font-medium text-gray-400">
              {{ item.percentage }}%
            </div>
          </div>

          <!-- Contenedor de la línea punteada (Presupuesto) -->
          <div
            class="absolute z-20 bottom-0 w-full border-2 border-dashed border-gray-300 rounded-2xl"
            :style="{ height: item.targetHeight + '%' }"
          >
            <div class="absolute -top-5 w-full text-center">
              <span class="text-xs font-semibold text-gray-500 bg-white px-1 rounded">
                {{ item.targetValue }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Data {
  icon: string
  value: string
  targetValue: string
  percentage: number
  actualHeight: number
  targetHeight: number
  color: string
  categoryId: string
  categoryName: string
};

defineProps<{
  data: Data[]
  selectedCategoryId?: string
}>()

const emit = defineEmits<{
  (e: 'bar-click', payload: { categoryId: string; categoryName: string }): void
}>()
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
