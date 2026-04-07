import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const BACKEND_URL = "https://neuro360-tkyx.onrender.com";

function App() {
  const [user, setUser] = useState(null);
  const [texto, setTexto] = useState("");
  const [emocao, setEmocao] = useState("Neutro");
  const [resposta, setResposta] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarUsuario();
  }, []);

  async function carregarUsuario() {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user || null);
  }

  async function login() {
    const email = prompt("Digite seu email:");
    const senha = prompt("Digite sua senha:");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      alert("Erro ao logar");
    } else {
      carregarUsuario();
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  function calcularScore(emocao) {
    switch (emocao) {
      case "Muito mal":
        return -2;
      case "Mal":
        return -1;
      case "Neutro":
        return 0;
      case "Bem":
        return 1;
      case "Muito bem":
        return 2;
      default:
        return 0;
    }
  }

  async function enviarTexto() {
    if (!texto.trim()) {
      setResposta("⚠️ Digite algo");
      return;
    }

    try {
      setLoading(true);

      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;

      const score = calcularScore(emocao);

      const res = await fetch(`${BACKEND_URL}/ia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          texto,
          emocao,
          score,
        }),
      });

      const json = await res.json();

      setResposta(json?.resposta || "Sem resposta");
      setTexto("");

    } catch (err) {
      console.error(err);
      setResposta("Erro ao conectar IA");
    } finally {
      setLoading(false);
    }
  }

  function irParaPagamento() {
    window.location.href = "https://SEU-LINK-STRIPE-AQUI";
  }

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
      <h1>🧠 NeuroMapa360</h1>

      {!user ? (
        <button onClick={login}>Entrar</button>
      ) : (
        <>
          <p><strong>{user.email}</strong></p>
          <button onClick={logout}>Sair</button>

          <hr />

          <h3>Como você está se sentindo?</h3>

          <select
            value={emocao}
            onChange={(e) => setEmocao(e.target.value)}
          >
            <option>Muito mal</option>
            <option>Mal</option>
            <option>Neutro</option>
            <option>Bem</option>
            <option>Muito bem</option>
          </select>

          <br /><br />

          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Descreva como você está se sentindo..."
            style={{ width: "100%", height: 100 }}
          />

          <br /><br />

          <button onClick={enviarTexto} disabled={loading}>
            {loading ? "Processando..." : "Falar com IA"}
          </button>

          <br /><br />

          <button onClick={irParaPagamento}>
            💎 Tornar Premium
          </button>

          <hr />

          <h3>Resposta da IA</h3>
          <p style={{ whiteSpace: "pre-line" }}>
            {resposta || "Sem resposta ainda"}
          </p>
        </>
      )}
    </div>
  );
}

export default App;
