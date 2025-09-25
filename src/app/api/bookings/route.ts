import { NextRequest, NextResponse } from 'next/server'
import { getBookings } from '@/lib/storage'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const date = searchParams.get('date')

    if (!roomId || (roomId !== 'A' && roomId !== 'B')) {
      return NextResponse.json(
        { error: 'Invalid room ID' },
        { status: 400 }
      )
    }

    const allBookings = await getBookings()
    let filteredBookings = allBookings.filter(b => b.roomId === roomId)

    if (date) {
      if (date.length === 10) {
        // Single date: YYYY-MM-DD
        filteredBookings = filteredBookings.filter(b => b.date === date)
      } else if (date.length === 7) {
        // Month: YYYY-MM
        filteredBookings = filteredBookings.filter(b => b.date.startsWith(date))
      } else {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        )
      }
    }

    // Sort by date and time slot
    filteredBookings.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date)
      if (dateCompare !== 0) return dateCompare
      return a.timeSlot.localeCompare(b.timeSlot)
    })

    return NextResponse.json({
      bookings: filteredBookings.map(booking => ({
        ...booking,
        createdAt: booking.createdAt.toISOString()
      }))
    })
  } catch (error) {
    console.error('GET /api/bookings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}