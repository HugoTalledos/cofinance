import { getCreditCards } from './credit-cards.service'
import { getTransactions, createTransaction, updateTransaction } from './transactions.service'
import { cardToday, isCardConfigured, validateCardPayment, buildCardPaymentInput, type CardPaymentForm } from '../cards/balance'
import type { CreditCard, Transaction, ApiResponse } from '../types'
export const getCardTrackingTransactions = async (card: CreditCard, today: string): Promise<ApiResponse<Transaction[]>> => {
 if (!isCardConfigured(card)) return {data:null,error:'Configura el saldo inicial',loading:false}
 const result = await getTransactions({dateFrom:card.trackingStartDate,dateTo:today})
 return {...result,data:result.error ? null : (result.data ?? []).filter(t => t.creditCardId === card.id)}
}
export const createCardPayment = async (cardId: string, form: CardPaymentForm, author: {userId:string;username:string}): Promise<ApiResponse<string>> => {
 const cards = await getCreditCards()
 const card = cards.data?.find(c => c.id === cardId)
 const error = cards.error || (!card ? 'Tarjeta no disponible' : validateCardPayment(form,card,cardToday()))
 if (error || !card) return {data:null,error:error || 'Tarjeta no disponible',loading:false}
 return createTransaction(buildCardPaymentInput(form,card,author))
}
export const updateCardPayment = (id:string, form:CardPaymentForm): Promise<ApiResponse<boolean>> => updateTransaction(id,{...form,description:form.description.trim() || 'Pago de tarjeta'})
