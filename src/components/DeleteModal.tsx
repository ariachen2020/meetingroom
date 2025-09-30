'use client'

import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { Booking } from '@/types'

interface DeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (extension: string, deleteAll: boolean) => Promise<{ success: boolean; message: string }>
  booking: Booking
  recurringCount?: number
}

export default function DeleteModal({ isOpen, onClose, onConfirm, booking, recurringCount }: DeleteModalProps) {
  const [extension, setExtension] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteAll, setDeleteAll] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!extension.trim()) {
      setError('請輸入分機號碼')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await onConfirm(extension, deleteAll)

      if (result.success) {
        handleClose()
      } else {
        setError(result.message || '刪除失敗')
      }
    } catch (error) {
      setError('刪除失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setExtension('')
    setError('')
    setDeleteAll(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            刪除預約確認
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900 mb-2">
                即將刪除以下預約
              </h4>
              <div className="text-sm text-red-800 space-y-1">
                <p>預約人：{booking.booker}</p>
                <p>時間：{booking.timeSlot}</p>
                <p>日期：{booking.date}</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="extension" className="block text-sm font-medium text-gray-700 mb-2">
              請輸入預約時填寫的分機號碼以驗證身份 *
            </label>
            <input
              type="text"
              id="extension"
              value={extension}
              onChange={(e) => setExtension(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="請輸入分機號碼"
              autoFocus
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          {recurringCount && recurringCount > 1 && (
            <div className="border-t pt-4">
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="deleteAll"
                  checked={deleteAll}
                  onChange={(e) => setDeleteAll(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 mt-0.5"
                />
                <label htmlFor="deleteAll" className="text-sm text-gray-700">
                  <span className="font-medium">刪除所有循環預約</span>
                  <p className="text-gray-500 mt-1">
                    此預約是循環預約的一部分，共有 <span className="font-semibold text-red-600">{recurringCount}</span> 筆預約。勾選此選項將刪除所有未來的循環預約。
                  </p>
                </label>
              </div>
            </div>
          )}

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
              className="flex-1 btn btn-danger"
              disabled={isSubmitting}
            >
              {isSubmitting ? '刪除中...' : '確認刪除'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}