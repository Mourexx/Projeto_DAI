import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";

const dados = [
  { linha: "L1", ocupacao: 82 },
  { linha: "L2", ocupacao: 55 },
  { linha: "L3", ocupacao: 91 },
  { linha: "L4", ocupacao: 43 },
  { linha: "L5", ocupacao: 78 },
  { linha: "L6", ocupacao: 67 },
  { linha: "L7", ocupacao: 35 },
  { linha: "L8", ocupacao: 88 },
];

const getCor = (v) => {
  if (v >= 85) return "#ef4444";
  if (v >= 65) return "#f59e0b";
  return "#22c55e";
};

export default function OcupacaoChart() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-700">Ocupação por Linha (%)</h3>
        <div className="flex gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>Normal</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span>Cheio</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>Lotado</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={dados} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="linha" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
          <Tooltip
            contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb" }}
            formatter={(v) => [`${v}%`, "Ocupação"]}
          />
          <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "85%", fontSize: 11, fill: "#ef4444" }} />
          <Bar dataKey="ocupacao" radius={[6, 6, 0, 0]}>
            {dados.map((entry, i) => (
              <Cell key={i} fill={getCor(entry.ocupacao)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}