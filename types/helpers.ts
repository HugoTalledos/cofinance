/**
 * Funciones helper para trabajar con los modelos de datos
 */

/**
 * Formatea una fecha a string YYYY-MM-DD
 */
export const formatDateToString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Extrae el mes (YYYY-MM) de una fecha string o Date
 */
export const extractMonthFromDate = (date: string | Date): string => {
  if (typeof date === 'string') {
    // Si es YYYY-MM-DD, tomar solo YYYY-MM
    return date.substring(0, 7)
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Parsea una fecha string YYYY-MM-DD a Date
 */
export const parseDateString = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Obtiene el timestamp actual en milisegundos
 */
export const getCurrentTimestamp = (): number => {
  return Date.now()
}

/**
 * Valida que una fecha string esté en formato YYYY-MM-DD
 */
export const isValidDateString = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) return false
  
  const date = parseDateString(dateString)
  return !isNaN(date.getTime())
}

/**
 * Valida que un mes string esté en formato YYYY-MM
 */
export const isValidMonthString = (monthString: string): boolean => {
  const regex = /^\d{4}-\d{2}$/
  return regex.test(monthString)
}

/**
 * Obtiene el mes actual en formato YYYY-MM
 */
export const getCurrentMonth = (): string => {
  return extractMonthFromDate(new Date())
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 */
export const getCurrentDate = (): string => {
  return formatDateToString(new Date())
}

/**
 * Calcula el porcentaje de presupuesto usado
 */
export const calculateBudgetPercentage = (spent: number, budget: number): number => {
  if (budget === 0) return 0
  return Math.round((spent / budget) * 100)
}

/**
 * Verifica si una categoría está sobre presupuesto
 */
export const isOverBudget = (spent: number, budget: number): boolean => {
  return spent > budget
}

/**
 * Genera un ID para monthly_summary
 */
export const generateMonthlySummaryId = (userId: string, month: string): string => {
  return `${userId}_${month}`
}

/**
 * Parsea un ID de monthly_summary para obtener userId y month
 */
export const parseMonthlySummaryId = (id: string): { userId: string; month: string } => {
  const lastUnderscoreIndex = id.lastIndexOf('_')
  return {
    userId: id.substring(0, lastUnderscoreIndex),
    month: id.substring(lastUnderscoreIndex + 1)
  }
}

/**
 * Formatea un número como moneda
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

/**
 * Obtiene el rango de meses entre dos fechas
 */
export const getMonthRange = (startMonth: string, endMonth: string): string[] => {
  const months: string[] = []
  const [startYear, startMonthNum] = startMonth.split('-').map(Number)
  const [endYear, endMonthNum] = endMonth.split('-').map(Number)
  
  let currentYear = startYear
  let currentMonth = startMonthNum
  
  while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonthNum)) {
    const monthStr = String(currentMonth).padStart(2, '0')
    months.push(`${currentYear}-${monthStr}`)
    
    currentMonth++
    if (currentMonth > 12) {
      currentMonth = 1
      currentYear++
    }
  }
  
  return months
}

/**
 * Obtiene el mes anterior
 */
export const getPreviousMonth = (month: string): string => {
  const [year, monthNum] = month.split('-').map(Number)
  let prevYear = year
  let prevMonth = monthNum - 1
  
  if (prevMonth < 1) {
    prevMonth = 12
    prevYear--
  }
  
  return `${prevYear}-${String(prevMonth).padStart(2, '0')}`
}

/**
 * Obtiene el mes siguiente
 */
export const getNextMonth = (month: string): string => {
  const [year, monthNum] = month.split('-').map(Number)
  let nextYear = year
  let nextMonth = monthNum + 1
  
  if (nextMonth > 12) {
    nextMonth = 1
    nextYear++
  }
  
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`
}
