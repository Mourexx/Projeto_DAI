import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../Context/AuthContext'

export default function AuthPage() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ email: '', full_name: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        await register(form.email, form.full_name, form.password)
      }
      navigate('/')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (detail === 'Email já registado') setError('Este email já tem conta. Faz login.')
      else if (err.response?.status === 401) setError('Email ou password incorretos.')
      else setError('Ocorreu um erro. Tenta novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🚌</div>
          <h1 className="text-2xl font-bold text-gray-800">TUB — Transportes Urbanos</h1>
          <p className="text-sm text-gray-400 mt-1">Plataforma de Gestão Urbana</p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
          <button
            onClick={() => { setMode('login'); setError('') }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              mode === 'login' ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Iniciar Sessão
          </button>
          <button
            onClick={() => { setMode('register'); setError('') }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              mode === 'register' ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Criar Conta
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handle}
                placeholder="João Silva"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handle}
              required
              placeholder="email@exemplo.pt"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handle}
              required
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? 'A processar...' : mode === 'login' ? 'Entrar' : 'Criar Conta'}
          </button>
        </form>
      </div>
    </div>
  )
}
