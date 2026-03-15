import { useEffect, useState } from 'react'
import api from '../services/api'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)

  const fetchUsers = () => {
    setLoading(true)
    api.get('/users/')
      .then(res => setUsers(res.data))
      .catch(() => setMsg({ type: 'error', text: 'Erro ao carregar utilizadores.' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const toggleAdmin = async (user) => {
    try {
      await api.patch(`/users/${user.id}/permissions?is_admin=${!user.is_admin}`)
      setMsg({ type: 'success', text: `Permissões de ${user.email} atualizadas.` })
      fetchUsers()
    } catch {
      setMsg({ type: 'error', text: 'Erro ao atualizar permissões.' })
    }
  }

  const deactivate = async (user) => {
    if (!confirm(`Desativar a conta de ${user.email}?`)) return
    try {
      await api.delete(`/users/${user.id}`)
      setMsg({ type: 'success', text: 'Conta desativada.' })
      fetchUsers()
    } catch {
      setMsg({ type: 'error', text: 'Erro ao desativar conta.' })
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestão de Utilizadores</h1>
        <p className="text-sm text-gray-400 mt-1">Gerir permissões e contas — apenas administradores</p>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm border ${msg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
          {msg.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">Utilizadores Registados</h2>
          <span className="text-xs text-gray-400">{users.length} utilizador(es)</span>
        </div>
        {loading ? (
          <p className="text-center text-gray-400 py-12">A carregar...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100 bg-gray-50 text-xs uppercase">
                <th className="px-6 py-3">Nome</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Papel</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{u.full_name || '—'}</td>
                  <td className="px-6 py-4 text-gray-500">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_admin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.is_admin ? '🛡️ Admin' : '👤 Utilizador'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                      {u.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => toggleAdmin(u)}
                        className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 px-2 py-1 rounded-lg transition-colors">
                        {u.is_admin ? 'Retirar Admin' : 'Tornar Admin'}
                      </button>
                      {u.is_active && (
                        <button onClick={() => deactivate(u)}
                          className="text-xs bg-red-100 text-red-600 hover:bg-red-200 px-2 py-1 rounded-lg transition-colors">
                          Desativar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
