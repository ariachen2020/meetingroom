'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Trash2, RefreshCw, Database, Clock, HardDrive } from 'lucide-react'

interface BackupInfo {
  filename: string
  size: number
  sizeFormatted: string
  createdAt: string
}

interface BackupStatus {
  totalBackups: number
  totalSize: number
  totalSizeFormatted: string
  latestBackup: BackupInfo | null
  retentionDays: number
}

export default function AdminPage() {
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null)
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchBackupStatus()
  }, [])

  const fetchBackupStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/backup-status')
      const data = await response.json()
      
      if (data.success) {
        setBackupStatus(data.status)
        setBackups(data.backups)
      }
    } catch (error) {
      console.error('Failed to fetch backup status:', error)
      setMessage('無法載入備份狀態')
    } finally {
      setIsLoading(false)
    }
  }

  const createBackup = async () => {
    setIsCreatingBackup(true)
    setMessage('')

    try {
      const response = await fetch('/api/backup', { method: 'POST' })
      const result = await response.json()
      
      if (result.success) {
        setMessage('備份建立成功')
        await fetchBackupStatus()
      } else {
        setMessage(`備份失敗: ${result.message}`)
      }
    } catch (error) {
      setMessage('備份失敗，請稍後再試')
    } finally {
      setIsCreatingBackup(false)
      setTimeout(() => setMessage(''), 5000)
    }
  }

  const cleanupOldBackups = async () => {
    setIsCleaningUp(true)
    setMessage('')

    try {
      const response = await fetch('/api/backup', { method: 'DELETE' })
      const result = await response.json()
      
      if (result.success) {
        setMessage(result.message)
        await fetchBackupStatus()
      } else {
        setMessage(`清理失敗: ${result.message}`)
      }
    } catch (error) {
      setMessage('清理失敗，請稍後再試')
    } finally {
      setIsCleaningUp(false)
      setTimeout(() => setMessage(''), 5000)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-8">
        <Link
          href="/"
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回首頁</span>
        </Link>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          系統管理
        </h1>
        <p className="text-lg text-gray-600">
          資料庫備份與管理
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes('成功') || message.includes('完成') 
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {backupStatus && (
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">總備份數</p>
                <p className="text-2xl font-bold text-gray-900">{backupStatus.totalBackups}</p>
              </div>
              <Database className="w-8 h-8 text-primary-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">總大小</p>
                <p className="text-2xl font-bold text-gray-900">{backupStatus.totalSizeFormatted}</p>
              </div>
              <HardDrive className="w-8 h-8 text-primary-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">保留天數</p>
                <p className="text-2xl font-bold text-gray-900">{backupStatus.retentionDays}</p>
              </div>
              <Clock className="w-8 h-8 text-primary-600" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">備份操作</h2>
          <div className="flex space-x-3">
            <button
              onClick={createBackup}
              disabled={isCreatingBackup}
              className="flex items-center space-x-2 btn btn-primary"
            >
              {isCreatingBackup ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isCreatingBackup ? '建立中...' : '立即備份'}</span>
            </button>
            
            <button
              onClick={cleanupOldBackups}
              disabled={isCleaningUp}
              className="flex items-center space-x-2 btn btn-secondary"
            >
              {isCleaningUp ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>{isCleaningUp ? '清理中...' : '清理舊備份'}</span>
            </button>
            
            <button
              onClick={fetchBackupStatus}
              className="flex items-center space-x-2 btn btn-secondary"
            >
              <RefreshCw className="w-4 h-4" />
              <span>重新整理</span>
            </button>
          </div>
        </div>

        {backupStatus?.latestBackup && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">最新備份</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>檔案名稱: {backupStatus.latestBackup.filename}</p>
              <p>建立時間: {formatDate(backupStatus.latestBackup.createdAt)}</p>
              <p>檔案大小: {backupStatus.latestBackup.sizeFormatted}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-900">備份歷史</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  檔案名稱
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  建立時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  檔案大小
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {backups.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    尚無備份記錄
                  </td>
                </tr>
              ) : (
                backups.map((backup) => (
                  <tr key={backup.filename} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {backup.filename}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(backup.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {backup.sizeFormatted}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}