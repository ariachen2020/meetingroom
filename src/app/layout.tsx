import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '會議室預約系統',
  description: '簡單易用的會議室預約管理系統',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </body>
    </html>
  )
}