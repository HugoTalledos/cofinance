const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

export const formatCOP = (value: number): string => copFormatter.format(value)

/** +6.0% / -18.0%: una decimal y signo siempre */
export const formatPercent = (value: number): string => {
  const sign = value < 0 ? '-' : '+'
  return `${sign}${Math.abs(value).toFixed(1)}%`
}
