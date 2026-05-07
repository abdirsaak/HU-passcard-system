

// import { useState, useEffect } from 'react'
// import { Link } from 'react-router-dom'

// interface Props { student: any }

// export default function Passcard({ student }: Props) {
//   const [passcard, setPasscard] = useState<any>(null)
//   const [passcardHistory, setPasscardHistory] = useState<any[]>([]) 
//   const [term, setTerm]         = useState<any>(null)
//   const [loading, setLoading]   = useState(true)
//   const [error, setError]       = useState('')
//   const [downloading, setDownloading] = useState(false)

//   const initials = student.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

//   useEffect(() => { 
//     fetchData() 
//   }, [])

//   async function fetchData() {
//     setLoading(true)
//     try {
//       const headers = { 'X-Frappe-CSRF-Token': (window as any).csrf_token || 'fetch' }

//       const [resTerm, resPass, resHistory] = await Promise.all([
//         fetch(`/api/method/hu_passcard_system.api.payment.get_term_info?student_id=${student.student_id}`, { headers }),
//         fetch(`/api/method/hu_passcard_system.api.payment.get_student_passcard?student_id=${student.student_id}`, { headers }),
//         fetch(`/api/method/hu_passcard_system.api.payment.get_all_student_passcards?student_id=${student.student_id}`, { headers })
//       ]);

//       const dataTerm = await resTerm.json()
//       const dataPass = await resPass.json()
//       const dataHistory = await resHistory.json()

//       if (dataTerm.message?.term) setTerm(dataTerm.message.term)
      
//       if (dataPass.message?.passcard) {
//         setPasscard(dataPass.message.passcard)
//       } else {
//         setError('No active passcard found for the current semester. Please complete your fee payment.')
//       }

//       if (dataHistory.message?.passcards) {
//         setPasscardHistory(dataHistory.message.passcards)
//       }

//     } catch {
//       setError('Failed to load passcard data. Please try again.')
//     } finally {
//       setLoading(false)
//     }
//   }

//   function handleDownload() {
//     const element = document.getElementById('passcard-element')
//     if (!element) return

//     setDownloading(true)
//     const script = document.createElement('script')
//     script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
//     script.onload = () => {
//       ;(window as any).html2canvas(element, { scale: 2 }).then((canvas: HTMLCanvasElement) => {
//         const link = document.createElement('a')
//         link.download = `HU_Passcard_${student.student_id}.png`
//         link.href = canvas.toDataURL('image/png')
//         link.click()
//         setDownloading(false)
//       })
//     }
//     document.body.appendChild(script)
//   }

//   function getShortMonth(dateStr: string) {
//     if (!dateStr) return ''
//     return new Date(dateStr).toLocaleString('en-US', { month: 'short' })
//   }

//   const midTermLabel = term ? `${getShortMonth(term.start_date)}-${getShortMonth(term.end_date)}` : '...'
//   const finalExamLabel = term ? `${getShortMonth(term.start_date)}-${getShortMonth(term.end_date)}` : '...'

//   let examYear = new Date().getFullYear().toString();
//   if (term?.end_date) {
//     examYear = new Date(term.end_date).getFullYear().toString();
//   } else if (student?.academic_year) {
//     const yearMatch = student.academic_year.match(/\d{4}/g);
//     if (yearMatch) examYear = yearMatch[yearMatch.length - 1]; 
//   }

//   const pType = String(passcard?.payment_type || '').toLowerCase()
//   const showMidTermStamp = pType.includes('mid') || pType.includes('month') || pType.includes('final')
//   const showFinalStamp = pType.includes('final')

//   let activeSemesterName = "FIRST SEMESTER";
//   if (term?.term_name) {
//     const nameStr = String(term.term_name).toLowerCase();
//     if (nameStr.includes('2') || nameStr.includes('second')) {
//         activeSemesterName = "SECOND SEMESTER";
//     }
//   }

//   return (
//     <div className="min-h-screen bg-gray-100 pb-10">
//       <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm print:hidden">
//         <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
//           <div className="flex items-center gap-2.5">
//             <div className="w-9 h-9 bg-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-xs">HU</div>
//             <span className="text-blue-800 font-bold text-base">Student Portal</span>
//           </div>
//           <div className="hidden md:flex items-center gap-1">
//             <Link to="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">Dashboard</Link>
//             <Link to="/pay-fee" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">Pay Fee</Link>
//             <Link to="/passcard" className="px-4 py-2 text-sm font-semibold text-blue-800 bg-blue-50 rounded-lg">Passcard</Link>
//           </div>
//           <div className="flex items-center gap-3">
//             <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 font-bold text-sm flex items-center justify-center">{initials}</div>
//           </div>
//         </div>
//       </nav>

//       <div className="max-w-3xl mx-auto px-4 mt-10">
//         <div className="flex justify-between items-end mb-6 print:hidden">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900 mb-1">🪪 Exam Passcard</h1>
//             <p className="text-sm text-gray-500">Your official digital examination card</p>
//           </div>
          
