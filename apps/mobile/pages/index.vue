<script setup lang="ts">
import CardConsumption from '~/components/summary/CardConsumption.vue'
import AppShell from '~/components/AppShell/AppShell.vue'
import { useSummary } from '~/composables/useSummary'
import { useRecurringExpenses } from '~/composables/useRecurringExpenses'
import { formatBillingPeriodLabel, getCurrentBillingPeriodKey } from '@cofinance/core'

const {
  totalIncome,
  totalSpent,
  totalSaved,
  totalRemaining,
  fetchCurrentMonthSummary,
  currentMonth,
} = useSummary()
const { pendingTotal, fetchExpenses } = useRecurringExpenses()

onMounted(async () => {
  await Promise.all([fetchCurrentMonthSummary(), fetchExpenses()])
})

const periodLabel = computed(() =>
  formatBillingPeriodLabel(currentMonth.value || getCurrentBillingPeriodKey())
)

type SectionKey = 'free' | 'pending' | 'spent' | 'saved'

const COLORS = {
  free: '#0F172A',
  pending: '#920028',
  spent: '#64748B',
  saved: '#059669',
  track: '#F1F5F9',
}

// Lo libre es el restante que no está comprometido en pagos recurrentes pendientes
const totalFree = computed(() => totalRemaining.value - pendingTotal.value)

// Cada sección es un tramo del anillo; las cuatro suman los ingresos del periodo
const sections = computed(() => [
  { key: 'free' as const, label: 'Libre', value: totalFree.value, valueClass: totalFree.value >= 0 ? 'text-slate-900' : 'text-error' },
  { key: 'pending' as const, label: 'Por pagar', value: pendingTotal.value, valueClass: 'text-debt' },
  { key: 'spent' as const, label: 'Gastado', value: totalSpent.value, valueClass: 'text-slate-900' },
  { key: 'saved' as const, label: 'Apartado', value: totalSaved.value, valueClass: 'text-[#059669]' },
])

// Sección resaltada al tocar el anillo o la leyenda; sin selección el centro muestra el restante
const selectedKey = ref<SectionKey | null>(null)

function toggleSection(key: SectionKey) {
  selectedKey.value = selectedKey.value === key ? null : key
}

const centerSection = computed(() => {
  const selected = sections.value.find(section => section.key === selectedKey.value)
  if (selected) return { label: selected.label, value: selected.value, valueClass: selected.valueClass }
  return {
    label: 'Dinero restante',
    value: totalRemaining.value,
    valueClass: totalRemaining.value >= 0 ? 'text-slate-900' : 'text-error',
  }
})

const centerValueLabel = computed(() => formatCurrency(centerSection.value.value))

// Anillo sobre el total de ingresos: gastado + por pagar + libre + apartado
const RADIUS = 62
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const ringSegments = computed(() => {
  const income = totalIncome.value
  if (income <= 0) return []

  // Se recorta en orden para que, si los egresos superan los ingresos, el anillo no se desborde
  const spent = Math.min(totalSpent.value, income)
  const saved = Math.min(totalSaved.value, income - spent)
  const pending = Math.min(pendingTotal.value, income - spent - saved)
  const free = income - spent - saved - pending

  let start = 0
  return [
    { key: 'spent' as const, value: spent },
    { key: 'pending' as const, value: pending },
    { key: 'free' as const, value: free },
    { key: 'saved' as const, value: saved },
  ]
    .filter(segment => segment.value > 0)
    .map(segment => {
      const length = (segment.value / income) * CIRCUMFERENCE
      const arc = {
        key: segment.key,
        color: COLORS[segment.key],
        dasharray: `${length} ${CIRCUMFERENCE}`,
        dashoffset: -start,
      }
      start += length
      return arc
    })
})

const slides = ref<HTMLElement | null>(null)
const activeSlide = ref(0)
function goToSlide(index: number) { slides.value?.scrollTo({left: index * slides.value.clientWidth, behavior: 'smooth'}) }
function updateSlide() { if (slides.value) activeSlide.value = Math.round(slides.value.scrollLeft / slides.value.clientWidth) }

const isDimmed = (key: SectionKey) => selectedKey.value !== null && selectedKey.value !== key
</script>

