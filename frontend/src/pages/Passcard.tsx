

// import { useState, useEffect } from 'react'
// import { Link } from 'react-router-dom'
// import logoImg from '../assets/logo.png'

// interface Props { student: any }

// export default function Passcard({ student }: Props) {
//   const [passcard, setPasscard] = useState<any>(null)
//   const [passcardHistory, setPasscardHistory] = useState<any[]>([]) 
//   const [payments, setPayments] = useState<any[]>([]) 
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

//       const [resTerm, resPass, resHistory, resPayments] = await Promise.all([
//         fetch(`/api/method/hu_passcard_system.api.payment.get_term_info?student_id=${student.student_id}`, { headers }),
//         fetch(`/api/method/hu_passcard_system.api.payment.get_student_passcard?student_id=${student.student_id}`, { headers }),
//         fetch(`/api/method/hu_passcard_system.api.payment.get_all_student_passcards?student_id=${student.student_id}`, { headers }),
//         fetch(`/api/method/hu_passcard_system.api.payment.get_student_payments?student_id=${student.student_id}`, { headers })
//       ]);

//       const dataTerm = await resTerm.json()
//       const dataPass = await resPass.json()
//       const dataHistory = await resHistory.json()
//       const dataPayments = await resPayments.json()

//       if (dataTerm.message?.term) setTerm(dataTerm.message.term)
      
//       if (dataPass.message?.passcard) {
//         setPasscard(dataPass.message.passcard)
//       } else {
//         setError('No active passcard found for the current semester. Please complete your fee payment.')
//       }

//       if (dataHistory.message?.passcards) {
//         setPasscardHistory(dataHistory.message.passcards)
//       }

//       if (dataPayments.message?.payments) {
//         setPayments(dataPayments.message.payments)
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
    
//     const generatePDF = () => {
//       const opt = {
//         margin:       0.2,
//         filename:     `HU_Passcard_${student.student_id}.pdf`,
//         image:        { type: 'jpeg', quality: 0.98 },
//         html2canvas:  { scale: 2, useCORS: true, logging: false },
//         jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
//       };
      
//       const timeout = setTimeout(() => setDownloading(false), 5000);

//       ;(window as any).html2pdf().set(opt).from(element).save()
//         .then(() => {
//           clearTimeout(timeout);
//           setDownloading(false);
//         })
//         .catch((err: any) => {
//           console.error("PDF generation failed:", err);
//           clearTimeout(timeout);
//           setDownloading(false);
//         });
//     };

//     if ((window as any).html2pdf) {
//       generatePDF();
//     } else {
//       const script = document.createElement('script')
//       script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
//       script.onload = generatePDF;
//       script.onerror = () => {
//         alert("Failed to load the PDF library. Please check your internet connection.");
//         setDownloading(false);
//       }
//       document.body.appendChild(script)
//     }
//   }

//   const formattedIssueDate = passcard?.issue_date 
//     ? new Date(passcard.issue_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) 
//     : '';

//   let activeSemesterName = "FIRST SEMESTER";
//   if (term?.term_name) {
//     const nameStr = String(term.term_name).toLowerCase();
//     if (nameStr.includes('2') || nameStr.includes('second')) {
//         activeSemesterName = "SECOND SEMESTER";
//     }
//   }

//   // Dynamic Phase & Title Generation 
//   const termPayments = payments.filter(p => p.academic_term === passcard?.academic_term && p.status === 'Paid');
//   const totalPaidForTerm = termPayments.reduce((sum, p) => sum + Number(p.amount), 0);
//   const paidMonthsCount = termPayments.filter(p => p.payment_type === 'Month').length;
//   const totalMonthsCount = term?.months?.length || 6;
  
//   const hasFinalPayment = termPayments.some(p => p.payment_type === 'Final');
//   const hasMidPayment   = termPayments.some(p => p.payment_type === 'Mid term');
//   const halfMonthsCount  = Math.ceil(totalMonthsCount / 2);

//   const isFinalPhase = hasFinalPayment || paidMonthsCount >= totalMonthsCount || String(passcard?.payment_type).toLowerCase().includes('final');
//   const isMidPhase   = hasMidPayment || paidMonthsCount >= halfMonthsCount || String(passcard?.payment_type).toLowerCase().includes('mid');

//   // Dynamic Remark for Receipt
//   let receiptRemarkType = "FEE";
//   if (isFinalPhase) {
//     receiptRemarkType = "FINAL EXAM FEE";
//   } else if (isMidPhase) {
//     receiptRemarkType = "MID-TERM EXAM FEE";
//   } else {
//     receiptRemarkType = String(passcard?.payment_type || "FEE").toUpperCase();
//   }
  
//   const receiptRemark = `${receiptRemarkType} PAYMENT - ${activeSemesterName}`;
//   const receiptAmount = totalPaidForTerm > 0 ? totalPaidForTerm : Number(passcard?.amount_paid || 0);

//   // Manage Stamps
//   const showMidTermStamp = isMidPhase || isFinalPhase || String(passcard?.payment_type).toLowerCase().includes('month');
//   const showFinalStamp   = isFinalPhase;

//   let examYear = new Date().getFullYear().toString();
//   if (term?.end_date) {
//     examYear = new Date(term.end_date).getFullYear().toString();
//   } else if (student?.academic_year) {
//     const yearMatch = student.academic_year.match(/\d{4}/g);
//     if (yearMatch) examYear = yearMatch[yearMatch.length - 1]; 
//   }

//   const formatCurrency = (val: number) => {
//     return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
//   }

//   return (
//     <div className="min-h-screen bg-[#f3f4f6] pb-10">
//       <nav className="bg-[#ffffff] border-b border-[#e5e7eb] sticky top-0 z-50 shadow-sm print:hidden">
//         <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
//           <div className="flex items-center gap-2.5">
//             <div className="w-9 h-9 bg-[#1e40af] rounded-lg flex items-center justify-center text-[#ffffff] font-bold text-xs">HU</div>
//             <span className="text-[#1e40af] font-bold text-base">Student Portal</span>
//           </div>
//           <div className="hidden md:flex items-center gap-1">
//             <Link to="/dashboard" className="px-4 py-2 text-sm font-medium text-[#6b7280] hover:text-[#1e40af] hover:bg-[#eff6ff] rounded-lg transition-colors">Dashboard</Link>
//             <Link to="/pay-fee" className="px-4 py-2 text-sm font-medium text-[#6b7280] hover:text-[#1e40af] hover:bg-[#eff6ff] rounded-lg transition-colors">Pay Fee</Link>
//             <Link to="/passcard" className="px-4 py-2 text-sm font-semibold text-[#1e40af] bg-[#eff6ff] rounded-lg">Passcard</Link>
//           </div>
//           <div className="flex items-center gap-3">
//             <div className="w-9 h-9 rounded-full bg-[#dbeafe] text-[#1e40af] font-bold text-sm flex items-center justify-center">{initials}</div>
//           </div>
//         </div>

