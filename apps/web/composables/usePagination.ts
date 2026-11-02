import { computed, ref, watch, type Ref, type WatchSource } from 'vue'

export function usePagination<T>(items: Ref<T[]>, pageSize: number, resetOn: WatchSource[]) {
  const page = ref(1)
  watch(resetOn, () => { page.value = 1 })

  const total = computed(() => items.value.length)
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
  // Si los elementos se reducen, acota la página a la última válida
  watch(pageCount, (count) => { if (page.value > count) page.value = count })

  const from = computed(() => (total.value === 0 ? 0 : (page.value - 1) * pageSize + 1))
  const to = computed(() => Math.min(page.value * pageSize, total.value))
  const pageItems = computed(() => items.value.slice((page.value - 1) * pageSize, page.value * pageSize))
  const hasPrev = computed(() => page.value > 1)
  const hasNext = computed(() => page.value < pageCount.value)
  const prev = () => { if (hasPrev.value) page.value-- }
  const next = () => { if (hasNext.value) page.value++ }

  return { page, pageItems, from, to, total, hasPrev, hasNext, prev, next }
}
