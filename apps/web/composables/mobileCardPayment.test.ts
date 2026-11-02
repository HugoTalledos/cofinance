import { expect, it, vi } from 'vitest'
import { createCardPayment } from '@cofinance/core'
import { registerMobileCardPayment } from '../../mobile/utils/registerCardPayment.js'
vi.mock('@cofinance/core',async original=>({...await original<typeof import('@cofinance/core')>(),createCardPayment:vi.fn()}))
it('registra abono con fecha civil sin categoría ni segundo gasto',async()=>{
 vi.mocked(createCardPayment).mockResolvedValue({data:'p',error:null,loading:false})
 const result=await registerMobileCardPayment({creditCardId:'a',amount:60000,date:'2026-11-02',description:''},{uid:'u',displayName:'U'})
 expect(result.error).toBeNull()
 expect(createCardPayment).toHaveBeenCalledWith('a',{amount:60000,date:'2026-11-02',description:''},{userId:'u',username:'U'})
})
it('no registra sin sesión',async()=>{
 vi.mocked(createCardPayment).mockClear()
 expect((await registerMobileCardPayment({creditCardId:'a',amount:1,date:'2026-11-02',description:''},null)).error).toBeTruthy()
 expect(createCardPayment).not.toHaveBeenCalled()
})
