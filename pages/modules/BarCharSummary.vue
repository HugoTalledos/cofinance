<script setup lang="ts">
import ProgressBarChart from '~/components/ProgressBarChart.vue';
import { useSummary } from '#imports';
import { categoriesEmojis } from '#imports';


const props = defineProps<{ currentMonth: string }>()
const { fetchCurrentMonthSummary, totalBudget, categoriesData } = useSummary()
const formatedData = computed(() => {
  return categoriesData.value.map((category) => {
    const percentageOfBudget = ruleOfThree(totalBudget.value, category.budget)
    const rawPercentageOfSpent = (category.percentage * percentageOfBudget) / 100
    const percentageOfSpent = rawPercentageOfSpent.toFixed(2)
    return ({
      icon: categoriesEmojis[`code_${category.categoryId}` as keyof typeof categoriesEmojis] || '',
      value: shortFormatCurrency(category.spent),
      percentage: category.percentage,
      actualHeight: parseFloat(percentageOfSpent),
      targetHeight: percentageOfBudget,
      color: 'bg-orange-100'
    })
  })
})

onMounted(async () => {
  await fetchCurrentMonthSummary()
})
</script>
<template>
  <progress-bar-chart :data="formatedData" />
</template>