import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const BACKEND_URL = "https://neuro360-tkyx.onrender.com";

function App() {
  const [user, setUser] = useState(null);
  const [texto, setTexto] = useState("");
  const [resposta, setResposta] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarUsuario();
  }, []);

  async function carregarUsuario() {
    try {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    } catch (err) {
      console.error("Erro ao carregar usuário:", err);
    }
  }

  async function enviarTexto() {
    if (!texto.trim()) {
      setResposta("⚠️ Digite algo antes de enviar");
      return;
    }

    try {
      setLoading(true);

      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;

      if (!token) {
        setResposta("⚠️ Usuário não autenticado");
        return;
      }

      const res = await fetch(`${BACKEND_URL}/ia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ texto }),
      });

      if (!res.ok) {
        const erro = await res.text();
        console.error("Erro backend:", erro);
        setResposta("❌ Erro no servidor");
        return;
      }

      const json = await res.json();

      console.log("RESPOSTA:", json);

      setResposta(json?.resposta || "⚠️ Sem resposta da IA");

      setTexto("");

    } catch (err) {
      console.error("ERRO:", err);
      setResposta("❌ Erro ao conectar com IA");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🧠 NeuroMapa360</h1>

      {!user ? (
        <button onClick={carregarUsuario}>Entrar</button>
      ) : (
        <>
          <p>{user.email}</p>

          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Digite como você está se sentindo..."
            style={{ width: "300px", padding: "8px" }}
          />

          <br /><br />

          <button onClick={enviarTexto} disabled={loading}>
            {loading ? "Processando..." : "Falar com IA"}
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
