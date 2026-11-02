import { beforeEach, expect, it, vi } from 'vitest'
import { deleteTransaction } from '@cofinance/core'
import { useTransactionDeletion } from './useTransactionDeletion'
vi.mock('@cofinance/core',()=>({deleteTransaction:vi.fn()}))
beforeEach(()=>vi.resetAllMocks())
it('elimina usando el core y confirma el resultado',async()=>{
 vi.mocked(deleteTransaction).mockResolvedValue({data:true,error:null,loading:false})
 const state=useTransactionDeletion()
 expect(await state.remove('duplicate-id')).toBe(true)
 expect(deleteTransaction).toHaveBeenCalledWith('duplicate-id')
 expect(state.working.value).toBe(false)
})
it('conserva el error sin confirmar eliminación',async()=>{
 vi.mocked(deleteTransaction).mockResolvedValue({data:null,error:'Sin permisos',loading:false})
 const state=useTransactionDeletion()
 expect(await state.remove('id')).toBe(false)
 expect(state.error.value).toBe('Sin permisos')
})
it('bloquea una segunda eliminación mientras guarda',async()=>{
 let finish!:(value:any)=>void
 vi.mocked(deleteTransaction).mockReturnValue(new Promise(resolve=>{finish=resolve}))
 const state=useTransactionDeletion();const pending=state.remove('id')
 expect(await state.remove('id')).toBe(false)
 expect(deleteTransaction).toHaveBeenCalledTimes(1)
 finish({data:true,error:null,loading:false});await pending
})
it('captura excepciones y permite reintentar',async()=>{
 vi.mocked(deleteTransaction).mockRejectedValue(new Error('Sin red'))
 const state=useTransactionDeletion();expect(await state.remove('id')).toBe(false)
 expect(state.error.value).toBe('Sin red');expect(state.working.value).toBe(false)
})