//           {passcard && !loading && !error && (
//             <button 
//               onClick={handleDownload} 
//               disabled={downloading}
//               className="hidden md:block bg-blue-800 hover:bg-blue-900 disabled:bg-blue-400 text-white text-xs font-bold py-2.5 px-5 rounded-lg shadow-sm transition-colors"
//             >
//               {downloading ? '⏳ Preparing Image...' : '⬇️ Download Image'}
//             </button>
//           )}
//         </div>

//         {loading ? (
//           <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm print:hidden">
//             <p className="text-gray-400 text-sm mt-3">Loading your passcard…</p>
//           </div>
//         ) : error && !passcard ? (
//           <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm print:hidden">
//             <div className="text-5xl mb-4">🔒</div>
//             <h2 className="text-lg font-bold text-gray-800 mb-2">No Passcard Available</h2>
//             <p className="text-sm text-gray-500 mb-6">{error}</p>
//             <Link to="/pay-fee" className="inline-block bg-blue-800 text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-blue-900 transition-colors">Pay Fee to Get Passcard →</Link>
//           </div>
//         ) : passcard ? (
          
//           <div id="passcard-element" className="bg-[#eef7f0] border-2 border-gray-400 p-6 md:p-10 shadow-2xl relative overflow-hidden text-gray-900 font-sans mb-10">
            
//             <div className="flex flex-col md:flex-row justify-between items-center border-b-2 border-green-800 pb-5 mb-6 gap-4">
//               <div className="w-24 h-28 border-2 border-green-800 flex flex-col justify-center items-center text-green-800 bg-white">
//                 <span className="font-bold text-5xl">HU</span>
//               </div>
              
//               <div className="text-center flex-1">
//                 <h1 className="text-2xl md:text-3xl font-serif font-extrabold text-green-900 tracking-wider uppercase">
//                   Hormuud University
//                 </h1>
//                 <p className="font-bold text-sm md:text-base mt-2 text-gray-800">
//                   Academic Year {student.academic_year || '2025/2026 B'}
//                 </p>
                
//                 <p className="font-extrabold text-sm md:text-base text-green-700 uppercase tracking-widest my-1">
//                   — {activeSemesterName} —
//                 </p>

//                 <p className="font-bold text-sm md:text-base text-gray-800">
//                   Finance Clearance Card
//                 </p>
//                 <div className="bg-blue-800 text-white font-bold px-6 py-1.5 inline-block mt-2 tracking-widest text-sm border-2 border-blue-900 shadow-sm uppercase">
//                   Examination Card
//                 </div>
//               </div>
//             </div>

//             <div className="text-base md:text-lg leading-loose mb-10 font-semibold text-gray-800">
//               <p className="block">
//                 This card certified that Mr. / Mrs. 
//                 <span className="inline-block border-b-2 border-black border-dashed min-w-[250px] md:min-w-[350px] px-3 ml-2 font-bold text-black uppercase">
//                   {student.full_name}
//                 </span>
//               </p>
//               <p className="block mt-4 md:mt-6">
//                 ID No: 
//                 <span className="inline-block border-b-2 border-black border-dashed min-w-[120px] px-3 mx-2 font-bold text-black uppercase">
//                   {student.student_id}
//                 </span>
//                 Class: 
//                 <span className="inline-block border-b-2 border-black border-dashed min-w-[120px] px-3 mx-2 font-bold text-black uppercase">
//                   {student.batch || student.department}
//                 </span>
//                 is eligible to attend this exam.
//               </p>
//             </div>

//             <div className="flex flex-col md:flex-row justify-center md:justify-around items-center gap-10 mb-8 px-4">
              
//               <div className="flex flex-col items-center">
//                 <div className="relative w-40 h-40 md:w-44 md:h-44 rounded-full border-2 border-black flex flex-col justify-center items-center text-center p-2 bg-[#eef7f0]">
//                   <div className="text-sm md:text-base font-extrabold uppercase leading-snug">
//                     Mid-Term<br/>Exam
//                   </div>
                  
//                   {showMidTermStamp && (
//                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
//                       <div className="border-[6px] border-red-600 text-red-600 text-4xl md:text-5xl font-black uppercase tracking-widest transform -rotate-[15deg] px-5 py-2 opacity-90 mix-blend-multiply bg-transparent rounded-sm">
//                         PAID
//                       </div>
//                     </div>
//                   )}
//                 </div>
                
//                 <div className="mt-4 text-xs md:text-sm font-bold text-gray-800">
//                   Date: ___/___/{examYear}
//                 </div>
//                 <div className="mt-1 text-sm md:text-base font-extrabold text-gray-900 tracking-wider uppercase">
//                   {midTermLabel}
//                 </div>
//               </div>

