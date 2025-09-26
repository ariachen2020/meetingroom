import { NextRequest, NextResponse } from 'next/server'
import { createBooking, createRecurringBookings, getBookingsByRoomAndDate } from '@/lib/storage'
import { isValidTimeSlot, isValidExtension, isValidBooker } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { roomId, date, timeSlot, booker, extension, recurring, forceBook } = body

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
        { message: '請輸入正確的預約人姓名（2-20個字元）' },
        { status: 400 }
      )
    }

    if (!isValidExtension(extension)) {
      return NextResponse.json(
        { message: '請輸入正確的分機號碼（3-5位數字）' },
        { status: 400 }
      )
    }

    // Check for existing booking if not forcing
    if (!forceBook) {
      const existingBookings = await getBookingsByRoomAndDate(roomId, date)
      const conflicts = existingBookings.filter(b => b.timeSlot === timeSlot)

      if (conflicts.length > 0) {
        return NextResponse.json({
          success: false,
          message: '該時段已有預約，是否仍要預約？',
          conflicts
        })
      }
    }

    const bookingData = {
      roomId,
      date,
      timeSlot,
      booker: booker.trim(),
      extension: extension.trim()
    }

    // Handle recurring bookings
    if (recurring?.enabled && recurring.endDate) {
      const createdBookings = await createRecurringBookings(bookingData, {
        type: recurring.type,
        endDate: recurring.endDate
      })

      return NextResponse.json({
        success: true,
        message: `成功建立 ${createdBookings.length} 個循環預約`,
        bookings: createdBookings
      })
    } else {
      // Create single booking
      const booking = await createBooking(bookingData)

      return NextResponse.json({
        success: true,
        message: '預約成功',
        booking
      })
    }

  } catch (error) {
    console.error('POST /api/booking/create error:', error)
    return NextResponse.json(
      { message: '預約失敗，請稍後再試' },
      { status: 500 }
    )
  }
}