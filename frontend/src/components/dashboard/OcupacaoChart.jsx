import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { statsApi } from '../../services/api'

const getCor = (v) => {
  if (v >= 85) return '#ef4444'
  if (v >= 65) return '#f59e0b'
  return '#22c55e'
}

export default function OcupacaoChart() {
  const [dados, setDados] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    statsApi.getOccupancy()
      .then(res => {
        const d = res.data.map(t => ({
          linha: t.line,
          ocupacao: t.occupancy_pct,
          nome: t.name,
        }))
        setDados(d)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-700">Ocupação por Veículo (%)</h3>
        <div className="flex gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Normal</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />Cheio</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Lotado</span>
        </div>
      </div>
      {loading ? (
        <div className="h-[240px] flex items-center justify-center text-gray-400 text-sm">A carregar...</div>
      ) : dados.length === 0 ? (
        <div className="h-[240px] flex items-center justify-center text-gray-400 text-sm">
          Sem dados de ocupação. Adicione transportes primeiro.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={dados} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="linha" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
            <Tooltip
              contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb' }}
              formatter={(v, _, props) => [`${v}% — ${props.payload.nome}`, 'Ocupação']}
            />
            <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="4 4"
              label={{ value: '85%', fontSize: 11, fill: '#ef4444' }} />
            <Bar dataKey="ocupacao" radius={[6, 6, 0, 0]}>
              {dados.map((entry, i) => (
                <Cell key={i} fill={getCor(entry.ocupacao)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
