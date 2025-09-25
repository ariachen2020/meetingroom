import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId, extension } = body

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

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    })

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

    await prisma.booking.delete({
      where: { id: bookingId }
    })

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