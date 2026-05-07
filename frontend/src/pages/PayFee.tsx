


// import { useState, useEffect } from 'react'
// import { Link } from 'react-router-dom'

// export default function PayFee({ student }: { student: any }) {
//   const [phone, setPhone]             = useState(student.phone_number || '')
//   const [paymentType, setPaymentType] = useState<'Mid term' | 'Final' | 'Month'>('Mid term')
//   const [targetMonth, setTargetMonth] = useState<string>('')
//   const [loading, setLoading]         = useState(false)
//   const [result, setResult]           = useState<any>(null)
//   const [error, setError]             = useState('')
//   const [payments, setPayments]       = useState<any[]>([])
//   const [term, setTerm]               = useState<any>(null)

//   const initials = student.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

//   useEffect(() => { 
//     fetchTerm(); 
//     fetchPayments(); 
//   }, [])

//   async function fetchTerm() {
//     try {
//       const res = await fetch(`/api/method/hu_passcard_system.api.payment.get_term_info?student_id=${student.student_id}`, { headers: { 'X-Frappe-CSRF-Token': (window as any).csrf_token || 'fetch' } })
//       const data = await res.json()
//       if (data.message?.term) setTerm(data.message.term)
//     } catch {}
//   }

//   async function fetchPayments() {
//     try {
//       const res = await fetch(`/api/method/hu_passcard_system.api.payment.get_student_payments?student_id=${student.student_id}`, { headers: { 'X-Frappe-CSRF-Token': (window as any).csrf_token || 'fetch' } })
//       const data = await res.json()
//       if (data.message?.payments) setPayments(data.message.payments)
//     } catch {}
//   }

//   const semesterFee  = Number(student.fee || 0)
//   const discount     = Number(student.discount_percentage || 0)
  
//   // EXACT MATH: Remove aggressive Math.round() to handle tiny test amounts like 0.025 perfectly
//   const finalFee     = Number((semesterFee * (1 - discount / 100)).toFixed(4))
//   const midTermFee   = Number((finalFee / 2).toFixed(4))
  
//   const totalMonthsCount = term?.months?.length || 6;
  
//   // Floor the base monthly fee to 3 decimals so we NEVER overshoot the total.
//   // This guarantees the remainder for the last month is always positive and mathematically exact.
//   const monthlyFee   = Math.floor((finalFee / totalMonthsCount) * 1000) / 1000

//   // CALCULATION LOGIC: Calculate exact amount depending on month selected
//   let amount = 0;
//   if (paymentType === 'Mid term') {
//     amount = midTermFee;
//   } else if (paymentType === 'Final') {
//     amount = finalFee;
//   } else {
//     const selectedIndex = term?.months?.findIndex((m: any) => m.value === targetMonth);
//     const isLastMonth = selectedIndex === totalMonthsCount - 1;
    
//     amount = isLastMonth 
//       ? Number((finalFee - (monthlyFee * (totalMonthsCount - 1))).toFixed(4))
//       : monthlyFee;
//   }

//   const paidMonthsList = payments.filter(p => p.payment_type === 'Month' && p.status === 'Paid').map(p => p.notes)
//   const halfMonthsCount = Math.ceil(totalMonthsCount / 2);

//   const explicitMidPaid   = payments.some(p => p.payment_type === 'Mid term' && p.status === 'Paid')
//   const explicitFinalPaid = payments.some(p => p.payment_type === 'Final' && p.status === 'Paid')

//   const alreadyPaidMid   = explicitMidPaid || explicitFinalPaid || (paidMonthsList.length >= halfMonthsCount);
//   const alreadyPaidFinal = explicitFinalPaid || (paidMonthsList.length >= totalMonthsCount);

//   useEffect(() => {
//     if (paymentType === 'Month' && term?.months) {
//         const nextUnpaid = term.months.find((m: any) => !paidMonthsList.includes(m.value))?.value;
//         if (nextUnpaid && !targetMonth) setTargetMonth(nextUnpaid);
//     }
//   }, [paymentType, term, paidMonthsList, targetMonth])

//   async function handlePay() {
//     if (!phone) { setError('Please enter your EVC Plus phone number.'); return }
//     if (paymentType === 'Month' && !targetMonth) { setError('Please select a month.'); return }
//     setError(''); setLoading(true); setResult(null)

