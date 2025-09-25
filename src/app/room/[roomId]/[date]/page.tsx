'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, User, Phone, Plus, Trash2 } from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { Booking, BookingForm } from '@/types'
import BookingModal from '@/components/BookingModal'
import DeleteModal from '@/components/DeleteModal'

interface PageProps {
  params: {
    roomId: string
    date: string
  }
}

export default function DatePage({ params }: PageProps) {
  const { roomId, date } = params
  const router = useRouter()
  
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [message, setMessage] = useState('')

  const fetchBookingsCallback = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/bookings?roomId=${roomId}&date=${date}`)
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings || [])
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    } finally {
      setIsLoading(false)
    }
  }, [roomId, date])

  // Load params
  useEffect(() => {
    if (!isValidDate(date) || (roomId !== 'A' && roomId !== 'B')) {
      router.push('/')
      return
    }
    
    fetchBookingsCallback()
  }, [roomId, date, router, fetchBookingsCallback])

  const isValidDate = (dateStr: string): boolean => {
    const parsedDate = parseISO(dateStr)
    return isValid(parsedDate) && dateStr.match(/^\d{4}-\d{2}-\d{2}$/) !== null
  }


  const handleBooking = async (formData: BookingForm & { forceBook?: boolean }) => {
    try {
      const response = await fetch('/api/booking/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          date,
          timeSlot: formData.timeSlot,
          booker: formData.booker,
          extension: formData.extension,
          force: formData.forceBook || false
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setMessage('預約成功！')
        await fetchBookingsCallback()
        setTimeout(() => setMessage(''), 3000)
        return { success: true, message: '預約成功' }
      } else {
        return { 
          success: false, 
          message: result.message,
          conflicts: result.conflicts 
        }
      }
    } catch (error) {
      return { success: false, message: '預約失敗，請稍後再試' }
    }
  }

  const handleDelete = async (extension: string) => {
    if (!selectedBooking) return { success: false, message: '無效的預約' }

    try {
      const response = await fetch('/api/booking/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          extension
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setMessage('預約已刪除')
        await fetchBookingsCallback()
        setTimeout(() => setMessage(''), 3000)
        return { success: true, message: '刪除成功' }
      } else {
        return { success: false, message: result.message || '刪除失敗' }
      }
    } catch (error) {
      return { success: false, message: '刪除失敗，請稍後再試' }
    }
  }

  const openBookingModal = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot)
    setBookingModalOpen(true)
  }

  const openDeleteModal = (booking: Booking) => {
    setSelectedBooking(booking)
    setDeleteModalOpen(true)
  }

  if (!isValidDate(date) || (roomId !== 'A' && roomId !== 'B')) {
    return null
  }

  const dateObj = parseISO(date)
  const isPastDate = dateObj < new Date(new Date().setHours(0, 0, 0, 0))

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-8">
        <Link
          href={`/room/${roomId}`}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回月曆</span>
        </Link>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          會議室 {roomId}
        </h1>
        <p className="text-lg text-gray-600">
          {format(dateObj, 'yyyy年 M月 d日 EEEE', { locale: zhTW })}
        </p>
        {isPastDate && (
          <p className="text-sm text-orange-600 mt-2">
            此日期已過，僅能查看預約資訊
          </p>
        )}
      </div>

      {message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">預約清單</h2>
          {!isPastDate && (
            <button
              onClick={() => openBookingModal('')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>新增預約</span>
            </button>
          )}
        </div>
        
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-gray-600">載入中...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              今日暫無預約
            </div>
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {booking.timeSlot}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{booking.booker}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">分機 {booking.extension}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => openDeleteModal(booking)}
                    className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>刪除</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        onSubmit={handleBooking}
        timeSlot={selectedTimeSlot}
        roomId={roomId}
        date={date}
      />

      {selectedBooking && (
        <DeleteModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDelete}
          booking={selectedBooking}
        />
      )}
    </div>
  )
}