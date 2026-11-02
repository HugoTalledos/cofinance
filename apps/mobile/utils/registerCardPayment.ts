import { createCardPayment, type CardPaymentForm, type ApiResponse } from '@cofinance/core'
export async function registerMobileCardPayment(
 input: CardPaymentForm & { creditCardId: string },
 user: {uid:string;displayName?:string|null;email?:string|null} | null
): Promise<ApiResponse<string>> {
 if (!user) return {data:null,error:'Inicia sesión para registrar un pago de tarjeta',loading:false}
 return createCardPayment(input.creditCardId,{amount:input.amount,date:input.date,description:input.description},{userId:user.uid,username:user.displayName || user.email || 'Usuario'})
}
