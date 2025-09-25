'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { CalendarDay } from '@/types'

interface CalendarProps {
  roomId: string
  currentDate: Date
  calendarData: CalendarDay[]
}

export default function Calendar({ roomId, currentDate, calendarData }: CalendarProps) {
  const [selectedMonth, setSelectedMonth] = useState(currentDate)
  const [isLoading, setIsLoading] = useState(false)
  
  const monthStart = startOfMonth(selectedMonth)
  const monthEnd = endOfMonth(selectedMonth)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getBookingCountForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    const dayData = calendarData.find(day => day.date === dateString)
    return dayData ? dayData.bookings.length : 0
  }

  const previousMonth = async () => {
    setIsLoading(true)
    setSelectedMonth(subMonths(selectedMonth, 1))
    setTimeout(() => setIsLoading(false), 300)
  }

  const nextMonth = async () => {
    setIsLoading(true)
    setSelectedMonth(addMonths(selectedMonth, 1))
    setTimeout(() => setIsLoading(false), 300)
  }

  const renderCalendarDay = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    const bookingCount = getBookingCountForDate(date)
    const isCurrentMonth = isSameMonth(date, selectedMonth)
    const isPastDate = date < new Date(new Date().setHours(0, 0, 0, 0))

    let content
    let linkClass = "flex flex-col items-center justify-center h-20 p-2 rounded-lg transition-all duration-200"

    if (!isCurrentMonth) {
      linkClass += " text-gray-300 cursor-not-allowed"
      content = (
        <span className="text-sm">{format(date, 'd')}</span>
      )
    } else if (bookingCount === 0) {
      linkClass += " hover:bg-gray-100 border-2 border-gray-200"
      content = (
        <span className="text-sm text-gray-700">{format(date, 'd')}</span>
      )
    } else {
      linkClass += " hover:bg-blue-50 border-2 border-blue-200 bg-blue-25"
      content = (
        <>
          <span className="text-sm text-blue-700 mb-1">{format(date, 'd')}</span>
          {bookingCount === 1 ? (
            <CalendarIcon className="w-4 h-4 text-blue-600" />
          ) : (
            <div className="flex items-center space-x-1">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-orange-600 font-semibold">
                {bookingCount}
              </span>
            </div>
          )}
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
          Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
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
          <CalendarIcon className="w-4 h-4 text-blue-600" />
          <span>有預約</span>
        </div>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          <span>重疊預約</span>
        </div>
      </div>
    </div>
  )
}