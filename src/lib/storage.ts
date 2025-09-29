import { PrismaClient } from '@prisma/client'
import { Booking } from '@/types'

const prisma = new PrismaClient()

// Read all bookings
export async function getBookings(): Promise<Booking[]> {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    return bookings
  } catch (error) {
    console.error('Error reading bookings:', error)
    return []
  }
}

// Add a new booking
export async function createBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> {
  const newBooking = await prisma.booking.create({
    data: booking
  })
  return newBooking
}

// Delete a booking
export async function deleteBooking(id: number): Promise<boolean> {
  try {
    await prisma.booking.delete({
      where: { id }
    })
    return true
  } catch (error) {
    console.error(`Error deleting booking ${id}:`, error)
    return false
  }
}

// Get booking by ID
export async function getBookingById(id: number): Promise<Booking | null> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id }
    })
    return booking
  } catch (error) {
    console.error(`Error getting booking ${id}:`, error)
    return null
  }
}

// Get bookings by room and date
export async function getBookingsByRoomAndDate(roomId: string, date: string): Promise<Booking[]> {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        roomId,
        date
      }
    })
    return bookings
  } catch (error) {
    console.error(`Error getting bookings for room ${roomId} on date ${date}:`, error)
    return []
  }
}

// Create recurring bookings
export async function createRecurringBookings(
  bookingData: Omit<Booking, 'id' | 'createdAt' | 'title'> & { title?: string },
  recurring: { type: 'daily' | 'weekly' | 'monthly'; endDate: string }
): Promise<Booking[]> {
  const createdBookings: Booking[] = []
  
  const startDate = new Date(bookingData.date)
  const endDate = new Date(recurring.endDate)
  const currentDate = new Date(startDate)
  
  const bookingsToCreate = []

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    
    bookingsToCreate.push({
      ...bookingData,
      date: dateStr,
    })
    
    // Calculate next date
    switch (recurring.type) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1)
        break
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7)
        break
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1)
        break
    }
  }

  try {
    // Using a transaction to ensure all or nothing
    const result = await prisma.$transaction(
      bookingsToCreate.map(b => prisma.booking.create({ data: b }))
    )
    createdBookings.push(...result)
  } catch (error) {
    console.error('Error creating recurring bookings:', error)
    // Depending on requirements, you might want to handle partial failures
    // For now, we just log the error and return what was created before the error
  }
  
  return createdBookings
}