//               <div className="flex flex-col items-center">
//                 <div className="relative w-40 h-40 md:w-44 md:h-44 rounded-full border-2 border-black flex flex-col justify-center items-center text-center p-2 bg-[#eef7f0]">
//                   <div className="text-sm md:text-base font-extrabold uppercase leading-snug">
//                     Final<br/>Exam
//                   </div>
                  
//                   {showFinalStamp && (
//                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
//                       <div className="border-[6px] border-red-600 text-red-600 text-4xl md:text-5xl font-black uppercase tracking-widest transform -rotate-[15deg] px-5 py-2 opacity-90 mix-blend-multiply bg-transparent rounded-sm">
//                         PAID
//                       </div>
//                     </div>
//                   )}
//                 </div>
                
//                 <div className="mt-4 text-xs md:text-sm font-bold text-gray-800">
//                   Date: ___/___/{examYear}
//                 </div>
//                 <div className="mt-1 text-sm md:text-base font-extrabold text-gray-900 tracking-wider uppercase">
//                   {finalExamLabel}
//                 </div>
//               </div>
              
//             </div>

//             <div className="border-t-2 border-green-800 pt-5 text-sm font-bold text-gray-800 space-y-2">
//               <p>N.B: 1) Passcard-kan ardaygii uu ka lumo waa $5.</p>
//               <p>2) Passcard aan sax ahayn ardaygii lagu arko waxaa laga joojinayaa imtixaanka.</p>
              
//               <div className="mt-6 flex justify-between items-end border-t border-gray-400 pt-2 text-[10px] md:text-xs text-gray-500 font-mono">
//                 <div>Digital Ref: {passcard.name}</div>
//                 <div className="text-right">
//                   TXN: {passcard.transaction_id} <br/> 
//                   Valid Until: {passcard.valid_until}
//                 </div>
//               </div>
//             </div>
//           </div>
//         ) : null}

//         {!loading && passcardHistory.length > 0 && (
//           <div className="mt-10 print:hidden">
//             <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Passcard History</h2>
//             <div className="space-y-3">
//               {passcardHistory.map((p, index) => (
//                 <div key={index} className={`bg-white border ${p.name === passcard?.name ? 'border-blue-300 ring-2 ring-blue-50' : 'border-gray-200'} rounded-xl p-4 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-3`}>
                  
//                   <div>
//                     <div className="flex items-center gap-2 mb-1">
//                       <span className="font-bold text-gray-800">{p.academic_term}</span>
//                       {p.name === passcard?.name && (
//                         <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">Current</span>
//                       )}
//                     </div>
//                     <div className="text-xs text-gray-500 font-medium">
//                       Payment Type: <span className="text-gray-700 font-bold">{p.payment_type} Exams</span>
//                     </div>
//                   </div>

//                   <div className="flex flex-col md:items-end text-xs space-y-1">
//                     <div className="flex items-center gap-2">
//                       <span className="text-gray-400">Status:</span>
//                       {p.is_valid === 1 
//                         ? <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✅ Valid</span>
//                         : <span className="font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">❌ Expired</span>
//                       }
//                     </div>
//                     <div className="text-gray-400">Issued: <span className="text-gray-700">{p.issue_date}</span></div>
//                     <div className="text-gray-400">Ref: <span className="font-mono text-gray-500">{p.name}</span></div>
//                   </div>

//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//       </div>
//     </div>
//   )
// }


// import { useState, useEffect } from 'react'
// import { Link } from 'react-router-dom'

// interface Props { student: any }

// export default function Passcard({ student }: Props) {
//   const [passcard, setPasscard] = useState<any>(null)
//   const [passcardHistory, setPasscardHistory] = useState<any[]>([]) 
//   const [term, setTerm]         = useState<any>(null)
//   const [loading, setLoading]   = useState(true)
//   const [error, setError]       = useState('')
//   const [downloading, setDownloading] = useState(false)

//   const initials = student.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

//   useEffect(() => { 
//     fetchData() 
//   }, [])

//   async function fetchData() {
//     setLoading(true)
//     try {
//       // 1. Fetch Current Term Info
//       const resTerm = await fetch(`/api/method/hu_passcard_system.api.payment.get_term_info?student_id=${student.student_id}`, { headers: { 'X-Frappe-CSRF-Token': (window as any).csrf_token || 'fetch' } })
//       const dataTerm = await resTerm.json()
//       if (dataTerm.message?.term) {
//         setTerm(dataTerm.message.term)
//       }

//       // 2. Fetch Active Passcard for Current Term
//       const resPass = await fetch(`/api/method/hu_passcard_system.api.payment.get_student_passcard?student_id=${student.student_id}`, { headers: { 'X-Frappe-CSRF-Token': (window as any).csrf_token || 'fetch' } })
//       const dataPass = await resPass.json()
//       if (dataPass.message?.passcard) {
//         setPasscard(dataPass.message.passcard)
//       } else {
//         setError('No active passcard found for the current semester. Please complete your fee payment.')
//       }

