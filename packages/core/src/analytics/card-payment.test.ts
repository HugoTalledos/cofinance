import { it, expect } from 'vitest'
import { summarizeHistory, filterHistory } from './history'
const payment = {id:'p', type:'card_payment', amount:60000, creditCardId:'a', description:'Pago de tarjeta'} as any
it('abonos no son ingreso ni gasto', () => {
 expect(summarizeHistory([payment])).toEqual({count:1,income:0,expenses:0,net:0})
 expect(filterHistory([payment],{search:'',categoryId:null,payment:{kind:'all'},type:'income'})).toEqual([])
 expect(filterHistory([payment],{search:'',categoryId:null,payment:{kind:'card',creditCardId:'a'},type:'all'})).toEqual([payment])
})
