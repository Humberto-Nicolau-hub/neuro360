import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

export default function GraficoEvolucao({
  historico
}) {

  const dados = historico
    .slice(-7)
    .map((item,index)=>({

      dia:`${index+1}`,
      hawkins:item.hawkins || 0

    }));


  return (

    <div
      style={{
        background:"#10172f",
        borderRadius:20,
        padding:20,
        marginTop:20
      }}
    >

      <h3
        style={{
          marginBottom:20
        }}
      >
        Evolução emocional
      </h3>

      <ResponsiveContainer
        width="100%"
        height={250}
      >

        <LineChart data={dados}>

          <XAxis dataKey="dia"/>

          <YAxis/>

          <Tooltip/>

          <Line
            type="monotone"
            dataKey="hawkins"
            stroke="#43f0ff"
            strokeWidth={3}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>

  );

}