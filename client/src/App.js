import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function App() {
  const [dados, setDados] = useState([]);
  const [grafico, setGrafico] = useState([]);

  async function salvarDados() {
    await supabase.from("feedbacks").insert([
      {
        usuario: "Humberto",
        trilha: "Ansiedade",
        eficaz: true,
        comentario: "Teste funcionando"
      }
    ]);

    buscarDados();
  }

  async function buscarDados() {
    const { data } = await supabase.from("feedbacks").select("*");
    setDados(data);

    // Agrupar dados para gráfico
    const agrupado = {};
    data.forEach(item => {
      if (!agrupado[item.trilha]) {
        agrupado[item.trilha] = 0;
      }
      agrupado[item.trilha]++;
    });

    const formatado = Object.keys(agrupado).map(key => ({
      trilha: key,
      total: agrupado[key]
    }));

    setGrafico(formatado);
  }

  useEffect(() => {
    buscarDados();
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>🚀 NeuroMapa360</h1>

      <button onClick={salvarDados}>
        Salvar novo feedback
      </button>

      <h2>📊 Gráfico de Trilhas</h2>

      <BarChart width={300} height={300} data={grafico}>
        <XAxis dataKey="trilha" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="total" />
      </BarChart>

      <h2>📋 Feedbacks:</h2>

      {dados.map((item, index) => (
        <p key={index}>
          {item.usuario} - {item.trilha}
        </p>
      ))}
    </div>
  );
}
