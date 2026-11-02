import { ref } from 'vue'
import { deleteTransaction } from '@cofinance/core'
export function useTransactionDeletion() {
 const working=ref(false)
 const error=ref<string|null>(null)
 async function remove(id:string):Promise<boolean> {
  if(working.value) return false
  working.value=true;error.value=null
  try {
   const result=await deleteTransaction(id)
   if(result.error || result.data !== true) {error.value=result.error || 'No se pudo eliminar el movimiento';return false}
   return true
  } catch(e) {error.value=e instanceof Error ? e.message : 'Error al eliminar el movimiento';return false}
  finally {working.value=false}
 }
 return {working,error,remove}
}
