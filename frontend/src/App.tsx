// import { useState } from 'react'
// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
// import Login from './pages/Login'
// import Dashboard from './pages/Dashboard'


// export default function App() {
//   const [student, setStudent] = useState<any>(null)

//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route
//           path="/login"
//           element={
//             student ? <Navigate to="/dashboard" replace /> : <Login onLogin={setStudent} />
//           }
//         />
//         <Route
//           path="/dashboard"
//           element={
//             student ? <Dashboard student={student} onLogout={() => setStudent(null)} /> : <Navigate to="/login" replace />
//           }
//         />
//         <Route path="*" element={<Navigate to="/login" replace />} />
//       </Routes>
//     </BrowserRouter>
//   )
// }





import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PayFee from './pages/PayFee'
import Passcard from './pages/Passcard'

export default function App() {
  // ✅ Persist login across page refresh
  const [student, setStudent] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('hu_student')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })

  function handleLogin(data: any) {
    localStorage.setItem('hu_student', JSON.stringify(data))
    setStudent(data)
  }

  function handleLogout() {
    localStorage.removeItem('hu_student')
    setStudent(null)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"     element={!student ? <Login onLogin={handleLogin} />                              : <Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={ student  ? <Dashboard student={student} onLogout={handleLogout} />     : <Navigate to="/login" replace />} />
        <Route path="/pay-fee"   element={ student  ? <PayFee   student={student} />                              : <Navigate to="/login" replace />} />
        <Route path="/passcard"  element={ student  ? <Passcard student={student} />                              : <Navigate to="/login" replace />} />
        <Route path="*"          element={<Navigate to={student ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  )
}