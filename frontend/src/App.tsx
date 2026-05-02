import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

export default function App() {
  const [student, setStudent] = useState<any>(null)

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            student ? <Navigate to="/dashboard" replace /> : <Login onLogin={setStudent} />
          }
        />
        <Route
          path="/dashboard"
          element={
            student ? <Dashboard student={student} onLogout={() => setStudent(null)} /> : <Navigate to="/login" replace />
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}