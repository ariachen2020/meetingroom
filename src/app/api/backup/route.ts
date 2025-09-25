import { NextResponse } from 'next/server'
import { backupManager } from '@/lib/backup'

export async function POST() {
  try {
    const result = await backupManager.createBackup()
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 500 })
    }
  } catch (error) {
    console.error('Backup API error:', error)
    return NextResponse.json(
      { success: false, message: '備份失敗' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const backups = await backupManager.getBackupList()
    
    return NextResponse.json({
      success: true,
      backups: backups.map(backup => ({
        filename: backup.filename,
        size: backup.size,
        sizeFormatted: backupManager.formatFileSize(backup.size),
        createdAt: backup.createdAt
      }))
    })
  } catch (error) {
    console.error('Backup list API error:', error)
    return NextResponse.json(
      { success: false, message: '無法取得備份清單' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const result = await backupManager.cleanupOldBackups()
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 500 })
    }
  } catch (error) {
    console.error('Backup cleanup API error:', error)
    return NextResponse.json(
      { success: false, message: '清理失敗' },
      { status: 500 }
    )
  }
}