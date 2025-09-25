import Link from 'next/link'
import { MapPin, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          會議室預約系統
        </h1>
        <p className="text-lg text-gray-600">
          請選擇您要預約的會議室
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
        <Link
          href="/room/A"
          className="group block p-8 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              會議室 A
            </h2>
            <p className="text-gray-600">
              點擊查看預約狀況
            </p>
          </div>
        </Link>

        <Link
          href="/room/B"
          className="group block p-8 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-300"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              會議室 B
            </h2>
            <p className="text-gray-600">
              點擊查看預約狀況
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}