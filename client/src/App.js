import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const BACKEND_URL = "https://neuro360-tkyx.onrender.com";

function App() {
  const [user, setUser] = useState(null);
  const [texto, setTexto] = useState("");
  const [emocao, setEmocao] = useState("ansioso");
  const [resposta, setResposta] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarUsuario();
  }, []);

  async function carregarUsuario() {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user || null);
  }

  async function enviarTexto() {
    if (!texto.trim()) return;

    setLoading(true);

    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;

    const res = await fetch(`${BACKEND_URL}/ia`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ texto, emocao }),
    });

    const json = await res.json();

    setResposta(json.resposta || "Sem resposta");
    setTexto("");
    setLoading(false);
  }

  function pagar() {
    window.location.href = "https://buy.stripe.com/SEU_LINK_REAL";
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🧠 NeuroMapa360</h1>

      {!user ? (
        <button onClick={carregarUsuario}>Entrar</button>
      ) : (
        <>
          <p>{user.email}</p>

          <select value={emocao} onChange={(e) => setEmocao(e.target.value)}>
            <option value="ansioso">Ansioso</option>
            <option value="triste">Triste</option>
            <option value="desmotivado">Desmotivado</option>
            <option value="cansado">Cansado</option>
            <option value="produtivo">Produtivo</option>
          </select>

          <br /><br />

          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Descreva como você está..."
          />

          <br /><br />

          <button onClick={enviarTexto}>
            {loading ? "Processando..." : "Falar com IA"}
          </button>

          <br /><br />

          <button onClick={pagar}>
            💎 Tornar Premium
          </button>

          <br /><br />

          <p><strong>Resposta:</strong></p>
          <p>{resposta}</p>
        </>
      )}
    </div>
  );
}

export default App;