//       // 3. Fetch ALL Passcard History
//       const resHistory = await fetch(`/api/method/hu_passcard_system.api.payment.get_all_student_passcards?student_id=${student.student_id}`, { headers: { 'X-Frappe-CSRF-Token': (window as any).csrf_token || 'fetch' } })
//       const dataHistory = await resHistory.json()
//       if (dataHistory.message?.passcards) {
//         setPasscardHistory(dataHistory.message.passcards)
//       }

//     } catch {
//       setError('Failed to load passcard data. Please try again.')
//     } finally {
//       setLoading(false)
//     }
//   }

//   function handleDownload() {
//     const element = document.getElementById('passcard-element')
//     if (!element) return

//     setDownloading(true)
    
//     const script = document.createElement('script')
//     script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
//     script.onload = () => {
//       ;(window as any).html2canvas(element, { scale: 2 }).then((canvas: HTMLCanvasElement) => {
//         const link = document.createElement('a')
//         link.download = `HU_Passcard_${student.student_id}.png`
//         link.href = canvas.toDataURL('image/png')
//         link.click()
//         setDownloading(false)
//       })
//     }
//     document.body.appendChild(script)
//   }

//   function getShortMonth(dateStr: string) {
//     if (!dateStr) return ''
//     return new Date(dateStr).toLocaleString('en-US', { month: 'short' })
//   }

//   const midTermLabel = term 
//     ? `${getShortMonth(term.start_date)}-${getShortMonth(term.mid_term_exam_end)}` 
//     : '...'
    
//   const finalExamLabel = term 
//     ? `${getShortMonth(term.final_start)}-${getShortMonth(term.end_date)}` 
//     : '...'

//   let examYear = new Date().getFullYear().toString();
//   if (term?.end_date) {
//     examYear = new Date(term.end_date).getFullYear().toString();
//   } else if (student?.academic_year) {
//     const yearMatch = student.academic_year.match(/\d{4}/g);
//     if (yearMatch) {
//       examYear = yearMatch[yearMatch.length - 1]; 
//     }
//   }

//   const pType = String(passcard?.payment_type || '').toLowerCase()
//   const showMidTermStamp = pType.includes('mid') || pType.includes('month') || pType.includes('final')
//   const showFinalStamp = pType.includes('final')

//   // ─────────────────────────────────────────────────────────────────────────────
//   // ACTIVE SEMESTER DETECTION
//   // ─────────────────────────────────────────────────────────────────────────────
//   const issueDate = passcard?.issue_date ? new Date(passcard.issue_date) : new Date();
//   const currentMonth = issueDate.getMonth() + 1; // JS months are 0-11, so +1 gives 1-12
  
//   // Second semester runs from March (3) to August (8)
//   const isSecondSemester = currentMonth >= 3 && currentMonth <= 8;
//   const activeSemesterName = isSecondSemester ? "Second Semester" : "First Semester";

//   return (
//     <div className="min-h-screen bg-gray-100 pb-10">
//       <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm print:hidden">
//         <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
//           <div className="flex items-center gap-2.5">
//             <div className="w-9 h-9 bg-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-xs">HU</div>
//             <span className="text-blue-800 font-bold text-base">Student Portal</span>
//           </div>
//           <div className="hidden md:flex items-center gap-1">
//             <Link to="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">Dashboard</Link>
//             <Link to="/pay-fee" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">Pay Fee</Link>
//             <Link to="/passcard" className="px-4 py-2 text-sm font-semibold text-blue-800 bg-blue-50 rounded-lg">Passcard</Link>
//           </div>
//           <div className="flex items-center gap-3">
//             <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 font-bold text-sm flex items-center justify-center">{initials}</div>
//           </div>
//         </div>
//       </nav>

//       <div className="max-w-3xl mx-auto px-4 mt-10">
//         <div className="flex justify-between items-end mb-6 print:hidden">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900 mb-1">🪪 Exam Passcard</h1>
//             <p className="text-sm text-gray-500">Your official digital examination card</p>
//           </div>
          
//           {passcard && !loading && !error && (
//             <button 
//               onClick={handleDownload} 
//               disabled={downloading}
//               className="hidden md:block bg-blue-800 hover:bg-blue-900 disabled:bg-blue-400 text-white text-xs font-bold py-2.5 px-5 rounded-lg shadow-sm transition-colors"
//             >
//               {downloading ? '⏳ Preparing Image...' : '⬇️ Download Image'}
//             </button>
//           )}
//         </div>

//         {loading ? (
//           <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm print:hidden">
//             <p className="text-gray-400 text-sm mt-3">Loading your passcard…</p>
//           </div>
//         ) : error && !passcard ? (
//           <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm print:hidden">
//             <div className="text-5xl mb-4">🔒</div>
//             <h2 className="text-lg font-bold text-gray-800 mb-2">No Passcard Available</h2>
//             <p className="text-sm text-gray-500 mb-6">{error}</p>
//             <Link to="/pay-fee" className="inline-block bg-blue-800 text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-blue-900 transition-colors">Pay Fee to Get Passcard →</Link>
//           </div>
//         ) : passcard ? (
          
