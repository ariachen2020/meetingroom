import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidTimeSlot, isValidExtension, isValidBooker } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { roomId, date, timeSlot, booker, extension, force = false } = body

    if (!roomId || (roomId !== 'A' && roomId !== 'B')) {
      return NextResponse.json(
        { message: '無效的會議室' },
        { status: 400 }
      )
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { message: '無效的日期格式' },
        { status: 400 }
      )
    }

    if (!isValidTimeSlot(timeSlot)) {
      return NextResponse.json(
        { message: '無效的時間段' },
        { status: 400 }
      )
    }

    if (!isValidBooker(booker)) {
      return NextResponse.json(
        { message: '預約人姓名需要2-20個字元' },
        { status: 400 }
      )
    }

    if (!isValidExtension(extension)) {
      return NextResponse.json(
        { message: '分機號碼需要3-5位數字' },
        { status: 400 }
      )
    }

    const bookingDate = new Date(date + 'T00:00:00.000Z')
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    if (bookingDate < currentDate) {
      return NextResponse.json(
        { message: '無法預約過去的日期' },
        { status: 400 }
      )
    }

    const existingBookings = await prisma.booking.findMany({
      where: {
        roomId,
        date,
        timeSlot
      }
    })

    if (existingBookings.length > 0 && !force) {
      return NextResponse.json(
        { 
          message: '該時段已有預約，是否仍要預約？',
          conflicts: existingBookings.map(booking => ({
            ...booking,
            createdAt: booking.createdAt.toISOString()
          }))
        },
        { status: 409 }
      )
    }

    const booking = await prisma.booking.create({
      data: {
        roomId,
        date,
        timeSlot,
        booker: booker.trim(),
        extension: extension.trim()
      }
    })

    return NextResponse.json({
      success: true,
      message: '預約成功',
      booking: {
        ...booking,
        createdAt: booking.createdAt.toISOString()
      }
    })

  } catch (error) {
    console.error('POST /api/booking/create error:', error)
    return NextResponse.json(
      { message: '預約失敗，請稍後再試' },
      { status: 500 }
    )
  }
}