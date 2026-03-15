import { useState, useEffect } from 'react'
import { statsApi } from '../services/api'
import KPICard from '../components/dashboard/KPICard'
import PassageirosChart from '../components/dashboard/PassageirosChart'
import OcupacaoChart from '../components/dashboard/OcupacaoChart'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const agora = new Date().toLocaleString('pt-PT', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  useEffect(() => {
    statsApi.getOverview()
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard — TUB</h1>
        <p className="text-sm text-gray-400 mt-1 capitalize">{agora}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border bg-white p-5 h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <KPICard
            titulo="Total de Bilhetes"
            valor={stats?.total_tickets ?? '—'}
            subtitulo={`${stats?.active_tickets ?? 0} ativos`}
            icone="🎫"
            cor="blue"
          />
          <KPICard
            titulo="Receita Total"
            valor={`${(stats?.total_revenue ?? 0).toFixed(2)} €`}
            subtitulo="Acumulado"
            icone="💶"
            cor="green"
          />
          <KPICard
            titulo="Transportes Ativos"
            valor={stats?.active_transports ?? '—'}
            subtitulo="Veículos em operação"
            icone="🚌"
            cor="yellow"
          />
          <KPICard
            titulo="Viagens em Curso"
            valor={stats?.viagens_em_curso ?? '—'}
            subtitulo="Neste momento"
            icone="📍"
            cor="purple"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <PassageirosChart />
        <OcupacaoChart />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-gray-700 mb-4">⚠️ Alertas Ativos</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="pb-2">Linha</th>
              <th className="pb-2">Tipo</th>
              <th className="pb-2">Descrição</th>
              <th className="pb-2">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            <tr className="hover:bg-gray-50">
              <td className="py-3 font-medium">L3</td>
              <td className="py-3">Lotação</td>
              <td className="py-3 text-gray-500">Ocupação acima de 90%</td>
              <td className="py-3"><span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-medium">Crítico</span></td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-3 font-medium">L8</td>
              <td className="py-3">Lotação</td>
              <td className="py-3 text-gray-500">Ocupação acima de 85%</td>
              <td className="py-3"><span className="bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full text-xs font-medium">Atenção</span></td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="py-3 font-medium">L5</td>
              <td className="py-3">Atraso</td>
              <td className="py-3 text-gray-500">Atraso de 8 min na paragem Central</td>
              <td className="py-3"><span className="bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full text-xs font-medium">Atenção</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
