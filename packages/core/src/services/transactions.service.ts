import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteField,
  deleteDoc,
  query,
  where,
  orderBy,
  runTransaction,
  type QueryConstraint
} from 'firebase/firestore'
import { useFirestoreDb, COLLECTIONS } from './firebase'
import { validateCardPayment, cardToday } from '../cards/balance'
import { getCreditCards } from './credit-cards.service'
import { updateMonthlySummaryIncremental } from './summary.service'
import type {
  Transaction,
  TransactionInput,
  TransactionUpdate,
  RemovableTransactionField,
  TransactionFilters,
  ApiResponse
} from '../types'
import { getCurrentTimestamp, extractMonthFromDate } from '../types'

/**
 * Servicio para gestión de transacciones en Firestore
 */

/**
 * Crea una nueva transacción y actualiza el resumen mensual
 * Esta operación es atómica usando transacciones de Firestore
 */
export const createTransaction = async (data: TransactionInput): Promise<ApiResponse<string>> => {
  const response: ApiResponse<string> = {
    data: null,
    error: null,
    loading: false
  };

  try {
    const db = useFirestoreDb();
    if (!db) {
      throw new Error('Firestore database not initialized');
    }
    if (data.type === 'card_payment') {
      const cards = await getCreditCards()
      if (cards.error) throw new Error(cards.error)
      const card = cards.data?.find(c => c.id === data.creditCardId)
      if (!card) throw new Error('Tarjeta no disponible')
      const validation = validateCardPayment(data, card, cardToday())
      if (validation) throw new Error(validation)
      if (data.categoryId || data.categoryName || data.paymentMethod) throw new Error('Un abono no tiene categoría ni medio de pago')
    }
    const transactionId = await runTransaction(db, async (transaction) => {
      const transactionsRef = collection(db, COLLECTIONS.TRANSACTIONS);
      const newTransactionRef = doc(transactionsRef);
      const transactionData = {
        ...data,
        createdAt: getCurrentTimestamp()
      };
      transaction.set(newTransactionRef, transactionData);
      return newTransactionRef.id;
    });

    // El summary es un agregado derivado: se ajusta después de confirmar la
    // escritura y su fallo no invalida el movimiento del usuario.
    if ((data.type ?? 'expense') === 'expense') {
      const summaryResult = await updateMonthlySummaryIncremental(
        data.month,
        data.categoryId,
        data.amount
      );
      if (summaryResult.error) {
        console.error('Error ajustando el resumen mensual:', summaryResult.error);
      }
    }

    response.data = transactionId;
  } catch (error) {
    console.error('Error creating transaction:', error);
    response.error = error instanceof Error ? error.message : 'Error al crear la transacción';
  }

  return response;
};

type SummaryBucket = Pick<Transaction, 'month' | 'categoryId' | 'amount' | 'type'>

/**
 * Ajusta el resumen mensual al pasar un movimiento de un estado a otro.
 * `after` en `null` significa que el movimiento se eliminó.
 *
 * Solo los egresos viven en el resumen: los ingresos se ignoran en ambos lados.
 * Un fallo aquí se registra pero no se propaga: el resumen es un agregado
 * derivado y el movimiento ya quedó escrito.
 * Hoy este agregado tampoco alimenta ninguna vista: los agregados de la UI
 * se recalculan desde las transacciones en `useSummary`.
 */
const adjustSummaryForChange = async (
  before: SummaryBucket,
  after: SummaryBucket | null
): Promise<void> => {
  const isExpense = (t: SummaryBucket) => (t.type ?? 'expense') === 'expense'
  const beforeCounts = isExpense(before)
  const afterCounts = after !== null && isExpense(after)

  const apply = async (month: string, categoryId: string, amount: number) => {
    if (amount === 0) return
    const result = await updateMonthlySummaryIncremental(month, categoryId, amount)
    if (result.error) {
      console.error('Error ajustando el resumen mensual:', result.error)
    }
  }

  // Mismo bucket (mes + categoría): un solo ajuste con la diferencia.
  if (
    beforeCounts &&
    afterCounts &&
    after.month === before.month &&
    after.categoryId === before.categoryId
  ) {
    await apply(after.month, after.categoryId, after.amount - before.amount)
    return
  }

  if (beforeCounts) {
    await apply(before.month, before.categoryId, -before.amount)
  }
  if (afterCounts) {
    await apply(after.month, after.categoryId, after.amount)
  }
}

/**
 * Actualiza una transacción existente y reajusta el resumen mensual.
 * El tipo (income/expense) no es editable: si viene en `data`, se ignora.
 */
export const updateTransaction = async (
  id: string,
  data: TransactionUpdate,
  removeFields: RemovableTransactionField[] = []
): Promise<ApiResponse<boolean>> => {
  const response: ApiResponse<boolean> = {
    data: null,
    error: null,
    loading: false
  }

  try {
    const db = useFirestoreDb()
    if (!db) {
      throw new Error('Firestore database not initialized');
    }

    const transactionRef = doc(db, COLLECTIONS.TRANSACTIONS, id)
    const snapshot = await getDoc(transactionRef)

    if (!snapshot.exists()) {
      throw new Error('El movimiento que intentas editar ya no existe')
    }

    const before = snapshot.data() as Transaction
    const { type: _ignoredType, ...changes } = data
    if (changes.date) {
      changes.month = extractMonthFromDate(changes.date)
    }
    if (before.type === 'card_payment') {
      if (removeFields.length || changes.creditCardId !== undefined || changes.creditCardBank !== undefined || changes.categoryId !== undefined || changes.categoryName !== undefined || changes.paymentMethod !== undefined) throw new Error('Solo puedes editar monto, fecha y descripción del abono')
      const cards = await getCreditCards()
      if (cards.error) throw new Error(cards.error)
      const card = cards.data?.find(c => c.id === before.creditCardId)
      if (!card) throw new Error('Tarjeta no disponible')
      const validation = validateCardPayment({...before,...changes},card,cardToday())
      if (validation) throw new Error(validation)
    }
    const after: Transaction = { ...before, ...changes }
    const firestoreChanges: Record<string, unknown> = { ...changes }
    for (const field of removeFields) {
      delete after[field]
      firestoreChanges[field] = deleteField()
    }

    await updateDoc(transactionRef, firestoreChanges)
    await adjustSummaryForChange(before, after)

    response.data = true

  } catch (error) {
    console.error('Error updating transaction:', error)
    response.error = error instanceof Error ? error.message : 'Error al actualizar la transacción'
  }

  return response
}

