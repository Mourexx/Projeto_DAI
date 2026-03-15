import { useState } from 'react'
import { useAuth } from '../Context/AuthContext'
import api from '../services/api'

export default function Profile() {
  const { user, logout } = useAuth()
  const [form, setForm] = useState({ full_name: user?.full_name || '', password: '', confirm: '' })
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setMsg(null)
    if (form.password && form.password !== form.confirm) {
      setMsg({ type: 'error', text: 'As passwords não coincidem.' })
      return
    }
    setLoading(true)
    try {
      const payload = { full_name: form.full_name }
      if (form.password) payload.password = form.password
      await api.patch('/users/me', payload)
      setMsg({ type: 'success', text: 'Perfil atualizado com sucesso.' })
      setForm(f => ({ ...f, password: '', confirm: '' }))
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.detail || 'Erro ao atualizar.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">O Meu Perfil</h1>
        <p className="text-sm text-gray-400 mt-1">Consultar e editar informações da conta</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cartão de info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm text-center">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👤</span>
          </div>
          <p className="font-bold text-gray-800 text-lg">{user?.full_name || 'Sem nome'}</p>
          <p className="text-sm text-gray-400 mt-1">{user?.email}</p>
          <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium ${user?.is_admin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-600'}`}>
            {user?.is_admin ? '🛡️ Administrador' : '👤 Utilizador'}
          </span>
        </div>

        {/* Formulário */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-5">Editar Dados</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input disabled value={user?.email || ''}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input type="text" value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Alterar Password <span className="text-gray-400 font-normal">(opcional)</span></p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nova Password</label>
                  <input type="password" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Confirmar</label>
                  <input type="password" value={form.confirm}
                    onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="••••••••" />
                </div>
              </div>
            </div>

            {msg && (
              <div className={`px-4 py-3 rounded-xl text-sm border ${msg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                {msg.text}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60">
              {loading ? 'A guardar...' : 'Guardar Alterações'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
