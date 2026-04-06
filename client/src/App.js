import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const BACKEND_URL = "https://neuro360-tkyx.onrender.com";

function App() {
  const [user, setUser] = useState(null);
  const [texto, setTexto] = useState("");
  const [resposta, setResposta] = useState("");

  useEffect(() => {
    carregarUsuario();
  }, []);

  async function carregarUsuario() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  }

  async function enviarTexto() {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      const res = await fetch(`${BACKEND_URL}/ia`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ texto }),
      });

      const json = await res.json();

      setResposta(json.resposta || "Sem resposta");

    } catch (err) {
      console.error(err);
      setResposta("Erro ao conectar");
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>NeuroMapa360</h1>

      {!user ? (
        <button onClick={carregarUsuario}>Entrar</button>
      ) : (
        <>
          <p>{user.email}</p>

          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />

          <button onClick={enviarTexto}>Falar com IA</button>

          <p>{resposta}</p>
        </>
      )}
    </div>
  );
}

export default App;