/**
 * Elimina definitivamente una transacción y descuenta su monto del resumen mensual.
 */
export const deleteTransaction = async (id: string): Promise<ApiResponse<boolean>> => {
  const response: ApiResponse<boolean> = {
    data: null,
    error: null,
    loading: false
  }

  try {
    const db = useFirestoreDb()
    if (!db) {
      throw new Error('Firestore database not initialized');
    }

    const transactionRef = doc(db, COLLECTIONS.TRANSACTIONS, id)
    const snapshot = await getDoc(transactionRef)

    if (!snapshot.exists()) {
      throw new Error('El movimiento que intentas eliminar ya no existe')
    }

    const before = snapshot.data() as Transaction

    await deleteDoc(transactionRef)
    await adjustSummaryForChange(before, null)

    response.data = true

  } catch (error) {
    console.error('Error deleting transaction:', error)
    response.error = error instanceof Error ? error.message : 'Error al eliminar la transacción'
  }

  return response
}


/**
 * Obtiene transacciones con filtros opcionales
 */
export const getTransactions = async (
  filters: TransactionFilters
): Promise<ApiResponse<Transaction[]>> => {
  const response: ApiResponse<Transaction[]> = {
    data: null,
    error: null,
    loading: false
  }

  try {
    const db = useFirestoreDb()
    if (!db) {
      throw new Error('Firestore database not initialized');
    }
    const transactionsRef = collection(db, COLLECTIONS.TRANSACTIONS)

    // Construir constraints dinámicamente
    const constraints: QueryConstraint[] = []

    // Filtro por mes (más común y eficiente)
    if (filters.month) {
      constraints.push(where('month', '==', filters.month))
    }

    // Filtro por categoría
    if (filters.categoryId) {
      constraints.push(where('categoryId', '==', filters.categoryId))
    }

    // Filtro por rango de fechas
    if (filters.dateFrom) {
      constraints.push(where('date', '>=', filters.dateFrom))
    }
    if (filters.dateTo) {
      constraints.push(where('date', '<=', filters.dateTo))
    }

    // Ordenar por fecha descendente
    constraints.push(orderBy('date', 'desc'))

    const q = query(transactionsRef, ...constraints)
    const snapshot = await getDocs(q)

    const transactions: Transaction[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Transaction[]

    response.data = transactions

  } catch (error) {
    console.error('Error getting transactions:', error)
    response.error = error instanceof Error ? error.message : 'Error al obtener las transacciones'
  }

  return response
}

/**
 * Obtiene las transacciones más recientes de un usuario
 */
export const getRecentTransactions = async (
  limitCount: number = 10
): Promise<ApiResponse<Transaction[]>> => {
  const response: ApiResponse<Transaction[]> = {
    data: null,
    error: null,
    loading: false
  }

  try {
    const db = useFirestoreDb()
    if (!db) {
      throw new Error('Firestore database not initialized');
    }
    const transactionsRef = collection(db, COLLECTIONS.TRANSACTIONS)

    const { limit } = await import('firebase/firestore')

    const q = query(
      transactionsRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )

    const snapshot = await getDocs(q)

    const transactions: Transaction[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Transaction[]

    response.data = transactions

  } catch (error) {
    console.error('Error getting recent transactions:', error)
    response.error = error instanceof Error ? error.message : 'Error al obtener las transacciones recientes'
  }

  return response
}

/**
 * Obtiene el total gastado en una categoría para un mes específico
 */
export const getCategorySpentInMonth = async (
  userId: string,
  categoryId: string,
  month: string
): Promise<number> => {
  try {
    const filters: TransactionFilters = {
      userId,
      categoryId,
      month
    }

    const result = await getTransactions(filters)
    
    if (!result.data || result.error) {
      return 0
    }

    return result.data.reduce((total, transaction) => total + ((transaction.type ?? 'expense') === 'expense' ? transaction.amount : 0), 0)

  } catch (error) {
    console.error('Error calculating category spent:', error)
    return 0
  }
}

/**
 * Obtiene el total de transacciones en un mes
 */
export const getMonthlyTotal = async (
  month: string
): Promise<number> => {
  try {
    const filters: TransactionFilters = {
      month
    }

    const result = await getTransactions(filters)
    
    if (!result.data || result.error) {
      return 0
    }

    return result.data.reduce((total, transaction) => total + ((transaction.type ?? 'expense') === 'expense' ? transaction.amount : 0), 0)

  } catch (error) {
    console.error('Error calculating monthly total:', error)
    return 0
  }
}

/**
 * Cuenta el número de transacciones que cumplen con los filtros
 */
export const countTransactions = async (filters: TransactionFilters): Promise<number> => {
  try {
    const result = await getTransactions(filters)
    return result.data?.length || 0
  } catch (error) {
    console.error('Error counting transactions:', error)
    return 0
  }
}