//     try {
//       const res = await fetch('/api/method/hu_passcard_system.api.payment.initiate_payment', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', 'X-Frappe-CSRF-Token': (window as any).csrf_token || 'fetch' },
//         body: JSON.stringify({
//           student_id: student.student_id,
//           phone, amount, payment_type: paymentType,
//           target_month: paymentType === 'Month' ? targetMonth : null
//         }),
//       })
//       const data = await res.json()
//       if (!res.ok || data.exc) {
//         let msg = 'Payment failed. Please try again.'
//         if (data._server_messages) {
//           try { msg = JSON.parse(JSON.parse(data._server_messages)[0]).message } catch {}
//         }
//         setError(msg); return
//       }
//       setResult(data.message); fetchPayments()
//     } catch { setError('Network error. Please try again.') } 
//     finally { setLoading(false) }
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
//         <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
//           <div className="flex items-center gap-2.5">
//             <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">HU</div>
//             <span className="text-blue-600 font-bold text-base">Student Portal</span>
//           </div>
//           <div className="hidden md:flex items-center gap-1">
//             <Link to="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Dashboard</Link>
//             <Link to="/pay-fee" className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg">Pay Fee</Link>
//             <Link to="/passcard" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Passcard</Link>
//           </div>
//           <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 font-bold text-sm flex items-center justify-center">{initials}</div>
//         </div>
//       </nav>

//       <div className="max-w-4xl mx-auto px-4 py-8">
//         <h1 className="text-2xl font-bold text-gray-900 mb-1">💳 Pay Fee</h1>
        
//         <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mt-6">
//           <h2 className="text-sm font-bold text-gray-700 mb-4">Make Payment</h2>

//           {result?.status === 'success' ? (
//             <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
//               <div className="text-3xl mb-2">✅</div>
//               <div className="font-bold text-green-700 text-base mb-1">Payment Successful!</div>
//               <div className="text-xs text-green-600 mb-4">Transaction: {result.transaction_id}</div>
              
//               {result.passcard ? (
//                 <Link to="/passcard" className="bg-blue-600 text-white text-sm font-bold px-5 py-2 rounded-xl inline-block mt-2">View Passcard →</Link>
//               ) : (
//                 <div className="text-sm font-medium text-blue-800 bg-blue-100 rounded-lg p-3 mt-2">
//                   ℹ️ Your exam passcard will be issued once you have paid for at least half of the semester.
//                 </div>
//               )}
//             </div>
//           ) : (
//             <>
//               {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>}

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
//                 <button onClick={() => setPaymentType('Mid term')} disabled={alreadyPaidMid} className={`p-4 rounded-xl border-2 text-left transition-all ${paymentType === 'Mid term' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} disabled:opacity-50`}>
//                   <div className="text-xs font-bold text-gray-700">Mid-Term</div>
//                   <div className="text-lg font-bold text-blue-600">${midTermFee}</div>
//                   <div className="text-xs text-gray-400 mt-1">50% of semester fee</div>
//                   {alreadyPaidMid && <div className="text-xs text-green-600 mt-1">✅ Paid</div>}
//                 </button>
//                 <button onClick={() => setPaymentType('Final')} disabled={alreadyPaidFinal} className={`p-4 rounded-xl border-2 text-left transition-all ${paymentType === 'Final' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} disabled:opacity-50`}>
//                   <div className="text-xs font-bold text-gray-700">Final</div>
//                   <div className="text-lg font-bold text-blue-600">${finalFee}</div>
//                   <div className="text-xs text-gray-400 mt-1">100% full term</div>
//                   {alreadyPaidFinal && <div className="text-xs text-green-600 mt-1">✅ Paid</div>}
//                 </button>
//                 <button onClick={() => setPaymentType('Month')} disabled={alreadyPaidFinal} className={`p-4 rounded-xl border-2 text-left transition-all ${paymentType === 'Month' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} disabled:opacity-50`}>
//                   <div className="text-xs font-bold text-gray-700">Monthly Installment</div>
//                   <div className="text-lg font-bold text-blue-600">${monthlyFee}/mo</div>
//                   <div className="text-xs text-gray-400 mt-1">Pay sequence sequentially</div>
//                 </button>
//               </div>

