export default function KPICard({ titulo, valor, subtitulo, icone, variacao, cor = "blue" }) {
  const cores = {
    blue:   { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700",   icon: "bg-blue-100" },
    green:  { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700",  icon: "bg-green-100" },
    yellow: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", icon: "bg-yellow-100" },
    purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", icon: "bg-purple-100" },
  };
  const c = cores[cor] || cores.blue;
  const isPositivo = variacao >= 0;
  return (
    <div className={`rounded-2xl border ${c.bg} ${c.border} p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{titulo}</span>
        <span className={`text-2xl p-2 rounded-xl ${c.icon}`}>{icone}</span>
      </div>
      <div>
        <p className={`text-3xl font-bold ${c.text}`}>{valor}</p>
        {subtitulo && <p className="text-xs text-gray-400 mt-1">{subtitulo}</p>}
      </div>
      {variacao !== undefined && (
        <div className={`text-xs font-semibold ${isPositivo ? "text-green-600" : "text-red-500"}`}>
          {isPositivo ? "▲" : "▼"} {Math.abs(variacao)}% vs ontem
        </div>
      )}
    </div>
  );
}