//           /* ── THE ACTIVE PAPER-STYLE PASSCARD ── */
//           <div id="passcard-element" className="bg-[#eef7f0] border-2 border-gray-400 p-6 md:p-10 shadow-2xl relative overflow-hidden text-gray-900 font-sans mb-10">
            
//             {/* Header Section */}
//             <div className="flex flex-col md:flex-row justify-between items-center border-b-2 border-green-800 pb-5 mb-6 gap-4">
//               <div className="w-24 h-28 border-2 border-green-800 flex flex-col justify-center items-center text-green-800 bg-white">
//                 <span className="font-bold text-5xl">HU</span>
//               </div>
              
//               <div className="text-center flex-1">
//                 <h1 className="text-2xl md:text-3xl font-serif font-extrabold text-green-900 tracking-wider uppercase">
//                   Hormuud University
//                 </h1>
//                 <p className="font-bold text-sm md:text-base mt-2 text-gray-800">
//                   Academic Year {student.academic_year || '2025/2026 B'}
//                 </p>
                
//                 {/* NEW: ACTIVE SEMESTER INJECTED HERE */}
//                 <p className="font-extrabold text-sm md:text-base text-green-700 uppercase tracking-widest my-1">
//                   — {activeSemesterName} —
//                 </p>

//                 <p className="font-bold text-sm md:text-base text-gray-800">
//                   Finance Clearance Card
//                 </p>
//                 <div className="bg-blue-800 text-white font-bold px-6 py-1.5 inline-block mt-2 tracking-widest text-sm border-2 border-blue-900 shadow-sm uppercase">
//                   Examination Card
//                 </div>
//               </div>
//             </div>

//             {/* Certification Body */}
//             <div className="text-base md:text-lg leading-loose mb-10 font-semibold text-gray-800">
//               <p className="block">
//                 This card certified that Mr. / Mrs. 
//                 <span className="inline-block border-b-2 border-black border-dashed min-w-[250px] md:min-w-[350px] px-3 ml-2 font-bold text-black uppercase">
//                   {student.full_name}
//                 </span>
//               </p>
//               <p className="block mt-4 md:mt-6">
//                 ID No: 
//                 <span className="inline-block border-b-2 border-black border-dashed min-w-[120px] px-3 mx-2 font-bold text-black uppercase">
//                   {student.student_id}
//                 </span>
//                 Class: 
//                 <span className="inline-block border-b-2 border-black border-dashed min-w-[120px] px-3 mx-2 font-bold text-black uppercase">
//                   {student.batch || student.department}
//                 </span>
//                 is eligible to attend this exam.
//               </p>
//             </div>

//             {/* Exam Stamps Circles */}
//             <div className="flex flex-col md:flex-row justify-center md:justify-around items-center gap-10 mb-8 px-4">
              
//               {/* Mid-Term Wrapper */}
//               <div className="flex flex-col items-center">
//                 <div className="relative w-40 h-40 md:w-44 md:h-44 rounded-full border-2 border-black flex flex-col justify-center items-center text-center p-2 bg-[#eef7f0]">
//                   <div className="text-sm md:text-base font-extrabold uppercase leading-snug">
//                     Mid-Term<br/>Exam
//                   </div>
                  
//                   {showMidTermStamp && (
//                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
//                       <div className="border-[6px] border-red-600 text-red-600 text-4xl md:text-5xl font-black uppercase tracking-widest transform -rotate-[15deg] px-5 py-2 opacity-90 mix-blend-multiply bg-transparent rounded-sm">
//                         PAID
//                       </div>
//                     </div>
//                   )}
//                 </div>
                
//                 <div className="mt-4 text-xs md:text-sm font-bold text-gray-800">
//                   Date: ___/___/{examYear}
//                 </div>
//                 <div className="mt-1 text-sm md:text-base font-extrabold text-gray-900 tracking-wider uppercase">
//                   {midTermLabel}
//                 </div>
//               </div>

//               {/* Final Exam Wrapper */}
//               <div className="flex flex-col items-center">
//                 <div className="relative w-40 h-40 md:w-44 md:h-44 rounded-full border-2 border-black flex flex-col justify-center items-center text-center p-2 bg-[#eef7f0]">
//                   <div className="text-sm md:text-base font-extrabold uppercase leading-snug">
//                     Final<br/>Exam
//                   </div>
                  
//                   {showFinalStamp && (
//                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
//                       <div className="border-[6px] border-red-600 text-red-600 text-4xl md:text-5xl font-black uppercase tracking-widest transform -rotate-[15deg] px-5 py-2 opacity-90 mix-blend-multiply bg-transparent rounded-sm">
//                         PAID
//                       </div>
//                     </div>
//                   )}
//                 </div>
                
