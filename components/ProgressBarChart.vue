<template>
  <div class="size-full overflow-x-auto scrollbar-hide">
    <div 
      class="size-full flex items-end justify-start gap-4 bg-white rounded-3xl min-w-max"
    >
      <div 
        v-for="(item, index) in data" 
        :key="index" 
        class="relative flex flex-col items-center w-24 min-w-[120px] group"
      >
        <div class="relative w-full h-80 flex items-end">
          <div 
            class="absolute bottom-0 w-full border-2 border-dashed border-gray-300 rounded-3xl"
            :style="{ height: item.targetHeight + '%' }"
          ></div>

          <div 
            :class="[
              item.color, 
              'w-full rounded-3xl z-10 transition-all duration-500 ease-out flex flex-col items-center justify-end pb-4 shadow-sm'
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

        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Ejemplo con más elementos para probar el scroll
interface Data {
  icon: string
  value: string
  percentage: number
  actualHeight: number
  targetHeight: number
  color: string
};

defineProps<{
  data?: Data[]
}>()

const data: Data[] = [
  { icon: '🍔', value: '368k', percentage: 92, actualHeight: 85, targetHeight: 95, color: 'bg-orange-100' },
  { icon: '🎮', value: '353k', percentage: 118, actualHeight: 80, targetHeight: 65, color: 'bg-blue-100' },
  { icon: '🛍️', value: '198k', percentage: 79, actualHeight: 45, targetHeight: 60, color: 'bg-pink-100' },
  { icon: '💡', value: '180k', percentage: 120, actualHeight: 40, targetHeight: 30, color: 'bg-yellow-100' },
  { icon: '✈️', value: '540k', percentage: 105, actualHeight: 90, targetHeight: 85, color: 'bg-green-100' },
  { icon: '🚗', value: '120k', percentage: 50, actualHeight: 30, targetHeight: 60, color: 'bg-purple-100' },
  { icon: '🏋️', value: '95k', percentage: 110, actualHeight: 75, targetHeight: 68, color: 'bg-red-100' }
]
</script>

<style scoped>
/* Opcional: Oculta la barra de scroll en Chrome, Safari y Firefox pero mantiene la funcionalidad */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>