//         <div className="md:hidden border-t border-[#f3f4f6] flex print:hidden">
//           <Link to="/dashboard" className="flex-1 text-center py-2 text-xs font-medium text-[#6b7280]">Dashboard</Link>
//           <Link to="/pay-fee"   className="flex-1 text-center py-2 text-xs font-medium text-[#6b7280]">Pay Fee</Link>
//           <Link to="/passcard"  className="flex-1 text-center py-2 text-xs font-semibold text-[#1e40af] bg-[#eff6ff]">Passcard</Link>
//         </div>
//       </nav>

//       <div className="max-w-4xl mx-auto px-4 mt-10">
//         <div className="flex justify-between items-end mb-6 print:hidden">
//           <div>
//             <h1 className="text-2xl font-bold text-[#111827] mb-1">🪪 Exam Passcard</h1>
//             <p className="text-sm text-[#6b7280]">Your official digital examination card & receipt</p>
//           </div>
          
//           {passcard && !loading && !error && (
//             <button 
//               onClick={handleDownload} 
//               disabled={downloading}
//               className="hidden md:block bg-[#1e40af] hover:bg-[#1e3a8a] disabled:bg-[#60a5fa] text-[#ffffff] text-xs font-bold py-2.5 px-5 rounded-lg shadow-sm transition-colors"
//             >
//               {downloading ? '⏳ Preparing PDF...' : '⬇️ Download PDF'}
//             </button>
//           )}
//         </div>

//         {loading ? (
//           <div className="bg-[#ffffff] border border-[#e5e7eb] rounded-xl p-12 text-center shadow-sm print:hidden">
//             <p className="text-[#9ca3af] text-sm mt-3">Loading your passcard…</p>
//           </div>
//         ) : error && !passcard ? (
//           <div className="bg-[#ffffff] border border-[#e5e7eb] rounded-xl p-8 text-center shadow-sm print:hidden">
//             <div className="text-5xl mb-4">🔒</div>
//             <h2 className="text-lg font-bold text-[#1f2937] mb-2">No Passcard Available</h2>
//             <p className="text-sm text-[#6b7280] mb-6">{error}</p>
//             <Link to="/pay-fee" className="inline-block bg-[#1e40af] text-[#ffffff] text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-[#1e3a8a] transition-colors">Pay Fee to Get Passcard →</Link>
//           </div>
//         ) : passcard ? (
          
//           <div id="passcard-element" className="flex flex-col gap-10">
            
//             {/* ── PAGE 1: FRONT PASSCARD (NO TAILWIND SHADOWS OR OPACITY) ── */}
//             <div className="bg-[#ffffff] border-[3px] border-[#000000] flex w-full font-sans text-[#000000]">
              
//               {/* Left Main Column */}
//               <div className="flex-1 p-5 md:p-8 flex flex-col justify-between">
                
//                 {/* Header */}
//                 <div className="flex items-start gap-4 mb-6">
//                   {/* HU Green Logo Replica */}
//                   <div className="w-24 h-24 border-[3px] border-[#15803d] flex flex-col justify-center items-center text-[#15803d] bg-[#ffffff] shrink-0 rounded-sm">
//                      <img 
//                       src={logoImg} 
//                       alt="Hormuud University Logo" 
//                       className="w-full h-full object-contain"
//                       crossOrigin="anonymous" 
//                     />
//                   </div>
                  
//                   {/* Titles */}
//                   <div className="flex-1 text-center pt-2 font-serif">
//                     <h1 className="text-2xl md:text-[26px] font-black uppercase tracking-tight text-[#1f2937]">HORMUUD UNIVERSITY</h1>
//                     <p className="font-bold text-sm mt-1 text-[#374151]">Academic Year {student.academic_year || '2025/2026 B'}</p>
//                     <p className="font-bold text-[15px] mt-1 text-[#374151]">Finance Clearance Card</p>
//                     <div className="bg-[#0ea5e9] text-[#ffffff] font-bold px-5 py-1 inline-block mt-1 text-sm uppercase tracking-wider">
//                       EXAMINATION CARD
//                     </div>
//                   </div>
//                 </div>

//                 {/* Text Block matching the handwriting lines */}
//                 <div className="text-sm md:text-[15px] leading-9 font-medium mb-6">
//                   This card certified that Mr. / Mrs. 
//                   <span className="inline-block border-b-[1.5px] border-[#000000] min-w-[200px] px-2 text-center font-bold font-serif italic text-lg">{student.full_name}</span>
//                   <br/>
//                   ID No: <span className="inline-block border-b-[1.5px] border-[#000000] min-w-[100px] px-2 text-center font-bold font-serif text-lg">{student.student_id}</span> 
//                   Class: <span className="inline-block border-b-[1.5px] border-[#000000] min-w-[120px] px-2 text-center font-bold font-serif text-lg uppercase">{student.batch || student.department}</span> 
//                   is eligible to attend this exam.
//                 </div>

//                 {/* N.B block */}
//                 <div className="text-xs md:text-[13px] space-y-2.5 font-medium mb-4">
//                   <p>N.B: 1) Passcard-kan ardaygii uu ka lumo waa $5</p>
//                   <p className="ml-7">2) Passcard aan sax ahayn ardaygii lagu arko waxaa laga joojinayaa<br/>imtixaanka.</p>
//                 </div>
//               </div>

//               {/* Right Sidebar Column (The Stamps Grid) */}
//               <div className="w-48 md:w-56 border-l-[3px] border-[#000000] flex flex-col shrink-0 bg-[#ffffff]">
                
//                 {/* Mid Term Section */}
//                 <div className="flex-1 border-b-[3px] border-[#000000] flex flex-col">
//                   {/* Date Line */}
//                   <div className="border-b-[3px] border-[#000000] p-1.5 px-3 flex justify-between items-center text-sm font-bold">
//                     <span>Date:</span>
//                     <span className="border-b border-[#000000] min-w-[80px] text-center inline-block">
//                       {showMidTermStamp ? formattedIssueDate : `___/___/${examYear}`}
//                     </span>
//                   </div>
                  
//                   {/* Circle Box */}
//                   <div className="flex-1 relative p-3 flex items-center justify-center min-h-[140px]">
//                     <div className="absolute top-2 left-2 border border-[#000000] text-[10px] px-1.5 py-0.5 font-semibold text-[#374151]">
//                       March-May
//                     </div>
//                     <div className="w-[110px] h-[110px] rounded-full border-[1.5px] border-[#000000] flex items-center justify-center text-center text-lg font-bold uppercase leading-tight">
//                       Mid-Term<br/>Exam
//                     </div>
                    
