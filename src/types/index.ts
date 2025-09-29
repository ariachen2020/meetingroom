export interface Booking {
  id: number
  roomId: string
  date: string
  timeSlot: string
  booker: string
  extension: string
  title: string | null
  orderIndex: number
  createdAt: Date
}

export interface TimeSlot {
  time: string
  booking?: Booking
  available: boolean
}

export interface CalendarDay {
  date: string
  bookings: Booking[]
  hasBookings: boolean
  timeSlots: string[]
}

export interface BookingForm {
  booker: string
  extension: string
  title?: string
  timeSlot: string
  startTime?: string
  endTime?: string
  recurring?: {
    enabled: boolean
    type: 'daily' | 'weekly' | 'monthly'
    endDate: string
  }
}

export interface DeleteBookingRequest {
  bookingId: number
  extension: string
}