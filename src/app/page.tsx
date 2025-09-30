import Link from 'next/link'
import { MapPin, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8 sm:mb-12 px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
          會議室預約系統
        </h1>
        <p className="text-base sm:text-lg text-gray-600">
          請選擇您要預約的會議室
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-2xl mx-auto px-4">
        <Link
          href="/room/A"
          className="group block p-6 sm:p-8 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-blue-200 transition-colors">
              <MapPin className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              會議室 A
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              點擊查看預約狀況
            </p>
          </div>
        </Link>

        <Link
          href="/room/B"
          className="group block p-6 sm:p-8 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-blue-200 transition-colors">
              <Users className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              會議室 B
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              點擊查看預約狀況
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}