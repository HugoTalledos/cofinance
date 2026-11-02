import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { expect, it, vi } from 'vitest'
import { deleteTransaction, type Transaction } from '@cofinance/core'
import DeleteTransactionDialog from './DeleteTransactionDialog.vue'
vi.mock('@cofinance/core',async original=>({...await original<typeof import('@cofinance/core')>(),deleteTransaction:vi.fn()}))
const tx={id:'duplicate',description:'Compra duplicada',date:'2026-11-02',amount:60000,type:'expense'} as Transaction
it('muestra confirmación identificable sin eliminar automáticamente',async()=>{
 const html=await renderToString(createSSRApp(DeleteTransactionDialog,{transaction:tx}))
 expect(html).toContain('Compra duplicada');expect(html).toContain('60.000')
 expect(html).toContain('La eliminación es definitiva')
 expect(html).toContain('Cancelar');expect(html).toContain('aria-modal="true"')
 expect(deleteTransaction).not.toHaveBeenCalled()
})
it('cerrado no muestra diálogo y avisa el efecto sobre deuda al eliminar abono',async()=>{
 expect(await renderToString(createSSRApp(DeleteTransactionDialog,{transaction:null}))).not.toContain('role="dialog"')
 expect(await renderToString(createSSRApp(DeleteTransactionDialog,{transaction:{...tx,type:'card_payment'}}))).toContain('aumentará el saldo pendiente')
})
