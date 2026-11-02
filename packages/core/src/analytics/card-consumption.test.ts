import { expect, it } from 'vitest'
import { getCardConsumption } from './card-consumption'
const tx = (amount:number, fields = {}) => ({amount,type:'expense',paymentMethod:'credit_card',creditCardId:'a',creditCardBank:'A',...fields}) as any
it('agrupa compras por tarjeta y excluye abonos, ingresos y débito',()=>{
 expect(getCardConsumption([tx(100),tx(50),tx(50,{creditCardId:'b',creditCardBank:'B'}),tx(80,{type:'card_payment'}),tx(80,{type:'income'}),tx(80,{paymentMethod:'debit_card'})],[])).toEqual([{id:'a',bank:'A',amount:150},{id:'b',bank:'B',amount:50}])
})
it('preserva legado y compras sin tarjeta sin perder consumo',()=>{
 expect(getCardConsumption([tx(20,{type:undefined}),tx(10,{creditCardId:undefined,creditCardBank:undefined})],[{id:'a',bank:'Banco A',createdAt:0}])).toEqual([{id:'a',bank:'Banco A',amount:20},{id:'unassigned',bank:'Sin tarjeta asignada',amount:10}])
})
it('vacío no genera segmentos ni tarjetas de consumo cero',()=>expect(getCardConsumption([],[])).toEqual([]))
