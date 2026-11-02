import { beforeEach, it, expect, vi } from 'vitest'
import { getCreditCards } from './credit-cards.service'
import { getTransactions, createTransaction, updateTransaction } from './transactions.service'
import { createCardPayment, getCardTrackingTransactions, updateCardPayment } from './card-payments.service'
vi.mock('./credit-cards.service',()=>({getCreditCards:vi.fn()}))
vi.mock('./transactions.service',()=>({getTransactions:vi.fn(),createTransaction:vi.fn(),updateTransaction:vi.fn()}))
const card={id:'a',bank:'A',createdAt:0,openingBalance:0,trackingStartDate:'2026-01-01'}
beforeEach(()=>{vi.resetAllMocks();vi.mocked(getCreditCards).mockResolvedValue({data:[card],error:null,loading:false});vi.mocked(createTransaction).mockResolvedValue({data:'p',error:null,loading:false})})
it('consulta todo el rango y excluye tarjetas ajenas',async()=>{vi.mocked(getTransactions).mockResolvedValue({data:[{creditCardId:'a'},{creditCardId:'b'}] as any,error:null,loading:false});const r=await getCardTrackingTransactions(card,'2026-11-02');expect(r.data).toEqual([{creditCardId:'a'}]);expect(getTransactions).toHaveBeenCalledWith({dateFrom:'2026-01-01',dateTo:'2026-11-02'})})
it('propaga error sin un saldo parcial',async()=>{vi.mocked(getTransactions).mockResolvedValue({data:null,error:'sin red',loading:false});expect((await getCardTrackingTransactions(card,'2026-11-02')).data).toBeNull()})
it('abono genera tipo específico, autor y descripción opcional',async()=>{await createCardPayment('a',{amount:60000,date:'2026-01-01',description:''},{userId:'u',username:'U'});expect(createTransaction).toHaveBeenCalledWith(expect.objectContaining({type:'card_payment',amount:60000,creditCardId:'a',description:'Pago de tarjeta',userId:'u'}))})
it('rechaza monto inválido antes de escribir',async()=>{expect((await createCardPayment('a',{amount:0,date:'2026-01-01',description:''},{userId:'u',username:'U'})).error).toBeTruthy();expect(createTransaction).not.toHaveBeenCalled()})
it('editar no cambia tarjeta ni tipo',async()=>{vi.mocked(updateTransaction).mockResolvedValue({data:true,error:null,loading:false});await updateCardPayment('p',{amount:1,date:'2026-01-01',description:''});expect(updateTransaction).toHaveBeenCalledWith('p',{amount:1,date:'2026-01-01',description:'Pago de tarjeta'})})