//                     {/* Blue PAID Stamp Overlay (NO TAILWIND OPACITY/TRANSPARENT CLASSES) */}
//                     {showMidTermStamp && (
//                       <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
//                          <div className="border-[4px] border-[#1e40af] text-[#1e40af] w-[135px] h-[135px] rounded-full flex flex-col items-center justify-center relative transform -rotate-[15deg]">
//                            <div className="text-[9px] font-bold text-center uppercase tracking-widest mt-2">Hormuud University</div>
//                            <span className="font-black text-4xl tracking-widest my-0.5 border-y-[3px] border-[#1e40af] px-4 w-full text-center" style={{ backgroundColor: "rgba(255, 255, 255, 0.4)" }}>PAID</span>
//                            <div className="text-[9px] font-bold text-center uppercase tracking-widest mb-2">Finance Office</div>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 {/* Final Section */}
//                 <div className="flex-1 flex flex-col">
//                   {/* Date Line */}
//                   <div className="border-b-[3px] border-[#000000] p-1.5 px-3 flex justify-between items-center text-sm font-bold">
//                     <span>Date:</span>
//                     <span className="border-b border-[#000000] min-w-[80px] text-center inline-block">
//                       {showFinalStamp ? formattedIssueDate : `___/___/${examYear}`}
//                     </span>
//                   </div>
                  
//                   {/* Circle Box */}
//                   <div className="flex-1 relative p-3 flex items-center justify-center min-h-[140px]">
//                     <div className="absolute top-2 left-2 border border-[#000000] text-[10px] px-1.5 py-0.5 font-semibold text-[#374151]">
//                       June-July
//                     </div>
//                     <div className="w-[110px] h-[110px] rounded-full border-[1.5px] border-[#000000] flex items-center justify-center text-center text-[19px] font-bold uppercase leading-tight">
//                       Final<br/>Exam
//                     </div>
                    
//                     {/* Blue PAID Stamp Overlay (NO TAILWIND OPACITY/TRANSPARENT CLASSES) */}
//                     {showFinalStamp && (
//                       <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
//                          <div className="border-[4px] border-[#1e40af] text-[#1e40af] w-[135px] h-[135px] rounded-full flex flex-col items-center justify-center relative transform -rotate-[15deg]">
//                            <div className="text-[9px] font-bold text-center uppercase tracking-widest mt-2">Hormuud University</div>
//                            <span className="font-black text-4xl tracking-widest my-0.5 border-y-[3px] border-[#1e40af] px-4 w-full text-center" style={{ backgroundColor: "rgba(255, 255, 255, 0.4)" }}>PAID</span>
//                            <div className="text-[9px] font-bold text-center uppercase tracking-widest mb-2">Finance Office</div>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//               </div>
//             </div>

//             {/* ── PDF PAGE BREAK MAGIC ── */}
//             <div className="html2pdf__page-break"></div>

//             {/* ── PAGE 2: RECEIPT VOUCHER (BACK) ── */}
//             <div className="bg-[#ffffff] border-2 border-[#9ca3af] p-6 md:p-10 relative overflow-hidden text-[#000000] font-sans">
              
//               <div className="text-center mb-6">
//                 <h2 className="text-xl font-bold uppercase tracking-wide">Hormuud University</h2>
//                 <p className="text-xs font-semibold">Address: Mogadisho- Wadajir</p>
//                 <p className="text-xs font-semibold">Tel: 858117</p>
//                 <p className="text-xs font-semibold">Email: finance@hu.edu.so</p>
//               </div>

//               <div className="flex justify-between items-end border-b-2 border-[#000000] pb-2 mb-6">
//                 <h3 className="text-xl font-bold underline underline-offset-4">Receipt Voucher</h3>
//                 <span className="text-xs font-bold bg-[#f3f4f6] px-2 py-1 border border-[#e5e7eb]">Ref No: {passcard.transaction_id || passcard.name}</span>
//               </div>

//               <div className="space-y-5 text-sm font-bold tracking-wide">
                
//                 <div className="flex justify-end mb-4">
//                    <div className="w-1/2 md:w-1/3 space-y-3">
//                       <div className="flex justify-between border-b border-[#000000] border-dashed pb-1">
//                         <span className="pr-2">Amount Paid:</span> 
//                         <span>${formatCurrency(receiptAmount)}</span>
//                       </div>
//                       <div className="flex justify-between border-b border-[#000000] border-dashed pb-1">
//                         <span className="pr-2">Date:</span> 
//                         <span>{formattedIssueDate}</span>
//                       </div>
//                    </div>
//                 </div>

//                 <div className="flex border-b border-[#000000] border-dashed pb-1">
//                   <span className="w-32 inline-block">Received From:</span>
//                   <span className="uppercase text-[#1f2937]">{student.full_name}</span>
//                 </div>
                
//                 <div className="flex flex-col md:flex-row gap-5 md:gap-10">
//                   <div className="flex flex-1 border-b border-[#000000] border-dashed pb-1">
//                     <span className="w-32 md:w-20 inline-block">ID No:</span>
//                     <span className="uppercase text-[#1f2937]">{student.student_id}</span>
//                   </div>
//                   <div className="flex flex-1 border-b border-[#000000] border-dashed pb-1">
//                     <span className="w-32 md:w-20 inline-block">Class:</span>
//                     <span className="uppercase text-[#1f2937]">{student.batch || student.department}</span>
//                   </div>
//                 </div>

//                 <div className="flex border-b border-[#000000] border-dashed pb-1">
//                   <span className="w-32 inline-block">Remark:</span>
//                   <span className="uppercase text-[#1f2937]">{receiptRemark}</span>
//                 </div>

//                 <div className="flex justify-between pt-16 pb-4">
//                   <div className="text-center w-[40%] border-t-2 border-[#000000] pt-1">Receiver By</div>
//                   <div className="text-center w-[40%] border-t-2 border-[#000000] pt-1">Cashier/Accountant By</div>
//                 </div>
//               </div>

//               {/* Replica Blue PAID Stamp for Receipt */}
//               <div className="absolute bottom-12 right-8 md:right-16 flex items-center justify-center pointer-events-none z-10">
//                 <div className="border-4 border-[#1e40af] text-[#1e40af] w-32 h-32 rounded-full flex flex-col items-center justify-center relative transform -rotate-[20deg]">
//                    <div className="text-[9px] font-bold text-center uppercase tracking-widest mt-1">Hormuud University</div>
//                    <span className="font-black text-4xl tracking-widest my-1 border-y-2 border-[#1e40af] px-4 w-full text-center" style={{ backgroundColor: "rgba(255, 255, 255, 0.4)" }}>PAID</span>
//                    <div className="text-[9px] font-bold text-center uppercase tracking-widest mb-1">Finance Office</div>
//                 </div>
//               </div>

//             </div>
//           </div>
//         ) : null}

//         {/* ── PASSCARD HISTORY SECTION ── */}
//         {!loading && passcardHistory.length > 0 && (
//           <div className="mt-10 print:hidden">
//             <h2 className="text-sm font-bold text-[#374151] mb-4 uppercase tracking-wider">Passcard History</h2>
//             <div className="space-y-3">
//               {passcardHistory.map((p, index) => (
//                 <div key={index} className={`bg-[#ffffff] border ${p.name === passcard?.name ? 'border-[#93c5fd] ring-2 ring-[#eff6ff]' : 'border-[#e5e7eb]'} rounded-xl p-4 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-3`}>
                  
