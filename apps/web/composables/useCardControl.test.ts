vi.mock('../../mobile/composables/useCreditCards',()=>({useCreditCards:()=>({fetchCreditCards:async()=>{}})}))
import { beforeEach, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { getCreditCards, getCardTrackingTransactions, createCardPayment } from '@cofinance/core'
import { useCardControl } from './useCardControl'
import { useCardControl as useMobileCardControl } from '../../mobile/composables/useCardControl'
vi.mock('@cofinance/core', async original => ({...await original<typeof import('@cofinance/core')>(),getCreditCards:vi.fn(),getCardTrackingTransactions:vi.fn(),createCardPayment:vi.fn()}))
const ok = (data:any) => ({data,error:null,loading:false})
const cards=[{id:'a',bank:'A',openingBalance:0,trackingStartDate:'2026-01-01',createdAt:0},{id:'b',bank:'B',openingBalance:100,trackingStartDate:'2026-01-01',createdAt:0}]
beforeEach(()=>{vi.resetAllMocks();vi.stubGlobal('useCreditCards',()=>({fetchCreditCards:async()=>{}}));vi.stubGlobal('useAuth',()=>({user:ref({uid:'u',displayName:'Usuario'})}));vi.mocked(getCreditCards).mockResolvedValue(ok(cards));vi.mocked(getCardTrackingTransactions).mockResolvedValue(ok([]));vi.mocked(createCardPayment).mockResolvedValue(ok('p'))})
for(const [platform,factory] of [['web',useCardControl],['mobile',useMobileCardControl]] as const) {
 it(`${platform}: saldo completo y tarjeta sin configurar`,async()=>{const c=factory();await c.reload();expect(c.balance.value).toBe(0);await c.selectCard('b');expect(c.balance.value).toBe(100);vi.mocked(getCreditCards).mockResolvedValue(ok([{id:'a',bank:'A',createdAt:0}]));await c.reload();expect(c.balance.value).toBeNull()})
 it(`${platform}: respuesta tardía no pisa tarjeta nueva`,async()=>{let finish!:(x:any)=>void;const c=factory();await c.reload();vi.mocked(getCardTrackingTransactions).mockReturnValueOnce(new Promise(r=>finish=r));const old=c.selectCard('a');await Promise.resolve();await c.selectCard('b');finish(ok([{creditCardId:'a',amount:500,type:'card_payment',date:'2026-01-01'}]));await old;expect(c.selectedCardId.value).toBe('b');expect(c.balance.value).toBe(100)})
 it(`${platform}: escritura confirmada con error de lectura no invita a repetir`,async()=>{const c=factory();await c.reload();vi.mocked(getCreditCards).mockResolvedValue({data:null,error:'sin red',loading:false});const r=await c.createPayment({amount:1,date:'2026-01-01',description:''});expect(r.saved).toBe(true);expect(r.error).toContain('Guardado');expect(c.balance.value).toBeNull()})
 it(`${platform}: bloquea doble envío`,async()=>{let finish!:(x:any)=>void;vi.mocked(createCardPayment).mockReturnValueOnce(new Promise(r=>finish=r));const c=factory();await c.reload();const first=c.createPayment({amount:1,date:'2026-01-01',description:''});const second=await c.createPayment({amount:1,date:'2026-01-01',description:''});expect(second.saved).toBe(false);finish(ok('p'));await first;expect(createCardPayment).toHaveBeenCalledTimes(1)})
}
