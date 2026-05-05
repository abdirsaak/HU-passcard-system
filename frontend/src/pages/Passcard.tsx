import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  student: any
}

export default function Passcard({ student }: Props) {
  const [passcard, setPasscard] = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const initials = student.full_name
    ?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  useEffect(() => {
    fetchPasscard()
  }, [])

  async function fetchPasscard() {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/method/hu_passcard_system.api.payment.get_student_passcard?student_id=${student.student_id}`,
        { headers: { 'X-Frappe-CSRF-Token': (window as any).csrf_token || 'fetch' } }
      )
      const data = await res.json()
      if (data.message?.passcard) {
        setPasscard(data.message.passcard)
      } else {
        setError('No active passcard found. Please complete your fee payment.')
      }
    } catch {
      setError('Failed to load passcard. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const typeColor: Record<string, string> = {
    'Mid Term':  'bg-yellow-500',
    'Full Term': 'bg-blue-600',
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* TOPBAR */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">HU</div>
            <span className="text-blue-600 font-bold text-base">Student Portal</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            <Link to="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">Dashboard</Link>
            <Link to="/pay-fee"   className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">Pay Fee</Link>
            <Link to="/passcard"  className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg">Passcard</Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 font-bold text-sm flex items-center justify-center">{initials}</div>
          </div>
        </div>
        <div className="md:hidden border-t border-gray-100 flex">
          <Link to="/dashboard" className="flex-1 text-center py-2 text-xs font-medium text-gray-500">Dashboard</Link>
          <Link to="/pay-fee"   className="flex-1 text-center py-2 text-xs font-medium text-gray-500">Pay Fee</Link>
          <Link to="/passcard"  className="flex-1 text-center py-2 text-xs font-semibold text-blue-600 bg-blue-50">Passcard</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">🪪 Exam Passcard</h1>
        <p className="text-sm text-gray-500 mb-6">Your official exam entry passcard</p>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
            <svg className="animate-spin h-8 w-8 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p className="text-gray-400 text-sm mt-3">Loading your passcard…</p>
          </div>
        ) : error ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">No Passcard Available</h2>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <Link to="/pay-fee" className="inline-block bg-blue-600 text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
              Pay Fee to Get Passcard →
            </Link>
          </div>
        ) : (

          /* ── THE PASSCARD ── */
          <div className="bg-white border-2 border-blue-200 rounded-2xl shadow-lg overflow-hidden" id="passcard">

            {/* Header strip */}
            <div className={`${typeColor[passcard.payment_type] || 'bg-blue-600'} px-6 py-4 flex items-center justify-between`}>
              <div>
                <div className="text-white/70 text-xs font-semibold uppercase tracking-widest">Hargeisa University</div>
                <div className="text-white font-bold text-xl">Exam Passcard</div>
              </div>
              <div className="text-right">
                <div className={`inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full`}>
                  {passcard.payment_type}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="flex items-start gap-5 mb-6">
                {/* Photo */}
                <div className="flex-shrink-0">
                  {student.photo
                    ? <img src={student.photo} alt="Student" className="w-24 h-24 rounded-xl object-cover border-2 border-blue-100"/>
                    : <div className="w-24 h-24 rounded-xl bg-blue-100 text-blue-600 font-bold text-3xl flex items-center justify-center border-2 border-blue-200">{initials}</div>
                  }
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{student.full_name}</h2>
                  <p className="text-blue-600 font-bold text-sm mb-3">{student.student_id}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div><span className="text-gray-400">Faculty:</span> <span className="font-medium text-gray-700">{student.faculty || '—'}</span></div>
                    <div><span className="text-gray-400">Department:</span> <span className="font-medium text-gray-700">{student.department || '—'}</span></div>
                    <div><span className="text-gray-400">Batch:</span> <span className="font-medium text-gray-700">{student.batch || '—'}</span></div>
                    <div><span className="text-gray-400">Academic Year:</span> <span className="font-medium text-gray-700">{student.academic_year || '—'}</span></div>
                  </div>
                </div>
              </div>

              {/* Passcard details */}
              <div className="border-t border-dashed border-gray-200 pt-4 grid grid-cols-2 gap-4 text-xs mb-4">
                <div>
                  <div className="text-gray-400 mb-0.5">Passcard No.</div>
                  <div className="font-bold text-gray-800 text-sm">{passcard.name}</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-0.5">Valid For</div>
                  <div className="font-bold text-gray-800 text-sm">{passcard.payment_type} Exams</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-0.5">Issued On</div>
                  <div className="font-bold text-gray-800">{passcard.issue_date}</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-0.5">Valid Until</div>
                  <div className="font-bold text-gray-800">{passcard.valid_until}</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-0.5">Amount Paid</div>
                  <div className="font-bold text-green-600">${passcard.amount_paid}</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-0.5">Status</div>
                  <div className={`inline-block font-bold px-2 py-0.5 rounded-full text-xs ${passcard.is_valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {passcard.is_valid ? '✅ Valid' : '❌ Expired'}
                  </div>
                </div>
              </div>

              {/* Transaction */}
              <div className="bg-gray-50 rounded-xl px-4 py-2 text-xs text-gray-500 mb-4">
                Transaction ID: <span className="font-mono font-bold text-gray-700">{passcard.transaction_id}</span>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs text-gray-400">
                <span>This passcard is required for exam entry</span>
                <span>HU © {new Date().getFullYear()}</span>
              </div>
            </div>
          </div>
        )}

        {passcard && (
          <p className="text-center text-xs text-gray-400 mt-4">
            Show this passcard to the exam supervisor to enter the exam hall.
          </p>
        )}
      </div>
    </div>
  )
}