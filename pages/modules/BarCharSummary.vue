<script setup lang="ts">
import ProgressBarChart from '~/components/ProgressBarChart.vue';
import { useSummary } from '#imports';
import { useCategories } from '~/composables/useCategories';

defineProps<{ currentMonth: string; selectedCategoryId?: string }>()
const emit = defineEmits<{
  (e: 'category-click', payload: { categoryId: string; categoryName: string }): void
}>()

const { fetchCurrentMonthSummary, categoriesData } = useSummary()
const { sortedCategories } = useCategories()

const categoryNameMap = computed(() => {
  const map: Record<string, string> = {}
  sortedCategories.value.forEach(cat => { map[cat.id] = cat.name })
  return map
})

const formatedData = computed(() => {
  if (!categoriesData.value || categoriesData.value.length === 0) {
    return [];
  }

  // La escala considera presupuestos y gastos: así las barras siempre se pintan,
  // haya o no presupuesto definido en las categorías.
  const scale = Math.max(
    ...categoriesData.value.map(c => Math.max(c.budget || 0, c.spent || 0)),
    0
  );

  return categoriesData.value.map((category) => {
    const hasBudget = category.budget > 0;
    const targetHeight = scale > 0 && hasBudget ? (category.budget / scale) * 90 : 0;
    const actualHeight = scale > 0 ? (category.spent / scale) * 90 : 0;

    return {
      icon: category.icon || '👋',
      value: shortFormatCurrency(category.spent),
      targetValue: hasBudget ? shortFormatCurrency(category.budget) : '',
      hasBudget,
      percentage: category.percentage,
      actualHeight: parseFloat(actualHeight.toFixed(2)),
      targetHeight: parseFloat(targetHeight.toFixed(2)),
      color: category.color || 'bg-orange-100',
      categoryId: category.categoryId,
      categoryName: categoryNameMap.value[category.categoryId] || category.categoryId,
    }
  })
})

onMounted(async () => {
  await fetchCurrentMonthSummary()
})
</script>
<template>
  <progress-bar-chart
    :data="formatedData"
    :selected-category-id="selectedCategoryId"
    @bar-click="emit('category-click', $event)"
  />
</template>
