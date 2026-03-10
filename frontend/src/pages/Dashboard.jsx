import KPICard from "../components/dashboard/KPICard";
import PassageirosChart from "../components/dashboard/PassageirosChart";
import OcupacaoChart from "../components/dashboard/OcupacaoChart";

export default function Dashboard() {
  const agora = new Date().toLocaleString("pt-PT", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard — TUB</h1>
        <p className="text-sm text-gray-400 mt-1 capitalize">{agora}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard titulo="Passageiros Hoje" valor="12.430" subtitulo="Acumulado do dia" icone="👥" cor="blue" variacao={4.2} />
        <KPICard titulo="Autocarros Ativos" valor="34" subtitulo="de 38 no total" icone="🚌" cor="green" variacao={0} />
        <KPICard titulo="Linhas Operacionais" valor="18 / 20" subtitulo="2 com perturbações" icone="🛣️" cor="yellow" variacao={-5.0} />
        <KPICard titulo="Ocupação Média" valor="67%" subtitulo="Todas as linhas" icone="📊" cor="purple" variacao={2.1} />
      </div>

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
  );
}