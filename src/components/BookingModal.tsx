'use client'

import { useState } from 'react'
import TimePicker from 'react-time-picker'
import 'react-time-picker/dist/TimePicker.css'
import 'react-clock/dist/Clock.css'
import { X, AlertCircle } from 'lucide-react'
import { BookingForm, Booking } from '@/types'
import { isValidExtension, isValidBooker } from '@/lib/utils'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: BookingForm) => Promise<{ success: boolean; message: string; conflicts?: Booking[] }>
  timeSlot: string
  roomId: string
  date: string
  conflicts?: Booking[]
}

export default function BookingModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  timeSlot, 
  roomId, 
  date,
  conflicts 
}: BookingModalProps) {
  const [formData, setFormData] = useState<BookingForm>({
    booker: '',
    extension: '',
    title: '',
    timeSlot: '',
    startTime: '',
    endTime: '',
    recurring: {
      enabled: false,
      type: 'weekly',
      endDate: ''
    }
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConflictWarning, setShowConflictWarning] = useState(false)
  const [conflictBookings, setConflictBookings] = useState<Booking[]>([])

  if (!isOpen) return null

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!isValidBooker(formData.booker)) {
      newErrors.booker = '預約人姓名需要2-20個字元'
    }

    if (!isValidExtension(formData.extension)) {
      newErrors.extension = '分機號碼需要3-5位數字'
    }

    if (!formData.startTime || !formData.endTime) {
      newErrors.timeSlot = '請選擇開始和結束時間'
    } else {
      // 驗證時間格式和範圍
      const startTime = formData.startTime
      const endTime = formData.endTime
      
      if (startTime >= endTime) {
        newErrors.timeSlot = '結束時間必須晚於開始時間'
      } else {
        // 檢查時間是否在營業時間內 (8:00-18:00)
        const [startHour] = startTime.split(':').map(Number)
        const [endHour] = endTime.split(':').map(Number)
        
        if (startHour < 8 || endHour > 18) {
          newErrors.timeSlot = '預約時間必須在 08:00-18:00 之間'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    
    try {
      const result = await onSubmit(formData)
      
      if (!result.success && result.conflicts && result.conflicts.length > 0) {
        setConflictBookings(result.conflicts)
        setShowConflictWarning(true)
        setIsSubmitting(false)
        return
      }
      
      if (result.success) {
        handleClose()
      } else {
        alert(result.message || '預約失敗，請稍後再試')
      }
    } catch (error) {
      alert('預約失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConflictConfirm = async () => {
    setIsSubmitting(true)
    try {
      const result = await onSubmit({ ...formData, forceBook: true } as BookingForm & { forceBook: boolean })
      if (result.success) {
        handleClose()
      } else {
        alert(result.message || '預約失敗，請稍後再試')
      }
    } catch (error) {
      alert('預約失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({ 
      booker: '', 
      extension: '', 
      title: '',
      timeSlot: '', 
      startTime: '', 
      endTime: '',
      recurring: {
        enabled: false,
        type: 'weekly',
        endDate: ''
      }
    })
    setErrors({})
    setShowConflictWarning(false)
    setConflictBookings([])
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {showConflictWarning ? '預約衝突警告' : '新增預約'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {showConflictWarning ? (
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-900 mb-2">
                  該時段已有預約，是否仍要預約？
                </h4>
                <div className="text-sm text-orange-800">
                  <p className="mb-2">會議室：{roomId}</p>
                  <p className="mb-2">日期：{date}</p>
                  <p className="mb-2">時間：{timeSlot}</p>
                  <p className="mb-2">現有預約：</p>
                  <ul className="list-disc list-inside pl-4 space-y-1">
                    {conflictBookings.map(booking => (
                      <li key={booking.id}>
                        <span className="inline-flex items-center gap-2">
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                            順序 {booking.orderIndex}
                          </span>
                          {booking.booker} (分機: {booking.extension})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConflictWarning(false)}
                className="flex-1 btn btn-secondary"
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                onClick={handleConflictConfirm}
                className="flex-1 btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? '預約中...' : '仍要預約'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                會議室
              </label>
              <input
                type="text"
                value={`會議室 ${roomId}`}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                日期
              </label>
              <input
                type="text"
                value={date}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                預約時間 *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">開始時間</label>
                  <TimePicker
                    onChange={(value) => {
                      const startTime = value as string
                      const endTime = formData.endTime || ''
                      const timeSlot = startTime && endTime ? `${startTime}-${endTime}` : ''
                      setFormData(prev => ({ ...prev, startTime, timeSlot }))
                    }}
                    value={formData.startTime || null}
                    locale="en-GB" // Force 24-hour format
                    format="HH:mm"
                    hourPlaceholder="hh"
                    minutePlaceholder="mm"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    minTime="08:00"
                    maxTime="18:00"
                    disableClock
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">結束時間</label>
                  <TimePicker
                    onChange={(value) => {
                      const endTime = value as string
                      const startTime = formData.startTime || ''
                      const timeSlot = startTime && endTime ? `${startTime}-${endTime}` : ''
                      setFormData(prev => ({ ...prev, endTime, timeSlot }))
                    }}
                    value={formData.endTime || null}
                    locale="en-GB" // Force 24-hour format
                    format="HH:mm"
                    hourPlaceholder="hh"
                    minutePlaceholder="mm"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    minTime={formData.startTime || "08:00"}
                    maxTime="18:00"
                    disableClock
                  />
                </div>
              </div>
              {formData.startTime && formData.endTime && (
                <p className="mt-1 text-sm text-gray-600">
                  預約時段：{formData.timeSlot}
                </p>
              )}
              {errors.timeSlot && (
                <p className="mt-1 text-sm text-red-600">{errors.timeSlot}</p>
              )}
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                會議名稱 (選填)
              </label>
              <input
                type="text"
                id="title"
                value={formData.title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="請輸入會議名稱"
              />
            </div>

            <div>
              <label htmlFor="booker" className="block text-sm font-medium text-gray-700 mb-2">
                預約人姓名 *
              </label>
              <input
                type="text"
                id="booker"
                value={formData.booker}
                onChange={(e) => setFormData(prev => ({ ...prev, booker: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.booker ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="請輸入預約人姓名"
              />
              {errors.booker && (
                <p className="mt-1 text-sm text-red-600">{errors.booker}</p>
              )}
            </div>

            <div>
              <label htmlFor="extension" className="block text-sm font-medium text-gray-700 mb-2">
                聯絡分機 *
              </label>
              <input
                type="text"
                id="extension"
                value={formData.extension}
                onChange={(e) => setFormData(prev => ({ ...prev, extension: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.extension ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="請輸入聯絡分機"
              />
              {errors.extension && (
                <p className="mt-1 text-sm text-red-600">{errors.extension}</p>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={formData.recurring?.enabled || false}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    recurring: {
                      ...prev.recurring!,
                      enabled: e.target.checked
                    }
                  }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="recurring" className="text-sm font-medium text-gray-700">
                  循環預約
                </label>
              </div>

              {formData.recurring?.enabled && (
                <div className="space-y-3 pl-6">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">重複頻率</label>
                    <select
                      value={formData.recurring.type}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        recurring: {
                          ...prev.recurring!,
                          type: e.target.value as 'daily' | 'weekly' | 'monthly'
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="daily">每日</option>
                      <option value="weekly">每週</option>
                      <option value="monthly">每月</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">結束日期</label>
                    <input
                      type="date"
                      value={formData.recurring.endDate}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        recurring: {
                          ...prev.recurring!,
                          endDate: e.target.value
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={date}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 btn btn-secondary"
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                type="submit"
                className="flex-1 btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? '預約中...' : '確認預約'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}