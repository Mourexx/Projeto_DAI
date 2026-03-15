import { useState, useEffect } from 'react'
import { statsApi } from '../services/api'
import KPICard from '../components/dashboard/KPICard'
import PassageirosChart from '../components/dashboard/PassageirosChart'
import OcupacaoChart from '../components/dashboard/OcupacaoChart'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  const agora = new Date().toLocaleString('pt-PT', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  useEffect(() => {
    Promise.all([
      statsApi.getOverview(),
      statsApi.getOccupancy(),
    ])
      .then(([overRes, occRes]) => {
        setStats(overRes.data)
        // Gerar alertas dinâmicos com base na ocupação real
        const alertas = occRes.data
          .filter(t => t.occupancy_pct >= 75)
          .map(t => ({
            linha: t.line,
            tipo: 'Lotação',
            descricao: `Ocupação de ${t.occupancy_pct}% no veículo ${t.name}`,
            estado: t.occupancy_pct >= 90 ? 'critical' : 'warning',
          }))
        setAlerts(alertas)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const badgeCls = (estado) =>
    estado === 'critical'
      ? 'bg-red-100 text-red-600'
      : 'bg-yellow-100 text-yellow-600'

  const badgeLabel = (estado) =>
    estado === 'critical' ? 'Crítico' : 'Atenção'

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

      {/* Alertas dinâmicos baseados na API */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-gray-700 mb-4">⚠️ Alertas Ativos</h3>
        {alerts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            ✅ Nenhum alerta ativo — operação normal
          </p>
        ) : (
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
              {alerts.map((a, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-3 font-medium">{a.linha}</td>
                  <td className="py-3">{a.tipo}</td>
                  <td className="py-3 text-gray-500">{a.descricao}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeCls(a.estado)}`}>
                      {badgeLabel(a.estado)}
                    </span>
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