//                 <div className="mt-4 text-xs md:text-sm font-bold text-gray-800">
//                   Date: ___/___/{examYear}
//                 </div>
//                 <div className="mt-1 text-sm md:text-base font-extrabold text-gray-900 tracking-wider uppercase">
//                   {finalExamLabel}
//                 </div>
//               </div>
              
//             </div>

//             {/* Rules and Footer */}
//             <div className="border-t-2 border-green-800 pt-5 text-sm font-bold text-gray-800 space-y-2">
//               <p>N.B: 1) Passcard-kan ardaygii uu ka lumo waa $5.</p>
//               <p>2) Passcard aan sax ahayn ardaygii lagu arko waxaa laga joojinayaa imtixaanka.</p>
              
//               <div className="mt-6 flex justify-between items-end border-t border-gray-400 pt-2 text-[10px] md:text-xs text-gray-500 font-mono">
//                 <div>Digital Ref: {passcard.name}</div>
//                 <div className="text-right">
//                   TXN: {passcard.transaction_id} <br/> 
//                   Valid Until: {passcard.valid_until}
//                 </div>
//               </div>
//             </div>
//           </div>
//         ) : null}

//         {/* ── PASSCARD HISTORY SECTION ── */}
//         {!loading && passcardHistory.length > 0 && (
//           <div className="mt-10 print:hidden">
//             <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Passcard History</h2>
//             <div className="space-y-3">
//               {passcardHistory.map((p, index) => (
//                 <div key={index} className={`bg-white border ${p.name === passcard?.name ? 'border-blue-300 ring-2 ring-blue-50' : 'border-gray-200'} rounded-xl p-4 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-3`}>
                  
//                   {/* Left Side: Term & Type */}
//                   <div>
//                     <div className="flex items-center gap-2 mb-1">
//                       <span className="font-bold text-gray-800">{p.academic_term}</span>
//                       {p.name === passcard?.name && (
//                         <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">Current</span>
//                       )}
//                     </div>
//                     <div className="text-xs text-gray-500 font-medium">
//                       Payment Type: <span className="text-gray-700 font-bold">{p.payment_type} Exams</span>
//                     </div>
//                   </div>

//                   {/* Right Side: Status & Dates */}
//                   <div className="flex flex-col md:items-end text-xs space-y-1">
//                     <div className="flex items-center gap-2">
//                       <span className="text-gray-400">Status:</span>
//                       {p.is_valid === 1 
//                         ? <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✅ Valid</span>
//                         : <span className="font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">❌ Expired</span>
//                       }
//                     </div>
//                     <div className="text-gray-400">Issued: <span className="text-gray-700">{p.issue_date}</span></div>
//                     <div className="text-gray-400">Ref: <span className="font-mono text-gray-500">{p.name}</span></div>
//                   </div>

//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//       </div>
//     </div>
//   )
// }

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

interface Props { student: any }

