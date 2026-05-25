import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price) {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 0,
  }).format(price)
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-ET', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function getDaysUntilExpiration(expiresAt) {
  const now = new Date()
  const expires = new Date(expiresAt)
  const diffTime = expires - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
