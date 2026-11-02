<script setup lang="ts">
import { getTransactions, getCreditCards, getCardConsumption, getBillingPeriodRangeFromKey, getCardTrackingTransactions, computeCardBalance, isCardConfigured, cardToday, type Transaction, type CreditCard } from '@cofinance/core'
const props = defineProps<{ periodKey: string; periodLabel: string }>()
const transactions = ref<Transaction[]>([])
const cards = ref<CreditCard[]>([])
const loading = ref(true)
const error = ref<string|null>(null)
const selected = ref<string|null>(null)
const selectedCard = computed(()=>cards.value.find(card=>card.id===selected.value))
const balance = ref<number|null>(null)
const balanceLoading = ref(false)
const balanceError = ref<string|null>(null)
const balanceRetry = ref(0)
watch([selectedCard,balanceRetry],async ([card],_,onCleanup)=>{
 let active=true
 onCleanup(()=>{active=false})
 balance.value=null;balanceError.value=null;balanceLoading.value=false
 if(!card || !isCardConfigured(card)) return
 balanceLoading.value=true
 const today=cardToday()
 try {
  const result=await getCardTrackingTransactions(card,today)
  if(!active) return
  if(result.error) throw new Error(result.error)
  balance.value=computeCardBalance(card,result.data ?? [],today)
 } catch(e) {
  if(active) balanceError.value='No se pudo cargar el saldo pendiente.'
 } finally {if(active) balanceLoading.value=false}
},{flush:'sync'})
const colors = ['#0F172A','#920028','#059669','#2563EB','#D97706','#7C3AED','#0891B2']
let request = 0
async function load() {
 const token = ++request; loading.value=true;error.value=null;selected.value=null
 try {
  const {startDate,endDate} = getBillingPeriodRangeFromKey(props.periodKey)
  const [tx,c] = await Promise.all([getTransactions({dateFrom:startDate,dateTo:endDate}),getCreditCards()])
  if(token !== request) return
  if(tx.error || c.error) throw new Error(tx.error || c.error!)
  transactions.value=tx.data ?? [];cards.value=c.data ?? []
 } catch(e) {if(token===request) error.value=e instanceof Error ? e.message : 'No se pudo cargar el consumo'}
 finally {if(token===request) loading.value=false}
}
watch(()=>props.periodKey,load,{immediate:true})
onBeforeUnmount(()=>{request++})
const rows = computed(()=>getCardConsumption(transactions.value,cards.value))
const total = computed(()=>rows.value.reduce((sum,r)=>sum+r.amount,0))
const center = computed(()=>rows.value.find(r=>r.id===selected.value))
const segments = computed(()=>{
 let offset=0
 return rows.value.map((r,index)=>{const length=r.amount/total.value*100;const segment={...r,color:colors[index%colors.length],length,offset};offset+=length;return segment})
})
</script>
<template>
 <section class="bg-surface-container-lowest border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col items-center h-full" aria-label="Consumo por tarjeta">
  <h2 class="font-semibold text-title-md">Consumo por tarjeta</h2>
  <p class="text-[11px] text-slate-500 mt-1">{{ periodLabel }}</p>
  <p v-if="loading" role="status" class="py-16">Cargando consumo…</p>
  <div v-else-if="error" role="alert" class="py-10 text-error"><p>{{ error }}</p><button type="button" class="underline mt-3" @click="load">Reintentar</button></div>
  <template v-else>
   <div class="relative flex items-center justify-center w-64 h-64 my-1 max-w-full">
    <svg class="w-full h-full -rotate-90" viewBox="0 0 160 160" role="img" aria-label="Distribución del consumo de compras por tarjeta">
     <circle cx="80" cy="80" r="62" fill="none" stroke="#F1F5F9" stroke-width="12" />
     <circle v-for="segment in segments" :key="segment.id" cx="80" cy="80" r="62" fill="none" :stroke="segment.color" :stroke-width="selected===segment.id ? 16 : 12" pathLength="100" :stroke-dasharray="`${segment.length} ${100-segment.length}`" :stroke-dashoffset="-segment.offset" :opacity="selected && selected!==segment.id ? 0.25 : 1" class="transition-all duration-300 cursor-pointer" @click="selected=selected===segment.id ? null : segment.id" />
    </svg>
    <div class="absolute inset-[16%] flex flex-col items-center justify-center text-center pointer-events-none"><span class="text-label-sm text-on-surface-variant">{{ center?.bank ?? 'Consumo total' }}</span><strong class="font-display text-xl tracking-tight tabular-nums">{{ formatCurrency(center?.amount ?? total) }}</strong><span class="text-[11px] text-slate-500">Compras con crédito</span></div>
   </div>
   <div v-if="selected" class="w-full rounded-lg bg-surface-container-low p-3 text-center" aria-live="polite">
    <p v-if="balanceLoading" role="status" class="text-body-sm text-on-surface-variant">Cargando saldo pendiente…</p>
    <div v-else-if="balanceError" role="alert" class="text-body-sm text-error"><p>{{ balanceError }}</p><button type="button" class="underline mt-1" @click="balanceRetry++">Reintentar</button></div>
    <template v-else-if="balance !== null">
     <p class="text-label-sm text-on-surface-variant">{{ balance < 0 ? 'Saldo a favor' : 'Saldo pendiente' }}</p>
     <strong class="font-display text-xl tabular-nums">{{ formatCurrency(Math.abs(balance)) }}</strong>
     <p class="text-[11px] text-slate-500">Actualizado a hoy · incluye compras y abonos</p>
    </template>
    <p v-else class="text-body-sm text-on-surface-variant">{{ selectedCard ? 'Configura el saldo inicial de esta tarjeta en la web.' : 'Saldo no disponible para compras sin tarjeta asignada.' }}</p>
   </div>
   <p v-if="!rows.length" class="text-body-sm text-on-surface-variant text-center">Sin compras con tarjeta en este período.</p>
   <ul v-else class="w-full flex flex-col gap-2 mt-4 pt-4 border-t border-slate-100"><li v-for="segment in segments" :key="segment.id"><button type="button" :aria-pressed="selected===segment.id" class="flex items-center gap-2 w-full p-2 rounded-lg text-left" :class="selected===segment.id ? 'bg-surface-container ring-1 ring-slate-900' : 'bg-surface-container-low'" @click="selected=selected===segment.id ? null : segment.id"><span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{backgroundColor:segment.color}"/><span class="flex-1 min-w-0 text-body-sm">{{ segment.bank }}</span><span class="text-right text-body-sm font-semibold tabular-nums">{{ formatCurrency(segment.amount) }}<span class="block text-[11px] text-slate-500 font-normal">{{ segment.length.toFixed(1) }}%</span></span></button></li></ul>
  </template>
 </section>
</template>
