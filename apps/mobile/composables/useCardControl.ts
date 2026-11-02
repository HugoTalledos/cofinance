import { useCreditCards } from './useCreditCards'
import { ref, computed } from 'vue'
import { getCreditCards, getCardTrackingTransactions, computeCardBalance, isCardConfigured, cardToday, updateCreditCardSettings, createCardPayment, updateCardPayment, deleteTransaction, type CreditCard, type Transaction, type CardSettingsInput, type CardPaymentForm } from '@cofinance/core'
export function useCardControl() {
 const {user} = useAuth()
 const {fetchCreditCards} = useCreditCards()
 const cards = ref<CreditCard[]>([]), selectedCardId = ref(''), movements = ref<Transaction[]>([])
 const loading = ref(false), saving = ref(false), error = ref<string|null>(null)
 const selectedCard = computed(() => cards.value.find(c => c.id === selectedCardId.value))
 const balance = computed(() => error.value || loading.value || !selectedCard.value ? null : computeCardBalance(selectedCard.value,movements.value,cardToday()))
 let request = 0
 async function reload() {
  const token = ++request; loading.value = true; error.value = null; movements.value = []
  try {
   const result = await getCreditCards()
   if(token !== request) return
   if(result.error) throw new Error(result.error)
   cards.value = result.data ?? []
   if(!cards.value.some(c => c.id === selectedCardId.value)) selectedCardId.value = cards.value[0]?.id ?? ''
   const card = selectedCard.value
   if(card && isCardConfigured(card)) {
    const txs = await getCardTrackingTransactions(card,cardToday())
    if(token !== request) return
    if(txs.error) throw new Error(txs.error)
    movements.value = txs.data ?? []
   }
  } catch(e) {if(token === request) error.value = e instanceof Error ? e.message : 'Error al cargar tarjetas'}
  finally {if(token === request) loading.value = false}
 }
 async function selectCard(id:string) { selectedCardId.value = id; await reload() }
 async function mutate(action:()=>Promise<{error:string|null}>) {
  if(saving.value) return {saved:false,error:'Ya se está guardando'}
  saving.value=true
  try { const result=await action(); if(result.error) return {saved:false,error:result.error}; await reload(); await fetchCreditCards(); return {saved:true,error:error.value ? 'Guardado. No se pudo actualizar la vista; reintenta cargar.' : null} }
  catch(e) {return {saved:false,error:e instanceof Error ? e.message : 'Error al guardar'}}
  finally {saving.value=false}
 }
 const saveSettings = (input:CardSettingsInput) => mutate(()=>updateCreditCardSettings(selectedCardId.value,input))
 const createPayment = (form:CardPaymentForm) => mutate(async()=> user.value ? createCardPayment(selectedCardId.value,form,{userId:user.value.uid,username:user.value.displayName || user.value.email || 'Usuario'}) : {error:'Inicia sesión'})
 const editPayment = (id:string,form:CardPaymentForm) => mutate(()=>updateCardPayment(id,form))
 const removePayment = (id:string) => mutate(()=>deleteTransaction(id))
 return {cards,selectedCardId,selectedCard,movements,balance,loading,saving,error,reload,selectCard,saveSettings,createPayment,editPayment,removePayment}
}