//                   <div>
//                     <div className="flex items-center gap-2 mb-1">
//                       <span className="font-bold text-[#1f2937]">{p.academic_term}</span>
//                       {p.name === passcard?.name && (
//                         <span className="text-[10px] font-bold bg-[#dbeafe] text-[#1d4ed8] px-2 py-0.5 rounded-full uppercase">Current</span>
//                       )}
//                     </div>
//                     <div className="text-xs text-[#6b7280] font-medium">
//                       Payment Type: <span className="text-[#374151] font-bold">{p.payment_type} Exams</span>
//                     </div>
//                   </div>

//                   <div className="flex flex-col md:items-end text-xs space-y-1">
//                     <div className="flex items-center gap-2">
//                       <span className="text-[#9ca3af]">Status:</span>
//                       {p.is_valid === 1 
//                         ? <span className="font-bold text-[#16a34a] bg-[#f0fdf4] px-2 py-0.5 rounded-full">✅ Valid</span>
//                         : <span className="font-bold text-[#ef4444] bg-[#fef2f2] px-2 py-0.5 rounded-full">❌ Expired</span>
//                       }
//                     </div>
//                     <div className="text-[#9ca3af]">Issued: <span className="text-[#374151]">{p.issue_date}</span></div>
//                     <div className="text-[#9ca3af]">Ref: <span className="font-mono text-[#6b7280]">{p.name}</span></div>
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
import logoImg from '../assets/logo.png'

interface Props { student: any }

