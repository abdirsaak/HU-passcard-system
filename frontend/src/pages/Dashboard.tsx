
import { Link, useLocation } from 'react-router-dom'

interface Props {
  student: any
  onLogout: () => void
}

export default function Dashboard({ student, onLogout }: Props) {
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'GOOD MORNING' : hour < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING'

  const initials = student.full_name
    ?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  const fee      = Number(student.fee || 0)
  const discount = Number(student.discount || 0)

  const stats = [
    { icon: '🎓', label: 'FACULTY',    value: student.faculty          || '—' },
    { icon: '📚', label: 'DEPARTMENT', value: student.department        || '—' },
    { icon: '📅', label: 'SEMESTER',   value: student.academic_term    || '—' },
    { icon: '💰', label: 'TOTAL FEE',  value: `$${fee.toLocaleString()}` },
  ]

  const profileRows: [string, string][] = [
    ['Full Name',     student.full_name],
    ['Student ID',    student.student_id],
    ['Email',         student.email],
    ['Phone',         student.phone_number],
    ['Faculty',       student.faculty],
    ['Department',    student.department],
    ['Semester',      student.academic_term],
    ['Batch / Class', student.batch],
    ['Academic Year', student.academic_year],
  ]

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── TOPBAR ── */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">HU</div>
            <span className="text-blue-600 font-bold text-base">Student Portal</span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/dashboard" className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg">Dashboard</Link>
            <Link to="/pay-fee"   className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">Pay Fee</Link>
            <Link to="/passcard"  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">Passcard</Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 font-bold text-sm flex items-center justify-center">{initials}</div>
            <button onClick={onLogout} className="border border-gray-200 text-gray-500 hover:bg-gray-100 rounded-lg px-3 py-1.5 text-sm transition-colors">Sign out</button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t border-gray-100 flex">
          <Link to="/dashboard" className="flex-1 text-center py-2 text-xs font-semibold text-blue-600 bg-blue-50">Dashboard</Link>
          <Link to="/pay-fee"   className="flex-1 text-center py-2 text-xs font-medium text-gray-500">Pay Fee</Link>
          <Link to="/passcard"  className="flex-1 text-center py-2 text-xs font-medium text-gray-500">Passcard</Link>
        </div>
      </nav>

      {/* ── WELCOME HERO ── */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500">
        <div className="max-w-6xl mx-auto px-4 py-10 flex items-center justify-between gap-6">
          <div className="flex-1">
            <p className="text-blue-200 text-xs font-semibold mb-1 uppercase tracking-widest">{greeting}</p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Welcome, {student.full_name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-blue-100 text-sm">Welcome to your Student Dashboard. Here's an overview of your academic profile.</p>
            <div className="flex flex-wrap gap-2 mt-5">
              {student.student_id  && <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">🪪 {student.student_id}</span>}
              {student.batch       && <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">🏫 {student.batch}</span>}
              {student.academic_year && <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">📆 {student.academic_year}</span>}
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-center gap-2 flex-shrink-0">
            {student.photo
              ? <img src={student.photo} alt="Student" className="w-24 h-24 rounded-full object-cover border-4 border-white/40 shadow-lg"/>
              : <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white/40 text-white font-bold text-3xl flex items-center justify-center shadow-lg">{initials}</div>
            }
            <span className="text-white/80 text-xs font-medium">{student.full_name}</span>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Quick action buttons */}
        <div className="flex gap-3 mb-8">
          <Link to="/pay-fee" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm">
            💳 Pay Fee
          </Link>
          <Link to="/passcard" className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm">
            🪪 View Passcard
          </Link>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{s.label}</div>
              <div className="text-base font-bold text-blue-600 truncate">{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── PROFILE + FINANCE ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Profile */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-4">👤 Student Profile</h2>
            <table className="w-full text-sm">
              <tbody>
                {profileRows.map(([label, value]) => (
                  <tr key={label} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 text-gray-400 w-2/5 pr-2">{label}</td>
                    <td className="py-2 text-gray-800 font-medium break-all">{value || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right col */}
          <div className="flex flex-col gap-6">

            {/* Fee summary — no net payable */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-700 mb-4">💰 Fee Summary</h2>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500 text-sm">Semester Fee</span>
                <span className="font-bold text-gray-800">${fee.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-500 text-sm">Discount</span>
                <span className="font-bold text-green-600">{discount}%</span>
              </div>
              <Link to="/pay-fee" className="mt-3 w-full block text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors">
                Pay Now →
              </Link>
            </div>

            {/* Avatar card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col items-center gap-3">
              {student.photo
                ? <img src={student.photo} alt="Student" className="w-28 h-28 rounded-full object-cover border-4 border-blue-100"/>
                : <div className="w-28 h-28 rounded-full bg-blue-100 text-blue-600 font-bold text-3xl flex items-center justify-center">{initials}</div>
              }
              <div className="text-center">
                <div className="font-bold text-gray-800 text-sm">{student.full_name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{student.student_id}</div>
              </div>
              <Link to="/passcard" className="text-xs text-blue-600 font-semibold hover:underline">View Passcard →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}