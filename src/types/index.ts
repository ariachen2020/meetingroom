export interface Booking {
  id: number
  roomId: string
  date: string
  timeSlot: string
  booker: string
  extension: string
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
}

export interface BookingForm {
  booker: string
  extension: string
  timeSlot: string
}

export interface DeleteBookingRequest {
  bookingId: number
  extension: string
}