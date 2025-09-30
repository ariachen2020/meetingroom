import { NextRequest, NextResponse } from 'next/server'
import { deleteBooking, getBookingById, deleteRecurringGroup, getRecurringGroupCount } from '@/lib/storage'

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId, extension, deleteAll } = body

    if (!bookingId || typeof bookingId !== 'number') {
      return NextResponse.json(
        { message: '無效的預約ID' },
        { status: 400 }
      )
    }

    if (!extension || typeof extension !== 'string') {
      return NextResponse.json(
        { message: '請輸入分機號碼' },
        { status: 400 }
      )
    }

    const booking = await getBookingById(bookingId)

    if (!booking) {
      return NextResponse.json(
        { message: '找不到該預約' },
        { status: 404 }
      )
    }

    if (booking.extension !== extension.trim()) {
      return NextResponse.json(
        { message: '分機號碼不正確' },
        { status: 403 }
      )
    }

    const bookingDate = new Date(booking.date + 'T00:00:00.000Z')
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    if (bookingDate < currentDate) {
      return NextResponse.json(
        { message: '無法刪除過去的預約' },
        { status: 400 }
      )
    }

    // If deleteAll is true and booking has a recurringGroupId, delete all in the group
    if (deleteAll && booking.recurringGroupId) {
      const result = await deleteRecurringGroup(booking.recurringGroupId)

      if (!result.success) {
        return NextResponse.json(
          { message: '刪除循環預約失敗' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `已刪除 ${result.deletedCount} 筆循環預約`
      })
    }

    // Otherwise, delete only this single booking
    const success = await deleteBooking(bookingId)

    if (!success) {
      return NextResponse.json(
        { message: '刪除失敗' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '預約已刪除'
    })

  } catch (error) {
    console.error('DELETE /api/booking/delete error:', error)
    return NextResponse.json(
      { message: '刪除失敗，請稍後再試' },
      { status: 500 }
    )
  }
}