//               {paymentType === 'Month' && term?.months && (
//                 <div className="mb-6 bg-gray-50 rounded-xl border border-gray-200 p-4">
//                   <h3 className="text-xs font-bold text-gray-700 mb-3">Installment Sequence</h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                     {term.months.map((m: any, index: number) => {
//                       const isPaid = paidMonthsList.includes(m.value)
                      
//                       // UI RENDER LOGIC: display exact fractions mapped to labels
//                       const isLastMonth = index === term.months.length - 1;
//                       const displayFee = isLastMonth 
//                         ? Number((finalFee - (monthlyFee * (term.months.length - 1))).toFixed(4))
//                         : monthlyFee;

//                       return (
//                         <label key={m.value} className={`flex items-center justify-between p-4 border rounded-xl transition-all ${isPaid ? 'bg-green-50 border-green-200 opacity-60' : 'bg-white hover:bg-gray-50 cursor-pointer'}`}>
//                           <div className="flex items-center gap-3">
//                             <input type="radio" name="month" disabled={isPaid} checked={targetMonth === m.value} onChange={() => setTargetMonth(m.value)} className="w-4 h-4 text-blue-600" />
//                             <span className="font-bold text-gray-800">
//                               {m.label} (${displayFee})
//                             </span>
//                           </div>
//                           {isPaid && <span className="text-green-600 text-xs font-bold">✅ PAID</span>}
//                         </label>
//                       )
//                     })}
//                   </div>
//                 </div>
//               )}

//               <div className="mb-4">
//                 <label className="block text-xs font-semibold text-gray-600 mb-1.5">EVC Plus Phone Number</label>
//                 <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 0617611425" className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors"/>
//               </div>

//               <button onClick={handlePay} disabled={loading || !term || alreadyPaidFinal || (paymentType === 'Mid term' && alreadyPaidMid)} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold rounded-xl py-3 text-sm transition-colors">
//                 {loading ? 'Processing...' : `Pay $${amount} via EVC Plus`}
//               </button>
//             </>
//           )}
//         </div>
        
//         <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mt-6">
//            <h2 className="text-sm font-bold text-gray-700 mb-4">🧾 Payment History</h2>
//            {payments.length === 0 ? (
//              <div className="text-center py-6 text-gray-400 text-sm">No successful payments yet.</div>
//            ) : (
//              <div className="space-y-3">
//                {payments.map((p, i) => (
//                  <div key={i} className="border border-gray-100 rounded-xl p-3">
//                    <div className="flex items-center justify-between mb-1">
//                      <span className="text-sm font-semibold text-gray-800">{p.payment_type} {p.notes ? `(${p.notes})` : ''}</span>
//                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">{p.status}</span>
//                    </div>
//                    <div className="text-xs text-gray-400">${p.amount} · TXN: {p.transaction_id}</div>
//                  </div>
//                ))}
//              </div>
//            )}
//         </div>
//       </div>
//     </div>
//   )
// }



// import { useState, useEffect } from 'react'
// import { Link } from 'react-router-dom'

// interface Props { student: any }

// interface TermInfo {
//   name: string
//   term_name: string
//   academic_year: string
//   start_date: string
//   end_date: string
//   mid_term_exam_start: string
//   mid_term_exam_end: string
//   final_start: string
//   final_end: string
//   current_phase: 'before_term' | 'mid_term' | 'between' | 'final' | 'ended'
//   months: { label: string, value: string }[] 
// }

// export default function PayFee({ student }: Props) {
//   const [phone, setPhone]             = useState(student.phone_number || '')
//   const [paymentType, setPaymentType] = useState<'Mid term' | 'Final' | 'Month'>('Mid term')
//   const [targetMonth, setTargetMonth] = useState<string>('')
//   const [loading, setLoading]         = useState(false)
//   const [result, setResult]           = useState<any>(null)
//   const [error, setError]             = useState('')
//   const [payments, setPayments]       = useState<any[]>([])
//   const [term, setTerm]               = useState<TermInfo | null>(null)
//   const [termLoading, setTermLoading] = useState(true)

