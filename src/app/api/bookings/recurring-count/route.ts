import { NextRequest, NextResponse } from 'next/server'
import { getRecurringGroupCount } from '@/lib/storage'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')

    if (!groupId) {
      return NextResponse.json(
        { message: '缺少群組ID' },
        { status: 400 }
      )
    }

    const count = await getRecurringGroupCount(groupId)

    return NextResponse.json({
      count
    })

  } catch (error) {
    console.error('GET /api/bookings/recurring-count error:', error)
    return NextResponse.json(
      { message: '查詢失敗' },
      { status: 500 }
    )
  }
}