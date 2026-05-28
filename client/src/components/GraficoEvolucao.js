import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

export default function GraficoEvolucao({ dados }) {

  return (
    <div
      style={{
background:"#10172f",
borderRadius:16,
padding:"8px 12px",
marginTop:8,
height:"95px",
overflow:"hidden"
}}
    >
      <h3 style={{
        marginBottom:"10px",
        fontSize:"16px"
      }}>
        Evolução emocional
      </h3>

      <ResponsiveContainer width="100%" height={55}>
        <LineChart data={dados || []}>
          
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