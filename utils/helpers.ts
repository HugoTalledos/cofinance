import type { CategoryInput } from "~/types";

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
    .format(amount)
    .replace(/\s?COP/, '')
    .replace('$', '$')
    .trim()
}

export const shortFormatCurrency = (amount: number): string => {
  const absAmount = Math.abs(amount);
  let short: string;
  if (absAmount >= 1_000_000_000) {
    short = (amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  } else if (absAmount >= 1_000_000) {
    short = (amount / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (absAmount >= 1_000) {
    short = (amount / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  } else {
    short = amount.toString();
  }
  return `$${short}`;
}


export const getCategoryCode = (category: CategoryInput) => {
  const categoryName = category.name
  const formatedName = categoryName.trim().toLocaleLowerCase().replace(" ", "_")
  return `code_${formatedName}`
}

export function getRandomTailwindColor() {
  const colors = [
    'slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber',
    'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue',
    'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'
  ];

  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  return `bg-${randomColor}-100`;
}


export function ruleOfThree (total: number, relative: number) {
  return (relative * 100) / (total || 1)
}