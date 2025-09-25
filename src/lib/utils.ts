import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function parseDate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00.000Z')
}

export function getTimeSlots(): string[] {
  const slots = []
  for (let hour = 9; hour <= 17; hour++) {
    const startTime = hour.toString().padStart(2, '0') + ':00'
    const endTime = (hour + 1).toString().padStart(2, '0') + ':00'
    slots.push(`${startTime}-${endTime}`)
  }
  return slots
}

export function isValidTimeSlot(timeSlot: string): boolean {
  const timeSlots = getTimeSlots()
  return timeSlots.includes(timeSlot)
}

export function isValidExtension(extension: string): boolean {
  return /^\d{3,5}$/.test(extension)
}

export function isValidBooker(booker: string): boolean {
  return booker.trim().length >= 2 && booker.trim().length <= 20
}