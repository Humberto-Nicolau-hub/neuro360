import { LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

export default function EvolucaoChart({ data }) {
  return (
    <LineChart width={350} height={200} data={data}>
      <XAxis dataKey="data" />
      <YAxis domain={[1, 5]} />
      <Tooltip />
      <Line type="monotone" dataKey="valor" stroke="#22c55e" />
    </LineChart>
  );
}
