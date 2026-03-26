import React from "react";
import { supabase } from "./supabase";

export default function App() {

  async function salvarDados() {
    const { data, error } = await supabase
      .from("feedbacks")
      .insert([
        {
          usuario: "Humberto",
          trilha: "Ansiedade",
          eficaz: true,
          comentario: "Teste funcionando"
        }
      ]);

    if (error) {
      alert("Erro ao salvar!");
      console.log(error);
    } else {
      alert("Salvo com sucesso!");
      console.log(data);
    }
  }

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>🚀 NeuroMapa360</h1>

      <button onClick={salvarDados}>
        Testar conexão com banco
      </button>
    </div>
  );
}
