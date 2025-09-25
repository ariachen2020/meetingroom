import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    if (date) {
      if (date.length === 10) {
        const bookings = await prisma.booking.findMany({
          where: {
            roomId,
            date
          },
          orderBy: {
            timeSlot: 'asc'
          }
        })

        return NextResponse.json({
          bookings: bookings.map(booking => ({
            ...booking,
            createdAt: booking.createdAt.toISOString()
          }))
        })
      } else if (date.length === 7) {
        const startDate = `${date}-01`
        const year = parseInt(date.substring(0, 4))
        const month = parseInt(date.substring(5, 7))
        const lastDay = new Date(year, month, 0).getDate()
        const endDate = `${date}-${lastDay.toString().padStart(2, '0')}`

        const bookings = await prisma.booking.findMany({
          where: {
            roomId,
            date: {
              gte: startDate,
              lte: endDate
            }
          },
          orderBy: [
            { date: 'asc' },
            { timeSlot: 'asc' }
          ]
        })

        return NextResponse.json({
          bookings: bookings.map(booking => ({
            ...booking,
            createdAt: booking.createdAt.toISOString()
          }))
        })
      }
    }

    return NextResponse.json(
      { error: 'Invalid date format' },
      { status: 400 }
    )
  } catch (error) {
    console.error('GET /api/bookings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}