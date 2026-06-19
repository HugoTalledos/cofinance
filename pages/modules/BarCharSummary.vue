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

  const maxBudget = categoriesData.value[0].budget;

  if (maxBudget === 0) {
    return categoriesData.value.map(category => ({
      icon: category.icon || '👋',
      value: shortFormatCurrency(category.spent),
      targetValue: shortFormatCurrency(category.budget),
      percentage: category.percentage,
      actualHeight: 0,
      targetHeight: 0,
      color: category.color || 'bg-orange-100',
      categoryId: category.categoryId,
      categoryName: categoryNameMap.value[category.categoryId] || category.categoryId,
    }));
  }

  return categoriesData.value.map((category) => {
    const targetHeight = (category.budget / maxBudget) * 90;
    const actualHeight = (category.spent / maxBudget) * 90;

    return {
      icon: category.icon || '👋',
      value: shortFormatCurrency(category.spent),
      targetValue: shortFormatCurrency(category.budget),
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
