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
export const generateMonthlySummaryId = (month: string): string => {
  return `summary_${month}`
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

/** Día de inicio del mes de facturación (futuro: config del usuario en Firestore) */
export const BILLING_START_DAY = 25

export interface BillingPeriodRange {
  startDate: string
  endDate: string
  /** YYYY-MM del mes en que empieza el periodo */
  periodKey: string
}

/**
 * Periodo de facturación que contiene referenceDate.
 * Ej. startDay=25 y hoy=15 may → 2026-04-25 a 2026-05-24
 */
export const getBillingPeriodRange = (
  referenceDate: Date = new Date(),
  startDay: number = BILLING_START_DAY
): BillingPeriodRange => {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth()
  const day = referenceDate.getDate()

  const periodStart = day < startDay
    ? new Date(year, month - 1, startDay)
    : new Date(year, month, startDay)

  const periodEnd = day < startDay
    ? new Date(year, month, startDay - 1)
    : new Date(year, month + 1, startDay - 1)

  return {
    startDate: formatDateToString(periodStart),
    endDate: formatDateToString(periodEnd),
    periodKey: formatDateToString(periodStart).substring(0, 7),
  }
}

/** Rango a partir del periodKey (YYYY-MM del mes de inicio del periodo) */
export const getBillingPeriodRangeFromKey = (
  periodKey: string,
  startDay: number = BILLING_START_DAY
): BillingPeriodRange => {
  const [year, monthNum] = periodKey.split('-').map(Number)
  const periodStart = new Date(year, monthNum - 1, startDay)
  const periodEnd = new Date(year, monthNum, startDay - 1)

  return {
    startDate: formatDateToString(periodStart),
    endDate: formatDateToString(periodEnd),
    periodKey,
  }
}

export const getCurrentBillingPeriodKey = (): string =>
  getBillingPeriodRange().periodKey

/** Últimos N periodos de facturación (para selectores) */
export const getRecentBillingPeriodKeys = (
  count: number = 12,
  startDay: number = BILLING_START_DAY
): string[] => {
  const keys: string[] = []
  let ref = new Date()

  while (keys.length < count) {
    const { periodKey, startDate } = getBillingPeriodRange(ref, startDay)
    if (!keys.includes(periodKey)) {
      keys.push(periodKey)
    }
    const prev = parseDateString(startDate)
    prev.setDate(prev.getDate() - 1)
    ref = prev
  }

  return keys
}

/** Etiqueta legible del periodo, ej. "25 abr – 24 may 2026" */
export const formatBillingPeriodLabel = (
  periodKey: string,
  startDay: number = BILLING_START_DAY
): string => {
  const { startDate, endDate } = getBillingPeriodRangeFromKey(periodKey, startDay)
  const start = parseDateString(startDate)
  const end = parseDateString(endDate)
  const startStr = start.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  const endStr = end.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${startStr} – ${endStr}`
}
