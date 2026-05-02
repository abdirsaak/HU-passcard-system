import { useState, FormEvent } from 'react'

interface Props {
  onLogin: (student: any) => void
}

export default function Login({ onLogin }: Props) {
  const [studentId, setStudentId] = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(
        `/api/method/hu_passcard_system.doctype.student.student.student_login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Frappe-CSRF-Token': (window as any).csrf_token || 'fetch',
          },
          body: JSON.stringify({ student_id: studentId, password }),
        }
      )

      const data = await res.json()

      if (!res.ok || data.exc) {
        const msg = data._server_messages
          ? JSON.parse(JSON.parse(data._server_messages)[0]).message
          : 'Login failed. Check your credentials.'
        setError(msg)
      } else {
        onLogin(data.message.student)
      }
    } catch {
      setError('Network error. Make sure Frappe is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-blue-700 to-blue-400 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0">
            HU
          </div>
          <div>
            <div className="text-blue-600 font-bold text-lg leading-tight">Student Portal</div>
            <div className="text-gray-400 text-xs">Hargeisa University</div>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
        <p className="text-sm text-gray-500 mb-6">Sign in with your student credentials</p>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-600 rounded-lg px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Student ID */}
          <div>
            <label htmlFor="sid" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Student ID
            </label>
            <input
              id="sid"
              type="text"
              placeholder="e.g. HU-00001"
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              required
              className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="pwd" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Password
            </label>
            <input
              id="pwd"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold rounded-xl py-3 text-sm transition-colors mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Signing in…
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by <span className="text-blue-600 font-semibold">Frappe</span>
        </p>
      </div>
    </div>
  )
}