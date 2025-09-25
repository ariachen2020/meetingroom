import { promises as fs } from 'fs'
import path from 'path'
import { Booking } from '@/types'

const DATA_DIR = path.join(process.cwd(), 'data')
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json')

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch (error) {
    // Directory might already exist
  }
}

// Initialize bookings file if it doesn't exist
async function ensureBookingsFile() {
  try {
    await fs.access(BOOKINGS_FILE)
  } catch (error) {
    // File doesn't exist, create with sample data
    const sampleBookings: Booking[] = [
      {
        id: 1,
        roomId: 'A',
        date: '2025-09-25',
        timeSlot: '10:00-11:00',
        booker: '王小美',
        extension: '1003',
        createdAt: new Date()
      },
      {
        id: 2,
        roomId: 'B',
        date: '2025-09-25',
        timeSlot: '11:00-12:00',
        booker: '陳小強',
        extension: '2001',
        createdAt: new Date()
      }
    ]
    await fs.writeFile(BOOKINGS_FILE, JSON.stringify(sampleBookings, null, 2))
  }
}

// Read all bookings
export async function getBookings(): Promise<Booking[]> {
  await ensureDataDir()
  await ensureBookingsFile()

  try {
    const data = await fs.readFile(BOOKINGS_FILE, 'utf-8')
    const bookings = JSON.parse(data)
    // Convert createdAt strings back to Date objects
    return bookings.map((booking: Booking & { createdAt: string }) => ({
      ...booking,
      createdAt: new Date(booking.createdAt)
    }))
  } catch (error) {
    console.error('Error reading bookings:', error)
    return []
  }
}

// Save all bookings
async function saveBookings(bookings: Booking[]): Promise<void> {
  await ensureDataDir()
  await fs.writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2))
}

// Add a new booking
export async function createBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> {
  const bookings = await getBookings()
  const newId = bookings.length > 0 ? Math.max(...bookings.map(b => b.id)) + 1 : 1

  const newBooking: Booking = {
    ...booking,
    id: newId,
    createdAt: new Date()
  }

  bookings.push(newBooking)
  await saveBookings(bookings)
  return newBooking
}

// Delete a booking
export async function deleteBooking(id: number): Promise<boolean> {
  const bookings = await getBookings()
  const index = bookings.findIndex(b => b.id === id)

  if (index === -1) {
    return false
  }

  bookings.splice(index, 1)
  await saveBookings(bookings)
  return true
}

// Get booking by ID
export async function getBookingById(id: number): Promise<Booking | null> {
  const bookings = await getBookings()
  return bookings.find(b => b.id === id) || null
}

// Get bookings by room and date
export async function getBookingsByRoomAndDate(roomId: string, date: string): Promise<Booking[]> {
  const bookings = await getBookings()
  return bookings.filter(b => b.roomId === roomId && b.date === date)
}