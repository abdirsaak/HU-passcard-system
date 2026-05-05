import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  student: any
}

interface TermInfo {
  termName: string
  startDate: Date
  endDate: Date
  midTermStart: Date
  midTermEnd: Date
  finalStart: Date
  finalEnd: Date
  currentPhase: 'before_term' | 'mid_term' | 'between' | 'final' | 'ended'
  midTermFee: number
  fullTermFee: number
  discountedMidFee: number
  discountedFullFee: number
}

function getTermInfo(student: any): TermInfo {
  const fee        = Number(student.fee || 0)
  const discount   = Number(student.discount || 0)
  const midTermFee = Math.round(fee * 0.5)    // 50% of fee = mid term
  const fullTermFee = fee

  const discountedMidFee  = Math.round(midTermFee  * (1 - discount / 100))
  const discountedFullFee = Math.round(fullTermFee * (1 - discount / 100))

  // Derive term start from academic_year e.g. "2025-2026" → Sep 2025
  const now = new Date()
  const yearStr = student.academic_year || `${now.getFullYear()}-${now.getFullYear() + 1}`
  const startYear = parseInt(yearStr.split('-')[0]) || now.getFullYear()

  // Semester 1: Sep → Feb  |  Semester 2: Mar → Aug
  // Determine based on current month
  let termStart: Date
  let termName: string

  if (now.getMonth() >= 8) {
    // Sep–Dec → Semester 1
    termStart = new Date(startYear, 8, 1)       // Sep 1
    termName  = `Semester 1 — ${startYear}/${startYear + 1}`
  } else if (now.getMonth() <= 1) {
    // Jan–Feb → still Semester 1
    termStart = new Date(startYear, 8, 1)
    termName  = `Semester 1 — ${startYear}/${startYear + 1}`
  } else {
    // Mar–Aug → Semester 2
    termStart = new Date(startYear + 1, 2, 1)   // Mar 1 of next year
    termName  = `Semester 2 — ${startYear}/${startYear + 1}`
  }

  // Term = 6 months
  const termEnd      = new Date(termStart)
  termEnd.setMonth(termEnd.getMonth() + 6)
  termEnd.setDate(termEnd.getDate() - 1)

  // Mid-term = 2.5 months in, lasts 2 weeks
  const midTermStart = new Date(termStart)
  midTermStart.setDate(midTermStart.getDate() + 75)  // ~2.5 months

  const midTermEnd = new Date(midTermStart)
  midTermEnd.setDate(midTermEnd.getDate() + 14)      // 2 weeks of exams

  // Final = after mid-term until term end
  const finalStart = new Date(midTermEnd)
  finalStart.setDate(finalStart.getDate() + 1)

  const finalEnd = new Date(termEnd)

  // Determine current phase
  let currentPhase: TermInfo['currentPhase']
  if (now < termStart)       currentPhase = 'before_term'
  else if (now <= midTermEnd) currentPhase = 'mid_term'
  else if (now < finalStart)  currentPhase = 'between'
  else if (now <= finalEnd)   currentPhase = 'final'
  else                        currentPhase = 'ended'

  return {
    termName, startDate: termStart, endDate: termEnd,
    midTermStart, midTermEnd, finalStart, finalEnd,
    currentPhase, midTermFee, fullTermFee,
    discountedMidFee, discountedFullFee,
  }
}

