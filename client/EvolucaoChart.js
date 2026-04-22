import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function EvolucaoChart({ data = [] }) {
  const safeData = Array.isArray(data) ? data : [];

  return (
    <div style={{ width: "100%", height: 250 }}>
      <ResponsiveContainer>
        <LineChart data={safeData}>
          <XAxis dataKey="data" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="valor"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