//   const semesterFee  = Number(student.fee || 0)
//   const discount     = Number(student.discount || 0)
//   const finalFee     = Math.round(semesterFee * (1 - discount / 100) * 100) / 100
//   const midTermFee   = Math.round(finalFee / 2 * 100) / 100
//   const totalMonths  = term?.months?.length || 1
//   const monthlyFee   = Math.round(finalFee / totalMonths * 100) / 100

//   let amount = paymentType === 'Mid term' ? midTermFee : paymentType === 'Final' ? finalFee : monthlyFee
//   const initials = student.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

//   useEffect(() => { fetchTerm(); fetchPayments() }, [])

//   async function fetchTerm() {
//     setTermLoading(true)
//     try {
//       const res = await fetch(`/api/method/hu_passcard_system.api.payment.get_term_info?student_id=${student.student_id}`, { headers: { 'X-Frappe-CSRF-Token': (window as any).csrf_token || 'fetch' } })
//       const data = await res.json()
//       if (data.message?.term) setTerm(data.message.term)
//     } catch {} finally { setTermLoading(false) }
//   }

//   async function fetchPayments() {
//     try {
//       const res = await fetch(`/api/method/hu_passcard_system.api.payment.get_student_payments?student_id=${student.student_id}`, { headers: { 'X-Frappe-CSRF-Token': (window as any).csrf_token || 'fetch' } })
//       const data = await res.json()
//       if (data.message?.payments) setPayments(data.message.payments)
//     } catch {}
//   }

//   const alreadyPaidMid   = payments.some(p => p.payment_type === 'Mid term' && p.status === 'Paid')
//   const alreadyPaidFinal = payments.some(p => p.payment_type === 'Final' && p.status === 'Paid')
  
//   // 1. Get manually paid months
//   let paidMonths = payments
//     .filter(p => p.payment_type === 'Month' && p.status === 'Paid')
//     .map(p => p.notes)

//   // 2. Auto-tick logic for bulk payments (Mid Term & Final)
//   if (term?.months) {
//     const halfMonths = Math.ceil(term.months.length / 2)
//     term.months.forEach((m, index) => {
//       if (alreadyPaidFinal && !paidMonths.includes(m.value)) {
//         paidMonths.push(m.value) // Final covers all months
//       } else if (alreadyPaidMid && index < halfMonths && !paidMonths.includes(m.value)) {
//         paidMonths.push(m.value) // Mid-term covers first half of months
//       }
//     })
//   }

//   const nextUnpaidMonth = term?.months?.find(m => !paidMonths.includes(m.value))?.value

//   useEffect(() => {
//     if (paymentType === 'Month' && nextUnpaidMonth && !targetMonth) {
//       setTargetMonth(nextUnpaidMonth)
//     }
//   }, [paymentType, nextUnpaidMonth])

//   async function handlePay() {
//     if (!phone) { setError('Please enter your EVC Plus phone number.'); return }
//     if (paymentType === 'Month' && !targetMonth) { setError('Please select a month.'); return }
//     setError(''); setLoading(true); setResult(null)

//     try {
//       const res = await fetch('/api/method/hu_passcard_system.api.payment.initiate_payment', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', 'X-Frappe-CSRF-Token': (window as any).csrf_token || 'fetch' },
//         body: JSON.stringify({
//           student_id: student.student_id,
//           phone, amount, payment_type: paymentType,
//           target_month: paymentType === 'Month' ? targetMonth : null
//         }),
//       })
//       const data = await res.json()
//       if (!res.ok || data.exc) {
//         let msg = 'Payment failed. Please try again.'
//         if (data._server_messages) {
//           try { msg = JSON.parse(JSON.parse(data._server_messages)[0]).message } catch {}
//         }
//         setError(msg); return
//       }
//       setResult(data.message); fetchPayments()
//     } catch { setError('Network error. Please try again.') } 
//     finally { setLoading(false) }
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
//         <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
//           <div className="flex items-center gap-2.5">
//             <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">HU</div>
//             <span className="text-blue-600 font-bold text-base">Student Portal</span>
//           </div>
//           <div className="hidden md:flex items-center gap-1">
//             <Link to="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Dashboard</Link>
//             <Link to="/pay-fee" className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg">Pay Fee</Link>
//             <Link to="/passcard" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Passcard</Link>
//           </div>
//           <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 font-bold text-sm flex items-center justify-center">{initials}</div>
//         </div>
//       </nav>

