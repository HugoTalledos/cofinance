<script setup lang="ts">
import { cardToday, isCardConfigured, type Transaction } from '@cofinance/core'
const {cards,selectedCardId,selectedCard,movements,balance,loading,saving,error,reload,selectCard,saveSettings,createPayment,editPayment,removePayment} = useCardControl()
const mode = ref<'settings'|'payment'|null>(null)
const editing = ref<string|null>(null)
const removing = ref<string|null>(null)
const notice = ref<string|null>(null)
const settings = reactive({openingBalance:0,trackingStartDate:cardToday(),statementDay:null as number|null,paymentDay:null as number|null})
const payment = reactive({amount:0,date:cardToday(),description:''})
const money = (n:number) => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n)
function configure() {
 const c=selectedCard.value
 if(!c) return
 Object.assign(settings,{openingBalance:c.openingBalance ?? 0,trackingStartDate:c.trackingStartDate ?? cardToday(),statementDay:c.statementDay ?? null,paymentDay:c.paymentDay ?? null})
 mode.value='settings';notice.value=null
}
function openPayment(tx?:Transaction) { editing.value=tx?.id ?? null;Object.assign(payment,{amount:tx?.amount ?? 0,date:tx?.date ?? cardToday(),description:tx?.description ?? ''});mode.value='payment';notice.value=null }
async function save() {
 notice.value=null
 const result=mode.value==='settings' ? await saveSettings({...settings,statementDay:settings.statementDay || null,paymentDay:settings.paymentDay || null}) : editing.value ? await editPayment(editing.value,{...payment}) : await createPayment({...payment})
 notice.value=result.error
 if(result.saved) mode.value=null
}
async function remove() {if(!removing.value) return;const r=await removePayment(removing.value);notice.value=r.error;if(r.saved) removing.value=null}
onMounted(reload)
</script>
<template>
 <section class="flex flex-col gap-5 max-w-4xl mx-auto w-full pb-20">
  <div class="flex items-center justify-between gap-3"><h1 class="text-2xl font-semibold">Tarjetas</h1><button type="button" :disabled="loading || saving" class="underline disabled:opacity-50" @click="reload">Actualizar</button></div>
  <p v-if="notice" role="status" class="p-3 rounded-lg bg-amber-50 text-amber-900">{{ notice }}</p>
  <p v-if="error" role="alert" class="p-3 rounded-lg bg-red-50 text-red-800">{{ error }} <button class="underline" @click="reload">Reintentar</button></p>
  <label class="flex flex-col gap-2">Tarjeta<select :value="selectedCardId" :disabled="saving || loading" class="border rounded-lg p-3 bg-white text-slate-900" @change="mode=null;removing=null;notice=null;selectCard(($event.target as HTMLSelectElement).value)"><option v-for="c in cards" :key="c.id" :value="c.id">{{ c.bank }}</option></select></label>
  <p v-if="loading">Cargando seguimiento…</p>
  <p v-else-if="!cards.length && !error">No hay tarjetas registradas.</p>
  <template v-else-if="selectedCard && !error">
   <div class="border rounded-xl p-5 bg-white text-slate-900 flex flex-col gap-3">
    <p>{{ balance === null ? 'Configurar saldo' : balance < 0 ? 'Saldo a favor' : 'Saldo pendiente' }}</p>
    <strong v-if="balance !== null" class="text-3xl">{{ money(Math.abs(balance)) }}</strong>
    <p v-if="selectedCard.trackingStartDate" class="text-sm text-slate-500">Seguimiento desde {{ selectedCard.trackingStartDate }}</p>
    <p class="text-sm">Día de corte: {{ selectedCard.statementDay ?? 'Sin definir' }} · Día de pago: {{ selectedCard.paymentDay ?? 'Sin definir' }}</p>
    <p class="text-xs text-slate-500">Los días son informativos.</p>
    <div class="flex gap-4"><button :disabled="saving" class="underline" @click="configure">Configurar saldo</button><button v-if="isCardConfigured(selectedCard)" :disabled="saving" class="rounded-lg bg-slate-900 text-white px-4 py-2" @click="openPayment()">Registrar abono</button></div>
   </div>
   <form v-if="mode" class="border rounded-xl p-5 bg-white text-slate-900 flex flex-col gap-4" @submit.prevent="save">
    <h2 class="text-lg font-semibold">{{ mode === 'settings' ? 'Configurar seguimiento' : editing ? 'Editar abono' : 'Registrar abono' }}</h2>
    <template v-if="mode === 'settings'">
     <p class="text-sm">El saldo inicial es la deuda al comenzar la fecha elegida. Cambiarlo recalcula todo el seguimiento.</p>
     <label class="flex flex-col gap-1">Saldo inicial (COP)<input v-model.number="settings.openingBalance" type="number" step="1" required class="border rounded p-2"></label>
     <label class="flex flex-col gap-1">Fecha de inicio<input v-model="settings.trackingStartDate" type="date" :max="cardToday()" required class="border rounded p-2"></label>
     <label class="flex flex-col gap-1">Día de corte (opcional)<input v-model.number="settings.statementDay" type="number" min="1" max="31" class="border rounded p-2"></label>
     <label class="flex flex-col gap-1">Día de pago (opcional)<input v-model.number="settings.paymentDay" type="number" min="1" max="31" class="border rounded p-2"></label>
    </template>
    <template v-else>
     <label class="flex flex-col gap-1">Monto del abono (COP)<input v-model.number="payment.amount" type="number" min="1" step="1" required class="border rounded p-2"></label>
     <label class="flex flex-col gap-1">Fecha<input v-model="payment.date" type="date" :min="selectedCard.trackingStartDate" :max="cardToday()" required class="border rounded p-2"></label>
     <label class="flex flex-col gap-1">Descripción (opcional)<input v-model="payment.description" class="border rounded p-2"></label>
    </template>
    <div class="flex gap-4"><button type="submit" :disabled="saving" class="rounded bg-slate-900 text-white px-4 py-2 disabled:opacity-50">{{ saving ? 'Guardando…' : 'Guardar' }}</button><button type="button" :disabled="saving" @click="mode=null">Cancelar</button></div>
   </form>
   <div v-if="removing" role="alertdialog" aria-label="Eliminar abono" class="p-4 border rounded-lg bg-white text-slate-900"><p>¿Eliminar este abono? El saldo pendiente se actualizará.</p><button :disabled="saving" class="text-red-700 underline mr-4" @click="remove">Eliminar</button><button :disabled="saving" @click="removing=null">Cancelar</button></div>
   <h2 class="text-lg font-semibold">Movimientos del seguimiento</h2>
   <p v-if="!movements.length">Sin movimientos en el seguimiento.</p>
   <ul class="flex flex-col gap-2"><li v-for="tx in movements" :key="tx.id" class="border rounded-lg p-4 bg-white text-slate-900"><div class="flex justify-between gap-3"><div><p class="font-medium">{{ tx.type === 'card_payment' ? 'Pago de tarjeta' : tx.description }}</p><p class="text-sm text-slate-500">{{ tx.date }} · {{ tx.username }}</p><p v-if="tx.type === 'card_payment'">{{ tx.description }}</p></div><span>{{ money(tx.amount) }}</span></div><div v-if="tx.type === 'card_payment'" class="flex gap-4 mt-2"><button :disabled="saving" class="underline" @click="openPayment(tx)">Editar</button><button :disabled="saving" class="text-red-700 underline" @click="removing=tx.id">Eliminar</button></div></li></ul>
  </template>
 </section>
</template>
