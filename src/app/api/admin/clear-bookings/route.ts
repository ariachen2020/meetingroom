import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    // 簡單的密碼保護 - 使用後記得刪除此檔案！
    if (password !== 'clear-test-data-2025') {
      return NextResponse.json(
        { message: '密碼錯誤' },
        { status: 403 }
      )
    }

    // 刪除所有預約記錄
    const result = await prisma.booking.deleteMany({})

    return NextResponse.json({
      success: true,
      message: `已刪除 ${result.count} 筆預約記錄`,
      deletedCount: result.count
    })

  } catch (error) {
    console.error('POST /api/admin/clear-bookings error:', error)
    return NextResponse.json(
      { message: '清空失敗，請稍後再試' },
      { status: 500 }
    )
  }
}