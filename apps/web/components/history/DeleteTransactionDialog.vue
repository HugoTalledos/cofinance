<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useTransactionDeletion } from '../../composables/useTransactionDeletion'
import { formatTxDate, formatCOP } from '../../utils/format'
import type { Transaction } from '@cofinance/core'
const props=defineProps<{transaction:Transaction|null}>()
const emit=defineEmits<{close:[];deleted:[]}>()
const {working,error,remove}=useTransactionDeletion()
const cancelButton=ref<HTMLButtonElement|null>(null)
let previousFocus:HTMLElement|null=null
const close=()=>{if(!working.value) emit('close')}
const confirm=async()=>{if(props.transaction && await remove(props.transaction.id)) emit('deleted')}
function onKeydown(event:KeyboardEvent) {
 if(event.key==='Escape') {event.preventDefault();close()}
 if(event.key==='Tab') {
  const buttons=dialog.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
  if(!buttons?.length) {event.preventDefault();return}
  const first=buttons[0],last=buttons[buttons.length-1]
  if(event.shiftKey && document.activeElement===first) {event.preventDefault();last?.focus()}
  else if(!event.shiftKey && document.activeElement===last) {event.preventDefault();first?.focus()}
 }
}
const dialog=ref<HTMLElement|null>(null)
watch(()=>props.transaction,async tx=>{
 error.value=null
 if(tx) {previousFocus=document.activeElement as HTMLElement;await nextTick();cancelButton.value?.focus()}
 else previousFocus?.focus()
})
</script>
<template>
 <div v-if="transaction" class="fixed inset-0 bg-neutral-950/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="close" @keydown="onKeydown">
  <div ref="dialog" role="dialog" aria-modal="true" aria-labelledby="delete-transaction-title" aria-describedby="delete-transaction-description" :aria-busy="working" class="w-full max-w-sm bg-white rounded-xl border border-outline-variant/40 shadow-xl p-5 space-y-3">
   <h2 id="delete-transaction-title" class="text-body-lg font-semibold text-neutral-900">¿Eliminar este movimiento?</h2>
   <p class="text-body-sm font-medium text-neutral-900 break-words">{{ transaction.description }}</p>
   <p class="text-body-sm text-neutral-600">{{ formatTxDate(transaction) }} · {{ formatCOP(transaction.amount) }}</p>
   <p id="delete-transaction-description" class="text-body-sm text-neutral-500">La eliminación es definitiva. Los totales del historial y el resumen se actualizarán.</p>
   <p v-if="transaction.type === 'card_payment'" class="text-body-sm text-neutral-500">Eliminar el abono también aumentará el saldo pendiente de la tarjeta.</p>
   <p v-if="error" role="alert" class="text-body-sm text-red-700">{{ error }}</p>
   <div class="flex justify-end gap-2.5 pt-1">
    <button ref="cancelButton" type="button" :disabled="working" class="px-3.5 py-1.5 rounded-lg border border-outline-variant/40 text-neutral-700 hover:bg-neutral-100 text-body-sm disabled:opacity-50" @click="close">Cancelar</button>
    <button type="button" :disabled="working" class="px-4 py-1.5 rounded-lg bg-red-700 text-white enabled:hover:bg-red-800 text-body-sm font-medium disabled:opacity-40" @click="confirm">{{ working ? 'Eliminando…' : 'Eliminar' }}</button>
   </div>
  </div>
 </div>
</template>
