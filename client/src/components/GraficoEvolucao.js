import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

export default function GraficoEvolucao() {

  // Dados fixos somente para teste
  const dados = [
    { dia: "1", hawkins: 100 },
    { dia: "2", hawkins: 180 },
    { dia: "3", hawkins: 250 },
    { dia: "4", hawkins: 320 },
    { dia: "5", hawkins: 400 },
    { dia: "6", hawkins: 480 },
    { dia: "7", hawkins: 540 }
  ];

  return (
    <div
      style={{
background:"#10172f",
borderRadius:16,
padding:"8px 12px",
marginTop:8,
height:"120px",
overflow:"hidden"
}}
    >
      <h3 style={{
        marginBottom:"10px",
        fontSize:"16px"
      }}>
        Evolução emocional
      </h3>

      <ResponsiveContainer width="100%" height={70}>
        <LineChart data={dados}>
          
          <CartesianGrid stroke="#1c2749" />

          <XAxis
            dataKey="dia"
            stroke="#ffffff"
          />

          <YAxis
            stroke="#ffffff"
          />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="hawkins"
            stroke="#43f0ff"
            strokeWidth={3}
            dot={{ r:5 }}
          />

        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}