//       <div className="max-w-4xl mx-auto px-4 py-8">
//         <h1 className="text-2xl font-bold text-gray-900 mb-1">💳 Pay Fee</h1>
        
//         <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mt-6">
//           <h2 className="text-sm font-bold text-gray-700 mb-4">Make Payment</h2>

//           {result?.status === 'success' ? (
//             <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
//               <div className="text-3xl mb-2">✅</div>
//               <div className="font-bold text-green-700 text-base mb-1">Payment Successful!</div>
//               <div className="text-xs text-green-600 mb-4">Transaction: {result.transaction_id}</div>
              
//               {result.passcard ? (
//                 <Link to="/passcard" className="bg-blue-600 text-white text-sm font-bold px-5 py-2 rounded-xl inline-block mt-2">View Passcard →</Link>
//               ) : (
//                 <div className="text-sm font-medium text-blue-800 bg-blue-100 rounded-lg p-3 mt-2">
//                   ℹ️ Your exam passcard will be issued once you have paid for at least half of the semester.
//                 </div>
//               )}
//             </div>
//           ) : (
//             <>
//               {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>}

//               {/* Options Grid */}
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
//                 <button onClick={() => setPaymentType('Mid term')} disabled={alreadyPaidMid || alreadyPaidFinal} className={`p-4 rounded-xl border-2 text-left transition-all ${paymentType === 'Mid term' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} disabled:opacity-50`}>
//                   <div className="text-xs font-bold text-gray-700">Mid-Term</div>
//                   <div className="text-lg font-bold text-blue-600">${midTermFee}</div>
//                   <div className="text-xs text-gray-400 mt-1">50% of semester fee</div>
//                   {alreadyPaidMid && <div className="text-xs text-green-600 mt-1">✅ Paid</div>}
//                 </button>
//                 <button onClick={() => setPaymentType('Final')} disabled={alreadyPaidFinal} className={`p-4 rounded-xl border-2 text-left transition-all ${paymentType === 'Final' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} disabled:opacity-50`}>
//                   <div className="text-xs font-bold text-gray-700">Final</div>
//                   <div className="text-lg font-bold text-blue-600">${finalFee}</div>
//                   <div className="text-xs text-gray-400 mt-1">100% full term</div>
//                   {alreadyPaidFinal && <div className="text-xs text-green-600 mt-1">✅ Paid</div>}
//                 </button>
//                 <button onClick={() => setPaymentType('Month')} disabled={alreadyPaidFinal} className={`p-4 rounded-xl border-2 text-left transition-all ${paymentType === 'Month' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} disabled:opacity-50`}>
//                   <div className="text-xs font-bold text-gray-700">Monthly Installment</div>
//                   <div className="text-lg font-bold text-blue-600">${monthlyFee}/mo</div>
//                   <div className="text-xs text-gray-400 mt-1">Pay sequence sequentially</div>
//                 </button>
//               </div>

//               {/* Month Selection List */}
//               {paymentType === 'Month' && term?.months && (
//                 <div className="mb-6 bg-gray-50 rounded-xl border border-gray-200 p-4">
//                   <h3 className="text-xs font-bold text-gray-700 mb-3">Installment Sequence</h3>
//                   <div className="space-y-2">
//                     {term.months.map(m => {
//                       const isPaid = paidMonths.includes(m.value)
//                       const isSelected = targetMonth === m.value

//                       return (
//                         <label key={m.value} className={`flex items-center justify-between p-3 rounded-lg border ${isPaid ? 'border-green-200 bg-green-50 opacity-60 cursor-not-allowed' : isSelected ? 'border-blue-500 bg-blue-50 cursor-pointer' : 'border-gray-200 bg-white cursor-pointer hover:bg-gray-50'}`}>
//                           <div className="flex items-center gap-3">
//                             <input type="radio" name="month" value={m.value} checked={isSelected} onChange={() => setTargetMonth(m.value)} disabled={isPaid} className="w-4 h-4 text-blue-600"/>
//                             <span className="text-sm font-semibold text-gray-800">{m.label}</span>
//                           </div>
//                           <div className="text-xs font-bold">
//                             {isPaid ? <span className="text-green-600">✅ Paid</span> : <span className="text-blue-600">Pay ${monthlyFee}</span>}
//                           </div>
//                         </label>
//                       )
//                     })}
//                   </div>
//                 </div>
//               )}

