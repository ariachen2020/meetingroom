import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Users } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { getBookings } from '@/lib/storage'
import { CalendarDay } from '@/types'
import Calendar from '@/components/Calendar'

interface PageProps {
  params: Promise<{
    roomId: string
  }>
  searchParams: Promise<{
    month?: string
  }>
}

async function getCalendarData(roomId: string, month: string): Promise<CalendarDay[]> {
  const currentDate = month ? new Date(month) : new Date()
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)

  const startDateStr = format(monthStart, 'yyyy-MM-dd')
  const endDateStr = format(monthEnd, 'yyyy-MM-dd')

  // Get all bookings
  const allBookings = await getBookings()

  // Filter by room and date range
  const bookings = allBookings.filter(booking => {
    return booking.roomId === roomId &&
           booking.date >= startDateStr &&
           booking.date <= endDateStr
  })

  // Sort bookings
  bookings.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date)
    if (dateCompare !== 0) return dateCompare
    return a.timeSlot.localeCompare(b.timeSlot)
  })

  const calendarData: CalendarDay[] = []
  const bookingsByDate = new Map<string, typeof bookings>()

  bookings.forEach(booking => {
    const existing = bookingsByDate.get(booking.date) || []
    existing.push(booking)
    bookingsByDate.set(booking.date, existing)
  })

  for (const [date, dateBookings] of bookingsByDate) {
    // Extract unique time slots for this date, sorted
    const timeSlots = [...new Set(dateBookings.map(b => b.timeSlot))]
      .sort((a, b) => a.localeCompare(b))

    calendarData.push({
      date,
      bookings: dateBookings,
      hasBookings: dateBookings.length > 0,
      timeSlots
    })
  }

  return calendarData
}

function LoadingCalendar() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
          <div className="w-32 h-6 bg-gray-200 rounded"></div>
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default async function RoomPage({ params, searchParams }: PageProps) {
  const { roomId } = await params
  const { month: monthParam } = await searchParams
  const month = monthParam || format(new Date(), 'yyyy-MM')

  if (roomId !== 'A' && roomId !== 'B') {
    notFound()
  }

  const currentDate = new Date(month + '-01')
  const calendarData = await getCalendarData(roomId, month)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-4 sm:mb-6 md:mb-8 px-2 sm:px-0">
        <Link
          href="/"
          className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>返回會議室選擇</span>
        </Link>
      </div>

      <div className="text-center mb-6 sm:mb-8 px-4">
        <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
          {roomId === 'A' ? (
            <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          ) : (
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            會議室 {roomId}
          </h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600">
          點擊日期查看詳細預約資訊或進行預約
        </p>
      </div>

      <Suspense fallback={<LoadingCalendar />}>
        <Calendar
          roomId={roomId}
          currentDate={currentDate}
          calendarData={calendarData}
        />
      </Suspense>
    </div>
  )
}