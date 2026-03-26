import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function App() {
  const [dados, setDados] = useState([]);

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

      <h2>📊 Feedbacks:</h2>

      {dados.map((item, index) => (
        <div key={index}>
          <p>
            {item.usuario} - {item.trilha} - {item.comentario}
          </p>
        </div>
      ))}
    </div>
  );
}