//               {/* Payment Details */}
//               <div className="mb-4">
//                 <label className="block text-xs font-semibold text-gray-600 mb-1.5">EVC Plus Phone Number</label>
//                 <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 0617611425" className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors"/>
//               </div>

//               <button onClick={handlePay} disabled={loading || !term || alreadyPaidFinal || (paymentType === 'Mid term' && alreadyPaidMid)} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold rounded-xl py-3 text-sm transition-colors">
//                 {loading ? 'Processing...' : `Pay $${amount} via EVC Plus`}
//               </button>
//             </>
//           )}
//         </div>
        
//         {/* Payment History View */}
//         <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mt-6">
//            <h2 className="text-sm font-bold text-gray-700 mb-4">🧾 Payment History</h2>
//            {payments.length === 0 ? (
//              <div className="text-center py-6 text-gray-400 text-sm">No successful payments yet.</div>
//            ) : (
//              <div className="space-y-3">
//                {payments.map((p, i) => (
//                  <div key={i} className="border border-gray-100 rounded-xl p-3">
//                    <div className="flex items-center justify-between mb-1">
//                      <span className="text-sm font-semibold text-gray-800">{p.payment_type} {p.notes ? `(${p.notes})` : ''}</span>
//                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">{p.status}</span>
//                    </div>
//                    <div className="text-xs text-gray-400">${p.amount} · TXN: {p.transaction_id}</div>
//                  </div>
//                ))}
//              </div>
//            )}
//         </div>
//       </div>
//     </div>
//   )
// }



