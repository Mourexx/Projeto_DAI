import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const dados = [
  { hora: "06h", passageiros: 320 },
  { hora: "07h", passageiros: 890 },
  { hora: "08h", passageiros: 1420 },
  { hora: "09h", passageiros: 980 },
  { hora: "10h", passageiros: 640 },
  { hora: "11h", passageiros: 580 },
  { hora: "12h", passageiros: 760 },
  { hora: "13h", passageiros: 820 },
  { hora: "14h", passageiros: 610 },
  { hora: "15h", passageiros: 570 },
  { hora: "16h", passageiros: 730 },
  { hora: "17h", passageiros: 1350 },
  { hora: "18h", passageiros: 1580 },
  { hora: "19h", passageiros: 1100 },
  { hora: "20h", passageiros: 640 },
  { hora: "21h", passageiros: 380 },
];

export default function PassageirosChart() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-700 mb-4">Passageiros por Hora</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={dados}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="hora" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb" }}
            formatter={(v) => [`${v} passageiros`, ""]}
          />
          <Legend />
          <Line type="monotone" dataKey="passageiros" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} name="Passageiros" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}