export default function Passcard({ student }: Props) {
  const [passcard, setPasscard] = useState<any>(null)
  const [passcardHistory, setPasscardHistory] = useState<any[]>([]) 
  const [payments, setPayments] = useState<any[]>([]) 
  const [term, setTerm]         = useState<any>(null)
  const [feeStatus, setFeeStatus] = useState<any>(null)
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

      const [resTerm, resPass, resHistory, resPayments] = await Promise.all([
        fetch(`/api/method/hu_passcard_system.api.payment.get_term_info?student_id=${student.student_id}`, { headers }),
        fetch(`/api/method/hu_passcard_system.api.payment.get_student_passcard?student_id=${student.student_id}`, { headers }),
        fetch(`/api/method/hu_passcard_system.api.payment.get_all_student_passcards?student_id=${student.student_id}`, { headers }),
        fetch(`/api/method/hu_passcard_system.api.payment.get_student_payments?student_id=${student.student_id}`, { headers })
      ]);

      const dataTerm = await resTerm.json()
      const dataPass = await resPass.json()
      const dataHistory = await resHistory.json()
      const dataPayments = await resPayments.json()

      if (dataTerm.message?.term) setTerm(dataTerm.message.term)
      if (dataTerm.message?.fee_status) setFeeStatus(dataTerm.message.fee_status)
      
      if (dataPass.message?.passcard) {
        setPasscard(dataPass.message.passcard)
      } else {
        setError('No active passcard found for the current semester. Please complete your fee payment.')
      }

      if (dataHistory.message?.passcards) {
        setPasscardHistory(dataHistory.message.passcards)
      }

      if (dataPayments.message?.payments) {
        setPayments(dataPayments.message.payments)
      }

    } catch {
      setError('Failed to load passcard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const [downloadingHistoryId, setDownloadingHistoryId] = useState<string | null>(null)

  // Shared PDF generator — waits one animation frame so the browser fully
  // lays out the element before html2canvas captures it.
  function runPDF(element: HTMLElement, filename: string, onDone: () => void) {
    const opt = {
      margin:      0.2,
      filename,
      image:       { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, allowTaint: true },
      jsPDF:       { unit: 'in', format: 'letter', orientation: 'portrait' }
    }
    // rAF ensures the element is painted before capture
    requestAnimationFrame(() => {
      const timeout = setTimeout(onDone, 12000)
      ;(window as any).html2pdf().set(opt).from(element).save()
        .then(() => { clearTimeout(timeout); onDone() })
        .catch((err: any) => { console.error('PDF error:', err); clearTimeout(timeout); onDone() })
    })
  }

  function ensureHtml2pdf(cb: () => void) {
    if ((window as any).html2pdf) { cb(); return }
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
    script.onload = cb
    script.onerror = () => { alert('Failed to load PDF library. Check your internet connection.'); setDownloading(false); setDownloadingHistoryId(null) }
    document.body.appendChild(script)
  }

  // Download CURRENT passcard
  function handleDownload() {
    const element = document.getElementById('passcard-element')
    if (!element) return
    setDownloading(true)
    ensureHtml2pdf(() => runPDF(element, `HU_Passcard_${student.student_id}.pdf`, () => setDownloading(false)))
  }

  // Download a HISTORICAL passcard by building its card HTML off-screen
  function handleDownloadHistory(p: any) {
    setDownloadingHistoryId(p.name)

    // Determine phase flags for the historical passcard
    const ptLower = String(p.payment_type || '').toLowerCase()
    const histIsFinal = ptLower.includes('final')
    const histIsMid   = histIsFinal || ptLower.includes('mid') || ptLower.includes('month')

    const histPaymentsForTerm = payments.filter(pay => pay.academic_term === p.academic_term && pay.status === 'Paid')
    const histTotalPaid = histPaymentsForTerm.reduce((s: number, pay: any) => s + Number(pay.amount), 0)
    const histFormatted = p.issue_date
      ? new Date(p.issue_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : ''

    const histRemarkType = histIsFinal ? 'FINAL EXAM FEE' : histIsMid ? 'MID-TERM EXAM FEE' : 'FEE'
    const histSemester   = String(p.academic_term || '').toLowerCase().includes('2') ? 'SECOND SEMESTER' : 'FIRST SEMESTER'
    const histRemark     = `${histRemarkType} PAYMENT - ${histSemester}`

    // IMPORTANT: must be on-screen (opacity:0) not off-screen (left:-9999px).
    // html2canvas cannot capture elements outside the viewport — it gets a blank canvas.
    const wrapper = document.createElement('div')
    wrapper.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:800px',
      'background:white',
      'font-family:sans-serif',
      'opacity:0',               // invisible to the user
      'pointer-events:none',     // can't be clicked
      'z-index:-1',              // behind everything
      'overflow:visible',
    ].join(';')

    wrapper.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:40px;">
        <!-- Card front -->
        <div style="border:3px solid #000;display:flex;width:100%;">
          <div style="flex:1;padding:32px;display:flex;flex-direction:column;gap:20px;">
            <div style="display:flex;align-items:flex-start;gap:16px;">
              <div style="width:80px;height:80px;border:2px solid #15803d;display:flex;align-items:center;justify-content:center;font-weight:900;color:#15803d;font-size:22px;">HU</div>
              <div style="flex:1;text-align:center;">
                <div style="font-size:22px;font-weight:900;text-transform:uppercase;">HORMUUD UNIVERSITY</div>
                <div style="font-weight:700;font-size:13px;margin-top:4px;">Academic Year ${student.academic_year || '2025/2026'}</div>
                <div style="font-weight:700;font-size:14px;margin-top:2px;">Finance Clearance Card</div>
                <div style="background:#0ea5e9;color:#fff;font-weight:700;padding:4px 20px;display:inline-block;margin-top:4px;font-size:13px;text-transform:uppercase;letter-spacing:2px;">EXAMINATION CARD</div>
              </div>
            </div>
            <div style="font-size:14px;line-height:2.2;font-weight:500;">
              This card certified that Mr. / Mrs.
              <span style="border-bottom:1.5px solid #000;min-width:200px;display:inline-block;text-align:center;font-weight:700;font-style:italic;font-size:16px;">${student.full_name}</span><br/>
              ID No: <span style="border-bottom:1.5px solid #000;min-width:100px;display:inline-block;text-align:center;font-weight:700;font-size:16px;">${student.student_id}</span>
              Class: <span style="border-bottom:1.5px solid #000;min-width:120px;display:inline-block;text-align:center;font-weight:700;font-size:16px;text-transform:uppercase;">${student.batch || student.department || ''}</span>
              is eligible to attend this exam.
            </div>
            <div style="font-size:12px;font-weight:500;line-height:2;">
              <div>N.B: 1) Passcard-kan ardaygii uu ka lumo waa $5</div>
              <div style="margin-left:28px;">2) Passcard aan sax ahayn ardaygii lagu arko waxaa laga joojinayaa imtixaanka.</div>
            </div>
          </div>
          <!-- Right stamps column -->
          <div style="width:200px;border-left:3px solid #000;display:flex;flex-direction:column;">
            <!-- Mid-term stamp -->
            <div style="flex:1;border-bottom:3px solid #000;display:flex;flex-direction:column;">
              <div style="border-bottom:3px solid #000;padding:6px 12px;display:flex;justify-content:space-between;font-weight:700;font-size:13px;">
                <span>Date:</span>
                <span style="border-bottom:1px solid #000;min-width:80px;text-align:center;">${histIsMid ? histFormatted : ''}</span>
              </div>
              <div style="flex:1;position:relative;display:flex;align-items:center;justify-content:center;min-height:140px;">
                <div style="position:absolute;top:8px;left:8px;border:1px solid #000;font-size:10px;padding:2px 6px;font-weight:600;color:#374151;">March-May</div>
                <div style="width:110px;height:110px;border-radius:50%;border:1.5px solid #000;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:700;font-size:15px;text-transform:uppercase;line-height:1.3;">Mid-Term<br/>Exam</div>
                ${histIsMid ? `
                <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
                  <div style="border:4px solid #1e40af;color:#1e40af;width:135px;height:135px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(-15deg);">
                    <div style="font-size:9px;font-weight:700;text-align:center;text-transform:uppercase;letter-spacing:2px;margin-top:8px;">Hormuud University</div>
                    <span style="font-weight:900;font-size:28px;letter-spacing:4px;border-top:3px solid #1e40af;border-bottom:3px solid #1e40af;padding:2px 8px;width:100%;text-align:center;background:rgba(255,255,255,0.4);">PAID</span>
                    <div style="font-size:9px;font-weight:700;text-align:center;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">Finance Office</div>
                  </div>
                </div>` : ''}
              </div>
            </div>
            <!-- Final stamp -->
            <div style="flex:1;display:flex;flex-direction:column;">
              <div style="border-bottom:3px solid #000;padding:6px 12px;display:flex;justify-content:space-between;font-weight:700;font-size:13px;">
                <span>Date:</span>
                <span style="border-bottom:1px solid #000;min-width:80px;text-align:center;">${histIsFinal ? histFormatted : ''}</span>
              </div>
              <div style="flex:1;position:relative;display:flex;align-items:center;justify-content:center;min-height:140px;">
                <div style="position:absolute;top:8px;left:8px;border:1px solid #000;font-size:10px;padding:2px 6px;font-weight:600;color:#374151;">June-July</div>
                <div style="width:110px;height:110px;border-radius:50%;border:1.5px solid #000;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:700;font-size:15px;text-transform:uppercase;line-height:1.3;">Final<br/>Exam</div>
                ${histIsFinal ? `
                <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
                  <div style="border:4px solid #1e40af;color:#1e40af;width:135px;height:135px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(-15deg);">
                    <div style="font-size:9px;font-weight:700;text-align:center;text-transform:uppercase;letter-spacing:2px;margin-top:8px;">Hormuud University</div>
                    <span style="font-weight:900;font-size:28px;letter-spacing:4px;border-top:3px solid #1e40af;border-bottom:3px solid #1e40af;padding:2px 8px;width:100%;text-align:center;background:rgba(255,255,255,0.4);">PAID</span>
                    <div style="font-size:9px;font-weight:700;text-align:center;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">Finance Office</div>
                  </div>
                </div>` : ''}
              </div>
            </div>
          </div>
        </div>

        <!-- Receipt -->
        <div style="border:2px solid #9ca3af;padding:40px;position:relative;overflow:hidden;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="font-size:18px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Hormuud University</div>
            <div style="font-size:11px;font-weight:600;">Address: Mogadisho- Wadajir</div>
            <div style="font-size:11px;font-weight:600;">Tel: 858117</div>
            <div style="font-size:11px;font-weight:600;">Email: finance@hu.edu.so</div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:24px;">
            <span style="font-size:18px;font-weight:700;text-decoration:underline;">Receipt Voucher</span>
            <span style="font-size:11px;font-weight:700;background:#f3f4f6;padding:4px 8px;border:1px solid #e5e7eb;">Ref No: ${p.transaction_id || p.name}</span>
          </div>
          <div style="display:flex;justify-content:flex-end;margin-bottom:16px;">
            <div style="width:240px;">
              <div style="display:flex;justify-content:space-between;border-bottom:1px dashed #000;padding-bottom:4px;margin-bottom:8px;font-weight:700;font-size:13px;">
                <span>Amount Paid:</span><span>$${Number(histTotalPaid || p.amount_paid || 0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:4})}</span>
              </div>
              <div style="display:flex;justify-content:space-between;border-bottom:1px dashed #000;padding-bottom:4px;font-weight:700;font-size:13px;">
                <span>Date:</span><span>${histFormatted}</span>
              </div>
            </div>
          </div>
          <div style="display:flex;border-bottom:1px dashed #000;padding-bottom:4px;margin-bottom:8px;font-weight:700;font-size:13px;">
            <span style="width:128px;">Received From:</span><span style="text-transform:uppercase;">${student.full_name}</span>
          </div>
          <div style="display:flex;gap:40px;margin-bottom:8px;">
            <div style="display:flex;flex:1;border-bottom:1px dashed #000;padding-bottom:4px;font-weight:700;font-size:13px;">
              <span style="width:80px;">ID No:</span><span>${student.student_id}</span>
            </div>
            <div style="display:flex;flex:1;border-bottom:1px dashed #000;padding-bottom:4px;font-weight:700;font-size:13px;">
              <span style="width:80px;">Class:</span><span style="text-transform:uppercase;">${student.batch || student.department || ''}</span>
            </div>
          </div>
          <div style="display:flex;border-bottom:1px dashed #000;padding-bottom:4px;margin-bottom:8px;font-weight:700;font-size:13px;">
            <span style="width:128px;">Remark:</span><span style="text-transform:uppercase;">${histRemark}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding-top:64px;padding-bottom:16px;">
            <div style="text-align:center;width:40%;border-top:2px solid #000;padding-top:4px;font-weight:700;font-size:13px;">Receiver By</div>
            <div style="text-align:center;width:40%;border-top:2px solid #000;padding-top:4px;font-weight:700;font-size:13px;">Cashier/Accountant By</div>
          </div>
          <!-- PAID stamp -->
          <div style="position:absolute;bottom:48px;right:64px;">
            <div style="border:4px solid #1e40af;color:#1e40af;width:128px;height:128px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(-20deg);">
              <div style="font-size:9px;font-weight:700;text-align:center;text-transform:uppercase;letter-spacing:2px;margin-top:6px;">Hormuud University</div>
              <span style="font-weight:900;font-size:28px;letter-spacing:4px;border-top:2px solid #1e40af;border-bottom:2px solid #1e40af;padding:2px 8px;width:100%;text-align:center;background:rgba(255,255,255,0.4);">PAID</span>
              <div style="font-size:9px;font-weight:700;text-align:center;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">Finance Office</div>
            </div>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(wrapper)

    const done = () => {
      // small delay before removing so the PDF save has finished
      setTimeout(() => {
        if (document.body.contains(wrapper)) document.body.removeChild(wrapper)
        setDownloadingHistoryId(null)
      }, 300)
    }

    ensureHtml2pdf(() =>
      runPDF(wrapper, `HU_Passcard_${student.student_id}_${p.academic_term}_${p.payment_type}.pdf`, done)
    )
  }

  const formattedIssueDate = passcard?.issue_date 
    ? new Date(passcard.issue_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) 
    : '';

  let activeSemesterName = "FIRST SEMESTER";
  if (term?.term_name) {
    const nameStr = String(term.term_name).toLowerCase();
    if (nameStr.includes('2') || nameStr.includes('second')) {
        activeSemesterName = "SECOND SEMESTER";
    }
  }

  // Dynamic Phase & Title Generation
  // Use feeStatus from backend as the single source of truth.
  // feeStatus.final_paid = true when:  explicit Final payment, OR mid+months >= semester fee
  // feeStatus.mid_term_paid = true when: explicit Mid term, OR months >= half
  const termPayments = payments.filter(p => p.academic_term === passcard?.academic_term && p.status === 'Paid');
  const totalPaidForTerm = termPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const paidMonthsCount = termPayments.filter(p => p.payment_type === 'Month').length;
  const totalMonthsCount = term?.months?.length || 6;
  
  const hasFinalPayment = termPayments.some(p => p.payment_type === 'Final');
  const hasMidPayment   = termPayments.some(p => p.payment_type === 'Mid term');
  const halfMonthsCount  = Math.ceil(totalMonthsCount / 2);

  // PRIMARY: trust backend feeStatus; FALLBACK: derive from payment records locally
  const isFinalPhase = feeStatus
    ? Boolean(feeStatus.final_paid)
    : hasFinalPayment || paidMonthsCount >= totalMonthsCount || String(passcard?.payment_type).toLowerCase().includes('final')

  const isMidPhase = feeStatus
    ? Boolean(feeStatus.mid_term_paid)
    : hasMidPayment || paidMonthsCount >= halfMonthsCount || String(passcard?.payment_type).toLowerCase().includes('mid')

  // Receipt remark: use isFinalPhase/isMidPhase which now come from backend
  let receiptRemarkType = "FEE"
  if (isFinalPhase) {
    receiptRemarkType = "FINAL EXAM FEE"
  } else if (isMidPhase) {
    receiptRemarkType = "MID-TERM EXAM FEE"
  } else {
    receiptRemarkType = String(passcard?.payment_type || "FEE").toUpperCase()
  }
  
  const receiptRemark = `${receiptRemarkType} PAYMENT - ${activeSemesterName}`;
  const receiptAmount = totalPaidForTerm > 0 ? totalPaidForTerm : Number(passcard?.amount_paid || 0);

  // Manage Stamps
  const showMidTermStamp = isMidPhase || isFinalPhase || String(passcard?.payment_type).toLowerCase().includes('month');
  const showFinalStamp   = isFinalPhase;

  let examYear = new Date().getFullYear().toString();
  if (term?.end_date) {
    examYear = new Date(term.end_date).getFullYear().toString();
  } else if (student?.academic_year) {
    const yearMatch = student.academic_year.match(/\d{4}/g);
    if (yearMatch) examYear = yearMatch[yearMatch.length - 1]; 
  }

  const formatCurrency = (val: number) => {
    return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] pb-10">
      <nav className="bg-[#ffffff] border-b border-[#e5e7eb] sticky top-0 z-50 shadow-sm print:hidden">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#1e40af] rounded-lg flex items-center justify-center text-[#ffffff] font-bold text-xs">HU</div>
            <span className="text-[#1e40af] font-bold text-base">Student Portal</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            <Link to="/dashboard" className="px-4 py-2 text-sm font-medium text-[#6b7280] hover:text-[#1e40af] hover:bg-[#eff6ff] rounded-lg transition-colors">Dashboard</Link>
            <Link to="/pay-fee" className="px-4 py-2 text-sm font-medium text-[#6b7280] hover:text-[#1e40af] hover:bg-[#eff6ff] rounded-lg transition-colors">Pay Fee</Link>
            <Link to="/passcard" className="px-4 py-2 text-sm font-semibold text-[#1e40af] bg-[#eff6ff] rounded-lg">Passcard</Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#dbeafe] text-[#1e40af] font-bold text-sm flex items-center justify-center">{initials}</div>
          </div>
        </div>

        <div className="md:hidden border-t border-[#f3f4f6] flex print:hidden">
          <Link to="/dashboard" className="flex-1 text-center py-2 text-xs font-medium text-[#6b7280]">Dashboard</Link>
          <Link to="/pay-fee"   className="flex-1 text-center py-2 text-xs font-medium text-[#6b7280]">Pay Fee</Link>
          <Link to="/passcard"  className="flex-1 text-center py-2 text-xs font-semibold text-[#1e40af] bg-[#eff6ff]">Passcard</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 mt-10">
        <div className="flex justify-between items-end mb-6 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-[#111827] mb-1">🪪 Exam Passcard</h1>
            <p className="text-sm text-[#6b7280]">Your official digital examination card & receipt</p>
          </div>
          
          {passcard && !loading && !error && (
            <button 
              onClick={handleDownload} 
              disabled={downloading}
              className="hidden md:block bg-[#1e40af] hover:bg-[#1e3a8a] disabled:bg-[#60a5fa] text-[#ffffff] text-xs font-bold py-2.5 px-5 rounded-lg shadow-sm transition-colors"
            >
              {downloading ? '⏳ Preparing PDF...' : '⬇️ Download PDF'}
            </button>
          )}
        </div>

        {loading ? (
          <div className="bg-[#ffffff] border border-[#e5e7eb] rounded-xl p-12 text-center shadow-sm print:hidden">
            <p className="text-[#9ca3af] text-sm mt-3">Loading your passcard…</p>
          </div>
        ) : error && !passcard ? (
          <div className="bg-[#ffffff] border border-[#e5e7eb] rounded-xl p-8 text-center shadow-sm print:hidden">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-lg font-bold text-[#1f2937] mb-2">No Passcard Available</h2>
            <p className="text-sm text-[#6b7280] mb-6">{error}</p>
            <Link to="/pay-fee" className="inline-block bg-[#1e40af] text-[#ffffff] text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-[#1e3a8a] transition-colors">Pay Fee to Get Passcard →</Link>
          </div>
        ) : passcard ? (
          
          <div id="passcard-element" className="flex flex-col gap-10">
            
            {/* ── PAGE 1: FRONT PASSCARD (NO TAILWIND SHADOWS OR OPACITY) ── */}
            <div className="bg-[#ffffff] border-[3px] border-[#000000] flex w-full font-sans text-[#000000]">
              
              {/* Left Main Column */}
              <div className="flex-1 p-5 md:p-8 flex flex-col justify-between">
                
                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                  {/* HU Green Logo Replica */}
                  <div className="w-24 h-24 border-[3px] border-[#15803d] flex flex-col justify-center items-center text-[#15803d] bg-[#ffffff] shrink-0 rounded-sm">
                     <img 
                      src={logoImg} 
                      alt="Hormuud University Logo" 
                      className="w-full h-full object-contain"
                      crossOrigin="anonymous" 
                    />
                  </div>
                  
                  {/* Titles */}
                  <div className="flex-1 text-center pt-2 font-serif">
                    <h1 className="text-2xl md:text-[26px] font-black uppercase tracking-tight text-[#1f2937]">HORMUUD UNIVERSITY</h1>
                    <p className="font-bold text-sm mt-1 text-[#374151]">Academic Year {student.academic_year || '2025/2026 B'}</p>
                    <p className="font-bold text-[15px] mt-1 text-[#374151]">Finance Clearance Card</p>
                    <div className="bg-[#0ea5e9] text-[#ffffff] font-bold px-5 py-1 inline-block mt-1 text-sm uppercase tracking-wider">
                      EXAMINATION CARD
                    </div>
                  </div>
                </div>

                {/* Text Block matching the handwriting lines */}
                <div className="text-sm md:text-[15px] leading-9 font-medium mb-6">
                  This card certified that Mr. / Mrs. 
                  <span className="inline-block border-b-[1.5px] border-[#000000] min-w-[200px] px-2 text-center font-bold font-serif italic text-lg">{student.full_name}</span>
                  <br/>
                  ID No: <span className="inline-block border-b-[1.5px] border-[#000000] min-w-[100px] px-2 text-center font-bold font-serif text-lg">{student.student_id}</span> 
                  Class: <span className="inline-block border-b-[1.5px] border-[#000000] min-w-[120px] px-2 text-center font-bold font-serif text-lg uppercase">{student.batch || student.department}</span> 
                  is eligible to attend this exam.
                </div>

                {/* N.B block */}
                <div className="text-xs md:text-[13px] space-y-2.5 font-medium mb-4">
                  <p>N.B: 1) Passcard-kan ardaygii uu ka lumo waa $5</p>
                  <p className="ml-7">2) Passcard aan sax ahayn ardaygii lagu arko waxaa laga joojinayaa<br/>imtixaanka.</p>
                </div>
              </div>

              {/* Right Sidebar Column (The Stamps Grid) */}
              <div className="w-48 md:w-56 border-l-[3px] border-[#000000] flex flex-col shrink-0 bg-[#ffffff]">
                
                {/* Mid Term Section */}
                <div className="flex-1 border-b-[3px] border-[#000000] flex flex-col">
                  {/* Date Line */}
                  <div className="border-b-[3px] border-[#000000] p-1.5 px-3 flex justify-between items-center text-sm font-bold">
                    <span>Date:</span>
                    <span className="border-b border-[#000000] min-w-[80px] text-center inline-block">
                      {showMidTermStamp ? formattedIssueDate : `___/___/${examYear}`}
                    </span>
                  </div>
                  
                  {/* Circle Box */}
                  <div className="flex-1 relative p-3 flex items-center justify-center min-h-[140px]">
                    <div className="absolute top-2 left-2 border border-[#000000] text-[10px] px-1.5 py-0.5 font-semibold text-[#374151]">
                      March-May
                    </div>
                    <div className="w-[110px] h-[110px] rounded-full border-[1.5px] border-[#000000] flex items-center justify-center text-center text-lg font-bold uppercase leading-tight">
                      Mid-Term<br/>Exam
                    </div>
                    
                    {/* Blue PAID Stamp Overlay (NO TAILWIND OPACITY/TRANSPARENT CLASSES) */}
                    {showMidTermStamp && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                         <div className="border-[4px] border-[#1e40af] text-[#1e40af] w-[135px] h-[135px] rounded-full flex flex-col items-center justify-center relative transform -rotate-[15deg]">
                           <div className="text-[9px] font-bold text-center uppercase tracking-widest mt-2">Hormuud University</div>
                           <span className="font-black text-4xl tracking-widest my-0.5 border-y-[3px] border-[#1e40af] px-4 w-full text-center" style={{ backgroundColor: "rgba(255, 255, 255, 0.4)" }}>PAID</span>
                           <div className="text-[9px] font-bold text-center uppercase tracking-widest mb-2">Finance Office</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Final Section */}
                <div className="flex-1 flex flex-col">
                  {/* Date Line */}
                  <div className="border-b-[3px] border-[#000000] p-1.5 px-3 flex justify-between items-center text-sm font-bold">
                    <span>Date:</span>
                    <span className="border-b border-[#000000] min-w-[80px] text-center inline-block">
                      {showFinalStamp ? formattedIssueDate : `___/___/${examYear}`}
                    </span>
                  </div>
                  
                  {/* Circle Box */}
                  <div className="flex-1 relative p-3 flex items-center justify-center min-h-[140px]">
                    <div className="absolute top-2 left-2 border border-[#000000] text-[10px] px-1.5 py-0.5 font-semibold text-[#374151]">
                      June-July
                    </div>
                    <div className="w-[110px] h-[110px] rounded-full border-[1.5px] border-[#000000] flex items-center justify-center text-center text-[19px] font-bold uppercase leading-tight">
                      Final<br/>Exam
                    </div>
                    
                    {/* Blue PAID Stamp Overlay (NO TAILWIND OPACITY/TRANSPARENT CLASSES) */}
                    {showFinalStamp && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                         <div className="border-[4px] border-[#1e40af] text-[#1e40af] w-[135px] h-[135px] rounded-full flex flex-col items-center justify-center relative transform -rotate-[15deg]">
                           <div className="text-[9px] font-bold text-center uppercase tracking-widest mt-2">Hormuud University</div>
                           <span className="font-black text-4xl tracking-widest my-0.5 border-y-[3px] border-[#1e40af] px-4 w-full text-center" style={{ backgroundColor: "rgba(255, 255, 255, 0.4)" }}>PAID</span>
                           <div className="text-[9px] font-bold text-center uppercase tracking-widest mb-2">Finance Office</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* ── PDF PAGE BREAK MAGIC ── */}
            <div className="html2pdf__page-break"></div>

            {/* ── PAGE 2: RECEIPT VOUCHER (BACK) ── */}
            <div className="bg-[#ffffff] border-2 border-[#9ca3af] p-6 md:p-10 relative overflow-hidden text-[#000000] font-sans">
              
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold uppercase tracking-wide">Hormuud University</h2>
                <p className="text-xs font-semibold">Address: Mogadisho- Wadajir</p>
                <p className="text-xs font-semibold">Tel: 858117</p>
                <p className="text-xs font-semibold">Email: finance@hu.edu.so</p>
              </div>

              <div className="flex justify-between items-end border-b-2 border-[#000000] pb-2 mb-6">
                <h3 className="text-xl font-bold underline underline-offset-4">Receipt Voucher</h3>
                <span className="text-xs font-bold bg-[#f3f4f6] px-2 py-1 border border-[#e5e7eb]">Ref No: {passcard.transaction_id || passcard.name}</span>
              </div>

              <div className="space-y-5 text-sm font-bold tracking-wide">
                
                <div className="flex justify-end mb-4">
                   <div className="w-1/2 md:w-1/3 space-y-3">
                      <div className="flex justify-between border-b border-[#000000] border-dashed pb-1">
                        <span className="pr-2">Amount Paid:</span> 
                        <span>${formatCurrency(receiptAmount)}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#000000] border-dashed pb-1">
                        <span className="pr-2">Date:</span> 
                        <span>{formattedIssueDate}</span>
                      </div>
                   </div>
                </div>

                <div className="flex border-b border-[#000000] border-dashed pb-1">
                  <span className="w-32 inline-block">Received From:</span>
                  <span className="uppercase text-[#1f2937]">{student.full_name}</span>
                </div>
                
                <div className="flex flex-col md:flex-row gap-5 md:gap-10">
                  <div className="flex flex-1 border-b border-[#000000] border-dashed pb-1">
                    <span className="w-32 md:w-20 inline-block">ID No:</span>
                    <span className="uppercase text-[#1f2937]">{student.student_id}</span>
                  </div>
                  <div className="flex flex-1 border-b border-[#000000] border-dashed pb-1">
                    <span className="w-32 md:w-20 inline-block">Class:</span>
                    <span className="uppercase text-[#1f2937]">{student.batch || student.department}</span>
                  </div>
                </div>

                <div className="flex border-b border-[#000000] border-dashed pb-1">
                  <span className="w-32 inline-block">Remark:</span>
                  <span className="uppercase text-[#1f2937]">{receiptRemark}</span>
                </div>

                <div className="flex justify-between pt-16 pb-4">
                  <div className="text-center w-[40%] border-t-2 border-[#000000] pt-1">Receiver By</div>
                  <div className="text-center w-[40%] border-t-2 border-[#000000] pt-1">Cashier/Accountant By</div>
                </div>
              </div>

              {/* Replica Blue PAID Stamp for Receipt */}
              <div className="absolute bottom-12 right-8 md:right-16 flex items-center justify-center pointer-events-none z-10">
                <div className="border-4 border-[#1e40af] text-[#1e40af] w-32 h-32 rounded-full flex flex-col items-center justify-center relative transform -rotate-[20deg]">
                   <div className="text-[9px] font-bold text-center uppercase tracking-widest mt-1">Hormuud University</div>
                   <span className="font-black text-4xl tracking-widest my-1 border-y-2 border-[#1e40af] px-4 w-full text-center" style={{ backgroundColor: "rgba(255, 255, 255, 0.4)" }}>PAID</span>
                   <div className="text-[9px] font-bold text-center uppercase tracking-widest mb-1">Finance Office</div>
                </div>
              </div>

            </div>
          </div>
        ) : null}

        {/* ── PASSCARD HISTORY SECTION ── */}
        {!loading && passcardHistory.length > 0 && (
          <div className="mt-10 print:hidden">
            <h2 className="text-sm font-bold text-[#374151] mb-4 uppercase tracking-wider">Passcard History</h2>
            <div className="space-y-3">
              {passcardHistory.map((p, index) => (
                <div key={index} className={`bg-[#ffffff] border ${p.name === passcard?.name ? 'border-[#93c5fd] ring-2 ring-[#eff6ff]' : 'border-[#e5e7eb]'} rounded-xl p-4 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-3`}>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-[#1f2937]">{p.academic_term}</span>
                      {p.name === passcard?.name && (
                        <span className="text-[10px] font-bold bg-[#dbeafe] text-[#1d4ed8] px-2 py-0.5 rounded-full uppercase">Current</span>
                      )}
                    </div>
                    <div className="text-xs text-[#6b7280] font-medium">
                      Payment Type: <span className="text-[#374151] font-bold">{p.payment_type} Exams</span>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex flex-col md:items-end text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[#9ca3af]">Status:</span>
                        {p.is_valid === 1 
                          ? <span className="font-bold text-[#16a34a] bg-[#f0fdf4] px-2 py-0.5 rounded-full">✅ Valid</span>
                          : <span className="font-bold text-[#ef4444] bg-[#fef2f2] px-2 py-0.5 rounded-full">❌ Expired</span>
                        }
                      </div>
                      <div className="text-[#9ca3af]">Issued: <span className="text-[#374151]">{p.issue_date}</span></div>
                      <div className="text-[#9ca3af]">Ref: <span className="font-mono text-[#6b7280]">{p.name}</span></div>
                    </div>

                    {/* ── Download button for this historical passcard ── */}
                    <button
                      onClick={() => handleDownloadHistory(p)}
                      disabled={downloadingHistoryId === p.name}
                      className="flex items-center gap-1.5 bg-[#1e40af] hover:bg-[#1e3a8a] disabled:bg-[#60a5fa] text-[#ffffff] text-xs font-bold py-2 px-4 rounded-lg transition-colors whitespace-nowrap"
                    >
                      {downloadingHistoryId === p.name ? '⏳ Preparing...' : '⬇️ Download PDF'}
                    </button>
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