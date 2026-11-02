import type { CreditCard, Transaction } from '../types'
import { isExpense } from './period'
export interface CardConsumption { id: string; bank: string; amount: number }
/** Compras del período; los abonos no reducen el consumo. */
export function getCardConsumption(transactions: Transaction[], cards: CreditCard[]): CardConsumption[] {
 const groups = new Map<string, CardConsumption>()
 for (const tx of transactions) {
  if (!isExpense(tx) || tx.paymentMethod !== 'credit_card' || !(tx.amount > 0)) continue
  const id = tx.creditCardId || 'unassigned'
  const group = groups.get(id) ?? {id,bank:cards.find(c=>c.id===id)?.bank || tx.creditCardBank || 'Sin tarjeta asignada',amount:0}
  group.amount += tx.amount; groups.set(id,group)
 }
 return [...groups.values()].sort((a,b)=>b.amount-a.amount || a.bank.localeCompare(b.bank,'es'))
}