function fmt(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PayFee({ student }: Props) {
  const [phone, setPhone]           = useState(student.phone_number || '')
  const [paymentType, setPaymentType] = useState<'mid' | 'full'>('mid')
  const [loading, setLoading]       = useState(false)
  const [result, setResult]         = useState<any>(null)
  const [error, setError]           = useState('')
  const [payments, setPayments]     = useState<any[]>([])

  const term = getTermInfo(student)

  // ✅ Fix: define discount in component scope so JSX can access it
  const discount = Number(student.discount || 0)

  const initials = student.full_name
    ?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  useEffect(() => {
    fetchPayments()
  }, [])

  async function fetchPayments() {
    try {
      const res = await fetch(
        `/api/method/hu_passcard_system.api.payment.get_student_payments?student_id=${student.student_id}`,
        { headers: { 'X-Frappe-CSRF-Token': (window as any).csrf_token || 'fetch' } }
      )
      const data = await res.json()
      if (data.message?.payments) setPayments(data.message.payments)
    } catch { /* silent */ }
  }

  // Check if student already paid for current phase
  const alreadyPaidMid  = payments.some(p => p.payment_type === 'Mid Term'  && p.status === 'Paid')
  const alreadyPaidFull = payments.some(p => p.payment_type === 'Full Term' && p.status === 'Paid')

  const canPayMid  = term.currentPhase === 'mid_term'  && !alreadyPaidMid  && !alreadyPaidFull
  const canPayFull = (term.currentPhase === 'mid_term' || term.currentPhase === 'between' || term.currentPhase === 'final') && !alreadyPaidFull

  const amount = paymentType === 'mid' ? term.discountedMidFee : term.discountedFullFee

  async function handlePay() {
    if (!phone) { setError('Please enter your EVC Plus phone number.'); return }
    setError('')
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/method/hu_passcard_system.api.payment.initiate_payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Frappe-CSRF-Token': (window as any).csrf_token || 'fetch',
        },
        body: JSON.stringify({
          student_id:   student.student_id,
          phone:        phone,
          amount:       amount,
          payment_type: paymentType === 'mid' ? 'Mid Term' : 'Full Term',
        }),
      })

      const data = await res.json()
      console.log('Payment response:', data)

      if (!res.ok || data.exc) {
        let msg = 'Payment failed. Please try again.'
        if (data._server_messages) {
          try { msg = JSON.parse(JSON.parse(data._server_messages)[0]).message } catch {}
        }
        setError(msg)
        return
      }

      setResult(data.message)
      fetchPayments()

    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Phase badge
  const phaseBadge: Record<string, { label: string; color: string }> = {
    before_term: { label: 'Term not started',   color: 'bg-gray-100 text-gray-600' },
    mid_term:    { label: '📝 Mid-Term Period',  color: 'bg-yellow-100 text-yellow-700' },
    between:     { label: 'Between Exams',       color: 'bg-blue-100 text-blue-700' },
    final:       { label: '📝 Final Period',     color: 'bg-purple-100 text-purple-700' },
    ended:       { label: 'Term Ended',          color: 'bg-red-100 text-red-600' },
  }
  const badge = phaseBadge[term.currentPhase]

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
            <Link to="/pay-fee"   className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg">Pay Fee</Link>
            <Link to="/passcard"  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">Passcard</Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 font-bold text-sm flex items-center justify-center">{initials}</div>
          </div>
        </div>
        <div className="md:hidden border-t border-gray-100 flex">
          <Link to="/dashboard" className="flex-1 text-center py-2 text-xs font-medium text-gray-500">Dashboard</Link>
          <Link to="/pay-fee"   className="flex-1 text-center py-2 text-xs font-semibold text-blue-600 bg-blue-50">Pay Fee</Link>
          <Link to="/passcard"  className="flex-1 text-center py-2 text-xs font-medium text-gray-500">Passcard</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">💳 Pay Fee</h1>
        <p className="text-sm text-gray-500 mb-6">Pay your semester fee using EVC Plus (Waafi)</p>

        {/* Term Timeline */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-700">📅 {term.termName}</h2>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badge.color}`}>{badge.label}</span>
          </div>

          {/* Timeline bar */}
          <div className="relative h-3 bg-gray-100 rounded-full mb-4 overflow-hidden">
            <div className="absolute left-0 top-0 h-full bg-yellow-400 rounded-full" style={{ width: '41%' }} title="Mid Term"/>
            <div className="absolute top-0 h-full bg-purple-400 rounded-full" style={{ left: '43%', width: '57%' }} title="Final"/>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div><div className="text-gray-400">Term Start</div><div className="font-semibold text-gray-700">{fmt(term.startDate)}</div></div>
            <div><div className="text-yellow-600">Mid-Term Exams</div><div className="font-semibold text-gray-700">{fmt(term.midTermStart)} – {fmt(term.midTermEnd)}</div></div>
            <div><div className="text-purple-600">Final Exams</div><div className="font-semibold text-gray-700">{fmt(term.finalStart)} – {fmt(term.finalEnd)}</div></div>
            <div><div className="text-gray-400">Term End</div><div className="font-semibold text-gray-700">{fmt(term.endDate)}</div></div>
          </div>

          {/* Exam access info */}
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-xs text-yellow-800">
            ⚠️ <strong>Important:</strong> You must pay at least the <strong>Mid-Term fee</strong> before the mid-term exam period to receive your exam passcard. Full term payment gives access to both mid-term and final exams.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Payment Form */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-4">Make Payment</h2>

            {result?.status === 'success' ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                <div className="text-3xl mb-2">✅</div>
                <div className="font-bold text-green-700 text-base mb-1">Payment Successful!</div>
                <div className="text-xs text-green-600">Transaction ID: {result.transaction_id}</div>
                <div className="text-xs text-green-600 mt-1">Amount: ${result.amount}</div>
                <Link to="/passcard" className="mt-4 inline-block bg-blue-600 text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-blue-700 transition-colors">
                  View Passcard →
                </Link>
              </div>
            ) : (
              <>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>
                )}

                {alreadyPaidFull && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 mb-4">
                    ✅ You have already paid the full term fee. <Link to="/passcard" className="font-bold underline">View your passcard</Link>
                  </div>
                )}

                {/* Payment type selector */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Payment Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentType('mid')}
                      disabled={!canPayMid}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        paymentType === 'mid'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <div className="text-xs font-bold text-gray-700">Mid-Term</div>
                      <div className="text-lg font-bold text-blue-600">${term.discountedMidFee}</div>
                      <div className="text-xs text-gray-400">50% of semester fee</div>
                      {!canPayMid && term.currentPhase !== 'mid_term' && (
                        <div className="text-xs text-red-500 mt-1">Not available now</div>
                      )}
                    </button>
                    <button
                      onClick={() => setPaymentType('full')}
                      disabled={!canPayFull}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        paymentType === 'full'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <div className="text-xs font-bold text-gray-700">Full Term</div>
                      <div className="text-lg font-bold text-blue-600">${term.discountedFullFee}</div>
                      <div className="text-xs text-gray-400">Full semester fee</div>
                      {discount > 0 && <div className="text-xs text-green-600 mt-1">{discount}% discount applied</div>}
                    </button>
                  </div>
                </div>

                {/* Phone */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">EVC Plus Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. 0617611425"
                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                  <p className="text-xs text-gray-400 mt-1">You will receive a confirmation prompt on your phone</p>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
                  <div className="flex justify-between text-gray-500 mb-1">
                    <span>Payment Type</span>
                    <span className="font-medium text-gray-800">{paymentType === 'mid' ? 'Mid-Term' : 'Full Term'}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Amount</span>
                    <span className="font-bold text-blue-600 text-base">${amount}</span>
                  </div>
                </div>

                <button
                  onClick={handlePay}
                  disabled={loading || (!canPayMid && paymentType === 'mid') || (!canPayFull && paymentType === 'full')}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold rounded-xl py-3 text-sm transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Processing…
                    </span>
                  ) : `Pay $${amount} via EVC Plus`}
                </button>
              </>
            )}
          </div>

          {/* Payment History */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-4">🧾 Payment History</h2>
            {payments.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No payments yet</div>
            ) : (
              <div className="space-y-3">
                {payments.map((p, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-800">{p.payment_type}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">{p.payment_date} · ${p.amount}</div>
                    {p.transaction_id && <div className="text-xs text-gray-400 mt-0.5">TXN: {p.transaction_id}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}