<template>
  <app-shell>
    <div ref="slides" class="flex overflow-x-auto snap-x snap-mandatory w-full min-w-0 items-start [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Resumen y consumo por tarjeta" @scroll.passive="updateSlide">
    <div class="w-full min-w-0 shrink-0 snap-start px-0.5">
    <section class="mt-2 bg-surface-container-lowest border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col items-center">
      <div class="relative flex items-center justify-center w-64 h-64 my-1">
        <svg class="w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" :r="RADIUS" fill="transparent" :stroke="COLORS.track" stroke-width="12" />
          <circle
            v-for="segment in ringSegments"
            :key="segment.key"
            cx="80"
            cy="80"
            :r="RADIUS"
            fill="transparent"
            :stroke="segment.color"
            :stroke-width="selectedKey === segment.key ? 16 : 12"
            :stroke-dasharray="segment.dasharray"
            :stroke-dashoffset="segment.dashoffset"
            :opacity="isDimmed(segment.key) ? 0.25 : 1"
            class="cursor-pointer transition-all duration-300"
            @click="toggleSection(segment.key)"
          />
        </svg>
        <div class="absolute inset-[16%] flex flex-col items-center justify-center text-center pointer-events-none">
          <span class="text-label-sm text-on-surface-variant uppercase mb-0.5">{{ centerSection.label }}</span>
          <span
            class="font-display font-bold tracking-tight tabular-nums leading-tight"
            :class="[
              centerSection.valueClass,
              centerValueLabel.length > 11 ? 'text-xl' : 'text-headline-lg'
            ]"
          >{{ centerValueLabel }}</span>
          <span class="text-[11px] text-slate-500 mt-0.5">{{ periodLabel }}</span>
        </div>
      </div>

      <div class="w-full grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
        <button
          v-for="section in sections"
          :key="section.key"
          type="button"
          :aria-pressed="selectedKey === section.key"
          class="flex items-center gap-2 p-1.5 rounded-lg text-left transition-all duration-300"
          :class="[
            selectedKey === section.key
              ? 'bg-surface-container-lowest ring-2 ring-black shadow-sm'
              : 'bg-surface-container-low',
            isDimmed(section.key) ? 'opacity-50' : ''
          ]"
          @click="toggleSection(section.key)"
        >
          <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: COLORS[section.key] }" />
          <div class="flex flex-col min-w-0">
            <span class="text-[11px] text-on-surface-variant leading-none">{{ section.label }}</span>
            <span
              class="text-body-md font-semibold leading-tight tabular-nums truncate"
              :class="section.valueClass"
            >{{ formatCurrency(section.value) }}</span>
          </div>
        </button>

        <div class="col-span-2 flex items-center justify-between px-2.5 py-2 rounded-lg border border-slate-100">
          <span class="text-[11px] text-on-surface-variant">Ingresos del periodo</span>
          <span class="text-body-md font-semibold tabular-nums text-slate-900">{{ formatCurrency(totalIncome) }}</span>
        </div>
      </div>
    </section>
    </div>
    <div class="w-full min-w-0 shrink-0 snap-start px-0.5 pt-2"><CardConsumption :period-key="currentMonth || getCurrentBillingPeriodKey()" :period-label="periodLabel" /></div>
    </div>
    <div class="flex flex-col items-center gap-2 -mt-3"><div class="flex gap-3"><button v-for="(label,index) in ['Resumen','Tarjetas']" :key="label" type="button" :aria-current="activeSlide===index ? 'true' : undefined" class="px-3 py-2 rounded-full text-label-sm" :class="activeSlide===index ? 'bg-primary-container text-white' : 'bg-surface-container text-on-surface-variant'" @click="goToSlide(index)">{{ label }}</button></div><p class="text-[11px] text-slate-500">{{ activeSlide === 0 ? 'Desliza a la izquierda para ver el consumo por tarjeta' : 'Desliza a la derecha para volver al resumen' }}</p></div>

    <NuxtLink
      to="/registrar"
      class="w-full h-12 bg-black text-white rounded-lg text-body-md font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform duration-150 shadow-sm"
    >
      <app-icon name="add" />
      Registrar Movimiento
    </NuxtLink>
  </app-shell>
</template>
