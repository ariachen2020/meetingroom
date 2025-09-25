import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 開始種子資料...')

  // 建立一些範例預約資料
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  // 會議室 A 的範例預約
  await prisma.booking.createMany({
    data: [
      {
        roomId: 'A',
        date: formatDate(today),
        timeSlot: '09:00-10:00',
        booker: '張小明',
        extension: '1001'
      },
      {
        roomId: 'A',
        date: formatDate(today),
        timeSlot: '14:00-15:00',
        booker: '李小華',
        extension: '1002'
      },
      {
        roomId: 'A',
        date: formatDate(tomorrow),
        timeSlot: '10:00-11:00',
        booker: '王小美',
        extension: '1003'
      }
    ]
  })

  // 會議室 B 的範例預約
  await prisma.booking.createMany({
    data: [
      {
        roomId: 'B',
        date: formatDate(today),
        timeSlot: '11:00-12:00',
        booker: '陳小強',
        extension: '2001'
      },
      {
        roomId: 'B',
        date: formatDate(tomorrow),
        timeSlot: '15:00-16:00',
        booker: '林小花',
        extension: '2002'
      }
    ]
  })

  console.log('✅ 種子資料建立完成！')
}

main()
  .catch((e) => {
    console.error('❌ 種子資料建立失敗:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })