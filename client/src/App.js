import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const BACKEND_URL = "https://neuro360-tkyx.onrender.com";

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [texto, setTexto] = useState("");
  const [emocao, setEmocao] = useState("Ansioso");
  const [resposta, setResposta] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    verificarUsuario();
  }, []);

  async function verificarUsuario() {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user || null);
  }

  async function entrar() {
    if (!email) {
      alert("Digite um email");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email,
    });

    if (error) {
      console.error(error);
      alert("Erro ao enviar email");
    } else {
      alert("Verifique seu email 📩");
    }
  }

  async function sair() {
    await supabase.auth.signOut();
    setUser(null);
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

      const res = await fetch(`${BACKEND_URL}/ia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          texto,
          emocao,
        }),
      });

      const json = await res.json();
      setResposta(json?.resposta || "⚠️ Sem resposta");
      setTexto("");

    } catch (err) {
      console.error(err);
      setResposta("❌ Erro ao conectar IA");
    } finally {
      setLoading(false);
    }
  }

  function irParaPagamento() {
    window.location.href = "SEU_LINK_STRIPE_AQUI";
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🧠 NeuroMapa360</h1>

      {!user ? (
        <>
          <input
            placeholder="Digite seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <br /><br />

          <button onClick={entrar}>Entrar / Cadastrar</button>
        </>
      ) : (
        <>
          <p>{user.email}</p>

          <button onClick={sair}>Sair</button>

          <br /><br />

          <h3>Como você está se sentindo?</h3>

          <select value={emocao} onChange={(e) => setEmocao(e.target.value)}>
            <option>Ansioso</option>
            <option>Triste</option>
            <option>Desmotivado</option>
            <option>Cansado</option>
            <option>Feliz</option>
            <option>Confuso</option>
          </select>

          <br /><br />

          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Descreva como você está..."
            style={{ width: "300px", padding: "8px" }}
          />

          <br /><br />

          <button onClick={enviarTexto} disabled={loading}>
            {loading ? "Processando..." : "Falar com IA"}
          </button>

          <br /><br />

          <button onClick={irParaPagamento}>
            💎 Tornar Premium
          </button>

          <br /><br />

          <h3>Resposta:</h3>
          <p>{resposta}</p>
        </>
      )}
    </div>
  );
}

export default App;
