import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { statsApi } from '../../services/api'

export default function PassageirosChart() {
  const [dados, setDados] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      statsApi.getTicketsByType(),
      statsApi.getViagens(),
    ])
      .then(([typeRes, viagRes]) => {
        // Bilhetes por tipo
        const tipoLabel = { single: 'Simples', daily: 'Diário', monthly: 'Mensal' }
        const d = typeRes.data.map(r => ({
          tipo: tipoLabel[r.type] || r.type,
          quantidade: r.count,
        }))
        setDados(d)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-700 mb-4">Bilhetes Vendidos por Tipo</h3>
      {loading ? (
        <div className="h-[240px] flex items-center justify-center text-gray-400 text-sm">A carregar...</div>
      ) : dados.length === 0 ? (
        <div className="h-[240px] flex items-center justify-center text-gray-400 text-sm">
          Sem bilhetes vendidos ainda.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={dados} barSize={48}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="tipo" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb' }}
              formatter={(v) => [`${v} bilhetes`, 'Quantidade']}
            />
            <Legend />
            <Bar dataKey="quantidade" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Bilhetes" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
