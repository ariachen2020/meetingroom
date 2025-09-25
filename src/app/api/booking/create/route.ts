import { NextRequest, NextResponse } from 'next/server'
import { createBooking, getBookingsByRoomAndDate } from '@/lib/storage'
import { isValidTimeSlot, isValidExtension, isValidBooker } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { roomId, date, timeSlot, booker, extension } = body

    // Validation
    if (!roomId || (roomId !== 'A' && roomId !== 'B')) {
      return NextResponse.json(
        { message: '無效的會議室ID' },
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
        { message: '請輸入正確的預約人姓名（1-10個字）' },
        { status: 400 }
      )
    }

    if (!isValidExtension(extension)) {
      return NextResponse.json(
        { message: '請輸入正確的分機號碼（3-5位數字）' },
        { status: 400 }
      )
    }

    // Check for existing booking
    const existingBookings = await getBookingsByRoomAndDate(roomId, date)
    const conflicts = existingBookings.filter(b => b.timeSlot === timeSlot)

    if (conflicts.length > 0) {
      return NextResponse.json({
        message: '該時段已有預約，是否仍要預約？',
        conflicts
      })
    }

    // Create new booking
    const booking = await createBooking({
      roomId,
      date,
      timeSlot,
      booker: booker.trim(),
      extension: extension.trim()
    })

    return NextResponse.json({
      success: true,
      message: '預約成功',
      booking
    })

  } catch (error) {
    console.error('POST /api/booking/create error:', error)
    return NextResponse.json(
      { message: '預約失敗，請稍後再試' },
      { status: 500 }
    )
  }
}