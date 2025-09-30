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
export async function createBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'orderIndex'>): Promise<Booking> {
  // Calculate the next order index for this time slot
  const existingBookings = await prisma.booking.findMany({
    where: {
      roomId: booking.roomId,
      date: booking.date,
      timeSlot: booking.timeSlot
    },
    orderBy: {
      orderIndex: 'desc'
    },
    take: 1
  })

  const nextOrderIndex = existingBookings.length > 0 ? existingBookings[0].orderIndex + 1 : 1

  const newBooking = await prisma.booking.create({
    data: {
      ...booking,
      orderIndex: nextOrderIndex,
      recurringGroupId: booking.recurringGroupId || null
    }
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

// Delete all bookings in a recurring group
export async function deleteRecurringGroup(recurringGroupId: string): Promise<{ success: boolean; deletedCount: number }> {
  try {
    const result = await prisma.booking.deleteMany({
      where: {
        recurringGroupId,
        date: {
          gte: new Date().toISOString().split('T')[0]
        }
      }
    })
    return { success: true, deletedCount: result.count }
  } catch (error) {
    console.error(`Error deleting recurring group ${recurringGroupId}:`, error)
    return { success: false, deletedCount: 0 }
  }
}

// Get bookings count by recurring group ID
export async function getRecurringGroupCount(recurringGroupId: string): Promise<number> {
  try {
    const count = await prisma.booking.count({
      where: {
        recurringGroupId,
        date: {
          gte: new Date().toISOString().split('T')[0]
        }
      }
    })
    return count
  } catch (error) {
    console.error(`Error counting recurring group ${recurringGroupId}:`, error)
    return 0
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
      },
      orderBy: [
        { timeSlot: 'asc' },
        { orderIndex: 'asc' }
      ]
    })
    return bookings
  } catch (error) {
    console.error(`Error getting bookings for room ${roomId} on date ${date}:`, error)
    return []
  }
}

// Create recurring bookings
export async function createRecurringBookings(
  bookingData: Omit<Booking, 'id' | 'createdAt' | 'orderIndex' | 'title' | 'recurringGroupId'> & { title?: string },
  recurring: { type: 'daily' | 'weekly' | 'monthly'; endDate: string }
): Promise<Booking[]> {
  const createdBookings: Booking[] = []

  // Generate a unique group ID for this recurring series
  const recurringGroupId = `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const startDate = new Date(bookingData.date)
  const endDate = new Date(recurring.endDate)
  const currentDate = new Date(startDate)

  const bookingsToCreate = []

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]

    bookingsToCreate.push({
      ...bookingData,
      date: dateStr,
      title: bookingData.title || null,
      recurringGroupId
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
    // Create bookings sequentially to properly calculate order indexes
    for (const bookingToCreate of bookingsToCreate) {
      const booking = await createBooking(bookingToCreate)
      createdBookings.push(booking)
    }
  } catch (error) {
    console.error('Error creating recurring bookings:', error)
    // Depending on requirements, you might want to handle partial failures
    // For now, we just log the error and return what was created before the error
  }

  return createdBookings
}
