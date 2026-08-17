import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Junta classes condicionais e resolve conflitos do Tailwind. Padrão shadcn. */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
