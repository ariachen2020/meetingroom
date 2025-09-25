'use client'

import { useState } from 'react'
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
    timeSlot: '',
    startTime: '',
    endTime: ''
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
    } else if (formData.startTime >= formData.endTime) {
      newErrors.timeSlot = '結束時間必須晚於開始時間'
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
    setFormData({ booker: '', extension: '', timeSlot: '', startTime: '', endTime: '' })
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
                        {booking.booker} (分機: {booking.extension})
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
                  <input
                    type="time"
                    value={formData.startTime || ''}
                    onChange={(e) => {
                      const startTime = e.target.value
                      const endTime = formData.endTime || ''
                      const timeSlot = startTime && endTime ? `${startTime}-${endTime}` : ''
                      setFormData(prev => ({ 
                        ...prev, 
                        startTime,
                        timeSlot 
                      }))
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.timeSlot ? 'border-red-300' : 'border-gray-300'
                    }`}
                    min="08:00"
                    max="18:00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">結束時間</label>
                  <input
                    type="time"
                    value={formData.endTime || ''}
                    onChange={(e) => {
                      const endTime = e.target.value
                      const startTime = formData.startTime || ''
                      const timeSlot = startTime && endTime ? `${startTime}-${endTime}` : ''
                      setFormData(prev => ({ 
                        ...prev, 
                        endTime,
                        timeSlot 
                      }))
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.timeSlot ? 'border-red-300' : 'border-gray-300'
                    }`}
                    min="08:00"
                    max="18:00"
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