export default function Passcard({ student }: Props) {
  const [passcard, setPasscard] = useState<any>(null)
  const [passcardHistory, setPasscardHistory] = useState<any[]>([]) 
  const [term, setTerm]         = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [downloading, setDownloading] = useState(false)

  const initials = student.full_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  useEffect(() => { 
    fetchData() 
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const headers = { 'X-Frappe-CSRF-Token': (window as any).csrf_token || 'fetch' }

      const [resTerm, resPass, resHistory] = await Promise.all([
        fetch(`/api/method/hu_passcard_system.api.payment.get_term_info?student_id=${student.student_id}`, { headers }),
        fetch(`/api/method/hu_passcard_system.api.payment.get_student_passcard?student_id=${student.student_id}`, { headers }),
        fetch(`/api/method/hu_passcard_system.api.payment.get_all_student_passcards?student_id=${student.student_id}`, { headers })
      ]);

      const dataTerm = await resTerm.json()
      const dataPass = await resPass.json()
      const dataHistory = await resHistory.json()

      if (dataTerm.message?.term) setTerm(dataTerm.message.term)
      
      if (dataPass.message?.passcard) {
        setPasscard(dataPass.message.passcard)
      } else {
        setError('No active passcard found for the current semester. Please complete your fee payment.')
      }

      if (dataHistory.message?.passcards) {
        setPasscardHistory(dataHistory.message.passcards)
      }

    } catch {
      setError('Failed to load passcard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    const element = document.getElementById('passcard-element')
    if (!element) return

    setDownloading(true)
    
    const generatePDF = () => {
      const opt = {
        margin:       0.2,
        filename:     `HU_Passcard_${student.student_id}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      
      const timeout = setTimeout(() => setDownloading(false), 5000);

      ;(window as any).html2pdf().set(opt).from(element).save()
        .then(() => {
          clearTimeout(timeout);
          setDownloading(false);
        })
        .catch((err: any) => {
          console.error("PDF generation failed:", err);
          clearTimeout(timeout);
          setDownloading(false);
        });
    };

    if ((window as any).html2pdf) {
      generatePDF();
    } else {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
      script.onload = generatePDF;
      script.onerror = () => {
        alert("Failed to load the PDF library. Please check your internet connection.");
        setDownloading(false);
      }
      document.body.appendChild(script)
    }
  }

  function getShortMonth(dateStr: string) {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleString('en-US', { month: 'short' })
  }

  const midTermLabel = term ? `${getShortMonth(term.start_date)}-${getShortMonth(term.end_date)}` : '...'
  const finalExamLabel = term ? `${getShortMonth(term.start_date)}-${getShortMonth(term.end_date)}` : '...'

  let examYear = new Date().getFullYear().toString();
  if (term?.end_date) {
    examYear = new Date(term.end_date).getFullYear().toString();
  } else if (student?.academic_year) {
    const yearMatch = student.academic_year.match(/\d{4}/g);
    if (yearMatch) examYear = yearMatch[yearMatch.length - 1]; 
  }

  const formattedIssueDate = passcard?.issue_date 
    ? new Date(passcard.issue_date).toLocaleDateString('en-GB') 
    : '';

  const pType = String(passcard?.payment_type || '').toLowerCase()
  const showMidTermStamp = pType.includes('mid') || pType.includes('month') || pType.includes('final')
  const showFinalStamp = pType.includes('final')

  let activeSemesterName = "FIRST SEMESTER";
  if (term?.term_name) {
    const nameStr = String(term.term_name).toLowerCase();
    if (nameStr.includes('2') || nameStr.includes('second')) {
        activeSemesterName = "SECOND SEMESTER";
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm print:hidden">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-xs">HU</div>
            <span className="text-blue-800 font-bold text-base">Student Portal</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            <Link to="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">Dashboard</Link>
            <Link to="/pay-fee" className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">Pay Fee</Link>
            <Link to="/passcard" className="px-4 py-2 text-sm font-semibold text-blue-800 bg-blue-50 rounded-lg">Passcard</Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 font-bold text-sm flex items-center justify-center">{initials}</div>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t border-gray-100 flex print:hidden">
          <Link to="/dashboard" className="flex-1 text-center py-2 text-xs font-medium text-gray-500">Dashboard</Link>
          <Link to="/pay-fee"   className="flex-1 text-center py-2 text-xs font-medium text-gray-500">Pay Fee</Link>
          <Link to="/passcard"  className="flex-1 text-center py-2 text-xs font-semibold text-blue-800 bg-blue-50">Passcard</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 mt-10">
        <div className="flex justify-between items-end mb-6 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">🪪 Exam Passcard</h1>
            <p className="text-sm text-gray-500">Your official digital examination card</p>
          </div>
          
          {passcard && !loading && !error && (
            <button 
              onClick={handleDownload} 
              disabled={downloading}
              className="hidden md:block bg-blue-800 hover:bg-blue-900 disabled:bg-blue-400 text-white text-xs font-bold py-2.5 px-5 rounded-lg shadow-sm transition-colors"
            >
              {downloading ? '⏳ Preparing PDF...' : '⬇️ Download PDF'}
            </button>
          )}
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm print:hidden">
            <p className="text-gray-400 text-sm mt-3">Loading your passcard…</p>
          </div>
        ) : error && !passcard ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm print:hidden">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">No Passcard Available</h2>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <Link to="/pay-fee" className="inline-block bg-blue-800 text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-blue-900 transition-colors">Pay Fee to Get Passcard →</Link>
          </div>
        ) : passcard ? (
          
          <div id="passcard-element" className="bg-[#eef7f0] border-2 border-[#9ca3af] p-6 md:p-10 shadow-2xl relative overflow-hidden text-[#111827] font-sans mb-10">
            
            <div className="flex flex-col md:flex-row justify-between items-center border-b-2 border-[#166534] pb-5 mb-6 gap-4">
              <div className="w-24 h-28 border-2 border-[#166534] flex flex-col justify-center items-center text-[#166534] bg-[#ffffff]">
                <span className="font-bold text-5xl">HU</span>
              </div>
              
              <div className="text-center flex-1">
                <h1 className="text-2xl md:text-3xl font-serif font-extrabold text-[#14532d] tracking-wider uppercase">
                  Hormuud University
                </h1>
                <p className="font-bold text-sm md:text-base mt-2 text-[#1f2937]">
                  Academic Year {student.academic_year || '2025/2026 B'}
                </p>
                
                <p className="font-extrabold text-sm md:text-base text-[#15803d] uppercase tracking-widest my-1">
                  — {activeSemesterName} —
                </p>

                <p className="font-bold text-sm md:text-base text-[#1f2937]">
                  Finance Clearance Card
                </p>
                <div className="bg-[#1e40af] text-[#ffffff] font-bold px-6 py-1.5 inline-block mt-2 tracking-widest text-sm border-2 border-[#1e3a8a] shadow-sm uppercase">
                  Examination Card
                </div>
              </div>
            </div>

            <div className="text-base md:text-lg leading-loose mb-10 font-semibold text-[#1f2937]">
              <p className="block">
                This card certified that Mr. / Mrs. 
                <span className="inline-block border-b-2 border-[#000000] border-dashed min-w-[250px] md:min-w-[350px] px-3 ml-2 font-bold text-[#000000] uppercase">
                  {student.full_name}
                </span>
              </p>
              <p className="block mt-4 md:mt-6">
                ID No: 
                <span className="inline-block border-b-2 border-[#000000] border-dashed min-w-[120px] px-3 mx-2 font-bold text-[#000000] uppercase">
                  {student.student_id}
                </span>
                Class: 
                <span className="inline-block border-b-2 border-[#000000] border-dashed min-w-[120px] px-3 mx-2 font-bold text-[#000000] uppercase">
                  {student.batch || student.department}
                </span>
                is eligible to attend this exam.
              </p>
            </div>

            <div className="flex flex-col md:flex-row justify-center md:justify-around items-center gap-10 mb-8 px-4">
              
              <div className="flex flex-col items-center">
                <div className="relative w-40 h-40 md:w-44 md:h-44 rounded-full border-2 border-[#000000] flex flex-col justify-center items-center text-center p-2 bg-[#eef7f0]">
                  <div className="text-sm md:text-base font-extrabold uppercase leading-snug">
                    Mid-Term<br/>Exam
                  </div>
                  
                  {showMidTermStamp && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="border-[6px] border-[#dc2626] text-[#dc2626] text-4xl md:text-5xl font-black uppercase tracking-widest transform -rotate-[15deg] px-5 py-2 opacity-90 bg-transparent rounded-sm">
                        PAID
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 text-xs md:text-sm font-bold text-[#1f2937]">
                  Date: {showMidTermStamp ? formattedIssueDate : `___/___/${examYear}`}
                </div>
                <div className="mt-1 text-sm md:text-base font-extrabold text-[#111827] tracking-wider uppercase">
                  {midTermLabel}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative w-40 h-40 md:w-44 md:h-44 rounded-full border-2 border-[#000000] flex flex-col justify-center items-center text-center p-2 bg-[#eef7f0]">
                  <div className="text-sm md:text-base font-extrabold uppercase leading-snug">
                    Final<br/>Exam
                  </div>
                  
                  {showFinalStamp && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="border-[6px] border-[#dc2626] text-[#dc2626] text-4xl md:text-5xl font-black uppercase tracking-widest transform -rotate-[15deg] px-5 py-2 opacity-90 bg-transparent rounded-sm">
                        PAID
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 text-xs md:text-sm font-bold text-[#1f2937]">
                  Date: {showFinalStamp ? formattedIssueDate : `___/___/${examYear}`}
                </div>
                <div className="mt-1 text-sm md:text-base font-extrabold text-[#111827] tracking-wider uppercase">
                  {finalExamLabel}
                </div>
              </div>
              
            </div>

            <div className="border-t-2 border-[#166534] pt-5 text-sm font-bold text-[#1f2937] space-y-2">
              <p>N.B: 1) Passcard-kan ardaygii uu ka lumo waa $5.</p>
              <p>2) Passcard aan sax ahayn ardaygii lagu arko waxaa laga joojinayaa imtixaanka.</p>
              
              <div className="mt-6 flex justify-between items-end border-t border-[#9ca3af] pt-2 text-[10px] md:text-xs text-[#6b7280] font-mono">
                <div>Digital Ref: {passcard.name}</div>
                <div className="text-right">
                  TXN: {passcard.transaction_id} <br/> 
                  Valid Until: {passcard.valid_until}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {!loading && passcardHistory.length > 0 && (
          <div className="mt-10 print:hidden">
            <h2 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Passcard History</h2>
            <div className="space-y-3">
              {passcardHistory.map((p, index) => (
                <div key={index} className={`bg-white border ${p.name === passcard?.name ? 'border-blue-300 ring-2 ring-blue-50' : 'border-gray-200'} rounded-xl p-4 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-3`}>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-800">{p.academic_term}</span>
                      {p.name === passcard?.name && (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">Current</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 font-medium">
                      Payment Type: <span className="text-gray-700 font-bold">{p.payment_type} Exams</span>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Status:</span>
                      {p.is_valid === 1 
                        ? <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✅ Valid</span>
                        : <span className="font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">❌ Expired</span>
                      }
                    </div>
                    <div className="text-gray-400">Issued: <span className="text-gray-700">{p.issue_date}</span></div>
                    <div className="text-gray-400">Ref: <span className="font-mono text-gray-500">{p.name}</span></div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}