'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { CalendarDay } from '@/types'

interface CalendarProps {
  roomId: string
  currentDate: Date
  calendarData: CalendarDay[]
}

export default function Calendar({ roomId, currentDate, calendarData: initialData }: CalendarProps) {
  const [selectedMonth, setSelectedMonth] = useState(currentDate)
  const [isLoading, setIsLoading] = useState(false)
  const [calendarData, setCalendarData] = useState(initialData)
  
  const monthStart = startOfMonth(selectedMonth)
  const monthEnd = endOfMonth(selectedMonth)

  // Get the calendar range including days from previous/next month to fill the grid
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // 0 = Sunday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Fetch data when month changes
  useEffect(() => {
    const fetchMonthData = async () => {
      if (format(selectedMonth, 'yyyy-MM') === format(currentDate, 'yyyy-MM')) {
        setCalendarData(initialData)
        return
      }

      setIsLoading(true)
      try {
        const monthStr = format(selectedMonth, 'yyyy-MM')
        const response = await fetch(`/api/bookings?roomId=${roomId}&date=${monthStr}`)
        if (response.ok) {
          const data = await response.json()
          
          // Transform bookings to calendar data format
          const bookingsByDate = new Map()
          data.bookings.forEach((booking: any) => {
            const existing = bookingsByDate.get(booking.date) || []
            existing.push(booking)
            bookingsByDate.set(booking.date, existing)
          })

          const newCalendarData: CalendarDay[] = []
          for (const [date, dateBookings] of bookingsByDate) {
            const timeSlots = [...new Set(dateBookings.map((b: any) => b.timeSlot))] as string[]
            timeSlots.sort((a, b) => a.localeCompare(b))

            newCalendarData.push({
              date,
              bookings: dateBookings,
              hasBookings: dateBookings.length > 0,
              timeSlots
            })
          }
          
          setCalendarData(newCalendarData)
        }
      } catch (error) {
        console.error('Failed to fetch calendar data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMonthData()
  }, [selectedMonth, roomId, currentDate, initialData])

  const getBookingCountForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    const dayData = calendarData.find(day => day.date === dateString)
    return dayData ? dayData.bookings.length : 0
  }

  const getTimeSlotsForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    const dayData = calendarData.find(day => day.date === dateString)
    return dayData ? dayData.timeSlots : []
  }

  const previousMonth = () => {
    setSelectedMonth(subMonths(selectedMonth, 1))
  }

  const nextMonth = () => {
    setSelectedMonth(addMonths(selectedMonth, 1))
  }

  const renderCalendarDay = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    const bookingCount = getBookingCountForDate(date)
    const timeSlots = getTimeSlotsForDate(date)
    const isCurrentMonth = isSameMonth(date, selectedMonth)
    const isPastDate = date < new Date(new Date().setHours(0, 0, 0, 0))
    const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

    let content
    let linkClass = "flex flex-col items-center justify-center h-24 p-2 rounded-lg transition-all duration-200 relative"

    // 今天的紅色圈圈
    if (isToday && isCurrentMonth) {
      linkClass += " ring-2 ring-red-500"
    }

    if (!isCurrentMonth) {
      linkClass += " text-gray-300 cursor-not-allowed"
      content = (
        <span className="text-sm">{format(date, 'd')}</span>
      )
    } else if (bookingCount === 0) {
      linkClass += " hover:bg-gray-100 border-2 border-gray-200"
      content = (
        <span className={`text-sm ${isToday ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
          {format(date, 'd')}
        </span>
      )
    } else {
      linkClass += " hover:bg-blue-50 border-2 border-blue-200 bg-blue-50"
      const maxDisplaySlots = 3
      const displaySlots = timeSlots.slice(0, maxDisplaySlots)
      const remainingCount = timeSlots.length - maxDisplaySlots

      content = (
        <>
          <span className={`text-sm mb-1 font-medium ${isToday ? 'text-red-600' : 'text-blue-700'}`}>
            {format(date, 'd')}
          </span>
          <div className="flex flex-col items-center space-y-0.5 text-xs w-full">
            {displaySlots.map((slot, index) => (
              <div key={index} className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs leading-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                {slot}
              </div>
            ))}
            {remainingCount > 0 && (
              <div className="px-1 py-0.5 bg-orange-100 text-orange-800 rounded text-xs leading-tight">
                +{remainingCount}個
              </div>
            )}
          </div>
        </>
      )
    }

    if (!isCurrentMonth || (isPastDate && bookingCount === 0)) {
      return (
        <div key={dateString} className={linkClass}>
          {content}
        </div>
      )
    }

    return (
      <Link
        key={dateString}
        href={`/room/${roomId}/${dateString}`}
        className={linkClass}
      >
        {content}
      </Link>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-semibold text-gray-900">
          {format(selectedMonth, 'yyyy年 M月', { locale: zhTW })}
        </h2>
        
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className="text-center font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
        
        {isLoading ? (
          Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse"></div>
          ))
        ) : (
          calendarDays.map(renderCalendarDay)
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-gray-200 rounded"></div>
          <span>無預約</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-100 border-2 border-blue-200 rounded"></div>
          <span>顯示預約時段</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded text-xs flex items-center justify-center">+</div>
          <span>更多時段</span>
        </div>
        <div className="text-xs text-gray-500">
          點擊日期查看完整預約詳情
        </div>
      </div>
    </div>
  )
}