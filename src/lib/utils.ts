import { clsx, type ClassValue } from 'clsx'
import { isExtensionAllowed } from '@/config/allowed-extensions'

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
  // 驗證時間格式：HH:MM-HH:MM
  const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!timePattern.test(timeSlot)) {
    return false
  }

  const [startTime, endTime] = timeSlot.split('-')
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  
  // 檢查時間範圍是否合理
  return startMinutes < endMinutes && 
         startMinutes >= 8 * 60 && // 最早 8:00
         endMinutes <= 18 * 60     // 最晚 18:00
}

export function isValidExtension(extension: string): boolean {
  // 檢查格式：3-5位數字
  if (!/^\d{3,5}$/.test(extension)) {
    return false
  }
  // 檢查是否在允許清單中
  return isExtensionAllowed(extension)
}

export function isValidBooker(booker: string): boolean {
  return booker.trim().length >= 2 && booker.trim().length <= 20
}