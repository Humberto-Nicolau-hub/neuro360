import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const BACKEND_URL = "https://neuro360-tkyx.onrender.com";

function App() {
  const [user, setUser] = useState(null);
  const [texto, setTexto] = useState("");
  const [emocao, setEmocao] = useState("Neutro");
  const [resposta, setResposta] = useState("");
  const [historico, setHistorico] = useState([]);

  useEffect(() => {
    carregarUsuario();
  }, []);

  async function carregarUsuario() {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user || null);
    carregarEvolucao();
  }

  async function carregarEvolucao() {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;

    const res = await fetch(`${BACKEND_URL}/evolucao`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json();
    setHistorico(json);
  }

  function calcularScore(e) {
    return {
      "Muito mal": -2,
      Mal: -1,
      Neutro: 0,
      Bem: 1,
      "Muito bem": 2,
    }[e];
  }

  async function enviarTexto() {
    const { data } = await supabase.auth.getSession();
    const token = data.session.access_token;

    const score = calcularScore(emocao);

    const res = await fetch(`${BACKEND_URL}/ia`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ texto, emocao, score }),
    });

    const json = await res.json();
    setResposta(json.resposta);
    setTexto("");

    carregarEvolucao();
  }

  function trilha(emocao) {
    if (emocao === "Muito mal" || emocao === "Mal") {
      return "Respiração + Escrita emocional";
    }
    if (emocao === "Neutro") {
      return "Clareza mental";
    }
    return "Expansão e foco";
  }

  function pagar() {
    window.location.href = "https://SEU-LINK-STRIPE";
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🧠 NeuroMapa360</h1>

      {!user ? (
        <button onClick={() => supabase.auth.signInWithOtp({ email: prompt("Email") })}>
          Entrar
        </button>
      ) : (
        <>
          <p>{user.email}</p>

          <select onChange={(e) => setEmocao(e.target.value)}>
            <option>Muito mal</option>
            <option>Mal</option>
            <option>Neutro</option>
            <option>Bem</option>
            <option>Muito bem</option>
          </select>

          <br /><br />

          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Como você está?"
          />

          <button onClick={enviarTexto}>Falar com IA</button>

          <button onClick={pagar}>💎 Premium</button>

          <h3>Resposta</h3>
          <p>{resposta}</p>

          <h3>Evolução</h3>
          {historico.map((h, i) => (
            <p key={i}>{h.score}</p>
          ))}

          <h3>Trilha sugerida</h3>
          <p>{trilha(emocao)}</p>
        </>
      )}
    </div>
  );
}

export default App;