import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function PayFee({ student }: { student: any }) {
  const [phone, setPhone]             = useState(student.phone_number || '')
  const [paymentType, setPaymentType] = useState<'Mid term' | 'Final' | 'Month'>('Mid term')
  const [targetMonth, setTargetMonth] = useState<string>('')
  const [loading, setLoading]         = useState(false)
  const [result, setResult]           = useState<any>(null)
  const [error, setError]             = useState('')
  const [payments, setPayments]       = useState<any[]>([])
  const [term, setTerm]               = useState<any>(null)

  const initials = student.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  useEffect(() => { 
    fetchTerm(); 
    fetchPayments(); 
  }, [])

  async function fetchTerm() {
    try {
      const res = await fetch(`/api/method/hu_passcard_system.api.payment.get_term_info?student_id=${student.student_id}`, { headers: { 'X-Frappe-CSRF-Token': (window as any).csrf_token || 'fetch' } })
      const data = await res.json()
      if (data.message?.term) setTerm(data.message.term)
    } catch {}
  }

  async function fetchPayments() {
    try {
      const res = await fetch(`/api/method/hu_passcard_system.api.payment.get_student_payments?student_id=${student.student_id}`, { headers: { 'X-Frappe-CSRF-Token': (window as any).csrf_token || 'fetch' } })
      const data = await res.json()
      if (data.message?.payments) setPayments(data.message.payments)
    } catch {}
  }

  const semesterFee  = Number(student.fee || 0)
  const discount     = Number(student.discount_percentage || 0)
  
  // EXACT MATH: Remove aggressive Math.round() to handle tiny test amounts like 0.025 perfectly
  const finalFee     = Number((semesterFee * (1 - discount / 100)).toFixed(4))
  const midTermFee   = Number((finalFee / 2).toFixed(4))
  
  const totalMonthsCount = term?.months?.length || 6;
  
  // Floor the base monthly fee to 3 decimals so we NEVER overshoot the total.
  // This guarantees the remainder for the last month is always positive and mathematically exact.
  const monthlyFee   = Math.floor((finalFee / totalMonthsCount) * 1000) / 1000

  // CALCULATION LOGIC: Calculate exact amount depending on month selected
  let amount = 0;
  if (paymentType === 'Mid term') {
    amount = midTermFee;
  } else if (paymentType === 'Final') {
    amount = finalFee;
  } else {
    const selectedIndex = term?.months?.findIndex((m: any) => m.value === targetMonth);
    const isLastMonth = selectedIndex === totalMonthsCount - 1;
    
    amount = isLastMonth 
      ? Number((finalFee - (monthlyFee * (totalMonthsCount - 1))).toFixed(4))
      : monthlyFee;
  }

  const paidMonthsList = payments.filter(p => p.payment_type === 'Month' && p.status === 'Paid').map(p => p.notes)
  const halfMonthsCount = Math.ceil(totalMonthsCount / 2);

  const explicitMidPaid   = payments.some(p => p.payment_type === 'Mid term' && p.status === 'Paid')
  const explicitFinalPaid = payments.some(p => p.payment_type === 'Final' && p.status === 'Paid')

  const alreadyPaidMid   = explicitMidPaid || explicitFinalPaid || (paidMonthsList.length >= halfMonthsCount);
  const alreadyPaidFinal = explicitFinalPaid || (paidMonthsList.length >= totalMonthsCount);

  useEffect(() => {
    if (paymentType === 'Month' && term?.months) {
        const nextUnpaid = term.months.find((m: any) => !paidMonthsList.includes(m.value))?.value;
        if (nextUnpaid && !targetMonth) setTargetMonth(nextUnpaid);
    }
  }, [paymentType, term, paidMonthsList, targetMonth])

  async function handlePay() {
    if (!phone) { setError('Please enter your EVC Plus phone number.'); return }
    if (paymentType === 'Month' && !targetMonth) { setError('Please select a month.'); return }
    setError(''); setLoading(true); setResult(null)

    try {
      const res = await fetch('/api/method/hu_passcard_system.api.payment.initiate_payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Frappe-CSRF-Token': (window as any).csrf_token || 'fetch' },
        body: JSON.stringify({
          student_id: student.student_id,
          phone, amount, payment_type: paymentType,
          target_month: paymentType === 'Month' ? targetMonth : null
        }),
      })
      const data = await res.json()
      if (!res.ok || data.exc) {
        let msg = 'Payment failed. Please try again.'
        if (data._server_messages) {
          try { msg = JSON.parse(JSON.parse(data._server_messages)[0]).message } catch {}
        }
        setError(msg); return
      }
      setResult(data.message); fetchPayments()
    } catch { setError('Network error. Please try again.') } 
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">HU</div>
            <span className="text-blue-600 font-bold text-base">Student Portal</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            <Link to="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Dashboard</Link>
            <Link to="/pay-fee" className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg">Pay Fee</Link>
            <Link to="/passcard" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">Passcard</Link>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 font-bold text-sm flex items-center justify-center">{initials}</div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t border-gray-100 flex">
          <Link to="/dashboard" className="flex-1 text-center py-2 text-xs font-medium text-gray-500">Dashboard</Link>
          <Link to="/pay-fee"   className="flex-1 text-center py-2 text-xs font-semibold text-blue-600 bg-blue-50">Pay Fee</Link>
          <Link to="/passcard"  className="flex-1 text-center py-2 text-xs font-medium text-gray-500">Passcard</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">💳 Pay Fee</h1>
        
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mt-6">
          <h2 className="text-sm font-bold text-gray-700 mb-4">Make Payment</h2>

          {result?.status === 'success' ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
              <div className="text-3xl mb-2">✅</div>
              <div className="font-bold text-green-700 text-base mb-1">Payment Successful!</div>
              <div className="text-xs text-green-600 mb-4">Transaction: {result.transaction_id}</div>
              
              {result.passcard ? (
                <Link to="/passcard" className="bg-blue-600 text-white text-sm font-bold px-5 py-2 rounded-xl inline-block mt-2">View Passcard →</Link>
              ) : (
                <div className="text-sm font-medium text-blue-800 bg-blue-100 rounded-lg p-3 mt-2">
                  ℹ️ Your exam passcard will be issued once you have paid for at least half of the semester.
                </div>
              )}
            </div>
          ) : (
            <>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                <button onClick={() => setPaymentType('Mid term')} disabled={alreadyPaidMid} className={`p-4 rounded-xl border-2 text-left transition-all ${paymentType === 'Mid term' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} disabled:opacity-50`}>
                  <div className="text-xs font-bold text-gray-700">Mid-Term</div>
                  <div className="text-lg font-bold text-blue-600">${midTermFee}</div>
                  <div className="text-xs text-gray-400 mt-1">50% of semester fee</div>
                  {alreadyPaidMid && <div className="text-xs text-green-600 mt-1">✅ Paid</div>}
                </button>
                <button onClick={() => setPaymentType('Final')} disabled={alreadyPaidFinal} className={`p-4 rounded-xl border-2 text-left transition-all ${paymentType === 'Final' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} disabled:opacity-50`}>
                  <div className="text-xs font-bold text-gray-700">Final</div>
                  <div className="text-lg font-bold text-blue-600">${finalFee}</div>
                  <div className="text-xs text-gray-400 mt-1">100% full term</div>
                  {alreadyPaidFinal && <div className="text-xs text-green-600 mt-1">✅ Paid</div>}
                </button>
                <button onClick={() => setPaymentType('Month')} disabled={alreadyPaidFinal} className={`p-4 rounded-xl border-2 text-left transition-all ${paymentType === 'Month' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} disabled:opacity-50`}>
                  <div className="text-xs font-bold text-gray-700">Monthly Installment</div>
                  <div className="text-lg font-bold text-blue-600">${monthlyFee}/mo</div>
                  <div className="text-xs text-gray-400 mt-1">Pay sequence sequentially</div>
                </button>
              </div>

              {paymentType === 'Month' && term?.months && (
                <div className="mb-6 bg-gray-50 rounded-xl border border-gray-200 p-4">
                  <h3 className="text-xs font-bold text-gray-700 mb-3">Installment Sequence</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {term.months.map((m: any, index: number) => {
                      const isPaid = paidMonthsList.includes(m.value)
                      
                      // UI RENDER LOGIC: display exact fractions mapped to labels
                      const isLastMonth = index === term.months.length - 1;
                      const displayFee = isLastMonth 
                        ? Number((finalFee - (monthlyFee * (term.months.length - 1))).toFixed(4))
                        : monthlyFee;

                      return (
                        <label key={m.value} className={`flex items-center justify-between p-4 border rounded-xl transition-all ${isPaid ? 'bg-green-50 border-green-200 opacity-60' : 'bg-white hover:bg-gray-50 cursor-pointer'}`}>
                          <div className="flex items-center gap-3">
                            <input type="radio" name="month" disabled={isPaid} checked={targetMonth === m.value} onChange={() => setTargetMonth(m.value)} className="w-4 h-4 text-blue-600" />
                            <span className="font-bold text-gray-800">
                              {m.label} (${displayFee})
                            </span>
                          </div>
                          {isPaid && <span className="text-green-600 text-xs font-bold">✅ PAID</span>}
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">EVC Plus Phone Number</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 0617611425" className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors"/>
              </div>

              <button onClick={handlePay} disabled={loading || !term || alreadyPaidFinal || (paymentType === 'Mid term' && alreadyPaidMid)} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold rounded-xl py-3 text-sm transition-colors">
                {loading ? 'Processing...' : `Pay $${amount} via EVC Plus`}
              </button>
            </>
          )}
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mt-6">
           <h2 className="text-sm font-bold text-gray-700 mb-4">🧾 Payment History</h2>
           {payments.length === 0 ? (
             <div className="text-center py-6 text-gray-400 text-sm">No successful payments yet.</div>
           ) : (
             <div className="space-y-3">
               {payments.map((p, i) => (
                 <div key={i} className="border border-gray-100 rounded-xl p-3">
                   <div className="flex items-center justify-between mb-1">
                     <span className="text-sm font-semibold text-gray-800">{p.payment_type} {p.notes ? `(${p.notes})` : ''}</span>
                     <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">{p.status}</span>
                   </div>
                   <div className="text-xs text-gray-400">${p.amount} · TXN: {p.transaction_id}</div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  )
}