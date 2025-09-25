import { NextResponse } from 'next/server'
import { backupManager } from '@/lib/backup'

export async function GET() {
  try {
    const backups = await backupManager.getBackupList()
    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0)
    const latestBackup = backups[0]

    return NextResponse.json({
      success: true,
      status: {
        totalBackups: backups.length,
        totalSize,
        totalSizeFormatted: backupManager.formatFileSize(totalSize),
        latestBackup: latestBackup ? {
          filename: latestBackup.filename,
          createdAt: latestBackup.createdAt,
          size: latestBackup.size,
          sizeFormatted: backupManager.formatFileSize(latestBackup.size)
        } : null,
        retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30')
      },
      backups: backups.map(backup => ({
        filename: backup.filename,
        size: backup.size,
        sizeFormatted: backupManager.formatFileSize(backup.size),
        createdAt: backup.createdAt
      }))
    })
  } catch (error) {
    console.error('Backup status API error:', error)
    return NextResponse.json(
      { success: false, message: '無法取得備份狀態' },
      { status: 500 }
    )
  }
}